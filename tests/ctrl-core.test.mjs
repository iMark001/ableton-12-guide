import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../js/ctrl-core.js');

/* таблица как в data/minilab.js (официальная таблица Arturia) */
const CHART = {
  daw: { enc1: 86, enc2: 87, enc3: 89, enc4: 90, enc5: 110, enc6: 111, enc7: 116, enc8: 117, fad1: 14, fad2: 15, fad3: 30, fad4: 31 },
  user: { enc1: 74, enc2: 71, enc3: 76, enc4: 77, enc5: 93, enc6: 18, enc7: 19, enc8: 16, fad1: 82, fad2: 83, fad3: 85, fad4: 17 },
};

/* ---------- разбор MIDI-сообщений ---------- */
test('parseMidi: Control Change с каналом и значением', () => {
  assert.deepEqual(C.parseMidi([0xB0, 74, 100]), { type: 'cc', ch: 1, num: 74, value: 100 });
  assert.deepEqual(C.parseMidi(new Uint8Array([0xBF, 7, 0])), { type: 'cc', ch: 16, num: 7, value: 0 });
});
test('parseMidi: нота с velocity 0 — это отпускание', () => {
  assert.deepEqual(C.parseMidi([0x99, 36, 90]), { type: 'note-on', ch: 10, num: 36, value: 90 });
  assert.equal(C.parseMidi([0x99, 36, 0]).type, 'note-off');
  assert.equal(C.parseMidi([0x80, 60, 64]).type, 'note-off');
});
test('parseMidi: pitch bend собирается из двух байт', () => {
  assert.deepEqual(C.parseMidi([0xE0, 0, 64]), { type: 'pitch', ch: 1, num: null, value: 8192 });
});
test('parseMidi: sysex, aftertouch и пустые данные', () => {
  assert.equal(C.parseMidi([0xF0, 0x00, 0x20, 0x6B, 0xF7]).type, 'sysex');
  assert.equal(C.parseMidi([0xD0, 50]).type, 'aftertouch');
  assert.equal(C.parseMidi([]), null);
  assert.equal(C.parseMidi(null), null);
  assert.equal(C.parseMidi([0x40, 1, 2]), null, 'без статус-байта — не сообщение');
});

/* ---------- какая ручка и какая программа ---------- */
test('identify: ручки и фейдеры в программе DAW и User', () => {
  assert.deepEqual(C.identify(C.parseMidi([0xB0, 86, 10]), CHART), { id: 'enc1', program: 'daw' });
  assert.deepEqual(C.identify(C.parseMidi([0xB0, 16, 10]), CHART), { id: 'enc8', program: 'user' });
  assert.deepEqual(C.identify(C.parseMidi([0xB0, 31, 10]), CHART), { id: 'fad4', program: 'daw' });
  assert.deepEqual(C.identify(C.parseMidi([0xB0, 82, 10]), CHART), { id: 'fad1', program: 'user' });
});
test('identify: пэды (ноты 36–51 на канале 10), полоса модуляции и pitch', () => {
  assert.deepEqual(C.identify(C.parseMidi([0x99, 36, 90]), CHART), { id: 'pad1', bank: 'A' });
  assert.deepEqual(C.identify(C.parseMidi([0x99, 51, 90]), CHART), { id: 'pad8', bank: 'B' });
  assert.deepEqual(C.identify(C.parseMidi([0xB0, 1, 40]), CHART), { id: 'mod' });
  assert.deepEqual(C.identify(C.parseMidi([0xE0, 0, 70]), CHART), { id: 'pitch' });
});
test('identify: клавиши и неизвестные CC', () => {
  assert.deepEqual(C.identify(C.parseMidi([0x90, 60, 90]), CHART), { id: 'keys', note: 60 });
  assert.deepEqual(C.identify(C.parseMidi([0x99, 60, 90]), CHART), { id: 'keys', note: 60 }, 'нота вне пэдов на 10 канале — клавиша');
  assert.equal(C.identify(C.parseMidi([0xB0, 120, 0]), CHART), null);
  assert.equal(C.identify(null, CHART), null);
});

/* ---------- абсолютные или относительные значения ---------- */
test('guessRelative: обычное кручение — абсолютные значения', () => {
  assert.equal(C.guessRelative([40, 41, 42, 43, 44]), 'absolute');
  assert.equal(C.guessRelative([62, 63, 64, 65, 66]), 'absolute', 'середина хода, но значения растут');
  assert.equal(C.guessRelative([0, 0, 0, 0]), 'absolute', 'упёрлись в минимум');
});
test('guessRelative: Relative 1 (BinOffset) и Relative 2 (2’s Comp.)', () => {
  assert.equal(C.guessRelative([65, 65, 65, 65]), 'binoffset');
  assert.equal(C.guessRelative([63, 63, 62, 63]), 'binoffset');
  assert.equal(C.guessRelative([1, 1, 1, 2]), 'twos');
  assert.equal(C.guessRelative([127, 127, 126, 127, 1, 1]), 'twos');
});
test('guessRelative: мало данных или неоднозначно — null', () => {
  assert.equal(C.guessRelative([65, 65]), null);
  assert.equal(C.guessRelative([127, 127, 127, 127]), null, 'максимум абсолютной ручки или 2’s Comp. влево');
  assert.equal(C.guessRelative([]), null);
});

/* ---------- дорожка автоматизации ---------- */
const P = pts => pts.map(([t, v]) => ({ t, v }));

test('valueAt: линейно между точками, края — значение крайней точки', () => {
  const pts = P([[0, 0], [4, 1]]);
  assert.equal(C.valueAt(pts, 2), 0.5);
  assert.equal(C.valueAt(pts, -1), 0);
  assert.equal(C.valueAt(pts, 9), 1);
  assert.equal(C.valueAt([], 3, 0.25), 0.25, 'нет автоматизации — значение ручки');
});
test('valueAt: вертикальный скачок — берётся последняя точка в этот момент', () => {
  const pts = P([[0, 0], [2, 0], [2, 1], [4, 1]]);
  assert.equal(C.valueAt(pts, 2), 1);
  assert.equal(C.valueAt(pts, 1.999), 0);
});
test('replaceSpan: запись поверх пустой дорожки = записанные точки', () => {
  const rec = P([[1, 0.2], [2, 0.5], [3, 0.9]]);
  assert.deepEqual(C.replaceSpan([], rec), rec);
});
test('replaceSpan: внутри участка старые точки заменяются, снаружи остаются, края — старые значения', () => {
  const old = Object.freeze(P([[0, 0], [2, 0.5], [4, 1], [8, 1]]).map(Object.freeze));
  const out = C.replaceSpan(old, P([[3, 0.1], [5, 0.2]]));
  assert.deepEqual(out, P([[0, 0], [2, 0.5], [3, 0.75], [3, 0.1], [5, 0.2], [5, 1], [8, 1]]));
  assert.equal(old.length, 4, 'исходный массив не меняется');
});
test('replaceSpan: соседние ступеньки карандаша не сливаются в рампу', () => {
  let pts = C.replaceSpan([], P([[0, 0.2], [1, 0.2]]));
  pts = C.replaceSpan(pts, P([[1, 0.8], [2, 0.8]]));
  assert.deepEqual(pts, P([[0, 0.2], [1, 0.2], [1, 0.8], [2, 0.8], [2, 0.2]]));
  pts = C.replaceSpan(pts, P([[0, 0.5], [1, 0.5]]));
  assert.equal(C.valueAt(pts, 0.5), 0.5);
  assert.equal(C.valueAt(pts, 1.5), 0.8, 'вторая ступенька осталась');
});
test('replaceSpan: пустая запись ничего не меняет', () => {
  const old = P([[0, 0], [4, 1]]);
  assert.deepEqual(C.replaceSpan(old, []), old);
});
test('simplify: лишние точки на прямой убираются, изгибы остаются', () => {
  const line = Array.from({ length: 11 }, (_, i) => ({ t: i, v: i / 10 }));
  assert.deepEqual(C.simplify(line, 0.01), P([[0, 0], [10, 1]]));
  const zig = P([[0, 0], [1, 1], [2, 0], [3, 1]]);
  assert.equal(C.simplify(zig, 0.05).length, 4);
  assert.deepEqual(C.simplify(P([[0, 0.3]]), 0.1), P([[0, 0.3]]));
});
test('shapePoints: формы Live в пределах выделения и диапазона', () => {
  for (const kind of C.SHAPES) {
    const pts = C.shapePoints(kind, 2, 6, 0.2, 0.8);
    assert.ok(pts.length >= 2, kind);
    assert.equal(pts[0].t, 2, `${kind}: начало`);
    assert.equal(pts[pts.length - 1].t, 6, `${kind}: конец`);
    for (const p of pts) assert.ok(p.t >= 2 && p.t <= 6 && p.v >= 0.2 - 1e-9 && p.v <= 0.8 + 1e-9, `${kind}: ${JSON.stringify(p)}`);
    for (let i = 1; i < pts.length; i++) assert.ok(pts[i].t >= pts[i - 1].t, `${kind}: время не идёт назад`);
  }
  assert.deepEqual(C.shapePoints('ramp-up', 0, 4, 0, 1), P([[0, 0], [4, 1]]));
  assert.throws(() => C.shapePoints('spiral', 0, 1, 0, 1));
});
test('pathD: SVG-путь по точкам (верх = 1, низ = 0)', () => {
  assert.equal(C.pathD(P([[0, 0], [8, 1]]), { w: 100, h: 50, len: 8 }), 'M0,50 L100,0');
  assert.equal(C.pathD([], { w: 100, h: 50, len: 8, def: 0.5 }), 'M0,25 L100,25');
  assert.equal(C.pathD(P([[4, 1]]), { w: 100, h: 50, len: 8 }), 'M0,0 L50,0 L100,0', 'до первой и после последней точки — ровная линия');
});
