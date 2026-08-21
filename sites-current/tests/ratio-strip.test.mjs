import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, route, manifest, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/data-manifest/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/engine.css", import.meta.url), "utf8"),
]);

const calculations = route.slice(
  route.indexOf("function monthlyAverages"),
  route.indexOf("function clamp"),
);
const panel = monitor.slice(
  monitor.indexOf('<section className="ratio-panel"'),
  monitor.indexOf('<div className="backend-grid"'),
);

test("uses monthly averages from the latest shared calendar month", () => {
  for (const expected of [
    "function monthlyAverages",
    "bucket.sum / bucket.count",
    "function pairedMonthlyRatio",
    ".filter((month) => denominatorLevels.has(month))",
    ".sort()",
    ".at(-1)",
  ]) assert.ok(calculations.includes(expected), `missing aligned ratio boundary: ${expected}`);
  assert.equal(calculations.includes("latest(numeratorPoints)"), false);
  assert.ok(manifest.includes("latest shared calendar month"));
});

test("withholds stale debt instead of dividing observations from different years", () => {
  for (const expected of [
    "debtToM2: pairedMonthlyRatio(debtSeries, series.m2 ?? [], 160)",
    'status === "available" && denominator.value !== 0',
    'monthAgeDays(observationMonth) <= maximumAgeDays ? "available" : "stale"',
  ]) assert.ok(route.includes(expected), `missing debt freshness guard: ${expected}`);
  assert.ok(monitor.includes("La fuente fiscal está demasiado desactualizada"));
  assert.ok(monitor.includes('value: debtM2Evidence.status === "available"'));
});

test("aligns the nominal rate and CPI inflation to the same month", () => {
  for (const expected of [
    "function alignedRealRate",
    "cpiLevels.has(month) && cpiLevels.has(previousYearMonth)",
    "nominalRate.value - inflationRate",
    "realRate = alignedRealRate(series.fedFunds, series.cpi).value",
  ]) assert.ok(route.includes(expected), `missing real-rate alignment: ${expected}`);
  assert.ok(manifest.includes("for the same calendar month"));
});

test("returns auditable evidence and recomputes it for durable snapshots", () => {
  for (const expected of [
    "ratioEvidence",
    "observationMonth: reading.observationMonth",
    "numeratorObservations: reading.numeratorObservations",
    "storedRatioModel = buildRatioModel(storedSeries, storedDebtSeries)",
    "ratios: storedRatioModel.ratios",
  ]) assert.ok(route.includes(expected), `missing ratio evidence: ${expected}`);
});

test("separates ratios from the provisional composite pressure score", () => {
  assert.ok(monitor.includes('label: lang === "es" ? "PRESIÓN COMPUESTA"'));
  assert.equal(panel.includes("RIESGO COMPUESTO"), false);
  for (const expected of [
    "readySignalCount}/10",
    "availableWeightPercent",
    "no probabilidad de caída, riesgo de cartera ni señal operativa",
  ]) assert.ok(monitor.includes(expected), `missing composite boundary: ${expected}`);
});

test("makes every card an accessible dialog trigger with focus restoration", () => {
  for (const expected of [
    '<section className="ratio-panel"',
    '<ul className="ratio-strip">',
    '<li key={card.key}><button type="button"',
    'aria-haspopup="dialog"',
    'aria-controls="detail-dialog"',
    "detailReturnFocusRef.current = event.currentTarget",
    "VER DETALLE",
  ]) assert.ok(panel.includes(expected), `missing ratio interaction: ${expected}`);
});

test("balances five cards across desktop, tablet and phone widths", () => {
  assert.match(styles, /\.ratio-strip\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:1000px\).*\.ratio-strip\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.ratio-strip>li:nth-child\(-n\+3\)\{grid-column:span 2\}/);
  assert.match(styles, /\.ratio-strip>li:nth-child\(n\+4\)\{grid-column:span 3\}/);
  assert.match(styles, /max-width:700px\).*\.ratio-strip>li:last-child\{grid-column:1\/-1\}/);
  assert.match(styles, /max-width:460px\).*\.ratio-strip>li:nth-child\(n\),\.ratio-strip>li:last-child\{grid-column:auto\}/);
});
