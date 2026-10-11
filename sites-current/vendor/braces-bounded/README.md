# Temporary maintained security backport

This is **not an official braces release**. It is the published MIT-licensed
`braces@3.0.3` runtime with the depth/cyclic-parent protections reviewed in
[upstream PR 72](https://github.com/micromatch/braces/pull/72), pinned at
`28d440b5dd449dbf1fe6f3506cf94ecca4d02660`. The unreleased quote/comma parser
changes in that branch are deliberately excluded. Original `stringify`
`escapeInvalid` behavior is preserved.

The parser bounds both brace and parenthesis nesting at 100. Compile, expand
and stringify also bound caller-supplied ASTs. Stricter finite `maxDepth` values
are honored; higher, infinite and NaN values cannot disable the upper bound.
Expansion rejects cyclic parent chains. Excessive inputs raise a controlled
validation error before recursive stack exhaustion.

`package.json` installs this private local package as `braces` and applies the
same override to every consumer, including lint/build and self-host tooling.
The lockfile and `provenance.json` identify the exact source. The original MIT
license and author credits are retained. No postinstall mutation is used.

The scoped name distinguishes maintained source from the vulnerable registry
release. A zero-finding npm audit checks registry dependencies, **not this local
fork's safety**; the security regressions, source hashes, compatibility tests,
and actual consumer/build tests are required evidence as well. The original
eight-finding report remains in `docs/integration-20261011/dependency-audit.json`.
This patch addresses GHSA-vfj7-8cjw-p6xm, not all conceivable resource exhaustion
from expansion cardinality or arbitrary custom ASTs.

Retire this fork when an official patched release is available: replace both
the direct dependency and override, regenerate the lockfile, and rerun the
security, compatibility, application and full dependency checks.
