import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
// Node 22.14 in CI does not implicitly load .ts modules. Compile the actual
// implementation with the locked compiler, rather than duplicating its logic.
const source=await readFile(new URL('../lib/local-preferences.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {readWatchlistPreference,saveWatchlistPreference,saveManualRefreshPreference,readManualRefreshPreference}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

test('empty watchlist persists, and blocked storage never reports a successful save', () => {
  const entries = new Map();
  globalThis.window = {localStorage:{getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)}};
  try {
    assert.equal(readWatchlistPreference(),null);
    assert.equal(saveWatchlistPreference([]),true);
    assert.deepEqual(readWatchlistPreference(),[]);
    const baseline={capturedAt:'2026-10-01T12:00:00Z',requestedAt:'2026-10-01T12:00:00Z',regime:'provisional',composite:52,modelReady:false,bitcoinPrice:null,latestDates:{m2:'2026-08-01'}};
    assert.equal(saveManualRefreshPreference(baseline,1234),true);
    assert.deepEqual(readManualRefreshPreference().previousSnapshot,baseline);
    globalThis.window = {get localStorage(){throw new Error('storage blocked');}};
    assert.equal(saveWatchlistPreference(['m2']),false);
    assert.equal(saveManualRefreshPreference(baseline,1234),false);
    assert.equal(readManualRefreshPreference(),null);
  } finally { delete globalThis.window; }
});
