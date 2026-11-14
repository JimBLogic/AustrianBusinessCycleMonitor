import { validTimestamp } from './timestamp.mjs';

export const DAILY_REFRESH_MAX_ATTEMPTS = 3;
export const DAILY_REFRESH_RETRY_MS = 5 * 60_000;
const MAX_TIMER_MS = 2_147_483_647;

/** Respect only public API deadlines; never copy provider URLs or errors. */
export function dailyRefreshRetryAt(retryAfter, payload, now = Date.now()) {
  let next = now;
  if (typeof retryAfter === 'string' && retryAfter.trim()) {
    const text = retryAfter.trim();
    const deadline = /^\d+$/.test(text) ? now + Number(text) * 1000 : Date.parse(text);
    if (Number.isFinite(deadline)) next = Math.max(next, deadline);
  }
  const manual = validTimestamp(payload?.cache?.nextManualAt);
  if (manual) next = Math.max(next, manual.getTime());
  for (const upstream of Array.isArray(payload?.upstreams) ? payload.upstreams : []) {
    const cooling = validTimestamp(upstream?.coolingUntil);
    if (cooling) next = Math.max(next, cooling.getTime());
  }
  return next;
}

/**
 * One mounted monitor's budget for one daily edition boundary. Callers retain
 * this object across renders; a response that keeps the same boundary must not
 * reset its attempt count or shorten a deadline.
 */
export function createDailyRefreshBudget() {
  return { boundary: Number.NaN, attempts: 0, nextAt: 0 };
}

// Resolve noon from Madrid calendar fields, including the 23/25-hour DST days.
const madridCalendar = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const madridParts = stamp => Object.fromEntries(madridCalendar.formatToParts(stamp)
  .filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
function madridNoon(year, month, day) {
  const wall = Date.UTC(year, month - 1, day, 12);
  const parts = madridParts(wall);
  return wall - (Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - wall);
}
export function madridRefreshWindow(stamp) {
  const p = madridParts(stamp);
  const today = madridNoon(p.year, p.month, p.day);
  const date = new Date(Date.UTC(p.year, p.month - 1, p.day + (stamp < today ? -1 : 0)));
  return madridNoon(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}
export function nextMadridRefreshWindow(boundary) {
  const p = madridParts(boundary);
  const date = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
  return madridNoon(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Only automatic generation is retried. Quotas are per mounted tab/window. */
export function scheduleDailyRefresh({ boundary, budget, load, readLatest, setTimer, clearTimer, now = Date.now, random = Math.random }) {
  if (!Number.isFinite(boundary)) return () => {};
  const syncWindow = () => {
    const target = Math.max(boundary, madridRefreshWindow(now()), Number.isFinite(budget.boundary) ? budget.boundary : -Infinity);
    if (budget.boundary !== target) {
      budget.boundary = target;
      budget.attempts = 0;
      // A server cooldown remains binding across daily windows.
    }
    return budget.boundary;
  };
  syncWindow();
  let cancelled = false;
  let timer;
  let active;
  const currentEditionExists = () => {
    const data = readLatest();
    const stamp = validTimestamp(data?.requestedAt);
    return data?.provenance?.mode !== 'fallback' && stamp && stamp.getTime() >= budget.boundary;
  };
  const arm = at => {
    if (cancelled) return;
    timer = setTimer(run, Math.max(0, Math.min(MAX_TIMER_MS, at - now())));
  };
  const armNext = () => arm(budget.attempts >= DAILY_REFRESH_MAX_ATTEMPTS
    ? nextMadridRefreshWindow(budget.boundary)
    : Math.max(budget.boundary, budget.nextAt));
  const run = async () => {
    timer = undefined;
    if (cancelled) return;
    syncWindow();
    if (currentEditionExists()) return;
    if (budget.attempts >= DAILY_REFRESH_MAX_ATTEMPTS) { armNext(); return; }
    budget.nextAt = Math.max(budget.nextAt, dailyRefreshRetryAt(null, readLatest(), now()));
    if (now() < Math.max(budget.boundary, budget.nextAt)) { armNext(); return; }
    const requestWindow = budget.boundary;
    budget.attempts++;
    budget.nextAt = Math.max(budget.nextAt, now() + DAILY_REFRESH_RETRY_MS);
    active = new AbortController();
    let result;
    try { result = await load(true, false, active.signal); }
    catch { result = { kind: 'failed', retryAt: 0 }; }
    if (!cancelled) syncWindow();
    // An active request carries its server cooldown and completion spacing
    // across noon; only its attempt belongs to the old window. A cancelled
    // effect may retain deadlines solely for a same-window replacement.
    if (!cancelled || (budget.boundary === requestWindow && madridRefreshWindow(now()) <= requestWindow)) {
      budget.nextAt = Math.max(budget.nextAt, now() + DAILY_REFRESH_RETRY_MS, Number.isFinite(result?.retryAt) ? result.retryAt : 0);
    }
    if (cancelled) return;
    active = undefined;
    if (currentEditionExists()) return;
    const received = validTimestamp(result?.requestedAt);
    if (result?.kind === 'received' && received && received.getTime() >= budget.boundary) return;
    if (result?.kind === 'cancelled' && budget.boundary === requestWindow) return;
    armNext();
  };
  const initial = budget.boundary <= now()
    ? now() + 2_000 + Math.floor(random() * 8_000)
    : now() + Math.max(60_000, budget.boundary - now() + Math.floor(random() * 30_000));
  if (budget.attempts >= DAILY_REFRESH_MAX_ATTEMPTS) armNext();
  else arm(Math.max(initial, budget.nextAt));
  return () => {
    cancelled = true;
    clearTimer(timer);
    active?.abort();
  };
}
