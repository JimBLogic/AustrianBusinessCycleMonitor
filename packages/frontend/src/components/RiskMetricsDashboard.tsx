/**
 * Professional KPI Dashboard Grid with Visual Metrics
 * 
 * Displays key performance indicators with sparklines, trend indicators,
 * threshold alerts, and real-time status updates.
 */
import React from 'react';
import { Sparkline, austrianColors } from './AustrianCharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  threshold?: {
    warning: number;
    danger: number;
  };
  icon?: string;
  trendDirection?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'danger' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  change,
  changeLabel = '',
  sparklineData,
  threshold,
  icon = '📊',
  trendDirection,
  status = 'info',
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return austrianColors.success;
      case 'warning': return austrianColors.warning;
      case 'danger': return austrianColors.danger;
      case 'info': return austrianColors.info;
      default: return austrianColors.slate;
    }
  };

  const getTrendColor = () => {
    if (!trendDirection) return austrianColors.slate;
    if (trendDirection === 'up') return austrianColors.danger;
    if (trendDirection === 'down') return austrianColors.success;
    return austrianColors.slate;
  };

  const statusColor = getStatusColor();
  const trendColor = getTrendColor();

  return (
    <div 
      className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl p-4 sm:p-5 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
      style={{ borderColor: `${statusColor}40` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{icon}</span>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">
              {title}
            </h4>
            {threshold && (
              <div className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                Warning: {threshold.warning} | Danger: {threshold.danger}
              </div>
            )}
          </div>
        </div>
        {status && (
          <div
            className="w-3 h-3 rounded-full animate-pulse flex-shrink-0"
            style={{ backgroundColor: statusColor }}
            title={status.toUpperCase()}
          />
        )}
      </div>

      {/* Value Display */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
          <span className="text-3xl sm:text-4xl font-bold text-white font-mono">
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
          {unit && (
            <span className="text-base sm:text-lg text-slate-400 font-semibold">{unit}</span>
          )}
        </div>

        {/* Change Indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
              style={{
                backgroundColor: `${change >= 0 ? austrianColors.danger : austrianColors.success}20`,
                color: change >= 0 ? austrianColors.danger : austrianColors.success,
              }}
            >
              {change >= 0 ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span>{Math.abs(change).toFixed(2)}%</span>
            </div>
            {changeLabel && (
              <span className="text-xs text-slate-500">{changeLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <Sparkline 
            data={sparklineData} 
            color={statusColor}
            height={35}
          />
        </div>
      )}

      {/* Trend Direction */}
      {trendDirection && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Trend:</span>
            <div className="flex items-center gap-1" style={{ color: trendColor }}>
              {trendDirection === 'up' && (
                <>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-[10px] sm:text-xs">Rising</span>
                </>
              )}
              {trendDirection === 'down' && (
                <>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-[10px] sm:text-xs">Falling</span>
                </>
              )}
              {trendDirection === 'stable' && (
                <>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-[10px] sm:text-xs">Stable</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RiskMetricsDashboardProps {
  metrics: {
    austrianScore?: number;
    m2Growth?: number;
    creditGrowth?: number;
    interestSpread?: number;
    malinvestmentIndex?: number;
    yieldCurve?: number;
    bitcoinPrice?: number;
    goldPrice?: number;
  };
  sparklines?: {
    [key: string]: number[];
  };
  trends?: {
    [key: string]: 'up' | 'down' | 'stable';
  };
}

export const RiskMetricsDashboard: React.FC<RiskMetricsDashboardProps> = ({
  metrics = {},
  sparklines = {},
  trends = {},
}) => {
  const {
    austrianScore = 6.5,
    m2Growth = 5.7,
    creditGrowth = 4.3,
    interestSpread = 1.2,
    malinvestmentIndex = 6.1,
    yieldCurve = -0.3,
    bitcoinPrice = 67000,
    goldPrice = 2050,
  } = metrics;

  // Determine status based on thresholds
  const getM2Status = (value: number) => {
    if (value < 5) return 'success';
    if (value < 7) return 'warning';
    return 'danger';
  };

  const getCreditStatus = (value: number) => {
    if (value < 5) return 'success';
    if (value < 7) return 'warning';
    return 'danger';
  };

  const getMalinvestmentStatus = (value: number) => {
    if (value < 4) return 'success';
    if (value < 7) return 'warning';
    return 'danger';
  };

  const getYieldCurveStatus = (value: number) => {
    if (value < -0.5) return 'danger';
    if (value < 0) return 'warning';
    return 'success';
  };

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-3">
            <span>📊</span>
            <span>Real-Time Risk Metrics Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Live Austrian economics indicators with visual trend analysis
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-slate-300 font-mono">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Austrian Score */}
        <MetricCard
          title="Austrian Score"
          value={austrianScore}
          unit="/10"
          icon="🏛️"
          sparklineData={sparklines.austrianScore || [5.2, 5.8, 6.1, 6.4, 6.7, 6.5]}
          status={austrianScore >= 7 ? 'danger' : austrianScore >= 5 ? 'warning' : 'success'}
          trendDirection={trends.austrianScore || 'stable'}
          threshold={{ warning: 5, danger: 7 }}
        />

        {/* M2 Growth */}
        <MetricCard
          title="M2 Money Supply"
          value={m2Growth}
          unit="% YoY"
          icon="💰"
          change={0.3}
          changeLabel="vs last month"
          sparklineData={sparklines.m2Growth || [4.9, 5.1, 5.5, 5.3, 5.7, 5.7]}
          status={getM2Status(m2Growth)}
          trendDirection={trends.m2Growth || 'up'}
          threshold={{ warning: 5, danger: 7 }}
        />

        {/* Credit Growth */}
        <MetricCard
          title="Credit Expansion"
          value={creditGrowth}
          unit="% YoY"
          icon="📈"
          change={-0.2}
          changeLabel="vs last quarter"
          sparklineData={sparklines.creditGrowth || [4.8, 4.9, 4.6, 4.5, 4.4, 4.3]}
          status={getCreditStatus(creditGrowth)}
          trendDirection={trends.creditGrowth || 'down'}
          threshold={{ warning: 5, danger: 7 }}
        />

        {/* Interest Rate Spread */}
        <MetricCard
          title="Interest Spread"
          value={interestSpread}
          unit="pp"
          icon="💹"
          sparklineData={sparklines.interestSpread || [0.8, 1.0, 1.1, 1.3, 1.2, 1.2]}
          status="info"
          trendDirection={trends.interestSpread || 'stable'}
        />

        {/* Malinvestment Index */}
        <MetricCard
          title="Malinvestment"
          value={malinvestmentIndex}
          unit="/10"
          icon="⚠️"
          sparklineData={sparklines.malinvestmentIndex || [5.1, 5.6, 5.9, 6.3, 6.2, 6.1]}
          status={getMalinvestmentStatus(malinvestmentIndex)}
          trendDirection={trends.malinvestmentIndex || 'up'}
          threshold={{ warning: 4, danger: 7 }}
        />

        {/* Yield Curve */}
        <MetricCard
          title="Yield Curve (10Y-2Y)"
          value={yieldCurve}
          unit="pp"
          icon="📉"
          sparklineData={sparklines.yieldCurve || [0.2, 0.1, -0.1, -0.2, -0.3, -0.3]}
          status={getYieldCurveStatus(yieldCurve)}
          trendDirection={trends.yieldCurve || 'down'}
          threshold={{ warning: 0, danger: -0.5 }}
        />

        {/* Bitcoin Price */}
        <MetricCard
          title="Bitcoin (BTC)"
          value={bitcoinPrice.toLocaleString()}
          unit="USD"
          icon="₿"
          change={2.3}
          changeLabel="24h"
          sparklineData={sparklines.bitcoinPrice || [64000, 65500, 66200, 67500, 66800, 67000]}
          status="success"
          trendDirection={trends.bitcoinPrice || 'up'}
        />

        {/* Gold Price */}
        <MetricCard
          title="Gold (XAU)"
          value={goldPrice.toLocaleString()}
          unit="USD/oz"
          icon="🪙"
          change={0.8}
          changeLabel="24h"
          sparklineData={sparklines.goldPrice || [2020, 2030, 2045, 2055, 2048, 2050]}
          status="success"
          trendDirection={trends.goldPrice || 'stable'}
        />
      </div>

      {/* Alert Banner */}
      {(austrianScore >= 7 || malinvestmentIndex >= 7 || yieldCurve < -0.5) && (
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-red-400 font-bold mb-1">⚠️ Austrian Cycle Warning</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                Multiple high-risk indicators detected. The economy shows signs of late-stage boom conditions with 
                significant malinvestment accumulation. According to Austrian Business Cycle Theory, this phase 
                typically precedes a corrective bust as unsustainable investments are liquidated.
              </p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs bg-red-900/40 text-red-300 px-2 py-1 rounded">
                  High Austrian Score: {austrianScore.toFixed(1)}
                </span>
                {malinvestmentIndex >= 7 && (
                  <span className="text-xs bg-orange-900/40 text-orange-300 px-2 py-1 rounded">
                    Severe Malinvestment: {malinvestmentIndex.toFixed(1)}
                  </span>
                )}
                {yieldCurve < -0.5 && (
                  <span className="text-xs bg-red-900/40 text-red-300 px-2 py-1 rounded">
                    Yield Curve Inverted: {yieldCurve.toFixed(2)}pp
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMetricsDashboard;
