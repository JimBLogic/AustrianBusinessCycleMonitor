# Dependency exposure assessment — 11 October 2026

Decision: unresolved security gate; NO-GO for release. This document is an assessment, not a waiver or a claim that the findings were fixed.

The renewed full npm audit reports 8 high / 0 critical. They propagate from one advisory: [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), recursive stack exhaustion in braces <=3.0.3. On 10 October the advisory listed no patched release and `npm view braces version` returned 3.0.3. npm's suggested major downgrades of Vinext/Next lint configuration are not a verified compatible repair. Dependency versions and lockfile remain unchanged.

| Audit finding | Installed version | Path to affected parser |
|---|---|---|
| braces | 3.0.3 | vulnerable package |
| micromatch | 4.0.8 | braces |
| fast-glob | 3.3.1, 3.3.3 | micromatch → braces |
| @next/eslint-plugin-next | 16.2.6 | fast-glob → micromatch → braces |
| eslint-config-next | 16.2.6 | @next/eslint-plugin-next chain |
| vite-plugin-dynamic-import | 1.6.0 | fast-glob → micromatch → braces |
| vite-plugin-commonjs | 0.10.4 | vite-plugin-dynamic-import chain |
| vinext | 0.0.50 | vite-plugin-commonjs chain |

## Observed exploitability

A local child process, bounded by a 5-second timeout and 10 KB output limit, called `braces.compile` with nested brace patterns. Depths 2,000 and 4,000 completed; depth 4,999 (9,999 characters, below the default 10,000-character guard) raised `RangeError: Maximum call stack size exceeded`. This demonstrates the installed parser is vulnerable. The exception was caught locally; no hostile request was sent to production.

ESLint's `@next/eslint-plugin-next/dist/utils/get-root-dirs.js` sends configured `settings.next.rootDir` patterns to fast-glob. The dynamic-import plugin derives file globs from application import expressions and calls `fastGlob.sync`. Therefore malicious source/configuration processed during lint or build is a credible availability risk for developer and CI processes. This advisory alone does not establish arbitrary code execution or data theft.

Application code in `app/`, `lib/`, `worker/` and `db/` contains no direct imports/references to these glob packages. A name scan of the newly compiled 24 JavaScript files (2,496,904 bytes) found no braces/micromatch/fast-glob/vite-plugin-commonjs/vite-plugin-dynamic-import markers. The Worker entry imports specific Vinext server entry points. These observations reduce evidence for a public request path to the parser, but a name scan is NOT a complete module-graph or taint proof: remote production exploitability is **not demonstrated**, not categorically excluded.

The self-host image retains development dependencies and launches Wrangler. Treat it separately from the packaged Sites Worker; `npm audit --omit=dev` cannot establish absence of runtime exposure there. No self-host reachability exploit test was completed in this session.

## Controls and closure criteria

- Preserve locked versions; do not apply `npm audit fix --force` or downgrade the runtime to silence the report.
- Existing CI uses read-only repository permissions and bounded jobs; build script additionally limits build duration. Keep untrusted builds isolated and free of production credentials, do not publish artifacts from unreviewed branches, and do not expose Vite development servers publicly. Limits contain a process failure but do not fix the parser.
- This candidate adds a separate full dependency-audit CI job including build tooling. It fails on high findings and uploads the JSON even on failure, while the functional job still runs independently. The finding is neither suppressed nor relabelled low severity.
- Preferred closure: an upstream patched braces release, confirmed advisory range, reproducible lockfile update, regression test for deeply nested inputs, then full audit/build/test/self-host verification.
- Alternative: independently reviewed replacement or depth-limited implementation with compatibility tests; not an ad hoc edit of node_modules.
- A narrowly scoped risk acceptance would require a separate explicit maintainer decision, proof of deployed module reachability and self-host assessment. No risk acceptance is granted by this PR or by creating its DRAFT.
