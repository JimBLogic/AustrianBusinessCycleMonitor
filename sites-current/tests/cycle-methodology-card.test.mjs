import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/engine.css", import.meta.url), "utf8"),
]);

const methodology = monitor.slice(
  monitor.indexOf('<article className="cycle-methodology"'),
  monitor.indexOf('<article className="discrimination-test"'),
);

test("uses the current data contract instead of a stale methodology badge", () => {
  assert.match(methodology, /ESQUEMA \$\{DATA_SCHEMA_VERSION\}/);
  assert.match(methodology, /SCHEMA \$\{DATA_SCHEMA_VERSION\}/);
  assert.equal(methodology.includes("V1.2"), false);
});

test("states the 70 percent publication rule with signal, weight and input coverage", () => {
  for (const expected of [
    "availableWeightPercent",
    "readySignalCount}/10",
    "modelInputsAvailable}/{modelInputsTotal",
    "< 70%",
    "Las señales disponibles siguen siendo auditables",
    "Available signals remain auditable",
  ]) assert.ok(methodology.includes(expected), `missing publication-rule detail: ${expected}`);
});

test("keeps verified components visible while withholding only the composite", () => {
  assert.match(methodology, /<strong>\{item\.ready \? item\.score : "—"\}<\/strong>/);
  assert.match(methodology, /VERIFICADA · ÍNDICE RETENIDO/);
  assert.match(methodology, /VERIFIED · INDEX WITHHELD/);
  assert.match(methodology, /NO PUBLICADO/);
  assert.match(methodology, /NOT PUBLISHED/);
});

test("never activates a low-distortion band without a published score", () => {
  assert.match(methodology, /const active = modelAvailable && band\.range === cycle\.range/);
  assert.match(methodology, /Ninguna banda se activa hasta que el índice cumple la regla de publicación/);
  assert.match(methodology, /aria-current=\{active \? "true" : undefined\}/);
});

test("labels the article, calculation and external evidence semantically", () => {
  for (const expected of [
    'aria-labelledby="cycle-methodology-title"',
    'aria-describedby="cycle-methodology-summary"',
    'role="list"',
    'role="listitem"',
    'rel="noopener noreferrer"',
    "Maintained history",
    "CDI withheld",
    "Provisional CDI",
  ]) assert.ok(methodology.includes(expected), `missing methodology semantic: ${expected}`);
});

test("preserves direct keyboard-friendly navigation to methodology and sources", () => {
  const navigation = monitor.slice(monitor.indexOf("function openCycleMethodology"), monitor.indexOf("function showEngine"));
  for (const expected of [
    'document.getElementById("cycle-methodology")',
    "prefers-reduced-motion: reduce",
    "scrollIntoView",
    "methodology.focus",
    'href="#sources"',
  ]) assert.ok(navigation.includes(expected) || methodology.includes(expected), `missing methodology navigation: ${expected}`);
});

test("balances ten calculation cards as five, two and one columns", () => {
  assert.match(styles, /\.score-equation\{display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\);gap:1px/);
  assert.match(styles, /max-width:1000px\).*\.score-equation\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:460px\).*\.score-equation\{grid-template-columns:1fr/);
  assert.equal(styles.includes(".score-equation>div:nth-child"), false);
});
