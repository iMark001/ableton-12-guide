/* Мини-ZIP без сжатия (метод store): несколько .mid в одном архиве. Браузер + node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MiniZip = api;
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
const TABLE = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(bytes) { let c = 0xffffffff; for (const b of bytes) c = TABLE[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
const u16 = v => [v & 255, (v >>> 8) & 255];
const u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
/* files: [{ name: 'a.mid', data: Uint8Array }] → Uint8Array zip */
function zip(files) {
  const enc = new TextEncoder(), local = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const head = [0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0)];
    local.push(Uint8Array.from(head), name, f.data);
    central.push(Uint8Array.from([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size),
      ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += head.length + name.length + size;
  }
  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const end = Uint8Array.from([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  const parts = [...local, ...central, end], out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let p = 0;
  for (const part of parts) { out.set(part, p); p += part.length; }
  return out;
}
return { zip, crc32 };
});
