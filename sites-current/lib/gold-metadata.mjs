// A separate monthly context metric, never an equivalent daily LBMA fallback.
export const WORLD_BANK_GOLD = Object.freeze({
  metric: 'World Bank Pink Sheet / Gold / monthly average',
  provider: 'World Bank Pink Sheet',
  frequency: 'monthly',
  aggregation: 'monthly mean',
  unit: 'USD per troy ounce, monthly mean',
  observationDateMeaning: 'Month label (first day), not a spot-quote timestamp',
  equivalentToDailyLbma: false,
  usage: 'Monthly historical context and month-aligned ratios; not live spot',
  configured: 'Separate World Bank monthly gold context; no verified equivalent daily LBMA backup',
  explanation: 'Monthly World Bank context series; not live spot or an equivalent daily LBMA backup',
  sourceUrl: 'https://www.worldbank.org/en/research/commodity-markets',
});
