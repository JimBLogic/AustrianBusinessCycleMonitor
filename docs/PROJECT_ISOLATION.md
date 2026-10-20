# ABCM and BrangeCycle: separate products, reviewed reuse

ABCM is the stable public monitor. BrangeCycle is the private research and UX
laboratory. They exchange reviewed source and evidence, not live storage,
deployment authority or availability dependencies.

## Boundaries verified on 20 October 2026

| Boundary | ABCM | BrangeCycle |
| --- | --- | --- |
| Site project | `appgprj_6a630a89bf208191bc7915a9410ae47a` | `appgprj_6ace4c9cb44881918b979e11d440c586` |
| Audience | Public | Owner-private |
| Hosted version reviewed | 91 | 22 |
| Hosted source commit | `32e9cec31b01994523bb817e2d52158917f248c9` | `78a7224fc921dd2e04fa5a97c210b3236f500338` |
| Repository | `JimBLogic/AustrianBusinessCycleMonitor` | `JimBLogic/brangecycle` (private) |
| Maintained ABCM source | `master/sites-current/` | Vendored/adapted ABCM v91 source, with provenance |
| Durable data | Project-scoped `DB`; `macro_snapshots` | Project-scoped `DB`; `editions`, `job_runs`, `provider_checks`, etc. |
| Collection | Own providers, daily refresh | Own providers and private writer; autonomous trigger remains blocked |

`DB` is a local binding name, not evidence of a shared database. The native Sites
database views returned different table inventories scoped to the two projects.
The audited BrangeCycle source contains no ABCM production URL or project ID.
ABCM's GitHub `sites-current/` and hosted source have identical tracked file
contents. Neither production application was modified for this audit.

## What can flow in each direction

| Direction | Candidate reuse | Acceptance |
| --- | --- | --- |
| ABCM to BrangeCycle | Validated finite/date checks, BTC consensus, gold monthly identity, formula helpers, failure fixtures | Pin source commit, preserve MIT notice, run BrangeCycle's own tests; do not import ABCM's stored observations or production credentials |
| BrangeCycle to ABCM | Immutable editions, fenced ingestion, richer explanations, UX experiments | A separate ABCM PR for one capability, parity against ABCM's current contracts, operational evidence and rollback |
| Either direction | Lessons, documentation, accessibility and test ideas | Preserve attribution, economic meaning and ES/EN; test in the destination |

BrangeCycle's existing `docs/REUSE_MAP.md` records its reuse of ABCM commit
`30476a06626f7b55cde7163d774ce6d25d42a988`. Reuse already exists; it is not a
reason to synchronize full trees or to merge the two release pipelines.

## Promotion procedure

1. Record the origin commit, exact files, license, behavior and evidence. State
   the concrete ABCM problem solved. Classify data/schema/formula changes as
   higher risk than isolated copy or presentation changes.
2. For ingestion, persistence or calculation changes, observe at least seven
   completed daily cycles in the isolated BrangeCycle environment. Include
   provider outage, timeout/corruption, partial coverage, stale recovery and
   concurrency tests. Until its unattended trigger and recovery are verified,
   BrangeCycle cannot supply that operational evidence.
3. Port only the reviewed capability to an ABCM feature branch. Never copy the
   peer's hosting manifest, database state, credentials, full lockfile or entire
   application directory. Dependency changes need destination-specific review.
4. Run ABCM isolation, tests, typecheck, lint, build, full dependency audit,
   Worker/D1/self-host checks, and relevant desktop/iPhone/Android ES/EN smokes.
   Preserve formula parity and source identity; disclose deliberate changes.
5. Review the PR's exact commit and CI. Merge/deploy only within the user's
   authorization. Keep an archive-backed known-good version and any required
   database backup; application rollback does not undo schema migrations.
6. After publication, verify the public URL, release, values, dates, coverage,
   health, stored edition, refresh/cooldown and repeated reads. Retain scheduled
   monitoring. If a gate fails, keep or restore the known-good release.

## Automated protection and limits

`automation/project-isolation.mjs` rejects a wrong Site identity, unexpected
storage bindings, peer production/repository references in executable source,
dependencies and release automation, symlinks in these surfaces, remote D1
bindings and remote Wrangler database commands. Documentation, historical
archives and the guard's explicit negative fixtures are excluded. The workflow
runs on every PR/push to master, without write credentials or deployment steps.

This is a static regression gate, not a claim of account-level IAM enforcement.
It cannot prove that an external token lacks cross-repository access, inspect
hidden provider credentials, or recognize every dynamically constructed URL.
Keep per-project credentials and independent hosting authority. Any future
intentional cross-project API integration needs a new reviewed contract; the
default is no runtime coupling, including read-only calls.

## Current verification

- Live ABCM check at `2026-10-20T05:26:52.828Z`: release 91; durable edition
  `2026-10-20T05:23:23.839Z`; model coverage 12; health `DEGRADED`. Debt,
  debt/GDP and real GDP growth were explicitly stale. No empty-panel failure.
- [Latest inspected public browser run](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/39305206303):
  19 October; 17 passed, 3 deliberate duplicate-refresh omissions; Chromium,
  Firefox, iPhone/WebKit, Android/Chromium and ES/EN. This is emulation, not
  physical-device testing and not a new manual browser run on 20 October.
- [Latest inspected scheduled integrity run](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/39352424840):
  20 October, passed. GitHub schedule starts have been delayed; an hourly cron
  expression is not a guaranteed hourly execution SLA.
- BrangeCycle remains private with unresolved scheduling, hosted recovery and
  integration gates. Its pending v23 work is not approved for ABCM by this audit.
