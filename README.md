# 🏛️ Austrian Business Cycle Monitor

A comprehensive real-time economic monitoring system built on Austrian School economic theory principles.

[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Production Ready](https://img.shields.io/badge/status-production--ready-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-19%20passing-success.svg)]()
[![Austrian Economics](https://img.shields.io/badge/economics-Austrian%20School-gold.svg)](https://mises.org)
[![Real-time](https://img.shields.io/badge/data-real--time-red.svg)](https://fred.stlouisfed.org/)

## ✨ What's New - Production Ready!

**The Austrian Business Cycle Monitor is now fully operational with modern React + TypeScript frontend!**

- ✅ **Professional Dashboard**: 6 chart types, 8 real-time KPI cards, interactive tooltips
- ✅ **Immersive Features**: AI situation analysis, Austrian theory integration, source verification
- ✅ **Production Stack**: Flask backend + React 19 frontend, fully tested
- ✅ **Comprehensive Docs**: Complete guides, Austrian economics education, API reference

**👉 [Quick Start](./QUICK_START.md) | [Project History](./PROJECT_HISTORY.md) | [Documentation Index](./docs/INDEX.md)**

## 🚀 Quick Start

> **New to the project?** Check out our [Quick Start Guide](./QUICK_START.md) for detailed setup instructions!

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- A FRED API key (free): https://fred.stlouisfed.org/

### Local Development (Current Stack)

The current stack is Flask (backend/API) + React/Vite (frontend). The Flask app serves the built frontend directly from `packages/frontend/dist`.

1. Install Python dependencies
   ```bash
   pip install -r requirements.txt
   ```

2. Build the frontend
   ```bash
   cd packages/frontend
   npm install
   npm run build
   cd ../..
   ```

3. Set your FRED API key (PowerShell example)
   ```powershell
   $env:FRED_API_KEY = "YOUR_FRED_API_KEY"
   ```

4. Run the dashboard (Flask)
   ```bash
   python apps/dashboard/webapp.py
   ```

5. Open the app
   - Dashboard: http://127.0.0.1:5002
   - Health: http://127.0.0.1:5002/api/health
   - Status: http://127.0.0.1:5002/api/status
   - **NEW**: Data manifest (verifiability): http://127.0.0.1:5002/api/data-manifest

### 🔬 Verifiability & Transparency

Every metric comes with **provenance records** linking to primary sources (FRED series, BIS stats, etc.). Check the following endpoints:

- `/api/explanations` — Detailed explanations and clickable sources for each metric
- `/api/analysis` — Analysis results with embedded `provenance` fields mapping metrics to source series
- `/api/three-pillars` — Three-pillars data with `provenance` for monetary, credit, and real economy metrics
- `/api/data-manifest` — Schema and provenance summary for all endpoints

### Legacy Installation (Original Method)

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

5. **Run the application (current entry point)**
   ```bash
   # Build frontend (one time or when UI changes)
   cd packages/frontend && npm install && npm run build && cd ../..

   # Run Flask dashboard
   python apps/dashboard/webapp.py
   ```

6. **Open your browser**
   Navigate to http://127.0.0.1:5002

> Note: The Docker section in older docs was removed during cleanup. If you want a containerized deploy (e.g., Google Cloud Run), we can add a minimal Dockerfile on request.

## ☁️ Hosting Options

You have three good deployment paths—choose based on your needs:

### 1) GitHub Pages / Netlify (Frontend) + Managed Backend (Recommended)
- Host the built frontend (`packages/frontend/dist`) on GitHub Pages, Netlify, or Vercel
- Host the Flask API on a platform like Render, Railway, Fly.io, or a small VPS
- Set the frontend to call your API by configuring `VITE_API_URL`

Steps:
1. Deploy frontend (static):
   - GitHub Pages: publish `packages/frontend/dist` (may need `base` in Vite if using a repo path)
   - Netlify: drag-and-drop `dist/` or connect repo, build: `npm run build`, publish: `packages/frontend/dist`
2. Deploy backend:
   - Render/Railway: new Python web service
   - Start command example:
     ```bash
     gunicorn -k gevent -w 1 -b 0.0.0.0:$PORT 'apps.dashboard.webapp:create_app()'
     ```
   - Set env vars: `FRED_API_KEY`, `SECRET_KEY`
3. Point the frontend to backend:
   - Build with: `VITE_API_URL=https://your-api.example.com npm run build`

### 2) Firebase Hosting (.web.app) + Cloud Run (Single Domain)
- Frontend on Firebase Hosting (`.web.app`)
- Backend on Google Cloud Run (container or buildpack)
- Use Firebase Hosting rewrites to proxy `/api` to Cloud Run, so your app is entirely under `.web.app`

Sample `firebase.json`:
```json
{
  "hosting": {
    "public": "packages/frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/**", "run": { "serviceId": "abcm-backend", "region": "us-central1" } },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

Cloud Run start command example (websockets optional):
```bash
gunicorn -k gevent -w 1 -b 0.0.0.0:$PORT 'apps.dashboard.webapp:create_app()'
```

### 3) Single VM/Container (All-in-one)
- Any VM (AWS Lightsail/EC2, DigitalOcean, etc.)
- Install Python + Node, build frontend, run Flask systemd service
- Or run via Docker/Cloud Run (we can add a Dockerfile if you prefer)

> WebSockets/SocketIO: The app uses Flask-SocketIO with `threading` by default. Most platforms work fine for REST polling. For true websockets at scale, prefer `gevent`/`eventlet` workers.

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

### 📚 Learning Resources

- **[Austrian Economics: 0 to Hero Guide](./docs/AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md)** - Complete learning path from beginner to expert
- **[Austrian Quick Reference](./docs/AUSTRIAN_QUICK_REFERENCE.md)** - Quick lookup for key concepts
- **[Web Dashboard Guide](./docs/WEB_DASHBOARD_GUIDE.md)** - Dashboard features and usage

## 📋 Documentation

### Essential Docs
- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 5 minutes
- **[Project History](./PROJECT_HISTORY.md)** - Complete feature timeline and achievements
- **[Documentation Index](./docs/INDEX.md)** - Full documentation catalog

### Technical Docs
- **[Frontend README](./packages/frontend/README.md)** - React + TypeScript architecture
- **[Features Guide](./docs/FEATURES.md)** - Component library and visual design system
- **[Data Fetching Strategy](./docs/DATA_FETCHING_STRATEGY.md)** - API integration patterns
- **[Verifiability Layer](./docs/VERIFIABILITY_LAYER.md)** - Provenance and source tracking
- **[Security Guidelines](./SECURITY.md)** - Secrets management and best practices

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

### Developer Setup (VS Code + Windows)

Set up a local virtual environment and install both runtime and development dependencies. The repo includes a `.vscode/settings.json` that points VS Code to this venv and enables pytest.

1) Create and select the workspace venv

```powershell
python -m venv .venv ; .\.venv\Scripts\python.exe -m pip install --upgrade pip
```

2) Install dependencies (runtime + dev tools)

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt ; \
.\.venv\Scripts\python.exe -m pip install -r dev-requirements.txt
```

3) Run tests

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Notes:
- VS Code should auto-detect `.venv` via the workspace settings. If not, use the interpreter picker and select `.venv`.
- Dev tools include `pytest`, `black`, and `ruff` aligned with `pyproject.toml`.
- If you use PowerShell profiles, you can add an alias to shorten `.venv` commands.

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
