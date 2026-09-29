import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

const section = monitor.slice(
  monitor.indexOf('<section className="ammous-lens"'),
  monitor.indexOf('<section className="quotes"'),
);

test("labels the Ammous section and its editorial boundary", () => {
  for (const expected of [
    'aria-labelledby="ammous-title"',
    'aria-describedby="ammous-summary"',
    '<h2 id="ammous-title">Saifedean Ammous</h2>',
    '<p id="ammous-summary">',
    "no como autoridad incuestionable",
    "protocolo, teoría y evidencia de mercado se muestran por separado",
  ]) assert.ok(section.includes(expected), "missing Ammous semantic or boundary: " + expected);
});

test("exposes the three numbered layers as an ordered analysis", () => {
  for (const expected of [
    '<ol className="ammous-grid"',
    '<li><article aria-labelledby="ammous-fact-title">',
    '<li><article aria-labelledby="ammous-thesis-title">',
    '<li><article aria-labelledby="ammous-limit-title">',
    'id="ammous-fact-title"',
    'id="ammous-thesis-title"',
    'id="ammous-limit-title"',
  ]) assert.ok(section.includes(expected), "missing ordered Ammous layer: " + expected);
});

test("keeps fact, thesis and counterpoint explicitly separated", () => {
  for (const expected of [
    "HECHO VERIFICABLE",
    "TESIS DE AMMOUS",
    "LÍMITE Y CONTRASTE",
    "Es una explicación económica, no una identidad contable",
    "no demuestra causalidad ni predice por sí solo",
  ]) assert.ok(section.includes(expected), "missing contrasted reading: " + expected);
});

test("names the academic publication instead of using a generic link", () => {
  assert.ok(section.includes("Can cryptocurrencies fulfil the functions of money? ↗"));
  assert.ok(!section.includes('"Artículo académico"'));
  assert.ok(!section.includes('"Academic paper"'));
});

test("opens all six evidence links safely and accessibly", () => {
  assert.equal((section.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length, 6);
  assert.equal((section.match(/pestaña nueva/g) ?? []).length, 6);
  assert.equal((section.match(/new tab/g) ?? []).length, 6);
  assert.ok(!section.includes('rel="noreferrer"'));
});

test("makes every evidence link touch-sized with visible keyboard focus", () => {
  for (const expected of [
    ".ammous-links{display:flex;flex-wrap:wrap",
    "display:inline-flex;align-items:center;min-height:44px",
    ".ammous-links a:focus-visible,.ammous-grid a:focus-visible",
    "outline:3px solid var(--orange)",
    "overflow-wrap:anywhere",
  ]) assert.ok(styles.includes(expected), "missing Ammous interaction style: " + expected);
});

test("keeps three equal cards and removes the correct responsive borders", () => {
  for (const expected of [
    ".ammous-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))",
    ".ammous-grid article{height:100%;min-width:0",
    ".ammous-grid>li:last-child article{border-right:0}",
    ".ammous-grid{grid-template-columns:1fr}",
    ".ammous-grid>li:last-child article{border-bottom:0}",
  ]) assert.ok(styles.includes(expected), "missing balanced Ammous style: " + expected);
});
