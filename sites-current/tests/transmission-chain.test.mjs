import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/engine.css", import.meta.url), "utf8"),
]);

const dataModel = monitor.slice(
  monitor.indexOf("const transmissionSteps"),
  monitor.indexOf("return (", monitor.indexOf("const transmissionSteps")),
);
const panel = monitor.slice(
  monitor.indexOf('<aside className="transmission"'),
  monitor.indexOf('</aside>', monitor.indexOf('<aside className="transmission"')),
);

test("uses the three documented pillars in their transmission order", () => {
  for (const expected of [
    'number: "01"', 'title: lang === "es" ? "Política monetaria"',
    'number: "02"', 'title: lang === "es" ? "Mercados de crédito"',
    'number: "03"', 'title: lang === "es" ? "Economía real"',
    '"Monetary policy"', '"Credit markets"', '"Real economy"',
  ]) assert.ok(dataModel.includes(expected), `missing pillar sequence: ${expected}`);
  assert.equal((dataModel.match(/number: "/g) ?? []).length, 3);
});

test("keeps asset prices and CPI outside the three-pillar evidence chain", () => {
  assert.ok(panel.includes("CAPA DE RESPUESTA · NO ES UN CUARTO PILAR"));
  assert.ok(panel.includes("no prueban que la liquidez haya llegado a los hogares."));
  assert.equal(panel.includes("CPI +"), false);
  assert.equal(panel.includes("Oro / BTC / S&P"), false);
});

test("withholds unsupported metrics and the regime instead of formatting false zeros", () => {
  for (const expected of [
    "Number.isFinite(metric.value)",
    'metric.date === "—"',
    'modelAvailable ? regime.title',
    '"Lectura retenida"',
    "No se publica un régimen hasta alcanzar la cobertura mínima",
  ]) assert.ok((dataModel + panel).includes(expected), `missing truthful state: ${expected}`);
});

test("labels the sequence as conditional rather than proven causation", () => {
  for (const expected of [
    "Secuencia diagnóstica condicional",
    "no demuestra por sí sola una relación causal",
    "Liquidity, credit and production must agree",
  ]) assert.ok(panel.includes(expected), `missing epistemic boundary: ${expected}`);
});

test("uses semantic ordered data and exposes the framework link", () => {
  for (const expected of [
    'aria-labelledby="transmission-title"',
    'aria-describedby="transmission-summary"',
    '<ol className="chain"',
    '<li className={`transmission-step ${step.state}`}',
    "<dl>", "<dt>", "<dd>",
    '<a href="#theory">',
  ]) assert.ok(panel.includes(expected), `missing semantic structure: ${expected}`);
});

test("keeps metrics readable on narrow screens", () => {
  assert.match(styles, /\.transmission-step dl\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:460px\).*\.transmission-step dl\{grid-template-columns:1fr/);
  assert.match(styles, /\.transmission-reading a\{align-self:flex-start;min-height:30px/);
});
