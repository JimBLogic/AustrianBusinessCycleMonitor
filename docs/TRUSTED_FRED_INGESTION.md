# Trusted FRED ingestion foundation

This module is the first persistent, provider-neutral data path for the Austrian Business Cycle Monitor. It is intentionally separate from the legacy dashboard analysis until its contracts are stable and reviewed.

## Guarantees

- Uses the official FRED `series/observations` REST endpoint.
- Requires `FRED_API_KEY`; no demo value is substituted when the key or provider is unavailable.
- Loads series metadata from the versioned `config/series.yml` registry.
- Skips FRED's `.` missing-value marker instead of converting it to zero.
- Stores observation date, vintage date, realtime end, retrieval timestamp, source URL and payload hash.
- Is idempotent for repeated ingestion of the same observation and vintage.
- Preserves a new vintage as a separate row.
- Records ingestion status and row counts.

## Local setup

Copy the example environment file and insert a real FRED API key:

```bash
cp .env.example .env
```

Install the existing project dependencies:

```bash
python -m pip install -r requirements.txt
```

## Ingest all enabled FRED series

```bash
python -m apps.jobs.ingest_fred
```

The default database is:

```text
data/economic_data.sqlite3
```

Local database files and SQLite sidecars are ignored by Git.

## Select series or a date range

```bash
python -m apps.jobs.ingest_fred \
  --series us_m2,us_fed_funds_effective \
  --observation-start 2000-01-01
```

Use a custom registry or database:

```bash
python -m apps.jobs.ingest_fred \
  --registry config/series.yml \
  --database /persistent/volume/economic_data.sqlite3
```

## Exit behaviour

- `0`: every requested series completed successfully.
- `2`: invalid configuration, missing credentials, unknown series, partial ingestion or failed ingestion.

The command prints a JSON summary suitable for cron logs or later workflow ingestion reports. It never prints the FRED API key.

## Database tables

### `series_catalog`

Stores declared provider metadata, units, frequency, seasonal adjustment, transformation and freshness SLA.

### `observations`

Uses `(internal_code, observation_date, vintage_date)` as its natural uniqueness constraint. Repeated identical observations are counted as unchanged; same-vintage corrections update the existing row; later vintages are retained separately.

### `ingestion_runs`

Tracks requested series, start/end times, status, inserted/updated/unchanged/missing counts and a compact error summary.

## Current limitations

- SQLite is the local and single-instance persistence option. A production multi-worker deployment should move the same contracts to PostgreSQL before scheduled cloud ingestion.
- This foundation does not yet replace the legacy randomized macro analysis or expose observations through Flask.
- No scheduler is bundled into the web process. The CLI is designed to be invoked independently by cron, systemd timers, a container job or a future GitHub workflow connected to durable storage.
- Transformations and Austrian-cycle scoring are deliberately out of scope. The persisted values are raw provider observations.
