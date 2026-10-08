import { supportedSnapshot } from './snapshot-policy.mjs';
import { normalizeSeries } from './series-quality.mjs';

// Bounded, newest-first recovery. One corrupt/empty row must not hide history.
export function recoverSnapshot(rows) {
  const valid = rows.flatMap(row => {
    try {
      const provenance = JSON.parse(row.provenanceJson);
      if (!supportedSnapshot(provenance)) return [];
      const metrics = JSON.parse(row.metricsJson);
      const series = Object.fromEntries(Object.entries(metrics.series ?? {}).map(([key, points]) =>
        [key, Array.isArray(points) ? normalizeSeries(points) : []]));
      if (!Object.values(series).some(points => points.length)) return [];
      if (!Number.isFinite(Date.parse(row.requestedAt))) return [];
      return [{requestedAt:row.requestedAt,refreshMode:row.refreshMode,regime:row.regime,
        scores:JSON.parse(row.scoresJson),metrics:{...metrics,series},provenance}];
    } catch { return []; }
  });
  const latest = valid[0];
  if (!latest) return null;
  for (const previous of valid.slice(1)) {
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
