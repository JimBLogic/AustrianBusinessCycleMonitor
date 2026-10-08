import { FRED_SERIES, MAX_OBSERVATION_AGE_DAYS } from './source-registry';

type Point = {date:string;value:number};
type Freshness = {key:string;source?:string|null;status?:string;error?:string|null;last_attempt?:string|null;last_success?:string|null};
type Snapshot = {requestedAt:string;metrics:{series?:Record<string,Point[]>;freshness?:Freshness[];bitcoin?:{price?:number|null;priceObservedAt?:string;priceConsensus?:string;priceSources?:string[]}};provenance:Record<string,unknown>};
const backups:Record<string,string> = {
  m2:'DBnomics / FED H6 M2.M',fedFunds:'DBnomics / FED H15 RIFSPFF_N.M',treasury10y:'DBnomics / FED H15 RIFLGFCY10_N.B',treasury2y:'DBnomics / FED H15 RIFLGFCY02_N.B',
  yieldCurve:'DBnomics / FED H15 10Y minus 2Y, identical dates',creditSpread:'FRED DBAA minus DGS10; same provider outage risk',
  cpi:'BLS CUSR0000SA0',unemployment:'BLS LNS14000000',oil:'DBnomics / EIA RWTC.D',dollar:'DBnomics / FED H10 JRXWTFB_N.B',
  industrialProduction:'DBnomics / FED G17 IP.B50001.S',capacityUtilization:'DBnomics / FED G17 CAPUTL.B50001.S',
  sp500:'Cboe SPX daily close, validated overlap',vix:'Cboe VIX daily close, validated overlap',
};
export function snapshotHealth(snapshot:Snapshot|null, now=Date.now()) {
  const editionOld = !snapshot || now-Date.parse(snapshot.requestedAt)>36*60*60_000;
  const indicators=Object.entries(FRED_SERIES).map(([key,id])=>{
    const row=snapshot?.metrics.freshness?.find(item=>item.key===key);
    const point=snapshot?.metrics.series?.[key]?.at(-1);
    const maxAge=key==='gold'&&row?.source==='worldbank'?75:MAX_OBSERVATION_AGE_DAYS[key as keyof typeof FRED_SERIES];
    const age=point?Math.max(0,(now-Date.parse(point.date))/86400000):null;
    const retained=row?.status==='last-known-good';
    const stale=editionOld||retained||(age!=null&&age>maxAge);
    const backup=!!row?.source&&!['api','csv'].includes(row.source);
    const source=row?.source==='worldbank'?'World Bank Pink Sheet / monthly gold':row?.source??`FRED ${id}`;
    return {indicator:key,metric:String(id),source,status:!point?'UNAVAILABLE':stale?'STALE':backup?'DEGRADED':'HEALTHY',
      last_attempt:row?.last_attempt??snapshot?.requestedAt??null,
      last_success:row?.last_success??(point?snapshot?.requestedAt??null:null),
      last_valid_value:point?.value??null,observation_date:point?.date??null,
      freshness:{state:!point?'UNAVAILABLE':stale?'STALE':'FRESH',age_days:age==null?null:Math.round(age*10)/10,max_age_days:maxAge},
      failure_reason:row?.error??(!point?'No validated observation':stale?'Observation or edition exceeds freshness policy':backup?'Primary unavailable; exact metric backup selected':null),
      fallback:{configured:backups[key]??'No verified equivalent provider; durable last-known-good only',active:retained?'last-known-good':backup?source:null},
      unit:key==='federalDebt'?'USD millions':key==='gold'?'USD per troy ounce, monthly mean':null};
  });
  const btc=snapshot?.metrics.bitcoin;
  const price=typeof btc?.price==='number'&&Number.isFinite(btc.price)?btc.price:null;
  const stamp=btc?.priceObservedAt;
  const stale=!stamp||now-Date.parse(stamp)>15*60_000;
  indicators.push({indicator:'bitcoin',metric:'BTC-USD spot',source:snapshot?.provenance.bitcoinPrice as string??'Coinbase + Kraken',status:price==null?'UNAVAILABLE':stale?'STALE':btc?.priceConsensus==='confirmed'?'HEALTHY':'DEGRADED',
    last_attempt:snapshot?.requestedAt??null,last_success:stamp??null,last_valid_value:price,observation_date:stamp??null,
    freshness:{state:price==null?'UNAVAILABLE':stale?'STALE':'FRESH',age_days:stamp?(now-Date.parse(stamp))/86400000:null,max_age_days:15/1440},
    failure_reason:price==null?'Both spot providers unavailable':stale?'Last verified spot quote; live pulse has a separate timestamp':null,
    fallback:{configured:'Coinbase ↔ Kraken, same BTC/USD spot; then durable last-known-good',active:stale?'last-known-good':null},unit:'USD per BTC'});
  const available=indicators.filter(row=>row.last_valid_value!=null).length;
  const fresh=indicators.filter(row=>row.freshness.state==='FRESH').length;
  const status=!available?'UNAVAILABLE':!fresh?'STALE':indicators.some(row=>row.status!=='HEALTHY')?'DEGRADED':'HEALTHY';
  return {status,available,total:indicators.length,fresh,snapshot_at:snapshot?.requestedAt??null,indicators};
}
