import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRefreshNotice } from '../lib/refresh-notice.mjs';

test('an in-flight notice follows the current language without changing its descriptor', () => {
  const notice = Object.freeze({ kind: 'checking' });
  assert.match(formatRefreshNotice(notice, 'es'), /Consultando fuentes/);
  assert.match(formatRefreshNotice(notice, 'en'), /Checking sources/);
  assert.match(formatRefreshNotice(notice, 'es'), /Consultando fuentes/);
});

test('a completed comparison survives ES/EN changes with its original result', () => {
  const notice = Object.freeze({ kind: 'synchronized', btcMove: 1234, changedMacro: 3 });
  assert.match(formatRefreshNotice(notice, 'es'), /BTC \+\$1\.234 · 3 series macro/);
  assert.match(formatRefreshNotice(notice, 'en'), /BTC \+\$1,234 · 3 macro series/);
  assert.equal(notice.btcMove, 1234);
  assert.equal(notice.changedMacro, 3);
});

test('retained editions, missing prices and failures translate without inventing data', () => {
  assert.match(formatRefreshNotice({ kind: 'retained', sharedWait: 7 }, 'es'), /Espera compartida: 7 min/);
  assert.match(formatRefreshNotice({ kind: 'retained', sharedWait: 7 }, 'en'), /Shared wait: 7 min/);
  assert.doesNotMatch(formatRefreshNotice({ kind: 'retained', sharedWait: null }, 'en'), /Shared wait/);
  assert.match(formatRefreshNotice({ kind: 'synchronized', btcMove: null, changedMacro: 0 }, 'es'), /BTC sin dato/);
  assert.match(formatRefreshNotice({ kind: 'synchronized', btcMove: null, changedMacro: 0 }, 'en'), /BTC unavailable/);
  assert.match(formatRefreshNotice({ kind: 'failed' }, 'es'), /No se pudo/);
  assert.match(formatRefreshNotice({ kind: 'failed' }, 'en'), /Fresh query failed/);
  assert.equal(formatRefreshNotice(null, 'en'), '');
});
