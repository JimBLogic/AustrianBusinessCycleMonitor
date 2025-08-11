# README for /templates

This folder now contains a single authoritative production template:

* dashboard.html – Consolidated, internationalized (English/Spanish), accessibility & performance optimized.

Legacy/duplicate variants removed to reduce maintenance overhead; this directory intentionally contains only the production template.

Guidelines:
1. Add new UI sections directly within dashboard.html (consider modularizing into components only if a proper frontend build step is later introduced).
2. Keep accessibility (ARIA roles, focus management, color contrast) intact when editing.
3. Use data-testid attributes for elements that integration tests must target.
4. Avoid inline duplication—prefer small JS utility functions already present near the end of the file.
5. If future theming or multi-template support is required, reintroduce via a templates/subdirectory with explicit justification in docs.

Change Log (Template Folder):
- 2025-08-10: Pruned obsolete variants; standardized on dashboard.html.
