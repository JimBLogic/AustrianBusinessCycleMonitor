import { validVenueObservation } from '../../lib/bitcoin-provider.mjs';

export function resolveBitcoinConsensus(observations) {
  // Repeated observations from one venue are not independent confirmation.
  const venues = new Map();
  for (const item of Array.isArray(observations) ? observations : []) {
    const valid = validVenueObservation(item);
    if (!valid) continue;
    const previous = venues.get(valid.source);
    if (!previous || Date.parse(valid.observedAt) > Date.parse(previous.observedAt)) venues.set(valid.source, valid);
  }
  const usable = [...venues.values()];
  if (!usable.length) {
    return { price: null, observedAt: null, provider: "unavailable", consensus: "unavailable", spreadPercent: null, sources: [], observations: [] };
  }
  const primary = usable.find((item) => item.source === "coinbase") ?? usable[0];
  if (usable.length === 1) {
    return { price: primary.price, observedAt: primary.observedAt, provider: primary.source === "coinbase" ? "Coinbase Exchange" : "Kraken", consensus: "single-source", spreadPercent: null, sources: [primary.source], observations: usable };
  }
  const low = Math.min(...usable.map((item) => item.price));
  const high = Math.max(...usable.map((item) => item.price));
  const midpoint = (low + high) / 2;
  const spreadPercent = midpoint ? ((high - low) / midpoint) * 100 : null;
  const confirmed = spreadPercent != null && spreadPercent <= 2;
  return {
    price: confirmed ? midpoint : primary.price,
    // A combined quote cannot be fresher than its oldest constituent. A
    // divergent quote retains the timestamp of the selected primary venue.
    observedAt: confirmed ? usable.map((item) => item.observedAt).sort()[0] : primary.observedAt,
    provider: confirmed ? "Coinbase + Kraken" : primary.source === "coinbase" ? "Coinbase Exchange" : "Kraken",
    consensus: confirmed ? "confirmed" : "divergent",
    spreadPercent,
    sources: usable.map((item) => item.source),
    observations: usable,
  };
}
