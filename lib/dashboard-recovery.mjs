/** Preserve independently verified series if a later partial response loses them.
 * Model readiness remains that of the new response; recovery never invents scores.
 */
export function retainDashboardSeries(previous, incoming) {
  if (!incoming || !incoming.series || !incoming.latest || !incoming.provenance || !incoming.bitcoin) throw new Error('Invalid snapshot shape');
  const next={...incoming,series:{...incoming.series},latest:{...incoming.latest},freshness:[...(incoming.freshness??[])]};
  for(const [key,points] of Object.entries(previous.series??{})) {
    if(!points?.length || (next.series[key]?.length && next.series[key].at(-1).date>=points.at(-1).date)) continue;
    next.series[key]=points;
    next.latest[key]=points.at(-1);
    const old=(previous.freshness??[]).find(row=>row.key===key);
    next.freshness=next.freshness.filter(row=>row.key!==key);
    next.freshness.push({...old,key,status:'last-known-good',error:'Partial refresh; retained last verified observations',observedAt:points.at(-1).date});
  }
  const prior=previous.bitcoin;
  if(prior?.price!=null && (incoming.bitcoin.price==null || Date.parse(prior.priceObservedAt)>Date.parse(incoming.bitcoin.priceObservedAt))) {
    next.bitcoin={...incoming.bitcoin,price:prior.price,priceObservedAt:prior.priceObservedAt,priceConsensus:incoming.bitcoin.price==null?'stale':prior.priceConsensus,priceSources:prior.priceSources};
  }
  return next;
}
