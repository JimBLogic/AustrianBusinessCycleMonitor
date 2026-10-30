import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { manualRefreshBlocked } from '../lib/refresh-policy.mjs';
import { retainDashboardSeries } from '../lib/dashboard-recovery.mjs';
import { validTimestamp } from '../lib/timestamp.mjs';
import { dailyRefreshRetryAt } from '../lib/daily-refresh.mjs';

const compile = code => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText).toString('base64');
const preferences = await import(compile(await readFile(new URL('../lib/local-preferences.ts', import.meta.url), 'utf8')));
const source = await readFile(new URL('../app/monitor.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  const load = useCallback(');
const end = source.indexOf('  const loadBitcoin = useCallback(', start);
assert.ok(start > 0 && end > start);
const names = ['useCallback', 'requestState', 'dataRequestPending', 'manualRefreshBlocked', 'setLoading', 'setRefreshNotice', 'fetch', 'retainDashboardSeries', 'previousData', 'setData', 'snapshotBaseline', 'saveManualRefreshPreference', 'readManualRefreshPreference', 'setBaselineSavedThisVisit', 'setBaselineSessionOnly', 'setManualRefreshNext', 'setVisitBaseline', 'format', 'validTimestamp', 'Date', 'dailyRefreshRetryAt'];
const { create } = await import(compile(`export function create({${names.join(',')}}) { ${source.slice(start, end)} return load; }`));
const baseline = {
  capturedAt: '2026-10-29T10:00:00Z', requestedAt: '2026-10-29T09:00:00Z',
  regime: 'mixed', composite: 52, modelReady: true, bitcoinPrice: 80000, latestDates: {},
};
const storage = entries => ({ getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) });

test('existing v1 baseline preferences stay compatible; attempts may persist an explicit null baseline', () => {
  const entries = new Map();
  globalThis.window = { localStorage: storage(entries) };
  try {
    const key = preferences.MANUAL_REFRESH_STORAGE_KEY;
    assert.equal(key, 'abcm:manual-refresh-state:v1');
    // The previously stored v1 representation must still load unchanged.
    entries.set(key, JSON.stringify({ previousSnapshot: baseline, nextAllowedAt: 1234 }));
    assert.deepEqual(preferences.readManualRefreshPreference(), { previousSnapshot: baseline, nextAllowedAt: 1234 });
    assert.equal(preferences.saveManualRefreshPreference(null, 5678), true);
    assert.deepEqual(preferences.readManualRefreshPreference(), { previousSnapshot: null, nextAllowedAt: 5678 });
    for (const invalid of [{ nextAllowedAt: 5678 }, { previousSnapshot: {}, nextAllowedAt: 5678 }, { previousSnapshot: null, nextAllowedAt: '5678' }]) {
      entries.set(key, JSON.stringify(invalid));
      assert.equal(preferences.readManualRefreshPreference(), null);
    }
  } finally { delete globalThis.window; }
});

async function runLoad({ existing = null, sameEdition = true, mode = 'manual-cooldown', lang = 'es' } = {}) {
  const attemptAt = Date.parse('2026-10-29T12:00:00Z');
  let now = attemptAt;
  const entries = new Map();
  globalThis.window = { localStorage: storage(entries) };
  if (existing) preferences.saveManualRefreshPreference(existing, attemptAt - 1);
  const old = { requestedAt: new Date(attemptAt - 60000).toISOString(), series: {}, latest: {}, bitcoin: { price: 80000 }, freshness: [], provenance: { mode: 'daily-persisted' } };
  const next = { ...old, requestedAt: sameEdition ? old.requestedAt : new Date(attemptAt).toISOString(), refreshMode: mode, cache: { nextManualAt: new Date(attemptAt + 120000).toISOString() } };
  const state = { baselineCalls: [], captureCalls: 0, deadline: null, notice: '', fetches: 0 };
  const requestState = { current: { lang, manualRefreshNext: null } };
  class Clock extends Date { static now() { return now; } }
  const noop = () => {};
  const load = create({
    useCallback: fn => fn, requestState, dataRequestPending: { current: false },
    manualRefreshBlocked: (userInitiated, nextAllowedAt) => manualRefreshBlocked(userInitiated, nextAllowedAt, now),
    setLoading: noop, setRefreshNotice: value => { state.notice = value; },
    fetch: async () => { state.fetches++; now += 60000; return { ok: true, headers: new Headers(), json: async () => next }; },
    retainDashboardSeries, previousData: { current: old }, setData: noop,
    snapshotBaseline: () => { state.captureCalls++; return baseline; },
    saveManualRefreshPreference: preferences.saveManualRefreshPreference,
    readManualRefreshPreference: preferences.readManualRefreshPreference,
    setBaselineSavedThisVisit: noop, setBaselineSessionOnly: noop,
    setManualRefreshNext: value => { state.deadline = value; requestState.current.manualRefreshNext = value; },
    setVisitBaseline: value => state.baselineCalls.push(value), format: value => String(value), validTimestamp, Date: Clock, dailyRefreshRetryAt,
  });
  try {
    await load(true, true);
    const persisted = preferences.readManualRefreshPreference();
    await load(true, true);
    assert.equal(state.fetches, 1, 'cooldown blocks another attempt rather than extending its deadline');
    assert.equal(state.deadline, attemptAt + 30 * 60000, 'thirty minutes start at the attempt, not the delayed response');
    return { ...state, persisted };
  } finally { delete globalThis.window; }
}

test('shared cooldown retains the edition without a false baseline or a synchronized-success message', async () => {
  const result = await runLoad();
  assert.deepEqual(result.baselineCalls, []);
  assert.equal(result.captureCalls, 0);
  assert.equal(result.persisted.previousSnapshot, null);
  assert.match(result.notice, /Edición conservada/);
  assert.match(result.notice, /Espera compartida: 1 min/);
  assert.doesNotMatch(result.notice, /sincronizada/);
});

test('shared cooldown preserves an existing comparison instead of replacing it', async () => {
  const result = await runLoad({ existing: baseline, lang: 'en' });
  assert.deepEqual(result.persisted.previousSnapshot, baseline);
  assert.deepEqual(result.baselineCalls, []);
  assert.equal(result.captureCalls, 0);
  assert.match(result.notice, /Edition retained/);
  assert.match(result.notice, /Shared wait: 1 min/);
});

test('a newly received edition keeps the normal comparison behavior even if a concurrent writer triggered shared cooldown', async () => {
  const result = await runLoad({ sameEdition: false });
  assert.deepEqual(result.baselineCalls, [baseline]);
  assert.equal(result.captureCalls, 1);
  assert.deepEqual(result.persisted.previousSnapshot, baseline);
  assert.match(result.notice, /Instantánea sincronizada/);
});
