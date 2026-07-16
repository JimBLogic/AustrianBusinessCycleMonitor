"""Build a deterministic snapshot from trusted FRED observations."""

from __future__ import annotations

import argparse
import json
import os
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Sequence

from apps.analysis.registry import MetricRegistry, MetricRegistryError
from apps.analysis.snapshot_builder import SnapshotBuilder
from apps.data.observation_reader import ObservationStoreError, SQLiteObservationReader
from apps.data.snapshot_repository import SQLiteSnapshotRepository

DEFAULT_DATABASE = Path(
    os.environ.get("ECONOMIC_DATA_DB", "data/economic_data.sqlite3")
)
DEFAULT_REGISTRY = Path("config/derived_metrics.yml")


def _parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build a vintage-aware deterministic snapshot from the trusted "
            "economic observation store."
        )
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=DEFAULT_DATABASE,
        help=f"SQLite observation database (default: {DEFAULT_DATABASE})",
    )
    parser.add_argument(
        "--registry",
        type=Path,
        default=DEFAULT_REGISTRY,
        help=f"Derived metric registry (default: {DEFAULT_REGISTRY})",
    )
    parser.add_argument(
        "--as-of",
        type=date.fromisoformat,
        default=date.today(),
        help="Knowledge date in YYYY-MM-DD format (default: today)",
    )
    parser.add_argument(
        "--no-persist",
        action="store_true",
        help="Print the snapshot without storing it in SQLite",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path for a pretty-printed JSON copy",
    )
    return parser.parse_args(argv)


def run(argv: Sequence[str] | None = None) -> int:
    args = _parse_args(argv)

    try:
        registry = MetricRegistry.load(args.registry)
        reader = SQLiteObservationReader(args.database)
        builder = SnapshotBuilder(
            reader,
            registry,
            now_factory=lambda: datetime.now(UTC),
        )
        snapshot = builder.build(as_of_date=args.as_of)
    except (OSError, ValueError, MetricRegistryError, ObservationStoreError) as exc:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "error": str(exc),
                },
                sort_keys=True,
            )
        )
        return 2

    persisted = False
    if not args.no_persist:
        persisted = SQLiteSnapshotRepository(args.database).save(snapshot)

    payload = {
        **snapshot.to_dict(),
        "persisted": persisted,
    }
    rendered = json.dumps(payload, sort_keys=True)
    print(rendered)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(
            json.dumps(payload, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )

    return 3 if snapshot.status == "unavailable" else 0


def main() -> None:
    raise SystemExit(run())


if __name__ == "__main__":
    main()
