# ABCM 1.1.0 — agent review and focused repairs

4 November 2026. Baseline hosted source: b0e2a859a4132a372a60111171ccedab1d347af0
(product 1.0.1, Sites checkpoint 101). Three agents covered release/CI, data
reliability and interface feedback; the release owner reviewed and integrated
their changes. Only ABCM was in scope.

| Finding | Evidence and repair | State |
| --- | --- | --- |
| Exhausted daily retries never recover on a later day in an open tab | Reproduced three calls and zero timers on the following day. Keep a rollover timer at real Madrid noon; preserve cooldown and a monotonic window budget, including 23/25-hour DST days and background suspension | Fixed and regression tested |
| Monthly fallback labels displace same-period FRED revisions in the browser | Previous September 30 fallback value 4.5 displaced incoming September 1 value 4.25. Reuse the writer's retainedSeriesIsNewer period comparison for all seven monthly series; genuinely later months/daily observations stay retained | Fixed and regression tested |
| Refresh messages keep the language used at request start | Store a semantic outcome and translate during render; comparisons, manual quota and baseline remain intact across ES/EN changes | Fixed; helper, actual load harness and browser checked |
| fast-uri 3.1.8 build advisories | Port only the reviewed 3.1.9 version/resolved/integrity entry from PR39 head 02aa457d3fb26b6126710ec00dc0b4c2e01f9584; locked install verified integrity | Patched; other build findings remain |
| Integrity watch expects checkpoint 99 while production serves 101 | Run 41795875439 fails before completing the remaining checks. Keep strict expectedRelease; synchronize the reviewed candidate to master through merge rather than accept arbitrary releases | Still blocked on GitHub integration, not fixed by a Site deployment |

## Verification

- Full application suite: 259 passed, zero failed/skipped. TypeScript,
  production build/artifact validation and lint passed.
- Automation: 41 passed; actual isolation scan checked 111 executable files,
  no runtime coupling detected. No BrangeCycle changes or live dependency.
- GitHub security-policy regression tests: 10 passed, including the pinned
  fast-uri patch-floor checks ported from PR39; audit findings remain separate.
- Tests cover daily-budget rollover, DST, cooldown lasting multiple days,
  background resumption, abort cleanup and an active request spanning noon.
  Cross-review found and fixed a lost Retry-After deadline on that last path.
- A full-suite run exposed a pre-existing race in a test fixture. It set an
  inserted flag before its D1 commit; retries could return provider data before
  the supposed competing durable writer existed. Controlled delay reproduced
  this. All callbacks now await one shared insert promise. Product guard and
  assertions were preserved; the final full suite passed.
- Local self-host smoke: temporary local D1 migration succeeded, then Wrangler
  failed with uv_interface_addresses in the executor. BLOCKED locally, not PASS.
  The mirror CI must repeat its Worker/Docker/browser checks.
- Browser preview: completed error notices translate ES/EN; an in-flight
  request started in EN displays ES feedback immediately after language change.
  New device emulation has not been run locally. Suspected narrow-dialog
  overlap/background scroll issues were not confirmed and were not changed.

## Remaining risks and operational boundaries

Full npm lock audit: 18 moderate advisory-chain entries, zero high/critical,
rooted in minimatch and Satori. Production-only audit: zero advisories. This is
not a claim that the whole repository or build chain is vulnerability-free.
No audit threshold, workflow, permission or branch-protection setting changed.
No forced dependency upgrades, production D1 manual writes/schema changes,
credential changes or unrelated-project edits were made.

Baseline live GET: product 1.0.1/checkpoint 101, DB ready and snapshot readable;
19/19 macro series fresh. Global health remains DEGRADED because source identity
and the separate stored BTC quote retain their disclosed limitations. No stale
value, unavailable model or warning was relabeled as fresh or HEALTHY.

Sites checkpoint 101 is the verified archive-backed rollback. Application
rollback does not restore data. Source parity is demonstrated by exact Git tree
equality with the candidate GitHub branch, not by declared sourceMirror metadata.
Master remains on checkpoint 99 until a separately permitted merge; a pending
PR and red zero-advisory gates must not be described as fully integrated PASS.
