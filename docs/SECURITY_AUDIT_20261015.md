# ABCM dependency and workflow security audit — 15 October 2026

**Source of truth:** `master` at `30476a06626f7b55cde7163d774ce6d25d42a988`. The former v87 [PR #23](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/pull/23) was **already merged**, followed by fixes through v91 and master. Do not report v87 as still awaiting merge.

**Audit candidate:** `audit/security-patches-20261015`. No merge to `master`; no Site deploy, secrets changes, data-provider requests, D1 write, ABCM model alterations or BrangeCycle modifications.

## 1. Verified lockfile scans (real npm registry advisories)

[Read-only GitHub Actions run #38729332330](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/38729332330), exact checkout head `4e543a24a8fd3e7a579bf12c58986d8173aab620`. **This is a snapshot, not a continuously updated finding.**

| Directory | Scope | Total | Moderate | High | Critical | Role |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `sites-current/` | Full | 0 | 0 | 0 | 0 | Maintained Site/Worker |
| `sites-current/` | Production | 0 | 0 | 0 | 0 | Maintained Site/Worker |
| `qa/` | Full | 0 | 0 | 0 | 0 | Current browser QA |
| `packages/frontend/` | Full | 41 | 8 | 30 | 3 | Historical React 18/Vite 5 frontend |
| `packages/frontend/` | Production | 21 | 3 | 18 | 0 | Historical React frontend |
| `sites-v25/` | Full | 32 | 6 | 24 | 1 | Archived immutable Sites v25 |
| `sites-v25/` | Production | 6 | 1 | 4 | 1 | Archived immutable Sites v25 |
| `archive/copilot-era/monorepo/` | Full | 42 | 8 | 30 | 4 | Archived old monorepo |
| `archive/copilot-era/monorepo/` | Production | 0 | 0 | 0 | 0 | Not actively deployed |

The **numbers are package findings across distinct dependency trees**, not a count of unique CVEs, exploitation events or confirmed production exposure. In particular, `41+32+42` is NOT a meaningful total of distinct vulnerabilities.

### Examples from actual npm lockfile advisory JSON

- Legacy React frontend: Vitest and `tinypool` critical findings include an RCE-class prototype-pollution advisory; fixing the dependency graph requires breaking-major Vitest upgrades. `axios` SSRF-class checks, React Router open-redirect/XSS risks, postcss, minimatch/braces, sourcemaps, Vite and other package chains are also present.
- Sites v25: **critical Next.js** advisory and high findings in sharp/libvips, source-map-js and postcss, plus other dev tools. npm suggests changes crossing former release boundaries (e.g. Next 16.4.1), requiring runtime QA. **Never use v25 as a shortcut to refresh the production Site**.
- Copilot-era monorepo: four critical package findings, including old Vitest/`tinypool` and `shell-quote`; it is historical reference code only.
- Current `sites-current`: pins Next 16.3.8, React/RSC 19.2.8, Vite 8.2.1, Wrangler 4.148.0 and has an independently verified **local bounded `braces` fork** (`vendor/braces-bounded`). `sites-current/tests/braces-security.test.mjs` asserts the patch hashes and rejects the published DoS payload. The npm advisory snapshot reports ZERO findings for this actual locked current Site. No blind React/Next/Vite upgrade or removal of bounded fork is justified by this scan.

[Artifact #11969627761](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/38729332330/artifacts/11969627761) holds structured advisory paths, severities and feasible fixes. The report script `security/lockfile-audit.mjs` is repeatable and **read-only**.

## 2. Python package findings

`pip-audit 2.10.1` evaluated `requirements.txt` on GitHub Python 3.11 and reported **No known vulnerabilities found** for freshly resolved requirements. This does **not** verify any old deployed Python environment, because `requirements.txt` contains broad minimum versions (`>=`) and there is no reproducible Python production lock. The legacy Flask backend is a separate historical deployment route; the current Sites Worker does not run it.

[Python evidence artifact #11968728207](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/38729332330/artifacts/11968728207). Do not represent this as zero risk in the old historical Docker image.

## 3. Hardening implemented only on audit branch

1. `security/lockfile-audit.mjs`: audits all five npm lockfiles separately (full vs prod), no npm install/fix/lock rewrite, outputs JSON in GitHub artifact.
2. `security/verify-current-audit.mjs`: refuses to pass if the maintained `sites-current` or `qa` audit is missing, errored or contains **any** advisory; reports archived findings explicitly but does not treat them as active Site vulnerabilities.
3. `security/security-controls.test.mjs`: regressions for fail-closed current audit, Playwright, no tooling-error false pass, local vendor patch provenance, workflow secret safety and v25 build restriction.
4. `.github/workflows/abcm-security-review.yml`: SHA-pinned GitHub Actions, Node24 and Python3.11 tests, local and archived lockfile advisory reports; Site Node24 compatibility run is isolated from production and does not deploy.
5. `.github/workflows/sites-v25.yml`: explicit `npm audit --package-lock-only --omit=dev --audit-level=high` **before** `npm install`/build/Docker; under its current critical findings v25 must fail closed rather than produce a new vulnerable image. The archive remains intact, no lockfile changes.
6. `.github/workflows/run-live-smoke.yml`: removes manually entered plaintext `fred_api_key` workflow_dispatch input, uses only GitHub `secrets.FRED_API_KEY`, does not append it to `GITHUB_ENV`, passes the existing env key into a container without putting the value in Docker command args, and fails if the key is absent. **This workflow is NOT executed in the audit** (would need secret and live FRED access).

### Important release constraints

- Do not change master, the published v91 Site, D1, snapshot/cycle formula, scheduled production data jobs, ABCM's HTTPS endpoints, repo visibility or BrangeCycle.
- Do not run `npm audit fix --force` in historical code, or upgrade archived React/Vitest/Vite/Next major versions without a separate port and tests. Preserve archived source for forensic/provenance reference; prohibit deployment.
- `sites-current/.npmrc` includes `audit=false` to keep the special managed installation deterministic. Explicit security scans are now necessary; do **not** mistake a clean `npm ci` for a security audit.
- Current Site compatibility with Node24 requires a completed real build/test on the isolated CI job; passing dependency audit alone is not Node24 deployment approval.
- Pin production Docker runtime images by digest in a future separately tested container release; the old `node:20-alpine` and `python:3.11-slim` historical Dockerfile are not the active Site and should remain excluded from deployment.

## 4. Next controlled options

**Option A (preferred):** leave historical frontend/v25/Copilot code archived and blocked for builds. Focus on `sites-current`, current D1 reliability, autonomous data checks and source integrity; regularly re-scan advisory index.

**Option B:** if legacy frontend must be supported, create a **separate migration project**, bump React Router/Vite/Vitest/Tailwind/ESLint across breaking majors, preserve features and implement full browser tests before enabling legacy builds. Do not conflate with current Sites or silently update 600+ lockfile lines.

**No commercial data-license change or financial-advice claim.**

### Verified post-patch QA (no deployment)

[GitHub Actions run #38730296300](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/actions/runs/38730296300), exact tested GitHub head `5907f537476ccefa661af5f13d13a7fb808d53a9`, **all 3 audit jobs PASS**:

- **7/7 new security regression tests** pass, including secret-dispatch deletion, historical build denial and fail-closed current-surface scans.
- Maintained Site `npm ci` and `npm audit --package-lock-only --audit-level=low` under Node 24: **0 known advisories** across the full Site lockfile, no waivers.
- Maintained Site **TypeScript, lint, Vinext production build and 192/192 tests PASS** with Node 24. The test pipeline uses local simulated upstream failures to test error handling; upstream 503 diagnostic lines in this run do **not** prove a real production provider outage.
- QA Playwright lockfile: **0 advisories**. The three historical JavaScript trees retain their explicit findings; the gate does not pass them off as current Site risks.
- Historical Python requirements: `pip-audit 2.10.1` reports no advisories for newly resolved packages; legacy installed-image runtime not tested.
- Supply-chain changes are audited in the **branch** only; no actual deployment or `master` merge.
- New GitHub Actions use immutable SHA-pinned action commits with Node24 runtimes and `contents: read`.

The Node24 test provides compatibility evidence, **not a production container rollout**: the current `sites-current/Dockerfile.selfhost` is still based on Node 22.14, and Worker/D1 deployed environment and actual production browsers have not been upgraded or tested on Node24.

**Disposition:** ACCEPT for PR review; no GitHub `master` merge or Site deployment until owner requests it and release-specific host/source/data tests pass.
