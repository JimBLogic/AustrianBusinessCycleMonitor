import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyProduction, REQUIRED_MACRO } from '../lib/production-verification.mjs';

const now=Date.parse('2026-10-12T10:00:00Z');
const fixture=()=>{
  const data={siteRelease:89,requestedAt:new Date(now).toISOString(),series:Object.fromEntries(REQUIRED_MACRO.map(key=>[key,[{date:'2026-10-09',value:10}]])),bitcoin:{price:80000},provenance:{modelInputsAvailable:12}};
  const health={siteRelease:89,service:'austrian-business-cycle-monitor',status:'DEGRADED',persistence:{status:'ready',snapshotReadable:true},data:{snapshot_at:data.requestedAt,indicators:[...REQUIRED_MACRO,'bitcoin'].map(indicator=>({indicator,last_valid_value:10,status:'STALE',source:'fixture',last_attempt:data.requestedAt,last_success:data.requestedAt,observation_date:'2026-10-09',freshness:{state:'STALE'},failure_reason:'test fixture',fallback:{active:'last-known-good'}}))}};
  return {data,health};
};
test('production gate accepts explicit stale values but requires complete source diagnostics',()=>{
  const {data,health}=fixture();
  assert.equal(verifyProduction(data,health,{now,refresh:true,expectedRelease:89}),true);
  delete health.data.indicators[0].failure_reason;
  assert.throws(()=>verifyProduction(data,health,{now}),/health missing failure_reason/);
});
test('production gate detects release mismatch and a response that did not survive persistence',()=>{
  const {data,health}=fixture();
  assert.throws(()=>verifyProduction(data,health,{now,expectedRelease:88}),/wrong public release/);
  health.data.snapshot_at='2026-10-11T10:00:00Z';
  assert.throws(()=>verifyProduction(data,health,{now}),/durable edition/);
});
test('a scheduled refresh cannot pass by returning an unchanged previous-day edition',()=>{
  const {data,health}=fixture();
  data.requestedAt=health.data.snapshot_at='2026-10-11T10:00:00Z';
  assert.equal(verifyProduction(data,health,{now}),true);
  assert.throws(()=>verifyProduction(data,health,{now,refresh:true}),/current edition/);
});
test('missing values and future timestamps fail the production gate explicitly',()=>{
  const {data,health}=fixture();
  data.series.vix=[{date:'2026-10-09',value:null}];
  assert.throws(()=>verifyProduction(data,health,{now}),/vix has no validated/);
  data.requestedAt='2099-01-01T00:00:00Z';
  assert.throws(()=>verifyProduction(data,health,{now}),/future edition/);
});
