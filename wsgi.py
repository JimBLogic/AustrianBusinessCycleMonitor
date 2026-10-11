#!/usr/bin/env python3
"""WSGI entrypoint for Austrian Business Cycle Monitor."""

from apps.dashboard.factory import create_app

# WSGI application composed from the legacy dashboard and trusted read APIs.
app = create_app()
