import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

const model = monitor.slice(
  monitor.indexOf("const pillarCards ="),
  monitor.indexOf("const availableEngineAssessments"),
);
const section = monitor.slice(
  monitor.indexOf('<section className="pillars"'),
  monitor.indexOf('<section className="cava-credit"'),
);

test("localizes all three pillar labels while preserving their order", () => {
  for (const expected of [
    '"POLÍTICA MONETARIA" : "MONETARY POLICY"',
    '"MERCADOS DE CRÉDITO" : "CREDIT MARKETS"',
    '"ECONOMÍA REAL" : "REAL ECONOMY"',
    'key: "liquidity" as const',
    'key: "credit" as const',
    'key: "realEconomy" as const',
  ]) assert.ok(model.includes(expected), "missing localized pillar detail: " + expected);
  assert.equal((model.match(/key: "/g) ?? []).length, 3);
});

test("describes a conditional transmission chain without claiming proven causality", () => {
  assert.ok(section.includes("cadena de transmisión condicional"));
  assert.ok(section.includes("no demuestra causalidad por sí sola"));
  assert.ok(section.includes("conditional transmission chain"));
  assert.ok(!section.includes("forman una cadena causal"));
});

test("withholds unsupported pillar readings instead of formatting a false score", () => {
  for (const expected of [
    "data.provenance.engineReady?.[pillar.key] !== false",
    "Number.isFinite(pillar.score)",
    '"withheld"',
    '"LECTURA RETENIDA"',
    'pillar.available ? "/100" : (lang === "es" ? "SIN PUNTUACIÓN" : "NO SCORE")',
    "pillar.available && <i",
  ]) assert.ok((model + section).includes(expected), "missing truthful pillar state: " + expected);
  assert.ok(section.includes("nunca se sustituye por cero"));
});

test("uses semantic section, list and card structure", () => {
  for (const expected of [
    'aria-labelledby="pillars-title"',
    'aria-describedby="pillars-summary"',
    '<h2 id="pillars-title">',
    '<ol className="pillar-grid">',
    '<li key={pillar.key}><article',
    'aria-labelledby={`pillar-${pillar.key}-title`}',
    '<ol className="process"',
  ]) assert.ok(section.includes(expected), "missing pillar semantics: " + expected);
});

test("declares the dialog interaction and restores focus to its trigger", () => {
  for (const expected of [
    'aria-haspopup="dialog"',
    'aria-controls="detail-dialog"',
    "showEngine(pillar.key, pillar.score, event.currentTarget)",
    "if (trigger) detailReturnFocusRef.current = trigger",
  ]) assert.ok(monitor.includes(expected), "missing accessible pillar interaction: " + expected);
});

test("explains what the experimental score does and does not mean", () => {
  for (const expected of [
    "expresa presión dentro del modelo experimental ABCM",
    "no mide la salud, la rentabilidad ni la importancia del pilar",
    "does not measure the pillar’s health, return or importance",
  ]) assert.ok(section.includes(expected), "missing score boundary: " + expected);
});

test("keeps three balanced cards and four readable process steps", () => {
  for (const expected of [
    ".pillar-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));list-style:none",
    ".pillar-grid article{height:100%;min-width:0;",
    "display:flex;flex-direction:column",
    ".pillar-card>button{min-height:44px",
    ".pillar-card>button:focus-visible{outline:3px solid var(--orange)",
    ".process{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));list-style:none",
    ".pillar-grid>li:last-child article{border-bottom:0}",
  ]) assert.ok(styles.includes(expected), "missing balanced pillar style: " + expected);
});
