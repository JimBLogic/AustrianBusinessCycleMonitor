#!/usr/bin/env python3
"""Archive legacy directories (app/, src/, archive/) into a timestamped zip.

Run this prior to permanently deleting legacy directories so history is
preserved outside the active tree. Safe to run multiple times; each
archive gets a new timestamp.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import time

LEGACY_DIRS = ["app", "src", "archive"]


def archive_legacy() -> Path:
    root = Path(__file__).parent.parent
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    zip_path = root / f"legacy_code_{timestamp}.zip"
    with ZipFile(zip_path, 'w', ZIP_DEFLATED) as zf:
        for dirname in LEGACY_DIRS:
            dir_path = root / dirname
            if not dir_path.exists():
                continue
            for file in dir_path.rglob('*'):
                if file.is_file():
                    zf.write(file, file.relative_to(root).as_posix())
    return zip_path


def main():
    zip_path = archive_legacy()
    print(f"✅ Archived legacy directories to: {zip_path}")
    print("Review the archive; if satisfied you can remove originals:")
    for d in LEGACY_DIRS:
        print(f"  - {d}/")
    print("Delete only after ensuring no active imports depend on them.")


if __name__ == '__main__':
    main()
