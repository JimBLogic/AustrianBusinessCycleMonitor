import assert from 'node:assert/strict';

/** Classify economic freshness separately from the operational API/persistence gate.
 * Deliberately does not turn valid stale observations into fresh values.
 * Pure and deterministic: it never fetches providers or writes to D1.
 */
export function assessEconomicHealth(health) {
  const data = health?.data;
  const rows = data?.indicators;
  assert.ok(Array.isArray(rows) && rows.length > 0, 'missing indicator diagnostics');
  assert.equal(data.total, rows.length, 'reported indicator total differs from diagnostics');
  const unique = new Set();
  for (const row of rows) {
    assert.match(row.indicator, /^[a-z][A-Za-z0-9]{0,63}$/, 'invalid indicator identifier');
    assert.ok(!unique.has(row.indicator), 'duplicate indicator identifier');
    unique.add(row.indicator);
    assert.ok(['HEALTHY', 'DEGRADED', 'STALE', 'UNAVAILABLE'].includes(row.status), 'invalid indicator status');
    assert.ok(['FRESH', 'STALE', 'UNAVAILABLE'].includes(row.freshness?.state), 'invalid observation freshness');
  }

  // Source health and statistical age are deliberately separate axes: a
  // DBnomics fallback can be DEGRADED while its observation remains FRESH.
  const fresh = rows.filter(row => row.freshness.state === 'FRESH').length;
  const available = rows.filter(row => Number.isFinite(row.last_valid_value)).length;
  assert.equal(data.fresh, fresh, 'reported fresh count differs from observation diagnostics');
  assert.equal(data.available, available, 'reported available count differs from observation diagnostics');
  const stale = rows.filter(row => row.status === 'STALE' || row.freshness.state === 'STALE').map(row => row.indicator);
  const fallback = rows.filter(row => row.status === 'DEGRADED').map(row => row.indicator);
  const macro = rows.filter(row => row.indicator !== 'bitcoin');
  const storedBitcoinQuote = rows.find(row => row.indicator === 'bitcoin');
  const macroFresh = macro.filter(row => row.freshness.state === 'FRESH').length;
  const bitcoinFresh = storedBitcoinQuote?.freshness.state === 'FRESH';
  const level = health.status === 'HEALTHY' && fresh === rows.length && stale.length === 0 ? 'PASS' : 'DEGRADED';
  return {
    level, serviceStatus: health.status, total: rows.length, available, fresh,
    macro: { fresh: macroFresh, total: macro.length },
    storedBitcoinQuote: storedBitcoinQuote ? { fresh: bitcoinFresh } : null,
    stale, fallback,
  };
}

export function economicHealthSummary(report) {
  const btc = report.storedBitcoinQuote
    ? (report.storedBitcoinQuote.fresh ? 'FRESH' : 'STALE')
    : 'NOT REPORTED';
  return [
    '## ABCM production economic freshness (read-only)',
    '',
    '| Operational verification | Economic freshness | Available observations | Macro observations | Stored Bitcoin quote |',
    '| --- | --- | --- | --- | --- |',
    `| PASS (separate API/persistence gate) | ${report.level} | ${report.available}/${report.total}, fresh ${report.fresh}/${report.total} | ${report.macro.fresh}/${report.macro.total} fresh | ${btc} |`,
    '',
    `- API health status: **${report.serviceStatus}**`,
    `- Explicit STALE indicators: ${report.stale.join(', ') || 'none'}`,
    `- Provider fallback / DEGRADED indicators: ${report.fallback.join(', ') || 'none'}`,
    '- A successful monitoring run confirms its operational assertions, **not** that economic data are all fresh or upstream providers are healthy.',
    '- No live POST, refresh, D1 write or BrangeCycle access was performed by this monitor.',
    '',
  ].join('\n');
}
