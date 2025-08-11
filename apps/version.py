"""Project version single source of truth.

Import PROJECT_VERSION from this module anywhere you need the application version.
Keeping it isolated prevents duplicate literals and eases future automation
such as tagging or embedding build metadata.
"""
from __future__ import annotations

PROJECT_VERSION: str = "0.1.1"

def get_version() -> str:
    """Return current project version."""
    return PROJECT_VERSION

__all__ = ["PROJECT_VERSION", "get_version"]
