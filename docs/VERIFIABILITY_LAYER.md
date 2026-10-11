# 🔬 Verifiability & Transparency Layer

## Overview

Every metric, score, and calculation in the Austrian Business Cycle Monitor now includes **transparent provenance records** linking to primary data sources. This allows users, auditors, and researchers to verify every claim and trace each value back to its origin.

## Key Features

### 1. Provenance Records

Each critical metric is accompanied by a provenance record containing:
- **metric**: Canonical metric key (e.g., `m2_growth_rate`)
- **mode**: `"real"` (FRED/BIS live data) or `"demo"` (fallback/demo data)
- **observed_at**: ISO timestamp or period label
- **sources**: Array of source objects with:
  - `series`: FRED series ID (e.g., `M2SL`, `TCMDO`)
  - `title`: Human-readable title
  - `url`: Clickable link to primary source

### 2. Endpoints with Provenance

#### `/api/analysis`
Returns full Austrian cycle analysis with embedded provenance for key metrics:
```json
{
  "timestamp": "2025-10-24T...",
  "cycle_position": "mid-expansion",
  "monetary_metrics": {
    "m2_growth_rate": 5.7,
    "interest_rate_spread": 1.2,
    "credit_growth_rate_yoy": 4.3,
    ...
  },
  "indicators": {
    "malinvestment_index": 6.1,
    "malinvestment_components": {
      "yield_curve_inversion": {"score": 7.2, "weight": 0.25},
      "stock_overvaluation": {"score": 5.8, "weight": 0.20},
      ...
    },
    "malinvestment_methodology": "Weighted sum of ABCT distortion indicators..."
  },
  "provenance": {
    "monetary_metrics": {
      "m2_growth_rate": {
        "metric": "m2_growth_rate",
        "mode": "real",
        "observed_at": "2025-10-24T...",
        "sources": [
          {"series": "M2SL", "title": "FRED: M2 Money Stock", "url": "https://fred.stlouisfed.org/series/M2SL"}
        ]
      },
      ...
    }
  }
}
```

#### `/api/three-pillars`
Three pillars (Monetary Policy, Credit Markets, Real Economy) with provenance for each pillar's metrics:
```json
{
  "monetary_policy": {
    "status": "expansionary",
    "metrics": {...},
    ...
  },
  "credit_markets": {
    "status": "overextended",
    "metrics": {
      "credit_growth_rate_yoy": 4.6,
      "credit_growth_rate_qoq": 0.9,
      "credit_growth_series_qoq": [0.4, 0.8, -0.2, 1.1, 0.6, -0.1, 0.7, 0.9],
      "credit_growth_quarters": ["2023-Q1", "2023-Q2", ...],
      ...
    },
    ...
  },
  "provenance": {
    "credit_markets": {
      "credit_growth_rate": {
        "metric": "credit_growth_rate",
        "mode": "real",
        "sources": [
          {"series": "TCMDO", "title": "FRED: Total Credit Market Debt Owed", "url": "https://fred.stlouisfed.org/series/TCMDO"}
        ]
      },
      ...
    }
  }
}
```

#### `/api/explanations`
Complete catalog of metric explanations with educational content and clickable sources:
```json
{
  "explanations": {
    "m2_growth_rate": {
      "label": "M2 Money Supply Growth",
      "explanation": "Year-over-year change in broad money (M2). Rapid growth can signal credit expansion and potential price inflation in Austrian theory.",
      "sources": [
        {"title": "FRED: M2 Money Stock (M2SL)", "url": "https://fred.stlouisfed.org/series/M2SL", "year": 2025},
        {"title": "Mises Institute: Austrian Theory of the Trade Cycle", "url": "https://mises.org/library/austrian-theory-trade-cycle-and-other-essays", "year": 1978}
      ]
    },
    ...
  }
}
```

#### `/api/thought-leaders`
Catalog of Austrian economists and Bitcoin thought leaders with quotes, sources, and key works:
```json
{
  "thought_leaders": {
    "ludwig_von_mises": {
      "name": "Ludwig von Mises",
      "era": "1881-1973",
      "key_works": ["Human Action (1949)", "Theory of Money and Credit (1912)"],
      "quote": "Inflation is not an act of God. Inflation is a policy.",
      "sources": [{"title": "Mises Institute", "url": "https://mises.org/profile/ludwig-von-mises", "year": 2025}]
    },
    ...
  }
}
```

#### `/api/data-manifest`
High-level schema and endpoint inventory for verifiability audits:
```json
{
  "version": "0.1.1",
  "timestamp": "2025-10-24T...",
  "endpoints": [
    {"path": "/api/analysis", "keys": ["timestamp", "cycle_position", "monetary_metrics", "indicators", "risk_levels", "provenance"]},
    {"path": "/api/three-pillars", "keys": ["monetary_policy", "credit_markets", "real_economy", "provenance"]},
    ...
  ]
}
```

### 3. Transparent Malinvestment Index

The **malinvestment index** (0-10 scale) is now computed with explicit component breakdown:
- **yield_curve_inversion** (weight 25%): Tracks 10Y-2Y spread inversions signaling recession
- **stock_overvaluation** (weight 20%): P/E ratios vs historical norms
- **zombie_companies** (weight 15%): Firms unable to cover interest payments
- **real_estate_disconnect** (weight 15%): Housing prices vs wage growth
- **capital_goods_overexpansion** (weight 15%): Production structure distortions
- **credit_distortion** (weight 10%): Credit spreads and lending standards

Response includes:
```json
{
  "malinvestment_index": 6.1,
  "malinvestment_components": {
    "yield_curve_inversion": {"score": 7.2, "weight": 0.25},
    "stock_overvaluation": {"score": 5.8, "weight": 0.20},
    ...
  },
  "malinvestment_methodology": "Weighted sum of ABCT distortion indicators (yield curve, stock P/E, zombie firms, real estate, capital goods, credit spreads). Sources: FRED, BIS, internal models."
}
```

### 4. Credit Growth Metrics with Sparkline Data

Credit growth is now fully transparent with:
- **YoY** (year-over-year) and **QoQ** (quarter-over-quarter) percentage changes
- **Series arrays** for last 8 quarters (for sparkline rendering in UI)
- **Quarter labels** (e.g., `2024-Q3`)
- **Credit-to-GDP** changes (YoY and QoQ)

All derived from **FRED TCMDO** (Total Credit Market Debt Owed) and **GFDEGDQ188S** (Federal Debt to GDP).

## How to Use

### For Developers

1. **Fetch `/api/analysis`** or `/api/three-pillars`** and inspect the `provenance` field for each metric.
2. **Display InfoBadges** in the UI that open modals showing `explanations` and clickable `sources`.
3. **Render sparklines** from `credit_growth_series_qoq` arrays.
4. **Query `/api/data-manifest`** to understand the API schema and available keys.

### For Users

1. Click any **ⓘ** badge next to a metric to see its explanation and primary sources.
2. Click **"Sources"** button in the header to view the full catalog.
3. Verify any claim by following the source links to FRED, BIS, or Mises Institute.

### For Auditors

1. Cross-reference `provenance.sources[].series` with official FRED/BIS data.
2. Verify `mode` is `"real"` for production (vs `"demo"` for fallback/testing).
3. Check `observed_at` timestamps against data freshness requirements.
4. Reproduce calculations using component breakdowns (e.g., malinvestment index).

## Data Sources

- **FRED (Federal Reserve Economic Data)**: https://fred.stlouisfed.org/
  - M2 Money Stock (M2SL)
  - Federal Funds Rate (FEDFUNDS)
  - 10Y Treasury (GS10)
  - Total Credit Market Debt (TCMDO)
  - Federal Debt to GDP (GFDEGDQ188S)
  - Capacity Utilization (TCU)
  - CPI, PPI, GDP, and more
  
- **BIS (Bank for International Settlements)**: https://www.bis.org/
  - Credit-to-GDP gap
  - International credit statistics

- **Mises Institute**: https://mises.org/
  - Original Austrian economic theory texts
  - Modern commentary and analysis

- **CoinGecko**: https://www.coingecko.com/
  - Real-time Bitcoin, Gold, Silver prices

## Roadmap

- [ ] UI InfoBadge implementation in React dashboard
- [ ] Credit growth sparkline rendering in Credit Markets section
- [ ] Provenance timeline (historical data snapshots)
- [ ] API rate limiting and caching documentation
- [ ] Automated provenance auditing tools
- [ ] Downloadable CSV exports with full provenance metadata

---

**Verifiability is a core principle.** Every claim can be traced. Every metric can be verified. Transparency is not optional—it's fundamental to sound economic analysis.
