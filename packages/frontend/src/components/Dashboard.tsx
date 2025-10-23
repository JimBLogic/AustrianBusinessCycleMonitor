/**
 * Main Austrian Economics Dashboard
 * Cypherpunk/Bitcoiner aesthetic with robust data fetching
 */
import { useEffect, useState } from 'react';
import {
  useAnalysis,
  useThreePillars,
  useMarketData,
  useBitcoinPrice,
  useSystemStatus,
  useCycleAnalysis,
} from '@/hooks/useApi';
import { formatCurrency, formatPercent, getRiskColor } from '@/lib/utils';

export function Dashboard() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch all data with automatic retry and refresh
  const { data: analysisData, isLoading: analysisLoading, error: analysisError } = useAnalysis();
  const { data: pillarsData, isLoading: pillarsLoading } = useThreePillars();
  const { data: marketData, isLoading: marketLoading } = useMarketData();
  const { data: btcPrice, isLoading: btcLoading } = useBitcoinPrice();
  const { data: statusData } = useSystemStatus();
  const { data: cycleData } = useCycleAnalysis();

  useEffect(() => {
    setLastUpdate(new Date());
  }, [analysisData, marketData, btcPrice]);

  const analysis = analysisData?.analysis;
  const market = marketData?.market_data;
  const pillars = pillarsData;

  // Loading state
  if (analysisLoading || pillarsLoading || marketLoading || btcLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mb-4"></div>
          <p className="text-xl text-slate-300">Loading Austrian Analysis...</p>
          <p className="text-sm text-slate-500 mt-2">Connecting to economic data feeds</p>
        </div>
      </div>
    );
  }

  // Error state
  if (analysisError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-500 mb-2">Connection Error</h2>
          <p className="text-slate-300 mb-4">
            Cannot connect to the Austrian Economics backend.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Make sure your Flask server is running on <code className="bg-slate-800 px-2 py-1 rounded">http://localhost:8000</code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-orange-500">₿</span>
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-transparent bg-clip-text">
                  Austrian Business Cycle Monitor
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-mono">
                Sound Money • Free Markets • Cypherpunk Values
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${statusData?.status === 'ok' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-sm text-slate-400 hidden md:inline">
                  {statusData?.status === 'ok' ? 'Live' : 'Offline'}
                </span>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono">
                <div>Updated</div>
                <div>{lastUpdate.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Austrian Score & Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Austrian Score */}
          <div className="md:col-span-2 bg-gradient-to-br from-orange-900/40 to-slate-800/40 border border-orange-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-orange-300">Austrian Cycle Score</h3>
              <span className="text-xs text-slate-500 font-mono">0-10 Scale</span>
            </div>
            <div className="flex items-baseline gap-4">
              <div className="text-6xl font-bold text-orange-500">{austrianScore.toFixed(1)}</div>
              <div className="flex-1">
                <div className={`text-2xl font-bold ${getRiskColor(overallRisk)}`}>
                  {overallRisk >= 7 ? 'HIGH RISK' : overallRisk >= 5 ? 'MODERATE' : 'LOW RISK'}
                </div>
                <div className="text-sm text-slate-400 mt-1 font-mono">{cyclePhase}</div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  austrianScore >= 7 ? 'bg-red-500' : austrianScore >= 5 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(austrianScore / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Bitcoin Price */}
          <div className="bg-gradient-to-br from-orange-600/20 to-slate-800/40 border border-orange-600/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">₿</span>
              <h3 className="text-sm font-medium text-orange-300">Bitcoin</h3>
            </div>
            <div className="text-3xl font-bold text-white">
              {btcPrice?.price ? formatCurrency(btcPrice.price) : formatCurrency(market?.bitcoin?.price || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-mono">
              Sound Money Indicator
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {btcPrice?.source || market?.bitcoin?.source || 'CoinGecko'}
            </div>
          </div>

          {/* Gold Price */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-slate-800/40 border border-yellow-600/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🪙</span>
              <h3 className="text-sm font-medium text-yellow-300">Gold</h3>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(market?.commodities?.gold || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-mono">
              Traditional Store of Value
            </div>
            <div className="text-xs text-slate-500 mt-1">
              per oz
            </div>
          </div>
        </div>

        {/* Three Pillars of Austrian Analysis */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🏛️</span>
            Three Pillars Risk Monitor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Monetary Policy */}
            <PillarCard
              title="Monetary Policy"
              icon="💰"
              status={pillars?.monetary_policy?.status || 'unknown'}
              riskLevel={pillars?.monetary_policy?.risk_level || 'unknown'}
              metrics={pillars?.monetary_policy?.metrics || {}}
              description="Central bank actions and money supply growth"
            />

            {/* Pillar 2: Credit Markets */}
            <PillarCard
              title="Credit Markets"
              icon="📊"
              status={pillars?.credit_markets?.status || 'unknown'}
              riskLevel={pillars?.credit_markets?.risk_level || 'unknown'}
              metrics={pillars?.credit_markets?.metrics || {}}
              description="Lending practices and credit conditions"
            />

            {/* Pillar 3: Real Economy */}
            <PillarCard
              title="Real Economy"
              icon="🏭"
              status={pillars?.real_economy?.status || 'unknown'}
              riskLevel={pillars?.real_economy?.risk_level || 'unknown'}
              metrics={pillars?.real_economy?.metrics || {}}
              description="Production structure and capital allocation"
            />
          </div>
        </div>

        {/* Risk Levels */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Risk Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <RiskCard
              title="Monetary Policy"
              value={analysis?.risk_levels?.monetary_policy || 0}
              max={10}
            />
            <RiskCard
              title="Credit Markets"
              value={analysis?.risk_levels?.credit_markets || 0}
              max={10}
            />
            <RiskCard
              title="Real Economy"
              value={analysis?.risk_levels?.real_economy || 0}
              max={10}
            />
            <RiskCard
              title="Overall Risk"
              value={overallRisk}
              max={10}
              highlighted
            />
          </div>
        </div>

        {/* Economic Indicators */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Economic Indicators</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <IndicatorCard
              title="CPI Inflation"
              value={formatPercent(market?.economic_indicators?.cpi || 0)}
              trend="neutral"
            />
            <IndicatorCard
              title="PPI"
              value={formatPercent(market?.economic_indicators?.ppi || 0)}
              trend="neutral"
            />
            <IndicatorCard
              title="GDP Growth"
              value={formatPercent(market?.economic_indicators?.gdp_growth || 0)}
              trend="neutral"
            />
            <IndicatorCard
              title="Manufacturing PMI"
              value={market?.economic_indicators?.manufacturing_pmi?.toFixed(1) || '0.0'}
              trend={(market?.economic_indicators?.manufacturing_pmi || 0) > 50 ? 'up' : 'down'}
            />
            <IndicatorCard
              title="Fed Funds Rate"
              value={formatPercent(market?.interest_rates?.fed_funds || 0)}
              trend="neutral"
            />
            <IndicatorCard
              title="10Y Treasury"
              value={formatPercent(market?.interest_rates?.['10y_treasury'] || 0)}
              trend="neutral"
            />
            <IndicatorCard
              title="Yield Curve"
              value={market?.yield_curve?.['10y_2y_spread']?.toFixed(2) + '%' || '0.00%'}
              trend={market?.yield_curve?.inverted ? 'down' : 'up'}
              alert={market?.yield_curve?.inverted}
            />
            <IndicatorCard
              title="Natural Rate Est."
              value={formatPercent(market?.interest_rates?.natural_rate_estimate || 0)}
              trend="neutral"
            />
          </div>
        </div>

        {/* Austrian Interpretation */}
        {cycleData?.narrative && (
          <div className="bg-gradient-to-br from-blue-900/20 to-slate-800/40 border border-blue-700/50 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-blue-300 mb-3 flex items-center gap-2">
              <span>📖</span>
              Austrian Economics Interpretation
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              {cycleData.narrative}
            </p>
            {cycleData.recommendations && cycleData.recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Recommendations:</h3>
                <ul className="space-y-1">
                  {cycleData.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="font-mono">
              Austrian Business Cycle Monitor v{statusData?.version || '0.2.0'}
            </div>
            <div className="flex items-center gap-4">
              <span>Powered by Austrian Economics</span>
              <span>•</span>
              <span>Cypherpunk Values</span>
              <span>•</span>
              <span>Bitcoin Standard</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Pillar Card Component
interface PillarCardProps {
  title: string;
  icon: string;
  status: string;
  riskLevel: string;
  metrics: Record<string, any>;
  description: string;
}

function PillarCard({ title, icon, status, riskLevel, metrics, description }: PillarCardProps) {
  const riskColor = getRiskColor(
    riskLevel === 'high' ? 9 : 
    riskLevel === 'elevated' ? 7 : 
    riskLevel === 'moderate' ? 5 : 3
  );

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-400">Status</span>
          <span className="text-sm font-medium text-white capitalize">{status}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Risk Level</span>
          <span className={`text-sm font-bold ${riskColor} uppercase`}>{riskLevel}</span>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(metrics).slice(0, 3).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-slate-300 font-mono">
              {typeof value === 'number' ? value.toFixed(2) : value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Risk Card Component
interface RiskCardProps {
  title: string;
  value: number;
  max: number;
  highlighted?: boolean;
}

function RiskCard({ title, value, max, highlighted }: RiskCardProps) {
  const percentage = (value / max) * 100;
  const color = value >= 7 ? 'bg-red-500' : value >= 5 ? 'bg-yellow-500' : 'bg-green-500';
  
  return (
    <div className={`bg-slate-800/50 border rounded-lg p-4 ${highlighted ? 'border-orange-600 shadow-lg shadow-orange-900/20' : 'border-slate-700'}`}>
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-white mb-2">{value.toFixed(1)}</div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-slate-500 mt-2">/ {max}</div>
    </div>
  );
}

// Indicator Card Component
interface IndicatorCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  alert?: boolean;
}

function IndicatorCard({ title, value, trend, alert }: IndicatorCardProps) {
  return (
    <div className={`bg-slate-800/50 border rounded-lg p-4 ${alert ? 'border-red-600 shadow-lg shadow-red-900/20' : 'border-slate-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-400">{title}</h3>
        {trend !== 'neutral' && (
          <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
        {alert && <span className="text-red-500 text-xs font-bold">⚠️</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
