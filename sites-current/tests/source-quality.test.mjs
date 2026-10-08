import test from 'node:test';
import assert from 'node:assert/strict';
import { finiteObservation, parseFredCsv, parseCboeCsv, alignedDifference, compareSeries, normalizeSeries } from '../lib/series-quality.mjs';
import { boundedBody, validateTransportBody, retryAfterMilliseconds } from '../lib/upstream-policy.mjs';
import { summarizeValidation } from '../lib/source-validation.mjs';
test('missing, null, blank and sentinels do not become fake zeros',()=>{
 for(const x of [null,undefined,'',' ','.','NA',false])assert.equal(finiteObservation(x),null);
 assert.equal(finiteObservation('0'),0);assert.equal(finiteObservation('-0.4'),-0.4);
 assert.deepEqual(parseFredCsv('observation_date,A\n2026-09-01,\n2026-09-02,.\n2026-09-03,0').A,[{date:'2026-09-03',value:0}]);
});
test('Cboe parser selects CLOSE by header and validates date/schema',()=>{
 assert.deepEqual(parseCboeCsv('DATE,CLOSE,OPEN\n09/01/2026,17,99','VIX'),[{date:'2026-09-01',value:17}]);
 assert.deepEqual(parseCboeCsv('DATE,OPEN\n09/01/2026,17','VIX'),[]);
 assert.deepEqual(normalizeSeries([{date:'2026-02-30',value:1},{date:'2999-01-01',value:1}]),[]);
});
test('Baa spread uses exact observation dates, never nearest day or monthly proxy',()=>{
 assert.deepEqual(alignedDifference([{date:'2026-09-23',value:6.50},{date:'2026-09-24',value:6.57}],[{date:'2026-09-24',value:5.18}]),[{date:'2026-09-24',value:1.39}]);
});
test('comparison distinguishes failure, stale observations, disagreement and matching data',()=>{
 const now=Date.parse('2026-09-28');const p=Array.from({length:6},(_,i)=>({date:`2026-09-${20+i}`,value:15+i}));
 assert.equal(compareSeries(p,p,0.011,now).status,'matched');
 assert.equal(compareSeries(p,p.map(x=>({...x,value:x.value+1})),0.011,now).status,'divergent');
 assert.equal(compareSeries(p,[],0.011,now).status,'unavailable');
 assert.equal(compareSeries(p,[{date:'2020-01-01',value:1}],0.011,now).status,'stale');
});
test('transport rejects HTML 200, malformed JSON and oversized bodies',async()=>{
 assert.throws(()=>validateTransportBody(new TextEncoder().encode('<html>Site unavailable</html>'),'application/json'));
 assert.throws(()=>validateTransportBody(new TextEncoder().encode('{bad}'),'application/json'));
 assert.doesNotThrow(()=>validateTransportBody(new TextEncoder().encode('{"ok":true}'),'application/json'));
 await assert.rejects(boundedBody(new Response('12345'),4),/limit/);
 assert.equal(retryAfterMilliseconds('120'),120000);
 assert.equal(retryAfterMilliseconds('Mon, 28 Sep 2026 10:01:00 GMT',Date.parse('2026-09-28T10:00Z')),60000);
});
test('promotion evidence counts distinct days, not repeated requests, and never switches automatically',()=>{
 const run={checkedAt:'2026-09-28T10:00:00Z',checks:[{key:'vix',status:'matched'}]};
 const summary=summarizeValidation(Array(100).fill(run))[0];
 assert.equal(summary.distinctDays,1);assert.equal(summary.reviewStatus,'collecting-evidence');assert.equal(summary.automaticPromotion,false);
});
