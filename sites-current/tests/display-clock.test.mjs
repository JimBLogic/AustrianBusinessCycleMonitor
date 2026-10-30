import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Execute the effect shipped in Monitor, not a second copy of its policy.
const source=await readFile(new URL('../app/monitor.tsx',import.meta.url),'utf8');
const start=source.indexOf('  useEffect(() => {\n    let timer: number;');
assert.ok(start>0);
const end=source.indexOf('  }, [manualRefreshNext]);',start)+'  }, [manualRefreshNext]);'.length;
const code=`export function mount(manualRefreshNext,setClock,window,document,Date) {
  let cleanup; const useEffect=fn=>{cleanup=fn();};
  ${source.slice(start,end)}
  return cleanup;
}`;
const compiled=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {mount}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

function runtime(deadline) {
  let now=1000,id=0;
  const timers=new Map(),listeners=new Map(),values=[];
  const document={hidden:false,addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};
  const window={setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id)};
  const cleanup=mount(deadline,value=>values.push(value),window,document,{now:()=>now});
  return {timers,listeners,document,values,cleanup,setNow:value=>{now=value;},next(){const [id,t]=timers.entries().next().value;timers.delete(id);t.fn();}};
}

test('the display clock uses seconds during cooldown and returns to minute cadence after expiry',()=>{
  const r=runtime(3000);try {
    r.next();assert.equal([...r.timers.values()][0].delay,1000);assert.deepEqual(r.values,[1000]);
    r.setNow(4000);r.next();assert.equal([...r.timers.values()][0].delay,60000);
  }finally{r.cleanup();}
});

test('hidden tabs stop the display clock, visibility resumes it, and cleanup leaves no work',()=>{
  const r=runtime(null);try {
    r.next();assert.equal([...r.timers.values()][0].delay,60000);
    r.document.hidden=true;r.listeners.get('visibilitychange')();assert.equal(r.timers.size,0);
    r.document.hidden=false;r.listeners.get('visibilitychange')();assert.equal([...r.timers.values()][0].delay,0);
    r.next();assert.equal(r.values.length,2);
    r.cleanup();assert.equal(r.timers.size,0);assert.equal(r.listeners.size,0);
  }finally{r.cleanup();}
});
