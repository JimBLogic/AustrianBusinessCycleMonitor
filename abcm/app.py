"""ABCM migration shim.

This module previously wrapped ``main_application.AustrianBusinessCycleMonitor``.
The project has been simplified: the canonical implementation now lives in
``apps.dashboard.webapp.AustrianDashboard``. We expose a compatible surface so
legacy import paths (``from abcm import create_app, get_monitor``) continue to
work without modification.
"""
from __future__ import annotations
from typing import Any
from apps.dashboard.webapp import AustrianDashboard

_dashboard_instance: AustrianDashboard | None = None

def get_monitor() -> AustrianDashboard:  # backwards-compatible name
    global _dashboard_instance
    if _dashboard_instance is None:
        _dashboard_instance = AustrianDashboard()
    return _dashboard_instance

def create_app(*_, **__) -> Any:
    """Return underlying Flask app (Flask instance) for WSGI servers."""
    return get_monitor().app

__all__ = ["create_app", "get_monitor", "AustrianDashboard"]
