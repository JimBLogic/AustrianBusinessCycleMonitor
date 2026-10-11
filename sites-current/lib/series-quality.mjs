/** Missing values must never become observations with value zero. */
export function finiteObservation(value) {
  if (value == null || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function validDate(date, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const stamp = Date.parse(date);
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0,10) === date && stamp <= now + 86400000;
}
export function normalizeSeries(points, now = Date.now()) {
  const dates = new Map();
  for (const point of points) {
    const value = finiteObservation(point.value);
    if (validDate(point.date, now) && value != null) dates.set(point.date,value);
  }
  return [...dates].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value}));
}
export function parseFredCsv(text) {
  const lines = text.trim().replace(/^\uFEFF/,'').split(/\r?\n/);
  const headers = lines.shift()?.split(',') ?? [];
  if (!['DATE','observation_date'].includes(headers[0])) return {};
  const result = Object.fromEntries(headers.slice(1).map(id=>[id,[]]));
  for (const row of lines) {
    const cells = row.split(',');
    if (!validDate(cells[0])) continue;
    headers.slice(1).forEach((id,index)=>{
      const value = finiteObservation(cells[index+1]);
      if (value != null) result[id].push({date:cells[0],value});
    });
  }
  return Object.fromEntries(Object.entries(result).map(([id,points])=>[id,normalizeSeries(points)]));
}
export function parseCboeCsv(text, code) {
  const lines=text.trim().replace(/^\uFEFF/,'').split(/\r?\n/);
  const headers=(lines.shift()??'').split(',').map(h=>h.trim().toUpperCase());
  const dateColumn=headers.indexOf('DATE');
  const valueColumn=headers.indexOf(code==='VIX'?'CLOSE':'SPX');
  if(dateColumn<0 || valueColumn<0) return [];
  return normalizeSeries(lines.flatMap(row=>{
    const cells=row.split(',');const m=cells[dateColumn]?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const value=finiteObservation(cells[valueColumn]);
    return m && value!=null && value>0 ? [{date:`${m[3]}-${m[1]}-${m[2]}`,value}] : [];
  })).filter(point=>point.date>='2015-01-01');
}
export function alignedDifference(left,right) {
  const values=new Map(normalizeSeries(right).map(p=>[p.date,p.value]));
  return normalizeSeries(left).flatMap(p=>values.has(p.date)?[{date:p.date,value:Number((p.value-values.get(p.date)).toFixed(8))}]:[]);
}
export function compareSeries(primary,backup,tolerance=0.011,now=Date.now()) {
  const p=normalizeSeries(primary,now),b=normalizeSeries(backup,now),bv=new Map(b.map(x=>[x.date,x.value]));
  const overlap=p.filter(x=>bv.has(x.date)).slice(-60);
  const maxDifference=overlap.length?Math.max(...overlap.map(x=>Math.abs(x.value-bv.get(x.date)))):null;
  const backupDate=b.at(-1)?.date??null;
  const fresh=backupDate!=null && now-Date.parse(backupDate)<=14*86400000;
  const primaryDate=p.at(-1)?.date??null;
  const commonDate=overlap.at(-1)?.date??null;
  const recentOverlap=commonDate!=null && now-Date.parse(commonDate)<=14*86400000;
  const status=!b.length?'unavailable':!fresh?'stale':!overlap.length?'uncompared':!recentOverlap?'stale-comparison':maxDifference>tolerance?'divergent':overlap.length<5?'insufficient':'matched';
  return {status,pointsCompared:overlap.length,primaryDate,backupDate,commonDate,maxDifference,tolerance,fresh,automaticPromotion:false};
}
export function seriesFresh(points,maxAgeDays,now=Date.now()) {
  const last=normalizeSeries(points,now).at(-1);
  return Boolean(last && now-Date.parse(last.date)<=maxAgeDays*86400000);
}
