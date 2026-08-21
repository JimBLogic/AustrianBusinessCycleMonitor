import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, route, manifest, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/data-manifest/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/engine.css", import.meta.url), "utf8"),
]);

const calculation = route.slice(
  route.indexOf("const MIN_CORRELATION_OBSERVATIONS"),
  route.indexOf("function clamp"),
);
const panel = monitor.slice(
  monitor.indexOf('<section className="correlation-block"'),
  monitor.indexOf('<section className="ratio-panel"'),
);

test("pairs equal, consecutive calendar months before calculating returns", () => {
  for (const expected of [
    "monthlyLevels(a)",
    "monthlyLevels(b)",
    ".filter((month) => bLevels.has(month))",
    "isConsecutiveMonth(startMonth, endMonth)",
    "(aLevels.get(endMonth)! / previousA) - 1",
    "(bLevels.get(endMonth)! / previousB) - 1",
  ]) assert.ok(calculation.includes(expected), `missing shared-month boundary: ${expected}`);
  assert.equal(calculation.includes("monthlyReturns(a)"), false);
});

test("withholds small samples and caps the moving window", () => {
  assert.ok(calculation.includes("MIN_CORRELATION_OBSERVATIONS = 24"));
  assert.ok(calculation.includes("MAX_CORRELATION_OBSERVATIONS = 60"));
  assert.ok(calculation.includes("pairs.length < MIN_CORRELATION_OBSERVATIONS"));
  assert.ok(manifest.includes("minimum 24 and maximum 60 paired observations"));
});

test("returns auditable sample size and period for every pair", () => {
  for (const expected of [
    "correlationEvidence",
    "observations: reading.observations",
    "startMonth: reading.startMonth",
    "endMonth: reading.endMonth",
    "storedCorrelationModel = buildCorrelations(storedSeries)",
  ]) assert.ok(route.includes(expected), `missing correlation evidence: ${expected}`);
  for (const expected of ["evidence.observations", "evidence.startMonth", "evidence.endMonth", "formatComparatorMonth"]) {
    assert.ok(panel.includes(expected), `missing visible evidence: ${expected}`);
  }
});

test("uses a centered signed meter instead of a left-aligned absolute bar", () => {
  for (const expected of [
    "const meterWidth = magnitude * 50",
    "numericValue < 0 ? 50 - meterWidth : 50",
    'className="correlation-meter"',
    'left: `${meterLeft}%`',
  ]) assert.ok(panel.includes(expected), `missing signed-meter behavior: ${expected}`);
  assert.match(styles, /\.correlation-meter>span\{[^}]*left:50%/);
  assert.match(styles, /\.correlation-meter i\.negative\{background:#ff6417\}/);
});

test("makes all six cards honest, accessible dialog triggers", () => {
  assert.equal((panel.match(/\["[a-z0-9_]+",/g) ?? []).length, 6);
  for (const expected of [
    '<ul className="correlation-grid"',
    '<li key={key}><button type="button"',
    'aria-haspopup="dialog"',
    'aria-controls="detail-dialog"',
    "detailReturnFocusRef.current = event.currentTarget",
    "VER DETALLE",
  ]) assert.ok(panel.includes(expected), `missing accessible interaction: ${expected}`);
  assert.equal(panel.includes("ABRIR"), false);
});

test("keeps the card grid balanced at desktop, tablet and phone widths", () => {
  assert.match(styles, /\.correlation-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:700px\).*\.correlation-grid\{grid-template-columns:repeat\(2,1fr\)/);
  assert.match(styles, /max-width:460px\).*\.correlation-grid[^}]*\{grid-template-columns:1fr/);
  assert.match(styles, /\.correlation-cell\{width:100%;min-height:176px/);
});
