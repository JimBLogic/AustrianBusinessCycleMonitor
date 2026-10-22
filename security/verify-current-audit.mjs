import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

/**
 * Active surfaces fail closed if a lockfile scan shows any advisory.
 * Historical non-deployed code is reported but never silently counted as safe.
 */
export function evaluateAdvisoryReport(report){
 const problems=[],legacy=[];
 if(report?.schemaVersion!==1||!Array.isArray(report.scans))return {ok:false,problems:['INVALID_ADVISORY_REPORT'],legacy};
 for(const id of ['maintained-sites','playwright-qa']){
  const s=report.scans.find(x=>x.id===id);
  if(!s){problems.push('MISSING_CURRENT_SURFACE:'+id);continue;}
  for(const scope of ['all','production']){
   const o=s[scope];
   if(!o||o.error||o.toolingError||!o.counts||typeof o.counts.total!=='number')problems.push('UNVERIFIED_AUDIT:'+id+':'+scope);
   else if(o.counts.total!==0)problems.push('CURRENT_ADVISORIES:'+id+':'+scope+':'+o.counts.total);
  }
 }
 for(const s of report.scans)if(s.role==='historical'||s.role==='archive'){
  legacy.push({id:s.id,all:s.all?.counts??null,production:s.production?.counts??null});
  if(s.all?.error||s.all?.toolingError||!s.all?.counts||s.production?.error||s.production?.toolingError||!s.production?.counts)problems.push('UNVERIFIED_LEGACY_AUDIT:'+s.id);
 }
 return {ok:problems.length===0,problems,legacy};
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 try{
  const file=process.argv[2]||'security-evidence/lockfile-advisories.json';
  const verdict=evaluateAdvisoryReport(JSON.parse(readFileSync(file,'utf8')));
  console.log(JSON.stringify(verdict,null,2));
  if(!verdict.ok)process.exitCode=1;
 }catch(e){console.error('SECURITY_EVIDENCE_UNAVAILABLE:',e.message);process.exitCode=2;}
}
