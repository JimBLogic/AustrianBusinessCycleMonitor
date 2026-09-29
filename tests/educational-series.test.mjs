import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('all three educational series retain primary and fallback data paths', async () => {
  const route = await readFile(new URL('../app/api/data/route.ts', import.meta.url), 'utf8');
  assert.match(route, /Object.values\(FRED\).filter/);
  assert.match(route, /cboeSeries\("SPX"\)/);
  assert.match(route, /cboeSeries\("VIX"\)/);
  assert.match(route, /fredSeries\("DBAA", force\)/);
  assert.match(route, /fredSeries\("DGS10", force\)/);
  assert.doesNotMatch(route, /H15_discontinued/);
  assert.doesNotMatch(route, /rightsUnavailable|isRestrictedSeries|isRestrictedFredId/);
  const db = await readFile(new URL('../db/runtime.ts', import.meta.url), 'utf8');
  assert.match(db, /dataRightsPolicy === "2026-09-28-v1"\) return null/);
});
