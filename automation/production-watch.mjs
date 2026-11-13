import { verifyProduction } from '../sites-current/lib/production-verification.mjs';
import assert from 'node:assert/strict';
import { appendFile } from 'node:fs/promises';
import { assessEconomicHealth, economicHealthSummary } from './production-health-report.mjs';
const origin='https://austrian-business-cycle-monitor.jimblogic.chatgpt.site';
// Update after verifying a Sites deployment. The GitHub mirror can lag production.
const expectedRelease=104; // Sites source 9e48b7fa73d333d22a04b852f53d65b2e56c93fa
const get=async path=>{
  const response=await fetch(`${origin}${path}`,{signal:AbortSignal.timeout(120000),cache:'no-store'});
  assert.ok(response.ok,`${path} HTTP ${response.status}`);return response.json();
};
const data=await get('/api/data'),health=await get('/api/health');
verifyProduction(data,health,{expectedRelease});
const economic=assessEconomicHealth(health);
assert.ok(Date.now()-Date.parse(data.requestedAt)<36*60*60*1000,'daily snapshot is more than 36h old');
const repeated=await get('/api/data');
assert.equal(repeated.requestedAt,data.requestedAt,'edition changed during read-only verification');
console.log(JSON.stringify({
  checkedAt:new Date().toISOString(),release:data.siteRelease,snapshot:data.requestedAt,
  coverage:data.provenance.modelInputsAvailable,
  operationalGate:'PASS',economicFreshness:economic,
}));
if (economic.level !== 'PASS') {
  // An operational PASS must not silently impersonate healthy economic data.
  // GitHub surfaces this as an annotation even though verified stale records
  // are legitimate and should not trigger a false infrastructure failure.
  console.log(`::warning title=ABCM economic freshness DEGRADED::Only ${economic.fresh}/${economic.total} observations are FRESH. Macro ${economic.macro.fresh}/${economic.macro.total}; stale: ${economic.stale.join(', ') || 'none'}`);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, economicHealthSummary(economic), 'utf8');
}
