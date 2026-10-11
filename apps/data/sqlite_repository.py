"""SQLite persistence for normalized economic observations."""
from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable, Optional

from .contracts import ProviderFetchResult, SeriesDefinition


@dataclass(frozen=True, slots=True)
class PersistenceStats:
    inserted: int = 0
    updated: int = 0
    unchanged: int = 0


class SQLiteObservationRepository:
    """Small durable store suitable for local use and deterministic tests."""

    def __init__(self, database_path: str | Path) -> None:
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        return connection

    def _initialize_schema(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS series_catalog (
                    internal_code TEXT PRIMARY KEY,
                    provider TEXT NOT NULL,
                    provider_series_code TEXT NOT NULL,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    geography TEXT NOT NULL,
                    frequency TEXT NOT NULL,
                    unit TEXT NOT NULL,
                    seasonal_adjustment TEXT NOT NULL,
                    transformation TEXT NOT NULL,
                    freshness_sla_days INTEGER NOT NULL,
                    source_url TEXT NOT NULL,
                    enabled INTEGER NOT NULL,
                    notes TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(provider, provider_series_code)
                );

                CREATE TABLE IF NOT EXISTS ingestion_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider TEXT NOT NULL,
                    requested_series_json TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    finished_at TEXT,
                    status TEXT NOT NULL,
                    inserted_rows INTEGER NOT NULL DEFAULT 0,
                    updated_rows INTEGER NOT NULL DEFAULT 0,
                    unchanged_rows INTEGER NOT NULL DEFAULT 0,
                    missing_rows INTEGER NOT NULL DEFAULT 0,
                    error_summary TEXT
                );

                CREATE TABLE IF NOT EXISTS observations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    internal_code TEXT NOT NULL,
                    provider_series_code TEXT NOT NULL,
                    observation_date TEXT NOT NULL,
                    value REAL NOT NULL,
                    vintage_date TEXT NOT NULL,
                    realtime_end TEXT NOT NULL,
                    retrieved_at TEXT NOT NULL,
                    last_seen_at TEXT NOT NULL,
                    source_url TEXT NOT NULL,
                    source_payload_hash TEXT NOT NULL,
                    ingestion_run_id INTEGER,
                    FOREIGN KEY(internal_code) REFERENCES series_catalog(internal_code),
                    FOREIGN KEY(ingestion_run_id) REFERENCES ingestion_runs(id),
                    UNIQUE(internal_code, observation_date, vintage_date)
                );

                CREATE INDEX IF NOT EXISTS idx_observations_series_date
                    ON observations(internal_code, observation_date DESC);
                CREATE INDEX IF NOT EXISTS idx_observations_vintage
                    ON observations(internal_code, vintage_date DESC);
                CREATE INDEX IF NOT EXISTS idx_ingestion_runs_provider_started
                    ON ingestion_runs(provider, started_at DESC);
                """
            )

    def upsert_series(self, definition: SeriesDefinition) -> None:
        now = datetime.now(UTC).isoformat()
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO series_catalog (
                    internal_code, provider, provider_series_code, name, category,
                    geography, frequency, unit, seasonal_adjustment, transformation,
                    freshness_sla_days, source_url, enabled, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(internal_code) DO UPDATE SET
                    provider = excluded.provider,
                    provider_series_code = excluded.provider_series_code,
                    name = excluded.name,
                    category = excluded.category,
                    geography = excluded.geography,
                    frequency = excluded.frequency,
                    unit = excluded.unit,
                    seasonal_adjustment = excluded.seasonal_adjustment,
                    transformation = excluded.transformation,
                    freshness_sla_days = excluded.freshness_sla_days,
                    source_url = excluded.source_url,
                    enabled = excluded.enabled,
                    notes = excluded.notes,
                    updated_at = excluded.updated_at
                """,
                (
                    definition.internal_code,
                    definition.provider,
                    definition.provider_series_code,
                    definition.name,
                    definition.category,
                    definition.geography,
                    definition.frequency,
                    definition.unit,
                    definition.seasonal_adjustment,
                    definition.transformation,
                    definition.freshness_sla_days,
                    definition.source_url,
                    int(definition.enabled),
                    definition.notes,
                    now,
                    now,
                ),
            )

    def start_ingestion(self, provider: str, requested_series: Iterable[str]) -> int:
        started_at = datetime.now(UTC).isoformat()
        requested = sorted(set(requested_series))
        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO ingestion_runs (
                    provider, requested_series_json, started_at, status
                ) VALUES (?, ?, ?, 'running')
                """,
                (provider, json.dumps(requested), started_at),
            )
            return int(cursor.lastrowid)

    def finish_ingestion(
        self,
        run_id: int,
        *,
        status: str,
        stats: PersistenceStats,
        missing_rows: int,
        error_summary: Optional[str] = None,
    ) -> None:
        if status not in {"success", "partial", "failed"}:
            raise ValueError(f"Invalid ingestion status: {status}")
        with self._connect() as connection:
            cursor = connection.execute(
                """
                UPDATE ingestion_runs
                SET finished_at = ?, status = ?, inserted_rows = ?, updated_rows = ?,
                    unchanged_rows = ?, missing_rows = ?, error_summary = ?
                WHERE id = ?
                """,
                (
                    datetime.now(UTC).isoformat(),
                    status,
                    stats.inserted,
                    stats.updated,
                    stats.unchanged,
                    missing_rows,
                    error_summary,
                    run_id,
                ),
            )
            if cursor.rowcount != 1:
                raise ValueError(f"Unknown ingestion run id: {run_id}")

    def save_fetch_result(
        self,
        result: ProviderFetchResult,
        *,
        ingestion_run_id: Optional[int] = None,
    ) -> PersistenceStats:
        self.upsert_series(result.definition)
        inserted = 0
        updated = 0
        unchanged = 0

        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            for observation in result.observations:
                key = (
                    observation.internal_code,
                    observation.observation_date.isoformat(),
                    observation.vintage_date.isoformat(),
                )
                existing = connection.execute(
                    """
                    SELECT value, realtime_end, source_payload_hash
                    FROM observations
                    WHERE internal_code = ? AND observation_date = ? AND vintage_date = ?
                    """,
                    key,
                ).fetchone()

                if existing is None:
                    connection.execute(
                        """
                        INSERT INTO observations (
                            internal_code, provider_series_code, observation_date, value,
                            vintage_date, realtime_end, retrieved_at, last_seen_at,
                            source_url, source_payload_hash, ingestion_run_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            observation.internal_code,
                            observation.provider_series_code,
                            observation.observation_date.isoformat(),
                            observation.value,
                            observation.vintage_date.isoformat(),
                            observation.realtime_end.isoformat(),
                            observation.retrieved_at.isoformat(),
                            observation.retrieved_at.isoformat(),
                            observation.source_url,
                            observation.source_payload_hash,
                            ingestion_run_id,
                        ),
                    )
                    inserted += 1
                    continue

                changed = (
                    float(existing["value"]) != observation.value
                    or existing["realtime_end"] != observation.realtime_end.isoformat()
                    or existing["source_payload_hash"]
                    != observation.source_payload_hash
                )
                if changed:
                    connection.execute(
                        """
                        UPDATE observations
                        SET provider_series_code = ?, value = ?, realtime_end = ?,
                            retrieved_at = ?, last_seen_at = ?, source_url = ?,
                            source_payload_hash = ?, ingestion_run_id = ?
                        WHERE internal_code = ? AND observation_date = ? AND vintage_date = ?
                        """,
                        (
                            observation.provider_series_code,
                            observation.value,
                            observation.realtime_end.isoformat(),
                            observation.retrieved_at.isoformat(),
                            observation.retrieved_at.isoformat(),
                            observation.source_url,
                            observation.source_payload_hash,
                            ingestion_run_id,
                            *key,
                        ),
                    )
                    updated += 1
                else:
                    connection.execute(
                        """
                        UPDATE observations
                        SET last_seen_at = ?, ingestion_run_id = ?
                        WHERE internal_code = ? AND observation_date = ? AND vintage_date = ?
                        """,
                        (observation.retrieved_at.isoformat(), ingestion_run_id, *key),
                    )
                    unchanged += 1

        return PersistenceStats(
            inserted=inserted,
            updated=updated,
            unchanged=unchanged,
        )

    def count_observations(self, internal_code: Optional[str] = None) -> int:
        with self._connect() as connection:
            if internal_code is None:
                row = connection.execute(
                    "SELECT COUNT(*) AS count FROM observations"
                ).fetchone()
            else:
                row = connection.execute(
                    "SELECT COUNT(*) AS count FROM observations WHERE internal_code = ?",
                    (internal_code,),
                ).fetchone()
        return int(row["count"])

    def latest_observation(self, internal_code: str) -> Optional[sqlite3.Row]:
        with self._connect() as connection:
            return connection.execute(
                """
                SELECT * FROM observations
                WHERE internal_code = ?
                ORDER BY observation_date DESC, vintage_date DESC
                LIMIT 1
                """,
                (internal_code,),
            ).fetchone()
