export const ESSENTIAL_SERVER_HOSTS = Object.freeze([
  "api.stlouisfed.org",
  "fred.stlouisfed.org",
  "api.db.nomics.world",
  "api.bls.gov",
  "cdn.cboe.com",
  "api.worldbank.org",
  "thedocs.worldbank.org",
  "api.coinbase.com",
  "api.exchange.coinbase.com",
  "api.kraken.com",
  "api.coingecko.com",
  "blockchain.info",
  "api.blockchain.info",
  "mempool.space",
  "api.fiscaldata.treasury.gov",
] as const);

const essentialServerHosts = new Set<string>(ESSENTIAL_SERVER_HOSTS);

export function essentialServerUrl(input: string | URL) {
  const url = input instanceof URL ? input : new URL(input);
  if (url.protocol !== "https:" || !essentialServerHosts.has(url.hostname)) {
    throw new Error(`Blocked outbound host: ${url.hostname}`);
  }
  return url;
}
