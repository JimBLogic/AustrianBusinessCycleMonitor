import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

const section = monitor.slice(
  monitor.indexOf('<section className="influence-library"'),
  monitor.indexOf('<section className="ammous-lens"'),
);

test("exposes the influence map as a labelled bibliography", () => {
  for (const expected of [
    'aria-labelledby="influence-title"',
    'aria-describedby="influence-summary"',
    '<h2 id="influence-title">',
    '<p id="influence-summary">',
    '<ul className="influence-grid"',
    '<li key={name}><a',
  ]) assert.ok(section.includes(expected), "missing influence-map semantic: " + expected);
});

test("keeps the eight selected voices and public sources intact", () => {
  for (const expected of [
    "Saifedean Ammous",
    "Lyn Alden",
    "Robert Breedlove",
    "Parker Lewis",
    "Adam Back",
    "Hal Finney",
    "Jameson Lopp",
    "Ludwig von Mises",
  ]) assert.ok(section.includes(expected), "missing influence: " + expected);
  assert.equal((section.match(/^            \["/gm) ?? []).length, 8);
});

test("preserves the boundary between influence, protocol facts and ABCM authorship", () => {
  assert.ok(section.includes("Sus ideas no equivalen a hechos de protocolo"));
  assert.ok(section.includes("ni los convierten en autores o avalistas de ABCM"));
  assert.ok(section.includes("Their ideas are not protocol facts"));
});

test("opens every source safely with a concise accessible name", () => {
  assert.ok(section.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(section.includes("Abrir la fuente pública de ${name} en una pestaña nueva"));
  assert.ok(section.includes("Open ${name}’s public source in a new tab"));
  assert.ok(!section.includes('rel="noreferrer"'));
});

test("keeps the card grid balanced and resilient", () => {
  for (const expected of [
    ".influence-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))",
    ".influence-grid>li{min-width:0}",
    ".influence-grid a{height:100%;min-width:0",
    "overflow-wrap:anywhere",
    ".influence-grid{grid-template-columns:1fr}",
    ".influence-grid a{min-height:230px}",
  ]) assert.ok(styles.includes(expected), "missing resilient influence style: " + expected);
});

test("provides an explicit keyboard focus state without changing the palette", () => {
  assert.ok(styles.includes(".influence-grid a:focus-visible"));
  assert.ok(styles.includes("outline:3px solid var(--acid)"));
  assert.ok(styles.includes("background:#121e18"));
});
