/**
 * Loading Skeleton Components
 * 
 * Professional loading states for charts and metrics
 */
import React from 'react';

// Skeleton for Metric Cards
export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl p-4 sm:p-5 border-2 border-slate-700/50 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 bg-slate-700 rounded"></div>
          <div className="flex-1">
            <div className="h-3 bg-slate-700 rounded w-24 mb-1"></div>
            <div className="h-2 bg-slate-700/50 rounded w-32 hidden sm:block"></div>
          </div>
        </div>
        <div className="w-3 h-3 bg-slate-700 rounded-full"></div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className="h-10 bg-slate-700 rounded w-32 mb-2"></div>
        <div className="h-6 bg-slate-700/50 rounded w-20"></div>
      </div>

      {/* Sparkline */}
      <div className="h-8 bg-slate-700/30 rounded mb-3"></div>

      {/* Trend */}
      <div className="pt-3 border-t border-slate-700">
        <div className="h-4 bg-slate-700/50 rounded w-24"></div>
      </div>
    </div>
  );
};

// Skeleton for Chart Containers
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700 animate-pulse">
      {/* Title */}
      <div className="mb-4">
        <div className="h-6 bg-slate-700 rounded w-48 mb-2"></div>
        <div className="h-4 bg-slate-700/50 rounded w-64"></div>
      </div>

      {/* Chart Area */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Simulated axes and grid */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-px bg-slate-700/30"></div>
          ))}
        </div>
        
        {/* Simulated chart bars/lines */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around p-4 gap-2">
          {[60, 80, 45, 90, 70, 85, 65, 75].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-slate-700 to-slate-700/30 rounded-t"
              style={{ height: `${height}%` }}
            ></div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4">
        <div className="h-4 bg-slate-700/50 rounded w-24"></div>
        <div className="h-4 bg-slate-700/50 rounded w-24"></div>
      </div>
    </div>
  );
};

// Skeleton for Gauge
export const GaugeSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl p-6 border-2 border-slate-700/50 animate-pulse">
      {/* Title */}
      <div className="mb-4">
        <div className="h-6 bg-slate-700 rounded w-32 mb-2"></div>
        <div className="h-4 bg-slate-700/50 rounded w-24"></div>
      </div>

      {/* Gauge Circle */}
      <div className="flex justify-center items-center mb-4">
        <div className="w-48 h-48 rounded-full border-8 border-slate-700/30 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 bg-slate-700 rounded w-16"></div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-center gap-2">
        <div className="h-6 bg-slate-700/50 rounded w-20"></div>
        <div className="h-6 bg-slate-700/50 rounded w-16"></div>
      </div>
    </div>
  );
};

// Skeleton for Radar Chart
export const RadarSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700 animate-pulse">
      {/* Title */}
      <div className="mb-4">
        <div className="h-6 bg-slate-700 rounded w-48 mb-2"></div>
        <div className="h-4 bg-slate-700/50 rounded w-56"></div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center items-center mb-4" style={{ height: '300px' }}>
        <div className="relative w-64 h-64">
          {/* Hexagonal outline */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon
              points="50,10 85,30 85,70 50,90 15,70 15,30"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-700/30"
            />
            <polygon
              points="50,25 75,37.5 75,62.5 50,75 25,62.5 25,37.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-700/30"
            />
            <polygon
              points="50,40 65,45 65,55 50,60 35,55 35,45"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-700/30"
            />
          </svg>
        </div>
      </div>

      {/* Component Table */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 bg-slate-700/50 rounded w-40"></div>
            <div className="h-4 bg-slate-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton for Correlation Matrix
export const MatrixSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700 animate-pulse">
      {/* Title */}
      <div className="mb-4">
        <div className="h-6 bg-slate-700 rounded w-56 mb-2"></div>
        <div className="h-4 bg-slate-700/50 rounded w-64"></div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-5 gap-2 min-w-[400px]">
          {/* Header Row */}
          <div></div>
          {['Bitcoin', 'Gold', 'Silver', 'Stocks'].map((_, i) => (
            <div key={i} className="h-8 bg-slate-700/50 rounded"></div>
          ))}

          {/* Data Rows */}
          {['Bitcoin', 'Gold', 'Silver', 'Stocks'].map((_, rowIdx) => (
            <React.Fragment key={rowIdx}>
              <div className="h-12 bg-slate-700/50 rounded flex items-center justify-center"></div>
              {[...Array(4)].map((_, colIdx) => (
                <div
                  key={colIdx}
                  className="h-12 bg-slate-700 rounded"
                  style={{ opacity: 0.3 + (Math.random() * 0.4) }}
                ></div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4">
        <div className="h-4 bg-slate-700/50 rounded w-32"></div>
        <div className="h-4 bg-slate-700/50 rounded w-24"></div>
        <div className="h-4 bg-slate-700/50 rounded w-32"></div>
      </div>
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  message = 'Data is currently unavailable. Please try again later.',
  icon = '📊',
}) => {
  return (
    <div className="w-full bg-slate-900/50 rounded-xl p-12 border border-slate-700 text-center">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-xl font-bold text-slate-400 mb-2">{title}</h3>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
};

// Error State Component
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to Load Data',
  message = 'An error occurred while loading the data. Please try again.',
  onRetry,
}) => {
  return (
    <div className="w-full bg-gradient-to-br from-red-900/20 to-slate-900/50 rounded-xl p-12 border-2 border-red-600/30 text-center">
      <div className="text-6xl mb-4">❌</div>
      <h3 className="text-xl font-bold text-red-400 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
};

export default {
  MetricCardSkeleton,
  ChartSkeleton,
  GaugeSkeleton,
  RadarSkeleton,
  MatrixSkeleton,
  EmptyState,
  ErrorState,
};
