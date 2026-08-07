import type { SourceDefinition } from "./source-registry";

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const FAILURE_THRESHOLD = 2;
const DEFAULT_COOLDOWN_MS = 5 * 60_000;
const MAX_COOLDOWN_MS = 30 * 60_000;

type CircuitState = {
  failures: number;
  coolingUntil: number;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
  reason: string | null;
};

const circuits = new Map<string, CircuitState>();

function circuit(id: string) {
  const existing = circuits.get(id);
  if (existing) return existing;
  const created: CircuitState = {
    failures: 0,
    coolingUntil: 0,
    lastFailureAt: null,
    lastSuccessAt: null,
    reason: null,
  };
  circuits.set(id, created);
  return created;
}

function retryAfterMs(response: Response | null) {
  const value = response?.headers.get("retry-after");
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(Math.max(seconds * 1_000, 0), MAX_COOLDOWN_MS);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.min(Math.max(date - Date.now(), 0), MAX_COOLDOWN_MS) : 0;
}

function recordSuccess(id: string) {
  const state = circuit(id);
  state.failures = 0;
  state.coolingUntil = 0;
  state.lastSuccessAt = new Date().toISOString();
  state.reason = null;
}

function recordFailure(id: string, reason: string, response: Response | null = null) {
  const state = circuit(id);
  state.failures += 1;
  state.lastFailureAt = new Date().toISOString();
  state.reason = reason;
  if (state.failures >= FAILURE_THRESHOLD) {
    state.coolingUntil = Date.now() + Math.max(DEFAULT_COOLDOWN_MS, retryAfterMs(response));
  }
}

export function getUpstreamHealth() {
  const now = Date.now();
  return [...circuits.entries()].map(([id, state]) => ({
    id,
    status: state.coolingUntil > now ? "cooldown" : state.failures ? "recovering" : "ready",
    failures: state.failures,
    coolingUntil: state.coolingUntil > now ? new Date(state.coolingUntil).toISOString() : null,
    lastFailureAt: state.lastFailureAt,
    lastSuccessAt: state.lastSuccessAt,
    reason: state.reason,
  }));
}

function retryDelayMs(response: Response | null, attempt: number) {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1_000, 2_000);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.min(Math.max(date - Date.now(), 0), 2_000);
  }
  return Math.min(200 * 2 ** attempt, 1_000);
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchUpstream(
  input: string | URL,
  init: RequestInit,
  policy: Pick<SourceDefinition, "id" | "timeoutMs" | "maxAttempts">,
) {
  const state = circuit(policy.id);
  if (state.coolingUntil > Date.now()) {
    throw new Error(`${policy.id} is cooling down after repeated upstream failures`);
  }
  let lastError: unknown = null;
  for (let attempt = 0; attempt < policy.maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), policy.timeoutMs);
    let response: Response | null = null;
    try {
      response = await fetch(input, { ...init, signal: controller.signal });
      if (response.ok) {
        recordSuccess(policy.id);
        return response;
      }
      if (!RETRYABLE_STATUS.has(response.status) || attempt === policy.maxAttempts - 1) {
        recordFailure(policy.id, `HTTP ${response.status}`, response);
        return response;
      }
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (attempt === policy.maxAttempts - 1) {
        recordFailure(policy.id, error instanceof Error ? error.message : "network failure");
        throw error;
      }
    } finally {
      clearTimeout(timer);
    }
    await wait(retryDelayMs(response, attempt));
  }
  throw lastError instanceof Error ? lastError : new Error(`${policy.id} request failed`);
}
