# 🚀 Quick Start Guide - Austrian Business Cycle Monitor

## 📋 Overview

This guide will help you get the modernized Austrian Business Cycle Monitor up and running in minutes.

---

## ✅ Prerequisites

### Required

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm or pnpm** - Package manager (comes with Node.js)

### Optional

- **PostgreSQL** (for production, SQLite used in dev)
- **Redis** (for caching, in-memory fallback available)
- **Git** (for version control)

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```powershell
# From project root
cd c:\Users\JimBLogic\AustrianBusinessCycleMonitor-1

# Install backend dependencies (if using requirements.txt)
pip install -r requirements.txt

# Install frontend dependencies
cd packages\frontend
npm install
```

### Step 2: Configure Backend

```powershell
# Set FRED API key (required for economic data)
$env:FRED_API_KEY="472a159e544ce174d050e0d8490f80a5"
```

### Step 3: Build Frontend

```powershell
# From packages/frontend
npm run build
```

**Output:** `dist/` folder with optimized assets

### Step 4: Start Flask Server

```powershell
# From project root
cd c:\Users\JimBLogic\AustrianBusinessCycleMonitor-1

# Start Flask server (serves built frontend automatically)
python -m apps.dashboard.webapp
```

**Backend should start on:** `http://localhost:5002`

### Step 5: View Dashboard

Open your browser to: **http://localhost:5002**

The Flask server serves the built frontend automatically.

---

## 📊 What You'll See

### **Dashboard Structure:**

```
┌─────────────────────────────────────────┐
│  🏛️ AUSTRIAN BUSINESS CYCLE MONITOR    │
│  Sound Money • Free Markets • Cypherpunk│
├─────────────────────────────────────────┤
│                                          │
│  Austrian Wisdom Quote (rotating)        │
│                                          │
├─────────────────────────────────────────┤
│                                          │
│  📊 Austrian Score: 7.2/10 ⚠️ HIGH RISK │
│  ₿ Bitcoin: $108,234                    │
│  🪙 Gold: $4,043/oz                      │
│  ⚪ Silver: $51.23/oz                    │
│                                          │
├─────────────────────────────────────────┤
│                                          │
│  🎓 Austrian Economics 101 Course        │
│  (Live market analysis with insights)    │
│                                          │
├─────────────────────────────────────────┤
│                                          │
│  🏛️ Three Pillars Risk Monitor          │
│  💰 Monetary Policy                      │
│  📊 Credit Markets                       │
│  🏭 Real Economy                         │
│                                          │
├─────────────────────────────────────────┤
│                                          │
│  ⚠️ Risk Assessment Dashboard            │
│  📈 Economic Indicators                  │
│  📊 Stock Markets & Analysis             │
│  💹 Commodity Markets                    │
│  ⛓️ Bitcoin Network Metrics              │
│                                          │
├─────────────────────────────────────────┤
│                                          │
│  🔐 CYPHERPUNK HALL OF FAME             │
│  [Scroll to bottom]                      │
│                                          │
│  👥 The Legends | 📅 Timeline |          │
│  📚 Library | 💬 Quotes                  │
│                                          │
│  - 11 Pioneer Biographies                │
│  - Complete Timeline 1976-2024           │
│  - Essential Reading Materials           │
│  - Iconic Quotes Collection              │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🎯 Key Features to Explore

### **1. Cypherpunk Hall of Fame (Bottom of page)**

**Navigate to:**
- Scroll to bottom of dashboard
- You'll see the orange-bordered section with quote from Eric Hughes

**Try these interactions:**

1. **Click "The Legends" tab**
   - Browse 11 cypherpunk pioneers
   - Click any card to expand full biography
   - Read timelines, contributions, quotes
   - Click reading list links

2. **Click "Timeline" tab**
   - See visual history from 1976-2024
   - Each event has icon and description
   - Smooth scroll animations

3. **Click "Library" tab**
   - Browse manifestos, papers, books
   - Organized by category
   - Difficulty ratings included
   - Direct links to sources

4. **Click "Quotes" tab**
   - Read iconic cypherpunk wisdom
   - Beautiful glass-effect cards
   - Full attribution and context

### **2. Austrian Economics 101 Course**

Features:
- Live market analysis with Austrian insights
- References to 11 classical + 5 modern economists
- Expandable tabs by category:
  - Bitcoin insights
  - Gold & Silver analysis
  - Interest rates warnings
  - Stock market analysis
  - Inflation metrics
  - Commodities

### **3. Interactive Elements**

**Hover effects:**
- Cards lift slightly with glow
- Buttons scale up (1.05x)
- Colors brighten on hover

**Click interactions:**
- Expandable sections (smooth animations)
- Educational modals (click metrics for explanations)
- Tab switching (fade transitions)
- **NEW:** Info badges (ⓘ) next to key metrics open explanations with sources

**Keyboard shortcuts:**
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close modals

---

## 📚 API Endpoints

**New:** Explanations & Sources API → GET `/api/explanations` returns a catalog of explanations and clickable primary sources (FRED, BIS, Mises Institute) for all metrics and risk scores.

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Dashboard home |
| GET | `/api/status` | System status |
| GET | `/api/health` | Health check |
| GET | `/api/analysis` | Cycle analysis |
| GET | `/api/market-data` | Market data |
| GET | `/api/three-pillars` | Three pillars data |
| GET | `/api/bitcoin-price` | Bitcoin price |
| GET | `/api/blockchain-stats` | Blockchain metrics |
| GET | `/api/stock-markets` | Stock market data |
| GET | `/api/austrian-insights` | Austrian insights |
| GET | `/api/explanations` | Explanations & sources |

---

## 🎨 Temple Theme Applied

### **Colors You'll See:**

```
🟠 Bitcoin Orange (#F7931A) - Primary actions, borders, accents
🟡 Austrian Gold (#FFD700) - Headings, important metrics
⚫ Cypherpunk Black (#0A0A0A) - Backgrounds, depth
⚪ Marble White (#F8F8FF) - Text, contrast

🟢 Liberty Green - Healthy economic conditions
🔴 Inflation Red - Warnings, high risk
🔵 Purple Accents - Secondary elements
```

### Typography

- **Headings:** Cinzel (classical elegance)
- **Body:** Inter (modern readability)
- **Code:** JetBrains Mono (addresses, data)
- **Quotes:** Cormorant Garamond (philosophical)

### **Animations:**

- Bitcoin price: Pulse effect (scale 1 → 1.05 → 1)
- Cards: Hover lift + glow shadow
- Tabs: Smooth fade transitions
- Scroll: Progressive reveal (fade in + slide up)

---

## 📱 Responsive Design

### **Desktop (>1024px):**

- 4-column grid for metrics
- 3-column legend cards
- Full sidebar navigation

### **Tablet (768px - 1024px):**

- 2-column grids
- Compact navigation
- Stacked tabs

### **Mobile (<768px):**

- Single column layout
- Full-width cards
- Hamburger menu

---

## 🔧 Troubleshooting

### **Backend not starting?**

```powershell
# Check if port 5002 is in use
netstat -ano | findstr :5002

# Kill process if needed (replace PID)
taskkill /PID <PID> /F

# Restart backend
$env:FRED_API_KEY="472a159e544ce174d050e0d8490f80a5"
python -m apps.dashboard.webapp
```

### **Frontend build errors?**

```powershell
# Clean build
cd packages\frontend
rm -r -fo dist, node_modules
npm install
npm run build
```

### **Can't see Cypherpunk section?**

- **Scroll to bottom of page** (it's integrated after footer)
- Look for orange border and "🔐 Cypherpunk Hall of Fame" heading
- If not visible, check browser console for errors (F12)

### **Animations not smooth?**

- Ensure hardware acceleration enabled in browser
- Check CPU usage (close other apps)
- Try different browser (Chrome recommended)

---

## 🎯 Testing Checklist

### **Visual Tests:**

- [ ] Dashboard loads without errors
- [ ] All colors match temple theme
- [ ] Bitcoin orange accents visible
- [ ] Austrian gold in headings
- [ ] Smooth animations (no jank)

### **Functional Tests:**

- [ ] All tabs switch smoothly
- [ ] Legend cards expand/collapse
- [ ] Reading list links open in new tab
- [ ] Educational modals appear on click
- [ ] Info badges (ⓘ) open explanations with sources
- [ ] Keyboard navigation works
- [ ] Hover effects trigger

### **Content Tests:**

- [ ] All 11 legends present
- [ ] Timeline has 20+ events
- [ ] Library shows all resources
- [ ] Quotes display with attribution
- [ ] No broken links

### **Accessibility Tests:**

- [ ] Tab through all elements
- [ ] Focus indicators visible (orange outline)
- [ ] Color contrast sufficient (use browser tools)
- [ ] Screen reader compatible (test with NVDA)

---

## 🎯 Next Steps

1. ✅ **Backend Running** - You are here!
2. 🚧 **Explore Features** - Try all interactive elements
3. � **Customize** - Adjust theme colors if needed
4. 🚧 **Deploy** - Set up production environment

---

## 📖 Further Reading

- [MODERNIZATION_PLAN.md](./MODERNIZATION_PLAN.md) - Complete roadmap
- [AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md](./docs/AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md) - Theory deep dive
- [WEB_DASHBOARD_GUIDE.md](./docs/WEB_DASHBOARD_GUIDE.md) - Dashboard features

---

## 🤝 Need Help?

- **Issues**: Check [troubleshooting](#-troubleshooting) section
- **Logs**: Check terminal output for errors
- **Health**: http://localhost:5002/api/health

---

**Happy monitoring! 🚀**
