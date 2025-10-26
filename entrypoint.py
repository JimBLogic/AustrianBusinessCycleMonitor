#!/usr/bin/env python3
"""
Production entrypoint.

Decides between running the full dashboard (serves built frontend + rich API)
or the lightweight mock API based on BACKEND_MODE environment variable.

- BACKEND_MODE=webapp (default): serve apps.dashboard.webapp via Waitress
- BACKEND_MODE=mock: serve backend_prod.app via Waitress (mock endpoints)

Environment variables:
- HOST (default 0.0.0.0)
- PORT (default 5002)
"""
import os
import logging
from waitress import serve

try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    # dotenv is optional at runtime; requirements include it, but don't fail if missing
    pass

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

MODE = os.getenv("BACKEND_MODE", "webapp").strip().lower()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5002"))

if MODE == "mock":
    from backend_prod import app
    print("\n=== Starting Mock API (Waitress) ===")
    print(f"Mode: {MODE}  Host: {HOST}  Port: {PORT}")
    serve(app, host=HOST, port=PORT, threads=4)
else:
    from wsgi import app  # apps.dashboard.webapp:create_app()
    print("\n=== Starting Dashboard (Waitress) ===")
    print(f"Mode: {MODE}  Host: {HOST}  Port: {PORT}")
    serve(app, host=HOST, port=PORT, threads=4)
