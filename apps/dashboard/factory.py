"""Application factory that composes legacy dashboard routes with trusted APIs."""

from __future__ import annotations

import os
from pathlib import Path

from flask import Flask

from apps.api import register_trusted_snapshot_routes
from apps.dashboard.webapp import create_app as create_legacy_app

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_DATABASE = Path("data/economic_data.sqlite3")


def resolve_database_path(configured_path: str | Path | None = None) -> Path:
    """Resolve the trusted data store without creating it."""

    raw_path = Path(
        configured_path
        if configured_path is not None
        else os.environ.get("ECONOMIC_DATA_DB", str(_DEFAULT_DATABASE))
    ).expanduser()
    return raw_path if raw_path.is_absolute() else _REPO_ROOT / raw_path


def create_app(*, database_path: str | Path | None = None) -> Flask:
    """Build the production Flask app and register read-only trusted routes."""

    app = create_legacy_app()
    resolved_database = resolve_database_path(database_path)
    app.config["ECONOMIC_DATA_DB"] = str(resolved_database)
    register_trusted_snapshot_routes(app, resolved_database)
    return app
