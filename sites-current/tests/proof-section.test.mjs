import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("uses the canonical schema version instead of a stale label", () => {
  assert.equal(monitor.includes("<strong>v1.1</strong>"), false);
  assert.match(monitor, /<strong>v\{DATA_SCHEMA_VERSION\}<\/strong>/);
  assert.match(monitor, /JSON<\/strong><small>v\{DATA_SCHEMA_VERSION\}/);
});

test("explains source coverage and endpoint state", () => {
  for (const expected of ["SERIES MACRO", "sourceHealthState", "portableOutputState", "upstreamTotal", "upstreamRecovering", "SIN COBERTURA"]) {
    assert.ok(monitor.includes(expected), `missing proof-state detail: ${expected}`);
  }
});

test("opens verified evidence safely with explicit accessible names", () => {
  assert.equal((monitor.match(/rel="noopener noreferrer"/g) ?? []).length >= 4, true);
  assert.equal((monitor.match(/pestaña nueva/g) ?? []).length >= 4, true);
  assert.match(monitor, /SOURCE_MIRROR\.repository/);
  assert.match(monitor, /tree\/master\/\$\{SOURCE_MIRROR\.path\}/);
});

test("keeps proof cards balanced and visibly stateful", () => {
  for (const expected of ["proof-card-head", "proof-card-state.ok", "proof-card-state.partial", "proof-card-state.offline", "proof-help"]) {
    assert.ok(styles.includes(expected), `missing proof-card style: ${expected}`);
  }
});
