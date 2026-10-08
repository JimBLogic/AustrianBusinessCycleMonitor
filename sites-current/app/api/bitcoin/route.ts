import { readLatestMacroSnapshot } from "../../../db/runtime";
import { loadBitcoinSpot } from "../../data/bitcoin-spot";

export const dynamic = "force-dynamic";

export async function GET() {
  const spot = await loadBitcoinSpot(false);
  const previous = spot.price == null ? await readLatestMacroSnapshot().catch(() => null) : null;
  const retained = previous?.metrics?.bitcoin;
  const price = spot.price ?? retained?.price ?? null;
  return Response.json({
    price,
    priceObservedAt: spot.observedAt ?? retained?.priceObservedAt ?? null,
    provider: spot.price == null && price != null ? previous?.provenance?.bitcoinPrice : spot.provider,
    status: price == null ? "UNAVAILABLE" : spot.price == null ? "STALE" : "HEALTHY",
    failure_reason: spot.price == null ? "Live spot providers unavailable; last-known-good if present" : null,
    priceConsensus: spot.price == null && price != null ? "stale" : spot.consensus,
    priceSpreadPercent: spot.spreadPercent,
    priceSources: spot.sources,
    upstreams: spot.upstreams,
  }, {
    status: price == null ? 503 : 200,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
