/* Генератор партий (саб, бас, аккорды, пэд, плак, арп, лид, вокальный чоп) поверх прогрессии.
   Шаг сетки — 1/16, такт = 16 шагов. Все ноты берутся из аккорда или гаммы → ничего не «врёт». */
(function () {
'use strict';
const M = window.MusicCore, MP = window.MidiPage, U = MP.ui, esc = U.esc;
const BPM = 122, SPS = 60 / BPM / 4, TICKS = 120;

const PARTS = {
  sub:   { name: 'Саб',          icon: '🫧', color: '#22d3ee' },
  bass:  { name: 'Бас',          icon: '🔊', color: '#38bdf8' },
  chords:{ name: 'Аккорды/стэбы', icon: '🎹', color: '#ffc93c' },
  pad:   { name: 'Пэд',          icon: '☁️', color: '#a78bfa' },
  pluck: { name: 'Плак',         icon: '💧', color: '#34d399' },
  arp:   { name: 'Арп',          icon: '🔁', color: '#f472b6' },
  lead:  { name: 'Лид / хук',    icon: '⚡', color: '#fb923c' },
  chop:  { name: 'Вокальный чоп', icon: '🎤', color: '#f87171' },
};

/* tone: r — корень баса, o — октава выше, f — квинта баса, sub — саб, ch — весь аккорд,
   c0..c3 — ноты аккорда октавой выше, d<n> — ступень гаммы от корня аккорда, p<n> — n-я нота доп. гаммы */
const Q = [[0, 3, 'd4'], [3, 1, 'd3'], [4, 4, 'd2'], [10, 2, 'd1'], [12, 4, 'd2']];
const A = [[0, 3, 'd4'], [3, 1, 'd3'], [4, 2, 'd2'], [6, 2, 'd1'], [8, 8, 'd0']];
const PATTERNS = {
  'sub-long':     { part: 'sub', name: 'Длинный саб', tags: ['techno', 'melodic', 'ambient', 'downtempo'], bars: () => [[0, 16, 'sub']], desc: 'Одна нота на такт — корень аккорда. Чистый низ под кик с сайдчейном.' },
  'sub-offbeat':  { part: 'sub', name: 'Саб в офбит', tags: ['house', 'techhouse', 'garage'], bars: () => [[2, 2, 'sub'], [6, 2, 'sub'], [10, 2, 'sub'], [14, 2, 'sub']], desc: 'Саб звучит между кик-ударами — низ не спорит с киком.' },
  'bass-offbeat': { part: 'bass', name: 'Офбит-бас', tags: ['house', 'techhouse'], bars: () => [[2, 2, 'r'], [6, 2, 'r'], [10, 2, 'r'], [14, 2, 'o']], desc: 'Классика house: бас на «и» между ударами кика.' },
  'bass-rolling': { part: 'bass', name: 'Роллинг-бас', tags: ['techhouse', 'techno'], bars: () => [[1, 1, 'r'], [2, 1, 'r'], [3, 1, 'o'], [5, 1, 'r'], [6, 1, 'f'], [7, 1, 'r'], [9, 1, 'r'], [10, 1, 'r'], [11, 1, 'o'], [13, 1, 'r'], [14, 1, 'f'], [15, 1, 'o']], desc: 'Шестнадцатые, которые обходят кик: «катящийся» грув Tech House.' },
  'bass-garage':  { part: 'bass', name: '2-step бас', tags: ['garage'], bars: () => [[0, 3, 'r'], [6, 1, 'r'], [10, 2, 'r'], [13, 1, 'o']], desc: 'Длинная нота с киком, короткая на 7-м шаге, подхват октавой — бас «дышит» с ломаным 2-step киком.' },
  'bass-stussy':  { part: 'bass', name: 'Роллинг из 3 нот (Chris Stussy)', tags: ['techhouse'], bars: () => [[0, 1, 'r'], [4, 1, 'f'], [5, 1, 'r'], [6, 1, 'o'], [7, 1, 'r'], [8, 1, 'r'], [12, 1, 'f'], [13, 1, 'r'], [14, 1, 'o'], [15, 1, 'r']], desc: 'Тоника, квинта и октава — современный tech house. Ноты на 1 и 9 совпадают с киком, поэтому нужен сайдчейн. Свинг 56–58%.' },
  'bass-afro':    { part: 'bass', name: 'Афро-бас 3-3-2', tags: ['afro', 'organic'], bars: () => [[3, 2, 'r'], [6, 2, 'r'], [11, 2, 'r'], [14, 2, 'f']], desc: 'Синкопа мимо кика на шагах 4, 7, 12, 15 — «клавное» афро-ощущение.' },
  'bass-afrolong':{ part: 'bass', name: 'Глубокий афро-бас', tags: ['afro', 'organic', 'downtempo'], bars: () => [[0, 10, 'r'], [12, 1, 'q'], [14, 1, 'f']], desc: 'Долгая тоника и два подхода в конце такта (кварта, квинта) — круглый глубокий низ.' },
  'bass-onenote': { part: 'bass', name: 'Техно one-note', tags: ['techno'], bars: () => [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15].map(s => [s, 1, 'r']), desc: 'Одна нота шестнадцатыми между киками — гипнотичный техно-низ.' },
  'chords-stab':  { part: 'chords', name: 'Стэбы 3-3-4', tags: ['garage', 'house', 'techhouse'], bars: () => [0, 3, 6, 10, 13].map(s => [s, 2, 'ch']), desc: 'Короткие удары аккордом с синкопой.' },
  'chords-332':   { part: 'chords', name: 'Стэбы 3-3-2', tags: ['afro', 'house', 'organic'], bars: () => [0, 3, 6, 8, 11, 14].map(s => [s, 1, 'ch']), desc: 'Deep house и afro: короткие удары с «клавной» синкопой, velocity гуляет.' },
  'chords-push':  { part: 'chords', name: 'Пуш-стэб', tags: ['techhouse', 'techno'], bars: () => [[14, 1, 'ch']], desc: 'Один короткий стэб на 15-м шаге — толчок в следующий такт. Дай ему хвост реверба.' },
  'chords-garage':{ part: 'chords', name: 'Скипающие стэбы', tags: ['garage'], bars: () => [2, 5, 10, 13].map(s => [s, 1, 'ch']), desc: 'Рваные органные стэбы UK garage — включи свинг.' },
  'chords-off':   { part: 'chords', name: 'Офбит-аккорды', tags: ['house', 'organic', 'afro'], bars: () => [2, 6, 10, 14].map(s => [s, 1, 'ch']), desc: 'Аккорд на каждом офбите — «органный» house-драйв.' },
  'pad-long':     { part: 'pad', name: 'Пэд на весь такт', tags: ['melodic', 'ambient', 'downtempo', 'organic'], seventh: true, bars: () => [[0, 16, 'ch']], desc: 'Септаккорды на весь такт. Длинная атака и релиз — и реверб.' },
  'pluck-332':    { part: 'pluck', name: 'Плак 3-3-2', tags: ['organic', 'afro'], bars: () => [[0, 1, 'c0'], [3, 1, 'c2'], [6, 1, 'c1'], [8, 1, 'c3'], [11, 1, 'c2'], [14, 1, 'c1']], desc: 'Маримба или калимба по тресильо поверх прямого кика. Дилей 1/8 с точкой и свинг.' },
  'pluck-8':      { part: 'pluck', name: 'Плак восьмыми', tags: ['melodic', 'house', 'downtempo'], bars: () => [[0, 2, 'c0'], [2, 2, 'c1'], [4, 2, 'c2'], [6, 2, 'c1'], [8, 2, 'c0'], [10, 2, 'c2'], [12, 2, 'c3'], [14, 2, 'c2']], desc: 'Ноты аккорда восьмыми на октаву выше — светлый плак.' },
  'arp-16':       { part: 'arp', name: 'Арпеджио 1/16', tags: ['melodic', 'techno', 'downtempo'], bars: () => [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3].map((t, s) => [s, 1, `c${t}`]), desc: 'Вверх-вниз по нотам аккорда. То же делает Arpeggiator (Style Up & Down, Rate 1/16).' },
  'lead-hook':    { part: 'lead', name: 'Хук «вопрос — ответ»', tags: ['house', 'melodic', 'garage'], bars: i => (i % 2 ? A : Q), desc: 'Нечётный такт — вопрос, чётный — ответ на корень аккорда.' },
  'lead-afro':    { part: 'lead', name: 'Перкуссивный лид 3-3-2', tags: ['afro', 'organic'], bars: () => [[0, 3, 'd4'], [3, 3, 'd2'], [6, 2, 'd1'], [8, 3, 'd0'], [11, 3, 'd2'], [14, 2, 'd4']], desc: 'На сильных долях — ноты аккорда, ритм 3+3+2.' },
  'lead-pent':    { part: 'lead', name: 'Лид по пентатонике', tags: ['house', 'techhouse', 'melodic'], penta: true, bars: i => (i % 2 ? [[0, 2, 'p2'], [2, 2, 'p1'], [4, 4, 'p0'], [10, 2, 'p1'], [12, 4, 'p0']] : [[0, 2, 'p0'], [2, 2, 'p1'], [4, 2, 'p2'], [6, 2, 'p3'], [8, 6, 'p4'], [14, 2, 'p3']]), desc: 'Пять нот пентатоники — сыграть фальшиво невозможно.' },
  'chop':         { part: 'chop', name: 'Вокальный чоп-мотив', tags: ['garage', 'house', 'afro'], penta: true, bars: i => [[0, 1, 'p2'], [3, 1, 'p2'], [6, 2, 'p3'], [10, 1, i % 2 ? 'p1' : 'p4'], [12, 2, 'p2']], desc: 'Короткие слоги на синкопах. Нарежь вокал в Simpler (Slice) и сыграй этот ритм.' },
};

/* ---------- высоты ---------- */
function degMidi(i, key, base) {
  const iv = M.SCALES[key.scale].iv, n = iv.length, o = Math.floor(i / n), d = ((i % n) + n) % n;
  let tonic = base + M.mod12(key.root - base);
  if (tonic > base + 6) tonic -= 12;
  return tonic + iv[d] + 12 * o;
}
const subNote = pc => 28 + M.mod12(pc - 4);
function toneMidi(tone, c, key, penta) {
  if (tone === 'sub') return [subNote(c.rootPc)];
  if (tone === 'r') return [c.bassNote];
  if (tone === 'o') return [c.bassNote + 12];
  if (tone === 'f') return [c.bassNote + M.mod12(c.pcs[2] - c.pcs[0])];
  if (tone === 'q') { const sp = M.scalePcs(key.root, key.scale); return [c.bassNote + M.mod12(sp[(c.degree + 3) % sp.length] - c.rootPc)]; }
  if (tone === 'ch') return c.voicing;
  if (tone[0] === 'c') { const t = [...c.voicing, c.voicing[0] + 12]; return [(t[+tone.slice(1)] ?? t[0]) + 12]; }
  if (tone[0] === 'd') return [degMidi(c.degree + +tone.slice(1), key, 72)];
  if (tone[0] === 'p') return [degMidi(+tone.slice(1), penta, 72)];
  return [];
}
/* pentaFor: какую пентатонику брать для лида/чопа (по умолчанию — пентатоника самой тональности) */
function pentaFor(key, override) {
  if (override) return override;
  return M.SCALES[key.scale].iv[2] === 3 ? { root: key.root, scale: 'minorPent' } : { root: key.root, scale: 'majorPent' };
}
/* chords — результат MP.chords.progChords(...); вернёт ноты в шагах 1/16 */
function generate(patId, chords, key, opts = {}) {
  const pat = PATTERNS[patId], penta = pentaFor(key, opts.penta), out = [];
  chords.forEach((c, bar) => {
    const ct = new Set(c.pcs);
    pat.bars(bar).forEach(([s, l, tone]) => toneMidi(tone, c, key, penta).forEach(p => out.push({ pitch: p, start: bar * 16 + s, dur: l, cls: ct.has(M.mod12(p)) ? 'ct' : 'pt' })));
  });
  return out;
}

/* ---------- звук, скачивание ---------- */
const VEL = { sub: 0.9, bass: 0.85, chords: 0.5, pad: 0.4, pluck: 0.6, arp: 0.5, lead: 0.75, chop: 0.7 };
function events(notes, part) { return notes.map(n => ({ midi: n.pitch, at: n.start * SPS, dur: n.dur * SPS * 0.92, vel: VEL[part] ?? 0.7 })); }
function playLayers(layers, rollHost, steps) {
  U.sound(S => { S.stop(); S.play(layers.flatMap(l => events(l.notes, l.part))); if (rollHost) U.playhead(rollHost, steps, SPS); });
}
const midiBytes = (notes, name) => M.writeMidi({ notes: notes.map(n => ({ pitch: n.pitch, start: n.start * TICKS, dur: n.dur * TICKS, vel: 96 })), bpm: BPM, name });
function downloadZip(layers, title) {
  const files = layers.map((l, i) => ({ name: `${String(i + 1).padStart(2, '0')} ${U.safeName(l.title)}.mid`, data: midiBytes(l.notes, l.title) }));
  files.push({ name: 'КАК ИМПОРТИРОВАТЬ.txt', data: new TextEncoder().encode(`${title}\n\nТемп ${BPM} BPM. Распакуй архив, выдели все .mid файлы и перетащи их в Arrangement View, удерживая Cmd — каждая партия встанет на свою дорожку (без Cmd Live положит их на одну дорожку подряд).\n`) });
  const url = URL.createObjectURL(new Blob([window.MiniZip.zip(files)], { type: 'application/zip' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${U.safeName(title)}.zip` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- мини-ролл одной партии ---------- */
function miniRoll(notes, key) {
  return U.pianoRoll({ notes, steps: 64, stepW: 5, rowH: 9, fold: true, scale: M.scalePcs(key.root, key.scale), rootPc: key.root, title: 'Партия' });
}

MP.parts = { PARTS, PATTERNS, BPM, SPS, generate, degMidi, pentaFor, playLayers, midiBytes, downloadZip, miniRoll, events };
})();
