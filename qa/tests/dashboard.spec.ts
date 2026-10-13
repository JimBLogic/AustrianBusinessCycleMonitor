import { test, expect, type Page } from '@playwright/test';
import { verifyProduction } from '../../sites-current/lib/production-verification.mjs';

const chartKeys=['m2','treasury2y','treasury10y','federalDebt','cpi','oil','gold','sp500','vix','industrialProduction','manufacturingSurvey','bitcoin'];
const macroKeys=['m2','fedFunds','yieldCurve','creditSpread','cpi','unemployment','federalDebt','dollar','oil','manufacturingSurvey'];

async function openDashboard(page:Page, lang='en') {
  const response=await page.goto(`/?lang=${lang}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('.score-ring strong')).toHaveText(/^\d{1,3}$/);
  await expect(page.locator('#snapshot-status > div > strong')).toHaveText(/\d.*Madrid/);
  await expect(page.locator('.background-refresh')).toHaveCount(0, {timeout:110_000});
}

for (const lang of ['en','es']) test(`${lang}: real data, all charts, layout and navigation`,async({page,isMobile},testInfo)=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  const failedResponses:string[]=[];
  page.on('response',response=>{if(new URL(response.url()).origin===new URL(testInfo.project.use.baseURL!).origin && response.status()>=500) failedResponses.push(`${response.status()} ${new URL(response.url()).pathname}`);});
  await openDashboard(page,lang);
  for (const key of macroKeys) {
    await expect(page.locator(`#metric-tab-${key}`)).toHaveClass(/has-data/);
    await expect(page.locator(`#metric-tab-${key} .metric-reading strong`)).toHaveText(/\d/);
  }
  await expect(page.locator('.market-tape>a')).toHaveCount(6);
  for(const card of await page.locator('.market-tape>a').all()) {
    await expect(card.locator('strong')).toHaveText(/\d/);
    await expect(card.locator('time')).toHaveAttribute('datetime',/^20\d{2}-\d{2}-\d{2}/);
  }
  for (const key of chartKeys) {
    if(isMobile) await page.locator(`#series-tab-${key}`).tap();
    else await page.locator(`#series-tab-${key}`).click();
    await expect(page.locator(`#series-tab-${key}`)).toHaveAttribute('aria-selected','true');
    await expect(page.locator('#macro-chart-summary')).toHaveText(/\d+ (observations|observaciones)/);
    await expect(page.locator('#macro-chart-panel .chart-readout strong')).toHaveText(/\d/);
    await expect(page.locator('#macro-chart-panel time').first()).toHaveAttribute('datetime',/^20\d{2}-/);
    const lines=page.locator('#macro-chart-panel svg polyline');
    await expect(lines).not.toHaveCount(0);
    expect(await lines.evaluateAll(nodes=>nodes.every(node=>{
      const points=node.getAttribute('points')?.trim();
      return !!points && points.split(/\s+/).every(point=>point.split(',').length===2 && point.split(',').every(value=>value!==''&&Number.isFinite(Number(value))));
    })),`${key}: finite plotted coordinates`).toBe(true);
  }
  await page.locator('#macro-chart-panel svg').focus();
  await page.keyboard.press('Home');
  const firstDate=await page.locator('#macro-chart-panel time').first().getAttribute('datetime');
  await page.keyboard.press('End');
  expect(await page.locator('#macro-chart-panel time').first().getAttribute('datetime')).not.toBe(firstDate);
  if(isMobile) {
    await page.locator('.brand').click();
    const menu=page.locator('.nav .menu');
    await expect(menu).toBeVisible();
    await menu.tap();
    await expect(menu).toHaveAttribute('aria-expanded','true');
    await page.locator('#primary-navigation a[href="#dashboard"]').tap();
    await expect(menu).toHaveAttribute('aria-expanded','false');
    await expect(page.locator('#dashboard')).toBeInViewport();
  }
  await page.locator('.nav .lang').click();
  await expect(page.locator('.nav .lang')).toHaveText(lang==='en'?'EN':'ES');
  await expect(page.locator('#market-tape-title')).toHaveText(lang==='en'?'Última observación verificada':'Latest verified observation');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'horizontal overflow').toBe(true);
  await page.locator('.brand').click();
  await page.screenshot({path:testInfo.outputPath(`${lang}-viewport.png`)});
  await page.screenshot({path:testInfo.outputPath(`${lang}-dashboard.png`),fullPage:true});
  expect(errors).toEqual([]);
  expect(failedResponses).toEqual([]);
});

test('real API edition is durable across reads and browser reload',async({page,request},testInfo)=>{
  const dataResponse=await request.get('/api/data');expect(dataResponse.ok()).toBe(true);
  const data=await dataResponse.json();
  const healthResponse=await request.get('/api/health');expect(healthResponse.ok()).toBe(true);
  const health=await healthResponse.json();
  verifyProduction(data,health);
  if(process.env.ABCM_EXPECT_RELEASE) expect(data.siteRelease).toBe(Number(process.env.ABCM_EXPECT_RELEASE));
  await testInfo.attach('health.json',{body:JSON.stringify(health,null,2),contentType:'application/json'});
  await openDashboard(page);
  await page.reload();
  await expect(page.locator('.score-ring strong')).toHaveText(/^\d{1,3}$/);
  const again=await(await request.get('/api/data')).json();
  expect(again.requestedAt).toBe(data.requestedAt);
  for(const path of ['/api/data-manifest','/api/source-health','/api/bitcoin','/learn?lang=en','/learn?lang=es','/learn/austrian-economics?lang=es','/learn/bitcoin-sovereignty?lang=en','/privacidad','/aviso-legal','/robots.txt','/sitemap.xml']) {
    expect((await request.get(path)).status(),path).toBe(200);
  }
});

// Failure injection is limited to this browser's request interception. It does
// not touch providers, snapshots or responses served to production visitors.
test('failed refresh retains visible data and allows retry',async({page})=>{
  await openDashboard(page);
  const score=await page.locator('.score-ring strong').textContent();
  await page.route('**/api/data',route=>route.request().method()==='POST'?route.fulfill({status:503,body:'Provider unavailable'}):route.continue());
  await page.locator('.hero .secondary').click();
  await expect(page.locator('.refresh-notice.error')).toContainText('Keeping the last valid snapshot');
  await expect(page.locator('.score-ring strong')).toHaveText(score!);
  await expect(page.locator('#metric-tab-m2')).toHaveClass(/has-data/);
  await expect(page.locator('.hero .secondary')).toBeEnabled();
});

test('manual refresh, persisted edition and cooldown survive reload',async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-chromium','one refresh avoids provider storms across device profiles');
  test.setTimeout(180_000);
  await openDashboard(page);
  const responsePromise=page.waitForResponse(response=>response.url().endsWith('/api/data')&&response.request().method()==='POST',{timeout:120_000});
  await page.locator('.hero .secondary').click();
  const response=await responsePromise;expect(response.ok()).toBe(true);
  const data=await response.json();
  const health=await(await request.get('/api/health')).json();
  verifyProduction(data,health,{refresh:true});
  await expect(page.locator('.refresh-notice')).toContainText('Snapshot synchronized');
  await expect(page.locator('.score-ring strong')).toHaveText(/^\d{1,3}$/);
  await expect(page.locator('.hero .secondary')).toBeDisabled();
  await page.reload();
  await expect(page.locator('.hero .secondary')).toBeDisabled();
  await expect(page.locator('#metric-tab-m2')).toHaveClass(/has-data/);
  const repeated=await(await request.post('/api/data',{timeout:120_000})).json();
  expect(repeated.requestedAt).toBe(data.requestedAt);
  expect(repeated.refreshMode).toBe('manual-cooldown');
  await testInfo.attach('refresh-proof.json',{body:JSON.stringify({checkedAt:new Date().toISOString(),snapshot:data.requestedAt,coverage:data.provenance.modelInputsAvailable,cooldown:repeated.refreshMode}),contentType:'application/json'});
});
