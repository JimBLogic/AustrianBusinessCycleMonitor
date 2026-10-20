# ABCM production and BrangeCycle experiments

Read `docs/PROJECT_ISOLATION.md` before changing deployment, ingestion, storage,
economic calculations or code copied from another project.

- The maintained public Sites app is `sites-current/`, mirrored to the ABCM Site.
  `sites-v25/` is historical. The root Flask/React stack has separate unresolved
  quality/security gates and must not replace the public Site.
- ABCM is the stable product. BrangeCycle is an independent private experiment.
  Never change ABCM as a side effect of work requested only for BrangeCycle.
- Reuse reviewed source at a pinned commit, with its license and provenance.
  Neither app may depend on the other app being online. Do not call peer write
  endpoints, share deployment credentials, reuse a live database, or replace an
  entire application tree with the peer's tree.
- Promote one bounded improvement through an ABCM PR with parity/regression,
  failure/recovery and relevant desktop/mobile ES/EN evidence. Experimental
  formulas must retain their identity until independently reviewed.
- Preserve last-known-good snapshots and rollback versions. Do not turn stale,
  unavailable or insufficient-coverage data into fresh values or a passing gate.
- Run `node --test automation/project-isolation.test.mjs` and
  `node automation/project-isolation.mjs`, plus checks appropriate to the change.
  Preserve the production watch, refresh and browser workflows.
- Publication, merges and wider changes must stay within the user's current
  authorization. A BrangeCycle release is never authorization to publish ABCM.
