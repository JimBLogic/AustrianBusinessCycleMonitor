import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { SOURCE_POLICY_VERSION } from '../lib/snapshot-policy.mjs';

async function runtime(onUpstream, mode = 'valid') {
  const root=new URL('../dist/server/',import.meta.url);
  const paths=(await readdir(root,{recursive:true})).filter(p=>p.endsWith('.js')&&p!=='index.js');
  const modules=await Promise.all(['index.js',...paths].map(async path=>({type:'ESModule',path:fileURLToPath(new URL(path,root)),contents:await readFile(new URL(path,root),'utf8')})));
  let db;
  const mf=new Miniflare(convertV4MiniflareOptions({name:'abcm-refresh-race',modules,compatibilityDate:'2026-08-08',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],serviceBindings:{ASSETS:async()=>new Response('Not found',{status:404})},outboundService:async request=>{
    if(new URL(request.url).hostname==='fred.stlouisfed.org') {
      await onUpstream(db);
      if (mode === 'valid') return new Response(`observation_date,M2SL\n${new Date().toISOString().slice(0,10)},25000`,{headers:{'content-type':'text/csv'}});
      if (mode === 'monthly') {
        const now=new Date(),start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-1,1)).toISOString().slice(0,10);
        return new Response(`observation_date,FEDFUNDS,INDPRO,TCU\n${start},3.75,103.9506,76.8504`,{headers:{'content-type':'text/csv'}});
      }
    }
    return new Response('Isolated provider outage fixture',{status:503});
  }}));
  db=await mf.getD1Database('DB');
  const schema=await readFile(new URL('../migrations/selfhost/0001_macro_snapshots.sql',import.meta.url),'utf8');
  for(const sql of schema.split(';').filter(s=>s.trim())) await db.prepare(sql).run();
  return {mf,db};
}

async function insert(db,id,requestedAt,value) {
  const metrics={series:{m2:[{date:requestedAt.slice(0,10),value}]},bitcoin:{price:80000,priceObservedAt:requestedAt,priceConsensus:'confirmed',priceSources:['coinbase','kraken']},freshness:[]};
  await db.prepare('INSERT INTO macro_snapshots (id,requested_at,refresh_mode,regime,scores_json,metrics_json,provenance_json,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,requestedAt,'daily-edition','mixed-transition','{}',JSON.stringify(metrics),JSON.stringify({sourcePolicyVersion:SOURCE_POLICY_VERSION}),requestedAt).run();
}

test('a generation raced by another durable writer returns that actual edition, not discarded values',async()=>{
  let concurrentAt,inserted=false;
  const {mf,db}=await runtime(async db=>{
    if(inserted) return;
    inserted=true;concurrentAt=new Date().toISOString();
    await insert(db,'concurrent',concurrentAt,24000);
  });
  try {
    await insert(db,'previous',new Date(Date.now()-86400000).toISOString(),23000);
    const response=await mf.dispatchFetch('http://localhost/api/data',{method:'POST'});
    assert.equal(response.status,200,await response.clone().text());
    const data=await response.json();
    assert.equal(data.requestedAt,concurrentAt,'discarded generation must not claim a new persisted timestamp');
    assert.equal(data.latest.m2.value,24000,'return the saved value, neither the old 23000 nor generated 25000');
    const health=await(await mf.dispatchFetch('http://localhost/api/health')).json();
    assert.equal(health.data.snapshot_at,data.requestedAt);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM macro_snapshots').first()).n,2,'atomic guard prevents a duplicate edition');
  } finally {await mf.dispose();}
});

test('a validated FRED monthly delivery is not displaced by a retained DBnomics month-end label for the same period',async()=>{
  const {mf,db}=await runtime(async()=>{},'monthly');
  try {
    const now=new Date(),start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-1,1)).toISOString().slice(0,10);
    const end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),0)).toISOString().slice(0,10);
    const previousAt=new Date(Date.now()-86400000).toISOString();
    await insert(db,'previous',previousAt,23000);
    const keys=['fedFunds','industrialProduction','capacityUtilization'];
    const metrics={series:Object.fromEntries(keys.map(key=>[key,[{date:end,value:1}]])),freshness:keys.map(key=>({key,source:'dbnomics',status:'last-known-good'}))};
    await db.prepare('UPDATE macro_snapshots SET metrics_json=? WHERE id=?').bind(JSON.stringify(metrics),'previous').run();
    const response=await mf.dispatchFetch('http://localhost/api/data',{method:'POST'});
    assert.equal(response.status,200,await response.clone().text());
    const data=await response.json();
    for (const key of keys) {
      assert.equal(data.latest[key].date,start,'preserve the newly downloaded original FRED label');
      assert.notEqual(data.latest[key].value,1,'retain the actual newly validated value, not the old fixture');
      assert.equal(data.freshness.find(row=>row.key===key).source,'csv');
      assert.equal(data.freshness.find(row=>row.key===key).status,'live');
      assert.equal(data.health.indicators.find(row=>row.indicator===key).freshness.state,'FRESH');
    }
    const saved=await(await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(saved.latest.fedFunds.date,start);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM macro_snapshots').first()).n,2);
  } finally {await mf.dispose();}
});

test('a rejected durable write returns HTTP 503 and retains the previous real snapshot',async()=>{
  const {mf,db}=await runtime(async()=>{});
  try {
    const previousAt=new Date(Date.now()-86400000).toISOString();
    await insert(db,'previous',previousAt,23000);
    await db.prepare("CREATE TRIGGER fixture_write_failure BEFORE INSERT ON macro_snapshots BEGIN SELECT RAISE(ABORT,'isolated write failure'); END").run();
    const response=await mf.dispatchFetch('http://localhost/api/data',{method:'POST'});
    assert.equal(response.status,503);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const rejected=await response.json();
    assert.equal(rejected.provenance.persistence,'failed');
    assert.equal(rejected.errorCode,'persistence_failed');
    assert.equal(response.headers.get('X-ABCM-Request-Id'),rejected.requestId);
    assert.match(rejected.error,/could not be persisted/);
    const retained=await(await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(retained.requestedAt,previousAt);
    assert.equal(retained.latest.m2.value,23000);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM macro_snapshots').first()).n,1);
  } finally {await mf.dispose();}
});

test('a full provider outage cannot persist retained observations with a new edition timestamp',async()=>{
  const {mf,db}=await runtime(async()=>{},'outage');
  try {
    const previousAt=new Date(Date.now()-86400000).toISOString();
    await insert(db,'previous',previousAt,23000);
    const response=await mf.dispatchFetch('http://localhost/api/data',{method:'POST'});
    assert.equal(response.status,503);
    const failure=await response.json();
    assert.equal(failure.errorCode,'provider_unavailable');
    assert.equal((await db.prepare('SELECT count(*) AS n FROM macro_snapshots').first()).n,1);
    const retained=await(await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(retained.requestedAt,previousAt);
    assert.equal(retained.latest.m2.value,23000);
    assert.equal(retained.bitcoin.priceObservedAt,previousAt);
  } finally {await mf.dispose();}
});

test('an unexpected D1 trigger write count cannot be acknowledged as a verified edition',async()=>{
  const {mf,db}=await runtime(async()=>{});
  try {
    const previousAt=new Date(Date.now()-86400000).toISOString();
    await insert(db,'previous',previousAt,23000);
    await db.prepare("CREATE TRIGGER fixture_rewrite AFTER INSERT ON macro_snapshots BEGIN UPDATE macro_snapshots SET provenance_json='{}' WHERE id=NEW.id; END").run();
    const response=await mf.dispatchFetch('http://localhost/api/data',{method:'POST'});
    assert.equal(response.status,503);
    assert.equal((await response.json()).errorCode,'persistence_unconfirmed');
    const retained=await(await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(retained.requestedAt,previousAt,'unconfirmed edition must not hide the previous verified snapshot');
  } finally {await mf.dispose();}
});

test('quarterly period freshness survives D1 recovery and matches API/UI source status without rewriting dates',async()=>{
  const {mf,db}=await runtime(async()=>{},'outage');
  try {
    const now=new Date(), at=now.toISOString();
    const year=now.getUTCFullYear(), quarter=Math.floor(now.getUTCMonth()/3);
    const start=new Date(Date.UTC(year,quarter*3-3,1)).toISOString().slice(0,10);
    const end=new Date(Date.UTC(year,quarter*3,0)).toISOString().slice(0,10);
    await insert(db,'quarterly',at,23000);
    const metrics={series:{federalDebt:[{date:start,value:40000000}],debtToGdp:[{date:start,value:120}],realGdpGrowth:[{date:start,value:2}]},freshness:['federalDebt','debtToGdp','realGdpGrowth'].map(key=>({key,source:'csv',status:'live'}))};
    await db.prepare('UPDATE macro_snapshots SET metrics_json=? WHERE id=?').bind(JSON.stringify(metrics),'quarterly').run();
    const response=await mf.dispatchFetch('http://localhost/api/data');
    const data=await response.json();
    const health=await(await mf.dispatchFetch('http://localhost/api/health')).json();
    for (const key of ['federalDebt','debtToGdp','realGdpGrowth']) {
      const row=data.health.indicators.find(row=>row.indicator===key);
      assert.equal(data.series[key][0].date,start);
      assert.equal(data.latest[key].date,start);
      assert.equal(row.reference_period_end,end);
      assert.equal(row.freshness.state,'FRESH');
      assert.equal(data.freshness.find(row=>row.key===key).status,'live');
      assert.deepEqual(health.data.indicators.find(row=>row.indicator===key),row);
    }
    assert.equal(data.derived.scores.composite??null,null,'three fresh series alone cannot manufacture a model score');
  } finally {await mf.dispose();}
});
