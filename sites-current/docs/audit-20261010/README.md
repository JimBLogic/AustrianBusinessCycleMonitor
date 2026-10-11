# ABCM recovery and integrity checkpoint — 2026-10-10

## Release decision

Production remains v86. Candidate v87 is not approved for deployment: real-browser, mobile, ES/EN interaction and post-deployment gates remain blocked. The Sites workflow requires control-browser for managed preview; neither installed skills catalog exposes it. No substitute browser automation was installed. Full dependency audit also reports eight high findings. This is a saved engineering checkpoint, not a claim that the complete user Definition of Done has passed.

## Production evidence collected today

`GET /api/health` returned 200, DEGRADED, DB ready and snapshotReadable=true. A public `POST /api/data` then returned 200 and generated edition `2026-10-10T13:40:58.468Z`. It contained 20 nonempty series, 20/20 available indicators, 15 fresh indicators, composite 52, provisional model. Subsequent GET returned that same edition; a second POST returned manual-cooldown and retained the same timestamp. Assertions are recorded in `production-refresh-verification.json`. This verifies the observed requests, not indefinite uptime or unattended scheduling.

The complete requested source/status/last_attempt/last_success/last_valid_value/observation_date/freshness/failure_reason/fallback matrix is in `production-indicator-audit.json`. All values are dated public API observations, not fixtures used to populate production. The prior health response is retained separately. Industrial production and capacity utilization use last-known-good. Fiscal observations remain stale. Gold is a monthly World Bank series and must not be represented as current spot or an exact daily LBMA substitute; the existing generic health explanation needs correction.

## Baseline and rollback

- Proven production source v86: `07156d3c3c8e4d34d3a0c39644531aa4037c5524`.
- Source tree: `c4c96c7111da17efea8a8e80ed0747b4ea41047f`.
- GitHub backup: `backup/functional-sites-v86-20261009`, commit `d5d97b0d532d52c3cc23162e93b0c3a9b6d7ecf9`.
- Saved v86: `appgprj_6a630a89bf208191bc7915a9410ae47a~appgver_e5ff4fa697788191bbc55180988756a4`.
- v86 deployment: `appgdep_6ac7bc69abcc819182b7fecb1bc9703c`.
- Archive SHA256: `164d434db1c1af5669b331823c145525abe09bf152bef4ed78527c2d4e04e520`.

No D1 schema migration or destructive database operation is included. Rollback is redeployment of the saved v86 archive. Candidate snapshot-reader policy remains compatible with v86. An actual rollback rehearsal has not been performed.

## Candidate changes and issue register

| Issue | Candidate treatment | Status |
|---|---|---|
| Empty/corrupt BTC and Treasury responses discard durable history | Validate observations before date conversion; retain/merge last valid history | Implemented, behavioral tests pass |
| Missing fiscal inputs serialize formula intercept 35 | Serialize ineligible public scores as null, preserve legitimate zero | Implemented, behavioral tests pass |
| Legacy parent engines masquerade as ten distinct signals | Remove aliases, withhold legacy incomplete model | Implemented, browser gate pending |
| Stale context confirms current patterns | Retain observations but exclude stale forces from pattern confirmation | Implemented, browser gate pending |
| Treasury bypasses freshness, quarterly debt misaligns dates | Freshness guard; map quarterly end-of-period debt to quarter end only for derived comparison | Implemented, behavioral tests pass |
| BTC divergence borrows another venue's newer timestamp | Selected venue timestamp; combined quote uses oldest constituent; single/divergent marked DEGRADED | Implemented, behavioral tests pass |
| Local persistence reports success when blocked | Return verified write result, session-only message, preserve deliberately empty watchlist | Implemented, behavioral tests pass |
| Charts compress irregular time or bridge missing intervals | Calendar-proportional x, invalid-date rejection, separated gap segments, corrected midpoint label | Implemented, visual gate pending |
| Two different concepts called regime | Label index band and pillar pattern separately, expose coverage | Implemented, visual gate pending |
| Learning links lose chosen language | Preserve query language in return links | Implemented, interaction gate pending |
| Automatic daily execution unproven | Keep distinct from successfully verified manual refresh | OPEN: require actual scheduled run and persisted snapshot evidence |
| Gold metadata claims exact fallback | Source audit documents monthly/daily distinction | OPEN: correct semantic source metadata |
| Eight high dependency findings | Retain full audit output, no blind dependency upgrade | OPEN: supported update or documented exploitability/remediation decision |

## Model and contract

Independent Python recomputation on the observed 9 October snapshot validates all eight eligible signals, the 0.85 active weight, composite 52, aligned real rate, two ratios and six correlations. See `model-audit-20261009.md`, the executable `model-independent-check-20261009.py`, its captured public input, and results. No score weights or thresholds changed.

Candidate contract changes: schema 1.5.0 makes unavailable scores explicitly nullable; context version abcm-six-force-2 excludes stale inputs from current pattern confirmation. The ten-signal engine version is unchanged because its formulas and weights are unchanged. The prior fiscal intercepts are invalid observations, not independently verified scores.

## QA matrix

| Gate | Result |
|---|---|
| Type-check | PASS via production build and standalone check |
| Lint | PASS |
| Production build and artifact integrity | PASS |
| Automated tests | PASS, 158 tests, including new failure/persistence/chart behaviors and existing source/snapshot/refresh tests |
| Independent arithmetic | PASS on captured 9 October eligible inputs |
| Current public health, manual refresh, persisted reread, cooldown | PASS on v86, 10 October |
| Full dependency audit | FAIL: 8 high, 0 critical |
| Desktop/mobile visual, ES/EN interactions, browser console/network | BLOCKED this session: required browser skill unavailable |
| Candidate deployment and post-deployment browser verification | NOT TESTED; candidate not deployed |
| Unattended daily refresh | NOT PROVEN |
| Persistence across multiple days and rollback rehearsal | NOT TESTED in this checkpoint |

The source, Bitcoin and UI/security research reports are preserved alongside this report. Their original findings distinguish observed defects from risks; an implemented candidate fix does not imply a deployed fix. Remaining work must close the blocked/failed gates before declaring the task complete.
