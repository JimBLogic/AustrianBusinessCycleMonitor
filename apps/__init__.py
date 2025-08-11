"""Austrian Business Cycle Monitor - Apps Package.

Exports a single canonical ``__version__`` sourced from :mod:`apps.version`.
All internal and external consumers should import ``apps.__version__`` OR
``PROJECT_VERSION`` from ``apps.version``. This avoids drifting literals.
"""

from .version import PROJECT_VERSION as __version__  # noqa: F401

__all__ = ["__version__"]
