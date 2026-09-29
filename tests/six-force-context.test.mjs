import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const api = readFileSync(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
const manifest = readFileSync(new URL("../app/api/data-manifest/route.ts", import.meta.url), "utf8");
const monitor = readFileSync(new URL("../app/monitor.tsx", import.meta.url), "utf8");
const registry = readFileSync(new URL("../app/data/source-registry.ts", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

const section = monitor.slice(
  monitor.indexOf('<section className="six-force-section"'),
  monitor.indexOf('<section className="hard-assets"'),
);

test("models exactly six descriptive forces without a scored color", () => {
  for (const key of ["treasury", "debt", "oil", "manufacturing", "dollar", "bitcoin"]) {
    assert.ok(api.includes(`${key}: force(`), `missing force: ${key}`);
  }
  assert.ok(api.includes("total: 6"));
  assert.ok(api.includes('available === 6 ? "complete" : available >= 4 ? "partial" : "withheld"'));
  const classNames = [...section.matchAll(/className=(?:"([^"]+)"|\{`([^`]+)`\})/g)].map((match) => match[1] ?? match[2]).join(" ");
  assert.doesNotMatch(classNames, /\b(?:good|bad|green|red)\b/i);
  assert.equal(section.includes("/100"), false);
});

test("uses official Treasury and Chicago Fed series with truthful semantics", () => {
  assert.ok(registry.includes('treasury10y: "DGS10"'));
  assert.ok(registry.includes('manufacturingSurvey: "CFSBCACTIVITYMFG"'));
  for (const expected of [
    "Zero means average historical growth",
    "does not reproduce or relabel the proprietary ISM Manufacturing PMI",
    "not ISM PMI",
    "stays outside the scored index",
  ]) assert.ok(`${manifest}\n${monitor}`.includes(expected), `missing boundary: ${expected}`);
});

test("publishes conditional patterns, divergence and falsification", () => {
  for (const expected of [
    "energy-pressure-below-trend-manufacturing",
    "rising-yields-with-fiscal-refinancing-pressure",
    "dollar-liquidity-tightening",
    "monetary-repricing",
    "cross-market-divergence",
    "WHAT WOULD CHANGE THE READING",
    "QUÉ CAMBIARÍA LA LECTURA",
  ]) assert.ok(`${api}\n${monitor}`.includes(expected), `missing analytical behavior: ${expected}`);
});

test("renders sources, observation dates and responsive accessible cards", () => {
  for (const expected of [
    'aria-labelledby="six-force-title"',
    'aria-describedby="six-force-summary"',
    "dateTime={reading.observedAt ?? undefined}",
    'rel="noopener noreferrer"',
    "Open evidence in a new tab",
  ]) assert.ok(section.includes(expected), `missing six-force semantics: ${expected}`);
  assert.match(styles, /\.six-force-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:1060px\).*\.six-force-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:760px\).*\.six-force-grid\{grid-template-columns:1fr\}/);
  assert.match(styles, /\.six-force-card a\{[^}]*min-height:44px/);
});
