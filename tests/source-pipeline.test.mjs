import test from 'node:test';
import assert from 'node:assert/strict';

test('cold-start pipeline preserves sources, runs comparisons and rejects fake spot fallbacks',async()=>{
  const original=globalThis.fetch;
  const calls=[];const persisted=[];
  const dates=Array.from({length:400},(_,i)=>new Date(Date.now()-(400-i)*86400000).toISOString().slice(0,10));
  const values={M2SL:21000,FEDFUNDS:4,DGS10:5.18,T10Y2Y:0.31,BAA10Y:1.39,DBAA:6.57,CPIAUCSL:320,UNRATE:4,GFDEBTN:40000,GFDEGDQ188S:120,DCOILWTICO:70,DTWEXBGS:120,SP500:7700,VIXCLS:15,INDPRO:105,TCU:78,A191RL1Q225SBEA:2,CFSBCACTIVITYMFG:1};
  globalThis.fetch=async(input)=>{
    const u=new URL(input);calls.push(u.href);
    if(u.hostname==='fred.stlouisfed.org'){
      const requested=u.searchParams.get('id').split(',');
      // Mixed-frequency batch omits a quarterly series; individual recovery is
      // older than the freshness threshold but must remain visible as history.
      const ids=requested.length>1?requested.filter(id=>id!=='GFDEBTN'):requested;
      if(requested.length===1 && requested[0]==='GFDEBTN') return new Response('observation_date,GFDEBTN\n2025-01-01,40000\n2025-04-01,41000');
      return new Response('observation_date,'+ids.join(',')+'\n'+dates.map(d=>d+','+ids.map(id=>values[id]??'').join(',')).join('\n'),{headers:{'content-type':'text/csv'}});
    }
    if(u.hostname.includes('cboe.com')){
      const vix=u.pathname.includes('VIX');
      return new Response((vix?'DATE,OPEN,HIGH,LOW,CLOSE':'DATE,SPX')+'\n'+dates.map(d=>{
        const [y,m,day]=d.split('-');return `${m}/${day}/${y},${vix?'15,15,15,15':'7700'}`;
      }).join('\n'));
    }
    if(u.hostname==='thedocs.worldbank.org')return new Response('not available',{status:404});
    if(u.hostname==='api.exchange.coinbase.com')return Response.json({price:'80000',time:new Date().toISOString()});
    if(u.hostname==='api.kraken.com')return Response.json({error:[],result:{XXBTZUSD:{c:['80010']}}});
    if(u.hostname==='mempool.space')return u.pathname.includes('height')?new Response('910000'):Response.json({fastestFee:1,hourFee:1});
    if(u.hostname==='api.fiscaldata.treasury.gov')return Response.json({data:dates.map(record_date=>({record_date,tot_pub_debt_out_amt:'40000000000000'}))});
    if(u.hostname==='api.blockchain.info')return Response.json({values:dates.map(d=>({x:Date.parse(d)/1000,y:79000}))});
    if(u.hostname==='blockchain.info')return Response.json({totalbc:1990000000000000,market_price_usd:1});
    throw new Error('Unexpected endpoint '+u.href);
  };
  const worker = (await import('../dist/server/index.js')).default;
  const DB={batch:async()=>[],prepare(sql){let args=[];return {bind(...a){args=a;return this;},first:async()=>{
      const a=persisted.at(-1);
      return a?{requestedAt:a[1],refreshMode:a[2],regime:a[3],scoresJson:a[4],metricsJson:a[5],provenanceJson:a[6]}:null;
    },all:async()=>({results:[]}),run:async()=>{if(sql.startsWith('INSERT'))persisted.push(args);return {};}};}};
  try{
    const env={DB,ASSETS:{fetch:async()=>new Response('',{status:404})}},ctx={waitUntil(){},passThroughOnException(){}};
    const [r1,r2]=await Promise.all([worker.fetch(new Request('http://localhost/api/data'),env,ctx),worker.fetch(new Request('http://localhost/api/data'),env,ctx)]);
    assert.equal(r1.status,200);assert.equal(r2.status,200);
    const p=await r1.json();await r2.text();
    assert.equal(p.latest.federalDebt.value,41000);
    assert.equal(p.freshness.find(row=>row.key==='federalDebt').status,'stale');
    assert.equal(p.latest.creditSpread.value,1.39);assert.equal(p.latest.vix.value,15);
    assert.equal(p.provenance.backupValidation.find(c=>c.key==='creditSpread').status,'matched');
    assert.equal(p.provenance.backupValidation.find(c=>c.key==='vix').status,'matched');
    assert.equal(p.bitcoin.price,80005);assert.equal(p.provenance.bitcoinPrice,'Coinbase + Kraken');
    assert.equal(calls.filter(u=>u.includes('VIX_History')).length,1,'concurrent requests must share pipeline');
    assert.equal(persisted.length,1);assert.equal(p.series.gold.length,0,'no PAXG pseudo-gold');
    assert.ok(!calls.some(u=>u.includes('H15_discontinued')||u.includes('api.worldbank.org')));
    const before=calls.length;
    globalThis.fetch=async()=>{throw new Error('all providers offline after persistence');};
    const saved=await (await worker.fetch(new Request('http://localhost/api/data'),env,ctx)).json();
    assert.equal(saved.refreshMode,'daily-edition');
    assert.equal(saved.provenance.mode,'daily-persisted');
    assert.equal(saved.requestedAt,p.requestedAt);
    assert.deepEqual(saved.series,p.series,'the writer output must survive the production reader');
    assert.equal(calls.length,before);
    const cooldown=await (await worker.fetch(new Request('http://localhost/api/data',{method:'POST'}),env,ctx)).json();
    assert.equal(cooldown.refreshMode,'manual-cooldown');
    assert.equal(cooldown.requestedAt,p.requestedAt);
  }finally{globalThis.fetch=original;}
});
