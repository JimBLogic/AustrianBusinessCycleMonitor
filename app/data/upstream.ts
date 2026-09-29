import { boundedBody, validateTransportBody, retryAfterMilliseconds } from "@/lib/upstream-policy.mjs";
import type { SourceDefinition } from "./source-registry";
import { essentialServerUrl } from "@/lib/network-policy";

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const FAILURE_THRESHOLD = 2;
const DEFAULT_COOLDOWN_MS = 5 * 60_000;
const MAX_COOLDOWN_MS = 30 * 60_000;

type CircuitState = {
  failures: number;
  attempts: number;
  successes: number;
  totalLatencyMs: number;
  lastLatencyMs: number | null;
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
    attempts: 0, successes: 0, totalLatencyMs: 0, lastLatencyMs: null,
    coolingUntil: 0,
    lastFailureAt: null,
    lastSuccessAt: null,
    reason: null,
  };
  circuits.set(id, created);
  return created;
}

function retryAfterMs(response: Response | null) {
  return retryAfterMilliseconds(response?.headers.get("retry-after"));
}

function recordSuccess(id: string, latencyMs: number) {
  const state = circuit(id);
  state.failures = 0;
  state.successes += 1;
  state.lastLatencyMs = latencyMs;
  state.totalLatencyMs += latencyMs;
  state.coolingUntil = 0;
  state.lastSuccessAt = new Date().toISOString();
  state.reason = null;
}

function recordFailure(id: string, reason: string, response: Response | null = null) {
  const state = circuit(id);
  state.failures += 1;
  state.lastFailureAt = new Date().toISOString();
  state.reason = reason;
  if ((state.failures >= FAILURE_THRESHOLD && (!response || RETRYABLE_STATUS.has(response.status))) || [401,403,429].includes(response?.status ?? 0)) {
    state.coolingUntil = Date.now() + Math.max(DEFAULT_COOLDOWN_MS, retryAfterMs(response));
  }
}

export function getUpstreamHealth() {
  const now = Date.now();
  return [...circuits.entries()].map(([id, state]) => ({
    id,
    status: state.coolingUntil > now ? "cooldown" : state.failures ? "recovering" : "ready",
    failures: state.failures,
    attempts: state.attempts,
    successes: state.successes,
    lastLatencyMs: state.lastLatencyMs,
    meanSuccessLatencyMs: state.successes ? Math.round(state.totalLatencyMs / state.successes) : null,
    scope: "current-worker-isolate-transport",
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
  return Math.min(200 * 2 ** attempt + Math.floor(Math.random() * 150), 1_000);
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
    state.attempts += 1;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), policy.timeoutMs);
    let response: Response | null = null;
    try {
      response = await fetch(essentialServerUrl(input), { ...init, redirect: "error", signal: controller.signal });
      if (response.ok) {
        const body = await boundedBody(response);
        validateTransportBody(body, new Headers(init.headers).get("Accept") ?? "");
        recordSuccess(policy.id, Date.now() - started);
        const headers = new Headers(response.headers);
        headers.delete("content-encoding"); headers.delete("content-length");
        return new Response(body, {status: response.status, statusText: response.statusText, headers});
      }
      if (!RETRYABLE_STATUS.has(response.status) || attempt === policy.maxAttempts - 1 || retryAfterMilliseconds(response.headers.get("retry-after")) > 2_000) {
        recordFailure(policy.id, `HTTP ${response.status}`, response);
        return response;
      }
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (attempt === policy.maxAttempts - 1) {
        recordFailure(policy.id, error instanceof Error && /body exceeds|Invalid JSON|Unexpected HTML/.test(error.message) ? error.message : "timeout or network failure");
        throw new Error(`${policy.id}: timeout, invalid payload or network failure`);
      }
    } finally {
      clearTimeout(timer);
    }
    await wait(retryDelayMs(response, attempt));
  }
  throw lastError instanceof Error ? lastError : new Error(`${policy.id} request failed`);
}
