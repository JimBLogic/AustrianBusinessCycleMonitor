import test from 'node:test';
import assert from 'node:assert/strict';
import { bitcoinHistoryPoints, retainHistory, eligibleScores, bitcoinDataStatus, quarterlyDebtInBillions } from '../lib/observation-integrity.mjs';
import { resolveBitcoinConsensus } from '../app/data/bitcoin-consensus.mjs';
import { validChartPoints, timePosition, chartSegments } from '../lib/chart-geometry.mjs';

test('corrupt Bitcoin timestamps cannot abort a refresh', () => {
  const values = [{x:1e100,y:10000},{x:null,y:10000},{x:Date.parse('2026-01-01')/1000,y:85000}];
  assert.deepEqual(bitcoinHistoryPoints({values}), [{date:'2026-01-01',value:85000}]);
  assert.deepEqual(bitcoinHistoryPoints({values:'broken'}), []);
});
test('empty, corrupt and older provider histories retain last known good observations', () => {
  const prior = [{date:'2026-01-01',value:10},{date:'2026-01-02',value:20}];
  for (const candidate of [[],null,[{date:'bad',value:0}],[{date:'2026-01-01',value:5}]]) {
    assert.deepEqual(retainHistory(candidate,prior),prior);
  }
  assert.deepEqual(retainHistory([{date:'2026-01-02',value:21}],prior),[prior[0],{date:'2026-01-02',value:21}]);
});
test('unavailable scores are null while an eligible true zero remains zero', () => {
  assert.deepEqual(eligibleScores({a:35,b:0,composite:52},{signalReady:{a:false,b:true},modelStatus:'withheld'}),{a:null,b:0,composite:null});
  assert.deepEqual(eligibleScores({a:30},{},true),{a:null});
});
test('Bitcoin status and timestamps describe the quotes actually used', () => {
  const primary={source:'coinbase',price:80000,observedAt:'2026-01-01T10:00:00Z'};
  const backup={source:'kraken',price:80100,observedAt:'2026-01-01T10:01:00Z'};
  assert.equal(resolveBitcoinConsensus([primary,backup]).observedAt,primary.observedAt);
  const divergent=resolveBitcoinConsensus([primary,{...backup,price:90000}]);
  assert.equal(divergent.price,primary.price);
  assert.equal(divergent.observedAt,primary.observedAt);
  assert.equal(bitcoinDataStatus(divergent.price,divergent.consensus),'DEGRADED');
  assert.equal(bitcoinDataStatus(80000,'single-source'),'DEGRADED');
  assert.equal(bitcoinDataStatus(80000,'stale'),'STALE');
  assert.equal(bitcoinDataStatus(null,'unavailable'),'UNAVAILABLE');
});
test('quarterly debt comparisons align end-of-period dates without mutating source observations', () => {
  const raw=[{date:'2026-04-01',value:39462398}];
  assert.deepEqual(quarterlyDebtInBillions(raw),[{date:'2026-06-30',value:39462.398,sourceObservationDate:'2026-04-01'}]);
  assert.equal(raw[0].date,'2026-04-01');
});
test('charts reject impossible dates and preserve elapsed time and missing intervals', () => {
  const points=validChartPoints([{date:'2026-02-30',value:1},{date:'2026-01-01',value:1},{date:'2026-01-02',value:2},{date:'2026-01-11',value:3}]);
  assert.equal(points.length,3);
  assert.equal(timePosition(points[1].date,points[0].date,points[2].date),14);
  assert.deepEqual(chartSegments(points,7).map(x=>x.length),[2,1]);
});
