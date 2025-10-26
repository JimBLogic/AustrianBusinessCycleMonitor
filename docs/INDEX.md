# 📚 Documentation Index

Complete guide to all documentation in the Austrian Business Cycle Monitor project.

---

## 🚀 Getting Started

### Essential Reading (Start Here)
1. **[README.md](../README.md)** - Project overview, features, and quick introduction
2. **[QUICK_START.md](../QUICK_START.md)** - 5-minute setup guide for Flask + Vite stack
3. **[WEB_DASHBOARD_GUIDE.md](WEB_DASHBOARD_GUIDE.md)** - Complete dashboard feature documentation

---

## 📖 Austrian Economics Education

### Learning Path
1. **[AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md](AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md)** (651 lines)
   - Complete learning guide from beginner to expert
   - Historical origins and key figures (Mises, Hayek, Rothbard)
   - Core principles and methodology
   - Business cycle theory explained
   - Reading list and practical applications

2. **[AUSTRIAN_QUICK_REFERENCE.md](AUSTRIAN_QUICK_REFERENCE.md)** (149 lines)
   - Quick reference for Austrian concepts
   - Key figures quick facts
   - Learning path by skill level
   - Integration with monitoring system

---

## 🏗️ Technical Documentation

### Architecture & Development
1. **[packages/frontend/README.md](../packages/frontend/README.md)**
   - React + TypeScript frontend architecture
   - Component structure and data flow
   - Development setup and scripts
   - Build configuration and deployment

2. **[DATA_FETCHING_STRATEGY.md](DATA_FETCHING_STRATEGY.md)**
   - Data source architecture (multi-tier approach)
   - Efficient fetching patterns (caching, batching, polling)
   - Recommended API sources (FRED, CoinGecko, Blockchain.com)
   - Performance optimizations

3. **[tests/README.md](../tests/README.md)**
   - Testing strategy and conventions
   - Test file organization
   - Running tests and coverage

---

## 📊 Feature Documentation

### Project History & Completion Reports
1. **[PROJECT_HISTORY.md](../PROJECT_HISTORY.md)** ⭐ **COMPREHENSIVE**
   - Complete project timeline and feature history
   - All major implementations consolidated
   - Technical stack overview
   - Test coverage summary
   - Performance metrics
   - Future roadmap

### Specialized Feature Docs
1. **[VISUALIZATION_IMPLEMENTATION.md](../VISUALIZATION_IMPLEMENTATION.md)**
   - Professional chart components (AustrianCharts.tsx)
   - KPI dashboard implementation
   - Loading states and skeletons
   - Technical specifications

2. **[VISUAL_IMPROVEMENTS.md](../VISUAL_IMPROVEMENTS.md)**
   - Before/after UI comparison
   - New component showcase
   - Responsive design features
   - Visual enhancement summary

3. **[VERIFIABILITY_LAYER.md](../VERIFIABILITY_LAYER.md)**
   - Provenance record system
   - Source tracking and verification
   - Endpoints with transparency
   - Link health and quote accuracy

---

## 🔧 Configuration & Operations

### Setup & Configuration
1. **[config/README.md](../config/README.md)**
   - Configuration file structure
   - Environment-specific configs
   - YAML and Python config templates

2. **[SECURITY.md](../SECURITY.md)**
   - Security guidelines
   - Secrets management (.env, API keys)
   - Incident response procedures

### Deployment
1. **[Dockerfile](../Dockerfile)**
   - Multi-stage Docker build
   - Frontend + backend container
   - Health checks and configuration

2. **[k8s/README.md](../k8s/README.md)**
   - Kubernetes deployment manifests
   - ConfigMap, Service, Ingress setup

3. **[firebase.json](../firebase.json)**
   - Firebase Hosting configuration
   - Static asset caching
   - API proxy rules

---

## 📁 Documentation by Category

### 🎓 Education & Theory
- Austrian Economics 0 to Hero Guide
- Austrian Quick Reference
- Business Cycle Theory

### 🚀 Getting Started
- README
- Quick Start Guide
- Web Dashboard Guide

### 🏗️ Architecture
- Frontend README
- Data Fetching Strategy
- Project History (technical stack section)

### ✨ Features
- Project History (feature implementations)
- Visualization Implementation
- Visual Improvements
- Verifiability Layer

### 🔧 Operations
- Security Guidelines
- Configuration README
- Dockerfile
- Kubernetes manifests

### 🧪 Testing
- tests/README.md
- Test coverage (in Project History)

---

## 📊 Documentation Statistics

**Total Documentation Files**: 16  
**Total Lines of Documentation**: ~5,000+  
**Languages**: English  
**Formats**: Markdown, YAML, JSON

### By Category:
- **Education**: 800+ lines (2 files)
- **Technical**: 1,500+ lines (5 files)
- **Features**: 2,000+ lines (5 files)
- **Operations**: 700+ lines (4 files)

---

## 🔍 Quick Find

### Need to...
- **Get started quickly?** → [QUICK_START.md](../QUICK_START.md)
- **Learn Austrian economics?** → [AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md](AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md)
- **Understand the dashboard?** → [WEB_DASHBOARD_GUIDE.md](WEB_DASHBOARD_GUIDE.md)
- **Set up development?** → [packages/frontend/README.md](../packages/frontend/README.md)
- **See project history?** → [PROJECT_HISTORY.md](../PROJECT_HISTORY.md)
- **Deploy to production?** → [Dockerfile](../Dockerfile) or [k8s/README.md](../k8s/README.md)
- **Run tests?** → [tests/README.md](../tests/README.md)
- **Understand data sources?** → [DATA_FETCHING_STRATEGY.md](DATA_FETCHING_STRATEGY.md)
- **Configure security?** → [SECURITY.md](../SECURITY.md)

---

## 📝 Documentation Standards

### File Naming
- Use `SCREAMING_SNAKE_CASE.md` for root-level docs
- Use `lowercase-with-dashes.md` for nested docs
- Use descriptive names (e.g., `QUICK_START.md` not `START.md`)

### Structure
- Start with title and status/date
- Use emoji for visual hierarchy (🚀 🎓 🏗️ ✨ 🔧)
- Include table of contents for files > 200 lines
- Use code blocks with language specification
- Include examples and screenshots where helpful

### Maintenance
- Update PROJECT_HISTORY.md with major features
- Keep QUICK_START.md current with latest stack
- Archive outdated reports (don't delete history)
- Link between related documents

---

## 🤝 Contributing to Documentation

### Adding New Documentation
1. Choose appropriate directory:
   - Root: Project-wide guides
   - `docs/`: Technical and educational content
   - `packages/*/`: Component-specific docs
   - `config/`: Configuration documentation

2. Follow naming conventions (see above)

3. Update this INDEX.md with new file

4. Cross-link with related documents

### Improving Existing Documentation
1. Check for outdated information
2. Add missing examples or screenshots
3. Clarify confusing sections
4. Fix broken links
5. Update version numbers and dates

---

## 🔗 External Resources

### Austrian Economics
- [Mises Institute](https://mises.org) - Austrian economics research
- [Human Action](https://mises.org/library/human-action) - Ludwig von Mises
- [The Road to Serfdom](https://mises.org/library/road-serfdom-0) - Friedrich Hayek

### Data Sources
- [FRED](https://fred.stlouisfed.org) - Federal Reserve Economic Data
- [CoinGecko API](https://www.coingecko.com/en/api) - Cryptocurrency data
- [Blockchain.com](https://blockchain.info) - Bitcoin blockchain data

### Development Resources
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Last Updated**: October 24, 2025  
**Maintained By**: Project Contributors  
**Status**: ✅ Current

For questions or suggestions about documentation, please open an issue or submit a pull request.
