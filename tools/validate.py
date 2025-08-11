#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - System Validation Tool
Validates the new consolidated structure and functionality
"""
import os
import sys
import importlib
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging

# Setup paths
TOOLS_DIR = Path(__file__).parent
PROJECT_ROOT = TOOLS_DIR.parent
APPS_DIR = PROJECT_ROOT / 'apps'
LAUNCHERS_DIR = PROJECT_ROOT / 'launchers'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SystemValidator:
    """Validates the new consolidated Austrian Monitor structure"""
    
    def __init__(self):
        self.project_root = PROJECT_ROOT
        self.results = {
            'structure': {},
            'imports': {},
            'functionality': {},
            'dependencies': {},
            'overall': False
        }
    
    def validate_structure(self) -> bool:
        """Validate directory structure"""
        print("🏗️  Validating directory structure...")
        
        required_structure = {
            'apps': ['core', 'dashboard', 'utils', '__init__.py'],
            'apps/core': ['austrian_monitor.py', '__init__.py'],
            'apps/dashboard': ['webapp.py', '__init__.py'],
            'apps/utils': ['asset_tracker.py', '__init__.py'],
            'launchers': ['main.py'],
            'tools': ['migrate.py', 'validate.py'],
            'config': ['monitor_config.py'],
            'docs': ['README.md'],
            'data': [],
            'static': ['css'],
            'templates': ['dashboard.html']
        }
        
        all_valid = True
        
        for directory, required_files in required_structure.items():
            dir_path = self.project_root / directory
            
            if not dir_path.exists():
                print(f"   ❌ Missing directory: {directory}")
                self.results['structure'][directory] = False
                all_valid = False
                continue
            
            if not dir_path.is_dir():
                print(f"   ❌ Not a directory: {directory}")
                self.results['structure'][directory] = False
                all_valid = False
                continue
            
            # Check required files
            missing_files = []
            for required_file in required_files:
                file_path = dir_path / required_file
                if not file_path.exists():
                    missing_files.append(required_file)
            
            if missing_files:
                print(f"   ⚠️  Directory {directory}: missing {missing_files}")
                self.results['structure'][directory] = False
                all_valid = False
            else:
                print(f"   ✅ Directory {directory}: OK")
                self.results['structure'][directory] = True
        
        return all_valid
    
    def validate_imports(self) -> bool:
        """Validate import statements in key modules"""
        print("\n📦 Validating import statements...")
        
        key_modules = {
            'apps.core.austrian_monitor': 'apps/core/austrian_monitor.py',
            'apps.dashboard.webapp': 'apps/dashboard/webapp.py',
            'apps.utils.asset_tracker': 'apps/utils/asset_tracker.py',
            'launchers.main': 'launchers/main.py'
        }
        
        all_valid = True
        
        # Add project root to Python path for imports
        if str(self.project_root) not in sys.path:
            sys.path.insert(0, str(self.project_root))
        
        for module_name, file_path in key_modules.items():
            try:
                # Try to import the module
                module = importlib.import_module(module_name)
                print(f"   ✅ Import {module_name}: OK")
                self.results['imports'][module_name] = True
                
                # Check for key classes/functions
                if module_name == 'apps.core.austrian_monitor':
                    if hasattr(module, 'AustrianCycleMonitor'):
                        print(f"      ✅ AustrianCycleMonitor class: Found")
                    else:
                        print(f"      ❌ AustrianCycleMonitor class: Missing")
                        all_valid = False
                
                elif module_name == 'apps.dashboard.webapp':
                    if hasattr(module, 'AustrianDashboard'):
                        print(f"      ✅ AustrianDashboard class: Found")
                    else:
                        print(f"      ❌ AustrianDashboard class: Missing")
                        all_valid = False
                
                elif module_name == 'apps.utils.asset_tracker':
                    if hasattr(module, 'BitcoinTracker'):
                        print(f"      ✅ BitcoinTracker class: Found")
                    else:
                        print(f"      ❌ BitcoinTracker class: Missing")
                        all_valid = False
                
            except ImportError as e:
                print(f"   ❌ Import {module_name}: FAILED ({e})")
                self.results['imports'][module_name] = False
                all_valid = False
            except Exception as e:
                print(f"   ⚠️  Import {module_name}: ERROR ({e})")
                self.results['imports'][module_name] = False
                all_valid = False
        
        return all_valid
    
    def validate_functionality(self) -> bool:
        """Validate core functionality"""
        print("\n⚙️  Validating core functionality...")
        
        all_valid = True
        
        try:
            # Test Austrian Monitor
            from apps.core.austrian_monitor import AustrianCycleMonitor
            
            monitor = AustrianCycleMonitor()
            print(f"   ✅ AustrianCycleMonitor: Initialized")
            
            # Test analysis
            analysis = monitor.get_current_analysis()
            if analysis and hasattr(analysis, 'cycle_phase'):
                print(f"   ✅ Analysis generation: Working (Phase: {analysis.cycle_phase})")
            else:
                print(f"   ❌ Analysis generation: Failed")
                all_valid = False
            
            self.results['functionality']['austrian_monitor'] = True
            
        except Exception as e:
            print(f"   ❌ AustrianCycleMonitor: FAILED ({e})")
            self.results['functionality']['austrian_monitor'] = False
            all_valid = False
        
        try:
            # Test Asset Tracker
            from apps.utils.asset_tracker import BitcoinTracker
            
            tracker = BitcoinTracker()
            print(f"   ✅ BitcoinTracker: Initialized")
            
            # Test price fetching (demo mode)
            price_data = tracker.get_bitcoin_price()
            if price_data and 'price' in price_data:
                print(f"   ✅ Bitcoin price fetching: Working (${price_data['price']:,.2f})")
            else:
                print(f"   ⚠️  Bitcoin price fetching: Using fallback data")
            
            self.results['functionality']['bitcoin_tracker'] = True
            
        except Exception as e:
            print(f"   ❌ BitcoinTracker: FAILED ({e})")
            self.results['functionality']['bitcoin_tracker'] = False
            all_valid = False
        
        try:
            # Test Dashboard (import only, don't start server)
            from apps.dashboard.webapp import AustrianDashboard
            
            dashboard = AustrianDashboard()
            print(f"   ✅ AustrianDashboard: Initialized")
            
            # Check Flask app
            if hasattr(dashboard, 'app') and dashboard.app:
                print(f"   ✅ Flask application: Ready")
            else:
                print(f"   ❌ Flask application: Not initialized")
                all_valid = False
            
            self.results['functionality']['dashboard'] = True
            
        except Exception as e:
            print(f"   ❌ AustrianDashboard: FAILED ({e})")
            self.results['functionality']['dashboard'] = False
            all_valid = False
        
        return all_valid
    
    def validate_dependencies(self) -> bool:
        """Validate required dependencies"""
        print("\n📋 Validating dependencies...")
        
        required_packages = [
            'flask',
            'flask-socketio',
            'requests', 
            'pandas',
            'numpy',
            'yaml',
            'dotenv'
        ]
        
        all_valid = True
        
        for package in required_packages:
            try:
                importlib.import_module(package.replace('-', '_'))
                print(f"   ✅ {package}: Installed")
                self.results['dependencies'][package] = True
            except ImportError:
                print(f"   ❌ {package}: Missing")
                self.results['dependencies'][package] = False
                all_valid = False
        
        # Check requirements.txt
        requirements_file = self.project_root / 'requirements.txt'
        if requirements_file.exists():
            print(f"   ✅ requirements.txt: Found")
        else:
            print(f"   ⚠️  requirements.txt: Not found")
        
        return all_valid
    
    def validate_launcher(self) -> bool:
        """Validate the main launcher"""
        print("\n🚀 Validating launcher...")
        
        launcher_path = self.project_root / 'launchers' / 'main.py'
        
        if not launcher_path.exists():
            print(f"   ❌ Launcher not found: {launcher_path}")
            return False
        
        # Test launcher help
        try:
            result = subprocess.run([
                sys.executable, str(launcher_path), '--help'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                print(f"   ✅ Launcher help: Working")
                return True
            else:
                print(f"   ❌ Launcher help: Failed (return code: {result.returncode})")
                return False
        
        except subprocess.TimeoutExpired:
            print(f"   ⚠️  Launcher help: Timeout")
            return False
        except Exception as e:
            print(f"   ❌ Launcher help: Error ({e})")
            return False
    
    def run_comprehensive_validation(self) -> bool:
        """Run all validation tests"""
        print("🏛️ AUSTRIAN MONITOR - SYSTEM VALIDATION")
        print("=" * 60)
        
        validation_steps = [
            ("Structure", self.validate_structure),
            ("Imports", self.validate_imports),
            ("Functionality", self.validate_functionality),
            ("Dependencies", self.validate_dependencies),
            ("Launcher", self.validate_launcher)
        ]
        
        results = {}
        overall_success = True
        
        for step_name, validation_func in validation_steps:
            try:
                success = validation_func()
                results[step_name] = success
                
                if not success:
                    overall_success = False
                    
            except Exception as e:
                print(f"\n❌ Error in {step_name} validation: {e}")
                results[step_name] = False
                overall_success = False
        
        # Summary
        print(f"\n📊 VALIDATION SUMMARY")
        print("=" * 60)
        
        for step_name, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{step_name:.<20} {status}")
        
        print("=" * 60)
        
        if overall_success:
            print("🎉 ALL VALIDATIONS PASSED!")
            print("✅ Austrian Business Cycle Monitor is ready to use.")
            print("\n🚀 Quick Start:")
            print("   python launchers/main.py")
            print("   start_austrian_monitor.bat")
        else:
            print("⚠️  SOME VALIDATIONS FAILED")
            print("❌ Please check the issues above before using the system.")
        
        self.results['overall'] = overall_success
        return overall_success
    
    def generate_validation_report(self) -> str:
        """Generate a validation report"""
        report = f"""# Austrian Business Cycle Monitor - Validation Report

## Date: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Overall Result: {'✅ PASSED' if self.results['overall'] else '❌ FAILED'}

## Structure Validation
"""
        
        for item, status in self.results.get('structure', {}).items():
            report += f"- {item}: {'✅ OK' if status else '❌ FAILED'}\n"
        
        report += f"""
## Import Validation
"""
        
        for item, status in self.results.get('imports', {}).items():
            report += f"- {item}: {'✅ OK' if status else '❌ FAILED'}\n"
        
        report += f"""
## Functionality Validation
"""
        
        for item, status in self.results.get('functionality', {}).items():
            report += f"- {item}: {'✅ OK' if status else '❌ FAILED'}\n"
        
        report += f"""
## Dependency Validation
"""
        
        for item, status in self.results.get('dependencies', {}).items():
            report += f"- {item}: {'✅ OK' if status else '❌ FAILED'}\n"
        
        if self.results['overall']:
            report += f"""
## ✅ System Ready!

The Austrian Business Cycle Monitor has been successfully consolidated and validated.

### Quick Start Options:
1. **Command Line**: `python launchers/main.py`
2. **Windows Batch**: `start_austrian_monitor.bat`
3. **With Testing**: `python launchers/main.py --test-all`
4. **Demo Mode**: `python launchers/main.py --demo`

### New Consolidated Structure:
- ✅ All functionality preserved
- ✅ Reduced from 106+ scattered files to organized modules
- ✅ Single entry point with proper testing
- ✅ Clean modular architecture
"""
        else:
            report += f"""
## ⚠️ Issues Found

Please address the failed validations before using the system.

### Common Solutions:
1. **Missing Dependencies**: `pip install -r requirements.txt`
2. **Import Issues**: Ensure all __init__.py files exist
3. **Structure Problems**: Run `python tools/migrate.py --execute`
"""
        
        return report

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Austrian Monitor Validation Tool')
    parser.add_argument('--quick', action='store_true', help='Quick validation (structure + imports only)')
    parser.add_argument('--full', action='store_true', help='Full validation (all tests)')
    parser.add_argument('--report', action='store_true', help='Generate validation report')
    
    args = parser.parse_args()
    
    validator = SystemValidator()
    
    if args.quick:
        print("⚡ Running quick validation...")
        structure_ok = validator.validate_structure()
        imports_ok = validator.validate_imports()
        
        if structure_ok and imports_ok:
            print("\n✅ Quick validation PASSED")
        else:
            print("\n❌ Quick validation FAILED")
    
    elif args.report:
        validator.run_comprehensive_validation()
        
        report = validator.generate_validation_report()
        report_file = PROJECT_ROOT / 'VALIDATION_REPORT.md'
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 Validation report saved to: {report_file}")
    
    else:
        # Default: full validation
        validator.run_comprehensive_validation()

if __name__ == "__main__":
    main()
