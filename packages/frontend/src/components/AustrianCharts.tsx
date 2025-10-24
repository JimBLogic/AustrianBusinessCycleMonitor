/**
 * Professional Chart Components for Austrian Business Cycle Monitor
 * 
 * Provides ready-to-use, professionally styled chart components using Recharts
 * with Austrian economics theming and advanced data visualization features.
 */
import React from 'react';
import {
  LineChart,
  Line,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

// Austrian Economics Color Palette
export const austrianColors = {
  primary: '#F7931A', // Bitcoin Orange
  gold: '#FFD700',
  silver: '#C0C0C0',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  dark: '#1A1A1A',
  slate: '#64748B',
  purple: '#8B5CF6',
};

// Chart theme configuration
const chartTheme = {
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  textColor: '#E2E8F0',
  gridColor: 'rgba(100, 116, 139, 0.1)',
  tooltipBackground: 'rgba(15, 23, 42, 0.95)',
};

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-orange-500/30 rounded-lg p-4 shadow-xl backdrop-blur-sm">
        <p className="text-slate-300 font-semibold mb-2 text-sm">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-400 text-xs">{entry.name}:</span>
            <span className="text-white font-mono font-bold text-sm">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Credit Growth Time Series Chart
interface CreditGrowthChartProps {
  data: Array<{
    quarter: string;
    yoy: number;
    qoq: number;
    creditToGdp?: number;
  }>;
  height?: number;
}

export const CreditGrowthChart: React.FC<CreditGrowthChartProps> = ({ data, height = 300 }) => {
  return (
    <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-orange-400 mb-1">Credit Growth Trends</h3>
        <p className="text-xs text-slate-400">
          Year-over-year (YoY) and quarter-over-quarter (QoQ) credit expansion rates
        </p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorYoY" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={austrianColors.danger} stopOpacity={0.3} />
              <stop offset="95%" stopColor={austrianColors.danger} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorQoQ" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={austrianColors.info} stopOpacity={0.3} />
              <stop offset="95%" stopColor={austrianColors.info} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
          <XAxis 
            dataKey="quarter" 
            stroke={chartTheme.textColor}
            tick={{ fill: chartTheme.textColor, fontSize: 11 }}
          />
          <YAxis 
            stroke={chartTheme.textColor}
            tick={{ fill: chartTheme.textColor, fontSize: 11 }}
            label={{ value: 'Growth Rate (%)', angle: -90, position: 'insideLeft', fill: chartTheme.textColor }}
          />
          <Tooltip content={<CustomTooltip formatter={(val) => `${val.toFixed(2)}%`} />} />
          <Legend 
            wrapperStyle={{ color: chartTheme.textColor }}
            iconType="circle"
          />
          <ReferenceLine y={0} stroke={austrianColors.slate} strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="yoy"
            name="YoY Growth"
            stroke={austrianColors.danger}
            strokeWidth={2}
            fill="url(#colorYoY)"
          />
          <Line
            type="monotone"
            dataKey="qoq"
            name="QoQ Growth"
            stroke={austrianColors.info}
            strokeWidth={2}
            dot={{ fill: austrianColors.info, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="bg-red-900/20 border border-red-600/30 rounded p-2">
          <div className="text-red-400 font-semibold">Austrian Warning</div>
          <div className="text-slate-300 mt-1">
            Rapid credit growth ({">"} 7% YoY) signals artificial boom conditions
          </div>
        </div>
        <div className="bg-blue-900/20 border border-blue-600/30 rounded p-2">
          <div className="text-blue-400 font-semibold">Current Phase</div>
          <div className="text-slate-300 mt-1">
            {data[data.length - 1]?.yoy > 7 ? 'Boom expansion detected' : 'Moderate conditions'}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Malinvestment Radar Chart
interface MalinvestmentRadarProps {
  components: {
    [key: string]: {
      score: number;
      weight: number;
    };
  };
  height?: number;
}

export const MalinvestmentRadarChart: React.FC<MalinvestmentRadarProps> = ({ components, height = 350 }) => {
  const radarData = Object.entries(components).map(([key, value]) => ({
    component: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: value.score,
    fullMark: 10,
  }));

  return (
    <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-purple-400 mb-1">Malinvestment Risk Distribution</h3>
        <p className="text-xs text-slate-400">
          Multi-dimensional capital misallocation analysis (0-10 scale)
        </p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={radarData}>
          <PolarGrid stroke={chartTheme.gridColor} />
          <PolarAngleAxis 
            dataKey="component" 
            tick={{ fill: chartTheme.textColor, fontSize: 10 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 10]}
            tick={{ fill: chartTheme.textColor, fontSize: 10 }}
          />
          <Radar
            name="Risk Score"
            dataKey="score"
            stroke={austrianColors.danger}
            fill={austrianColors.danger}
            fillOpacity={0.5}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Object.entries(components).map(([key, value]) => (
          <div key={key} className="bg-slate-800/50 rounded p-2 text-xs">
            <div className="text-slate-400 truncate" title={key}>
              {key.replace(/_/g, ' ')}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-white font-bold">{value.score.toFixed(1)}</div>
              <div className="text-slate-500">×{value.weight.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Austrian Score Gauge
interface AustrianScoreGaugeProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  size?: number;
}

export const AustrianScoreGauge: React.FC<AustrianScoreGaugeProps> = ({ score, trend = 'stable', size = 200 }) => {
  const getColor = (value: number) => {
    if (value < 3) return austrianColors.success;
    if (value < 5) return austrianColors.info;
    if (value < 7) return austrianColors.warning;
    return austrianColors.danger;
  };

  const getRiskLevel = (value: number) => {
    if (value < 3) return 'LOW RISK';
    if (value < 5) return 'MODERATE';
    if (value < 7) return 'ELEVATED';
    if (value < 9) return 'HIGH RISK';
    return 'EXTREME';
  };

  const percentage = (score / 10) * 100;
  const color = getColor(score);

  return (
    <div className="w-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-orange-400 mb-1">Austrian Cycle Score</h3>
        <p className="text-xs text-slate-400">
          Aggregate boom-bust risk indicator (0-10 scale)
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        {/* Circular Gauge */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox="0 0 200 200" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(100, 116, 139, 0.2)"
              strokeWidth="20"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={color}
              strokeWidth="20"
              strokeDasharray={`${percentage * 5.024} 502.4`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 10px ${color})`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold" style={{ color }}>
              {score.toFixed(1)}
            </div>
            <div className="text-xs text-slate-400 mt-1">/ 10</div>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div 
          className="mt-6 px-4 py-2 rounded-full text-sm font-bold"
          style={{ 
            backgroundColor: `${color}20`,
            border: `2px solid ${color}`,
            color: color,
          }}
        >
          {getRiskLevel(score)}
        </div>

        {/* Trend Indicator */}
        {trend !== 'stable' && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {trend === 'up' ? (
              <>
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-red-400">Risk Increasing</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-green-400">Risk Decreasing</span>
              </>
            )}
          </div>
        )}

        {/* Color Scale Reference */}
        <div className="mt-6 w-full">
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="flex-1 bg-green-500" />
            <div className="flex-1 bg-blue-500" />
            <div className="flex-1 bg-yellow-500" />
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-red-500" />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Risk Metrics Mini Sparkline
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color = austrianColors.primary, height = 40 }) => {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// 5. Three Pillars Health Bars
interface PillarHealthProps {
  pillars: {
    name: string;
    status: string;
    riskLevel: string;
    score: number;
  }[];
}

export const ThreePillarsHealth: React.FC<PillarHealthProps> = ({ pillars }) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return austrianColors.success;
      case 'moderate': return austrianColors.info;
      case 'elevated': return austrianColors.warning;
      case 'high': return austrianColors.danger;
      default: return austrianColors.slate;
    }
  };

  return (
    <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gold mb-1">Three Pillars Health Status</h3>
        <p className="text-xs text-slate-400">
          Real-time monitoring of Monetary Policy, Credit Markets, and Real Economy
        </p>
      </div>
      <div className="space-y-4">
        {pillars.map((pillar, index) => {
          const color = getRiskColor(pillar.riskLevel);
          const percentage = (pillar.score / 10) * 100;

          return (
            <div key={index} className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-white">{pillar.name}</div>
                  <div className="text-xs text-slate-400">{pillar.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color }}>
                    {pillar.score.toFixed(1)}
                  </div>
                  <div 
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: `${color}20`,
                      color: color,
                    }}
                  >
                    {pillar.riskLevel.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 6. Asset Correlation Heatmap
interface CorrelationMatrixProps {
  data: {
    bitcoin: {
      bitcoin: number;
      gold: number;
      silver: number;
      stocks: number;
    };
    gold: {
      bitcoin: number;
      gold: number;
      silver: number;
      stocks: number;
    };
    silver: {
      bitcoin: number;
      gold: number;
      silver: number;
      stocks: number;
    };
    stocks: {
      bitcoin: number;
      gold: number;
      silver: number;
      stocks: number;
    };
  };
}

export const AssetCorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ data }) => {
  const assets = ['Bitcoin', 'Gold', 'Silver', 'Stocks'];
  const correlations = [
    [data.bitcoin.bitcoin, data.bitcoin.gold, data.bitcoin.silver, data.bitcoin.stocks],
    [data.gold.bitcoin, data.gold.gold, data.gold.silver, data.gold.stocks],
    [data.silver.bitcoin, data.silver.gold, data.silver.silver, data.silver.stocks],
    [data.stocks.bitcoin, data.stocks.gold, data.stocks.silver, data.stocks.stocks],
  ];

  const getCorrelationColor = (value: number) => {
    if (value > 0.7) return 'bg-green-500';
    if (value > 0.3) return 'bg-blue-500';
    if (value > -0.3) return 'bg-slate-500';
    if (value > -0.7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCorrelationIntensity = (value: number) => {
    const intensity = Math.abs(value);
    return Math.floor(intensity * 10) * 10;
  };

  return (
    <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-primary mb-1">Asset Correlation Matrix</h3>
        <p className="text-xs text-slate-400">
          Cross-asset correlation analysis for portfolio diversification
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {assets.map((asset, i) => (
                <th key={i} className="p-2 text-xs text-slate-400 font-semibold">
                  {asset}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correlations.map((row, i) => (
              <tr key={i}>
                <td className="p-2 text-xs text-slate-400 font-semibold">
                  {assets[i]}
                </td>
                {row.map((value, j) => (
                  <td key={j} className="p-2">
                    <div
                      className={`
                        ${getCorrelationColor(value)}
                        rounded p-3 text-center font-mono font-bold text-sm text-white
                        transition-all duration-300 hover:scale-110 cursor-pointer
                      `}
                      style={{
                        opacity: getCorrelationIntensity(value) / 100,
                      }}
                      title={`Correlation: ${value.toFixed(2)}`}
                    >
                      {value.toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-slate-400">Strong Positive (&gt;0.7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-500 rounded"></div>
          <span className="text-slate-400">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-slate-400">Strong Negative (&lt;-0.7)</span>
        </div>
      </div>
    </div>
  );
};

export default {
  CreditGrowthChart,
  MalinvestmentRadarChart,
  AustrianScoreGauge,
  Sparkline,
  ThreePillarsHealth,
  AssetCorrelationMatrix,
};
