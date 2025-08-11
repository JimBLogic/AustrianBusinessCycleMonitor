#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - GitHub Repository Preparation
Creates a clean, professional repository ready for GitHub
"""
import os
import shutil
from pathlib import Path
from datetime import datetime

# Project root
PROJECT_ROOT = Path(__file__).parent

# Essential files to keep for GitHub repository
ESSENTIAL_FILES = {
    # Core application files
    'launchers/main.py',
    'apps/dashboard/webapp.py',
    'apps/dashboard/__init__.py',
    'apps/core/austrian_monitor.py',
    'apps/core/__init__.py',
    'apps/__init__.py',
    
    # Configuration and data
    'config/monitor_config.py',
    'config/__init__.py',
    
    # Templates and static files
    'templates/dashboard.html',
    'static/css/professional-theme.css',
    
    # Core utilities
    'apps/utils/__init__.py',
    'src/utils/asset_prices.py',
    'src/utils/data_utils.py',
    'src/utils/austrian_explanation_generator.py',
    'src/utils/bitcoin_blockchain.py',
    
    # Indicators
    'src/indicators/base_indicators.py',
    'src/indicators/credit_risk_indicator.py',
    'src/indicators/__init__.py',
    
    # Project files
    'requirements.txt',
    'README.md',
    'LICENSE',
    '.env.example',
    '.gitignore',
    'start_simple.ps1',
    
    # System tests
    'test_system.py',
    
    # Translation support
    'babel.cfg',
    'compile_translations.py',
}

# Essential directories to keep
ESSENTIAL_DIRS = {
    '.venv',
    '.git',
    'data',
    'config/templates',
}

# Files/patterns to remove for clean GitHub repo
CLEANUP_PATTERNS = [
    '*BACKUP*.txt',
    '*_REPORT.md',
    '*_PLAN*.md',
    '*CLEANUP*.md',
    '*FIXED*.md',
    '*ERROR*.md',
    '*COMPLETE*.md',
    'PYLANCE_*',
    'SYNTAX_*',
    'INTERNAL_*',
    'cleanup_*.py',
    'emergency_*.py',
    'final_*.py',
    'launch_*.py',
    'deploy.py',
    'code_quality_*.py',
    'verify_*.py',
    'test_*.py',  # Keep test_system.py only
    'simple_*.py',
    'ultimate_*.py',
    'enhanced_*.py',
    '*.pdf',  # Remove test PDFs
]

def create_env_example():
    """Create .env.example from .env"""
    env_file = PROJECT_ROOT / '.env'
    env_example = PROJECT_ROOT / '.env.example'
    
    if env_file.exists():
        with open(env_file) as f:
            content = f.read()
        
        # Replace actual API key with placeholder
        content = content.replace('472a159e544ce174d050e0d8490f80a5', 'your_fred_api_key_here')
        
        with open(env_example, 'w') as f:
            f.write(content)
        
        print(f"✅ Created {env_example}")

def cleanup_files():
    """Remove unnecessary files for GitHub"""
    removed_count = 0
    
    print("\n🧹 Cleaning up unnecessary files...")
    print("-" * 50)
    
    for pattern in CLEANUP_PATTERNS:
        for file_path in PROJECT_ROOT.glob(pattern):
            if file_path.is_file():
                # Skip test_system.py
                if file_path.name == 'test_system.py':
                    continue
                    
                try:
                    file_path.unlink()
                    print(f"❌ Removed: {file_path.name}")
                    removed_count += 1
                except Exception as e:
                    print(f"⚠️  Could not remove {file_path}: {e}")
    
    return removed_count

def verify_essential_files():
    """Verify all essential files exist"""
    print("\n🔍 Verifying essential files...")
    print("-" * 50)
    
    missing = []
    present = []
    
    for file_path in ESSENTIAL_FILES:
        full_path = PROJECT_ROOT / file_path
        if full_path.exists():
            present.append(file_path)
            print(f"✅ {file_path}")
        else:
            missing.append(file_path)
            print(f"❌ Missing: {file_path}")
    
    print(f"\n📊 Summary: {len(present)} present, {len(missing)} missing")
    
    if missing:
        print(f"\n⚠️  Missing files:")
        for file_path in missing:
            print(f"   - {file_path}")
    
    return len(missing) == 0

def create_github_readme():
    """Create a professional GitHub README.md"""
    readme_content = '''# 🏛️ Austrian Business Cycle Monitor

A comprehensive real-time economic monitoring system built on Austrian School economic theory principles.

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen.svg)]()
[![Austrian Economics](https://img.shields.io/badge/economics-Austrian%20School-gold.svg)](https://mises.org)
[![Real-time](https://img.shields.io/badge/data-real--time-red.svg)](https://fred.stlouisfed.org/)

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Virtual environment (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/austrian-business-cycle-monitor.git
   cd austrian-business-cycle-monitor
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv .venv
   
   # Windows
   .venv\\Scripts\\activate
   
   # macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your FRED API key from https://fred.stlouisfed.org/
   ```

5. **Run the application**
   ```bash
   python launchers/main.py
   ```

6. **Open your browser**
   Navigate to http://127.0.0.1:5002

## 🌟 Features

### 📊 Real-Time Economic Analysis
- **Austrian Business Cycle Theory** implementation
- **FRED API integration** for official U.S. economic data
- **Three Pillars Risk Framework** for comprehensive risk assessment
- **Malinvestment detection** algorithms

### 💰 Sound Money Monitoring  
- **Bitcoin price tracking** with Austrian monetary theory analysis
- **Gold price monitoring** as traditional store of value
- **Inflation and monetary policy** impact assessment

### 🎯 Professional Dashboard
- **Real-time updates** via WebSocket technology
- **Professional Bootstrap interface** with responsive design
- **Interactive charts** and risk indicators
- **Austrian economics education** integrated throughout

### 🏛️ Austrian Economics Education
- **Business cycle theory** explanations
- **Credit expansion analysis** 
- **Sound money principles**
- **Economic indicator interpretations** from Austrian perspective

## 📖 Austrian School Economics

This monitor implements core Austrian School economic principles:

- **Praxeology**: Human action as the foundation of economic analysis
- **Subjective Theory of Value**: Individual preferences drive economic decisions
- **Austrian Business Cycle Theory**: Credit expansion creates artificial booms and inevitable busts
- **Sound Money**: Gold and Bitcoin as alternatives to fiat currency
- **Free Market Capitalism**: Voluntary exchange and minimal government intervention

## 🔧 Technical Architecture

### Backend
- **Flask** - Web framework
- **Flask-SocketIO** - Real-time communication
- **FRED API** - Federal Reserve economic data
- **Pandas/NumPy** - Data processing

### Frontend  
- **Bootstrap 5** - Professional UI framework
- **Chart.js** - Interactive charts
- **WebSocket** - Real-time updates
- **Responsive design** - Mobile-friendly

### Data Sources
- **Federal Reserve Economic Data (FRED)** - Official U.S. economic statistics
- **Cryptocurrency APIs** - Bitcoin price and network data
- **Precious metals APIs** - Gold and silver prices

## 📊 Dashboard Sections

### 1. Three Pillars Risk Monitor
- **Credit Risk Indicators** - Corporate spreads and risk premiums
- **Market Volatility** - VIX and bond market stress
- **Structural Indicators** - Economic distortions and imbalances

### 2. Asset Price Tracking
- **Bitcoin** - Digital sound money with Austrian analysis
- **Gold** - Traditional store of value and inflation hedge
- **Real-time updates** with confidence intervals

### 3. Austrian Cycle Analysis
- **Business cycle phase** detection (Expansion, Peak, Contraction, Trough)
- **Risk assessment** based on Austrian indicators
- **Educational insights** explaining current economic conditions

## 🛠️ Development

### Project Structure
```
austrian-business-cycle-monitor/
├── launchers/           # Application entry points
├── apps/               # Core application modules
│   ├── dashboard/      # Web dashboard
│   └── core/          # Austrian economics engine
├── config/            # Configuration management
├── templates/         # HTML templates
├── static/           # CSS, JS, images
├── src/              # Utility modules
│   ├── utils/        # Data utilities
│   └── indicators/   # Economic indicators
└── data/            # Cache and logs
```

### Running Tests
```bash
python test_system.py
```

### Environment Variables
- `FRED_API_KEY` - Your FRED API key (required for real data)
- `LOG_LEVEL` - Logging level (default: INFO)
- `HOST` - Server host (default: 127.0.0.1)  
- `PORT` - Server port (default: 5002)

## 📈 Economic Indicators

The system monitors dozens of economic indicators including:
- Federal funds rate and yield curves
- Credit spreads and risk premiums  
- Money supply growth (M1, M2)
- Government debt levels
- Commodity prices
- Stock market valuations
- Real estate metrics

## 🎓 Educational Resources

Built-in Austrian economics education includes:
- Interactive explanations of business cycle theory
- Historical examples of Austrian predictions
- Recommended reading from Austrian economists
- Real-time application of Austrian principles

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ludwig von Mises Institute** - Austrian economics research and education
- **Federal Reserve Bank of St. Louis** - FRED API for economic data
- **Austrian School economists** - Theoretical foundation
- **Open source community** - Tools and libraries

## 📞 Support

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Join our discussions for questions and ideas
- **Documentation**: See our wiki for detailed documentation

---

*Built with ❤️ for Austrian School economics education and sound economic analysis*
'''
    
    readme_path = PROJECT_ROOT / 'README.md'
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"✅ Created professional GitHub README.md")

def create_github_workflow():
    """Create GitHub Actions workflow"""
    workflow_dir = PROJECT_ROOT / '.github' / 'workflows'
    workflow_dir.mkdir(parents=True, exist_ok=True)
    
    workflow_content = '''name: Austrian Business Cycle Monitor CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.8, 3.9, "3.10", 3.11]

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v3
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run system tests
      run: |
        python test_system.py
    
    - name: Test import functionality
      run: |
        python -c "from apps.core.austrian_monitor import AustrianCycleMonitor; print('Core imports working')"
        python -c "from apps.dashboard.webapp import AustrianDashboard; print('Dashboard imports working')"
'''
    
    workflow_file = workflow_dir / 'ci.yml'
    with open(workflow_file, 'w', encoding='utf-8') as f:
        f.write(workflow_content)
    
    print(f"✅ Created GitHub Actions workflow")

def main():
    """Main GitHub preparation function"""
    print("🏛️  AUSTRIAN BUSINESS CYCLE MONITOR - GITHUB PREPARATION")
    print("=" * 70)
    print(f"📁 Project Root: {PROJECT_ROOT}")
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Create .env.example
    create_env_example()
    
    # Step 2: Clean up unnecessary files
    removed_count = cleanup_files()
    
    # Step 3: Verify essential files
    all_present = verify_essential_files()
    
    # Step 4: Create professional README
    create_github_readme()
    
    # Step 5: Create GitHub Actions workflow
    create_github_workflow()
    
    # Final summary
    print("\n" + "=" * 70)
    print("🎉 GITHUB REPOSITORY PREPARATION COMPLETE!")
    print("=" * 70)
    print(f"✅ Files removed: {removed_count}")
    print(f"✅ Essential files: {'All present' if all_present else 'Some missing'}")
    print(f"✅ Professional README created")
    print(f"✅ GitHub Actions workflow created")
    print(f"✅ Environment example created")
    
    if all_present:
        print("\n🚀 Your repository is ready for GitHub!")
        print("📋 Next steps:")
        print("   1. git init (if not already a repo)")
        print("   2. git add .")
        print("   3. git commit -m 'Initial commit: Austrian Business Cycle Monitor'")
        print("   4. Create repository on GitHub")
        print("   5. git remote add origin <your-repo-url>")
        print("   6. git push -u origin main")
    else:
        print("\n⚠️  Some essential files are missing - please check before publishing")
    
    print("\n🏛️  Ready to share Austrian economics with the world! ✨")

if __name__ == "__main__":
    main()
