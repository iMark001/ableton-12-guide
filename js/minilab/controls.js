/* Вкладка «Кнопки»: кликаешь по элементу на рисунке MiniLab 3 — видишь, что он делает в Live. */
(function () {
'use strict';
const T = window.Tabs, P = window.MiniPanel;
const BY_ID = Object.fromEntries(ML_CONTROLS.map(c => [c.id, c]));
const GROUPS = [['knobs', 'Ручки'], ['faders', 'Фейдеры'], ['pads', 'Пэды'], ['main', 'Главный энкодер'], ['left', 'Слева'], ['keys', 'Клавиши']];
const st = { id: 'enc1' };
let el = null;

function card(id) {
  const c = BY_ID[id];
  if (!c) return '';
  const cc = ['daw', 'user'].map(p => ML_CC[p][id] !== undefined ? `<span class="badge ${p === 'daw' ? '' : 'v'}">${p === 'daw' ? 'DAW' : 'User'}: CC ${ML_CC[p][id]}</span>` : '').join(' ');
  return `<div class="mcard"><div class="mh"><b>${T.esc(c.name)}</b>${cc}</div><p class="sum">${T.esc(c.daw || '')}</p>
    <table class="mini rows">${c.rows.map(([k, v]) => `<tr><td>${T.esc(k)}</td><td>${T.esc(v)}</td></tr>`).join('')}</table></div>`;
}
function cheat() {
  const shift = ML_CONTROLS.filter(c => c.group === 'pads').map(c => c.rows.find(r => r[0].startsWith('Shift'))).filter(Boolean);
  const more = [['Shift + крутить энкодер', 'Выбор дорожки'], ['Shift + нажать энкодер', 'Arm выбранной дорожки'], ['Shift + Hold', 'Режим аккордов'], ['Shift + Oct − / +', 'Сдвиг на полутон']];
  const ccRow = id => `<tr><td>${T.esc(BY_ID[id].name)}</td><td>${ML_CC.daw[id]}</td><td>${ML_CC.user[id]}</td></tr>`;
  return `<div class="dt-grid">
    <div class="box"><h3 class="bh">Shift + … (шпаргалка)</h3><table class="mini">${[...shift, ...more].map(([k, v]) => `<tr><td>${T.esc(k)}</td><td>${T.esc(v)}</td></tr>`).join('')}</table></div>
    <div class="box"><h3 class="bh">Номера CC (официальная таблица Arturia)</h3>
      <table class="mini cc"><tr><th>Элемент</th><th>DAW</th><th>Arturia и User</th></tr>${[1, 2, 3, 4, 5, 6, 7, 8].map(n => ccRow(`enc${n}`)).join('')}${[1, 2, 3, 4].map(n => ccRow(`fad${n}`)).join('')}</table>
      <p class="muted small">CC — номер, по которому Live узнаёт ручку. В программе DAW эти номера занимает скрипт Live; свои назначения через MIDI Map удобнее делать в программе User.</p></div></div>`;
}
function pick(id) {
  if (!BY_ID[id]) return;
  st.id = id;
  P.select(el, [id]);
  T.$('#mlCard', el).innerHTML = card(id);
  T.$$('#mlGroups .chip', el).forEach(b => b.classList.toggle('on', b.dataset.g === BY_ID[id].group));
}
function render(host) {
  el = host;
  host.innerHTML = `
    <div class="sec-h"><div><h2>Что делает каждая кнопка</h2><p>Программа DAW (Shift + Pad 3). Кликни по ручке, фейдеру или пэду на рисунке.</p></div></div>
    <div class="chips" id="mlGroups">${GROUPS.map(([g, n]) => `<button class="chip sm" data-g="${g}">${n}</button>`).join('')}</div>
    <div class="mgrid"><div class="panelbox">${P.svg({ display: 'DAW' })}</div><div id="mlCard"></div></div>
    ${cheat()}`;
  host.addEventListener('click', e => {
    const g = e.target.closest('[data-g]');
    if (g) { const first = ML_CONTROLS.find(c => c.group === g.dataset.g); if (first) pick(first.id); P.select(el, ML_CONTROLS.filter(c => c.group === g.dataset.g).map(c => c.id)); return; }
    const m = e.target.closest('.mc');
    if (m) pick(m.dataset.ctl);
  });
  host.addEventListener('keydown', e => {
    const m = e.target.closest('.mc');
    if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(m.dataset.ctl); }
  });
  pick(st.id);
}

window.PageTabs.controls = { title: 'Кнопки', icon: '🎛️', render, destroy() { el = null; } };
})();
