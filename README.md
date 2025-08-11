# 🏛️ Austrian Business Cycle Monitor

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
   .venv\Scripts\activate
   
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

   Or with Docker (build + run):
   ```bash
   docker build -t abcm:latest .
   docker run -p 5002:5002 --env FRED_API_KEY=your_key_here abcm:latest
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
Use pytest (the test suite lives in the `tests/` directory):
```bash
pytest -q
```

Key tested surfaces:
- Core Austrian cycle monitor logic
- REST API endpoints (`/api/status`, `/api/current-data`, `/api/analysis`, `/api/market-data`, `/api/three-pillars`, `/api/bitcoin-price`)
- Metadata & schema (`/api/meta`, `/api/openapi.json`)
- Package / template integrity

### API Discovery
- Service metadata: `GET /api/meta`
- Minimal OpenAPI-style spec: `GET /api/openapi.json`
   (Use this to bootstrap client integrations.)

### Repository Inventory / Tracking
Generate an up-to-date manifest of every file & folder (counts, sizes, language breakdown):
```bash
python tools/file_manifest.py
```
Outputs:
- `docs/REPO_MANIFEST.md` (human-readable summary)
- `docs/manifest.json` (machine-readable for automation)

### Versioning
The canonical version lives in `apps/version.py` (exported also as `apps.__version__`).
Automated drift test: `tests/test_version.py`.
Use the helper:
```bash
python tools/bump_version.py patch
```
Valid bump parts: `major | minor | patch` (supports `--dry-run`).

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
