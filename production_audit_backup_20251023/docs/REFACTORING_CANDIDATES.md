# Refactoring Candidates - Austrian Business Cycle Monitor

**Date:** October 23, 2025  
**Status:** Post-Phase 2 Analysis  
**Priority:** Future refactoring (Phase 3+)

## Overview

These modules are **currently active and working** but could be consolidated in the future for better maintainability. **No immediate action required.**

---

## Candidate Files

### 1. stock_tracker.py
**Location:** `apps/utils/stock_tracker.py`  
**Lines:** 197  
**Status:** ✅ Active, imported by `optimized_data_fetcher.py`

**Current Usage:**
```python
# In optimized_data_fetcher.py
from apps.utils.stock_tracker import StockTracker

def fetch_stock_market_data():
    tracker = StockTracker()
    markets = tracker.get_stock_markets()
```

**Why Keep For Now:**
- Well-written, type-hinted code
- Clear separation of concerns
- Good caching strategy (60s TTL)
- Useful symbol mapping

**Future Refactoring Option:**
- Could absorb into `optimized_data_fetcher.py` as `_fetch_stock_data()` method
- Estimate: 2-3 hours work
- Benefit: One less file, simpler imports
- Risk: Larger single file (500 → 700 lines)

**Recommendation:** Keep separate until file becomes unwieldy

---

### 2. blockchain_tracker.py
**Location:** `apps/utils/blockchain_tracker.py`  
**Lines:** 191  
**Status:** ✅ Active, imported by `webapp.py`

**Current Usage:**
```python
# In webapp.py
from apps.utils.blockchain_tracker import get_blockchain_tracker

self.blockchain_tracker = get_blockchain_tracker()
```

**Why Keep For Now:**
- Specialized Bitcoin blockchain knowledge
- Multiple API sources (mempool.space, blockchain.info)
- Complex stats aggregation
- Good error handling

**Future Refactoring Option:**
- Could merge with Bitcoin-related functions in `optimized_data_fetcher.py`
- Estimate: 3-4 hours work
- Benefit: Unified Bitcoin data handling
- Risk: Loss of modularity

**Recommendation:** Keep separate, Bitcoin deserves its own module

---

### 3. live_asset_tracker.py
**Location:** `apps/utils/live_asset_tracker.py`  
**Lines:** Unknown (not fully analyzed)  
**Status:** ✅ Active, imported by `optimized_data_fetcher.py`

**Current Usage:**
```python
# In optimized_data_fetcher.py
from apps.utils.live_asset_tracker import LiveAssetTracker

tracker = LiveAssetTracker()
gold_data = tracker.get_gold_price()
silver_data = tracker.get_silver_price()
```

**Why Keep For Now:**
- FRED API integration (requires API key management)
- Precious metals specialist
- Separate concerns from crypto/stocks

**Future Refactoring Option:**
- Could integrate FRED calls directly into `optimized_data_fetcher.py`
- Estimate: 2 hours work
- Benefit: Fewer dependencies
- Risk: API key management complexity

**Recommendation:** Keep separate for FRED integration clarity

---

## Refactoring Strategies

### Option A: Full Consolidation (Not Recommended Yet)
**Create mega-file:** `unified_data_fetcher.py`

**Pros:**
- Single source of truth
- No import juggling
- Easier to see all data sources at once

**Cons:**
- File becomes 1000+ lines
- Loss of specialized knowledge
- Harder to test individual components
- Merge conflicts more likely

**When to consider:** If team grows and module boundaries cause confusion

---

### Option B: Keep Modular (Current - Recommended)
**Maintain specialist modules:**

```
apps/utils/
├── optimized_data_fetcher.py   ← Orchestrator (468 lines)
├── stock_tracker.py            ← Stock market specialist (197 lines)
├── blockchain_tracker.py       ← Bitcoin specialist (191 lines)
└── live_asset_tracker.py       ← Precious metals specialist
```

**Pros:**
- Clear separation of concerns
- Easy to test independently
- Each module can evolve separately
- New contributors understand boundaries

**Cons:**
- Multiple imports to manage
- Potential for circular dependencies (none currently)

**When to maintain:** Current team size, clear module purposes

---

### Option C: Domain-Driven Design (Future Consideration)
**Group by Austrian Economics domains:**

```
apps/data_sources/
├── sound_money/
│   ├── bitcoin_data.py         ← Bitcoin, hashrate, network
│   ├── precious_metals.py      ← Gold, silver, FRED
│   └── __init__.py
├── fiat_indicators/
│   ├── stock_markets.py        ← Stocks, VIX, breadth
│   ├── fed_data.py             ← M2, rates, yield curve
│   └── __init__.py
└── orchestrator.py             ← Main data fetching coordinator
```

**Pros:**
- Aligns with Austrian Economics framework
- Domain experts can own their modules
- Very clear what each area does

**Cons:**
- Requires restructuring
- Import paths change
- More directories

**When to consider:** When project scales to multiple contributors per domain

---

## Integration Opportunities (Keep, But Enhance)

### From stock_tracker.py
**Learn from VIX tracking for Austrian interpretation:**

```python
# Add to dashboard
def interpret_vix_austrian(vix_level: float) -> Dict[str, str]:
    """
    Austrian Business Cycle interpretation of VIX
    
    Low VIX = Complacency (artificial boom)
    High VIX = Fear (bust phase recognition)
    """
    if vix_level < 12:
        return {
            "phase": "ARTIFICIAL_BOOM",
            "warning": "Extreme complacency suggests suppressed volatility",
            "austrian": "Central bank put creating moral hazard"
        }
    # ... more interpretations
```

**Action:** Add VIX Austrian interpretation to Risk Assessment section

---

### From blockchain_tracker.py
**Learn from mempool stats for time preference:**

```python
# Add to Bitcoin Network Metrics
def calculate_time_preference_index(mempool_stats: Dict) -> float:
    """
    Austrian time preference via Bitcoin mempool fee urgency
    
    High fee premium = High time preference (present-oriented)
    Low fee premium = Low time preference (future-oriented)
    """
    fee_ratio = mempool_stats['high_fee'] / mempool_stats['low_fee']
    return min(10, fee_ratio)  # Scale 0-10
```

**Action:** Add Time Preference Gauge to Bitcoin section

---

### From live_asset_tracker.py
**Learn from FRED integration for more indicators:**

```python
# Expand FRED data fetching
ADDITIONAL_FRED_SERIES = {
    'MORTGAGE30US': 'mortgage_rate_30y',  # Housing market
    'CPILFESL': 'core_cpi',               # Core inflation
    'UNRATE': 'unemployment_rate',        # Labor market
    'DEXCHUS': 'usd_cny_exchange',        # Trade dynamics
}
```

**Action:** Expand economic indicators in dashboard

---

## Decision Matrix

| Factor | Keep Separate | Consolidate |
|--------|--------------|-------------|
| Team Size | < 5 | > 5 |
| File Size | < 300 lines each | Approaching 500+ |
| Test Complexity | Easy to isolate | Integrated tests OK |
| Domain Clarity | Very clear | Overlapping concerns |
| Import Issues | No circular deps | Circular deps forming |

**Current Score:** ✅ Keep Separate (4/5 favor modular)

---

## Monitoring Criteria for Future Consolidation

Track these metrics to decide when to refactor:

### Size Threshold
```bash
# Alert if any util file exceeds 400 lines
find apps/utils -name "*.py" -exec wc -l {} \; | awk '$1 > 400'
```

### Import Complexity
```bash
# Count import statements
grep -r "from apps.utils" apps/ | wc -l
# If > 50 imports, consider consolidation
```

### Test Duplication
```python
# If tests repeat mocking patterns
# Example: Mocking same external APIs in multiple test files
# Consider consolidating data sources
```

### Merge Conflicts
```bash
# If same files conflicting frequently
git log --oneline --all --graph apps/utils/*.py | grep "Merge"
# Frequency > 1/week suggests consolidation needed
```

---

## Recommendations

### Immediate (Phase 2 Complete) ✅
- **No changes needed**
- Current structure is clean and maintainable
- All modules have clear purposes

### Short Term (Phase 3)
- **Add integrations** (VIX interpretation, time preference, expanded FRED)
- **Document** API patterns in each module
- **Monitor** file sizes and import complexity

### Medium Term (6 months)
- **Assess** if any modules exceed 400 lines
- **Review** test duplication patterns
- **Consider** domain-driven reorganization if team grows

### Long Term (1 year+)
- **Reevaluate** based on team size and project scope
- **Prototype** consolidated approach if needed
- **Gradual migration** if consolidation chosen (not big bang)

---

## Conclusion

The current modular structure is **excellent for the project's current state**. The utilities are:
- ✅ Well-written with type hints
- ✅ Properly separated by concern
- ✅ Easy to test independently
- ✅ No circular dependencies

**Action:** Keep as-is, focus on **enhancing** rather than **restructuring**

**Valuable additions from existing code:**
1. VIX Austrian interpretation (stock_tracker)
2. Mempool time preference (blockchain_tracker)
3. Expanded FRED indicators (live_asset_tracker)

**Next:** Implement these integrations in Phase 3 to further enhance the temple-themed dashboard!

---

*"Premature optimization is the root of all evil. Premature consolidation is its cousin."*  
— Adapted from Donald Knuth
