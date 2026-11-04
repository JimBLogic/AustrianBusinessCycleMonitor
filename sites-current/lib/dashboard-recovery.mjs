import { validBitcoinQuote } from './bitcoin-quote.mjs';
import { retainedSeriesIsNewer } from './observation-integrity.mjs';

/** Preserve independently verified series if a later partial response loses them.
 * Model readiness remains that of the new response; recovery never invents scores.
 */
export function retainDashboardSeries(previous, incoming) {
  if (!incoming || !incoming.series || !incoming.latest || !incoming.provenance || !incoming.bitcoin) throw new Error('Invalid snapshot shape');
  const next={...incoming,series:{...incoming.series},latest:{...incoming.latest},freshness:[...(incoming.freshness??[])]};
  for(const [key,points] of Object.entries(previous.series??{})) {
    // Match the writer's reference-period comparison: a month-end fallback
    // label must not displace a validated revision of the same monthly period.
    if(!retainedSeriesIsNewer(key,points,next.series[key])) continue;
    next.series[key]=points;
    next.latest[key]=points.at(-1);
    const old=(previous.freshness??[]).find(row=>row.key===key);
    next.freshness=next.freshness.filter(row=>row.key!==key);
    next.freshness.push({...old,key,status:'last-known-good',error:'Partial refresh; retained last verified observations',observedAt:points.at(-1).date});
  }
  const prior=previous.bitcoin;
  const incomingQuoteValid=validBitcoinQuote(incoming.bitcoin);
  if(validBitcoinQuote(prior) && (!incomingQuoteValid || Date.parse(prior.priceObservedAt)>Date.parse(incoming.bitcoin.priceObservedAt))) {
    next.bitcoin={...incoming.bitcoin,price:prior.price,priceObservedAt:prior.priceObservedAt,priceConsensus:incomingQuoteValid?prior.priceConsensus:'stale',priceSources:prior.priceSources};
  }
  return next;
}
