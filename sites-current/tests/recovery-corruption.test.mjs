import test from 'node:test';
import assert from 'node:assert/strict';
import { finiteObservation, normalizeSeries } from '../lib/series-quality.mjs';
import { validTimestamp } from '../lib/timestamp.mjs';
import { recoverSnapshot } from '../lib/snapshot-recovery.mjs';
import { retainDashboardSeries } from '../lib/dashboard-recovery.mjs';
import { SOURCE_POLICY_VERSION } from '../lib/snapshot-policy.mjs';
import { runtimeHealthy } from '../lib/runtime-health.mjs';

const now = Date.parse('2026-10-12T10:00:00Z');
const quote = {price:80000,priceObservedAt:'2026-10-12T09:59:00Z',priceConsensus:'confirmed',priceSources:['coinbase','kraken']};
const point = {date:'2026-10-09',value:123};
const row = (series, bitcoin, extra={}) => ({requestedAt:'2026-10-12T10:00:00Z', refreshMode:'daily-edition',regime:'mixed',
  scoresJson:'{}',metricsJson:JSON.stringify({series,bitcoin,freshness:[]}),provenanceJson:JSON.stringify({sourcePolicyVersion:SOURCE_POLICY_VERSION}),...extra});

test('object and array payloads never become zero-valued observations', () => {
  for (const value of [[],[0],{},true,false,null,undefined]) assert.equal(finiteObservation(value),null);
  assert.equal(finiteObservation('0'),0);
  assert.deepEqual(normalizeSeries([null,false,{},'corrupt',{date:point.date,value:[]},point],now),[point]);
  assert.deepEqual(normalizeSeries(null,now),[]);
});

test('invalid calendar and future editions cannot hide the last valid snapshot', () => {
  assert.equal(validTimestamp('2026-02-30T10:00:00Z'),null);
  const good=row({m2:[point]},quote);
  for (const date of ['2099-01-01T00:00:00Z','2026-02-30T10:00:00Z','broken']) {
    assert.equal(recoverSnapshot([row({m2:[{...point,value:999}]},quote,{requestedAt:date}),good],now).metrics.latest.m2.value,point.value);
  }
});

test('partial durable editions retain independent Bitcoin with its original date and STALE status', () => {
  const recovered=recoverSnapshot([row({cpi:[point]},{price:null}),row({m2:[point]},quote)],now);
  assert.equal(recovered.metrics.bitcoin.price,quote.price);
  assert.equal(recovered.metrics.bitcoin.priceObservedAt,quote.priceObservedAt);
  assert.equal(recovered.metrics.bitcoin.priceConsensus,'stale');
  assert.equal(recovered.metrics.latest.m2.value,point.value);
  assert.deepEqual(recovered.scores,{});
});

test('a valid Bitcoin-only edition remains available without inventing macro data', () => {
  const recovered=recoverSnapshot([row({},quote)],now);
  assert.equal(recovered.metrics.bitcoin.price,quote.price);
  assert.deepEqual(recovered.metrics.series,{});
  assert.deepEqual(recovered.metrics.latest,{});
  assert.equal(recoverSnapshot([row({},{price:0})],now),null);
});

test('invalid quote timestamps and malformed optional metadata preserve independent macro observations', () => {
  const recovered=recoverSnapshot([row({m2:[point]},{...quote,priceObservedAt:'2999-01-01T00:00:00Z'},{scoresJson:'null',metricsJson:JSON.stringify({series:{m2:[point]},bitcoin:{...quote,priceObservedAt:'broken'},freshness:{key:'m2'}})})],now);
  assert.equal(recovered.metrics.latest.m2.value,point.value);
  assert.equal(recovered.metrics.bitcoin.price,null);
  assert.deepEqual(recovered.metrics.freshness,[]);
  assert.deepEqual(recovered.scores,{});
});

test('browser recovery rejects an invalid incoming quote rather than losing the previous verified quote', () => {
  const stamp=new Date().toISOString();
  const previous={series:{},bitcoin:{...quote,priceObservedAt:stamp}};
  for (const bitcoin of [{price:NaN,priceObservedAt:stamp},{price:90000,priceObservedAt:'broken'},{price:90000,priceObservedAt:'2999-01-01T00:00:00Z'}]) {
    const result=retainDashboardSeries(previous,{series:{},latest:{},bitcoin,provenance:{modelStatus:'withheld'}});
    assert.equal(result.bitcoin.price,quote.price);
    assert.equal(result.bitcoin.priceConsensus,'stale');
    assert.equal(result.provenance.modelStatus,'withheld');
  }
});

test('an older macro edition does not replace or downgrade a newer independently confirmed live quote', () => {
  const previous={series:{},bitcoin:{...quote,priceObservedAt:new Date().toISOString()}};
  const incoming={series:{},latest:{},provenance:{},bitcoin:{...quote,priceObservedAt:new Date(Date.now()-60_000).toISOString()}};
  const result=retainDashboardSeries(previous,incoming);
  assert.equal(result.bitcoin.priceObservedAt,previous.bitcoin.priceObservedAt);
  assert.equal(result.bitcoin.priceConsensus,'confirmed');
});

test('runtime health accepts a live empty DB but rejects wrong release, DB outage and inconsistent data readiness', () => {
  const empty={service:'austrian-business-cycle-monitor',siteRelease:89,status:'UNAVAILABLE',persistence:{status:'ready',snapshotReadable:false}};
  assert.equal(runtimeHealthy(empty,503,89),true);
  assert.equal(runtimeHealthy(empty,200,89),false);
  assert.equal(runtimeHealthy(empty,503,88),false);
  assert.equal(runtimeHealthy({...empty,persistence:{status:'unavailable',snapshotReadable:false}},503,89),false);
  for (const status of ['HEALTHY','DEGRADED','STALE']) {
    assert.equal(runtimeHealthy({...empty,status,persistence:{status:'ready',snapshotReadable:true}},200,89),true);
  }
});
