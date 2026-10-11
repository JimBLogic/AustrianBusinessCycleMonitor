import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/engine.css", import.meta.url), "utf8"),
]);

const comparator = monitor.slice(
  monitor.indexOf("function comparatorMonth"),
  monitor.indexOf("function regimeText"),
);
const controls = monitor.slice(
  monitor.indexOf('<article className="mix-panel"'),
  monitor.indexOf('<aside className="transmission">'),
);

test("aligns mixed-frequency series on shared calendar months before normalization", () => {
  for (const expected of [
    "comparatorMonth(point.date)",
    "available.every((series) => series.observations.has(month))",
    ".sort()",
    ".slice(-60)",
    "series.observations.get(commonMonths[0])!.value",
  ]) assert.ok(comparator.includes(expected), `missing calendar alignment: ${expected}`);
  assert.equal(comparator.includes("(data.series[key] ?? []).slice(-60)"), false);
});

test("withholds the chart when a verifiable common period is unavailable", () => {
  for (const expected of [
    'className="normalized-empty" role="status"',
    "Comparación no disponible",
    "No se dibuja una tendencia aparente con fechas incompatibles.",
    "There are not at least two common months",
  ]) assert.ok(comparator.includes(expected), `missing empty-state boundary: ${expected}`);
});

test("clamps and clips every plotted line inside the chart rectangle", () => {
  for (const expected of [
    "Math.max(15, Math.min(87",
    '<clipPath id="normalized-plot-clip" clipPathUnits="userSpaceOnUse">',
    '<rect x="5" y="15" width="90" height="72" />',
    '<g clipPath="url(#normalized-plot-clip)">',
  ]) assert.ok(comparator.includes(expected), `missing plot boundary: ${expected}`);
  assert.match(styles, /\.normal-plot\{height:294px;min-width:0;[^}]*overflow:hidden;contain:paint/);
  assert.match(styles, /\.normal-plot svg\{display:block;[^}]*min-height:0;[^}]*max-height:100%;overflow:hidden/);
  assert.equal(styles.includes(".normal-plot svg{height:100%;width:100%;overflow:visible}"), false);
});

test("documents the scale, period and non-return interpretation", () => {
  for (const expected of [
    "PRIMER MES = 100",
    "Última observación disponible de cada mes",
    "máximo 60 meses comunes",
    "índice comparativo, no rentabilidad",
  ]) assert.ok(comparator.includes(expected), `missing scale disclosure: ${expected}`);
});

test("exposes an accessible multi-select control and chart description", () => {
  for (const expected of [
    'role="group"',
    'aria-describedby="mix-controls-help"',
    'type="button"',
    "aria-pressed={active}",
    "disabled={isLast}",
    'aria-labelledby="normalized-chart-title normalized-chart-description"',
    '<title id="normalized-chart-title">',
    '<desc id="normalized-chart-description">',
  ]) assert.ok((controls + comparator).includes(expected), `missing accessibility behavior: ${expected}`);
});

test("keeps controls balanced and touch-sized across breakpoints", () => {
  assert.match(styles, /\.mix-controls\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.mix-controls button\{min-height:44px/);
  assert.match(styles, /max-width:700px\).*\.mix-controls\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:460px\).*\.mix-controls\{grid-template-columns:1fr/);
});
