"""Regression tests for deterministic, vintage-aware trusted snapshots."""

from __future__ import annotations

from datetime import UTC, date, datetime
from pathlib import Path

import pytest

from apps.analysis.registry import MetricRegistry, MetricRegistryError
from apps.analysis.snapshot_builder import SnapshotBuilder
from apps.data.contracts import (
    NormalizedObservation,
    ProviderFetchResult,
    SeriesDefinition,
)
from apps.data.observation_reader import SQLiteObservationReader
from apps.data.snapshot_repository import SQLiteSnapshotRepository
from apps.data.sqlite_repository import SQLiteObservationRepository

RETRIEVED_AT = datetime(2025, 2, 1, 12, 0, tzinfo=UTC)
AS_OF = date(2025, 2, 1)


def _definition(
    internal_code: str,
    *,
    provider_series_code: str,
    frequency: str = "monthly",
    unit: str = "Percent",
    freshness_sla_days: int = 45,
) -> SeriesDefinition:
    return SeriesDefinition(
        internal_code=internal_code,
        provider="fred",
        provider_series_code=provider_series_code,
        name=internal_code,
        category="test",
        geography="US",
        frequency=frequency,
        unit=unit,
        seasonal_adjustment="seasonally_adjusted",
        transformation="raw",
        freshness_sla_days=freshness_sla_days,
        source_url=f"https://fred.stlouisfed.org/series/{provider_series_code}",
        enabled=True,
        notes="test fixture",
    )


def _observation(
    definition: SeriesDefinition,
    observation_date: date,
    value: float,
    *,
    vintage_date: date = date(2025, 1, 15),
    hash_suffix: str = "",
) -> NormalizedObservation:
    return NormalizedObservation(
        internal_code=definition.internal_code,
        provider_series_code=definition.provider_series_code,
        observation_date=observation_date,
        value=value,
        vintage_date=vintage_date,
        realtime_end=date(9999, 12, 31),
        retrieved_at=RETRIEVED_AT,
        source_url=definition.source_url,
        source_payload_hash=f"hash-{definition.internal_code}-{observation_date}-{vintage_date}{hash_suffix}",
    )


def _save(
    repository: SQLiteObservationRepository,
    definition: SeriesDefinition,
    observations: list[NormalizedObservation],
) -> None:
    repository.save_fetch_result(
        ProviderFetchResult(
            definition=definition,
            observations=tuple(observations),
            retrieved_at=RETRIEVED_AT,
            missing_observations=0,
            source_payload_hash=f"payload-{definition.internal_code}",
        )
    )


def _seed_complete_database(database: Path) -> None:
    repository = SQLiteObservationRepository(database)

    m2 = _definition(
        "us_m2",
        provider_series_code="M2SL",
        unit="Billions of U.S. Dollars",
    )
    cpi = _definition(
        "us_cpi_all_urban",
        provider_series_code="CPIAUCSL",
        unit="Index",
    )
    fed = _definition(
        "us_fed_funds_effective",
        provider_series_code="FEDFUNDS",
        freshness_sla_days=40,
    )
    treasury_10y = _definition(
        "us_treasury_10y",
        provider_series_code="GS10",
        freshness_sla_days=40,
    )
    treasury_2y = _definition(
        "us_treasury_2y",
        provider_series_code="GS2",
        freshness_sla_days=40,
    )
    debt = _definition(
        "us_total_debt",
        provider_series_code="TCMDO",
        frequency="quarterly",
        unit="Millions of U.S. Dollars",
        freshness_sla_days=120,
    )
    industrial = _definition(
        "us_industrial_production",
        provider_series_code="INDPRO",
        unit="Index",
    )
    capacity = _definition(
        "us_capacity_utilization",
        provider_series_code="TCU",
    )

    _save(
        repository,
        m2,
        [
            _observation(m2, date(2024, 1, 1), 100.0),
            _observation(
                m2,
                date(2025, 1, 1),
                109.0,
                vintage_date=date(2025, 1, 10),
                hash_suffix="-early",
            ),
            _observation(
                m2,
                date(2025, 1, 1),
                110.0,
                vintage_date=date(2025, 1, 20),
                hash_suffix="-known",
            ),
            _observation(
                m2,
                date(2025, 1, 1),
                111.0,
                vintage_date=date(2025, 2, 10),
                hash_suffix="-future",
            ),
        ],
    )
    _save(
        repository,
        cpi,
        [
            _observation(cpi, date(2024, 1, 1), 200.0),
            _observation(cpi, date(2025, 1, 1), 210.0),
        ],
    )
    _save(repository, fed, [_observation(fed, date(2025, 1, 1), 5.25)])
    _save(
        repository,
        treasury_10y,
        [_observation(treasury_10y, date(2025, 1, 1), 4.5)],
    )
    _save(
        repository,
        treasury_2y,
        [_observation(treasury_2y, date(2025, 1, 1), 4.0)],
    )
    _save(
        repository,
        debt,
        [
            _observation(debt, date(2024, 1, 1), 1000.0),
            _observation(debt, date(2025, 1, 1), 1200.0),
        ],
    )
    _save(
        repository,
        industrial,
        [
            _observation(industrial, date(2024, 1, 1), 100.0),
            _observation(industrial, date(2025, 1, 1), 102.0),
        ],
    )
    _save(
        repository,
        capacity,
        [_observation(capacity, date(2025, 1, 1), 78.5)],
    )


def test_registry_loads_versioned_metrics() -> None:
    registry = MetricRegistry.load("config/derived_metrics.yml")

    assert registry.version == "2026-07-16.1"
    assert len(registry.metrics) == 10
    assert registry.metrics["m2_yoy_pct"].parameters["lag_months"] == 12
    assert len(registry.registry_hash) == 64


def test_registry_rejects_unknown_method(tmp_path: Path) -> None:
    path = tmp_path / "metrics.yml"
    path.write_text(
        """
version: 1
metrics:
  bad:
    name: Bad
    unit: percent
    method: intuition
    required_series: [us_m2]
    description: Not deterministic.
""",
        encoding="utf-8",
    )

    with pytest.raises(MetricRegistryError, match="unsupported method"):
        MetricRegistry.load(path)


def test_snapshot_formulas_and_vintage_policy(tmp_path: Path) -> None:
    database = tmp_path / "economic.sqlite3"
    _seed_complete_database(database)
    registry = MetricRegistry.load("config/derived_metrics.yml")
    builder = SnapshotBuilder(
        SQLiteObservationReader(database),
        registry,
        now_factory=lambda: datetime(2025, 2, 1, 13, 0, tzinfo=UTC),
    )

    snapshot = builder.build(as_of_date=AS_OF)
    metrics = {metric.code: metric for metric in snapshot.metrics}

    assert snapshot.status == "complete"
    assert snapshot.coverage_ratio == 1.0
    assert metrics["m2_yoy_pct"].value == pytest.approx(10.0)
    assert metrics["cpi_yoy_pct"].value == pytest.approx(5.0)
    assert metrics["industrial_production_yoy_pct"].value == pytest.approx(2.0)
    assert metrics["total_debt_yoy_pct"].value == pytest.approx(20.0)
    assert metrics["yield_curve_10y_2y_spread_pp"].value == pytest.approx(0.5)
    assert metrics["real_fed_funds_proxy_pp"].value == pytest.approx(0.25)
    assert metrics["capacity_utilization_pct"].value == pytest.approx(78.5)

    m2_lineage = metrics["m2_yoy_pct"].lineage
    assert m2_lineage[-1].value == 110.0
    assert m2_lineage[-1].vintage_date == date(2025, 1, 20)
    assert all(point.vintage_date <= AS_OF for point in m2_lineage)


def test_missing_exact_lag_is_unavailable_not_interpolated(tmp_path: Path) -> None:
    database = tmp_path / "economic.sqlite3"
    repository = SQLiteObservationRepository(database)
    m2 = _definition("us_m2", provider_series_code="M2SL")
    _save(repository, m2, [_observation(m2, date(2025, 1, 1), 110.0)])

    registry_path = tmp_path / "metrics.yml"
    registry_path.write_text(
        """
version: 1
metrics:
  m2_yoy_pct:
    name: M2 YoY
    unit: percent
    method: percent_change
    required_series: [us_m2]
    parameters:
      lag_months: 12
    description: Strict aligned annual change.
""",
        encoding="utf-8",
    )
    snapshot = SnapshotBuilder(
        SQLiteObservationReader(database),
        MetricRegistry.load(registry_path),
    ).build(as_of_date=AS_OF)

    metric = snapshot.metrics[0]
    assert snapshot.status == "unavailable"
    assert metric.status == "unavailable"
    assert metric.value is None
    assert "No exact 12-month aligned pair" in (metric.reason or "")


def test_stale_status_uses_current_observation_not_lag_point(tmp_path: Path) -> None:
    database = tmp_path / "economic.sqlite3"
    repository = SQLiteObservationRepository(database)
    m2 = _definition(
        "us_m2",
        provider_series_code="M2SL",
        freshness_sla_days=45,
    )
    _save(
        repository,
        m2,
        [
            _observation(m2, date(2024, 1, 1), 100.0),
            _observation(m2, date(2025, 1, 1), 110.0),
        ],
    )
    registry_path = tmp_path / "metrics.yml"
    registry_path.write_text(
        """
version: 1
metrics:
  m2_yoy_pct:
    name: M2 YoY
    unit: percent
    method: percent_change
    required_series: [us_m2]
    parameters:
      lag_months: 12
    description: Strict aligned annual change.
""",
        encoding="utf-8",
    )
    builder = SnapshotBuilder(
        SQLiteObservationReader(database),
        MetricRegistry.load(registry_path),
    )

    fresh = builder.build(as_of_date=date(2025, 2, 1)).metrics[0]
    stale = builder.build(as_of_date=date(2025, 3, 1)).metrics[0]

    assert fresh.status == "available"
    assert fresh.freshness_days == 31
    assert stale.status == "stale"
    assert stale.freshness_days == 59


def test_snapshot_persistence_is_idempotent(tmp_path: Path) -> None:
    database = tmp_path / "economic.sqlite3"
    _seed_complete_database(database)
    registry = MetricRegistry.load("config/derived_metrics.yml")
    builder = SnapshotBuilder(
        SQLiteObservationReader(database),
        registry,
        now_factory=lambda: datetime(2025, 2, 1, 13, 0, tzinfo=UTC),
    )
    snapshot = builder.build(as_of_date=AS_OF)
    snapshots = SQLiteSnapshotRepository(database)

    assert snapshots.save(snapshot) is True
    assert snapshots.save(snapshot) is False
    assert snapshots.count() == 1
    assert snapshots.get(snapshot.snapshot_id)["input_fingerprint"] == (
        snapshot.input_fingerprint
    )
    assert snapshots.latest()["snapshot_id"] == snapshot.snapshot_id
