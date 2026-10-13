import { verifyProduction } from '../sites-current/lib/production-verification.mjs';
import assert from 'node:assert/strict';
const origin='https://austrian-business-cycle-monitor.jimblogic.chatgpt.site';
const get=async path=>{
  const response=await fetch(`${origin}${path}`,{signal:AbortSignal.timeout(120000),cache:'no-store'});
  assert.ok(response.ok,`${path} HTTP ${response.status}`);return response.json();
};
const data=await get('/api/data'),health=await get('/api/health');
verifyProduction(data,health);
assert.ok(Date.now()-Date.parse(data.requestedAt)<36*60*60*1000,'daily snapshot is more than 36h old');
const repeated=await get('/api/data');
assert.equal(repeated.requestedAt,data.requestedAt,'edition changed during read-only verification');
console.log(JSON.stringify({checkedAt:new Date().toISOString(),release:data.siteRelease,snapshot:data.requestedAt,coverage:data.provenance.modelInputsAvailable,status:health.status,stale:health.data.indicators.filter(i=>i.status==='STALE').map(i=>i.indicator)}));
