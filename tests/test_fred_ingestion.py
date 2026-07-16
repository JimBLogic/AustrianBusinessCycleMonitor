"""Tests for the trusted FRED ingestion vertical slice."""
from __future__ import annotations

import sqlite3
from dataclasses import replace
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

import pytest
import requests

from apps.data.contracts import ProviderFetchResult
from apps.data.providers.fred import FredProvider, FredProviderError
from apps.data.registry import SeriesRegistryError, load_series_registry
from apps.data.sqlite_repository import PersistenceStats, SQLiteObservationRepository


PROJECT_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = PROJECT_ROOT / "config" / "series.yml"


class FakeResponse:
    def __init__(self, payload: Any, status_code: int = 200) -> None:
        self.payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")

    def json(self) -> Any:
        return self.payload


class RecordingSession:
    def __init__(self, payload: Any) -> None:
        self.payload = payload
        self.calls: list[dict[str, Any]] = []

    def get(self, url: str, **kwargs: Any) -> FakeResponse:
        self.calls.append({"url": url, **kwargs})
        return FakeResponse(self.payload)


def _fred_payload() -> dict[str, Any]:
    return {
        "realtime_start": "2026-07-16",
        "realtime_end": "2026-07-16",
        "observations": [
            {
                "realtime_start": "2026-07-16",
                "realtime_end": "2026-07-16",
                "date": "2026-01-01",
                "value": "100.5",
            },
            {
                "realtime_start": "2026-07-16",
                "realtime_end": "2026-07-16",
                "date": "2026-02-01",
                "value": ".",
            },
            {
                "realtime_start": "2026-07-16",
                "realtime_end": "2026-07-16",
                "date": "2026-03-01",
                "value": "102.75",
            },
        ],
    }


def test_registry_loads_verified_unique_fred_series() -> None:
    registry = load_series_registry(REGISTRY_PATH)

    assert registry["us_m2"].provider_series_code == "M2SL"
    assert registry["us_fed_funds_effective"].provider_series_code == "FEDFUNDS"
    assert registry["us_treasury_10y"].frequency == "monthly"
    assert registry["us_total_debt"].frequency == "quarterly"
    assert len({item.provider_series_code for item in registry.values()}) == len(registry)


def test_registry_rejects_duplicate_provider_series(tmp_path: Path) -> None:
    registry_path = tmp_path / "series.yml"
    registry_path.write_text(
        """
version: 1
series:
  first:
    provider: fred
    provider_series_code: DUPLICATE
    name: First
    category: monetary
    geography: US
    frequency: monthly
    unit: Percent
    seasonal_adjustment: none
    transformation: raw
    freshness_sla_days: 30
    source_url: https://example.test/first
  second:
    provider: fred
    provider_series_code: DUPLICATE
    name: Second
    category: credit
    geography: US
    frequency: monthly
    unit: Percent
    seasonal_adjustment: none
    transformation: raw
    freshness_sla_days: 30
    source_url: https://example.test/second
""".strip(),
        encoding="utf-8",
    )

    with pytest.raises(SeriesRegistryError, match="Duplicate provider series"):
        load_series_registry(registry_path)


def test_fred_provider_normalizes_vintages_and_skips_missing_values() -> None:
    definition = load_series_registry(REGISTRY_PATH)["us_m2"]
    session = RecordingSession(_fred_payload())
    provider = FredProvider("test-key", session=session)

    result = provider.fetch_series(
        definition,
        observation_start=date(2026, 1, 1),
    )

    assert result.missing_observations == 1
    assert [item.value for item in result.observations] == [100.5, 102.75]
    assert result.observations[0].observation_date == date(2026, 1, 1)
    assert result.observations[0].vintage_date == date(2026, 7, 16)
    assert result.observations[0].retrieved_at.tzinfo is UTC
    assert len(result.source_payload_hash) == 64
    assert session.calls[0]["params"]["series_id"] == "M2SL"
    assert session.calls[0]["params"]["observation_start"] == "2026-01-01"
    assert session.calls[0]["timeout"] == 15.0


def test_fred_provider_rejects_missing_key_and_invalid_payload() -> None:
    with pytest.raises(ValueError, match="API key"):
        FredProvider(" ")

    definition = load_series_registry(REGISTRY_PATH)["us_m2"]
    provider = FredProvider("test-key", session=RecordingSession({"unexpected": []}))
    with pytest.raises(FredProviderError, match="observations list"):
        provider.fetch_series(definition)


def test_sqlite_repository_is_idempotent_and_preserves_vintages(
    tmp_path: Path,
) -> None:
    definition = load_series_registry(REGISTRY_PATH)["us_m2"]
    provider = FredProvider("test-key", session=RecordingSession(_fred_payload()))
    original = provider.fetch_series(definition)
    repository = SQLiteObservationRepository(tmp_path / "economic.sqlite3")
    run_id = repository.start_ingestion("fred", [definition.internal_code])

    first = repository.save_fetch_result(original, ingestion_run_id=run_id)
    second = repository.save_fetch_result(original, ingestion_run_id=run_id)

    assert first == PersistenceStats(inserted=2, updated=0, unchanged=0)
    assert second == PersistenceStats(inserted=0, updated=0, unchanged=2)
    assert repository.count_observations(definition.internal_code) == 2

    first_observation = original.observations[0]
    corrected_same_vintage = replace(
        first_observation,
        value=101.0,
        retrieved_at=datetime.now(UTC),
        source_payload_hash="a" * 64,
    )
    corrected_result = ProviderFetchResult(
        definition=definition,
        observations=(corrected_same_vintage,),
        retrieved_at=corrected_same_vintage.retrieved_at,
        missing_observations=0,
        source_payload_hash="b" * 64,
    )
    corrected_stats = repository.save_fetch_result(
        corrected_result,
        ingestion_run_id=run_id,
    )
    assert corrected_stats == PersistenceStats(inserted=0, updated=1, unchanged=0)

    later_vintage = replace(
        first_observation,
        value=101.25,
        vintage_date=date(2026, 8, 1),
        realtime_end=date(2026, 8, 1),
        retrieved_at=datetime.now(UTC),
        source_payload_hash="c" * 64,
    )
    later_result = ProviderFetchResult(
        definition=definition,
        observations=(later_vintage,),
        retrieved_at=later_vintage.retrieved_at,
        missing_observations=0,
        source_payload_hash="d" * 64,
    )
    later_stats = repository.save_fetch_result(later_result, ingestion_run_id=run_id)

    assert later_stats == PersistenceStats(inserted=1, updated=0, unchanged=0)
    assert repository.count_observations(definition.internal_code) == 3

    repository.finish_ingestion(
        run_id,
        status="success",
        stats=PersistenceStats(inserted=3, updated=1, unchanged=2),
        missing_rows=1,
    )
    with sqlite3.connect(tmp_path / "economic.sqlite3") as connection:
        status = connection.execute(
            "SELECT status FROM ingestion_runs WHERE id = ?", (run_id,)
        ).fetchone()[0]
    assert status == "success"
