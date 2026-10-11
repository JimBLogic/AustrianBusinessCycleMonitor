"""Tests for version synchronization.

Ensures that ``apps.__version__`` matches ``apps.version.PROJECT_VERSION``
and that the string looks like a semantic version ``MAJOR.MINOR.PATCH``.
"""
import re


def test_version_alignment():
    import apps  # type: ignore
    from apps import version as v  # type: ignore

    assert hasattr(apps, "__version__"), "apps module must expose __version__"
    assert apps.__version__ == v.PROJECT_VERSION, "Version drift detected"
    assert re.match(r"^\d+\.\d+\.\d+$", apps.__version__), "Version must be semantic (x.y.z)"
