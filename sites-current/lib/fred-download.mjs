import { strFromU8, unzipSync } from 'fflate';
import { parseFredCsv } from './series-quality.mjs';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 16;
const CSV_MEMBER = /^[a-zA-Z0-9_-]+\.csv$/i;
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// Read the bounded standard ZIP directory before fflate can overwrite repeated
// filenames. fflate does not verify CRCs itself. ZIP64, encrypted and split
// archives are not needed for these small official CSV downloads: fail closed.
function zipDirectory(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid = () => { throw new Error('Invalid FRED ZIP directory'); };
  const check = (offset, length) => {
    if (offset < 0 || length < 0 || offset + length > bytes.length) invalid();
  };
  const u16 = offset => { check(offset, 2); return view.getUint16(offset, true); };
  const u32 = offset => { check(offset, 4); return view.getUint32(offset, true); };
  let end = bytes.length - 22;
  for (; end >= Math.max(0, bytes.length - 65557); end--) {
    if (u32(end) === 0x06054b50 && end + 22 + u16(end + 20) === bytes.length) break;
  }
  if (end < Math.max(0, bytes.length - 65557)) invalid();
  const count = u16(end + 10), size = u32(end + 12), start = u32(end + 16);
  if (u16(end + 4) || u16(end + 6) || u16(end + 8) !== count || count === 0xffff ||
      start === 0xffffffff || size === 0xffffffff || start + size !== end) invalid();
  if (count > MAX_FILES) throw new Error('FRED archive exceeds file limit');
  const files = new Map();
  let cursor = start, expanded = 0;
  for (let index = 0; index < count; index++) {
    check(cursor, 46);
    if (u32(cursor) !== 0x02014b50) invalid();
    const flags = u16(cursor + 8), method = u16(cursor + 10), crc = u32(cursor + 16);
    const compressedSize = u32(cursor + 20), originalSize = u32(cursor + 24);
    const nameLength = u16(cursor + 28), extraLength = u16(cursor + 30), commentLength = u16(cursor + 32);
    const offset = u32(cursor + 42), next = cursor + 46 + nameLength + extraLength + commentLength;
    if (next > end || u16(cursor + 34) || flags & 1 || originalSize === 0xffffffff || compressedSize === 0xffffffff) invalid();
    const name = strFromU8(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    if (files.has(name)) throw new Error('Duplicate FRED archive member');
    files.set(name, { crc, originalSize, compressedSize, method });
    if (CSV_MEMBER.test(name)) {
      expanded += originalSize;
      if (expanded > MAX_BYTES) throw new Error('FRED archive exceeds expanded limit');
      check(offset, 30);
      if (![0, 8].includes(method) || u32(offset) !== 0x04034b50 || u16(offset + 6) !== flags || u16(offset + 8) !== method) invalid();
      const localNameLength = u16(offset + 26), localExtraLength = u16(offset + 28);
      const body = offset + 30 + localNameLength + localExtraLength;
      if (body + compressedSize > start || strFromU8(bytes.subarray(offset + 30, offset + 30 + localNameLength)) !== name) invalid();
      if (!(flags & 8) && (u32(offset + 14) !== crc || u32(offset + 18) !== compressedSize || u32(offset + 22) !== originalSize)) invalid();
      if (method === 0 && compressedSize !== originalSize) invalid();
    }
    cursor = next;
  }
  if (cursor !== start + size) invalid();
  return files;
}

// FRED mixed-frequency downloads contain one CSV per frequency. Decode only
// bounded CSV members in memory; never extract paths to disk.
export function parseFredDownload(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength > MAX_BYTES) throw new Error('FRED download exceeds limit');
  let files;
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const metadata = zipDirectory(bytes);
    files = unzipSync(bytes, { filter(file) {
      if (!CSV_MEMBER.test(file.name)) return false;
      const expected = metadata.get(file.name);
      if (!expected || file.originalSize !== expected.originalSize || file.size !== expected.compressedSize || file.compression !== expected.method) {
        throw new Error('Invalid FRED archive member');
      }
      return true;
    } });
    for (const [name, data] of Object.entries(files)) {
      const expected = metadata.get(name);
      if (data.byteLength !== expected.originalSize || crc32(data) !== expected.crc) {
        throw new Error('FRED archive integrity check failed');
      }
    }
  } else {
    files = { 'data.csv': bytes };
  }
  const result = Object.create(null);
  for (const data of Object.values(files)) {
    const text = strFromU8(data);
    const headers = text.trim().replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0].split(',');
    if (new Set(headers).size !== headers.length) throw new Error('Duplicate FRED CSV header');
    for (const [id, points] of Object.entries(parseFredCsv(text))) {
      if (!/^[A-Z][A-Z0-9_]*$/.test(id)) throw new Error('Invalid FRED series identity');
      if (Object.hasOwn(result, id)) throw new Error('Duplicate FRED series identity');
      result[id] = points;
    }
  }
  if (!Object.keys(result).length) throw new Error('FRED download contains no series');
  return result;
}
