import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { SOURCE_POLICY_VERSION } from '../lib/snapshot-policy.mjs';

async function runtime() {
  const root = new URL('../dist/server/', import.meta.url);
  const paths = (await readdir(root, {recursive:true})).filter(p => p.endsWith('.js') && p !== 'index.js');
  const modules = await Promise.all(['index.js', ...paths].map(async path => ({
    type:'ESModule', path:fileURLToPath(new URL(path, root)), contents:await readFile(new URL(path, root), 'utf8'),
  })));
  const mf = new Miniflare(convertV4MiniflareOptions({
    name:'abcm-persisted-model-age', modules, compatibilityDate:'2026-08-08', compatibilityFlags:['nodejs_compat'],
    d1Databases:['DB'], serviceBindings:{ASSETS:async () => new Response('Not found', {status:404})},
    outboundService:async () => { throw new Error('No live network in persisted-model fixtures'); },
  }));
  const db = await mf.getD1Database('DB');
  const schema = await readFile(new URL('../migrations/selfhost/0001_macro_snapshots.sql', import.meta.url), 'utf8');
  for (const sql of schema.split(';').filter(s => s.trim())) await db.prepare(sql).run();
  return {mf, db};
}

const signalKeys = ['money','monetaryStance','creditRisk','termStructure','production','labour','consumerPrices','resourcesFx','debtBurden','fiscalImpulse'];
const engineKeys = ['liquidity','credit','realEconomy','inflation','fiscal'];
function fixture() {
  const now = new Date();
  const day = offset => new Date(Date.now() - offset * 86400000).toISOString().slice(0,10);
  const monthly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()-1, 1)).toISOString().slice(0,10);
  const quarterly = new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth()/3)*3-3, 1)).toISOString().slice(0,10);
  const series = Object.fromEntries(['m2','fedFunds','cpi','industrialProduction','capacityUtilization','unemployment']
    .map(key => [key,[{date:monthly,value:100}]]));
  for (const key of ['creditSpread','yieldCurve','vix','oil','dollar']) series[key] = [{date:day(1),value:17}];
  for (const key of ['federalDebt','debtToGdp']) series[key] = [{date:quarterly,value:100}];
  const scores = Object.fromEntries([...signalKeys, ...engineKeys, 'composite'].map(key => [key,54]));
  const provenance = {
    sourcePolicyVersion:SOURCE_POLICY_VERSION, modelReady:true, modelStatus:'complete',
    modelInputsAvailable:14, modelInputsTotal:14, availableWeight:1,
    signalReady:Object.fromEntries(signalKeys.map(key => [key,true])),
    engineReady:Object.fromEntries(engineKeys.map(key => [key,true])),
  };
  return {day, series, scores, provenance, requestedAt:new Date(Date.now()-24*3600000).toISOString()};
}

async function save(db, state, freshness = [], bitcoin = {}) {
  await db.prepare('DELETE FROM macro_snapshots').run();
  await db.prepare('INSERT INTO macro_snapshots (id,requested_at,refresh_mode,regime,scores_json,metrics_json,provenance_json,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind('isolated-model',state.requestedAt,'daily-edition','mixed-transition',JSON.stringify(state.scores),
      JSON.stringify({series:state.series,freshness,bitcoin}),JSON.stringify(state.provenance),state.requestedAt).run();
}

function assertWithheld(data) {
  assert.equal(data.provenance.modelStatus,'withheld');
  assert.equal(data.provenance.modelWithheldReason,'input-expired');
  assert.equal(data.provenance.modelReady,false);
  assert.equal(data.provenance.modelInputsAvailable,0);
  assert.equal(data.provenance.availableWeight,0);
  assert.ok(Object.values(data.provenance.signalReady).every(v => v === false));
  assert.ok(Object.values(data.provenance.engineReady).every(v => v === false));
  assert.ok(Object.values(data.derived.scores).every(v => v === null));
}

test('persisted scores withdraw when a used observation expires before the 36-hour edition limit', async () => {
  const {mf,db} = await runtime();
  try {
    for (const key of ['vix','dollar']) {
      const state = fixture();
      state.series[key] = [{date:state.day(14),value:17}];
      await save(db,state);
      const response = await mf.dispatchFetch('http://localhost/api/data');
      assert.equal(response.status,200);
      const data = await response.json();
      assert.equal(data.health.indicators.find(x => x.indicator === key).status,'STALE');
      assertWithheld(data);
      assert.deepEqual(data.series[key],state.series[key],'expired observations remain inspectable');
      assert.equal(data.latest[key].value,17);
    }
  } finally { await mf.dispose(); }
});

test('stored model keeps its original preferred daily debt dependency rather than silently switching to a fresh quarter', async () => {
  const {mf,db} = await runtime();
  try {
    const state = fixture();
    state.series.treasuryDebt = [{date:state.day(14),value:39500}];
    await save(db,state);
    const data = await (await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(data.health.indicators.find(x => x.indicator === 'federalDebt').freshness.state,'FRESH');
    assertWithheld(data);
    assert.equal(data.series.treasuryDebt[0].value,39500);
  } finally { await mf.dispose(); }
});

test('valid-age backup data and stale unscored gold or stored Bitcoin do not withdraw the scored model', async () => {
  const {mf,db} = await runtime();
  try {
    const state = fixture();
    state.series.gold = [{date:state.day(200),value:4000}];
    const freshness = [{key:'vix',source:'cboe',status:'live'},{key:'gold',source:'worldbank',status:'live'}];
    await save(db,state,freshness,{price:80000,priceObservedAt:new Date(Date.now()-2*86400000).toISOString(),priceConsensus:'confirmed'});
    const data = await (await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(data.health.indicators.find(x => x.indicator === 'vix').status,'DEGRADED');
    assert.equal(data.health.indicators.find(x => x.indicator === 'gold').status,'STALE');
    assert.equal(data.health.indicators.find(x => x.indicator === 'bitcoin').status,'STALE');
    assert.equal(data.provenance.modelStatus,'complete');
    assert.equal(data.provenance.modelInputsAvailable,14);
    assert.equal(data.derived.scores.composite,54);
    // A source check can fail while an official observation remains within its
    // publication-age contract. Do not conflate transport health with age.
    await save(db,state,[{key:'vix',source:'cboe',status:'last-known-good'}]);
    const retained = await (await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(retained.provenance.modelStatus,'complete');
  } finally { await mf.dispose(); }
});

test('an already excluded input does not invalidate a provisional stored composite', async () => {
  const {mf,db} = await runtime();
  try {
    const state = fixture();
    state.series.vix = [{date:state.day(30),value:17}];
    state.scores.creditRisk = null;
    state.scores.credit = null;
    Object.assign(state.provenance,{modelStatus:'provisional',modelReady:false,modelInputsAvailable:13,availableWeight:0.87});
    state.provenance.signalReady.creditRisk = false;
    state.provenance.engineReady.credit = false;
    await save(db,state);
    const data = await (await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(data.provenance.modelStatus,'provisional');
    assert.equal(data.provenance.modelInputsAvailable,13);
    assert.equal(data.derived.scores.composite,54);
  } finally { await mf.dispose(); }
});

test('Treasury six-force reading cannot borrow a fresh yield timestamp for a stale curve', async () => {
  const {mf,db} = await runtime();
  try {
    const state = fixture();
    state.series.treasury10y = [{date:state.day(91),value:4},{date:state.day(1),value:5}];
    state.series.yieldCurve = [{date:state.day(60),value:-0.5}];
    await save(db,state);
    const data = await (await mf.dispatchFetch('http://localhost/api/data')).json();
    assert.equal(data.health.indicators.find(x => x.indicator === 'yieldCurve').status,'STALE');
    assert.equal(data.derived.sixForce.forces.treasury.available,false);
    assert.equal(data.derived.sixForce.forces.treasury.state,'stale');
    assert.equal(data.derived.sixForce.forces.treasury.secondaryValue,-0.5,'retain the dated observation for inspection');
  } finally { await mf.dispose(); }
});
