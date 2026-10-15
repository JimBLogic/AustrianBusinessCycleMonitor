import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateAdvisoryReport} from './verify-current-audit.mjs';

const original={
 schemaVersion:1,scans:[
  {id:'maintained-sites',role:'current',all:{counts:{total:0}},production:{counts:{total:0}}},
  {id:'playwright-qa',role:'current-ci',all:{counts:{total:0}},production:{counts:{total:0}}},
  {id:'legacy-frontend',role:'historical',all:{counts:{total:41,high:30,critical:3}},production:{counts:{total:21,high:18}}},
  {id:'historical-sites-v25',role:'archive',all:{counts:{total:32,critical:1}},production:{counts:{total:6,critical:1}}},
  {id:'archived-copilot-monorepo',role:'archive',all:{counts:{total:42,critical:4}},production:{counts:{total:0}}}
 ]
};
const modified=fn=>{const copy=structuredClone(original);fn(copy);return copy;};
const read=path=>readFileSync(path,'utf8');

test('current Site and Playwright zero advisories can pass while archived danger remains visible',()=>{
 const check=evaluateAdvisoryReport(original);
 assert.equal(check.ok,true);
 assert.equal(check.legacy.length,3);
 assert.equal(check.legacy.find(x=>x.id==='historical-sites-v25').production.critical,1);
});

test('a new Site runtime vulnerability MUST fail, even when the historical code is unchanged',()=>{
 const check=evaluateAdvisoryReport(modified(r=>{r.scans[0].production.counts.total=1;}));
 assert.equal(check.ok,false);
 assert.ok(check.problems.includes('CURRENT_ADVISORIES:maintained-sites:production:1'));
});

test('a new developer or QA vulnerability MUST fail, not just production high advisories',()=>{
 const check=evaluateAdvisoryReport(modified(r=>{r.scans[1].all.counts.total=1;}));
 assert.equal(check.ok,false);
 assert.ok(check.problems.includes('CURRENT_ADVISORIES:playwright-qa:all:1'));
});

test('the audit cannot pass with missing registry results or incomplete data',()=>{
 for(const report of [
  {},null,modified(r=>{r.scans[0].all.error='REGISTRY_TIMEOUT';}),
  modified(r=>{r.scans[1].production.toolingError='ENOTFOUND';}),
  modified(r=>{r.scans=r.scans.filter(s=>s.id!=='maintained-sites');}),
  modified(r=>{r.scans[3].production.counts=null;})
 ])assert.equal(evaluateAdvisoryReport(report).ok,false);
});

test('manual FRED smoke never receives a plaintext workflow input or appends secrets to GITHUB_ENV',()=>{
 const s=read('.github/workflows/run-live-smoke.yml');
 assert.match(s,/secrets\.FRED_API_KEY/);
 assert.match(s,/workflow_dispatch:\s*\n/);
 assert.doesNotMatch(s,/fred_api_key:\s*\n\s*description:/i);
 assert.doesNotMatch(s,/inputs\.fred_api_key/);
 assert.doesNotMatch(s,/\$GITHUB_ENV/);
 assert.match(s,/-e FRED_API_KEY\s*\\/);
 assert.doesNotMatch(s,/-e FRED_API_KEY=\$?["'{]/);
 assert.match(s,/persist-credentials: false/);
});

test('deprecated Sites v25 is blocked BEFORE any install, Docker build or preview',()=>{
 const s=read('.github/workflows/sites-v25.yml');
 const guard=s.indexOf('npm audit --package-lock-only --omit=dev --audit-level=high');
 assert.ok(guard>0);
 assert.ok(guard<s.indexOf('run: npm run install:ci'));
 assert.ok(guard<s.indexOf('run: docker build --target validate .'));
 assert.match(s,/permissions:\s*\n\s*contents: read/);
});

test('maintained Sites uses the reviewed local braces protection and retains tested hashes',()=>{
 const manifest=JSON.parse(read('sites-current/package.json'));
 const patch=JSON.parse(read('sites-current/vendor/braces-bounded/provenance.json'));
 assert.equal(manifest.devDependencies.braces,'file:vendor/braces-bounded');
 assert.equal(manifest.overrides.braces,'$braces');
 assert.equal(patch.advisory,'GHSA-vfj7-8cjw-p6xm');
 assert.ok(Object.keys(patch.patched_sha256).length>=6);
 assert.match(read('sites-current/tests/braces-security.test.mjs'),/published stack-exhaustion payload/);
});
