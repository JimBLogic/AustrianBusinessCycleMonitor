# Release preparation — 11 October 2026

The owner's subsequent instruction, **“Test, fix, publish”**, authorizes a new
Sites publication after the repairs and checks. The earlier no-deployment
checkpoint remains historical evidence. Master merging and auto-merge remain
disabled; PR #23 stays DRAFT. Production v86 is retained as a rollback version.

## Source and backups

- Candidate before this follow-up: `4c490a18326cb9c410f65388e6e6b2dbaa0105e4`.
- Master reviewed and integrated: `59eb3b1266b75a0be8eea719cfb8ec564a5e5809`.
- Functional v86 GitHub backup: `backup/functional-sites-v86-20261009`,
  `d5d97b0d532d52c3cc23162e93b0c3a9b6d7ecf9`.
- Functional v86 Site source: `07156d3c3c8e4d34d3a0c39644531aa4037c5524`;
  saved version `appgprj_6a630a89bf208191bc7915a9410ae47a~appgver_e5ff4fa697788191bbc55180988756a4`.
- Pre-integration v87 backup remains `backup/v87-before-integration-20261010`.

The release uses the complete reviewed `sites-current/` app, including the gold
metadata and Node 22 test-loader correction, rather than the older saved v87
artifact. `SITE_RELEASE` is 88 to match the next saved version. Mirror metadata
now points to the actual canonical directory and candidate branch. Economic
formulas and weights are unchanged.

## Dependency repair

The eight previous highs originate in GHSA-vfj7-8cjw-p6xm, braces 3.0.3.
There is still no official patched registry release. The temporary local
MIT-licensed `vendor/braces-bounded` package narrowly backports depth and cyclic
parent guards from upstream PR 72, commit
`28d440b5dd449dbf1fe6f3506cf94ecca4d02660`. Unrelated unreleased parser changes
are excluded. Its README and provenance record scope, original source hashes,
patched hashes and retirement instructions. All consumers use this source via
a locked file dependency and override; Docker copies it before `npm ci`.

The full registry audit is now 0 vulnerabilities. **That result alone does not
certify a local fork.** Independent evidence:

- 764 unchanged released upstream tests pass against the patched runtime;
  tests obtained from tag 3.0.3, commit
  `74b2db2938fad48a2ea54a9c8bf27a37a62c350d`.
- Reproducible Node tests check all source hashes and every consumer resolution,
  100/101 nesting boundaries, 4,999-level text payloads, 10,000-level direct ASTs,
  cyclic ASTs/parents, fractional and unbounded option attempts, ordinary globs,
  original escaping semantics, micromatch and fast-glob.
- The originally crashing payload is rejected with a controlled validation
  error in a timeout/output-bounded child process. No hostile production input.

The original vulnerability report remains intact. The old NO-GO dependency
assessment is superseded for this maintained backport, not rewritten as if an
official fixed release existed. A temporary fork carries maintenance cost and
must be replaced when a compatible official fix exists.

To reproduce the released compatibility suite, check out the pinned upstream
tag, copy its unchanged `test/` into a temporary directory with this vendor's
`index.js` and `lib/`, install Mocha 11.7.5, bash-path 2.0.1, ansi-colors 3.2.4
and fill-range 7.1.1 in a separate runner, and run Mocha with that runner's
`node_modules` in `NODE_PATH`. The log is `braces-upstream-suite.txt`.

## Completed local checks

| Control | Result |
| --- | --- |
| Production build and Worker artifact integrity | PASS |
| Application, source/fallback, snapshot, refresh and security tests | 164 pass, 0 fail |
| Lint | PASS |
| Standalone typecheck | PASS |
| Standalone artifact integrity | PASS |
| Full dependency audit including build tools | 0 findings |
| Released dependency compatibility suite | 764 pass, 0 fail |
| Git diff whitespace | PASS |

The data tests use isolated fixtures for provider failure, corrupt responses,
timeouts, stale values, primary failure with a healthy equivalent backup and
complete provider failure with durable last-known-good recovery. No fixtures
are installed as production observations.

## Production baseline and verification limits

The actual public v86 page was opened in the available cloud browser. It showed
real observations, charts, 12/14 engine input coverage and index 52. A new daily
edition was generated during that visit: `2026-10-11T21:03:58.701Z`.
Subsequent public API GETs read that same persisted edition; health was HTTP 200,
DB ready and snapshot readable, with 20/20 observations and 15 fresh. Compact
API records include all source statuses and observation dates. DEGRADED is
honest: federal debt and some history/enrichment sources are stale or offline.

This environment has no managed `control-browser` skill, so no managed preview
or browser installation was attempted. The cloud browser can inspect this
public site and desktop ES/EN interactions, but exposes no mobile viewport
emulation. Actual mobile visual verification remains explicitly unverified.
Local Docker is unavailable; exact Node 22/Docker compatibility must be
confirmed in GitHub CI. Publication status and post-deployment public checks
will be appended after the deployment returns.
