# Austrian Business Cycle Monitor

An evidence-first macroeconomic monitor built with Flask, React, TypeScript, FRED, and SQLite.

The public application displays deterministic snapshots derived from official observations. Each indicator includes its observation date, freshness, formula, and primary-source lineage. Missing or stale inputs remain explicit; the application does not manufacture plausible replacement values.

## Sites v25 reference interface

The complete source of the solid ChatGPT Sites version is preserved in [`sites-v25/`](sites-v25/README.md). It contains the bilingual monitor, shared refresh cache, local personal briefing, learning routes, workspace/export APIs, integrity tests, and a one-command Docker path.

- Live application: <https://austrian-business-cycle-monitor.jimblogic.chatgpt.site/>
- Local Docker: `cd sites-v25 && docker compose up --build`
- Native validation: `cd sites-v25 && npm run install:ci && npm test`

The Sites implementation coexists with the trusted Flask/React/FRED pipeline below. It does not delete the deterministic data foundation or rewrite its history.

## Repository map

- `apps/` — Flask API, trusted FRED ingestion, SQLite repositories, and deterministic snapshots.
- `packages/frontend/` — current public React interface for the trusted Flask pipeline.
- `sites-v25/` — reproducible source of the published Sites v25 reference.
- `docs/` — maintained technical, operational, and educational documentation.
- `archive/` — preserved Copilot-era experiments, launchers, reports, and superseded deployment material. Nothing in this directory is part of the supported runtime.

See [the documentation index](docs/INDEX.md) for maintained guidance and [the archive guide](archive/README.md) before reusing historical code.

## Current production path

```text
FRED observations
    ↓
versioned series registry
    ↓
SQLite observation and vintage store
    ↓
deterministic metric registry
    ↓
immutable analytical snapshot
    ↓
read-only Flask API
    ↓
validated bilingual React dashboard
```

The public React entrypoint intentionally does not mount the experimental legacy dashboard. Superseded Copilot-era material is preserved under `archive/` for reference and is excluded from the supported runtime.

## What the public dashboard shows

- Effective federal funds rate.
- 10-year and 2-year Treasury yields.
- Capacity utilisation.
- M2, CPI, industrial production, and total debt annual changes.
- 10Y–2Y Treasury spread.
- An explicitly labelled ex-post real federal funds proxy.
- Snapshot coverage, knowledge date, methodology version, formulas, vintages, and source links.
- Contextual English and Spanish copy.

It does **not** claim to estimate the natural interest rate, predict recessions with certainty, or provide personalised financial advice.

## Local development

### Requirements

- Python 3.11+
- Node.js 20+
- A free FRED API key

### Backend and trusted data

```bash
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt

export FRED_API_KEY="your-real-key"
python -m apps.jobs.ingest_fred
python -m apps.jobs.build_trusted_snapshot
```

### Frontend

```bash
cd packages/frontend
npm ci
npm run dev
```

Vite proxies `/api` to `http://localhost:5002`.

Run the production Flask composition in another terminal:

```bash
python entrypoint.py
```

Open `http://127.0.0.1:8080` for Vite development or `http://127.0.0.1:5002` after building the frontend.

## Production deployment

The supported small-project deployment uses Docker Compose, a persistent SQLite volume, a separate updater process, and Caddy for automatic HTTPS.

```bash
cp .env.production.example .env.production
# Edit DOMAIN, FRED_API_KEY, and SECRET_KEY
docker compose --env-file .env.production -f compose.production.yml up -d --build
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for DNS, verification, updates, and backups.

## Useful commands

```bash
# Backend tests
pytest -q

# Frontend validation
cd packages/frontend
npm ci
npm run type-check
npm run test -- --run
npm run build

# Full production image
docker build -t austrian-cycle-monitor .
```

## API

- `GET /api/health` — liveness response.
- `GET /api/status` — application status.
- `GET /api/trusted-snapshots/latest` — latest persisted deterministic snapshot.
- `GET /api/trusted-snapshots/{snapshot_id}` — immutable snapshot by identifier.

Trusted snapshot routes open SQLite in read-only mode and never call FRED or run calculations during a request.

## Translation policy

The production surface supports English and Spanish. Translation resources are maintained with matching key sets, and every trusted metric has a contextual label and explanation in both languages. Formula notation and provider series identifiers remain unchanged because they are technical evidence rather than prose.

## Persistence and scaling

SQLite is appropriate for one web deployment plus one updater sharing a persistent volume. Do not run multiple updater replicas. Migrate to PostgreSQL before horizontally scaling application workers or scheduled ingestion.

## Security notes

- Keep `.env.production` and API credentials out of Git.
- The container runs as a non-root user.
- Caddy adds HTTPS and baseline browser security headers.
- FRED ingestion runs outside HTTP request handling.
- No generated database or provider credential is committed.

## Licence

See [LICENSE](LICENSE).
