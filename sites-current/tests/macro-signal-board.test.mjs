import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const monitor = readFileSync(new URL("../app/monitor.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const board = monitor.slice(
  monitor.indexOf('<section className="signal-section"'),
  monitor.indexOf('<section className="hard-assets"'),
);

test("replaces fixed risk decoration with verified model pressure", () => {
  assert.ok(!monitor.includes("risk: 76"));
  assert.ok(!board.includes("metric.risk"));
  assert.ok(board.includes("data.provenance.signalReady?.[metric.signal] !== false"));
  assert.ok(board.includes("pressure == null ?"));
  assert.ok(board.includes("RETENIDA"));
  assert.match(styles, /\.risk-bar\.withheld\{background:repeating-linear-gradient/);
});

test("keeps missing observations visibly unavailable rather than neutral", () => {
  assert.ok(board.includes('data.provenance.mode !== "fallback"'));
  assert.ok(board.includes("sin observación verificable"));
  assert.ok(board.includes("no se asigna un cero ni una lectura neutral"));
  assert.ok(board.includes("marketState(data, metric.key)"));
  assert.ok(board.includes("marketStateLabel(state, lang)"));
});

test("shows localized value units, observation dates and source state", () => {
  for (const expected of [
    'unit: ["percent", "porcentaje"]',
    'unit: ["USD trillion", "billones USD"]',
    'unit: ["USD per barrel", "USD por barril"]',
    "marketFormat(value, lang, metric.digits)",
    "formatChartDate(observedDate(data, metric.key), lang)",
    "seriesSource(data, metric.key)",
  ]) assert.ok(monitor.includes(expected), `missing signal-board evidence: ${expected}`);
});

test("links the inspector to the provider that actually supplied the observation", () => {
  assert.ok(board.includes('selectedMetric.key === "federalDebt" ? debtSourceUrl(data) : seriesSourceUrl(data, selectedMetric.key)'));
  assert.ok(board.includes('rel="noopener noreferrer"'));
  assert.ok(board.includes("Abrir evidencia en una pestaña nueva"));
  assert.ok(!board.includes("https://fred.stlouisfed.org/series/${selectedMetric.source}"));
});

test("implements complete keyboard selection and an accessible reading panel", () => {
  for (const expected of [
    'role="tablist"',
    'role="tab"',
    "aria-selected={selectedMetric.key === metric.key}",
    'aria-controls="signal-inspector"',
    "tabIndex={selectedMetric.key === metric.key ? 0 : -1}",
    "handleMetricTabKey(event, index)",
    'event.key === "ArrowRight"',
    'event.key === "ArrowLeft"',
    'event.key === "Home"',
    'event.key === "End"',
    'role="tabpanel"',
    'aria-labelledby={`metric-tab-${selectedMetric.key}`}',
  ]) assert.ok(monitor.includes(expected), `missing signal-board keyboard behavior: ${expected}`);
});

test("exposes the two lenses as pressed controls with visible focus", () => {
  assert.ok(board.includes('aria-label={lang === "es" ? "Tipo de lectura del indicador"'));
  assert.ok(board.includes('aria-pressed={lens === "facts"}'));
  assert.ok(board.includes('aria-pressed={lens === "thesis"}'));
  assert.match(styles, /\.lens-toggle button:focus-visible\{outline:3px solid var\(--orange\)/);
});

test("keeps nine cards balanced at desktop, tablet and phone widths", () => {
  assert.match(styles, /\.metric-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:760px\) and \(min-width:501px\)\{\.metric-card:last-child:nth-child\(odd\)\{grid-column:1\/-1/);
  assert.match(styles, /max-width:500px\)\{\.metric-card:last-child:nth-child\(odd\)\{grid-column:auto/);
  assert.match(styles, /\.metric-card\{[^}]*min-width:0/);
});
