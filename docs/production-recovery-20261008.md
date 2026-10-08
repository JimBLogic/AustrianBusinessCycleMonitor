# Production recovery — 8 October 2026

## Evidence and preserved references

- Production before repair: Sites v83, `9e118841675371efa62d3e5356fcb078c1073735`, immutable saved archive SHA-256 `c2a6e0860fe49e540c6e97165e3a137196d51ba77ad89692d096d50e2a450984`.
- GitHub pre-recovery reference: `backup/pre-production-recovery-20261008` (the GitHub mirror was behind Sites; this is not represented as a v83 backup).
- First demonstrated repaired release: Sites v84, `ff0c3e4cecf87f8fcdcfa8857270161845971131`. Public browser rendered real series, M2 chart, model 52 with 12/14 inputs; repeat API read returned `daily-persisted`, original timestamp `2026-10-08T05:36:43.193Z`.
- Reproducible GitHub backup: `backup/functional-sites-v84-20261008`, commit `4a71b46a524adb20b3f7bba16f96b15a88b846d9`, tree `b68d8d2758cc43f228b4b1496f9182e31731ab2c`.
- No earlier release had sufficient browser evidence in this investigation to call it reliably functional. A build or an API response alone is insufficient.

## Root cause

The snapshot writer and API fast path used `2026-10-02-retain-history-v2`, but the D1 reader accepted only `2026-09-28-quality-v1`. Every newly saved snapshot was rejected on read. Both immediate page loading and per-series last-known-good recovery were therefore bypassed. Live provider calls returned values temporarily; the next page load depended on the entire provider pipeline again. A measured pre-repair `/api/data` call took 34.74 seconds. `/api/health` reported “ok” merely because `SELECT 1` worked.

The earlier transport repair also mattered: Workers rejects `redirect: "error"`; the deployed adapter now uses `manual` and explicitly rejects 3xx, with a real workerd regression test. Production has DB binding `DB`, table `macro_snapshots`, and no FRED/BLS secrets configured. Keyless official CSV is an intentional supported route, not a fabricated feed.

## Data lifecycle after repair

Provider responses use bounded reads, timeouts, an HTTPS allowlist, schema/date/finite-value validation and normalization. Exact-metric backups are considered before durable observations. Compatible snapshots are read using the same shared policy as the writer. A bounded newest-first recovery skips corrupt/empty rows and fills missing independent series from earlier valid rows. Retained observations are marked STALE; missing observations remain unavailable.

The first HTML renders the durable edition. Browser GET and BTC pulse then refresh independently. A partial browser response retains prior series, their dates and explicit stale labels; it does not promote model readiness. Reads can serve persisted data while a POST refresh is in flight. Expired daily editions expose the elapsed daily boundary, not tomorrow's boundary. Public POST retains the server cooldown; user refresh also retains its per-browser cooldown.

Source audit fields are exposed by `/api/health` and the dashboard diagnostics: source, status, last_attempt, last_success, last_valid_value, observation_date, freshness, failure_reason and fallback. Health evaluates stored observations rather than only transport availability. `last_success` means a validated retrieval; observation date remains separate. Legacy snapshots can only supply their known edition timestamp as retrieval evidence.

## Metric identity

- BTC: Coinbase BTC-USD and Kraken XBT/USD spot, consensus checked; never Blockchain network statistics as a replacement spot price.
- S&P 500 and VIX: FRED observations, Cboe corresponding daily close; overlap checked against available primary or prior history. No ETF proxy.
- Baa: BAA10Y spread; alternative DBAA minus DGS10 on identical dates. This shares FRED outage risk and is not an independent provider.
- Treasury 10Y and 2Y: independent DGS10 and DGS2; curve remains T10Y2Y. DBnomics distributes the matching FED H15 series.
- Gold: explicitly World Bank monthly mean per troy ounce. Retired FRED gold is not silently represented as current spot; no PAXG substitution. No second verified equivalent monthly provider is claimed.
- M2/Fed Funds/dollar/industrial production/capacity/WTI: exact FED/EIA series through FRED and DBnomics distribution paths.
- CPI/unemployment: exact seasonally adjusted BLS series as backup.
- Federal debt: FRED quarterly GFDEBTN is USD **millions**. UI converts to trillions by 1,000,000; comparisons with Treasury/M2 use billions. Daily Treasury observations retain their own date and frequency. Annual World Bank debt is not substituted.

## Verification and remaining security gate

Tests cover persisted writer-reader round trip with upstreams disabled; corrupt/empty/partial snapshots; source down with healthy backup; all providers down; corrupt response; actual Worker timeout and redirect behavior; stale daily boundary; manual cooldown; initial HTML with persisted values; browser partial-response retention. No test fixtures are used as production observations.

`npm run build` includes type-check and artifact integrity validation. `node --test tests/*.test.mjs`, `npm run lint`, and `npm audit --json` are the reproducible checks. `scripts/verify-production.mjs` checks real public data and durable health; `--refresh` uses the real POST endpoint.

Dependency updates remove critical and fixable findings without a framework migration. The remaining npm audit findings are the `braces` CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm dependency chain in lint/build tools. npm still returns a failing audit: **do not claim a clean audit**. Upstream latest braces is 3.0.3 with no published patch at verification time. No forced downgrade or advisory suppression is used.

The GitHub workflow refreshes at noon Europe/Madrid (two UTC schedules with a local-hour gate). GitHub scheduling is best-effort, not an exact-time SLA. Browser refresh also recovers an overdue edition. A future successful scheduled run must be observed before claiming daily operation proved across days.

## Production-only concurrent response failure

The v85 post-deployment real POST check caught HTTP 500 after an edition had already been persisted at 11:43:05 UTC. The stack pointed to cloning the globally shared Response. The single-flight cache now shares fully buffered immutable response data, creates a fresh Response per request, and uses Worker waitUntil to protect an in-flight refresh. Delivery failures attempt durable recovery explicitly. This was detected by production verification, not declared successful from unit tests.
