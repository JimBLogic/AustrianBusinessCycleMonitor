import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyRefreshBudget, dailyRefreshRetryAt, scheduleDailyRefresh, DAILY_REFRESH_RETRY_MS, madridRefreshWindow, nextMadridRefreshWindow } from '../lib/daily-refresh.mjs';

const boundary = Date.parse('2026-10-29T11:00:00Z');
const iso = stamp => new Date(stamp).toISOString();
function runtime(load) {
  let now = boundary + 1000, nextId = 0;
  let latest = { requestedAt: iso(boundary - 3600000), provenance: { mode: 'stale-persisted' } };
  const timers = new Map(), calls = [], budget = createDailyRefreshBudget();
  const r = {
    budget, calls, timers,
    get now() { return now; },
    advance: ms => { now += ms; },
    setLatest: data => { latest = data; },
    mount: (windowBoundary = boundary) => scheduleDailyRefresh({
      boundary: windowBoundary, budget, now: () => now, random: () => 0,
      readLatest: () => latest,
      load: async (...args) => { calls.push({ args, at: now }); return load(r, ...args); },
      setTimer: (callback, delay) => { timers.set(++nextId, { callback, at: now + delay }); return nextId; },
      clearTimer: id => { timers.delete(id); },
    }),
    async fireNext() {
      const [id, timer] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      timers.delete(id); now = Math.max(now, timer.at); await timer.callback();
    },
    nextAt: () => Math.min(...[...timers.values()].map(timer => timer.at)),
  };
  return r;
}

test('three automatic failures exhaust the mounted-window budget, spaced five minutes after completion', async () => {
  const r = runtime(async clock => { clock.advance(10000); return { kind: 'failed', retryAt: 0 }; });
  const cleanup = r.mount();
  for (let index = 0; index < 3; index++) await r.fireNext();
  assert.equal(r.calls.length, 3);
  assert.equal(r.timers.size, 1);
  assert.equal(r.nextAt(), nextMadridRefreshWindow(boundary));
  assert.equal(r.budget.attempts, 3);
  for (let index = 1; index < r.calls.length; index++) {
    assert.equal(r.calls[index].at - r.calls[index - 1].at, DAILY_REFRESH_RETRY_MS + 10000);
  }
  assert.ok(r.calls.every(({ args }) => args[0] === true && args[1] === false && args[2] instanceof AbortSignal));
  cleanup();
});

test('Retry-After, shared-cache and upstream deadlines are combined without shortening any of them', () => {
  const now = boundary;
  const payload = { cache: { nextManualAt: iso(now + 25 * 60000) }, upstreams: [{ coolingUntil: iso(now + 30 * 60000) }] };
  assert.equal(dailyRefreshRetryAt('1200', payload, now), now + 30 * 60000);
  assert.equal(dailyRefreshRetryAt(new Date(now + 40 * 60000).toUTCString(), payload, now), now + 40 * 60000);
  assert.equal(dailyRefreshRetryAt('-10', { cache: { nextManualAt: 'invalid' }, upstreams: [{ coolingUntil: 'invalid' }] }, now), now);
});

test('a long advertised deadline postpones the next retry beyond the five-minute minimum', async () => {
  const r = runtime(async clock => ({ kind: 'failed', retryAt: clock.now + 20 * 60000 }));
  const cleanup = r.mount();
  await r.fireNext();
  assert.equal(r.nextAt(), r.now + 20 * 60000);
  await r.fireNext();
  assert.equal(r.calls[1].at - r.calls[0].at, 20 * 60000);
  cleanup();
});

test('a later deadline published while a timer is armed is checked before making another request', async () => {
  const r = runtime(async () => ({ kind: 'failed', retryAt: 0 }));
  const cleanup = r.mount();
  const coolingUntil = boundary + 20 * 60000;
  r.setLatest({ requestedAt: iso(boundary - 3600000), provenance: { mode: 'stale-persisted' }, upstreams: [{ coolingUntil: iso(coolingUntil) }] });
  await r.fireNext();
  assert.equal(r.calls.length, 0, 'timer wake-up must not bypass a newly advertised provider cooldown');
  assert.equal(r.nextAt(), coolingUntil);
  await r.fireNext();
  assert.equal(r.calls.length, 1);
  cleanup();
});

test('effect teardown and setup for the same boundary preserve both budget and retry deadline', async () => {
  const r = runtime(async () => ({ kind: 'failed', retryAt: 0 }));
  let cleanup = r.mount();
  await r.fireNext();
  const retryAt = r.nextAt();
  cleanup(); cleanup = r.mount();
  assert.equal(r.nextAt(), retryAt);
  await r.fireNext();
  cleanup(); cleanup = r.mount();
  await r.fireNext();
  cleanup(); cleanup = r.mount();
  assert.equal(r.calls.length, 3);
  assert.equal(r.timers.size, 1);
  cleanup();
});

test('a successful current edition ends retries and a busy manual request does not trigger an extra manual comparison', async () => {
  const successful = runtime(async clock => ({ kind: 'received', requestedAt: iso(clock.now), retryAt: clock.now + 15 * 60000 }));
  const stopSuccess = successful.mount();
  await successful.fireNext();
  assert.equal(successful.timers.size, 0);
  stopSuccess();

  const busy = runtime(async () => ({ kind: 'busy', retryAt: 0 }));
  const stopBusy = busy.mount();
  await busy.fireNext();
  busy.setLatest({ requestedAt: iso(busy.now), provenance: { mode: 'daily-persisted' } });
  await busy.fireNext();
  assert.equal(busy.calls.length, 1, 'concurrent manual generation supplied the edition before another automatic request');
  assert.equal(busy.timers.size, 0);
  stopBusy();
});

test('cleanup aborts an in-flight request and its late completion cannot schedule work for the next window', async () => {
  let finish;
  const r = runtime(() => new Promise(resolve => { finish = resolve; }));
  const cleanup = r.mount();
  const pending = r.fireNext();
  const signal = r.calls[0].args[2];
  cleanup();
  assert.equal(signal.aborted, true);
  const nextBoundary = boundary + 86400000;
  const cleanupNext = r.mount(nextBoundary);
  const nextTimer = r.nextAt();
  assert.equal(r.budget.attempts, 0);
  finish({ kind: 'failed', retryAt: nextBoundary + 999999 });
  await pending;
  assert.equal(r.nextAt(), nextTimer, 'late completion cannot mutate the replacement effect');
  assert.equal(r.budget.attempts, 0);
  cleanupNext();
  assert.equal(r.timers.size, 0);
});

test('late cancelled completion preserves spacing and advertised deadline for a replacement effect in the same window', async () => {
  let finish;
  let attempts = 0;
  const r = runtime(() => {
    if (++attempts === 1) return new Promise(resolve => { finish = resolve; });
    return { kind: 'failed', retryAt: 0 };
  });
  const cleanup = r.mount();
  const pending = r.fireNext();
  r.advance(60000);
  const completionAt = r.now;
  cleanup();
  const cleanupReplacement = r.mount();
  const advertisedRetryAt = completionAt + 20 * 60000;
  finish({ kind: 'cancelled', retryAt: advertisedRetryAt });
  await pending;
  await r.fireNext();
  assert.equal(r.calls.length, 1, 'an already armed early timer must only reschedule, not make a request');
  assert.equal(r.nextAt(), advertisedRetryAt);
  await r.fireNext();
  assert.equal(r.calls.length, 2);
  assert.ok(r.calls[1].at - completionAt >= DAILY_REFRESH_RETRY_MS);
  assert.ok(r.calls[1].at >= advertisedRetryAt);
  cleanupReplacement();
});


test('exhaustion rolls over automatically and an old-boundary remount cannot replenish quota', async () => {
  const r = runtime(async () => ({ kind: 'failed' }));
  let cleanup = r.mount();
  for (let i = 0; i < 3; i++) await r.fireNext();
  await r.fireNext();
  assert.equal(r.calls.length, 4);
  assert.equal(r.budget.boundary, nextMadridRefreshWindow(boundary));
  assert.equal(r.budget.attempts, 1);
  cleanup(); cleanup = r.mount();
  assert.equal(r.budget.attempts, 1);
  assert.equal(r.budget.boundary, nextMadridRefreshWindow(boundary));
  cleanup();
  assert.equal(r.timers.size, 0);
});

test('Madrid noon follows spring and autumn DST calendars', () => {
  const spring = Date.parse('2026-03-28T11:00:00Z');
  const autumn = Date.parse('2026-10-24T10:00:00Z');
  assert.equal(nextMadridRefreshWindow(spring) - spring, 23 * 3600000);
  assert.equal(nextMadridRefreshWindow(autumn) - autumn, 25 * 3600000);
  assert.equal(madridRefreshWindow(Date.parse('2026-03-29T09:59:59Z')), spring);
  assert.equal(madridRefreshWindow(Date.parse('2026-03-29T10:00:00Z')), nextMadridRefreshWindow(spring));
  assert.equal(madridRefreshWindow(Date.parse('2026-10-25T10:59:59Z')), autumn);
  assert.equal(madridRefreshWindow(Date.parse('2026-10-25T11:00:00Z')), nextMadridRefreshWindow(autumn));
});

test('cooldown beyond the next window survives rollover and stale remount', async () => {
  const deadline = Date.parse('2026-10-31T15:00:00Z');
  const r = runtime(async () => ({ kind: 'failed', retryAt: deadline }));
  let cleanup = r.mount();
  await r.fireNext();
  assert.equal(r.nextAt(), deadline);
  r.advance(26 * 3600000);
  cleanup(); cleanup = r.mount();
  assert.equal(r.budget.attempts, 0);
  assert.equal(r.budget.nextAt, deadline);
  assert.equal(r.nextAt(), deadline);
  await r.fireNext();
  assert.equal(r.calls.length, 2);
  assert.equal(r.calls[1].at, deadline);
  assert.equal(r.budget.boundary, madridRefreshWindow(deadline));
  cleanup();
});

test('background wake skips missed days without catch-up requests', async () => {
  const r = runtime(async () => ({ kind: 'failed' }));
  const cleanup = r.mount();
  for (let i = 0; i < 3; i++) await r.fireNext();
  r.advance(4 * 24 * 3600000);
  const resumed = r.now;
  await r.fireNext();
  assert.equal(r.calls.length, 4);
  assert.equal(r.calls[3].at, resumed);
  assert.equal(r.budget.boundary, madridRefreshWindow(resumed));
  assert.equal(r.budget.attempts, 1);
  cleanup();
});

test('an active request crossing noon preserves Retry-After and completion spacing in the new window', async () => {
  for (const advertisedDelay of [20 * 60000, 0]) {
    let finish;
    const r = runtime(() => new Promise(resolve => { finish = resolve; }));
    const next = nextMadridRefreshWindow(boundary);
    // The jitter starts this request 30 seconds before Madrid noon.
    r.advance(next - 32000 - r.now);
    const cleanup = r.mount();
    const pending = r.fireNext();
    assert.equal(r.calls[0].at, next - 30000);
    r.advance(90000);
    const completedAt = r.now;
    finish({ kind: 'failed', retryAt: advertisedDelay ? completedAt + advertisedDelay : 0 });
    await pending;
    assert.equal(r.budget.boundary, next);
    assert.equal(r.budget.attempts, 0, 'old-window request cannot consume the new quota');
    const deadline = completedAt + Math.max(DAILY_REFRESH_RETRY_MS, advertisedDelay);
    assert.equal(r.budget.nextAt, deadline);
    assert.equal(r.nextAt(), deadline);
    assert.equal(r.calls.length, 1, 'crossing noon must not trigger an immediate extra POST');
    cleanup();
    assert.equal(r.timers.size, 0);
  }
});


test('exhausted timers wake at actual DST noon and cleanup removes rollover work', async () => {
  for (const day of ['2026-03-28T11:00:00Z', '2026-10-24T10:00:00Z']) {
    const start = Date.parse(day);
    const r = runtime(async () => ({ kind: 'failed' }));
    r.advance(start + 1000 - r.now);
    r.setLatest({ requestedAt: iso(start - 3600000), provenance: { mode: 'stale-persisted' } });
    const cleanup = r.mount(start);
    for (let i = 0; i < 3; i++) await r.fireNext();
    assert.equal(r.calls.length, 3);
    assert.equal(r.nextAt(), nextMadridRefreshWindow(start));
    cleanup();
    assert.equal(r.timers.size, 0);
  }
});
