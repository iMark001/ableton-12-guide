/* Вкладка «Аккорды»: аккорды тональности, конструктор «что дальше», готовые прогрессии,
   примеры партий (саб, бас, стэбы, пэд, плак, арп, лид, чоп) с рецептами звука. */
(function () {
'use strict';
const M = window.MusicCore, MP = window.MidiPage, U = MP.ui, esc = U.esc;
const HEPTA = ['minor', 'major', 'dorian', 'phrygian', 'mixolydian', 'lydian', 'harmonicMinor', 'melodicMinor'];
const MINOR_FAM = ['minor', 'dorian', 'phrygian', 'harmonicMinor', 'melodicMinor', 'locrian'];
const MAX_SEQ = 8;

/* Прогрессии: ступени 0..6 от тоники. fam — для минорных или мажорных ладов. */
const PROGS = [
  { id: 'm-epic',  fam: 'minor', deg: [0, 5, 2, 6], name: 'Эпичная',          tags: ['melodic', 'techno', 'house'], note: 'Самая ходовая в melodic techno: тёмный старт, раскрытие на VI и III.' },
  { id: 'm-drive', fam: 'minor', deg: [0, 6, 5, 6], name: 'Тёмный драйв',     tags: ['techno', 'melodic'], note: 'Качается вокруг тоники, держит напряжение в дропе.' },
  { id: 'm-two',   fam: 'minor', deg: [0, 6, 0, 6], name: 'Два аккорда',      tags: ['afro', 'organic', 'techhouse'], note: 'Минимум гармонии — максимум грува. База афро и organic.' },
  { id: 'm-deep',  fam: 'minor', deg: [0, 3, 0, 3], name: 'Глубокий грув',    tags: ['house', 'garage', 'techhouse'], seventh: true, note: 'i7 – iv7: тёплые септаккорды deep house и garage.' },
  { id: 'm-swing', fam: 'minor', deg: [0, 3, 4, 0], name: 'Минимал-качели',   tags: ['afro', 'organic', 'downtempo'], note: 'Спокойный круг: дом → уход → лёгкое напряжение → дом.' },
  { id: 'm-sad',   fam: 'minor', deg: [0, 4, 5, 3], name: 'Грустная',         tags: ['downtempo', 'melodic', 'ambient'], note: 'Мягкая меланхолия, хорошо под вокал.' },
  { id: 'm-rise',  fam: 'minor', deg: [5, 6, 0, 0], name: 'Подъём к дому',    tags: ['melodic', 'techno', 'ambient'], note: 'Для билдапа: VI и VII подводят к тонике в дропе.' },
  { id: 'M-pop',   fam: 'major', deg: [0, 4, 5, 3], name: 'Хит',              tags: ['house', 'garage'], note: 'I–V–vi–IV: самая узнаваемая поп-прогрессия.' },
  { id: 'M-emo',   fam: 'major', deg: [5, 3, 0, 4], name: 'Эмоциональная',    tags: ['melodic', 'house', 'downtempo'], note: 'vi–IV–I–V: тот же набор, но старт с грустного аккорда.' },
  { id: 'M-jazz',  fam: 'major', deg: [1, 4, 0, 0], name: 'Джазовая ii–V–I',  tags: ['garage', 'house'], seventh: true, note: 'С септаккордами — фирменный звук UK garage и deep house.' },
  { id: 'M-up',    fam: 'major', deg: [3, 4, 5, 5], name: 'Вверх',            tags: ['house', 'techhouse'], note: 'IV–V–vi: ощущение подъёма к кульминации.' },
  { id: 'M-calm',  fam: 'major', deg: [0, 3, 0, 3], name: 'Светлые качели',   tags: ['organic', 'ambient', 'downtempo', 'afro'], seventh: true, note: 'Imaj7 – IVmaj7: мягко и «дорого».' },
];
const MOOD = {
  minor: ['дом, устойчиво', 'напряжённый, редкий гость', 'светлый, надежда', 'грусть, глубина', 'мягкое напряжение', 'эпик, раскрытие', 'движение, тянет домой'],
  major: ['дом, устойчиво', 'мягкий уход', 'задумчиво', 'светло, раскрыто', 'напряжение → домой', 'грусть, эмоция', 'острое напряжение'],
};
const NX = { 3: ['★★★', 'очень естественно'], 2: ['★★', 'мягко'], 1: ['★', 'неожиданно, но работает'] };
const DEFAULT_MIX = ['sub-offbeat', 'bass-offbeat', 'chords-stab', 'pad-long', 'lead-hook'];

const DEFAULT_SEQ = { minor: [0, 5, 2, 6], major: [0, 4, 5, 3] };
const st = { seq: null, seqFam: null, seventh: false, style: '', bass: true, mix: new Set(DEFAULT_MIX), recipe: null };
let el = null, unsub = null;

const fam = scale => (MINOR_FAM.includes(scale) ? 'minor' : 'major');
const keyNow = () => (HEPTA.includes(U.state.key.scale) ? U.state.key : { ...U.state.key, scale: fam(U.state.key.scale) });

/* голосоведение: выбираем обращение, ближайшее к предыдущему аккорду */
function lead(prev, pcs) {
  const base = U.voice(pcs);
  if (!prev) return base;
  let best = base, bestCost = Infinity;
  for (let inv = 0; inv < pcs.length; inv++) {
    for (const shift of [-12, 0, 12]) {
      const v = U.invert(base, inv).map(n => n + shift);
      if (v[0] < 50 || v[v.length - 1] > 79) continue;
      const cost = v.reduce((s, n, i) => s + Math.abs(n - (prev[i] ?? prev[prev.length - 1])), 0);
      if (cost < bestCost) { best = v; bestCost = cost; }
    }
  }
  return best;
}
/* для заимствованного аккорда мелодии строим от ближайшей ступени гаммы */
function nearestDeg(key, pc) {
  const pcs = M.scalePcs(key.root, key.scale);
  for (const d of [0, -1, 1]) { const i = pcs.indexOf(M.mod12(pc + d)); if (i >= 0) return i; }
  return 0;
}
/* seq: ступени 0..6 или id заимствованных аккордов ('IV', 'bII', …) */
function seqChords(degs, key = keyNow(), seventh = st.seventh) {
  let prev = null;
  return degs.map(d => M.chordById(key.root, key.scale, d, seventh ? 4 : 3)).filter(Boolean)
    .map(c => { const v = lead(prev, c.pcs); prev = v; return { ...c, degree: typeof c.degree === 'number' ? c.degree : nearestDeg(key, c.rootPc), id: c.degree, voicing: v, bassNote: 36 + M.mod12(c.rootPc) }; });
}
const progChords = (prog, key = keyNow()) => seqChords(prog.deg, key, st.seventh || !!prog.seventh);
function progNotes(chords, withBass) {
  const notes = [];
  chords.forEach((c, bar) => {
    c.voicing.forEach(p => notes.push({ pitch: p, start: bar * 16, dur: 16, cls: M.mod12(p) === c.rootPc ? 'rt' : '' }));
    if (withBass) notes.push({ pitch: c.bassNote, start: bar * 16, dur: 16, cls: 'bs' });
  });
  return notes;
}
const P = () => MP.parts;
function playChords(chords) {
  const layers = [{ part: 'pad', notes: progNotes(chords, false) }];
  if (st.bass) layers.push({ part: 'bass', notes: chords.map((c, bar) => ({ pitch: c.bassNote, start: bar * 16, dur: 16 })) });
  P().playLayers(layers, U.$('#chRoll', el), chords.length * 16);
}
function exportChords(chords, label) {
  const k = U.keyTitle(keyNow().root, keyNow().scale);
  const name = `${k.long} ${label} ${chords.map(c => c.name).join('-')}`;
  U.download(P().midiBytes(progNotes(chords, st.bass), name), `${U.safeName(name)}.mid`);
}

/* ---------- разметка: аккорды + конструктор ---------- */
function cardsMarkup() {
  const k = keyNow(), moods = MOOD[fam(k.scale)];
  const last = st.seq.length ? st.seq[st.seq.length - 1] : null;
  const next = last === null ? {} : M.nextChords(fam(k.scale), last);
  const card = (c, id, i, mood) => {
    const marks = {};
    U.voice(c.pcs).forEach((m, j) => { marks[m] = j ? 'on' : 'on rt'; });
    const r = last === null ? null : (next[id] || 0);
    const hint = r === null ? '' : r ? `<span class="nx nx${r}" title="${NX[r][1]}">${NX[r][0]} ${NX[r][1]}</span>` : '<span class="nx nx0">редко</span>';
    return `<button class="ccard ${r === 0 ? 'dimc' : ''} ${c.borrowed ? 'borrow' : ''}" data-chord="${id}" style="animation-delay:${i * 50}ms">
      ${hint}<span class="rn">${esc(c.roman)}</span><b>${U.chordLabel(c.name)}</b>
      <span class="cn">${c.notes.map(n => esc(M.pretty(n))).join(' · ')}</span>
      <span class="cm">${esc(mood)}</span>
      ${U.piano({ from: 48, to: 71, marks, labels: false, cls: 'mini' })}</button>`;
  };
  const size = st.seventh ? 4 : 3;
  const main = M.diatonicChords(k.root, k.scale, size).map((c, i) => card(c, i, i, moods[i])).join('');
  const guests = M.BORROW[M.famOf(k.scale)].map((b, i) => card(M.chordById(k.root, k.scale, b.id, size), b.id, i + 7, b.ru)).join('');
  return `${main}<div class="guests-h"><b>Неожиданные гости</b> — аккорды «из соседнего лада». Одна чужая нота даёт краску: используй по одному за прогрессию.</div>${guests}`;
}
function seqMarkup() {
  if (!st.seq.length) return '<p class="muted">Нажми аккорд, с которого начнёшь. Чаще всего начинают с первого — «дома».</p>';
  const ch = seqChords(st.seq);
  return `<div class="seq">${ch.map((c, i) => `<button class="sq" data-rm="${i}" title="Убрать"><small>${esc(c.roman)}</small>${U.chordLabel(c.name)}<i>×</i></button>`).join('<span class="sa">→</span>')}</div>
    <div class="ck-btns"><button class="btn pri" data-seq="play">▶ Слушать</button><button class="btn" data-seq="mid">⬇ .mid</button><button class="btn" data-seq="clear">↺ Очистить</button>
    <label class="tgl"><input type="checkbox" id="chBass" ${st.bass ? 'checked' : ''}> + бас</label></div>`;
}
function progsMarkup() {
  const f = fam(keyNow().scale);
  const list = PROGS.filter(p => p.fam === f && (!st.style || p.tags.includes(st.style)));
  if (!list.length) return '<p class="muted">Для этого стиля нет готовой прогрессии в этом ладу — переключи мажор/минор или стиль.</p>';
  return list.map(p => {
    const ch = progChords(p);
    return `<div class="prog" data-prog="${p.id}">
      <div class="ph"><b>${esc(p.name)}</b><span class="rns">${ch.map(c => esc(c.roman)).join(' – ')}</span></div>
      <div class="pc">${ch.map(c => `<span>${U.chordLabel(c.name)}</span>`).join('')}</div>
      <p>${esc(p.note)}</p>
      <div class="tags">${p.tags.map(t => `<span>${esc(STYLES[t].name)}</span>`).join('')}</div>
      <div class="pb"><button class="btn pri" data-act="use">Взять в конструктор</button><button class="btn" data-act="play">▶</button><button class="btn" data-act="mid">⬇ .mid</button></div></div>`;
  }).join('');
}
function rollMarkup() {
  const k = keyNow(), ch = seqChords(st.seq);
  if (!ch.length) return '<p class="muted">Здесь появится твоя прогрессия в пиано-ролле.</p>';
  return U.pianoRoll({ notes: progNotes(ch, st.bass), steps: ch.length * 16, stepW: 16, scale: M.scalePcs(k.root, k.scale), rootPc: k.root, title: 'Прогрессия в пиано-ролле' });
}

/* ---------- разметка: примеры партий ---------- */
function partChords(patId) {
  const seq = st.seq.length >= 2 ? st.seq : DEFAULT_SEQ[fam(keyNow().scale)];
  return seqChords(seq, keyNow(), st.seventh || !!P().PATTERNS[patId].seventh);
}
function partsMarkup() {
  const k = keyNow(), pats = Object.entries(P().PATTERNS).filter(([, p]) => !st.style || p.tags.includes(st.style));
  if (!pats.length) return '<p class="muted">Для этого стиля нет примеров — выбери «Все стили».</p>';
  return pats.map(([id, p]) => {
    const part = P().PARTS[p.part], notes = P().generate(id, partChords(id), k);
    return `<div class="partcard" data-pat="${id}" style="--pc2:${part.color}">
      <div class="pt-h"><span class="pi">${part.icon}</span><div><b>${esc(part.name)}</b><small>${esc(p.name)}</small></div>
        <label class="tgl mixt" title="Добавить в общий микс"><input type="checkbox" data-mix="${id}" ${st.mix.has(id) ? 'checked' : ''}> в микс</label></div>
      <div class="tags">${p.tags.map(t => `<span>${esc(STYLES[t].name)}</span>`).join('')}</div>
      <p>${esc(p.desc)}</p>
      ${P().miniRoll(notes, k)}
      <div class="pb"><button class="btn sm" data-pact="play">▶</button><button class="btn sm" data-pact="mid">⬇ .mid</button><button class="btn sm" data-pact="recipe">🎛 Рецепт звука</button></div>
      <div class="recipe ${st.recipe === id ? '' : 'hide'}">${st.recipe === id && MP.recipes ? MP.recipes.markup(p.part, k) : ''}</div></div>`;
  }).join('');
}
function mixLayers() {
  const k = keyNow();
  return [...st.mix].filter(id => P().PATTERNS[id]).map(id => {
    const p = P().PATTERNS[id];
    return { id, part: p.part, title: `${P().PARTS[p.part].name} - ${p.name}`, notes: P().generate(id, partChords(id), k) };
  });
}

/* прогрессия по умолчанию — своя для минора и мажора; пользовательскую не трогаем */
function syncSeq() {
  const f = fam(keyNow().scale);
  if (!st.seq || (st.seqFam !== f && DEFAULT_SEQ[st.seqFam] && st.seq.join() === DEFAULT_SEQ[st.seqFam].join())) st.seq = [...DEFAULT_SEQ[f]];
  st.seqFam = f;
}
function render() {
  syncSeq();
  const k = keyNow(), t = U.keyTitle(k.root, k.scale);
  const styles = Object.entries(STYLES).map(([id, s]) => `<button class="chip sm ${st.style === id ? 'on' : ''}" data-style="${id}" style="--c:${s.color}">${s.icon} ${esc(s.name)}</button>`).join('');
  el.innerHTML = `
    <div class="box"><h3 class="bh">Тональность (как в Ableton: Root Note + Scale)</h3>${U.keyPicker({ root: k.root, scale: k.scale, scales: HEPTA })}</div>
    <div class="sec-h"><div><h2>Аккорды ${esc(t.long)} ${U.djTag(k.root, k.scale)}</h2>
      <p>7 аккордов из нот гаммы — все звучат вместе без фальши. <b>Нажимай аккорды по очереди</b> — соберёшь свою прогрессию, а на карточках появятся звёзды: какой аккорд естественно поставить следующим.</p></div>
      <div class="seg sm" id="chSize"><button data-size="3" class="${st.seventh ? '' : 'on'}">Трезвучия</button><button data-size="4" class="${st.seventh ? 'on' : ''}">Септаккорды</button></div></div>
    <div class="ccards" id="chCards">${cardsMarkup()}</div>
    <div class="box seqbox"><h3 class="bh">Твоя прогрессия <small class="muted">до ${MAX_SEQ} аккордов · нажми на аккорд в строке, чтобы убрать</small></h3><div id="chSeq">${seqMarkup()}</div>
      <div id="chRoll" class="roll-box">${rollMarkup()}</div></div>
    <div class="sec-h"><div><h2>Готовые прогрессии</h2><p>Римские цифры не зависят от тональности: смени тональность — аккорды пересчитаются.</p></div></div>
    <div class="chips" id="chStyles"><button class="chip sm ${st.style ? '' : 'on'}" data-style="">Все стили</button>${styles}</div>
    <div class="progs">${progsMarkup()}</div>
    <div class="sec-h"><div><h2>Примеры партий на твою прогрессию</h2><p>Каждую партию можно послушать, скачать .mid и посмотреть рецепт звука для синтов Live, Serum 2 и Diva. Отметь «в микс» — и послушай всё вместе.</p></div>
      <div class="ck-btns"><button class="btn pri" id="mixPlay">▶ Микс</button><button class="btn" id="mixStop">■</button><button class="btn" id="mixZip">⬇ Все отмеченные (ZIP)</button></div></div>
    <div class="parts" id="chParts">${partsMarkup()}</div>
    <div class="box how">
      <h3 class="bh">Как это сделать в Ableton</h3>
      <ol>
        <li><b>Вручную:</b> в клипе включи <b>Scale</b>, выбери Root Note = <b>${esc(M.pretty(t.sp.root))}</b> и Scale = <b>${esc(M.SCALES[k.scale].name)}</b>, нажми <kbd>K</kbd> (подсветка) и <kbd>G</kbd> (Fold to Scale — останутся только ноты гаммы). Аккорд = через одну строку вверх: 1-я, 3-я и 5-я подсвеченные строки.</li>
        <li><b>MIDI-эффект Chord:</b> по умолчанию сдвиги в полутонах — это «часы» с круга: Shift 1 = <b>+4</b>, Shift 2 = <b>+7</b> — мажор; <b>+3</b> и <b>+7</b> — минор. С включённым <b>Use Current Scale</b> сдвиги станут ступенями: Shift 1 = <b>+2</b>, Shift 2 = <b>+4</b> — любая нота даёт аккорд своей ступени (Shift 3 = <b>+6</b> — септаккорд).</li>
        <li><b>Генератор Stacks</b> (Live 12, панель Generate в окне клипа): аккорды и прогрессии внутри гаммы клипа. Применить — <kbd>Cmd</kbd>+<kbd>Enter</kbd>.</li>
        <li><b>Обращения:</b> кнопка Invert в Live зеркалит ноты — это не обращение. Чтобы сделать обращение, выдели нижнюю ноту аккорда и нажми <kbd>Shift</kbd>+<kbd>↑</kbd> (на октаву вверх). Голоса между аккордами должны двигаться на 1–2 клетки — тогда прогрессия звучит «дорого».</li>
        <li><b>Готовые файлы:</b> «⬇ .mid» — одна партия. ZIP — все отмеченные: распакуй, выдели файлы и перетащи в Arrangement, <b>удерживая <kbd>Cmd</kbd></b> — каждая партия встанет на свою дорожку.</li>
      </ol></div>`;
}
const refresh = { cards() { const c = U.$('#chCards', el); c.classList.add('noanim'); c.innerHTML = cardsMarkup(); }, seq() { U.$('#chSeq', el).innerHTML = seqMarkup(); U.$('#chRoll', el).innerHTML = rollMarkup(); }, parts() { U.$('#chParts', el).innerHTML = partsMarkup(); } };
const afterSeq = () => { refresh.cards(); refresh.seq(); refresh.parts(); };

function onClick(e) {
  const t = e.target;
  const card = t.closest('[data-chord]');
  if (card) {
    const id = /^\d$/.test(card.dataset.chord) ? +card.dataset.chord : card.dataset.chord;
    if (st.seq.length >= MAX_SEQ) st.seq.shift();
    st.seq.push(id);
    const c = M.chordById(keyNow().root, keyNow().scale, id, st.seventh ? 4 : 3);
    U.sound(S => { S.stop(); S.chord(U.voice(c.pcs)); });
    afterSeq();
    return;
  }
  const rm = t.closest('[data-rm]');
  if (rm) { st.seq.splice(+rm.dataset.rm, 1); afterSeq(); return; }
  const sq = t.closest('[data-seq]');
  if (sq) {
    if (sq.dataset.seq === 'clear') { st.seq = []; afterSeq(); return; }
    const ch = seqChords(st.seq);
    if (!ch.length) return;
    if (sq.dataset.seq === 'play') playChords(ch); else exportChords(ch, 'моя прогрессия');
    return;
  }
  const sz = t.closest('[data-size]');
  if (sz) { st.seventh = sz.dataset.size === '4'; render(); return; }
  const sty = t.closest('[data-style]');
  if (sty) { st.style = sty.dataset.style; render(); return; }
  if (t.id === 'chBass') { st.bass = t.checked; refresh.seq(); return; }
  const mix = t.closest('[data-mix]');
  if (mix) { if (mix.checked) st.mix.add(mix.dataset.mix); else st.mix.delete(mix.dataset.mix); return; }
  if (t.id === 'mixPlay') { const L = mixLayers(); if (L.length) P().playLayers(L, null, 64); return; }
  if (t.id === 'mixStop') { U.sound(S => S.stop()); return; }
  if (t.id === 'mixZip') { const L = mixLayers(); if (L.length) P().downloadZip(L, `${U.keyTitle(keyNow().root, keyNow().scale).long} — партии`); return; }
  const pact = t.closest('[data-pact]'), pc = t.closest('[data-pat]');
  if (pact && pc) {
    const id = pc.dataset.pat, p = P().PATTERNS[id], notes = P().generate(id, partChords(id), keyNow());
    if (pact.dataset.pact === 'play') P().playLayers([{ part: p.part, notes }], pc, 64);
    if (pact.dataset.pact === 'mid') U.download(P().midiBytes(notes, `${P().PARTS[p.part].name} ${p.name}`), `${U.safeName(`${U.keyTitle(keyNow().root, keyNow().scale).long} ${P().PARTS[p.part].name} ${p.name}`)}.mid`);
    if (pact.dataset.pact === 'recipe') { st.recipe = st.recipe === id ? null : id; refresh.parts(); }
    return;
  }
  const act = t.closest('[data-act]'), box = t.closest('[data-prog]');
  if (act && box) {
    const p = PROGS.find(x => x.id === box.dataset.prog), ch = progChords(p);
    if (act.dataset.act === 'use') { st.seq = [...p.deg]; if (p.seventh) st.seventh = true; render(); U.$('.seqbox', el).scrollIntoView({ behavior: 'smooth', block: 'center' }); playChords(seqChords(st.seq)); }
    if (act.dataset.act === 'play') playChords(ch);
    if (act.dataset.act === 'mid') exportChords(ch, p.name);
  }
}

MP.chords = { PROGS, progChords, seqChords, fam, keyNow, HEPTA };
MP.tabs.chords = {
  title: 'Аккорды',
  render(host) {
    el = host;
    render();
    U.bindKeyPicker(el, HEPTA);
    el.addEventListener('click', onClick);
    unsub = U.onKey(() => render());
  },
  destroy() { if (unsub) unsub(); el = null; },
};
})();
