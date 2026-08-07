import { loadBitcoinSpot } from "../../data/bitcoin-spot";

export const dynamic = "force-dynamic";

export async function GET() {
  const spot = await loadBitcoinSpot(false);
  return Response.json({
    price: spot.price,
    priceObservedAt: spot.observedAt,
    provider: spot.provider,
    priceConsensus: spot.consensus,
    priceSpreadPercent: spot.spreadPercent,
    priceSources: spot.sources,
    upstreams: spot.upstreams,
  }, {
    status: spot.price == null ? 503 : 200,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
