import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// GHSA-w74x-v6f9-j3xg, GHSA-xhq7-xmqj-769h,
// GHSA-wjr9-j795-jxcr, GHSA-333x-w4r6-6crp.
// Patches are available at 2.4.8, 3.1.9 and 4.2.3.
// Dependency removal is also safe; a later future major is allowed.
const patchedFloor = new Map([[2, [2, 4, 8]], [3, [3, 1, 9]], [4, [4, 2, 3]]]);

export function hasPatchedFastUri(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version || '');
  if (!match) return false; // unknown/pre-release is not verified
  const actual = match.slice(1).map(Number);
  const required = patchedFloor.get(actual[0]);
  if (required === undefined) return actual[0] > 4;
  for (let i = 0; i < 3; i++) {
    if (actual[i] !== required[i]) return actual[i] > required[i];
  }
  return true;
}

test('every installed fast-uri in maintained Sites has the upstream patch', () => {
  const lock = JSON.parse(readFileSync(new URL('../sites-current/package-lock.json', import.meta.url), 'utf8'));
  assert.equal(lock.lockfileVersion, 3);
  for (const [name, pkg] of Object.entries(lock.packages)) {
    if (name.endsWith('/node_modules/fast-uri') || name === 'node_modules/fast-uri') {
      assert.equal(hasPatchedFastUri(pkg.version), true, `${name}: unpatched fast-uri ${pkg.version}`);
    }
  }
});

test('fast-uri patch-floor comparison rejects vulnerable and unknown versions', () => {
  for (const version of ['1.9.0', '2.4.7', '3.1.8', '4.2.2', '3.1.9-rc.1', 'unknown']) {
    assert.equal(hasPatchedFastUri(version), false, version);
  }
  for (const version of ['2.4.8', '3.1.9', '4.2.3', '3.2.0', '4.3.0', '5.0.0']) {
    assert.equal(hasPatchedFastUri(version), true, version);
  }
});
