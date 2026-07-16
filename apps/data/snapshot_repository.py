"""Persistence for deterministic analytical snapshots."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Mapping, Optional

from apps.analysis.contracts import DeterministicSnapshot


class SQLiteSnapshotRepository:
    """Store immutable snapshots alongside trusted source observations."""

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
            connection.executescript("""
                CREATE TABLE IF NOT EXISTS analysis_snapshots (
                    snapshot_id TEXT PRIMARY KEY,
                    as_of_date TEXT NOT NULL,
                    methodology_version TEXT NOT NULL,
                    generated_at TEXT NOT NULL,
                    status TEXT NOT NULL,
                    coverage_ratio REAL NOT NULL,
                    available_metrics INTEGER NOT NULL,
                    total_metrics INTEGER NOT NULL,
                    input_fingerprint TEXT NOT NULL,
                    registry_hash TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(as_of_date, methodology_version, input_fingerprint)
                );

                CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_as_of
                    ON analysis_snapshots(as_of_date DESC, generated_at DESC);
                """)

    def save(self, snapshot: DeterministicSnapshot) -> bool:
        """Persist once; return ``True`` only when a new row is inserted."""

        payload = json.dumps(
            snapshot.to_dict(),
            sort_keys=True,
            separators=(",", ":"),
        )
        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT OR IGNORE INTO analysis_snapshots (
                    snapshot_id, as_of_date, methodology_version, generated_at,
                    status, coverage_ratio, available_metrics, total_metrics,
                    input_fingerprint, registry_hash, payload_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    snapshot.snapshot_id,
                    snapshot.as_of_date.isoformat(),
                    snapshot.methodology_version,
                    snapshot.generated_at.isoformat(),
                    snapshot.status,
                    snapshot.coverage_ratio,
                    snapshot.available_metrics,
                    snapshot.total_metrics,
                    snapshot.input_fingerprint,
                    snapshot.registry_hash,
                    payload,
                ),
            )
        return cursor.rowcount == 1

    def get(self, snapshot_id: str) -> Optional[Mapping[str, object]]:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT payload_json
                FROM analysis_snapshots
                WHERE snapshot_id = ?
                """,
                (snapshot_id,),
            ).fetchone()
        return json.loads(row["payload_json"]) if row else None

    def latest(self) -> Optional[Mapping[str, object]]:
        with self._connect() as connection:
            row = connection.execute("""
                SELECT payload_json
                FROM analysis_snapshots
                ORDER BY as_of_date DESC, generated_at DESC
                LIMIT 1
                """).fetchone()
        return json.loads(row["payload_json"]) if row else None

    def count(self) -> int:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT COUNT(*) AS count FROM analysis_snapshots"
            ).fetchone()
        return int(row["count"])
