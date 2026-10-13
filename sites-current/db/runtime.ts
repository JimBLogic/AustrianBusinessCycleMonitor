import { recoverSnapshot } from "../lib/snapshot-recovery.mjs";
import { supportedSnapshot } from "../lib/snapshot-policy.mjs";

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
};

export type D1Binding = {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
};

type RuntimeBindings = {
  DB?: D1Binding;
  FRED_API_KEY?: string;
  BLS_API_KEY?: string;
  waitUntil?: (promise:Promise<unknown>) => void;
};

declare global {
  var __ABCM_RUNTIME_ENV__: RuntimeBindings | undefined;
}

const initializations = new WeakMap<D1Binding, Promise<void>>();

export function getBindings() {
  const runtime = globalThis.__ABCM_RUNTIME_ENV__;
  if (!runtime?.DB) throw new Error("D1 binding DB is unavailable");
  return { db: runtime.DB, fredApiKey: runtime.FRED_API_KEY };
}

export function getRuntimeBindings() {
  return globalThis.__ABCM_RUNTIME_ENV__;
}

export async function ensureDatabase() {
  const { db } = getBindings();
  let initialization = initializations.get(db);
  if (!initialization) {
    // Sites applies immutable Drizzle migrations before publication. Self-host
    // applies its own compatible migrations at startup, never during a read.
    initialization = db.prepare(`SELECT id, requested_at, refresh_mode, regime,
      scores_json, metrics_json, provenance_json, created_at
      FROM macro_snapshots LIMIT 0`).all().then(() => undefined).catch((error) => {
      initializations.delete(db);
      throw error;
    });
    initializations.set(db, initialization);
  }
  await initialization;
}

export async function recordMacroSnapshot(snapshot: {
  requestedAt: string;
  refreshMode: string;
  regime: string;
  scores: unknown;
  metrics: unknown;
  provenance: unknown;
}, force: boolean) {
  await ensureDatabase();
  const { db } = getBindings();
  if (!force) {
    const latest = await db.prepare(
      "SELECT requested_at AS requestedAt FROM macro_snapshots ORDER BY requested_at DESC LIMIT 1",
    ).first<{ requestedAt: string }>();
    const age = latest?.requestedAt ? Date.now() - Date.parse(latest.requestedAt) : Number.NaN;
    if (Number.isFinite(age) && age >= 0 && age < 300_000) return;
  }
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO macro_snapshots
      (id, requested_at, refresh_mode, regime, scores_json, metrics_json, provenance_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    snapshot.requestedAt,
    snapshot.refreshMode,
    snapshot.regime,
    JSON.stringify(snapshot.scores),
    JSON.stringify(snapshot.metrics),
    JSON.stringify(snapshot.provenance),
    now,
  ).run();
}

export async function readLatestMacroSnapshot() {
  await ensureDatabase();
  const { db } = getBindings();
  const rows = await db.prepare(
    `SELECT requested_at AS requestedAt, refresh_mode AS refreshMode, regime,
            scores_json AS scoresJson, metrics_json AS metricsJson, provenance_json AS provenanceJson
     FROM macro_snapshots ORDER BY requested_at DESC LIMIT 8`,
  ).all<Record<string, string>>();
  return recoverSnapshot(rows.results);
}

export async function readSourceValidationHistory() {
  await ensureDatabase();
  const { db } = getBindings();
  // Bounded use of the existing requested_at index; no visitor-level data.
  const rows = await db.prepare(`SELECT requested_at AS checkedAt, provenance_json AS provenanceJson
    FROM macro_snapshots ORDER BY requested_at DESC LIMIT 3000`).all<{checkedAt:string;provenanceJson:string}>();
  return rows.results.flatMap(row => {
    try {
      const provenance = JSON.parse(row.provenanceJson);
      if (!supportedSnapshot(provenance) || !Array.isArray(provenance.backupValidation)) return [];
      return [{ checkedAt: row.checkedAt, checks: provenance.backupValidation }];
    } catch { return []; }
  });
}
