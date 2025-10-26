#!/usr/bin/env python3
"""
Dynamic Content Engine
======================
Generates contextual, adaptive content based on real-time economic metrics.
All text, warnings, and recommendations adapt to current market conditions.

Features:
- Situational assessment AI analyzing all metric correlations
- Dynamic text generation for every dashboard element
- Actionable insights based on Austrian Business Cycle Theory
- Historical context and pattern matching
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class CyclePhase(Enum):
    """Current phase of the Austrian Business Cycle"""
    EARLY_BOOM = "early_boom"
    LATE_BOOM = "late_boom"
    PEAK = "peak"
    EARLY_BUST = "early_bust"
    LATE_BUST = "late_bust"
    BOTTOM = "bottom"
    RECOVERY = "recovery"
    EXPANSION = "expansion"


class RiskLevel(Enum):
    """Risk level classification"""
    EXTREME = "extreme"  # 8-10
    HIGH = "high"  # 6-7.9
    ELEVATED = "elevated"  # 4-5.9
    MODERATE = "moderate"  # 2-3.9
    LOW = "low"  # 0-1.9


@dataclass
class MetricThresholds:
    """Define thresholds for metric interpretation"""
    m2_growth_low: float = 0.0
    m2_growth_moderate: float = 5.0
    m2_growth_high: float = 10.0
    m2_growth_extreme: float = 15.0
    
    credit_growth_low: float = 0.0
    credit_growth_moderate: float = 5.0
    credit_growth_high: float = 8.0
    credit_growth_extreme: float = 12.0
    
    malinvestment_low: float = 3.0
    malinvestment_moderate: float = 5.0
    malinvestment_high: float = 7.0
    malinvestment_extreme: float = 8.5
    
    vix_complacency: float = 15.0
    vix_normal: float = 20.0
    vix_elevated: float = 30.0
    vix_panic: float = 40.0
    
    fed_funds_low: float = 2.0
    fed_funds_normal: float = 4.0
    fed_funds_high: float = 6.0
    
    yield_curve_inverted: float = -0.5
    yield_curve_flat: float = 0.2
    yield_curve_normal: float = 1.0


class DynamicContentEngine:
    """
    Generates adaptive content based on current economic metrics.
    All content is contextual and updates in real-time.
    """
    
    def __init__(self):
        self.thresholds = MetricThresholds()
        self.last_update = None
        self.cached_assessment = None
        
    def generate_situation_overview(
        self,
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive situation overview with actionable insights.
        
        This is the main "What's happening now?" panel.
        """
        risk_score = metrics.get('austrian_score', 5.0)
        cycle_phase = self._determine_cycle_phase(metrics)
        risk_level = self._classify_risk_level(risk_score)
        
        # Analyze correlations
        correlations = self._analyze_correlations(metrics)
        
        # Generate components
        headline = self._generate_headline(cycle_phase, risk_level, metrics)
        narrative = self._generate_narrative(cycle_phase, risk_level, correlations, metrics)
        warnings = self._generate_warnings(risk_level, correlations, metrics)
        opportunities = self._generate_opportunities(cycle_phase, correlations, metrics)
        actions = self._generate_actions(cycle_phase, risk_level, metrics)
        timeline = self._generate_timeline_context(cycle_phase, metrics)
        
        return {
            "headline": headline,
            "narrative": narrative,
            "risk_level": risk_level.value,
            "risk_score": risk_score,
            "cycle_phase": cycle_phase.value,
            "warnings": warnings,
            "opportunities": opportunities,
            "recommended_actions": actions,
            "timeline_context": timeline,
            "key_correlations": correlations,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    def generate_metric_tooltip(
        self,
        metric_key: str,
        current_value: float,
        all_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate rich tooltip content for any metric.
        Includes: current value, interpretation, Austrian theory, related metrics, actions
        """
        interpretation = self._interpret_metric(metric_key, current_value, all_metrics)
        theory = self._get_austrian_theory_context(metric_key, current_value)
        related = self._get_related_metrics(metric_key, all_metrics)
        historical = self._get_historical_context(metric_key, current_value)
        
        return {
            "metric_key": metric_key,
            "current_value": current_value,
            "interpretation": interpretation,
            "austrian_theory": theory,
            "related_metrics": related,
            "historical_context": historical,
            "data_sources": self._get_data_sources(metric_key)
        }
    
    def generate_chart_annotations(
        self,
        chart_type: str,
        data: Dict[str, Any],
        all_metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate dynamic annotations for charts based on current data.
        Annotations highlight significant events, thresholds, and patterns.
        """
        annotations = []
        
        if chart_type == "credit_growth":
            annotations.extend(self._annotate_credit_growth(data, all_metrics))
        elif chart_type == "malinvestment_radar":
            annotations.extend(self._annotate_malinvestment(data, all_metrics))
        elif chart_type == "austrian_score":
            annotations.extend(self._annotate_austrian_score(data, all_metrics))
        elif chart_type == "three_pillars":
            annotations.extend(self._annotate_three_pillars(data, all_metrics))
        elif chart_type == "asset_correlation":
            annotations.extend(self._annotate_asset_correlation(data, all_metrics))
        
        return annotations
    
    def _determine_cycle_phase(self, metrics: Dict[str, Any]) -> CyclePhase:
        """Determine current phase of Austrian Business Cycle"""
        risk_score = metrics.get('austrian_score', 5.0)
        m2_growth = metrics.get('m2_growth_rate', 5.0)
        credit_growth = metrics.get('credit_growth', 5.0)
        malinvestment = metrics.get('malinvestment_index', 5.0)
        vix = metrics.get('vix', 15.0)
        
        # Late boom: High risk + high credit + low VIX (complacency)
        if risk_score >= 7.5 and credit_growth > self.thresholds.credit_growth_high and vix < self.thresholds.vix_complacency:
            return CyclePhase.LATE_BOOM
        
        # Peak: Extreme risk + slowing credit + VIX rising
        if risk_score >= 8.5 and credit_growth < self.thresholds.credit_growth_moderate and vix > self.thresholds.vix_normal:
            return CyclePhase.PEAK
        
        # Early bust: High risk + negative credit + high VIX
        if risk_score >= 6 and credit_growth < 0 and vix > self.thresholds.vix_elevated:
            return CyclePhase.EARLY_BUST
        
        # Late bust: Moderate risk + very negative credit + extreme VIX
        if risk_score < 6 and credit_growth < -5 and vix > self.thresholds.vix_panic:
            return CyclePhase.LATE_BUST
        
        # Bottom: Low risk + stabilizing credit + falling VIX
        if risk_score < 4 and -2 < credit_growth < 2 and vix < self.thresholds.vix_elevated:
            return CyclePhase.BOTTOM
        
        # Recovery: Rising from bottom + positive credit + normalizing VIX
        if 3 < risk_score < 5 and 0 < credit_growth < self.thresholds.credit_growth_moderate and vix < self.thresholds.vix_normal:
            return CyclePhase.RECOVERY
        
        # Early boom: Moderate-high risk + accelerating credit + low VIX
        if 5 <= risk_score < 7.5 and credit_growth > self.thresholds.credit_growth_moderate and vix < self.thresholds.vix_normal:
            return CyclePhase.EARLY_BOOM
        
        # Default: Expansion
        return CyclePhase.EXPANSION
    
    def _classify_risk_level(self, risk_score: float) -> RiskLevel:
        """Classify risk level from score"""
        if risk_score >= 8.0:
            return RiskLevel.EXTREME
        elif risk_score >= 6.0:
            return RiskLevel.HIGH
        elif risk_score >= 4.0:
            return RiskLevel.ELEVATED
        elif risk_score >= 2.0:
            return RiskLevel.MODERATE
        else:
            return RiskLevel.LOW
    
    def _analyze_correlations(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze correlations between metrics to identify patterns.
        This is where we detect dangerous or unusual combinations.
        """
        correlations: Dict[str, Any] = {
            "monetary_credit_divergence": None,
            "risk_complacency_mismatch": None,
            "yield_curve_warning": None,
            "malinvestment_acceleration": None,
            "deflationary_pressure": None
        }
        
        m2_growth = metrics.get('m2_growth_rate', 5.0)
        credit_growth = metrics.get('credit_growth', 5.0)
        vix = metrics.get('vix', 15.0)
        risk_score = metrics.get('austrian_score', 5.0)
        yield_curve = metrics.get('yield_curve_spread', 1.0)
        malinvestment = metrics.get('malinvestment_index', 5.0)
        
        # Dangerous divergence: High M2 but low credit (transmission breakdown)
        if m2_growth > self.thresholds.m2_growth_high and credit_growth < self.thresholds.credit_growth_moderate:
            correlations["monetary_credit_divergence"] = {
                "severity": "high",
                "description": "Monetary expansion not translating to credit growth - possible transmission mechanism breakdown or credit demand collapse",
                "implication": "Either banks won't lend (credit crisis) or borrowers won't borrow (recession fear)"
            }
        
        # Risk-complacency mismatch: High risk but low VIX
        if risk_score >= 7 and vix < self.thresholds.vix_complacency:
            correlations["risk_complacency_mismatch"] = {
                "severity": "extreme",
                "description": "Extreme complacency (VIX {:.1f}) despite high systemic risk ({:.1f}/10)".format(vix, risk_score),
                "implication": "Market is not pricing in danger - classic late-boom euphoria before sharp correction"
            }
        
        # Inverted yield curve
        if yield_curve < self.thresholds.yield_curve_inverted:
            correlations["yield_curve_warning"] = {
                "severity": "high",
                "description": "Inverted yield curve ({:.2f}%) - historically reliable recession indicator".format(yield_curve),
                "implication": "Bond market expects Fed to cut rates due to coming recession"
            }
        
        # Malinvestment acceleration
        if malinvestment > self.thresholds.malinvestment_high and credit_growth > self.thresholds.credit_growth_high:
            correlations["malinvestment_acceleration"] = {
                "severity": "extreme",
                "description": "High malinvestment ({:.1f}/10) combined with rapid credit growth ({:.1f}%)".format(malinvestment, credit_growth),
                "implication": "Capital being rapidly misallocated - boom phase nearing unsustainable peak"
            }
        
        # Deflationary pressure
        if m2_growth < 0 and credit_growth < -5:
            correlations["deflationary_pressure"] = {
                "severity": "high",
                "description": "Money supply contracting (M2: {:.1f}%) and credit collapsing ({:.1f}%)".format(m2_growth, credit_growth),
                "implication": "Deflationary bust in progress - liquidation of malinvestments underway"
            }
        
        return correlations
    
    def _generate_headline(
        self,
        phase: CyclePhase,
        risk: RiskLevel,
        metrics: Dict[str, Any]
    ) -> str:
        """Generate attention-grabbing headline for current situation"""
        
        headlines = {
            CyclePhase.LATE_BOOM: {
                RiskLevel.EXTREME: "🚨 LATE BOOM PEAK: Extreme Malinvestment Detected - Prepare for Correction",
                RiskLevel.HIGH: "⚠️ LATE BOOM: Artificial Credit Expansion Reaching Dangerous Levels",
                RiskLevel.ELEVATED: "⚠️ BOOM PHASE: Monitor for Signs of Peak and Reversal"
            },
            CyclePhase.PEAK: {
                RiskLevel.EXTREME: "🔴 CYCLE PEAK: Imminent Reversal - Maximum Defensive Posture",
                RiskLevel.HIGH: "🔴 APPROACHING PEAK: Credit Tightening Beginning",
                RiskLevel.ELEVATED: "⚠️ LATE-CYCLE: Transition Phase Underway"
            },
            CyclePhase.EARLY_BUST: {
                RiskLevel.HIGH: "📉 BUST PHASE INITIATED: Malinvestments Being Revealed",
                RiskLevel.ELEVATED: "📉 CORRECTION UNDERWAY: Unsustainable Investments Liquidating",
                RiskLevel.MODERATE: "📉 EARLY BUST: Monitor for Stabilization Signals"
            },
            CyclePhase.LATE_BUST: {
                RiskLevel.ELEVATED: "💥 DEEP CORRECTION: Liquidation Process Advanced",
                RiskLevel.MODERATE: "💥 LATE BUST: Approaching Bottom Formation",
                RiskLevel.LOW: "✅ BUST COMPLETING: Cleansing Nearly Complete"
            },
            CyclePhase.BOTTOM: {
                RiskLevel.MODERATE: "🟢 CYCLE BOTTOM: Foundation for Sustainable Recovery Forming",
                RiskLevel.LOW: "🟢 BOTTOMING PROCESS: Real Economy Stabilizing",
            },
            CyclePhase.RECOVERY: {
                RiskLevel.MODERATE: "📈 EARLY RECOVERY: Real Savings-Based Growth Beginning",
                RiskLevel.ELEVATED: "📈 RECOVERY PHASE: Monitor for Artificial Stimulus",
                RiskLevel.LOW: "✅ HEALTHY RECOVERY: Sustainable Growth Pattern"
            },
            CyclePhase.EARLY_BOOM: {
                RiskLevel.ELEVATED: "⚠️ EARLY BOOM: Artificial Credit Expansion Accelerating",
                RiskLevel.HIGH: "⚠️ BOOM FORMING: Malinvestment Seeds Being Sown",
                RiskLevel.MODERATE: "🟡 EXPANSION: Monitor for Boom Phase Development"
            },
            CyclePhase.EXPANSION: {
                RiskLevel.MODERATE: "🟢 STABLE EXPANSION: Healthy Economic Growth",
                RiskLevel.ELEVATED: "🟡 EXPANSION: Watch for Credit Market Distortions",
                RiskLevel.LOW: "✅ SUSTAINABLE GROWTH: Minimal Distortions Detected"
            }
        }
        
        # Get headline for phase and risk, or default
        phase_headlines = headlines.get(phase, {})
        return phase_headlines.get(risk, f"MONITORING: {phase.value.upper()} - {risk.value.upper()} RISK")
    
    def _generate_narrative(
        self,
        phase: CyclePhase,
        risk: RiskLevel,
        correlations: Dict[str, Any],
        metrics: Dict[str, Any]
    ) -> str:
        """Generate detailed narrative explaining current situation"""
        
        narrative_parts = []
        
        # Phase-specific introduction
        phase_intros = {
            CyclePhase.LATE_BOOM: "The economy is in a late boom phase, characterized by widespread distortions from prolonged artificial credit expansion. Interest rates have been held below the natural rate for an extended period, causing massive capital misallocation.",
            CyclePhase.PEAK: "The artificial boom has reached its peak. Credit conditions are beginning to tighten, and the first cracks in the malinvestment structure are appearing.",
            CyclePhase.EARLY_BUST: "The inevitable bust has begun. Malinvestments created during the boom are being revealed as unprofitable, and liquidation is underway.",
            CyclePhase.LATE_BUST: "The economy is in a deep correction phase. Severe liquidation of malinvestments is cleansing the capital structure.",
            CyclePhase.BOTTOM: "The worst of the bust appears over. The economy is stabilizing at a new, sustainable level after cleansing malinvestments.",
            CyclePhase.RECOVERY: "A genuine recovery based on real savings is beginning. Resources are being reallocated to sustainable uses.",
            CyclePhase.EARLY_BOOM: "An artificial boom is developing. Central bank policy is distorting interest rate signals and encouraging malinvestment.",
            CyclePhase.EXPANSION: "The economy is experiencing expansion. Current conditions show moderate growth with manageable distortions."
        }
        
        narrative_parts.append(phase_intros.get(phase, "Economic conditions are being monitored."))
        
        # Add specific metrics context
        m2_growth = metrics.get('m2_growth_rate', 0)
        credit_growth = metrics.get('credit_growth', 0)
        malinvestment = metrics.get('malinvestment_index', 5)
        fed_funds = metrics.get('fed_funds_rate', 5)
        
        # Monetary policy context
        if fed_funds < self.thresholds.fed_funds_low:
            narrative_parts.append(
                f"The Federal Reserve's extremely low interest rate policy (Fed Funds: {fed_funds:.2f}%) "
                f"is significantly below the natural rate, creating strong incentives for malinvestment."
            )
        elif fed_funds > self.thresholds.fed_funds_high:
            narrative_parts.append(
                f"The Federal Reserve has raised rates significantly (Fed Funds: {fed_funds:.2f}%), "
                f"tightening credit conditions and revealing malinvestments from the previous boom."
            )
        
        # Credit expansion context
        if credit_growth > self.thresholds.credit_growth_extreme:
            narrative_parts.append(
                f"Credit is expanding at an unsustainable rate ({credit_growth:.1f}% YoY), "
                f"financing long-term projects that won't be completed profitably."
            )
        elif credit_growth < 0:
            narrative_parts.append(
                f"Credit is contracting ({credit_growth:.1f}% YoY), forcing liquidation of "
                f"projects that depended on continued cheap credit."
            )
        
        # Malinvestment severity
        if malinvestment > self.thresholds.malinvestment_extreme:
            narrative_parts.append(
                f"The malinvestment index is critically high ({malinvestment:.1f}/10), "
                f"indicating severe capital misallocation across the production structure."
            )
        
        # Add correlation insights
        for key, corr in correlations.items():
            if corr and corr.get("severity") in ["high", "extreme"]:
                narrative_parts.append(corr["description"] + ". " + corr["implication"] + ".")
        
        return " ".join(narrative_parts)
    
    def _generate_warnings(
        self,
        risk: RiskLevel,
        correlations: Dict[str, Any],
        metrics: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate specific warnings based on current conditions"""
        warnings = []
        
        if risk == RiskLevel.EXTREME:
            warnings.append({
                "severity": "extreme",
                "title": "Extreme Systemic Risk",
                "message": "Multiple indicators showing critical levels. Maximum caution advised.",
                "action": "Reduce exposure to bubble assets, increase cash and sound money (gold/Bitcoin)"
            })
        
        # Check each correlation for warnings
        for key, corr in correlations.items():
            if corr and corr.get("severity") in ["high", "extreme"]:
                warnings.append({
                    "severity": corr["severity"],
                    "title": key.replace("_", " ").title(),
                    "message": corr["description"],
                    "action": corr["implication"]
                })
        
        # Specific metric warnings
        vix = metrics.get('vix', 15)
        if vix < 12:
            warnings.append({
                "severity": "high",
                "title": "Extreme Complacency",
                "message": f"VIX at {vix:.1f} indicates markets pricing in no risk - classic late-boom signal",
                "action": "Increase hedges and reduce equity exposure"
            })
        
        yield_curve = metrics.get('yield_curve_spread', 1.0)
        if yield_curve < -0.5:
            warnings.append({
                "severity": "high",
                "title": "Deeply Inverted Yield Curve",
                "message": "Bond market strongly signals recession ahead",
                "action": "Prepare for economic contraction within 6-18 months"
            })
        
        return warnings
    
    def _generate_opportunities(
        self,
        phase: CyclePhase,
        correlations: Dict[str, Any],
        metrics: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate opportunity insights based on cycle phase"""
        opportunities = []
        
        if phase == CyclePhase.LATE_BUST or phase == CyclePhase.BOTTOM:
            opportunities.append({
                "title": "Distressed Asset Opportunities",
                "description": "Malinvestments have been liquidated, creating value opportunities",
                "assets": ["Real productive assets", "Quality stocks at depressed prices", "Sound businesses with cash flow"]
            })
        
        if phase == CyclePhase.RECOVERY:
            opportunities.append({
                "title": "Early Recovery Positioning",
                "description": "Sustainable recovery beginning - position before boom phase",
                "assets": ["Productive capital goods", "Quality growth stocks", "Real estate in recovering sectors"]
            })
        
        # Sound money opportunities
        risk_score = metrics.get('austrian_score', 5)
        if risk_score >= 7:
            opportunities.append({
                "title": "Sound Money Protection",
                "description": "High systemic risk favors hard assets over fiat-denominated paper",
                "assets": ["Gold", "Bitcoin", "Silver", "Real assets with pricing power"]
            })
        
        # Contrarian plays
        vix = metrics.get('vix', 15)
        if vix > 35:
            opportunities.append({
                "title": "Fear-Driven Mispricing",
                "description": "Extreme fear creating indiscriminate selling - quality assets on sale",
                "assets": ["Blue-chip stocks", "Investment-grade bonds", "Quality dividend payers"]
            })
        
        return opportunities
    
    def _generate_actions(
        self,
        phase: CyclePhase,
        risk: RiskLevel,
        metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate specific actionable recommendations"""
        actions = []
        
        # Asset allocation recommendation
        if risk == RiskLevel.EXTREME:
            actions.append({
                "category": "Asset Allocation",
                "priority": "immediate",
                "recommendations": [
                    "Increase cash reserves to 30-40% of portfolio",
                    "Increase gold allocation to 15-20%",
                    "Consider 5-10% Bitcoin allocation as digital sound money",
                    "Reduce or eliminate speculative positions",
                    "Exit overvalued growth stocks",
                    "Avoid new long-term commitments"
                ]
            })
        elif risk == RiskLevel.HIGH:
            actions.append({
                "category": "Asset Allocation",
                "priority": "high",
                "recommendations": [
                    "Increase cash to 20-30%",
                    "Add gold and Bitcoin positions",
                    "Reduce exposure to credit-sensitive assets",
                    "Focus on quality over growth",
                    "Consider put options for hedging"
                ]
            })
        elif risk == RiskLevel.LOW:
            actions.append({
                "category": "Asset Allocation",
                "priority": "normal",
                "recommendations": [
                    "Maintain balanced allocation",
                    "Consider selective growth opportunities",
                    "Standard 5-10% precious metals",
                    "Normal cash reserves (10-15%)"
                ]
            })
        
        # Business/employment actions
        if phase in [CyclePhase.LATE_BOOM, CyclePhase.PEAK]:
            actions.append({
                "category": "Business/Career",
                "priority": "high",
                "recommendations": [
                    "Build cash reserves in business",
                    "Lock in long-term fixed-rate financing if needed",
                    "Reduce leverage and debt",
                    "Delay major capital expenditures",
                    "Strengthen employment skills/credentials",
                    "Avoid career changes dependent on boom conditions"
                ]
            })
        elif phase in [CyclePhase.BOTTOM, CyclePhase.RECOVERY]:
            actions.append({
                "category": "Business/Career",
                "priority": "medium",
                "recommendations": [
                    "Invest in productive capital at depressed prices",
                    "Hire quality talent available due to downturn",
                    "Acquire competitors or assets at distressed prices",
                    "Launch new ventures with low startup costs",
                    "Consider career upgrades as competition is reduced"
                ]
            })
        
        # Debt management
        credit_growth = metrics.get('credit_growth', 0)
        if credit_growth > 8 or risk == RiskLevel.EXTREME:
            actions.append({
                "category": "Debt Management",
                "priority": "immediate",
                "recommendations": [
                    "Pay down variable-rate debt immediately",
                    "Avoid new debt obligations",
                    "Refinance to fixed rates if locked in",
                    "Build emergency fund to 12+ months expenses",
                    "Prepare for higher future interest rates"
                ]
            })
        
        # Investment focus
        if phase == CyclePhase.LATE_BUST:
            actions.append({
                "category": "Investment Focus",
                "priority": "medium",
                "recommendations": [
                    "Research quality assets for purchase at bottom",
                    "Prepare shopping list of undervalued opportunities",
                    "Wait for sentiment to reach maximum pessimism",
                    "Focus on businesses with pricing power",
                    "Look for sectors overcorrected by panic selling"
                ]
            })
        
        return actions
    
    def _generate_timeline_context(
        self,
        phase: CyclePhase,
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate timeline context - where we are and where we're likely headed"""
        
        risk_score = metrics.get('austrian_score', 5)
        credit_growth = metrics.get('credit_growth', 0)
        
        # Estimate time to next phase
        timeline = {
            "current_phase": phase.value,
            "phase_description": None,
            "estimated_duration": None,
            "next_phase": None,
            "key_triggers": []
        }
        
        if phase == CyclePhase.LATE_BOOM:
            timeline.update({
                "phase_description": "Late boom phases typically last 6-24 months before peak",
                "estimated_duration": "6-24 months remaining",
                "next_phase": "peak",
                "key_triggers": [
                    "Fed begins raising rates aggressively",
                    "Credit growth turns negative",
                    "First major bankruptcies in overextended sectors",
                    "Stock market volatility spikes",
                    "Yield curve uninverts rapidly"
                ]
            })
        elif phase == CyclePhase.PEAK:
            timeline.update({
                "phase_description": "Peak phase is transitional and typically brief (1-6 months)",
                "estimated_duration": "1-6 months",
                "next_phase": "early_bust",
                "key_triggers": [
                    "Credit markets freeze",
                    "Major corporate bankruptcies",
                    "Stock market correction accelerates",
                    "VIX spikes above 30",
                    "Flight to safety in bonds"
                ]
            })
        elif phase == CyclePhase.EARLY_BUST:
            timeline.update({
                "phase_description": "Early bust typically lasts 6-18 months as reality sets in",
                "estimated_duration": "6-18 months",
                "next_phase": "late_bust",
                "key_triggers": [
                    "Unemployment rises significantly",
                    "Fed cuts rates aggressively",
                    "Credit contraction deepens",
                    "Asset prices fall 30-50%",
                    "Panic selling in equities"
                ]
            })
        elif phase == CyclePhase.LATE_BUST:
            timeline.update({
                "phase_description": "Late bust/bottom formation: 6-24 months of deep correction",
                "estimated_duration": "6-24 months",
                "next_phase": "bottom",
                "key_triggers": [
                    "Credit contraction slows",
                    "VIX begins declining from extreme levels",
                    "Capitulation in asset prices",
                    "Unemployment peaks",
                    "Sentiment reaches maximum pessimism"
                ]
            })
        elif phase == CyclePhase.BOTTOM:
            timeline.update({
                "phase_description": "Bottom formation: 3-12 months of stabilization",
                "estimated_duration": "3-12 months",
                "next_phase": "recovery",
                "key_triggers": [
                    "Credit growth stabilizes",
                    "Employment begins recovering",
                    "Asset prices stop falling",
                    "Sentiment improves from despair",
                    "Quality businesses return to profitability"
                ]
            })
        elif phase == CyclePhase.RECOVERY:
            timeline.update({
                "phase_description": "Recovery phase: 12-36 months of genuine growth",
                "estimated_duration": "12-36 months",
                "next_phase": "expansion or early_boom (if Fed interferes)",
                "key_triggers": [
                    "Fed begins re-inflating if impatient",
                    "Credit growth accelerates",
                    "Asset prices recover to previous highs",
                    "Malinvestment index begins rising again",
                    "Risk complacency returns"
                ]
            })
        elif phase == CyclePhase.EARLY_BOOM:
            timeline.update({
                "phase_description": "Early boom: 12-36 months of artificial expansion",
                "estimated_duration": "12-36 months",
                "next_phase": "late_boom",
                "key_triggers": [
                    "Credit growth accelerates above 8%",
                    "Malinvestment index rises above 7",
                    "VIX falls below 12 (complacency)",
                    "Asset prices inflate rapidly",
                    "Risk-taking increases dramatically"
                ]
            })
        
        return timeline
    
    def _interpret_metric(
        self,
        metric_key: str,
        value: float,
        all_metrics: Dict[str, Any]
    ) -> str:
        """Generate interpretation for a specific metric value"""
        
        interpretations = {
            "m2_growth_rate": self._interpret_m2_growth(value),
            "credit_growth": self._interpret_credit_growth(value),
            "malinvestment_index": self._interpret_malinvestment(value),
            "austrian_score": self._interpret_austrian_score(value),
            "vix": self._interpret_vix(value),
            "fed_funds_rate": self._interpret_fed_funds(value, all_metrics),
            "yield_curve_spread": self._interpret_yield_curve(value),
            "unemployment_rate": self._interpret_unemployment(value),
            "cpi_inflation": self._interpret_inflation(value),
        }
        
        return interpretations.get(metric_key, f"Current value: {value}")
    
    def _interpret_m2_growth(self, value: float) -> str:
        """Interpret M2 money supply growth rate"""
        if value < 0:
            return f"M2 CONTRACTING at {value:.1f}% - Rare deflationary environment, credit destruction in progress"
        elif value < 3:
            return f"M2 growing slowly at {value:.1f}% - Below historical average, tight monetary conditions"
        elif value < 7:
            return f"M2 growing moderately at {value:.1f}% - Normal historical range, steady monetary expansion"
        elif value < 12:
            return f"M2 accelerating at {value:.1f}% - Above-trend expansion, inflation risk rising"
        else:
            return f"M2 SURGING at {value:.1f}% - Dangerous monetary acceleration, high inflation risk"
    
    def _interpret_credit_growth(self, value: float) -> str:
        """Interpret credit growth rate"""
        if value < -5:
            return f"Credit COLLAPSING at {value:.1f}% - Severe deleveraging, bust phase underway"
        elif value < 0:
            return f"Credit contracting at {value:.1f}% - Deleveraging in progress, malinvestments being liquidated"
        elif value < 5:
            return f"Credit growing slowly at {value:.1f}% - Sustainable pace, low malinvestment risk"
        elif value < 8:
            return f"Credit accelerating at {value:.1f}% - Boom phase developing, monitor malinvestment"
        else:
            return f"Credit SURGING at {value:.1f}% - Dangerous artificial boom, unsustainable malinvestment"
    
    def _interpret_malinvestment(self, value: float) -> str:
        """Interpret malinvestment index"""
        if value < 3:
            return f"Malinvestment LOW at {value:.1f}/10 - Capital allocation relatively sound"
        elif value < 5:
            return f"Malinvestment MODERATE at {value:.1f}/10 - Some distortions present, monitor trends"
        elif value < 7:
            return f"Malinvestment ELEVATED at {value:.1f}/10 - Significant capital misallocation underway"
        elif value < 8.5:
            return f"Malinvestment HIGH at {value:.1f}/10 - Severe distortions, boom phase advanced"
        else:
            return f"Malinvestment EXTREME at {value:.1f}/10 - Critical misallocation, bust approaching"
    
    def _interpret_austrian_score(self, value: float) -> str:
        """Interpret Austrian risk score"""
        if value < 2:
            return f"Risk LOW at {value:.1f}/10 - Healthy economic conditions, minimal distortions"
        elif value < 4:
            return f"Risk MODERATE at {value:.1f}/10 - Normal conditions, standard vigilance"
        elif value < 6:
            return f"Risk ELEVATED at {value:.1f}/10 - Distortions building, increase caution"
        elif value < 8:
            return f"Risk HIGH at {value:.1f}/10 - Significant systemic risk, reduce exposure"
        else:
            return f"Risk EXTREME at {value:.1f}/10 - Critical levels, maximum defensive posture"
    
    def _interpret_vix(self, value: float) -> str:
        """Interpret VIX (volatility index)"""
        if value < 12:
            return f"VIX at {value:.1f} - EXTREME COMPLACENCY, danger signal in late boom"
        elif value < 16:
            return f"VIX at {value:.1f} - LOW volatility, calm market conditions"
        elif value < 20:
            return f"VIX at {value:.1f} - NORMAL volatility, healthy market"
        elif value < 30:
            return f"VIX at {value:.1f} - ELEVATED fear, uncertainty increasing"
        elif value < 40:
            return f"VIX at {value:.1f} - HIGH fear, significant market stress"
        else:
            return f"VIX at {value:.1f} - EXTREME PANIC, crisis conditions"
    
    def _interpret_fed_funds(self, value: float, all_metrics: Dict[str, Any]) -> str:
        """Interpret Fed Funds rate"""
        natural_rate = all_metrics.get('natural_rate_estimate', 4.0)
        spread = value - natural_rate
        
        if spread < -2:
            return f"Fed Funds at {value:.2f}% is FAR BELOW natural rate ({natural_rate:.2f}%) - Extreme artificial stimulus, severe malinvestment risk"
        elif spread < -1:
            return f"Fed Funds at {value:.2f}% is BELOW natural rate ({natural_rate:.2f}%) - Artificial credit expansion, boom phase"
        elif -0.5 < spread < 0.5:
            return f"Fed Funds at {value:.2f}% is NEAR natural rate ({natural_rate:.2f}%) - Neutral policy, minimal distortion"
        elif spread > 1:
            return f"Fed Funds at {value:.2f}% is ABOVE natural rate ({natural_rate:.2f}%) - Tight policy, credit contraction"
        else:
            return f"Fed Funds at {value:.2f}% (natural rate: {natural_rate:.2f}%)"
    
    def _interpret_yield_curve(self, value: float) -> str:
        """Interpret yield curve spread (10Y - 2Y)"""
        if value < -1:
            return f"Yield curve DEEPLY INVERTED at {value:.2f}% - Strong recession signal"
        elif value < -0.2:
            return f"Yield curve INVERTED at {value:.2f}% - Recession warning, historically reliable"
        elif value < 0.3:
            return f"Yield curve FLAT at {value:.2f}% - Neutral to slightly cautious"
        elif value < 1.5:
            return f"Yield curve NORMAL at {value:.2f}% - Healthy shape"
        else:
            return f"Yield curve STEEP at {value:.2f}% - Expectations of strong growth or inflation"
    
    def _interpret_unemployment(self, value: float) -> str:
        """Interpret unemployment rate"""
        if value < 4:
            return f"Unemployment at {value:.1f}% - VERY LOW, tight labor market (late boom sign if accompanied by high credit growth)"
        elif value < 5.5:
            return f"Unemployment at {value:.1f}% - LOW, healthy full employment"
        elif value < 7:
            return f"Unemployment at {value:.1f}% - MODERATE, some slack"
        elif value < 10:
            return f"Unemployment at {value:.1f}% - ELEVATED, recession conditions"
        else:
            return f"Unemployment at {value:.1f}% - HIGH, severe recession or depression"
    
    def _interpret_inflation(self, value: float) -> str:
        """Interpret CPI inflation rate"""
        if value < 0:
            return f"CPI at {value:.1f}% - DEFLATION, prices falling (could be healthy or crisis)"
        elif value < 2:
            return f"CPI at {value:.1f}% - LOW inflation, stable prices"
        elif value < 3:
            return f"CPI at {value:.1f}% - MODERATE inflation, around Fed target"
        elif value < 5:
            return f"CPI at {value:.1f}% - ELEVATED inflation, above target"
        elif value < 8:
            return f"CPI at {value:.1f}% - HIGH inflation, eroding purchasing power"
        else:
            return f"CPI at {value:.1f}% - VERY HIGH inflation, crisis levels"
    
    def _get_austrian_theory_context(self, metric_key: str, value: float) -> Dict[str, Any]:
        """Get Austrian economics theory context for a metric"""
        
        theories = {
            "m2_growth_rate": {
                "concept": "Monetary Expansion and the Cantillon Effect",
                "summary": "New money is not neutral - it flows through the economy unevenly, benefiting early recipients (banks, government, connected entities) at the expense of later recipients (wage earners, savers). Rapid M2 growth indicates artificial credit expansion.",
                "key_thinkers": ["Ludwig von Mises", "Murray Rothbard", "Richard Cantillon"],
                "implications": "Money printing doesn't create real wealth, it just redistributes it. Early inflation beneficiaries see asset price gains, while late recipients suffer price inflation in necessities."
            },
            "credit_growth": {
                "concept": "Austrian Business Cycle Theory (ABCT)",
                "summary": "Artificially low interest rates (below the natural rate) cause credit expansion that distorts the time structure of production. Resources flow into longer-term, capital-intensive projects that appear profitable only due to cheap credit.",
                "key_thinkers": ["Ludwig von Mises", "Friedrich Hayek", "Murray Rothbard"],
                "implications": "Credit booms create unsustainable malinvestment. When credit eventually tightens or rates rise, these projects fail en masse, causing recession."
            },
            "malinvestment_index": {
                "concept": "Capital Structure and Malinvestment",
                "summary": "The economy's capital structure (machinery, buildings, long-term projects) must align with real consumer time preferences. Artificial credit expansion causes misalignment - too many resources in distant future production, not enough in present consumption.",
                "key_thinkers": ["Ludwig von Mises", "Friedrich Hayek", "Roger Garrison"],
                "implications": "High malinvestment means capital is locked in unprofitable uses. Liquidation (bust) is necessary to reallocate capital to sustainable uses."
            },
            "austrian_score": {
                "concept": "Business Cycle Risk Assessment",
                "summary": "Combines multiple Austrian indicators (credit growth, monetary expansion, interest rate distortion, capital misallocation) into overall systemic risk score. Measures deviation from sustainable market-driven economic activity.",
                "key_thinkers": ["Ludwig von Mises", "Murray Rothbard", "Jesús Huerta de Soto"],
                "implications": "High scores indicate late boom phase risk. Low scores indicate either healthy expansion or post-bust recovery."
            },
            "vix": {
                "concept": "Market Psychology and Boom-Bust Phases",
                "summary": "Austrian theory recognizes psychological elements in cycles. Late booms feature euphoria and complacency (low VIX), while busts feature panic and fear (high VIX). These aren't irrational - they respond to real credit conditions.",
                "key_thinkers": ["Ludwig von Mises (boom psychology)", "Hyman Minsky (financial instability)"],
                "implications": "Extremely low VIX during credit boom = dangerous complacency. High VIX during bust = rational fear of insolvency."
            },
            "fed_funds_rate": {
                "concept": "Natural Rate vs Artificial Rate",
                "summary": "There exists a 'natural' interest rate determined by time preferences and real saving in the economy. When central banks push rates below this natural rate, they trigger artificial boom. When rates rise above, boom ends.",
                "key_thinkers": ["Ludwig von Mises", "Friedrich Hayek", "Knut Wicksell"],
                "implications": "Fed can create boom by keeping rates low, but cannot sustain it forever. Eventually reality (natural rate) reasserts itself."
            }
        }
        
        return theories.get(metric_key, {
            "concept": "General Austrian Principles",
            "summary": "Austrian economics emphasizes that markets should be free from central planning, money should be sound (gold, Bitcoin), and recessions are necessary corrections after artificial booms.",
            "key_thinkers": ["Ludwig von Mises", "Friedrich Hayek", "Murray Rothbard"],
            "implications": "Government and central bank intervention create more problems than they solve."
        })
    
    def _get_related_metrics(
        self,
        metric_key: str,
        all_metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Get related metrics that provide additional context"""
        
        relationships = {
            "m2_growth_rate": ["credit_growth", "cpi_inflation", "fed_funds_rate"],
            "credit_growth": ["m2_growth_rate", "malinvestment_index", "fed_funds_rate"],
            "malinvestment_index": ["credit_growth", "austrian_score", "yield_curve_spread"],
            "austrian_score": ["malinvestment_index", "credit_growth", "m2_growth_rate"],
            "vix": ["austrian_score", "stock_prices", "credit_spreads"],
            "fed_funds_rate": ["natural_rate_estimate", "m2_growth_rate", "credit_growth"],
            "yield_curve_spread": ["fed_funds_rate", "recession_probability", "credit_spreads"]
        }
        
        related_keys = relationships.get(metric_key, [])
        related_metrics = []
        
        for key in related_keys:
            value = all_metrics.get(key)
            if value is not None:
                related_metrics.append({
                    "key": key,
                    "value": value,
                    "label": key.replace("_", " ").title()
                })
        
        return related_metrics
    
    def _get_historical_context(self, metric_key: str, value: float) -> Dict[str, Any]:
        """Provide historical context for current metric value"""
        
        # This would ideally query historical database
        # For now, provide general context
        
        contexts = {
            "m2_growth_rate": {
                "historical_average": 6.0,
                "recent_extremes": {
                    "2020_pandemic": 25.0,
                    "2008_crisis": -2.0,
                    "1970s_inflation": 13.0
                },
                "current_percentile": self._calculate_percentile(value, 6.0, 8.0)
            },
            "credit_growth": {
                "historical_average": 5.5,
                "recent_extremes": {
                    "2006_bubble": 12.0,
                    "2009_crisis": -8.0,
                    "2020_pandemic": -5.0
                },
                "current_percentile": self._calculate_percentile(value, 5.5, 6.0)
            }
        }
        
        return contexts.get(metric_key, {"historical_average": None})
    
    def _calculate_percentile(self, value: float, mean: float, std: float) -> float:
        """Rough percentile calculation"""
        z_score = (value - mean) / std
        # Simplified percentile
        if z_score < -2:
            return 2.5
        elif z_score < -1:
            return 16.0
        elif z_score < 0:
            return 40.0
        elif z_score < 1:
            return 60.0
        elif z_score < 2:
            return 84.0
        else:
            return 97.5
    
    def _get_data_sources(self, metric_key: str) -> List[Dict[str, str]]:
        """Get data sources for a metric"""
        
        sources = {
            "m2_growth_rate": [
                {"name": "FRED - M2 Money Stock", "url": "https://fred.stlouisfed.org/series/M2SL"},
                {"name": "Federal Reserve Statistical Releases", "url": "https://www.federalreserve.gov/releases/h6/"}
            ],
            "credit_growth": [
                {"name": "FRED - Total Credit to Private Non-Financial Sector", "url": "https://fred.stlouisfed.org/series/QUSPAM770A"},
                {"name": "BIS - Credit to Non-Financial Sector", "url": "https://www.bis.org/statistics/totcredit.htm"}
            ],
            "fed_funds_rate": [
                {"name": "FRED - Federal Funds Effective Rate", "url": "https://fred.stlouisfed.org/series/FEDFUNDS"},
                {"name": "Federal Reserve - Fed Funds Rate", "url": "https://www.federalreserve.gov/monetarypolicy/openmarket.htm"}
            ],
            "vix": [
                {"name": "CBOE - VIX Index", "url": "https://www.cboe.com/tradable_products/vix/"},
                {"name": "FRED - CBOE Volatility Index", "url": "https://fred.stlouisfed.org/series/VIXCLS"}
            ]
        }
        
        return sources.get(metric_key, [{"name": "Economic Data API", "url": "#"}])
    
    # Chart annotation methods
    def _annotate_credit_growth(self, data: Dict[str, Any], metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate annotations for credit growth chart"""
        annotations = []
        
        current_growth = metrics.get('credit_growth', 0)
        
        if current_growth > self.thresholds.credit_growth_extreme:
            annotations.append({
                "type": "threshold",
                "value": current_growth,
                "label": "⚠️ EXTREME - Unsustainable artificial boom",
                "color": "red"
            })
        elif current_growth < 0:
            annotations.append({
                "type": "threshold",
                "value": current_growth,
                "label": "📉 CONTRACTION - Malinvestment liquidation",
                "color": "blue"
            })
        
        return annotations
    
    def _annotate_malinvestment(self, data: Dict[str, Any], metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate annotations for malinvestment radar"""
        annotations = []
        
        malinvestment = metrics.get('malinvestment_index', 5)
        
        if malinvestment > 8:
            annotations.append({
                "type": "warning",
                "message": "Critical malinvestment across multiple sectors",
                "color": "red"
            })
        
        return annotations
    
    def _annotate_austrian_score(self, data: Dict[str, Any], metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate annotations for Austrian score gauge"""
        annotations = []
        
        score = metrics.get('austrian_score', 5)
        
        if score >= 8:
            annotations.append({
                "type": "critical",
                "message": "Maximum defensive posture recommended",
                "color": "red"
            })
        
        return annotations
    
    def _annotate_three_pillars(self, data: Dict[str, Any], metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate annotations for three pillars chart"""
        return []
    
    def _annotate_asset_correlation(self, data: Dict[str, Any], metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate annotations for asset correlation matrix"""
        return []


# Singleton instance
_engine = None

def get_content_engine() -> DynamicContentEngine:
    """Get singleton content engine instance"""
    global _engine
    if _engine is None:
        _engine = DynamicContentEngine()
    return _engine
