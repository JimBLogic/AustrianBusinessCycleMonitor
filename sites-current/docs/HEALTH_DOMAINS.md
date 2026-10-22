# Snapshot health: macro series vs persisted Bitcoin quote

The stable `/api/health` response keeps its historical top-level
`data.status`, `data.available`, `data.fresh`, `data.total=20`
and individual `data.indicators` unchanged for API clients.

## Two different freshness domains

- `data.domains.macro`: 19 economic source series. Their age policy
  depends on the source cadence; for the three official FRED quarterly
  series it is measured from **the end of the reference quarter**.
  The exact FRED `observation_date` remains unchanged.
- `data.domains.storedBitcoinQuote`: one BTC/USD spot quote persisted
  with the durable daily macro edition. The quote's independent freshness
  window is **15 minutes**. Therefore it usually reads stale for the
  remainder of the day. `live_endpoint` points to `/api/bitcoin`,
  which has its own timestamp and should be queried separately when
  a visitor actually needs the latest spot. Health must not call a
  cryptocurrency price provider merely to make a macro-health check green.

A stale BTC snapshot is a truthful status, **not** a defect in the
quarterly economic ingestion. Conversely, `data.domains.macro.fresh`
is not equivalent to provider health: a valid observation sourced from
a backup can still carry `DEGRADED` provider status.

The application does not infer missing official debt-to-GDP quarter
values, does not alter the 160-day threshold and never converts a
failed observation into a manufactured on-time release.

Only canonical first-day quarterly labels are accepted for these three series.
Malformed labels and unfinished quarters fail closed. Daily and monthly age
semantics are unchanged. Quarter-end age alone does not prove that the latest
release has been ingested; compare the actual official observation independently.

## Deployment and verification

This source is an **unpublished candidate**, not evidence that the
currently deployed v91 or D1 has changed. After explicit release,
compare the public health response's `data.domains`, real
`reference_period_end`, source dates and `/api/bitcoin` timestamp
without changing the original snapshot or claiming all 20 indicators
are current. Then verify reproducible production snapshots and browser
smoke across desktop/iPhone/Android.
