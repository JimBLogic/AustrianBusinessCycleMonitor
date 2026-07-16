"""Vintage-aware read model over the trusted SQLite observation store."""
from __future__ import annotations

import sqlite3
from datetime import date, datetime
from pathlib import Path
from typing import Dict, Mapping, Optional, Tuple

from apps.analysis.contracts import ObservationPoint
from apps.data.contracts import SeriesDefinition


class ObservationStoreError(RuntimeError):
    """Raised when the trusted observation store is missing or malformed."""


class SQLiteObservationReader:
    """Read observations exactly as they were knowable on a given date."""

    def __init__(self, database_path: str | Path) -> None:
        self.database_path = Path(database_path)

    def _connect(self) -> sqlite3.Connection:
        if not self.database_path.exists():
            raise ObservationStoreError(
                f"Trusted observation database does not exist: {self.database_path}"
            )
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def series_definition(self, internal_code: str) -> Optional[SeriesDefinition]:
        try:
            with self._connect() as connection:
                row = connection.execute(
                    """
                    SELECT *
                    FROM series_catalog
                    WHERE internal_code = ? AND enabled = 1
                    """,
                    (internal_code,),
                ).fetchone()
        except sqlite3.Error as exc:
            raise ObservationStoreError(
                f"Could not read series catalog from {self.database_path}: {exc}"
            ) from exc

        if row is None:
            return None
        return SeriesDefinition(
            internal_code=row["internal_code"],
            provider=row["provider"],
            provider_series_code=row["provider_series_code"],
            name=row["name"],
            category=row["category"],
            geography=row["geography"],
            frequency=row["frequency"],
            unit=row["unit"],
            seasonal_adjustment=row["seasonal_adjustment"],
            transformation=row["transformation"],
            freshness_sla_days=int(row["freshness_sla_days"]),
            source_url=row["source_url"],
            enabled=bool(row["enabled"]),
            notes=row["notes"],
        )

    def observations_as_known(
        self,
        internal_code: str,
        *,
        as_of_date: date,
    ) -> Tuple[ObservationPoint, ...]:
        """Select the latest available vintage for each observation date.

        Both the observation date and FRED realtime/vintage start must be on or
        before ``as_of_date``. Future revisions are therefore excluded from
        historical reconstructions.
        """

        try:
            with self._connect() as connection:
                rows = connection.execute(
                    """
                    WITH ranked AS (
                        SELECT
                            internal_code,
                            observation_date,
                            value,
                            vintage_date,
                            retrieved_at,
                            source_url,
                            source_payload_hash,
                            ROW_NUMBER() OVER (
                                PARTITION BY internal_code, observation_date
                                ORDER BY vintage_date DESC, retrieved_at DESC, id DESC
                            ) AS vintage_rank
                        FROM observations
                        WHERE internal_code = ?
                          AND observation_date <= ?
                          AND vintage_date <= ?
                    )
                    SELECT *
                    FROM ranked
                    WHERE vintage_rank = 1
                    ORDER BY observation_date ASC
                    """,
                    (
                        internal_code,
                        as_of_date.isoformat(),
                        as_of_date.isoformat(),
                    ),
                ).fetchall()
        except sqlite3.Error as exc:
            raise ObservationStoreError(
                f"Could not read observations from {self.database_path}: {exc}"
            ) from exc

        return tuple(
            ObservationPoint(
                internal_code=row["internal_code"],
                observation_date=date.fromisoformat(row["observation_date"]),
                value=float(row["value"]),
                vintage_date=date.fromisoformat(row["vintage_date"]),
                retrieved_at=datetime.fromisoformat(row["retrieved_at"]),
                source_url=row["source_url"],
                source_payload_hash=row["source_payload_hash"],
            )
            for row in rows
        )

    def load_required_series(
        self,
        internal_codes: Tuple[str, ...],
        *,
        as_of_date: date,
    ) -> Tuple[
        Mapping[str, SeriesDefinition],
        Mapping[str, Tuple[ObservationPoint, ...]],
    ]:
        definitions: Dict[str, SeriesDefinition] = {}
        observations: Dict[str, Tuple[ObservationPoint, ...]] = {}
        for internal_code in sorted(set(internal_codes)):
            definition = self.series_definition(internal_code)
            if definition is not None:
                definitions[internal_code] = definition
            observations[internal_code] = self.observations_as_known(
                internal_code,
                as_of_date=as_of_date,
            )
        return definitions, observations
