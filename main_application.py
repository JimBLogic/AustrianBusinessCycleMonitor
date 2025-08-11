"""Deprecated legacy entrypoint (minimal stub).

This file used to host the monolithic `AustrianBusinessCycleMonitor` class.
The canonical implementation now lives in `apps.dashboard.webapp.AustrianDashboard`.

Kept intentionally as a thin compatibility shim to avoid breakage for any
external references that may still import `main_application`. It logs a clear
deprecation warning and exposes a tiny subset: `create_app()` returning the
Flask app and `AustrianBusinessCycleMonitor` symbol aliasing the modern class.

All new development should import from:

    from apps.dashboard.webapp import AustrianDashboard

This stub can be removed once downstream consumers have migrated.
"""
from __future__ import annotations
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

from apps.dashboard.webapp import AustrianDashboard as _AustrianDashboard
from typing import Protocol, Any, runtime_checkable
try:  # Optional import typing aid
    from flask import Flask as _RealFlask
except Exception:  # pragma: no cover
    _RealFlask = None  # type: ignore

@runtime_checkable
class _FlaskLike(Protocol):  # minimal protocol for static checker
    def run(self, *args: Any, **kwargs: Any) -> Any: ...  # pragma: no cover - interface only

logger = logging.getLogger(__name__)

class AustrianBusinessCycleMonitor(_AustrianDashboard):  # type: ignore[misc]
    """Alias to new implementation with a deprecation notice."""
    def __init__(self, *args, **kwargs):  # pragma: no cover - thin shim
        logger.warning(
            "DEPRECATED: `AustrianBusinessCycleMonitor` from main_application.py is a shim. "
            "Use `apps.dashboard.webapp.AustrianDashboard` instead."
        )
        super().__init__(*args, **kwargs)
        # Ensure host/port attributes exist for legacy code paths
        if not hasattr(self, 'host'):
            self.host = '127.0.0.1'
        if not hasattr(self, 'port'):
            self.port = 5002

def create_app(*args, **kwargs):  # pragma: no cover - simple passthrough
    return AustrianBusinessCycleMonitor(*args, **kwargs).app

__all__ = [
    "AustrianBusinessCycleMonitor",
    "create_app",
]

if __name__ == "__main__":  # pragma: no cover
    logger.warning(
        "Running deprecated main_application.py directly. Launching modern dashboard server..."
    )
    monitor = AustrianBusinessCycleMonitor()
    sock = getattr(monitor, "socketio", None)
    app_obj = getattr(monitor, 'app', None)
    # Determine if app_obj satisfies Flask-like interface
    is_flask = isinstance(app_obj, _RealFlask) if _RealFlask is not None else isinstance(app_obj, _FlaskLike)
    if sock is not None and is_flask:
        sock.run(app_obj, host=monitor.host, port=monitor.port, debug=False)  # type: ignore[arg-type]
    elif is_flask:
        app_obj.run(host=monitor.host, port=monitor.port, debug=False)  # type: ignore[call-arg]
    else:  # pragma: no cover - extreme edge case
        logger.error("No Flask app instance available to run (cannot start server).")
