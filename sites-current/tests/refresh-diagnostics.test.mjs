import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshFailure, unavailableRefreshCode } from '../lib/refresh-diagnostics.mjs';

test('refresh diagnostics distinguish provider failures without copying sensitive error details',async()=>{
  for (const [kind,code] of [['rate_limit','provider_rate_limit'],['timeout','provider_timeout'],['network','provider_network'],['invalid_response','provider_validation'],['http','provider_unavailable']]) {
    const errorCode=unavailableRefreshCode([{failures:1,failureKind:kind,reason:'SECRET_SENTINEL'}]);
    assert.equal(errorCode,code);
    const response=refreshFailure(errorCode,'isolated-test-id');
    assert.equal(response.status,503);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(response.headers.get('X-ABCM-Refresh-Result'),code);
    const text=await response.text();
    assert.doesNotMatch(text,/SECRET_SENTINEL/);
    assert.equal(JSON.parse(text).errorCode,code);
  }
  assert.equal((await refreshFailure('https://provider.invalid/?api_key=SECRET').json()).errorCode,'internal_error');
});
