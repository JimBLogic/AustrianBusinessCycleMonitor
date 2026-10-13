import { finiteObservation } from './series-quality.mjs';
import { validTimestamp } from './timestamp.mjs';

export function validSpotPrice(value) {
  const price = finiteObservation(value);
  return price != null && price > 1_000 && price < 10_000_000 ? price : null;
}

export function validVenueObservation(item, now = Date.now()) {
  const price = validSpotPrice(item?.price);
  const stamp = validTimestamp(item?.observedAt);
  if (price == null || !['coinbase', 'kraken'].includes(item?.source) ||
    typeof item?.observedAt !== 'string' || !item.observedAt.includes('T') ||
    !stamp || stamp.getTime() > now + 60_000) return null;
  return {...item, price};
}
