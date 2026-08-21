import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/engine.css", import.meta.url), "utf8"),
]);

const scenarios = monitor.slice(
  monitor.indexOf("const discriminationScenarios"),
  monitor.indexOf("function format"),
);
const matrix = monitor.slice(
  monitor.indexOf('<article className="discrimination-test"'),
  monitor.indexOf('<div className="engine-grid">'),
);

test("describes the four cases as a documented counterfactual matrix", () => {
  for (const expected of [
    "MATRIZ CONTRAFACTUAL · 4 CASOS",
    "COUNTERFACTUAL MATRIX · 4 CASES",
    "MATRIZ DOCUMENTADA",
    "DOCUMENTED MATRIX",
    "sin ejecución automática",
    "no automated execution",
  ]) assert.ok(matrix.includes(expected), `missing matrix scope: ${expected}`);
  assert.equal(matrix.includes("4 CASOS DISTINGUIDOS"), false);
  assert.equal(matrix.includes(">PASS<"), false);
});

test("states that the matrix is neither causal evidence nor a backtest", () => {
  for (const expected of [
    "no evidencia causal ni un backtest estadístico",
    "not causal evidence or a statistical backtest",
    "PPI se usa como contraste aguas arriba",
    "PPI is used as an upstream contrast",
  ]) assert.ok(matrix.includes(expected), `missing epistemic boundary: ${expected}`);
});

test("provides a distinct layer, mechanism, lag, falsifier and exclusion for every case", () => {
  for (const expected of [
    'layer:["Upstream prices","Precios aguas arriba"]',
    'layer:["Household prices","Precios de los hogares"]',
    'layer:["Real economy","Economía real"]',
    'layer:["Money and credit","Dinero y crédito"]',
    "mechanism:", "lag:", "falsifier:", "notThis:",
  ]) assert.ok(scenarios.includes(expected), `missing scenario distinction: ${expected}`);
  assert.equal((scenarios.match(/key:/g) ?? []).length, 4);
});

test("implements the complete keyboard tab pattern", () => {
  for (const expected of [
    "diagnosticTabRefs",
    'event.key === "ArrowRight"',
    'event.key === "ArrowLeft"',
    'event.key === "Home"',
    'event.key === "End"',
    'role="tablist"',
    'role="tab"',
    'aria-controls="diagnostic-panel"',
    "tabIndex={diagnosticScenario === index ? 0 : -1}",
    'role="tabpanel"',
    "aria-labelledby={`diagnostic-tab-${scenario.key}`}",
  ]) assert.ok(monitor.includes(expected), `missing tab accessibility: ${expected}`);
});

test("labels each expected classification without claiming runtime success", () => {
  for (const expected of [
    "CLASIFICACIÓN ESPERADA",
    "EXPECTED CLASSIFICATION",
    "CRITERIO DOCUMENTADO",
    "DOCUMENTED EXPECTATION",
    "REGLA DE EVALUACIÓN",
    "EVALUATION RULE",
  ]) assert.ok(matrix.includes(expected), `missing expected-result language: ${expected}`);
});

test("balances scenario tabs without breakpoint-specific border hacks", () => {
  assert.match(styles, /\.test-tabs\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\);gap:8px/);
  assert.match(styles, /max-width:760px\).*\.test-tabs\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:460px\).*\.test-tabs\{grid-template-columns:1fr/);
  assert.equal(styles.includes(".test-tabs button:nth-child"), false);
});
