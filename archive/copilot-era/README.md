# Copilot-era archive

Archived on 2026-07-29 after comparing the repository with the trusted Flask/React/FRED production path and the published Sites v25 reference.

## What is here

- `docs/` — old quick starts, completion reports, visual-design notes, demo-data strategies, and superseded dashboard guides.
- `launchers/` — overlapping Windows start/test scripts and the interactive API-key setup helper.
- `runtime/` — the retired random-value mock Flask backend.
- `monorepo/` — root npm workspace metadata that referenced the absent `packages/backend` FastAPI/Poetry project.
- `deployment/` — retired Firebase hosting configuration.
- `cleanup/` — an incomplete historical destructive-cleanup script fragment, retained for audit only. Do not run it.

## Lessons retained

The old work established useful priorities that remain active: bilingual UX, approachable Windows onboarding, explicit troubleshooting, strong visual hierarchy, documented security expectations, and tests around the operator workflow. Those ideas now live in maintained code and concise documentation rather than duplicate root files.

The archive also records approaches that must not return unnoticed: fabricated fallback metrics, “ready/final” status documents as a substitute for tests, machine-specific Python paths, multiple competing launchers, and deployment instructions for infrastructure no longer present.

## Current authority

- Project and production: [`README.md`](../../README.md)
- Maintained docs: [`docs/INDEX.md`](../../docs/INDEX.md)
- Trusted React frontend: [`packages/frontend/README.md`](../../packages/frontend/README.md)
- Published Sites reference: [`sites-v25/README.md`](../../sites-v25/README.md)

Git history preserves the original paths; this directory keeps them browsable in one deliberate place.
