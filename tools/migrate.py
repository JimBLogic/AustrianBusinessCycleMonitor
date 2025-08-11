#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - Migration & Cleanup Tool
Manages the transition to the new consolidated structure
"""
import os
import sys
import shutil
from pathlib import Path
from typing import List, Dict, Set, Any
import logging

# Setup paths
TOOLS_DIR = Path(__file__).parent
PROJECT_ROOT = TOOLS_DIR.parent
ARCHIVE_DIR = PROJECT_ROOT / 'archive'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProjectMigrator:
    """Handles migration to new consolidated structure"""
    
    def __init__(self):
        self.project_root = PROJECT_ROOT
        self.archive_dir = ARCHIVE_DIR
        
        # Ensure archive directory exists
        self.archive_dir.mkdir(exist_ok=True)
        
        # Files to preserve (don't move to archive)
        self.preserve_files = {
            'README.md',
            'requirements.txt', 
            'LICENSE',
            '.env',
            '.env.ultimate',
            '.gitignore',
            'babel.cfg',
            'translations.py'
        }
        
        # Directories to preserve
        self.preserve_dirs = {
            'apps',
            'launchers', 
            'tools',
            'archive',
            'docs',
            'config',
            'data',
            'static',
            'templates',
            'translations',
            '.git',
            '.vscode',
            '__pycache__'
        }
        
        # Patterns for redundant files
        self.redundant_patterns = [
            'main.py',
            'start_*.py',
            'launch_*.py',
            'run_*.py',
            'test_*.py',
            'verify_*.py',
            'emergency_*.py',
            'fix_*.py',
            'setup_*.py',
            'ultimate_*.py',
            'final_*.py',
            'deploy.py',
            'import_*.py',
            'minimal_*.py',
            'simple_*.py',
            'direct_*.py',
            'austrian_monitor*.py',
            'compile_*.py',
            'code_quality*.py',
            'system_*.py',
            'validate_*.py',
            'manual_*.py'
        ]
    
    def analyze_project(self) -> Dict[str, List[str]]:
        """Analyze current project structure"""
        analysis = {
            'redundant_files': [],
            'redundant_dirs': [],
            'preserved_files': [],
            'preserved_dirs': [],
            'new_structure': []
        }
        
        print("🔍 Analyzing project structure...")
        
        # Find all files and directories
        for item in self.project_root.iterdir():
            if item.is_file():
                if item.name in self.preserve_files:
                    analysis['preserved_files'].append(str(item.relative_to(self.project_root)))
                elif self._is_redundant_file(item.name):
                    analysis['redundant_files'].append(str(item.relative_to(self.project_root)))
            elif item.is_dir():
                if item.name in self.preserve_dirs:
                    if item.name in ['apps', 'launchers', 'tools']:
                        analysis['new_structure'].append(str(item.relative_to(self.project_root)))
                    else:
                        analysis['preserved_dirs'].append(str(item.relative_to(self.project_root)))
                else:
                    # Check if directory contains only redundant files
                    if self._is_redundant_directory(item):
                        analysis['redundant_dirs'].append(str(item.relative_to(self.project_root)))
        
        return analysis
    
    def _is_redundant_file(self, filename: str) -> bool:
        """Check if a file matches redundant patterns"""
        from fnmatch import fnmatch
        
        for pattern in self.redundant_patterns:
            if fnmatch(filename, pattern):
                return True
        
        # Additional checks
        if filename.endswith('.bat') and any(keyword in filename.lower() for keyword in ['start', 'launch', 'run']):
            return True
        
        if filename.endswith('.md') and any(keyword in filename.upper() for keyword in ['ERROR', 'RESOLVED', 'COMPLETE', 'STATUS']):
            return True
        
        return False
    
    def _is_redundant_directory(self, directory: Path) -> bool:
        """Check if a directory is redundant (old structure)"""
        # Skip if it's a preserve directory
        if directory.name in self.preserve_dirs:
            return False
        
        # Check for old src directory structure
        if directory.name == 'src':
            return True
        
        # Check for old app directory (but preserve our new apps directory)
        if directory.name == 'app' and (self.project_root / 'apps').exists():
            return True
        
        return False
    
    def create_migration_plan(self) -> Dict[str, Any]:
        """Create a detailed migration plan"""
        analysis = self.analyze_project()
        
        plan = {
            'phase1_archive_redundant': analysis['redundant_files'] + analysis['redundant_dirs'],
            'phase2_verify_new_structure': analysis['new_structure'],
            'phase3_update_routes': [],
            'summary': {
                'files_to_archive': len(analysis['redundant_files']),
                'dirs_to_archive': len(analysis['redundant_dirs']),
                'files_preserved': len(analysis['preserved_files']),
                'dirs_preserved': len(analysis['preserved_dirs'])
            }
        }
        
        return plan
    
    def execute_migration(self, dry_run: bool = True) -> bool:
        """Execute the migration plan"""
        plan = self.create_migration_plan()
        
        print(f"\n📋 Migration Plan {'(DRY RUN)' if dry_run else '(EXECUTING)'}")
        print("=" * 60)
        print(f"Files to archive: {plan['summary']['files_to_archive']}")
        print(f"Directories to archive: {plan['summary']['dirs_to_archive']}")
        print(f"Files preserved: {plan['summary']['files_preserved']}")
        print(f"Directories preserved: {plan['summary']['dirs_preserved']}")
        
        if not dry_run:
            confirmation = input(f"\n⚠️  This will move {len(plan['phase1_archive_redundant'])} items to archive. Continue? (y/N): ")
            if confirmation.lower() != 'y':
                print("Migration cancelled.")
                return False
        
        success = True
        
        # Phase 1: Archive redundant items
        print(f"\n📁 Phase 1: Archiving redundant items...")
        for item_path in plan['phase1_archive_redundant']:
            try:
                source = self.project_root / item_path
                destination = self.archive_dir / item_path
                
                if dry_run:
                    print(f"   WOULD MOVE: {item_path} → archive/{item_path}")
                else:
                    if source.exists():
                        # Create destination directory if needed
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        
                        # Move item
                        shutil.move(str(source), str(destination))
                        print(f"   ✅ MOVED: {item_path}")
                    else:
                        print(f"   ⚠️  NOT FOUND: {item_path}")
                        
            except Exception as e:
                print(f"   ❌ ERROR moving {item_path}: {e}")
                success = False
        
        # Phase 2: Verify new structure
        print(f"\n🏗️  Phase 2: Verifying new structure...")
        new_structure_items = [
            'apps/core/austrian_monitor.py',
            'apps/dashboard/webapp.py', 
            'apps/utils/asset_tracker.py',
            'launchers/main.py'
        ]
        
        for item in new_structure_items:
            item_path = self.project_root / item
            if item_path.exists():
                print(f"   ✅ VERIFIED: {item}")
            else:
                print(f"   ❌ MISSING: {item}")
                success = False
        
        if dry_run:
            print(f"\n💡 This was a dry run. Use --execute to perform actual migration.")
        elif success:
            print(f"\n✅ Migration completed successfully!")
        else:
            print(f"\n⚠️  Migration completed with some issues.")
        
        return success
    
    def create_cleanup_report(self) -> str:
        """Create a report of the cleanup"""
        analysis = self.analyze_project()
        
        report = f"""# Austrian Business Cycle Monitor - Project Cleanup Report

## Date: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary
- **Files to archive**: {len(analysis['redundant_files'])}
- **Directories to archive**: {len(analysis['redundant_dirs'])}
- **Files preserved**: {len(analysis['preserved_files'])}
- **Directories preserved**: {len(analysis['preserved_dirs'])}

## New Consolidated Structure
```
Monitoring/
├── apps/
│   ├── core/           # Austrian economics logic
│   ├── dashboard/      # Web interface
│   └── utils/          # Bitcoin, assets, translations
├── launchers/          # Single entry point
├── tools/              # Migration & maintenance
├── archive/            # Old redundant files
├── docs/               # Documentation
├── templates/          # Web templates
├── static/             # Web assets
└── data/               # Analysis data
```

## Redundant Files Found
"""
        for file_path in sorted(analysis['redundant_files']):
            report += f"- `{file_path}`\n"
        
        report += f"""
## Redundant Directories Found
"""
        for dir_path in sorted(analysis['redundant_dirs']):
            report += f"- `{dir_path}/`\n"
        
        report += f"""
## Benefits of New Structure
1. **Single Entry Point**: `python launchers/main.py`
2. **Modular Design**: Clear separation of concerns
3. **Reduced Clutter**: {len(analysis['redundant_files']) + len(analysis['redundant_dirs'])} fewer items in root
4. **Better Maintenance**: Consolidated functionality
5. **Preserved Functionality**: All Austrian economics features intact

## Next Steps
1. Run migration: `python tools/migrate.py --execute`
2. Test new system: `python launchers/main.py --test-all`
3. Start dashboard: `python launchers/main.py`
4. Use batch file: `start_austrian_monitor.bat`
"""
        
        return report

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Austrian Monitor Migration Tool')
    parser.add_argument('--analyze', action='store_true', help='Analyze current structure')
    parser.add_argument('--plan', action='store_true', help='Show migration plan')
    parser.add_argument('--execute', action='store_true', help='Execute migration')
    parser.add_argument('--report', action='store_true', help='Generate cleanup report')
    
    args = parser.parse_args()
    
    migrator = ProjectMigrator()
    
    if args.analyze or not any([args.plan, args.execute, args.report]):
        # Default action: analyze
        analysis = migrator.analyze_project()
        
        print("🏛️ AUSTRIAN MONITOR - PROJECT ANALYSIS")
        print("=" * 60)
        print(f"📁 Redundant files: {len(analysis['redundant_files'])}")
        print(f"📁 Redundant directories: {len(analysis['redundant_dirs'])}")
        print(f"✅ Preserved files: {len(analysis['preserved_files'])}")
        print(f"✅ Preserved directories: {len(analysis['preserved_dirs'])}")
        print(f"🏗️  New structure items: {len(analysis['new_structure'])}")
    
    if args.plan:
        plan = migrator.create_migration_plan()
        print("\n📋 MIGRATION PLAN")
        print("=" * 60)
        for item in plan['phase1_archive_redundant'][:10]:  # Show first 10
            print(f"   → archive/{item}")
        if len(plan['phase1_archive_redundant']) > 10:
            print(f"   ... and {len(plan['phase1_archive_redundant']) - 10} more items")
    
    if args.execute:
        migrator.execute_migration(dry_run=False)
    elif args.plan:
        migrator.execute_migration(dry_run=True)
    
    if args.report:
        report = migrator.create_cleanup_report()
        report_file = PROJECT_ROOT / 'MIGRATION_REPORT.md'
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 Report saved to: {report_file}")
        print("=" * 60)
        print(report[:1000] + "..." if len(report) > 1000 else report)

if __name__ == "__main__":
    main()
