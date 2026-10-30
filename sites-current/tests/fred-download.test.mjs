import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { parseFredDownload } from '../lib/fred-download.mjs';

const csv = (id, date, value) => strToU8(`observation_date,${id}\n${date},${value}\n`);

test('FRED mixed-frequency ZIP preserves independent dates, values and missing observations', () => {
  const data = zipSync({
    'README.txt': strToU8('FRED download'),
    'daily.csv': csv('DTWEXBGS', '2026-10-23', 121.3202),
    'monthly.csv': strToU8('observation_date,INDPRO,TCU,CFSBCACTIVITYMFG\n2026-09-01,103.9506,76.8504,.\n2026-10-01,,,45.4545440674\n'),
    'quarterly.csv': csv('A191RL1Q225SBEA', '2026-04-01', 2.2),
  });
  const parsed = parseFredDownload(data);
  assert.deepEqual(parsed.INDPRO, [{date:'2026-09-01',value:103.9506}]);
  assert.deepEqual(parsed.TCU, [{date:'2026-09-01',value:76.8504}]);
  assert.deepEqual(parsed.CFSBCACTIVITYMFG, [{date:'2026-10-01',value:45.4545440674}]);
  assert.deepEqual(parsed.DTWEXBGS, [{date:'2026-10-23',value:121.3202}]);
  assert.deepEqual(parsed.A191RL1Q225SBEA, [{date:'2026-04-01',value:2.2}]);
});

test('FRED plain CSV remains compatible and zero remains an observation', () => {
  assert.deepEqual(parseFredDownload(csv('M2SL','2026-09-01',0)).M2SL,[{date:'2026-09-01',value:0}]);
});

test('FRED decoder rejects corrupt, ambiguous and oversized downloads', () => {
  for (const data of [strToU8('<html>error</html>'),new Uint8Array([80,75,3,4]),zipSync({'README.txt':strToU8('No data')})]) {
    assert.throws(()=>parseFredDownload(data));
  }
  assert.throws(()=>parseFredDownload(zipSync({'daily.csv':csv('M2SL','2026-09-01',1),'monthly.csv':csv('M2SL','2026-09-01',2)})),/Duplicate/);
  assert.throws(()=>parseFredDownload(new Uint8Array(8*1024*1024+1)),/download exceeds/);
  assert.throws(()=>parseFredDownload(zipSync({'monthly.csv':new Uint8Array(8*1024*1024+1)})),/expanded limit/);
  assert.throws(()=>parseFredDownload(zipSync(Object.fromEntries(Array.from({length:17},(_,i)=>[`${i}.csv`,csv(`X${i}`,'2026-09-01',1)])))),/file limit/);
  assert.throws(()=>parseFredDownload(zipSync({'../monthly.csv':csv('M2SL','2026-09-01',1)})),/no series/);
});

test('FRED decoder rejects duplicate CSV columns before either value can win', () => {
  const duplicated = strToU8('observation_date,M2SL,M2SL\n2026-09-01,1,999');
  assert.throws(() => parseFredDownload(duplicated), /Duplicate FRED CSV header/);
  assert.throws(() => parseFredDownload(zipSync({'monthly.csv':duplicated})), /Duplicate FRED CSV header/);
});

test('FRED decoder rejects repeated ZIP member names before fflate overwrites them', () => {
  const data = zipSync({'a.csv':csv('M2SL','2026-09-01',1),'b.csv':csv('M2SL','2026-09-01',999)});
  const previous = strToU8('b.csv');
  let renamed = 0;
  // Rename both the local and central filename without changing member sizes.
  for (let offset = 0; offset <= data.length - previous.length; offset++) {
    if (previous.every((byte,index) => data[offset+index] === byte)) {
      data[offset] = 'a'.charCodeAt(0);
      renamed++;
    }
  }
  assert.equal(renamed,2);
  assert.throws(() => parseFredDownload(data), /Duplicate FRED archive member/);
});

test('FRED decoder checks extracted CSV bytes against their ZIP CRC and length', () => {
  const payload = csv('M2SL','2026-09-01',1);
  const data = zipSync({'monthly.csv':payload},{level:0});
  const offset = new TextDecoder().decode(data).indexOf('2026-09-01,1');
  assert.ok(offset > 0);
  data[offset + '2026-09-01,'.length] = '9'.charCodeAt(0);
  assert.throws(() => parseFredDownload(data), /integrity check failed/);

  const compressed = zipSync({'monthly.csv':payload});
  const view = new DataView(compressed.buffer,compressed.byteOffset,compressed.byteLength);
  const central = compressed.findIndex((_,index) => index+4<=compressed.length && view.getUint32(index,true)===0x02014b50);
  assert.ok(central > 0);
  // Make both headers declare a larger expansion; fflate may pad its output,
  // but the CSV must never be admitted as a validated response.
  view.setUint32(22,payload.length+1,true);
  view.setUint32(central+24,payload.length+1,true);
  assert.throws(() => parseFredDownload(compressed), /integrity check failed/);
});

test('FRED decoder rejects unsupported or inconsistent ZIP directories', () => {
  const split = zipSync({'monthly.csv':csv('M2SL','2026-09-01',1)});
  new DataView(split.buffer,split.byteOffset,split.byteLength).setUint16(split.length-22+4,1,true);
  assert.throws(() => parseFredDownload(split), /Invalid FRED ZIP directory/);

  const encrypted = zipSync({'monthly.csv':csv('M2SL','2026-09-01',1)});
  const view = new DataView(encrypted.buffer,encrypted.byteOffset,encrypted.byteLength);
  const central = encrypted.findIndex((_,index) => index+4<=encrypted.length && view.getUint32(index,true)===0x02014b50);
  view.setUint16(central+8,view.getUint16(central+8,true)|1,true);
  assert.throws(() => parseFredDownload(encrypted), /Invalid FRED ZIP directory/);
});
