export async function GET() {
  return Response.json({
    schemaVersion: "1.0.0",
    methodology: {
      originalThreePillars: {
        source: "Original AustrianBusinessCycleMonitor implementation",
        reference: "https://github.com/JimBLogic/AustrianBusinessCycleMonitor/commit/0acc1a2deb695d167e302c81966344056fb75189",
        pillars: ["monetary policy", "credit markets", "real economy"],
        mapping: {
          monetaryPolicy: "liquidity score",
          creditMarkets: "credit score",
          realEconomy: "real-economy score",
        },
        note: "The three-pillar grouping and its inflation and fiscal extensions are ABCM's operational methodology. Named educational influences are not presented as formal authors of this structure, formula or index.",
      },
      correlations: "Pearson correlation on overlapping monthly percentage returns, maximum 60 observations.",
      ratios: ["BTC / gold", "S&P 500 / gold", "US federal debt / M2", "fed funds minus CPI YoY"],
      scores: {
        scale: "Every engine and the composite are clamped to 0–100. Higher means more modeled cycle pressure, not a probability.",
        liquidity: {
          inputs: ["M2 YoY", "fed funds 1Y delta", "approximate real rate"],
          formula: "clamp(48 + M2_YOY*5 - FEDFUNDS_1Y_DELTA*7 - REAL_RATE*2)",
          compositeWeight: 0.27,
        },
        credit: {
          inputs: ["BAA–10Y spread", "10Y–2Y curve", "VIX"],
          formula: "clamp(20 + BAA10Y*16 + max(0,-T10Y2Y)*18 + VIX*0.8)",
          compositeWeight: 0.23,
        },
        realEconomy: {
          inputs: ["industrial production YoY", "unemployment 1Y delta", "capacity utilization 1Y delta"],
          formula: "clamp(45 - INDPRO_YOY*5 + UNRATE_1Y_DELTA*16 - CAPACITY_1Y_DELTA*4)",
          compositeWeight: 0.2,
        },
        inflation: {
          inputs: ["CPI YoY", "WTI 90D momentum", "broad dollar 90D momentum"],
          formula: "clamp(35 + CPI_YOY*10 + WTI_90D*0.45 - DOLLAR_90D*0.5)",
          compositeWeight: 0.15,
        },
        fiscal: {
          inputs: ["federal debt YoY", "federal debt / GDP"],
          formula: "clamp(38 + max(0,DEBT_GDP-80)*0.65 + DEBT_YOY*2)",
          compositeWeight: 0.15,
        },
        composite: "clamp(liquidity*0.27 + credit*0.23 + realEconomy*0.20 + inflation*0.15 + fiscal*0.15)",
        bands: [
          { range: "0–20", label: "low distortion" },
          { range: "21–40", label: "contained distortion" },
          { range: "41–60", label: "mixed transition" },
          { range: "61–80", label: "elevated distortion" },
          { range: "81–100", label: "extreme distortion" },
        ],
      },
      warning: "Scores and regimes are transparent analytical models, not official statistics or investment advice.",
      publicationRule: "A complete score requires every declared input. With at least 70% of engine weight available, the interface may publish an explicitly provisional composite by renormalizing only complete engines. Missing observations are never assigned zero or presented as neutral. Below that threshold the composite is withheld.",
    },
    sources: [
      { provider: "FRED API v1", cadence: "daily, monthly or quarterly depending on series", authentication: "optional FRED_API_KEY stored as a server secret; official CSV endpoint is the fallback", keys: ["M2SL", "FEDFUNDS", "T10Y2Y", "BAA10Y", "CPIAUCSL", "UNRATE", "GFDEBTN", "GFDEGDQ188S", "DCOILWTICO", "GOLDAMGBD228NLBM", "DTWEXBGS", "SP500", "VIXCLS", "INDPRO", "TCU", "A191RL1Q225SBEA"] },
      { provider: "U.S. Treasury Fiscal Data", cadence: "daily", authentication: "none", keys: ["Debt to the Penny"] },
      { provider: "Coinbase Exchange", cadence: "queried on refresh", authentication: "none for public ticker", keys: ["BTC-USD ticker"] },
      { provider: "CoinGecko", cadence: "queried on refresh", role: "fallback and enrichment", keys: ["bitcoin price", "24h change", "market cap"] },
      { provider: "Blockchain.com Charts", cadence: "queried on refresh", keys: ["bitcoin five-year market-price history"] },
      { provider: "Mempool.space", cadence: "queried on refresh", keys: ["block height", "recommended fees"] },
    ],
    security: {
      secrets: "No browser-exposed API secrets are required by the temporary backend.",
      upstreams: "The server calls a fixed allowlist of upstream endpoints; it is not an open proxy.",
      caching: "Manual refresh uses no-store. Standard polling may be cached for 60 seconds.",
    },
    reliability: {
      strategy: ["primary provider plus independent provider fallbacks", "parallel upstream requests", "6–12 second per-provider timeouts", "one retry for transient 5xx, 429 and network failures", "per-series D1 last-known-good recovery", "explicit live / backup / unavailable states", "provisional model only above a 70% complete-engine threshold"],
      semantics: "A fresh request does not imply a new official observation. The response separates requestedAt from each series observedAt.",
    },
    migration: {
      target: "AWS Lambda + API Gateway or containerized service behind CloudFront",
      contract: "Keep /api/data response schema stable and point the frontend base URL to the AWS endpoint.",
    },
  }, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
