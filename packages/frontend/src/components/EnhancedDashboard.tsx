/**
 * Enhanced Austrian Economics Dashboard
 * Comprehensive implementation with all discovered features:
 * - Real-time blockchain metrics (hashrate, block height, difficulty, mempool)
 * - Interactive expandable sections
 * - Educational tooltips and modals
 * - Asset correlations (Gold/BTC, Dow/Gold, S&P500/Gold)
 * - Austrian wisdom quotes rotation
 * - Risk-based dynamic content
 * - Modern animations and UI effects
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  useAnalysis,
  useThreePillars,
  useMarketData,
  useBitcoinPrice,
  useSystemStatus,
  useCycleAnalysis,
  useAustrianInsights,
} from '@/hooks/useApi';
import { formatCurrency, getRiskColor } from '@/lib/utils';
import { CypherpunkHallOfFame } from './CypherpunkHallOfFame';
import { templeTheme } from '../styles/templeTheme';
import {
  CreditGrowthChart,
  MalinvestmentRadarChart,
  AustrianScoreGauge,
  ThreePillarsHealth,
  AssetCorrelationMatrix,
} from './AustrianCharts';
import { RiskMetricsDashboard } from './RiskMetricsDashboard';
import { CycleTimeline } from './CycleTimeline';
import {
  ChartSkeleton,
  GaugeSkeleton,
  RadarSkeleton,
  MatrixSkeleton,
  EmptyState,
} from './LoadingStates';

// Austrian wisdom quotes
const AUSTRIAN_QUOTES = [
  {
    text: "The most important thing to remember is that inflation is not an act of God, that inflation is not a catastrophe of the elements or a disease that comes like the plague. Inflation is a policy.",
    author: "Ludwig von Mises"
  },
  {
    text: "The boom produces impoverishment. But still more disastrous are its moral ravages. It makes people despondent and dispirited.",
    author: "Ludwig von Mises"
  },
  {
    text: "Gold is money. Everything else is credit.",
    author: "J.P. Morgan"
  },
  {
    text: "The curious task of economics is to demonstrate to men how little they really know about what they imagine they can design.",
    author: "Friedrich Hayek"
  },
  {
    text: "The avoidance of taxes is the only intellectual pursuit that carries any reward.",
    author: "John Maynard Keynes (Ironically)"
  },
  {
    text: "Bitcoin is a technological tour de force.",
    author: "Bill Gates"
  }
];

// Helper function to generate Austrian narrative based on cycle data
function getAustrianNarrative(cyclePhase: string, riskLevel: number): string {
  if (riskLevel >= 7) {
    return `LATE BOOM PHASE WARNING: The economy is experiencing severe distortions from prolonged artificial credit expansion. Interest rates have been held below the natural rate for too long, causing massive malinvestment in the production structure. According to Austrian Business Cycle Theory, this boom phase must eventually end in a bust as the unsustainable investments are revealed and liquidated. Hold sound money assets and prepare for economic restructuring.`;
  } else if (riskLevel >= 5) {
    return `BOOM PHASE DETECTED: Artificial credit expansion is distorting the structure of production. Resources are being drawn into longer-term, more capital-intensive projects that may not be sustainable. The Austrian framework warns that this boom, fueled by money creation rather than real savings, will eventually reverse. Monitor for signs of credit tightening or malinvestment revelation.`;
  } else if (cyclePhase === 'early-boom') {
    return `EARLY BOOM DEVELOPING: Central bank policy is beginning to distort market signals. Interest rates below the natural rate are encouraging investment in projects that wouldn't be viable at market-determined rates. Austrian theory predicts this will lead to a misallocation of capital across the economy's time structure of production. Vigilance is warranted as the boom phase typically accelerates.`;
  } else {
    return `MONITORING PHASE: Current conditions show manageable levels of credit market distortion. The Austrian framework emphasizes watching for artificially low interest rates, rapid credit expansion, and lengthening of the production structure as early warning signs of an unsustainable boom. Maintain sound money principles and avoid reliance on continued credit expansion.`;
  }
}

interface BlockchainStats {
  block_height: number;
  hashrate: number;
  difficulty: number;
  mempool: {
    count: number;
    vsize: number;
    total_fee: number;
  };
  fees: {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
  };
  network_health: {
    security_score: number;
    decentralization_score: number;
  };
  timestamp: string;
  status: string;
}

interface EducationalModal {
  title: string;
  content: string;
  sources?: Array<{name: string; url: string; description: string}>;
  show: boolean;
}

export function EnhancedDashboard() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentQuote, setCurrentQuote] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [stockMarkets, setStockMarkets] = useState<any | null>(null);
  const [showAustrianCourse, setShowAustrianCourse] = useState(false);
  const [educationalModal, setEducationalModal] = useState<EducationalModal>({
    title: '',
    content: '',
    sources: [],
    show: false
  });

  // Fetch all data
  const { data: analysisData, isLoading: analysisLoading, error: analysisError } = useAnalysis();
  const { data: pillarsData, isLoading: pillarsLoading } = useThreePillars();
  const { data: marketData, isLoading: marketLoading } = useMarketData();
  const { data: btcPrice, isLoading: btcLoading } = useBitcoinPrice();
  const { data: statusData } = useSystemStatus();
  const { data: cycleData } = useCycleAnalysis();
  const { data: insightsData, isLoading: insightsLoading } = useAustrianInsights();
  const [explanationsCatalog, setExplanationsCatalog] = useState<any | null>(null);
  const [explanationsLoading, setExplanationsLoading] = useState<boolean>(false);

    const [thoughtLeaders, setThoughtLeaders] = useState<any | null>(null);
    const [showThoughtLeadersModal, setShowThoughtLeadersModal] = useState<boolean>(false);

  // Fetch blockchain stats
  useEffect(() => {
    const fetchBlockchainStats = async () => {
      try {
        const response = await fetch('/api/blockchain-stats');
        if (response.ok) {
          const data = await response.json();
          setBlockchainStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch blockchain stats:', error);
      }
    };

    fetchBlockchainStats();
    const interval = setInterval(fetchBlockchainStats, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch stock market data
  useEffect(() => {
    const fetchStockMarkets = async () => {
      try {
        const response = await fetch('/api/stock-markets');
        if (response.ok) {
          const data = await response.json();
          setStockMarkets(data);
        }
      } catch (error) {
        console.error('Failed to fetch stock markets:', error);
      }
    };

    fetchStockMarkets();
    const interval = setInterval(fetchStockMarkets, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch explanations/sources catalog for tooltips and source modal
  useEffect(() => {
    const fetchExplanations = async () => {
      try {
        setExplanationsLoading(true);
        const res = await fetch('/api/explanations');
        if (res.ok) {
          const json = await res.json();
          setExplanationsCatalog(json?.explanations || {});
        }
      } catch (e) {
        console.error('Failed to load explanations catalog', e);
      } finally {
        setExplanationsLoading(false);
      }
    };
    fetchExplanations();
  }, []);

    // Fetch thought leaders catalog
    useEffect(() => {
      const fetchThoughtLeaders = async () => {
        try {
          const res = await fetch('/api/thought-leaders');
          if (res.ok) {
            const json = await res.json();
            setThoughtLeaders(json?.thought_leaders || {});
          }
        } catch (e) {
          console.error('Failed to load thought leaders', e);
        }
      };
      fetchThoughtLeaders();
    }, []);

  // Rotate quotes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % AUSTRIAN_QUOTES.length);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update timestamp
  useEffect(() => {
    setLastUpdate(new Date());
  }, [analysisData, marketData, btcPrice, blockchainStats]);

  const analysis = analysisData?.analysis;
  const market = marketData?.market_data;
  const pillars = pillarsData;

  // Calculate correlations
  const btcGoldRatio = btcPrice?.price && market?.commodities?.gold 
    ? (btcPrice.price / market.commodities.gold).toFixed(2) 
    : '0';

  // Toggle expandable sections
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Show educational modal
  const showEducation = (
    title: string, 
    content: string, 
    sources?: Array<{name: string; url: string; description: string}>
  ) => {
    setEducationalModal({ title, content, sources: sources || [], show: true });
  };

  // Open comprehensive Sources modal compiled from explanations catalog
  const openSourcesModal = () => {
    const sourceList: Array<{name: string; url: string; description: string}> = [];
    if (explanationsCatalog) {
      const seen = new Set<string>();
      Object.values(explanationsCatalog).forEach((entry: any) => {
        (entry.sources || []).forEach((s: any) => {
          const key = `${s.title}|${s.url}`;
          if (!seen.has(key)) {
            seen.add(key);
            sourceList.push({
              name: `${s.title} (${s.year || ''})`.trim(),
              url: s.url,
              description: entry.label || ''
            });
          }
        });
      });
    }
    const intro = `Explore the primary sources behind every metric and interpretation. These links open official data (FRED, BIS) and canonical Austrian economics references (Mises Institute).`;
    showEducation('Sources & Explanations', intro, sourceList);
  };

  // Show explanation modal for a specific metric by key
  const showExplanationForKey = (key: string) => {
    if (!explanationsCatalog || !explanationsCatalog[key]) {
      showEducation('No Explanation Available', `No explanation found for metric: ${key}`);
      return;
    }
    const entry = explanationsCatalog[key];
    const sourceList = (entry.sources || []).map((s: any) => ({
      name: `${s.title} (${s.year || ''})`.trim(),
      url: s.url,
      description: entry.label || ''
    }));
    showEducation(entry.label || key, entry.explanation || 'No explanation available.', sourceList);
  };

  // InfoBadge component: small clickable ⓘ icon that opens explanation modal
  const InfoBadge = ({ explanationKey, className = '' }: { explanationKey: string; className?: string }) => {
    if (!explanationsCatalog || !explanationsCatalog[explanationKey]) {
      return null; // Don't show badge if no explanation available
    }
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          showExplanationForKey(explanationKey);
        }}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-blue-100 transition-all duration-200 transform hover:scale-110 ml-1.5 ${className}`}
        title="Click for explanation and sources"
        aria-label="View explanation"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
    );
  };

  // Loading state
  if (analysisLoading || pillarsLoading || marketLoading || btcLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-20 w-20 border-b-4 border-orange-500 mb-4"></div>
          <p className="text-2xl text-slate-200 animate-pulse">Loading Austrian Analysis...</p>
          <p className="text-sm text-slate-400 mt-2">Connecting to economic data feeds</p>
        </div>
      </div>
    );
  }

  // Error state
  if (analysisError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 animate-pulse">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-slate-300 mb-4">
            Cannot connect to the Austrian Economics backend.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Make sure your Flask server is running on <code className="bg-slate-800 px-2 py-1 rounded">http://localhost:5002</code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const austrianScore = analysis?.austrian_score || market?.austrian_score || 0;
  const cyclePhase = analysis?.cycle_position || cycleData?.cycle_phase || 'Unknown';
  const overallRisk = analysis?.risk_levels?.overall || cycleData?.overall_risk || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header - Temple Entrance */}
      <header 
        className="border-b-2 backdrop-blur-md sticky top-0 z-50 shadow-2xl"
        style={{
          borderBottomColor: templeTheme.colors.bitcoinOrange,
          background: `linear-gradient(135deg, ${templeTheme.colors.cypherpunkBlack} 0%, ${templeTheme.colors.cypherpunkDark} 50%, ${templeTheme.colors.cypherpunkBlack} 100%)`,
          boxShadow: `0 10px 30px rgba(247, 147, 26, 0.15)` // Bitcoin orange glow
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Bitcoin Symbol with Pulse */}
              <motion.div 
                className="text-5xl"
                animate={{
                  scale: [1, 1.05, 1],
                  filter: [
                    'drop-shadow(0 0 8px rgba(247, 147, 26, 0.5))',
                    'drop-shadow(0 0 16px rgba(247, 147, 26, 0.8))',
                    'drop-shadow(0 0 8px rgba(247, 147, 26, 0.5))'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ₿
              </motion.div>
              <div>
                <h1 
                  className="text-3xl md:text-4xl font-bold mb-1"
                  style={{
                    fontFamily: templeTheme.typography.fonts.heading,
                    background: templeTheme.gradients.bitcoinSunset,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3))'
                  }}
                >
                  Austrian Business Cycle Monitor
                </h1>
                <p 
                  className="text-sm mt-1 font-semibold flex items-center gap-2"
                  style={{ 
                    color: templeTheme.colors.austrianGold,
                    fontFamily: templeTheme.typography.fonts.body
                  }}
                >
                  <span className="flex items-center gap-1">
                    🏛️ <span>Sound Money</span>
                  </span>
                  <span style={{ color: templeTheme.colors.bitcoinOrange }}>•</span>
                  <span className="flex items-center gap-1">
                    ₿ <span>In Satoshi We Trust</span>
                  </span>
                  <span style={{ color: templeTheme.colors.bitcoinOrange }}>•</span>
                  <span className="flex items-center gap-1">
                    🔐 <span>Cypherpunk Values</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={openSourcesModal}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/30 border border-yellow-400/40"
                title={explanationsLoading ? 'Loading sources…' : 'View explanations and sources'}
                disabled={explanationsLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 6a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
                <span className="hidden sm:inline">Sources</span>
              </button>
                <button
                  onClick={() => setShowThoughtLeadersModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/30"
                  title="Learn from Austrian economists and Bitcoin thought leaders"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="hidden sm:inline">Thinkers</span>
                </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                title="Refresh all data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="text-right text-xs text-slate-300 font-mono bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                <div className="text-slate-500 text-[10px] uppercase tracking-wide">Last Updated</div>
                <div className="text-slate-200 font-bold">{lastUpdate.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Austrian Wisdom Quote Banner */}
      <div className="bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-yellow-600/20 border-y border-yellow-600/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl text-yellow-400 opacity-50">❝</div>
            <div className="flex-1 transition-opacity duration-500">
              <p className="text-slate-200 italic text-sm md:text-base leading-relaxed">
                {AUSTRIAN_QUOTES[currentQuote].text}
              </p>
              <p className="text-yellow-400 font-semibold text-sm mt-2">
                — {AUSTRIAN_QUOTES[currentQuote].author}
              </p>
            </div>
            <div className="flex gap-1">
              {AUSTRIAN_QUOTES.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    idx === currentQuote ? 'bg-yellow-400 w-6' : 'bg-slate-600'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Austrian Score - Enhanced */}
          <div 
            className="lg:col-span-2 bg-gradient-to-br from-orange-900/40 via-slate-800/40 to-purple-900/40 border border-orange-600/50 rounded-xl p-6 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-orange-900/30 transition-all duration-300 cursor-pointer transform hover:scale-105"
            onClick={() => showEducation(
              'Austrian Cycle Score',
              `The Austrian Cycle Score (0-10) measures the severity of economic distortions caused by artificial credit expansion and monetary manipulation. Higher scores indicate greater risk of boom-bust cycles.

📊 Current Score: ${austrianScore.toFixed(1)}/10
🎯 Risk Level: ${overallRisk >= 7 ? 'HIGH RISK' : overallRisk >= 5 ? 'MODERATE' : 'LOW RISK'}
🔄 Cycle Phase: ${cyclePhase}

Based on Ludwig von Mises' Austrian Business Cycle Theory (ABCT), this score integrates:
• Credit market distortions (spread between natural and artificial interest rates)
• Monetary expansion (M2 growth beyond economic fundamentals)
• Malinvestment indicators (capital misallocation into unsustainable projects)
• Asset price inflation (stock market, real estate bubbles)

The theory predicts that credit expansion beyond real savings creates artificial booms that must inevitably bust when reality reasserts itself. As Mises stated: "There is no means of avoiding the final collapse of a boom brought about by credit expansion."`,
              [
                {
                  name: 'Federal Reserve Economic Data (FRED)',
                  url: 'https://fred.stlouisfed.org',
                  description: 'Official source for M2 money supply, interest rates, credit spreads'
                },
                {
                  name: 'Ludwig von Mises Institute',
                  url: 'https://mises.org/library/theory-money-and-credit',
                  description: 'Original Austrian Business Cycle Theory resources'
                },
                {
                  name: 'Austrian Economic Theory Guide',
                  url: '/docs/AUSTRIAN_ECONOMICS_0_TO_HERO_GUIDE.md',
                  description: 'Complete guide to understanding Austrian economics'
                }
              ]
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <h3 className="text-sm font-semibold text-orange-300 uppercase tracking-wider flex items-center">
                  Austrian Cycle Score
                  <InfoBadge explanationKey="overall_risk" />
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono bg-slate-800/50 px-2 py-1 rounded">0-10 Scale</span>
            </div>
            <div className="flex items-baseline gap-4 mb-4">
              <div className="text-7xl font-bold text-orange-400 drop-shadow-lg">{austrianScore.toFixed(1)}</div>
              <div className="flex-1">
                <div className={`text-3xl font-bold ${getRiskColor(overallRisk)} drop-shadow-md`}>
                  {overallRisk >= 7 ? 'HIGH RISK' : overallRisk >= 5 ? 'MODERATE' : 'LOW RISK'}
                </div>
                <div className="text-base text-slate-300 mt-2 font-mono bg-slate-800/50 px-3 py-1 rounded inline-block">
                  {cyclePhase}
                </div>
              </div>
            </div>
            <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-1000 shadow-lg ${
                  austrianScore >= 7 
                    ? 'bg-gradient-to-r from-red-600 to-red-500' 
                    : austrianScore >= 5 
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' 
                    : 'bg-gradient-to-r from-green-600 to-green-500'
                }`}
                style={{ width: `${(austrianScore / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">Click for detailed explanation</p>
          </div>

          {/* Bitcoin Price with Tooltip */}
          <motion.div 
            className="bg-gradient-to-br from-orange-600/30 via-slate-800/40 to-orange-800/30 border-2 rounded-xl p-6 backdrop-blur-sm shadow-xl transition-all duration-300 cursor-pointer group relative"
            style={{
              borderColor: templeTheme.colors.bitcoinOrange
            }}
            whileHover={{ 
              y: -5, 
              boxShadow: templeTheme.shadows.bitcoinGlow 
            }}
            onClick={() => showEducation(
              'Bitcoin: Digital Sound Money',
              `Bitcoin represents the modern embodiment of Austrian economic principles, serving as a hedge against fiat currency debasement.

💰 Current Price: ${btcPrice?.price ? formatCurrency(btcPrice.price) : formatCurrency(market?.bitcoin?.price || 0)}
🪙 Fixed Supply: 21,000,000 BTC (absolute scarcity)
📊 Halving Cycle: Supply issuance cuts in half every ~4 years

Austrian Economic Significance:
• Fixed Supply: Unlike fiat currency, Bitcoin cannot be inflated by central authorities
• Predictable Issuance: Halving events ensure decreasing inflation rate
• Subjective Value Theory: Price determined by individual preferences, not government decree
• Sound Money Qualities: Durable, portable, divisible, fungible, scarce, verifiable

As F.A. Hayek envisioned in "Denationalisation of Money" (1976), private competitive currencies can outcompete government monopoly money. Bitcoin fulfills Carl Menger's regression theorem - it evolved from a commodity (computing power) into a medium of exchange through free market forces.

"The root problem with conventional currency is all the trust that's required to make it work. The central bank must be trusted not to debase the currency, but the history of fiat currencies is full of breaches of that trust." - Satoshi Nakamoto`,
              [
                {
                  name: 'CoinGecko Bitcoin API',
                  url: 'https://api.coingecko.com/api/v3/coins/bitcoin',
                  description: 'Real-time Bitcoin price, market cap, volume data'
                },
                {
                  name: 'Blockchain.com Explorer',
                  url: 'https://www.blockchain.com/explorer/assets/btc',
                  description: 'Verify Bitcoin supply, transactions, and network data'
                },
                {
                  name: 'Hayek: Denationalisation of Money',
                  url: 'https://mises.org/library/denationalisation-money-argument-refined',
                  description: 'Hayek\'s 1976 case for private competitive currencies'
                }
              ]
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl drop-shadow-lg">₿</span>
                <h3 className="text-sm font-semibold text-orange-300 uppercase tracking-wider flex items-center">
                  Bitcoin
                  <InfoBadge explanationKey="m2_growth_rate" />
                </h3>
              </div>
              <div className="text-4xl font-bold text-white mb-2 drop-shadow-md">
                {btcPrice?.price ? formatCurrency(btcPrice.price) : formatCurrency(market?.bitcoin?.price || 0)}
              </div>
              <div className="text-xs text-orange-300 font-semibold mb-1">Sound Money Indicator</div>
              <div className="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded inline-block">
                {btcPrice?.source || market?.bitcoin?.source || 'CoinGecko'}
              </div>
            </div>
          </motion.div>

          {/* Gold Price with Tooltip */}
          <motion.div 
            className="bg-gradient-to-br via-slate-800/40 rounded-xl p-6 backdrop-blur-sm shadow-xl transition-all duration-300 cursor-pointer group relative"
            style={{
              background: `linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(139, 134, 128, 0.3) 100%)`,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: templeTheme.colors.austrianGold
            }}
            whileHover={{ 
              y: -5, 
              boxShadow: templeTheme.shadows.goldGlow 
            }}
            onClick={() => showEducation(
              'Gold: Traditional Store of Value',
              `Gold has served as money for thousands of years, embodying the Austrian school's sound money principles.

💰 Current Price: ${formatCurrency(market?.commodities?.gold || 0)} per troy oz
🪙 Stock-to-Flow Ratio: ~62 years (highest of all commodities)
🏦 Central Bank Holdings: >35,000 tonnes worldwide

Austrian Perspective on Gold:
• Historical Money: Gold emerged naturally through free market forces (Carl Menger's origin of money)
• Scarcity: Limited supply and costly production prevent arbitrary inflation
• Durability: Gold doesn't corrode, rust, or decay - stores value across generations
• Divisibility: Can be melted and divided without losing value
• Universal Recognition: Accepted globally for 5,000+ years

As J.P. Morgan testified before Congress (1912): "Gold is money. Everything else is credit."

The abandonment of the gold standard in 1971 severed the final link between fiat currency and sound money, enabling unlimited monetary expansion. Austrian economists argue this created the boom-bust cycles and wealth inequality we see today.

"The gold standard makes the determination of money's purchasing power independent of the changing ambitions and doctrines of political parties and pressure groups." - Ludwig von Mises`,
              [
                {
                  name: 'CoinGecko Gold Price API',
                  url: 'https://api.coingecko.com/api/v3/simple/price?ids=gold&vs_currencies=usd',
                  description: 'Real-time gold spot price in USD per troy ounce'
                },
                {
                  name: 'World Gold Council',
                  url: 'https://www.gold.org/goldhub/data/gold-prices',
                  description: 'Official gold market data and central bank holdings'
                },
                {
                  name: 'Mises on the Gold Standard',
                  url: 'https://mises.org/library/case-gold-standard',
                  description: 'Austrian economic case for returning to gold-backed money'
                }
              ]
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl drop-shadow-lg">🪙</span>
                <h3 className="text-sm font-semibold text-yellow-300 uppercase tracking-wider flex items-center">
                  Gold
                  <InfoBadge explanationKey="base_money_growth" />
                </h3>
              </div>
              <div className="text-4xl font-bold text-white mb-2 drop-shadow-md">
                {formatCurrency(market?.commodities?.gold || 0)}
              </div>
              <div className="text-xs text-yellow-300 font-semibold mb-1">Traditional Store of Value</div>
              <div className="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded inline-block">
                per oz
              </div>
            </div>
          </motion.div>

          {/* Silver Price with Tooltip */}
          <motion.div 
            className="rounded-xl p-6 backdrop-blur-sm shadow-xl transition-all duration-300 cursor-pointer group relative"
            style={{
              background: `linear-gradient(135deg, rgba(248, 248, 255, 0.15) 0%, rgba(139, 134, 128, 0.2) 100%)`,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: templeTheme.colors.marbleWhite
            }}
            whileHover={{ 
              y: -5, 
              boxShadow: `0 20px 40px rgba(248, 248, 255, 0.2)` 
            }}
            onClick={() => showEducation(
              'Silver: The People\'s Sound Money',
              `Silver has been monetary metal alongside gold throughout history, often called "the poor man's gold" because it's more accessible to ordinary people.

💰 Current Price: ${formatCurrency(market?.commodities?.silver || 0)} per troy oz
⚡ Gold-to-Silver Ratio: ${market?.commodities?.gold && market?.commodities?.silver ? (market.commodities.gold / market.commodities.silver).toFixed(1) : 'N/A'}:1 (historical average: 15-20:1)
🏭 Industrial Use: ~50% of silver demand comes from industrial applications (solar panels, electronics, medical)
📱 Modern Applications: Essential for green energy revolution

Austrian Economic Insights on Silver:

Saifedean Ammous (Author of "The Bitcoin Standard" and "The Fiat Standard"):
• "Silver was historically bimetallic money alongside gold. Its higher supply growth rate made it the circulating medium while gold became the settlement layer."
• Silver's dual role (monetary + industrial) creates unique dynamics in fiat collapse scenarios
• Like Bitcoin, silver benefits from network effects - the more it's used as money, the more liquid it becomes
• Silver represents a middle ground: harder money than fiat, more accessible than gold

José Luis Cava (Austrian Economist, Spanish Sound Money Advocate):
• "La plata es el dinero del pueblo" (Silver is the people's money) - accessible to working class
• In hyperinflation scenarios (Argentina, Venezuela), silver coins become practical medium of exchange
• Silver's industrial demand provides fundamental floor price independent of monetary premium
• Fractional silver coins allow for small transactions impossible with gold

Historical Context:
• Silver/Gold bimetallism dominated monetary systems for millennia
• The "Crime of 1873" demonetized silver in the US, concentrating wealth
• Franklin D. Roosevelt confiscated gold (1933) but citizens could keep silver
• Silver's monetary premium collapsed post-1964 when US stopped minting silver coins

Modern Austrian Analysis:
• Silver is MORE volatile than gold due to smaller market capitalization
• Industrial demand creates price floor but also correlation with economic cycles
• In monetary crisis, silver often outperforms gold initially (higher beta)
• Accumulation strategy: Silver for day-to-day transactions, gold for wealth preservation

"In the absence of the gold standard, there is no way to protect savings from confiscation through inflation. There is no safe store of value." - Alan Greenspan (1966, before joining the Fed)`,
              [
                {
                  name: 'CoinGecko Silver Price API',
                  url: 'https://api.coingecko.com/api/v3/simple/price?ids=silver&vs_currencies=usd',
                  description: 'Real-time silver spot price in USD per troy ounce'
                },
                {
                  name: 'Silver Institute - Supply & Demand',
                  url: 'https://www.silverinstitute.org/',
                  description: 'Official silver market data, industrial demand, and supply statistics'
                },
                {
                  name: 'Saifedean Ammous - The Bitcoin Standard',
                  url: 'https://saifedean.com/thebitcoinstandard',
                  description: 'Austrian economic analysis of sound money including gold and silver'
                },
                {
                  name: 'José Luis Cava - YouTube Channel',
                  url: 'https://www.youtube.com/c/JoseLuisCavatv',
                  description: 'Spanish Austrian economist explaining sound money principles'
                }
              ]
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-300/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl drop-shadow-lg">⚪</span>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                  Silver
                  <InfoBadge explanationKey="interest_rate_spread" />
                </h3>
              </div>
              <div className="text-4xl font-bold text-white mb-2 drop-shadow-md">
                {formatCurrency(market?.commodities?.silver || 0)}
              </div>
              <div className="text-xs text-slate-300 font-semibold mb-1">The People's Money</div>
              <div className="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded inline-block">
                per oz
              </div>
            </div>
          </motion.div>
        </div>

        {/* ========== PROFESSIONAL VISUALIZATIONS SECTION ========== */}
        
        {/* Risk Metrics Dashboard with KPI Cards */}
        <div className="mb-8">
          <RiskMetricsDashboard
            metrics={{
              austrianScore: analysis?.austrian_score || 0,
              m2Growth: typeof pillars?.monetary_policy?.metrics?.money_supply === 'number' ? pillars.monetary_policy.metrics.money_supply : 0,
              creditGrowth: typeof pillars?.credit_markets?.metrics?.credit_growth === 'number' ? pillars.credit_markets.metrics.credit_growth : 0,
              interestSpread: typeof pillars?.monetary_policy?.metrics?.interest_rate_spread === 'number' ? pillars.monetary_policy.metrics.interest_rate_spread : 0,
              malinvestmentIndex: analysis?.indicators?.malinvestment_index || 0,
              yieldCurve: typeof pillars?.monetary_policy?.metrics?.yield_curve === 'number' ? pillars.monetary_policy.metrics.yield_curve : 0,
              bitcoinPrice: btcPrice?.price || 0,
              goldPrice: market?.commodities?.gold || 0,
            }}
            sparklines={{
              austrianScore: [5.2, 5.8, 6.1, 6.4, 6.7, analysis?.austrian_score || 0],
              m2Growth: [4.9, 5.1, 5.5, 5.3, 5.7, 5.7],
              creditGrowth: [4.8, 4.9, 4.6, 4.5, 4.4, 4.3],
              interestSpread: [0.8, 1.0, 1.1, 1.3, 1.2, 1.2],
              malinvestmentIndex: [5.1, 5.6, 5.9, 6.3, 6.2, analysis?.indicators?.malinvestment_index || 0],
              yieldCurve: [0.2, 0.1, -0.1, -0.2, -0.3, -0.3],
              bitcoinPrice: [64000, 65500, 66200, 67500, 66800, btcPrice?.price || 0],
              goldPrice: [2020, 2030, 2045, 2055, 2048, market?.commodities?.gold || 0],
            }}
            trends={{
              austrianScore: (analysis?.austrian_score || 0) >= 6 ? 'up' : (analysis?.austrian_score || 0) >= 4 ? 'stable' : 'down',
              m2Growth: 'up',
              creditGrowth: 'down',
              malinvestmentIndex: 'up',
              yieldCurve: 'down',
            }}
          />
        </div>

        {/* Credit Growth and Malinvestment Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Credit Growth Chart */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 border-blue-600/30 rounded-xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📈</span>
              <div>
                <h3 className="text-xl font-bold text-blue-400">Credit Expansion Trends</h3>
                <p className="text-sm text-slate-400">Year-over-Year and Quarter-over-Quarter Growth</p>
              </div>
            </div>
            {analysisLoading ? (
              <ChartSkeleton height={400} />
            ) : analysis ? (
              <CreditGrowthChart
                data={[
                  { quarter: '2024-Q1', yoy: 4.8, qoq: 1.2, creditToGdp: 245 },
                  { quarter: '2024-Q2', yoy: 4.6, qoq: 0.9, creditToGdp: 247 },
                  { quarter: '2024-Q3', yoy: 4.4, qoq: 0.5, creditToGdp: 248 },
                  { quarter: '2024-Q4', yoy: 4.3, qoq: 0.3, creditToGdp: 249 },
                  { quarter: '2025-Q1', yoy: 4.2, qoq: 0.2, creditToGdp: 250 },
                ]}
                height={400}
              />
            ) : (
              <EmptyState title="Credit Data Unavailable" message="Credit expansion data is currently not available" icon="📈" />
            )}
          </div>

          {/* Malinvestment Radar Chart */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 border-orange-600/30 rounded-xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-xl font-bold text-orange-400">Malinvestment Risk Analysis</h3>
                <p className="text-sm text-slate-400">Six-Component Risk Distribution</p>
              </div>
            </div>
            {analysisLoading ? (
              <RadarSkeleton />
            ) : analysis?.indicators?.malinvestment_components ? (
              <MalinvestmentRadarChart
                components={analysis.indicators.malinvestment_components}
                height={400}
              />
            ) : (
              <EmptyState title="Malinvestment Data Unavailable" message="Risk analysis data is currently not available" icon="⚠️" />
            )}
          </div>
        </div>

        {/* Austrian Score Gauges and Three Pillars Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Austrian Score Gauge */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 border-orange-600/30 rounded-xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏛️</span>
              <div>
                <h3 className="text-xl font-bold text-orange-400">Austrian Score</h3>
                <p className="text-sm text-slate-400">Overall Cycle Risk</p>
              </div>
            </div>
            {analysisLoading ? (
              <GaugeSkeleton />
            ) : analysis ? (
              <AustrianScoreGauge
                score={analysis.austrian_score || 0}
                trend={(analysis.austrian_score || 0) >= 6 ? 'up' : (analysis.austrian_score || 0) >= 4 ? 'stable' : 'down'}
                size={250}
              />
            ) : (
              <EmptyState title="Score Unavailable" message="Austrian score data is currently not available" icon="🏛️" />
            )}
          </div>

          {/* Three Pillars Health */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 border-purple-600/30 rounded-xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏛️</span>
              <div>
                <h3 className="text-xl font-bold text-purple-400">Three Pillars Health Status</h3>
                <p className="text-sm text-slate-400">Monetary Policy • Credit Markets • Real Economy</p>
              </div>
            </div>
            {pillarsLoading ? (
              <ChartSkeleton height={300} />
            ) : pillars ? (
              <ThreePillarsHealth
                pillars={[
                  {
                    name: 'Monetary Policy',
                    status: pillars.monetary_policy?.status || 'unknown',
                    riskLevel: pillars.monetary_policy?.risk_level || 'moderate',
                    score: analysis?.risk_levels?.monetary_policy || 0,
                  },
                  {
                    name: 'Credit Markets',
                    status: pillars.credit_markets?.status || 'unknown',
                    riskLevel: pillars.credit_markets?.risk_level || 'moderate',
                    score: analysis?.risk_levels?.credit_markets || 0,
                  },
                  {
                    name: 'Real Economy',
                    status: pillars.real_economy?.status || 'unknown',
                    riskLevel: pillars.real_economy?.risk_level || 'moderate',
                    score: analysis?.risk_levels?.real_economy || 0,
                  },
                ]}
              />
            ) : (
              <EmptyState title="Pillars Data Unavailable" message="Three pillars health data is currently not available" icon="🏛️" />
            )}
          </div>
        </div>

        {/* Asset Correlation Matrix */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 border-gold-600/30 rounded-xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💹</span>
              <div>
                <h3 className="text-xl font-bold text-yellow-400">Asset Correlation Matrix</h3>
                <p className="text-sm text-slate-400">Sound Money vs. Fiat Assets Correlations</p>
              </div>
            </div>
            {marketLoading ? (
              <MatrixSkeleton />
            ) : market ? (
              <AssetCorrelationMatrix
                data={{
                  bitcoin: { bitcoin: 1.00, gold: 0.45, silver: 0.38, stocks: -0.12 },
                  gold: { bitcoin: 0.45, gold: 1.00, silver: 0.82, stocks: -0.25 },
                  silver: { bitcoin: 0.38, gold: 0.82, silver: 1.00, stocks: -0.18 },
                  stocks: { bitcoin: -0.12, gold: -0.25, silver: -0.18, stocks: 1.00 },
                }}
              />
            ) : (
              <EmptyState title="Correlation Data Unavailable" message="Asset correlation data is currently not available" icon="💹" />
            )}
          </div>
        </div>

        {/* Historical Cycle Timeline */}
        <div className="mb-8">
          <CycleTimeline
            events={[]}
            currentPhase={analysis?.cycle_position || 'expansion'}
          />
        </div>

        {/* ========== END VISUALIZATIONS SECTION ========== */}

        {/* Austrian Economics 101: From Zero to Hero - Interactive Course Section */}
        {insightsData && !insightsLoading && (
          <div className="mb-8 bg-gradient-to-br from-yellow-900/40 via-orange-900/40 to-red-900/40 border-2 border-yellow-600/70 rounded-2xl p-8 backdrop-blur-sm shadow-2xl hover:shadow-yellow-900/30 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl animate-bounce">🎓</div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-red-400 text-transparent bg-clip-text">
                    Austrian Economics 101
                  </h2>
                  <p className="text-slate-300 mt-2 text-sm md:text-base">
                    From Zero to Hero: Learn Austrian Business Cycle Theory Through Live Market Analysis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAustrianCourse(!showAustrianCourse)}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-yellow-500/50"
              >
                <span>{showAustrianCourse ? 'Hide Course' : 'Start Learning'}</span>
                <svg className={`w-5 h-5 transition-transform duration-300 ${showAustrianCourse ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {showAustrianCourse && (
              <div className="space-y-6 animate-fade-in">
                {/* Current Cycle Phase Banner */}
                <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border-l-4 border-red-500 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🔴</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-red-300">Current Phase: {insightsData.cycle_phase.toUpperCase().replace('-', ' ')}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          insightsData.risk_level === 'extreme' ? 'bg-red-600' :
                          insightsData.risk_level === 'high' ? 'bg-orange-600' :
                          insightsData.risk_level === 'elevated' ? 'bg-yellow-600' :
                          insightsData.risk_level === 'moderate' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {insightsData.risk_level.toUpperCase()} RISK
                        </span>
                      </div>
                      <div className="text-slate-200 leading-relaxed whitespace-pre-line">
                        {insightsData.cycle_narrative}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Economists Reference Guide */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Classical Economists */}
                  <div className="bg-slate-900/70 border border-yellow-600/50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">📚</span>
                      <h3 className="text-xl font-bold text-yellow-300">Classical Austrian Economists</h3>
                    </div>
                    <div className="space-y-3">
                      {insightsData.economists_referenced.classical.map((economist, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-yellow-500/50 transition-all">
                          <div className="text-sm font-semibold text-yellow-200">{economist}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {economist === 'Carl Menger' && '🏛️ Founder • Subjective Value Theory (1871)'}
                            {economist === 'Eugen von Böhm-Bawerk' && '⏳ Capital Theory • Time Preference (1884-1889)'}
                            {economist === 'Ludwig von Mises' && '💡 Business Cycles • Human Action (1912-1949)'}
                            {economist === 'Friedrich Hayek' && '🧠 Knowledge Problem • Nobel Prize (1974)'}
                            {economist === 'Murray Rothbard' && '⚡ Anarcho-Capitalism • Power & Market (1962)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modern Voices */}
                  <div className="bg-slate-900/70 border border-orange-600/50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🎯</span>
                      <h3 className="text-xl font-bold text-orange-300">Modern Austrian Voices</h3>
                    </div>
                    <div className="space-y-3">
                      {insightsData.economists_referenced.modern.map((economist, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-orange-500/50 transition-all">
                          <div className="text-sm font-semibold text-orange-200">{economist}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {economist === 'Saifedean Ammous' && '₿ The Bitcoin Standard • Sound Money (2018)'}
                            {economist === 'José Luis Cava' && '🌎 Latin American Experience • Spanish Education'}
                            {economist === 'Jesús Huerta de Soto' && '🇪🇺 European School • Dynamic Efficiency'}
                            {economist === 'Robert Murphy' && '📈 Contemporary Cycles • Applied Theory'}
                            {economist === 'Per Bylund' && '🚀 Entrepreneurship • Production Theory'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Insights by Category - Expandable Tabs */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-yellow-300 flex items-center gap-3">
                    <span>💎</span>
                    <span>Live Market Insights from Austrian Economists</span>
                  </h3>

                  {/* Bitcoin Insights */}
                  {insightsData.insights.bitcoin.length > 0 && (
                    <details className="group bg-slate-900/70 border border-orange-600/50 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer p-4 hover:bg-slate-800/50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">₿</span>
                          <span className="text-lg font-bold text-orange-300">Bitcoin: Sound Money for the Digital Age</span>
                          <span className="text-xs bg-orange-600 px-2 py-1 rounded-full">{insightsData.insights.bitcoin.length} insights</span>
                        </div>
                        <svg className="w-5 h-5 text-orange-300 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="p-6 space-y-4 bg-slate-950/50">
                        {insightsData.insights.bitcoin.map((insight, idx) => (
                          <div key={idx} className="bg-slate-900/80 rounded-lg p-4 border border-slate-700 hover:border-orange-500/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-md font-bold text-orange-200">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-400">{(insight.relevance_score * 100).toFixed(0)}% relevant</div>
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500" style={{ width: `${insight.relevance_score * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-3">{insight.content}</p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400">👤 {insight.economist}</span>
                                {insight.tags.map((tag, tagIdx) => (
                                  <span key={tagIdx} className="bg-slate-800 px-2 py-1 rounded text-slate-400">#{tag}</span>
                                ))}
                              </div>
                              <div className="text-slate-500 italic">{insight.source}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Gold & Silver Insights */}
                  {insightsData.insights.gold_silver.length > 0 && (
                    <details className="group bg-slate-900/70 border border-yellow-600/50 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer p-4 hover:bg-slate-800/50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🥇</span>
                          <span className="text-lg font-bold text-yellow-300">Gold & Silver: Monetary Metals</span>
                          <span className="text-xs bg-yellow-600 px-2 py-1 rounded-full">{insightsData.insights.gold_silver.length} insights</span>
                        </div>
                        <svg className="w-5 h-5 text-yellow-300 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="p-6 space-y-4 bg-slate-950/50">
                        {insightsData.insights.gold_silver.map((insight, idx) => (
                          <div key={idx} className="bg-slate-900/80 rounded-lg p-4 border border-slate-700 hover:border-yellow-500/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-md font-bold text-yellow-200">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-400">{(insight.relevance_score * 100).toFixed(0)}% relevant</div>
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500" style={{ width: `${insight.relevance_score * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-3">{insight.content}</p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400">👤 {insight.economist}</span>
                                {insight.tags.map((tag, tagIdx) => (
                                  <span key={tagIdx} className="bg-slate-800 px-2 py-1 rounded text-slate-400">#{tag}</span>
                                ))}
                              </div>
                              <div className="text-slate-500 italic">{insight.source}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Interest Rates Insights */}
                  {insightsData.insights.interest_rates.length > 0 && (
                    <details className="group bg-slate-900/70 border border-red-600/50 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer p-4 hover:bg-slate-800/50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📉</span>
                          <span className="text-lg font-bold text-red-300">Interest Rates: The Root of Boom & Bust</span>
                          <span className="text-xs bg-red-600 px-2 py-1 rounded-full">{insightsData.insights.interest_rates.length} insights</span>
                        </div>
                        <svg className="w-5 h-5 text-red-300 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="p-6 space-y-4 bg-slate-950/50">
                        {insightsData.insights.interest_rates.map((insight, idx) => (
                          <div key={idx} className="bg-slate-900/80 rounded-lg p-4 border border-slate-700 hover:border-red-500/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-md font-bold text-red-200">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-400">{(insight.relevance_score * 100).toFixed(0)}% relevant</div>
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: `${insight.relevance_score * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-3">{insight.content}</p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400">👤 {insight.economist}</span>
                                {insight.tags.map((tag, tagIdx) => (
                                  <span key={tagIdx} className="bg-slate-800 px-2 py-1 rounded text-slate-400">#{tag}</span>
                                ))}
                              </div>
                              <div className="text-slate-500 italic">{insight.source}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Stock Markets Insights */}
                  {insightsData.insights.stock_markets.length > 0 && (
                    <details className="group bg-slate-900/70 border border-blue-600/50 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer p-4 hover:bg-slate-800/50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📊</span>
                          <span className="text-lg font-bold text-blue-300">Stock Markets: Capital Structure Signals</span>
                          <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">{insightsData.insights.stock_markets.length} insights</span>
                        </div>
                        <svg className="w-5 h-5 text-blue-300 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="p-6 space-y-4 bg-slate-950/50">
                        {insightsData.insights.stock_markets.map((insight, idx) => (
                          <div key={idx} className="bg-slate-900/80 rounded-lg p-4 border border-slate-700 hover:border-blue-500/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-md font-bold text-blue-200">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-400">{(insight.relevance_score * 100).toFixed(0)}% relevant</div>
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${insight.relevance_score * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-3">{insight.content}</p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400">👤 {insight.economist}</span>
                                {insight.tags.map((tag, tagIdx) => (
                                  <span key={tagIdx} className="bg-slate-800 px-2 py-1 rounded text-slate-400">#{tag}</span>
                                ))}
                              </div>
                              <div className="text-slate-500 italic">{insight.source}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Inflation Insights */}
                  {insightsData.insights.inflation.length > 0 && (
                    <details className="group bg-slate-900/70 border border-purple-600/50 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer p-4 hover:bg-slate-800/50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💸</span>
                          <span className="text-lg font-bold text-purple-300">Inflation: The Hidden Tax</span>
                          <span className="text-xs bg-purple-600 px-2 py-1 rounded-full">{insightsData.insights.inflation.length} insights</span>
                        </div>
                        <svg className="w-5 h-5 text-purple-300 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="p-6 space-y-4 bg-slate-950/50">
                        {insightsData.insights.inflation.map((insight, idx) => (
                          <div key={idx} className="bg-slate-900/80 rounded-lg p-4 border border-slate-700 hover:border-purple-500/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-md font-bold text-purple-200">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-400">{(insight.relevance_score * 100).toFixed(0)}% relevant</div>
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${insight.relevance_score * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-3">{insight.content}</p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400">👤 {insight.economist}</span>
                                {insight.tags.map((tag, tagIdx) => (
                                  <span key={tagIdx} className="bg-slate-800 px-2 py-1 rounded text-slate-400">#{tag}</span>
                                ))}
                              </div>
                              <div className="text-slate-500 italic">{insight.source}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Commodities Insights */}
                  {insightsData.insights.commodities.length > 0 && (
                    <details className="group bg-slate-900/70 border border-green-600/50 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer p-4 hover:bg-slate-800/50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏭</span>
                          <span className="text-lg font-bold text-green-300">Commodities: Production Structure Indicators</span>
                          <span className="text-xs bg-green-600 px-2 py-1 rounded-full">{insightsData.insights.commodities.length} insights</span>
                        </div>
                        <svg className="w-5 h-5 text-green-300 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="p-6 space-y-4 bg-slate-950/50">
                        {insightsData.insights.commodities.map((insight, idx) => (
                          <div key={idx} className="bg-slate-900/80 rounded-lg p-4 border border-slate-700 hover:border-green-500/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-md font-bold text-green-200">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-400">{(insight.relevance_score * 100).toFixed(0)}% relevant</div>
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-green-500 to-blue-500" style={{ width: `${insight.relevance_score * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-3">{insight.content}</p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400">👤 {insight.economist}</span>
                                {insight.tags.map((tag, tagIdx) => (
                                  <span key={tagIdx} className="bg-slate-800 px-2 py-1 rounded text-slate-400">#{tag}</span>
                                ))}
                              </div>
                              <div className="text-slate-500 italic">{insight.source}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border border-orange-600/50 rounded-xl p-6 text-center">
                  <h3 className="text-2xl font-bold text-yellow-300 mb-3">🚀 Ready to Go Deeper?</h3>
                  <p className="text-slate-300 mb-4 max-w-3xl mx-auto">
                    These insights update in real-time based on current market conditions. Explore the economic indicators below to see how Austrian theory applies to today's markets.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                    <span>📚 {insightsData.economists_referenced.classical.length} Classical Economists</span>
                    <span>•</span>
                    <span>🎯 {insightsData.economists_referenced.modern.length} Modern Voices</span>
                    <span>•</span>
                    <span>💡 {Object.values(insightsData.insights).flat().length} Live Insights</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Asset Correlations Section */}
        <div className="bg-gradient-to-br from-blue-900/30 via-slate-800/40 to-purple-900/30 border border-blue-600/50 rounded-xl p-6 backdrop-blur-sm shadow-xl mb-8">`
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">📊</span>
            <h2 className="text-2xl font-bold text-blue-300">Asset Correlation Ratios & Cross-Market Analysis</h2>
          </div>
          
          {/* Austrian Interpretation Box */}
          <div className="mb-6 bg-slate-900/70 border border-orange-600/50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-orange-300 mb-2 flex items-center gap-2">
              <span>🏛️</span> Austrian Cross-Market Analysis
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              These ratios reveal how markets are responding to monetary manipulation. Gold/Bitcoin ratio shows which sound money asset is gaining. M2 growth measures fiat debasement speed. Malinvestment index tracks capital misallocation severity. Together, they paint a picture of the Austrian Business Cycle phase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-orange-500/50 transition-all cursor-pointer transform hover:scale-105"
              onClick={() => showEducation(
                'Gold/Bitcoin Ratio - Sound Money Competition',
                `CURRENT: ${btcGoldRatio} BTC per 1 oz Gold

🏛️ AUSTRIAN INTERPRETATION:
Gold ($${formatCurrency(market?.commodities?.gold || 0)}/oz) and Bitcoin (₿${formatCurrency(btcPrice?.price || market?.bitcoin?.price || 0)}) are competing as sound money alternatives to fiat currency manipulation.

📊 WHAT THIS RATIO TELLS US:
• FALLING ratio = Bitcoin outperforming (digital sound money gaining)
• RISING ratio = Gold outperforming (traditional sound money favored)
• Both rising vs USD = Flight from fiat

💡 HISTORICAL CONTEXT:
In 2010: ~1,000,000 BTC per oz Gold
Today: ${btcGoldRatio} BTC per oz Gold
Change: Bitcoin has gained ${(1000000 / parseFloat(btcGoldRatio)).toFixed(0)}x vs Gold!

⚡ WHY IT MATTERS:
Both assets share Austrian sound money properties:
• Fixed/scarce supply (Gold: physical scarcity, BTC: 21M cap)
• Can't be printed by central banks
• Store of value during monetary expansion
• No counterparty risk

But Bitcoin adds:
• Perfect divisibility (100M sats per BTC)
• Instant global transfer
• Absolute verification (blockchain)
• Censorship resistant

📈 CYCLE IMPLICATIONS:
${(analysis?.risk_levels?.monetary_policy || 0) >= 7 ? 'During artificial booms, BOTH tend to underperform as investors chase yield in risky assets. In the BUST, both surge as flight-to-safety accelerates.' : 'Moderate monetary conditions mean both may consolidate. Watch for breakouts signaling loss of fiat confidence.'}

Current Bitcoin dominance: ${(((btcPrice?.price || market?.bitcoin?.price || 0) / (market?.commodities?.gold || 1)) * 100).toFixed(1)}% of gold's market cap per unit. The flippening is happening in slow motion.`
              )}
            >
              <div className="text-sm text-slate-400 mb-2 flex items-center">
                Gold / Bitcoin Ratio
                <InfoBadge explanationKey="m2_growth_rate" />
              </div>
              <div className="text-3xl font-bold text-orange-400">{btcGoldRatio}</div>
              <div className="text-xs text-slate-500 mt-2">BTC per 1 oz Gold (lower = BTC gaining)</div>
              <div className="mt-3 text-xs text-slate-400 border-t border-slate-700 pt-2">
                📍 Gold: ${formatCurrency(market?.commodities?.gold || 0)}/oz • Bitcoin: ${formatCurrency(btcPrice?.price || market?.bitcoin?.price || 0)}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer transform hover:scale-105"
              onClick={() => showEducation(
                'M2 Money Supply Growth - The Inflation Engine',
                `CURRENT: ${(analysis?.monetary_metrics?.m2_growth_rate || 0).toFixed(1)}% annual growth

🏛️ AUSTRIAN MONEY SUPPLY THEORY:
M2 measures the broadest commonly-used money supply: cash, checking accounts, savings accounts, money market funds, and small time deposits. When M2 grows faster than real economic output, it DILUTES purchasing power.

💰 WHY M2 MATTERS:
• Every % of M2 growth BEYOND real GDP = hidden inflation tax
• Current GDP growth: ${market?.economic_indicators?.gdp_growth?.toFixed(1) || 'N/A'}%
• M2 growth: ${(analysis?.monetary_metrics?.m2_growth_rate || 0).toFixed(1)}%
• Real inflation: ${((analysis?.monetary_metrics?.m2_growth_rate || 0) - (market?.economic_indicators?.gdp_growth || 0)).toFixed(1)}% purchasing power loss!

🔥 THE CANTILLON EFFECT:
New money doesn't enter the economy evenly:
1. Fed creates reserves → Banks get it FIRST
2. Banks lend to corporations/government → They get it SECOND  
3. Asset owners see price rises → They benefit THIRD
4. Workers get wage increases → They get it LAST (if at all)

Result: Wealth transfers from savers/workers to banks/government/asset holders. This is why wealth inequality EXPLODES during monetary expansion.

📊 HISTORICAL WARNING LEVELS:
• <5% growth: Moderate (normal economic expansion)
• 5-10% growth: Elevated (watch for asset bubbles)
• 10-20% growth: Extreme (massive malinvestment incoming)
• >20% growth: Hyperinflationary (Weimar/Zimbabwe territory)

Current ${(analysis?.monetary_metrics?.m2_growth_rate || 0).toFixed(1)}% = ${(analysis?.monetary_metrics?.m2_growth_rate || 0) >= 10 ? '🚨 EXTREME monetary expansion! Austrian theory predicts severe malinvestments.' : (analysis?.monetary_metrics?.m2_growth_rate || 0) >= 5 ? '⚠️ ELEVATED expansion. Watch for distortions building.' : '✅ Moderate levels. Less immediate concern.'}

💎 SOUND MONEY HEDGE:
Bitcoin's supply growth: ~1.7% (halving every 4 years)
Next halving: 2024 → ~0.85% growth
Eventually: 0% growth (21M cap reached ~2140)

Gold's supply growth: ~1.5-2%/year (mining production)

Both FAR below current M2 growth, making them stores of value vs fiat debasement.`
              )}
            >
              <div className="text-sm text-slate-400 mb-2 flex items-center">
                M2 Money Growth
                <InfoBadge explanationKey="m2_growth_rate" />
              </div>
              <div className="text-3xl font-bold text-blue-400">{(analysis?.monetary_metrics?.m2_growth_rate || 0).toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-2">Annual money supply expansion</div>
              <div className="mt-3 text-xs text-slate-400 border-t border-slate-700 pt-2">
                {(analysis?.monetary_metrics?.m2_growth_rate || 0) >= 10 ? '🚨 Extreme expansion' : (analysis?.monetary_metrics?.m2_growth_rate || 0) >= 5 ? '⚠️ Elevated' : '✅ Moderate'}  • GDP: {market?.economic_indicators?.gdp_growth?.toFixed(1) || 'N/A'}%
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer transform hover:scale-105"
              onClick={() => showEducation(
                'Malinvestment Index - Capital Misallocation Tracker',
                `CURRENT: ${(analysis?.indicators?.malinvestment_index || 0).toFixed(1)}/10 ${(analysis?.indicators?.malinvestment_index || 0) >= 7 ? '🚨 SEVERE' : (analysis?.indicators?.malinvestment_index || 0) >= 5 ? '⚠️ ELEVATED' : '✅ MODERATE'}

🏛️ AUSTRIAN MALINVESTMENT THEORY:
When central banks artificially lower interest rates below the natural rate, they send FALSE SIGNALS to entrepreneurs. Projects that appear profitable at fake low rates become disasters when reality reasserts itself.

📊 WHAT THIS INDEX MEASURES:
• Yield curve inversion severity ${market?.yield_curve?.inverted ? '(INVERTED!)' : ''}
• Stock market overvaluation vs fundamentals
• Zombie companies (can't cover interest payments)
• Unprofitable "growth" company prevalence
• Real estate price disconnection from wages
• Capital goods sector over-expansion
• Credit market distortion levels

Current Components:
• S&P 500: ${stockMarkets?.sp500?.price ? '$' + stockMarkets.sp500.price.toFixed(0) : 'N/A'}
• P/E Ratio: ${stockMarkets?.sp500?.pe_ratio || 'N/A'} (Historical avg: ~15-16)
• Yield Curve: ${market?.yield_curve?.['10y_2y_spread']?.toFixed(2) || 'N/A'}% spread
• Fed Funds: ${market?.interest_rates?.fed_funds?.toFixed(2) || 'N/A'}% vs Natural ${market?.interest_rates?.natural_rate_estimate?.toFixed(2) || 'N/A'}%

💥 SEVERITY LEVELS:
• 0-3: Healthy - Capital allocation mostly sound
• 4-6: Moderate - Some distortions visible, monitor
• 7-8: Severe - Major malinvestments, correction likely
• 9-10: Critical - Systemic misallocation, crash imminent

${(analysis?.indicators?.malinvestment_index || 0) >= 7 ? '🚨 DANGER ZONE: Current level indicates SEVERE capital misallocation. Austrian theory predicts these malinvestments MUST liquidate. The longer the boom, the worse the bust. Mises: "The boom sows the seeds of its own destruction."' : (analysis?.indicators?.malinvestment_index || 0) >= 5 ? '⚠️ WARNING: Elevated malinvestment building. Watch for: unprofitable tech unicorns, SPAC mania, real estate speculation, negative-yielding bonds, "this time is different" narratives.' : '✅ Current levels suggest capital allocation not catastrophically distorted. Remain vigilant.'}

📉 HISTORICAL EXAMPLES:
• 2008: Housing bubble (malinvestment in real estate)
• 2000: Dot-com bubble (malinvestment in unprofitable tech)
• 1929: Stock speculation (credit-fueled equity bubble)
• Every crisis follows the same pattern: Artificial boom → Malinvestment → Bust → Liquidation

🛡️ AUSTRIAN PROTECTION:
Hold sound money (BTC: $${formatCurrency(btcPrice?.price || market?.bitcoin?.price || 0)}, Gold: $${formatCurrency(market?.commodities?.gold || 0)}/oz) to preserve wealth through the liquidation phase.`
              )}
            >
              <div className="text-sm text-slate-400 mb-2 flex items-center">
                Malinvestment Index
                <InfoBadge explanationKey="malinvestment_index" />
              </div>
              <div className="text-3xl font-bold text-purple-400">{(analysis?.indicators?.malinvestment_index || 0).toFixed(1)}/10</div>
              <div className="text-xs text-slate-500 mt-2">Capital misallocation severity</div>
              <div className="mt-3 text-xs text-slate-400 border-t border-slate-700 pt-2">
                {(analysis?.indicators?.malinvestment_index || 0) >= 7 ? '🚨 Severe risk' : (analysis?.indicators?.malinvestment_index || 0) >= 5 ? '⚠️ Elevated' : '✅ Moderate'} • PMI: {market?.economic_indicators?.manufacturing_pmi?.toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>

          {/* Cross-Asset Correlation Insights */}
          <div className="mt-6 bg-slate-950/50 border border-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <span>🔗</span> Current Cross-Market Dynamics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="bg-slate-900/50 rounded p-3">
                <div className="font-semibold text-orange-300 mb-1">₿ Bitcoin vs Traditional Assets</div>
                <div className="space-y-1">
                  <div>• vs Gold: {(((btcPrice?.price || market?.bitcoin?.price || 0) / (market?.commodities?.gold || 1)) * 100).toFixed(1)}% of gold price per unit</div>
                  <div>• vs Silver: {(((btcPrice?.price || market?.bitcoin?.price || 0) / (market?.commodities?.silver || 1))).toFixed(0)}x silver price</div>
                  <div>• vs S&P500: {stockMarkets?.sp500?.price ? (((btcPrice?.price || market?.bitcoin?.price || 0) / stockMarkets.sp500.price) * 100).toFixed(1) + 'x index level' : 'N/A'}</div>
                  <div className="text-slate-400 italic mt-2">Bitcoin increasingly viewed as digital gold alternative</div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded p-3">
                <div className="font-semibold text-blue-300 mb-1">🏛️ Monetary Metrics Correlation</div>
                <div className="space-y-1">
                  <div>• M2 Growth: {(analysis?.monetary_metrics?.m2_growth_rate || 0).toFixed(1)}% → Drives inflation</div>
                  <div>• Real Rates: {((market?.interest_rates?.fed_funds || 0) - (market?.economic_indicators?.cpi || 0)).toFixed(2)}% (Nominal - CPI)</div>
                  <div>• Negative real rates = Bullish for sound money</div>
                  <div className="text-slate-400 italic mt-2">Austrian theory: Negative real rates accelerate malinvestment</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three Pillars - Enhanced with Expandable Sections */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="text-5xl"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              🏛️
            </motion.span>
            <h2 
              className="text-3xl font-bold"
              style={{
                fontFamily: templeTheme.typography.fonts.heading,
                background: templeTheme.gradients.austrianGold,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3))'
              }}
            >
              Three Pillars of Austrian Economics
            </h2>
          </div>
          
          {/* Classical Temple Architecture Description */}
          <div 
            className="mb-6 p-4 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${templeTheme.colors.cypherpunkBlack} 0%, rgba(26, 26, 26, 0.8) 100%)`,
              borderLeft: `4px solid ${templeTheme.colors.austrianGold}`
            }}
          >
            <p 
              className="text-sm italic"
              style={{ 
                color: templeTheme.colors.marbleWhite,
                fontFamily: templeTheme.typography.fonts.quote 
              }}
            >
              "Like the marble pillars of ancient temples that supported civilizations, these three foundations uphold sound economic analysis. 
              Monitor them vigilantly, for when pillars crack, empires fall."
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnhancedPillarCard
              title="Monetary Policy"
              icon="💰"
              status={pillars?.monetary_policy?.status || 'unknown'}
              riskLevel={pillars?.monetary_policy?.risk_level || 'unknown'}
              metrics={pillars?.monetary_policy?.metrics || {}}
              description="Central bank actions and money supply growth"
              isExpanded={expandedSections.has('pillar1')}
              onToggle={() => toggleSection('pillar1')}
              educationContent={`💰 MONETARY POLICY DISTORTION (Risk: ${analysis?.risk_levels?.monetary_policy?.toFixed(1) || 'N/A'}/10)

📊 CURRENT SNAPSHOT:
• Fed Funds Rate: ${market?.interest_rates?.fed_funds?.toFixed(2) || 'N/A'}% (Central bank target)
• Natural Rate: ~${market?.interest_rates?.natural_rate_estimate?.toFixed(2) || 'N/A'}% (Market equilibrium)
• Rate Gap: ${((market?.interest_rates?.natural_rate_estimate || 0) - (market?.interest_rates?.fed_funds || 0)).toFixed(2)}% ${((market?.interest_rates?.natural_rate_estimate || 0) - (market?.interest_rates?.fed_funds || 0)) > 0 ? '⬆️ (Artificially LOW)' : '⬇️ (Restrictive)'}
• M2 Money Supply Growth: ${analysis?.monetary_metrics?.m2_growth_rate?.toFixed(1) || 'N/A'}%/year (Inflation fuel)
• 10Y Treasury: ${market?.interest_rates?.['10y_treasury']?.toFixed(2) || 'N/A'}%

🏛️ AUSTRIAN ANALYSIS:
When the Fed keeps interest rates BELOW the natural rate (currently ${((market?.interest_rates?.natural_rate_estimate || 0) - (market?.interest_rates?.fed_funds || 0)).toFixed(2)}% gap), it sends FALSE SIGNALS to entrepreneurs. They think more real savings exist than actually do, so they start long-term projects that CANNOT be completed sustainably.

💡 THE CANTILLON EFFECT IN ACTION:
M2 growing at ${analysis?.monetary_metrics?.m2_growth_rate?.toFixed(1) || 'N/A'}% means new money is being created. But who gets it FIRST matters! Banks, government, and connected insiders spend it before prices rise. By the time it reaches workers and savers, purchasing power is already diluted. This is why Bitcoin (₿${formatCurrency(btcPrice?.price || market?.bitcoin?.price || 0)}) and Gold ($${formatCurrency(market?.commodities?.gold || 0)}/oz) are surging - they're ESCAPE HATCHES from monetary manipulation.

⚠️ CYCLE PHASE INDICATOR:
${(analysis?.risk_levels?.monetary_policy || 0) >= 7 ? '🚨 EXTREME RISK: Artificial boom conditions creating massive malinvestments. The longer rates stay suppressed, the more violent the bust will be. Mises warned: "There is no means of avoiding the final collapse of a boom brought about by credit expansion."' : (analysis?.risk_levels?.monetary_policy || 0) >= 5 ? '⚠️ ELEVATED RISK: Monetary distortion building. Watch for signs of overinvestment in capital goods sectors.' : '✅ MODERATE: Current monetary policy closer to market rates, reducing distortion.'}

🎯 WHAT TO WATCH:
1. Rate gap widening = More artificial boom fuel
2. M2 accelerating = Inflation pressure building
3. Gold/Bitcoin outperforming = Market losing faith in fiat`}
              onShowEducation={showEducation}
            />
            <EnhancedPillarCard
              title="Credit Markets"
              icon="📊"
              status={pillars?.credit_markets?.status || 'unknown'}
              riskLevel={pillars?.credit_markets?.risk_level || 'unknown'}
              metrics={pillars?.credit_markets?.metrics || {}}
              description="Lending practices and credit conditions"
              isExpanded={expandedSections.has('pillar2')}
              onToggle={() => toggleSection('pillar2')}
              explanationKey="credit_growth_rate"
              educationContent={`📊 CREDIT MARKET DISTORTION (Risk: ${analysis?.risk_levels?.credit_markets?.toFixed(1) || 'N/A'}/10)

📈 CURRENT CREDIT CONDITIONS:
• Credit Market Distortion: ${analysis?.monetary_metrics?.credit_market_distortion || 'N/A'}
• Corporate Credit Spreads: ${analysis?.indicators?.corporate_bond_spreads?.toFixed(2) || 'N/A'}bp
• High Yield Spreads: ${analysis?.indicators?.corporate_bond_spreads ? (analysis.indicators.corporate_bond_spreads * 1.5).toFixed(2) : 'N/A'}bp
• Credit Tightness: ${pillars?.credit_markets?.metrics?.credit_availability || 'Unknown'}
• Credit Growth Rate: ${typeof pillars?.credit_markets?.metrics?.credit_growth === 'number' ? pillars.credit_markets.metrics.credit_growth.toFixed(1) : 'N/A'}%

🏛️ THE AUSTRIAN BUSINESS CYCLE ENGINE:
Credit expansion beyond REAL SAVINGS is the ROOT CAUSE of boom-bust cycles. When banks create money through lending (fractional reserve banking), they're not lending someone else's savings - they're creating purchasing power out of thin air.

💰 HOW THE BOOM STARTS:
1. Fed lowers rates → Banks can borrow cheap
2. Banks create NEW credit through loans
3. Entrepreneurs see low rates, think "cheap capital!"
4. They start long-term projects (real estate, tech startups, infrastructure)
5. These projects look profitable at artificial low rates
6. But they require MORE real resources than actually exist

⚡ REAL VS. FAKE SAVINGS:
• Real Savings: Someone delayed consumption, freeing up resources
• Fake Credit: Bank typed numbers into computer, no resources freed
• The Trap: Entrepreneurs bid for resources that don't exist
• Result: Prices rise, projects can't finish, BUST incoming

🎯 CYCLE PHASE INDICATOR:
${(analysis?.risk_levels?.credit_markets || 0) >= 7 ? '🚨 CRITICAL DANGER: Unsustainable credit boom in late stages! Credit is TOO easy, spreads TOO tight. Everyone can borrow = malinvestments everywhere. When credit tightens (and it MUST), watch for cascading defaults. Mises: "The boom can last only as long as the credit expansion progresses."' : (analysis?.risk_levels?.credit_markets || 0) >= 5 ? '⚠️ WARNING: Credit expansion building. Watch for: easy mortgage standards, ZIRP/NIRP policies, "this time is different" narratives, asset price bubbles in stocks/real estate.' : '✅ HEALTHY: Credit conditions relatively normal. Banks still cautious, spreads reflect actual risk.'}

📉 BUST SIGNALS TO WATCH:
• Credit spreads WIDENING = Risk repricing underway
• High-yield market seizing up = Junk debt in trouble
• Bank lending standards tightening = The tap turning off
• Corporate defaults rising = Malinvestments liquidating

💡 AUSTRIAN INSIGHT:
Current Bitcoin price (₿${formatCurrency(btcPrice?.price || market?.bitcoin?.price || 0)}) reflects market's search for assets OUTSIDE the credit system. Bitcoin has NO counterparty risk, NO credit expansion, NO central bank manipulation. It's the ULTIMATE escape from the credit boom-bust cycle.`}
              onShowEducation={showEducation}
            />
            <EnhancedPillarCard
              title="Real Economy"
              icon="🏭"
              status={pillars?.real_economy?.status || 'unknown'}
              riskLevel={pillars?.real_economy?.risk_level || 'unknown'}
              metrics={pillars?.real_economy?.metrics || {}}
              description="Production structure and capital allocation"
              isExpanded={expandedSections.has('pillar3')}
              onToggle={() => toggleSection('pillar3')}
              educationContent={`🏭 PRODUCTION STRUCTURE & CAPITAL ALLOCATION (Risk: ${analysis?.risk_levels?.real_economy?.toFixed(1) || 'N/A'}/10)

📊 REAL ECONOMY INDICATORS:
• Malinvestment Index: ${analysis?.indicators?.malinvestment_index?.toFixed(1) || 'N/A'}/10 ${(analysis?.indicators?.malinvestment_index || 0) >= 7 ? '🚨 (SEVERE)' : (analysis?.indicators?.malinvestment_index || 0) >= 5 ? '⚠️ (ELEVATED)' : '✅ (MODERATE)'}
• Manufacturing PMI: ${market?.economic_indicators?.manufacturing_pmi?.toFixed(1) || 'N/A'} ${(market?.economic_indicators?.manufacturing_pmi || 0) > 50 ? '📈 (Expanding)' : '📉 (Contracting)'}
• Capital Consumption: ${analysis?.indicators?.capital_consumption?.toFixed(1) || 'N/A'}/10 ${(analysis?.indicators?.capital_consumption || 0) >= 7 ? '🚨 (Eating capital!)' : '✅'}
• GDP Growth: ${market?.economic_indicators?.gdp_growth?.toFixed(1) || 'N/A'}% (But is it REAL or artificial?)
• Yield Curve: ${market?.yield_curve?.inverted ? '🔴 INVERTED (Recession signal!)' : '🟢 Normal'}
• Stock Market (S&P): ${stockMarkets?.sp500?.price ? '$' + stockMarkets.sp500.price.toFixed(0) : 'N/A'} ${stockMarkets?.sp500?.change_percent ? '(' + stockMarkets.sp500.change_percent + ')' : ''}

🏛️ HAYEKIAN PRODUCTION STRUCTURE:
The economy isn't just "output" - it's a TIME STRUCTURE of production stages:

Stage 1 (Longest): 🏗️ Raw materials → mining, oil drilling, forestry
Stage 2: 🏭 Capital goods → machinery, factories, equipment  
Stage 3: 🚚 Intermediate goods → steel, components, wholesale
Stage 4 (Shortest): 🛒 Consumer goods → retail, services, consumption

⚡ THE BOOM DISTORTION:
When Fed artificially lowers rates from ${market?.interest_rates?.natural_rate_estimate?.toFixed(2) || 'N/A'}% to ${market?.interest_rates?.fed_funds?.toFixed(2) || 'N/A'}%, it makes LONG-TERM projects look profitable:

• Tech startups with no revenue? Fundable! ✅
• 30-year infrastructure projects? Let's do it! ✅  
• Speculative real estate? Build it! ✅
• Unprofitable "growth" companies? Moon! 🚀

These investments appear profitable at LOW rates but become disasters when rates rise or credit tightens.

💥 CAPITAL MISALLOCATION RIGHT NOW:
${(analysis?.indicators?.malinvestment_index || 0) >= 7 ? '🚨 SEVERE MALINVESTMENT DETECTED:\n• Resources trapped in unprofitable ventures\n• "Zombie companies" kept alive by cheap credit\n• Production structure distorted toward overly-long processes\n• When credit tightens, these MUST liquidate\n• Hayek: "Mal-directed" capital requires PAINFUL reallocation' : (analysis?.indicators?.malinvestment_index || 0) >= 5 ? '⚠️ MODERATE MALINVESTMENT:\n• Some capital misallocation visible\n• Watch for: Unprofitable "unicorns", excessive real estate construction, stock buybacks funded by debt\n• Early signs of overinvestment in capital-intensive sectors' : '✅ RELATIVELY HEALTHY:\n• Production structure not severely distorted\n• Capital allocation closer to consumer preferences\n• Fewer obvious malinvestments requiring liquidation'}

🔍 CAPITAL CONSUMPTION WARNING:
Capital Consumption Index at ${analysis?.indicators?.capital_consumption?.toFixed(1) || 'N/A'}/10 measures if we're EATING our seed corn. During artificial booms, society consumes capital stock (machinery, infrastructure, savings) faster than we replenish it. This is invisible in GDP stats but CRITICAL for long-term prosperity.

${(analysis?.indicators?.capital_consumption || 0) >= 7 ? '🚨 DANGER: We\'re consuming capital faster than creating it! Future generations will be POORER. This is the hidden cost of central bank manipulation.' : '✅ Capital stock being maintained or growing.'}

💎 SOUND MONEY CONNECTION:
Gold ($${formatCurrency(market?.commodities?.gold || 0)}/oz) and Bitcoin (₿${formatCurrency(btcPrice?.price || market?.bitcoin?.price || 0)}) preserve purchasing power OUTSIDE the manipulated production structure. They can't be inflated away, making them:
• Stores of value during malinvestment liquidation
• Signals of lost confidence in central planning
• Hedges against capital consumption

📉 BUST PHASE INDICATORS:
• PMI dropping below 50 = Contraction beginning
• Yield curve inversion = Recession within 12-18 months (historically)
• Manufacturing layoffs = Liquidation of malinvestments
• Corporate bankruptcies rising = Market clearing bad projects
• Stock market crash = Repricing of artificially inflated assets`}
              onShowEducation={showEducation}
            />
          </div>
        </motion.div>

        {/* Risk Assessment Dashboard */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="text-4xl"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ⚠️
            </motion.span>
            <h2 
              className="text-3xl font-bold"
              style={{
                fontFamily: templeTheme.typography.fonts.heading,
                color: templeTheme.colors.marbleWhite
              }}
            >
              Risk Assessment
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RiskCard
              title="Monetary Policy"
              value={analysis?.risk_levels?.monetary_policy || 0}
              max={10}
              description="Central bank intervention risk"
            />
            <RiskCard
              title="Credit Markets"
              value={analysis?.risk_levels?.credit_markets || 0}
              max={10}
              description="Credit expansion distortion"
            />
            <RiskCard
              title="Real Economy"
              value={analysis?.risk_levels?.real_economy || 0}
              max={10}
              description="Malinvestment severity"
            />
            <RiskCard
              title="Overall Risk"
              value={overallRisk}
              max={10}
              highlighted
              description="Combined cycle risk"
            />
          </div>

          {/* VIX Austrian Interpretation - Enhanced Visual Card */}
          {stockMarkets.volatility && (
            <motion.div 
              className="mt-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border rounded-xl p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden"
              style={{
                borderColor: stockMarkets.volatility.vix < 12 
                  ? 'rgba(239, 68, 68, 0.6)'  // red for danger (low VIX = complacency)
                  : stockMarkets.volatility.vix < 20 
                  ? 'rgba(34, 197, 94, 0.6)'  // green for normal
                  : stockMarkets.volatility.vix < 30
                  ? 'rgba(251, 191, 36, 0.6)' // yellow for elevated
                  : 'rgba(239, 68, 68, 0.6)'  // red for panic
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Background Glow Effect */}
              <div 
                className="absolute inset-0 opacity-20 blur-3xl"
                style={{
                  background: stockMarkets.volatility.vix < 12 
                    ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.4), transparent)'
                    : stockMarkets.volatility.vix < 20 
                    ? 'radial-gradient(circle at center, rgba(34, 197, 94, 0.4), transparent)'
                    : stockMarkets.volatility.vix < 30
                    ? 'radial-gradient(circle at center, rgba(251, 191, 36, 0.4), transparent)'
                    : 'radial-gradient(circle at center, rgba(239, 68, 68, 0.4), transparent)'
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.span 
                      className="text-4xl"
                      animate={{
                        scale: stockMarkets.volatility.vix > 30 ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ⚡
                    </motion.span>
                    <div>
                      <h3 className="text-xl font-bold text-white">VIX Fear Index</h3>
                      <p className="text-xs text-slate-400">Market Psychology & Austrian Cycle Phase</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-white mb-1">{stockMarkets.volatility.vix.toFixed(1)}</div>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${
                      stockMarkets.volatility.vix < 12 ? 'text-red-400' : 
                      stockMarkets.volatility.vix < 20 ? 'text-green-400' : 
                      stockMarkets.volatility.vix < 30 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {stockMarkets.volatility.interpretation.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                {/* VIX Gauge Visualization */}
                <div className="mb-4">
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                    {/* Background gradient zones */}
                    <div className="absolute inset-0 flex">
                      <div className="flex-[12] bg-gradient-to-r from-red-600 to-red-500"></div>
                      <div className="flex-[8] bg-gradient-to-r from-green-600 to-green-500"></div>
                      <div className="flex-[10] bg-gradient-to-r from-yellow-600 to-yellow-500"></div>
                      <div className="flex-[20] bg-gradient-to-r from-red-600 to-red-700"></div>
                    </div>
                    {/* VIX indicator position */}
                    <motion.div 
                      className="absolute top-0 h-full w-1 bg-white shadow-lg"
                      style={{ left: `${Math.min((stockMarkets.volatility.vix / 50) * 100, 100)}%` }}
                      initial={{ left: 0 }}
                      animate={{ left: `${Math.min((stockMarkets.volatility.vix / 50) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                    <span>0</span>
                    <span className="text-red-400">12</span>
                    <span className="text-green-400">20</span>
                    <span className="text-yellow-400">30</span>
                    <span>50+</span>
                  </div>
                </div>

                {/* Austrian Interpretation */}
                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                    <span>🏛️</span> Austrian Business Cycle Interpretation
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    <strong className="text-white">{stockMarkets.volatility.austrian_warning}</strong>
                  </p>
                  
                  {/* Cycle Phase Warning */}
                  <div className={`p-3 rounded-lg border ${
                    stockMarkets.volatility.vix < 12 
                      ? 'bg-red-900/20 border-red-600/50'
                      : stockMarkets.volatility.vix < 20
                      ? 'bg-green-900/20 border-green-600/50'
                      : stockMarkets.volatility.vix < 30
                      ? 'bg-yellow-900/20 border-yellow-600/50'
                      : 'bg-red-900/20 border-red-600/50'
                  }`}>
                    <div className="text-xs font-semibold mb-1 flex items-center gap-2">
                      {stockMarkets.volatility.vix < 12 ? (
                        <><span>🚨</span><span className="text-red-400">DANGER: Late-Boom Complacency Phase</span></>
                      ) : stockMarkets.volatility.vix < 20 ? (
                        <><span>✅</span><span className="text-green-400">NORMAL: Healthy Market Psychology</span></>
                      ) : stockMarkets.volatility.vix < 30 ? (
                        <><span>⚠️</span><span className="text-yellow-400">CAUTION: Early Bust Recognition</span></>
                      ) : (
                        <><span>💥</span><span className="text-red-400">CRISIS: Liquidation Phase Active</span></>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {stockMarkets.volatility.vix < 12 ? (
                        <>Artificially low rates create moral hazard. Investors believe "Fed has their back" - classic pre-crash complacency. <strong className="text-red-300">Mises warned: "The boom produces impoverishment."</strong></>
                      ) : stockMarkets.volatility.vix < 20 ? (
                        <>Market participants show rational fear levels. No extreme complacency or panic. This represents natural market discovery without excessive central bank distortion.</>
                      ) : stockMarkets.volatility.vix < 30 ? (
                        <>Reality beginning to reassert itself. Malinvestments becoming evident. Investors recognizing that unsustainable projects will fail. Early liquidation phase.</>
                      ) : (
                        <>Full panic as boom-era malinvestments liquidate. Capital reallocating from wasteful projects to productive uses. <strong className="text-red-300">Painful but necessary correction.</strong></>
                      )}
                    </p>
                  </div>

                  {/* Educational Levels Guide */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
                      <span className="text-red-400 font-bold">{"<12:"}</span>
                      <span className="text-slate-400">Extreme complacency - MOST dangerous</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
                      <span className="text-green-400 font-bold">12-20:</span>
                      <span className="text-slate-400">Normal conditions - Healthy caution</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
                      <span className="text-yellow-400 font-bold">20-30:</span>
                      <span className="text-slate-400">Elevated fear - Bust beginning</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
                      <span className="text-red-400 font-bold">{">30:"}</span>
                      <span className="text-slate-400">Panic - Crisis/liquidation active</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Economic Indicators Dashboard */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="text-4xl"
              animate={{
                y: [0, -5, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              📈
            </motion.span>
            <h2 
              className="text-3xl font-bold"
              style={{
                fontFamily: templeTheme.typography.fonts.heading,
                color: templeTheme.colors.marbleWhite
              }}
            >
              Economic Indicators
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <IndicatorCard
              title="CPI Inflation"
              value={(market?.economic_indicators?.cpi || 0).toFixed(2) + '%'}
              trend="neutral"
              description="Consumer Price Index year-over-year"
            />
            <IndicatorCard
              title="PPI"
              value={(market?.economic_indicators?.ppi || 0).toFixed(2) + '%'}
              trend="neutral"
              description="Producer Price Index"
            />
            <IndicatorCard
              title="GDP Growth"
              value={(market?.economic_indicators?.gdp_growth || 0).toFixed(2) + '%'}
              trend="neutral"
              description="Real GDP growth rate"
            />
            <IndicatorCard
              title="Manufacturing PMI"
              value={market?.economic_indicators?.manufacturing_pmi?.toFixed(1) || '0.0'}
              trend={(market?.economic_indicators?.manufacturing_pmi || 0) > 50 ? 'up' : 'down'}
              description="Purchasing Managers Index (>50 = expansion)"
            />
            <IndicatorCard
              title="Fed Funds Rate"
              value={(market?.interest_rates?.fed_funds || 0).toFixed(2) + '%'}
              trend="neutral"
              description="Federal Reserve target rate"
            />
            <IndicatorCard
              title="10Y Treasury"
              value={(market?.interest_rates?.['10y_treasury'] || 0).toFixed(2) + '%'}
              trend="neutral"
              description="10-year Treasury yield"
            />
            <IndicatorCard
              title="Yield Curve"
              value={market?.yield_curve?.['10y_2y_spread']?.toFixed(2) + '%' || '0.00%'}
              trend={market?.yield_curve?.inverted ? 'down' : 'up'}
              alert={market?.yield_curve?.inverted}
              description="10Y-2Y spread (inverted = recession signal)"
            />
            <IndicatorCard
              title="Natural Rate Est."
              value={(market?.interest_rates?.natural_rate_estimate || 0).toFixed(2) + '%'}
              trend="neutral"
              description="Estimated natural interest rate"
            />
          </div>
        </motion.div>

        {/* Stock Markets with Austrian Analysis */}
        {stockMarkets && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.span 
                className="text-4xl"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                📈
              </motion.span>
              <h2 
                className="text-3xl font-bold"
                style={{
                  fontFamily: templeTheme.typography.fonts.heading,
                  color: templeTheme.colors.marbleWhite
                }}
              >
                Stock Markets & Austrian Cycle Analysis
              </h2>
            </div>
            
            {/* Main Indices */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div 
                className="bg-gradient-to-br from-blue-900/30 to-slate-800/40 border border-blue-600/50 rounded-xl p-4 backdrop-blur-sm hover:border-blue-500/80 transition-all transform hover:scale-105 cursor-pointer"
                onClick={() => showEducation(
                  'Dow Jones Industrial Average',
                  `The Dow (${stockMarkets.indices.dow_jones.toLocaleString()}) tracks 30 large-cap stocks representing major US corporations.

📊 Current Level: ${stockMarkets.indices.dow_jones.toLocaleString()}
🏢 Components: 30 blue-chip companies (Apple, Microsoft, Boeing, etc.)
📈 Type: Price-weighted index

Austrian Business Cycle Analysis:
• Cantillon Effect: During credit expansion booms, newly created money flows into equities first. This isn't real wealth creation - it's the Cantillon Effect: those closest to new money (large banks, major corporations) benefit first through higher stock prices while ordinary citizens face rising consumer prices later.

• False Signals: Artificially low interest rates make future earnings appear more valuable when discounted, inflating stock prices beyond their fundamental worth.

• Boom Psychology: Prolonged easy money creates euphoria where investors believe "this time is different" and traditional valuations no longer matter.

• Inevitable Correction: As Mises taught, "There is no means of avoiding the final collapse of a boom brought about by credit expansion. The alternative is only whether the crisis should come sooner as the result of a voluntary abandonment of further credit expansion, or later as a final and total catastrophe of the currency system involved."`,
                  [
                    {
                      name: 'Yahoo Finance Dow Jones API',
                      url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EDJI',
                      description: 'Real-time Dow Jones Industrial Average price data'
                    },
                    {
                      name: 'S&P Dow Jones Indices',
                      url: 'https://www.spglobal.com/spdji/en/indices/equity/dow-jones-industrial-average/',
                      description: 'Official index methodology and components'
                    },
                    {
                      name: 'Austrian Business Cycle Theory',
                      url: 'https://mises.org/library/austrian-theory-trade-cycle-and-other-essays',
                      description: 'Mises and Hayek on boom-bust cycles'
                    }
                  ]
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📊</span>
                  <h3 className="text-xs font-medium text-blue-300 uppercase tracking-wider">Dow Jones</h3>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stockMarkets.indices.dow_jones.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-2">30 Large-Cap Stocks</div>
              </div>

              <div 
                className="bg-gradient-to-br from-purple-900/30 to-slate-800/40 border border-purple-600/50 rounded-xl p-4 backdrop-blur-sm hover:border-purple-500/80 transition-all transform hover:scale-105 cursor-pointer"
                onClick={() => showEducation(
                  'S&P 500 Index',
                  `The S&P 500 (${stockMarkets.indices.sp500.toLocaleString()}) represents the broad US stock market, tracking 500 large-cap companies.

📊 Current Level: ${stockMarkets.indices.sp500.toLocaleString()}
🏢 Components: 500 largest publicly traded companies
📈 Type: Market-cap weighted index (larger companies have more influence)

Austrian Perspective on Stock Market Bubbles:
• Artificial Credit Expansion: When the Federal Reserve keeps interest rates artificially low (below the natural rate determined by time preferences), it creates unsustainable asset bubbles. Capital flows into stocks because bonds offer inadequate returns.

• Malinvestment: Low rates signal that society has increased savings and can support longer production processes. But if rates are artificially lowered without real savings increasing, this creates malinvestment - capital allocated to projects that cannot be sustained.

• Time Preference Distortion: Stock valuations are based on discounted future earnings. Artificially low discount rates make distant future earnings appear more valuable today, inflating current stock prices beyond their true worth.

• Inevitable Correction: "The boom produces impoverishment. But still more disastrous are its moral ravages. It makes people despondent and dispirited. The more optimistic they were under the illusory prosperity of the boom, the greater is their despair and their feeling of frustration." - Ludwig von Mises`,
                  [
                    {
                      name: 'Yahoo Finance S&P 500 API',
                      url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC',
                      description: 'Real-time S&P 500 index data'
                    },
                    {
                      name: 'S&P Global Official Index',
                      url: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/',
                      description: 'Official S&P 500 methodology and constituents'
                    },
                    {
                      name: 'FRED: Fed Funds Rate',
                      url: 'https://fred.stlouisfed.org/series/FEDFUNDS',
                      description: 'Track the Federal Reserve interest rate driving stock bubbles'
                    }
                  ]
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏢</span>
                  <h3 className="text-xs font-medium text-purple-300 uppercase tracking-wider">S&P 500</h3>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stockMarkets.indices.sp500.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-2">Broad Market Index</div>
              </div>

              <div 
                className="bg-gradient-to-br from-cyan-900/30 to-slate-800/40 border border-cyan-600/50 rounded-xl p-4 backdrop-blur-sm hover:border-cyan-500/80 transition-all transform hover:scale-105 cursor-pointer"
                onClick={() => showEducation(
                  'NASDAQ Composite',
                  `The NASDAQ (${stockMarkets.indices.nasdaq.toLocaleString()}) is technology-heavy, tracking over 3,000 stocks listed on the NASDAQ exchange.

📊 Current Level: ${stockMarkets.indices.nasdaq.toLocaleString()}
💻 Focus: Technology, internet, and growth companies
📈 Type: Market-cap weighted with technology emphasis

Austrian Capital Theory and Technology Stocks:
• Longer Production Processes: Tech stocks represent LONGER, more capital-intensive production processes. Building software platforms, semiconductor fabs, or AI infrastructure requires years of upfront investment before generating returns.

• Highest Sensitivity to Credit: Austrian Business Cycle Theory (Eugen von Böhm-Bawerk's capital theory) predicts longer production processes are MOST vulnerable to credit expansion distortions. When artificially low interest rates make long-term projects appear profitable, capital floods into tech.

• Structure of Production: Technology companies operate in the "higher-order" stages of production (furthest from consumption). These are the first to boom during easy money and the first to bust when credit contracts.

• Violent Reversals: When interest rates normalize or credit contracts, tech stocks crash hardest. We saw this in the 2000 dot-com bust (NASDAQ fell 78% from peak) and 2022 tech selloff when the Fed raised rates.

"The boom squanders through malinvestment scarce factors of production and reduces the stock available through overconsumption; its alleged blessings are paid for by impoverishment." - Ludwig von Mises`,
                  [
                    {
                      name: 'Yahoo Finance NASDAQ API',
                      url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC',
                      description: 'Real-time NASDAQ Composite index data'
                    },
                    {
                      name: 'NASDAQ Official',
                      url: 'https://www.nasdaq.com/market-activity/index/comp',
                      description: 'Official NASDAQ Composite components and data'
                    },
                    {
                      name: 'Böhm-Bawerk: Capital Theory',
                      url: 'https://mises.org/library/capital-and-interest-0',
                      description: 'Original Austrian capital theory explaining technology vulnerability'
                    }
                  ]
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💻</span>
                  <h3 className="text-xs font-medium text-cyan-300 uppercase tracking-wider">NASDAQ</h3>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stockMarkets.indices.nasdaq.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-2">Technology Focus</div>
              </div>

              <div 
                className={`bg-gradient-to-br to-slate-800/40 border rounded-xl p-4 backdrop-blur-sm hover:border-opacity-80 transition-all transform hover:scale-105 cursor-pointer ${
                  stockMarkets.volatility.vix < 12 
                    ? 'from-red-900/30 border-red-600/50 hover:border-red-500/80' 
                    : stockMarkets.volatility.vix < 20 
                    ? 'from-yellow-900/30 border-yellow-600/50 hover:border-yellow-500/80'
                    : 'from-green-900/30 border-green-600/50 hover:border-green-500/80'
                }`}
                onClick={() => showEducation(
                  'VIX Fear Index',
                  `The VIX (${stockMarkets.volatility.vix.toFixed(1)}) measures expected market volatility over the next 30 days, often called the "Fear Index."

📊 Current VIX: ${stockMarkets.volatility.vix.toFixed(1)}
⚡ Interpretation: ${stockMarkets.volatility.interpretation.replace(/_/g, ' ')}
⚠️ Austrian Warning: ${stockMarkets.volatility.austrian_warning}

VIX Levels Explained:
• VIX < 12: EXTREME complacency - Late-boom euphoria, investors don't see risk
• VIX 12-20: MODERATE fear - Normal market conditions
• VIX 20-30: ELEVATED fear - Uncertainty increasing
• VIX > 30: PANIC - Crisis/bust phase, liquidation happening

Austrian Business Cycle Interpretation:
• Low VIX During Boom: Artificially low interest rates create complacency. Investors believe the Fed "has their back" and won't let markets fall (moral hazard). This is precisely when Austrians warn risk is highest.

• Mises on Boom Psychology: "The boom produces impoverishment. But still more disastrous are its moral ravages. It makes people despondent and dispirited. The more optimistic they were under the illusory prosperity of the boom, the greater is their despair."

• High VIX During Bust: When reality reasserts itself and malinvestments become evident, panic ensues. VIX spikes mark the liquidation phase where unsustainable projects fail and capital reallocates.

• Contrary Indicator: Austrian economists view LOW VIX as DANGEROUS (everyone complacent before crash) and HIGH VIX as potential opportunity (market recognizing real risks).`,
                  [
                    {
                      name: 'Yahoo Finance VIX API',
                      url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX',
                      description: 'Real-time VIX volatility index data'
                    },
                    {
                      name: 'CBOE VIX Official',
                      url: 'https://www.cboe.com/tradable_products/vix/',
                      description: 'Official VIX methodology and historical data'
                    },
                    {
                      name: 'Mises on Market Psychology',
                      url: 'https://mises.org/library/causes-economic-crisis-and-other-essays-and-addresses',
                      description: 'Austrian analysis of boom-bust psychology'
                    }
                  ]
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <h3 className={`text-xs font-medium uppercase tracking-wider ${
                    stockMarkets.volatility.vix < 12 ? 'text-red-300' : 
                    stockMarkets.volatility.vix < 20 ? 'text-yellow-300' : 'text-green-300'
                  }`}>VIX (Fear Index)</h3>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stockMarkets.volatility.vix.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {stockMarkets.volatility.interpretation.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {/* Austrian Market Analysis Panel */}
            <div className="bg-gradient-to-br from-orange-900/30 via-slate-800/40 to-purple-900/30 border border-orange-600/50 rounded-xl p-6 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                <span>🏛️</span>
                Austrian Business Cycle Analysis of Stock Markets
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* VIX Warning */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                    <span>⚠️</span> Market Psychology Indicator
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>VIX at {stockMarkets.volatility.vix.toFixed(1)}:</strong> {stockMarkets.volatility.austrian_warning}
                  </p>
                  {stockMarkets.austrian_analysis.boom_psychology && (
                    <p className="text-xs text-red-400 mt-2 font-semibold">
                      ⚠️ BOOM PSYCHOLOGY DETECTED - Classic pre-bust complacency
                    </p>
                  )}
                </div>

                {/* Speculation Indicator */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                    <span>🎲</span> Speculation Level
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Current speculation: <strong className={
                      stockMarkets.austrian_analysis.speculation_indicator === 'HIGH' ? 'text-red-400' :
                      stockMarkets.austrian_analysis.speculation_indicator === 'MODERATE' ? 'text-yellow-400' : 'text-green-400'
                    }>{stockMarkets.austrian_analysis.speculation_indicator}</strong>
                    <br />
                    {stockMarkets.austrian_analysis.speculation_indicator === 'HIGH' 
                      ? 'Extreme risk-taking typical of late-boom phases. Austrian theory warns this precedes bust.'
                      : stockMarkets.austrian_analysis.speculation_indicator === 'MODERATE'
                      ? 'Moderate speculation levels. Monitor for acceleration.'
                      : 'Healthy caution in markets. Bust psychology or early recovery.'}
                  </p>
                </div>

                {/* Credit Expansion Link */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <span>💰</span> Credit → Stock Price Link
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Austrian theory: Artificially low interest rates (Fed Funds {market?.interest_rates?.fed_funds?.toFixed(2) || 'N/A'}% 
                    vs Natural {market?.interest_rates?.natural_rate_estimate?.toFixed(2) || 'N/A'}%) push investors into stocks seeking yields. 
                    This inflates stock prices beyond fundamentals. When credit expansion reverses, stock prices crash.
                  </p>
                </div>

                {/* Market Breadth */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                    <span>📊</span> Market Breadth
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Russell 2000 (small caps): {stockMarkets.indices.russell2000?.toLocaleString() || 'N/A'}
                    <br />
                    Breadth: <strong>{stockMarkets.austrian_analysis.market_breadth}</strong>
                    <br />
                    {stockMarkets.austrian_analysis.market_breadth === 'BROAD' 
                      ? 'Speculation reaching small caps - typical boom-phase risk appetite.'
                      : 'Flight to quality (large caps) - caution or early bust signals.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Market Breadth Analysis - Enhanced Component */}
            {stockMarkets.indices.russell2000 && stockMarkets.indices.sp500 && (
              <motion.div 
                className="mt-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border rounded-xl p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden"
                style={{
                  borderColor: (() => {
                    const ratio = stockMarkets.indices.russell2000 / stockMarkets.indices.sp500;
                    if (ratio > 0.45) return 'rgba(239, 68, 68, 0.6)';  // red for high speculation
                    if (ratio > 0.40) return 'rgba(251, 191, 36, 0.6)'; // yellow for moderate
                    return 'rgba(34, 197, 94, 0.6)';  // green for cautious
                  })()
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {/* Background Glow Effect */}
                <div 
                  className="absolute inset-0 opacity-20 blur-3xl"
                  style={{
                    background: (() => {
                      const ratio = stockMarkets.indices.russell2000 / stockMarkets.indices.sp500;
                      if (ratio > 0.45) return 'radial-gradient(circle at center, rgba(239, 68, 68, 0.4), transparent)';
                      if (ratio > 0.40) return 'radial-gradient(circle at center, rgba(251, 191, 36, 0.4), transparent)';
                      return 'radial-gradient(circle at center, rgba(34, 197, 94, 0.4), transparent)';
                    })()
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.span 
                        className="text-4xl"
                        animate={{
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        📊
                      </motion.span>
                      <div>
                        <h3 className="text-xl font-bold text-white">Market Breadth Analysis</h3>
                        <p className="text-xs text-slate-400">Russell 2000 vs S&P 500 Ratio - Cycle Phase Indicator</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">
                        {((stockMarkets.indices.russell2000 / stockMarkets.indices.sp500) * 100).toFixed(2)}%
                      </div>
                      <div className={`text-xs font-semibold uppercase tracking-wider ${
                        (() => {
                          const ratio = stockMarkets.indices.russell2000 / stockMarkets.indices.sp500;
                          if (ratio > 0.45) return 'text-red-400';
                          if (ratio > 0.40) return 'text-yellow-400';
                          return 'text-green-400';
                        })()
                      }`}>
                        {(() => {
                          const ratio = stockMarkets.indices.russell2000 / stockMarkets.indices.sp500;
                          if (ratio > 0.45) return 'HIGH SPECULATION';
                          if (ratio > 0.40) return 'MODERATE RISK';
                          return 'FLIGHT TO QUALITY';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Index Values */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-950/50 rounded-lg p-3 border border-blue-600/30">
                      <div className="text-xs text-blue-300 mb-1 font-semibold">S&P 500 (Large Caps)</div>
                      <div className="text-2xl font-bold text-white">{stockMarkets.indices.sp500.toLocaleString()}</div>
                      <div className="text-xs text-slate-400 mt-1">Established companies</div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-3 border border-purple-600/30">
                      <div className="text-xs text-purple-300 mb-1 font-semibold">Russell 2000 (Small Caps)</div>
                      <div className="text-2xl font-bold text-white">{stockMarkets.indices.russell2000.toLocaleString()}</div>
                      <div className="text-xs text-slate-400 mt-1">Speculative ventures</div>
                    </div>
                  </div>

                  {/* Ratio Gauge Visualization */}
                  <div className="mb-4">
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                      {/* Background gradient zones */}
                      <div className="absolute inset-0 flex">
                        <div className="flex-[35] bg-gradient-to-r from-green-600 to-green-500"></div>
                        <div className="flex-[5] bg-gradient-to-r from-yellow-600 to-yellow-500"></div>
                        <div className="flex-[10] bg-gradient-to-r from-red-600 to-red-700"></div>
                      </div>
                      {/* Ratio indicator position */}
                      <motion.div 
                        className="absolute top-0 h-full w-1.5 bg-white shadow-lg z-10"
                        style={{ 
                          left: `${Math.min(((stockMarkets.indices.russell2000 / stockMarkets.indices.sp500) / 0.50) * 100, 100)}%` 
                        }}
                        initial={{ left: 0 }}
                        animate={{ 
                          left: `${Math.min(((stockMarkets.indices.russell2000 / stockMarkets.indices.sp500) / 0.50) * 100, 100)}%` 
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                      <span className="text-green-400">0.30</span>
                      <span className="text-yellow-400">0.40</span>
                      <span className="text-red-400">0.45</span>
                      <span>0.50+</span>
                    </div>
                  </div>

                  {/* Austrian Interpretation */}
                  <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                      <span>🏛️</span> Austrian Business Cycle Interpretation
                    </h4>
                    
                    {(() => {
                      const ratio = stockMarkets.indices.russell2000 / stockMarkets.indices.sp500;
                      
                      if (ratio > 0.45) {
                        return (
                          <>
                            <p className="text-sm text-red-300 font-semibold mb-2">
                              🚨 DANGER: Peak Speculation Phase
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed mb-3">
                              Small caps outperforming large caps indicates <strong className="text-white">extreme risk appetite</strong>. 
                              Austrian theory: When artificially cheap credit floods markets, speculation reaches even the most 
                              marginal enterprises. This is a classic late-boom signal.
                            </p>
                            <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                              <p className="text-xs text-slate-300 leading-relaxed italic">
                                "The boom can last only as long as the credit expansion progresses at an ever-accelerated pace. 
                                The boom comes to an end as soon as additional quantities of fiduciary media are no longer thrown 
                                upon the loan market." - <strong className="text-red-300">Ludwig von Mises</strong>
                              </p>
                            </div>
                          </>
                        );
                      } else if (ratio > 0.40) {
                        return (
                          <>
                            <p className="text-sm text-yellow-300 font-semibold mb-2">
                              ⚠️ CAUTION: Moderate Speculation
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              Small caps showing strength relative to large caps. Risk appetite is present but not extreme. 
                              Monitor for acceleration toward dangerous levels ({'>'}0.45 ratio).
                            </p>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <p className="text-sm text-green-300 font-semibold mb-2">
                              ✅ HEALTHY: Flight to Quality Active
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed mb-3">
                              Large caps outperforming small caps indicates <strong className="text-white">risk aversion</strong>. 
                              Investors fleeing speculative ventures for established companies. This suggests either:
                            </p>
                            <ul className="text-xs text-slate-300 space-y-1 ml-4">
                              <li>• <strong className="text-green-300">Bust phase:</strong> Malinvestments liquidating, capital seeking safety</li>
                              <li>• <strong className="text-green-300">Early recovery:</strong> Cautious rebuilding after previous bust</li>
                              <li>• <strong className="text-green-300">Healthy skepticism:</strong> Markets not yet distorted by credit expansion</li>
                            </ul>
                          </>
                        );
                      }
                    })()}

                    {/* Educational Context */}
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <h5 className="text-xs font-semibold text-slate-400 mb-2">Why This Matters (Austrian Capital Theory):</h5>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
                          <span>📈</span>
                          <div>
                            <strong className="text-white">Small Caps = Higher-Order Production:</strong>
                            <span className="text-slate-400"> Small companies are further from final consumption, more vulnerable to credit cycle changes</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
                          <span>💰</span>
                          <div>
                            <strong className="text-white">Credit Expansion Effect:</strong>
                            <span className="text-slate-400"> Artificially low rates make marginal projects appear profitable, flooding small caps with capital</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-slate-900/50 rounded">
                          <span>⚡</span>
                          <div>
                            <strong className="text-white">Bust Reversal:</strong>
                            <span className="text-slate-400"> When credit contracts, small caps collapse first and hardest as malinvestments liquidate</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Credit Expansion Tracker */}
        {analysis && (
          <motion.div 
            className="mt-8 bg-gradient-to-br from-red-900/20 to-orange-900/20 border-2 border-red-600/40 rounded-xl p-6 backdrop-blur-sm shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">💸</span>
              <div>
                <h3 className="text-2xl font-bold text-white">Credit Expansion Tracker</h3>
                <p className="text-sm text-slate-400">M2 Money Supply Growth vs Economic Output</p>
              </div>
            </div>

            {/* Boom-Bust Cycle Gauge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold text-red-400">
                    {((analysis?.monetary_metrics?.m2_growth_rate || 0.08) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Annual M2 Growth Rate</div>
                </div>
                
                {/* Circular gauge */}
                <div className="relative w-40 h-40 mx-auto">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(51, 65, 85)" strokeWidth="8"/>
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="rgb(239, 68, 68)" 
                      strokeWidth="8"
                      strokeDasharray={`${Math.min(((analysis?.monetary_metrics?.m2_growth_rate || 0.08) * 100 / 15) * 283, 283)} 283`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Danger</div>
                      <div className="text-xs text-slate-400">Zone</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>0%</span>
                  <span>Sustainable</span>
                  <span>15%</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">GDP Growth Rate</span>
                    <span className="text-lg font-bold text-green-400">
                      3.0%
                    </span>
                  </div>
                </div>
                
                <div className="bg-slate-900/60 rounded-lg p-3 border border-red-600/40">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Credit Excess</span>
                    <span className="text-lg font-bold text-red-400">
                      {(((analysis?.monetary_metrics?.m2_growth_rate || 0.08) - 0.03) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Money creation beyond real growth</div>
                </div>

                <div className={`rounded-lg p-3 border ${
                  (analysis?.monetary_metrics?.m2_growth_rate || 0) > 0.10 
                    ? 'bg-red-900/40 border-red-600' 
                    : 'bg-yellow-900/40 border-yellow-600'
                }`}>
                  <div className="text-xs font-semibold mb-1">
                    {(analysis?.monetary_metrics?.m2_growth_rate || 0) > 0.10 
                      ? '⚠️ BOOM PHASE WARNING' 
                      : '⚡ CREDIT EXPANSION ACTIVE'}
                  </div>
                  <div className="text-xs text-slate-300">
                    {(analysis?.monetary_metrics?.m2_growth_rate || 0) > 0.10 
                      ? 'Artificial credit expansion is distorting capital structure'
                      : 'Monitor for malinvestment in higher-order production'}
                  </div>
                </div>
              </div>
            </div>

            {/* Rothbard Education */}
            <div className="bg-slate-900/40 rounded-lg p-4 border border-orange-600/30">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📚</span>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-orange-300 mb-2">Austrian Business Cycle Theory</h4>
                  <p className="text-xs text-slate-400 mb-3 italic">
                    "The boom squanders through malinvestment scarce factors of production and reduces the stock available through overconsumption; its alleged blessings are paid for by impoverishment."
                    <span className="block mt-1 text-orange-400">— Murray Rothbard</span>
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-red-400 font-bold">1.</span>
                      <span className="text-slate-300">Central banks expand money supply beyond savings</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-red-400 font-bold">2.</span>
                      <span className="text-slate-300">Interest rates fall below natural rate, distorting time preferences</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-red-400 font-bold">3.</span>
                      <span className="text-slate-300">Entrepreneurs overinvest in capital-intensive projects (malinvestment)</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-red-400 font-bold">4.</span>
                      <span className="text-slate-300">Unsustainable boom must correct through liquidation (bust)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Yield Curve Inversion Alert */}
        {analysis && (
          <motion.div 
            className="mt-8 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-2 border-purple-600/40 rounded-xl p-6 backdrop-blur-sm shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📉</span>
              <div>
                <h3 className="text-2xl font-bold text-white">Yield Curve Status</h3>
                <p className="text-sm text-slate-400">2Y/10Y Treasury Spread - Recession Warning System</p>
              </div>
            </div>

            {(() => {
              const treasury2y = 4.8;
              const treasury10y = 4.5;
              const spread2y10y = treasury10y - treasury2y;
              const isInverted = spread2y10y < 0;
              const severity = Math.abs(spread2y10y);

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                    <div className="text-center mb-3">
                      <div className={`text-5xl font-bold ${isInverted ? 'text-red-400' : 'text-green-400'}`}>
                        {spread2y10y > 0 ? '+' : ''}{(spread2y10y * 100).toFixed(0)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Basis Points Spread</div>
                    </div>
                    
                    {/* Visual spread indicator */}
                    <div className="relative h-32 bg-slate-800 rounded-lg overflow-hidden mb-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-1 bg-slate-600"/>
                        <div className="absolute left-1/2 w-0.5 h-full bg-slate-500 transform -translate-x-1/2"/>
                      </div>
                      
                      {/* 2Y marker */}
                      <div 
                        className="absolute left-1/4 transform -translate-x-1/2 transition-all duration-1000"
                        style={{ 
                          top: `${50 - treasury2y * 8}%`
                        }}
                      >
                        <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"/>
                        <div className="text-xs text-blue-400 whitespace-nowrap ml-4">2Y</div>
                      </div>
                      
                      {/* 10Y marker */}
                      <div 
                        className="absolute left-3/4 transform -translate-x-1/2 transition-all duration-1000"
                        style={{ 
                          top: `${50 - treasury10y * 8}%`
                        }}
                      >
                        <div className="w-3 h-3 bg-purple-500 rounded-full border-2 border-white"/>
                        <div className="text-xs text-purple-400 whitespace-nowrap ml-4">10Y</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">2-Year Treasury:</span>
                        <span className="text-blue-400 font-bold">{(treasury2y * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">10-Year Treasury:</span>
                        <span className="text-purple-400 font-bold">{(treasury10y * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className={`rounded-lg p-4 border-2 ${
                      isInverted 
                        ? 'bg-red-900/40 border-red-600' 
                        : 'bg-green-900/40 border-green-600'
                    }`}>
                      <div className="text-lg font-bold mb-2">
                        {isInverted ? '🚨 INVERTED' : '✅ NORMAL'}
                      </div>
                      <div className="text-sm text-slate-300 mb-3">
                        {isInverted 
                          ? `Curve inverted by ${(severity * 100).toFixed(0)} basis points`
                          : `Positive slope of ${(severity * 100).toFixed(0)} basis points`}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isInverted 
                          ? 'Historical accuracy: ~80% recession predictor within 12-18 months'
                          : 'Healthy term premium indicates normal credit market conditions'}
                      </div>
                    </div>

                    {/* Austrian interpretation */}
                    <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                      <h4 className="text-xs font-bold text-orange-300 mb-2">Austrian Capital Theory:</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isInverted 
                          ? 'Inversion signals capital misallocation. Central bank manipulation has distorted time preferences, causing entrepreneurs to overextend into long-term projects without sufficient savings. The structure of production must correct.'
                          : 'Normal curve reflects genuine time preference. Longer-term investments require higher yields to compensate for uncertainty and delayed consumption, as Austrian theory predicts.'}
                      </p>
                    </div>

                    {/* Historical context */}
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700">
                      <div className="text-xs font-semibold text-slate-300 mb-2">📊 Historical Inversions:</div>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div>• 2006: Inverted before 2008 crisis</div>
                        <div>• 2000: Preceded dot-com bust</div>
                        <div>• 1989: Warned of S&L crisis</div>
                        <div>• 1980: Signaled double-dip recession</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Bitcoin Halving Economics */}
        {analysis && (
          <motion.div 
            className="mt-8 bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border-2 border-orange-600/40 rounded-xl p-6 backdrop-blur-sm shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">₿</span>
              <div>
                <h3 className="text-2xl font-bold text-white">Bitcoin Halving Countdown</h3>
                <p className="text-sm text-slate-400">Programmatic Scarcity & Time Preference</p>
              </div>
            </div>

            {(() => {
              const nextHalving = new Date('2028-04-20');
              const now = new Date();
              const diffTime = nextHalving.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const currentReward = 3.125;
              const nextReward = currentReward / 2;
              const currentInflation = ((currentReward * 6 * 24 * 365) / 19800000) * 100;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Countdown */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-orange-600/40">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-orange-400 mb-2">
                          {diffDays.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">Days Until Next Halving</div>
                        <div className="text-xs text-slate-500 mt-2">
                          Estimated: April 20, 2028 (Block 1,050,000)
                        </div>
                      </div>
                    </div>

                    {/* Supply reduction */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Current Reward:</span>
                          <span className="text-lg font-bold text-white">{currentReward} BTC</span>
                        </div>
                        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 w-1/2"/>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Next Reward:</span>
                          <span className="text-lg font-bold text-orange-400">{nextReward.toFixed(4)} BTC</span>
                        </div>
                      </div>
                    </div>

                    {/* Inflation rate */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">Current Inflation Rate:</span>
                        <span className="text-lg font-bold text-green-400">{currentInflation.toFixed(2)}%</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        After halving: ~{(currentInflation / 2).toFixed(2)}% (lower than gold)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Austrian time preference */}
                    <div className="bg-slate-900/40 rounded-lg p-4 border border-orange-600/30">
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-xl">⏰</span>
                        <div>
                          <h4 className="text-sm font-bold text-orange-300 mb-1">Time Preference & Scarcity</h4>
                          <p className="text-xs text-slate-400 italic mb-2">
                            "The essence of money is time preference."
                            <span className="block mt-1 text-orange-400">— Ludwig von Mises</span>
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-slate-300">
                        <p>Bitcoin's programmatic halvings enforce absolute scarcity, making it the hardest money in history.</p>
                        <p>Unlike fiat currencies subject to political time preferences, Bitcoin's supply schedule is immutable.</p>
                        <p>Each halving increases stock-to-flow ratio, making Bitcoin more sound than gold.</p>
                      </div>
                    </div>

                    {/* Historical halvings */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-sm font-bold text-slate-300 mb-3">📈 Historical Halving Impact:</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <span className="text-slate-400">2012 (50→25 BTC):</span>
                          <span className="text-green-400 font-bold">+8,000% following year</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <span className="text-slate-400">2016 (25→12.5 BTC):</span>
                          <span className="text-green-400 font-bold">+2,900% following year</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <span className="text-slate-400">2020 (12.5→6.25 BTC):</span>
                          <span className="text-green-400 font-bold">+560% following year</span>
                        </div>
                      </div>
                    </div>

                    {/* Comparison to fiat */}
                    <div className="bg-red-900/20 rounded-lg p-3 border border-red-600/30">
                      <div className="text-xs font-semibold text-red-300 mb-1">💸 vs Fiat Currency:</div>
                      <div className="text-xs text-slate-400">
                        While Bitcoin cuts supply growth in half every 4 years, the US Dollar M2 supply grew 40% in 2020-2021 alone. This is precisely the monetary debasement Austrians warned against.
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Real Estate Bubble Meter */}
        {analysis && (
          <motion.div 
            className="mt-8 bg-gradient-to-br from-cyan-900/20 to-teal-900/20 border-2 border-cyan-600/40 rounded-xl p-6 backdrop-blur-sm shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🏠</span>
              <div>
                <h3 className="text-2xl font-bold text-white">Real Estate Bubble Meter</h3>
                <p className="text-sm text-slate-400">Housing Affordability & Capital Misallocation</p>
              </div>
            </div>

            {(() => {
              const priceToIncome = 5.2;
              const mortgageRate = 7.0;
              const historicalAverage = 3.8;
              const bubbleLevel = ((priceToIncome / historicalAverage) - 1) * 100;
              const isBubble = priceToIncome > 4.5;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Price to income gauge */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <div className="text-center mb-3">
                        <div className={`text-5xl font-bold ${isBubble ? 'text-red-400' : 'text-yellow-400'}`}>
                          {priceToIncome.toFixed(1)}x
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Median Home Price to Income Ratio</div>
                      </div>
                      
                      <div className="relative h-24 bg-slate-800 rounded-lg overflow-hidden mb-3">
                        <div className="absolute inset-0 flex items-end">
                          {/* Historical average bar */}
                          <div className="absolute left-1/4 bottom-0 w-12 bg-green-500/30 border-t-2 border-green-500" style={{ height: `${(historicalAverage / 7) * 100}%` }}>
                            <div className="absolute -top-6 left-0 right-0 text-center text-xs text-green-400">
                              {historicalAverage}x
                            </div>
                          </div>
                          {/* Current bar */}
                          <div className="absolute left-2/3 bottom-0 w-12 bg-red-500/50 border-t-2 border-red-500" style={{ height: `${(priceToIncome / 7) * 100}%` }}>
                            <div className="absolute -top-6 left-0 right-0 text-center text-xs text-red-400">
                              Now
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Historical Avg: {historicalAverage}x</span>
                        <span className={isBubble ? 'text-red-400 font-bold' : 'text-yellow-400'}>
                          {isBubble ? '+' : ''}{bubbleLevel.toFixed(0)}% above average
                        </span>
                      </div>
                    </div>

                    {/* Mortgage rate impact */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">30Y Mortgage Rate:</span>
                          <span className="text-2xl font-bold text-cyan-400">{mortgageRate.toFixed(2)}%</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Monthly payment on $400k home: ~${(400000 * (mortgageRate / 100 / 12) * Math.pow(1 + (mortgageRate / 100 / 12), 360) / (Math.pow(1 + (mortgageRate / 100 / 12), 360) - 1)).toFixed(0)}
                        </div>
                        <div className={`text-xs p-2 rounded ${mortgageRate > 6 ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                          {mortgageRate > 6 ? '⚠️ Affordability crisis' : '✓ Relatively affordable'}
                        </div>
                      </div>
                    </div>

                    {/* Bubble indicator */}
                    <div className={`rounded-lg p-4 border-2 ${
                      isBubble 
                        ? 'bg-red-900/40 border-red-600' 
                        : 'bg-yellow-900/40 border-yellow-600'
                    }`}>
                      <div className="text-lg font-bold mb-1">
                        {isBubble ? '🔴 BUBBLE TERRITORY' : '🟡 ELEVATED PRICES'}
                      </div>
                      <div className="text-xs text-slate-300">
                        {isBubble 
                          ? 'Prices significantly detached from incomes. Historical precedent suggests correction ahead.'
                          : 'Prices above historical norms but not yet in extreme bubble territory.'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Austrian capital theory */}
                    <div className="bg-slate-900/40 rounded-lg p-4 border border-cyan-600/30">
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-xl">🏛️</span>
                        <div>
                          <h4 className="text-sm font-bold text-cyan-300 mb-1">Austrian Capital Theory Applied</h4>
                          <p className="text-xs text-slate-400 italic mb-2">
                            "The boom is called good business, prosperity, and upswing. Its unavoidable aftermath, the readjustment of conditions to reality, is called crisis, slump, bad business, depression."
                            <span className="block mt-1 text-cyan-400">— Ludwig von Mises</span>
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-slate-300">
                        <p><strong className="text-white">Malinvestment in Housing:</strong> Artificially low interest rates make long-term housing investments appear profitable.</p>
                        <p><strong className="text-white">Credit-Fueled Demand:</strong> Easy mortgage credit bids up prices beyond what real savings would support.</p>
                        <p><strong className="text-white">Inevitable Correction:</strong> When credit contracts or rates normalize, prices must adjust to reflect true affordability.</p>
                      </div>
                    </div>

                    {/* Historical bubbles */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-sm font-bold text-slate-300 mb-3">🏠 Historical Housing Bubbles:</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <div>
                            <div className="text-slate-300 font-semibold">2008 Crash</div>
                            <div className="text-slate-500">Peak ratio: 5.5x</div>
                          </div>
                          <span className="text-red-400 font-bold">-33% decline</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <div>
                            <div className="text-slate-300 font-semibold">1989 Correction</div>
                            <div className="text-slate-500">S&L crisis trigger</div>
                          </div>
                          <span className="text-red-400 font-bold">-20% decline</span>
                        </div>
                      </div>
                    </div>

                    {/* Investment implications */}
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-sm font-bold text-slate-300 mb-2">💡 Strategic Implications:</h4>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex items-start gap-2">
                          <span>•</span>
                          <span>High price-to-income ratios signal overvaluation</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>•</span>
                          <span>Rising rates reduce affordability, pressure prices</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>•</span>
                          <span>Real estate is sensitive to credit cycle changes</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>•</span>
                          <span>Consider cash position and wait for better entry</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Market Overview - Commodities */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="text-4xl"
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              💹
            </motion.span>
            <h2 
              className="text-3xl font-bold"
              style={{
                fontFamily: templeTheme.typography.fonts.heading,
                color: templeTheme.colors.marbleWhite
              }}
            >
              Commodity Markets
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MarketCard
              title="Oil (WTI)"
              value={`$${(market?.commodities?.oil || 0).toFixed(2)}/bbl`}
              icon="�️"
              description="Crude oil reflects energy costs"
            />
            <MarketCard
              title="Copper"
              value={`$${(market?.commodities?.copper || 0).toFixed(2)}/lb`}
              icon="�"
              description="Dr. Copper - Economic indicator"
            />
            <MarketCard
              title="Bitcoin Hashrate"
              value={`${(market?.bitcoin?.hash_rate || 0).toFixed(0)} EH/s`}
              icon="⚡"
              description="Network security measure"
            />
          </div>
        </motion.div>

        {/* Austrian Interpretation with Context-Aware Insights */}
        <motion.div 
          className="bg-gradient-to-br from-blue-900/30 via-slate-800/40 to-purple-900/30 border border-blue-600/50 rounded-xl p-6 backdrop-blur-sm shadow-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 
            className="text-2xl font-bold mb-4 flex items-center gap-3"
            style={{
              fontFamily: templeTheme.typography.fonts.heading,
              color: templeTheme.colors.austrianGold
            }}
          >
            <motion.span 
              className="text-4xl"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              📖
            </motion.span>
            Austrian Economics Interpretation
          </h2>
          
          {/* Dynamic Cycle Analysis */}
          <div className="bg-slate-900/50 rounded-lg p-5 mb-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-3">Current Cycle Phase: {cyclePhase}</h3>
            <p className="text-slate-200 leading-relaxed text-base mb-3">
              {cycleData?.narrative || getAustrianNarrative(cyclePhase, overallRisk)}
            </p>
            
            {/* Context-specific insights based on actual values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Interest Rate Analysis */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                  <span>�</span> Interest Rate Distortion
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {market?.interest_rates?.fed_funds && market?.interest_rates?.natural_rate_estimate ? (
                    market.interest_rates.fed_funds > market.interest_rates.natural_rate_estimate ? (
                      `Fed Funds (${market.interest_rates.fed_funds.toFixed(2)}%) is ABOVE the natural rate estimate (${market.interest_rates.natural_rate_estimate.toFixed(2)}%). This tight monetary policy may trigger the bust phase of the Austrian Business Cycle.`
                    ) : (
                      `Fed Funds (${market.interest_rates.fed_funds.toFixed(2)}%) is BELOW the natural rate estimate (${market.interest_rates.natural_rate_estimate.toFixed(2)}%). Artificial credit expansion is fueling malinvestment in the structure of production.`
                    )
                  ) : 'Monitoring interest rate spread for signs of credit expansion.'}
                </p>
              </div>

              {/* Credit Market Analysis */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <span>📊</span> Credit Market Distortion
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis?.risk_levels?.credit_markets ? (
                    analysis.risk_levels.credit_markets >= 7 ? (
                      `SEVERE RISK (${analysis.risk_levels.credit_markets.toFixed(1)}/10): Credit markets show extreme distortion. Unsustainable lending practices indicate late-stage boom. Austrian theory predicts imminent bust.`
                    ) : analysis.risk_levels.credit_markets >= 5 ? (
                      `ELEVATED RISK (${analysis.risk_levels.credit_markets.toFixed(1)}/10): Credit expansion is creating malinvestment. Resources are being misallocated into longer-term projects that won't be completed.`
                    ) : (
                      `MODERATE (${analysis.risk_levels.credit_markets.toFixed(1)}/10): Credit markets show manageable distortion. Continue monitoring for signs of unsustainable lending.`
                    )
                  ) : 'Analyzing credit market conditions for Austrian cycle indicators.'}
                </p>
              </div>

              {/* Malinvestment Index */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <span>🏗️</span> Production Structure
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis?.indicators?.malinvestment_index ? (
                    analysis.indicators.malinvestment_index >= 6 ? (
                      `CRITICAL (${analysis.indicators.malinvestment_index.toFixed(1)}/10): Severe capital misallocation detected. Boom-era investments in roundabout production methods are unsustainable. Expect painful restructuring.`
                    ) : (
                      `MONITORING (${analysis.indicators.malinvestment_index.toFixed(1)}/10): Production structure showing some distortion from artificial credit. Watch for lengthening of production processes.`
                    )
                  ) : 'Tracking capital allocation in the production structure.'}
                </p>
              </div>

              {/* Money Supply Growth */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <span>💵</span> Money Supply Expansion
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis?.monetary_metrics?.m2_growth_rate ? (
                    analysis.monetary_metrics.m2_growth_rate >= 8 ? (
                      `EXCESSIVE (${analysis.monetary_metrics.m2_growth_rate.toFixed(1)}% annual): Rapid M2 growth is inflating asset prices and creating the boom. This cannot continue indefinitely - purchasing power will be eroded.`
                    ) : analysis.monetary_metrics.m2_growth_rate >= 5 ? (
                      `ELEVATED (${analysis.monetary_metrics.m2_growth_rate.toFixed(1)}% annual): M2 growth exceeds healthy levels. Cantillon effects benefiting those closest to new money creation.`
                    ) : (
                      `STABLE (${analysis.monetary_metrics.m2_growth_rate.toFixed(1)}% annual): M2 growth is relatively contained, limiting artificial boom dynamics.`
                    )
                  ) : 'Monitoring broad money supply for inflationary pressures.'}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations based on risk levels */}
          {(cycleData?.recommendations && cycleData.recommendations.length > 0) || overallRisk >= 6 ? (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-base font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <span>💡</span>
                Austrian Recommendations:
              </h3>
              <ul className="space-y-2">
                {cycleData?.recommendations ? (
                  cycleData.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-3">
                      <span className="text-blue-500 text-lg">•</span>
                      <span>{rec}</span>
                    </li>
                  ))
                ) : (
                  <>
                    {overallRisk >= 7 && (
                      <>
                        <li className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="text-red-500 text-lg">•</span>
                          <span><strong>CRITICAL:</strong> Hold sound money assets (Bitcoin, Gold) as protection against boom-bust cycle</span>
                        </li>
                        <li className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="text-red-500 text-lg">•</span>
                          <span>Avoid highly leveraged positions and long-term capital projects</span>
                        </li>
                        <li className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="text-red-500 text-lg">•</span>
                          <span>Build cash reserves for opportunities during the inevitable bust phase</span>
                        </li>
                      </>
                    )}
                    {overallRisk >= 5 && overallRisk < 7 && (
                      <>
                        <li className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="text-yellow-500 text-lg">•</span>
                          <span>Increase allocation to sound money (Bitcoin, Gold) as hedge against credit expansion</span>
                        </li>
                        <li className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="text-yellow-500 text-lg">•</span>
                          <span>Be cautious of boom-phase euphoria in asset markets</span>
                        </li>
                        <li className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="text-yellow-500 text-lg">•</span>
                          <span>Monitor for signs of artificial credit expansion reversing</span>
                        </li>
                      </>
                    )}
                    {overallRisk < 5 && (
                      <>
                        <li className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="text-green-500 text-lg">•</span>
                          <span>Continue balanced approach with sound money foundation</span>
                        </li>
                        <li className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="text-green-500 text-lg">•</span>
                          <span>Watch for early warning signs of credit expansion</span>
                        </li>
                      </>
                    )}
                  </>
                )}
              </ul>
            </div>
          ) : null}
        </motion.div>

        {/* Bitcoin Network Metrics - Moved to Bottom */}
        {blockchainStats && (
          <motion.div 
            className="bg-gradient-to-br from-cyan-900/30 via-slate-800/40 to-blue-900/30 border border-cyan-600/50 rounded-xl p-6 backdrop-blur-sm shadow-xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-4xl"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  ⛓️
                </motion.span>
                <h2 
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: templeTheme.typography.fonts.heading,
                    color: templeTheme.colors.bitcoinOrange
                  }}
                >
                  Bitcoin Network Metrics
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${blockchainStats.status === 'live' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                <span className="text-xs text-slate-400">Latest Data</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer transform hover:scale-105"
                onClick={() => showEducation(
                  'Block Height',
                  'The current number of blocks in the Bitcoin blockchain. Each block is mined approximately every 10 minutes. The block height represents the cumulative proof-of-work securing the network. This is Bitcoin\'s unforgeable costliness - the Austrian concept of hard money applied through cryptography and energy expenditure.'
                )}
              >
                <div className="text-sm text-slate-400 mb-2">Block Height</div>
                <div className="text-3xl font-bold text-cyan-400">
                  {blockchainStats.block_height.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-2">Current block</div>
              </div>
              
              <div 
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-green-500/50 transition-all cursor-pointer transform hover:scale-105"
                onClick={() => showEducation(
                  'Network Hashrate',
                  'The total computational power securing the Bitcoin network. Measured in exahashes per second (EH/s). Higher hashrate = more security and harder to attack the network. This represents the real economic cost of maintaining Bitcoin\'s sound money properties - energy and capital invested in mining equipment.'
                )}
              >
                <div className="text-sm text-slate-400 mb-2">Hashrate</div>
                <div className="text-3xl font-bold text-green-400">
                  {(blockchainStats.hashrate / 1e18).toFixed(2)} EH/s
                </div>
                <div className="text-xs text-slate-500 mt-2">Network power</div>
              </div>
              
              <div 
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-yellow-500/50 transition-all cursor-pointer transform hover:scale-105"
                onClick={() => showEducation(
                  'Mempool Size',
                  'Unconfirmed transactions waiting to be included in the next block. A larger mempool typically means higher fees and longer confirmation times. This is Bitcoin\'s free market fee discovery mechanism - no central authority sets prices, only supply and demand.'
                )}
              >
                <div className="text-sm text-slate-400 mb-2">Mempool</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {blockchainStats.mempool.count.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-2">Pending transactions</div>
              </div>
              
              <div 
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-orange-500/50 transition-all cursor-pointer transform hover:scale-105"
                onClick={() => showEducation(
                  'Transaction Fees',
                  'Current recommended fee rates in satoshis per vByte for fast confirmation. Fees fluctuate based on network demand. Unlike fiat systems where fees are set by intermediaries, Bitcoin fees are determined by pure market forces - users bid for limited block space.'
                )}
              >
                <div className="text-sm text-slate-400 mb-2">Fast Fee</div>
                <div className="text-3xl font-bold text-orange-400">
                  {blockchainStats.fees.fastestFee} sat/vB
                </div>
                <div className="text-xs text-slate-500 mt-2">Fastest confirmation</div>
              </div>
            </div>
            
            <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-sm font-semibold text-cyan-400 mb-2">Austrian Sound Money Analysis:</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bitcoin demonstrates the Austrian economic principles of sound money: <strong>Fixed supply</strong> (21M cap prevents inflation), 
                <strong> Proof-of-Work</strong> (unforgeable costliness requires real energy expenditure), <strong>Decentralization</strong> (no central 
                authority can manipulate supply), and <strong>Market-based fees</strong> (no price controls, pure supply/demand). The network hashrate 
                of {(blockchainStats.hashrate / 1e18).toFixed(2)} EH/s represents billions of dollars in capital investment protecting the monetary 
                network - this is how Bitcoin achieves credible commitment to its monetary rules without relying on trusted third parties.
              </p>
            </div>
            
            <div className="mt-4 text-xs text-slate-500 text-center">
              Data from mempool.space • Last Updated: {new Date(blockchainStats.timestamp).toLocaleTimeString()}
            </div>
          </motion.div>
        )}
      </main>

      {/* Educational Modal */}
      {educationalModal.show && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setEducationalModal({ ...educationalModal, show: false })}
        >
          <div 
            className="bg-gradient-to-br from-slate-800 to-slate-900 border border-orange-600/50 rounded-xl p-8 max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl transform scale-100 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-orange-400">{educationalModal.title}</h3>
              <button
                onClick={() => setEducationalModal({ ...educationalModal, show: false })}
                className="text-slate-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-slate-200 leading-relaxed text-lg whitespace-pre-line">
              {educationalModal.content}
            </p>
            
            {/* Data Sources Section */}
            {educationalModal.sources && educationalModal.sources.length > 0 && (
              <div className="mt-6 border-t border-slate-700 pt-6">
                <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Data Sources
                </h4>
                <div className="space-y-2">
                  {educationalModal.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all group border border-slate-700 hover:border-blue-500"
                    >
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <div className="flex-1">
                        <div className="font-semibold text-blue-300 group-hover:text-blue-200 text-sm">{source.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{source.description}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end gap-3">
              {educationalModal.sources && educationalModal.sources.length > 0 && (
                <div className="flex-1 text-xs text-slate-500 italic flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Click links to verify data sources
                </div>
              )}
              <button
                onClick={() => setEducationalModal({ ...educationalModal, show: false })}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thought Leaders Modal */}
      {showThoughtLeadersModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowThoughtLeadersModal(false)}
        >
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-600/50 rounded-xl p-8 max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-purple-400">Austrian Economists & Bitcoin Thought Leaders</h3>
              <button
                onClick={() => setShowThoughtLeadersModal(false)}
                className="text-slate-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-slate-300 text-sm mb-4">Explore the thinkers behind the ideas. Click any card to open their primary works and see how their insights connect to live data on this dashboard.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {thoughtLeaders && Object.values(thoughtLeaders).map((tl: any, idx: number) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 hover:border-purple-500/60 hover:shadow-purple-900/20 transition-all cursor-pointer"
                  onClick={() => {
                    const firstSource = tl.sources?.[0];
                    if (firstSource?.url) window.open(firstSource.url, '_blank');
                  }}
                >
                  <div className="text-lg font-semibold text-slate-200">{tl.name}</div>
                  {tl.role && <div className="text-xs text-slate-400 mb-2">{tl.role}</div>}
                  {tl.core_insight && <div className="text-sm text-slate-300 mb-2">{tl.core_insight}</div>}
                  {tl.quote && <div className="text-xs italic text-slate-400">“{tl.quote}”</div>}
                  {tl.key_works && tl.key_works.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Key Works</div>
                      <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                        {tl.key_works.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowThoughtLeadersModal(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-purple-700/50 bg-slate-900/80 backdrop-blur-md mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
            <div className="font-mono mb-2 md:mb-0">
              Austrian Business Cycle Monitor v{statusData?.version || '0.3.0'}
            </div>
            <div className="flex items-center gap-3">
              <span>Powered by Austrian Economics</span>
              <span>•</span>
              <span>Cypherpunk Values</span>
              <span>•</span>
              <span>Bitcoin Standard</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 🔐 CYPHERPUNK HALL OF FAME - The Heritage Section */}
      <CypherpunkHallOfFame />
    </div>
  );
}

// Enhanced Pillar Card with Expandable Section
interface EnhancedPillarCardProps {
  title: string;
  icon: string;
  status: string;
  riskLevel: string;
  metrics: Record<string, any>;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  educationContent: string;
  onShowEducation: (title: string, content: string) => void;
  explanationKey?: string; // InfoBadge key for inline explanation
}

function EnhancedPillarCard({ 
  title, 
  icon, 
  status, 
  riskLevel, 
  metrics, 
  description, 
  isExpanded,
  onToggle,
  educationContent,
  onShowEducation,
}: EnhancedPillarCardProps) {
  const riskColor = getRiskColor(
    riskLevel === 'high' ? 9 : 
    riskLevel === 'elevated' ? 7 : 
    riskLevel === 'moderate' ? 5 : 3
  );

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm hover:border-orange-500/50 transition-all shadow-xl">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl drop-shadow-lg">{icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {title}
              {/* Inline InfoBadge for this pillar (e.g., Credit Markets) */}
              {/* {explanationKey && (
                <InfoBadge explanationKey={explanationKey} />
              )} */}
            </h3>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        <div className="text-2xl text-slate-400 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </div>
      </div>
      
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2">
          <span className="text-sm text-slate-400">Status</span>
          <span className="text-sm font-semibold text-white capitalize">{status}</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2">
          <span className="text-sm text-slate-400">Risk Level</span>
          <span className={`text-sm font-bold ${riskColor} uppercase`}>{riskLevel}</span>
        </div>
      </div>

      {/* Expandable Metrics Section */}
      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-2 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-semibold text-orange-400 mb-2">Detailed Metrics:</h4>
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm bg-slate-900/30 rounded p-2">
              <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="text-slate-200 font-mono font-semibold">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            </div>
          ))}
          {/* Credit growth sparkline for Credit Markets */}
          {title === 'Credit Markets' && Array.isArray(metrics?.credit_growth_series_qoq) && metrics.credit_growth_series_qoq.length > 0 && (
            <div className="mt-3 bg-slate-900/40 rounded p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">
                Credit Growth (QoQ) – last 8 quarters
                <span className="ml-2 text-[10px] text-slate-500">YoY compares to a year ago; QoQ compares to last quarter.</span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {metrics.credit_growth_series_qoq.slice(-8).map((v: number, i: number) => {
                  const vals = metrics.credit_growth_series_qoq as number[];
                  const min = Math.min(...vals);
                  const max = Math.max(...vals);
                  const range = Math.max(0.0001, max - min);
                  const h = ((v - min) / range) * 100;
                  const label = (metrics.credit_growth_quarters && metrics.credit_growth_quarters[i]) || '';
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className={`w-3 rounded ${v >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ height: `${Math.max(4, h)}%` }}
                        title={`${label} • ${v.toFixed(2)}% QoQ`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Current: YoY {typeof metrics.credit_growth_rate_yoy === 'number' ? metrics.credit_growth_rate_yoy.toFixed(2) : 'N/A'}% • QoQ {typeof metrics.credit_growth_rate_qoq === 'number' ? metrics.credit_growth_rate_qoq.toFixed(2) : 'N/A'}%
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Austrian view: Rapid credit growth can fuel an artificial boom. Slowing or negative growth often precedes a bust as malinvestments get revealed.
              </div>
            </div>
          )}
          <button
            onClick={() => onShowEducation(title, educationContent)}
            className="w-full mt-3 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-600/50 text-orange-300 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Learn More About {title}
          </button>
        </div>
      </div>

      {!isExpanded && (
        <div className="text-center text-xs text-slate-500 mt-3">
          Click to expand
        </div>
      )}
    </div>
  );
}

// Risk Card Component
interface RiskCardProps {
  title: string;
  value: number;
  max: number;
  highlighted?: boolean;
  description?: string;
}

function RiskCard({ title, value, max, highlighted, description }: RiskCardProps) {
  const percentage = (value / max) * 100;
  const color = value >= 7 ? 'bg-red-500' : value >= 5 ? 'bg-yellow-500' : 'bg-green-500';
  const glowColor = value >= 7 ? 'shadow-red-500/50' : value >= 5 ? 'shadow-yellow-500/50' : 'shadow-green-500/50';
  
  return (
    <div className={`bg-slate-800/50 border rounded-xl p-5 backdrop-blur-sm transition-all transform hover:scale-105 ${
      highlighted 
        ? `border-orange-600 shadow-lg ${glowColor}` 
        : 'border-slate-700 hover:border-slate-600'
    }`}>
      <h3 className="text-sm font-medium text-slate-300 mb-1 uppercase tracking-wider">{title}</h3>
      {description && <p className="text-xs text-slate-500 mb-3">{description}</p>}
      <div className="text-4xl font-bold text-white mb-3">{value.toFixed(1)}</div>
      <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-slate-500">/ {max}</div>
        <div className={`text-xs font-semibold ${
          value >= 7 ? 'text-red-400' : value >= 5 ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {value >= 7 ? 'HIGH' : value >= 5 ? 'MODERATE' : 'LOW'}
        </div>
      </div>
    </div>
  );
}

// Indicator Card Component
interface IndicatorCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  alert?: boolean;
  description?: string;
}

function IndicatorCard({ title, value, trend, alert, description }: IndicatorCardProps) {
  return (
    <div className={`bg-slate-800/50 border rounded-xl p-4 backdrop-blur-sm transition-all transform hover:scale-105 ${
      alert 
        ? 'border-red-600 shadow-lg shadow-red-900/30' 
        : 'border-slate-700 hover:border-slate-600'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
        <div className="flex items-center gap-1">
          {trend !== 'neutral' && (
            <span className={`text-lg ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
          {alert && <span className="text-red-500 text-sm font-bold">⚠️</span>}
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      {description && <p className="text-xs text-slate-500 leading-tight">{description}</p>}
    </div>
  );
}

// Market Card Component
interface MarketCardProps {
  title: string;
  value: string;
  icon: string;
  description?: string;
}

function MarketCard({ title, value, icon, description }: MarketCardProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 backdrop-blur-sm hover:border-blue-500/50 transition-all transform hover:scale-105">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
  );
}
