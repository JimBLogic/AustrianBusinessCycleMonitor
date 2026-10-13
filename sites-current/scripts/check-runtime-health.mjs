import { readFile } from 'node:fs/promises';
import { runtimeHealthy } from '../lib/runtime-health.mjs';

try {
  const release = Number((await readFile(new URL('../app/version.ts', import.meta.url), 'utf8')).match(/SITE_RELEASE = (\d+);/)[1]);
  const response = await fetch(process.argv[2] ?? 'http://127.0.0.1:8787/api/health', {signal:AbortSignal.timeout(5_000)});
  const health = await response.json();
  if (!runtimeHealthy(health, response.status, release)) throw new Error('Runtime/database readiness failed');
  console.log(JSON.stringify({siteRelease:release, database:'ready', data:health.status, snapshotReadable:health.persistence.snapshotReadable}));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
