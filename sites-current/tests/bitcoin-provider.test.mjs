import test from 'node:test';
import assert from 'node:assert/strict';
import { validSpotPrice, validVenueObservation } from '../lib/bitcoin-provider.mjs';
import { resolveBitcoinConsensus } from '../app/data/bitcoin-consensus.mjs';

test('corrupt provider scalars are never prices',()=>{
  for (const value of [[80000],[],{},true,false,null,undefined,'',' ',Infinity,NaN]) assert.equal(validSpotPrice(value),null);
  assert.equal(validSpotPrice('80000.5'),80000.5);
});
test('invalid calendars and future venue quotes are rejected',()=>{
  for (const observedAt of ['2026-02-30T12:00:00Z','2099-01-01T00:00:00Z',null,123,'2026-10-01'])
    assert.equal(validVenueObservation({source:'coinbase',price:80000,observedAt}),null);
});
test('corrupt primary uses independent valid backup',()=>{
  const result=resolveBitcoinConsensus([null,{source:'coinbase',price:[80000],observedAt:'2026-10-01T12:00:00Z'},{source:'kraken',price:'80001',observedAt:'2026-10-01T12:00:00Z'}]);
  assert.equal(result.price,80001);assert.equal(result.consensus,'single-source');assert.deepEqual(result.sources,['kraken']);
});
test('duplicate venue never counts as consensus',()=>{
  const result=resolveBitcoinConsensus([{source:'coinbase',price:80000,observedAt:'2026-10-01T12:00:00Z'},{source:'coinbase',price:80005,observedAt:'2026-10-01T12:00:02Z'}]);
  assert.equal(result.price,80005);assert.equal(result.consensus,'single-source');
});
test('both providers invalid reports unavailable, not zero',()=>{
  assert.equal(resolveBitcoinConsensus([{source:'coinbase',price:[],observedAt:'2026-10-01T12:00:00Z'},{source:'kraken',price:0}]).price,null);
  assert.equal(resolveBitcoinConsensus(null).consensus,'unavailable');
});
