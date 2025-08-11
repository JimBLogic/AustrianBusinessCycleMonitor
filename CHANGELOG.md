## Changelog

All notable changes to this project will be documented in this file.
The format is based on Keep a Changelog and adheres to Semantic Versioning.

### [Unreleased]
- Docker containerization (multi-stage slim image)
- Automated version bump script stub
- Pending: ruff/black pre-commit, i18n consolidation

### [0.1.1] - 2025-08-09
#### Added
- Dockerfile and .dockerignore for container deployment
- Unified version export via apps.__init__.__version__ referencing apps.version.PROJECT_VERSION
- CHANGELOG initialized

#### Changed
- Removed hard-coded __version__ literal to prevent drift

### [0.1.0] - 2025-08-08
#### Added
- Central PROJECT_VERSION constant (apps/version.py)
- Repository manifest tooling (tools/file_manifest.py)
- Kubernetes deployment scaffolding (k8s/)
- Meta & pseudo OpenAPI endpoints
- Initial test suite (pytest) and CI workflow

#### Fixed
- Static analysis warning in tests/test_schema.py by asserting dashboard app instance

---
Older historical changes prior to 0.1.0 were part of exploratory consolidation and are not retro-documented here.
