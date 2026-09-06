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
};

declare global {
  var __ABCM_RUNTIME_ENV__: RuntimeBindings | undefined;
}

let initialization: Promise<void> | null = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS macro_snapshots (
    id TEXT PRIMARY KEY,
    requested_at TEXT NOT NULL,
    refresh_mode TEXT NOT NULL,
    regime TEXT NOT NULL,
    scores_json TEXT NOT NULL,
    metrics_json TEXT NOT NULL,
    provenance_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS macro_snapshots_requested_at_idx ON macro_snapshots (requested_at)",
] as const;

export function getBindings() {
  const runtime = globalThis.__ABCM_RUNTIME_ENV__;
  if (!runtime?.DB) throw new Error("D1 binding DB is unavailable");
  return { db: runtime.DB, fredApiKey: runtime.FRED_API_KEY };
}

export function getRuntimeBindings() {
  return globalThis.__ABCM_RUNTIME_ENV__;
}

export async function ensureDatabase() {
  if (!initialization) {
    initialization = (async () => {
      const { db } = getBindings();
      await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
    })().catch((error) => {
      initialization = null;
      throw error;
    });
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
    if (latest?.requestedAt && Date.now() - new Date(latest.requestedAt).getTime() < 300_000) return;
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
  const row = await db.prepare(
    `SELECT requested_at AS requestedAt, refresh_mode AS refreshMode, regime,
            scores_json AS scoresJson, metrics_json AS metricsJson, provenance_json AS provenanceJson
     FROM macro_snapshots ORDER BY requested_at DESC LIMIT 1`,
  ).first<Record<string, string>>();
  if (!row) return null;
  const metrics = JSON.parse(row.metricsJson);
  const hasUsableMetric = Boolean(metrics?.bitcoin?.price) ||
    Object.values(metrics?.latest ?? {}).some((item) => Number.isFinite((item as { value?: number } | null)?.value));
  if (!hasUsableMetric) return null;
  return {
    requestedAt: row.requestedAt,
    refreshMode: row.refreshMode,
    regime: row.regime,
    scores: JSON.parse(row.scoresJson),
    metrics,
    provenance: JSON.parse(row.provenanceJson),
  };
}
