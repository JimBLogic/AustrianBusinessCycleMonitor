#!/usr/bin/env python3
"""Simple semantic version bumper.

Usage:
  python tools/bump_version.py [major|minor|patch] [--dry-run]

Updates apps/version.py PROJECT_VERSION and writes an Unreleased section stub
to CHANGELOG if missing. Git operations are NOT performed automatically.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = PROJECT_ROOT / "apps" / "version.py"
CHANGELOG = PROJECT_ROOT / "CHANGELOG.md"

SEMVER_RE = re.compile(r'PROJECT_VERSION:\s*str\s*=\s*"(\d+\.\d+\.\d+)"')


def read_version() -> str:
    text = VERSION_FILE.read_text(encoding="utf-8")
    m = SEMVER_RE.search(text)
    if not m:
        raise SystemExit("Could not find PROJECT_VERSION in apps/version.py")
    return m.group(1)


def write_version(new_version: str) -> None:
    text = VERSION_FILE.read_text(encoding="utf-8")
    new_text = SEMVER_RE.sub(f'PROJECT_VERSION: str = "{new_version}"', text)
    VERSION_FILE.write_text(new_text, encoding="utf-8")


def bump(current: str, part: str) -> str:
    major, minor, patch = map(int, current.split("."))
    if part == "major":
        major += 1; minor = 0; patch = 0
    elif part == "minor":
        minor += 1; patch = 0
    elif part == "patch":
        patch += 1
    else:
        raise SystemExit("part must be one of major|minor|patch")
    return f"{major}.{minor}.{patch}"


def ensure_changelog():
    if not CHANGELOG.exists():
        CHANGELOG.write_text("## Changelog\n\n### [Unreleased]\n", encoding="utf-8")
        return
    content = CHANGELOG.read_text(encoding="utf-8")
    if "[Unreleased]" not in content:
        CHANGELOG.write_text("## Changelog\n\n### [Unreleased]\n\n" + content, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("part", choices=["major", "minor", "patch"], help="Version part to increment")
    parser.add_argument("--dry-run", action="store_true", help="Show new version without writing")
    args = parser.parse_args()

    current = read_version()
    new_version = bump(current, args.part)

    if args.dry_run:
        print(f"Current: {current} -> New: {new_version} (dry run)")
        return

    write_version(new_version)
    ensure_changelog()
    print(f"Bumped version: {current} -> {new_version}")


if __name__ == "__main__":  # pragma: no cover
    main()
