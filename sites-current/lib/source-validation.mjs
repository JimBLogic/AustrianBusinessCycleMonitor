export function summarizeValidation(history) {
  return ['vix','creditSpread','sp500'].map(key=>{
    const checks=history.flatMap(run=>run.checks.filter(c=>c.key===key).map(check=>({checkedAt:run.checkedAt,...check})));
    const byDay=new Map();
    for(const check of checks){const day=check.checkedAt.slice(0,10);if(!byDay.has(day))byDay.set(day,check);}
    const days=[...byDay.values()];
    const matched=days.filter(c=>c.status==='matched').length;
    const divergent=checks.filter(c=>c.status==='divergent').length;
    const ready=days.length>=30 && matched/days.length>=0.99 && divergent===0;
    return {key,editionsCompared:checks.length,distinctDays:days.length,matchedDays:matched,divergentChecks:divergent,
      latest:checks[0]??null,reviewStatus:ready?'eligible-for-human-review':'collecting-evidence',
      automaticPromotion:false,minimumDays:30,scope:'Latest observed edition per UTC day; up to 3000 persisted editions. Not continuous uptime.'};
  });
}
