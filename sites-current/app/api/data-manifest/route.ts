import { FRED_SERIES, SOURCE_REGISTRY } from "../../data/source-registry";
import { CONTEXT_MODEL_VERSION, DATA_SCHEMA_VERSION, ENGINE_VERSION, SITE_RELEASE, SOURCE_MIRROR } from "../../version";

export async function GET() {
  return Response.json({
    schemaVersion: DATA_SCHEMA_VERSION,
    build: {
      siteRelease: SITE_RELEASE,
      engineVersion: ENGINE_VERSION,
      contextModelVersion: CONTEXT_MODEL_VERSION,
      sourceMirror: SOURCE_MIRROR,
    },
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
      correlations: "Pearson correlation on month-over-month percentage returns over shared consecutive calendar months; minimum 24 and maximum 60 paired observations. Missing months are not bridged or compared across unequal intervals.",
      ratios: {
        alignment: "Every market ratio uses monthly averages from the latest shared calendar month. A stale common month is withheld rather than mixed with a newer denominator.",
        bitcoinGold: "Average monthly BTC price divided by average monthly gold price; result in troy ounces of gold per BTC.",
        sp500Gold: "Average monthly S&P 500 index level divided by average monthly gold price. This is a dimensionless tracking ratio between index points and USD per ounce, not a directly purchasable multiple.",
        debtM2: "Gross federal debt in USD billions divided by M2 in USD billions for the same month; withheld when the latest common month is older than 160 days.",
        approximateRealRate: "Average federal funds rate minus CPI year-over-year inflation for the same calendar month; backward-looking, not an ex-ante real rate.",
      },
      sixForceContext: {
        purpose: "A non-scored context layer that keeps Treasury yields, federal debt, oil, manufacturing conditions, the broad dollar and Bitcoin visible at the same time. It does not average contradictions into a positive or negative color.",
        coverageRule: "All six forces produce a complete reading. Four or five produce an explicitly partial reading. Fewer than four withhold the synthesis.",
        treasury: "10-year Treasury level, its 90-day change and the 10Y–2Y curve. Rising, falling and range-bound describe direction; they are not value judgments.",
        debt: "Gross federal debt level and year-over-year growth. Above 5% is labeled accelerating, below 2% decelerating and the interval steady growth.",
        oil: "WTI level and 90-day percentage change. Moves above +5% or below −5% are labeled rising or falling; the interval is range-bound.",
        manufacturing: "Chicago Fed Survey of Economic Conditions Manufacturing Activity Index (CFSBCACTIVITYMFG). Values above +10 are labeled above trend, below −10 below trend and the interval near trend. Zero means average historical growth, not zero output growth.",
        pmiBoundary: "This public build does not reproduce or relabel the proprietary ISM Manufacturing PMI. The Chicago Fed series is a regional survey proxy, is always identified as not ISM PMI, and remains outside the scored ten-signal composite.",
        dollar: "Broad trade-weighted dollar level and 90-day percentage change; directional threshold ±2%.",
        bitcoin: "Verified Bitcoin spot level and 90-day percentage change from public history; directional threshold ±5%.",
        patterns: {
          energyPressureBelowTrendManufacturing: "WTI rises more than 5% while the manufacturing survey is below −10.",
          risingYieldsWithFiscalRefinancingPressure: "The 10-year yield rises more than 25 basis points over 90 days while federal debt grows more than 5% year over year.",
          dollarLiquidityTightening: "The broad dollar rises more than 2% while Bitcoin falls more than 5% over 90 days.",
          monetaryRepricing: "The broad dollar falls more than 2% while Bitcoin rises more than 5% over 90 days.",
        },
        caution: "These are conditional co-movements, not causal claims or investment signals. Divergence lowers confidence and remains visible.",
      },
      scores: {
        scale: "Every engine and the composite are clamped to 0–100. Higher means more modeled cycle pressure, not a probability.",
        tenSignalModel: {
          money: { inputs: ["M2 YoY"], formula: "clamp(50 + M2_YOY*6)", compositeWeight: 0.14 },
          monetaryStance: { inputs: ["fed funds 1Y delta", "approximate real rate"], formula: "clamp(45 - FEDFUNDS_1Y_DELTA*8 - REAL_RATE*3)", compositeWeight: 0.13 },
          creditRisk: { inputs: ["BAA–10Y spread", "VIX"], formula: "clamp(15 + BAA10Y*17 + VIX*0.9)", compositeWeight: 0.13 },
          termStructure: { inputs: ["10Y–2Y curve"], formula: "clamp(35 + max(0,-T10Y2Y)*35)", compositeWeight: 0.10 },
          production: { inputs: ["industrial production YoY", "capacity utilization 1Y delta"], formula: "clamp(45 - INDPRO_YOY*6 - CAPACITY_1Y_DELTA*5)", compositeWeight: 0.12 },
          labour: { inputs: ["unemployment 1Y delta"], formula: "clamp(35 + UNRATE_1Y_DELTA*25)", compositeWeight: 0.08 },
          consumerPrices: { inputs: ["CPI YoY"], formula: "clamp(25 + CPI_YOY*12)", compositeWeight: 0.09 },
          resourcesFx: { inputs: ["WTI 90D momentum", "broad dollar 90D momentum"], formula: "clamp(40 + WTI_90D*0.55 - DOLLAR_90D*0.65)", compositeWeight: 0.06 },
          debtBurden: { inputs: ["federal debt / GDP"], formula: "clamp(35 + max(0,DEBT_GDP-80)*0.75)", compositeWeight: 0.09 },
          fiscalImpulse: { inputs: ["federal debt YoY"], formula: "clamp(35 + DEBT_YOY*3)", compositeWeight: 0.06 },
        },
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
        composite: "clamp(money*.14 + monetaryStance*.13 + creditRisk*.13 + termStructure*.10 + production*.12 + labour*.08 + consumerPrices*.09 + resourcesFx*.06 + debtBurden*.09 + fiscalImpulse*.06)",
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
      bitcoinPrice: "Coinbase BTC-USD is confirmed against Kraken XBT-USD. A spread at or below 2% publishes the midpoint; a larger divergence is disclosed and retains the primary observation. A single valid venue is labeled single-source.",
    },
    sources: {
      registry: SOURCE_REGISTRY,
      fredSeries: FRED_SERIES,
    },
    security: {
      secrets: "No browser-exposed API secrets are required by the temporary backend.",
      upstreams: "The server calls a fixed allowlist of upstream endpoints; it is not an open proxy.",
      caching: "GET serves one durable shared edition for up to 24 hours. POST requests a newer edition only when the latest durable snapshot is at least 15 minutes old. Query parameters cannot bypass either gate.",
    },
    reliability: {
      strategy: ["durable 24-hour D1 edition", "15-minute server-enforced manual refresh gate", "typed provider registry", "official source before independent fallback", "bounded exponential backoff for transient 5xx, 429 and network failures", "per-provider circuit breaker after repeated failures", "Retry-After-aware cooldown", "6–12 second per-attempt timeouts", "deterministic date sorting and duplicate removal", "per-series D1 last-known-good recovery", "explicit live / stale / backup / unavailable states", "provisional model only above a 70% complete-signal threshold"],
      semantics: "A fresh request does not imply a new official observation. The response separates requestedAt from each series observedAt.",
    },
    inspiration: {
      project: "World Monitor / Finance Monitor",
      repository: "https://github.com/koala73/worldmonitor",
      liveReference: "https://finance.worldmonitor.app/",
      adoptedIdeas: ["provider health as product UI", "separate macro and market refresh cadences", "redundant market observations", "clear provenance"],
      boundary: "Architectural inspiration only. No World Monitor code, styles or undocumented endpoints are copied; ABCM keeps its own scope, implementation and source contracts.",
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
