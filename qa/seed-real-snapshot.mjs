// CI-only: replay real, unmodified public observations into an isolated local
// D1 volume. No mock values, no production writes, no timestamp substitution.
import { writeFile } from 'node:fs/promises';
import { verifyProduction } from '../sites-current/lib/production-verification.mjs';
const origin='https://austrian-business-cycle-monitor.jimblogic.chatgpt.site';
const data=await(await fetch(`${origin}/api/data`,{signal:AbortSignal.timeout(120000)})).json();
const health=await(await fetch(`${origin}/api/health`,{signal:AbortSignal.timeout(30000)})).json();
verifyProduction(data,health);
const metrics={latest:data.latest,series:data.series,bitcoin:data.bitcoin,changes:data.derived.changes,derived:{correlations:data.derived.correlations,correlationEvidence:data.derived.correlationEvidence,ratios:data.derived.ratios,ratioEvidence:data.derived.ratioEvidence,sixForce:data.derived.sixForce},freshness:data.freshness};
const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const values=['ci-real-public-snapshot',data.requestedAt,data.refreshMode,data.derived.regime,JSON.stringify(data.derived.scores),JSON.stringify(metrics),JSON.stringify(data.provenance),new Date().toISOString()];
await writeFile(process.argv[2],`INSERT INTO macro_snapshots (id,requested_at,refresh_mode,regime,scores_json,metrics_json,provenance_json,created_at) VALUES (${values.map(quote).join(',')});\n`);
console.log(JSON.stringify({seed:'real-public-observations',release:data.siteRelease,snapshot:data.requestedAt,coverage:data.provenance.modelInputsAvailable}));
