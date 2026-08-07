# Inspiration and source boundaries

ABCM v29 studied [World Monitor](https://github.com/koala73/worldmonitor) and its [Finance Monitor](https://finance.worldmonitor.app/) as product and systems-design references.

## Ideas adopted

- Treat provider redundancy and provider health as part of the product, not hidden plumbing.
- Keep slow official macro releases on a shared snapshot cadence while refreshing market prices separately.
- Confirm a Bitcoin spot quote across independent public venues and disclose disagreement.
- Put provenance, freshness and degraded states next to the number they qualify.

## What ABCM implements independently

ABCM uses its own TypeScript implementation and public contracts. Bitcoin spot data comes from the documented public Coinbase Exchange BTC-USD ticker and Kraken XBT-USD ticker. Coinbase is the primary observation; Kraken confirms or backs it up. A spread up to 2% produces a confirmed midpoint. Larger disagreement is visibly flagged and retains the primary quote. Provider failures use bounded retries and an in-memory cooldown circuit.

Macro data remains deliberately slower and centered on official or well-documented sources such as FRED, BLS, Cboe and World Bank. Market price freshness is not presented as macro-release freshness.

## License and scope boundary

World Monitor is AGPL-3.0 licensed. No World Monitor source code, visual design, undocumented API, text or asset is copied into ABCM. The influence here is architectural and editorial, and this file records it explicitly. ABCM also avoids importing unrelated maps, news feeds or trading surfaces that would weaken the Austrian business-cycle focus.
