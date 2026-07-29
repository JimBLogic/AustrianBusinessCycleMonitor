# Copilot instructions — Austrian Business Cycle Monitor

## Source of truth

This repository has two maintained application surfaces:

1. `apps/` plus `packages/frontend/`: the Flask/React/FRED/SQLite production pipeline.
2. `sites-v25/`: the reproducible source of the published ChatGPT Sites v25 reference.

Use `README.md`, `docs/INDEX.md`, and the nearest package README before changing code. Treat `archive/` as historical evidence only: do not import it, deploy it, or copy behavior from it without revalidating the data and security assumptions.

## Product rules

- Preserve the evidence-first contract. Never invent observations, silently substitute demo values, or present model output as official data.
- Every economic metric must retain source lineage, observation date, freshness, and formula or derivation.
- Missing or stale inputs must remain explicit.
- Keep public copy available in English and Spanish with matching translation keys.
- Describe Austrian-school interpretation as an educational analytical lens, not financial advice or certain prediction.
- Keep Sites v25 history reproducible; evolve it through new commits rather than rewriting the reference.

## Active architecture

- FRED ingestion: `apps/jobs/ingest_fred.py`
- Deterministic snapshots: `apps/jobs/build_trusted_snapshot.py`
- Read-only snapshot API: `apps/api/`
- Production Flask composition: `apps/dashboard/factory.py`, `wsgi.py`, and `entrypoint.py`
- Tested Python compatibility facade: `abcm/`
- Public React entrypoint: `packages/frontend/src/main.tsx` and `PublicApp`
- Production deployment: `Dockerfile`, `compose.production.yml`, and `Caddyfile`
- Sites reference: `sites-v25/`

## Change discipline

- Prefer focused modules and descriptive names.
- Do not add credentials, generated databases, provider responses, build output, or local logs to Git.
- Update tests and maintained docs with behavior changes.
- Validate backend tests, frontend type-check/tests/build, and the relevant Docker or Sites workflow.
- Put superseded material in `archive/copilot-era/` with context; do not create new root-level completion reports or duplicate launchers.
