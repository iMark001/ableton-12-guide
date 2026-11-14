/* Гид по устройствам: главная (поиск, группы), страница устройства, роутинг по hash. */
(function () {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');
const G = Object.fromEntries(GROUPS.map((g, i) => [g.id, { ...g, n: i + 1 }]));
const BY_ID = Object.fromEntries(CATALOG.map(d => [d.id, d]));
const home = { q: '', group: '', onlyNew: false };

/* ---------- значки ---------- */
const inReview = id => !!(window.STAGING && (window.STAGING.ids || []).includes(id));
function badges(d) {
  return [inReview(d.id) ? '<span class="badge review">🆕 новое · на проверке</span>' : '', d.isNew ? '<span class="badge">NEW в Live 12</span>' : '', d.upd ? '<span class="badge v">обновлён в Live 12</span>' : '',
    d.m4l ? '<span class="badge g" title="Устройство на Max for Live, входит в Suite">M4L</span>' : '',
    d.ready ? '' : '<span class="badge soon">разбор готовится</span>'].join('');
}

/* ---------- главная ---------- */
function miniClock() {
  const pt = (h, r) => [100 + r * Math.sin(h * Math.PI / 6), 100 - r * Math.cos(h * Math.PI / 6)].map(v => v.toFixed(1));
  const dots = Array.from({ length: 12 }, (_, h) => { const [x, y] = pt(h, 70); return `<circle cx="${x}" cy="${y}" r="${[0, 4, 7].includes(h) ? 11 : 8}" class="${[0, 4, 7].includes(h) ? 'on' : ''}"/>`; }).join('');
  const tri = [0, 4, 7].map(h => pt(h, 70).join(',')).join(' ');
  return `<svg viewBox="0 0 200 200" class="mclock" aria-hidden="true"><circle cx="100" cy="100" r="70" class="ring"/><polygon points="${tri}"/>${dots}</svg>`;
}
function renderHome(scrollTo) {
  setNav('home');
  delete app.dataset.dev;
  document.title = 'Ableton Live 12 — гид по устройствам';
  const newCount = CATALOG.filter(d => d.isNew).length, readyCount = CATALOG.filter(d => d.ready).length;
  app.innerHTML = `
  <section class="hero">
    <div>
      <span class="eyebrow"><i></i>Ableton Live 12 Suite · ${CATALOG.length} устройств</span>
      <h1>Каждое устройство Live 12 — <span class="grad">понятно и по шагам</span></h1>
      <p>Для чего нужно, когда включать и как крутить ручки. Выбери устройство, партию и стиль — гид выставит точные значения и объяснит каждое.</p>
      <div class="steps"><span><b>1</b>Устройство</span><span><b>2</b>Партия</span><span><b>3</b>Стиль</span><span><b>✓</b>Ручки + лайфхаки</span></div>
      <p class="muted small">${readyCount === CATALOG.length ? `Разобраны все ${CATALOG.length} устройств: ручки, настройки под партию и стиль, заводские пресеты, лайфхаки.` : `Готово разборов: ${readyCount} из ${CATALOG.length}. Остальные выходят партиями по группам.`}</p>
    </div>
    <a class="promo" href="midi.html">${miniClock()}<div><span class="badge">Новое</span><b>MIDI: ноты, аккорды, тональности</b>
      <p>Хроматический круг-часы, аккорды-фигуры, определение тональности .mid, совместимость тональностей.</p><span class="go">Открыть →</span></div></a>
  </section>
  <div class="sec-h" id="parts"><div><h2>По партиям</h2><p>Выбери, что делаешь, — увидишь, чем сделать звук (Live 12, Serum 2, Diva) и чем обработать (цепочка стоковых устройств и FabFilter).</p></div></div>
  ${window.PartsPage ? window.PartsPage.tiles() : ''}
  <div class="sec-h"><div><h2>Все устройства Live 12</h2><p>Поиск и фильтр по группам.</p></div></div>
  <div class="toolbar">
    <input type="search" id="q" placeholder="Найти устройство: compressor, реверб, бас…" value="${esc(home.q)}" aria-label="Поиск устройства">
    <label class="tgl"><input type="checkbox" id="onlyNew" ${home.onlyNew ? 'checked' : ''}> только новые в Live 12 (${newCount})</label>
  </div>
  <div class="chips" id="groups"><button class="chip ${home.group ? '' : 'on'}" data-g="">Все</button>${GROUPS.map(g => `<button class="chip ${home.group === g.id ? 'on' : ''}" data-g="${g.id}" style="--c:${g.color}">${g.icon} ${esc(g.name)} <small>${CATALOG.filter(d => d.group === g.id).length}</small></button>`).join('')}</div>
  <div id="list"></div>`;
  renderList();
  $('#q').addEventListener('input', e => { home.q = e.target.value; renderList(); });
  $('#onlyNew').addEventListener('change', e => { home.onlyNew = e.target.checked; renderList(); });
  $('#groups').addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    home.group = b.dataset.g;
    $$('#groups .chip').forEach(c => c.classList.toggle('on', c === b));
    renderList();
  });
  if (scrollTo) setTimeout(() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' }), 60);
  else window.scrollTo({ top: 0 });
}
function matches(d) {
  const q = home.q.trim().toLowerCase();
  if (home.group && d.group !== home.group) return false;
  if (home.onlyNew && !d.isNew && !d.upd) return false;
  return !q || `${d.name} ${d.tagline} ${G[d.group].name}`.toLowerCase().includes(q);
}
function renderList() {
  const box = $('#list');
  const html = GROUPS.map(g => {
    const items = CATALOG.filter(d => d.group === g.id && matches(d));
    if (!items.length) return '';
    return `<section class="grp" id="g-${g.id}" style="--gc:${g.color}">
      <div class="sec-h"><div><h2><span class="gi">${g.icon}</span>${esc(g.name)}</h2><p>Партия ${G[g.id].n} · ${items.length} ${items.length === 1 ? 'устройство' : items.length < 5 ? 'устройства' : 'устройств'}</p></div></div>
      <div class="dgrid">${items.map((d, i) => `<a class="dcard ${d.ready ? 'ready' : ''} ${inReview(d.id) ? 'review' : ''}" href="#d-${d.id}" style="animation-delay:${i * 35}ms">
        <div class="dh"><b>${esc(d.name)}</b><span class="go">→</span></div><p>${esc(d.tagline)}</p><div class="bdg">${badges(d)}</div></a>`).join('')}</div></section>`;
  }).join('');
  box.innerHTML = html || '<div class="empty"><span class="big">🔎</span>Ничего не нашлось. Попробуй английское название устройства.</div>';
}

/* ---------- страница устройства ---------- */
function renderDevice(id, inst, style) {
  const d = BY_ID[id];
  if (!d) return renderHome();
  setNav('');
  document.title = `${d.name} — гид Ableton Live 12`;
  const g = G[d.group];
  if (d.ready && window.DeviceView) return window.DeviceView.render(app, d, inst, style);
  delete app.dataset.dev;
  app.innerHTML = `<div class="view" style="--pc:${g.color}">
    <a class="back" href="#g-${g.id}">← ${esc(g.name)}</a>
    <section class="phero soon-hero">
      <div class="info">
        <div class="ty">${g.icon} ${esc(g.name)}</div>
        <h1>${esc(d.name)}</h1>
        <div class="tl">${esc(d.tagline)}</div>
        <div class="bdg">${badges(d)}</div>
        <p class="wh">Подробный разбор выйдет в партии ${g.n} из 10 («${esc(g.name)}»). В нём будет: для чего и когда применять, как пользоваться, что делает каждая ручка (с точными числами), настройки под партию и стиль с анимацией, лайфхаки и готовые цепочки.</p>
        <div class="links"><a class="btn" href="${esc(d.manual)}" target="_blank" rel="noopener">📘 Раздел мануала Live 12</a><a class="btn" href="#">Все устройства</a></div>
      </div>
      <div class="media"><div class="soon-panel"><b>${esc(d.name)}</b><span></span><span></span><span></span></div></div>
    </section></div>`;
  window.scrollTo({ top: 0 });
}

/* ---------- роутинг ---------- */
function setNav(k) { $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === k)); }
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (h.startsWith('d-')) { const [id, inst, style] = h.slice(2).split('/'); renderDevice(id, inst, style); }
  else if (h.startsWith('p-') && window.PartsPage) { setNav(''); window.PartsPage.page(app, h.slice(2)); window.scrollTo({ top: 0 }); }
  else if (h === 'parts') { if ($('#list')) $('#parts')?.scrollIntoView({ behavior: 'smooth' }); else renderHome('parts'); }
  else if (h.startsWith('g-')) { if ($('#list')) document.getElementById(h)?.scrollIntoView({ behavior: 'smooth' }); else renderHome(h); }
  else renderHome();
}
let io = null;
function observe() {
  if (io) io.disconnect();
  if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(n => n.classList.add('in')); return; }
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.reveal:not(.in)').forEach(n => io.observe(n));
}
window.GuideApp = { esc, G, BY_ID, badges, observe };
addEventListener('hashchange', route);
route();
})();
