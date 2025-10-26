/**
 * Custom hooks for robust API calls with automatic retry and error handling
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import api from '@/lib/api';

interface ApiError {
  message: string;
  status?: number;
}

// Generic API hook with retry logic - OPTIMIZED for fast loading
export function useApi<T>(
  endpoint: string,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, ApiError>({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await api.get(endpoint);
      return response.data;
    },
    retry: 1, // Reduced from 3 to 1 for faster initial load
    retryDelay: 1000, // Simplified delay
    staleTime: 5 * 60 * 1000, // 5 minutes - increased cache time
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Disabled to prevent unnecessary refetches
    refetchOnReconnect: true,
    ...options,
  });
}

// Austrian Business Cycle Analysis
export function useAnalysis() {
  return useApi<{
    analysis: {
      timestamp: string;
      cycle_position: string;
      austrian_score: number;
      risk_levels: {
        monetary_policy: number;
        credit_markets: number;
        real_economy: number;
        overall: number;
      };
      monetary_metrics: {
        m2_growth_rate: number;
        interest_rate_spread: number;
        credit_market_distortion: string;
      };
      indicators: Record<string, any>;
    };
    generated_at: string;
  }>('/api/analysis', {
    refetchInterval: 60000, // Refresh every minute
  });
}

// Three Pillars Data
export function useThreePillars() {
  return useApi<{
    monetary_policy: {
      status: string;
      risk_level: string;
      metrics: Record<string, number>;
    };
    credit_markets: {
      status: string;
      risk_level: string;
      metrics: Record<string, number | string>;
    };
    real_economy: {
      status: string;
      risk_level: string;
      metrics: Record<string, number | string>;
    };
  }>('/api/three-pillars', {
    refetchInterval: 60000,
  });
}

// Market Data (Bitcoin, Gold, etc.)
export function useMarketData() {
  return useApi<{
    market_data: {
      bitcoin: {
        price: number;
        hash_rate: number;
        source: string;
      };
      commodities: {
        gold: number;
        silver: number;
        oil: number;
        copper: number;
      };
      interest_rates: {
        fed_funds: number;
        '10y_treasury': number;
        natural_rate_estimate: number;
      };
      yield_curve: {
        inverted: boolean;
        '10y_2y_spread': number;
      };
      economic_indicators: {
        ppi: number;
        cpi: number;
        gdp_growth: number;
        manufacturing_pmi: number;
      };
      system_status: string;
      austrian_score: number;
    };
    generated_at: string;
  }>('/api/market-data', {
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Bitcoin Price (dedicated endpoint)
export function useBitcoinPrice() {
  return useApi<{
    symbol: string;
    price: number;
    source: string;
    timestamp: string;
  }>('/api/bitcoin-price', {
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

// System Status
export function useSystemStatus() {
  return useApi<{
    status: string;
    version: string;
    timestamp: string;
    monitor_active: boolean;
    metrics: Record<string, number>;
  }>('/api/status', {
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// Detailed Cycle Analysis
export function useCycleAnalysis() {
  return useApi<{
    timestamp: string;
    cycle_phase: string;
    monetary_policy_risk: number;
    credit_market_risk: number;
    real_economy_risk: number;
    overall_risk: number;
    recommendations: string[];
    key_indicators: Record<string, number>;
    narrative: string;
  }>('/api/cycle-analysis', {
    refetchInterval: 60000,
  });
}

// Austrian Economic Insights - Dynamic, context-aware analysis from classical and modern economists
export interface AustrianInsight {
  title: string;
  content: string;
  economist: string;
  source: string;
  relevance_score: number;
  tags: string[];
}

export function useAustrianInsights() {
  return useApi<{
    timestamp: string;
    cycle_phase: string;
    overall_risk: number;
    risk_level: string;
    cycle_narrative: string;
    insights: {
      bitcoin: AustrianInsight[];
      gold_silver: AustrianInsight[];
      interest_rates: AustrianInsight[];
      stock_markets: AustrianInsight[];
      inflation: AustrianInsight[];
      commodities: AustrianInsight[];
    };
    economists_referenced: {
      classical: string[];
      modern: string[];
    };
  }>('/api/austrian-insights', {
    refetchInterval: 120000, // Refresh every 2 minutes (less frequent as insights change more slowly)
  });
}
