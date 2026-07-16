"""Strictly read-only access to persisted deterministic snapshots."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Mapping, Optional
from urllib.parse import quote


class SnapshotStoreUnavailable(RuntimeError):
    """Raised when the persisted snapshot store cannot be read safely."""


class SQLiteSnapshotReader:
    """Read snapshot payloads without creating or modifying the SQLite store."""

    def __init__(self, database_path: str | Path) -> None:
        self.database_path = Path(database_path)

    def _connect(self) -> sqlite3.Connection:
        if not self.database_path.exists() or not self.database_path.is_file():
            raise SnapshotStoreUnavailable("Trusted snapshot store is not available")

        resolved = self.database_path.resolve().as_posix()
        uri = f"file:{quote(resolved, safe='/:')}?mode=ro"
        try:
            connection = sqlite3.connect(uri, uri=True, timeout=5)
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA query_only = ON")
            return connection
        except sqlite3.Error as exc:
            raise SnapshotStoreUnavailable(
                "Trusted snapshot store could not be opened read-only"
            ) from exc

    def _read_one(
        self,
        query: str,
        parameters: tuple[object, ...] = (),
    ) -> Optional[Mapping[str, object]]:
        try:
            with self._connect() as connection:
                row = connection.execute(query, parameters).fetchone()
        except SnapshotStoreUnavailable:
            raise
        except sqlite3.Error as exc:
            raise SnapshotStoreUnavailable(
                "Trusted snapshot store schema is unavailable"
            ) from exc

        if row is None:
            return None

        try:
            payload = json.loads(row["payload_json"])
        except (json.JSONDecodeError, TypeError, KeyError) as exc:
            raise SnapshotStoreUnavailable(
                "Trusted snapshot payload is malformed"
            ) from exc

        if not isinstance(payload, dict):
            raise SnapshotStoreUnavailable("Trusted snapshot payload must be an object")

        stored_snapshot_id = str(row["snapshot_id"])
        payload_snapshot_id = payload.get("snapshot_id")
        if payload_snapshot_id != stored_snapshot_id:
            raise SnapshotStoreUnavailable(
                "Trusted snapshot identifier does not match its persisted payload"
            )

        return payload

    def latest(self) -> Optional[Mapping[str, object]]:
        """Return the newest persisted snapshot without mutating the database."""

        return self._read_one(
            """
            SELECT snapshot_id, payload_json
            FROM analysis_snapshots
            ORDER BY as_of_date DESC, generated_at DESC, snapshot_id DESC
            LIMIT 1
            """
        )

    def get(self, snapshot_id: str) -> Optional[Mapping[str, object]]:
        """Return one immutable snapshot by its stable identifier."""

        return self._read_one(
            """
            SELECT snapshot_id, payload_json
            FROM analysis_snapshots
            WHERE snapshot_id = ?
            LIMIT 1
            """,
            (snapshot_id,),
        )
