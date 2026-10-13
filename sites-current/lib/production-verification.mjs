import assert from 'node:assert/strict';
import { validTimestamp } from './timestamp.mjs';

export const REQUIRED_MACRO = ['m2','cpi','fedFunds','treasury10y','treasury2y','creditSpread','oil','gold','sp500','vix','dollar','federalDebt','industrialProduction','capacityUtilization','unemployment'];

export function verifyProduction(data, health, {now=Date.now(), refresh=false, expectedRelease}={}) {
  const stamp=validTimestamp(data?.requestedAt)?.getTime();
  assert.ok(Number.isFinite(stamp) && stamp<=now+60_000,'invalid/future edition timestamp');
  if (refresh) assert.ok(now-stamp<=15*60_000,'refresh did not generate or recover a current edition');
  assert.ok(Number.isInteger(data?.siteRelease) && data.siteRelease>0,'missing release identity');
  if (expectedRelease!=null) assert.equal(data.siteRelease,expectedRelease,'wrong public release');
  for (const key of REQUIRED_MACRO) assert.ok(data.series?.[key]?.some(p=>typeof p.value==='number' && Number.isFinite(p.value)),`${key} has no validated observations`);
  assert.ok(typeof data.bitcoin?.price==='number' && Number.isFinite(data.bitcoin.price) && data.bitcoin.price>0,'Bitcoin unavailable');
  assert.ok(Number.isFinite(data.provenance?.modelInputsAvailable) && data.provenance.modelInputsAvailable>=10,'insufficient model coverage');
  assert.equal(health?.service,'austrian-business-cycle-monitor','wrong health service');
  assert.equal(health.siteRelease,data.siteRelease,'API release mismatch');
  assert.equal(health.persistence?.status,'ready','database unavailable');
  assert.equal(health.persistence?.snapshotReadable,true,'durable snapshot unreadable');
  assert.equal(health.data?.snapshot_at,data.requestedAt,'public response was not the durable edition');
  assert.ok(['HEALTHY','DEGRADED','STALE'].includes(health.status),'data unavailable');
  for (const key of [...REQUIRED_MACRO,'bitcoin']) {
    const row=health.data?.indicators?.find(i=>i.indicator===key);
    assert.ok(row && Number.isFinite(row.last_valid_value),`${key} health has no validated value`);
    assert.ok(['HEALTHY','DEGRADED','STALE'].includes(row.status),`${key} status missing`);
    for (const field of ['source','last_attempt','last_success','observation_date','freshness','failure_reason','fallback']) assert.ok(Object.hasOwn(row,field),`${key} health missing ${field}`);
  }
  return true;
}
