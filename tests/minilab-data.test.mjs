import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const C = require('../js/ctrl-core.js');
const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');

const ctx = vm.createContext({});
for (const f of ['data/core.js', 'data/catalog.js', 'data/minilab.js', 'data/automation.js', 'data/practice.js']) vm.runInContext(read(f), ctx);
const G = vm.runInContext('({ STYLES, INSTRUMENTS, CATALOG, ML_CC, ML_CONTROLS, ML_WAYS, ML_SETUP, ML_TROUBLE, ML_FADERS, ML_LAYOUTS, AUTO_BASICS, AUTO_RECORD, AUTO_KEYS, AUTO_SHAPES, AUTO_RECIPES, PRACTICE, PR_909_PADS, PR_909_MACROS })', ctx);
const json = v => JSON.parse(JSON.stringify(v)); // массивы из vm — в наш realm
const { STYLES, INSTRUMENTS } = G;
const CATALOG = json(G.CATALOG);
const BY_ID = new Map(CATALOG.map(d => [d.id, d]));

const DEV = new Map();
function device(id) {
  if (!DEV.has(id)) {
    const c = vm.createContext({ registerDevice: d => { c.d = d; } });
    vm.runInContext(read(`data/devices/${id}.js`), c);
    DEV.set(id, json(c.d));
  }
  return DEV.get(id);
}
const allStrings = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(x => allStrings(x, out));
  return out;
};

/* официальная таблица Arturia (support.arturia.com, «MiniLab 3 — General Questions», MIDI implementation chart) */
const OFFICIAL = {
  user: { enc1: 74, enc2: 71, enc3: 76, enc4: 77, enc5: 93, enc6: 18, enc7: 19, enc8: 16, fad1: 82, fad2: 83, fad3: 85, fad4: 17 },
  daw: { enc1: 86, enc2: 87, enc3: 89, enc4: 90, enc5: 110, enc6: 111, enc7: 116, enc8: 117, fad1: 14, fad2: 15, fad3: 30, fad4: 31 },
};

test('CC ручек и фейдеров совпадают с официальной таблицей Arturia', () => {
  const cc = json(G.ML_CC);
  for (const prog of ['user', 'daw']) for (const [id, n] of Object.entries(OFFICIAL[prog])) assert.equal(cc[prog][id], n, `${prog}.${id}`);
});
test('номера CC не повторяются ни внутри программы, ни между DAW и User', () => {
  const cc = json(G.ML_CC);
  const all = [...Object.values(cc.user), ...Object.values(cc.daw)];
  assert.equal(new Set(all).size, all.length);
});
test('определение ручки работает по таблице из данных', () => {
  const cc = json(G.ML_CC);
  assert.deepEqual(C.identify(C.parseMidi([0xB0, 90, 5]), cc), { id: 'enc4', program: 'daw' });
  assert.deepEqual(C.identify(C.parseMidi([0xB0, 17, 5]), cc), { id: 'fad4', program: 'user' });
});

test('описаны все элементы MiniLab 3', () => {
  const ids = json(G.ML_CONTROLS).map(c => c.id);
  assert.equal(new Set(ids).size, ids.length, 'повтор id');
  const need = ['shift', 'hold', 'octm', 'octp', 'pitch', 'mod', 'main', 'keys',
    ...Array.from({ length: 8 }, (_, i) => `enc${i + 1}`), ...Array.from({ length: 4 }, (_, i) => `fad${i + 1}`), ...Array.from({ length: 8 }, (_, i) => `pad${i + 1}`)];
  for (const id of need) assert.ok(ids.includes(id), `нет ${id}`);
  for (const c of json(G.ML_CONTROLS)) {
    assert.ok(c.name && c.group, `${c.id}: имя и группа`);
    assert.ok(c.daw || c.session || c.arr, `${c.id}: что делает в режиме DAW`);
  }
});
test('фейдеры в режиме DAW: громкость, посыл A, посыл B, панорама', () => {
  assert.deepEqual(json(G.ML_FADERS).map(f => f.id), ['fad1', 'fad2', 'fad3', 'fad4']);
  for (const f of json(G.ML_FADERS)) assert.ok(f.name && f.what);
});
test('способы маппинга: три, рекомендован ровно один, ссылки на практикум существуют', () => {
  const ways = json(G.ML_WAYS), ids = new Set(json(G.PRACTICE).map(p => p.id));
  assert.equal(ways.length, 3);
  assert.equal(ways.filter(w => w.rec).length, 1);
  for (const w of ways) {
    assert.ok(w.id && w.title && w.when && w.plus && w.minus, w.id);
    if (w.go) assert.ok(ids.has(w.go), `${w.id}: нет сценария ${w.go}`);
  }
});

/* практикум «куда нажать» */
test('практикум: в каждом шаге — что нажать, что увидишь и схема', () => {
  const views = new Set(['drum', 'fx', 'midimap']);
  const pr = json(G.PRACTICE);
  assert.ok(pr.length >= 3);
  for (const p of pr) {
    assert.ok(p.id && p.title && p.why && p.steps.length >= 5, p.id);
    for (const [i, s] of p.steps.entries()) {
      assert.ok(s.do && s.see && s.do.length > 10 && s.see.length > 10, `${p.id} шаг ${i + 1}`);
      assert.ok(views.has(s.mock.view), `${p.id} шаг ${i + 1}: схема ${s.mock.view}`);
      assert.ok(Array.isArray(s.mock.hl), `${p.id} шаг ${i + 1}: что подсветить`);
      if (s.mock.macros) assert.equal(s.mock.macros.length, 8, `${p.id} шаг ${i + 1}: 8 макросов`);
      if (s.mock.pad) assert.ok(json(G.PR_909_PADS).some(([n]) => n === s.mock.pad), `${p.id} шаг ${i + 1}: пэд ${s.mock.pad}`);
    }
  }
});
test('909 Core Kit в данных = пресет из библиотеки Live (16 пэдов, ноты C1…D#2)', () => {
  const pads = json(G.PR_909_PADS);
  assert.equal(pads.length, 16);
  assert.deepEqual(pads.map(p => p[0]), ['C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2', 'C#2', 'D2', 'D#2']);
  assert.deepEqual(json(G.PR_909_MACROS), ['Low Gain', '—', '—', 'Gain', 'Drive Amount', 'Drive Tone', 'Glue', 'Vintage']);
});
test('подключение и «не работает?» заполнены', () => {
  assert.ok(json(G.ML_SETUP).length >= 5);
  for (const s of json(G.ML_SETUP)) assert.ok(s.title && s.text, JSON.stringify(s));
  assert.ok(json(G.ML_TROUBLE).length >= 4);
});

const layouts = json(G.ML_LAYOUTS);
test('раскладок не меньше шести, id уникальны', () => {
  assert.ok(layouts.length >= 6);
  assert.equal(new Set(layouts.map(l => l.id)).size, layouts.length);
});
for (const l of layouts) {
  test(`раскладка «${l.id}»: 8 ручек на реальные ручки устройств гида`, () => {
    assert.ok(l.title && l.icon && l.note, 'заголовок, значок, пояснение');
    for (const p of l.parts) assert.ok(INSTRUMENTS[p], `партия ${p}`);
    assert.equal(l.knobs.length, 8, 'ровно 8 ручек');
    assert.ok(l.chain.length >= 1);
    for (const id of l.chain) assert.ok(BY_ID.get(id)?.ready, `устройства ${id} нет в гиде`);
    for (const [i, k] of l.knobs.entries()) {
      const where = `${l.id} ручка ${i + 1}`;
      assert.ok(l.chain.includes(k.dev), `${where}: ${k.dev} нет в цепочке`);
      const ctl = device(k.dev).controls.find(c => c.id === k.ctl);
      assert.ok(ctl, `${where}: у ${k.dev} нет ручки ${k.ctl}`);
      assert.equal(ctl.kind, 'knob', `${where}: макрос ставим на ручку, не на переключатель`);
      assert.ok(k.label && k.label.length <= 12, `${where}: короткое имя макроса`);
      assert.ok(k.why && k.why.length > 15, `${where}: зачем`);
      const lo = Math.min(ctl.min, ctl.max), hi = Math.max(ctl.min, ctl.max);
      for (const key of ['from', 'to', 'v']) {
        assert.equal(typeof k[key], 'number', `${where}: ${key} — число`);
        assert.ok(k[key] >= lo && k[key] <= hi, `${where}: ${key}=${k[key]} вне ${lo}…${hi}`);
      }
      const a = Math.min(k.from, k.to), b = Math.max(k.from, k.to);
      assert.ok(k.v >= a && k.v <= b, `${where}: стартовое значение внутри Min…Max макроса`);
    }
    assert.ok(l.auto.length >= 3, 'что автоматизировать');
    for (const a of l.auto) {
      assert.ok(a.knob >= 1 && a.knob <= 8 && a.t, `${l.id}: ${JSON.stringify(a)}`);
      for (const s of a.styles) assert.ok(STYLES[s], `${l.id}: стиль ${s}`);
    }
  });
}

test('автоматизация: основы, запись, клавиши, формы', () => {
  assert.ok(json(G.AUTO_BASICS).length >= 3);
  const rec = json(G.AUTO_RECORD);
  for (const k of ['arrangement', 'session']) assert.ok(rec[k] && rec[k].steps.length >= 3, k);
  for (const k of json(G.AUTO_KEYS)) assert.ok(k.keys.length && k.what, JSON.stringify(k));
  for (const s of json(G.AUTO_SHAPES)) assert.ok(C.SHAPES.includes(s.kind) && s.name, s.kind);
});
test('приёмы автоматизации: все 9 стилей, ссылки на устройства гида', () => {
  const r = json(G.AUTO_RECIPES);
  assert.deepEqual(Object.keys(r).sort(), Object.keys(STYLES).sort());
  for (const [style, list] of Object.entries(r)) {
    assert.ok(list.length >= 2, style);
    for (const it of list) {
      assert.ok(it.h && it.t, `${style}: ${JSON.stringify(it)}`);
      for (const d of it.devs || []) assert.ok(BY_ID.get(d)?.ready, `${style}: устройства ${d} нет`);
    }
  }
});
test('в данных нет HTML-разметки (всё выводится через esc)', () => {
  const strs = allStrings(json({ a: G.ML_CONTROLS, b: G.ML_WAYS, c: G.ML_SETUP, d: G.ML_TROUBLE, e: G.ML_LAYOUTS, f: G.ML_FADERS, g: G.AUTO_BASICS, h: G.AUTO_RECORD, i: G.AUTO_KEYS, j: G.AUTO_SHAPES, k: G.AUTO_RECIPES, l: G.PRACTICE }));
  for (const s of strs) assert.ok(!/[<>]/.test(s), s);
});
test('новые страницы подключают свои скрипты, а файлы существуют', () => {
  for (const page of ['minilab.html', 'automation.html']) {
    const html = read(page);
    const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    assert.ok(srcs.includes('js/ctrl-core.js') && srcs.includes('js/tabs.js'), page);
    for (const s of srcs) assert.ok(existsSync(new URL(s, root)), `${page}: нет файла ${s}`);
  }
});

import { gunzipSync } from 'node:zlib';
const KIT_909 = '/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Core Library/Racks/Drum Racks/Drum Machines/909 Core Kit.adg';
test('909 Core Kit: пэды, ноты и макросы совпадают с файлом из Live', { skip: !existsSync(KIT_909) && 'Live не установлен' }, () => {
  const x = gunzipSync(readFileSync(KIT_909)).toString('utf8');
  const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const starts = [...x.matchAll(/<DrumBranchPreset /g)].map(m => m.index);
  const fromFile = starts.map((a, i) => {
    const seg = x.slice(a, starts[i + 1] ?? x.length);
    const name = /<UserName Value="([^"]+)"/.exec(seg)[1];
    const n = 128 - +[...seg.matchAll(/<ReceivingNote Value="(\d+)"/g)].pop()[1];
    const vis = +/<NumVisibleMacroControls Value="(\d+)"/.exec(seg)[1];
    const macros = [...seg.matchAll(/<MacroDisplayNames\.\d+ Value="([^"]*)"/g)].slice(0, 8).map(m => m[1]).filter(s => !/^Macro \d+$/.test(s)).slice(0, Math.max(vis, 1));
    return [`${NOTE[n % 12]}${Math.floor(n / 12) - 2}`, name, macros];
  }).sort((a, b) => json(G.PR_909_PADS).findIndex(p => p[0] === a[0]) - json(G.PR_909_PADS).findIndex(p => p[0] === b[0]));
  for (const [note, name, macros] of json(G.PR_909_PADS)) {
    const f = fromFile.find(p => p[0] === note);
    assert.ok(f, `нет пэда ${note}`);
    assert.equal(f[1], name, `${note}: имя`);
    for (const m of macros) assert.ok(f[2].includes(m), `${note}: макроса ${m} нет в файле (${f[2]})`);
  }
  const top = x.slice(0, x.indexOf('<DrumBranchPreset '));
  const rackMacros = [...x.matchAll(/<MacroDisplayNames\.(\d) Value="([^"]*)"/g)].slice(0, 8).map(m => m[2].trim());
  assert.deepEqual(rackMacros.map(m => (/^Macro \d$/.test(m) ? '—' : m)), json(G.PR_909_MACROS), 'макросы Drum Rack');
  assert.ok(top.length > 0);
});

test('меню из 4 пунктов на всех страницах сайта', () => {
  for (const page of ['index.html', 'midi.html', 'minilab.html', 'automation.html']) {
    const nav = /<nav>([\s\S]*?)<\/nav>/.exec(read(page))[1];
    for (const href of ['midi.html', 'minilab.html', 'automation.html']) assert.ok(nav.includes(`href="${href}"`), `${page}: нет ссылки ${href}`);
    assert.ok(!nav.includes('test_'), `${page}: ссылка на тестовую страницу`);
    assert.equal((nav.match(/class="on"/g) || []).length, page === 'index.html' ? 0 : 1, `${page}: подсвечен свой пункт`);
  }
});
