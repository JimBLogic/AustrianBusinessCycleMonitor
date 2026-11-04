# Product release policy

ABCM uses three integers: MAJOR.SECURITY-OR-MEDIUM.ADJUSTMENT. This is the
project's requested classification, not a claim of strict Semantic Versioning:
all security fixes increment the middle component even when small.

Checkpoint 100 is the milestone baseline, named 1.0.0 in this scheme. The first
release using the new identity is 1.0.1. Prior immutable checkpoints retain their
original numbers and archives; they are not renamed or republished.

| Change | Example from 1.0.1 | Reset |
| --- | --- | --- |
| Substantial capabilities, architecture or model change | 2.0.0 | Middle and right |
| Security fix or medium improvement | 1.1.0 | Right |
| Small visual/copy/local usability adjustment | 1.0.2 | None |

For a mixed release, choose the highest category. Do not treat versions as
decimals; 1.0.10 follows 1.0.9. Use three dot-separated components, not 1.01.

`package.json.version` is the single product version source. `APP_VERSION` in
`app/version.ts` reads it; the UI and health/data/manifest APIs expose it.
Use `npm version major|minor|patch --no-git-tag-version` as appropriate; security
uses `minor` under this policy. It updates package and lock metadata together.
Update the bilingual `/releases` history for each delivery.

`SITE_RELEASE` remains a numeric hosting checkpoint for existing API consumers,
readiness checks and release automation. It does not replace APP_VERSION. Keep
the native saved version ID, source commit and archive hash as deploy evidence.
Engine, context-model and data-schema versions remain independent contracts.

Validate UI/API identity, source mirror, appropriate regressions and rollback.
No version bump turns stale or unavailable data into fresh data or an audit
finding into a passing security result. Known dependency findings remain open
until compatible remediation passes its own verification.
