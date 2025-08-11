"""Test the repository manifest generator.

Ensures summarize() returns required keys and detects Python files.
"""
from pathlib import Path

from tools import file_manifest


def test_manifest_summary_structure():
    # Repo root two levels up from this test file
    root = Path(__file__).resolve().parent.parent
    records = file_manifest.collect_files(root)
    summary = file_manifest.summarize(records)
    required = {
        "generated",
        "root",
        "total_files",
        "total_size_bytes",
        "by_extension",
        "loc_by_extension",
        "empty_files",
    }
    assert required.issubset(summary.keys())
    assert summary["total_files"] > 0
    assert ".py" in summary["by_extension"], "Expected Python files to be present"
