## Consolidated History

Removed transient/empty marker, backup, and legacy files to streamline the codebase. See git history for exact prior contents.

Categories removed:
- Completion/status markers (COMPLETE_*, *_SUCCESS_REPORT.md)
- Redundant README variants (FINAL / ULTIMATE)
- Legacy dashboard & monitor scripts
- Obsolete test & verification stubs
- Deprecated launch/start wrappers (now unified under apps/)
- Translation/demo scaffolding outside core scope

Benefits: clarity, lower maintenance, accurate metrics, reduced cognitive load.

2025-08-10 (Later Pass): Removed redundant Python variants (apps/dashboard/webapp_{fixed,complete,perfect}.py and apps/utils/asset_tracker_{backup,clean}.py) and legacy template variants (dashboard_ultimate.html, dashboard_working.html, index.html, simple_dashboard.html) to enforce a single canonical implementation: apps/dashboard/webapp.py + templates/dashboard.html.

Date: 2025-08-10.

2025-08-10 (Final Legacy Tree Prune): Archived and removed legacy top-level `app/` and `src/` trees after confirming all active imports now resolve exclusively within `apps/`. Prior to deletion a zip archive snapshot (`legacy_code_YYYYMMDD_HHMMSS.zip`) was generated under repository root for historical reference. This eliminates duplicate monitor/dashboard/indicator/utility implementations, reducing maintenance surface and enforcing the single canonical architecture:

```
apps/
	core/            # AustrianCycleMonitor
	dashboard/       # AustrianDashboard Flask app & API
	utils/           # Asset & Bitcoin tracking, shared utilities
```

Impact: ~ (many) legacy Python/HTML files removed (see git diff). Tests pass post-prune; manifest regenerated next step.
