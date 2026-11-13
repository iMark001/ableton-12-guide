import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const M = require('../js/music-core.js');

const pcsOf = names => names.map(n => M.pcOf(n));

/* ---------- ноты и названия ---------- */
test('pcOf понимает диезы и бемоли', () => {
  assert.equal(M.pcOf('C'), 0);
  assert.equal(M.pcOf('C#'), 1);
  assert.equal(M.pcOf('Db'), 1);
  assert.equal(M.pcOf('B'), 11);
  assert.equal(M.pcOf('Cb'), 11);
});

test('midiName использует нотацию Ableton: MIDI 60 = C3', () => {
  assert.equal(M.midiName(60), 'C3');
  assert.equal(M.midiName(36), 'C1');
  assert.equal(M.midiName(61), 'C#3');
  assert.equal(M.midiName(0), 'C-2');
});

test('pretty и ruName показывают ♯/♭ и русские названия', () => {
  assert.equal(M.pretty('C#'), 'C♯');
  assert.equal(M.pretty('Bb'), 'B♭');
  assert.equal(M.ruName('C#'), 'до♯');
  assert.equal(M.ruName('Bb'), 'си♭');
  assert.equal(M.ruName('G'), 'соль');
});

/* ---------- гаммы ---------- */
test('гаммы названы как в Live 12', () => {
  assert.equal(M.SCALES.major.name, 'Major');
  assert.equal(M.SCALES.minor.name, 'Minor');
  assert.equal(M.SCALES.minorPent.name, 'Minor Pentatonic');
  assert.equal(M.SCALES.harmonicMinor.name, 'Harmonic Minor');
});

test('spellScale пишет каждую букву один раз и выбирает удобные знаки', () => {
  assert.deepEqual(M.spellScale(0, 'major').notes, ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  assert.deepEqual(M.spellScale(9, 'minor').notes, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.deepEqual(M.spellScale(3, 'major').notes, ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D']);
  assert.deepEqual(M.spellScale(1, 'minor').notes, ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B']);
  assert.equal(M.spellScale(1, 'major').root, 'Db');
  assert.equal(M.spellScale(10, 'minor').root, 'Bb');
  assert.equal(M.spellScale(3, 'minor').root, 'Eb');
});

test('spellScale работает и для пентатоник и блюза', () => {
  assert.deepEqual(M.spellScale(9, 'minorPent').notes, ['A', 'C', 'D', 'E', 'G']);
  assert.deepEqual(M.spellScale(9, 'minorBlues').notes, ['A', 'C', 'D', 'Eb', 'E', 'G']);
});

test('scalePcs возвращает высоты нот гаммы', () => {
  assert.deepEqual(M.scalePcs(0, 'major'), [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual(M.scalePcs(9, 'minor'), [9, 11, 0, 2, 4, 5, 7]);
});

/* ---------- аккорды ---------- */
test('формулы аккордов как в видео: мажор 4+3, минор 3+4, ум. 3+3, ув. 4+4', () => {
  assert.deepEqual(M.CHORDS.maj.steps, [4, 3]);
  assert.deepEqual(M.CHORDS.min.steps, [3, 4]);
  assert.deepEqual(M.CHORDS.dim.steps, [3, 3]);
  assert.deepEqual(M.CHORDS.aug.steps, [4, 4]);
  assert.deepEqual(M.chordPcs(0, 'maj'), [0, 4, 7]);
  assert.deepEqual(M.chordPcs(9, 'min'), [9, 0, 4]);
});

test('identifyChord узнаёт тип по интервалам', () => {
  assert.equal(M.identifyChord([0, 4, 7]), 'maj');
  assert.equal(M.identifyChord([0, 3, 7, 10]), 'm7');
  assert.equal(M.identifyChord([0, 1, 2]), null);
});

test('diatonicChords: аккорды до мажора и ля минора', () => {
  const c = M.diatonicChords(0, 'major', 3);
  assert.deepEqual(c.map(x => x.name), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
  assert.deepEqual(c.map(x => x.roman), ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
  const a = M.diatonicChords(9, 'minor', 3);
  assert.deepEqual(a.map(x => x.name), ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']);
  assert.deepEqual(a.map(x => x.roman), ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']);
  const a7 = M.diatonicChords(9, 'minor', 4);
  assert.deepEqual(a7.map(x => x.name), ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']);
});

test('diatonicChords: ноты аккорда записаны буквами гаммы', () => {
  const eb = M.diatonicChords(3, 'major', 3);
  assert.deepEqual(eb[0].notes, ['Eb', 'G', 'Bb']);
  assert.equal(eb[1].name, 'Fm');
});

/* ---------- Camelot и совместимость ---------- */
test('camelot: C = 8B, Am = 8A, Cm = 5A, F#m = 11A, B = 1B', () => {
  assert.equal(M.camelot(0, 'major'), '8B');
  assert.equal(M.camelot(9, 'minor'), '8A');
  assert.equal(M.camelot(0, 'minor'), '5A');
  assert.equal(M.camelot(6, 'minor'), '11A');
  assert.equal(M.camelot(11, 'major'), '1B');
});

test('KEYS24 содержит 24 тональности', () => {
  assert.equal(M.KEYS24.length, 24);
  assert.equal(new Set(M.KEYS24.map(k => k.camelot)).size, 24);
});

test('sharedNotes: общие ноты между тональностями', () => {
  const C = { root: 0, scale: 'major' };
  assert.equal(M.sharedNotes(C, { root: 9, scale: 'minor' }), 7);
  assert.equal(M.sharedNotes(C, { root: 7, scale: 'major' }), 6);
  assert.equal(M.sharedNotes(C, { root: 2, scale: 'major' }), 5);
  assert.equal(M.sharedNotes(C, { root: 6, scale: 'major' }), 2);
});

test('compat: уровни совместимости', () => {
  const Am = { root: 9, scale: 'minor' };
  assert.equal(M.compat(Am, Am).level, 'same');
  assert.equal(M.compat(Am, { root: 0, scale: 'major' }).level, 'perfect');
  assert.equal(M.compat(Am, { root: 4, scale: 'minor' }).level, 'great');
  assert.equal(M.compat(Am, { root: 11, scale: 'minor' }).level, 'careful');
  assert.equal(M.compat(Am, { root: 9, scale: 'major' }).level, 'mood');
  assert.equal(M.compat(Am, { root: 3, scale: 'minor' }).level, 'clash');
});

/* ---------- транспонирование ---------- */
test('shortestShift: кратчайший сдвиг в полутонах', () => {
  assert.equal(M.shortestShift(9, 0), 3);
  assert.equal(M.shortestShift(0, 9), -3);
  assert.equal(M.shortestShift(0, 6), 6);
  assert.equal(M.shortestShift(5, 5), 0);
});

test('transposePlan учитывает параллельную тональность с теми же нотами', () => {
  const p = M.transposePlan({ root: 0, scale: 'major' }, { root: 9, scale: 'minor' });
  assert.equal(p.shift, 0);
  const q = M.transposePlan({ root: 9, scale: 'minor' }, { root: 0, scale: 'minor' });
  assert.equal(q.shift, 3);
});

/* ---------- определение тональности ---------- */
test('matchKeys находит тональности, где есть все отмеченные ноты', () => {
  const res = M.matchKeys(pcsOf(['C', 'D', 'E', 'F', 'G', 'A', 'B']));
  const labels = res.filter(r => r.missing === 0).map(r => r.root + r.scale);
  assert.deepEqual(labels.sort(), ['0major', '9minor'].sort());
});

test('matchKeys ставит первой тональность с отмеченной домашней нотой', () => {
  const res = M.matchKeys(pcsOf(['C', 'D', 'E', 'F', 'G', 'A', 'B']), 9);
  assert.equal(res[0].root, 9);
  assert.equal(res[0].scale, 'minor');
});

test('detectKey по гистограмме гаммы ля минор с упором на A', () => {
  const w = new Array(12).fill(0);
  [[9, 8], [0, 4], [4, 5], [2, 2], [11, 1], [5, 2], [7, 2]].forEach(([pc, v]) => { w[pc] = v; });
  const top = M.detectKey(w)[0];
  assert.equal(top.root, 9);
  assert.equal(top.scale, 'minor');
});

/* ---------- MIDI-файлы ---------- */
test('writeMidi → parseMidi возвращает те же ноты', () => {
  const notes = [
    { pitch: 57, start: 0, dur: 480, vel: 100 },
    { pitch: 60, start: 0, dur: 480, vel: 90 },
    { pitch: 64, start: 480, dur: 960, vel: 80 },
  ];
  const bytes = M.writeMidi({ notes, ppq: 480, bpm: 124, name: 'Test' });
  const parsed = M.parseMidi(bytes);
  assert.equal(parsed.division, 480);
  assert.equal(parsed.bpm, 124);
  const got = parsed.notes.map(n => [n.pitch, n.start, n.dur, n.vel]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  assert.deepEqual(got, notes.map(n => [n.pitch, n.start, n.dur, n.vel]));
});

test('parseMidi бросает понятную ошибку на мусоре', () => {
  assert.throws(() => M.parseMidi(new Uint8Array([1, 2, 3, 4, 5])), /MIDI/);
  const bytes = M.writeMidi({ notes: [{ pitch: 60, start: 0, dur: 10, vel: 1 }] });
  assert.throws(() => M.parseMidi(bytes.slice(0, bytes.length - 6)), /MIDI/);
});

test('pcHistogram пропускает барабанный 10-й канал', () => {
  const w = M.pcHistogram([
    { pitch: 60, dur: 100, channel: 0 },
    { pitch: 36, dur: 999, channel: 9 },
  ]);
  assert.equal(w[0], 100);
});

/* ---------- реальные файлы пользователя (только локально) ---------- */
const PACK = join(homedir(), 'Desktop/Разработка/Ableton Help');
const cases = [
  ['MIDI Pack — Не в этой жизни/00_Full_All_Tracks.mid', 0],
  ['MIDI Pack — Не в этой жизни (C#m оригинал)/00_Full_All_Tracks.mid', 1],
];
for (const [rel, root] of cases) {
  const file = join(PACK, rel);
  test(`detectKey на реальном файле: ${rel}`, { skip: !existsSync(file) && 'файла нет на этом компьютере' }, () => {
    const parsed = M.parseMidi(new Uint8Array(readFileSync(file)));
    const top = M.detectKey(M.pcHistogram(parsed.notes))[0];
    assert.equal(top.root, root);
    assert.equal(top.scale, 'minor');
  });
}

/* ---------- v2: названия Ableton, лупы из других тональностей, следующий аккорд ---------- */
test('keyName: как в Ableton + код DJ-программ для сравнения', () => {
  const k = M.keyName(9, 'minor');
  assert.equal(k.ableton, 'A Minor');
  assert.equal(k.dj, '8A');
  assert.equal(M.keyName(1, 'major').ableton, 'D♭ Major');
  assert.equal(M.keyName(2, 'dorian').dj, null);
});

test('otherKeysPlan: 23 тональности, сначала «бери как есть», сдвиги кратчайшие', () => {
  const plan = M.otherKeysPlan({ root: 9, scale: 'minor' });
  assert.equal(plan.length, 23);
  const asis = plan.filter(p => p.action === 'asis').map(p => p.key.short).sort();
  assert.deepEqual(asis, ['C', 'Dm', 'Em', 'F', 'G'].sort());
  assert.equal(plan[0].action, 'asis');
  const fsm = plan.find(p => p.key.root === 6 && p.key.scale === 'minor');
  assert.equal(fsm.action, 'shift');
  assert.equal(fsm.shift, 3);
  for (const p of plan) assert.ok(Math.abs(p.shift) <= 6);
});

test('nextChords: после i в миноре естественно VI, VII и iv', () => {
  const n = M.nextChords('minor', 0);
  assert.equal(n[5], 3); assert.equal(n[6], 3); assert.equal(n[3], 3);
  assert.equal(M.nextChords('major', 4)[0], 3);
});

test('zip: архив читается системным unzip', async () => {
  const Z = require('../js/zip.js');
  const { execFileSync } = await import('node:child_process');
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'zip-'));
  const a = M.writeMidi({ notes: [{ pitch: 60, start: 0, dur: 480 }] });
  const file = join(dir, 'parts.zip');
  writeFileSync(file, Z.zip([{ name: '01 Бас.mid', data: a }, { name: '02 Пэд.mid', data: a }]));
  const out = execFileSync('unzip', ['-t', file]).toString();
  assert.match(out, /No errors detected/);
});

test('transposePlan: мажорный луп в минорном проекте сдвигаем к параллельному мажору (те же ноты)', () => {
  const p = M.transposePlan({ root: 9, scale: 'major' }, { root: 9, scale: 'minor' });
  assert.equal(p.shift, 3); assert.equal(p.target.root, 0); assert.equal(p.target.scale, 'major');
  const q = M.transposePlan({ root: 8, scale: 'major' }, { root: 9, scale: 'minor' });
  assert.equal(q.shift, 4); assert.equal(q.via, 'relative');
});

test('заимствованные аккорды: в A Minor — D (IV), E (V), B♭ (♭II); в C Major — Fm, A♭, B♭', () => {
  assert.equal(M.chordById(9, 'minor', 'IV').name, 'D');
  assert.equal(M.chordById(9, 'minor', 'V').name, 'E');
  assert.equal(M.chordById(9, 'minor', 'bII').name, 'Bb');
  assert.equal(M.chordById(0, 'major', 'iv').name, 'Fm');
  assert.equal(M.chordById(0, 'major', 'bVI').name, 'Ab');
  assert.equal(M.chordById(0, 'major', 'bVII').name, 'Bb');
  assert.equal(M.chordById(9, 'minor', 5).name, 'F');
  assert.equal(M.nextChords('minor', 'bII')[0], 3);
});
