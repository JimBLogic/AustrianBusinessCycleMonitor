# ABCM v91: verified production release

PR #23 integrated the reliability work and browser gates. PR #24 closes the
concurrent noon-refresh persistence race discovered by the first live cron.
Both PRs were deliberately merged after maintained gates passed; auto-merge
was not enabled. Production is native Sites v91, with unchanged public access,
DB binding, secrets revision 0 and immutable schema.

The Site and canonical `master:sites-current` have identical application tree
`b63c0537deb91ae48ca9b888ee616d1026f315a3`. `release.json` records the merge,
source commit, saved native version, deployment and exact archive hash.
Functional v86/v89/v90 references and native saved versions remain available.

Validated: lint, typecheck, production build, source/observation integrity,
192 tests, full Site and QA audits with zero findings, actual Worker/D1 race
and failed-write fixtures, asset MIME delivery, exact self-host/Docker,
and public desktop Chromium/Firefox plus iPhone/WebKit and Android/Chromium
emulation in ES/EN. Physical hardware is not certified.

Post-deploy browser run:
https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/38386248950

17 pass, 0 fail, 0 flaky; three skips avoid duplicate successful refreshes in
other profiles. The public successful refresh wrote edition
`2026-10-13T10:54:07.612Z` after deployment at `10:52:08Z` and survived independent
health/read/reload/cooldown checks. `browser-refresh-proof.json`,
`browser-health.json` and `browser-results.json` preserve the evidence.
Viewport filenames retain the initial test language; each test then toggles
language before capture, so the captured language is the opposite. Browser
artifacts include full-page screenshots and diagnostics, retained for 35 days.
The exact Firefox Cloudflare cookie-domain warning is recorded separately;
application errors, CSP failures and 404/5xx asset/API failures still fail QA.

Production shows 20/20 real observations, index 52 provisional, 12/14 inputs,
8/10 signals and 85% original weight. DEGRADED and dated STALE observations are
explicit; missing fiscal scores remain null. Gold is World Bank monthly context,
not live spot or an equivalent daily LBMA backup. No test fixtures or fabricated
replacement values are served in production.

Hourly integrity checks validate real values, coverage, durable snapshot, age
under 36 hours and agreement with the canonical release. Daily browser checks
and Madrid-noon refresh use the integrated default branch; delayed cron jobs
recover. Schedules have no planned expiry. They detect and recover incidents;
they are not an uptime guarantee for external providers.

The historical Flask/Vite image remains NO-GO for publication. Its separate
quality/dependency gates block GHCR release; the maintained Site is audited
independently. See the v90 security-disposition report for the current inventory
and reachability assessment. A global historical CI badge is not an all-pass
claim for that separate stack.

The live expired-cooldown concurrency check also passes. Two parallel POSTs
started at `2026-10-13T11:09:24.279Z`; one saved edition
`2026-10-13T11:09:44.271Z` and the other returned that same durable edition.
Both retained coverage 12, persistence ready and identical timestamps/values
matching health and independent GET. The next POST returned manual-cooldown.
`concurrent-production-proof.json` and `health.json` record this actual production
write. It is not merely a test against an already fresh cooldown response.
