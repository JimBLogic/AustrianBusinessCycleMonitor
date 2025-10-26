# 🎨 Dashboard Features & Visualizations

Complete reference for all dashboard features, components, and visual improvements.

---

## 📊 Overview

The Austrian Business Cycle Monitor features a modern, professional dashboard built with React + TypeScript, integrating real-time economic data with Austrian School economic theory. This document details all visual components, features, and implementation specifics.

---

## 🎯 Component Library

### 1. AustrianCharts.tsx (588 lines)

Professional chart component library using Recharts with Austrian economics theming.

#### CreditGrowthChart
- **Type**: ComposedChart (Area + Line)
- **Purpose**: Visualizes credit expansion trends over time
- **Data Display**:
  - YoY credit growth (red gradient area)
  - QoQ credit growth (blue line)
  - Credit-to-GDP ratio overlay
  - Reference line at 0% (natural baseline)
- **Austrian Context**: Highlights dangerous credit expansion thresholds
- **Dimensions**: 400px height, fully responsive width
- **Data Source**: FRED API (TCMDO, GDP series)
- **Update Frequency**: 5 minutes

#### MalinvestmentRadarChart
- **Type**: RadarChart (6-component risk spider)
- **Purpose**: Shows risk distribution across malinvestment indicators
- **Scale**: 0-10 for each component
- **Styling**: Orange gradient fill with Bitcoin orange stroke (#F7931A)
- **Components Measured**:
  1. **Yield Curve Inversion** (weight: 0.25) - Most predictive
  2. **Stock Overvaluation** (weight: 0.20) - P/E ratios vs historical
  3. **Zombie Companies** (weight: 0.15) - EBIT < interest payments
  4. **Real Estate Disconnect** (weight: 0.15) - Price-to-rent ratios
  5. **Capital Goods Overexpansion** (weight: 0.15) - Unsustainable projects
  6. **Credit Distortion** (weight: 0.10) - Corporate spreads
- **Features**: PolarGrid with 6 axes, component breakdown table below chart
- **Austrian Context**: Each component represents a specific malinvestment pattern

#### AustrianScoreGauge
- **Type**: Custom SVG circular gauge
- **Purpose**: Displays overall Austrian Business Cycle Score (0-10)
- **Color-Coded Risk Bands**:
  - 🟢 **Green** (0-3): Low Risk - Healthy correction or early expansion
  - 🔵 **Blue** (3-5): Moderate Risk - Normal expansion phase
  - 🟡 **Yellow** (5-7): Elevated Risk - Late boom, watch for overheating
  - 🟠 **Orange** (7-9): High Risk - Extreme malinvestment, bust likely
  - 🔴 **Red** (9-10): Critical Risk - Imminent correction
- **Design**: Professional arc with animated needle, gradient fills
- **Dimensions**: 300x200px SVG
- **Update**: Real-time with smooth transitions

#### Sparkline Component
- **Type**: Minimal inline charts for KPI cards
- **Purpose**: Show trends at-a-glance without axis clutter
- **Variants**:
  - Line sparkline (price trends)
  - Area sparkline (filled gradients)
  - Bar sparkline (discrete data points)
- **Dimensions**: 80x30px (compact)
- **Colors**: Match parent card theme
- **Use Cases**: Bitcoin price trend, M2 growth history, credit expansion

#### ThreePillarsHealth Chart
- **Type**: Horizontal stacked bar chart
- **Purpose**: Visualize health across three Austrian pillars
- **Pillars Displayed**:
  1. **Monetary Policy** (0-100 health score)
  2. **Credit Markets** (0-100 health score)
  3. **Real Economy** (0-100 health score)
- **Color Coding**:
  - 80-100: Green (healthy)
  - 60-80: Yellow (warning)
  - 40-60: Orange (concern)
  - 0-40: Red (crisis)
- **Interactivity**: Click to expand pillar details

#### CycleTimeline Component
- **Type**: Horizontal timeline with phase markers
- **Purpose**: Show historical boom/bust cycles (2008-2025)
- **Phases Marked**:
  - 🟢 **Expansion** - GDP growth, low unemployment
  - 🟡 **Peak** - Maximum output, overheating
  - 🔴 **Contraction** - Recession, liquidation
  - 🔵 **Trough** - Bottom, recovery beginning
- **Historical Events**:
  - 2008 Financial Crisis
  - 2020 COVID Crash
  - 2021-2022 Inflation Surge
  - 2023-2025 Current Cycle
- **Annotations**: FOMC rate changes, QE programs, major events
- **Dimensions**: Full width, 150px height

---

### 2. RiskMetricsDashboard.tsx (KPI Cards)

Real-time KPI dashboard with 8 metric cards showing live data.

#### Card Structure (Each of 8 Cards):
```
┌──────────────────────────────────────┐
│ 🏛️ METRIC NAME                       │
│                                      │
│ 5.0/10 🟡                            │
│ ▁▂▃▄▅▆ Sparkline                     │
│                                      │
│ Status: Elevated Risk                │
│ Trend: ⬆️ Increasing                 │
│ Threshold: 7.0 (Warning at 5.0)     │
│                                      │
│ Last Updated: 2 min ago              │
└──────────────────────────────────────┘
```

#### 8 Live Metrics:
1. **Austrian Score** (0-10)
   - Overall cycle health
   - Weighted composite of all indicators
   - Threshold: >7 = high risk
   - Icon: 🏛️

2. **M2 Money Supply Growth** (% YoY)
   - Broad money expansion rate
   - Threshold: >10% = inflationary
   - Icon: 💰
   - Source: FRED M2SL

3. **Credit Growth Rate** (% YoY)
   - Total credit market debt outstanding
   - Threshold: >8% = unsustainable
   - Icon: 📈
   - Source: FRED TCMDO

4. **Interest Rate Spread** (10Y - 2Y)
   - Yield curve shape
   - Threshold: <0 = inverted (warning)
   - Icon: 💹
   - Source: FRED DGS10, DGS2

5. **Malinvestment Index** (0-10)
   - Composite of 6 malinvestment indicators
   - Threshold: >6 = widespread malinvestment
   - Icon: ⚠️

6. **Yield Curve** (bp)
   - 10Y - 2Y Treasury spread
   - Threshold: <-50bp = severe inversion
   - Icon: 📉

7. **Bitcoin Price** (USD)
   - Digital sound money indicator
   - Trend: Rising = monetary uncertainty
   - Icon: ₿
   - Source: CoinGecko API

8. **Gold Price** (USD/oz)
   - Traditional store of value
   - Trend: Rising = fiat debasement
   - Icon: 🪙
   - Source: Yahoo Finance

#### Features Per Card:
- ✅ Real-time value updates (30-60 second refresh)
- ✅ Color-coded status (green/yellow/orange/red)
- ✅ Trend arrows (⬆️ increasing, ⬇️ decreasing, ━ stable)
- ✅ Sparkline showing last 10 data points
- ✅ Threshold indicators with warnings
- ✅ Timestamp of last update
- ✅ Click to expand for details (InteractiveTooltip integration)
- ✅ Responsive grid layout (4 columns → 2 → 1 on mobile)

---

### 3. LoadingStates.tsx (Skeleton Components)

Professional loading states to prevent layout shift and jarring content jumps.

#### 7 Skeleton Types:
1. **DashboardGridSkeleton** - Full dashboard grid placeholder
2. **ChartSkeleton** - Chart component placeholder (shimmering bars)
3. **CardSkeleton** - Metric card placeholder
4. **TableSkeleton** - Data table placeholder
5. **TimelineSkeleton** - Historical timeline placeholder
6. **GaugeSkeleton** - Circular gauge placeholder
7. **TextSkeleton** - Text content placeholder

#### Design Features:
- Shimmer animation (1.5s loop)
- Matches final component dimensions exactly
- Gray gradient backgrounds (#e0e0e0 → #f5f5f5)
- Smooth fade-out when real content loads
- Accessible (aria-label="Loading...")

#### Usage:
```typescript
{isLoading ? <DashboardGridSkeleton /> : <RealDashboard />}
```

---

### 4. SituationOverviewPanel.tsx

AI-generated situation analysis panel with real-time market narrative.

#### Content Sections:
1. **Headline** - One-sentence current situation summary
2. **Risk Score** - 0-10 with color-coded badge
3. **Cycle Phase** - Current phase (Expansion/Peak/Contraction/Trough)
4. **Narrative** - 2-3 paragraph situation analysis
5. **Warnings** - Severity-tagged warnings (Extreme/High/Elevated)
6. **Key Correlations** - Detected market relationships
7. **Recommended Actions** - Priority-tagged action items (Immediate/High/Normal)
8. **Opportunities** - Investment positioning suggestions
9. **Timeline Context** - What to watch for in coming weeks

#### Features:
- ✅ Auto-refresh every 5 minutes
- ✅ Manual refresh button
- ✅ Expandable/collapsible sections
- ✅ Color-coded by risk level
- ✅ Smooth animations (Framer Motion)
- ✅ Backend endpoint: `GET /api/situation-overview`

#### Example Output:
```
🟠 Elevated Risk: Late Boom Phase Detected

Risk Score: 6.8/10 | Phase: Late Expansion (Month 48/60)

The Austrian Business Cycle Monitor detects elevated malinvestment 
levels with credit expansion outpacing real savings. M2 growth at 
8.2% YoY while interest rates remain suppressed...

⚠️ HIGH: Yield curve inverted (-42bp). Historically precedes 
recession within 12-18 months.

💡 Correlations: Bitcoin (+18%) and Gold (+12%) both rising, 
signaling monetary uncertainty and search for sound money...
```

---

### 5. InteractiveTooltip.tsx

Deep-dive modal system for any clickable metric or chart.

#### Wrapped Components:
Currently wrapping 4 key elements (expandable to all metrics):
1. Bitcoin Price Card
2. Gold Price Card
3. Credit Growth Chart
4. Malinvestment Radar

#### Interaction Flow:
1. **Hover** → Visual feedback (ring highlight, shadow glow)
2. **Hint Text** → "💡 Click for deep dive" appears
3. **Click** → Full-screen modal opens
4. **Loading** → Animated spinner during API fetch
5. **Content** → Rich modal with 6 sections (see below)
6. **Navigation** → Click related metrics to chain exploration
7. **Close** → Escape key or X button

#### Modal Content Structure:
```
┌────────────────────────────────────────────┐
│ [X] Bitcoin Price - $111,320               │
│                                            │
│ 📊 Current Interpretation                  │
│ Bitcoin is currently trading at $111k,     │
│ up 18% this month. This surge indicates... │
│                                            │
│ 🏛️ Austrian Theory Context                │
│ • Core Concept: Sound Money               │
│ • Austrian View: Limited supply...        │
│ • Key Thinkers: Mises, Hayek, Rothbard   │
│ • Economic Implications: ...              │
│                                            │
│ 🔗 Related Metrics                         │
│ [M2 Growth] [Gold Price] [Dollar Index]   │
│                                            │
│ 📈 Historical Context                      │
│ Historical Average: $45,000               │
│ Current Percentile: 95th                  │
│ 2021 Peak: $69,000                        │
│ 2022 Trough: $15,500                      │
│                                            │
│ 📚 Data Sources                            │
│ • CoinGecko API (2025)                    │
│ • Blockchain.com                          │
│ • Mises.org: Bitcoin & Sound Money       │
└────────────────────────────────────────────┘
```

#### Backend Integration:
- Endpoint: `GET /api/metric-tooltip/<metric_key>`
- Lazy loading: Content fetched on first click only
- Cached in browser for 5 minutes
- Fallback to local explanations if API fails

---

### 6. CypherpunkHallOfFame.tsx

Tribute section featuring Bitcoin and Austrian economics thought leaders.

#### Featured Figures:
- **Satoshi Nakamoto** - Bitcoin creator
- **Hal Finney** - First Bitcoin recipient
- **Ludwig von Mises** - Austrian Business Cycle Theory
- **Friedrich Hayek** - Denationalization of money
- **Murray Rothbard** - Anarcho-capitalism and Austrian economics
- **Saifedean Ammous** - The Bitcoin Standard
- **Jeff Booth** - The Price of Tomorrow

#### Card Design:
- Portrait/avatar
- Name and years
- Key contribution
- Notable quote
- Links to works

---

## 🎨 Visual Design System

### Color Palette

#### Primary Colors:
- **Bitcoin Orange**: `#F7931A` - Primary brand, accents, warnings
- **Gold**: `#FFD700` - Gold price, traditional value
- **Silver**: `#C0C0C0` - Silver price, secondary metrics

#### Risk Level Colors:
- **Green**: `#10b981` - Low risk, healthy conditions
- **Blue**: `#3b82f6` - Moderate risk, normal expansion
- **Yellow**: `#fbbf24` - Elevated risk, late boom warning
- **Orange**: `#f97316` - High risk, severe malinvestment
- **Red**: `#ef4444` - Critical risk, imminent bust

#### Background Colors:
- **Dark Slate**: `#0f172a` - Primary background
- **Slate 800**: `#1e293b` - Card backgrounds
- **Slate 700**: `#334155` - Hover states
- **Slate 600**: `#475569` - Borders

#### Text Colors:
- **White**: `#ffffff` - Primary text
- **Slate 300**: `#cbd5e1` - Secondary text
- **Slate 400**: `#94a3b8` - Tertiary text

### Typography

#### Font Stack:
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

#### Font Sizes:
- **Hero**: 48px / 3rem - Dashboard title
- **H1**: 36px / 2.25rem - Section headers
- **H2**: 24px / 1.5rem - Card titles
- **H3**: 20px / 1.25rem - Subsections
- **Body**: 16px / 1rem - Default text
- **Small**: 14px / 0.875rem - Metadata, timestamps
- **Tiny**: 12px / 0.75rem - Footnotes, disclaimers

### Spacing System (Tailwind Scale)

- **xs**: 4px / 0.25rem
- **sm**: 8px / 0.5rem
- **md**: 16px / 1rem (base unit)
- **lg**: 24px / 1.5rem
- **xl**: 32px / 2rem
- **2xl**: 48px / 3rem
- **3xl**: 64px / 4rem

### Border Radius

- **sm**: 4px - Small elements, badges
- **md**: 8px - Cards, buttons
- **lg**: 12px - Modals, large cards
- **xl**: 16px - Hero sections
- **full**: 9999px - Pills, avatars

### Shadows

- **sm**: `0 1px 2px rgba(0,0,0,0.05)` - Subtle elevation
- **md**: `0 4px 6px rgba(0,0,0,0.1)` - Cards
- **lg**: `0 10px 15px rgba(0,0,0,0.1)` - Modals
- **xl**: `0 20px 25px rgba(0,0,0,0.1)` - Overlays

---

## 📱 Responsive Design

### Breakpoints (Tailwind):
- **sm**: 640px - Small tablets
- **md**: 768px - Tablets
- **lg**: 1024px - Small desktops
- **xl**: 1280px - Desktops
- **2xl**: 1536px - Large desktops

### Layout Adaptations:

#### Desktop (>1024px):
- 4-column KPI grid
- Side-by-side charts
- Full timeline visible
- Expanded modal width

#### Tablet (768-1024px):
- 2-column KPI grid
- Stacked charts
- Condensed timeline
- Narrower modal

#### Mobile (<768px):
- 1-column KPI grid (stacked)
- Full-width charts
- Horizontal scroll timeline
- Full-screen modal
- Collapsed situation panel sections
- Hamburger menu navigation

---

## ⚡ Performance Optimizations

### Bundle Splitting:
- **Main**: 437 KB (122 KB gzipped)
- **Charts Vendor**: 433 KB (114 KB gzipped) - Recharts isolated
- **React Vendor**: 147 KB (47 KB gzipped) - React core

### Lazy Loading:
- Charts load on scroll (Intersection Observer)
- InteractiveTooltip content fetched on first click
- Images lazy loaded with blur placeholders

### Caching Strategy:
- API responses cached for 30-60 seconds
- LocalStorage for user preferences
- Service Worker for offline support (future)

### Render Optimizations:
- React.memo for expensive components
- useMemo for complex calculations
- useCallback for event handlers
- Virtual scrolling for long lists

---

## 🧪 Component Testing

All components have corresponding test files:
- `AustrianCharts.test.tsx`
- `RiskMetricsDashboard.test.tsx`
- `LoadingStates.test.tsx`
- `InteractiveTooltip.test.tsx`
- `SituationOverviewPanel.test.tsx`

### Test Coverage:
- Unit tests for calculations
- Component rendering tests
- Interaction tests (clicks, hovers)
- API integration tests
- Responsive breakpoint tests
- Accessibility (a11y) tests

---

## 📚 Usage Examples

### Adding a New Chart:

```typescript
import { CreditGrowthChart } from './components/AustrianCharts';

function Dashboard() {
  const { data } = useQuery(['credit-data'], fetchCreditData);
  
  return (
    <div className="grid gap-6">
      <CreditGrowthChart 
        data={data.creditGrowth}
        title="Credit Market Expansion"
      />
    </div>
  );
}
```

### Wrapping a Metric with Tooltip:

```typescript
import { InteractiveTooltip } from './components/InteractiveTooltip';

<InteractiveTooltip metricKey="bitcoin_price">
  <div className="metric-card">
    <h3>Bitcoin Price</h3>
    <p>${bitcoinPrice}</p>
  </div>
</InteractiveTooltip>
```

### Adding a Loading State:

```typescript
import { ChartSkeleton } from './components/LoadingStates';

{isLoading ? (
  <ChartSkeleton />
) : (
  <MalinvestmentRadarChart data={data} />
)}
```

---

## 🔗 Related Documentation

- [Project History](../PROJECT_HISTORY.md) - Complete feature timeline
- [Quick Start Guide](../QUICK_START.md) - Setup instructions
- [Frontend README](../packages/frontend/README.md) - Development guide
- [Data Fetching Strategy](DATA_FETCHING_STRATEGY.md) - API integration
- [Austrian Economics Guide](AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md) - Theory background

---

**Last Updated**: October 24, 2025  
**Component Count**: 10+ major components  
**Total Lines of Code**: ~3,000+ (TypeScript)  
**Status**: ✅ Production Ready
