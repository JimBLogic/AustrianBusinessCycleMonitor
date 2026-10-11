import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

const section = monitor.slice(
  monitor.indexOf('<section className="cava-credit"'),
  monitor.indexOf('<section className="influence-library"'),
);
const dialogContent = monitor.slice(
  monitor.indexOf("function showCavaContext"),
  monitor.indexOf("function showSignal"),
);

test("labels the Cava section and keeps its decorative index out of the accessibility tree", () => {
  for (const expected of [
    'aria-labelledby="cava-title"',
    'aria-describedby="cava-summary cava-independence"',
    'className="cava-index" aria-hidden="true"',
    '<h2 id="cava-title">José Luis Cava</h2>',
    'id="cava-summary"',
    'id="cava-independence"',
  ]) assert.ok(section.includes(expected), "missing section semantic: " + expected);
});

test("restores focus after opening the contextual dialog", () => {
  assert.ok(dialogContent.includes("function showCavaContext(trigger?: HTMLButtonElement)"));
  assert.ok(dialogContent.includes("if (trigger) detailReturnFocusRef.current = trigger"));
  assert.ok(section.includes("showCavaContext(event.currentTarget)"));
  assert.ok(section.includes('aria-haspopup="dialog"'));
  assert.ok(section.includes('aria-controls="detail-dialog"'));
});

test("keeps the three-pillar reconstruction exact and explicitly contextual", () => {
  for (const expected of [
    "Reserva Federal, balance, reservas bancarias y liquidez",
    "condiciones financieras, repos, emisión de deuda y transmisión de la liquidez",
    "empleo, poder adquisitivo, vivienda, pobreza y situación de Main Street",
    "no es una transcripción literal",
  ]) assert.ok(dialogContent.includes(expected), "missing contextual detail: " + expected);
});

test("states inspiration without implying authorship, affiliation or endorsement", () => {
  for (const expected of [
    "No le atribuimos la autoría",
    "no es un producto oficial, una colaboración ni un respaldo",
    "Referencia editorial · sin afiliación · sin autoría",
    "La divulgación pública de José Luis Cava inspiró la pregunta editorial",
  ]) assert.ok(section.includes(expected), "missing attribution boundary: " + expected);
});

test("makes external destinations explicit and safe", () => {
  assert.equal((section.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length, 3);
  assert.equal((section.match(/pestaña nueva/g) ?? []).length, 3);
  assert.ok(section.includes("sitio público de HOPLA Finance"));
  assert.ok(section.includes("canal público de José Luis Cava"));
});

test("provides balanced, readable and touch-sized controls", () => {
  for (const expected of [
    ".cava-copy,.cava-pitch{min-width:0}",
    "display:inline-flex;align-items:center;min-height:44px",
    "overflow-wrap:anywhere",
    ".cava-boundary{margin-top:auto",
  ]) assert.ok(styles.includes(expected), "missing resilient Cava style: " + expected);
});
