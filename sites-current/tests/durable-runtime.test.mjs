import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { SOURCE_POLICY_VERSION } from '../lib/snapshot-policy.mjs';

test('actual built Worker and D1 preserve snapshots across corrupt/partial rows and isolate cold database state', async () => {
  const root=new URL('../dist/server/',import.meta.url);
  const paths=(await readdir(root,{recursive:true})).filter(p=>p.endsWith('.js') && p!=='index.js');
  const modules=await Promise.all(['index.js',...paths].map(async path=>({type:'ESModule',path:fileURLToPath(new URL(path,root)),contents:await readFile(new URL(path,root),'utf8')})));
  const mf=new Miniflare(convertV4MiniflareOptions({
    name:'abcm-durable-test',modules,
    compatibilityDate:'2026-08-08',compatibilityFlags:['nodejs_compat'],
    d1Databases:['DB'],serviceBindings:{ASSETS:async()=>new Response('Not found',{status:404})},
    outboundService:async()=>{throw new Error('No live provider access in this isolated fixture');},
  }));
  try {
    const db=await mf.getD1Database('DB');
    let health=await mf.dispatchFetch('http://localhost/api/health');
    assert.equal(health.status,503,await health.clone().text());
    assert.equal((await health.json()).persistence.status,'unavailable');
    const schema=await readFile(new URL('../migrations/selfhost/0001_macro_snapshots.sql',import.meta.url),'utf8');
    const migrate=async()=>{for(const sql of schema.split(';').filter(s=>s.trim())) await db.prepare(sql).run();};
    await migrate();
    health=await mf.dispatchFetch('http://localhost/api/health');
    assert.equal(health.status,503,'a ready but empty database is not fabricated data');
    assert.equal((await health.json()).persistence.status,'ready','failed initialization must retry after migrations');
    const tableCount=(await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table'").first()).n;
    const now=new Date().toISOString(), day=now.slice(0,10);
    const insert=async(id,at,metrics,provenance={sourcePolicyVersion:SOURCE_POLICY_VERSION})=>db.prepare(`INSERT INTO macro_snapshots
      (id,requested_at,refresh_mode,regime,scores_json,metrics_json,provenance_json,created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(id,at,'daily-edition','mixed-transition','{}',JSON.stringify(metrics),JSON.stringify(provenance),now).run();
    const bitcoin={price:80000,priceObservedAt:now,priceConsensus:'confirmed',priceSources:['coinbase','kraken']};
    await insert('good',now,{series:{m2:[{date:day,value:23000}]},bitcoin,freshness:[]});
    await migrate();
    assert.equal((await db.prepare('SELECT count(*) AS n FROM macro_snapshots').first()).n,1,'idempotent adoption retains existing data');
    await insert('future','2099-01-01T00:00:00Z',{series:{m2:[{date:day,value:999}]},bitcoin});
    await insert('partial',new Date(Date.now()+500).toISOString(),{series:{cpi:[{date:day,value:330}]},bitcoin:{price:null},freshness:[]});
    const response=await mf.dispatchFetch('http://localhost/api/data');
    assert.equal(response.status,200);
    const payload=await response.json();
    const expectedRelease=Number((await readFile(new URL('../app/version.ts',import.meta.url),'utf8')).match(/SITE_RELEASE = (\d+)/)[1]);
    assert.equal(payload.siteRelease,expectedRelease);
    const packageInfo=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
    assert.equal(payload.appVersion,packageInfo.version);
    assert.equal(payload.latest.m2.value,23000);
    assert.equal(payload.latest.cpi.value,330);
    assert.equal(payload.bitcoin.price,80000);
    assert.equal(payload.bitcoin.priceConsensus,'stale');
    assert.equal(payload.health.indicators.find(i=>i.indicator==='bitcoin').status,'STALE');
    assert.equal(payload.derived.scores.composite ?? null,null);
    assert.notEqual(payload.requestedAt,'2099-01-01T00:00:00Z');
    const repeated=await(await mf.dispatchFetch('http://localhost/api/data',{method:'POST'})).json();
    assert.equal(repeated.requestedAt,payload.requestedAt,'cooldown retains the durable edition');
    assert.equal(repeated.refreshMode,'manual-cooldown');
    health=await mf.dispatchFetch('http://localhost/api/health');
    assert.equal(health.status,200);
    assert.equal((await health.json()).persistence.snapshotReadable,true);
    assert.equal((await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table'").first()).n,tableCount,'public reads do not mutate schema');
    const sourceHealth=await mf.dispatchFetch('http://localhost/api/source-health');
    assert.equal(sourceHealth.status,200);
    assert.ok(Array.isArray((await sourceHealth.json()).candidates));
    const pulse=await mf.dispatchFetch('http://localhost/api/bitcoin');
    assert.equal(pulse.status,200);
    const retained=await pulse.json();
    assert.equal(retained.price,bitcoin.price);
    assert.equal(retained.priceObservedAt,bitcoin.priceObservedAt);
    assert.equal(retained.status,'STALE','provider outage retains independent BTC transparently');
  } finally {await mf.dispose();}
});
