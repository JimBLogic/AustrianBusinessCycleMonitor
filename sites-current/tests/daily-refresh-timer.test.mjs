import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { createDailyRefreshBudget, scheduleDailyRefresh } from '../lib/daily-refresh.mjs';

// Execute the effect shipped in Monitor, including its callback closure.
const source = await readFile(new URL('../app/monitor.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  useEffect(() => {\n    const validUntil = data.cache?.nextDailyAt');
const marker = '  }, [data.cache?.nextDailyAt, data.cache?.validUntil, data.provenance.mode, data.requestedAt, load]);';
const end = source.indexOf(marker, start);
assert.ok(start > 0 && end > start);
const code = `export function mount(data, load, window, Date, Math, scheduleDailyRefresh, dailyRefreshBudget, previousData) {
  let cleanup; const useEffect = fn => { cleanup = fn(); };
  ${source.slice(start, end + marker.length)}
  return cleanup;
}`;
const compiled = ts.transpileModule(code, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
} }).outputText;
const { mount } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const deadline = Date.parse('2026-10-29T11:00:00Z');
function runtime(initialNow) {
  let now = initialNow;
  let timer;
  const calls = [];
  class Clock extends Date { static now() { return now; } }
  const data = {
    cache: { nextDailyAt: new Date(deadline).toISOString() },
    requestedAt: '2026-10-28T18:00:00Z',
    provenance: { mode: 'daily-persisted' },
  };
  const cleanup = mount(data, async (...args) => { calls.push(args); return { kind: 'failed', retryAt: 0 }; }, {
    setTimeout: (callback, delay) => { timer = { callback, delay }; return 1; },
    clearTimeout: () => { timer = undefined; },
  }, Clock, Object.assign(Object.create(Math), { random: () => 0 }),
  options => scheduleDailyRefresh({ ...options, now: () => now, random: () => 0 }),
  { current: createDailyRefreshBudget() }, { current: data });
  return {
    calls, cleanup, get timer() { return timer; },
    async fire(at) { now = at; const callback = timer.callback; timer = undefined; await callback(); },
  };
}

test('an open tab crossing the daily cutoff requests generation rather than a read of the old edition', async () => {
  const r = runtime(deadline - 3_600_000);
  assert.equal(r.timer.delay, 3_600_000);
  assert.deepEqual(r.calls, []);
  await r.fire(deadline + 1_000);
  assert.deepEqual(r.calls.map(args => args.slice(0, 2)), [[true, false]], 'POST refresh remains automatic, not a user comparison');
  r.cleanup();
});

test('an already expired edition keeps the short jittered automatic POST recovery', async () => {
  const r = runtime(deadline + 1_000);
  assert.equal(r.timer.delay, 2_000);
  await r.fire(deadline + 3_000);
  assert.deepEqual(r.calls.map(args => args.slice(0, 2)), [[true, false]]);
  r.cleanup();
});

test('unmount cancels a future daily refresh without performing a request', () => {
  const r = runtime(deadline - 3_600_000);
  r.cleanup();
  assert.equal(r.timer, undefined);
  assert.deepEqual(r.calls, []);
});
