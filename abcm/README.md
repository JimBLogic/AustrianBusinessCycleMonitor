# ABCM Package (Migration Layer)

This directory introduces a unified import path for the Austrian Business Cycle Monitor while preserving the existing `main_application.py` implementation.

## Provided
- `create_app()` -> returns the Flask app (use in WSGI / ASGI deployment or tests)
- `get_monitor()` -> returns the singleton monitor instance

## Usage
```python
from abcm import create_app
app = create_app()
```

## Next Steps (Planned Refactor)
1. Gradually move core logic from `main_application.py` into `abcm/core` and `abcm/utils` modules.
2. Replace ad-hoc globals with service classes (pricing, cycle analysis, education, translations).
3. Provide thin API blueprint modules for cleaner route grouping.

This layer is intentionally minimal and non-invasive.
