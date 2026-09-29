import assert from "node:assert/strict";
import test from "node:test";
import { resolveBitcoinConsensus } from "../app/data/bitcoin-consensus.mjs";

test("resolves confirmed, divergent and single-source Bitcoin quotes", () => {
  const confirmed = resolveBitcoinConsensus([
    { source: "coinbase", price: 100_000, observedAt: "2026-08-07T10:00:00Z" },
    { source: "kraken", price: 100_500, observedAt: "2026-08-07T10:00:02Z" },
  ]);
  assert.equal(confirmed.consensus, "confirmed");
  assert.equal(confirmed.price, 100_250);
  assert.deepEqual(confirmed.sources, ["coinbase", "kraken"]);

  const divergent = resolveBitcoinConsensus([
    { source: "coinbase", price: 100_000, observedAt: "2026-08-07T10:00:00Z" },
    { source: "kraken", price: 104_000, observedAt: "2026-08-07T10:00:02Z" },
  ]);
  assert.equal(divergent.consensus, "divergent");
  assert.equal(divergent.price, 100_000);
  assert.ok(divergent.spreadPercent > 2);

  const single = resolveBitcoinConsensus([
    { source: "kraken", price: 99_900, observedAt: "2026-08-07T10:00:00Z" },
  ]);
  assert.equal(single.consensus, "single-source");
  assert.equal(single.provider, "Kraken");
  assert.equal(single.price, 99_900);
});
