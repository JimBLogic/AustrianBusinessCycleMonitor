import { finiteObservation, normalizeSeries } from './series-quality.mjs';

export function bitcoinHistoryPoints(payload) {
  const points = (Array.isArray(payload?.values) ? payload.values : []).flatMap(item => {
    const seconds = finiteObservation(item?.x);
    const value = finiteObservation(item?.y);
    if (seconds == null || value == null || value <= 0) return [];
    const date = new Date(seconds * 1000);
    if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 2009 || date.getTime() > Date.now()) return [];
    return [{date:date.toISOString().slice(0,10),value}];
  });
  return normalizeSeries(points);
}

export function treasuryDebtPoints(payload) {
  return normalizeSeries((Array.isArray(payload?.data) ? payload.data : []).flatMap(item => {
    const value = finiteObservation(item?.tot_pub_debt_out_amt);
    return value != null && value > 0 ? [{date:String(item.record_date ?? ''),value:value/1_000_000_000}] : [];
  }));
}

export function retainHistory(candidate, previous) {
  const valid = normalizeSeries(Array.isArray(candidate) ? candidate : []);
  const prior = normalizeSeries(Array.isArray(previous) ? previous : []);
  if (!valid.length || (prior.at(-1)?.date ?? '') > (valid.at(-1)?.date ?? '')) return prior;
  // Keep historical coverage; validated revisions replace observations by date.
  return normalizeSeries([...prior, ...valid]);
}

// Public unavailable components are null, never the numeric intercept from a
// formula evaluated with absent inputs. No score weights or thresholds change.
export function eligibleScores(scores, provenance, expired = false) {
  return Object.fromEntries(Object.entries(scores).map(([key,value]) => [key,
    expired || !Number.isFinite(value) ||
    provenance.signalReady?.[key] === false || provenance.engineReady?.[key] === false ||
    (key === 'composite' && provenance.modelStatus === 'withheld') ? null : value,
  ]));
}

export function bitcoinDataStatus(price, consensus) {
  return price == null ? 'UNAVAILABLE' : consensus === 'stale' ? 'STALE' : consensus === 'confirmed' ? 'HEALTHY' : 'DEGRADED';
}

// FRED GFDEBTN labels a quarter by its first day but measures end-of-period
// debt. Only derived comparisons use periodEnd; raw observations stay intact.
export function quarterlyDebtInBillions(points) {
  return normalizeSeries(points).map(point => {
    const [year, month] = point.date.split('-').map(Number);
    const periodEnd = new Date(Date.UTC(year, Math.floor((month-1)/3)*3+3, 0)).toISOString().slice(0,10);
    return {date:periodEnd, value:point.value/1000, sourceObservationDate:point.date};
  });
}
