"""Contract tests for the read-only trusted snapshot API."""

from __future__ import annotations

import sqlite3
from datetime import UTC, date, datetime
from pathlib import Path

from flask import Flask

from apps.analysis.contracts import DeterministicSnapshot, MetricResult
from apps.api import register_trusted_snapshot_routes
from apps.dashboard.factory import resolve_database_path
from apps.data.snapshot_repository import SQLiteSnapshotRepository


def _app(database_path: Path) -> Flask:
    app = Flask(__name__)
    app.config["TESTING"] = True
    register_trusted_snapshot_routes(app, database_path)
    return app


def _snapshot(
    snapshot_id: str,
    *,
    as_of_date: date,
    generated_at: datetime,
    value: float,
) -> DeterministicSnapshot:
    metric = MetricResult(
        code="m2_yoy_pct",
        name="M2 year-over-year growth",
        unit="percent",
        value=value,
        status="available",
        observation_date=as_of_date,
        freshness_days=0,
        formula="((us_m2[t] / us_m2[t-12m]) - 1) * 100",
        reason=None,
        lineage=(),
    )
    return DeterministicSnapshot(
        snapshot_id=snapshot_id,
        as_of_date=as_of_date,
        methodology_version="test-v1",
        generated_at=generated_at,
        status="complete",
        coverage_ratio=1.0,
        available_metrics=1,
        total_metrics=1,
        input_fingerprint="f" * 64,
        registry_hash="e" * 64,
        metrics=(metric,),
    )


def test_missing_store_returns_503_without_creating_database(tmp_path: Path) -> None:
    database = tmp_path / "missing.sqlite3"
    client = _app(database).test_client()

    response = client.get("/api/trusted-snapshots/latest")

    assert response.status_code == 503
    assert response.get_json()["error"]["code"] == "snapshot_store_unavailable"
    assert response.headers["Cache-Control"] == "no-store"
    assert not database.exists()


def test_invalid_snapshot_id_is_rejected_before_store_access(tmp_path: Path) -> None:
    database = tmp_path / "missing.sqlite3"
    client = _app(database).test_client()

    response = client.get("/api/trusted-snapshots/NOT-A-SNAPSHOT")

    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "invalid_snapshot_id"
    assert response.get_json()["error"]["retryable"] is False
    assert not database.exists()


def test_empty_snapshot_store_returns_404(tmp_path: Path) -> None:
    database = tmp_path / "economic.sqlite3"
    SQLiteSnapshotRepository(database)
    client = _app(database).test_client()

    response = client.get("/api/trusted-snapshots/latest")

    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "snapshot_not_found"


def test_latest_snapshot_is_newest_and_supports_conditional_get(tmp_path: Path) -> None:
    database = tmp_path / "economic.sqlite3"
    repository = SQLiteSnapshotRepository(database)
    repository.save(
        _snapshot(
            "a" * 24,
            as_of_date=date(2025, 1, 1),
            generated_at=datetime(2025, 1, 2, tzinfo=UTC),
            value=2.0,
        )
    )
    repository.save(
        _snapshot(
            "b" * 24,
            as_of_date=date(2025, 2, 1),
            generated_at=datetime(2025, 2, 2, tzinfo=UTC),
            value=3.0,
        )
    )
    client = _app(database).test_client()

    response = client.get("/api/trusted-snapshots/latest")

    assert response.status_code == 200
    assert response.get_json()["data"]["snapshot_id"] == "b" * 24
    assert response.get_json()["meta"] == {
        "contract_version": "1.0",
        "read_only": True,
        "source": "trusted_snapshot_store",
    }
    assert response.headers["Cache-Control"] == "private, max-age=30, must-revalidate"

    conditional = client.get(
        "/api/trusted-snapshots/latest",
        headers={"If-None-Match": response.headers["ETag"]},
    )
    assert conditional.status_code == 304


def test_snapshot_by_id_is_immutable_and_missing_id_is_404(tmp_path: Path) -> None:
    database = tmp_path / "economic.sqlite3"
    repository = SQLiteSnapshotRepository(database)
    snapshot_id = "c" * 24
    repository.save(
        _snapshot(
            snapshot_id,
            as_of_date=date(2025, 3, 1),
            generated_at=datetime(2025, 3, 2, tzinfo=UTC),
            value=4.0,
        )
    )
    client = _app(database).test_client()

    response = client.get(f"/api/trusted-snapshots/{snapshot_id}")

    assert response.status_code == 200
    assert response.get_json()["data"]["snapshot_id"] == snapshot_id
    assert response.headers["Cache-Control"] == (
        "private, max-age=31536000, immutable"
    )

    conditional = client.get(
        f"/api/trusted-snapshots/{snapshot_id}",
        headers={"If-None-Match": response.headers["ETag"]},
    )
    assert conditional.status_code == 304

    missing = client.get(f"/api/trusted-snapshots/{'d' * 24}")
    assert missing.status_code == 404
    assert missing.get_json()["error"]["code"] == "snapshot_not_found"


def test_missing_snapshot_schema_returns_503(tmp_path: Path) -> None:
    database = tmp_path / "wrong-schema.sqlite3"
    with sqlite3.connect(database) as connection:
        connection.execute("CREATE TABLE unrelated (id INTEGER PRIMARY KEY)")

    response = _app(database).test_client().get("/api/trusted-snapshots/latest")

    assert response.status_code == 503
    assert response.get_json()["error"]["code"] == "snapshot_store_unavailable"


def test_relative_database_path_resolves_from_repository_root() -> None:
    resolved = resolve_database_path("data/custom.sqlite3")

    assert resolved.is_absolute()
    assert resolved.as_posix().endswith("/data/custom.sqlite3")
