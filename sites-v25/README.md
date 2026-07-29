# Austrian Business Cycle Monitor — Sites v25

This directory preserves the complete source of the solid ChatGPT Sites version
published at:

<https://austrian-business-cycle-monitor.jimblogic.chatgpt.site/>

It is intentionally isolated from the repository's Flask/React production
stack. The two implementations can evolve without deleting the trusted FRED
ingestion, deterministic snapshot, and read-only API work already present in
the repository.

## Included experience

- Spanish and English public interfaces.
- The three original pillars: monetary policy, credit markets, and the real
  economy.
- Shared server snapshot with a controlled refresh window.
- Browser-local personal briefing and radar.
- Data timestamps and next-refresh countdown.
- Learning routes for Austrian economics and Bitcoin sovereignty.
- Source, link, content-integrity, and rendered-HTML checks.
- D1/R2-ready workspace and export APIs for Sites hosting.

Version 25 is the immutable reference snapshot for this import. Later work
should use new commits rather than rewriting its history.

## One-command local run with Docker

Requirements: Docker Desktop or Docker Engine with Compose v2.

```bash
docker compose up --build
```

Open <http://localhost:3000>. Stop it with:

```bash
docker compose down
```

The Compose service runs the same Vinext application with local D1/R2
simulations from `vite.config.ts`. It does not need a FRED key for the shared
public snapshot flow.

To use another host port:

```bash
ABCM_SITES_PORT=4173 docker compose up --build
```

## Native local run

Requirements:

- Node.js 22.13 or newer.
- npm.
- Linux, WSL2, or another environment with Bash, `curl`, `flock`, and GNU
  `timeout`.

```bash
npm run install:ci
npm run dev -- --host 0.0.0.0 --port 3000
```

Open <http://localhost:3000>.

## Validation

```bash
npm test
```

This builds the deployable Cloudflare Worker artifact, validates the emitted
Sites manifest and worker export, checks bilingual content integrity, and
verifies rendered metadata.

The Docker validation target performs the same gate in an isolated Node 22
environment:

```bash
docker build --target validate .
```

## Deployment paths

- **ChatGPT Sites:** the canonical hosted instance uses `.openai/hosting.json`
  and the Sites lifecycle.
- **Cloudflare-compatible hosting:** `npm run build` emits the Worker artifact
  under `dist/`.
- **Other container or cloud platforms:** use the Docker definition as a
  reproducible build environment, then adapt the generated Worker or run the
  local Vinext target behind the platform's ingress.

The local Docker path is for reproducibility and development. The public Sites
deployment remains the production reference until a separate hosting migration
is tested and approved.

## Repository hygiene

Starter examples, unused template artwork, generated TypeScript build metadata,
and unreferenced helpers are intentionally excluded. The content-integrity
tests guard against their accidental return. Product routes, D1/R2 bindings,
migration history, and reproducible build assets remain maintained even when
they are not linked from public navigation.

## Architecture

```text
controlled server refresh
        ↓
shared cached snapshot
        ↓
all visitors download the same data
        ↓
each browser creates its local personal briefing
```

This prevents one thousand visitors from becoming one thousand simultaneous
provider refreshes. A refresh occurs only when the shared cache expires or an
authorised update is requested.

## Scope and attribution

The monitor applies Austrian-school concepts as an educational analytical lens.
José Luis Cava and other public Bitcoin/Austrian-economics educators are
influences, not attributed authors of the model, index, or three-pillar
framework.

This project is educational and analytical software, not financial advice.
