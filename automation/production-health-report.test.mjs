import test from 'node:test';
import assert from 'node:assert/strict';
import { assessEconomicHealth, economicHealthSummary } from './production-health-report.mjs';

function fixture() {
  const rows = [
    { indicator:'m2', status:'HEALTHY', last_valid_value:100, freshness:{state:'FRESH'} },
    { indicator:'cpi', status:'HEALTHY', last_valid_value:200, freshness:{state:'FRESH'} },
    { indicator:'bitcoin', status:'HEALTHY', last_valid_value:80000, freshness:{state:'FRESH'} },
  ];
  return { status:'HEALTHY', data:{ total:3, available:3, fresh:3, indicators:rows } };
}

test('healthy observations and stored bitcoin produce PASS', () => {
  const result = assessEconomicHealth(fixture());
  assert.equal(result.level, 'PASS');
  assert.deepEqual(result.macro, { fresh:2, total:2 });
  assert.deepEqual(result.stale, []);
  assert.equal(result.storedBitcoinQuote.fresh, true);
});

test('fresh fallback is an operational degradation, not a stale observation', () => {
  const h=fixture();
  h.status='DEGRADED';
  h.data.indicators[0].status='DEGRADED';
  const result=assessEconomicHealth(h);
  assert.equal(result.level,'DEGRADED');
  assert.equal(result.fresh,3);
  assert.deepEqual(result.fallback,['m2']);
  assert.deepEqual(result.stale,[]);
});

test('quarterly stale data and old stored BTC remain explicitly visible', () => {
  const h=fixture();
  h.status='DEGRADED';
  h.data.fresh=1;
  h.data.indicators[1].status='STALE';
  h.data.indicators[1].freshness.state='STALE';
  h.data.indicators[2].status='STALE';
  h.data.indicators[2].freshness.state='STALE';
  const result=assessEconomicHealth(h);
  assert.equal(result.level,'DEGRADED');
  assert.deepEqual(result.macro,{fresh:1,total:2});
  assert.equal(result.storedBitcoinQuote.fresh,false);
  assert.deepEqual(result.stale,['cpi','bitcoin']);
  assert.match(economicHealthSummary(result),/fresh 1\/3/);
  assert.match(economicHealthSummary(result),/Bitcoin quote.*STALE/);
});

test('monitor fails closed when aggregate counters disagree with source rows', () => {
  const h=fixture();
  h.data.fresh=2;
  assert.throws(()=>assessEconomicHealth(h), /fresh count/);
  h.data.fresh=3;
  h.data.available=2;
  assert.throws(()=>assessEconomicHealth(h), /available count/);
  h.data.available=3;
  h.data.total=5;
  assert.throws(()=>assessEconomicHealth(h), /indicator total/);
});

test('duplicates, unsafe identifiers and invalid freshness cannot enter CI warnings', () => {
  const h=fixture();
  h.data.indicators[1].indicator='m2';
  assert.throws(()=>assessEconomicHealth(h), /duplicate/);
  h.data.indicators[1].indicator='cpi\n::error::';
  assert.throws(()=>assessEconomicHealth(h), /invalid indicator identifier/);
  h.data.indicators[1].indicator='cpi';
  h.data.indicators[1].freshness.state='UNKNOWN';
  assert.throws(()=>assessEconomicHealth(h), /invalid observation freshness/);
});
