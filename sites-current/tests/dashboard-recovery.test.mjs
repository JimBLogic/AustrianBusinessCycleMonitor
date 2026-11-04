import test from 'node:test';
import assert from 'node:assert/strict';
import { retainDashboardSeries } from '../lib/dashboard-recovery.mjs';

function snapshots(key, previousDate, incomingDate) {
  const previousPoint = {date:previousDate,value:4.5};
  const incomingPoint = {date:incomingDate,value:4.25};
  return {
    previous:{series:{[key]:[previousPoint]},freshness:[{key,source:'dbnomics',status:'live'}],bitcoin:{}},
    incoming:{series:{[key]:[incomingPoint]},latest:{[key]:incomingPoint},freshness:[{key,source:'csv',status:'live'}],
      provenance:{mode:'daily-persisted',modelStatus:'complete'},derived:{scores:{money:55}},bitcoin:{}},
  };
}

test('monthly FRED revisions replace month-end fallback labels for the same reference month', () => {
  for (const key of ['m2','fedFunds','cpi','unemployment','industrialProduction','capacityUtilization','manufacturingSurvey']) {
    const {previous,incoming} = snapshots(key,'2026-09-30','2026-09-01');
    const result = retainDashboardSeries(previous,incoming);
    assert.deepEqual(result.series[key],incoming.series[key],key);
    assert.deepEqual(result.latest[key],incoming.latest[key],key);
    assert.deepEqual(result.freshness,incoming.freshness,key);
    assert.deepEqual(result.provenance,incoming.provenance,key);
    assert.deepEqual(result.derived,incoming.derived,key);
    assert.equal(previous.series[key][0].value,4.5,'recovery must not mutate previous data');
  }
});

test('recovery retains a genuinely later month and exact later daily observations', () => {
  for (const [key,previousDate,incomingDate] of [
    ['fedFunds','2026-10-01','2026-09-30'],
    ['treasury10y','2026-09-30','2026-09-29'],
  ]) {
    const {previous,incoming} = snapshots(key,previousDate,incomingDate);
    const result = retainDashboardSeries(previous,incoming);
    assert.deepEqual(result.series[key],previous.series[key]);
    assert.equal(result.freshness[0].status,'last-known-good');
    assert.deepEqual(result.derived,incoming.derived);
  }
});

test('newer monthly periods and same-date revisions remain incoming observations', () => {
  for (const [previousDate,incomingDate] of [['2026-08-31','2026-09-01'],['2026-09-01','2026-09-01']]) {
    const {previous,incoming} = snapshots('fedFunds',previousDate,incomingDate);
    assert.deepEqual(retainDashboardSeries(previous,incoming).latest.fedFunds,incoming.latest.fedFunds);
  }
});
