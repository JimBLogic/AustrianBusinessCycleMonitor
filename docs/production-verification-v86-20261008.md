# Public production verification — Sites v86

Production deployment succeeded at 2026-10-08 15:53 UTC. Source commit: `07156d3c3c8e4d34d3a0c39644531aa4037c5524`. Exact deployed tree: `c4c96c7111da17efea8a8e80ed0747b4ea41047f`. This tree matches both `sites/progressive-monitor` and `master:sites-current` at the recovery commit.

The first real POST after deployment succeeded and persisted edition `2026-10-08T15:54:04.291Z`. A separate read at 15:59:17 UTC returned that same edition in `daily-persisted` mode. The public browser displayed actual values on initial HTML, after hydration, after a manual refresh and after reload. Manual refresh displayed a successful synchronization and a 30-minute cooldown. No blank dashboard recurred in this verification window; this is not a guarantee about future uptime.

The model calculated 52 with 12/14 inputs. The health endpoint reported DEGRADED, with actual observations for all 20 audited indicators. Industrial production and capacity utilization survived failed live providers using explicitly STALE last-known-good observations. Old quarterly observations remained STALE, with their original dates. Gold is explicitly a monthly World Bank mean, not spot. The complete per-indicator source/status/attempt/success/value/date/freshness/reason/fallback record is in `production-indicator-audit-20261008.json`.

Public browser checks covered BTC, gold, WTI, S&P 500, dollar, federal debt, Baa, Fed Funds, M2 and CPI; chart interactions confirmed 2Y 4.79%, 10Y 5.27%, VIX 15.08 and industrial production 103.07 with observation dates and plotted histories. Both Spanish and English rendered values and interpretations. The screenshot retained with the task shows the public v86 model, coverage, edition and refresh cooldown.

Validation: 151 tests passed; type-check, production build, artifact integrity and lint passed for the Site. `npm audit --omit=dev` reports zero vulnerabilities. Full `npm audit` still reports eight high findings from the braces development-tool dependency chain, with no patched release verified. This full audit gate is NOT passed.

Backup: `backup/functional-sites-v84-20261008` preserves the first release demonstrated functional during this investigation; its tree is `b68d8d2758cc43f228b4b1496f9182e31731ab2c`. `backup/master-before-recovery-20261008` preserves the original canonical master. The detailed incident analysis is at `sites-current/docs/production-recovery-20261008.md`.

Remaining verification limits: the supplied browser has no supported viewport/device-emulation capability, so actual mobile visual QA remains unverified. A successful future scheduled daily run must be observed before claiming multi-day operation. GitHub's legacy Python/React project has separate Ruff/Black and frontend-lint failures; those jobs do not execute the deployed Sites tree. These limits prevent claiming the entire requested Definition of Done is complete.
