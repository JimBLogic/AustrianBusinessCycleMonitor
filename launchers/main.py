#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - Main Launcher
Unified entry point for the consolidated system
"""
import os
import sys
import logging
import argparse
from datetime import datetime
from pathlib import Path

# Setup paths
LAUNCHER_DIR = Path(__file__).parent
PROJECT_ROOT = LAUNCHER_DIR.parent
APPS_DIR = PROJECT_ROOT / 'apps'
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(APPS_DIR))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_dependencies() -> bool:
    """Check if required dependencies are available"""
    print("🔍 Checking dependencies...")
    
    # Check if we're in a virtual environment
    import sys
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("   ✅ Virtual environment detected")
    else:
        venv_path = PROJECT_ROOT / '.venv'
        if venv_path.exists():
            print("   ⚠️  Virtual environment available but not activated")
            print("   💡 Activate with: .venv\\Scripts\\activate (Windows)")
            print("   💡 Or use: start_austrian_monitor.bat")
        else:
            print("   ⚠️  No virtual environment detected")
    
    missing = []
    
    # Check Flask
    try:
        import flask
        print("   ✅ Flask available")
    except ImportError:
        missing.append("flask")
        print("   ❌ Flask not available")
    
    # Check Flask-SocketIO
    try:
        import flask_socketio
        print("   ✅ Flask-SocketIO available")
    except ImportError:
        missing.append("flask-socketio")
        print("   ❌ Flask-SocketIO not available")
    
    # Check requests (for APIs)
    try:
        import requests
        print("   ✅ Requests available")
    except ImportError:
        missing.append("requests")
        print("   ❌ Requests not available")
    
    # Check optional dependencies
    try:
        import fredapi
        print("   ✅ FRED API available")
    except ImportError:
        print("   ⚠️  FRED API not available (will use demo data)")
    
    if missing:
        print(f"\n❌ Missing required dependencies: {', '.join(missing)}")
        print("💡 Install with: pip install " + " ".join(missing))
        return False
    
    print("✅ All required dependencies available")
    return True

def check_environment() -> dict:
    """Check environment configuration"""
    print("\n🔧 Checking environment...")
    
    env_status = {
        'fred_api_key': os.getenv('FRED_API_KEY'),
        'secret_key': os.getenv('SECRET_KEY'),
        'port': os.getenv('PORT', '5002'),
        'host': os.getenv('HOST', '127.0.0.1')
    }
    
    print(f"   FRED API Key: {'✅ Set' if env_status['fred_api_key'] else '⚠️  Not set (demo mode)'}")
    print(f"   Secret Key: {'✅ Set' if env_status['secret_key'] else '⚠️  Using default'}")
    print(f"   Port: {env_status['port']}")
    print(f"   Host: {env_status['host']}")
    
    # Load .env file if available
    env_file = PROJECT_ROOT / '.env'
    if env_file.exists():
        print(f"   ✅ .env file found: {env_file}")
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file)
            print("   ✅ Environment loaded from .env")
        except ImportError:
            print("   ⚠️  python-dotenv not available, using system environment")
    else:
        print("   ⚠️  .env file not found, using system environment")
    
    return env_status

def launch_dashboard(port=5002, host='127.0.0.1', debug=False) -> bool:
    """Launch the Austrian dashboard"""
    print(f"\n🚀 Launching Austrian Business Cycle Monitor...")
    print("=" * 60)
    
    try:
        # Import consolidated dashboard
        from apps.dashboard.webapp import AustrianDashboard
        
        # Create and run dashboard
        dashboard = AustrianDashboard(port=int(port), host=host)
        success = dashboard.run(debug=debug)
        
        return success
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure all files are in the correct directories")
        return False
    except Exception as e:
        print(f"❌ Launch error: {e}")
        logger.error(f"Launch error: {e}")
        return False

def launch_abcm_dashboard(port=5002, host='127.0.0.1', debug=False) -> bool:
    """Launch dashboard via new abcm migration package (backward compatible)."""
    print(f"\n🚀 Launching Austrian Business Cycle Monitor via abcm package...")
    print("=" * 60)
    try:
        from abcm import create_app, get_monitor  # migration layer
        app = create_app()
        monitor = get_monitor()
        print("   ✅ abcm package loaded (migration layer active)")
        print(f"   ➜ Using underlying monitor class: {monitor.__class__.__name__}")
        # Avoid circular import of SocketIO; underlying monitor handles run
        monitor.host = host
        monitor.port = port
        monitor.run()
        return True
    except Exception as e:
        print(f"❌ abcm launch failed: {e}")
        logger.error(f"abcm launch error: {e}")
        return False

def launch_core_test() -> bool:
    """Test the core Austrian monitor"""
    print("\n🏛️ Testing Austrian Core Monitor...")
    print("=" * 60)
    
    try:
        from apps.core.austrian_monitor import AustrianCycleMonitor
        
        monitor = AustrianCycleMonitor()
        analysis = monitor.analyze()
        
        print("✅ Core monitor test successful")
        print(f"   Cycle Phase: {analysis.cycle_phase}")
        print(f"   Risk Level: {analysis.risk_level}")
        print(f"   Austrian Score: {monitor.calculate_austrian_score()}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Core import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Core test error: {e}")
        return False

def launch_utils_test() -> bool:
    """Test utility modules"""
    print("\n💰 Testing Utility Modules...")
    print("=" * 60)
    
    try:
        from apps.utils.asset_tracker import BitcoinTracker, AssetPriceManager
        
        # Test Bitcoin tracker
        bitcoin = BitcoinTracker()
        price_data = bitcoin.get_bitcoin_price()
        print(f"✅ Bitcoin Tracker: ${price_data.get('price_usd', 0):,.2f}")
        
        # Test Asset manager
        assets = AssetPriceManager()
        all_prices = assets.get_all_asset_prices()
        print(f"✅ Asset Manager: {len(all_prices.get('prices', {})) if all_prices else 0} assets")
        
        return True
        
    except ImportError as e:
        print(f"❌ Utils import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Utils test error: {e}")
        return False

def main():
    """Main launcher function"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Austrian Business Cycle Monitor - Consolidated Launcher')
    parser.add_argument('--port', '-p', type=int, default=5002, help='Port to run dashboard on')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug mode')
    parser.add_argument('--test-core', action='store_true', help='Test core monitor only')
    parser.add_argument('--test-utils', action='store_true', help='Test utilities only')
    parser.add_argument('--test-all', action='store_true', help='Test all components')
    parser.add_argument('--skip-deps', action='store_true', help='Skip dependency check')
    parser.add_argument('--abcm', action='store_true', help='Launch using new abcm package shim')
    
    args = parser.parse_args()
    
    # Print header
    print("🏛️ AUSTRIAN BUSINESS CYCLE MONITOR")
    print("   Consolidated System Launcher")
    print("=" * 60)
    print(f"   Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Project Root: {PROJECT_ROOT}")
    print("=" * 60)
    
    # Check dependencies unless skipped
    if not args.skip_deps and not check_dependencies():
        return 1
    
    # Check environment
    env_status = check_environment()
    
    # Handle test modes
    if args.test_core:
        success = launch_core_test()
        return 0 if success else 1
    
    if args.test_utils:
        success = launch_utils_test()
        return 0 if success else 1
    
    if args.test_all:
        print("\n🧪 Running All Tests...")
        print("=" * 60)
        
        core_success = launch_core_test()
        utils_success = launch_utils_test()
        
        if core_success and utils_success:
            print("\n✅ All tests passed - system ready!")
        else:
            print("\n❌ Some tests failed - check configuration")
        
        return 0 if (core_success and utils_success) else 1
    
    # Default: launch dashboard
    port = args.port or int(env_status.get('port', 5002))
    host = args.host or env_status.get('host', '127.0.0.1')
    
    if args.abcm:
        success = launch_abcm_dashboard(port=port, host=host, debug=args.debug)
    else:
        success = launch_dashboard(port=port, host=host, debug=args.debug)
    
    if success:
        print("\n✅ Austrian Business Cycle Monitor session completed")
        return 0
    else:
        print("\n❌ Austrian Business Cycle Monitor failed to start")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n🛑 Interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)
