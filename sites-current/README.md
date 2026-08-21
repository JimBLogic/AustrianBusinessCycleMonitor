# Austrian Business Cycle Monitor — maintained Sites application

This directory is the maintained source of the public application:
[austrian-business-cycle-monitor.jimblogic.chatgpt.site](https://austrian-business-cycle-monitor.jimblogic.chatgpt.site).

Do not infer the active release from a README heading. The two authoritative
release checks are:

- [`app/version.ts`](app/version.ts) in the source tree;
- [`/api/health`](https://austrian-business-cycle-monitor.jimblogic.chatgpt.site/api/health)
  in the deployed application.

The repository may retain `sites-v25/` as a frozen historical snapshot. It is
not maintained, deployed, or used as the starting point for new work.

## What runs here

The frontend and backend are one deployable TypeScript application:

- React/Next-compatible pages rendered by Vinext;
- API routes under `app/api/`;
- a Cloudflare Worker entry point in `worker/index.ts`;
- local or hosted D1 persistence through the `DB` binding;
- local or hosted R2 file storage through the `BUCKET` binding;
- optional authenticated workspace routes;
- official macroeconomic providers plus explicit fallback and freshness states.

The public dashboard also includes a non-scored six-force context layer for
Treasury yields, federal debt, WTI oil, manufacturing conditions, the broad
dollar, and Bitcoin. It preserves agreement and contradiction instead of
reducing the result to a positive/negative color. The manufacturing input is
the Chicago Fed CFSEC regional survey proxy (`CFSBCACTIVITYMFG`), clearly
labeled as not ISM PMI and kept outside the ten-signal composite.

Public routes include `/`, `/learn`, `/api/data`, `/api/bitcoin`,
`/api/data-manifest`, and `/api/health`. The authenticated `/workspace` route
and its file/export APIs are intentionally absent from public navigation.

## Recreate the current web application locally

### Requirements

- Git;
- Node.js `>=22.13.0`;
- Bash on Linux, macOS, or WSL2;
- an optional [FRED API key](https://fred.stlouisfed.org/docs/api/api_key.html)
  for the primary FRED REST path.

### 1. Clone the canonical repository

```bash
git clone https://github.com/JimBLogic/AustrianBusinessCycleMonitor.git
cd AustrianBusinessCycleMonitor/sites-current
```

Always start from `sites-current/`. The numbered `sites-v*/` directories are
historical references.

### 2. Install the locked dependencies

```bash
npm run install:ci
```

The install script verifies the lockfile and package integrity, uses a
project-local cache, and refuses overlapping installs.

### 3. Configure optional local secrets

Create an ignored `.dev.vars` file in `sites-current/`:

```dotenv
FRED_API_KEY=replace-with-your-own-key
```

Never commit `.dev.vars`, `.env*`, API keys, database exports, or credentials.
Without a FRED key the application keeps the limitation visible and uses its
documented official-source fallback mesh; it does not invent neutral values.

### 4. Start frontend and backend together

```bash
npm run dev
```

Open `http://localhost:5173`. Vite serves the frontend while Miniflare runs the
Worker and API routes in the same process. The development configuration creates
project-local D1 and R2 emulators for the `DB` and `BUCKET` bindings, so a
second backend terminal is not required.

Local runtime state is stored beneath ignored project directories such as
`.wrangler/` and `.sites-runtime/`. Delete those directories only when you
intentionally want a fresh local database and bucket.

### 5. Validate the reconstruction

```bash
npm run lint
npm test
npm run build
npm run validate:artifact
```

Then check:

```bash
curl http://localhost:5173/api/health
curl http://localhost:5173/api/data-manifest
```

A valid production artifact contains `dist/server/index.js` with a default
Worker `fetch` export and `dist/.openai/hosting.json` with the binding names.

### Local container mirror

The exact Sites application can also run locally in a container, including
Miniflare-backed D1 and R2 emulation:

```bash
cp .dev.vars.example .dev.vars
docker compose --env-file .dev.vars -f compose.local.yml up --build
```

Open `http://localhost:5173`. The named volumes preserve the local database and
object store between container replacements. Stop it with:

```bash
docker compose --env-file .dev.vars -f compose.local.yml down
```

Add `-v` only when you intentionally want to erase the local D1/R2 state. This
container is a reproducible local mirror and QA environment; it is not the
recommended Internet-facing production server because it runs the Cloudflare
development emulator.

## Hosting the current frontend and backend

The maintained Sites deployment packages both layers together. There is no
separate static frontend that can be hosted safely while ignoring its API,
D1, R2, and Worker requirements.

### ChatGPT Sites — maintained production path

1. Import or edit the `austrian-business-cycle-monitor` Site from the canonical
   `sites-current/` source.
2. Preserve `.openai/hosting.json`; `DB` and `BUCKET` are logical binding names,
   not credentials or portable resource IDs.
3. Provision or retain one D1 database bound as `DB` and one R2 bucket bound as
   `BUCKET`.
4. Add `FRED_API_KEY` as a hosted secret/environment value. Never place it in
   Git or in `.openai/hosting.json`.
5. Run the locked build and artifact validation.
6. Create an immutable Sites checkpoint, publish it, and wait for the deployment
   status to become `succeeded`.
7. Verify `/api/health`, `/api/data`, `/api/bitcoin`, and the visible release
   identity before treating the release as complete.

### Another Cloudflare account or hosting provider

Treat `worker/index.ts`, the API routes, D1 schema/migrations, R2 storage, and
security headers as one system. A new host must provide compatible Worker,
database, object-storage, secrets, and scheduled-refresh semantics. Create
host-specific deployment configuration outside the maintained Sites manifest;
do not replace the logical `DB`/`BUCKET` bindings with secrets or production IDs
in committed source.

### Exact self-hosted mirror on a VPS

`compose.selfhost.yml` runs the same compiled Worker artifact, client assets,
routes and API contract as Sites. Wrangler's local Workers runtime supplies
persistent D1/R2-compatible storage, and Caddy provides the public HTTPS edge.

```bash
cp .env.selfhost.example .env.selfhost
```

For local HTTP, keep `DOMAIN=http://localhost`. For an Internet-facing server,
set `DOMAIN` to a real DNS name pointing at the VPS and optionally set
`FRED_API_KEY`. Then start the exact mirror:

```bash
docker compose --env-file .env.selfhost -f compose.selfhost.yml up -d --build
docker compose --env-file .env.selfhost -f compose.selfhost.yml ps
```

Verify it through the configured domain:

```bash
curl -fsS https://YOUR_DOMAIN/api/health
curl -fsS https://YOUR_DOMAIN/api/data-manifest
```

The `abcm-worker-data` volume preserves macro editions, workspace records and
objects across image replacements. Back it up before host migrations or major
runtime upgrades. Run one `monitor` replica: the local D1/R2 emulator is a
single-host persistence layer, not a distributed database.

The root Flask/React `compose.production.yml` remains available for historical
compatibility, but it is not required for an exact visual mirror and should not
be placed in front of this frontend.

## Deployment matrix

| Goal | Supported path | Same Sites UI and API | Persistent data |
| --- | --- | --- | --- |
| Managed production | ChatGPT Sites with `DB` and `BUCKET` | Yes | Hosted D1 and R2 |
| Local native development | `npm run dev` | Yes | Project-local emulation |
| Local container mirror | `compose.local.yml` | Yes | Named Docker volumes |
| Exact VPS self-host | `compose.selfhost.yml` | Yes | Named Worker-runtime volume |
| Historical VPS runtime | Root `compose.production.yml` | No; separate Flask/React UI | SQLite volume |

GitHub Pages alone cannot host `sites-current/`: it only serves static files and
cannot provide the Worker API, D1, R2 or server-side refresh gate. Use Sites,
the exact VPS stack, or a compatible Cloudflare Worker host.

## Data, migrations, and backups

- `db/runtime.ts` manages D1-backed records and macro snapshots.
- `db/schema.ts` defines the maintained database schema.
- `drizzle/` contains committed migrations.
- `npm run db:generate` creates a migration after an intentional schema change.
- R2 objects and D1 data are runtime state and are not recreated by cloning Git.

Back up hosted D1 and R2 data separately before migration or provider changes.
Source control recreates the application, not its production records.

## Release discipline

1. Change source in the maintained checkout.
2. Update `app/version.ts` once for the next immutable Sites release.
3. Run lint, tests, the production build, and dependency audit.
4. Publish and verify the Site.
5. Mirror the exact source into `sites-current/` through a PR.
6. Merge only after CI is green and no review thread remains unresolved.

README prose intentionally avoids claiming a fixed “latest” release number.
That value changes; `app/version.ts` and `/api/health` are the machine-verifiable
sources of truth.

## Path-scoped CI

GitHub validates the maintained and historical applications independently:

- changes under `sites-current/` run the exact Sites/self-host build, tests,
  dependency audit, Compose validation, and one production-container smoke;
- changes to the historical Flask/React application run its backend, frontend,
  and production Docker checks without rebuilding the maintained Sites image;
- workflow-level `cancel-in-progress` replaces superseded runs on the same
  branch instead of consuming runners for obsolete commits.

The split changes scheduling only. It does not remove a release gate, and public
web requests never trigger GitHub Actions.
