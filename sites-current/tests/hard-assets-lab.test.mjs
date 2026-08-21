import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const monitor = readFileSync(new URL("../app/monitor.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const dataRoute = readFileSync(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
const lab = monitor.slice(
  monitor.indexOf('<section className="hard-assets"'),
  monitor.indexOf('<section className="pillars"'),
);

test("uses the aligned monthly Bitcoin-gold ratio instead of mixing spot dates", () => {
  assert.ok(monitor.includes('const btcGoldEvidence = evidenceFor("bitcoinGoldOunces")'));
  assert.ok(monitor.includes('btcGoldEvidence.status === "available"'));
  assert.ok(lab.includes("alignedBitcoinGold"));
  assert.ok(lab.includes("alignedBitcoinGoldMonth"));
  assert.ok(lab.includes("btcGoldEvidence.numeratorObservations"));
  assert.ok(!lab.includes("btc/gold"));
});

test("removes arbitrary visual rankings and explains qualitative dependencies", () => {
  assert.ok(!lab.includes('style={{width:"72%"}}'));
  assert.ok(!lab.includes('style={{width:"48%"}}'));
  assert.ok(!lab.includes('style={{width:"35%"}}'));
  assert.ok(!lab.includes('style={{width:data.bitcoin.supply'));
  assert.ok(lab.includes("Mapa cualitativo, no puntuación de seguridad, rentabilidad ni riesgo"));
  assert.ok(lab.includes("Qualitative map, not a security, return or risk score"));
});

test("cites current inputs for the 2025 gold stock-to-flow estimate", () => {
  assert.ok(monitor.includes("const goldStockToFlow2025 = 219_891 / 3_671.6"));
  assert.ok(lab.includes("World Gold Council"));
  assert.ok(lab.includes("https://www.gold.org/goldhub/data/how-much-gold"));
  assert.ok(lab.includes("ESTIMACIÓN 2025 · STOCK / PRODUCCIÓN MINERA"));
});

test("reports Bitcoin price and network provenance without conflating providers", () => {
  assert.ok(dataRoute.includes('function bitcoinNetworkProvenance(hasMempool: boolean, hasBlockchain: boolean)'));
  assert.ok(dataRoute.includes('if (hasMempool && hasBlockchain) return "Mempool.space + Blockchain.com"'));
  assert.ok(dataRoute.includes('bitcoinNetwork: storedBitcoinNetwork'));
  assert.ok(dataRoute.includes('bitcoinNetwork: bitcoinNetworkProvenance(Boolean(heightText || fees), Boolean(chain))'));
  assert.ok(lab.includes("bitcoinSourceUrl(data)"));
  assert.ok(lab.includes("Mempool.space"));
  assert.ok(lab.includes("Blockchain.com"));
});

test("withholds unavailable market or network readings instead of rendering zero", () => {
  assert.ok(monitor.includes('data.provenance.mode !== "fallback" && btc != null'));
  assert.ok(monitor.includes('data.provenance.bitcoinNetwork !== "unavailable"'));
  assert.ok(lab.includes('bitcoinPriceAvailable ? `$${marketFormat(btc, lang, 0)}` : "—"'));
  assert.ok(lab.includes('bitcoinSupplyAvailable ? `${marketFormat(data.bitcoin.stockToFlow, lang, 1)}×` : "—"'));
});

test("uses semantic headings, definitions and secure evidence links", () => {
  for (const expected of [
    'aria-labelledby="hard-assets-title"',
    'id="hard-assets-title"',
    'aria-labelledby="bitcoin-asset-title"',
    '<h3 id="bitcoin-asset-title">',
    '<dl className="asset-stats">',
    '<dl className="hard-ratio-list">',
    '<ul className="dependency-list">',
    'rel="noopener noreferrer"',
  ]) assert.ok(lab.includes(expected), `missing hard-assets semantics: ${expected}`);
});

test("localizes values, dates and every dependency description", () => {
  for (const expected of [
    "marketFormat(btc, lang, 0)",
    "formatChartDate(data.bitcoin.priceObservedAt.slice(0, 10), lang)",
    "Autenticidad física · custodia · transporte",
    "Emisor · red bancaria · marco legal",
    "Deuda soberana",
    "Ratios de escasez y poder adquisitivo",
    'lang === "es" ? "ORO S2F" : "GOLD S2F"',
  ]) assert.ok(lab.includes(expected), `missing localized hard-assets detail: ${expected}`);
});

test("keeps the three-card composition balanced through responsive breakpoints", () => {
  assert.match(styles, /\.asset-grid\{display:grid;grid-template-columns:1\.15fr \.85fr \.8fr/);
  assert.match(styles, /\.asset-grid article\{[^}]*min-width:0;min-height:480px/);
  assert.match(styles, /max-width:1050px\).*\.asset-grid\{grid-template-columns:1fr 1fr\}\.monetary-map\{grid-column:1\/-1\}/);
  assert.match(styles, /max-width:760px\).*\.asset-grid[^}]*\{grid-template-columns:1fr\}\.asset-grid article\{min-height:auto\}/);
});
