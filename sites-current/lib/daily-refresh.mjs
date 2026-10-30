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

/**
 * Only automatic generation is retried. The server remains the shared gate;
 * this per-mounted-tab budget is not a cross-tab or cross-reload quota.
 */
export function scheduleDailyRefresh({ boundary, budget, load, readLatest, setTimer, clearTimer, now = Date.now, random = Math.random }) {
  if (!Number.isFinite(boundary)) return () => {};
  if (budget.boundary !== boundary) {
    budget.boundary = boundary;
    budget.attempts = 0;
    budget.nextAt = 0;
  }
  let cancelled = false;
  let timer;
  let active;
  const currentEditionExists = () => {
    const data = readLatest();
    const stamp = validTimestamp(data?.requestedAt);
    return data?.provenance?.mode !== 'fallback' && stamp && stamp.getTime() >= boundary;
  };
  const arm = at => {
    if (cancelled || budget.attempts >= DAILY_REFRESH_MAX_ATTEMPTS) return;
    timer = setTimer(run, Math.max(0, Math.min(MAX_TIMER_MS, at - now())));
  };
  const run = async () => {
    timer = undefined;
    if (cancelled || budget.attempts >= DAILY_REFRESH_MAX_ATTEMPTS || currentEditionExists()) return;
    // A concurrent manual read or BTC pulse may advertise a later provider
    // deadline while this timer is already armed. Never shorten that deadline.
    budget.nextAt = Math.max(budget.nextAt, dailyRefreshRetryAt(null, readLatest(), now()));
    if (now() < Math.max(boundary, budget.nextAt)) {
      arm(Math.max(boundary, budget.nextAt));
      return;
    }
    budget.attempts++;
    // Keep spacing even if a render tears down this effect during the request.
    budget.nextAt = Math.max(budget.nextAt, now() + DAILY_REFRESH_RETRY_MS);
    active = new AbortController();
    let result;
    try {
      result = await load(true, false, active.signal);
    } catch {
      result = { kind: 'failed', retryAt: 0 };
    }
    // Cleanup may already have mounted another effect for this same boundary.
    // Preserve the completed request's spacing/deadline for that replacement,
    // but never mutate the budget of a different daily window.
    if (budget.boundary === boundary) {
      budget.nextAt = Math.max(budget.nextAt, now() + DAILY_REFRESH_RETRY_MS, Number.isFinite(result?.retryAt) ? result.retryAt : 0);
    }
    if (cancelled) return;
    active = undefined;
    if (result?.kind === 'cancelled' || currentEditionExists()) return;
    const received = validTimestamp(result?.requestedAt);
    if (result?.kind === 'received' && received && received.getTime() >= boundary) return;
    arm(budget.nextAt);
  };
  const initial = boundary <= now()
    ? now() + 2_000 + Math.floor(random() * 8_000)
    : now() + Math.max(60_000, boundary - now() + Math.floor(random() * 30_000));
  arm(Math.max(initial, budget.nextAt));
  return () => {
    cancelled = true;
    clearTimer(timer);
    active?.abort();
  };
}
