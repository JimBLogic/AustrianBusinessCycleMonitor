import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/engine.css", import.meta.url), "utf8"),
]);

test("validates device-local return data before using it", () => {
  assert.match(monitor, /function parseVisitBaseline/);
  assert.match(monitor, /function parseWatchlist/);
  assert.match(monitor, /validTimestamp\(parsed\.capturedAt\)/);
  assert.match(monitor, /WATCH_KEYS\.includes/);
});

test("keeps the four-variable limit explicit and non-destructive", () => {
  assert.match(monitor, /current\.length >= 4 \? current : \[\.\.\.current, key\]/);
  assert.match(monitor, /disabled=\{!selected && watchlist\.length >= 4\}/);
  assert.match(monitor, /Límite alcanzado: desmarca una variable/);
});

test("labels radar units, freshness and observation dates", () => {
  for (const expected of ["billones USD", "diferencial BAA–10Y", "1982–84 = 100", "watch-observation", "watch-state"]) {
    assert.ok(monitor.includes(expected) || styles.includes(expected), `missing Return Desk detail: ${expected}`);
  }
  assert.match(monitor, /<time dateTime=\{item\.date/);
});

test("balances one to four selected radar cards without empty grid cells", () => {
  assert.match(styles, /\.watch-values\.count-2,\.watch-values\.count-4\{grid-template-columns:repeat\(2,1fr\)\}/);
  assert.match(styles, /\.watch-values\.count-3\{grid-template-columns:repeat\(3,1fr\)\}/);
});
