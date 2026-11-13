/* Гид по устройствам: раздел «По партиям» — главная плитка и страница партии (#p-<id>). */
(function () {
'use strict';
const PV = window.PartView, esc = PV.esc;
const ORDER = ['kick', 'clap', 'hats', 'drums', 'sub', 'bass', 'pad', 'lead', 'pluck', 'arp', 'keys', 'vocal', 'guitar', 'fx', 'mixbus', 'master'];
const st = { style: '', kind: 'all' };
const meta = id => ({ ...(INSTRUMENTS[id] || {}), ...(PV.guide()[id] || {}) });

function tiles() {
  return `<div class="ptiles">${ORDER.map((id, i) => {
    const m = meta(id), g = PV.guide()[id];
    const n = g ? `${(g.make || []).length} рецептов · ${(g.chain || []).length} шагов обработки` : 'скоро';
    return `<a class="ptile" href="#p-${id}" style="animation-delay:${i * 30}ms"><span class="pi">${m.icon || '🎛️'}</span><b>${esc(m.name || id)}</b><small>${n}</small></a>`;
  }).join('')}</div>`;
}
function page(app, id) {
  const m = meta(id), g = PV.guide()[id];
  if (!m.name) { location.hash = ''; return; }
  document.title = `${m.name} — чем сделать и чем обработать · гид Ableton Live 12`;
  const kinds = st.kind === 'all' ? ['live', 'serum', 'diva', 'sample'] : [st.kind];
  const styleChips = Object.entries(STYLES).map(([sid, s]) => `<button class="chip sm ${st.style === sid ? 'on' : ''}" data-ps="${sid}" style="--c:${s.color}">${s.icon} ${esc(s.name)}</button>`).join('');
  const kindChips = [['all', 'Все'], ['live', '🟡 Live 12'], ['serum', '🟦 Serum 2'], ['diva', '🟪 Diva'], ['sample', '🎚️ Сэмплы']]
    .map(([k, t]) => `<button class="${st.kind === k ? 'on' : ''}" data-pk="${k}">${t}</button>`).join('');
  app.innerHTML = `<div class="view">
    <a class="back" href="#parts">← Все партии</a>
    <section class="phero part-hero"><div class="info">
      <div class="ty">По партиям</div><h1>${m.icon || ''} ${esc(m.name)}</h1>
      <p class="wh">${esc(g ? g.what : 'Рецепты для этой партии готовятся.')}</p>
      <div class="links"><a class="btn" href="midi.html#chords">🎹 MIDI-примеры партий</a></div></div></section>
    ${g ? `
    <div class="chips pstyles"><button class="chip sm ${st.style ? '' : 'on'}" data-ps="">Все стили</button>${styleChips}</div>
    <div class="sec-h"><div><h2>Чем сделать звук</h2><p>Стоковые инструменты Live 12 и твои Serum 2 и Diva. Значения — стартовые точки, доводи на слух.</p></div><div class="seg sm" id="pkind">${kindChips}</div></div>
    ${PV.makeMarkup(id, { kinds, style: st.style })}
    ${(g.chain || []).length ? `<div class="sec-h"><div><h2>Чем обработать — стоковые устройства Live</h2><p>Цепочка по порядку. Нажми на устройство — откроется его разбор.</p></div></div>${PV.chainMarkup(id, { which: 'chain' })}` : ''}
    ${(g.ff || []).length ? `<div class="sec-h"><div><h2>То же на FabFilter</h2><p>Если хочется точнее и нагляднее — замена стоковых устройств.</p></div></div>${PV.chainMarkup(id, { which: 'ff' })}` : ''}
    ${g.sidechain ? `<div class="box sc"><h3 class="bh">🔗 Сайдчейн</h3><p>${esc(g.sidechain)}</p></div>` : ''}
    ${g.styles ? `<div class="sec-h"><div><h2>Под стиль</h2></div></div>${PV.stylesMarkup(id, st.style)}` : ''}
    ${(g.tips || []).length ? `<div class="sec-h"><div><h2>Советы продюсеров</h2></div></div>${PV.tipsMarkup(id)}` : ''}
    ${PV.srcLinks(g.src)}` : ''}
  </div>`;
  app.querySelectorAll('[data-ps]').forEach(b => b.addEventListener('click', () => { st.style = b.dataset.ps; page(app, id); }));
  app.querySelectorAll('[data-pk]').forEach(b => b.addEventListener('click', () => { st.kind = b.dataset.pk; page(app, id); }));
}
window.PartsPage = { ORDER, tiles, page };
})();
