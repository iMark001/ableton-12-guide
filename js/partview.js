/* Общий вывод данных «По партиям» (data/parts/*.js → PART_GUIDE):
   чем сделать звук (Live / Serum 2 / Diva), чем обработать (цепочка стоковых устройств и FabFilter). */
(function () {
'use strict';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KIND = { live: { name: 'Ableton Live 12', icon: '🟡' }, serum: { name: 'Serum 2', icon: '🟦' }, diva: { name: 'Diva', icon: '🟪' }, sample: { name: 'Сэмплы', icon: '🎚️' } };
const guide = () => (typeof PART_GUIDE === 'object' ? PART_GUIDE : {});
const styleName = id => (typeof STYLES === 'object' && STYLES[id] ? STYLES[id].name : id);
/* ссылка на страницу устройства гида; base — '' на index.html и 'index.html' на midi.html */
const devLink = (id, name, base) => (id ? `<a class="devl" href="${base}#d-${esc(id)}">${esc(name)}</a>` : `<b>${esc(name)}</b>`);

function params(list) {
  if (!list || !list.length) return '';
  return `<table class="prm">${list.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
}
function srcLinks(list) {
  if (!list || !list.length) return '';
  return `<p class="src">Источники: ${list.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>`;
}
function recipeCard(r, base) {
  const k = KIND[r.kind] || KIND.live;
  return `<div class="rcp k-${esc(r.kind)}">
    <div class="rh"><span class="rk">${k.icon} ${esc(k.name)}</span>${devLink(r.kind === 'live' ? r.device : null, r.tool, base)}</div>
    <b class="rt">${esc(r.title)}</b>
    ${r.styles && r.styles.length ? `<div class="tags">${r.styles.map(s => `<span>${esc(styleName(s))}</span>`).join('')}</div>` : ''}
    ${params(r.params)}
    ${r.midi ? `<p class="rm">🎹 ${esc(r.midi)}</p>` : ''}
    ${r.why ? `<p class="rw">💡 ${esc(r.why)}</p>` : ''}</div>`;
}
/* kinds: какие вкладки показывать; style: подсветить рецепты стиля */
function makeMarkup(partId, { base = '', kinds = ['live', 'serum', 'diva', 'sample'], style = '' } = {}) {
  const g = guide()[partId];
  if (!g || !g.make) return '<p class="muted">Рецепты для этой партии появятся скоро.</p>';
  const list = g.make.filter(r => kinds.includes(r.kind)).sort((a, b) => (style ? (b.styles || []).includes(style) - (a.styles || []).includes(style) : 0));
  if (!list.length) return '<p class="muted">Нет рецептов этого типа.</p>';
  return `<div class="rcps">${list.map(r => recipeCard(r, base)).join('')}</div>`;
}
function chainMarkup(partId, { base = '', which = 'chain' } = {}) {
  const g = guide()[partId];
  const list = g && g[which];
  if (!list || !list.length) return '';
  return `<div class="chainv">${list.map((s, i) => `${i ? '<span class="arr"></span>' : ''}<div class="cstep">
      <div class="ch"><span class="n">${i + 1}</span>${which === 'chain' ? devLink(s.device, s.tool, base) : `<b>${esc(s.tool)}</b>`}</div>
      ${params(s.params)}${s.why ? `<p class="rw">💡 ${esc(s.why)}</p>` : ''}</div>`).join('')}</div>`;
}
function stylesMarkup(partId, style) {
  const g = guide()[partId];
  if (!g || !g.styles) return '';
  const ent = Object.entries(g.styles).filter(([s]) => !style || s === style);
  if (!ent.length) return '';
  return `<div class="snotes">${ent.map(([s, t]) => `<div><b>${esc(styleName(s))}</b><p>${esc(t)}</p></div>`).join('')}</div>`;
}
function tipsMarkup(partId) {
  const g = guide()[partId];
  if (!g || !g.tips || !g.tips.length) return '';
  return `<ul class="ptips">${g.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
}

window.PartView = { KIND, esc, guide, makeMarkup, chainMarkup, stylesMarkup, tipsMarkup, srcLinks, params };
})();
