import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {WORLD_BANK_GOLD} from '../lib/gold-metadata.mjs';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const registry = moduleUrl(await readFile(new URL('../app/data/source-registry.ts',import.meta.url),'utf8'));
const source = (await readFile(new URL('../app/data/snapshot-health.ts',import.meta.url),'utf8'))
  .replace("'./source-registry'",JSON.stringify(registry))
  .replace("'../../lib/gold-metadata.mjs'",JSON.stringify(new URL('../lib/gold-metadata.mjs',import.meta.url).href))
  .replace("'../../lib/bitcoin-quote.mjs'",JSON.stringify(new URL('../lib/bitcoin-quote.mjs',import.meta.url).href))
  .replace("'../../lib/observation-freshness.mjs'",JSON.stringify(new URL('../lib/observation-freshness.mjs',import.meta.url).href));
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

test('health never reports corrupt quotes as fresh and respects explicit recovered STALE status', () => {
  const now=Date.parse('2026-10-12T10:00:00Z');
  const quote={price:80000,priceObservedAt:'2026-10-12T09:59:00Z',priceConsensus:'confirmed'};
  const snapshot={requestedAt:'2026-10-12T10:00:00Z',metrics:{series:{},freshness:[],bitcoin:quote},provenance:{}};
  assert.equal(snapshotHealth(snapshot,now).indicators.at(-1).status,'HEALTHY');
  snapshot.metrics.bitcoin={...quote,priceConsensus:'stale'};
  assert.equal(snapshotHealth(snapshot,now).indicators.at(-1).status,'STALE');
  for (const priceObservedAt of ['broken','2999-01-01T00:00:00Z','2026-02-30T10:00:00Z']) {
    snapshot.metrics.bitcoin={...quote,priceObservedAt};
    const health=snapshotHealth(snapshot,now);
    assert.equal(health.indicators.at(-1).status,'UNAVAILABLE');
    assert.equal(health.indicators.at(-1).last_valid_value,null);
    assert.equal(health.status,'UNAVAILABLE');
  }
});

test('health separates durable macro observations from the short-lived stored BTC quote', () => {
  const now=Date.parse('2026-10-16T12:00:00Z');
  const snapshot={
    requestedAt:'2026-10-16T11:59:00Z',
    metrics:{
      series:{
        federalDebt:[{date:'2026-04-01',value:39462398}],
        realGdpGrowth:[{date:'2026-04-01',value:2.2}],
        debtToGdp:[{date:'2026-01-01',value:122.59387}],
      },
      freshness:[],
      bitcoin:{price:80000,priceObservedAt:'2026-10-16T11:59:00Z',priceConsensus:'confirmed'},
    },
    provenance:{bitcoinPrice:'Coinbase + Kraken'},
  };
  const initial=snapshotHealth(snapshot,now);
  assert.equal(initial.total,20, 'legacy indicator count must not change');
  assert.equal(initial.domains.macro.total,19);
  assert.equal(initial.domains.macro.available,3);
  assert.equal(initial.domains.macro.fresh,2, 'Q2 valid, Q1 stale');
  assert.equal(initial.domains.storedBitcoinQuote.total,1);
  assert.equal(initial.domains.storedBitcoinQuote.fresh,1);
  assert.equal(initial.domains.storedBitcoinQuote.quote_max_age_minutes,15);
  assert.equal(initial.domains.storedBitcoinQuote.live_endpoint,'/api/bitcoin');

  const later=snapshotHealth(snapshot,now+20*60000);
  assert.equal(later.domains.macro.fresh,2);
  assert.equal(later.domains.storedBitcoinQuote.fresh,0);
  assert.equal(later.indicators.find(x=>x.indicator==='bitcoin').status,'STALE');
  assert.equal(later.status,'DEGRADED', 'do not misrepresent incomplete data as healthy');
  assert.equal(later.total,20);
});
