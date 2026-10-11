# Production deployment

The supported small-project deployment is a single Docker host running three services:

1. `app` serves the built React application and Flask API.
2. `updater` ingests official FRED observations and rebuilds the deterministic snapshot outside HTTP requests.
3. `caddy` terminates HTTPS and proxies the public domain to Flask.

A named Docker volume stores `economic_data.sqlite3`, so restarts and image upgrades do not erase the trusted observation history.

## Requirements

- A Linux server with Docker Engine and the Compose plugin.
- A domain or subdomain pointing to the server.
- TCP ports 80 and 443 open.
- A free FRED API key.

## First deployment

```bash
git clone https://github.com/JimBLogic/AustrianBusinessCycleMonitor.git
cd AustrianBusinessCycleMonitor
cp .env.production.example .env.production
```

Edit `.env.production` and set:

- `DOMAIN` to the public hostname, without `https://`;
- `FRED_API_KEY` to the real provider credential;
- `SECRET_KEY` to a long random value.

Start the stack. The explicit `--env-file` is required because Compose must resolve `DOMAIN` before it starts Caddy:

```bash
docker compose --env-file .env.production -f compose.production.yml up -d --build
```

Inspect its state:

```bash
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs -f app updater caddy
```

Caddy requests and renews the TLS certificate automatically after DNS resolves to the server.

## Verification

```bash
curl -fsS https://YOUR_DOMAIN/api/health
curl -fsS https://YOUR_DOMAIN/api/status
curl -fsS https://YOUR_DOMAIN/api/trusted-snapshots/latest
```

The updater runs immediately and then sleeps for `DATA_REFRESH_SECONDS`. The first snapshot can take a short period to appear because the FRED series are ingested before the deterministic snapshot is built. Until then, the public page displays an explicit pending state rather than substitute values.

## Updating

```bash
git pull
docker compose --env-file .env.production -f compose.production.yml up -d --build
docker image prune -f
```

The `trusted-data` volume is preserved. Create an external backup before major host changes:

```bash
mkdir -p backups
docker run --rm \
  -v austrian-cycle-monitor_trusted-data:/data:ro \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'cp /data/economic_data.sqlite3 /backup/economic_data.sqlite3'
```

## Operational boundaries

- Run one updater against the SQLite volume. Do not scale the updater horizontally.
- The web process reads trusted snapshots in SQLite read-only mode.
- FRED ingestion never runs inside a browser request.
- For multiple application replicas or managed scheduled jobs, migrate persistence to PostgreSQL first.
- Do not deploy the mock backend publicly.

## Platform notes

Stateless platforms are unsuitable for the current SQLite architecture unless they provide a persistent volume mounted at `/app/data`. A small VPS is generally simpler and cheaper than splitting the frontend, API, scheduler, and database across separate free tiers.
