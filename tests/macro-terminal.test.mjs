import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const monitor = readFileSync(new URL("../app/monitor.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const chart = monitor.slice(monitor.indexOf("function prepareChartPoints"), monitor.indexOf("const mixMeta"));
const terminal = monitor.slice(
  monitor.indexOf('<section className="dashboard-section"'),
  monitor.indexOf('<section className="signal-section"'),
);

test("sanitizes, deduplicates and orders verified observations", () => {
  assert.ok(chart.includes('const byDate = new Map<string, Point>()'));
  assert.ok(chart.includes('/^\\d{4}-\\d{2}-\\d{2}$/.test(point.date)'));
  assert.ok(chart.includes("Number.isFinite(point.value)"));
  assert.ok(chart.includes("sort((a, b) => a.date.localeCompare(b.date))"));
  assert.ok(chart.includes("const min = values.length ? Math.min(...values) : 0"));
});

test("never substitutes fallback history for an unavailable live series", () => {
  assert.ok(terminal.includes("points={points}"));
  assert.ok(!terminal.includes("fallback.series[seriesKey]"));
  assert.ok(chart.includes("No hay observaciones verificadas para esta serie"));
});

test("uses the selected series actual provider and evidence destination", () => {
  assert.ok(monitor.includes("const chartSourceUrl = seriesKey === \"bitcoin\""));
  assert.ok(monitor.includes("seriesKey === \"federalDebt\" ? debtSourceUrl(data) : seriesSourceUrl(data, seriesKey)"));
  assert.ok(terminal.includes("href={chartSourceUrl}"));
  assert.ok(terminal.includes("Abrir fuente de la serie"));
  assert.ok(terminal.includes("{chartSource} ↗"));
});

test("implements the complete keyboard pattern for series tabs", () => {
  for (const expected of [
    'role="tablist"',
    'role="tab"',
    "aria-selected={seriesKey === key}",
    'aria-controls="macro-chart-panel"',
    "tabIndex={seriesKey === key ? 0 : -1}",
    "handleSeriesTabKey(event, index)",
    'event.key === "ArrowRight"',
    'event.key === "ArrowLeft"',
    'event.key === "Home"',
    'event.key === "End"',
    "seriesTabRefs.current[nextIndex]?.focus()",
    'role="tabpanel"',
  ]) assert.ok(monitor.includes(expected), `missing series-tab behavior: ${expected}`);
});

test("localizes the horizons, values, dates and units", () => {
  assert.ok(terminal.includes('lang === "es" ? "1A" : "1Y"'));
  assert.ok(terminal.includes('lang === "es" ? "MÁX" : "MAX"'));
  assert.ok(terminal.includes("aria-pressed={horizon === value}"));
  assert.ok(chart.includes("marketFormat(selected?.value, lang)"));
  assert.ok(chart.includes("formatChartDate(selected?.date, lang)"));
  assert.ok(monitor.includes('es: "USD por onza troy"'));
  assert.ok(terminal.includes("unit={meta.unit[lang]}"));
});

test("supports pointer, keyboard and touch-friendly slider inspection", () => {
  for (const expected of [
    "onPointerMove={move}",
    "onKeyDown={inspectWithKeyboard}",
    "tabIndex={0}",
    'type="range"',
    "aria-valuetext=",
    "setCursor(Number(event.currentTarget.value))",
    "setCursor(null)",
  ]) assert.ok(chart.includes(expected), `missing chart interaction: ${expected}`);
  assert.ok(chart.includes('aria-labelledby="macro-chart-title macro-chart-description"'));
  assert.ok(chart.includes("Usa las flechas, Inicio y Fin"));
});

test("labels and clips both axes without allowing chart overflow", () => {
  assert.ok(chart.includes('className="chart-y-axis"'));
  assert.ok(chart.includes('className="chart-x-axis"'));
  assert.ok(chart.includes('clipPath id="macro-chart-clip"'));
  assert.ok(chart.includes('clipPath="url(#macro-chart-clip)"'));
  assert.match(styles, /\.chart-plot\{[^}]*overflow:hidden;contain:paint/);
  assert.match(styles, /\.chart-plot svg\{[^}]*max-width:100%;max-height:100%;overflow:hidden/);
});

test("keeps the terminal balanced from desktop to narrow phones", () => {
  assert.match(styles, /\.chart-plot\{height:315px/);
  assert.match(styles, /max-width:760px\).*\.chart-plot\{height:270px/);
  assert.match(styles, /max-width:500px\).*\.chart-plot\{height:235px/);
  assert.match(styles, /max-width:500px\).*\.chart-readout\{align-items:flex-start;flex-direction:column/);
  assert.match(styles, /max-width:500px\).*\.chart-scrubber\{grid-template-columns:1fr/);
  assert.ok(!styles.includes(".line-chart{height:290px}"));
});
