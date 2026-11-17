/* Вкладки страницы «Автоматизация»: Что это (тренажёр), Запись ручками MiniLab, Рисование и правка, Приёмы по стилям. */
(function () {
'use strict';
const T = window.Tabs, L = window.AutoLane, P = window.MiniPanel;
const NAME = Object.fromEntries(CATALOG.map(d => [d.id, d.name]));
const devLink = id => `<a class="chip sm" href="index.html#d-${T.esc(id)}">${T.esc(NAME[id] || id)}</a>`;
let lane = null;
const stopLane = () => { if (lane) lane.destroy(); lane = null; };

/* ---------- Что это ---------- */
function basics(host) {
  host.innerHTML = `
    <div class="sec-h"><div><h2>Что такое автоматизация</h2><p>Пять вещей, которые нужно знать. Ниже — тренажёр: попробуй сам.</p></div></div>
    <div class="rules">${AUTO_BASICS.map(b => `<div class="rule reveal"><span class="n">${T.esc(b.icon)}</span><b>${T.esc(b.h)}</b><p>${T.esc(b.t)}</p></div>`).join('')}</div>
    <div class="sec-h"><div><h2>Тренажёр</h2><p>Как в Arrangement: Automation Arm → ● Запись → крути ручку мышкой (тяни вверх-вниз). Звук — фильтр, который ты крутишь.</p></div></div>
    <div id="laneBox"></div>
    <div class="legend"><span><i class="lr"></i>автоматизация (красная)</span><span><i class="lo"></i>на паузе — тронул ручку без записи</span><span><i class="ll"></i>лампочка на ручке = автоматизация работает</span></div>`;
  lane = L.mount(T.$('#laneBox', host), { mode: 'record' });
}

/* ---------- Запись ручками MiniLab ---------- */
const STEP_CTL = [['shift', 'pad7'], ['shift', 'pad5'], ['shift', 'main']];
function recCol(r) {
  return `<div class="box recc"><h3 class="bh">${T.esc(r.icon)} ${T.esc(r.title)}</h3>
    <ol class="rsteps">${r.steps.map(s => `<li>${T.esc(s.t)}${s.keys ? `<div class="keys">${T.kbd(s.keys)}</div>` : ''}</li>`).join('')}</ol>
    <p class="why">${T.esc(r.note)}</p></div>`;
}
function record(host) {
  host.innerHTML = `
    <div class="sec-h"><div><h2>Записать движения ручек MiniLab</h2><p>MiniLab в программе DAW. Кнопка записи на MiniLab (Shift + Pad 7) сама понимает, какой вид открыт: Session или Arrangement.</p></div></div>
    <div class="dt-grid">${recCol(AUTO_RECORD.arrangement)}${recCol(AUTO_RECORD.session)}</div>
    <div class="sec-h"><div><h2>Где эти кнопки на MiniLab</h2><p>Нажми на подсказку — кнопки подсветятся.</p></div></div>
    <div class="chips" id="recPick"><button class="chip sm on" data-k="0">Запись: Shift + Pad 7</button><button class="chip sm" data-k="1">Стоп: Shift + Pad 5</button><button class="chip sm" data-k="2">Arm дорожки: Shift + нажать энкодер</button><button class="chip sm" data-k="3">Ручки 1–8 и фейдеры</button></div>
    <div class="panelbox recpanel">${P.svg({ display: 'REC' })}</div>
    <div class="box sc"><h3 class="bh">Чтобы ручки крутили нужное</h3><p class="muted">Удобнее всего собрать на дорожке Rack и вывести главное на Macro 1–8 — тогда ручки MiniLab = твои макросы. Готовые раскладки под бас, лид, пэд, барабаны и переходы — на странице MiniLab 3.</p>
      <div class="links"><a class="btn pri" href="${T.page('minilab')}#layouts">🧩 Раскладки ручек</a><a class="btn" href="${T.page('minilab')}#setup">🔗 Подключение MiniLab</a></div></div>`;
  const panel = T.$('.recpanel', host);
  const sets = [...STEP_CTL, ['enc1', 'enc2', 'enc3', 'enc4', 'enc5', 'enc6', 'enc7', 'enc8', 'fad1', 'fad2', 'fad3', 'fad4']];
  P.select(panel, sets[0]);
  T.$('#recPick', host).addEventListener('click', e => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    T.$$('#recPick .chip', host).forEach(c => c.classList.toggle('on', c === b));
    P.select(panel, sets[+b.dataset.k]);
  });
}

/* ---------- Рисование и правка ---------- */
function edit(host) {
  host.innerHTML = `
    <div class="sec-h"><div><h2>Нарисовать и поправить</h2><p>Arrangement, клавиша A — показать линии. Ниже — тренажёр: карандаш, формы и Simplify, как в Live.</p></div></div>
    <div id="laneBox"></div>
    <div class="shapes"><span class="muted small">Вставить форму в выделение (в Live — правый клик по выделению):</span>
      <div class="chips">${AUTO_SHAPES.map(s => `<button class="chip sm" data-shape="${s.kind}" title="${T.esc(s.use)}">${T.esc(s.name)}</button>`).join('')}</div></div>
    <div class="dt-grid">
      <div class="box"><h3 class="bh">Клавиши и приёмы (Mac)</h3><table class="mini keyt">${AUTO_KEYS.map(k => `<tr><td>${T.kbd(k.keys)}${k.act ? ` <span class="act">${T.esc(k.act)}</span>` : ''}</td><td>${T.esc(k.what)}</td></tr>`).join('')}</table></div>
      <div class="box"><h3 class="bh">Формы — для чего</h3><ul class="tools">${AUTO_SHAPES.map(s => `<li><b>${T.esc(s.name)}</b> — ${T.esc(s.use)}</li>`).join('')}</ul>
        <h3 class="bh sc2">Ещё</h3><ul class="tools">${AUTO_EDIT.map(x => `<li><b>${T.esc(x.h)}.</b> ${T.esc(x.t)}</li>`).join('')}</ul></div>
    </div>`;
  lane = L.mount(T.$('#laneBox', host), { mode: 'edit' });
  T.$('.shapes', host).addEventListener('click', e => { const b = e.target.closest('[data-shape]'); if (b && lane) lane.shape(b.dataset.shape); });
}

/* ---------- Приёмы по стилям ---------- */
const stR = { style: 'house' };
function recipes(host) {
  const draw = () => {
    const s = STYLES[stR.style];
    T.$('#rcpBox', host).innerHTML = `<div class="rcps">${AUTO_RECIPES[stR.style].map((r, i) => `<div class="rcp" style="--c:${s.color};animation-delay:${i * 60}ms">
      <b>${T.esc(r.h)}</b><p>${T.esc(r.t)}</p>${(r.devs || []).length ? `<div class="chips">${r.devs.map(devLink).join('')}</div>` : ''}</div>`).join('')}</div>`;
  };
  host.innerHTML = `
    <div class="sec-h"><div><h2>Что автоматизировать в твоём стиле</h2><p>Стартовые приёмы. Длины в тактах — ориентир, доводи на слух.</p></div></div>
    <div class="chips" id="rcpSty">${Object.entries(STYLES).map(([id, s]) => `<button class="chip ${id === stR.style ? 'on' : ''}" data-sty="${id}" style="--c:${s.color}">${s.icon} ${T.esc(s.name)}</button>`).join('')}</div>
    <div id="rcpBox"></div>
    <div class="box sc"><h3 class="bh">Общие правила</h3><ul class="tools">
      <li><b>Движение к событию.</b> Фильтр, ширина, реверб растут к дропу или смене части, а в момент события резко возвращаются.</li>
      <li><b>Меньше, но заметно.</b> 2–3 автоматизированных параметра на часть трека лучше, чем десять мелких.</li>
      <li><b>Записал ручкой — почисти.</b> После записи выдели участок и сделай Simplify Envelope: линия станет ровнее, править проще.</li>
      <li><b>Громкость — фейдером.</b> Громкость партий веди фейдером 1 (Volume дорожки), а «провалы» внутри звука — Gain у Utility в Rack.</li></ul></div>`;
  T.$('#rcpSty', host).addEventListener('click', e => {
    const b = e.target.closest('[data-sty]');
    if (!b) return;
    stR.style = b.dataset.sty;
    T.$$('#rcpSty .chip', host).forEach(c => c.classList.toggle('on', c === b));
    draw();
  });
  draw();
}

Object.assign(window.PageTabs, {
  basics: { title: 'Что это', icon: '📈', render: basics, destroy: stopLane },
  record: { title: 'Запись ручками', icon: '🎛️', render: record },
  edit: { title: 'Рисование и правка', icon: '✏️', render: edit, destroy: stopLane },
  recipes: { title: 'Приёмы по стилям', icon: '🎚️', render: recipes },
});
})();
