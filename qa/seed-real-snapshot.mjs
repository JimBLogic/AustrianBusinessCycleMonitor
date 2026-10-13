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
const id='ci-real-public-snapshot';
const values=[id,data.requestedAt,data.refreshMode,data.derived.regime,'','','',new Date().toISOString()];
// Wrangler's SQL import has a per-statement size limit. Append bounded chunks
// without truncating histories or altering observations to make tests pass.
const statements=[`INSERT INTO macro_snapshots (id,requested_at,refresh_mode,regime,scores_json,metrics_json,provenance_json,created_at) VALUES (${values.map(quote).join(',')});`];
for (const [column,value] of Object.entries({scores_json:JSON.stringify(data.derived.scores),metrics_json:JSON.stringify(metrics),provenance_json:JSON.stringify(data.provenance)})) {
  for (let offset=0;offset<value.length;offset+=16000) statements.push(`UPDATE macro_snapshots SET ${column}=${column} || ${quote(value.slice(offset,offset+16000))} WHERE id=${quote(id)};`);
}
await writeFile(process.argv[2],statements.join('\n')+'\n');
console.log(JSON.stringify({seed:'real-public-observations',release:data.siteRelease,snapshot:data.requestedAt,coverage:data.provenance.modelInputsAvailable}));
