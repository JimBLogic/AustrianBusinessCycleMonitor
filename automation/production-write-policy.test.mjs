import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the expressions actually used by Actions, including unrecognized
// future events and dispatches on feature branches. Never contact production.
const browser = readFileSync(new URL('../.github/workflows/browser-smokes.yml', import.meta.url), 'utf8');
const daily = readFileSync(new URL('../.github/workflows/production-data.yml', import.meta.url), 'utf8');
const readOnly = browser.match(/ABCM_READ_ONLY: \$\{\{ (.+) \}\}/)?.[1];
const refresh = daily.match(/name: Refresh Madrid[^\n]*\n\s*if: (.+)/)?.[1];
const evaluate = (expression, event, ref) => {
  assert.ok(expression, 'production policy must be present');
  return runInNewContext(expression, { github: { event_name: event, ref } }, { timeout: 100 });
};

for (const event of ['pull_request', 'push', 'schedule', 'workflow_dispatch', 'workflow_run', 'unknown']) {
  for (const ref of ['refs/heads/master', 'refs/heads/feature', 'refs/pull/1/merge']) {
    test(`${event} on ${ref}: only existing master schedule/dispatch may write`, () => {
      const allowed = ref === 'refs/heads/master' && ['schedule', 'workflow_dispatch'].includes(event);
      assert.equal(evaluate(readOnly, event, ref), allowed ? '0' : '1');
      assert.equal(evaluate(refresh, event, ref), allowed);
    });
  }
}

test('candidate refresh and public failure injection remain independently exercised', () => {
  const spec = readFileSync(new URL('../qa/tests/dashboard.spec.ts', import.meta.url), 'utf8');
  assert.match(browser, /ABCM_BASE_URL: http:\/\/127\.0\.0\.1:8793/);
  assert.match(spec, /test\.skip\(process\.env\.ABCM_READ_ONLY==='1'/);
  assert.match(spec, /route\.fulfill\(\{status:503/);
  assert.match(browser, /node --test automation\/production-write-policy\.test\.mjs/);
  assert.match(daily, /node --test automation\/production-write-policy\.test\.mjs/);
});
