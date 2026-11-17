/* Рисунок Arturia MiniLab 3 (свой SVG, вид сверху). У каждого элемента data-ctl = id из ML_CONTROLS.
   MiniPanel.svg(opts) — разметка; select / flash / setK / display — подсветка и положение ручек. */
(function () {
'use strict';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const W = 900, H = 470;
const KNOB_X = [310, 396, 482, 568], KNOB_Y = [52, 128], KNOB_R = 22;
const FADER_X = [650, 712, 774, 836], FADER_TOP = 30, FADER_LEN = 108;
const PAD_X0 = 166, PAD_STEP = 88, PAD_Y = 176, PAD_S = 66;
const PAD_TAG = ['Arp', 'Pad', 'Prog', 'Loop', 'Stop', 'Play', 'Rec', 'Tap'];
const PAD_LED = ['#60a5fa', '#60a5fa', '#60a5fa', '#fb923c', '#e5e7eb', '#34d399', '#f87171', '#facc15'];
const KEY_X0 = 30, KEY_Y = 266, KEY_W = 56, KEY_H = 186, WHITE = 15;
const BLACK_AFTER = [0, 1, 3, 4, 5]; /* чёрная клавиша после белых C, D, F, G, A */

const clamp01 = k => Math.max(0, Math.min(1, Number.isFinite(k) ? k : 0));
const angle = k => -135 + 270 * clamp01(k);
const capY = k => FADER_TOP + FADER_LEN * (1 - clamp01(k)) - 6;
const ctl = (id, name, inner, cls = '') => `<g class="mc ${cls}" data-ctl="${id}" tabindex="0" role="button" aria-label="${esc(name)}">${inner}</g>`;

function leftSide() {
  const btn = (id, name, x, y, h, dark) => ctl(id, name, `<rect class="bt ${dark ? 'dk' : ''}" x="${x}" y="${y}" width="52" height="${h}" rx="5"/><text class="bl ${dark ? 'dk' : ''}" x="${x + 26}" y="${y + h / 2 + 4}">${esc(name)}</text>`);
  const strip = (id, name, x, mark) => ctl(id, name, `<rect class="st" x="${x}" y="100" width="52" height="120" rx="8"/><text class="sl" x="${x + 26}" y="${mark}">${id === 'pitch' ? '↑ — ↓' : '↥'}</text><text class="lb" x="${x + 26}" y="236">${esc(name)}</text>`);
  return btn('shift', 'Shift', 30, 26, 26, true) + btn('hold', 'Hold', 92, 26, 26) + btn('octm', 'Oct −', 30, 64, 24) + btn('octp', 'Oct +', 92, 64, 24)
    + strip('pitch', 'Pitch', 30, 164) + strip('mod', 'Mod', 92, 164);
}
function screen(display) {
  return `<rect class="scr" x="166" y="22" width="92" height="132" rx="8"/><rect class="oledbg" x="174" y="30" width="76" height="44" rx="3"/>
    <text class="oled" x="212" y="57">${esc(display)}</text>`
    + ctl('main', 'Главный энкодер', `<circle class="enc" cx="212" cy="116" r="24"/><circle class="encc" cx="212" cy="116" r="16"/>`);
}
function knobs(labels, k) {
  return KNOB_Y.flatMap((y, row) => KNOB_X.map((x, i) => {
    const n = row * 4 + i + 1, id = `enc${n}`, lab = labels[id];
    return ctl(id, `Ручка ${n}`, `<circle class="kb" cx="${x}" cy="${y}" r="${KNOB_R}"/>
      <g class="kp" style="transform:rotate(${angle(k[id] ?? 0.5)}deg);transform-origin:${x}px ${y}px"><line x1="${x}" y1="${y}" x2="${x}" y2="${y - KNOB_R + 4}"/></g>
      <text class="kn" x="${x}" y="${y + 36}">${lab ? `${n} · ${esc(lab)}` : n}</text>`);
  })).join('');
}
function faders(labels, k) {
  return FADER_X.map((x, i) => {
    const n = i + 1, id = `fad${n}`, lab = labels[id];
    return ctl(id, `Фейдер ${n}`, `<rect class="ft" x="${x - 3}" y="${FADER_TOP}" width="6" height="${FADER_LEN}" rx="3"/><rect class="fh" x="${x - 26}" y="${FADER_TOP - 6}" width="52" height="${FADER_LEN + 12}" rx="6"/>
      <rect class="cap" x="${x - 15}" y="${capY(k[id] ?? 0.75)}" width="30" height="12" rx="3"/>
      <text class="kn" x="${x}" y="${FADER_TOP + FADER_LEN + 22}">${lab ? esc(lab) : n}</text>`);
  }).join('');
}
function pads(labels) {
  return PAD_TAG.map((tag, i) => {
    const n = i + 1, id = `pad${n}`, x = PAD_X0 + i * PAD_STEP;
    return ctl(id, `Пэд ${n}`, `<rect class="pd" x="${x}" y="${PAD_Y}" width="${PAD_S}" height="${PAD_S}" rx="8" style="--led:${PAD_LED[i]}"/>
      <text class="pn" x="${x + PAD_S / 2}" y="${PAD_Y + PAD_S / 2 + 5}">${labels[id] ? esc(labels[id]) : n}</text><text class="lb" x="${x + PAD_S / 2}" y="${PAD_Y + PAD_S + 14}">${tag}</text>`);
  }).join('');
}
function keys() {
  const whites = Array.from({ length: WHITE }, (_, i) => `<rect class="wk" x="${KEY_X0 + i * KEY_W}" y="${KEY_Y}" width="${KEY_W - 2}" height="${KEY_H}" rx="4"/>`);
  const blacks = [0, 7].flatMap(o => BLACK_AFTER.map(w => `<rect class="bk" x="${KEY_X0 + (o + w + 1) * KEY_W - 17}" y="${KEY_Y}" width="32" height="112" rx="3"/>`));
  return ctl('keys', 'Клавиатура', whites.join('') + blacks.join(''));
}

function svg({ labels = {}, k = {}, display = 'DAW', cls = '' } = {}) {
  return `<svg class="mp ${esc(cls)}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Arturia MiniLab 3">
    <rect class="body" x="0" y="0" width="${W}" height="${H}" rx="26"/>
    ${leftSide()}${screen(display)}${knobs(labels, k)}${faders(labels, k)}${pads(labels)}${keys()}</svg>`;
}

const q = (root, id) => root.querySelector(`.mc[data-ctl="${CSS.escape(id)}"]`);
function select(root, ids = []) {
  const on = new Set(ids);
  root.querySelectorAll('.mc').forEach(g => g.classList.toggle('on', on.has(g.dataset.ctl)));
}
function flash(root, id) {
  const g = q(root, id);
  if (!g) return;
  g.classList.remove('hit');
  void g.getBBox(); /* перезапуск анимации */
  g.classList.add('hit');
}
function setK(root, id, k) {
  const g = q(root, id);
  if (!g) return;
  const p = g.querySelector('.kp'), cap = g.querySelector('.cap');
  if (p) p.style.transform = `rotate(${angle(k)}deg)`;
  if (cap) cap.setAttribute('y', capY(k));
}
function display(root, text) {
  const t = root.querySelector('.oled');
  if (t) t.textContent = text;
}

window.MiniPanel = { svg, select, flash, setK, display };
})();
