# v89 reliability review — 12 October 2026

Scope: the maintained Worker/API, D1, the public React monitor, exact self-host
and shared production verification. No model formula, weights or visual redesign.
The legacy Flask/React source is unchanged and is not the Sites artifact.

## Reproduced defects and corrections

- `finiteObservation([])` returned zero; one null point aborted normalization.
  Non-numeric object/array values are now rejected and individual bad points
  cannot destroy other valid observations. Numeric zero remains valid.
- Future or rolled-over invalid-calendar edition timestamps could mask the
  functional durable snapshot and block refresh. They are rejected; an invalid
  future row also cannot suppress a later durable write.
- A partial newer durable row lost an independently verified Bitcoin quote;
  a Bitcoin-only edition was discarded. Both are now retained with truthful
  source dates, explicit stale recovery and no invented macro/model values.
- Bitcoin health accepted invalid quote timestamps; client pulse requests had
  no timeout or protection against an older response replacing a newer quote.
  Shared quote validation, bounded requests and chronological selection apply.
- Public requests created tables. They now validate the existing migrated
  schema, with retryable per-binding initialization. Hosted Drizzle migrations
  are unchanged. Self-host applies its separate compatible, immutable baseline
  at startup, idempotently adopting old databases without erasing observations.
- Self-host smoke and Docker health rejected a live but empty database. Runtime
  readiness now distinguishes that state from failure; public data health still
  returns HTTP 503 / UNAVAILABLE, and does not manufacture observations.
- The production verifier could pass an old edition after a requested refresh
  or miss a durable write failure/release mismatch. These are now explicit
  failures. Diagnostics and capacity utilization/unemployment are also checked.
- Daily recovery policy and tests are shared by GitHub automation and the
  standalone source, removing the obsolete nested hour-only cron guard. The
  master workflow remains unchanged until explicitly authorized integration.

## Validation before publication

- Production build, lint, standalone typecheck and Worker artifact validation: PASS.
- Application/source/fallback/refresh/snapshot/security suite: 184 PASS, 0 FAIL.
- Unchanged released braces compatibility suite: 764 PASS, 0 FAIL.
- Actual built Worker in workerd + isolated D1: failed-schema recovery, empty
  readiness, idempotent adoption, corrupt/partial/future rows, cooldown,
  diagnostics and retained Bitcoin under provider failure: PASS.
- Full Wrangler CLI self-host smoke is blocked locally by
  `uv_interface_addresses ... Unknown system error 1`; recorded, not called PASS.
  The candidate CI explicitly runs it and the exact Docker image smoke.
- Lockfile and security backport are unchanged; fresh full audit is enforced in CI.

Fixtures are isolated tests only; production has no mock/seed values.
The full public URL, refresh, ES/EN and API verification are required after deploy.
Real mobile viewport control remains unavailable and is not substituted with
CSS assertions or desktop screenshots.

## Backups and remaining integration gates

Saved Sites v88 source: `3fd47705e9085bfaa9602d4929853e19dab65b6c`.
GitHub `backup/functional-sites-v88-20261012` points at
`201bdd4aa89aaab10f485093973d720302f815e7`; v86 backup remains preserved.
Master is kept at `59eb3b1266b75a0be8eea719cfb8ec564a5e5809`.
PR #23 remains DRAFT, without merge or auto-merge.

The root historical CI previously reported 42 frontend dependency findings
(8 moderate, 31 high, 3 critical), Ruff/Black failures and 13 ESLint errors /
6 warnings. They are not resolved by the Sites audit, and are not shipped in
the maintained Worker artifact. A historical stack release requires separate
remediation and security review. Its unchanged functional backend/frontend/
Docker controls passed in run 38177846385.
