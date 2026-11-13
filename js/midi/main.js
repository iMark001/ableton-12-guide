/* Страница MIDI: вкладки по hash (#clock, #chords, #detect, #compat, #melody). */
(function () {
'use strict';
const MP = window.MidiPage, U = MP.ui;
/* вкладки, чьи скрипты загрузились (если какой-то файл не пришёл — остальные работают) */
const ORDER = ['clock', 'chords', 'detect', 'compat', 'melody'].filter(id => MP.tabs[id]);
const ICON = { clock: '🕛', chords: '🎹', detect: '🔎', compat: '🧩', melody: '🎵' };
let cur = null, io = null;

function observe(root) {
  if (io) io.disconnect();
  if (!('IntersectionObserver' in window)) { U.$$('.reveal', root).forEach(n => n.classList.add('in')); return; }
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  U.$$('.reveal:not(.in)', root).forEach(n => io.observe(n));
}
function show(tab) {
  if (!MP.tabs[tab]) tab = ORDER[0];
  if (!tab) { U.$('#tab').innerHTML = '<div class="empty"><span class="big">⚠️</span>Страница не загрузилась полностью. Обнови её.</div>'; return; }
  if (cur && MP.tabs[cur].destroy) MP.tabs[cur].destroy();
  if (window.Synth) window.Synth.stop();
  cur = tab;
  U.$$('#tabs [data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  const host = document.createElement('div');
  host.className = 'tabview';
  U.$('#tab').replaceChildren(host);
  try {
    MP.tabs[tab].render(host);
  } catch (err) {
    host.innerHTML = `<div class="empty"><span class="big">⚠️</span>Что-то пошло не так: ${U.esc(err.message)}</div>`;
    console.error(err);
  }
  observe(host);
  const tabs = U.$('#tabs');
  if (tabs.getBoundingClientRect().top < 0) tabs.scrollIntoView({ block: 'start' });
}
function go(tab) {
  if (location.hash.slice(1) === tab) show(tab);
  else location.hash = tab;
}
MP.go = go;

U.$('#tabs').innerHTML = ORDER.map(id => `<button role="tab" data-tab="${id}"><span>${ICON[id]}</span>${U.esc(MP.tabs[id].title)}</button>`).join('');
U.$('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });
addEventListener('hashchange', () => show(location.hash.slice(1)));
show(location.hash.slice(1) || 'clock');
})();
