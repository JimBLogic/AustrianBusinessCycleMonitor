export type SourceRole = "primary" | "fallback" | "enrichment";

export type SourceDefinition = {
  id: string;
  provider: string;
  role: SourceRole;
  authentication: "none" | "optional-server-key";
  transport: "json" | "csv" | "text";
  timeoutMs: number;
  maxAttempts: number;
  notes: string;
};

export const FRED_SERIES = {
  m2: "M2SL",
  fedFunds: "FEDFUNDS",
  treasury10y: "DGS10",
  treasury2y: "DGS2",
  yieldCurve: "T10Y2Y",
  creditSpread: "BAA10Y",
  cpi: "CPIAUCSL",
  unemployment: "UNRATE",
  federalDebt: "GFDEBTN",
  debtToGdp: "GFDEGDQ188S",
  oil: "DCOILWTICO",
  gold: "GOLDAMGBD228NLBM",
  dollar: "DTWEXBGS",
  sp500: "SP500",
  vix: "VIXCLS",
  industrialProduction: "INDPRO",
  capacityUtilization: "TCU",
  realGdpGrowth: "A191RL1Q225SBEA",
  manufacturingSurvey: "CFSBCACTIVITYMFG",
} as const;

export type FredSeriesKey = keyof typeof FRED_SERIES;

export const MAX_OBSERVATION_AGE_DAYS: Record<FredSeriesKey, number> = {
  m2: 75,
  fedFunds: 75,
  treasury10y: 14,
  treasury2y: 14,
  yieldCurve: 14,
  creditSpread: 14,
  cpi: 75,
  unemployment: 75,
  federalDebt: 160,
  debtToGdp: 160,
  oil: 14,
  gold: 14,
  dollar: 14,
  sp500: 14,
  vix: 14,
  industrialProduction: 75,
  capacityUtilization: 75,
  realGdpGrowth: 160,
  manufacturingSurvey: 75,
};

export const SOURCE_REGISTRY: readonly SourceDefinition[] = [
  {
    id: "fred-rest",
    provider: "FRED API v1",
    role: "primary",
    authentication: "optional-server-key",
    transport: "json",
    timeoutMs: 8_000,
    maxAttempts: 2,
    notes: "Official observations; the key is held only by the server.",
  },
  {
    id: "fred-csv",
    provider: "FRED official CSV",
    role: "primary",
    authentication: "none",
    transport: "csv",
    timeoutMs: 5_000,
    maxAttempts: 1,
    notes: "Official keyless batch endpoint and first no-key path.",
  },
  {
    id: "dbnomics",
    provider: "DBnomics",
    role: "fallback",
    authentication: "none",
    transport: "json",
    timeoutMs: 5_000,
    maxAttempts: 1,
    notes: "Independent distribution path for official-provider series.",
  },
  {
    id: "bls",
    provider: "U.S. Bureau of Labor Statistics",
    role: "fallback",
    authentication: "none",
    transport: "json",
    timeoutMs: 12_000,
    maxAttempts: 2,
    notes: "Exact seasonally adjusted CPI and unemployment. v1 without key; v2 with optional BLS_API_KEY. Respect daily quotas.",
  },
  {
    id: "cboe",
    provider: "Cboe",
    role: "fallback",
    authentication: "none",
    transport: "csv",
    timeoutMs: 12_000,
    maxAttempts: 2,
    notes: "Official daily CLOSE/SPX, canonical cdn-api host then legacy host. Same producer, separate transport paths.",
  },
  {
    id: "world-bank",
    provider: "World Bank",
    role: "fallback",
    authentication: "none",
    transport: "json",
    timeoutMs: 12_000,
    maxAttempts: 2,
    notes: "Context only. Annual World Bank data must not replace quarterly US federal-debt/GDP series.",
  },
  {
    id: "world-bank-pink-sheet",
    provider: "World Bank Pink Sheet",
    role: "fallback",
    authentication: "none",
    transport: "text",
    timeoutMs: 15_000,
    maxAttempts: 2,
    notes: "Official monthly commodity-price workbook used for gold history when the former FRED series is unavailable.",
  },
  {
    id: "coinbase",
    provider: "Coinbase Exchange",
    role: "primary",
    authentication: "none",
    transport: "json",
    timeoutMs: 6_000,
    maxAttempts: 2,
    notes: "Public BTC-USD ticker.",
  },
  {
    id: "kraken",
    provider: "Kraken",
    role: "fallback",
    authentication: "none",
    transport: "json",
    timeoutMs: 6_000,
    maxAttempts: 2,
    notes: "Public XBT-USD ticker used to confirm or back up Coinbase.",
  },
  {
    id: "blockchain",
    provider: "Blockchain.com",
    role: "fallback",
    authentication: "none",
    transport: "json",
    timeoutMs: 6_000,
    maxAttempts: 2,
    notes: "Bitcoin price history and network fallback.",
  },
  {
    id: "mempool",
    provider: "Mempool.space",
    role: "enrichment",
    authentication: "none",
    transport: "json",
    timeoutMs: 6_000,
    maxAttempts: 2,
    notes: "Block height and fee estimates.",
  },
] as const;

export function sourcePolicy(id: string) {
  const source = SOURCE_REGISTRY.find((item) => item.id === id);
  if (!source) throw new Error(`Unknown upstream source: ${id}`);
  return source;
}
