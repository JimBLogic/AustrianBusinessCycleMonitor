// User types
export interface User {
  id: string
  email: string
  full_name?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

// Analysis types
export interface CycleAnalysis {
  timestamp: string
  cycle_phase: string
  monetary_policy_risk: number
  credit_market_risk: number
  real_economy_risk: number
  overall_risk: number
  recommendations: string[]
  key_indicators: Record<string, number>
  narrative: string
}

export interface ThreePillarsData {
  timestamp: string
  monetary_policy: PillarData
  credit_markets: PillarData
  real_economy: PillarData
}

export interface PillarData {
  status: string
  risk_level: string
  metrics: Record<string, number | string>
}

export interface AustrianScore {
  score: number
  timestamp: string
  interpretation: string
}

// Market types
export interface AssetPrice {
  symbol: string
  price: number
  change_24h?: number
  source: string
  timestamp: string
}

export interface MarketData {
  timestamp: string
  bitcoin: AssetPrice
  gold?: AssetPrice
  silver?: AssetPrice
  interest_rates: Record<string, number>
  yield_curve: Record<string, number | boolean>
  economic_indicators: Record<string, number>
}

// API Response types
export interface ApiError {
  error: string
  message: string
  detail?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
