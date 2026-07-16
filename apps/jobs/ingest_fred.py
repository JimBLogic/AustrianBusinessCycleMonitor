"""Idempotent CLI for ingesting registered FRED series into SQLite."""
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import asdict
from datetime import date
from pathlib import Path
from typing import Iterable, Sequence

from dotenv import load_dotenv

from apps.data.providers import FredProvider, FredProviderError
from apps.data.registry import SeriesRegistryError, load_series_registry
from apps.data.sqlite_repository import PersistenceStats, SQLiteObservationRepository


def _parse_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            f"Expected an ISO date in YYYY-MM-DD format, got {value!r}"
        ) from exc


def _selected_codes(values: Iterable[str] | None) -> set[str] | None:
    if not values:
        return None
    selected = {
        code.strip()
        for value in values
        for code in value.split(",")
        if code.strip()
    }
    return selected or None


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch trusted observations from FRED and persist them locally."
    )
    parser.add_argument(
        "--registry",
        type=Path,
        default=Path("config/series.yml"),
        help="Path to the versioned YAML series registry.",
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=Path("data/economic_data.sqlite3"),
        help="SQLite database path.",
    )
    parser.add_argument(
        "--series",
        action="append",
        help="Internal series code or comma-separated codes. Repeat as needed.",
    )
    parser.add_argument(
        "--observation-start",
        type=_parse_date,
        help="Optional first observation date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--observation-end",
        type=_parse_date,
        help="Optional last observation date (YYYY-MM-DD).",
    )
    return parser


def run_ingestion(args: argparse.Namespace) -> int:
    load_dotenv()
    api_key = os.getenv("FRED_API_KEY", "").strip()
    if not api_key or api_key == "your_fred_api_key_here":
        print(
            "FRED_API_KEY is required and must not contain the example placeholder.",
            file=sys.stderr,
        )
        return 2

    try:
        registry = load_series_registry(args.registry)
    except SeriesRegistryError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    selected_codes = _selected_codes(args.series)
    if selected_codes:
        unknown = selected_codes.difference(registry)
        if unknown:
            print(
                f"Unknown internal series codes: {', '.join(sorted(unknown))}",
                file=sys.stderr,
            )
            return 2

    definitions = [
        definition
        for code, definition in registry.items()
        if definition.enabled
        and definition.provider == "fred"
        and (selected_codes is None or code in selected_codes)
    ]
    if not definitions:
        print("No enabled FRED series matched the requested selection.", file=sys.stderr)
        return 2

    repository = SQLiteObservationRepository(args.database)
    provider = FredProvider(api_key)
    requested_codes = [definition.internal_code for definition in definitions]
    run_id = repository.start_ingestion("fred", requested_codes)

    totals = PersistenceStats()
    missing_rows = 0
    completed_series = 0
    errors: list[dict[str, str]] = []

    for definition in definitions:
        try:
            result = provider.fetch_series(
                definition,
                observation_start=args.observation_start,
                observation_end=args.observation_end,
            )
            stats = repository.save_fetch_result(
                result,
                ingestion_run_id=run_id,
            )
            totals = PersistenceStats(
                inserted=totals.inserted + stats.inserted,
                updated=totals.updated + stats.updated,
                unchanged=totals.unchanged + stats.unchanged,
            )
            missing_rows += result.missing_observations
            completed_series += 1
        except (FredProviderError, OSError, ValueError) as exc:
            errors.append(
                {
                    "series": definition.internal_code,
                    "error": str(exc),
                    "type": type(exc).__name__,
                }
            )

    if not errors:
        status = "success"
    elif completed_series:
        status = "partial"
    else:
        status = "failed"

    repository.finish_ingestion(
        run_id,
        status=status,
        stats=totals,
        missing_rows=missing_rows,
        error_summary=json.dumps(errors, sort_keys=True) if errors else None,
    )

    summary = {
        "run_id": run_id,
        "provider": "fred",
        "status": status,
        "database": str(args.database),
        "requested_series": requested_codes,
        "completed_series": completed_series,
        "missing_observations": missing_rows,
        "persistence": asdict(totals),
        "errors": errors,
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if status == "success" else 2


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return run_ingestion(args)


if __name__ == "__main__":
    raise SystemExit(main())
