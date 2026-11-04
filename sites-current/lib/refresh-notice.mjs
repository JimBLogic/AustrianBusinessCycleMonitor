/**
 * Keep the request outcome independent of its displayed language.
 * @typedef {{ kind: 'checking' | 'retained' | 'synchronized' | 'failed', sharedWait?: number | null, btcMove?: number | null, changedMacro?: number }} RefreshNotice
 */

/** @param {RefreshNotice | null} notice @param {'es' | 'en'} lang */
export function formatRefreshNotice(notice, lang) {
  if (!notice) return '';
  if (notice.kind === 'checking') return lang === 'es'
    ? 'Consultando fuentes y comparando con tu instantánea anterior…'
    : 'Checking sources and comparing with your previous snapshot…';
  if (notice.kind === 'failed') return lang === 'es'
    ? 'No se pudo completar la consulta. Se conserva el último snapshot válido.'
    : 'Fresh query failed. Keeping the last valid snapshot.';
  if (notice.kind === 'retained') return lang === 'es'
    ? `Edición conservada: el límite compartido impidió generar una nueva.${notice.sharedWait == null ? '' : ` Espera compartida: ${notice.sharedWait} min.`}`
    : `Edition retained: the shared cooldown prevented a new edition.${notice.sharedWait == null ? '' : ` Shared wait: ${notice.sharedWait} min.`}`;
  const move = notice.btcMove == null
    ? (lang === 'es' ? 'sin dato' : 'unavailable')
    : `${notice.btcMove >= 0 ? '+' : ''}$${new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', { maximumFractionDigits: 0, useGrouping: 'always' }).format(notice.btcMove)}`;
  return lang === 'es'
    ? `Instantánea sincronizada · BTC ${move} · ${notice.changedMacro} series macro con nueva fecha`
    : `Snapshot synchronized · BTC ${move} · ${notice.changedMacro} macro series with a new date`;
}
