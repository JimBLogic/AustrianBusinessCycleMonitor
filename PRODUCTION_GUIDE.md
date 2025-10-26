# Production Guide - Austrian Business Cycle Monitor

This guide outlines how to run the project in a production-ready way using either Docker or a local Python/Node toolchain.

## Option A: Docker (recommended)

1) Build image

```powershell
# From project root
docker build -t abcm:latest .
```

2) Run container (with secrets)

```powershell
# Do not bake secrets into images. Pass them at runtime:
docker run --rm -p 5002:5002 \
	-e BACKEND_MODE=webapp \
	-e FRED_API_KEY="<your_fred_api_key>" \
	abcm:latest
```

3) Open dashboard

- http://localhost:5002

Notes:
- The image builds the frontend (Vite) and serves the built assets and API via Waitress on port 5002.
- Healthcheck verifies /api/status.

## Option B: Local production (Windows)

1) Build frontend and start backend with Waitress

```powershell
# One command
.\START_PROD.ps1
```

2) Open dashboard

- http://127.0.0.1:5002

## Configuration

- BACKEND_MODE: `webapp` (default) serves full dashboard; `mock` serves mock endpoints.
- HOST: listen address (default `0.0.0.0` in Docker; `127.0.0.1` locally).
- PORT: HTTP port (default 5002).

## Deployment checklist

- [x] WSGI entrypoint (`wsgi.py`) for standard WSGI servers
- [x] Production entrypoint (`entrypoint.py`) with Waitress
- [x] Vite proxy used only in dev; production serves static files from Flask app
- [x] Healthcheck configured in Dockerfile
- [x] Requirements include Waitress
- [x] Start scripts for local production and dev

## Troubleshooting

- Blank screen: ensure you’re using `START_PROD.ps1` (serves built frontend) or run the Vite dev server for development.
- API errors: check that port 5002 is listening and `/api/status` returns 200.
- Docker healthcheck failing: `docker logs` and hit `/api/status` inside container.
