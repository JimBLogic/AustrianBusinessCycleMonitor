export function retryAfterMilliseconds(value, now=Date.now()) {
  if (!value) return 0;
  const seconds=Number(value);
  return Number.isFinite(seconds)?Math.max(0,seconds*1000):Math.max(0,Date.parse(value)-now)||0;
}
export async function boundedBody(response, maxBytes=8*1024*1024) {
  if(Number(response.headers.get('content-length'))>maxBytes) { await response.body?.cancel(); throw new Error('Upstream body exceeds limit'); }
  if(!response.body) return new Uint8Array();
  const reader=response.body.getReader();const parts=[];let size=0;
  try {
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw new Error('Upstream body exceeds limit');parts.push(value);}
  } catch(error) { await reader.cancel().catch(()=>{}); throw error; }
  finally { reader.releaseLock(); }
  const result=new Uint8Array(size);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.byteLength;}return result;
}
export function validateTransportBody(body, accept='') {
  const prefix=new TextDecoder().decode(body.subarray(0,256)).trim();
  if(/^<!doctype html|^<html|^<head/i.test(prefix))throw new Error('Unexpected HTML response');
  if(accept.includes('application/json')) {
    try { JSON.parse(new TextDecoder().decode(body)); } catch { throw new Error('Invalid JSON response'); }
  }
}
