/* Страница «Туториалы». Жанр и синты выбираются один раз наверху (#tutCtl) — под них подстраиваются все уроки:
   темп и свинг примеров, рисунок кика, значения ручек (data/devices: партия × стиль), заметки устройств, советы
   «По партиям», рецепты Serum 2, прогрессия жанра, приёмы автоматизации, числа в тексте ({bpm}, {ms:x}).
   Урок: схема (js/tutorials/visual.js) → 3–4 строки → звук «до/после» (js/tutorials/groove.js) → «Подробнее». */
(function () {
'use strict';
const T = window.Tabs;
const e = T.esc;
const CAT = Object.fromEntries(CATALOG.map(d => [d.id, d]));
const PG = typeof PART_GUIDE !== 'undefined' ? PART_GUIDE : {};
const STORE = 'tut-style', SYN = 'tut-synth';
const state = { style: load(STORE, s => STYLES[s]) || 'house', synth: load(SYN, s => s === 'serum') || 'live', q: '' };
let players = [], cur = null;

function load(key, ok) {
  try { const s = sessionStorage.getItem(key); return s && ok(s) ? s : ''; } catch { return ''; }
}
function save(key, v) {
  try { sessionStorage.setItem(key, v); } catch { /* приватный режим — выбор просто не запомнится */ }
}
/* ссылки: на тестовой странице — на тестовые версии (каталог устройств — test_view.html) */
const IDX = /\/test_[^/]*$/.test(location.pathname) ? 'test_view.html' : 'index.html';
function href(h) {
  if (h.startsWith('index.html')) return IDX + h.slice('index.html'.length);
  const m = /^(midi|minilab|automation|tutorials)\.html(#.*)?$/.exec(h);
  return m ? `${T.page(m[1])}${m[2] || ''}` : h;
}
window.TutLinks = { device: id => `${IDX}#d-${id}`, href };
const st = () => TUT_STYLE[state.style];
const ctx = () => ({ style: state.style, bpm: st().bpm, swing: st().swing, kick: st().kick });
/* числа в тексте под темп жанра: {bpm}, {style}, {ms:0.5} — доля четверти в миллисекундах */
const tx = s => String(s ?? '').replace(/\{bpm\}/g, st().bpm).replace(/\{style\}/g, STYLES[state.style].name)
  .replace(/\{ms:([\d.]+)\}/g, (_, k) => Math.round(+k * 60000 / st().bpm));
window.TutText = tx;
const stopPlayers = () => { players.forEach(p => p.destroy()); players = []; };

/* урок с правками под стиль: ключи byStyle — один или несколько стилей через пробел */
function resolve(t) {
  const key = Object.keys(t.byStyle || {}).find(k => k.split(' ').includes(state.style));
  return key ? { ...t, ...t.byStyle[key] } : t;
}
const hasSerum = t => !!(t.serum || (t.part && (PG[t.part]?.make || []).some(m => m.kind === 'serum')));
function visualsFor(t) {
  let blocks = t.visual ? [...t.visual] : [];
  if (!t.visual) {
    if (t.prog) blocks.push({ type: 'prog', title: 'Прогрессия твоего жанра' });
    if (t.devices.length) blocks.push({ type: 'chain', title: 'Цепочка — значения под твой жанр', nodes: t.devices.map(dev => ({ dev, part: t.part })) });
    if (t.recipes) blocks.push({ type: 'recipes', title: 'Автоматизация в твоём жанре' });
  }
  if (state.synth === 'serum' && hasSerum(t)) {
    const serum = t.serum || [{ type: 'serum', title: 'То же в Serum 2 — рецепт под твой жанр', part: t.part }];
    blocks = [...serum, ...blocks.map(b => (b.type === 'chain' ? { ...b, nodes: b.nodes.filter(n => CAT[n.dev]?.group !== 'syn') } : b)).filter(b => b.type !== 'chain' || b.nodes.length)];
  }
  return blocks;
}
function demoFor(t) {
  if (t.demo) return t.demo;
  if (!t.prog) return null;
  const d = window.TutVisual.progData(ctx());
  const steps = Array.from({ length: 64 }, (_, i) => (i % 16 === 0 ? 100 : 0));
  const pad = { sound: 'pad', steps, chords: d.chords };
  return { bpm: 'style', bars: 4, a: { label: 'Только аккорды', tracks: [pad] }, b: { label: 'Аккорды + бас', tracks: [pad, { sound: 'bass', hold: true, steps, notes: d.bass }] } };
}

/* ---------- верхняя панель: жанр и синты ---------- */
function ctlHtml() {
  const s = STYLES[state.style];
  return `<div class="tctl-row"><span class="tctl-l">Твой жанр</span><div class="chips" role="group" aria-label="Жанр">${Object.entries(STYLES).map(([id, x]) => `<button class="chip sm ${state.style === id ? 'on' : ''}" type="button" data-sty="${id}" style="--c:${x.color}">${x.icon} ${e(x.name)}</button>`).join('')}</div></div>
    <div class="tctl-row"><span class="tctl-l">Синты</span><div class="chips" role="group" aria-label="Синтезаторы">${[['live', 'Live 12'], ['serum', 'Serum 2']].map(([id, n]) => `<button class="chip sm ${state.synth === id ? 'on' : ''}" type="button" data-syn="${id}">${n}</button>`).join('')}</div>
      <span class="muted small0">${state.synth === 'serum' ? 'В уроках про звук — рецепты Serum 2 вместо Wavetable и Operator.' : 'Уроки про звук — на Wavetable, Operator и других синтах Live.'}</span></div>
    <p class="tsline">Всё ниже — для <b style="color:${s.color}">${e(s.name)}</b>: темп ${e(st().range)} BPM, примеры звучат в ${e(st().bpm)} BPM, ${e(st().swing ? `свинг ${Math.round(50 + st().swing * 50)} %` : 'без свинга')}, кик — ${st().kick.length === 4 ? '«четыре в пол»' : 'ломаный'}.</p>`;
}
function mountCtl() {
  const box = document.getElementById('tutCtl');
  if (!box) return;
  box.innerHTML = ctlHtml();
  box.onclick = ev => {
    const b = ev.target.closest('[data-sty],[data-syn]');
    if (!b) return;
    if (b.dataset.sty) { state.style = b.dataset.sty; save(STORE, state.style); }
    else { state.synth = b.dataset.syn; save(SYN, state.synth); }
    box.innerHTML = ctlHtml();
    if (cur) render(cur.tab, cur.host);
  };
}

/* ---------- карточка ---------- */
const textOf = t => [t.title, t.goal, t.why, t.tip, ...(t.short || []), ...t.steps.flatMap(s => [s.do, s.see])].join(' ').toLowerCase();
const matches = t => (!t.styles.length || t.styles.includes(state.style)) && (!state.q || textOf(t).includes(state.q));
const fullSteps = t => `<ol class="tsteps">${t.steps.map(s => `<li><div class="tdo">${e(tx(s.do))}</div><div class="tsee"><span aria-hidden="true">👁</span> ${e(tx(s.see))}</div></li>`).join('')}</ol>`;
function extras(t) {
  const devs = t.devices.length ? `<div class="tdevs"><span class="muted">Устройства:</span>${t.devices.map(id => `<a class="chip sm" href="${e(window.TutLinks.device(id))}">${e(CAT[id]?.name || id)}</a>`).join('')}</div>` : '';
  const links = t.links.length ? `<div class="links">${t.links.map(l => `<a class="btn" href="${e(href(l.href))}">${e(l.label)} →</a>`).join('')}</div>` : '';
  return devs + links;
}
const whyTip = t => `<div class="twhy"><b>Почему работает.</b> ${e(tx(t.why))}</div>${t.tip ? `<div class="ttip"><b>Лайфхак.</b> ${e(tx(t.tip))}</div>` : ''}`;
function styleTip(t) {
  const txt = t.part && PG[t.part]?.styles?.[state.style];
  return txt ? `<div class="tstip" style="--c:${STYLES[state.style].color}"><b>В ${e(STYLES[state.style].name)}:</b> ${e(txt)}</div>` : '';
}
function card(t, i, open, tip = true) {
  const short = t.short || t.steps.slice(0, 3).map(s => s.do);
  const demo = demoFor(t);
  return `<article class="tcard v2${open ? ' open' : ''}" data-id="${e(t.id)}" style="animation-delay:${Math.min(i, 8) * 40}ms">
    <button class="thead" type="button" aria-expanded="${open}">
      <span class="tnum">${i + 1}</span>
      <span class="ttl"><b>${e(t.title)}</b><span class="ttags"><span class="ttag" style="--c:${STYLES[state.style].color}">под ${e(STYLES[state.style].name)}</span>${demo ? '<span class="ttag snd">🔊 пример</span>' : ''}${hasSerum(t) ? '<span class="ttag syn">Serum 2</span>' : ''}</span></span>
      <span class="tarr" aria-hidden="true">▾</span>
    </button>
    <p class="tgoal">${e(tx(t.goal))}</p>
    <div class="tbody">
      ${tip ? styleTip(t) : ''}
      <div class="tvis"></div>
      <ol class="tshort">${short.map(s => `<li>${e(tx(s))}</li>`).join('')}</ol>
      ${demo ? '<div class="tdemo"></div>' : ''}
      <details class="tmore"><summary>Подробнее: каждый шаг, «что увидишь», почему работает</summary>${fullSteps(t)}${whyTip(t)}${extras(t)}</details>
    </div>
  </article>`;
}
async function fillVisual(el, t) {
  const box = T.$('.tvis', el);
  const blocks = visualsFor(t);
  if (!box || !blocks.length) return;
  box.innerHTML = '<div class="vload">Рисую схему…</div>';
  try {
    const html = await Promise.all(blocks.map(b => window.TutVisual.block({ ...b, title: b.title && tx(b.title) }, ctx())));
    box.innerHTML = html.join('');
    window.Widgets.animateKnobs(box);
  } catch (err) {
    box.innerHTML = `<div class="vload">Схема не загрузилась: ${e(err.message)}</div>`;
  }
}
function openCard(el, on) {
  el.classList.toggle('open', on);
  T.$('.thead', el).setAttribute('aria-expanded', String(on));
  if (!on || el.dataset.ready) return;
  el.dataset.ready = '1';
  const t = resolve(TUTORIALS.find(x => x.id === el.dataset.id));
  fillVisual(el, t);
  const box = T.$('.tdemo', el), demo = demoFor(t);
  if (box && demo) players.push(window.TutGroove.mount(box, demo, ctx()));
}

/* ---------- вкладка ---------- */
function render(tab, host) {
  cur = { tab, host };
  stopPlayers();
  const list = TUTORIALS.filter(t => t.tab === tab.id);
  host.innerHTML = `
    <div class="sec-h"><div><h2>${e(tab.icon)} ${e(tab.title)}</h2><p>${e(tab.sub)}</p></div>
      <div class="ttools"><input class="tsearch" type="search" placeholder="Поиск по урокам" aria-label="Поиск по урокам" value="${e(state.q)}"><button class="btn tall" type="button">Развернуть все</button></div></div>
    <div class="tlist"></div>`;
  const box = T.$('.tlist', host);
  const draw = () => {
    stopPlayers();
    const shown = list.filter(matches).map(resolve);
    box.innerHTML = shown.length
      ? shown.map((t, i) => card(t, i, false, !shown.slice(0, i).some(x => x.part && x.part === t.part))).join('')
      : `<div class="empty"><span class="big">🔎</span>${state.q ? 'Под этот поиск уроков нет — очисти поиск.' : `Для ${e(STYLES[state.style].name)} здесь уроков нет — выбери другой жанр наверху.`}</div>`;
    T.$$('.tcard', box).slice(0, 2).forEach(c => openCard(c, true));
  };
  T.$('.tsearch', host).addEventListener('input', ev => { state.q = ev.target.value.trim().toLowerCase(); draw(); });
  T.$('.tall', host).addEventListener('click', ev => {
    const cards = T.$$('.tcard', box);
    const open = cards.some(c => !c.classList.contains('open'));
    cards.forEach(c => openCard(c, open));
    ev.currentTarget.textContent = open ? 'Свернуть все' : 'Развернуть все';
  });
  box.addEventListener('click', ev => {
    const h = ev.target.closest('.thead');
    if (!h) return;
    const c = h.closest('.tcard');
    openCard(c, !c.classList.contains('open'));
  });
  draw();
}

/* на телефоне меню шире экрана: показать активный пункт «Туториалы» */
const navOn = document.querySelector('.top nav a.on');
if (navOn && navOn.parentElement.scrollWidth > navOn.parentElement.clientWidth) {
  navOn.parentElement.scrollLeft = navOn.offsetLeft - navOn.parentElement.clientWidth + navOn.offsetWidth + 8;
}

mountCtl();
TUT_TABS.forEach(tab => {
  window.PageTabs[tab.id] = { title: tab.short || tab.title, icon: tab.icon, render: host => render(tab, host), destroy: () => { stopPlayers(); cur = null; } };
});
})();
