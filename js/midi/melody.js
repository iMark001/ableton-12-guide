/* Вкладка «Мелодии»: простые правила, генератор примеров по ступеням, диапазоны, помощники Live 12. */
(function () {
'use strict';
const M = window.MusicCore, MP = window.MidiPage, U = MP.ui, esc = U.esc;
const BPM = 120, SPS = 60 / BPM / 4;

const RULES = [
  ['Только подсвеченные строки', 'Включи в клипе Scale и нажми <kbd>K</kbd>. Пиши ноты только на подсвеченных строках — фальши не будет.'],
  ['Сильная доля — нота аккорда', 'На «раз» и «три» ставь ноту из текущего аккорда (в примере ниже — жёлтые). Между ними — любые ноты гаммы (фиолетовые).'],
  ['Мотив + повтор', 'Придумай 2–4 ноты, повтори их, затем измени только хвост. Слушатель узнаёт повтор — это и есть хук.'],
  ['Вопрос — ответ', 'Первый такт заканчивается «в воздухе» (не на домашней ноте), второй возвращается домой.'],
  ['Ритм важнее нот', 'Сильный хук можно сыграть одной нотой. Сначала найди ритм, потом раскладывай по высоте.'],
  ['Шаги, а не прыжки', 'Двигайся по соседним нотам гаммы. Большие прыжки — как специи: один-два на фразу.'],
  ['Оставь воздух', 'Паузы делают мелодию слышной. В электронике чем меньше нот, тем сильнее.'],
];

/* Примеры берутся из общего генератора партий (js/midi/parts.js) */
const PAT_IDS = ['lead-hook', 'lead-afro', 'lead-pent', 'arp-16', 'pluck-8', 'bass-offbeat', 'chords-stab', 'pad-long'];

const RANGES = [
  ['Саб-бас', 'E0 – G1 (41–98 Hz)', 'Одна нота за раз, только корень и квинта.'],
  ['Бас, reese', 'C1 – C3', 'Грув и офбиты. Корень аккорда на «раз».'],
  ['Аккорды, пэды', 'C2 – C4 (ядро A2–A3)', 'Ниже C2 оставляй только корень и квинту — терции внизу «мутнят».'],
  ['Стэбы', 'C3 – C5', 'Короткие аккорды над басом.'],
  ['Лид, хук', 'C4 – C6', 'Главная мелодия, её слышно лучше всего.'],
  ['Плаки, арпеджио', 'C3 – C5', 'Быстрые ноты, часто на октаву выше аккордов.'],
];
const SWING = [
  ['House', 'MPC 16 Swing ≈ 54–58', 'хэты, шейкеры, бас, стэбы'],
  ['Tech House', '≈ 56–58', 'хэты, перкуссия, роллинг-бас'],
  ['UK Garage', '≈ 58–66', 'хэты, гоуст-снейры, бас, чопы'],
  ['Afro House', '≈ 56–62 + Random 5–10%', 'вся перкуссия'],
  ['Organic House', '≈ 60–65', 'перкуссия, плаки'],
  ['Techno, Melodic', 'ровно или 50–54', 'только перкуссия'],
  ['Downtempo', '58–66', 'всё, кроме кика'],
];
const TRICKS = [
  ['Аккорды одной рукой', 'MIDI-эффект Chord + Use Current Scale: Shift 1 = +2, Shift 2 = +4. Любая клавиша даёт трезвучие в гамме, +6 — септаккорд.'],
  ['Deep house «chord memory»', 'Chord без Use Current Scale: +3, +10, +14. Одна нота — m9, аккорд едет параллельно за басом. Ноты выходят за гамму, но это и есть звук Detroit и deep house.'],
  ['Вторая партия в терцию', 'Выдели мелодию → Add Interval = 2 ступени (при включённой гамме) — получится подголосок. Ещё раз с 4 — трезвучие.'],
  ['Invert — это не обращение', 'Кнопка Invert зеркалит ноты по вертикали. Обращение аккорда делай вручную: выдели нижнюю ноту и Shift+↑ (на октаву вверх).'],
  ['Педаль баса', 'Оставь бас на тонике, пока аккорды идут i–VI–VII: напряжение растёт само, а смена баса в дропе даёт удар.'],
  ['Повтор + одна деталь', 'Хук повторяется 3 раза одинаково, на 4-й меняется последняя нота или ритм — так устроены хуки tech house.'],
  ['Подписывай баунсы', 'Hook_Am_124.wav — поиск «Am» в браузере Live сразу найдёт всё совместимое.'],
];
const TOOLS = [
  ['Stacks', 'генератор', 'аккорды и прогрессии внутри гаммы клипа'],
  ['Seed', 'генератор', 'случайные ноты в выбранном диапазоне; при включённой гамме — только её ноты'],
  ['Shape', 'генератор', 'ноты по нарисованной кривой — быстрые мелодические «волны»'],
  ['Rhythm', 'генератор', 'ритмический паттерн на одной ноте или пэде Drum Rack'],
  ['Euclidean', 'генератор (Max for Live)', 'евклидовы ритмы до 4 голосов — афро и техно-перкуссия'],
  ['Arpeggiate', 'трансформация', 'превращает аккорд в арпеджио (18 стилей, как у Arpeggiator)'],
  ['Strum', 'трансформация', 'разносит ноты аккорда по времени, как перебор гитары'],
  ['Connect', 'трансформация', 'заполняет промежутки между нотами связующими нотами'],
  ['Ornament', 'трансформация', 'добавляет флэмы и форшлаги в начало нот'],
  ['Recombine', 'трансформация', 'перемешивает позиции, высоты, длины или velocity между нотами'],
];
const EFFECTS = [['scale', 'Scale', 'загоняет любые ноты в гамму'], ['chord', 'Chord', 'из одной ноты делает аккорд'], ['arpeggiator', 'Arpeggiator', 'играет аккорд по нотам'],
  ['random', 'Random', 'случайные ноты, с Use Current Scale — только из гаммы'], ['note-echo', 'Note Echo', 'MIDI-эхо: повторы нот'], ['pitch', 'Pitch', 'транспонирует входящие ноты']];

const st = { prog: null, pat: 'lead-hook', showChords: true };
let el = null, unsub = null;

const keyNow = () => MP.chords.keyNow();
function current() {
  const key = keyNow(), fam = MP.chords.fam(key.scale);
  const progs = MP.chords.PROGS.filter(p => p.fam === fam);
  const prog = progs.find(p => p.id === st.prog) || progs[0];
  st.prog = prog.id;
  const pat = { id: st.pat, ...MP.parts.PATTERNS[st.pat] };
  const chords = MP.chords.seqChords(prog.deg, key, !!prog.seventh || !!pat.seventh);
  return { key, progs, prog, pat, chords, mel: MP.parts.generate(st.pat, chords, key) };
}
const isMelodic = pat => ['lead', 'arp', 'pluck'].includes(pat.part);

function genMarkup() {
  const c = current();
  const bg = st.showChords && isMelodic(c.pat) ? c.chords.flatMap((ch, bar) => ch.voicing.map(p => ({ pitch: p, start: bar * 16, dur: 16, cls: 'bg' }))) : [];
  return `<div class="gen-ctl">
      <label>Прогрессия <select id="mlProg">${c.progs.map(p => `<option value="${p.id}" ${p.id === c.prog.id ? 'selected' : ''}>${esc(p.name)} · ${c.prog.id === p.id ? c.chords.map(x => x.name).join(' – ') : esc(p.deg.map(d => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][d]).join('–'))}</option>`).join('')}</select></label>
      <div class="chips" id="mlPats">${PAT_IDS.map(id => `<button class="chip sm ${id === st.pat ? 'on' : ''}" data-pat="${id}">${esc(MP.parts.PARTS[MP.parts.PATTERNS[id].part].icon)} ${esc(MP.parts.PATTERNS[id].name)}</button>`).join('')}</div></div>
    <p>${esc(c.pat.desc)} <span class="tags">${c.pat.tags.map(t => `<span>${esc(STYLES[t].name)}</span>`).join('')}</span></p>
    <div class="legend"><span><i class="ct"></i>нота аккорда</span><span><i class="pt"></i>проходящая нота гаммы</span>${bg.length ? '<span><i class="bg"></i>аккорды (для ориентира)</span>' : ''}</div>
    <div id="mlRoll">${U.pianoRoll({ notes: [...bg, ...c.mel], steps: 64, stepW: 16, scale: M.scalePcs(c.key.root, c.key.scale), rootPc: c.key.root, title: 'Пример мелодии' })}</div>
    <div class="ck-btns"><button class="btn pri" id="mlPlay">▶ Слушать</button><button class="btn" id="mlStop">■ Стоп</button><button class="btn" id="mlMid">⬇ .mid</button>
      <label class="tgl"><input type="checkbox" id="mlChords" ${st.showChords ? 'checked' : ''}> с аккордами</label></div>`;
}
function play() {
  const c = current();
  U.sound(S => {
    S.stop();
    const ev = c.mel.map(n => ({ midi: n.pitch, at: n.start * SPS, dur: n.dur * SPS * 0.92, vel: 0.85 }));
    if (st.showChords && isMelodic(c.pat)) c.chords.forEach((ch, bar) => ev.push({ midi: ch.voicing, at: bar * 16 * SPS, dur: 16 * SPS * 0.95, vel: 0.45 }));
    S.play(ev);
    U.playhead(U.$('#mlRoll', el), 64, SPS);
  });
}
function exportMid() {
  const c = current();
  const notes = c.mel.map(n => ({ pitch: n.pitch, start: n.start * 120, dur: n.dur * 120, vel: 96 }));
  const name = `${U.keyTitle(c.key.root, c.key.scale).short} ${c.pat.name} ${c.chords.map(x => x.name).join('-')}`;
  U.download(M.writeMidi({ notes, bpm: BPM, name }), `${U.safeName(name)}.mid`);
}

function render() {
  const k = keyNow();
  el.innerHTML = `
    <div class="sec-h"><div><h2>Как писать мелодии без теории</h2><p>7 правил, которые работают в любом стиле.</p></div></div>
    <div class="rules">${RULES.map(([h, t], i) => `<div class="rule reveal"><span class="n">${i + 1}</span><b>${h}</b><p>${t}</p></div>`).join('')}</div>
    <div class="box"><h3 class="bh">Примеры по правилам — в твоей тональности</h3>${U.keyPicker({ root: k.root, scale: k.scale, scales: MP.chords.HEPTA })}
      <div id="mlGen">${genMarkup()}</div></div>
    <div class="dt-grid">
      <div class="box"><h3 class="bh">Где какая партия (нотация Ableton, C3 = средняя до)</h3>
        <table class="mini"><tr><th>Партия</th><th>Диапазон</th><th>Зачем</th></tr>${RANGES.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table></div>
      <div class="box"><h3 class="bh">Свинг по стилям (Groove Pool)</h3>
        <table class="mini"><tr><th>Стиль</th><th>Грув</th><th>На что вешать</th></tr>${SWING.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
        <p class="muted">Число в названии MPC-грува — процент свинга: 50 = ровно, ≈ 66 = почти триоль. С Live 12.1 грув сам применяется к новым MIDI-клипам, но Global Groove Amount стоит на 0% — подними его. Кик не свингуй.</p></div>
      <div class="box"><h3 class="bh">Приёмы в Live 12</h3><ul class="tools">${TRICKS.map(t => `<li><b>${esc(t[0])}.</b> ${esc(t[1])}</li>`).join('')}</ul></div>
      <div class="box"><h3 class="bh">Помощники Live 12</h3>
        <p class="muted">MIDI Tools: окно клипа → панель Transform или Generate. Применить — <kbd>Cmd</kbd>+<kbd>Enter</kbd>. Если в клипе включена гамма, инструменты работают в её ступенях.</p>
        <ul class="tools">${TOOLS.map(t => `<li><b>${esc(t[0])}</b> <span class="badge v">${esc(t[1])}</span> ${esc(t[2])}</li>`).join('')}</ul>
        <p class="muted">MIDI-эффекты на дорожке (разбор каждого — в гиде по устройствам):</p>
        <div class="chips">${EFFECTS.map(e => `<a class="chip sm" href="index.html#d-${e[0]}" title="${esc(e[2])}">${esc(e[1])}</a>`).join('')}</div></div>
    </div>`;
}
function onClick(e) {
  const t = e.target;
  const p = t.closest('[data-pat]');
  if (p) { st.pat = p.dataset.pat; U.$('#mlGen', el).innerHTML = genMarkup(); return; }
  if (t.id === 'mlPlay') play();
  else if (t.id === 'mlStop') U.sound(S => S.stop());
  else if (t.id === 'mlMid') exportMid();
  else if (t.id === 'mlChords') { st.showChords = t.checked; U.$('#mlGen', el).innerHTML = genMarkup(); }
}
function onChange(e) { if (e.target.id === 'mlProg') { st.prog = e.target.value; U.$('#mlGen', el).innerHTML = genMarkup(); } }

MP.tabs.melody = {
  title: 'Мелодии',
  render(host) {
    el = host;
    render();
    U.bindKeyPicker(el, MP.chords.HEPTA);
    el.addEventListener('click', onClick);
    el.addEventListener('change', onChange);
    unsub = U.onKey(() => { st.prog = null; render(); });
  },
  destroy() { if (unsub) unsub(); el = null; },
};
})();
