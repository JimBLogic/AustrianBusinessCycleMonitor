import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
const registry = await readFile(new URL("../app/data/source-registry.ts", import.meta.url), "utf8");

test("serves the last verified edition immediately while a daily refresh is pending", () => {
  assert.ok(route.includes("persisted && currentSourcePolicy && (!manual ||"));
  assert.ok(route.includes('"stale-while-refresh"'));
  assert.ok(route.includes('mode: currentMainEdition ? "daily-persisted" : "stale-persisted"'));
});

test("keeps independent enrichment requests in one bounded parallel wave", () => {
  assert.ok(route.includes("bitcoinSpot, coin, chain, fees, heightText, bitcoinChart"));
  assert.match(registry, /id: "fred-csv"[\s\S]*?timeoutMs: 5_000,[\s\S]*?maxAttempts: 1/);
});
