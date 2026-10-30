import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Exercise the actual header function for both Vite modes, without weakening
// any public policy or relying on a Host header to enable development behavior.
const source=await readFile(new URL('../worker/index.ts',import.meta.url),'utf8');
const fragment=source.slice(source.indexOf('const SECURITY_HEADERS ='),source.indexOf('// Image security config.'))
  .replaceAll('import.meta.env.DEV','development');
const compiled=ts.transpileModule(`export function apply(response,request,development){${fragment}\nreturn withSecurityHeaders(response,request);}`,{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},
}).outputText;
const {apply}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

test('only the exact managed HTTP development origin avoids a nonexistent TLS endpoint',()=>{
  for(const [origin,development,upgrade] of [
    ['http://terminal.local',true,false],['http://terminal.local',false,true],
    ['https://terminal.local',true,true],['http://terminal.local.attacker.invalid',true,true],
    ['http://economy.example.com',true,true],
    ['https://austrian-business-cycle-monitor.jimblogic.chatgpt.site',true,true],
    ['https://austrian-business-cycle-monitor.jimblogic.chatgpt.site',false,true],
  ]) {
    const response=apply(new Response('ok'),new Request(origin),development);
    const csp=response.headers.get('content-security-policy');
    assert.equal(csp.includes('upgrade-insecure-requests'),upgrade,origin+' dev='+development);
    for(const directive of ["script-src 'self' 'unsafe-inline'","connect-src 'self'","frame-ancestors 'none'","object-src 'none'"])
      assert.ok(csp.includes(directive));
    assert.equal(response.headers.get('x-frame-options'),'DENY');
  }
});
