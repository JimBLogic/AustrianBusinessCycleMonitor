import { getRuntimeBindings, readLatestMacroSnapshot, recordMacroSnapshot } from "../../../db/runtime";

export const dynamic = "force-dynamic";

type Point = { date: string; value: number };
type SeriesSource = "api" | "csv" | "dbnomics" | "bls" | "cboe" | "worldbank" | "coinbase";
type SeriesResult = { points: Point[]; error: string | null; source?: SeriesSource };
type EngineReadiness = {
  liquidity: boolean;
  credit: boolean;
  realEconomy: boolean;
  inflation: boolean;
  fiscal: boolean;
};

const FRED: Record<string, string> = {
  m2: "M2SL",
  fedFunds: "FEDFUNDS",
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
};

function parseCsv(text: string): Point[] {
  return text.trim().split(/\r?\n/).slice(1).map((row) => {
    const comma = row.indexOf(",");
    return { date: row.slice(0, comma), value: Number(row.slice(comma + 1)) };
  }).filter((point) => point.date && Number.isFinite(point.value));
}

function parseFredBatchCsv(text: string): Record<string, Point[]> {
  const rows = text.trim().split(/\r?\n/);
  const headers = rows.shift()?.split(",") ?? [];
  const output = Object.fromEntries(Object.values(FRED).map((id) => [id, [] as Point[]]));
  for (const row of rows) {
    const columns = row.split(",");
    const date = columns[0];
    if (!date || date < "2015-01-01") continue;
    headers.slice(1).forEach((id, index) => {
      const value = Number(columns[index + 1]);
      if (output[id] && columns[index + 1] !== "" && Number.isFinite(value)) {
        output[id].push({ date, value });
      }
    });
  }
  return output;
}

async function fetchWithDeadline(input: string | URL, init: RequestInit, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`upstream timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function fredSeries(series: string, force: boolean): Promise<SeriesResult> {
  const fredApiKey = getRuntimeBindings()?.FRED_API_KEY;
  if (fredApiKey) {
    try {
      const apiUrl = new URL("https://api.stlouisfed.org/fred/series/observations");
      apiUrl.searchParams.set("series_id", series);
      apiUrl.searchParams.set("api_key", fredApiKey);
      apiUrl.searchParams.set("file_type", "json");
      apiUrl.searchParams.set("observation_start", "2015-01-01");
      const apiResponse = await fetchWithDeadline(apiUrl, {
        headers: { Accept: "application/json" },
        ...(force ? {} : { cf: { cacheTtl: 900, cacheEverything: true } }),
      } as RequestInit, 8000);
      if (apiResponse.ok) {
        const payload = await apiResponse.json() as { observations?: Array<{ date: string; value: string }> };
        const points = (payload.observations ?? []).map((item) => ({
          date: item.date,
          value: Number(item.value),
        })).filter((point) => Number.isFinite(point.value));
        if (points.length) return { points, error: null, source: "api" };
      }
      await apiResponse.body?.cancel();
      console.warn(`[upstream:FRED_API] ${series} HTTP ${apiResponse.status}`);
    } catch (error) {
      console.warn(`[upstream:FRED_API] ${series} ${error instanceof Error ? error.message : "request failed"}`);
      // Fall through to the official CSV endpoint.
    }
  }
  try {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}&cosd=2015-01-01`;
    const response = await fetchWithDeadline(url, {
      headers: { Accept: "text/csv" },
      ...(force ? {} : { cf: { cacheTtl: 900, cacheEverything: true } }),
    } as RequestInit, 8000);
    if (!response.ok) {
      await response.body?.cancel();
      console.warn(`[upstream:FRED_CSV] ${series} HTTP ${response.status}`);
      return { points: [], error: `HTTP ${response.status}` };
    }
    const points = parseCsv(await response.text());
    return { points, error: points.length ? null : "empty series", source: "csv" };
  } catch (error) {
    console.warn(`[upstream:FRED_CSV] ${series} ${error instanceof Error ? error.message : "request failed"}`);
    return { points: [], error: error instanceof Error ? error.message : "fetch failed" };
  }
}

async function fredBatch(force: boolean): Promise<Record<string, SeriesResult>> {
  try {
    const url = new URL("https://fred.stlouisfed.org/graph/fredgraph.csv");
    url.searchParams.set("id", Object.values(FRED).join(","));
    url.searchParams.set("cosd", "2015-01-01");
    const response = await fetchWithDeadline(url, {
      headers: { Accept: "text/csv" },
      ...(force ? {} : { cf: { cacheTtl: 900, cacheEverything: true } }),
    } as RequestInit, 12000);
    if (!response.ok) {
      await response.body?.cancel();
      console.warn(`[upstream:FRED_CSV_BATCH] HTTP ${response.status}`);
      return Object.fromEntries(Object.keys(FRED).map((key) => [key, { points: [], error: `HTTP ${response.status}` }]));
    }
    const byId = parseFredBatchCsv(await response.text());
    return Object.fromEntries(Object.entries(FRED).map(([key, id]) => [
      key,
      { points: byId[id] ?? [], error: byId[id]?.length ? null : "empty series", source: "csv" },
    ]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    console.warn(`[upstream:FRED_CSV_BATCH] ${message}`);
    return Object.fromEntries(Object.keys(FRED).map((key) => [key, { points: [], error: message }]));
  }
}

function emptyFredResults(error: string): Record<string, SeriesResult> {
  return Object.fromEntries(Object.keys(FRED).map((key) => [key, { points: [], error }]));
}

async function safeJson(url: string, force: boolean, timeoutMs = 6000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetchWithDeadline(url, {
        headers: { Accept: "application/json" },
        ...(force ? {} : { cf: { cacheTtl: 30, cacheEverything: true } }),
      } as RequestInit, timeoutMs);
      if (response.ok) return await response.json();
      await response.body?.cancel();
      const target = new URL(url);
      console.warn(`[upstream:${target.hostname}${target.pathname}] HTTP ${response.status}`);
      if (response.status < 500 && response.status !== 429) return null;
    } catch (error) {
      const target = new URL(url);
      console.warn(`[upstream:${target.hostname}${target.pathname}] ${error instanceof Error ? error.message : "request failed"}`);
      if (attempt === 1) return null;
    }
  }
  return null;
}

async function safeText(url: string, timeoutMs = 6000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetchWithDeadline(url, {
        headers: { Accept: "text/plain, text/csv, */*" },
      } as RequestInit, timeoutMs);
      if (response.ok) return await response.text();
      await response.body?.cancel();
      const target = new URL(url);
      console.warn(`[upstream:${target.hostname}${target.pathname}] HTTP ${response.status}`);
      if (response.status < 500 && response.status !== 429) return null;
    } catch (error) {
      const target = new URL(url);
      console.warn(`[upstream:${target.hostname}${target.pathname}] ${error instanceof Error ? error.message : "request failed"}`);
      if (attempt === 1) return null;
    }
  }
  return null;
}

async function runLimited<T>(jobs: Array<() => Promise<T>>, concurrency = 3): Promise<T[]> {
  const output = new Array<T>(jobs.length);
  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const index = cursor++;
      output[index] = await jobs[index]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker()));
  return output;
}

function normalizedDate(period: string) {
  if (/^\d{4}$/.test(period)) return `${period}-01-01`;
  if (/^\d{4}-\d{2}$/.test(period)) return `${period}-01`;
  const quarter = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) return `${quarter[1]}-${String((Number(quarter[2]) - 1) * 3 + 1).padStart(2, "0")}-01`;
  return period.slice(0, 10);
}

async function dbnomicsSeries(provider: string, dataset: string, code: string, force: boolean): Promise<SeriesResult> {
  const url = `https://api.db.nomics.world/v22/series/${encodeURIComponent(provider)}/${encodeURIComponent(dataset)}/${encodeURIComponent(code)}?observations=1`;
  const payload = await safeJson(url, force, 12000);
  const document = payload?.series?.docs?.[0] as { period?: string[]; value?: Array<number | string | null> } | undefined;
  if (!document?.period || !document.value) return { points: [], error: "DBnomics unavailable" };
  const points = document.period.map((period, index) => ({
    date: normalizedDate(period),
    value: Number(document.value?.[index]),
  })).filter((point) => point.date >= "2015-01-01" && Number.isFinite(point.value));
  return { points, error: points.length ? null : "empty series", source: "dbnomics" };
}

function differenceSeries(left: Point[], right: Point[]) {
  const rightByDate = new Map(right.map((point) => [point.date, point.value]));
  return left.flatMap((point) => {
    const other = rightByDate.get(point.date);
    return other == null ? [] : [{ date: point.date, value: point.value - other }];
  });
}

async function blsMacro(): Promise<{ cpi: SeriesResult; unemployment: SeriesResult }> {
  try {
    const endYear = new Date().getUTCFullYear();
    const response = await fetchWithDeadline("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: ["CUSR0000SA0", "LNS14000000"],
        startyear: String(endYear - 9),
        endyear: String(endYear),
      }),
    }, 12000);
    if (!response.ok) {
      await response.body?.cancel();
      console.warn(`[upstream:api.bls.gov/publicAPI/v2/timeseries/data] HTTP ${response.status}`);
      const error = { points: [], error: `HTTP ${response.status}` };
      return { cpi: error, unemployment: error };
    }
    const payload = await response.json() as {
      Results?: { series?: Array<{ seriesID: string; data?: Array<{ year: string; period: string; value: string }> }> };
    };
    const parse = (seriesId: string): SeriesResult => {
      const rows = payload.Results?.series?.find((item) => item.seriesID === seriesId)?.data ?? [];
      const points = rows.flatMap((item) => /^M(0[1-9]|1[0-2])$/.test(item.period)
        ? [{ date: `${item.year}-${item.period.slice(1)}-01`, value: Number(item.value) }]
        : []).filter((point) => Number.isFinite(point.value)).sort((a, b) => a.date.localeCompare(b.date));
      return { points, error: points.length ? null : "empty series", source: "bls" };
    };
    return { cpi: parse("CUSR0000SA0"), unemployment: parse("LNS14000000") };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    console.warn(`[upstream:api.bls.gov/publicAPI/v2/timeseries/data] ${message}`);
    const result = { points: [], error: message };
    return { cpi: result, unemployment: result };
  }
}

async function cboeSeries(code: "SPX" | "VIX"): Promise<SeriesResult> {
  const text = await safeText(`https://cdn.cboe.com/api/global/us_indices/daily_prices/${code}_History.csv`, 12000);
  if (!text) return { points: [], error: "Cboe unavailable" };
  const points = text.trim().split(/\r?\n/).slice(1).flatMap((row) => {
    const columns = row.split(",");
    const match = columns[0]?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const value = Number(columns.at(-1));
    if (!match || !Number.isFinite(value)) return [];
    return [{ date: `${match[3]}-${match[1]}-${match[2]}`, value }];
  }).filter((point) => point.date >= "2015-01-01");
  return { points, error: points.length ? null : "empty series", source: "cboe" };
}

async function worldBankSeries(indicator: string, force: boolean): Promise<SeriesResult> {
  const payload = await safeJson(
    `https://api.worldbank.org/v2/country/USA/indicator/${encodeURIComponent(indicator)}?format=json&per_page=100`,
    force,
    12000,
  );
  const rows = Array.isArray(payload?.[1]) ? payload[1] as Array<{ date?: string; value?: number | null }> : [];
  const points = rows.flatMap((item) => item.date && Number.isFinite(item.value)
    ? [{ date: `${item.date}-01-01`, value: Number(item.value) }]
    : []).filter((point) => point.date >= "2015-01-01").sort((a, b) => a.date.localeCompare(b.date));
  return { points, error: points.length ? null : "World Bank unavailable", source: "worldbank" };
}

async function fillMacroFallbacks(results: Record<string, SeriesResult>, force: boolean) {
  const [m2, fedFunds, tenYear, twoYear, baa, dollar, industrial, capacity, oil] = await runLimited([
    () => dbnomicsSeries("FED", "H6_H6_M2", "M2.M", force),
    () => dbnomicsSeries("FED", "H15", "RIFSPFF_N.M", force),
    () => dbnomicsSeries("FED", "H15", "RIFLGFCY10_N.M", force),
    () => dbnomicsSeries("FED", "H15", "RIFLGFCY02_N.M", force),
    () => dbnomicsSeries("FED", "H15_discontinued", "RIMLPBAAR_N.M", force),
    () => dbnomicsSeries("FED", "H10", "JRXWTFB_N.M", force),
    () => dbnomicsSeries("FED", "G17_IP_MAJOR_INDUSTRY_GROUPS", "IP.B50001.S", force),
    () => dbnomicsSeries("FED", "G17_CAPUTL", "CAPUTL.B50001.S", force),
    () => dbnomicsSeries("EIA", "PET", "RWTC.D", force),
  ], 3);

  if (!results.m2.points.length) results.m2 = m2;
  if (!results.fedFunds.points.length) results.fedFunds = fedFunds;
  if (!results.yieldCurve.points.length) {
    const points = differenceSeries(tenYear.points, twoYear.points);
    results.yieldCurve = { points, error: points.length ? null : "yield curve unavailable", source: "dbnomics" };
  }
  if (!results.creditSpread.points.length) {
    const points = differenceSeries(baa.points, tenYear.points);
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
    results.creditSpread = points.at(-1)?.date && points.at(-1)!.date >= cutoff.toISOString().slice(0, 10)
      ? { points, error: null, source: "dbnomics" }
      : { points: [], error: "BAA source is stale" };
  }
  if (!results.dollar.points.length) results.dollar = dollar;
  if (!results.industrialProduction.points.length) results.industrialProduction = industrial;
  if (!results.capacityUtilization.points.length) results.capacityUtilization = capacity;
  if (!results.oil.points.length) results.oil = oil;

  const [labour, sp500, vix] = await Promise.all([blsMacro(), cboeSeries("SPX"), cboeSeries("VIX")]);
  if (!results.cpi.points.length) results.cpi = labour.cpi;
  if (!results.unemployment.points.length) results.unemployment = labour.unemployment;
  if (!results.sp500.points.length) results.sp500 = sp500;
  if (!results.vix.points.length) results.vix = vix;
  // VIX and the BAA–10Y spread describe different markets. If the spread is
  // unavailable it remains unavailable; ABCM does not synthesize one from VIX.

  const [debtToGdp, gdpGrowth, nominalGdp] = await Promise.all([
    worldBankSeries("GC.DOD.TOTL.GD.ZS", force),
    worldBankSeries("NY.GDP.MKTP.KD.ZG", force),
    worldBankSeries("NY.GDP.MKTP.CD", force),
  ]);
  if (!results.debtToGdp.points.length) results.debtToGdp = debtToGdp;
  if (!results.realGdpGrowth.points.length) results.realGdpGrowth = gdpGrowth;
  if (!results.federalDebt.points.length) {
    const debtRatio = new Map(debtToGdp.points.map((point) => [point.date, point.value]));
    const points = nominalGdp.points.flatMap((point) => {
      const ratio = debtRatio.get(point.date);
      return ratio == null ? [] : [{ date: point.date, value: point.value * ratio / 100 / 1_000_000_000 }];
    });
    results.federalDebt = { points, error: points.length ? null : "debt unavailable", source: "worldbank" };
  }

  if (!results.gold.points.length) {
    const paxg = await safeJson("https://api.coinbase.com/v2/prices/PAXG-USD/spot", true);
    const value = Number(paxg?.data?.amount);
    if (Number.isFinite(value)) {
      results.gold = {
        points: [{ date: new Date().toISOString().slice(0, 10), value }],
        error: null,
        source: "coinbase",
      };
    }
  }
}

function latest(points: Point[]) {
  return points.at(-1) ?? null;
}

function valueBefore(points: Point[], days: number) {
  const end = latest(points);
  if (!end) return null;
  const cutoff = new Date(end.date).getTime() - days * 86_400_000;
  let candidate: Point | null = null;
  for (const point of points) {
    if (new Date(point.date).getTime() <= cutoff) candidate = point;
    else break;
  }
  return candidate;
}

function change(points: Point[], days: number) {
  const end = latest(points);
  const start = valueBefore(points, days);
  if (!end || !start || start.value === 0) return null;
  return ((end.value / start.value) - 1) * 100;
}

function delta(points: Point[], days: number) {
  const end = latest(points);
  const start = valueBefore(points, days);
  return end && start ? end.value - start.value : null;
}

function monthlyReturns(points: Point[]) {
  const months = new Map<string, number>();
  for (const point of points) months.set(point.date.slice(0, 7), point.value);
  const entries = [...months.entries()].sort(([a], [b]) => a.localeCompare(b));
  const returns = new Map<string, number>();
  for (let i = 1; i < entries.length; i++) {
    const [month, value] = entries[i];
    const previous = entries[i - 1][1];
    if (previous) returns.set(month, (value / previous) - 1);
  }
  return returns;
}

function correlation(a: Point[], b: Point[]) {
  const ar = monthlyReturns(a);
  const br = monthlyReturns(b);
  const pairs = [...ar.entries()].filter(([month]) => br.has(month)).slice(-60)
    .map(([month, value]) => [value, br.get(month)!]);
  if (pairs.length < 8) return null;
  const meanA = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
  const meanB = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
  const numerator = pairs.reduce((sum, pair) => sum + (pair[0] - meanA) * (pair[1] - meanB), 0);
  const denominator = Math.sqrt(
    pairs.reduce((sum, pair) => sum + (pair[0] - meanA) ** 2, 0) *
    pairs.reduce((sum, pair) => sum + (pair[1] - meanB) ** 2, 0),
  );
  return denominator ? numerator / denominator : null;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function n(value: number | null | undefined, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export async function GET(request: Request) {
  void request;
  // Public reads always use the shared refresh window. A query parameter must
  // never let one visitor fan out uncached requests to every upstream provider.
  const force = false;
  const runtimeIsSites = Boolean(getRuntimeBindings()?.DB);

  let results: Record<string, SeriesResult>;
  if (getRuntimeBindings()?.FRED_API_KEY) {
    const fredEntries: Array<readonly [string, SeriesResult]> = [];
    const definitions = Object.entries(FRED);
    for (let index = 0; index < definitions.length; index += 3) {
      fredEntries.push(...await Promise.all(definitions.slice(index, index + 3).map(async ([key, id]) => {
        const result = await fredSeries(id, force);
        return [key, result] as const;
      })));
    }
    results = Object.fromEntries(fredEntries) as Record<string, SeriesResult>;
  } else if (!runtimeIsSites) {
    results = await fredBatch(force);
  } else {
    results = emptyFredResults("FRED REST key not configured");
  }
  if (Object.values(results).some((result) => !result.points.length)) {
    await fillMacroFallbacks(results, force);
  }

  let persistedSnapshot: Awaited<ReturnType<typeof readLatestMacroSnapshot>> = null;
  try {
    persistedSnapshot = await readLatestMacroSnapshot();
    const persistedSeries = persistedSnapshot?.metrics?.series as Record<string, Point[]> | undefined;
    if (persistedSeries) {
      for (const [key, result] of Object.entries(results)) {
        const backup = persistedSeries[key];
        if (!result.points.length && Array.isArray(backup) && backup.length) {
          results[key] = {
            points: backup,
            error: "live providers unavailable; last verified snapshot",
            source: result.source,
          };
        }
      }
    }
  } catch {
    // Persistence is a circuit breaker, never a requirement for public reads.
  }
  const series = Object.fromEntries(Object.entries(results).map(([key, result]) => [key, result.points])) as Record<string, Point[]>;

  const [coinbase, coin, chain] = await Promise.all([
    safeJson("https://api.exchange.coinbase.com/products/BTC-USD/ticker", true),
    runtimeIsSites
      ? Promise.resolve(null)
      : safeJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true", true),
    safeJson("https://blockchain.info/stats?format=json", true),
  ]);
  const [fees, heightText, bitcoinChart] = await Promise.all([
    safeJson("https://mempool.space/api/v1/fees/recommended", true),
    safeText("https://mempool.space/api/blocks/tip/height"),
    safeJson("https://api.blockchain.info/charts/market-price?timespan=5years&format=json&sampled=true", force),
  ]);
  const treasury = runtimeIsSites
    ? null
    : await safeJson("https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?filter=record_date:gte:2015-01-01&sort=record_date&page%5Bsize%5D=10000", force);

  const bitcoinHistory: Point[] = Array.isArray(bitcoinChart?.values)
    ? bitcoinChart.values.map((item: { x: number; y: number }) => ({
        date: new Date(item.x * 1000).toISOString().slice(0, 10),
        value: Number(item.y),
      })).filter((point: Point) => Number.isFinite(point.value))
    : [];

  const treasuryDebt: Point[] = Array.isArray(treasury?.data)
    ? treasury.data.map((item: { record_date?: string; tot_pub_debt_out_amt?: string }) => ({
        date: String(item.record_date ?? ""),
        value: Number(item.tot_pub_debt_out_amt) / 1_000_000_000,
      })).filter((point: Point) => point.date && Number.isFinite(point.value))
    : [];
  if (treasuryDebt.length) series.treasuryDebt = treasuryDebt;

  const coinbasePrice = Number(coinbase?.price);
  const bitcoinPrice = Number.isFinite(coinbasePrice) ? coinbasePrice : coin?.bitcoin?.usd ?? chain?.market_price_usd ?? latest(bitcoinHistory)?.value ?? null;
  const supply = coin?.bitcoin?.usd_market_cap && bitcoinPrice
    ? coin.bitcoin.usd_market_cap / bitcoinPrice
    : chain?.totalbc ? chain.totalbc / 100_000_000 : 0;
  const annualFlow = 3.125 * 144 * 365;

  const m2Growth = change(series.m2, 365);
  const rateChange = delta(series.fedFunds, 365);
  const cpiGrowth = change(series.cpi, 365);
  const oilMomentum = change(series.oil, 90);
  const dollarMomentum = change(series.dollar, 90);
  const industrialGrowth = change(series.industrialProduction, 365);
  const unemploymentChange = delta(series.unemployment, 365);
  const capacityChange = delta(series.capacityUtilization, 365);
  const debtSeries = treasuryDebt.length ? treasuryDebt : series.federalDebt;
  const debtGrowth = change(debtSeries, 365);
  const debtToGdp = latest(series.debtToGdp)?.value ?? null;
  const realRate = latest(series.fedFunds) && cpiGrowth != null
    ? latest(series.fedFunds)!.value - cpiGrowth : null;
  const engineReady: EngineReadiness = {
    liquidity: [m2Growth, rateChange, realRate].every(Number.isFinite),
    credit: [latest(series.creditSpread)?.value, latest(series.yieldCurve)?.value, latest(series.vix)?.value].every(Number.isFinite),
    realEconomy: [industrialGrowth, unemploymentChange, capacityChange].every(Number.isFinite),
    inflation: [cpiGrowth, oilMomentum, dollarMomentum].every(Number.isFinite),
    fiscal: [debtToGdp, debtGrowth].every(Number.isFinite),
  };
  const modelInputs = [
    m2Growth, rateChange, realRate, latest(series.creditSpread)?.value,
    latest(series.yieldCurve)?.value, latest(series.vix)?.value,
    industrialGrowth, unemploymentChange, capacityChange, cpiGrowth,
    oilMomentum, dollarMomentum, debtToGdp, debtGrowth,
  ];
  const modelInputsAvailable = modelInputs.filter(Number.isFinite).length;
  const modelInputsTotal = modelInputs.length;
  const modelReady = Object.values(engineReady).every(Boolean);

  const liquidityScore = clamp(48 + n(m2Growth) * 5 - n(rateChange) * 7 - n(realRate) * 2);
  const creditScore = clamp(20 + n(latest(series.creditSpread)?.value) * 16 + Math.max(0, -n(latest(series.yieldCurve)?.value)) * 18 + n(latest(series.vix)?.value) * 0.8);
  const realEconomyScore = clamp(45 - n(industrialGrowth) * 5 + n(unemploymentChange) * 16 - n(capacityChange) * 4);
  const inflationScore = clamp(35 + n(cpiGrowth) * 10 + n(oilMomentum) * 0.45 - n(dollarMomentum) * 0.5);
  const fiscalScore = clamp(38 + Math.max(0, n(debtToGdp) - 80) * 0.65 + n(debtGrowth) * 2);
  const weightedEngines = [
    { key: "liquidity" as const, score: liquidityScore, weight: 0.27 },
    { key: "credit" as const, score: creditScore, weight: 0.23 },
    { key: "realEconomy" as const, score: realEconomyScore, weight: 0.20 },
    { key: "inflation" as const, score: inflationScore, weight: 0.15 },
    { key: "fiscal" as const, score: fiscalScore, weight: 0.15 },
  ].filter((engine) => engineReady[engine.key]);
  const availableWeight = weightedEngines.reduce((sum, engine) => sum + engine.weight, 0);
  const composite = availableWeight >= 0.70
    ? clamp(weightedEngines.reduce((sum, engine) => sum + engine.score * engine.weight, 0) / availableWeight)
    : 0;
  const modelStatus = modelReady ? "complete" : availableWeight >= 0.70 ? "provisional" : "withheld";

  let regime = "mixed-transition";
  if (engineReady.liquidity && engineReady.credit && liquidityScore >= 62 && creditScore < 55) regime = "liquidity-led-expansion";
  else if (engineReady.liquidity && !engineReady.credit && liquidityScore >= 62) regime = "liquidity-led-credit-pending";
  if (engineReady.credit && engineReady.realEconomy && creditScore >= 65 && realEconomyScore >= 58) regime = "credit-contraction";
  if (engineReady.inflation && engineReady.realEconomy && inflationScore >= 68 && realEconomyScore >= 55) regime = "stagflation-risk";
  if (engineReady.liquidity && engineReady.realEconomy && liquidityScore < 42 && realEconomyScore < 45) regime = "disinflationary-reset";

  const correlations = {
    m2_sp500: correlation(series.m2, series.sp500),
    dollar_gold: correlation(series.dollar, series.gold),
    oil_cpi: correlation(series.oil, series.cpi),
    bitcoin_m2: correlation(bitcoinHistory, series.m2),
    bitcoin_gold: correlation(bitcoinHistory, series.gold),
    sp500_gold: correlation(series.sp500, series.gold),
  };

  const ratios = {
    bitcoinGoldOunces: bitcoinPrice && latest(series.gold) ? bitcoinPrice / latest(series.gold)!.value : null,
    sp500Gold: latest(series.sp500) && latest(series.gold) ? latest(series.sp500)!.value / latest(series.gold)!.value : null,
    debtToM2: latest(debtSeries) && latest(series.m2) ? latest(debtSeries)!.value / latest(series.m2)!.value : null,
    realRate,
  };

  const freshness = Object.entries(FRED).map(([key, id]) => ({
    key, id, observedAt: latest(series[key])?.date ?? null,
    status: results[key].error === "live providers unavailable; last verified snapshot"
      ? "last-known-good"
      : results[key].points.length ? "live" : "unavailable",
    error: results[key].error,
    source: results[key].source ?? null,
  }));
  const fredAvailable = freshness.filter((item) => item.status === "live").length;
  const fredProvenance = getRuntimeBindings()?.FRED_API_KEY
    ? "FRED API v1 (private server key)"
    : fredAvailable === Object.keys(FRED).length && freshness.every((item) => item.source === "csv")
      ? "FRED official CSV endpoint"
      : "Official-source fallback mesh (FRED REST ready)";

  const requestedAt = new Date().toISOString();
  const cacheTtlSeconds = 900;
  let payload = {
    schemaVersion: "1.0.0",
    engineVersion: "abcm-sites-3",
    requestedAt,
    observedAt: requestedAt,
    refreshMode: "shared-snapshot",
    cache: {
      generatedAt: requestedAt,
      validUntil: new Date(Date.parse(requestedAt) + cacheTtlSeconds * 1000).toISOString(),
      ttlSeconds: cacheTtlSeconds,
      mode: "shared-snapshot",
    },
    series: { ...series, bitcoin: bitcoinHistory },
    latest: Object.fromEntries(Object.entries(series).map(([key, points]) => [key, latest(points)])),
    bitcoin: {
      price: bitcoinPrice,
      change24h: coin?.bitcoin?.usd_24h_change ?? null,
      marketCap: coin?.bitcoin?.usd_market_cap ?? null,
      priceObservedAt: coinbase?.time ?? (coin?.bitcoin?.last_updated_at ? new Date(coin.bitcoin.last_updated_at * 1000).toISOString() : new Date().toISOString()),
      supply,
      stockToFlow: supply / annualFlow,
      blockHeight: heightText ? Number(heightText) : null,
      hashRate: chain?.hash_rate ?? null,
      difficulty: chain?.difficulty ?? null,
      feeFast: fees?.fastestFee ?? null,
      feeHour: fees?.hourFee ?? null,
    },
    derived: {
      changes: { m2Growth, rateChange, cpiGrowth, oilMomentum, dollarMomentum, industrialGrowth, unemploymentChange, capacityChange, debtGrowth },
      scores: { liquidity: liquidityScore, credit: creditScore, realEconomy: realEconomyScore, inflation: inflationScore, fiscal: fiscalScore, composite },
      regime,
      correlations,
      ratios,
    },
    freshness,
    provenance: {
      fred: fredProvenance,
      bitcoinPrice: Number.isFinite(coinbasePrice) ? "Coinbase Exchange" : coin?.bitcoin ? "CoinGecko" : chain ? "Blockchain.com" : "unavailable",
      bitcoinNetwork: heightText ? "Mempool.space" : "unavailable",
      bitcoinHistory: bitcoinHistory.length ? "Blockchain.com Charts" : "unavailable",
      federalDebt: treasuryDebt.length
        ? "U.S. Treasury Fiscal Data"
        : results.federalDebt.source === "worldbank"
          ? "World Bank"
          : results.federalDebt.source === "dbnomics"
            ? "DBnomics"
            : "FRED",
      fredAvailable,
      fredTotal: Object.keys(FRED).length,
      modelReady,
      modelStatus,
      modelInputsAvailable,
      modelInputsTotal,
      engineReady,
      availableWeight,
      mode: fredAvailable > 0 || bitcoinPrice || treasuryDebt.length ? "live" : "fallback",
    },
  };

  if (fredAvailable === 0 && !bitcoinPrice) {
    try {
      const persisted = persistedSnapshot ?? await readLatestMacroSnapshot();
      if (persisted) {
        payload = {
          ...payload,
          latest: persisted.metrics.latest ?? payload.latest,
          bitcoin: persisted.metrics.bitcoin ?? payload.bitcoin,
          derived: {
            ...payload.derived,
            changes: persisted.metrics.changes ?? payload.derived.changes,
            scores: persisted.scores ?? payload.derived.scores,
            regime: persisted.regime ?? payload.derived.regime,
          },
          provenance: { ...payload.provenance, ...persisted.provenance, mode: "stale-persisted" },
        };
      }
    } catch {
      // The client will retain its last valid in-memory snapshot.
    }
  }

  if (fredAvailable > 0 || bitcoinPrice || treasuryDebt.length) {
    try {
      await recordMacroSnapshot({
        requestedAt,
        refreshMode: payload.refreshMode,
        regime,
        scores: payload.derived.scores,
        metrics: { latest: payload.latest, series: payload.series, bitcoin: payload.bitcoin, changes: payload.derived.changes },
        provenance: payload.provenance,
      }, force);
    } catch {
      // Persistence must never make the public read-only macro endpoint unavailable.
    }
  }

  return Response.json(payload, {
    headers: {
      "Cache-Control": `public, s-maxage=${cacheTtlSeconds}, stale-while-revalidate=3600`,
      "X-ABCM-Refresh": "shared-snapshot",
      "X-ABCM-Next-Refresh": payload.cache.validUntil,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
