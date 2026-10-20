import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { verifyProjectIsolation } from './project-isolation.mjs';

async function fixture(t, files = {}, manifest = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'abcm-isolation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = { 'sites-current/.openai/hosting.json': JSON.stringify({
    project_id: 'appgprj_6a630a89bf208191bc7915a9410ae47a', d1: 'DB', r2: null, ...manifest,
  }), ...files };
  for (const [name, value] of Object.entries(data)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), value);
  }
  return root;
}

test('independent provider calls and educational peer mentions are allowed', async t => {
  const root = await fixture(t, {
    'sites-current/app/provider.ts': "fetch('https://fred.stlouisfed.org/graph/fredgraph.csv');",
    'sites-current/app/copy.ts': "export const note='Research ideas also explored in BrangeCycle';",
  });
  assert.ok((await verifyProjectIsolation(root)).filesChecked >= 3);
});
test('wrong Site identity and changed storage are rejected', async t => {
  await assert.rejects(verifyProjectIsolation(await fixture(t, {}, {project_id:'other',d1:'PEER'})), /Site identity changed[\s\S]*storage contract changed/);
});
for (const [name, source] of [
  ['peer endpoint', "fetch('https://brangecycle.jimblogic.chatgpt.site/api/jobs/check',{method:'POST'});"],
  ['peer read dependency', "fetch('https://brangecycle.jimblogic.chatgpt.site/api/data');"],
  ['peer Site ID', "const id='appgprj_6ace4c9cb44881918b979e11d440c586';"],
  ['peer dependency', '{"dependencies":{"engine":"github:JimBLogic/brangecycle#main"}}'],
  ['peer checkout', 'repository: JimBLogic/brangecycle'],
  ['remote binding', '{"remote":true}'],
  ['remote D1 command', 'npx wrangler d1 execute DB --remote --command "DELETE FROM editions"'],
]) test(`rejects ${name}`, async t => {
  const root = await fixture(t, {'sites-current/scripts/unsafe.mjs':source});
  await assert.rejects(verifyProjectIsolation(root), /Project isolation failed/);
});
test('symlink to another project is rejected', async t => {
  const root = await fixture(t);
  await symlink(os.tmpdir(), path.join(root, 'sites-current/app'), 'dir');
  await assert.rejects(verifyProjectIsolation(root), /symlink/);
});
test('symlink replacing the whole Sites tree is rejected', async t => {
  const root = await fixture(t);
  await rm(path.join(root, 'sites-current'), {recursive:true});
  await symlink(os.tmpdir(), path.join(root, 'sites-current'), 'dir');
  await assert.rejects(verifyProjectIsolation(root), /local directory/);
});
test('vendored executable code must also be independent', async t => {
  const root = await fixture(t, {'sites-current/vendor/imported.ts':"fetch('https://brangecycle.jimblogic.chatgpt.site/api/data');"});
  await assert.rejects(verifyProjectIsolation(root), /peer project reference/);
});
test('peer documentation does not create runtime coupling', async t => {
  const root = await fixture(t, {'sites-current/app/docs/readme.md':'https://brangecycle.jimblogic.chatgpt.site'});
  await verifyProjectIsolation(root);
});
