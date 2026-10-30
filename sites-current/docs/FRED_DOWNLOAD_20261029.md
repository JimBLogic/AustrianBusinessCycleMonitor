# FRED mixed-frequency download repair — 29 October 2026

Base: Sites 95, source ff923c6f664b7eaabe80ca35cb827846991f54bb. Candidate release identity 96.

## Confirmed fault

A direct request to the existing official FRED graph download endpoint for DTWEXBGS, INDPRO, TCU, A191RL1Q225SBEA and CFSBCACTIVITYMFG returned HTTP 200, application/zip. The old ingestion decoded the body as text and therefore found no CSV columns. Individual retries/fallbacks could recover some series, but five remained last-known-good in the observed production edition.

Request: https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTWEXBGS,INDPRO,TCU,A191RL1Q225SBEA,CFSBCACTIVITYMFG&cosd=2015-01-01

Observed sample SHA-256: a266c2b9321fbcc77d7b9e98098cba82a31a6dee56132c4468b95a32d55bbcf9. Members: README.txt (1506 bytes), daily.csv (60558), monthly.csv (35246), quarterly.csv (4845). Parsed latest original observations: dollar 2026-10-23 / 121.3202; INDPRO 2026-09-01 / 103.9506; TCU 2026-09-01 / 76.8504; manufacturing 2026-10-01 / 45.4545440674; GDP growth 2026-04-01 / 2.2. These are observed dates, not retrieval timestamps. The downloaded sample remains outside the source/archive.

## Repair

One shared decoder accepts plain CSV and ZIP, preserves per-file frequency/date labels and selects individual series by exact ID. It rejects corrupt/empty payloads, duplicate IDs, invalid IDs, more than 16 members, inputs above 8 MiB and aggregate CSV expansion above 8 MiB. It ignores README and unsafe/non-CSV names and never extracts files to disk. Existing fflate is reused; no dependencies, outbound hosts, credentials, migrations, freshness thresholds, formulas or weights change.

## Validation

221/221 tests pass, zero failed/skipped. Production build, TypeScript and lint pass. New tests cover mixed-frequency/blank cells/zero, plain CSV, corrupt and oversized ZIPs, duplicate IDs and unsafe paths. An actual compiled Worker with isolated D1 ingests and persists the five affected series as validated CSV observations. The new decoder also successfully parsed the actual official sample above.

## Honest remaining limits

A successful code fix does not prove post-release upstream availability. Production recovery must be verified through the regular gated refresh and health response. The gold context remains a monthly World Bank average, not daily LBMA spot; no automatic promotion is introduced. The legacy aggregate health includes a stored daily BTC quote with a 15-minute freshness requirement, separately from the live BTC pulse. Those facts can keep aggregate health DEGRADED even after all macro series are fresh. UPGRADED is not an existing health enum, and no label is fabricated. FRED REST has no configured secret in the observed environment; this keyless CSV repair does not provision one.

Rollback: retain Sites checkpoint 95. No BrangeCycle source, preview process, deployment or data was changed.

## Follow-up V97: revalidation of a previously selected Cboe backup

Production V96 health confirmed macro 18/19 fresh; only VIX was retained, while gold remained disclosed monthly context. A newer Cboe observation could be restored as last-known-good after a fresh but older FRED response even though the live Cboe comparison had matched. Revalidate that previously selected backup only when provider identity matches, comparison status is matched, candidate is fresh and its latest date is at least the retained date. Keep the DEGRADED backup label; never auto-promote it to primary. Divergent comparisons remain STALE and never replace retained values.

222/222 tests pass after this change, including a compiled Worker/D1 test for both matching and divergent live Cboe responses. Build, TypeScript and lint pass. All age thresholds, the thirty-day primary-promotion evidence policy, scoring formulas and cooldowns are unchanged. Production recovery is still subject to the regular fifteen-minute shared refresh gate and must be reported independently from isolated test evidence.
