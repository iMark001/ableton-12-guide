import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const ctx = vm.createContext({});
for (const f of ['data/core.js', 'data/catalog.js']) vm.runInContext(readFileSync(new URL(f, root), 'utf8'), ctx);
const { STYLES, INSTRUMENTS, CATALOG } = vm.runInContext('({ STYLES, INSTRUMENTS, CATALOG })', ctx);
const ids = new Set(CATALOG.map(d => d.id));

const files = ['data/devices', '_staging/devices'].flatMap(dir => (existsSync(new URL(dir, root)) ? readdirSync(new URL(dir, root)).filter(f => f.endsWith('.js')).map(f => `${dir}/${f}`) : []));
const devs = files.map(f => { const c = vm.createContext({ registerDevice: d => { c.dev = d; } }); vm.runInContext(readFileSync(new URL(f, root), 'utf8'), c); return [f, c.dev]; });

test('файлы устройств найдены', () => assert.ok(devs.length > 0));

test('готовые в каталоге = файлы в data/devices', () => {
  const ready = Array.from(CATALOG.filter(d => d.ready), d => d.id).sort(); // массив из vm — копия в нашем realm
  const published = files.filter(f => f.startsWith('data/devices/')).map(f => f.slice('data/devices/'.length, -3)).sort();
  assert.deepEqual(ready, published, 'у готового устройства нет файла или файл не отмечен готовым');
});
for (const [file, d] of devs) {
  test(`устройство ${file}`, () => {
    assert.ok(ids.has(d.id), `id ${d.id} нет в каталоге`);
    assert.ok(file.endsWith(`/${d.id}.js`), 'имя файла = id');
    for (const k of ['what', 'when', 'how', 'controls']) assert.ok(d[k], `нет поля ${k}`);
    if (!d.card) { assert.ok(d.presets && Object.keys(d.presets).length >= 2, 'нужно ≥ 2 варианта в presets'); assert.equal(Object.keys(d.styles || {}).length, 9, 'нужны все 9 стилей'); }
    const ctl = new Map(d.controls.map(c => [c.id, c]));
    assert.equal(ctl.size, d.controls.length, 'повтор id ручки');
    const check = (s, where) => {
      const c = ctl.get(s.c);
      assert.ok(c, `${where}: нет ручки ${s.c}`);
      assert.ok(s.w && s.w.length > 3, `${where}: ${s.c} без объяснения`);
      if (c.kind === 'switch') assert.ok(c.opts.includes(s.v), `${where}: ${s.c}=${s.v} нет в ${c.opts}`);
      else if (c.kind === 'toggle') assert.equal(typeof s.v, 'boolean', `${where}: ${s.c} не true/false`);
      else if (s.v !== 'inf') { assert.equal(typeof s.v, 'number', `${where}: ${s.c} не число`); assert.ok(s.v >= c.min && s.v <= c.max, `${where}: ${s.c}=${s.v} вне ${c.min}…${c.max}`); }
    };
    for (const [part, p] of Object.entries(d.presets || {})) {
      assert.ok(INSTRUMENTS[part] || p.label, `нет партии ${part} и нет label`);
      p.set.forEach(s => check(s, part));
    }
    for (const [st, o] of Object.entries(d.styles || {})) {
      assert.ok(STYLES[st], `нет стиля ${st}`);
      (o.set || []).forEach(s => { check(s, st); for (const p of [...(s.only || []), ...(s.not || [])]) assert.ok((d.presets || {})[p], `${st}: only/not ${p} нет в presets`); });
    }
    for (const p of d.parts || []) assert.ok(INSTRUMENTS[p], `ссылка на партию ${p}`);
  });
}
