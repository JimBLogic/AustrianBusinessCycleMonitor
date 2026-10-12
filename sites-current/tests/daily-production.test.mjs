import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyDecision } from '../scripts/production-daily.mjs';

test('a delayed October cron catches up instead of silently skipping after noon', () => {
  assert.equal(dailyDecision({requestedAt:'2026-10-10T13:40:58Z'}, new Date('2026-10-11T16:09:19Z')), 'refresh');
});
test('an existing post-noon edition is verified without a duplicate refresh', () => {
  assert.equal(dailyDecision({requestedAt:'2026-10-11T10:01:00Z'}, new Date('2026-10-11T16:09:19Z')), 'verify');
});
test('pre-noon observations and missing, corrupt or future timestamps require recovery', () => {
  const now = new Date('2026-10-11T16:09:19Z');
  for (const snapshot of [null, {}, {requestedAt:'broken'}, {requestedAt:null}, {requestedAt:'2026-10-11T09:59:59Z'}, {requestedAt:'2026-10-12T10:00:00Z'}]) {
    assert.equal(dailyDecision(snapshot, now), 'refresh');
  }
});
test('winter and summer UTC slots preserve the Madrid noon boundary', () => {
  assert.equal(dailyDecision(null, new Date('2026-10-11T09:59:59Z')), 'before-noon');
  assert.equal(dailyDecision(null, new Date('2026-10-11T10:00:00Z')), 'refresh');
  assert.equal(dailyDecision(null, new Date('2026-12-11T10:00:00Z')), 'before-noon');
  assert.equal(dailyDecision(null, new Date('2026-12-11T11:00:00Z')), 'refresh');
});
test('a previous Madrid date is not mistaken for the current edition', () => {
  assert.equal(dailyDecision({requestedAt:'2026-10-10T21:59:59Z'}, new Date('2026-10-11T10:00:00Z')), 'refresh');
});

test('a rolled-over invalid calendar cannot masquerade as a current daily edition',()=>{
 assert.equal(dailyDecision({requestedAt:'2026-02-30T11:00:00Z'},new Date('2026-03-02T13:00:00Z')),'refresh');
});
