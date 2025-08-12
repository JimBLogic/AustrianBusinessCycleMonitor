#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - Core Analysis Module

This module provides the primary Austrian Economics-based market cycle analysis
capabilities, implementing various indicators and metrics for monitoring the
business cycle from an Austrian perspective.
"""
from __future__ import annotations

import logging
import os
import random
import sys
from dataclasses import asdict, dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import pandas as pd
from typing import Callable

def fix_timestamp_division(ts1: pd.Timestamp, ts2: pd.Timestamp) -> float:
    """Safely divide two pandas Timestamps by converting to float seconds."""
    ts1_numeric = ts1.timestamp()
    ts2_numeric = ts2.timestamp()
    if ts2_numeric == 0:
        return 0.0
    return ts1_numeric / ts2_numeric

def safe_round_timestamp(ts: pd.Timestamp, decimals: int = 0) -> float:
    """Round a pandas Timestamp by converting to float seconds."""
    return round(ts.timestamp(), decimals)

def safe_round_timedelta(td: pd.Timedelta, decimals: int = 0) -> float:
    """Round a pandas Timedelta by converting to float seconds."""
    return round(td.total_seconds(), decimals)

def timestamp_numeric_compare(ts: pd.Timestamp, numeric_value: float) -> bool:
    """Compare a pandas Timestamp to a float value (seconds since epoch)."""
    return ts.timestamp() > numeric_value

def timedelta_numeric_compare(td: pd.Timedelta, numeric_value: float) -> bool:
    """Compare a pandas Timedelta to a float value (seconds)."""
    return td.total_seconds() > numeric_value

# Try to import fredapi, but provide a fallback if not available
try:
    import fredapi
    FRED_AVAILABLE = True
except ImportError:
    fredapi = None  # <-- Solución: define fredapi como None si falla el import
    FRED_AVAILABLE = False
    logging.warning("fredapi not available; using fallback data")

# Import the asset tracker
from apps.utils.asset_tracker import AssetTracker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class CycleAnalysis:
    """Data class for Austrian business cycle analysis results."""
    timestamp: str
    cycle_phase: str
    monetary_policy_risk: float
    credit_market_risk: float
    real_economy_risk: float
    overall_risk: float
    recommendations: List[str]
    key_indicators: Dict[str, float]
    narrative: str


class AustrianCycleMonitor:
    """
    Core Austrian Business Cycle analysis and monitoring system.
    
    This class implements the primary analysis framework for monitoring
    business cycles using Austrian economic theory indicators including:
    - Interest rate analysis
    - Credit market conditions
    - Money supply metrics
    - Production structure distortions
    - Capital consumption indicators
    """
    
    def __init__(self, api_key=None) -> None:
        """Initialize the Austrian Cycle Monitor with default settings."""
        self.last_analysis_time: Optional[datetime] = None
        self.last_market_data: Dict[str, Any] = {}
        self.system_status: str = "operational"
        self.austrian_score: float = 5.0  # Neutral position to start
        self.api_key = api_key
        
        # Initialize cache for storing temporary data
        self.cache: Dict[str, Any] = {}
        
        # Configure FRED API if available
        self.fred = None
        self.use_real_data = False
        fred_api_key = os.environ.get('FRED_API_KEY')
        if FRED_AVAILABLE and fred_api_key and fredapi is not None:
            try:
                self.fred = fredapi.Fred(api_key=fred_api_key)
                self.use_real_data = True
                logger.info("FRED API initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize FRED API: {e}")
        
        # Initialize asset tracker
        self.asset_tracker = AssetTracker()
    
    def run_analysis(self) -> Dict[str, Any]:
        """
        Run a complete Austrian business cycle analysis.
        
        Returns:
            Dict containing analysis results including cycle position, 
            monetary metrics, and key indicators
        """
        # Record analysis time
        self.last_analysis_time = datetime.now(UTC)
        
        # Determine cycle phase and risk levels
        cycle_phase = self._determine_cycle_phase()
        overall_risk = self._calculate_overall_risk()
        
        # Basic implementation - would be expanded with real analysis
        analysis_results = {
            "timestamp": self.last_analysis_time.isoformat(),
            "cycle_position": cycle_phase,
            "monetary_metrics": {
                "m2_growth_rate": 5.7,
                "interest_rate_spread": 1.2,
                "credit_market_distortion": "moderate",
            },
            "indicators": {
                "production_structure": 4.2,
                "capital_consumption": 3.8,
                "malinvestment_index": 6.1,
                "artificially_low_rates": True,
            },
            "risk_levels": {
                "monetary_policy": 6.2,
                "credit_markets": 7.3,
                "real_economy": 4.8,
                "overall": overall_risk
            },
            "austrian_score": self.austrian_score,
        }
        
        # Cache the results
        self.cache["last_analysis"] = analysis_results
        
        return analysis_results
    
    def _determine_cycle_phase(self) -> str:
        """
        Determine the current phase of the Austrian business cycle.
        
        Returns:
            String indicating cycle phase (e.g., "boom", "bust", "recovery")
        """
        # In a real implementation, this would analyze various indicators
        # For now, we'll use a simple random approach for demonstration
        phases = ["early-boom", "mid-expansion", "late-boom", "bust-beginning", "correction"]
        weights = [0.2, 0.4, 0.25, 0.1, 0.05]  # More likely to be in expansion phases
        
        return random.choices(phases, weights=weights)[0]
    
    def _calculate_overall_risk(self) -> float:
        """
        Calculate the overall risk level based on Austrian indicators.
        
        Returns:
            Float between 0-10 representing overall risk (10 = highest risk)
        """
        # Placeholder implementation
        # In a real system, this would aggregate various risk metrics
        monetary_risk = random.uniform(5.0, 7.0)
        credit_risk = random.uniform(6.0, 8.0)
        real_economy_risk = random.uniform(4.0, 6.0)
        
        # Weighted average with more weight on credit markets
        overall_risk = (monetary_risk * 0.3) + (credit_risk * 0.5) + (real_economy_risk * 0.2)
        
        return round(overall_risk, 1)
    
    def get_current_analysis(self) -> Optional[Dict[str, Any]]:
        """
        Get the most recent analysis result if available.
        
        Returns:
            Dict containing the most recent analysis or None if not available
        """
        return self.cache.get("last_analysis")
    
    def analyze(self) -> CycleAnalysis:
        """
        Perform comprehensive Austrian business cycle analysis.
        
        Returns:
            CycleAnalysis object with detailed analysis results
        """
        if "cycle_analysis" in self.cache and datetime.now(UTC) - self.cache.get("analysis_time", datetime.min) < timedelta(minutes=30):
            return self.cache["cycle_analysis"]
        
        # Create a more detailed analysis than run_analysis()
        timestamp = datetime.now(UTC).isoformat()
        cycle_phase = self._determine_cycle_phase()
        
        # Risk levels (0-10 scale)
        monetary_risk = round(random.uniform(5.0, 7.0), 1)
        credit_risk = round(random.uniform(6.0, 8.0), 1)
        real_economy_risk = round(random.uniform(4.0, 6.0), 1)
        overall_risk = round((monetary_risk * 0.3) + (credit_risk * 0.5) + (real_economy_risk * 0.2), 1)
        
        # Generate recommendations
        recommendations = [
            "Monitor credit spreads for signs of market stress",
            "Watch for increases in money supply growth rate",
            "Track capital goods vs consumer goods production ratios"
        ]
        
        # Key indicators
        indicators = {
            "m2_growth": 5.7,
            "interest_rate_spread": 1.2,
            "credit_to_gdp": 330.5,
            "production_structure_index": 4.2,
        }
        
        # Narrative
        narrative = (
            "The Austrian business cycle is currently in a {phase} phase with {risk} risk levels. "
            "Monetary policy remains accommodative while credit markets show signs of stress. "
            "Capital structure distortions are becoming more evident in certain sectors."
        ).format(phase=cycle_phase, risk="elevated" if overall_risk > 6 else "moderate")
        
        analysis = CycleAnalysis(
            timestamp=timestamp,
            cycle_phase=cycle_phase,
            monetary_policy_risk=monetary_risk,
            credit_market_risk=credit_risk,
            real_economy_risk=real_economy_risk,
            overall_risk=overall_risk,
            recommendations=recommendations,
            key_indicators=indicators,
            narrative=narrative
        )
        
        # Cache the analysis
        self.cache["cycle_analysis"] = analysis
        self.cache["analysis_time"] = datetime.now(UTC)
        
        return analysis
    
    def get_three_pillars_data(self) -> Dict[str, Dict[str, Any]]:
        """
        Get data for the three pillars of Austrian analysis.
        
        The three pillars represent:
        1. Monetary policy (central bank actions)
        2. Credit markets (lending practices)
        3. Real economy (production structure)
        
        Returns:
            Dict containing the three pillars and their metrics
        """
        # Check cache first
        if "three_pillars" in self.cache and datetime.now(UTC) - self.cache.get("pillars_time", datetime.min) < timedelta(minutes=30):
            return self.cache["three_pillars"]
        
        # Get real data if available, otherwise use demo data
        if self.fred and self.use_real_data:
            try:
                data = self._get_real_three_pillars_data()
            except Exception as e:
                logger.error(f"Error fetching FRED data: {e}")
                data = self._get_demo_three_pillars_data()
        else:
            data = self._get_demo_three_pillars_data()
        
        # Cache the data
        self.cache["three_pillars"] = data
        self.cache["pillars_time"] = datetime.now(UTC)
        
        return data
    
    def _get_demo_three_pillars_data(self) -> Dict[str, Dict[str, Any]]:
        """
        Get demo data for the three pillars when FRED is unavailable.
        
        Returns:
            Dict containing the three pillars and their metrics
        """
        return {
            "monetary_policy": {
                "status": "expansionary",
                "risk_level": "high",
                "metrics": {
                    "base_money_growth": 7.2,
                    "central_bank_balance_sheet_growth": 12.5,
                    "real_interest_rate": -1.5,
                }
            },
            "credit_markets": {
                "status": "overextended",
                "risk_level": "elevated",
                "metrics": {
                    "total_credit_to_gdp": 320.5,
                    "household_debt_service_ratio": 9.8,
                    "corporate_bond_spreads": 1.3,
                    "lending_standards": "loosening",
                }
            },
            "real_economy": {
                "status": "late-cycle",
                "risk_level": "moderate",
                "metrics": {
                    "capacity_utilization": 78.5,
                    "producer_to_consumer_ratio": 1.05,
                    "higher_order_to_lower_order_goods": 0.88,
                    "capital_consumption": "increasing",
                }
            }
        }
    
    def _get_real_three_pillars_data(self) -> Dict[str, Dict[str, Any]]:
        """
        Get real data for the three pillars from FRED.

        Returns:
            Dict containing the three pillars and their metrics
        """
        if not self.fred:
            raise ValueError("FRED API client not initialized")

        try:
            # Monetary Policy
            m2_growth = self.fred.get_series('M2SL', observation_start="1 year ago")
            # Use numeric values for division
            m2_growth_rate = ((float(m2_growth.iloc[-1]) / float(m2_growth.iloc[0])) - 1) * 100

            # Get Fed Funds rate
            fed_funds = float(self.fred.get_series('FEDFUNDS', observation_start="1 month ago").iloc[-1])

            # Get inflation rate
            cpi = self.fred.get_series('CPIAUCSL', observation_start="1 year ago")
            inflation_rate = ((float(cpi.iloc[-1]) / float(cpi.iloc[-13])) - 1) * 100  # Year-over-year

            # Calculate real interest rate
            real_interest_rate = fed_funds - inflation_rate

            # Credit Markets
            debt_to_gdp = float(self.fred.get_series('GFDEGDQ188S', observation_start="1 quarter ago").iloc[-1])
            corporate_baa_yield = float(self.fred.get_series('BAA', observation_start="1 month ago").iloc[-1])
            treasury_10y_yield = float(self.fred.get_series('GS10', observation_start="1 month ago").iloc[-1])
            credit_spread = corporate_baa_yield - treasury_10y_yield

            # Real Economy
            capacity_util = float(self.fred.get_series('TCU', observation_start="1 month ago").iloc[-1])
            industrial_production = float(self.fred.get_series('INDPRO', observation_start="1 month ago").iloc[-1])

            # Assemble the data
            return {
                "monetary_policy": {
                    "status": "expansionary" if m2_growth_rate > 5 else "neutral",
                    "risk_level": "high" if real_interest_rate < 0 else "moderate",
                    "metrics": {
                        "base_money_growth": round(m2_growth_rate, 1),
                        "fed_funds_rate": round(fed_funds, 2),
                        "inflation_rate": round(inflation_rate, 1),
                        "real_interest_rate": round(real_interest_rate, 1),
                    }
                },
                "credit_markets": {
                    "status": "overextended" if debt_to_gdp > 100 else "sustainable",
                    "risk_level": "elevated" if credit_spread > 3 else "moderate",
                    "metrics": {
                        "total_credit_to_gdp": round(debt_to_gdp, 1),
                        "corporate_bond_spread": round(credit_spread, 2),
                        "baa_yield": round(corporate_baa_yield, 2),
                        "treasury_10y_yield": round(treasury_10y_yield, 2),
                    }
                },
                "real_economy": {
                    "status": "late-cycle" if capacity_util > 80 else "mid-cycle",
                    "risk_level": "moderate",
                    "metrics": {
                        "capacity_utilization": round(capacity_util, 1),
                        "industrial_production": round(industrial_production, 2),
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error getting real three pillars data: {e}")
            return self._get_demo_three_pillars_data()
    
    def calculate_austrian_score(self) -> float:
        """
        Calculate the Austrian Business Cycle score (0-10).
        
        Returns:
            Float between 0-10, where higher scores indicate more risk
        """
        # Get the three pillars data
        three_pillars = self.get_three_pillars_data()
        
        # Extract risk levels from each pillar
        monetary_risk = self._risk_level_to_score(three_pillars["monetary_policy"]["risk_level"])
        credit_risk = self._risk_level_to_score(three_pillars["credit_markets"]["risk_level"])
        real_economy_risk = self._risk_level_to_score(three_pillars["real_economy"]["risk_level"])
        
        # Calculate weighted score (credit markets have highest weight in Austrian theory)
        weighted_score = (
            monetary_risk * 0.35 +
            credit_risk * 0.45 +
            real_economy_risk * 0.20
        )
        
        # Round to one decimal place
        return round(weighted_score, 1)
    
    def _risk_level_to_score(self, risk_level: str) -> float:
        """Convert text risk level to numeric score."""
        risk_mapping = {
            "low": 2.5,
            "moderate": 5.0,
            "elevated": 7.5,
            "high": 9.0,
            "extreme": 10.0
        }
        return risk_mapping.get(risk_level.lower(), 5.0)
    
    def get_market_data(self) -> Dict[str, Any]:
        """
        Retrieve current market data relevant to Austrian analysis.
        
        Returns:
            Dict containing market data including interest rates,
            yield curve, commodities, and bitcoin metrics
        """
        # Check asset prices from AssetTracker
        bitcoin_data = self.asset_tracker.get_bitcoin_price()
        gold_data = self.asset_tracker.get_gold_price()
        
        # In a complete implementation, this would fetch real data
        market_data = {
            "interest_rates": {
                "fed_funds": 5.5,
                "10y_treasury": 4.2,
                "natural_rate_estimate": 3.7,
            },
            "yield_curve": {
                "inverted": False,
                "10y_2y_spread": 0.5,
            },
            "commodities": {
                "gold": gold_data.get("price", 2100.50),
                "oil": 78.25,
                "copper": 4.1,
            },
            "bitcoin": {
                "price": bitcoin_data.get("price", 69420.00),
                "hash_rate": 500.0,
                "source": bitcoin_data.get("source", "CoinGecko"),
            },
            "economic_indicators": {
                "ppi": 3.2,
                "cpi": 3.0,
                "gdp_growth": 2.1,
                "manufacturing_pmi": 49.2,
            },
            "system_status": self.system_status,
            "austrian_score": self.austrian_score,
        }
        
        self.last_market_data = market_data
        return market_data


def main() -> None:
    """Run a simple demonstration of the Austrian Cycle Monitor."""
    print("🏛️ Austrian Business Cycle Monitor - Core Analysis")
    print("=" * 60)
    
    monitor = AustrianCycleMonitor()
    
    print("Running analysis...")
    analysis = monitor.run_analysis()
    
    print(f"\nCycle Position: {analysis['cycle_position']}")
    print(f"Austrian Score: {analysis['austrian_score']}/10")
    
    print("\nThree Pillars Analysis:")
    pillars = monitor.get_three_pillars_data()
    for pillar_name, pillar_data in pillars.items():
        print(f"  - {pillar_name.title()}: {pillar_data['status']} (Risk: {pillar_data['risk_level']})")
    
    print("\nMarket Data:")
    market = monitor.get_market_data()
    print(f"  - Bitcoin: ${market['bitcoin']['price']} ({market['bitcoin']['source']})")
    print(f"  - Gold: ${market['commodities']['gold']}")
    print(f"  - Fed Funds Rate: {market['interest_rates']['fed_funds']}%")
    
    print("\nAnalysis complete!")


if __name__ == "__main__":
    main()
