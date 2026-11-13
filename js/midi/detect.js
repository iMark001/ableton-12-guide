/* Вкладка «Тональность MIDI»: урок, кликер по нотам, разбор .mid файла прямо в браузере. */
(function () {
'use strict';
const M = window.MusicCore, MP = window.MidiPage, U = MP.ui, esc = U.esc;
const MAX_BYTES = 5 * 1024 * 1024;
const st = { marks: new Map(), file: null, tracks: new Set() }; // marks: pc → 'on' | 'home'
let el = null;

/* пример для урока: мелодия ля минор, разбросанная по октавам */
const DEMO = [[69, 0, 4], [72, 4, 2], [71, 6, 2], [69, 8, 4], [64, 12, 4], [57, 0, 8], [53, 8, 4], [55, 12, 4], [76, 2, 2], [74, 10, 2]]
  .map(([pitch, start, dur]) => ({ pitch, start, dur, cls: M.mod12(pitch) === 9 ? 'rt' : '' }));

const STEPS = [
  ['Свернуть пиано-ролл', 'Открой клип и нажми <b>Fold</b> в заголовке редактора (или клавишу <kbd>F</kbd>). Останутся только строки, где есть ноты, — сразу видно, какие ноты используются.'],
  ['Выписать разные ноты', 'Октавы не важны: C2, C3 и C4 — это одна нота C. Обычно получается 5–7 разных нот. Отметь их на клавиатуре ниже — сайт подскажет тональности.'],
  ['Найти гамму, где есть все ноты', 'Подходящая тональность — та, в которой есть <b>все</b> твои ноты. Часто подходят две сразу: например, C major и A minor состоят из одних и тех же нот.'],
  ['Найти «домашнюю» ноту', 'Это нота, на которой спокойно: ею обычно начинается и заканчивается фраза, её чаще всего играет бас. Если дом — <b>A</b>, то это A minor, если <b>C</b> — C major. Отметь её вторым кликом.'],
  ['Проверить в Ableton', 'В клипе включи <b>Scale</b>, выставь Root Note и Scale, нажми <kbd>K</kbd> — строки гаммы подсветятся. Все ноты в подсветке — тональность найдена. Если 1–2 ноты вне гаммы, попробуй <b>Dorian</b> (чужая нота на 6-й ступени) или <b>Phrygian</b> (на 2-й). В Live 12 нет автоопределения тональности MIDI-клипа, поэтому этот способ и перетаскивание файла ниже — самые быстрые.'],
];

/* ---------- кликер ---------- */
function clickerMarkup() {
  const marks = {};
  for (const [pc, kind] of st.marks) marks[60 + pc] = kind === 'home' ? `on rt|★ ${M.pretty(M.SHARP[pc])}` : `on|${M.pretty(M.SHARP[pc])}`;
  return `${U.piano({ from: 60, to: 71, marks, cls: 'big' })}
    <div class="ck-btns"><button class="btn" id="dtReset">Сбросить</button><span class="muted">1-й клик — нота есть, 2-й — ★ домашняя, 3-й — убрать.</span></div>
    <div id="dtRes">${resultsMarkup()}</div>`;
}
function resultsMarkup() {
  if (!st.marks.size) return '<p class="muted">Отметь хотя бы 3 ноты — появятся подходящие тональности.</p>';
  const pcs = [...st.marks.keys()];
  const home = [...st.marks].find(([, k]) => k === 'home');
  const res = M.matchKeys(pcs, home ? home[0] : null);
  const fit = res.filter(r => r.missing === 0);
  const list = (fit.length ? fit : res.filter(r => r.missing === 1)).slice(0, 8);
  const head = fit.length
    ? `<p>Подходят <b>${fit.length}</b> ${fit.length === 1 ? 'тональность' : fit.length < 5 ? 'тональности' : 'тональностей'}. ${fit.length > 2 ? 'Отметь больше нот или ★ домашнюю, чтобы сузить выбор.' : ''}</p>`
    : '<p>Ни одна мажорная или минорная гамма не содержит все эти ноты. Ниже — варианты, где выпадает одна нота (она отмечена красным). Возможно, это случайная «проходящая» нота или другой лад.</p>';
  return head + `<div class="kres">${list.map((r, i) => keyCard(r, i, r.outside)).join('')}</div>`;
}
function keyCard(r, i, outside = [], extra = '') {
  const t = U.keyTitle(r.root, r.scale);
  return `<div class="kcard ${r.home ? 'home' : ''}" style="animation-delay:${i * 50}ms">
    <div class="kh"><b>${esc(t.long)}</b>${r.home ? '<span class="badge g">★ дом</span>' : ''}</div>
    <div class="kru">${esc(t.ru)} ${U.djTag(r.root, r.scale)}</div>
    <div class="kn">${t.sp.notes.map(n => esc(M.pretty(n))).join(' · ')}${outside.length ? ` <span class="bad">+ ${outside.map(p => esc(M.pretty(M.SHARP[p]))).join(', ')}</span>` : ''}</div>
    ${extra}
    <div class="kb"><button class="btn sm" data-open="${r.root}|${r.scale}|clock">На круге</button><button class="btn sm" data-open="${r.root}|${r.scale}|chords">Аккорды</button></div></div>`;
}

/* ---------- файл ---------- */
function fileMarkup() {
  return `<label class="drop" id="dtDrop" tabindex="0">
      <input type="file" id="dtFile" accept=".mid,.midi,audio/midi" hidden>
      <span class="big">🎼</span><b>Перетащи сюда .mid файл</b><span class="muted">или нажми, чтобы выбрать. Файл никуда не отправляется — всё считается в браузере.</span></label>
    <div id="dtFileRes"></div>`;
}
async function handleFile(file) {
  const box = U.$('#dtFileRes', el);
  if (!file) return;
  if (file.size > MAX_BYTES) { box.innerHTML = '<p class="err">Файл больше 5 МБ — это точно MIDI? Выбери другой.</p>'; return; }
  try {
    const parsed = M.parseMidi(new Uint8Array(await file.arrayBuffer()));
    if (!parsed.notes.length) { box.innerHTML = '<p class="err">В файле нет нот.</p>'; return; }
    st.file = { name: file.name, parsed };
    st.tracks = new Set([...new Set(parsed.notes.map(n => n.track))]);
    box.innerHTML = fileResultMarkup();
  } catch (err) {
    box.innerHTML = `<p class="err">${esc(err.message || 'Не получилось прочитать файл.')}</p>`;
  }
}
function analysis() {
  const notes = st.file.parsed.notes.filter(n => st.tracks.has(n.track));
  const w = M.pcHistogram(notes);
  const ranked = M.detectKey(w);
  const pitched = notes.filter(n => n.channel !== 9);
  const bassAt = which => {
    if (!pitched.length) return null;
    const t = which === 'first' ? Math.min(...pitched.map(n => n.start)) : Math.max(...pitched.map(n => n.start));
    return Math.min(...pitched.filter(n => n.start === t).map(n => n.pitch));
  };
  return { notes, pitched, w, ranked, first: bassAt('first'), last: bassAt('last') };
}
function fileResultMarkup() {
  const p = st.file.parsed, a = analysis();
  const trackIds = [...new Set(p.notes.map(n => n.track))];
  const tracks = trackIds.length > 1 ? `<div class="chips">${trackIds.map(t => {
    const cnt = p.notes.filter(n => n.track === t).length, drums = p.notes.some(n => n.track === t && n.channel === 9);
    return `<label class="chip sm ${st.tracks.has(t) ? 'on' : ''}"><input type="checkbox" data-track="${t}" ${st.tracks.has(t) ? 'checked' : ''} hidden>${esc(p.names[t] || `Дорожка ${t + 1}`)} · ${cnt}${drums ? ' 🥁' : ''}</label>`;
  }).join('')}</div><p class="muted">Сними лишние дорожки (например, ударные), чтобы точнее определить тональность. Барабаны на 10-м канале и так не учитываются.</p>` : '';
  if (!a.pitched.length) return `<div class="box">${tracks}<p class="err">В выбранных дорожках только ударные — тональность у них не определить.</p></div>`;
  const top = a.ranked[0], max = Math.max(...a.w) || 1;
  const topSet = new Set(M.scalePcs(top.root, top.scale));
  const hist = a.w.map((v, pc) => `<div class="hb ${topSet.has(pc) ? 'in' : ''} ${pc === top.root ? 'rt' : ''}"><i style="--h:${(v / max * 100).toFixed(1)}%;animation-delay:${pc * 40}ms"></i><span>${esc(M.pretty(M.SHARP[pc]))}</span></div>`).join('');
  const sig = p.keySig ? `<p>📄 В самом файле записана тональность <b>${esc(U.keyTitle(p.keySig.root, p.keySig.scale).long)}</b>. Программы часто оставляют там C major по умолчанию, поэтому сверяй с анализом нот.</p>` : '';
  const cards = a.ranked.slice(0, 3).map((r, i) => keyCard(r, i, [], `<div class="kst"><span>совпадение ${Math.max(0, Math.round(r.r * 100))}%</span><span>нот в гамме ${Math.round(r.inScale * 100)}%</span></div>`)).join('');
  const rel = M.relativeOf(top), relT = U.keyTitle(rel.root, rel.scale), topT = U.keyTitle(top.root, top.scale);
  const bn = m => (m === null ? '—' : `${M.midiName(m)}`);
  return `<div class="box filebox">
    <div class="fh"><b>${esc(st.file.name)}</b><span class="muted">${p.notes.length} нот · ${Math.ceil(p.length / (p.division * 4)) || 1} тактов · ${p.bpm} BPM</span></div>
    ${tracks}${sig}
    <div class="hist">${hist}</div>
    <p class="muted">Высота столбика — сколько звучит нота (по длительности). Жёлтым — ноты найденной гаммы.</p>
    <h3 class="bh">Скорее всего: ${esc(topT.long)} <small class="muted">${esc(topT.ru)}</small></h3>
    <div class="kres">${cards}</div>
    <p><b>Мажор или минор?</b> ${esc(topT.long)} и ${esc(relT.long)} состоят из одних нот. Подсказка из баса: первая нижняя нота — <b>${bn(a.first)}</b>, последняя — <b>${bn(a.last)}</b>. Если бас «живёт» на ${esc(M.pretty(topT.sp.root))}, верь ${esc(topT.long)}, если на ${esc(M.pretty(relT.sp.root))} — ${esc(relT.long)}.</p></div>`;
}

/* ---------- разметка и события ---------- */
function render() {
  el.innerHTML = `
    <div class="sec-h"><div><h2>Как найти тональность MIDI-дорожки</h2><p>5 шагов. Теория не нужна, только внимательность.</p></div></div>
    <div class="steps5">${STEPS.map(([h, t], i) => `<div class="s5 reveal"><span class="n">${i + 1}</span><b>${h}</b><p>${t}</p></div>`).join('')}</div>
    <div class="fold-demo">
      <div><span class="badge v">до Fold</span>${U.pianoRoll({ notes: DEMO, steps: 16, stepW: 22, rowH: 8, low: 50, high: 79 })}</div>
      <div><span class="badge">после Fold <kbd>F</kbd></span>${U.pianoRoll({ notes: DEMO, steps: 16, stepW: 22, rowH: 18, fold: true })}</div>
      <p class="muted">Ноты: A, C, B, E, D, F, G → это A minor или C major. Дом здесь A (бас и начало фразы), значит <b>A minor</b>.</p>
    </div>
    <div class="dt-grid">
      <div class="box"><h3 class="bh">① Отметь ноты, которые видишь в пиано-ролле</h3><div id="dtClick">${clickerMarkup()}</div></div>
      <div class="box"><h3 class="bh">② Или перетащи .mid — сайт посчитает сам</h3>${fileMarkup()}</div>
    </div>`;
}
function onClick(e) {
  const t = e.target;
  const key = t.closest('.pk');
  if (key && t.closest('.piano.big')) {
    const pc = M.mod12(+key.dataset.m), cur = st.marks.get(pc);
    if (!cur) st.marks.set(pc, 'on');
    else if (cur === 'on') { for (const [p, k] of st.marks) if (k === 'home') st.marks.set(p, 'on'); st.marks.set(pc, 'home'); }
    else st.marks.delete(pc);
    U.sound(S => S.chord([60 + pc], 0.5));
    U.$('#dtClick', el).innerHTML = clickerMarkup();
    return;
  }
  if (t.id === 'dtReset') { st.marks.clear(); U.$('#dtClick', el).innerHTML = clickerMarkup(); return; }
  const op = t.closest('[data-open]');
  if (op) {
    const [root, scale, tab] = op.dataset.open.split('|');
    if (tab === 'clock') MP.clock.open(+root, scale, 'scale'); else U.setKey(+root, scale);
    MP.go(tab);
    return;
  }
  const tr = t.closest('input[data-track]');
  if (tr) {
    if (tr.checked) st.tracks.add(+tr.dataset.track); else st.tracks.delete(+tr.dataset.track);
    U.$('#dtFileRes', el).innerHTML = fileResultMarkup();
  }
}
function bindDrop() {
  const drop = U.$('#dtDrop', el), input = U.$('#dtFile', el);
  input.addEventListener('change', () => handleFile(input.files[0]));
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
}

MP.tabs.detect = {
  title: 'Тональность MIDI',
  render(host) {
    el = host;
    render();
    if (st.file) U.$('#dtFileRes', el).innerHTML = fileResultMarkup();
    el.addEventListener('click', onClick);
    bindDrop();
  },
  destroy() { el = null; },
};
})();
