import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { SOURCE_POLICY_VERSION } from '../lib/snapshot-policy.mjs';

const url = new URL('../db/runtime.ts', import.meta.url);
const source = (await readFile(url, 'utf8')).replace(/from "(\.\.\/lib\/[^"\n]+)"/g,
  (_, path) => `from ${JSON.stringify(new URL(path, url).href)}`);
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { recordMacroSnapshot } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

function binding(mode) {
  const calls = [];
  let saved;
  return { calls, prepare(sql) {
    calls.push(sql);
    let args;
    return { bind(...values) { args = values; return this; }, all: async () => ({ results: [] }),
      run: async () => {
        saved = { requestedAt: args[1], scoresJson: args[4], metricsJson: args[5], provenanceJson: args[6] };
        return { success: mode !== 'rejected', meta: { changes: mode === 'concurrent' ? 0 : 1 } };
      },
      first: async () => mode === 'lost' ? null : mode === 'altered' ? { ...saved, metricsJson: '{}' } : saved,
    };
  } };
}

function edition() {
  return { requestedAt: new Date().toISOString(), refreshMode: 'manual-refresh', regime: 'mixed-transition',
    scores: {}, metrics: { series: { m2: [{ date: new Date().toISOString().slice(0,10), value: 23000 }] } },
    provenance: { sourcePolicyVersion: SOURCE_POLICY_VERSION } };
}

test('a successful D1 acknowledgement requires identical read-back bytes', async () => {
  try {
    for (const mode of ['valid', 'lost', 'altered']) {
      const db = binding(mode);
      globalThis.__ABCM_RUNTIME_ENV__ = { DB: db };
      if (mode === 'valid') assert.equal(await recordMacroSnapshot(edition(), false), true);
      else await assert.rejects(recordMacroSnapshot(edition(), false), /persistence_unconfirmed/);
      assert.equal(db.calls.filter(sql => sql.includes('WHERE id = ?')).length, 1);
    }
  } finally { delete globalThis.__ABCM_RUNTIME_ENV__; }
});

test('invalid editions never INSERT and a concurrent writer is not acknowledged as our write', async () => {
  try {
    for (const invalid of [{ ...edition(), requestedAt: '2999-01-01T00:00:00Z' }, { ...edition(), metrics: {} }]) {
      const db = binding('valid');
      globalThis.__ABCM_RUNTIME_ENV__ = { DB: db };
      await assert.rejects(recordMacroSnapshot(invalid, false), /snapshot_validation/);
      assert.ok(db.calls.every(sql => !sql.startsWith('INSERT')));
    }
    const db = binding('concurrent');
    globalThis.__ABCM_RUNTIME_ENV__ = { DB: db };
    assert.equal(await recordMacroSnapshot(edition(), false), false);
    assert.equal(db.calls.filter(sql => sql.includes('WHERE id = ?')).length, 0);
  } finally { delete globalThis.__ABCM_RUNTIME_ENV__; }
});
