/** FRED quarterly timestamps label the first day of the reference quarter.
 * An observation's measured age must start at the END of that covered period.
 * Preserve original dates/values in storage, provenance and output: no data mutation.
 */
import { normalizeSeries, validDate } from './series-quality.mjs';

export const QUARTERLY_FRED_KEYS = Object.freeze([
  'federalDebt',
  'debtToGdp',
  'realGdpGrowth',
]);

export function referencePeriodEnd(key, date, now = Date.now()) {
  if (!validDate(date, now)) return null;
  if (!QUARTERLY_FRED_KEYS.includes(key)) return date;
  const [year, month, day] = date.split('-').map(Number);
  // FRED's standard quarterly series use the quarter's first calendar day.
  // Never shift arbitrary or invalid dates forward to manufacture freshness.
  if (day !== 1 || ![1, 4, 7, 10].includes(month)) return date;
  const periodEnd = new Date(Date.UTC(year, month + 2, 0));
  // A quarter that has not ended cannot supply a completed official observation.
  if (periodEnd.getTime() > now + 86_400_000) return null;
  return periodEnd.toISOString().slice(0, 10);
}

export function observationAgeDays(key, date, now = Date.now()) {
  const periodEnd = referencePeriodEnd(key, date, now);
  return periodEnd === null ? null : Math.max(0, (now - Date.parse(periodEnd)) / 86_400_000);
}

export function seriesFreshForKey(points, key, maxAgeDays, now = Date.now()) {
  const last = normalizeSeries(points, now).at(-1);
  const days = last && observationAgeDays(key, last.date, now);
  return days != null && days <= maxAgeDays;
}
