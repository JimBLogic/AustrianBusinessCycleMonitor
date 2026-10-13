# Maintained Site and historical stack security scope

The published Worker is built solely from `sites-current/`. Its full locked audit
on 2026-10-13 reports **0 vulnerabilities**, including build dependencies. The
temporary bounded braces backport retains its upstream provenance, hash checks,
depth/cycle regression tests and compatibility evidence; a clean registry audit
does not replace those tests. Browser tooling is isolated in `qa/` and its full
audit also reports 0. Neither the root Flask code nor `packages/frontend` is
included in the Sites Worker or client bundle.

The historical frontend lockfile has **41 audit findings: 8 moderate, 30 high,
3 critical** in the fresh local 2026-10-13 audit. This is a separate, unresolved
backlog; it is not waived or represented as passing. The raw inventory is
preserved with this report and by a new strict CI security publication gate.

## Actual reachability and disposition

| Dependency family | Observed use / prerequisites | Necessary action |
| --- | --- | --- |
| Vitest UI / tinypool (critical) | Historical test tooling. CI uses `--run`; the deployed Site contains neither library nor a test server. Vitest advisory requires an exposed UI/API or affected Windows UI/browser setup. Tinypool gadget requires a preceding prototype-pollution primitive and a worker-options sink; absence of the package from Sites removes that Site path, not its general risk. | Keep historical test/UI servers private; upgrade test/toolchain and validate before releasing that stack. |
| Axios (high) | Used only by the historical browser client, with internal API paths. Node HTTP-adapter advisories are not the same path as these browser calls. Fetch-adapter pollution gadgets can affect browsers if another flaw pollutes objects; browser use alone is not a complete exemption. | Upgrade Axios; audit configuration merging, object pollution and URL input in the historical client before publication. |
| React Router (high) | Historical client routing, absent from Sites. Redirect/link issues require unsafe destination paths; SSR hydration issues require that separate affected SSR path. No claim is made that all historical routes are proven safe. | Upgrade router and add unsafe-path/redirect tests before releasing the historical client. |
| Vite, glob parsers, PostCSS, source maps, Rollup and related tooling | Historical build/test dependencies, absent from the running Site. Malicious build inputs or exposed development servers remain relevant supply-chain/development paths. | Upgrade supported tooling with regression checks; never expose development/test servers or publish an image with unresolved audit gates. |

The root `publish-image` job now requires the strict dependency gate and both
quality jobs in addition to functional/Docker tests. Its publication must remain
blocked while any gate fails. The historical implementation and dependency
lockfile are preserved; this Site reliability release does not silently migrate
or certify that separate runtime. **GO applies to the maintained Site only;
NO-GO applies to publication of the historical image.**

Primary advisory references inspected:
- https://github.com/advisories/GHSA-5xrq-8626-4rwp
- https://github.com/advisories/GHSA-5gmw-xhrv-c9v3
- https://github.com/advisories/GHSA-vh66-26gq-q6x8
- https://github.com/advisories/GHSA-wrjc-x8rr-h8h6

This is a reachability assessment of the observed deployment boundary, not proof
that every historical vulnerability is unexploitable.
