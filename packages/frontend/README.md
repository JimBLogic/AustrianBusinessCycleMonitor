# Austrian Business Cycle Monitor — trusted frontend

This package is the maintained React/Vite interface for the Flask trusted-snapshot API. The public entrypoint is `src/main.tsx`, which mounts `PublicApp` and the evidence-first production dashboard.

## Requirements

- Node.js 20+
- npm
- The Flask application on `http://127.0.0.1:5002` for API-backed development

## Development

```bash
npm ci
npm run dev
```

Open <http://127.0.0.1:8080>. Vite proxies `/api` to port 5002.

Run the backend from the repository root in a separate terminal:

```bash
python entrypoint.py
```

## Validation

```bash
npm run type-check
npm run test -- --run
npm run build
npm run lint
```

The required CI gate runs type-checking, tests, and the production build. Lint is currently reported separately while older components are retired.

## Public-data contract

- Render persisted trusted snapshots and honest unavailable/stale states.
- Preserve observation dates, formulas, freshness, and primary-source links.
- Keep English and Spanish production translations aligned.
- Do not reintroduce the experimental dashboard, authentication scaffolding, or fabricated fallback metrics into the public entrypoint.

The full production container builds this package and serves `dist/` through Flask; see the root [README](../../README.md) and [deployment guide](../../docs/DEPLOYMENT.md).
