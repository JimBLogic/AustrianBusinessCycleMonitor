# Trusted Snapshot Read API

The trusted snapshot API exposes deterministic snapshots that have already been
built and persisted by the offline analysis job. HTTP requests never call FRED,
recalculate metrics, start schedulers, or invoke the legacy randomized analysis
engine.

## Runtime composition

The production WSGI application is created by `apps.dashboard.factory`:

```text
legacy dashboard Flask app
+ trusted snapshot read blueprint
= production WSGI app
```

The snapshot database is selected with:

```bash
ECONOMIC_DATA_DB=data/economic_data.sqlite3
```

Relative paths are resolved from the repository root. The reader opens SQLite
with `mode=ro` and `PRAGMA query_only=ON`; a missing database is not created by
a GET request.

## Endpoints

### `GET /api/trusted-snapshots/latest`

Returns the persisted snapshot with the newest `as_of_date`, then
`generated_at`, then stable `snapshot_id`.

Successful responses use:

```http
Cache-Control: private, max-age=30, must-revalidate
ETag: "<snapshot_id>"
```

### `GET /api/trusted-snapshots/{snapshot_id}`

Returns one immutable snapshot. Identifiers must contain exactly 24 lowercase
hexadecimal characters.

Successful responses use:

```http
Cache-Control: private, max-age=31536000, immutable
ETag: "<snapshot_id>"
```

Both endpoints support `If-None-Match` and return `304 Not Modified` when the
ETag matches.

## Success contract

```json
{
  "data": {
    "snapshot_id": "0123456789abcdef01234567",
    "as_of_date": "2026-07-16",
    "methodology_version": "2026-07-16.1",
    "status": "complete",
    "coverage_ratio": 1.0,
    "metrics": {}
  },
  "meta": {
    "contract_version": "1.0",
    "read_only": true,
    "source": "trusted_snapshot_store"
  }
}
```

The `data` object is the persisted snapshot payload. The API does not rewrite
values, add interpretations, or mask unavailable metrics.

## Error contract

```json
{
  "error": {
    "code": "snapshot_store_unavailable",
    "message": "Trusted snapshot store is unavailable.",
    "retryable": true
  },
  "meta": {
    "contract_version": "1.0",
    "read_only": true,
    "source": "trusted_snapshot_store"
  }
}
```

Possible statuses:

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `invalid_snapshot_id` | Identifier format is invalid. |
| 404 | `snapshot_not_found` | No latest snapshot exists or the requested ID is absent. |
| 503 | `snapshot_store_unavailable` | Database, schema, or payload cannot be read safely. |

Error responses use `Cache-Control: no-store` and never expose the configured
filesystem path.

## Operational sequence

```bash
# 1. Ingest official observations
python -m apps.jobs.ingest_fred

# 2. Build and persist the deterministic snapshot
python -m apps.jobs.build_trusted_snapshot

# 3. Start the production application
python entrypoint.py

# 4. Read the latest persisted result
curl -i http://127.0.0.1:5002/api/trusted-snapshots/latest
```

A scheduler or workflow should execute steps 1 and 2. The web server only
performs step 4.

## Deliberate boundaries

This API does not:

- generate a cycle phase or investment recommendation;
- refresh external providers;
- write to SQLite;
- expose the legacy `/api/dashboard-snapshot` contract;
- claim that monthly or quarterly macroeconomic data is real-time.
