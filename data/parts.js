/* По партиям: общий справочник. Файлы data/parts-*.js дополняют его через partAdd(). */
const PART_GUIDE = {};
function partAdd(id, data) {
  const cur = PART_GUIDE[id] || {};
  PART_GUIDE[id] = {
    ...cur, ...data,
    what: cur.what || data.what,
    make: [...(cur.make || []), ...(data.make || [])],
    tips: [...(cur.tips || []), ...(data.tips || [])],
    src: [...(cur.src || []), ...(data.src || [])],
    chain: data.chain || cur.chain, ff: data.ff || cur.ff,
    styles: { ...(cur.styles || {}), ...(data.styles || {}) },
  };
}
