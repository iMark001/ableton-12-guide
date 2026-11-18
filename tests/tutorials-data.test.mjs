import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const TUT_FILES = readdirSync(new URL('data/', root)).filter(f => /^tut-[a-z]+\.js$/.test(f)).sort();

const ctx = vm.createContext({});
for (const f of ['data/core.js', 'data/catalog.js', 'data/tutorials.js', ...TUT_FILES.map(f => `data/${f}`)]) vm.runInContext(read(f), ctx);
const json = v => JSON.parse(JSON.stringify(v)); // объекты из vm — в наш realm
const G = json(vm.runInContext('({ STYLES, INSTRUMENTS, CATALOG, TUT_TABS, TUTORIALS, TUT_SOUNDS, TUT_STYLE })', ctx));
const { STYLES, INSTRUMENTS, TUT_TABS, TUTORIALS, TUT_SOUNDS, TUT_STYLE } = G;
const DEVICE_IDS = new Set(G.CATALOG.map(d => d.id));
const TAB_IDS = new Set(TUT_TABS.map(t => t.id));

const allStrings = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(x => allStrings(x, out));
  return out;
};

/* Названия паков, вендоров, их авторских стоек и артистов из исходных материалов — на сайт не попадают. */
const BANNED = [
  /production\s*music\s*live/i, /\bPML\b/, /audioreakt/i, /AYNIL/, /all you need is live/i, /unison (midi|theory|collection|team)/i,
  /sickrate/i, /\bSIIK\b/i, /\bABT\b/, /odd frequency/i, /ghosthack/i, /lotus\s*tunes/i, /sounds\s*mania/i, /studio\s*tronnic/i,
  /musicore/i, /house of loop/i, /bluezone/i, /producer school/i, /JØRD/i, /\bAlnt\b/i, /wildvibes/i,
  /kickpunch/i, /kickverb/i, /bombass/i, /rizer/i, /dubchord/i, /joyhauser/i, /fat synth/i, /drone\s?machine/i,
  /guido/i, /bodzin/i, /tale of us/i, /afterlife/i, /armin/i, /\bzedd\b/i, /calvin harris/i, /\bmassive\b/i, /ozone/i, /izotope/i,
  /instagram/i, /youtube/i,
];
/* Разделы сайта, на которые можно ссылаться: страница → допустимые якоря. */
const MIDI_TABS = ['clock', 'chords', 'detect', 'compat', 'melody'];
const MINILAB_TABS = ['setup', 'controls', 'layouts', 'tester'];
const AUTO_TABS = ['basics', 'record', 'edit', 'recipes'];
function linkOk(href) {
  const m = /^(index|midi|minilab|automation|tutorials)\.html#([a-z0-9-]+)$/.exec(href);
  if (!m) return false;
  const [, page, anchor] = m;
  if (page === 'index') {
    if (anchor.startsWith('d-')) return DEVICE_IDS.has(anchor.slice(2));
    if (anchor.startsWith('p-')) return anchor.slice(2) in INSTRUMENTS;
    return anchor === 'parts';
  }
  if (page === 'midi') return MIDI_TABS.includes(anchor);
  if (page === 'minilab') return MINILAB_TABS.includes(anchor);
  if (page === 'automation') return AUTO_TABS.includes(anchor);
  return TAB_IDS.has(anchor);
}

test('вкладки: 8 штук, у каждой id, иконка, заголовок, подзаголовок', () => {
  assert.deepEqual(TUT_TABS.map(t => t.id), ['start', 'drums', 'harmony', 'sound', 'serum', 'arrange', 'mix', 'work']);
  for (const t of TUT_TABS) {
    assert.ok(t.icon && t.title && t.sub, `вкладка ${t.id}: icon/title/sub`);
  }
});

test('по файлу данных на вкладку, все файлы подключены к странице', () => {
  assert.deepEqual(TUT_FILES, TUT_TABS.map(t => `tut-${t.id}.js`).sort());
  for (const page of ['test_tutorials.html', 'tutorials.html']) {
    if (!existsSync(new URL(page, root))) continue;
    const html = read(page);
    for (const f of ['data/tutorials.js', ...TUT_FILES.map(f => `data/${f}`)]) {
      assert.ok(html.includes(`src="${f}"`), `${page}: нет ${f}`);
    }
  }
});

test('уроков достаточно: всего ≥ 45, на каждой вкладке ≥ 4', () => {
  assert.ok(TUTORIALS.length >= 45, `всего ${TUTORIALS.length}`);
  for (const t of TUT_TABS) {
    const n = TUTORIALS.filter(x => x.tab === t.id).length;
    assert.ok(n >= 4, `${t.id}: ${n}`);
  }
});

test('у каждого урока заполнены поля, id уникальны', () => {
  const seen = new Set();
  for (const t of TUTORIALS) {
    assert.match(t.id, /^[a-z0-9-]+$/, `id ${t.id}`);
    assert.ok(!seen.has(t.id), `повтор id ${t.id}`);
    seen.add(t.id);
    assert.ok(TAB_IDS.has(t.tab), `${t.id}: вкладка ${t.tab}`);
    assert.ok(t.title && t.title.length <= 70, `${t.id}: title`);
    assert.ok(t.goal && t.goal.length >= 20 && t.goal.length <= 260, `${t.id}: goal (${t.goal?.length})`);
    assert.ok(t.why && t.why.length >= 20, `${t.id}: why`);
    assert.ok(Array.isArray(t.styles), `${t.id}: styles — массив`);
    assert.ok(Array.isArray(t.devices), `${t.id}: devices — массив`);
  }
});

test('шаги: минимум 2, у каждого «сделай» и «что увидишь»', () => {
  for (const t of TUTORIALS) {
    assert.ok(Array.isArray(t.steps) && t.steps.length >= 2, `${t.id}: шагов ${t.steps?.length}`);
    t.steps.forEach((s, i) => {
      assert.ok(typeof s.do === 'string' && s.do.length >= 8, `${t.id} шаг ${i + 1}: do`);
      assert.ok(typeof s.see === 'string' && s.see.length >= 8, `${t.id} шаг ${i + 1}: see`);
    });
  }
});

test('стили — только из 9 стилей сайта', () => {
  for (const t of TUTORIALS) for (const s of t.styles) assert.ok(s in STYLES, `${t.id}: стиль ${s}`);
});

test('устройства — только из каталога 85 устройств', () => {
  for (const t of TUTORIALS) {
    for (const d of t.devices) assert.ok(DEVICE_IDS.has(d), `${t.id}: устройство ${d}`);
    assert.equal(new Set(t.devices).size, t.devices.length, `${t.id}: повтор устройства`);
  }
});

test('ссылки ведут на существующие разделы сайта', () => {
  for (const t of TUTORIALS) {
    for (const l of t.links || []) {
      assert.ok(l.label, `${t.id}: подпись ссылки`);
      assert.ok(linkOk(l.href), `${t.id}: ссылка ${l.href}`);
    }
  }
});

test('звуковые примеры: звуки известны, сетки по 16 шагов на такт, громкость 0–127, свинг 0–0.75 или стиль', () => {
  const demos = TUTORIALS.flatMap(t => [t.demo, ...Object.values(t.byStyle || {}).map(v => v.demo)].filter(Boolean).map(d => [t.id, d]));
  assert.ok(demos.length >= 5, `примеров ${demos.length}`);
  for (const [id, d] of demos) {
    assert.ok(d.bpm === 'style' || (d.bpm >= 60 && d.bpm <= 180), `${id}: bpm`);
    const steps = 16 * (d.bars || 1);
    for (const side of ['a', 'b']) {
      const v = d[side];
      assert.ok(v && v.label && Array.isArray(v.tracks) && v.tracks.length, `${id}: вариант ${side}`);
      for (const tr of v.tracks) {
        assert.ok(TUT_SOUNDS.includes(tr.sound), `${id}: звук ${tr.sound}`);
        assert.equal(tr.steps.length, steps, `${id}: ${tr.sound} — ${steps} шагов`);
        for (const x of tr.steps) assert.ok(Number.isInteger(x) && x >= 0 && x <= 127, `${id}: громкость ${x}`);
        const hits = tr.steps.filter(Boolean).length;
        if ('swing' in tr) assert.ok(tr.swing === 'style' || (tr.swing >= 0 && tr.swing <= 0.75), `${id}: swing`);
        if ('duck' in tr) assert.ok(tr.duck >= 0 && tr.duck <= 1, `${id}: duck`);
        if ('pan' in tr) assert.ok(tr.pan >= -1 && tr.pan <= 1, `${id}: pan`);
        if (tr.chords) assert.equal(tr.chords.length, hits, `${id}: аккордов столько же, сколько ударов`);
        if (tr.notes) assert.equal(tr.notes.length, hits, `${id}: нот столько же, сколько ударов`);
      }
    }
  }
});

test('стили: темп и свинг заданы для всех 9 стилей', () => {
  const { TUT_STYLE } = json(vm.runInContext('({ TUT_STYLE })', ctx));
  for (const id of Object.keys(STYLES)) {
    const s = TUT_STYLE[id];
    assert.ok(s && s.bpm >= 60 && s.bpm <= 180 && s.range && s.swing >= 0 && s.swing <= 0.75, `стиль ${id}`);
  }
});

test('новый формат: 3–4 строки, схемы известных типов, устройства и партии существуют, правки стилей — по 9 стилям', () => {
  const PRESETS = id => { const c = vm.createContext({ registerDevice: d => { c.d = d; } }); vm.runInContext(read(`data/devices/${id}.js`), c); return json(c.d); };
  const v2 = TUTORIALS;
  const check = (id, v) => {
    if (v.short) assert.ok(v.short.length >= 3 && v.short.length <= 4 && v.short.every(s => typeof s === 'string' && s.length <= 90), `${id}: short`);
    for (const b of [...(v.visual || []), ...(v.serum || [])]) {
      assert.ok(['chain', 'lanes', 'roll', 'duck', 'serum', 'serumrows', 'prog', 'recipes', 'blocks', 'shot'].includes(b.type), `${id}: схема ${b.type}`);
      if (b.type === 'blocks') for (const r of [...b.rows.flatMap(x => x.on), ...(b.sections || []).map(x => x.slice(1))]) assert.ok(r[0] >= 0 && r[1] > 0 && r[0] + r[1] <= b.bars + 1e-9, `${id}: блок ${r}`);
      if (b.type === 'shot') {
        assert.ok(existsSync(new URL(b.src, root)), `${id}: нет файла ${b.src}`);
        assert.ok(b.w > 0 && b.h > 0 && b.alt, `${id}: размеры и alt скриншота`);
        for (const m of b.marks || []) assert.ok(m.x >= 0 && m.y >= 0 && m.x + m.w <= 100.5 && m.y + m.h <= 100.5 && m.label, `${id}: метка ${m.label}`);
      }
      if (b.type === 'serumrows') assert.ok(b.rows.length >= 3 && b.rows.every(r => r.length === 2 && r[0] && r[1]), `${id}: строки Serum`);
      if (b.type === 'chain') for (const n of b.nodes) {
        assert.ok(DEVICE_IDS.has(n.dev), `${id}: устройство ${n.dev}`);
        const d = PRESETS(n.dev);
        if (n.part) assert.ok(d.presets && d.presets[n.part], `${id}: у ${n.dev} нет партии ${n.part}`);
        for (const c of [...(n.show || []), ...(n.set || []).map(s => s.c)]) assert.ok(d.controls.some(x => x.id === c), `${id}: у ${n.dev} нет ручки ${c}`);
      }
      if (b.type === 'lanes') for (const l of b.lanes) for (const [x, y] of l.pts) assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `${id}: точка ${x},${y}`);
      if (b.type === 'roll') for (const [m, st, len] of b.notes) assert.ok(m >= 0 && m <= 127 && st >= 0 && st + len <= (b.bars || 4) * 16, `${id}: нота ${m}`);
    }
  };
  for (const t of v2) {
    check(t.id, t);
    const seen = new Set();
    for (const [key, v] of Object.entries(t.byStyle || {})) {
      for (const s of key.split(' ')) { assert.ok(s in STYLES, `${t.id}: стиль ${s}`); assert.ok(!seen.has(s), `${t.id}: стиль ${s} дважды`); seen.add(s); }
      check(`${t.id}/${key}`, v);
    }
  }
});

test('в текстах нет названий паков, вендоров, артистов и HTML', () => {
  const strings = [...allStrings(TUT_TABS), ...allStrings(TUTORIALS)];
  for (const s of strings) {
    for (const re of BANNED) assert.ok(!re.test(s), `запрещённое «${re}» в: ${s.slice(0, 80)}`);
    assert.ok(!/[<>]/.test(s), `HTML в тексте: ${s.slice(0, 80)}`);
  }
});

test('в HTML-страницах туториалов нет запрещённых названий', () => {
  for (const page of ['test_tutorials.html', 'tutorials.html', 'js/tutorials/page.js', 'js/tutorials/groove.js']) {
    if (!existsSync(new URL(page, root))) continue;
    const txt = read(page);
    for (const re of BANNED.filter(r => !/youtube|instagram/.source.includes(r.source))) {
      assert.ok(!re.test(txt), `${page}: «${re}»`);
    }
  }
});

test('у каждого урока: 3–4 короткие строки, партия из справочника, есть что показать', () => {
  for (const t of TUTORIALS) {
    assert.ok(Array.isArray(t.short), `${t.id}: нет short`);
    if (t.part) assert.ok(t.part in INSTRUMENTS, `${t.id}: партия ${t.part}`);
    const shows = t.visual || t.devices.length || t.prog || t.recipes || t.demo || t.tab === 'work' || t.tab === 'start';
    assert.ok(shows, `${t.id}: нечего показать на схеме`);
  }
});

test('подстановки в тексте только известные: {bpm}, {style}, {ms:x}', () => {
  for (const s of allStrings(TUTORIALS)) {
    for (const m of s.matchAll(/\{([^}]*)\}/g)) assert.ok(/^(bpm|style|ms:[\d.]+)$/.test(m[1]), `«${m[0]}» в: ${s.slice(0, 60)}`);
  }
});

test('жанры: кик из 16 шагов, прогрессия совпадает с прогрессией на странице MIDI', () => {
  const src = read('js/midi/chords.js');
  const progs = vm.runInNewContext(src.slice(src.indexOf('const PROGS = ['), src.indexOf('];', src.indexOf('const PROGS = [')) + 2) + ';PROGS');
  for (const [id, s] of Object.entries(TUT_STYLE)) {
    assert.ok(s.kick.length && s.kick.every(i => Number.isInteger(i) && i >= 0 && i < 16), `${id}: кик`);
    const p = progs.find(x => x.id === s.prog.id);
    assert.ok(p, `${id}: прогрессия ${s.prog.id}`);
    assert.deepEqual([...p.deg], s.prog.deg, `${id}: ступени`);
    assert.equal(p.fam, s.prog.fam, `${id}: лад`);
    assert.equal(!!p.seventh, !!s.prog.seventh, `${id}: септаккорды`);
    assert.ok(p.tags.includes(id), `${id}: прогрессия ${p.id} не помечена этим жанром на странице MIDI`);
  }
});
