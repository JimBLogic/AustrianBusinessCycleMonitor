import test from 'node:test';
import assert from 'node:assert/strict';
import { retainedSeriesIsNewer } from '../lib/observation-integrity.mjs';
const points=date=>[{date,value:3.75}];
test('monthly retention ranks reference months without changing raw provider dates or values',()=>{
  for(const key of ['m2','fedFunds','cpi','unemployment','industrialProduction','capacityUtilization','manufacturingSurvey']) {
    const prior=points('2026-09-30'),incoming=points('2026-09-01');
    const original=structuredClone({prior,incoming});
    assert.equal(retainedSeriesIsNewer(key,prior,incoming),false);
    assert.equal(retainedSeriesIsNewer(key,points('2026-09-30'),points('2026-08-01')),true);
    assert.equal(retainedSeriesIsNewer(key,points('2026-08-31'),incoming),false);
    assert.deepEqual({prior,incoming},original);
  }
});
test('daily series still require an equal or newer day; empty downloads retain valid history',()=>{
  assert.equal(retainedSeriesIsNewer('yieldCurve',points('2026-09-30'),points('2026-09-01')),true);
  assert.equal(retainedSeriesIsNewer('fedFunds',points('2026-09-30'),[]),true);
  assert.equal(retainedSeriesIsNewer('fedFunds',[],points('2026-09-01')),false);
});
