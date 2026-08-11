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

If the target cannot provide those backend capabilities, use the repository's
separate Flask/React/Docker production path documented in the root README and
`docs/DEPLOYMENT.md` instead of publishing a frontend-only imitation.

## Deployment matrix

| Goal | Supported path | Same Sites UI and API | Persistent data |
| --- | --- | --- | --- |
| Managed production | ChatGPT Sites with `DB` and `BUCKET` | Yes | Hosted D1 and R2 |
| Local native development | `npm run dev` | Yes | Project-local emulation |
| Local container mirror | `compose.local.yml` | Yes | Named Docker volumes |
| Traditional VPS production | Root `compose.production.yml` | No; maintained Flask/React runtime | SQLite volume |

GitHub Pages alone cannot host `sites-current/`: it only serves static files and
cannot provide the Worker API, D1, R2 or server-side refresh gate. Use Sites or
a compatible Cloudflare Worker host for the exact application.

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
