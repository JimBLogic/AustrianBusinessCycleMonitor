import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { SOURCE_POLICY_VERSION } from '../lib/snapshot-policy.mjs';

async function runtime(onUpstream) {
  const root=new URL('../dist/server/',import.meta.url);
  const paths=(await readdir(root,{recursive:true})).filter(p=>p.endsWith('.js')&&p!=='index.js');
  const modules=await Promise.all(['index.js',...paths].map(async path=>({type:'ESModule',path:fileURLToPath(new URL(path,root)),contents:await readFile(new URL(path,root),'utf8')})));
  let db;
  const mf=new Miniflare(convertV4MiniflareOptions({name:'abcm-refresh-race',modules,compatibilityDate:'2026-08-08',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],serviceBindings:{ASSETS:async()=>new Response('Not found',{status:404})},outboundService:async request=>{
    if(new URL(request.url).hostname==='fred.stlouisfed.org') {
      await onUpstream(db);
      return new Response(`observation_date,M2SL\n${new Date().toISOString().slice(0,10)},25000`,{headers:{'content-type':'text/csv'}});
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
    assert.match(rejected.error,/could not be persisted/);
    const retained=await(await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(retained.requestedAt,previousAt);
    assert.equal(retained.latest.m2.value,23000);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM macro_snapshots').first()).n,1);
  } finally {await mf.dispose();}
});
