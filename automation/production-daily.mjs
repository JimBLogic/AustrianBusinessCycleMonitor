import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const origin = 'https://austrian-business-cycle-monitor.jimblogic.chatgpt.site';
const madridParts = date => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', hourCycle: 'h23',
}).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
const sameDay = (a, b) => ['year', 'month', 'day'].every(key => a[key] === b[key]);

/** Late scheduled jobs must catch up; a current daily edition is verified once
 * more without forcing a second provider refresh. No snapshot date is invented. */
export function dailyDecision(snapshot, now = new Date()) {
  const local = madridParts(now);
  if (Number(local.hour) < 12) return 'before-noon';
  const generated = typeof snapshot?.requestedAt === 'string' ? new Date(snapshot.requestedAt) : null;
  if (!generated || !Number.isFinite(generated.getTime()) || generated > now) return 'refresh';
  const edition = madridParts(generated);
  return sameDay(local, edition) && Number(edition.hour) >= 12 ? 'verify' : 'refresh';
}

async function main() {
  let decision = 'refresh';
  if (process.env.GITHUB_EVENT_NAME === 'schedule') {
    // Decide pre-noon without network; the second UTC slot handles winter noon.
    decision = dailyDecision(null);
    if (decision !== 'before-noon') {
      let snapshot = null;
      try {
        const response = await fetch(`${origin}/api/data`, {
          cache: 'no-store', signal: AbortSignal.timeout(30_000),
        });
        if (response.ok) snapshot = await response.json();
      } catch {
        // A failed read does not silently skip the independently verified POST.
      }
      decision = dailyDecision(snapshot);
    }
  }
  console.log(JSON.stringify({checkedAt: new Date().toISOString(), dailyDecision: decision}));
  if (decision === 'before-noon') return;
  const script = existsSync('sites-current/scripts/verify-production.mjs')
    ? 'sites-current/scripts/verify-production.mjs' : 'scripts/verify-production.mjs';
  execFileSync(process.execPath, [script, ...(decision === 'refresh' ? ['--refresh'] : [])], {
    stdio: 'inherit', timeout: 180_000,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
