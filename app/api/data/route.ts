import { finiteObservation, normalizeSeries, parseFredCsv, parseCboeCsv, alignedDifference, compareSeries, seriesFresh } from "@/lib/series-quality.mjs";
import { getRuntimeBindings, readLatestMacroSnapshot, recordMacroSnapshot } from "../../../db/runtime";
import { strFromU8, unzipSync } from "fflate";
import {
  FRED_SERIES,
  MAX_OBSERVATION_AGE_DAYS,
  sourcePolicy,
  type FredSeriesKey,
} from "../../data/source-registry";
import { loadBitcoinSpot } from "../../data/bitcoin-spot";
import { fetchUpstream, getUpstreamHealth } from "../../data/upstream";
import { CONTEXT_MODEL_VERSION, DATA_SCHEMA_VERSION, ENGINE_VERSION, SITE_RELEASE } from "../../version";

export const dynamic = "force-dynamic";

type Point = { date: string; value: number };
type CorrelationEvidence = {
  observations: number;
  startMonth: string | null;
  endMonth: string | null;
};
type CorrelationReading = CorrelationEvidence & { value: number | null };
type RatioEvidence = {
  status: "available" | "stale" | "insufficient";
  observationMonth: string | null;
  numerator: number | null;
  denominator: number | null;
  numeratorObservations: number;
  denominatorObservations: number;
};
type RatioReading = RatioEvidence & { value: number | null };
type SeriesSource = "api" | "csv" | "dbnomics" | "bls" | "cboe" | "worldbank" | "coinbase" | "fred-derived";
type SeriesResult = { points: Point[]; error: string | null; source?: SeriesSource };
type EngineReadiness = {
  liquidity: boolean;
  credit: boolean;
  realEconomy: boolean;
  inflation: boolean;
  fiscal: boolean;
};
type SignalReadiness = {
  money: boolean;
  monetaryStance: boolean;
  creditRisk: boolean;
  termStructure: boolean;
  production: boolean;
  labour: boolean;
  consumerPrices: boolean;
  resourcesFx: boolean;
  debtBurden: boolean;
  fiscalImpulse: boolean;
};
type SixForceKey = "treasury" | "debt" | "oil" | "manufacturing" | "dollar" | "bitcoin";
type SixForceReading = {
  state: string;
  value: number | null;
  change: number | null;
  secondaryValue: number | null;
  observedAt: string | null;
  sourceKey: string;
  available: boolean;
};
type SixForceContext = {
  modelVersion: string;
  status: "complete" | "partial" | "withheld";
  available: number;
  total: 6;
  synthesis: string;
  activePatterns: string[];
  divergences: string[];
  forces: Record<SixForceKey, SixForceReading>;
};

const FRED: Record<FredSeriesKey, string> = FRED_SERIES;
const WORLD_BANK_MONTHLY_PRICES_URL = "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx";

function parseCsv(text: string): Point[] { return Object.values(parseFredCsv(text))[0] ?? []; }
function parseFredBatchCsv(text: string): Record<string, Point[]> { return parseFredCsv(text); }

async function fredSeries(series: string, force: boolean): Promise<SeriesResult> {
  if (series === "GOLDAMGBD228NLBM") return { points: [], error: "Former FRED gold series retired; use World Bank monthly gold" };
  const fredApiKey = getRuntimeBindings()?.FRED_API_KEY;
  if (fredApiKey) {
    try {
      const apiUrl = new URL("https://api.stlouisfed.org/fred/series/observations");
      apiUrl.searchParams.set("series_id", series);
      apiUrl.searchParams.set("api_key", fredApiKey);
      apiUrl.searchParams.set("file_type", "json");
      apiUrl.searchParams.set("observation_start", "2015-01-01");
      const apiResponse = await fetchUpstream(apiUrl, {
        headers: { Accept: "application/json" },
        ...(force ? {} : { cf: { cacheTtl: 900, cacheEverything: true } }),
      } as RequestInit, sourcePolicy("fred-rest"));
      if (apiResponse.ok) {
        const payload = await apiResponse.json() as { observations?: Array<{ date: string; value: string }> };
        const points = (payload.observations ?? []).map((item) => ({
          date: item.date,
          value: finiteObservation(item.value),
        })).filter((point): point is Point => point.value != null);
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
    const response = await fetchUpstream(url, {
      headers: { Accept: "text/csv" },
      ...(force ? {} : { cf: { cacheTtl: 900, cacheEverything: true } }),
    } as RequestInit, sourcePolicy("fred-csv"));
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
    url.searchParams.set("id", Object.values(FRED).filter((id) => id !== "GOLDAMGBD228NLBM").join(","));
    url.searchParams.set("cosd", "2015-01-01");
    const response = await fetchUpstream(url, {
      headers: { Accept: "text/csv" },
      ...(force ? {} : { cf: { cacheTtl: 900, cacheEverything: true } }),
    } as RequestInit, sourcePolicy("fred-csv"));
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

async function safeJson(url: string, force: boolean, timeoutMs = 6000) {
  try {
    const response = await fetchUpstream(url, {
      headers: { Accept: "application/json" },
      ...(force ? {} : { cf: { cacheTtl: 30, cacheEverything: true } }),
    } as RequestInit, { id: new URL(url).hostname, timeoutMs, maxAttempts: 2 });
    if (response.ok) return await response.json();
    await response.body?.cancel();
    const target = new URL(url);
    console.warn(`[upstream:${target.hostname}${target.pathname}] HTTP ${response.status}`);
  } catch (error) {
    const target = new URL(url);
    console.warn(`[upstream:${target.hostname}${target.pathname}] ${error instanceof Error ? error.message : "request failed"}`);
  }
  return null;
}

async function safeText(url: string, timeoutMs = 6000) {
  try {
    const response = await fetchUpstream(url, {
      headers: { Accept: "text/plain, text/csv, */*" },
    }, { id: new URL(url).hostname, timeoutMs, maxAttempts: 2 });
    if (response.ok) return await response.text();
    await response.body?.cancel();
    const target = new URL(url);
    console.warn(`[upstream:${target.hostname}${target.pathname}] HTTP ${response.status}`);
  } catch (error) {
    const target = new URL(url);
    console.warn(`[upstream:${target.hostname}${target.pathname}] ${error instanceof Error ? error.message : "request failed"}`);
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

function decodeSpreadsheetText(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function spreadsheetText(fragment: string) {
  return [...fragment.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeSpreadsheetText(match[1]))
    .join("");
}

function parseWorldBankGoldWorkbook(buffer: ArrayBuffer): Point[] {
  const files = unzipSync(new Uint8Array(buffer));
  const worksheetFile = files["xl/worksheets/sheet2.xml"];
  if (!worksheetFile) return [];
  const sharedStringsFile = files["xl/sharedStrings.xml"];
  const sharedStrings = sharedStringsFile
    ? [...strFromU8(sharedStringsFile).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => spreadsheetText(match[1]))
    : [];
  const worksheet = strFromU8(worksheetFile);
  const rows = [...worksheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];
  let goldColumn = "";
  const parsedRows = rows.map((row) => {
    const cells = new Map<string, string>();
    for (const cell of row[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const column = cell[1].match(/\br="([A-Z]+)\d+"/)?.[1];
      if (!column) continue;
      const type = cell[1].match(/\bt="([^"]+)"/)?.[1];
      const raw = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      const value = type === "s"
        ? sharedStrings[Number(raw)] ?? ""
        : type === "inlineStr"
          ? spreadsheetText(cell[2])
          : raw;
      cells.set(column, value.trim());
      if (value.trim() === "Gold") goldColumn = column;
    }
    return cells;
  });
  if (!goldColumn) return [];
  return parsedRows.flatMap((cells) => {
    const period = cells.get("A") ?? "";
    const value = finiteObservation(cells.get(goldColumn));
    if (value == null || value <= 0) return [];
    const monthlyPeriod = period.match(/^(\d{4})M(0[1-9]|1[0-2])$/);
    const serial = Number(period);
    const date = monthlyPeriod
      ? `${monthlyPeriod[1]}-${monthlyPeriod[2]}-01`
      : Number.isFinite(serial)
        ? new Date(Math.round((serial - 25_569) * 86_400_000)).toISOString().slice(0, 10)
        : "";
    return date >= "2015-01-01" ? [{ date, value }] : [];
  });
}

async function worldBankGoldSeries(force: boolean): Promise<SeriesResult> {
  try {
    const response = await fetchUpstream(WORLD_BANK_MONTHLY_PRICES_URL, {
      headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      ...(force ? {} : { cf: { cacheTtl: 86_400, cacheEverything: true } }),
    } as RequestInit, sourcePolicy("world-bank-pink-sheet"));
    if (!response.ok) {
      await response.body?.cancel();
      return { points: [], error: `World Bank HTTP ${response.status}` };
    }
    const points = parseWorldBankGoldWorkbook(await response.arrayBuffer());
    return { points, error: points.length ? null : "World Bank gold history unavailable", source: "worldbank" };
  } catch (error) {
    return { points: [], error: error instanceof Error ? error.message : "World Bank gold history failed" };
  }
}

async function dbnomicsSeries(provider: string, dataset: string, code: string, force: boolean): Promise<SeriesResult> {
  const url = `https://api.db.nomics.world/v22/series/${encodeURIComponent(provider)}/${encodeURIComponent(dataset)}/${encodeURIComponent(code)}?observations=1`;
  const payload = await safeJson(url, force, 12000);
  const document = payload?.series?.docs?.[0] as { period?: string[]; value?: Array<number | string | null> } | undefined;
  if (!document?.period || !document.value) return { points: [], error: "DBnomics unavailable" };
  const points = document.period.map((period, index) => ({
    date: normalizedDate(period),
    value: finiteObservation(document.value?.[index]),
  })).filter((point): point is Point => point.date >= "2015-01-01" && point.value != null);
  return { points, error: points.length ? null : "empty series", source: "dbnomics" };
}

function differenceSeries(left: Point[], right: Point[]) { return alignedDifference(left, right); }

async function blsMacro(): Promise<{ cpi: SeriesResult; unemployment: SeriesResult }> {
  try {
    const endYear = new Date().getUTCFullYear();
    const blsKey = getRuntimeBindings()?.BLS_API_KEY;
    const response = await fetchUpstream(`https://api.bls.gov/publicAPI/${blsKey ? "v2" : "v1"}/timeseries/data/`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: ["CUSR0000SA0", "LNS14000000"],
        ...(blsKey ? { registrationkey: blsKey } : {}),
        startyear: String(endYear - 9),
        endyear: String(endYear),
      }),
    }, sourcePolicy("bls"));
    if (!response.ok) {
      await response.body?.cancel();
      console.warn(`[upstream:api.bls.gov/publicAPI/v2/timeseries/data] HTTP ${response.status}`);
      const error = { points: [], error: `HTTP ${response.status}` };
      return { cpi: error, unemployment: error };
    }
    const payload = await response.json() as {
      status?: string;
      Results?: { series?: Array<{ seriesID: string; data?: Array<{ year: string; period: string; value: string }> }> };
    };
    if (payload.status !== "REQUEST_SUCCEEDED") return { cpi: { points: [], error: "BLS application error" }, unemployment: { points: [], error: "BLS application error" } };
    const parse = (seriesId: string): SeriesResult => {
      const rows = payload.Results?.series?.find((item) => item.seriesID === seriesId)?.data ?? [];
      const points = rows.flatMap((item) => /^M(0[1-9]|1[0-2])$/.test(item.period)
        ? [{ date: `${item.year}-${item.period.slice(1)}-01`, value: finiteObservation(item.value) }]
        : []).filter((point): point is Point => point.value != null).sort((a, b) => a.date.localeCompare(b.date));
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
  for (const host of ["cdn-api.cboe.com", "cdn.cboe.com"]) {
    const text = await safeText(`https://${host}/api/global/us_indices/daily_prices/${code}_History.csv`, 12000);
    if (!text) continue;
    const points = parseCboeCsv(text, code);
    if (seriesFresh(points, 14)) return { points, error: null, source: "cboe" };
  }
  return { points: [], error: "Cboe missing, invalid or stale" };
}

async function baaComponents(force: boolean): Promise<SeriesResult> {
  const [baa, treasury] = await Promise.all([fredSeries("DBAA", force), fredSeries("DGS10", force)]);
  const points = differenceSeries(baa.points, treasury.points);
  return { points, error: points.length ? null : "Daily DBAA and DGS10 unavailable", source: "fred-derived" };
}

async function fillMacroFallbacks(results: Record<string, SeriesResult>, force: boolean) {
  const needs = (key: FredSeriesKey) => !seriesFresh(results[key].points, MAX_OBSERVATION_AGE_DAYS[key]);
  const select = (key: FredSeriesKey, candidate: SeriesResult) => {
    const maxAge = key === "gold" && candidate.source === "worldbank" ? 75 : MAX_OBSERVATION_AGE_DAYS[key];
    if (seriesFresh(candidate.points, maxAge) && (!results[key].points.length || (candidate.points.at(-1)?.date ?? "") >= (results[key].points.at(-1)?.date ?? ""))) results[key] = candidate;
  };
  // Retry missing individual series when one batch response was partial. Keep exact units/frequency.
  await runLimited(Object.entries(FRED).filter(([key]) => key !== "gold" && needs(key as FredSeriesKey)).map(([key,id]) => async () => select(key as FredSeriesKey, await fredSeries(id, force))), 3);
  const previous = await readLatestMacroSnapshot().catch(() => null);
  let blsCheckedAt = previous?.provenance?.blsCheckedAt as string | undefined;
  const blsRecentlyChecked = blsCheckedAt && Date.now() - Date.parse(blsCheckedAt) < 2 * 60 * 60_000;
  const jobs: Array<() => Promise<void>> = [];
  const add = (key: FredSeriesKey, provider: string, dataset: string, code: string) => {
    if (needs(key)) jobs.push(async () => select(key, await dbnomicsSeries(provider,dataset,code,force)));
  };
  add("m2","FED","H6_H6_M2","M2.M");
  add("fedFunds","FED","H15","RIFSPFF_N.M");
  add("treasury10y","FED","H15","RIFLGFCY10_N.B");
  add("dollar","FED","H10","JRXWTFB_N.B");
  add("industrialProduction","FED","G17_IP_MAJOR_INDUSTRY_GROUPS","IP.B50001.S");
  add("capacityUtilization","FED","G17_CAPUTL","CAPUTL.B50001.S");
  add("oil","EIA","PET","RWTC.D");
  if (needs("yieldCurve")) jobs.push(async () => {
    const [ten,two]=await Promise.all([dbnomicsSeries("FED","H15","RIFLGFCY10_N.B",force),dbnomicsSeries("FED","H15","RIFLGFCY02_N.B",force)]);
    select("yieldCurve",{points:differenceSeries(ten.points,two.points),error:null,source:"dbnomics"});
  });
  if (needs("cpi") || needs("unemployment")) jobs.push(async () => {
    if (blsRecentlyChecked) {
      for (const key of ["cpi","unemployment"] as const) {
        const source = previous?.metrics?.freshness?.find((item: {key:string}) => item.key === key)?.source;
        if (needs(key) && source === "bls") select(key,{ points:previous?.metrics?.series?.[key] ?? [],error:null,source:"bls" });
      }
      return;
    }
    blsCheckedAt = new Date().toISOString();
    const labour=await blsMacro(); if(needs("cpi")) select("cpi",labour.cpi); if(needs("unemployment")) select("unemployment",labour.unemployment);
  });
  if (needs("gold")) jobs.push(async () => select("gold",await worldBankGoldSeries(force)));
  await runLimited(jobs,3);
  // Run these candidates even when primary data works: record independent comparisons before promotion.
  const [vixBackup, baaBackup, spxBackup] = await Promise.all([cboeSeries("VIX"), baaComponents(force), cboeSeries("SPX")]);
  const checks = [
    { key:"vix", candidate:"Cboe official daily close", independence:"different delivery origin; same index producer", ...compareSeries(results.vix.points,vixBackup.points) },
    { key:"creditSpread", candidate:"DBAA − DGS10 on identical dates", independence:"same FRED dependency; alternative component calculation", ...compareSeries(results.creditSpread.points,baaBackup.points) },
    { key:"sp500", candidate:"Cboe SPX daily history", independence:"different delivery origin; same underlying index", ...compareSeries(results.sp500.points,spxBackup.points) },
  ];
  for (const [key,candidate,check] of [["vix",vixBackup,checks[0]],["creditSpread",baaBackup,checks[1]],["sp500",spxBackup,checks[2]]] as const) {
    if (needs(key) && !["divergent","stale-comparison"].includes(check.status)) select(key,candidate);
  }
  return { checks, blsCheckedAt };
}

function latest(points: Point[]) {
  return points.at(-1) ?? null;
}

function normalizePoints(points: Point[]) { return normalizeSeries(points); }

function freshnessStatus(key: FredSeriesKey, result: SeriesResult) {
  if (result.error === "live providers unavailable; last verified snapshot") return "last-known-good";
  const observation = latest(result.points);
  if (!observation) return "unavailable";
  const ageDays = (Date.now() - Date.parse(observation.date)) / 86_400_000;
  const maximumAgeDays = key === "gold" && result.source === "worldbank"
    ? 75
    : MAX_OBSERVATION_AGE_DAYS[key];
  return ageDays <= maximumAgeDays ? "live" : "stale";
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

const MIN_CORRELATION_OBSERVATIONS = 24;
const MAX_CORRELATION_OBSERVATIONS = 60;

function monthlyLevels(points: Point[]) {
  const months = new Map<string, number>();
  for (const point of points) {
    const month = point.date.match(/^(\d{4}-\d{2})/)?.[1];
    if (month && Number.isFinite(point.value)) months.set(month, point.value);
  }
  return months;
}

function isConsecutiveMonth(previous: string, current: string) {
  const [previousYear, previousMonth] = previous.split("-").map(Number);
  const [currentYear, currentMonth] = current.split("-").map(Number);
  return currentYear * 12 + currentMonth === previousYear * 12 + previousMonth + 1;
}

function correlation(a: Point[], b: Point[]): CorrelationReading {
  const aLevels = monthlyLevels(a);
  const bLevels = monthlyLevels(b);
  const commonMonths = [...aLevels.keys()]
    .filter((month) => bLevels.has(month))
    .sort();
  const allPairs: Array<{ a: number; b: number; startMonth: string; endMonth: string }> = [];
  for (let index = 1; index < commonMonths.length; index++) {
    const startMonth = commonMonths[index - 1];
    const endMonth = commonMonths[index];
    if (!isConsecutiveMonth(startMonth, endMonth)) continue;
    const previousA = aLevels.get(startMonth)!;
    const previousB = bLevels.get(startMonth)!;
    if (previousA === 0 || previousB === 0) continue;
    const returnA = (aLevels.get(endMonth)! / previousA) - 1;
    const returnB = (bLevels.get(endMonth)! / previousB) - 1;
    if (Number.isFinite(returnA) && Number.isFinite(returnB)) {
      allPairs.push({ a: returnA, b: returnB, startMonth, endMonth });
    }
  }
  const pairs = allPairs.slice(-MAX_CORRELATION_OBSERVATIONS);
  const evidence: CorrelationEvidence = {
    observations: pairs.length,
    startMonth: pairs[0]?.startMonth ?? null,
    endMonth: pairs.at(-1)?.endMonth ?? null,
  };
  if (pairs.length < MIN_CORRELATION_OBSERVATIONS) return { value: null, ...evidence };
  const meanA = pairs.reduce((sum, pair) => sum + pair.a, 0) / pairs.length;
  const meanB = pairs.reduce((sum, pair) => sum + pair.b, 0) / pairs.length;
  const numerator = pairs.reduce((sum, pair) => sum + (pair.a - meanA) * (pair.b - meanB), 0);
  const denominator = Math.sqrt(
    pairs.reduce((sum, pair) => sum + (pair.a - meanA) ** 2, 0) *
    pairs.reduce((sum, pair) => sum + (pair.b - meanB) ** 2, 0),
  );
  return { value: denominator ? numerator / denominator : null, ...evidence };
}

function buildCorrelations(series: Record<string, Point[]>) {
  const readings = {
    m2_sp500: correlation(series.m2 ?? [], series.sp500 ?? []),
    dollar_gold: correlation(series.dollar ?? [], series.gold ?? []),
    oil_cpi: correlation(series.oil ?? [], series.cpi ?? []),
    bitcoin_m2: correlation(series.bitcoin ?? [], series.m2 ?? []),
    bitcoin_gold: correlation(series.bitcoin ?? [], series.gold ?? []),
    sp500_gold: correlation(series.sp500 ?? [], series.gold ?? []),
  };
  return {
    correlations: Object.fromEntries(Object.entries(readings).map(([key, reading]) => [key, reading.value])),
    correlationEvidence: Object.fromEntries(Object.entries(readings).map(([key, reading]) => [key, {
      observations: reading.observations,
      startMonth: reading.startMonth,
      endMonth: reading.endMonth,
    }])),
  };
}

function monthlyAverages(points: Point[]) {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const point of points) {
    const month = point.date.match(/^(\d{4}-\d{2})/)?.[1];
    if (!month || !Number.isFinite(point.value)) continue;
    const current = buckets.get(month) ?? { sum: 0, count: 0 };
    current.sum += point.value;
    current.count += 1;
    buckets.set(month, current);
  }
  return new Map([...buckets.entries()].map(([month, bucket]) => [month, {
    value: bucket.sum / bucket.count,
    observations: bucket.count,
  }]));
}

function monthAgeDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const endOfMonth = Date.UTC(year, monthNumber, 0, 23, 59, 59);
  return Math.max(0, (Date.now() - endOfMonth) / 86_400_000);
}

function pairedMonthlyRatio(numeratorPoints: Point[], denominatorPoints: Point[], maximumAgeDays: number): RatioReading {
  const numeratorLevels = monthlyAverages(numeratorPoints);
  const denominatorLevels = monthlyAverages(denominatorPoints);
  const observationMonth = [...numeratorLevels.keys()]
    .filter((month) => denominatorLevels.has(month))
    .sort()
    .at(-1) ?? null;
  if (!observationMonth) {
    return { value: null, status: "insufficient", observationMonth: null, numerator: null, denominator: null, numeratorObservations: 0, denominatorObservations: 0 };
  }
  const numerator = numeratorLevels.get(observationMonth)!;
  const denominator = denominatorLevels.get(observationMonth)!;
  const status = monthAgeDays(observationMonth) <= maximumAgeDays ? "available" : "stale";
  const value = status === "available" && denominator.value !== 0 ? numerator.value / denominator.value : null;
  return {
    value,
    status: denominator.value === 0 ? "insufficient" : status,
    observationMonth,
    numerator: numerator.value,
    denominator: denominator.value,
    numeratorObservations: numerator.observations,
    denominatorObservations: denominator.observations,
  };
}

function alignedRealRate(fedFunds: Point[], cpi: Point[]): RatioReading {
  const fedFundsLevels = monthlyAverages(fedFunds);
  const cpiLevels = monthlyAverages(cpi);
  const observationMonth = [...fedFundsLevels.keys()]
    .filter((month) => {
      const [year, monthNumber] = month.split("-").map(Number);
      const previousYearMonth = `${year - 1}-${String(monthNumber).padStart(2, "0")}`;
      return cpiLevels.has(month) && cpiLevels.has(previousYearMonth);
    })
    .sort()
    .at(-1) ?? null;
  if (!observationMonth) {
    return { value: null, status: "insufficient", observationMonth: null, numerator: null, denominator: null, numeratorObservations: 0, denominatorObservations: 0 };
  }
  const [year, monthNumber] = observationMonth.split("-").map(Number);
  const previousYearMonth = `${year - 1}-${String(monthNumber).padStart(2, "0")}`;
  const nominalRate = fedFundsLevels.get(observationMonth)!;
  const currentCpi = cpiLevels.get(observationMonth)!;
  const previousCpi = cpiLevels.get(previousYearMonth)!;
  const inflationRate = previousCpi.value === 0 ? null : ((currentCpi.value / previousCpi.value) - 1) * 100;
  const status = monthAgeDays(observationMonth) <= 75 ? "available" : "stale";
  return {
    value: status === "available" && inflationRate != null ? nominalRate.value - inflationRate : null,
    status: inflationRate == null ? "insufficient" : status,
    observationMonth,
    numerator: nominalRate.value,
    denominator: inflationRate,
    numeratorObservations: nominalRate.observations,
    denominatorObservations: currentCpi.observations,
  };
}

function buildRatioModel(series: Record<string, Point[]>, debtSeries: Point[]) {
  const readings = {
    bitcoinGoldOunces: pairedMonthlyRatio(series.bitcoin ?? [], series.gold ?? [], 75),
    sp500Gold: pairedMonthlyRatio(series.sp500 ?? [], series.gold ?? [], 75),
    debtToM2: pairedMonthlyRatio(debtSeries, series.m2 ?? [], 160),
    realRate: alignedRealRate(series.fedFunds ?? [], series.cpi ?? []),
  };
  return {
    ratios: Object.fromEntries(Object.entries(readings).map(([key, reading]) => [key, reading.value])),
    ratioEvidence: Object.fromEntries(Object.entries(readings).map(([key, reading]) => [key, {
      status: reading.status,
      observationMonth: reading.observationMonth,
      numerator: reading.numerator,
      denominator: reading.denominator,
      numeratorObservations: reading.numeratorObservations,
      denominatorObservations: reading.denominatorObservations,
    }])),
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function n(value: number | null | undefined, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function buildSixForceContext(series: Record<string, Point[]>, debtSeries: Point[], bitcoinPrice: number | null): SixForceContext {
  const treasury10y = latest(series.treasury10y ?? []);
  const treasuryCurve = latest(series.yieldCurve ?? []);
  const treasuryChange = delta(series.treasury10y ?? [], 90);
  const debtGrowth = change(debtSeries, 365);
  const oilMomentum = change(series.oil ?? [], 90);
  const manufacturing = latest(series.manufacturingSurvey ?? []);
  const dollarMomentum = change(series.dollar ?? [], 90);
  const bitcoinSeries = series.bitcoin ?? [];
  const bitcoinMomentum = change(bitcoinSeries, 90);
  const bitcoinLatest = latest(bitcoinSeries)?.value ?? bitcoinPrice;

  const force = (
    state: string,
    value: number | null | undefined,
    changeValue: number | null | undefined,
    secondaryValue: number | null | undefined,
    observedAt: string | null,
    sourceKey: string,
    required: Array<number | null | undefined>,
  ): SixForceReading => ({
    state,
    value: Number.isFinite(value) ? Number(value) : null,
    change: Number.isFinite(changeValue) ? Number(changeValue) : null,
    secondaryValue: Number.isFinite(secondaryValue) ? Number(secondaryValue) : null,
    observedAt,
    sourceKey,
    available: required.every(Number.isFinite),
  });

  const forces: Record<SixForceKey, SixForceReading> = {
    treasury: force(
      !Number.isFinite(treasuryChange) ? "limited-history" : n(treasuryChange) > 0.25 ? "yields-rising" : n(treasuryChange) < -0.25 ? "yields-falling" : "yields-range-bound",
      treasury10y?.value,
      treasuryChange,
      treasuryCurve?.value,
      treasury10y?.date ?? treasuryCurve?.date ?? null,
      "treasury10y",
      [treasury10y?.value, treasuryCurve?.value],
    ),
    debt: force(
      !Number.isFinite(debtGrowth) ? "unavailable" : n(debtGrowth) > 5 ? "debt-accelerating" : n(debtGrowth) < 2 ? "debt-decelerating" : "debt-steady-growth",
      latest(debtSeries)?.value,
      debtGrowth,
      null,
      latest(debtSeries)?.date ?? null,
      series.treasuryDebt?.length ? "treasuryDebt" : "federalDebt",
      [latest(debtSeries)?.value, debtGrowth],
    ),
    oil: force(
      !Number.isFinite(oilMomentum) ? "unavailable" : n(oilMomentum) > 5 ? "oil-rising" : n(oilMomentum) < -5 ? "oil-falling" : "oil-range-bound",
      latest(series.oil ?? [])?.value,
      oilMomentum,
      null,
      latest(series.oil ?? [])?.date ?? null,
      "oil",
      [latest(series.oil ?? [])?.value, oilMomentum],
    ),
    manufacturing: force(
      !manufacturing ? "unavailable" : manufacturing.value > 10 ? "above-trend" : manufacturing.value < -10 ? "below-trend" : "near-trend",
      manufacturing?.value,
      delta(series.manufacturingSurvey ?? [], 31),
      null,
      manufacturing?.date ?? null,
      "manufacturingSurvey",
      [manufacturing?.value],
    ),
    dollar: force(
      !Number.isFinite(dollarMomentum) ? "unavailable" : n(dollarMomentum) > 2 ? "dollar-strengthening" : n(dollarMomentum) < -2 ? "dollar-weakening" : "dollar-range-bound",
      latest(series.dollar ?? [])?.value,
      dollarMomentum,
      null,
      latest(series.dollar ?? [])?.date ?? null,
      "dollar",
      [latest(series.dollar ?? [])?.value, dollarMomentum],
    ),
    bitcoin: force(
      !Number.isFinite(bitcoinMomentum) ? "limited-history" : n(bitcoinMomentum) > 5 ? "bitcoin-rising" : n(bitcoinMomentum) < -5 ? "bitcoin-falling" : "bitcoin-range-bound",
      bitcoinLatest,
      bitcoinMomentum,
      null,
      latest(bitcoinSeries)?.date ?? null,
      "bitcoin",
      [bitcoinLatest, bitcoinMomentum],
    ),
  };

  const activePatterns: string[] = [];
  if (n(oilMomentum) > 5 && manufacturing && manufacturing.value < -10) activePatterns.push("energy-pressure-below-trend-manufacturing");
  if (n(treasuryChange) > 0.25 && n(debtGrowth) > 5) activePatterns.push("rising-yields-with-fiscal-refinancing-pressure");
  if (n(dollarMomentum) > 2 && n(bitcoinMomentum) < -5) activePatterns.push("dollar-liquidity-tightening");
  if (n(dollarMomentum) < -2 && n(bitcoinMomentum) > 5) activePatterns.push("monetary-repricing");

  const divergences: string[] = [];
  if (n(dollarMomentum) > 2 && n(bitcoinMomentum) > 5) divergences.push("stronger-dollar-and-rising-bitcoin");
  if (n(dollarMomentum) < -2 && n(bitcoinMomentum) < -5) divergences.push("weaker-dollar-and-falling-bitcoin");
  if (n(treasuryChange) > 0.25 && n(bitcoinMomentum) > 5) divergences.push("rising-yields-and-rising-bitcoin");
  if (manufacturing && manufacturing.value < -10 && n(oilMomentum) < -5) divergences.push("below-trend-manufacturing-and-falling-energy");

  const available = Object.values(forces).filter((reading) => reading.available).length;
  const status = available === 6 ? "complete" : available >= 4 ? "partial" : "withheld";
  const synthesis = status === "withheld"
    ? "insufficient-evidence"
    : activePatterns.length > 1
      ? "compound-pressure"
      : activePatterns[0] ?? (divergences.length ? "cross-market-divergence" : "mixed-signals");
  return { modelVersion: CONTEXT_MODEL_VERSION, status, available, total: 6, synthesis, activePatterns, divergences, forces };
}

function bitcoinNetworkProvenance(hasMempool: boolean, hasBlockchain: boolean) {
  if (hasMempool && hasBlockchain) return "Mempool.space + Blockchain.com";
  if (hasMempool) return "Mempool.space";
  if (hasBlockchain) return "Blockchain.com";
  return "unavailable";
}

const MADRID_TIME_ZONE = "Europe/Madrid";

function madridParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
}

function madridNoonUtc(year: number, month: number, day: number) {
  const localTarget = Date.UTC(year, month - 1, day, 12);
  const guess = new Date(localTarget);
  const observed = madridParts(guess);
  const offset = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second) - guess.getTime();
  return new Date(localTarget - offset);
}

function dailyMadridWindow(now = new Date()) {
  const local = madridParts(now);
  const todayNoon = madridNoonUtc(local.year, local.month, local.day);
  const previousDate = new Date(Date.UTC(local.year, local.month - 1, local.day - 1));
  const currentBoundary = now.getTime() >= todayNoon.getTime()
    ? todayNoon
    : madridNoonUtc(previousDate.getUTCFullYear(), previousDate.getUTCMonth() + 1, previousDate.getUTCDate());
  const nextDate = new Date(Date.UTC(local.year, local.month - 1, local.day + (now.getTime() >= todayNoon.getTime() ? 1 : 0)));
  const nextBoundary = madridNoonUtc(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDate());
  return { currentBoundary, nextBoundary };
}

async function generateEdition(request: Request) {
  const manual = request.method === "POST";
  // Public reads always use the shared refresh window. A query parameter must
  // never let one visitor fan out uncached requests to every upstream provider.
  const force = false;
  const runtimeIsSites = Boolean(getRuntimeBindings()?.DB);

  // Fast path: every visitor receives the latest durable edition immediately.
  // Normal reads create one main edition after 12:00 Europe/Madrid; an explicit
  // visitor refresh is allowed after 15 minutes. The persisted edition remains
  // available when upstream providers are slow or unavailable.
  try {
    const persisted = await readLatestMacroSnapshot();
    const persistedAt = persisted?.requestedAt ? Date.parse(persisted.requestedAt) : Number.NaN;
    const minimumAgeMs = 15 * 60_000;
    const madridWindow = dailyMadridWindow();
    const currentMainEdition = Number.isFinite(persistedAt) && persistedAt >= madridWindow.currentBoundary.getTime();
    // A normal page load must never wait for the upstream refresh pipeline.
    // Serve the last verified edition immediately even after its daily window
    // elapsed; the client then starts one gated POST in the background.
    if (persisted && (!manual || (currentMainEdition && Date.now() - persistedAt < minimumAgeMs))) {
      const metrics = persisted.metrics as {
        latest?: Record<string, Point | null>;
        series?: Record<string, Point[]>;
        bitcoin?: Record<string, unknown>;
        changes?: Record<string, number | null>;
        derived?: Record<string, unknown>;
        freshness?: Array<Record<string, unknown>>;
      };
      const storedSeries = metrics.series ?? {};
      const storedCorrelationModel = buildCorrelations(storedSeries);
      const storedDebtSeries = storedSeries.treasuryDebt?.length ? storedSeries.treasuryDebt : storedSeries.federalDebt ?? [];
      const storedRatioModel = buildRatioModel(storedSeries, storedDebtSeries);
      const storedLatest = metrics.latest ?? {};
      const storedBitcoin = metrics.bitcoin ?? {};
      const storedSixForce = buildSixForceContext(
        storedSeries,
        storedDebtSeries,
        Number.isFinite(storedBitcoin.price) ? Number(storedBitcoin.price) : null,
      );
      const storedBitcoinNetwork = bitcoinNetworkProvenance(
        Number.isFinite(storedBitcoin.blockHeight) || Number.isFinite(storedBitcoin.feeFast) || Number.isFinite(storedBitcoin.feeHour),
        Number.isFinite(storedBitcoin.supply) || Number.isFinite(storedBitcoin.hashRate) || Number.isFinite(storedBitcoin.difficulty),
      );
      const storedFreshness = (metrics.freshness ?? []).map((item) => {
        const observedAt = typeof item.observedAt === "string" ? item.observedAt : null;
        if (item.key !== "gold" || item.source !== "worldbank" || !observedAt) return item;
        const ageDays = (Date.now() - Date.parse(observedAt)) / 86_400_000;
        return { ...item, status: ageDays <= 75 ? "live" : "stale" };
      });
      const storedScores = persisted.scores as Record<string, number>;
      const storedModelExpired = Date.now() - persistedAt > 36 * 60 * 60_000;
      // Versions written before v33 contained the five parent engines only.
      // Preserve instant availability during the transition, explicitly mark
      // the reading provisional, and let the background daily refresh replace
      // these temporary aliases with the ten independently calculated signals.
      const normalizedScores = {
        ...storedScores,
        money: Number.isFinite(storedScores.money) ? storedScores.money : storedScores.liquidity,
        monetaryStance: Number.isFinite(storedScores.monetaryStance) ? storedScores.monetaryStance : storedScores.liquidity,
        creditRisk: Number.isFinite(storedScores.creditRisk) ? storedScores.creditRisk : storedScores.credit,
        termStructure: Number.isFinite(storedScores.termStructure) ? storedScores.termStructure : storedScores.credit,
        production: Number.isFinite(storedScores.production) ? storedScores.production : storedScores.realEconomy,
        labour: Number.isFinite(storedScores.labour) ? storedScores.labour : storedScores.realEconomy,
        consumerPrices: Number.isFinite(storedScores.consumerPrices) ? storedScores.consumerPrices : storedScores.inflation,
        resourcesFx: Number.isFinite(storedScores.resourcesFx) ? storedScores.resourcesFx : storedScores.inflation,
        debtBurden: Number.isFinite(storedScores.debtBurden) ? storedScores.debtBurden : storedScores.fiscal,
        fiscalImpulse: Number.isFinite(storedScores.fiscalImpulse) ? storedScores.fiscalImpulse : storedScores.fiscal,
      };
      const hasNativeTenSignals = Number.isFinite(storedScores.money);
      const generatedAt = persisted.requestedAt;
      const nextManualAt = new Date(persistedAt + 15 * 60_000).toISOString();
      const nextDailyAt = madridWindow.nextBoundary.toISOString();
      return Response.json({
        schemaVersion: DATA_SCHEMA_VERSION,
        engineVersion: ENGINE_VERSION,
        contextModelVersion: CONTEXT_MODEL_VERSION,
        siteRelease: SITE_RELEASE,
        requestedAt: generatedAt,
        observedAt: generatedAt,
        refreshMode: manual ? "manual-cooldown" : currentMainEdition ? "daily-edition" : "stale-while-refresh",
        cache: {
          generatedAt,
          validUntil: nextManualAt,
          nextManualAt,
          nextDailyAt,
          ttlSeconds: 900,
          editionTtlSeconds: 86400,
          mode: "durable-daily-edition",
        },
        series: storedSeries,
        latest: storedLatest,
        bitcoin: storedBitcoin,
        derived: {
          changes: metrics.changes ?? {},
          scores: normalizedScores,
          regime: persisted.regime,
          correlations: storedCorrelationModel.correlations,
          correlationEvidence: storedCorrelationModel.correlationEvidence,
          ratios: storedRatioModel.ratios,
          ratioEvidence: storedRatioModel.ratioEvidence,
          sixForce: storedSixForce,
        },
        freshness: storedFreshness,
        upstreams: getUpstreamHealth(),
        provenance: {
          ...persisted.provenance,
          bitcoinNetwork: storedBitcoinNetwork,
          mode: currentMainEdition ? "daily-persisted" : "stale-persisted",
          modelStatus: storedModelExpired ? "withheld" : hasNativeTenSignals ? persisted.provenance.modelStatus : "provisional",
          ...(storedModelExpired ? { modelReady: false, signalReady: Object.fromEntries(Object.keys(persisted.provenance.signalReady ?? {}).map(key => [key,false])), engineReady: Object.fromEntries(Object.keys(persisted.provenance.engineReady ?? {}).map(key => [key,false])) } : {}),
        },
      }, {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=900, stale-while-revalidate=86400",
          "X-ABCM-Refresh": manual ? "manual-cooldown" : currentMainEdition ? "daily-edition" : "stale-while-refresh",
          "X-ABCM-Next-Manual-Refresh": nextManualAt,
          "X-ABCM-Next-Daily-Edition": nextDailyAt,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  } catch {
    // The live pipeline remains available when persistence is temporarily down.
  }

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
  } else {
    results = await fredBatch(force);
  }
  const { checks: backupValidation, blsCheckedAt } = await fillMacroFallbacks(results, force);
  for (const [key, result] of Object.entries(results)) {
    results[key] = { ...result, points: normalizePoints(result.points) };
  }

  let persistedSnapshot: Awaited<ReturnType<typeof readLatestMacroSnapshot>> = null;
  try {
    persistedSnapshot = await readLatestMacroSnapshot();
    const persistedSeries = persistedSnapshot?.metrics?.series as Record<string, Point[]> | undefined;
    if (persistedSeries) {
      for (const [key, result] of Object.entries(results)) {
        const backup = persistedSeries[key];
        if (Array.isArray(backup) && backup.length && (!result.points.length || (backup.at(-1)?.date ?? "") > (result.points.at(-1)?.date ?? ""))) {
          results[key] = {
            points: backup,
            error: "live providers unavailable; last verified snapshot",
            source: (persistedSnapshot?.metrics?.freshness as Array<{key: string; source?: SeriesSource}> | undefined)?.find(item => item.key === key)?.source ?? result.source,
          };
        }
      }
    }
  } catch {
    // Persistence is a circuit breaker, never a requirement for public reads.
  }
  const series = Object.fromEntries(Object.entries(results).map(([key, result]) => [key, result.points])) as Record<string, Point[]>;

  // Keep the independent enrichments in one parallel wave. Previously the
  // network calls ran in two serial waves and could exceed the Worker budget.
  const treasuryPromise = safeJson("https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?filter=record_date:gte:2015-01-01&sort=record_date&page%5Bsize%5D=10000", force, 12000);
  const [bitcoinSpot, coin, chain, fees, heightText, bitcoinChart] = await Promise.all([
    loadBitcoinSpot(true),
    runtimeIsSites
      ? Promise.resolve(null)
      : safeJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true", true),
    safeJson("https://blockchain.info/stats?format=json", true),
    safeJson("https://mempool.space/api/v1/fees/recommended", true),
    safeText("https://mempool.space/api/blocks/tip/height"),
    safeJson("https://api.blockchain.info/charts/market-price?timespan=5years&format=json&sampled=true", force),
  ]);
  const treasury = await treasuryPromise;

  const bitcoinHistory: Point[] = Array.isArray(bitcoinChart?.values)
    ? normalizePoints(bitcoinChart.values.map((item: { x: number; y: number }) => ({
        date: new Date(item.x * 1000).toISOString().slice(0, 10),
        value: Number(item.y),
      })))
    : [];

  const treasuryDebt: Point[] = Array.isArray(treasury?.data)
    ? normalizePoints(treasury.data.map((item: { record_date?: string; tot_pub_debt_out_amt?: string }) => ({
        date: String(item.record_date ?? ""),
        value: Number(item.tot_pub_debt_out_amt) / 1_000_000_000,
      })))
    : [];
  if (treasuryDebt.length) series.treasuryDebt = treasuryDebt;

  const bitcoinPrice = bitcoinSpot.price;
  const supply = coin?.bitcoin?.usd_market_cap && bitcoinPrice
    ? coin.bitcoin.usd_market_cap / bitcoinPrice
    : chain?.totalbc ? chain.totalbc / 100_000_000 : 0;
  const annualFlow = 3.125 * 144 * 365;

  const modelSeries = Object.fromEntries(Object.entries(series).map(([key, points]) => [key,
    seriesFresh(points, key === "gold" && results.gold.source === "worldbank" ? 75 : MAX_OBSERVATION_AGE_DAYS[key as FredSeriesKey] ?? 14) ? points : [],
  ])) as Record<string, Point[]>;
  const m2Growth = change(modelSeries.m2, 365);
  const rateChange = delta(modelSeries.fedFunds, 365);
  const cpiGrowth = change(modelSeries.cpi, 365);
  const oilMomentum = change(modelSeries.oil, 90);
  const dollarMomentum = change(modelSeries.dollar, 90);
  const industrialGrowth = change(modelSeries.industrialProduction, 365);
  const unemploymentChange = delta(modelSeries.unemployment, 365);
  const capacityChange = delta(modelSeries.capacityUtilization, 365);
  const debtSeries = treasuryDebt.length ? treasuryDebt : modelSeries.federalDebt;
  const debtGrowth = change(debtSeries, 365);
  const debtToGdp = latest(modelSeries.debtToGdp)?.value ?? null;
  const realRate = alignedRealRate(modelSeries.fedFunds, modelSeries.cpi).value;
  const engineReady: EngineReadiness = {
    liquidity: [m2Growth, rateChange, realRate].every(Number.isFinite),
    credit: [latest(modelSeries.creditSpread)?.value, latest(modelSeries.yieldCurve)?.value, latest(modelSeries.vix)?.value].every(Number.isFinite),
    realEconomy: [industrialGrowth, unemploymentChange, capacityChange].every(Number.isFinite),
    inflation: [cpiGrowth, oilMomentum, dollarMomentum].every(Number.isFinite),
    fiscal: [debtToGdp, debtGrowth].every(Number.isFinite),
  };
  const signalReady: SignalReadiness = {
    money: Number.isFinite(m2Growth),
    monetaryStance: [rateChange, realRate].every(Number.isFinite),
    creditRisk: [latest(modelSeries.creditSpread)?.value, latest(modelSeries.vix)?.value].every(Number.isFinite),
    termStructure: Number.isFinite(latest(modelSeries.yieldCurve)?.value),
    production: [industrialGrowth, capacityChange].every(Number.isFinite),
    labour: Number.isFinite(unemploymentChange),
    consumerPrices: Number.isFinite(cpiGrowth),
    resourcesFx: [oilMomentum, dollarMomentum].every(Number.isFinite),
    debtBurden: Number.isFinite(debtToGdp),
    fiscalImpulse: Number.isFinite(debtGrowth),
  };
  const modelInputs = [
    m2Growth, rateChange, realRate, latest(modelSeries.creditSpread)?.value,
    latest(modelSeries.yieldCurve)?.value, latest(modelSeries.vix)?.value,
    industrialGrowth, unemploymentChange, capacityChange, cpiGrowth,
    oilMomentum, dollarMomentum, debtToGdp, debtGrowth,
  ];
  const modelInputsAvailable = modelInputs.filter(Number.isFinite).length;
  const modelInputsTotal = modelInputs.length;
  const modelReady = Object.values(signalReady).every(Boolean);

  const signalScores = {
    money: clamp(50 + n(m2Growth) * 6),
    monetaryStance: clamp(45 - n(rateChange) * 8 - n(realRate) * 3),
    creditRisk: clamp(15 + n(latest(modelSeries.creditSpread)?.value) * 17 + n(latest(modelSeries.vix)?.value) * 0.9),
    termStructure: clamp(35 + Math.max(0, -n(latest(modelSeries.yieldCurve)?.value)) * 35),
    production: clamp(45 - n(industrialGrowth) * 6 - n(capacityChange) * 5),
    labour: clamp(35 + n(unemploymentChange) * 25),
    consumerPrices: clamp(25 + n(cpiGrowth) * 12),
    resourcesFx: clamp(40 + n(oilMomentum) * 0.55 - n(dollarMomentum) * 0.65),
    debtBurden: clamp(35 + Math.max(0, n(debtToGdp) - 80) * 0.75),
    fiscalImpulse: clamp(35 + n(debtGrowth) * 3),
  };
  const liquidityScore = clamp((signalScores.money * 0.14 + signalScores.monetaryStance * 0.13) / 0.27);
  const creditScore = clamp((signalScores.creditRisk * 0.13 + signalScores.termStructure * 0.10) / 0.23);
  const realEconomyScore = clamp((signalScores.production * 0.12 + signalScores.labour * 0.08) / 0.20);
  const inflationScore = clamp((signalScores.consumerPrices * 0.09 + signalScores.resourcesFx * 0.06) / 0.15);
  const fiscalScore = clamp((signalScores.debtBurden * 0.09 + signalScores.fiscalImpulse * 0.06) / 0.15);
  const weightedEngines = [
    { key: "money" as const, score: signalScores.money, weight: 0.14 },
    { key: "monetaryStance" as const, score: signalScores.monetaryStance, weight: 0.13 },
    { key: "creditRisk" as const, score: signalScores.creditRisk, weight: 0.13 },
    { key: "termStructure" as const, score: signalScores.termStructure, weight: 0.10 },
    { key: "production" as const, score: signalScores.production, weight: 0.12 },
    { key: "labour" as const, score: signalScores.labour, weight: 0.08 },
    { key: "consumerPrices" as const, score: signalScores.consumerPrices, weight: 0.09 },
    { key: "resourcesFx" as const, score: signalScores.resourcesFx, weight: 0.06 },
    { key: "debtBurden" as const, score: signalScores.debtBurden, weight: 0.09 },
    { key: "fiscalImpulse" as const, score: signalScores.fiscalImpulse, weight: 0.06 },
  ].filter((engine) => signalReady[engine.key]);
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

  const correlationModel = buildCorrelations({ ...series, bitcoin: bitcoinHistory });

  const ratioModel = buildRatioModel({ ...series, bitcoin: bitcoinHistory }, debtSeries);
  const sixForceContext = buildSixForceContext({ ...series, bitcoin: bitcoinHistory }, debtSeries, bitcoinPrice);

  const freshness = Object.entries(FRED).map(([key, id]) => ({
    key, id, observedAt: latest(series[key])?.date ?? null,
    status: freshnessStatus(key as FredSeriesKey, results[key]),
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
  const editionTtlSeconds = 86_400;
  const madridWindow = dailyMadridWindow(new Date(requestedAt));
  const payload = {
    schemaVersion: DATA_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    contextModelVersion: CONTEXT_MODEL_VERSION,
    siteRelease: SITE_RELEASE,
    requestedAt,
    observedAt: requestedAt,
    refreshMode: manual ? "manual-refresh" : "daily-edition",
    cache: {
      generatedAt: requestedAt,
      validUntil: new Date(Date.parse(requestedAt) + cacheTtlSeconds * 1000).toISOString(),
      nextManualAt: new Date(Date.parse(requestedAt) + cacheTtlSeconds * 1000).toISOString(),
      nextDailyAt: madridWindow.nextBoundary.toISOString(),
      ttlSeconds: cacheTtlSeconds,
      editionTtlSeconds,
      mode: "durable-daily-edition",
    },
    series: { ...series, bitcoin: bitcoinHistory },
    latest: Object.fromEntries(Object.entries(series).map(([key, points]) => [key, latest(points)])),
    bitcoin: {
      price: bitcoinPrice,
      change24h: coin?.bitcoin?.usd_24h_change ?? null,
      marketCap: coin?.bitcoin?.usd_market_cap ?? null,
      priceObservedAt: bitcoinSpot.observedAt ?? (coin?.bitcoin?.last_updated_at ? new Date(coin.bitcoin.last_updated_at * 1000).toISOString() : null),
      priceConsensus: bitcoinSpot.consensus,
      priceSpreadPercent: bitcoinSpot.spreadPercent,
      priceSources: bitcoinSpot.sources,
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
      scores: { liquidity: liquidityScore, credit: creditScore, realEconomy: realEconomyScore, inflation: inflationScore, fiscal: fiscalScore, ...signalScores, composite },
      regime,
      correlations: correlationModel.correlations,
      correlationEvidence: correlationModel.correlationEvidence,
      ratios: ratioModel.ratios,
      ratioEvidence: ratioModel.ratioEvidence,
      sixForce: sixForceContext,
    },
    freshness,
    upstreams: getUpstreamHealth(),
    provenance: {
      sourcePolicyVersion: "2026-09-28-quality-v1",
      backupValidation,
      blsCheckedAt,
      transportHealth: getUpstreamHealth(),
      fred: fredProvenance,
      bitcoinPrice: bitcoinSpot.price ? bitcoinSpot.provider : "unavailable",
      bitcoinNetwork: bitcoinNetworkProvenance(Boolean(heightText || fees), Boolean(chain)),
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
      signalReady,
      availableWeight,
      mode: fredAvailable > 0 || bitcoinPrice || treasuryDebt.length ? "live" : "fallback",
    },
  };

  if (fredAvailable > 0 || bitcoinPrice || treasuryDebt.length) {
    try {
      await recordMacroSnapshot({
        requestedAt,
        refreshMode: payload.refreshMode,
        regime,
        scores: payload.derived.scores,
        metrics: { latest: payload.latest, series: payload.series, bitcoin: payload.bitcoin, changes: payload.derived.changes, derived: { correlations: payload.derived.correlations, correlationEvidence: payload.derived.correlationEvidence, ratios: payload.derived.ratios, ratioEvidence: payload.derived.ratioEvidence, sixForce: payload.derived.sixForce }, freshness: payload.freshness },
        provenance: payload.provenance,
      }, force);
    } catch {
      // Persistence must never make the public read-only macro endpoint unavailable.
    }
  }

  return Response.json(payload, {
    headers: {
      "Cache-Control": `public, max-age=60, s-maxage=${cacheTtlSeconds}, stale-while-revalidate=${editionTtlSeconds}`,
      "X-ABCM-Refresh": payload.refreshMode,
      "X-ABCM-Next-Manual-Refresh": payload.cache.nextManualAt,
      "X-ABCM-Next-Daily-Edition": payload.cache.nextDailyAt,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

let editionInFlight: Promise<Response> | null = null;
export async function GET(request: Request) {
  // Single flight includes response body construction and persistence. Reads and refreshes
  // share the same work in this isolate; other isolates still use durable editions.
  if (!editionInFlight) editionInFlight = generateEdition(request).finally(() => { editionInFlight = null; });
  return (await editionInFlight).clone();
}

export async function POST(request: Request) {
  return GET(new Request(request.url, { method: "POST", headers: request.headers }));
}
