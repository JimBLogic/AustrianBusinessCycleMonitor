/**
 * Skeleton Loading Components
 * Professional content-aware loading states
 */
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
    animate && 'animate-pulse',
    className
  );

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    card: 'rounded-xl',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return <div className={cn(baseClasses, variantClasses[variant])} style={style} />;
}

/**
 * Card Skeleton - Shows loading state for dashboard cards
 */
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={16} />
        </div>
        <Skeleton variant="circular" width={40} height={40} />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <Skeleton variant="rectangular" width="100%" height={60} />
        <div className="flex gap-4">
          <Skeleton variant="rectangular" width="48%" height={40} />
          <Skeleton variant="rectangular" width="48%" height={40} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="text" width="30%" height={14} />
      </div>
    </div>
  );
}

/**
 * Chart Skeleton - Shows loading state for charts
 */
export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
      {/* Chart header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="40%" height={20} />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={60} height={32} />
          <Skeleton variant="rectangular" width={60} height={32} />
          <Skeleton variant="rectangular" width={60} height={32} />
        </div>
      </div>

      {/* Chart area */}
      <div className="relative h-64 flex items-end justify-between gap-2">
        {[...Array(12)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="7%"
            height={`${Math.random() * 60 + 40}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton variant="text" width={80} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Insight Card Skeleton - Shows loading state for Austrian insights
 */
export function InsightCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 space-y-3">
      {/* Header with economist */}
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" height={18} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      </div>

      {/* Insight content */}
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="95%" height={14} />
        <Skeleton variant="text" width="88%" height={14} />
      </div>

      {/* Tags */}
      <div className="flex gap-2 flex-wrap">
        <Skeleton variant="rectangular" width={70} height={24} className="rounded-full" />
        <Skeleton variant="rectangular" width={90} height={24} className="rounded-full" />
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      </div>

      {/* Relevance score */}
      <div className="space-y-1">
        <Skeleton variant="text" width="30%" height={12} />
        <Skeleton variant="rectangular" width="100%" height={8} className="rounded-full" />
      </div>
    </div>
  );
}

/**
 * Economist Card Skeleton
 */
export function EconomistCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md space-y-3">
      {/* Profile image */}
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="50%" height={14} />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" height={12} />
        <Skeleton variant="text" width="95%" height={12} />
        <Skeleton variant="text" width="70%" height={12} />
      </div>

      {/* Key contribution */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 space-y-2">
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="text" width="100%" height={12} />
      </div>
    </div>
  );
}

/**
 * Dashboard Grid Skeleton - Shows loading state for entire dashboard
 */
export function DashboardGridSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton variant="text" width="50%" height={36} />
        <Skeleton variant="text" width="70%" height={20} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Chart section */}
      <ChartSkeleton />

      {/* Insights grid */}
      <div className="space-y-4">
        <Skeleton variant="text" width="30%" height={24} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightCardSkeleton />
          <InsightCardSkeleton />
          <InsightCardSkeleton />
          <InsightCardSkeleton />
        </div>
      </div>
    </div>
  );
}
