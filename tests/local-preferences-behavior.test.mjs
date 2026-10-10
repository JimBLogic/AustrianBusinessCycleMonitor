import test from 'node:test';
import assert from 'node:assert/strict';
import { readWatchlistPreference, saveWatchlistPreference, saveManualRefreshPreference, readManualRefreshPreference } from '../lib/local-preferences.ts';

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
