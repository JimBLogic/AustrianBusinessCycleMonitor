import assert from 'node:assert/strict';
import test from 'node:test';
import questionBank from '../app/learn/question-bank.json' with {type:'json'};
import {createSession,scoreSession} from '../app/learn/quiz-engine.mjs';
import {validTimestamp} from '../lib/timestamp.mjs';
test('48 bilingual questions have stable unique IDs, four choices and explicit sources',()=>{
 assert.equal(questionBank.length,48);assert.equal(new Set(questionBank.map(q=>q.id)).size,48);
 for(const track of ['austrian','bitcoin'])for(let i=0;i<6;i++)assert.equal(questionBank.filter(q=>q.track===track&&q.module===i).length,4);
 for(const q of questionBank){assert.equal(q.options.length,4);assert.equal(q.options.filter(o=>o.id===q.answerId).length,1);for(const li of [0,1]){assert.ok(q.prompt[li].length>15&&q.explanation[li].length>30);assert.equal(new Set(q.options.map(o=>o.text[li])).size,4);}assert.ok(q.sources.length);for(const s of q.sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.name&&s.section);}}
});
test('randomization varies question and choice order without mutating content or grading',()=>{
 const original=JSON.stringify(questionBank),orders=new Set(),positions=new Set();
 for(let seed=1;seed<=30;seed++){let state=seed;const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};const round=createSession(questionBank,rng);orders.add(round.map(q=>q.id).join(','));for(const q of round)positions.add(q.options.findIndex(o=>o.id===q.answerId));assert.deepEqual(scoreSession(round,Object.fromEntries(round.map(q=>[q.id,q.answerId]))),{answered:48,correct:48,total:48,percent:100});}
 assert.equal(orders.size,30);assert.equal(positions.size,4);assert.equal(JSON.stringify(questionBank),original);
});
test('invalid answers cannot inflate scores and retry rounds start empty',()=>{
 const round=createSession(questionBank.slice(0,4),()=>.5);const answers={[round[0].id]:round[0].answerId,[round[1].id]:round[1].options.find(o=>o.id!==round[1].answerId).id,[round[2].id]:'invalid',unrelated:'anything'};
 assert.deepEqual(scoreSession(round,answers),{answered:2,correct:1,total:4,percent:25});const retry=createSession(round.filter(q=>answers[q.id]!==q.answerId));assert.equal(retry.length,3);assert.equal(scoreSession(retry,{}).answered,0);
});
test('loaded snapshots have valid timestamps without epoch fallback',()=>{
 assert.equal(validTimestamp('2026-09-06T12:00:00Z')?.toISOString(),'2026-09-06T12:00:00.000Z');for(const v of [null,undefined,'','bad date',0,'1970-01-01','2026-99-99'])assert.equal(validTimestamp(v),null);
});


test('a manual request before Madrid noon cannot block the scheduled edition', async()=>{
 const {manualRefreshBlocked}=await import('../lib/refresh-policy.mjs');
 const noon=Date.parse('2026-09-06T10:00:00Z');
 const nextAllowedAt=noon+20*60_000; // Manual request at 11:50 Madrid.
 assert.equal(manualRefreshBlocked(true,nextAllowedAt,noon),true);
 assert.equal(manualRefreshBlocked(false,nextAllowedAt,noon),false);
 assert.equal(manualRefreshBlocked(true,nextAllowedAt,nextAllowedAt),false);
 assert.equal(manualRefreshBlocked(true,null,noon),false);
});
