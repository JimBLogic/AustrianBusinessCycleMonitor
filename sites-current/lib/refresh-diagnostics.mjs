// Fixed public categories only: never serialize exceptions, upstream bodies,
// request headers, URLs or credentials into an error response or log.
export function unavailableRefreshCode(upstreams) {
  const failures = upstreams.filter(row => row.failures > 0);
  if (failures.some(row => row.failureKind === 'rate_limit')) return 'provider_rate_limit';
  if (failures.some(row => row.failureKind === 'timeout')) return 'provider_timeout';
  if (failures.some(row => row.failureKind === 'network')) return 'provider_network';
  if (failures.some(row => row.failureKind === 'invalid_response')) return 'provider_validation';
  return 'provider_unavailable';
}

export function refreshFailure(code, requestId = crypto.randomUUID()) {
  const messages = {
    provider_rate_limit: 'Providers are rate limited; the last valid snapshot is retained',
    provider_timeout: 'Providers timed out; the last valid snapshot is retained',
    provider_network: 'Provider transport failed; the last valid snapshot is retained',
    provider_validation: 'Providers returned invalid observations; the last valid snapshot is retained',
    provider_unavailable: 'No validated provider observations; the last valid snapshot is retained',
    persistence_failed: 'Shared edition could not be persisted; the last valid snapshot is retained',
    persistence_unconfirmed: 'Shared edition persistence could not be confirmed; retained snapshots remain available',
    snapshot_validation: 'Edition validation rejected the refresh; the last valid snapshot is retained',
    writer_conflict: 'A concurrent edition could not be read; retained snapshots remain available',
    internal_error: 'Edition generation failed; retained snapshots remain available',
  };
  const errorCode = Object.hasOwn(messages, code) ? code : 'internal_error';
  console.error(JSON.stringify({ event: 'refresh_failed', errorCode, requestId }));
  return Response.json({ error: messages[errorCode], errorCode, requestId,
    ...(['persistence_failed','persistence_unconfirmed'].includes(errorCode) ? { provenance: { persistence: 'failed' } } : {}),
  }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store', 'X-ABCM-Refresh-Result': errorCode, 'X-ABCM-Request-Id': requestId },
  });
}
