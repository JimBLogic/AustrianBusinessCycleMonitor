import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {WORLD_BANK_GOLD} from '../lib/gold-metadata.mjs';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const registry = moduleUrl(await readFile(new URL('../app/data/source-registry.ts',import.meta.url),'utf8'));
const source = (await readFile(new URL('../app/data/snapshot-health.ts',import.meta.url),'utf8'))
  .replace("'./source-registry'",JSON.stringify(registry))
  .replace("'../../lib/gold-metadata.mjs'",JSON.stringify(new URL('../lib/gold-metadata.mjs',import.meta.url).href));
const {snapshotHealth} = await import(moduleUrl(source));

test('monthly World Bank gold health does not claim a daily LBMA equivalent', () => {
  const snapshot={requestedAt:'2026-10-10T12:00:00Z',metrics:{series:{gold:[{date:'2026-09-01',value:4319}]},freshness:[{key:'gold',source:'worldbank',status:'live'}]},provenance:{}};
  const gold=snapshotHealth(snapshot,Date.parse('2026-10-10T12:00:00Z')).indicators.find(x=>x.indicator==='gold');
  assert.equal(gold.metric,WORLD_BANK_GOLD.metric);
  assert.equal(gold.last_valid_value,4319);
  assert.equal(gold.observation_date,'2026-09-01');
  assert.equal(gold.status,'DEGRADED');
  assert.equal(gold.unit,'USD per troy ounce, monthly mean');
  assert.match(gold.failure_reason,/not live spot/);
  assert.doesNotMatch(gold.failure_reason,/exact metric backup selected/);
  assert.equal(WORLD_BANK_GOLD.equivalentToDailyLbma,false);
  snapshot.metrics.freshness[0].status='last-known-good';
  const stale=snapshotHealth(snapshot,Date.parse('2026-10-10T12:00:00Z')).indicators.find(x=>x.indicator==='gold');
  assert.equal(stale.status,'STALE');
  assert.equal(stale.metric,WORLD_BANK_GOLD.metric);
  snapshot.metrics.freshness[0]={key:'gold',source:'csv',status:'live'};
  const daily=snapshotHealth(snapshot,Date.parse('2026-10-10T12:00:00Z')).indicators.find(x=>x.indicator==='gold');
  assert.equal(daily.metric,'GOLDAMGBD228NLBM');
  assert.match(daily.unit,/daily LBMA/);
});
