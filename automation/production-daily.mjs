import { pathToFileURL } from 'node:url';
import { runDailyProduction } from '../sites-current/scripts/production-daily.mjs';
export { dailyDecision } from '../sites-current/scripts/production-daily.mjs';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runDailyProduction();
