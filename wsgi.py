#!/usr/bin/env python3
"""
WSGI entrypoint for Austrian Business Cycle Monitor.
This exposes the Flask application object as `app` for WSGI servers.
"""
from apps.dashboard.webapp import create_app

# WSGI application
app = create_app()
