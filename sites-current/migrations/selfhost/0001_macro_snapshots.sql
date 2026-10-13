-- Self-host baseline, compatible with v86/v88 runtime-created databases.
-- Hosted Sites continues to use its existing immutable Drizzle migrations.
CREATE TABLE IF NOT EXISTS macro_snapshots (
  id TEXT PRIMARY KEY,
  requested_at TEXT NOT NULL,
  refresh_mode TEXT NOT NULL,
  regime TEXT NOT NULL,
  scores_json TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  provenance_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS macro_snapshots_requested_at_idx ON macro_snapshots (requested_at);
