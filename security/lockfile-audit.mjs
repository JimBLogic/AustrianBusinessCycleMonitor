/**
 * Reproducible advisory snapshot for the actual ABCM GitHub checkout.
 * Reads only committed package-lock.json and public npm advisory endpoint.
 * No installs, no rewrite of lockfiles, no network call to ABCM production.
 */
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';

const sources=[
 {id:'maintained-sites',dir:'sites-current',role:'current'},
 {id:'playwright-qa',dir:'qa',role:'current-ci'},
 {id:'legacy-frontend',dir:'packages/frontend',role:'historical'},
 {id:'historical-sites-v25',dir:'sites-v25',role:'archive'},
 {id:'archived-copilot-monorepo',dir:'archive/copilot-era/monorepo',role:'archive'}
];
const report={schemaVersion:1,application:'ABCM',createdAt:new Date().toISOString(),
 purpose:'owner-authorized, audit-only npm lockfile vulnerability inventory',
 codePolicy:'read-only; no npm install/fix; no production data calls',
 scans:[]};
let toolingFailure=false;
for(const source of sources){
 if(!existsSync(path.join(source.dir,'package-lock.json'))){
  report.scans.push({...source,error:'LOCKFILE_MISSING'});toolingFailure=true;continue;
 }
 const entry={...source};
 for(const [scope,opts] of [['all',[]],['production',['--omit=dev']]]){
  let output='',exitCode=0;
  try{
   output=execFileSync('npm',['audit','--json','--package-lock-only','--audit-level=low',...opts],{
    cwd:source.dir,encoding:'utf8',timeout:90000,maxBuffer:15*1024*1024,env:{...process.env,NO_COLOR:'1',npm_config_update_notifier:'false'}
   });
  }catch(e){
   exitCode=e.status??-1;output=e.stdout?.toString()||'';
   if(!output.trim())entry[scope]={error:'AUDIT_REQUEST_OR_CLI_FAILED',exitCode,stderr:String(e.stderr||e.message).slice(0,350)};
  }
  if(entry[scope]?.error){toolingFailure=true;continue;}
  try{
   const doc=JSON.parse(output);
   const warnings=Object.entries(doc.vulnerabilities||{}).map(([name,v])=>({
    name,severity:v.severity,direct:v.isDirect,range:v.range,
    via:(v.via||[]).map(t=>typeof t==='string'?t:{name:t.name,source:t.source,title:t.title,url:t.url,range:t.range}),
    effects:v.effects,fixAvailable:v.fixAvailable
   }));
   entry[scope]={
    exitCode,counts:doc.metadata?.vulnerabilities||null,
    advisories:warnings.sort((a,b)=>a.name.localeCompare(b.name)),
    toolingError:doc.error?.code||null
   };
   if(doc.error)toolingFailure=true;
  }catch{
   entry[scope]={error:'AUDIT_RETURNED_NON_JSON',exitCode,sample:output.slice(0,150)};
   toolingFailure=true;
  }
 }
 report.scans.push(entry);
 const c=entry.all?.counts||{},p=entry.production?.counts||{};
 console.log(source.id+': all='+JSON.stringify(c)+' production='+JSON.stringify(p)+
  (entry.all?.error?' ERROR '+entry.all.error:''));
}
mkdirSync('security-evidence',{recursive:true});
writeFileSync('security-evidence/lockfile-advisories-20261015.json',JSON.stringify(report,null,2)+'\n');
if(toolingFailure){console.error('Audit evidence incomplete; inspect security-evidence JSON before making claims.');process.exitCode=2;}
if(process.argv.includes('--enforce-production')){
 const current=report.scans.find(x=>x.id==='maintained-sites');
 const counts=current?.production?.counts;
 if(!counts || (counts.moderate||0)+(counts.high||0)+(counts.critical||0)>0)process.exitCode=1;
}
