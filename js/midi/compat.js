/* Вкладка «Совместимость»: тональность проекта (как в Ableton) → готовые сочетания партий →
   что делать с лупами из всех 23 других тональностей → шпаргалка DJ (колесо, таблица, матрица). */
(function () {
'use strict';
const M = window.MusicCore, MP = window.MidiPage, U = MP.ui, esc = U.esc;
const K = M.KEYS24;
const LEVEL_TEXT = { same: 'выбрана', perfect: 'идеально', great: 'отлично', careful: 'осторожно', mood: 'смена настроения', clash: 'конфликт' };
const st = { view: 'wheel' };
let el = null, unsub = null;

const fx = v => v.toFixed(2);
const pt = (deg, r) => { const a = deg * Math.PI / 180; return [r * Math.sin(a), -r * Math.cos(a)]; };
const famKey = k => (k.scale === 'major' || k.scale === 'minor' ? k : { root: k.root, scale: MP.chords.fam(k.scale) });
const project = () => famKey(U.state.key);
const selIndex = () => { const k = project(); return K.findIndex(x => x.root === k.root && x.scale === k.scale); };
const kname = (root, scale) => esc(M.keyName(root, scale).ableton);

/* ---------- готовые сочетания партий ---------- */
/* layers: [паттерн, гамма-источник для пентатоники: 'v' | 'iv' | 'rel' | null] */
const COMBOS = {
  minor: [
    { name: 'Melodic Techno: эпичная', prog: 'm-epic', tags: ['melodic', 'techno'], layers: [['sub-long'], ['pad-long'], ['arp-16'], ['lead-hook']] },
    { name: 'Лид из соседней тональности', prog: 'm-drive', tags: ['techno', 'melodic'], layers: [['bass-onenote'], ['pad-long'], ['lead-pent', 'v']] },
    { name: 'Deep / UK Garage', prog: 'm-deep', tags: ['garage', 'house'], layers: [['bass-garage'], ['chords-stab'], ['chop', 'rel']] },
    { name: 'Afro House', prog: 'm-two', tags: ['afro', 'organic'], layers: [['bass-afro'], ['chords-off'], ['lead-afro']] },
    { name: 'Tech House: роллинг', prog: 'm-deep', tags: ['techhouse'], layers: [['bass-rolling'], ['chords-stab'], ['lead-pent', 'iv']] },
    { name: 'Organic / Downtempo', prog: 'm-swing', tags: ['organic', 'downtempo'], layers: [['sub-long'], ['pad-long'], ['pluck-8']] },
    { name: 'Вокал в параллельном мажоре', prog: 'm-epic', tags: ['house', 'melodic'], layers: [['bass-offbeat'], ['chords-off'], ['lead-pent', 'rel']] },
    { name: 'Ambient-подъём', prog: 'm-rise', tags: ['ambient', 'melodic'], layers: [['sub-long'], ['pad-long'], ['arp-16']] },
  ],
  major: [
    { name: 'House-хит', prog: 'M-pop', tags: ['house'], layers: [['bass-offbeat'], ['chords-off'], ['lead-hook']] },
    { name: 'Лид из соседней тональности', prog: 'M-emo', tags: ['melodic', 'house'], layers: [['sub-long'], ['pad-long'], ['lead-pent', 'v']] },
    { name: 'UK Garage ii–V–I', prog: 'M-jazz', tags: ['garage'], layers: [['bass-garage'], ['chords-stab'], ['chop', 'rel']] },
    { name: 'Afro / Organic', prog: 'M-calm', tags: ['afro', 'organic'], layers: [['bass-afro'], ['chords-off'], ['lead-afro']] },
    { name: 'Tech House', prog: 'M-up', tags: ['techhouse'], layers: [['bass-rolling'], ['chords-stab'], ['lead-pent', 'iv']] },
    { name: 'Downtempo', prog: 'M-emo', tags: ['downtempo'], layers: [['sub-long'], ['pad-long'], ['pluck-8']] },
    { name: 'Вокал в параллельном миноре', prog: 'M-pop', tags: ['house', 'melodic'], layers: [['bass-offbeat'], ['pad-long'], ['lead-pent', 'rel']] },
    { name: 'Ambient', prog: 'M-calm', tags: ['ambient'], layers: [['sub-long'], ['pad-long'], ['arp-16']] },
  ],
};
function pentaSource(src, k) {
  if (!src) return null;
  const minor = k.scale === 'minor';
  const map = minor ? { v: [7, 'minorPent', 'minor'], iv: [5, 'minorPent', 'minor'], rel: [3, 'majorPent', 'major'] }
    : { v: [7, 'majorPent', 'major'], iv: [5, 'majorPent', 'major'], rel: [9, 'minorPent', 'minor'] };
  const [off, scale, keyScale] = map[src];
  const root = M.mod12(k.root + off);
  return { penta: { root, scale }, keyScale, root };
}
function comboData(c, k) {
  const prog = MP.chords.PROGS.find(p => p.id === c.prog);
  return c.layers.map(([id, src]) => {
    const pat = MP.parts.PATTERNS[id], ps = pentaSource(src, k);
    const chords = MP.chords.seqChords(prog.deg, k, !!prog.seventh || !!pat.seventh);
    const notes = MP.parts.generate(id, chords, k, ps ? { penta: ps.penta } : {});
    const autoPenta = !ps && pat.penta ? MP.parts.pentaFor(k) : null;
    const label = ps ? `${M.keyName(ps.penta.root, ps.penta.scale).ableton}` : autoPenta ? M.keyName(autoPenta.root, autoPenta.scale).ableton : M.keyName(k.root, k.scale).ableton;
    return { id, part: pat.part, title: `${MP.parts.PARTS[pat.part].name} - ${pat.name}`, notes, label, ps, chords };
  });
}
function whyText(c, k, layers) {
  const ext = layers.find(l => l.ps);
  const pk = M.keyName(k.root, k.scale).ableton;
  if (!ext) return `Все партии из нот ${pk}: аккорды, бас и мелодия построены на одной гамме, поэтому совпадают сами.`;
  const kk = M.keyName(ext.ps.root, ext.ps.keyScale);
  const rel = { v: 'соседняя тональность', iv: 'соседняя тональность', rel: 'параллельная тональность — те же 7 нот' }[c.layers.find(l => l[1])[1]];
  return `Мелодия идёт по ${esc(M.keyName(ext.ps.penta.root, ext.ps.penta.scale).ableton)} — это пять нот из ${esc(kk.ableton)} (${rel}). Все пять есть в ${esc(pk)}, поэтому лупы и мелодии в ${esc(kk.ableton)} можно смело брать в проект.`;
}
function combosMarkup() {
  const k = project(), list = COMBOS[k.scale];
  return list.map((c, i) => {
    const layers = comboData(c, k), prog = MP.chords.PROGS.find(p => p.id === c.prog), ch = layers[0].chords;
    const all = layers.flatMap(l => l.notes.map(n => ({ ...n, cls: { sub: 'bs', bass: 'bs', chords: 'bg', pad: 'bg' }[l.part] || n.cls })));
    return `<div class="combo" data-combo="${i}" style="animation-delay:${i * 50}ms">
      <div class="ph"><b>${i + 1}. ${esc(c.name)}</b><span class="tags">${c.tags.map(t => `<span>${esc(STYLES[t].name)}</span>`).join('')}</span></div>
      <ul class="lay">${layers.map(l => `<li><span>${MP.parts.PARTS[l.part].icon} ${esc(MP.parts.PARTS[l.part].name)}</span><b>${esc(l.label)}</b><small>${esc(l.title.split(' - ')[1])}</small></li>`).join('')}
        <li><span>🎹 Аккорды</span><b>${ch.map(x => U.chordLabel(x.name)).join(' – ')}</b><small>${esc(prog.name)}</small></li></ul>
      <p class="why">${whyText(c, k, layers)}</p>
      ${U.pianoRoll({ notes: all, steps: 64, stepW: 5, rowH: 7, fold: true, scale: M.scalePcs(k.root, k.scale), rootPc: k.root, title: 'Сочетание' })}
      <div class="pb"><button class="btn sm pri" data-cact="play">▶ Слушать</button><button class="btn sm" data-cact="stop">■</button><button class="btn sm" data-cact="zip">⬇ Партии (ZIP)</button></div></div>`;
  }).join('');
}

/* ---------- лупы из других тональностей ---------- */
/* одна «чужая» нота соседней тональности: светлее (повышенная) или темнее (пониженная) */
function colorNote(project, other) {
  const ps = new Set(M.scalePcs(project.root, project.scale)), os = new Set(M.scalePcs(other.root, other.scale));
  const f = [...os].find(p => !ps.has(p));        /* чужая нота лупа */
  const gone = [...ps].find(p => !os.has(p));      /* нота проекта, которую она заменяет */
  if (f === undefined || gone === undefined) return '';
  const name = M.pretty(M.spellScale(other.root, other.scale).notes[M.scalePcs(other.root, other.scale).indexOf(f)]);
  const brighter = M.mod12(f - gone) === 1;
  const mode = project.scale === 'minor' ? (brighter ? 'дорийский' : 'фригийский') : (brighter ? 'лидийский' : 'миксолидийский');
  return `добавит ноту <b>${esc(name)}</b> — трек станет ${brighter ? 'светлее' : 'темнее'} (${mode} оттенок)`;
}
function movesMarkup() {
  const k = project(), n = parseInt(M.camelot(k.root, k.scale), 10), letter = k.scale === 'minor' ? 'A' : 'B';
  const byCode = code => K.find(x => x.camelot === code);
  const wrap = v => ((v - 1 + 120) % 12) + 1;
  const nm = x => (x ? esc(M.keyName(x.root, x.scale).ableton) : '');
  const other = letter === 'A' ? 'B' : 'A';
  const rows = [
    ['Тот же код', byCode(`${n}${letter}`), 'полное совпадение', 'да', 'всегда'],
    ['A ↔ B', byCode(`${n}${other}`), 'те же ноты, другое настроение', 'да', 'мажорный вокал в минорном треке и наоборот, «осветлить» дроп'],
    ['+1 по кругу', byCode(`${wrap(n + 1)}${letter}`), 'одна чужая нота — светлее', 'обычно да (house, afro)', 'в своих аккордах замени минорный iv на мажорный IV'],
    ['−1 по кругу', byCode(`${wrap(n - 1)}${letter}`), 'одна чужая нота — темнее', 'часто да (techno)', 'мрачные лупы'],
    ['+2 «energy boost»', byCode(`${wrap(n + 2)}${letter}`), 'подъём на тон', 'нет — только транспонировать', 'смена тональности в финальном дропе'],
    ['+7 по кругу', byCode(`${wrap(n + 7)}${letter}`), 'подъём на полтона', 'нет', 'последний дроп или припев'],
  ];
  return `<div class="tbl-wrap"><table class="loops moves"><thead><tr><th>Шаг (как в DJ-программах)</th><th>Для твоего проекта</th><th>Как звучит</th><th>Наслаивать лупы?</th><th>Когда</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td><b>${r[0]}</b></td><td>${nm(r[1])} <span class="dj">DJ ${esc(r[1] ? r[1].camelot : '')}</span></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted">Диджей ставит треки друг за другом, а продюсер кладёт лупы одновременно, поэтому при наслаивании правила строже. Источник: Mixed In Key, перенос на наслаивание — практика продюсеров.</p>`;
}
const SCENARIOS = [
  ['Проект в A Minor, нашёл луп в E Minor (соседи)', ['Перетащи луп, проверь, что Warp включён.', 'Послушай вместе. Красиво — оставь: луп добавил ноту F♯, трек стал дорийским. В своих аккордах замени Dm на D.', 'Режет слух — Pitch +5 (E Minor → A Minor). Вариант −7 опустит луп ниже: выбирай, где регистр звучит естественнее.', 'Warp Mode: аккорды и музыка — Complex Pro; одноголосая мелодия — Tones; вокал — Complex Pro с Formants 100%.', 'Проверка чужих нот: правый клик по клипу → Convert Harmony to New MIDI Track (или Melody) → в MIDI-клипе Scale = A Minor, K и F. Ноты вне подсветки и есть конфликтующие.']],
  ['Луп в C♯ Minor, проект в C Minor (разница полтона)', ['Без изменений нельзя: общих нот всего 2 из 7.', 'Двигаем луп: Pitch −1 — сдвиг на полтон почти не слышен (Complex Pro для аккордов).', 'Или двигаем проект, если луп главный: в каждом MIDI-клипе Cmd+A → ↑ один раз, Root клипа = C♯. Без правки нот — MIDI-эффект Pitch +1 перед инструментом.', 'Сдвиг до ±2–3 полутонов обычно безопасен, дальше растут артефакты.']],
  ['MIDI-файл без тональности (из библиотеки)', ['Перетащи на MIDI-дорожку и нажми F — останутся только используемые ноты.', 'Кандидат в тонику: самая низкая и частая нота баса, нота, на которой мелодия «успокаивается», последняя длинная нота.', 'Scale Mode → Root = кандидат, Scale = Minor, нажми K. Все ноты в подсветке — нашёл. 1–2 ноты вне лада — попробуй Dorian (чужая на 6-й ступени) или Phrygian (на 2-й).', 'Или просто перетащи файл во вкладку «Тональность MIDI» этой страницы.', 'Каталог: заведи в Tags Editor группу «Key» и помечай проверенные файлы — потом фильтруй браузер по тегу (Live 12.1+).']],
  ['Ищу сэмплы сразу в тональности (Splice в Live 12.3+)', ['В Control Bar включи Scale Mode, задай Root и Minor/Major проекта.', 'Браузер → Splice → фильтр Key → Apply Key from DAW (работает только для мажора и минора).', 'В настройках прослушивания включи транспонирование и синхронизацию с тональностью Set.', 'Search with Sound подбирает сэмплы по стилю и ритму, но не по тональности — проверяй ушами.', 'После перетаскивания проверь Pitch и Warp клипа.']],
  ['Акапелла в другой тональности', ['Pitch на разницу в полутонах (таблица выше).', 'Warp Mode Complex Pro, Formants 100% — голос не станет «бурундуком».', 'Для подтяжки нот в гамму — Auto Shift (Live 12.1+) и Scale Mode у аудиоклипа.']],
];
function scenariosMarkup() {
  return `<div class="scen">${SCENARIOS.map(([h, steps], i) => `<details class="ref" ${i === 0 ? 'open' : ''}><summary>${esc(h)}</summary><ol>${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></details>`).join('')}</div>`;
}
function loopsMarkup() {
  const k = project(), plan = M.otherKeysPlan(k), pk = M.keyName(k.root, k.scale).ableton;
  const sign = n => (n > 0 ? `+${n}` : `${n}`);
  const row = (p, i) => {
    const name = M.keyName(p.key.root, p.key.scale);
    let icon, act;
    if (p.action === 'asis') { icon = '✅'; act = p.shared === 7 ? 'те же ноты — бери как есть' : `бери как есть: ${colorNote(k, p.key)}`; }
    else if (p.action === 'check') { icon = '⚠️'; act = `5 из 7 нот общие — наслаивать рискованно. Лучше Pitch <b>${sign(p.shift)}</b> st → станет ${esc(M.keyName(p.target.root, p.target.scale).ableton)}`; }
    else {
      icon = '↕';
      const tgt = M.keyName(p.target.root, p.target.scale).ableton;
      act = `Pitch <b>${sign(p.shift)}</b> st → станет ${esc(tgt)}${tgt !== pk ? ` (те же ноты, что ${esc(pk)})` : ''}${p.via === 'mood' ? '. Мажор и минор от разных нот — настроение изменится, слушай' : ''}`;
    }
    return `<tr class="act-${p.action}" style="animation-delay:${i * 25}ms"><td class="ic">${icon}</td><td><b>${esc(name.ableton)}</b><span class="dj">DJ ${esc(name.dj)}</span></td><td class="sh">${p.shared}/7</td><td>${act}</td></tr>`;
  };
  return `<div class="tbl-wrap"><table class="loops"><thead><tr><th></th><th>Луп / сэмпл в</th><th>Общих нот</th><th>Что сделать в Ableton, чтобы подошло к ${esc(pk)}</th></tr></thead>
    <tbody>${plan.map(row).join('')}</tbody></table></div>`;
}
function howMarkup() {
  const k = project(), t = U.keyTitle(k.root, k.scale);
  return `<div class="how3">
    <div><b>🔊 Аудиолуп или вокал</b><ol><li>Дважды кликни клип → панель <b>Audio Utilities</b>.</li><li>Ручка <b>Pitch</b> — введи число из таблицы (например +3).</li><li>Включи <b>Warp</b>: музыка — <b>Complex Pro</b>, одноголосая мелодия — <b>Tones</b>, вокал — Complex Pro с <b>Formants 100%</b>. Сдвиг больше ±5 st заметно меняет тембр.</li></ol></div>
    <div><b>🎹 MIDI-клип</b><ol><li>Открой клип, выдели все ноты <kbd>Cmd</kbd>+<kbd>A</kbd>.</li><li>Нажми <kbd>↑</kbd> или <kbd>↓</kbd> нужное число раз (1 нажатие = 1 полутон) или введи число в слайдер <b>Transpose</b>.</li><li>Включи <b>Scale</b> = ${esc(M.pretty(t.sp.root))} ${esc(M.SCALES[k.scale].name)} и <kbd>K</kbd> — проверь, что все ноты попали в подсветку. Если нет — кнопка <b>Fit to Scale</b>.</li></ol></div>
    <div><b>🔎 Поиск сэмплов (Splice в браузере Live 12)</b><ol><li>Фильтр <b>Key</b> → <b>Apply Key from DAW</b> (нужен включённый Scale Mode в Control Bar; только мажор и минор). Или выбирай из зелёных строк таблицы.</li><li>В настройках прослушивания можно транспонировать сэмпл или синхронизировать его со Scale проекта.</li><li>Колонку <b>Key</b> видно, если развернуть список.</li></ol></div></div>`;
}

/* ---------- шпаргалка DJ: колесо, таблица, матрица ---------- */
function sector(r1, r2, a0, a1) {
  const [x1, y1] = pt(a0, r2), [x2, y2] = pt(a1, r2), [x3, y3] = pt(a1, r1), [x4, y4] = pt(a0, r1);
  return `M${fx(x1)} ${fx(y1)} A${r2} ${r2} 0 0 1 ${fx(x2)} ${fx(y2)} L${fx(x3)} ${fx(y3)} A${r1} ${r1} 0 0 0 ${fx(x4)} ${fx(y4)} Z`;
}
function wheelMarkup() {
  const parts = K.map((k, i) => {
    const n = parseInt(k.camelot, 10), minor = k.scale === 'minor';
    const [r1, r2] = minor ? [92, 150] : [152, 214];
    const mid = n * 30, [tx, ty] = pt(mid, (r1 + r2) / 2);
    return `<g class="cs" data-k="${i}" tabindex="0" role="button" aria-label="${esc(M.keyName(k.root, k.scale).ableton)}">
      <path d="${sector(r1, r2, mid - 14.5, mid + 14.5)}"/>
      <text class="c1" x="${fx(tx)}" y="${fx(ty - 1)}">${esc(M.pretty(k.name))}</text>
      <text class="c2" x="${fx(tx)}" y="${fx(ty + 12)}">${minor ? 'Minor' : 'Major'}</text>
      <text class="c3" x="${fx(tx)}" y="${fx(ty + 22)}">${esc(k.camelot)}</text></g>`;
  }).join('');
  return `<svg class="wheel" viewBox="-230 -230 460 460" role="img" aria-label="Колесо тональностей">${parts}
    <circle class="hub" r="86"/><text class="h1" y="-4" id="cwName"></text><text class="h2" y="20" id="cwSub"></text></svg>`;
}
function tableMarkup() {
  const rows = K.map((k, i) => {
    const ch = M.diatonicChords(k.root, k.scale, 3);
    return `<tr data-row="${i}"><td><b>${esc(M.keyName(k.root, k.scale).ableton)}</b><small>${esc(U.keyTitle(k.root, k.scale).ru)}</small></td>
      <td class="notes">${k.notes.map(n => `<span>${esc(M.pretty(n))}</span>`).join('')}</td>
      <td class="chs">${ch.map(c => `<span title="${esc(c.roman)}">${U.chordLabel(c.name)}</span>`).join('')}</td>
      <td class="lv"></td><td><span class="dj">DJ ${esc(k.camelot)}</span></td></tr>`;
  }).join('');
  return `<div class="tbl-wrap"><table class="ktable"><thead><tr><th>Тональность (Ableton)</th><th>Ноты — их можно нажимать</th><th>Аккорды I–VII</th><th>С твоим проектом</th><th>Код DJ</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function matrixMarkup() {
  const lab = k => `${M.pretty(k.short)}`;
  const head = K.map(k => `<div class="mh">${esc(lab(k))}</div>`).join('');
  const cells = K.map((a, i) => `<div class="mh row">${esc(M.keyName(a.root, a.scale).ableton)}</div>` + K.map((b, j) => {
    const s = M.sharedNotes(a, b);
    return `<div class="mc s${s}" style="animation-delay:${(i + j) * 14}ms" title="${esc(M.keyName(a.root, a.scale).ableton)} + ${esc(M.keyName(b.root, b.scale).ableton)}: ${s} общих нот из 7">${s}</div>`;
  }).join('')).join('');
  return `<div class="tbl-wrap"><div class="matrix"><div class="mh"></div>${head}${cells}</div></div>
    <p class="muted">Число — сколько нот из 7 у двух тональностей общие: 7 — те же ноты, 6 — соседи, 5 — с осторожностью, меньше — фальшь.</p>`;
}
function applyLevels() {
  const a = K[selIndex()];
  U.$$('.cs', el).forEach(g => {
    const j = +g.dataset.k;
    g.setAttribute('class', `cs lv-${M.compat(a, K[j]).level}`);
    g.style.transitionDelay = `${(Math.abs(parseInt(K[j].camelot, 10) - parseInt(a.camelot, 10)) % 12) * 35}ms`;
  });
  const n = U.$('#cwName', el), s = U.$('#cwSub', el);
  if (n) { n.textContent = M.pretty(a.short); s.textContent = M.keyName(a.root, a.scale).ableton; }
  U.$$('tr[data-row]', el).forEach((tr, idx) => {
    const c = M.compat(a, K[+tr.dataset.row]);
    tr.className = `lv-${c.level}`;
    tr.style.transitionDelay = `${idx * 25}ms`;
    tr.querySelector('.lv').innerHTML = `<span class="lvt">${esc(LEVEL_TEXT[c.level])}</span><small>${c.shared}/7</small>`;
  });
}
function djMarkup() {
  return `<div class="seg sm" id="cpView">${[['wheel', 'Колесо'], ['table', 'Таблица 24'], ['matrix', 'Матрица 24×24']].map(([v, t]) => `<button data-view="${v}" class="${st.view === v ? 'on' : ''}">${t}</button>`).join('')}</div>
    <div id="cpBody">${st.view === 'wheel' ? `<div class="wheelbox">${wheelMarkup()}</div>` : st.view === 'table' ? tableMarkup() : matrixMarkup()}</div>
    <div class="legend lv-legend"><span class="lv-same">твой проект</span><span class="lv-perfect">те же ноты</span><span class="lv-great">6 общих нот</span><span class="lv-careful">5 нот — осторожно</span><span class="lv-mood">мажор ↔ минор от той же ноты</span><span class="lv-clash">конфликт</span></div>`;
}

function render() {
  const k = project(), name = M.keyName(k.root, k.scale);
  el.innerHTML = `
    <div class="box"><h3 class="bh">Мой проект в тональности… <small class="muted">выбери как в Ableton: Root Note + Scale</small></h3>${U.keyPicker({ root: k.root, scale: k.scale, scales: ['minor', 'major'] })}</div>
    <div class="sec-h"><div><h2>Проект в ${esc(name.ableton)} <span class="dj big">DJ ${esc(name.dj)}</span></h2>
      <p>Ниже — что точно сочетается с твоим проектом: готовые связки партий (слушай и скачивай) и все 23 другие тональности с конкретным действием в Ableton.</p></div></div>
    <h3 class="sub-h">① Готовые сочетания партий в ${esc(name.ableton)}</h3>
    <div class="combos" id="cpCombos">${combosMarkup()}</div>
    <h3 class="sub-h">② Лупы, сэмплы и MIDI из других тональностей</h3>
    <p class="muted">✅ — бери как есть, ⚠️ — проверь на слух, ↕ — сдвинь Pitch на указанное число полутонов. Код DJ — для сравнения с Traktor / Rekordbox, в Ableton его нет.</p>
    ${loopsMarkup()}
    ${howMarkup()}
    <h3 class="sub-h">③ Что значит каждый шаг по колесу</h3>
    ${movesMarkup()}
    <h3 class="sub-h">④ Пошаговые сценарии</h3>
    ${scenariosMarkup()}
    <details class="ref djref"><summary>🎧 Шпаргалка DJ: колесо, таблица и матрица всех 24 тональностей</summary><div class="djin">${djMarkup()}</div></details>`;
  requestAnimationFrame(applyLevels);
}

function onClick(e) {
  const t = e.target;
  const sec = t.closest('.cs');
  if (sec) { const k = K[+sec.dataset.k]; U.setKey(k.root, k.scale); return; }
  const v = t.closest('[data-view]');
  if (v) { st.view = v.dataset.view; U.$('.djin', el).innerHTML = djMarkup(); applyLevels(); return; }
  const row = t.closest('tr[data-row]');
  if (row) { const k = K[+row.dataset.row]; U.setKey(k.root, k.scale); return; }
  const ca = t.closest('[data-cact]'), box = t.closest('[data-combo]');
  if (ca && box) {
    const k = project(), c = COMBOS[k.scale][+box.dataset.combo], layers = comboData(c, k);
    if (ca.dataset.cact === 'play') MP.parts.playLayers(layers, box, 64);
    if (ca.dataset.cact === 'stop') U.sound(S => S.stop());
    if (ca.dataset.cact === 'zip') MP.parts.downloadZip(layers, `${M.keyName(k.root, k.scale).ableton} — ${c.name}`);
  }
}

MP.tabs.compat = {
  title: 'Совместимость',
  render(host) {
    el = host;
    render();
    U.bindKeyPicker(el, ['minor', 'major']);
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', e => { const g = e.target.closest('.cs'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const k = K[+g.dataset.k]; U.setKey(k.root, k.scale); } });
    unsub = U.onKey(() => render());
  },
  destroy() { if (unsub) unsub(); el = null; },
};
})();
