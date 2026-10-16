import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  referencePeriodEnd,
  observationAgeDays,
  seriesFreshForKey,
  QUARTERLY_FRED_KEYS,
} from '../lib/observation-freshness.mjs';

const OCT16 = Date.parse('2026-10-16T12:00:00Z');
const point = (date, value = 10) => [{ date, value }];

test('2026 Q2 official data stay eligible for a 160-day age policy', () => {
  assert.deepEqual([...QUARTERLY_FRED_KEYS], ['federalDebt', 'debtToGdp', 'realGdpGrowth']);
  for (const key of ['federalDebt', 'realGdpGrowth']) {
    assert.equal(referencePeriodEnd(key, '2026-04-01', OCT16), '2026-06-30');
    assert.ok(observationAgeDays(key, '2026-04-01', OCT16) > 107);
    assert.ok(observationAgeDays(key, '2026-04-01', OCT16) < 109);
    assert.equal(seriesFreshForKey(point('2026-04-01'), key, 160, OCT16), true);
  }
  // No change to the published FRED observation's date or value.
  assert.deepEqual(point('2026-04-01', 39462398), [{date:'2026-04-01', value:39462398}]);
});

test('2026 Q1 data are still stale and cannot be promoted by quarter-end semantics', () => {
  assert.equal(referencePeriodEnd('debtToGdp', '2026-01-01', OCT16), '2026-03-31');
  assert.equal(seriesFreshForKey(point('2026-01-01'), 'debtToGdp', 160, OCT16), false);
  assert.ok(observationAgeDays('debtToGdp', '2026-01-01', OCT16) > 190);
});

test('daily/monthly values retain literal observed-date age and all policy limits', () => {
  assert.equal(referencePeriodEnd('sp500', '2026-04-01', OCT16), '2026-04-01');
  assert.equal(referencePeriodEnd('cpi', '2026-04-01', OCT16), '2026-04-01');
  assert.equal(seriesFreshForKey(point('2026-04-01'), 'sp500', 14, OCT16), false);
  assert.equal(seriesFreshForKey(point('2026-09-01'), 'cpi', 75, OCT16), true);
  const policies = readFileSync(new URL('../app/data/source-registry.ts', import.meta.url), 'utf8');
  for (const key of QUARTERLY_FRED_KEYS) assert.match(policies, new RegExp(key + ': 160'));
});

test('quarter timestamps must be genuine past periods; do not promote future or malformed records', () => {
  const MAY1 = Date.parse('2026-05-01T10:00:00Z');
  assert.equal(referencePeriodEnd('federalDebt', '2026-04-01', MAY1), null, 'unfinished quarter');
  assert.equal(seriesFreshForKey(point('2026-04-01'), 'federalDebt', 160, MAY1), false);
  assert.equal(referencePeriodEnd('realGdpGrowth', '2026-02-30', OCT16), null);
  assert.equal(referencePeriodEnd('federalDebt', '2026-02-01', OCT16), '2026-02-01', 'unknown period is not shifted');
  assert.equal(seriesFreshForKey(point('2999-01-01'), 'federalDebt', 160, OCT16), false);
});

test('readers, model eligibility and fallback ingestion apply the same reference period', () => {
  const api = readFileSync(new URL('../app/api/data/route.ts', import.meta.url), 'utf8');
  const health = readFileSync(new URL('../app/data/snapshot-health.ts', import.meta.url), 'utf8');
  assert.ok(api.includes('seriesFreshForKey(results[key].points, key, MAX_OBSERVATION_AGE_DAYS[key])'));
  assert.ok(api.includes('seriesFreshForKey(points, key, key === "gold"'));
  assert.ok(api.includes('observationAgeDays(key, observation.date)'));
  assert.ok(api.includes('observationAgeDays(reading.sourceKey, reading.observedAt)'));
  assert.ok(health.includes('observationAgeDays(key,point.date,now)'));
  assert.ok(health.includes('reference_period_end:point?referencePeriodEnd(key,point.date,now):null'));
  assert.ok(health.includes("age_basis:QUARTERLY_FRED_KEYS.includes(key)?'quarter_period_end':'observation_date'"));
});
