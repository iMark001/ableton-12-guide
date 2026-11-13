/* Теория музыки для гида: ноты, гаммы, аккорды, Camelot, совместимость,
   определение тональности, чтение и запись MIDI-файлов.
   Чистые функции без DOM: работают в браузере (window.MusicCore) и в node (require). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MusicCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const mod12 = n => ((n % 12) + 12) % 12;
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const RU = { C: 'до', D: 'ре', E: 'ми', F: 'фа', G: 'соль', A: 'ля', B: 'си' };

/* ---------- ноты ---------- */
function pcOf(name) {
  const m = /^([A-G])(#{0,2}|b{0,2})$/.exec(String(name));
  if (!m) throw new Error(`Неизвестная нота: ${name}`);
  const acc = m[2].startsWith('#') ? m[2].length : -m[2].length;
  return mod12(LETTER_PC[m[1]] + acc);
}
const noteName = (pc, flat) => (flat ? FLAT : SHARP)[mod12(pc)];
const accText = s => s.replace(/##/g, '𝄪').replace(/#/g, '♯').replace(/bb/g, '𝄫').replace(/b/g, '♭');
const pretty = name => name[0] + accText(name.slice(1));
const ruName = name => RU[name[0]] + accText(name.slice(1));
/* Ableton: MIDI 60 = C3 */
const octaveOf = midi => Math.floor(midi / 12) - 2;
const midiName = (midi, name) => (name || SHARP[mod12(midi)]) + octaveOf(midi);

/* ---------- гаммы (названия как в меню Scale в Live 12) ---------- */
const SCALES = {
  major:            { name: 'Major',             ru: 'Мажор',               iv: [0, 2, 4, 5, 7, 9, 11], mood: 'Светлый, радостный. Классика house и pop.' },
  minor:            { name: 'Minor',             ru: 'Минор',               iv: [0, 2, 3, 5, 7, 8, 10], mood: 'Грустный, глубокий. Основа techno, melodic и afro.' },
  dorian:           { name: 'Dorian',            ru: 'Дорийский',           iv: [0, 2, 3, 5, 7, 9, 10], mood: 'Минор посветлее, «соул». Deep house, garage.' },
  phrygian:         { name: 'Phrygian',          ru: 'Фригийский',          iv: [0, 1, 3, 5, 7, 8, 10], mood: 'Тёмный, восточный оттенок. Тёмное techno.' },
  lydian:           { name: 'Lydian',            ru: 'Лидийский',           iv: [0, 2, 4, 6, 7, 9, 11], mood: 'Мечтательный, «парящий» мажор. Ambient.' },
  mixolydian:       { name: 'Mixolydian',        ru: 'Миксолидийский',      iv: [0, 2, 4, 5, 7, 9, 10], mood: 'Мажор с хитрецой, фанк и диско.' },
  locrian:          { name: 'Locrian',           ru: 'Локрийский',          iv: [0, 1, 3, 5, 6, 8, 10], mood: 'Неустойчивый, тревожный. Редко.' },
  harmonicMinor:    { name: 'Harmonic Minor',    ru: 'Гармонический минор', iv: [0, 2, 3, 5, 7, 8, 11], mood: 'Драматичный минор, «восточная» нота. Melodic techno.' },
  melodicMinor:     { name: 'Melodic Minor',     ru: 'Мелодический минор',  iv: [0, 2, 3, 5, 7, 9, 11], mood: 'Джазовый минор, мягкий и сложный.' },
  phrygianDominant: { name: 'Phrygian Dominant', ru: 'Фригийский доминант', iv: [0, 1, 4, 5, 7, 8, 10], mood: 'Ближний Восток, афро и organic house.' },
  majorPent:        { name: 'Major Pentatonic',  ru: 'Мажорная пентатоника', iv: [0, 2, 4, 7, 9],       mood: '5 нот, фальшивить нечем. Хуки и плаки.' },
  minorPent:        { name: 'Minor Pentatonic',  ru: 'Минорная пентатоника', iv: [0, 3, 5, 7, 10],      mood: '5 нот, всегда звучит. Басы и лиды.' },
  minorBlues:       { name: 'Minor Blues',       ru: 'Блюзовая',            iv: [0, 3, 5, 6, 7, 10],    mood: 'Пентатоника + «блюзовая» нота.' },
};
/* У неполных гамм ноты пишем буквами «родительской» семинотной гаммы */
const PARENT = { majorPent: 'major', minorPent: 'minor', minorBlues: 'minor' };

const scalePcs = (rootPc, scaleId) => SCALES[scaleId].iv.map(i => mod12(rootPc + i));
const accCount = names => names.reduce((s, n) => s + (n.length - 1), 0);
const hasDouble = names => names.some(n => /##|bb/.test(n.slice(1)));

function spellBy(rootName, iv) {
  const li = LETTERS.indexOf(rootName[0]);
  const rpc = pcOf(rootName);
  return iv.map((step, i) => {
    const letter = LETTERS[(li + i) % 7];
    let d = mod12(rpc + step) - LETTER_PC[letter];
    if (d > 6) d -= 12;
    if (d < -6) d += 12;
    return letter + (d > 0 ? '#'.repeat(d) : 'b'.repeat(-d));
  });
}
function rootCandidates(pc) {
  return SHARP[pc] === FLAT[pc] ? [SHARP[pc]] : [SHARP[pc], FLAT[pc]];
}
function spellHeptatonic(rootPc, scaleId) {
  const iv = SCALES[scaleId].iv;
  const opts = rootCandidates(mod12(rootPc)).map(r => ({ root: r, notes: spellBy(r, iv) }));
  const minorish = iv[2] === 3;
  const preferFlat = minorish ? [3, 10].includes(mod12(rootPc)) : [1, 3, 8, 10].includes(mod12(rootPc));
  opts.sort((a, b) => (hasDouble(a.notes) - hasDouble(b.notes))
    || (accCount(a.notes) - accCount(b.notes))
    || ((b.root.includes('b') === preferFlat) - (a.root.includes('b') === preferFlat)));
  return opts[0];
}
function spellScale(rootPc, scaleId) {
  const sc = SCALES[scaleId];
  if (!sc) throw new Error(`Неизвестная гамма: ${scaleId}`);
  const pcs = scalePcs(rootPc, scaleId);
  if (sc.iv.length === 7) return { ...spellHeptatonic(rootPc, scaleId), pcs };
  const parent = spellHeptatonic(rootPc, PARENT[scaleId] || 'major');
  const byPc = new Map(parent.notes.map(n => [pcOf(n), n]));
    /* «Блюзовую» ноту (♭5) пишем через бемоль */
  return { root: parent.root, notes: pcs.map(pc => byPc.get(pc) || noteName(pc, true)), pcs };
}

/* ---------- аккорды ---------- */
const CHORDS = {
  maj:  { suffix: '',     ru: 'мажор',               iv: [0, 4, 7] },
  min:  { suffix: 'm',    ru: 'минор',               iv: [0, 3, 7] },
  dim:  { suffix: 'dim',  ru: 'уменьшённый',         iv: [0, 3, 6] },
  aug:  { suffix: 'aug',  ru: 'увеличенный',         iv: [0, 4, 8] },
  sus2: { suffix: 'sus2', ru: 'sus2 — без терции',   iv: [0, 2, 7] },
  sus4: { suffix: 'sus4', ru: 'sus4 — без терции',   iv: [0, 5, 7] },
  maj7: { suffix: 'maj7', ru: 'большой мажорный септаккорд', iv: [0, 4, 7, 11] },
  m7:   { suffix: 'm7',   ru: 'минорный септаккорд', iv: [0, 3, 7, 10] },
  dom7: { suffix: '7',    ru: 'доминантсептаккорд',  iv: [0, 4, 7, 10] },
  m7b5: { suffix: 'm7b5', ru: 'полууменьшённый',     iv: [0, 3, 6, 10] },
  m9:   { suffix: 'm9',   ru: 'минорный нонаккорд',  iv: [0, 3, 7, 10, 14] },
  maj9: { suffix: 'maj9', ru: 'мажорный нонаккорд',  iv: [0, 4, 7, 11, 14] },
};
for (const c of Object.values(CHORDS)) c.steps = c.iv.slice(1).map((v, i) => v - c.iv[i]);

const chordPcs = (rootPc, type) => CHORDS[type].iv.map(i => mod12(rootPc + i));
function identifyChord(ivs) {
  const key = ivs.map(mod12).join(',');
  for (const [id, c] of Object.entries(CHORDS)) if (c.iv.map(mod12).join(',') === key) return id;
  return null;
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function romanFor(degree, type) {
  const base = ROMAN[degree];
  const lower = ['min', 'dim', 'm7', 'm7b5', 'm9'].includes(type);
  const r = lower ? base.toLowerCase() : base;
  const mark = { dim: '°', aug: '+', m7b5: 'ø7', maj7: 'maj7', m7: '7', dom7: '7' }[type] || '';
  return r + mark;
}
function diatonicChords(rootPc, scaleId, size = 3) {
  const sp = spellScale(rootPc, scaleId);
  if (sp.notes.length !== 7) return [];
  return sp.notes.map((name, d) => {
    const idx = [0, 2, 4, 6].slice(0, size).map(k => (d + k) % 7);
    const pcs = idx.map(i => sp.pcs[i]);
    const type = identifyChord(pcs.map(p => p - pcs[0]));
    return {
      degree: d, roman: romanFor(d, type), rootPc: pcs[0], root: name, type,
      name: name + (type ? CHORDS[type].suffix : '?'), notes: idx.map(i => sp.notes[i]), pcs,
    };
  });
}

/* ---------- Camelot и совместимость ---------- */
function camelot(rootPc, scale) {
  const majorPc = scale === 'minor' ? mod12(rootPc + 3) : mod12(rootPc);
  return `${mod12(majorPc * 7 + 7) + 1}${scale === 'minor' ? 'A' : 'B'}`;
}
const KEYS24 = [];
for (let n = 1; n <= 12; n++) {
  for (const scale of ['minor', 'major']) {
    for (let pc = 0; pc < 12; pc++) {
      if (camelot(pc, scale) === `${n}${scale === 'minor' ? 'A' : 'B'}`) {
        const sp = spellScale(pc, scale);
        KEYS24.push({ root: pc, scale, camelot: camelot(pc, scale), name: sp.root, notes: sp.notes,
          short: sp.root + (scale === 'minor' ? 'm' : '') });
      }
    }
  }
}
function sharedNotes(a, b) {
  const s = new Set(scalePcs(a.root, a.scale));
  return scalePcs(b.root, b.scale).filter(p => s.has(p)).length;
}
const COMPAT_LABEL = {
  same: 'та же тональность', perfect: 'те же ноты (параллельная)', great: 'отлично — 6 общих нот',
  careful: 'осторожно — 5 общих нот', mood: 'смена настроения (мажор ↔ минор)', clash: 'конфликт — будет фальшь',
};
function compat(a, b) {
  const shared = sharedNotes(a, b);
  let level;
  if (a.root === b.root && a.scale === b.scale) level = 'same';
  else if (shared === 7) level = 'perfect';
  else if (shared === 6) level = 'great';
  else if (shared === 5) level = 'careful';
  else if (a.root === b.root) level = 'mood';
  else level = 'clash';
  return { shared, level, label: COMPAT_LABEL[level] };
}

/* ---------- транспонирование ---------- */
function shortestShift(fromPc, toPc) {
  const d = mod12(toPc - fromPc);
  return d > 6 ? d - 12 : d;
}
const relativeOf = k => (k.scale === 'minor' ? { root: mod12(k.root + 3), scale: 'major' } : { root: mod12(k.root - 3), scale: 'minor' });
function transposePlan(sample, project) {
  const direct = { shift: shortestShift(sample.root, project.root), target: project, via: 'same' };
  if (sample.scale === project.scale) return direct;
  /* мажор ↔ минор: целимся в параллельную тональность проекта — у неё те же 7 нот */
  const rel = relativeOf(project);
  if (rel.scale !== sample.scale) return { ...direct, via: 'mood' };
  return { shift: shortestShift(sample.root, rel.root), target: rel, via: 'relative' };
}

/* ---------- определение тональности ---------- */
/* Профили Крумхансла–Кесслера: насколько «важна» каждая ступень в мажоре и миноре */
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function pearson(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}
function detectKey(weights) {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const res = [];
  for (const scale of ['major', 'minor']) {
    const prof = scale === 'major' ? KK_MAJOR : KK_MINOR;
    for (let pc = 0; pc < 12; pc++) {
      const rot = weights.map((_, i) => prof[mod12(i - pc)]);
      const inSet = new Set(scalePcs(pc, scale));
      const inScale = weights.reduce((s, w, i) => s + (inSet.has(i) ? w : 0), 0) / total;
      res.push({ root: pc, scale, r: pearson(weights, rot), inScale });
    }
  }
  return res.sort((a, b) => b.r - a.r);
}
function matchKeys(pcSet, homePc = null) {
  const marked = [...new Set(pcSet.map(mod12))];
  const out = KEYS24.map(k => {
    const s = new Set(scalePcs(k.root, k.scale));
    const outside = marked.filter(p => !s.has(p));
    return { ...k, missing: outside.length, outside, home: homePc !== null && k.root === mod12(homePc) };
  });
  const w = new Array(12).fill(0);
  marked.forEach(p => { w[p] = p === homePc ? 3 : 1; });
  const rank = new Map(detectKey(w).map((d, i) => [d.root + d.scale, i]));
  return out.sort((a, b) => a.missing - b.missing || b.home - a.home || rank.get(a.root + a.scale) - rank.get(b.root + b.scale));
}
function pcHistogram(notes, { includeDrums = false } = {}) {
  const w = new Array(12).fill(0);
  for (const n of notes) if (includeDrums || n.channel !== 9) w[mod12(n.pitch)] += n.dur || 1;
  return w;
}

/* ---------- MIDI-файлы ---------- */
const MAX_NOTES = 200000;
const fail = msg => { throw new Error(`Файл не похож на MIDI: ${msg}`); };
function reader(bytes) {
  let p = 0;
  const need = n => { if (p + n > bytes.length) fail('файл обрывается раньше времени'); };
  return {
    get pos() { return p; }, set pos(v) { p = v; },
    u8() { need(1); return bytes[p++]; },
    u16() { need(2); const v = (bytes[p] << 8) | bytes[p + 1]; p += 2; return v; },
    u32() { need(4); const v = ((bytes[p] << 24) >>> 0) + (bytes[p + 1] << 16) + (bytes[p + 2] << 8) + bytes[p + 3]; p += 4; return v; },
    str(n) { need(n); const s = String.fromCharCode(...bytes.subarray(p, p + n)); p += n; return s; },
    vlq() { let v = 0; for (let i = 0; i < 4; i++) { const b = this.u8(); v = (v << 7) | (b & 0x7f); if (!(b & 0x80)) return v; } return fail('испорченная длина события'); },
    skip(n) { need(n); p += n; },
  };
}
const KEY_SIG_MAJOR = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
function parseTrack(r, end, trackNo, out) {
  let tick = 0, status = 0;
  const open = new Map();
  while (r.pos < end) {
    tick += r.vlq();
    let b = r.u8();
    if (b === 0xff) {
      const type = r.u8(), len = r.vlq(), at = r.pos;
      if (type === 0x51 && len === 3 && out.bpm === null) out.bpm = Math.round(60000000 / ((r.u8() << 16) | (r.u8() << 8) | r.u8()) * 100) / 100;
      else if (type === 0x59 && len === 2 && !out.keySig) {
        const sf = (r.u8() << 24) >> 24, mi = r.u8();
        if (sf >= -7 && sf <= 7) { const maj = pcOf(KEY_SIG_MAJOR[sf + 7]); out.keySig = mi ? { root: mod12(maj - 3), scale: 'minor' } : { root: maj, scale: 'major' }; }
      } else if (type === 0x03 && !out.names[trackNo]) out.names[trackNo] = r.str(len);
      r.pos = at; r.skip(len);
      if (type === 0x2f) break;
      continue;
    }
    if (b === 0xf0 || b === 0xf7) { r.skip(r.vlq()); continue; }
    if (b & 0x80) status = b; else { if (!status) fail('событие без статуса'); r.pos -= 1; b = status; }
    const kind = status & 0xf0, ch = status & 0x0f;
    const d1 = r.u8(), d2 = (kind === 0xc0 || kind === 0xd0) ? 0 : r.u8();
    if (kind === 0x90 && d2 > 0) {
      const k = ch * 128 + d1;
      if (!open.has(k)) open.set(k, []);
      open.get(k).push({ start: tick, vel: d2 });
    } else if (kind === 0x80 || (kind === 0x90 && d2 === 0)) {
      const st = open.get(ch * 128 + d1);
      const on = st && st.shift();
      if (on) {
        if (out.notes.length >= MAX_NOTES) fail('слишком много нот');
        out.notes.push({ pitch: d1, start: on.start, dur: tick - on.start, vel: on.vel, channel: ch, track: trackNo });
      }
    }
  }
  out.length = Math.max(out.length, tick);
}
function parseMidi(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const r = reader(bytes);
  if (bytes.length < 14 || r.str(4) !== 'MThd') fail('нет заголовка MThd');
  const hlen = r.u32(), format = r.u16(), ntrks = r.u16(), division = r.u16();
  if (division & 0x8000) fail('SMPTE-время не поддерживается');
  r.pos = 8 + hlen;
  const out = { format, tracks: ntrks, division, bpm: null, keySig: null, names: {}, notes: [], length: 0 };
  for (let t = 0; t < ntrks && r.pos < bytes.length; t++) {
    const id = r.str(4), len = r.u32(), end = r.pos + len;
    if (end > bytes.length) fail('дорожка обрывается');
    if (id === 'MTrk') parseTrack(r, end, t, out);
    r.pos = end;
  }
  if (out.bpm === null) out.bpm = 120;
  return out;
}

function vlqBytes(v) {
  const out = [v & 0x7f];
  while ((v >>= 7)) out.unshift((v & 0x7f) | 0x80);
  return out;
}
function writeMidi({ notes = [], ppq = 480, bpm = 120, name = 'Ableton guide' } = {}) {
  const ev = [];
  for (const n of notes) {
    const pitch = Math.max(0, Math.min(127, n.pitch | 0)), vel = Math.max(1, Math.min(127, n.vel || 100));
    ev.push({ t: n.start, o: 1, b: [0x90, pitch, vel] }, { t: n.start + Math.max(1, n.dur), o: 0, b: [0x80, pitch, 0] });
  }
  ev.sort((a, b) => a.t - b.t || a.o - b.o);
  const us = Math.round(60000000 / bpm);
  const nameBytes = [...new TextEncoder().encode(name)];
  const trk = [0, 0xff, 0x03, ...vlqBytes(nameBytes.length), ...nameBytes,
    0, 0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255,
    0, 0xff, 0x58, 4, 4, 2, 24, 8];
  let last = 0;
  for (const e of ev) { trk.push(...vlqBytes(e.t - last), ...e.b); last = e.t; }
  trk.push(0, 0xff, 0x2f, 0);
  const u32 = v => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  return new Uint8Array([0x4d, 0x54, 0x68, 0x64, ...u32(6), 0, 0, 0, 1, (ppq >> 8) & 255, ppq & 255,
    0x4d, 0x54, 0x72, 0x6b, ...u32(trk.length), ...trk]);
}

/* ---------- названия как в Ableton (Root Note + Scale) ---------- */
function keyName(root, scale) {
  const sp = spellScale(root, scale);
  const dj = scale === 'major' || scale === 'minor' ? camelot(root, scale) : null;
  return { ableton: `${pretty(sp.root)} ${SCALES[scale].name}`, root: sp.root, dj, short: pretty(sp.root) + (scale === 'minor' ? 'm' : '') };
}

/* ---------- лупы из других тональностей: что делать в проекте ---------- */
function otherKeysPlan(project) {
  return KEYS24.filter(k => !(k.root === project.root && k.scale === project.scale)).map(k => {
    const c = compat(project, k);
    if (c.level === 'perfect' || c.level === 'great') return { key: k, ...c, action: 'asis', shift: 0 };
    const plan = transposePlan(k, project);
    if (c.level === 'careful') return { key: k, ...c, action: 'check', shift: plan.shift, target: plan.target };
    return { key: k, ...c, action: 'shift', shift: plan.shift, target: plan.target, via: plan.via };
  }).sort((a, b) => ({ asis: 0, check: 1, shift: 2 }[a.action] - { asis: 0, check: 1, shift: 2 }[b.action]) || b.shared - a.shared || Math.abs(a.shift) - Math.abs(b.shift));
}

/* ---------- какой аккорд звучит естественно следующим ----------
   Ключи: ступени 0..6 и заимствованные аккорды (IV, V, bII в миноре; iv, bVI, bVII в мажоре).
   3 — очень естественно, 2 — мягко, 1 — неожиданно, но работает. Источник: исследование гармонии
   электронных жанров (Hooktheory, Mixed In Key, Native Instruments, LANDR). */
const BORROW = {
  minor: [
    { id: 'IV', off: 5, type: 'maj', ru: 'дорийский IV — «душевно», afro и soulful house' },
    { id: 'V', off: 7, type: 'maj', ru: 'мажорный V из гармонического минора — драма, кино' },
    { id: 'bII', off: 1, type: 'maj', ru: 'фригийский ♭II — мрак, классика техно' },
  ],
  major: [
    { id: 'iv', off: 5, type: 'min', ru: 'минорный iv — неожиданная грусть' },
    { id: 'bVI', off: 8, type: 'maj', ru: '♭VI — эпично, «киношно»' },
    { id: 'bVII', off: 10, type: 'maj', ru: '♭VII — «гимн», подъём к финалу' },
  ],
};
const NEXT = {
  minor: {
    0: { 5: 3, 6: 3, 3: 3, 2: 2, 4: 2, IV: 1, bII: 1, V: 1 },
    1: { V: 3, 4: 3, 6: 2, 0: 1 },
    2: { 5: 3, 6: 3, 3: 2, 0: 2, 4: 1, IV: 1 },
    3: { 0: 3, 6: 3, 4: 2, 5: 2, 2: 2, V: 1 },
    4: { 0: 3, 5: 3, 3: 2, 6: 2, 2: 1 },
    5: { 6: 3, 0: 3, 3: 2, 2: 2, 4: 1, V: 1, bII: 1 },
    6: { 0: 3, 2: 3, 5: 2, 4: 2, 3: 1, IV: 1 },
    IV: { 0: 3, 6: 2, 4: 2, 5: 1 },
    V: { 0: 3, 5: 2, 3: 1 },
    bII: { 0: 3, 6: 2, V: 1 },
  },
  major: {
    0: { 3: 3, 4: 3, 5: 3, 1: 2, 2: 2, bVII: 1, iv: 1, bVI: 1 },
    1: { 4: 3, 3: 2, 5: 2, 0: 2, bVII: 1 },
    2: { 5: 3, 3: 3, 1: 2, 0: 2, 4: 1 },
    3: { 0: 3, 4: 3, 1: 2, 5: 2, iv: 2, bVII: 1 },
    4: { 0: 3, 5: 3, 3: 2, 2: 1, bVI: 1 },
    5: { 3: 3, 1: 3, 4: 2, 2: 2, 0: 2, bVII: 1 },
    6: { 0: 3, 2: 2, 5: 1 },
    bVI: { bVII: 3, 0: 2, iv: 2, 4: 1 },
    bVII: { 0: 3, 3: 2, iv: 1 },
    iv: { 0: 3, 4: 2, bVII: 2, bVI: 1 },
  },
};
const famOf = scale => (SCALES[scale] && SCALES[scale].iv[2] === 3 ? 'minor' : 'major');
const nextChords = (fam, from) => NEXT[fam === 'minor' ? 'minor' : 'major'][from] || {};
/* аккорд по id: ступень (число) или заимствованный (строка) */
function chordById(root, scale, id, size = 3) {
  if (typeof id === 'number' || /^\d$/.test(id)) return diatonicChords(root, scale, size)[+id];
  const b = BORROW[famOf(scale)].find(x => x.id === id);
  if (!b) return null;
  const rpc = mod12(root + b.off);
  const type = size === 4 ? (b.type === 'min' ? 'm7' : b.id === 'V' ? 'dom7' : b.id === 'IV' && famOf(scale) === 'minor' ? 'dom7' : 'maj7') : b.type;
  const flat = b.id.startsWith('b') || FLAT[rpc] === SHARP[rpc] ? true : spellScale(root, scale).notes.some(n => n.includes('b'));
  const rootName = noteName(rpc, flat);
  return { degree: b.id, roman: b.id.replace('b', '♭') + (size === 4 ? (type === 'm7' ? '7' : type === 'dom7' ? '7' : 'maj7') : ''), rootPc: rpc, root: rootName, type,
    name: rootName + CHORDS[type].suffix, notes: chordPcs(rpc, type).map(p => noteName(p, flat)), pcs: chordPcs(rpc, type), borrowed: true, ru: b.ru };
}

return {
  keyName, otherKeysPlan, NEXT, BORROW, nextChords, chordById, famOf,
  mod12, SHARP, FLAT, pcOf, noteName, pretty, ruName, midiName, octaveOf,
  SCALES, scalePcs, spellScale, CHORDS, chordPcs, identifyChord, diatonicChords,
  camelot, KEYS24, sharedNotes, compat, COMPAT_LABEL, shortestShift, relativeOf, transposePlan,
  detectKey, matchKeys, pcHistogram, parseMidi, writeMidi,
};
});
