import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';

test('actual Workers transport accepts valid JSON and blocks redirects before a second host', async () => {
  const compile = source => ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  const upstream = compile(await readFile(new URL('../app/data/upstream.ts', import.meta.url), 'utf8'))
    .replace('@/lib/upstream-policy.mjs', './policy.js').replace('@/lib/network-policy', './network.js');
  const network = compile(await readFile(new URL('../lib/network-policy.ts', import.meta.url), 'utf8'));
  const policy = await readFile(new URL('../lib/upstream-policy.mjs', import.meta.url), 'utf8');
  const calls=[];
  const mf = new Miniflare(convertV4MiniflareOptions({
    compatibilityDate:'2026-08-08',
    modules:[
      {type:'ESModule',path:'transport-test.js',contents:`import {fetchUpstream,getUpstreamHealth} from './upstream.js';
        export default { async fetch(request) {
          const path=new URL(request.url).pathname;
          const redirect=path==='/redirect';
          try {
            const response=await fetchUpstream('https://api.kraken.com'+path, {headers:{Accept:'application/json'}}, {id:path.slice(1),timeoutMs:100,maxAttempts:1});
            return Response.json({body:await response.json(),health:getUpstreamHealth()});
          } catch(error) {return Response.json({error:error.message,health:getUpstreamHealth()},{status:502});}
        }};`},
      {type:'ESModule',path:'upstream.js',contents:upstream},
      {type:'ESModule',path:'network.js',contents:network},
      {type:'ESModule',path:'policy.js',contents:policy},
    ],
    outboundService:async request=>{
      calls.push(request.url);
      if(request.url.endsWith("/timeout")) await new Promise(resolve=>setTimeout(resolve,500));
      if(request.url.endsWith("/corrupt")) return new Response("{broken");
      return request.url.endsWith('/redirect')
        ?new Response(null,{status:302,headers:{location:'https://untrusted.example/data'}})
        :Response.json({price:12345});
    },
  }));
  try {
    const response=await mf.dispatchFetch('http://localhost/valid');
    assert.equal(response.status,200);
    assert.equal((await response.json()).body.price,12345);
    const redirected=await mf.dispatchFetch('http://localhost/redirect');
    assert.equal(redirected.status,502);
    const payload=await redirected.json();
    assert.match(payload.health.find(item=>item.id==='redirect').reason,/Redirect blocked/);
    assert.deepEqual(calls,['https://api.kraken.com/valid','https://api.kraken.com/redirect']);
    for(const path of ['/corrupt','/timeout']) {
      const failed=await mf.dispatchFetch('http://localhost'+path);
      assert.equal(failed.status,502,path+' must fail explicitly');
      assert.ok((await failed.json()).error);
    }
  } finally {await mf.dispose();}
});
