import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverSnapshot} from '../lib/snapshot-recovery.mjs';
import {SOURCE_POLICY_VERSION,supportedSnapshot} from '../lib/snapshot-policy.mjs';
const row=(series,overrides={})=>({requestedAt:'2026-10-08T10:00:00Z',refreshMode:'daily-edition',regime:'mixed-transition',scoresJson:'{}',metricsJson:JSON.stringify({series,freshness:[]}),provenanceJson:JSON.stringify({sourcePolicyVersion:SOURCE_POLICY_VERSION}),...overrides});
const point={date:'2026-10-07',value:123};
test('writer policy is accepted, incompatible policy is not',()=>{
 assert.ok(supportedSnapshot({sourcePolicyVersion:SOURCE_POLICY_VERSION}));
 assert.ok(supportedSnapshot({sourcePolicyVersion:'2026-09-28-quality-v1'}));
 assert.equal(supportedSnapshot({sourcePolicyVersion:'unknown'}),false);
});
test('corrupt, empty and invalid rows cannot mask a usable snapshot',()=>{
 const valid=row({m2:[point]});
 const recovered=recoverSnapshot([row({}, {metricsJson:'{broken'}),row({m2:[{date:'bad',value:null}]}),valid]);
 assert.equal(recovered.metrics.latest.m2.value,123);
 assert.equal(recoverSnapshot([row({})]),null);
});
test('partial newer editions retain independent history explicitly stale',()=>{
 const recovered=recoverSnapshot([row({m2:[point]}),row({sp500:[point]},{requestedAt:'2026-10-07T10:00:00Z'})]);
 assert.equal(recovered.metrics.latest.sp500.value,123);
 assert.equal(recovered.metrics.freshness.find(x=>x.key==='sp500').status,'last-known-good');
 assert.equal(recovered.metrics.freshness.find(x=>x.key==='sp500').last_success,'2026-10-07T10:00:00Z');
});

test('partial browser refresh preserves series and the newer independent BTC pulse',async()=>{
 const {retainDashboardSeries}=await import('../lib/dashboard-recovery.mjs');
 const previous={series:{m2:[point]},bitcoin:{price:80000,priceObservedAt:'2026-10-08T10:01:00Z'},freshness:[]};
 const next=retainDashboardSeries(previous,{series:{},latest:{},freshness:[],bitcoin:{price:null},provenance:{modelStatus:'withheld'}});
 assert.equal(next.latest.m2.value,123);
 assert.equal(next.freshness[0].status,'last-known-good');
 assert.equal(next.bitcoin.price,80000);
 assert.equal(next.bitcoin.priceConsensus,'stale');
 assert.equal(next.provenance.modelStatus,'withheld');
 assert.throws(()=>retainDashboardSeries(previous,{}),/Invalid snapshot/);
});
