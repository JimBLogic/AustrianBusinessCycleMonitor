"""ABCM Package
Unified Austrian Business Cycle Monitor package.
Provides high-level application factory and exports core monitor classes.
Gradual migration layer wrapping existing consolidated implementation in main_application.py
"""
from .app import create_app, get_monitor

__all__ = ["create_app", "get_monitor"]
