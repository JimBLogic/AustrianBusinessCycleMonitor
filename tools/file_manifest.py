#!/usr/bin/env python3
"""Repository File & Folder Inventory Generator

Generates a comprehensive manifest of the repository structure to support
ongoing cleanup, auditing, and historical tracking. Outputs both a Markdown
summary (`docs/REPO_MANIFEST.md`) and a machine-readable JSON file
(`docs/manifest.json`).

Usage:
    python tools/file_manifest.py
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"

EXCLUDE_DIR_NAMES = {
    ".git",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    ".mypy_cache",
    ".coverage",
}

EXCLUDE_FILE_GLOBS = {
    "*.pyc",
    "*.pyo",
    "*.log",
}

TEXT_EXTENSIONS = {".py", ".md", ".txt", ".json", ".yml", ".yaml", ".html", ".css", ".js", ".cfg", ".ini"}


@dataclass
class FileRecord:
    path: str
    size: int
    extension: str
    is_empty: bool


def matches_glob(name: str, patterns: set[str]) -> bool:
    import fnmatch
    return any(fnmatch.fnmatch(name, pat) for pat in patterns)


def collect_files(root: Path) -> List[FileRecord]:
    records: List[FileRecord] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIR_NAMES]
        for fname in filenames:
            if matches_glob(fname, EXCLUDE_FILE_GLOBS):
                continue
            fpath = Path(dirpath) / fname
            try:
                size = fpath.stat().st_size
            except OSError:
                continue
            records.append(
                FileRecord(
                    path=str(fpath.relative_to(root)).replace(os.sep, "/"),
                    size=size,
                    extension=fpath.suffix.lower(),
                    is_empty=size == 0,
                )
            )
    return records


def line_count(path: Path) -> int:
    try:
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            return 0
        with path.open("r", encoding="utf-8", errors="ignore") as fh:
            return sum(1 for _ in fh)
    except Exception:
        return 0


def summarize(records: List[FileRecord]):
    total_size = sum(r.size for r in records)
    by_ext: Dict[str, Dict[str, int]] = {}
    empty_files = [r.path for r in records if r.is_empty]
    loc_by_ext: Dict[str, int] = {}

    for r in records:
        by_ext.setdefault(r.extension or "(none)", {"files": 0, "bytes": 0})
        by_ext[r.extension or "(none)"]["files"] += 1
        by_ext[r.extension or "(none)"]["bytes"] += r.size
        if r.extension in TEXT_EXTENSIONS:
            loc_by_ext[r.extension] = loc_by_ext.get(r.extension, 0) + line_count(ROOT / r.path)

    # Use timezone-aware ISO timestamp (local offset) to avoid deprecation of utcnow
    generated_ts = datetime.now().astimezone().isoformat()
    return {
        "generated": generated_ts,
        "root": str(ROOT.name),
        "total_files": len(records),
        "total_size_bytes": total_size,
        "by_extension": by_ext,
        "loc_by_extension": loc_by_ext,
        "empty_files": empty_files,
    }


def write_outputs(summary):
    DOCS_DIR.mkdir(exist_ok=True, parents=True)
    with (DOCS_DIR / "manifest.json").open("w", encoding="utf-8") as jf:
        json.dump(summary, jf, indent=2)

    md_lines: List[str] = []
    md_lines.append(f"# Repository Manifest ({summary['root']})")
    md_lines.append("")
    md_lines.append(f"Generated: {summary['generated']}")
    md_lines.append("")
    md_lines.append("## Totals")
    md_lines.append(f"* Files: {summary['total_files']}")
    md_lines.append(f"* Size (bytes): {summary['total_size_bytes']}")
    md_lines.append("")
    md_lines.append("## By Extension (files / bytes)")
    for ext, stats in sorted(summary["by_extension"].items(), key=lambda kv: -kv[1]["files"]):
        md_lines.append(f"* `{ext or '(none)'}`: {stats['files']} files / {stats['bytes']} bytes")
    if summary.get("loc_by_extension"):
        md_lines.append("")
        md_lines.append("## Lines of Code (approx)")
        for ext, loc in sorted(summary["loc_by_extension"].items(), key=lambda kv: -kv[1]):
            md_lines.append(f"* `{ext}`: {loc} LOC")
    if summary.get("empty_files"):
        md_lines.append("")
        md_lines.append("## Empty / Placeholder Files")
        for p in sorted(summary["empty_files"]):
            md_lines.append(f"* {p}")
    md_lines.append("")
    md_lines.append("_Regenerate with: `python tools/file_manifest.py`_")
    with (DOCS_DIR / "REPO_MANIFEST.md").open("w", encoding="utf-8") as mf:
        mf.write("\n".join(md_lines))


def main() -> int:
    records = collect_files(ROOT)
    summary = summarize(records)
    write_outputs(summary)
    print(f"Manifest generated: {DOCS_DIR / 'REPO_MANIFEST.md'}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
