/** The per-browser cooldown limits user requests, never scheduled editions.
 * @param {boolean} userInitiated
 * @param {number|null} nextAllowedAt
 * @param {number} now
 */
export function manualRefreshBlocked(userInitiated, nextAllowedAt, now = Date.now()) {
  return userInitiated && nextAllowedAt != null && now < nextAllowedAt;
}
