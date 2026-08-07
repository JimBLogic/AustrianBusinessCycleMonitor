import { sourcePolicy } from "./source-registry";
import { fetchUpstream, getUpstreamHealth } from "./upstream";
import { resolveBitcoinConsensus } from "./bitcoin-consensus.mjs";

export type SpotObservation = {
  source: "coinbase" | "kraken";
  price: number;
  observedAt: string;
};

export type BitcoinSpot = {
  price: number | null;
  observedAt: string | null;
  provider: string;
  consensus: "confirmed" | "divergent" | "single-source" | "unavailable";
  spreadPercent: number | null;
  sources: string[];
  observations: SpotObservation[];
  upstreams: ReturnType<typeof getUpstreamHealth>;
};

function validPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price > 1_000 && price < 10_000_000 ? price : null;
}

async function coinbase(force: boolean): Promise<SpotObservation | null> {
  try {
    const response = await fetchUpstream("https://api.exchange.coinbase.com/products/BTC-USD/ticker", {
      headers: { Accept: "application/json" },
      ...(force ? {} : { cf: { cacheTtl: 60, cacheEverything: true } }),
    } as RequestInit, sourcePolicy("coinbase"));
    if (!response.ok) { await response.body?.cancel(); return null; }
    const payload = await response.json() as { price?: string; time?: string };
    const price = validPrice(payload.price);
    return price == null ? null : { source: "coinbase", price, observedAt: payload.time ?? new Date().toISOString() };
  } catch { return null; }
}

async function kraken(force: boolean): Promise<SpotObservation | null> {
  try {
    const response = await fetchUpstream("https://api.kraken.com/0/public/Ticker?pair=XBTUSD", {
      headers: { Accept: "application/json" },
      ...(force ? {} : { cf: { cacheTtl: 60, cacheEverything: true } }),
    } as RequestInit, sourcePolicy("kraken"));
    if (!response.ok) { await response.body?.cancel(); return null; }
    const payload = await response.json() as { result?: Record<string, { c?: string[] }> };
    const ticker = payload.result ? Object.values(payload.result)[0] : null;
    const price = validPrice(ticker?.c?.[0]);
    return price == null ? null : { source: "kraken", price, observedAt: new Date().toISOString() };
  } catch { return null; }
}

export async function loadBitcoinSpot(force = false) {
  const observations = (await Promise.all([coinbase(force), kraken(force)]))
    .filter((item): item is SpotObservation => item != null);
  const consensus = resolveBitcoinConsensus(observations) as Omit<BitcoinSpot, "upstreams">;
  return { ...consensus, upstreams: getUpstreamHealth() } satisfies BitcoinSpot;
}
