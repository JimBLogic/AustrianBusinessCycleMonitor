## Repository Cleanup TODO (Active)

Legend: [ ] pending  [x] done

### Completed This Pass
* [x] Unified versioning (apps.__version__ -> apps.version.PROJECT_VERSION)
* [x] Added Dockerfile & CI Docker build
* [x] Added version bump tool & version test
* [x] Pruned duplicate/legacy root scripts (austrian_monitor*.py, dashboard_definitivo.py, emergency_* scripts, ultimate_main.py, simple_translator.py)
* [x] Removed obsolete template variants (dashboard_ultimate.html, dashboard_working.html, index.html, simple_dashboard.html) – single authoritative dashboard.html retained

### Deletions Completed This Pass
Removed legacy/duplicate variants and empty placeholder files (executed cleanup wave on 2025-08-10 @ latest commit):
- apps/dashboard: webapp_complete.py, webapp_fixed.py, webapp_perfect.py (now deleted; single canonical webapp.py retained)
- apps/utils: asset_tracker_backup.py, asset_tracker_clean.py (now deleted; asset_tracker.py retained)
- Root legacy/empty scripts: austrian_monitor.py, austrian_monitor_ultimate.py, dashboard_definitivo.py, emergency_dashboard.py, emergency_fix.py, main_application.py, ultimate_main.py
- Bulk removed unused empty test/demo scripts & stubs (see CONSOLIDATED_HISTORY.md)
- Template duplicates: dashboard_ultimate.html, dashboard_working.html, index.html, simple_dashboard.html (deleted; only dashboard.html authoritative)

Second pruning wave (2025-08-09):
- Removed additional empty/duplicate launcher & verification scripts: launch_austrian_monitor.py, launch_dashboard.py, run_dashboard.py, start_dashboard.py, start_multilingual.py, start_webapp.py, quick_test.py, quick_test_fixed.py, simple_test.py, manual_interconnection_test.py, system_audit.py, system_test.py, prepare_github_repo.py
- Removed deprecated translation/ultimate variants: austrian_monitor.py, austrian_monitor_ultimate.py, ultimate_main.py, setup_ultimate.py, simple_translator.py (already noted above if previously logged)
- Removed redundant verification & placeholder stubs (consolidated 2025-08-10)
- Removed unused asset tracker variants (already logged) reaffirmed after audit
- Removed template variants (already logged) reaffirmed
- Migration: `abcm/app.py` now wraps `AustrianDashboard` (apps.dashboard.webapp) instead of legacy `main_application.py`; legacy main_application retained temporarily until explicit deletion approved (NOT deleted yet in earlier log; safe to mark for future removal once tests confirm no references)

Post-prune action: ensure `tests/test_abcm_package.py` still passes (uses get_monitor/get_dashboard_data compatibility layer).

Next: prune blank markdown reports or consolidate into a single LEGACY_NOTES.md (pending).
* [x] Redundant dashboard python variants (webapp_fixed.py, webapp_complete.py, webapp_perfect.py) – removed
* [x] Obsolete asset tracker variants (asset_tracker_backup.py, asset_tracker_clean.py) – removed
* [x] Unused template variants (dashboard_working.html, dashboard_ultimate.html, index.html, simple_dashboard.html) – removed

After deletion run: `python tools/file_manifest.py` to refresh manifest.
* [x] Removed obsolete asset tracker legacy files (asset_tracker_backup.py, asset_tracker_clean.py)
* [x] Removed empty placeholder root scripts (ultimate_main.py, validate_system.py, verify_complete.py, translations.py)
* [x] Added SECURITY.md

### Next Recommended Steps
1. [x] Decide fate of legacy trees: `app/`, `src/`, `archive/` (archived & pruned on 2025-08-10; retained `archive/` dir placeholder + generated zip snapshot)
2. [x] Migrate any still-unique logic from `src/utils/*` into `apps/utils` (confirmed redundant; all superseded by canonical implementations)
3. [x] Consolidate scattered markdown success/status reports (removed individual marker files; summarized in CONSOLIDATED_HISTORY.md)
4. [ ] Expand pytest suite (asset price endpoints, translation switching, analysis schema)
5. [ ] Unify i18n (pick JSON or PO/MO; remove duplicate format)
6. [ ] Add `.gitignore` entries for data outputs (`data/*.json`, `data/*.csv`, `logs/*.log` if not already)
7. [ ] Create minimal OpenAPI spec or endpoint reference for APIs
8. [ ] Add pre-commit config (black/ruff/mypy/secret-scan) (optional)

### Verification After Future Passes
Run:
```
python tools/validate.py
pytest -q
```

Ensure no imports reference removed modules (grep before deleting large legacy dirs).

### Notes
Legacy directories retained intentionally until explicit approval to delete. This file tracks incremental safe reductions.
