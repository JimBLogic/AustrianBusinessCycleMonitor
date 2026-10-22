// Only the isolated local candidate writes by default. Public writes require
// the explicit opt-in set by the existing authorized master schedule/dispatch.
export function allowsRefresh(origin, readOnly) {
  if (readOnly === '1') return false;
  if (origin === 'http://127.0.0.1:8793') return true;
  return origin === 'https://austrian-business-cycle-monitor.jimblogic.chatgpt.site' && readOnly === '0';
}
