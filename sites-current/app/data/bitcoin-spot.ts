import { sourcePolicy } from "./source-registry";
import { fetchUpstream, getUpstreamHealth } from "./upstream";
import { resolveBitcoinConsensus } from "./bitcoin-consensus.mjs";
import { validSpotPrice, validVenueObservation } from "../../lib/bitcoin-provider.mjs";

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

async function coinbase(force: boolean): Promise<SpotObservation | null> {
  try {
    const response = await fetchUpstream("https://api.exchange.coinbase.com/products/BTC-USD/ticker", {
      headers: { Accept: "application/json" },
      ...(force ? {} : { cf: { cacheTtl: 60, cacheEverything: true } }),
    } as RequestInit, sourcePolicy("coinbase"));
    if (!response.ok) { await response.body?.cancel(); return null; }
    const payload = await response.json() as { price?: string; time?: string };
    const price = validSpotPrice(payload?.price);
    const observation = validVenueObservation({source:"coinbase",price,observedAt:payload?.time});
    const stamp = observation ? Date.parse(observation.observedAt) : Number.NaN;
    const fresh = Number.isFinite(stamp) && stamp <= Date.now() + 60_000 && Date.now() - stamp <= 15 * 60_000;
    return price == null || !fresh ? null : { source: "coinbase", price, observedAt: observation.observedAt };
  } catch { return null; }
}

async function kraken(force: boolean): Promise<SpotObservation | null> {
  try {
    const response = await fetchUpstream("https://api.kraken.com/0/public/Ticker?pair=XBTUSD", {
      headers: { Accept: "application/json" },
      ...(force ? {} : { cf: { cacheTtl: 60, cacheEverything: true } }),
    } as RequestInit, sourcePolicy("kraken"));
    if (!response.ok) { await response.body?.cancel(); return null; }
    const payload = await response.json() as { error?: string[]; result?: Record<string, { c?: string[] }> };
    if (payload.error?.length) return null;
    const ticker = payload.result ? Object.values(payload.result)[0] : null;
    const price = validSpotPrice(ticker?.c?.[0]);
    return price == null ? null : { source: "kraken", price, observedAt: new Date().toISOString() };
  } catch { return null; }
}

export async function loadBitcoinSpot(force = false) {
  const observations = (await Promise.all([coinbase(force), kraken(force)]))
    .filter((item): item is SpotObservation => item != null);
  const consensus = resolveBitcoinConsensus(observations) as Omit<BitcoinSpot, "upstreams">;
  return { ...consensus, upstreams: getUpstreamHealth() } satisfies BitcoinSpot;
}
