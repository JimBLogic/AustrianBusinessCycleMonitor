function validPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 1_000 && price < 10_000_000 ? price : null;
}

export function resolveBitcoinConsensus(observations) {
  const usable = observations.filter((item) => validPrice(item.price) != null);
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
    observedAt: usable.map((item) => item.observedAt).sort().at(-1) ?? primary.observedAt,
    provider: confirmed ? "Coinbase + Kraken" : primary.source === "coinbase" ? "Coinbase Exchange" : "Kraken",
    consensus: confirmed ? "confirmed" : "divergent",
    spreadPercent,
    sources: usable.map((item) => item.source),
    observations: usable,
  };
}
