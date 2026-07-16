# Deterministic Trusted Snapshots

This layer converts persisted FRED observations into reproducible analytical
snapshots without using the legacy randomized cycle engine.

## Reproducibility policy

Every snapshot has an explicit `as_of_date`. For each observation date the
reader selects the latest vintage whose FRED realtime start is on or before
that date. A revision published later is excluded from historical snapshots.

The snapshot identifier is derived from:

- the as-of date;
- the metric-registry version and file hash;
- calculated values and availability states;
- the exact source observation dates, vintages and payload hashes.

Running the same methodology against the same inputs therefore produces the
same snapshot ID, even when the command is executed later.

## Metrics

`config/derived_metrics.yml` currently declares:

- effective federal funds rate;
- 10-year and 2-year Treasury rates;
- capacity utilization;
- M2 year-over-year growth;
- CPI year-over-year inflation;
- industrial-production year-over-year growth;
- total-debt year-over-year growth;
- 10-year minus 2-year Treasury spread;
- an ex-post real federal-funds-rate proxy.

Growth rates require an exact 12-month aligned observation. The system does not
interpolate a missing lag or silently substitute the nearest date.

The real-rate metric is deliberately named a **proxy**. It subtracts
contemporaneous year-over-year CPI inflation from the effective federal funds
rate. It is not a natural-rate estimate and must not be presented as one.

## Availability and freshness

Each metric is one of:

- `available`: all required observations exist and meet source freshness SLAs;
- `stale`: the formula is valid but at least one current input exceeds its SLA;
- `unavailable`: metadata, observations, exact alignment or a valid denominator
  is missing.

Historical lag observations do not make a growth rate stale. Freshness is
measured from the current observation used by the metric.

Snapshot status is:

- `complete` when all metrics are available;
- `degraded` when at least one metric exists but one or more are stale or
  unavailable;
- `unavailable` when no metric can be calculated.

## Build a snapshot

First ingest trusted observations:

```bash
python -m apps.jobs.ingest_fred
```

Then build and persist a snapshot:

```bash
python -m apps.jobs.build_trusted_snapshot
```

Historical reconstruction:

```bash
python -m apps.jobs.build_trusted_snapshot --as-of 2025-01-31
```

Write a human-readable JSON copy as well as the SQLite row:

```bash
python -m apps.jobs.build_trusted_snapshot \
  --output data/snapshots/latest.json
```

Build without persisting:

```bash
python -m apps.jobs.build_trusted_snapshot --no-persist
```

The database path can be changed with `--database` or `ECONOMIC_DATA_DB`.

## Persistence

Snapshots are stored in `analysis_snapshots` inside the same SQLite database as
the source observations. The unique key combines as-of date, methodology
version and input fingerprint. Re-running unchanged inputs is idempotent.

The complete payload includes metric formula, status, freshness, reason and
source lineage. It is suitable for later API exposure without querying FRED
inside a web request.

## Exit codes

- `0`: complete or degraded snapshot built successfully;
- `2`: invalid configuration, registry or observation store;
- `3`: the snapshot was built but every metric is unavailable.

## Intentional boundaries

This layer does not:

- classify Austrian cycle phases;
- generate an Austrian risk score;
- infer causality from correlations;
- call external providers from Flask;
- mutate or depend on the legacy randomized monitor;
- claim that a deterministic formula is universally agreed economic truth.

The next integration step is a read-only API for the latest persisted trusted
snapshot, followed by a UI that labels methodology, freshness and unavailable
data explicitly.
