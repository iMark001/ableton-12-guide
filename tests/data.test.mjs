import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({});
for (const f of ['data/core.js', 'data/catalog.js']) vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx);
const { CATALOG, GROUPS, STYLES, INSTRUMENTS } = vm.runInContext('({ CATALOG, GROUPS, STYLES, INSTRUMENTS })', ctx);

test('в каталоге все 85 устройств из браузера Live 12', () => {
  assert.equal(CATALOG.length, 85);
  assert.equal(new Set(CATALOG.map(d => d.id)).size, 85);
});
test('у каждого устройства есть группа, описание и ссылка на мануал Live 12', () => {
  const groups = new Set(GROUPS.map(g => g.id));
  for (const d of CATALOG) {
    assert.ok(groups.has(d.group), d.id);
    assert.ok(d.tagline.length > 10, d.id);
    assert.match(d.manual, /^https:\/\/www\.ableton\.com\/en\/live-manual\/12\/[a-z-]+\/#[a-z0-9-]+$/, d.id);
  }
});
test('9 стилей и партии описаны', () => {
  assert.equal(Object.keys(STYLES).length, 9);
  assert.ok(Object.keys(INSTRUMENTS).length >= 13);
});

import { readdirSync } from 'node:fs';
const partFiles = readdirSync(new URL('../data/', import.meta.url)).filter(f => /^parts(-[a-z]+)?\.js$/.test(f)).sort((a, b) => (a === 'parts.js' ? -1 : b === 'parts.js' ? 1 : a.localeCompare(b)));
const pctx = vm.createContext({});
for (const f of ['data/core.js', 'data/catalog.js', ...partFiles.map(f => `data/${f}`)]) vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), pctx);
const PG = vm.runInContext('PART_GUIDE', pctx);

test('«По партиям»: рецепты и цепочки ссылаются на реальные устройства и стили', () => {
  const ids = new Set(CATALOG.map(d => d.id)), styles = new Set(Object.keys(STYLES)), kinds = new Set(['live', 'serum', 'diva', 'sample']);
  for (const [part, g] of Object.entries(PG)) {
    assert.ok(INSTRUMENTS[part], `неизвестная партия ${part}`);
    assert.ok(typeof g.what === 'string' && g.what.length > 20, `${part}: нет описания`);
    for (const r of g.make || []) {
      assert.ok(kinds.has(r.kind), `${part}: вид ${r.kind}`);
      assert.ok(r.tool && r.title, `${part}: рецепт без названия`);
      if (r.kind === 'live') assert.ok(ids.has(r.device), `${part}: устройство ${r.device} не из каталога`);
      for (const s of r.styles || []) assert.ok(styles.has(s), `${part}: стиль ${s}`);
      for (const p of r.params || []) assert.equal(p.length, 2, `${part}: параметр ${p}`);
    }
    for (const s of g.chain || []) assert.ok(ids.has(s.device), `${part}: цепочка — ${s.device} не из каталога`);
    for (const s of Object.keys(g.styles || {})) assert.ok(styles.has(s), `${part}: заметка для стиля ${s}`);
  }
});
