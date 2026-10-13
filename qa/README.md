# Automated release and production checks

`npm ci && npm run typecheck && npx playwright install --with-deps chromium firefox webkit && npm test`
tests the **public Site**. The same suite runs the exact candidate Worker with
`ABCM_BASE_URL=http://127.0.0.1:8793 npm test` after building `sites-current`.
Candidate D1 is a temporary local database seeded from actual public observations;
dates and values are copied unchanged, with provenance. No fixtures are written
to production. Local volume and SQL are deleted when the test server exits.
The isolated build sets `ABCM_PUBLIC_ORIGIN=http://127.0.0.1:8793` so canonical
metadata and favicon respect the configured self-host origin. The published
build uses the public HTTPS origin. Browser tests also reject console errors,
404 assets, missing hydration and incorrect plot coordinates. Long WebKit pages
use viewport/section screenshots because its image dimension is limited.

Four profiles: desktop Chromium, desktop Firefox, iPhone 13 / WebKit, and Pixel 7 /
Chromium. Mobile profiles emulate viewport, touch, user agent and device scale;
they do not certify physical hardware, iOS Safari or an Android installation.
Both languages check ten macro cards, six market cards, twelve real charts,
dates, keyboard chart inspection, mobile menu, language switching, horizontal
overflow, reload, APIs, browser exceptions, failed-refresh retention and retry.
One profile checks successful manual refresh, D1, reload and cooldown, avoiding
four redundant provider refreshes. A browser-only intercepted 503 tests failure
retention; it does not change the public backend or its data.

The browser workflow runs on integration, on demand, and daily at 12:23 UTC.
The separate hourly production watch checks coverage, actual values, diagnostics,
readable D1 and snapshot age (maximum 36 hours). The existing Madrid-noon daily
refresh recovers delayed cron runs. Schedules remain enabled beyond the requested
month. GitHub can delay cron; this is detection and recovery, not an uptime SLA.
Failed checks appear in Actions and its configured notifications. Reports,
screenshots, diagnostics and failure traces are retained for 35 days. No CI job
automatically deploys or rolls back a Site.

The maintained Sites artifact is `sites-current/`; browser dependencies are kept
outside it. The historical Flask/Vite stack is not part of a Sites deployment.
Its dependency and quality backlog is reported separately and now blocks GHCR
publication rather than allowing a soft report to publish a vulnerable image.
