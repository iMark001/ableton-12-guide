/* Вкладка «Раскладки ручек»: три способа маппинга + готовые раскладки 8 ручек под партию (Rack + Macro). */
(function () {
'use strict';
const T = window.Tabs, P = window.MiniPanel, W = window.Widgets;
const NAME = Object.fromEntries(CATALOG.map(d => [d.id, d.name]));
const st = { lay: ML_LAYOUTS[0].id, style: '' };
let el = null;

/* ---------- ручки устройств гида (data/devices/<id>.js) — подгружаются по требованию ---------- */
const DEV = {}, LOADING = {};
if (typeof window.registerDevice !== 'function') window.registerDevice = d => { DEV[d.id] = d; };
function loadDevice(id) {
  if (DEV[id]) return Promise.resolve(DEV[id]);
  if (!LOADING[id]) LOADING[id] = new Promise(resolve => {
    const s = Object.assign(document.createElement('script'), { src: `data/devices/${id}.js` });
    s.onload = () => resolve(DEV[id] || null);
    s.onerror = () => { s.remove(); delete LOADING[id]; resolve(null); };
    document.head.appendChild(s);
  });
  return LOADING[id];
}
const ctlOf = k => DEV[k.dev] && DEV[k.dev].controls.find(c => c.id === k.ctl);
const fmt = (k, v) => { const c = ctlOf(k); return c ? W.fmt(c, v) : String(v); };
/* положение ручки MiniLab = положение макроса внутри его Min…Max (в шкале параметра, как в Live) */
const pos = k => {
  const c = ctlOf(k);
  if (!c) return 0.5;
  const a = W.toK(c, k.from), b = W.toK(c, k.to);
  return a === b ? 0 : Math.max(0, Math.min(1, (W.toK(c, k.v) - a) / (b - a)));
};

/* ---------- разметка ---------- */
function ways() {
  return `<div class="ways">${ML_WAYS.map(w => `<div class="way ${w.rec ? 'rec' : ''}">
    ${w.rec ? '<span class="badge">Рекомендую</span>' : ''}<h3>${T.esc(w.title)}</h3><p class="sub">${T.esc(w.when)}</p>
    <p class="pm"><b>＋</b> ${T.esc(w.plus)}</p><p class="pm mi"><b>−</b> ${T.esc(w.minus)}</p>
    ${w.go ? `<button class="btn sm ${w.rec ? 'pri' : ''}" data-go="${w.go}">Показать по шагам ↓</button>` : '<span class="muted small">Делать ничего не нужно: Shift + Pad 3 → DAW и выбери устройство.</span>'}</div>`).join('')}</div>`;
}
const current = () => ML_LAYOUTS.find(l => l.id === st.lay) || ML_LAYOUTS[0];
function knobCard(k, i) {
  const c = ctlOf(k);
  return `<div class="kcardm" style="animation-delay:${i * 50}ms"><div class="kt"><span class="kno">${i + 1}</span><b>${T.esc(k.label)}</b></div>
    <div class="kr">${W.knob(pos(k))}<div><div class="val">${T.esc(fmt(k, k.v))}</div><div class="rg">Min ${T.esc(fmt(k, k.from))} → Max ${T.esc(fmt(k, k.to))}</div></div></div>
    <a class="dl" href="index.html#d-${T.esc(k.dev)}">${T.esc(NAME[k.dev] || k.dev)} → ${T.esc(c ? c.name : k.ctl)}</a>
    <p>${T.esc(k.why)}</p></div>`;
}
function layoutView() {
  const l = current();
  const labels = Object.fromEntries([...l.knobs.map((k, i) => [`enc${i + 1}`, k.label]), ...ML_FADERS.map(f => [f.id, f.name])]);
  const kpos = Object.fromEntries(l.knobs.map((k, i) => [`enc${i + 1}`, pos(k)]));
  const auto = l.auto.filter(a => !st.style || a.styles.includes(st.style));
  return `<p class="lnote">${T.esc(l.note)}</p>
    <div class="flow">${l.chain.map((id, i) => `${i ? '<span class="arr"></span>' : ''}<a class="n" href="index.html#d-${T.esc(id)}">${T.esc(NAME[id] || id)}</a>`).join('')}</div>
    <div class="panelbox lay">${P.svg({ labels, k: kpos, display: 'Macro 1–8' })}</div>
    <div class="kgrid">${l.knobs.map(knobCard).join('')}</div>
    <div class="dt-grid">
      <div class="box"><h3 class="bh">Фейдеры (режим DAW, одинаково для всех раскладок)</h3>
        <table class="mini">${ML_FADERS.map((f, i) => `<tr><td>Фейдер ${i + 1}</td><td>${T.esc(f.name)}</td><td>${T.esc(f.what)}</td></tr>`).join('')}</table>
        <p class="muted small">Совет: в шаблоне проекта поставь на Return A реверб, на Return B дилей (оба Dry/Wet 100 %) — тогда фейдеры 2 и 3 сразу работают как «сколько реверба» и «сколько дилея».</p></div>
      <div class="box"><h3 class="bh">Что обычно автоматизируют${st.style ? ` · ${T.esc(STYLES[st.style].name)}` : ''}</h3>
        ${auto.length ? `<ul class="tools">${auto.map(a => `<li><b>Ручка ${a.knob} · ${T.esc(l.knobs[a.knob - 1].label)}.</b> ${T.esc(a.t)}</li>`).join('')}</ul>` : '<p class="muted">Для этого стиля в этой раскладке нет типичного приёма — посмотри другие раскладки.</p>'}
        <a class="btn sm" href="${T.page('automation')}#record">Как записать движения ручек →</a></div>
    </div>`;
}
function draw() {
  const box = T.$('#lyView', el);
  if (!box) return;
  box.innerHTML = layoutView();
  W.animateKnobs(box);
  const l = current();
  P.select(box, l.auto.filter(a => !st.style || a.styles.includes(st.style)).map(a => `enc${a.knob}`));
}
function load() {
  const l = current();
  Promise.all(l.chain.map(loadDevice)).then(() => { if (el && current() === l) draw(); });
}
function render(host) {
  el = host;
  host.innerHTML = `
    <div class="sec-h"><div><h2>Как замапить ручки</h2><p>Выбери, что нужно, и нажми «Показать по шагам».</p></div></div>
    ${ways()}
    <div class="sec-h" id="prTop"><div><h2>По шагам: куда нажать</h2><p>Слева — шаги, справа — окно Live, где подсвечено, куда нажать.</p></div></div>
    <div id="prBox"></div>
    <div class="sec-h"><div><h2>Готовые раскладки под партии</h2><p>Что поставить на 8 ручек для каждой партии. Собираешь так же, как в сценарии «Эффекты на басе». Числа — стартовые Min и Max макроса, доводи на слух.</p></div></div>
    <div class="chips" id="lyPick">${ML_LAYOUTS.map(l => `<button class="chip ${l.id === st.lay ? 'on' : ''}" data-lay="${l.id}">${l.icon} ${T.esc(l.title)}</button>`).join('')}</div>
    <div class="chips sty" id="lySty"><button class="chip sm ${st.style ? '' : 'on'}" data-sty="">Все стили</button>${Object.entries(STYLES).map(([id, s]) => `<button class="chip sm ${st.style === id ? 'on' : ''}" data-sty="${id}" style="--c:${s.color}">${s.icon} ${T.esc(s.name)}</button>`).join('')}</div>
    <div id="lyView"></div>`;
  window.Practice.mount(T.$('#prBox', host));
  host.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { window.Practice.open(go.dataset.go); T.$('#prTop', el).scrollIntoView({ behavior: 'smooth' }); return; }
    const b = e.target.closest('[data-lay]'), s = e.target.closest('[data-sty]');
    if (b) { st.lay = b.dataset.lay; T.$$('#lyPick .chip', el).forEach(c => c.classList.toggle('on', c === b)); draw(); load(); }
    else if (s) { st.style = s.dataset.sty; T.$$('#lySty .chip', el).forEach(c => c.classList.toggle('on', c === s)); draw(); }
  });
  draw();
  load();
}

window.PageTabs.layouts = { title: 'Раскладки ручек', icon: '🧩', render, destroy() { el = null; } };
})();
