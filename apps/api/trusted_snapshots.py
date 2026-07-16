"""Read-only Flask routes for persisted deterministic snapshots."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Mapping

from flask import Blueprint, Flask, Response, jsonify, request

from apps.data.snapshot_reader import SQLiteSnapshotReader, SnapshotStoreUnavailable

SNAPSHOT_ID_PATTERN = re.compile(r"^[0-9a-f]{24}$")
CONTRACT_VERSION = "1.0"


def _error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    retryable: bool,
) -> tuple[Response, int]:
    response = jsonify(
        {
            "error": {
                "code": code,
                "message": message,
                "retryable": retryable,
            },
            "meta": {
                "contract_version": CONTRACT_VERSION,
                "read_only": True,
                "source": "trusted_snapshot_store",
            },
        }
    )
    response.headers["Cache-Control"] = "no-store"
    return response, status_code


def _snapshot_response(
    payload: Mapping[str, object],
    *,
    immutable: bool,
) -> Response:
    snapshot_id = str(payload["snapshot_id"])
    response = jsonify(
        {
            "data": payload,
            "meta": {
                "contract_version": CONTRACT_VERSION,
                "read_only": True,
                "source": "trusted_snapshot_store",
            },
        }
    )
    response.set_etag(snapshot_id)
    response.make_conditional(request)
    response.headers["Cache-Control"] = (
        "private, max-age=31536000, immutable"
        if immutable
        else "private, max-age=30, must-revalidate"
    )
    return response


def create_trusted_snapshot_blueprint(database_path: str | Path) -> Blueprint:
    """Create a blueprint bound to one explicit persisted snapshot store."""

    reader = SQLiteSnapshotReader(database_path)
    blueprint = Blueprint(
        "trusted_snapshots",
        __name__,
        url_prefix="/api/trusted-snapshots",
    )

    @blueprint.get("/latest")
    def latest_snapshot() -> Response | tuple[Response, int]:
        try:
            payload = reader.latest()
        except SnapshotStoreUnavailable:
            return _error_response(
                status_code=503,
                code="snapshot_store_unavailable",
                message="Trusted snapshot store is unavailable.",
                retryable=True,
            )

        if payload is None:
            return _error_response(
                status_code=404,
                code="snapshot_not_found",
                message="No trusted snapshots have been persisted.",
                retryable=True,
            )

        return _snapshot_response(payload, immutable=False)

    @blueprint.get("/<snapshot_id>")
    def snapshot_by_id(snapshot_id: str) -> Response | tuple[Response, int]:
        if SNAPSHOT_ID_PATTERN.fullmatch(snapshot_id) is None:
            return _error_response(
                status_code=400,
                code="invalid_snapshot_id",
                message="Snapshot identifiers must contain 24 lowercase hexadecimal characters.",
                retryable=False,
            )

        try:
            payload = reader.get(snapshot_id)
        except SnapshotStoreUnavailable:
            return _error_response(
                status_code=503,
                code="snapshot_store_unavailable",
                message="Trusted snapshot store is unavailable.",
                retryable=True,
            )

        if payload is None:
            return _error_response(
                status_code=404,
                code="snapshot_not_found",
                message="The requested trusted snapshot does not exist.",
                retryable=False,
            )

        return _snapshot_response(payload, immutable=True)

    return blueprint


def register_trusted_snapshot_routes(
    app: Flask,
    database_path: str | Path,
) -> None:
    """Register the trusted snapshot API exactly once on a Flask app."""

    if "trusted_snapshots" in app.blueprints:
        return
    app.register_blueprint(create_trusted_snapshot_blueprint(database_path))
