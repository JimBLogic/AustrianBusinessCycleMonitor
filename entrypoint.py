#!/usr/bin/env python3
"""Serve the maintained Flask application with Waitress.

Only the evidence-first web application is supported. Historical mock endpoints
are preserved under archive/ for reference and cannot be selected at runtime.
"""

import logging
import os

from waitress import serve

try:
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()
except Exception:
    pass

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

mode = os.getenv("BACKEND_MODE", "webapp").strip().lower()
if mode != "webapp":
    raise RuntimeError("BACKEND_MODE must be 'webapp'; historical mock mode is retired")

host = os.getenv("HOST", "0.0.0.0")
port = int(os.getenv("PORT", "5002"))

from wsgi import app

print("\n=== Starting Austrian Business Cycle Monitor (Waitress) ===")
print(f"Mode: {mode}  Host: {host}  Port: {port}")
serve(app, host=host, port=port, threads=4)
