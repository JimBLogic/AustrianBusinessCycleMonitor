import { validTimestamp } from './timestamp.mjs';

/** Validate retained quotes independently of whether they are still fresh. */
export function validBitcoinQuote(quote, now = Date.now()) {
  const stamp = validTimestamp(quote?.priceObservedAt);
  return typeof quote?.price === 'number' && Number.isFinite(quote.price) &&
    quote.price > 0 && typeof quote.priceObservedAt === 'string' &&
    quote.priceObservedAt.includes('T') && stamp != null && stamp.getTime() <= now + 60_000;
}
