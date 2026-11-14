/* Страница устройства: «что это / когда / как», выбор партии и стиля, панель в стиле Live с точными
   значениями, «зачем так», заводские пресеты Ableton, лайфхаки, справочник ручек, цепочка.
   Данные — data/devices/<id>.js (registerDevice), подгружаются лениво. */
(function () {
'use strict';
const W = window.Widgets, esc = W.esc;
const DEV = {};
window.registerDevice = d => { DEV[d.id] = d; };
const loading = {};
let sel = { inst: null, style: null };  /* текущий выбор на открытой странице */

/* staging: window.STAGING = { ids: [...], base: '_staging/devices/' } */
function load(id) {
  if (DEV[id]) return Promise.resolve(DEV[id]);
  if (loading[id]) return loading[id];
  const st = window.STAGING || {};
  const base = st.ids && st.ids.includes(id) ? st.base : 'data/devices/';
  loading[id] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `${base}${id}.js`;
    s.onload = () => (DEV[id] ? resolve(DEV[id]) : reject(new Error('Файл устройства пустой')));
    s.onerror = () => { delete loading[id]; s.remove(); reject(new Error('Не удалось загрузить данные устройства')); };
    document.head.appendChild(s);
  });
  return loading[id];
}

/* базовая настройка партии + правки стиля */
function merge(dev, inst, style) {
  const map = new Map();
  (dev.presets[inst]?.set || []).forEach(s => map.set(s.c, { ...s }));
  (dev.styles?.[style]?.set || []).forEach(s => {
    if (s.only && !s.only.includes(inst)) return;
    if (s.not && s.not.includes(inst)) return;
    map.set(s.c, { ...s, styled: true });
  });
  return dev.controls.filter(c => map.has(c.id)).map(c => ({ ctl: c, s: map.get(c.id) }));
}
const valOf = s => (s.v === 'inf' ? Infinity : s.v);

function panelMarkup(dev, d, rows) {
  const knobs = rows.filter(r => r.ctl.kind === 'knob'), sws = rows.filter(r => r.ctl.kind !== 'knob');
  const graph = dev.graph === 'comp' ? graphFor(dev, rows) : '';
  return `<div class="lpanel">
    <div class="lp-title"><span class="led"></span>${esc(d.name)}</div>
    <div class="lp-body">
      ${graph ? `<div class="lp-graph">${graph}</div>` : ''}
      <div class="lp-knobs">${knobs.map(({ ctl, s }) => `<div class="lk ${s.styled ? 'st' : ''}">${W.knob(W.toK(ctl, valOf(s)))}<b>${esc(fmt(ctl, s))}</b><span>${esc(ctl.name)}</span></div>`).join('')}</div>
      ${sws.length ? `<div class="lp-sw">${sws.map(({ ctl, s }) => `<div class="ls"><span>${esc(ctl.name)}</span>${ctl.kind === 'toggle' ? `<i class="tg ${s.v ? 'on' : ''}">${s.v ? 'On' : 'Off'}</i>` : W.sw(ctl.opts, s.v)}</div>`).join('')}</div>` : ''}
    </div></div>`;
}
const fmt = (ctl, s) => (s.t ? s.t : ctl.kind === 'toggle' ? (s.v ? 'On' : 'Off') : ctl.kind === 'switch' ? String(s.v) : W.fmt(ctl, valOf(s)));
function graphFor(dev, rows) {
  const get = id => { const r = rows.find(x => x.ctl.id === id); return r ? valOf(r.s) : undefined; };
  const g = dev.graphMap || {};
  if (g.ceiling) return W.compCurve({ ceiling: get(g.ceiling) ?? -0.3, label: `потолок ${W.fmt({ unit: 'dB' }, get(g.ceiling) ?? -0.3)}` });
  return W.compCurve({ threshold: get(g.threshold || 'threshold') ?? -20, ratio: get(g.ratio || 'ratio') ?? 4, knee: get(g.knee || 'knee') ?? 0 });
}

function cardsMarkup(rows, st) {
  return `<div class="board">${rows.map(({ ctl, s }, i) => `<div class="ctl ${s.styled ? 'st' : ''}" data-st="${s.styled ? esc(st.name.split(' ')[0]) : ''}" style="animation-delay:${i * 50}ms">
      <div class="nm">${esc(ctl.name)}</div>${ctl.range ? `<div class="rg">${esc(ctl.range)}</div>` : ''}
      <div class="val">${esc(fmt(ctl, s))}</div>
      <div class="why">${esc(s.w)}</div>
      <div class="tip">📘 ${esc(ctl.desc)}</div><span class="info">i</span></div>`).join('')}</div>`;
}
function resultMarkup(dev, d, cur) {
  if (!cur.inst || !cur.style) {
    const msg = !cur.inst && !cur.style ? 'Выбери партию и стиль — ручки выставятся сами' : !cur.inst ? 'Теперь выбери партию' : 'Теперь выбери стиль музыки';
    return `<div class="empty"><span class="big">🎛️</span>${msg}</div>`;
  }
  const st = STYLES[cur.style], ins = { name: dev.presets[cur.inst].label || (INSTRUMENTS[cur.inst] || {}).name || cur.inst, icon: dev.presets[cur.inst].icon || (INSTRUMENTS[cur.inst] || {}).icon || '' }, rows = merge(dev, cur.inst, cur.style);
  const notes = [dev.presets[cur.inst]?.note, dev.styles?.[cur.style]?.note].filter(Boolean);
  return `<section class="result" style="--sc:${st.color}">
    <div class="rhead"><span class="t">${esc(ins.icon)} ${esc(ins.name)} × ${esc(st.icon)} ${esc(st.name)}</span>${notes.map(n => `<span class="note">💡 ${esc(n)}</span>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--pc)"></i>базовая настройка для партии</span><span><i style="background:${st.color}"></i>изменено под стиль</span><span>Нажми карточку — что говорит мануал</span></div>
    ${panelMarkup(dev, d, rows)}
    <p class="muted kbtip">⌨️ В Live кликни по ручке и набери число с клавиатуры, Enter — точное значение. Delete возвращает ручку к значению по умолчанию.</p>
    ${cardsMarkup(rows, st)}</section>`;
}

/* раздел браузера Live, где лежат пресеты устройства */
const browserSection = d => (['syn', 'smp'].includes(d.group) ? 'Instruments' : d.group === 'midi' ? 'MIDI Effects' : 'Audio Effects');
function factoryMarkup(dev, d) {
  if (!dev.factory || !dev.factory.length) return '';
  return `<div class="sec-h reveal"><div><h2>Заводские пресеты Ableton</h2><p>Так настраивает устройство сама Ableton (Core Library). Открой браузер Live → ${browserSection(d)}${dev.factoryFolder ? ` → ${esc(dev.factoryFolder)}` : ''} — и сравни на слух.</p></div></div>
    <div class="factory">${dev.factory.map(f => `<div class="fp reveal"><b>${esc(f.name)}</b>${f.use ? `<small>${esc(f.use)}</small>` : ''}<p>${f.vals.map(([k, v]) => `<span><i>${esc(k)}</i> ${esc(v)}</span>`).join('')}</p></div>`).join('')}</div>`;
}

function render(app, d, inst, style) {
  const g = GROUPS.find(x => x.id === d.group);
  if (DEV[d.id]) { page(app, d, DEV[d.id], inst, style); return; }
  app.innerHTML = `<div class="view"><a class="back" href="#g-${g.id}">← ${esc(g.name)}</a><div class="empty"><span class="big">⏳</span>Загружаю ${esc(d.name)}…</div></div>`;
  load(d.id).then(dev => page(app, d, dev, inst, style)).catch(err => {
    app.innerHTML = `<div class="view"><a class="back" href="#g-${g.id}">← ${esc(g.name)}</a><div class="empty"><span class="big">⚠️</span>${esc(err.message)}. Обнови страницу.</div></div>`;
  });
}
function page(app, d, dev, inst, style) {
  const g = GROUPS.find(x => x.id === d.group);
  dev.presets = dev.presets || {};
  const cur = { inst: inst && dev.presets[inst] ? inst : null, style: style && STYLES[style] ? style : null };
  sel = cur;
  const same = app.dataset.dev === d.id && app.querySelector('#dres');
  if (same) { syncPicker(app, cur); app.querySelector('#dres').innerHTML = resultMarkup(dev, d, cur); W.animateKnobs(app.querySelector('#dres')); bindCards(app); return; }
  app.dataset.dev = d.id;
  document.documentElement.style.setProperty('--pc', g.color);
  const insts = Object.keys(dev.presets);
  app.innerHTML = `<div class="view" style="--pc:${g.color}">
    <a class="back" href="#g-${g.id}">← ${esc(g.name)}</a>
    <section class="phero dhero"><div class="info">
      <div class="ty">${g.icon} ${esc(g.name)}</div><h1>${esc(d.name)}</h1>
      <div class="tl">${esc(d.tagline)}</div><div class="bdg">${window.GuideApp.badges(d)}</div>
      <p class="wh">${esc(dev.what)}</p>
      <div class="links"><a class="btn" href="${esc(d.manual)}" target="_blank" rel="noopener">📘 Раздел мануала Live 12</a>${(dev.parts || []).map(p => `<a class="btn" href="#p-${esc(p)}">${esc((INSTRUMENTS[p] || {}).icon || '')} ${esc((INSTRUMENTS[p] || {}).name || p)}: вся цепочка</a>`).join('')}</div></div>
      <div class="media"><div class="whenhow"><h3>Когда включать</h3><ul>${dev.when.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
        <h3>Как пользоваться</h3><ol>${dev.how.map(w => `<li>${esc(w)}</li>`).join('')}</ol></div></div></section>
    ${dev.card ? '' : `<section class="picker">
      <div class="pstep"><h3><span class="num" id="n1">1</span>${esc(dev.pickLabel || 'Что обрабатываем')}</h3>
        <div class="chips" id="instChips">${insts.map(i => `<button class="chip" data-i="${esc(i)}"><span class="ic">${esc(dev.presets[i].icon || (INSTRUMENTS[i] || {}).icon || '🎛️')}</span>${esc(dev.presets[i].label || (INSTRUMENTS[i] || {}).name || i)}</button>`).join('')}</div></div>
      <div class="pstep"><h3><span class="num" id="n2">2</span>Стиль музыки</h3>
        <div class="chips" id="styleChips">${Object.entries(STYLES).map(([k, s]) => `<button class="chip style-chip" data-s="${k}" style="--c:${s.color}"><span><span class="ic">${s.icon}</span> ${esc(s.name)}</span><small>${esc(s.desc)}</small></button>`).join('')}</div></div>
    </section>
    <div id="dres">${resultMarkup(dev, d, cur)}</div>`}
    ${dev.hacks && dev.hacks.length ? `<div class="sec-h reveal"><div><h2>Лайфхаки</h2><p>Приёмы из мануала и практики продюсеров</p></div></div>
      <div class="hacks">${dev.hacks.map((h, i) => `<div class="hack reveal" style="transition-delay:${i * 50}ms"><b>${esc(h.h)}</b><p>${esc(h.t)}</p></div>`).join('')}</div>` : ''}
    ${factoryMarkup(dev, d)}
    <details class="ref reveal"><summary>📘 Справочник всех ручек (по мануалу Live 12)</summary>
      <table><tr><th>Ручка</th><th>Диапазон</th><th>Что делает</th></tr>${dev.controls.concat(dev.extra || []).map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.range || '—')}</td><td>${esc(c.desc)}</td></tr>`).join('')}</table></details>
    ${dev.chain ? `<div class="chain reveal" style="margin-top:14px"><div class="h"><b>🔗 Цепочка</b></div><div class="nt">${esc(dev.chain)}</div></div>` : ''}
    ${dev.src ? `<p class="src">Источники: ${dev.src.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>` : ''}
  </div>`;
  if (!dev.card) app.querySelector('#instChips').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) go(d.id, b.dataset.i, sel.style); });
  if (!dev.card) app.querySelector('#styleChips').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) go(d.id, sel.inst, b.dataset.s, app, d, dev); });
  syncPicker(app, cur);
  W.animateKnobs(app);
  bindCards(app);
  if (window.GuideApp.observe) window.GuideApp.observe();
  window.scrollTo({ top: 0 });
}
function go(id, inst, style, app, d, dev) {
  if (!inst && style && app) { page(app, d, dev, null, style); return; }
  location.hash = ['d-' + id, inst, inst && style ? style : null].filter(Boolean).join('/');
}
function syncPicker(app, cur) {
  app.querySelectorAll('#instChips .chip').forEach(c => c.classList.toggle('on', c.dataset.i === cur.inst));
  app.querySelectorAll('#styleChips .chip').forEach(c => c.classList.toggle('on', c.dataset.s === cur.style));
  const n1 = app.querySelector('#n1'), n2 = app.querySelector('#n2');
  if (n1) { n1.textContent = cur.inst ? '✓' : '1'; n1.classList.toggle('done', !!cur.inst); }
  if (n2) { n2.textContent = cur.style ? '✓' : '2'; n2.classList.toggle('done', !!cur.style); }
}
function bindCards(app) { app.querySelectorAll('#dres .ctl').forEach(c => c.addEventListener('click', () => c.classList.toggle('open'))); }

window.DeviceView = { render, load, merge, DEV };
})();
