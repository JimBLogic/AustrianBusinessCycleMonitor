# Source and Bitcoin audit — 9 October 2026

Scope: static review of maintained Site checkout at commit `07156d3c3c8e4d34d3a0c39644531aa4037c5524` (v86), targeted local reproductions and official provider documentation. No production mutation, live provider availability assertion, or checkout edits. Paths below are relative to `abcm/`. Status in the matrix describes the implementation, not today's live health.

## Confirmed defects, smallest changes, regression cases

### P1 — Corrupt optional Bitcoin history can abort the full refresh

Observed `app/api/data/route.ts:975–980` calls `new Date(item.x * 1000).toISOString()` before validating x. Local reproduction with `{x:'bad',y:80000}` throws `RangeError: Invalid time value`. Optional enrichment can therefore fail all freshly fetched macro delivery. Outer GET recovery can return a stored edition but does not make this safe processing.

Small fix: schema-validate each row/timestamp before Date construction; isolate enrichment parser errors; normalize candidate first and select it only when usable, otherwise retain previous history with its original timestamp and STALE provenance. Regression: invalid x, null row, missing x, empty values, mixed valid/invalid, all-invalid; each must leave good macro inputs usable.

### P1 — BTC/debt enrichment can discard last-known-good on empty or older arrays

Observed `route.ts:975–988`: array presence chooses the new branch, even if normalized points are empty; an older but valid array also replaces newer history. This differs from macro source selection, which compares latest dates. Snapshot recovery may restore missing history on a later read, but the response and persisted edition first lose it; old nonempty history is not rescued by `lib/snapshot-recovery.mjs`, which only fills absent series. A successful HTTP response is not a successful observation.

Small fix: shared candidate-versus-LKG selection after normalization; retain newer durable observation/history if candidate has no valid points or regresses. Mark retained status per series. Regression: `values:[]`, `data:[]`, all-invalid, older complete response, partial one-point response, both upstreams unavailable.

### P1 — Debt/M2 fallback silently misaligns quarterly observation periods

Observed `route.ts:816,1007,615`: quarterly GFDEBTN point is divided by 1000 (unit conversion is correct) and passed to a monthly ratio unchanged. FRED labels Q2 data `2026-04-01`, but GFDEBTN is **Quarterly, End of Period**, confirmed by official FRED page (Q2 2026 39,462,398 USD millions). `pairedMonthlyRatio` therefore pairs quarter-end debt with April M2 rather than June. Manifest claims "same month". This also overstates debt age by up to three months when freshness uses the quarter label as an actual observation date.

Small fix: preserve original period label and explicit quarter-end effective date; for quarterly fallback use quarter-end debt with corresponding month M2, or withhold the ratio until a documented alignment is implemented. Don't rewrite every quarterly series identically: growth-flow quarterly statistics have different semantics. Regression: Q2 debt must never pair April M2; compare June versus April deliberately unequal values; freshness period-end policy.

Official source: https://fred.stlouisfed.org/series/GFDEBTN (retrieved 2026-10-09).

### P2 — Bitcoin health differs between endpoints

Observed `app/api/bitcoin/route.ts:15`: any fresh quote is `HEALTHY`, including `single-source` and `divergent`. `app/data/snapshot-health.ts` instead marks non-confirmed data `DEGRADED`. Small fix: common status resolver, fresh confirmed=HEALTHY; single-source/divergent=DEGRADED; retained=STALE; no price=UNAVAILABLE. Include reason for divergence/single source. Test all four consensus states and both endpoints.

### P2 — Divergent quote gets another provider's newer timestamp

Observed `app/data/bitcoin-consensus.mjs`: divergent result selects primary price but sets timestamp to latest timestamp among all observations. Reproduction: Coinbase 80000 @10:00; Kraken90000 @10:14 returns Coinbase80000 @10:14. It can extend selected quote freshness by 14 minutes. Small fix divergent timestamp=selected quote timestamp; for confirmed midpoint retain component timestamps and explicit conservative age. Regression exact example plus reversed provider order.

### P2 — Kraken retrieval timestamp is called observation time

`app/data/bitcoin-spot.ts` assigns current wall clock to Kraken `observedAt`, whereas Coinbase preserves exchange time. Official Kraken ticker schema returns close price/lot size with no trade timestamp. This is verified retrieval, not verified trade-observation freshness. Small fix distinguish retrieved_at from observed_at/timeBasis; use timestamped trades endpoint only if equivalent quote policy is explicitly chosen. Don't invent trade time. Test timestamp unavailable metadata and stale cached response policy. Source https://docs.kraken.com/api-reference/market-data/get-ticker-information .

### P2 — Primary failure provenance disappears when backup succeeds

`fillMacroFallbacks/select` replaces the result with candidate, usually `error:null`, discarding primary error. Snapshot health can only say generic "Primary unavailable" instead of showing timeout/HTTP/error per attempt. BLS throttle reuses stored BLS points as a successful candidate; later `last_success` is set to now despite no new fetch. All macro `last_attempt` timestamps are shared batch start rather than actual source request time.

Small fix retain bounded per-provider attempt evidence with attempted_at/completed_at/result/error and selected-source identity, preserve last_success when reusing data without a request. Tests primary timeout+healthy backup; BLS cooldown returns same last_success; unused provider has no invented attempt.

### P2 — Model can use a retained observation without STALE eligibility check

`route.ts:995–998` builds modelSeries using only observation-date age. A source tagged `last-known-good` is shown STALE by `snapshotHealth`, but a recent retained observation remains eligible. Manifest states "No stale inputs in scores". Choose an explicit policy: either forbid LKG scoring, or distinguish fresh economic observation from degraded fetch status and disclose eligibility. Test recent-dated LKG, genuinely old observation, no provider success.

### P2 — Bitcoin network has insufficient validation/freshness

`route.ts:991–994,1135–1142`: `chain.totalbc` truthiness replaces finite/range checks; `Number(heightText)` accepts whitespace as zero, noninteger and negative heights; fees, difficulty and hash rate passed through without schema validation. Supply from market-cap/spot division (non-Sites path) combines independent providers/timestamps and is not protocol supply. Snapshot read reuses these fields without per-field observation dates; UI checks provenance existence, not network freshness (`monitor.tsx:1251–1253`).

Small fix finite/nonnegative typed validations, integer positive height, bounded BTC supply and explicit publisher units; distinct retrieval/observation metadata. Use authoritative published supply value or clearly labeled deterministic estimate; don't reverse-engineer circulating supply from unrelated spot and market cap. On outage retain LKG STALE or null; don't claim live network. Tests corrupt strings, negative, NaN, 0 supply, stale stored network, isolated fees failure.

### P2 / future correctness — Fixed subsidy and undisclosed idealized issuance

`route.ts:994` hardcodes annualFlow `3.125*144*365`. Correct for current subsidy era but wrong after height1,050,000; 144/day is expected block cadence, not observed issuance. No computed halving logic or maximum supply exists in current implementation. UI labels "CURRENT ANNUAL SUBSIDY" without the 10-minute-block assumption. Small fix derive subsidy from validated height using 210000-block halving interval (integer satoshis), state annualized expected issuance assumption, expose null if height unknown; keep S2F as scarcity description, not prediction. Tests heights839999/840000/1049999/1050000 and eventual zero subsidy. Primary protocol reference: https://bitcoin.org/bip/42/ and https://developer.bitcoin.org/reference/block_chain.html .

### P2 — Monthly BTC ratios are sample means, not necessarily full monthly means

Bitcoin chart request uses `sampled=true` for five years. `monthlyAverages` treats returned samples equally as the monthly average, while UI/manifest call it a monthly average without sampling metadata. Need establish exact current provider sampling semantics before claiming exact daily-average replication; unavailable official documentation is listed below. Also ratio and correlation accept the current partial calendar month, with no minimum monthly coverage. Correlation selects last sampled observation per month and compares against monthly means for gold/M2; disclosed MoM returns are directionally valid but aggregation bases differ.

Small fix retrieve explicit daily unsampled series if size allows; restrict complete months or disclose partial-month state/coverage; record monthly aggregation conventions per indicator. Regression missing late-month data, current partial month, absent months (existing no-bridge behavior is good), constant series -> null, <24 pairs -> null, >60 pairs truncation. Do not silently invent missing daily prices.

## Per-indicator implementation matrix

All macro sources below use FRED REST (optional key) or FRED CSV as first path. `dbnomics` is a distribution backup of original data, not independent economic measurement. Thresholds are current maximum date ages, not verified publication-calendar SLAs. All have durable macro history fallback, but timestamp and error caveats above apply.

| Indicator | Canonical source/metric | Units; frequency | Implemented alternative | Age policy | Audit result |
|---|---|---|---|---|---|
| Bitcoin | Coinbase BTC-USD + Kraken XBTUSD | USD/BTC; spot | Two exchange quote comparison; durable spot |15min|Equivalent currency pair, different venues; midpoint when ≤2% apart; timestamp/health defects above|
| Gold | FRED GOLDAMGBD228NLBM legacy ID | Daily AM benchmark historically; current WB monthly USD/troy oz | World Bank Pink Sheet monthly mean |14d legacy;75d WB|Current UI labels monthly correctly; registry/health still calls metric legacy FRED ID, fallback health says "exact metric" although frequency/benchmark changes|
| WTI | DCOILWTICO |USD/barrel; daily|DBnomics EIA/PET/RWTC.D|14d|Exact intended EIA WTI metric; live equivalence not independently sampled in this audit|
| S&P500 | SP500 |Index points; daily close|Cboe SPX history|14d|Overlap validation implemented; uncompared/insufficient candidates still auto-select, which is weaker than "validated"|
| VIX | VIXCLS |Index points; daily close|Cboe VIX CLOSE|14d|Avoids VXO/futures; same promotion caveat|
| Baa spread | BAA10Y |Percentage points; daily|FRED DBAA−DGS10 on identical dates|14d|Equivalent algebra; shares FRED outage risk, honestly named in manifest|
| Dollar | DTWEXBGS |Broad trade-weighted index; daily|FED/H10/JRXWTFB_N.B via DBnomics|14d|Broad dollar, not DXY; intended exact backup, needs metadata evidence in registry|
| M2 | M2SL |USD billions; monthly SA|FED/H6_H6_M2/M2.M via DBnomics|75d|No uniform index metadata; release/vintage missing|
| CPI | CPIAUCSL |Index; monthly SA|BLS CUSR0000SA0|75d|Exact CPI-U SA backup ID; BLS cached reuse last_success defect|
| Fed Funds | FEDFUNDS |Percent; monthly effective-rate mean|FED/H15/RIFSPFF_N.M|75d|Not target rate nor daily EFFR; label should preserve monthly mean|
| Treasury10Y | DGS10 |Percent; business daily|FED/H15/RIFLGFCY10_N.B|14d|Exact intended maturity|
| Treasury2Y | DGS2 |Percent; business daily|FED/H15/RIFLGFCY02_N.B|14d|Exact intended maturity|
| Capacity | TCU |Percent of capacity; monthly SA|FED/G17_CAPUTL/CAPUTL.B50001.S|75d|Coverage intended total industry; registry absent unit/SA metadata|
| Industrial production | INDPRO |Index; monthly SA|FED/G17_IP_MAJOR_INDUSTRY_GROUPS/IP.B50001.S|75d|Base-year identity not validated dynamically; preserve source index basis|
| Unemployment | UNRATE |Percent; monthly SA|BLS LNS14000000|75d|Exact backup ID; cached timestamp caveat|
| Federal debt | GFDEBTN; additional Treasury Debt to Penny |GFDEBTN USDmillions quarter-end; Treasury normalized USDbillions daily|No independent quarterly fallback; daily Treasury used in context/ratio|160d quarterly; not consistently enforced on retained Treasury|Unit conversion corrected; quarterly effective-date alignment wrong|
| Curve | T10Y2Y |Percentage points; daily|FED 10Y−2Y same dates|14d|Aligned subtraction good|
| Debt/GDP | GFDEGDQ188S |Percent; quarterly|LKG only|160d|Correctly avoids annual World Bank substitute; period/publication dates missing|
| Real GDP growth | A191RL1Q225SBEA |Percent annualized QoQ; quarterly|LKG only|160d|Needs SAAR metadata to prevent mistaken YoY interpretation|
| Manufacturing survey | CFSBCACTIVITYMFG |Regional survey index; monthly|LKG only|75d|Manifest explicitly distinguishes from ISM PMI; good|

## Registry completeness against requested 20 fields

`app/data/source-registry.ts` is principally a provider transport registry plus metric IDs and age constants. It is not the requested authoritative per-indicator registry. Existing: ID, provider role/auth/transport/timeout, FRED code, freshness threshold, some fallback mappings in snapshot-health. Missing as systematic fields: original publisher, per-series URL, geography, all units/scales, SA, frequency, publication schedule, publication/knowledge date, vintage/revision reference, transformation identifier, licensing, eligibility. Observation and retrieval metadata live elsewhere; units in health populated only for gold/debt/BTC. Some policy values are duplicated in loaders (DBnomics registry5s/1 attempt versus actual safeJson12s/2 attempts).

Smallest useful implementation: one typed indicator registry consumed by manifest, health and UI; keep unavailable metadata `unknown` rather than filling from assumptions. Preserve raw original period label plus effective period start/end. Add provider-attempt records separately from economic observation records. Record source selected and role accurately, especially monthly gold. Add unit/frequency/SA assertions in source fixtures and derive fallback description from this registry.

## Primary documentation and known unknowns

Verified official sources: FRED GFDEBTN shows USD millions, NSA, quarterly end-of-period and Q2 observation; Kraken ticker documentation shows close tuple without trade timestamp; Bitcoin BIP42 specifies 210000-block halving mechanics. Blockchain legacy charts documentation now redirects to a sparse Explorer docs page in web retrieval; precise `sampled=true` decimation rules were not verified and should not be asserted as exact. Live DBnomics series metadata, data licensing/redistribution permission for S&P/VIX/gold, publication-calendar coverage and current provider uptime were not verified in this bounded static audit. These are unknowns, not inferred outages.

## Positive verified implementation properties

- Missing/blank/boolean values rejected by `finiteObservation`; series normalized, deduplicated and sorted; dates validated.
- Baa/curve differences only use identical dates.
- Correlations use changes rather than raw trending levels, skip nonconsecutive months, minimum24/maximum60 pairs and null for zero variance.
- Gold current UI calls WB monthly mean; BTC/gold ratio uses shared monthly observations instead of spot/monthly mix.
- Equity/gold ratio warns it is not directly purchasable.
- Bitcoin S2F UI explicitly disclaims standalone price-model reliability.
- Annual World Bank debt/GDP is not used to impersonate quarterly US debt/GDP.

## Production dataset cross-check supplied by root

Read `abcm/outputs/audit-20261009/data.json` after static audit: GFDEBTN latest is `2026-04-01` / `39462398`; no treasuryDebt latest exists. Debt/M2 evidence actually identifies `observationMonth:2026-04`, numerator39462.398, denominator22756.6, statusSTALE. Thus the production evidence shows a withheld ratio, not a currently displayed incorrect ratio. The mistaken month is directly observable and contributes to withholding; the potential wrong numeric comparison would occur when the same branch is within its age policy.

Minimal bounded debt correction: only for GFDEBTN-derived debt context/ratios, map quarter label to effective last day of that quarter with `Date.UTC(year, zeroBasedStartMonth + 3, 0)` while converting millions→billions. Preserve source date and annotate `period:2026-Q2`, `period_end:2026-06-30`, `date_basis:quarter-end`. Pair this with June M2. Do not apply this mapping to daily Treasury, M2, or all quarterly series indiscriminately. For quarter-end freshness, use period_end rather than quarter label. Manifest/UI should call it quarter-end debt versus same-month M2 (whose own monthly value is a monthly statistic), not two identically averaged series. Regression: inputApril1 debt39462398, M2April22756.6 and June23000 => monthJune and quotient39462.398/23000, preservingApril1 as source label.

Dataset BTC shows confirmed Coinbase+Kraken at82907.795, observed timestamp2026-10-09T11:38:44.928Z, height970623 and supply20095696.875. This does not reproduce the divergent/timestamp bug in live production; those bugs are confirmed by local branch reproduction. Current block height is in the3.125BTC era, so hardcoded subsidy does not currently miscompute S2F.
