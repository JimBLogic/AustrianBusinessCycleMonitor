import { supportedSnapshot } from './snapshot-policy.mjs';
import { normalizeSeries } from './series-quality.mjs';
import { validTimestamp } from './timestamp.mjs';
import { validBitcoinQuote } from './bitcoin-quote.mjs';

// Bounded, newest-first recovery. One corrupt/empty row must not hide history.
export function recoverSnapshot(rows, now = Date.now()) {
  const valid = rows.flatMap(row => {
    try {
      const provenance = JSON.parse(row.provenanceJson);
      if (!supportedSnapshot(provenance)) return [];
      const requestedAt = validTimestamp(row.requestedAt);
      if (!requestedAt || requestedAt.getTime() > now + 60_000) return [];
      const metrics = JSON.parse(row.metricsJson);
      const series = Object.fromEntries(Object.entries(metrics.series ?? {}).map(([key, points]) =>
        [key, normalizeSeries(points, now)]));
      const bitcoin = validBitcoinQuote(metrics.bitcoin, now) ? metrics.bitcoin : {...metrics.bitcoin, price:null, priceObservedAt:null, priceConsensus:'unavailable'};
      if (!Object.values(series).some(points => points.length) && bitcoin.price == null) return [];
      const freshness = Array.isArray(metrics.freshness) ? metrics.freshness.filter(item => item && typeof item === 'object' && typeof item.key === 'string') : [];
      const parsedScores = JSON.parse(row.scoresJson);
      const scores = parsedScores && typeof parsedScores === 'object' && !Array.isArray(parsedScores) ? parsedScores : {};
      return [{requestedAt:row.requestedAt,refreshMode:row.refreshMode,regime:row.regime,
        scores,metrics:{...metrics,series,bitcoin,freshness},provenance}];
    } catch { return []; }
  });
  const latest = valid[0];
  if (!latest) return null;
  for (const previous of valid.slice(1)) {
    if (!validBitcoinQuote(latest.metrics.bitcoin, now) && validBitcoinQuote(previous.metrics.bitcoin, now)) {
      latest.metrics.bitcoin = {...latest.metrics.bitcoin,
        price:previous.metrics.bitcoin.price, priceObservedAt:previous.metrics.bitcoin.priceObservedAt,
        priceSources:previous.metrics.bitcoin.priceSources, priceConsensus:'stale'};
    }
    for (const [key, points] of Object.entries(previous.metrics.series)) {
      if (latest.metrics.series[key]?.length || !points.length) continue;
      latest.metrics.series[key] = points;
      const old = previous.metrics.freshness?.find(item => item.key === key);
      latest.metrics.freshness = (latest.metrics.freshness ?? []).filter(item => item.key !== key);
      latest.metrics.freshness.push({...old,key,status:'last-known-good',error:'Recovered from an earlier durable edition',
        observedAt:points.at(-1).date,last_success:old?.last_success ?? previous.requestedAt});
      // Scores from a partial row are never promoted just by recovering history.
    }
  }
  latest.metrics.latest = Object.fromEntries(Object.entries(latest.metrics.series).map(([key, points]) => [key,points.at(-1) ?? null]));
  return latest;
}
