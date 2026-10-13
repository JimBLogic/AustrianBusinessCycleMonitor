/** A working empty database is live, but data readiness remains UNAVAILABLE. */
export function runtimeHealthy(health, httpStatus, expectedRelease) {
  return health?.service === 'austrian-business-cycle-monitor' &&
    health.siteRelease === expectedRelease && health.persistence?.status === 'ready' &&
    ((httpStatus === 503 && health.status === 'UNAVAILABLE' && health.persistence.snapshotReadable === false) ||
      (httpStatus === 200 && ['HEALTHY', 'DEGRADED', 'STALE'].includes(health.status) && health.persistence.snapshotReadable === true));
}
