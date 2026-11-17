/* Вкладки страниц MiniLab 3 и Автоматизация: hash-роутер + общие мелочи (esc, клавиши, появление блоков).
   Каждая вкладка регистрируется в window.PageTabs[id] = { title, icon, render(host), destroy?() }.
   Порядок — в атрибуте data-order у #tabs. */
(function () {
'use strict';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const kbd = keys => keys.map(k => `<kbd>${esc(k)}</kbd>`).join(' + ');
/* ссылка на соседнюю страницу: на тестовой странице — на тестовую */
const page = name => `${/\/test_[^/]*$/.test(location.pathname) ? 'test_' : ''}${name}.html`;

let io = null;
function observe(root) {
  if (io) io.disconnect();
  if (!('IntersectionObserver' in window)) { $$('.reveal', root).forEach(n => n.classList.add('in')); return; }
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.reveal:not(.in)', root).forEach(n => io.observe(n));
}

const T = window.PageTabs = window.PageTabs || {};
window.Tabs = { esc, $, $$, kbd, page, observe };

function start() {
  const bar = $('#tabs'), box = $('#tab');
  if (!bar || !box) return;
  const order = (bar.dataset.order || '').split(/\s+/).filter(id => T[id]);
  let cur = null;
  function show(id) {
    if (!T[id]) id = order[0];
    if (!id) { box.innerHTML = '<div class="empty"><span class="big">⚠️</span>Страница не загрузилась полностью. Обнови её.</div>'; return; }
    if (cur && T[cur].destroy) { try { T[cur].destroy(); } catch (err) { console.error(err); } }
    cur = id;
    $$('[data-tab]', bar).forEach(b => { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    const host = document.createElement('div');
    host.className = 'tabview';
    box.replaceChildren(host);
    try { T[id].render(host); } catch (err) {
      host.innerHTML = `<div class="empty"><span class="big">⚠️</span>Что-то пошло не так: ${esc(err.message)}</div>`;
      console.error(err);
    }
    observe(host);
    if (bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' });
  }
  bar.innerHTML = order.map(id => `<button role="tab" data-tab="${id}"><span>${esc(T[id].icon || '')}</span>${esc(T[id].title)}</button>`).join('');
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    if (location.hash.slice(1) === b.dataset.tab) show(b.dataset.tab); else location.hash = b.dataset.tab;
  });
  addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
}
/* старт, когда все скрипты вкладок уже зарегистрировались */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else setTimeout(start, 0);
})();
