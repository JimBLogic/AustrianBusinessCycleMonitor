# Safe v87 integration review — 11 October 2026

Recommendation: **NO-GO for merge or deployment.** Prepare and review the DRAFT; keep v86 live. No auto-merge, production deployment, D1 migration, secret change or production write is part of this task.

## Divergence and resolution

Original candidate `8a31c2de3a7195c1dbfe2152cd202c4d63de6eb8` was 5 ahead / 2 behind master `59eb3b1266b75a0be8eea719cfb8ec564a5e5809`, with merge base `91a0b78050654e355f2fe495df4fccc02468047f`. Its root was the Sites source tree, whereas canonical master stores that application in `sites-current/`. The original merge would delete unrelated repository content. This was an erroneous candidate layout, not a desired repository migration.

Master-only commits reviewed:

- `06e1fef`: verified v86 mirror, durable refresh workflow and related workflow maintenance.
- `59eb3b1`: dated production evidence and self-host CI distinguishing an empty database (503/UNAVAILABLE) from a broken runtime.

`master:sites-current` exactly matched v86 tree `c4c96c7111da17efea8a8e80ed0747b4ea41047f`, the candidate's functional base. Thus the application's reviewed change set is the v86-to-v87 delta, not a conflicting second implementation. A real `git merge --no-commit --no-ff` produced content, add/add, modify/delete and directory relocation conflicts. The separate merge-tree replay is preserved in `original-merge-conflicts.txt`.

Resolution: retain master's complete canonical root, including license, historical projects, workflows and production evidence; install the complete candidate tree under `sites-current/`. Preserve both parents in a merge commit on the candidate branch, without rewriting its history. The only intentional root change is an additional full-audit job in `.github/workflows/sites-current.yml`; existing functional/self-host checks remain intact. No tracked files from master are deleted.

Backups retained:

- `backup/functional-sites-v86-20261009` → `d5d97b0d532d52c3cc23162e93b0c3a9b6d7ecf9`.
- `backup/v87-before-integration-20261010` → original candidate `8a31c2de3a7195c1dbfe2152cd202c4d63de6eb8`.
- Original saved Sites v87 and production v86 remain unchanged; these later GitHub changes are not yet a new Sites artifact. A future authorized publication must build/package the final reviewed `sites-current/` tree, not deploy the older saved v87 artifact.

## Additional changes

Gold: the health API identifies World Bank monthly gold independently from daily `GOLDAMGBD228NLBM`. The manifest describes monthly frequency, mean aggregation, USD/troy-ounce units, month-label dates and non-equivalence to daily LBMA/spot. Registry role is enrichment/context; UI source label states monthly. A behavioral test covers fresh monthly, retained stale monthly and daily metadata without changing observations.

Dependencies: eight high findings traced to one vulnerable braces parser. Vulnerability reproduced locally; no patched version verified. Detailed call paths, exposure limits, mitigation and closure criteria are in `dependency-risk.md`. No unsupported forced downgrades and no assertion of a clean audit.

## Verification

| Control | Result |
|---|---|
| Maintained application `npm test` | PASS: production build, artifact integrity and 159 tests |
| `npm run lint` | PASS |
| Standalone `npm run typecheck` | PASS |
| Standalone `npm run validate:artifact` | PASS |
| Full `npm audit` | FAIL: 8 high, 0 critical; evidence retained |
| Conflict resolution and canonical layout | PASS: unresolved index entries cleared, master root retained |
| Public read-only `/api/health` | HTTP 200, release 86, DB ready, snapshot readable; DEGRADED |
| Real browser/mobile/ES-EN interaction | BLOCKED: control-browser absent from both available skill catalogs; no alternate browser path installed |
| GitHub CI and Docker self-host smoke | Results must be assessed on the PR; local Docker was not run |
| Candidate production verification | NOT RUN; explicitly prohibited |

Build and test log, lint log, audit JSON and compact public health evidence are included. Source/SSR tests do not count as visual browser verification. Reports under `../audit-20261010/` are historical checkpoints; this review supersedes their open gold-metadata item, not their captured production evidence.

Release remains blocked until the dependency gate is remediated or explicitly dispositioned after further evidence, compatible browser QA passes (desktop/mobile, ES/EN, charts, refresh, console/network), relevant GitHub checks are reviewed, and a separate publication decision is made. Creating this PR is not authorization to merge or deploy.
