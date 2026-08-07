# Austrian Business Cycle Monitor — Sites v27

Maintained source for the public Austrian Business Cycle Monitor:
[austrian-business-cycle-monitor.jimblogic.chatgpt.site](https://austrian-business-cycle-monitor.jimblogic.chatgpt.site).

This checkout is the canonical source prepared for Sites release **27**. It
starts from the verified public v26 baseline and adds the maintained
source-resilience work in this release. Its public GitHub
mirror lives in
[`sites-current/`](https://github.com/JimBLogic/AustrianBusinessCycleMonitor/tree/master/sites-current);
`sites-v25/` is a frozen historical reference and is not the current code path.

The application combines a bilingual macroeconomic monitor with guided learning
paths. Its analysis is organized around three pillars: monetary policy, credit
markets, and the real economy.

## Public surface

- `/` — live macroeconomic monitor
- `/learn` — learning hub
- `/learn/austrian-economics` — Austrian economics course
- `/learn/bitcoin-sovereignty` — Bitcoin and monetary sovereignty course
- `/api/data` — normalized indicator snapshot
- `/api/data-manifest` — indicator provenance and metadata
- `/api/health` — runtime health

The authenticated `/workspace` route and its file/export APIs remain part of the
product, but are intentionally absent from public navigation.

## Architecture

- Next.js-compatible application rendered by Vinext on Cloudflare
- shared, cached macroeconomic snapshot with D1 persistence
- typed upstream registry, bounded retries, freshness limits, and explicit
  live/stale/last-known-good states
- browser-local monitor briefing and course progress
- Sign in with ChatGPT helpers for the protected workspace
- D1 and R2 bindings declared in `.openai/hosting.json`

## Local development

Requires Node.js `>=22.13.0` on Linux.

```bash
npm run install:ci
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
```

The Sites lifecycle performs the production build during checkpoint creation.
Use `npm run build` directly only for targeted diagnosis.

## Data and migrations

- `db/runtime.ts` manages the D1-backed indicator snapshot.
- `db/schema.ts` defines the maintained database schema.
- `drizzle/` contains committed migrations.
- `npm run db:generate` creates a migration after an intentional schema change.

## Repository hygiene

Starter examples, unused template artwork, generated TypeScript build metadata,
and unreferenced helpers are not committed. The content-integrity tests guard
against their accidental return. Product routes, persistent bindings, migration
history, and reproducible build assets must not be removed merely because they
are not linked from the public navigation.
