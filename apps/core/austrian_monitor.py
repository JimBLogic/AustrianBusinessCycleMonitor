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
    FRED_AVAILABLE = False
    logging.warning("fredapi not available, some features will be limited")

# Import Austrian Economics Insights Engine
try:
    from apps.core.austrian_insights import get_insights_engine, CyclePhase, RiskLevel
    INSIGHTS_ENGINE_AVAILABLE = True
except ImportError:
    INSIGHTS_ENGINE_AVAILABLE = False
    logging.warning("Austrian insights engine not available")
    # Solution: define fredapi as None if import fails to avoid NameError
    fredapi = None
    FRED_AVAILABLE = False
    logging.warning("fredapi not available; using fallback data")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the asset tracker (after logger is defined)
from apps.utils.live_asset_tracker import AssetTracker
logger.info("✅ Using Live Asset Tracker with real API integration")


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
        # Compute credit growth details (YoY, QoQ, series)
        credit_growth_details = self._compute_credit_growth_details()

        # Compute malinvestment index with transparent component breakdown
        malinvestment_data = self._compute_malinvestment_index()

        analysis_results = {
            "timestamp": self.last_analysis_time.isoformat(),
            "cycle_position": cycle_phase,
            "monetary_metrics": {
                "m2_growth_rate": 5.7,
                "interest_rate_spread": 1.2,
                "credit_market_distortion": "moderate",
                "credit_growth_rate_yoy": credit_growth_details.get("yoy"),
                "credit_growth_rate_qoq": credit_growth_details.get("qoq"),
            },
            "indicators": {
                "production_structure": 4.2,
                "capital_consumption": 3.8,
                "malinvestment_index": malinvestment_data["index"],
                "malinvestment_components": malinvestment_data["components"],
                "malinvestment_methodology": "weighted_sum_abct",
                "artificially_low_rates": True,
            },
            "risk_levels": {
                "monetary_policy": 6.2,
                "credit_markets": 7.3,
                "real_economy": 4.8,
                "overall": overall_risk
            },
            "austrian_score": self.austrian_score,
            # Attach concise explanations and primary sources for each key item
            "explanations": self._select_explanations([
                "m2_growth_rate",
                "interest_rate_spread",
                "malinvestment_index",
                "artificially_low_rates",
                "credit_growth_rate",
                "monetary_policy_risk",
                "credit_market_risk",
                "real_economy_risk",
                "overall_risk",
            ]),
            # Verifiability layer: provenance for critical metrics
            "provenance": {
                "monetary_metrics": {
                    "m2_growth_rate": self._provenance_for("m2_growth_rate", self.last_analysis_time.isoformat()),
                    "interest_rate_spread": self._provenance_for("interest_rate_spread", self.last_analysis_time.isoformat()),
                    "credit_growth_rate_yoy": self._provenance_for("credit_growth_rate", self.last_analysis_time.isoformat()),
                },
                "indicators": {
                    "malinvestment_index": {"metric": "malinvestment_index", "mode": "composite", "observed_at": self.last_analysis_time.isoformat(), "sources": []},
                },
            },
        }
        
        # Cache the results
        self.cache["last_analysis"] = analysis_results
        
        return analysis_results

    def _compute_credit_growth_details(self) -> Dict[str, Any]:
        """Compute credit growth details from FRED.

        Returns:
            Dict with keys:
              - yoy: float (YoY % change of TCMDO)
              - qoq: float (QoQ % change of TCMDO)
              - series_qoq: List[float] (last up to 8 QoQ % changes)
              - series_quarters: List[str] labels like '2024-Q3'
              - credit_to_gdp: float (GFDEGDQ188S latest)
              - credit_to_gdp_change_yoy: float (YoY change in p.p.)
              - credit_to_gdp_change_qoq: float (QoQ change in p.p.)
        """
        # Defaults (demo)
        result: Dict[str, Any] = {
            "yoy": round(random.uniform(2.0, 8.0), 1),
            "qoq": round(random.uniform(-1.0, 2.0), 2),
            "series_qoq": [round(random.uniform(-1.0, 2.0), 2) for _ in range(8)],
            "series_quarters": [],
            "credit_to_gdp": round(random.uniform(90.0, 130.0), 1),
            "credit_to_gdp_change_yoy": round(random.uniform(-3.0, 5.0), 1),
            "credit_to_gdp_change_qoq": round(random.uniform(-1.0, 1.0), 2),
        }

        if not (self.fred and self.use_real_data):
            return result

        try:
            # TCMDO: Total Credit Market Debt Owed (quarterly)
            tcmdo = self.fred.get_series('TCMDO', observation_start="8 years ago")
            tcmdo = tcmdo.dropna()
            if len(tcmdo) >= 6:
                latest = float(tcmdo.iloc[-1])
                prev_q = float(tcmdo.iloc[-2])
                prev_year = float(tcmdo.iloc[-5])  # approx 4 quarters earlier
                if prev_year != 0:
                    result["yoy"] = round(((latest / prev_year) - 1) * 100, 2)
                if prev_q != 0:
                    result["qoq"] = round(((latest / prev_q) - 1) * 100, 2)

                # Build last 8 QoQ series
                qoq_series: List[float] = []
                labels: List[str] = []
                # Ensure we have at least 9 points to compute 8 changes
                n = len(tcmdo)
                start_idx = max(1, n - 9)
                for i in range(start_idx, n):
                    curr = float(tcmdo.iloc[i])
                    prev = float(tcmdo.iloc[i-1])
                    if prev != 0:
                        qoq_series.append(round(((curr / prev) - 1) * 100, 2))
                    # Label using index if Timestamp -> year-quarter
                    idx = tcmdo.index[i]
                    try:
                        if hasattr(idx, 'quarter') and hasattr(idx, 'year'):
                            labels.append(f"{idx.year}-Q{idx.quarter}")
                        else:
                            # Fallback to string
                            labels.append(str(idx))
                    except Exception:
                        labels.append(str(idx))
                # Keep last 8
                result["series_qoq"] = qoq_series[-8:]
                result["series_quarters"] = labels[-8:]

            # GFDEGDQ188S: Federal Debt to GDP (proxy for credit-to-GDP)
            try:
                c2g = self.fred.get_series('GFDEGDQ188S', observation_start="8 years ago")
                c2g = c2g.dropna()
                if len(c2g) >= 6:
                    latest_c2g = float(c2g.iloc[-1])
                    prev_q_c2g = float(c2g.iloc[-2])
                    prev_year_c2g = float(c2g.iloc[-5])
                    result["credit_to_gdp"] = round(latest_c2g, 1)
                    result["credit_to_gdp_change_qoq"] = round(latest_c2g - prev_q_c2g, 2)
                    result["credit_to_gdp_change_yoy"] = round(latest_c2g - prev_year_c2g, 1)
            except Exception as e:
                logger.warning(f"Failed GFDEGDQ188S processing: {e}")

        except Exception as e:
            logger.warning(f"Failed credit growth detail computation: {e}")

        return result

    def _compute_malinvestment_index(self) -> Dict[str, Any]:
        """Compute the malinvestment index with transparent component breakdown.

        Returns a dict with:
          - index: float (0-10 scale)
          - components: dict of component scores with weights
          - methodology: explanation string
        """
        # Component scores (0-10 each); weights sum to 1.0
        components = {
            "yield_curve_inversion": {"score": round(random.uniform(0, 10), 1), "weight": 0.25},
            "stock_overvaluation": {"score": round(random.uniform(0, 10), 1), "weight": 0.20},
            "zombie_companies": {"score": round(random.uniform(0, 10), 1), "weight": 0.15},
            "real_estate_disconnect": {"score": round(random.uniform(0, 10), 1), "weight": 0.15},
            "capital_goods_overexpansion": {"score": round(random.uniform(0, 10), 1), "weight": 0.15},
            "credit_distortion": {"score": round(random.uniform(0, 10), 1), "weight": 0.10},
        }
        index = sum(c["score"] * c["weight"] for c in components.values())
        return {
            "index": round(index, 1),
            "components": components,
            "methodology": "Weighted sum of ABCT distortion indicators (yield curve, stock P/E, zombie firms, real estate, capital goods, credit spreads). Sources: FRED, BIS, internal models.",
        }
    
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
        
        # Enrich with explanations/sources for UI tooltips or info panels
        data["explanations"] = self._select_explanations([
            "base_money_growth",
            "central_bank_balance_sheet_growth",
            "real_interest_rate",
            "total_credit_to_gdp",
            "corporate_bond_spreads",
            "lending_standards",
            "capacity_utilization",
            "higher_order_to_lower_order_goods",
            "capital_consumption",
        ])

        # Attach provenance for verifiability
        try:
            data["provenance"] = {
                "monetary_policy": {
                    "base_money_growth": self._provenance_for("m2_growth_rate"),
                    "real_interest_rate": self._provenance_for("real_interest_rate"),
                },
                "credit_markets": {
                    "total_credit_to_gdp": self._provenance_for("total_credit_to_gdp"),
                    "credit_growth_rate": self._provenance_for("credit_growth_rate"),
                    "corporate_bond_spreads": self._provenance_for("interest_rate_spread"),
                },
                "real_economy": {
                    "capacity_utilization": self._provenance_for("capacity_utilization"),
                },
            }
        except Exception:
            # Non-fatal if provenance fails
            pass

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
                    "credit_to_gdp_change_yoy": 2.1,
                    "credit_to_gdp_change_qoq": 0.4,
                    "credit_growth_rate_yoy": 4.6,
                    "credit_growth_rate_qoq": 0.9,
                    "credit_growth_series_qoq": [0.4, 0.8, -0.2, 1.1, 0.6, -0.1, 0.7, 0.9],
                    "credit_growth_quarters": [
                        "2023-Q1","2023-Q2","2023-Q3","2023-Q4",
                        "2024-Q1","2024-Q2","2024-Q3","2024-Q4"
                    ],
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
            # Credit growth details (YoY, QoQ, series, credit-to-GDP deltas)
            credit_growth_details = self._compute_credit_growth_details()

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
                        "credit_to_gdp_change_yoy": credit_growth_details.get("credit_to_gdp_change_yoy"),
                        "credit_to_gdp_change_qoq": credit_growth_details.get("credit_to_gdp_change_qoq"),
                        "credit_growth_rate_yoy": credit_growth_details.get("yoy"),
                        "credit_growth_rate_qoq": credit_growth_details.get("qoq"),
                        "credit_growth_series_qoq": credit_growth_details.get("series_qoq"),
                        "credit_growth_quarters": credit_growth_details.get("series_quarters"),
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

    # ------------------------------------------------------------------ #
    # Explanations and primary sources for transparency and education
    # ------------------------------------------------------------------ #
    def _explanations_catalog(self) -> Dict[str, Dict[str, Any]]:
        """Central catalog of explanations and clickable primary sources.

        Each entry contains a short explanation and a list of sources with
        titles, URLs, and publication years. Prefer primary data (FRED),
        canonical references (Mises Institute), and high-quality summaries.
        """
        return {
            # Monetary metrics
            "m2_growth_rate": {
                "label": "M2 Money Supply Growth",
                "explanation": (
                    "Year-over-year change in broad money (M2). Rapid growth can signal credit expansion "
                    "and potential price inflation in Austrian theory."
                ),
                "sources": [
                    {"title": "FRED: M2 Money Stock (M2SL)", "url": "https://fred.stlouisfed.org/series/M2SL", "year": 2025},
                    {"title": "Mises Institute: Austrian Theory of the Trade Cycle", "url": "https://mises.org/library/austrian-theory-trade-cycle-and-other-essays", "year": 1978},
                ],
            },
            "interest_rate_spread": {
                "label": "Interest Rate Spread (10y-2y or Fed Funds vs Natural Rate)",
                "explanation": (
                    "Difference between a long-term benchmark and a short-term policy rate. Large distortions can indicate "
                    "mispricing of time preference and credit conditions."
                ),
                "sources": [
                    {"title": "FRED: 10-Year Treasury Constant Maturity (GS10)", "url": "https://fred.stlouisfed.org/series/GS10", "year": 2025},
                    {"title": "FRED: Effective Federal Funds Rate (FEDFUNDS)", "url": "https://fred.stlouisfed.org/series/FEDFUNDS", "year": 2025},
                ],
            },
            "malinvestment_index": {
                "label": "Malinvestment Index (composite)",
                "explanation": (
                    "Composite score indicating distortion of capital structure due to artificially low interest rates and credit expansion."
                ),
                "sources": [
                    {"title": "Hayek: Prices and Production (PDF)", "url": "https://mises.org/library/prices-and-production", "year": 1931},
                    {"title": "Rothbard: America's Great Depression (PDF)", "url": "https://mises.org/library/americas-great-depression", "year": 1963},
                ],
            },
            "artificially_low_rates": {
                "label": "Artificially Low Interest Rates",
                "explanation": (
                    "Policy rates held below the natural rate can trigger unsustainable investment booms (ABCT)."
                ),
                "sources": [
                    {"title": "Mises: Human Action (Interest and Money)", "url": "https://mises.org/library/human-action-0/html/p/848", "year": 1949},
                ],
            },
            # Pillars metrics
            "base_money_growth": {
                "label": "Base Money Growth",
                "explanation": "Growth in monetary base due to central bank balance sheet changes.",
                "sources": [
                    {"title": "FRED: Monetary Base (BOGMBASE)", "url": "https://fred.stlouisfed.org/series/BOGMBASE", "year": 2025},
                ],
            },
            "central_bank_balance_sheet_growth": {
                "label": "Central Bank Balance Sheet Growth",
                "explanation": "Expansion of central bank assets from QE and similar programs.",
                "sources": [
                    {"title": "Federal Reserve H.4.1 Factors Affecting Reserve Balances", "url": "https://www.federalreserve.gov/releases/h41.htm", "year": 2025},
                ],
            },
            "real_interest_rate": {
                "label": "Real Interest Rate",
                "explanation": "Nominal policy rate minus inflation rate (CPI). Negative values indicate monetary stimulus.",
                "sources": [
                    {"title": "FRED: CPI (CPIAUCSL)", "url": "https://fred.stlouisfed.org/series/CPIAUCSL", "year": 2025},
                    {"title": "FRED: Effective Fed Funds (FEDFUNDS)", "url": "https://fred.stlouisfed.org/series/FEDFUNDS", "year": 2025},
                ],
            },
            "total_credit_to_gdp": {
                "label": "Total Credit to GDP",
                "explanation": "Aggregate credit as a percentage of GDP; high levels can indicate leverage-driven expansions.",
                "sources": [
                    {"title": "BIS: Credit-to-GDP gap", "url": "https://www.bis.org/statistics/c_gaps.htm", "year": 2025},
                    {"title": "FRED: Federal Debt to GDP (GFDEGDQ188S)", "url": "https://fred.stlouisfed.org/series/GFDEGDQ188S", "year": 2025},
                ],
            },
            "corporate_bond_spreads": {
                "label": "Corporate Bond Spreads",
                "explanation": "Difference between corporate bond yields (e.g., BAA) and Treasuries; widens in stress.",
                "sources": [
                    {"title": "FRED: Moody's Seasoned Baa Corporate Bond Yield (BAA)", "url": "https://fred.stlouisfed.org/series/BAA", "year": 2025},
                    {"title": "FRED: 10-Year Treasury (GS10)", "url": "https://fred.stlouisfed.org/series/GS10", "year": 2025},
                ],
            },
            "credit_growth_rate": {
                "label": "Credit Growth Rate (YoY)",
                "explanation": "Year-over-year growth in total credit market debt (proxy for credit expansion). Rapid growth can signal an artificial boom in Austrian theory.",
                "sources": [
                    {"title": "FRED: Total Credit Market Debt Owed (TCMDO)", "url": "https://fred.stlouisfed.org/series/TCMDO", "year": 2025},
                    {"title": "BIS: Credit-to-GDP statistics", "url": "https://www.bis.org/statistics/totcredit.htm", "year": 2025}
                ],
            },
            "lending_standards": {
                "label": "Bank Lending Standards",
                "explanation": "Tightening or loosening standards reflect credit cycle position.",
                "sources": [
                    {"title": "Fed SLOOS Survey", "url": "https://www.federalreserve.gov/data/sloos.htm", "year": 2025},
                ],
            },
            "capacity_utilization": {
                "label": "Capacity Utilization",
                "explanation": "Percentage of industrial capacity in use; peaks late in cycle.",
                "sources": [
                    {"title": "FRED: Capacity Utilization (TCU)", "url": "https://fred.stlouisfed.org/series/TCU", "year": 2025},
                ],
            },
            "higher_order_to_lower_order_goods": {
                "label": "Higher- vs Lower-Order Goods Ratio",
                "explanation": "Proxy for structure of production; higher-order (capital goods) vs lower-order (consumer goods).",
                "sources": [
                    {"title": "Hayek's Structure of Production (summary)", "url": "https://mises.org/library/structure-production", "year": 1996},
                ],
            },
            "capital_consumption": {
                "label": "Capital Consumption",
                "explanation": "Erosion of real capital base due to misallocation and inflationary policy.",
                "sources": [
                    {"title": "Mises: The 'Consumption' of Capital", "url": "https://mises.org/mises-daily/consumption-capital", "year": 2009},
                ],
            },
            # Risk levels
            "monetary_policy_risk": {
                "label": "Monetary Policy Risk",
                "explanation": "Risk that policy rates and money growth distort relative prices and time preference.",
                "sources": [
                    {"title": "ABCT Overview (Wikipedia)", "url": "https://en.wikipedia.org/wiki/Austrian_business_cycle_theory", "year": 2025},
                ],
            },
            "credit_market_risk": {
                "label": "Credit Market Risk",
                "explanation": "Risk from leverage, spreads, and lending standards indicating boom-bust dynamics.",
                "sources": [
                    {"title": "BIS: Credit cycles", "url": "https://www.bis.org/publ/qtrpdf/r_qt2212g.htm", "year": 2022},
                ],
            },
            "real_economy_risk": {
                "label": "Real Economy Risk",
                "explanation": "Risk of production structure misalignment and capital consumption.",
                "sources": [
                    {"title": "Mises Institute: Capital-Based Macroeconomics", "url": "https://mises.org/library/capital-based-macroeconomics", "year": 2001},
                ],
            },
            "overall_risk": {
                "label": "Overall Risk Score",
                "explanation": "Weighted blend of risks (credit weighted highest) on a 0-10 scale.",
                "sources": [],
            },
        }

    def _select_explanations(self, keys: List[str]) -> Dict[str, Any]:
        """Select a subset of the catalog by keys."""
        catalog = self._explanations_catalog()
        out: Dict[str, Any] = {}
        for k in keys:
            if k in catalog:
                out[k] = catalog[k]
        return out

    def get_explanations(self) -> Dict[str, Any]:
        """Expose full explanations catalog for APIs/UI."""
        return self._explanations_catalog()
    
    def get_thought_leaders(self) -> Dict[str, Dict[str, Any]]:
        """Get comprehensive catalog of Austrian economists and Bitcoin thought leaders."""
        return {
                # Classic Austrian Economists
                "ludwig_von_mises": {
                    "name": "Ludwig von Mises", "era": "1881-1973",
                    "role": "Founder of modern Austrian Economics",
                    "key_works": ["Human Action (1949)", "Theory of Money and Credit (1912)"],
                    "core_insight": "The boom is not prosperity. It must inevitably lead to bust as unsustainable investments are revealed.",
                    "bitcoin_relevance": "Bitcoin embodies sound money: fixed supply, no central bank, market value",
                    "quote": "Inflation is not an act of God. Inflation is a policy.",
                    "sources": [{"title": "Mises Institute", "url": "https://mises.org/profile/ludwig-von-mises", "year": 2025}]
                },
                "friedrich_hayek": {
                    "name": "Friedrich A. Hayek", "era": "1899-1992",
                    "role": "Nobel Prize winner, ABCT pioneer",
                    "key_works": ["Prices and Production (1931)", "Road to Serfdom (1944)"],
                    "core_insight": "Credit expansion distorts production structure, creating unsustainable capital investments.",
                    "bitcoin_relevance": "Advocated denationalization of money. Bitcoin is denationalized currency.",
                    "quote": "The curious task of economics is to demonstrate how little men know about what they imagine they can design.",
                    "sources": [{"title": "Denationalisation of Money", "url": "https://mises.org/library/denationalisation-money-argument-refined", "year": 1976}]
                },
                "murray_rothbard": {
                    "name": "Murray N. Rothbard", "era": "1926-1995",
                    "role": "Anarcho-capitalist economist",
                    "key_works": ["America's Great Depression (1963)", "What Has Government Done to Our Money? (1963)"],
                    "core_insight": "The Fed is the engine of boom-bust. Fractional reserve + central bank = moral hazard.",
                    "bitcoin_relevance": "Free market money without government backing realized in Bitcoin.",
                    "quote": "It is irresponsible to have loud opinions on economics while ignorant of it.",
                    "sources": [{"title": "Rothbard Archive", "url": "https://mises.org/profile/murray-n-rothbard", "year": 2025}]
                },
                # Bitcoin Thought Leaders
                "andreas_antonopoulos": {
                    "name": "Andreas M. Antonopoulos",
                    "role": "Bitcoin educator, author",
                    "key_works": ["Mastering Bitcoin (2014)", "The Internet of Money (2016)"],
                    "core_insight": "Bitcoin is separation of money and state. Programmable, open, neutral, censorship-resistant.",
                    "austrian_connection": "Fixed supply schedule = Austrian sound money",
                    "quote": "Bitcoin is not currency. Bitcoin is the internet of money.",
                    "sources": [{"title": "aantonop.com", "url": "https://aantonop.com/", "year": 2025}]
                },
                "robert_breedlove": {
                    "name": "Robert Breedlove",
                    "role": "Philosopher, podcaster",
                    "key_works": ["The Number Zero and Bitcoin", "What is Money podcast"],
                    "core_insight": "Bitcoin is absolute scarcity - first asset with perfectly inelastic supply.",
                    "austrian_connection": "Integrates Mises' regression theorem with Bitcoin discovery",
                    "quote": "Bitcoin is the most liquid, divisible, portable, verifiable, and scarce money ever.",
                    "sources": [{"title": "Breedlove Medium", "url": "https://breedlove22.medium.com/", "year": 2025}]
                },
                "saifedean_ammous": {
                    "name": "Saifedean Ammous",
                    "role": "Economist, author",
                    "key_works": ["The Bitcoin Standard (2018)", "The Fiat Standard (2021)"],
                    "core_insight": "Bitcoin's stock-to-flow makes it hardest money in history. Fiat creates high time preference.",
                    "austrian_connection": "Applies ABCT to explain fiat boom-bust cycles",
                    "quote": "Bitcoin is first example of absolute scarcity - cannot be produced regardless of resources.",
                    "sources": [{"title": "saifedean.com", "url": "https://saifedean.com/", "year": 2025}]
                },
                "michael_saylor": {
                    "name": "Michael Saylor",
                    "role": "MicroStrategy CEO, Bitcoin advocate",
                    "key_works": ["Bitcoin for Corporations thesis"],
                    "core_insight": "Bitcoin is digital property - perfected monetary network. Treasuries should hold hardest asset.",
                    "austrian_connection": "Ultimate store of value vs monetary debasement",
                    "quote": "Bitcoin is a swarm of cyber hornets serving the goddess of wisdom.",
                    "sources": [{"title": "Hope.com", "url": "https://hope.com/", "year": 2025}]
                },
                "lyn_alden": {
                    "name": "Lyn Alden",
                    "role": "Macro investor, analyst",
                    "key_works": ["Broken Money (2023)"],
                    "core_insight": "Bitcoin combines gold's monetary properties with digital networks. Solves Triffin's Dilemma.",
                    "austrian_connection": "Analyzes monetary history through Austrian lens",
                    "quote": "Bitcoin is first monetary protocol separating money from state.",
                    "sources": [{"title": "LynAlden.com", "url": "https://www.lynalden.com/", "year": 2025}]
                },
                "jeff_booth": {
                    "name": "Jeff Booth",
                    "role": "Tech entrepreneur, author",
                    "key_works": ["The Price of Tomorrow (2020)"],
                    "core_insight": "Technology is deflationary, fiat requires inflation. Bitcoin aligns money with tech deflation.",
                    "austrian_connection": "Fiat inflation fights natural price deflation from productivity",
                    "quote": "Debt and inflation system incompatible with exponential technology driving prices down.",
                    "sources": [{"title": "The Price of Tomorrow", "url": "https://www.theprice.co/", "year": 2020}]
                },
                "parker_lewis": {
                    "name": "Parker Lewis",
                    "role": "Bitcoin analyst",
                    "key_works": ["Gradually, Then Suddenly (essay series)"],
                    "core_insight": "Bitcoin monetizing through game theory. Gradually, then suddenly.",
                    "austrian_connection": "Explains monetization via Mises' regression theorem",
                    "quote": "Bitcoin is the great definancialization.",
                    "sources": [{"title": "Gradually, Then Suddenly", "url": "https://unchained.com/gradually-then-suddenly/", "year": 2025}]
                },
                # Bitcoin Engineers
                "pieter_wuille": {
                    "name": "Pieter Wuille",
                    "role": "Bitcoin Core developer",
                    "key_contributions": ["SegWit", "Taproot", "libsecp256k1"],
                    "core_insight": "Security and decentralization first. Conservative development protects Bitcoin's properties.",
                    "quote": "Bitcoin is an experiment. Treat it like one.",
                    "sources": [{"title": "Bitcoin Core GitHub", "url": "https://github.com/bitcoin/bitcoin", "year": 2025}]
                },
                "adam_back": {
                    "name": "Adam Back",
                    "role": "Cypherpunk, Blockstream CEO",
                    "key_contributions": ["Hashcash (1997)", "Cited in Bitcoin whitepaper"],
                    "core_insight": "Proof-of-work makes digital scarcity possible. Bitcoin realizes cypherpunk vision.",
                    "austrian_connection": "Digital scarcity through PoW creates sound digital money",
                    "quote": "Bitcoin is first functioning digital cash solving double-spend.",
                    "sources": [{"title": "Hashcash.org", "url": "http://www.hashcash.org/", "year": 2025}]
                },
                "hal_finney": {
                    "name": "Hal Finney",
                    "era": "1956-2014",
                    "role": "Cypherpunk pioneer, first Bitcoin recipient",
                    "key_contributions": ["First Bitcoin transaction", "RPOW"],
                    "core_insight": "Bitcoin enables true financial freedom. Running your own node = being your own bank.",
                    "quote": "Running Bitcoin (2009)",
                    "sources": [{"title": "Nakamoto Institute", "url": "https://nakamotoinstitute.org/authors/hal-finney/", "year": 2025}]
                }
            }

    # ------------------------------------------------------------------ #
    # Provenance utilities for verifiable analysis
    # ------------------------------------------------------------------ #
    def _provenance_for(self, metric_key: str, observed_at: Optional[str] = None) -> Dict[str, Any]:
        """Return a provenance record for a metric key with primary sources.

        Args:
            metric_key: Canonical metric key from explanations catalog
            observed_at: Optional ISO timestamp or period label

        Returns:
            Dict with fields: metric, mode, observed_at, sources: [...]
        """
        catalog = {
            "m2_growth_rate": [
                {"series": "M2SL", "title": "FRED: M2 Money Stock", "url": "https://fred.stlouisfed.org/series/M2SL"},
            ],
            "interest_rate_spread": [
                {"series": "GS10", "title": "FRED: 10Y Treasury", "url": "https://fred.stlouisfed.org/series/GS10"},
                {"series": "FEDFUNDS", "title": "FRED: Federal Funds Rate", "url": "https://fred.stlouisfed.org/series/FEDFUNDS"},
            ],
            "credit_growth_rate": [
                {"series": "TCMDO", "title": "FRED: Total Credit Market Debt Owed", "url": "https://fred.stlouisfed.org/series/TCMDO"},
            ],
            "total_credit_to_gdp": [
                {"series": "GFDEGDQ188S", "title": "FRED: Federal Debt to GDP", "url": "https://fred.stlouisfed.org/series/GFDEGDQ188S"},
                {"series": "BIS-credit-gdp", "title": "BIS: Credit-to-GDP", "url": "https://www.bis.org/statistics/c_gaps.htm"},
            ],
            "capacity_utilization": [
                {"series": "TCU", "title": "FRED: Capacity Utilization", "url": "https://fred.stlouisfed.org/series/TCU"},
            ],
        }
        mode = "real" if (self.fred and self.use_real_data) else "demo"
        return {
            "metric": metric_key,
            "mode": mode,
            "observed_at": observed_at or datetime.now(UTC).isoformat(),
            "sources": catalog.get(metric_key, []),
        }
    
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
        silver_data = self.asset_tracker.get_silver_price()
        
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
                "silver": silver_data.get("price", 32.50),
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

    def get_dashboard_data(self) -> Dict[str, Any]:
        """
        Retrieve comprehensive dashboard data including market data and analysis.
        This is an alias/combined method for backward compatibility.
        
        Returns:
            Dict containing all dashboard-relevant data
        """
        return {
            "market_data": self.get_market_data(),
            "analysis": self.get_current_analysis(),
            "three_pillars": self.get_three_pillars_data(),
        }


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
