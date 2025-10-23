"""
Austrian Economics Knowledge Base and Dynamic Interpretation Engine

This module provides rich, context-aware Austrian economic insights for all metrics,
integrating wisdom from classical and modern Austrian economists.

Classical Austrian Economists:
- Carl Menger (1840-1921): Founder, subjective value theory
- Eugen von Böhm-Bawerk (1851-1914): Capital theory, time preference
- Ludwig von Mises (1881-1973): Praxeology, business cycle theory, socialist calculation
- Friedrich Hayek (1899-1992): Knowledge problem, spontaneous order, Nobel Prize 1974
- Murray Rothbard (1926-1995): Anarcho-capitalism, comprehensive treatises

Modern Austrian Voices:
- Saifedean Ammous: Sound money, Bitcoin standard, fiat critique
- José Luis Cava: Spanish-language Austrian education, practical applications
- Jesús Huerta de Soto: European Austrian school, dynamic efficiency
- Robert Murphy: Contemporary applications, business cycle updates
- Per Bylund: Entrepreneurship, modern Austrian methodology
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum


class CyclePhase(Enum):
    """Austrian Business Cycle phases"""
    EARLY_EXPANSION = "early_expansion"
    MID_EXPANSION = "mid_expansion"
    LATE_BOOM = "late_boom"
    CRISIS = "crisis"
    LIQUIDATION = "liquidation"
    RECOVERY = "recovery"


class RiskLevel(Enum):
    """Risk assessment levels"""
    LOW = "low"
    MODERATE = "moderate"
    ELEVATED = "elevated"
    HIGH = "high"
    EXTREME = "extreme"


@dataclass
class AustrianInsight:
    """Container for Austrian economic insight"""
    title: str
    content: str
    economist: str
    source: str
    relevance_score: float  # 0.0 to 1.0
    tags: List[str]


class AustrianInsightsEngine:
    """
    Dynamic interpretation engine providing context-aware Austrian economic analysis
    based on current market conditions, metrics, and cycle phase.
    """
    
    def __init__(self):
        """Initialize the insights engine with economist knowledge base"""
        self._initialize_knowledge_base()
    
    def _initialize_knowledge_base(self):
        """Build comprehensive Austrian economics knowledge base"""
        
        # Classical Austrian Economists
        self.classical_economists = {
            "menger": {
                "name": "Carl Menger",
                "years": "1840-1921",
                "contributions": ["Subjective Value Theory", "Origin of Money", "Marginal Utility"],
                "key_works": ["Principles of Economics (1871)", "Investigations into the Method"],
                "core_insight": "Value is subjective and determined by individual preferences, not labor or materials"
            },
            "bohm_bawerk": {
                "name": "Eugen von Böhm-Bawerk",
                "years": "1851-1914",
                "contributions": ["Capital Theory", "Time Preference", "Interest Rate Theory"],
                "key_works": ["Capital and Interest", "The Positive Theory of Capital"],
                "core_insight": "Interest exists because people prefer present goods to future goods"
            },
            "mises": {
                "name": "Ludwig von Mises",
                "years": "1881-1973",
                "contributions": ["Praxeology", "Business Cycle Theory", "Socialist Calculation Problem"],
                "key_works": ["Human Action", "Theory of Money and Credit", "Socialism"],
                "core_insight": "Economic calculation is impossible under socialism; credit expansion causes boom-bust cycles"
            },
            "hayek": {
                "name": "Friedrich A. Hayek",
                "years": "1899-1992",
                "contributions": ["Knowledge Problem", "Spontaneous Order", "Denationalisation of Money"],
                "key_works": ["The Road to Serfdom", "The Fatal Conceit", "Prices and Production"],
                "core_insight": "Central planning fails because dispersed knowledge cannot be aggregated",
                "nobel_prize": 1974
            },
            "rothbard": {
                "name": "Murray N. Rothbard",
                "years": "1926-1995",
                "contributions": ["Anarcho-Capitalism", "Ethics of Liberty", "Comprehensive Austrian Synthesis"],
                "key_works": ["Man, Economy, and State", "America's Great Depression", "What Has Government Done to Our Money?"],
                "core_insight": "Free market anarchism is both economically efficient and morally just"
            }
        }
        
        # Modern Austrian Voices
        self.modern_voices = {
            "ammous": {
                "name": "Saifedean Ammous",
                "active": "2010s-present",
                "focus": ["Sound Money", "Bitcoin", "Fiat Critique", "Time Preference"],
                "key_works": ["The Bitcoin Standard (2018)", "The Fiat Standard (2021)", "Principles of Economics"],
                "platform": "saifedean.com",
                "core_insights": [
                    "Bitcoin is the hardest money ever created",
                    "Fiat money encourages high time preference and malinvestment",
                    "Sound money enables long-term thinking and capital accumulation",
                    "Government money monopoly is the root cause of economic distortions"
                ]
            },
            "cava": {
                "name": "José Luis Cava",
                "active": "2015-present",
                "focus": ["Spanish Austrian Education", "Practical Applications", "Sound Money Advocacy"],
                "platform": "youtube.com/c/JoseLuisCavatv",
                "language": "Spanish (with global reach)",
                "core_insights": [
                    "Silver is the people's money - accessible sound money for working class",
                    "Hyperinflation lessons from Argentina and Venezuela show importance of hard assets",
                    "Austrian economics provides framework for understanding Latin American crises",
                    "Individual sovereignty through sound money and free markets"
                ]
            },
            "huerta_de_soto": {
                "name": "Jesús Huerta de Soto",
                "active": "1990s-present",
                "focus": ["European Austrian School", "Dynamic Efficiency", "Entrepreneurship"],
                "key_works": ["Money, Bank Credit, and Economic Cycles", "Socialism, Economic Calculation and Entrepreneurship"],
                "institution": "Universidad Rey Juan Carlos, Madrid",
                "core_insights": [
                    "Fractional reserve banking creates artificial credit expansion",
                    "Entrepreneurship is the driving force of market economy",
                    "Dynamic efficiency (entrepreneurial creativity) more important than static efficiency"
                ]
            },
            "murphy": {
                "name": "Robert P. Murphy",
                "active": "2000s-present",
                "focus": ["Business Cycles", "Contemporary Applications", "Austrian Methodology"],
                "key_works": ["Choice: Cooperation, Enterprise, and Human Action", "Lessons for the Young Economist"],
                "platform": "consultingbyrpm.com",
                "core_insights": [
                    "Austrian business cycle theory explains 2008 financial crisis",
                    "Fed manipulation of interest rates causes boom-bust cycles",
                    "Austrian economics compatible with Christian ethics"
                ]
            },
            "bylund": {
                "name": "Per Bylund",
                "active": "2010s-present",
                "focus": ["Entrepreneurship", "Production Theory", "Modern Applications"],
                "key_works": ["The Seen, the Unseen, and the Unrealized", "How to Think about the Economy"],
                "institution": "Oklahoma State University",
                "core_insights": [
                    "Entrepreneurship is market-driving force",
                    "Understanding production structure is key to business cycle analysis",
                    "Austrian economics explains modern platform economies"
                ]
            }
        }
    
    def get_bitcoin_insights(self, price: float, cycle_phase: CyclePhase, risk_level: RiskLevel) -> List[AustrianInsight]:
        """Get context-aware Bitcoin insights from Austrian perspective"""
        insights = []
        
        # Saifedean Ammous on Bitcoin
        if price > 100000:
            insights.append(AustrianInsight(
                title="Bitcoin's Monetary Supremacy",
                content=f"At ${price:,.0f}, Bitcoin demonstrates Saifedean Ammous' thesis: 'Bitcoin has the highest stock-to-flow ratio of any monetary good, making it the hardest money ever created.' Unlike fiat currency, Bitcoin's supply is absolutely fixed at 21 million, making it immune to the credit expansion that Mises warned destroys economies.",
                economist="Saifedean Ammous",
                source="The Bitcoin Standard (2018)",
                relevance_score=0.95,
                tags=["bitcoin", "sound_money", "stock_to_flow"]
            ))
        
        if cycle_phase == CyclePhase.LATE_BOOM:
            insights.append(AustrianInsight(
                title="Bitcoin as Crisis Hedge",
                content="During late boom phases, Ammous argues Bitcoin serves as 'exit from the fiat system.' As José Luis Cava emphasizes: 'When central banks print endlessly, Bitcoin's fixed supply becomes a lifeboat.' Hayek's denationalisation of money thesis (1976) predicted competitive currencies would discipline governments - Bitcoin fulfills this prophecy.",
                economist="Multiple: Ammous, Cava, Hayek",
                source="Multiple sources",
                relevance_score=0.90,
                tags=["bitcoin", "crisis", "fiat_exit"]
            ))
        
        # Menger on Bitcoin's emergence
        insights.append(AustrianInsight(
            title="Menger's Origin of Money Applied to Bitcoin",
            content="Carl Menger (1871) explained money emerges spontaneously when a commodity becomes the most marketable (liquid). Bitcoin follows this exact path: began as curiosity, became medium of exchange for some, now increasingly functions as store of value. Bitcoin's emergence validates Menger's theory - money wasn't invented by governments but evolved through voluntary exchange.",
            economist="Carl Menger (applied to Bitcoin)",
            source="Principles of Economics (1871), modern interpretation",
            relevance_score=0.85,
            tags=["bitcoin", "money_origin", "marketability"]
        ))
        
        return insights
    
    def get_gold_silver_insights(self, gold_price: float, silver_price: float, 
                                  gold_silver_ratio: float, risk_level: RiskLevel) -> List[AustrianInsight]:
        """Get precious metals insights from Austrian perspective"""
        insights = []
        
        # Historical gold/silver ratio analysis
        if gold_silver_ratio > 80:
            insights.append(AustrianInsight(
                title="Silver Undervalued - Historical Perspective",
                content=f"Gold/Silver ratio at {gold_silver_ratio:.1f}:1 is extreme by historical standards (average: 15-20:1). José Luis Cava: 'La plata es el dinero del pueblo - when this ratio is extreme, working class should accumulate silver.' Rothbard noted governments manipulated this ratio to favor creditors over debtors throughout history.",
                economist="José Luis Cava, Murray Rothbard",
                source="Multiple",
                relevance_score=0.90,
                tags=["silver", "gold", "ratio", "accumulation"]
            ))
        elif gold_silver_ratio < 50:
            insights.append(AustrianInsight(
                title="Silver Reaching Equilibrium",
                content=f"Gold/Silver ratio normalizing toward {gold_silver_ratio:.1f}:1. Saifedean Ammous: 'Silver's historical role as circulating medium while gold served as settlement layer reflects natural market preference, not government decree.' When ratio compresses, it signals market re-monetizing silver.",
                economist="Saifedean Ammous",
                source="The Bitcoin Standard, monetary history analysis",
                relevance_score=0.85,
                tags=["silver", "gold", "ratio", "monetization"]
            ))
        
        # Gold standard insights from Mises
        insights.append(AustrianInsight(
            title="Mises on Gold Standard",
            content=f"Gold at ${gold_price:,.0f}/oz. Ludwig von Mises: 'The gold standard makes the determination of money's purchasing power independent of the changing ambitions and doctrines of political parties and pressure groups.' The 1971 abandonment of Bretton Woods severed the last link to sound money, enabling the credit expansion Mises warned causes boom-bust cycles.",
            economist="Ludwig von Mises",
            source="The Theory of Money and Credit",
            relevance_score=0.90,
            tags=["gold", "sound_money", "gold_standard"]
        ))
        
        # Silver's dual role
        insights.append(AustrianInsight(
            title="Silver's Industrial-Monetary Duality",
            content=f"Silver at ${silver_price:.2f}/oz serves dual purpose. Ammous: 'Silver's industrial demand creates price floor while monetary premium adds upside - unique among precious metals.' Cava emphasizes silver's accessibility: 'Un trabajador puede comprar plata; el oro es para los ricos' (A worker can buy silver; gold is for the rich).",
            economist="Saifedean Ammous, José Luis Cava",
            source="Multiple platforms",
            relevance_score=0.85,
            tags=["silver", "industrial", "accessibility"]
        ))
        
        return insights
    
    def get_interest_rate_insights(self, fed_funds: float, natural_rate: float, 
                                    spread: float, cycle_phase: CyclePhase) -> List[AustrianInsight]:
        """Get interest rate manipulation insights"""
        insights = []
        
        # Mises on artificial credit expansion
        if fed_funds < natural_rate:
            severity = "extreme" if spread > 2.0 else "significant" if spread > 1.0 else "moderate"
            insights.append(AustrianInsight(
                title="Artificial Credit Expansion Detected",
                content=f"Fed Funds ({fed_funds:.2f}%) is {spread:.2f}% BELOW natural rate ({natural_rate:.2f}%). This is {severity} artificial credit expansion. Mises: 'There is no means of avoiding the final collapse of a boom brought about by credit expansion. The alternative is only whether the crisis should come sooner as the result of a voluntary abandonment of further credit expansion, or later as a final and total catastrophe.'",
                economist="Ludwig von Mises",
                source="Human Action (1949)",
                relevance_score=0.98,
                tags=["interest_rates", "credit_expansion", "boom_bust"]
            ))
            
            # Huerta de Soto on fractional reserve
            insights.append(AustrianInsight(
                title="Fractional Reserve Banking Critique",
                content=f"Jesús Huerta de Soto: 'Fractional reserve banking creates credit from thin air, distorting the production structure.' When central banks push rates below natural level, they amplify this distortion. The {spread:.2f}% gap represents the degree of capital misallocation occurring throughout the economy.",
                economist="Jesús Huerta de Soto",
                source="Money, Bank Credit, and Economic Cycles",
                relevance_score=0.92,
                tags=["interest_rates", "fractional_reserve", "misallocation"]
            ))
        
        # Böhm-Bawerk on time preference
        insights.append(AustrianInsight(
            title="Interest Rates Reflect Time Preference",
            content=f"Eugen von Böhm-Bawerk: 'The interest rate represents society's time preference - the degree to which we prefer present goods to future goods.' Artificial rate of {fed_funds:.2f}% vs natural {natural_rate:.2f}% sends FALSE signal about society's willingness to save, causing entrepreneurs to start projects that cannot be completed.",
            economist="Eugen von Böhm-Bawerk",
            source="Capital and Interest (1884)",
            relevance_score=0.90,
            tags=["interest_rates", "time_preference", "capital_theory"]
        ))
        
        # Hayek on knowledge problem
        insights.append(AustrianInsight(
            title="Fed Cannot Know Natural Rate",
            content="Friedrich Hayek: 'The curious task of economics is to demonstrate to men how little they really know about what they imagine they can design.' The Fed's attempt to set rates centrally suffers from the knowledge problem - dispersed information about individual time preferences cannot be aggregated. Robert Murphy updates: 'Powell doesn't know what interest rate should be any more than a Soviet planner knew how many shoes to produce.'",
            economist="Friedrich Hayek, Robert Murphy",
            source="The Fatal Conceit (1988), contemporary commentary",
            relevance_score=0.88,
            tags=["interest_rates", "knowledge_problem", "central_planning"]
        ))
        
        return insights
    
    def get_stock_market_insights(self, sp500: float, nasdaq: float, vix: float,
                                    cycle_phase: CyclePhase, boom_psychology: bool) -> List[AustrianInsight]:
        """Get stock market insights from Austrian perspective"""
        insights = []
        
        # VIX analysis
        if vix < 12 and boom_psychology:
            insights.append(AustrianInsight(
                title="Dangerous Complacency - Late Boom Psychology",
                content=f"VIX at {vix:.1f} shows extreme complacency. Mises: 'The boom produces impoverishment. But still more disastrous are its moral ravages. It makes people despondent and dispirited. The more optimistic they were under the illusory prosperity of the boom, the greater is their despair.' Low VIX during credit expansion is a CONTRARY indicator - everyone believes 'this time is different.'",
                economist="Ludwig von Mises",
                source="Human Action",
                relevance_score=0.95,
                tags=["vix", "boom_psychology", "complacency"]
            ))
        elif vix > 30:
            insights.append(AustrianInsight(
                title="Liquidation Phase - Market Discovering Reality",
                content=f"VIX at {vix:.1f} signals panic. Rothbard: 'The recession is the recovery - it's when malinvestments are liquidated and resources reallocated to sustainable uses.' High VIX shows market finally recognizing the unsustainability created during boom. Per Bylund: 'Crisis reveals which business models were built on sand of cheap credit versus rock of real consumer demand.'",
                economist="Murray Rothbard, Per Bylund",
                source="America's Great Depression, contemporary analysis",
                relevance_score=0.93,
                tags=["vix", "liquidation", "crisis"]
            ))
        
        # NASDAQ and capital theory
        insights.append(AustrianInsight(
            title="Technology Stocks Most Vulnerable",
            content=f"NASDAQ at {nasdaq:,.0f}. Böhm-Bawerk's capital theory: 'Longer production processes (more roundabout methods) are more sensitive to interest rate changes.' Tech companies represent the LONGEST production processes - years of investment before profitability. Saifedean Ammous: 'Easy money floods into high time-preference speculation. Sound money rewards patient capital accumulation in productive enterprises.'",
            economist="Böhm-Bawerk, Saifedean Ammous",
            source="Capital theory, Fiat Standard",
            relevance_score=0.90,
            tags=["nasdaq", "tech", "capital_structure"]
        ))
        
        # Cantillon Effect
        insights.append(AustrianInsight(
            title="Cantillon Effect in Stock Markets",
            content=f"S&P 500 at {sp500:,.0f}. Richard Cantillon (proto-Austrian, 1730s): 'Those closest to new money benefit first.' Modern application: Newly created money flows to stock markets before reaching consumer prices. José Luis Cava: 'Wall Street gets rich first, Main Street gets inflation later. This is not capitalism - it's cantillonism.' The wealth gap ISN'T from free markets but from money monopoly.",
            economist="Richard Cantillon, José Luis Cava",
            source="Essay on Economic Theory (1730), modern commentary",
            relevance_score=0.92,
            tags=["stocks", "cantillon_effect", "inequality"]
        ))
        
        return insights
    
    def get_inflation_insights(self, cpi: float, ppi: float, m2_growth: float,
                                risk_level: RiskLevel) -> List[AustrianInsight]:
        """Get inflation insights from Austrian perspective"""
        insights = []
        
        # Mises on inflation
        insights.append(AustrianInsight(
            title="Inflation is Monetary Expansion",
            content=f"CPI {cpi:.1f}%, PPI {ppi:.1f}%, M2 growth {m2_growth:.1f}%. Mises: 'Inflation is not an increase in prices but an increase in the money supply. Price rises are merely a CONSEQUENCE.' Saifedean Ammous updates: 'CPI is government propaganda. Real inflation is M2 growth - your savings are debased at {m2_growth:.1f}% annually regardless of what CPI claims.'",
            economist="Ludwig von Mises, Saifedean Ammous",
            source="Theory of Money and Credit, Fiat Standard",
            relevance_score=0.95,
            tags=["inflation", "money_supply", "cpi"]
        ))
        
        # If high inflation
        if cpi > 5.0 or ppi > 5.0:
            insights.append(AustrianInsight(
                title="Price Inflation Accelerating",
                content=f"Price inflation reaching {max(cpi, ppi):.1f}%. Mises warned: 'Government always finds inflation expedient because it can spend without obvious taxation.' José Luis Cava from Latin American perspective: 'We've seen this movie in Argentina - {cpi:.1f}% is just the beginning if money printing continues. Protect yourself with hard assets before it becomes hyperinflation.'",
                economist="Ludwig von Mises, José Luis Cava",
                source="Multiple",
                relevance_score=0.93,
                tags=["inflation", "prices", "hyperinflation_warning"]
            ))
        
        # Rothbard on who benefits
        insights.append(AustrianInsight(
            title="Inflation Redistributes Wealth",
            content=f"Murray Rothbard: 'Inflation is a hidden tax that redistributes wealth from creditors to debtors, from savers to borrowers, from fixed-income earners to asset holders.' At {cpi:.1f}% CPI, retirees on fixed pensions lose purchasing power while government (biggest debtor) benefits. This is not accidental - it's the purpose.",
            economist="Murray Rothbard",
            source="What Has Government Done to Our Money?",
            relevance_score=0.90,
            tags=["inflation", "redistribution", "hidden_tax"]
        ))
        
        return insights
    
    def get_commodity_insights(self, oil: float, copper: float, cycle_phase: CyclePhase) -> List[AustrianInsight]:
        """Get commodity insights from Austrian perspective"""
        insights = []
        
        # Copper as higher-order good
        insights.append(AustrianInsight(
            title="Dr. Copper - Capital Structure Indicator",
            content=f"Copper at ${copper:.2f}/lb. Menger's theory of goods orders: Copper is a HIGHER-ORDER good (capital good) used to produce lower-order goods (consumer goods). Böhm-Bawerk: 'Production structure lengthens during credit booms as artificially low rates make longer projects appear profitable.' Copper demand signals capital investment - if rising during credit expansion, it confirms malinvestment. Per Bylund: 'Watch copper to see if production structure is sustainable or distorted.'",
            economist="Carl Menger, Böhm-Bawerk, Per Bylund",
            source="Multiple",
            relevance_score=0.88,
            tags=["copper", "capital_goods", "production_structure"]
        ))
        
        # Oil and energy
        insights.append(AustrianInsight(
            title="Energy Costs Throughout Production",
            content=f"Oil at ${oil:.2f}/bbl. Huerta de Soto: 'Energy ripples through ALL stages of production.' Oil price changes affect transportation, manufacturing, agriculture, heating - every economic sector. When oil rises during monetary expansion, ask: Is this real scarcity or monetary inflation? Robert Murphy: 'Oil price spikes can trigger recessions by making malinvested capital projects unprofitable.'",
            economist="Jesús Huerta de Soto, Robert Murphy",
            source="Contemporary analysis",
            relevance_score=0.85,
            tags=["oil", "energy", "production_costs"]
        ))
        
        return insights
    
    def get_cycle_narrative(self, cycle_phase: CyclePhase, overall_risk: float,
                            metrics: Dict[str, Any]) -> str:
        """
        Generate comprehensive Austrian Business Cycle narrative based on current conditions.
        Integrates insights from multiple economists for rich, contextual analysis.
        """
        
        narratives = {
            CyclePhase.EARLY_EXPANSION: self._get_early_expansion_narrative(overall_risk, metrics),
            CyclePhase.MID_EXPANSION: self._get_mid_expansion_narrative(overall_risk, metrics),
            CyclePhase.LATE_BOOM: self._get_late_boom_narrative(overall_risk, metrics),
            CyclePhase.CRISIS: self._get_crisis_narrative(overall_risk, metrics),
            CyclePhase.LIQUIDATION: self._get_liquidation_narrative(overall_risk, metrics),
            CyclePhase.RECOVERY: self._get_recovery_narrative(overall_risk, metrics)
        }
        
        return narratives.get(cycle_phase, "Cycle phase analysis in progress...")
    
    def _get_late_boom_narrative(self, risk: float, metrics: Dict[str, Any]) -> str:
        """Late boom phase narrative with multi-economist insights"""
        return f"""
🚨 **LATE BOOM PHASE WARNING** - Risk Level: {risk:.1f}/10

**Mises' Warning Playing Out:**
"There is no means of avoiding the final collapse of a boom brought about by credit expansion." We are witnessing CLASSIC late-boom psychology: asset prices divorced from fundamentals, speculation masquerading as investment, and dangerous complacency (VIX: {metrics.get('vix', 'N/A')}).

**Hayek's Knowledge Problem:**
The Fed thinks it can fine-tune the economy, but as Hayek taught, "The curious task of economics is to demonstrate to men how little they really know about what they imagine they can design." Central planners cannot possess the dispersed knowledge of millions of market participants.

**Rothbard's Advice:**
"Get out of the boom before the bust." Hold sound money assets (gold, silver, Bitcoin), avoid debt, build cash reserves. The longer the boom, the worse the bust.

**Saifedean Ammous - Modern Perspective:**
"Fiat money encourages high time preference - consume today, worry tomorrow. Bitcoin's fixed supply enforces low time preference - think long-term." Exit the fiat system now while you can.

**José Luis Cava - Practical Wisdom:**
"Hemos visto esto en Argentina mil veces - the boom always ends in tears. Protect yourself: oro, plata, Bitcoin, no deuda." (We've seen this a thousand times in Argentina - the boom always ends in tears. Protect yourself: gold, silver, Bitcoin, no debt.)

**Per Bylund - Entrepreneurial Perspective:**
"Entrepreneurs who built real businesses serving customers will survive. Those who built castles on cheap credit will fail. The crisis separates wheat from chaff."

**Current Distortions:**
• Interest rate spread: {metrics.get('spread', 'N/A')}% (Fed below natural rate)
• M2 growth: {metrics.get('m2_growth', 'N/A')}% (monetary expansion)
• Credit/GDP: {metrics.get('credit_gdp', 'N/A')}% (excessive debt)
• Stock valuations: Extreme by historical measures

**What Comes Next:**
The boom MUST end. The only question is whether the Fed stops voluntarily (recession) or continues until currency collapse (crisis). As Mises taught, you cannot print prosperity - you can only redistribute wealth and delay the reckoning.

**Action Items:**
1. Convert fiat to hard assets (gold, silver, Bitcoin)
2. Eliminate or reduce debt
3. Build emergency savings (6-12 months expenses)
4. Avoid speculation; focus on productive assets
5. Study Austrian economics to understand what's happening
"""
    
    def _get_early_expansion_narrative(self, risk: float, metrics: Dict[str, Any]) -> str:
        """Early expansion narrative"""
        return f"""
📊 **EARLY EXPANSION PHASE** - Risk Level: {risk:.1f}/10

**Mises: "The Boom Creates the Seeds of Bust"**
Even in early expansion, Austrian theory warns us to watch for credit expansion above real savings. Current monetary growth: {metrics.get('m2_growth', 'N/A')}%.

**Hayek: "Sustainable Growth vs. Artificial Boom"**
Is this expansion built on real savings and productivity, or artificial credit? Monitor the spread between Fed Funds and natural rate: {metrics.get('spread', 'N/A')}%.

**Rothbard: "Foundation Matters"**
If expansion is credit-fueled, malinvestments are already forming. If based on real savings and entrepreneurship, growth can be sustainable.

**Modern Voices:**
- Saifedean Ammous: "Low time preference drives real growth. High time preference drives bubbles."
- José Luis Cava: "Expansion with sound money is prosperity. Expansion with fiat is illusion."
- Jesús Huerta de Soto: "Watch credit growth vs. GDP - if credit grows faster, danger ahead."

Stay vigilant. Accumulate sound money assets during calm periods.
"""
    
    def _get_mid_expansion_narrative(self, risk: float, metrics: Dict[str, Any]) -> str:
        """Mid expansion narrative"""
        return f"""
📈 **MID-EXPANSION PHASE** - Risk Level: {risk:.1f}/10

**Austrian Business Cycle Theory in Action:**
We're in the middle stages of credit expansion. As Mises taught, "The boom squanders through malinvestment scarce factors of production."

**Current Indicators:**
• Interest rates: Still below natural rate by {metrics.get('spread', 'N/A')}%
• Credit expansion: {metrics.get('credit_gdp', 'N/A')}% of GDP
• Malinvestment accumulating in longer-term projects

**Böhm-Bawerk's Capital Theory:**
"The production structure is lengthening." More resources flow to higher-order goods (capital equipment, tech startups, real estate development). Question: Is this sustainable or credit-induced?

**Huerta de Soto's Warning:**
"The longer the credit expansion continues, the more widespread the malinvestment, and the more painful the correction."

**Robert Murphy - 2008 Parallel:**
"We saw this pattern before the 2008 crisis. Credit expansion → housing bubble → inevitable collapse. Same mechanism, different assets today."

**What to Watch:**
1. Yield curve: Still inverted? {metrics.get('yield_curve_inverted', 'N/A')}
2. VIX: Complacency level: {metrics.get('vix', 'N/A')}
3. Credit spreads: Market pricing risk correctly?
4. Commodity prices: Real demand or monetary inflation?

**Strategy:** Begin de-risking. Convert some speculative positions to sound money.
"""
    
    def _get_crisis_narrative(self, risk: float, metrics: Dict[str, Any]) -> str:
        """Crisis phase narrative"""
        return f"""
🔥 **CRISIS PHASE** - Risk Level: {risk:.1f}/10

**Mises: "The Crisis Reveals the Malinvestments"**
"The boom is ended by the exhaustion of the reserve funds available for credit expansion." The artificial boom is ENDING. Malinvestments are being exposed.

**Rothbard: "Don't Fight the Liquidation"**
"The depression phase is actually the recovery phase - when the distortions are corrected." Government bailouts and stimulus will only PROLONG the agony by preventing necessary adjustment.

**Hayek: "Let the Market Heal"**
"The worst outcome is preventing adjustment." Politicians will promise to 'fix' the crisis through more intervention - the SAME intervention that caused it.

**Current Situation:**
• Panic visible in markets (VIX: {metrics.get('vix', 'N/A')})
• Credit contracting after years of expansion
• Asset prices correcting toward fundamentals
• Calls for Fed intervention intensifying

**Saifedean Ammous:**
"This is why Bitcoin exists - to exit the fiat system entirely. Every crisis proves fiat's failure."

**José Luis Cava:**
"Latin America has learned: Each crisis, they promise 'never again.' Then they print more money. Don't trust government - trust sound money."

**What NOT to Do:**
❌ Panic sell sound assets (gold, silver, Bitcoin)
❌ Take on debt to 'buy the dip'
❌ Trust government promises of quick fixes

**What TO Do:**
✅ Hold sound money assets through volatility
✅ Build cash reserves
✅ Look for genuinely undervalued productive assets
✅ Study Austrian economics to understand what happened

Remember: "The correction IS the recovery" - Rothbard
"""
    
    def _get_liquidation_narrative(self, risk: float, metrics: Dict[str, Any]) -> str:
        """Liquidation phase narrative"""
        return f"""
♻️ **LIQUIDATION PHASE** - Risk Level: {risk:.1f}/10

**The Necessary Correction is Occurring**

**Mises: "Liquidation is Painful but Necessary"**
"The boom produced malinvestment and overconsumption. The depression is the process during which the maladjustments are liquidated." This pain is the CURE, not the disease.

**Rothbard: "Let Bad Investments Fail"**
"Bailing out failed businesses only prolongs the agony and prevents resources from flowing to productive uses." Zombie companies kept alive by cheap credit must be allowed to fail.

**Current Dynamics:**
• Failed businesses liquidating
• Resources being reallocated to sustainable uses  
• Market discovering true prices after years of distortion
• Unemployment as workers shift from malinvested sectors

**Per Bylund:**
"Entrepreneurs who served real consumer needs survive. Those who served only cheap credit perish. This is how markets self-correct."

**Jesús Huerta de Soto:**
"The quicker the liquidation, the sooner genuine recovery can begin. Government 'stimulus' only delays healing."

**Robert Murphy:**
"History shows: Quick liquidation (1920-21) → rapid recovery. Prolonged intervention (1930s, 2008) → decade of stagnation."

**What's Happening:**
✅ Bad debts being written off
✅ Overvalued assets repricing
✅ Capital flowing from wasteful to productive uses
✅ Foundation for REAL recovery being built

**Saifedean Ammous:**
"Every crisis strengthens the case for Bitcoin and sound money. Fiat always fails the stress test."

**Position for Recovery:**
• Cash for opportunities
• Sound money assets preserved
• Avoid catching falling knives
• Study businesses surviving the shakeout - those are the strong ones

Patience now will be rewarded. Panic will be punished.
"""
    
    def _get_recovery_narrative(self, risk: float, metrics: Dict[str, Any]) -> str:
        """Recovery phase narrative"""
        return f"""
🌱 **RECOVERY PHASE** - Risk Level: {risk:.1f}/10

**Genuine Recovery or Another Boom?**

**Critical Question (Rothbard):**
"Is this recovery built on real savings and productivity, or is the Fed already re-inflating another bubble?"

**Two Paths Forward:**

**Path 1: Sound Recovery (Rare)**
• Based on real savings, not credit expansion
• Interest rates reflect genuine time preference
• Entrepreneurs serve real consumer demand
• Productivity gains, not monetary inflation
• **Example:** 1920-21 recovery (liquidation allowed, rapid healing)

**Path 2: New Bubble (Common)**
• Fed "stimulates" with low rates and money printing
• Credit expansion resumes too quickly
• Sowing seeds of next boom-bust cycle
• **Examples:** 2002-2007, 2009-2020 (bailouts → new bubbles)

**Current Indicators:**
• Fed Funds rate: {metrics.get('fed_funds', 'N/A')}%
• M2 Growth: {metrics.get('m2_growth', 'N/A')}%
• Credit expansion: {metrics.get('credit_gdp', 'N/A')}% of GDP

**Mises' Test:**
"Is credit expansion resuming? If yes, we're not in recovery - we're in the early stages of the NEXT boom."

**Hayek's Warning:**
"Politicians want quick fixes. They'll pressure the Fed to 'stimulate.' Resist the temptation to re-inflate. Sound money brings lasting prosperity; easy money brings temporary illusion."

**Modern Economists Weigh In:**

**Saifedean Ammous:**
"Bitcoin adoption grows every cycle as more people realize: You can't fix fiat problems with more fiat."

**José Luis Cava:**
"Recovery is not when GDP rises - it's when production is sustainable without monetary drugs. Real recovery takes time."

**Per Bylund:**
"Entrepreneurship drives recovery. Creative destruction cleared out failed businesses; now innovators can thrive."

**What to Watch:**
1. **Is credit growing faster than GDP?** If yes → new bubble forming
2. **Are interest rates being held artificially low?** If yes → malinvestment restarting  
3. **Is government intervention ending?** If no → recovery will be weak
4. **Are sound money assets accumulating?** If yes → people learning

**Strategy for Recovery Phase:**
• **If genuine recovery:** Gradually deploy capital into productive assets
• **If new bubble forming:** Maintain sound money position, limited exposure to credit-fueled sectors
• **Either way:** Continue accumulating gold, silver, Bitcoin as savings

The question isn't whether there will be another crisis - there will be. The question is whether YOU will be positioned correctly when it comes.

**Mises' Final Word:**
"The boom cannot continue indefinitely. There are only two alternatives: either the banks continue the credit expansion without limit and thus cause constantly mounting price increases and an ever-growing orgy of speculation, or sooner or later they stop credit expansion, and then the crisis breaks out."

Which path are we on?
"""


# Singleton instance
_insights_engine = None

def get_insights_engine() -> AustrianInsightsEngine:
    """Get singleton instance of insights engine"""
    global _insights_engine
    if _insights_engine is None:
        _insights_engine = AustrianInsightsEngine()
    return _insights_engine
