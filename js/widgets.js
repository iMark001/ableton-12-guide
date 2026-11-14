/* Виджеты страниц устройств: ручка с числом (как в Live), переключатель, ADSR, график компрессии. */
(function () {
'use strict';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MINUS = '−';
const sgn = (v, d) => (v < 0 ? MINUS : v > 0 ? '+' : '') + Math.abs(v).toFixed(d);

/* положение ручки 0..1 из реального значения */
function toK(ctl, v) {
  if (v === Infinity || v === 'inf') return 1;
  const { min = 0, max = 1, curve = 'lin' } = ctl;
  let k;
  if (curve === 'log' && min > 0) k = Math.log(v / min) / Math.log(max / min);
  else k = (v - min) / (max - min);
  return Math.max(0, Math.min(1, k));
}
/* значение с единицами, как в Live */
function fmt(ctl, v) {
  if (typeof v === 'string') return v;
  const u = ctl.unit || '';
  if (v === Infinity) return u === ':1' ? '∞ : 1' : '∞';
  switch (u) {
    case 'dB': return `${v === 0 ? '0.0' : sgn(v, 1)} dB`;
    case 'dBi': return `${v === 0 ? '0' : sgn(v, 0)} dB`;
    case 'ms': return `${v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v)} ms`;
    case 's': return `${v.toFixed(v < 10 ? 2 : 1)} s`;
    case ':1': return `${v < 10 ? +v.toFixed(2) : Math.round(v)} : 1`;
    case '%': return `${Math.round(v)} %`;
    case 'Hz': return v >= 1000 ? `${+(v / 1000).toFixed(2)} kHz` : `${Math.round(v)} Hz`;
    case 'st': return `${sgn(v, 0)} st`;
    case '': return String(+(+v).toFixed(2));
    default: return `${+(+v).toFixed(2)} ${u}`;
  }
}

const R = 38, C = 2 * Math.PI * R, L = C * 0.75;
function knob(k) {
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = (-135 + i * 27) * Math.PI / 180;
    return `<line x1="${(50 + Math.sin(a) * 46).toFixed(1)}" y1="${(50 - Math.cos(a) * 46).toFixed(1)}" x2="${(50 + Math.sin(a) * 49).toFixed(1)}" y2="${(50 - Math.cos(a) * 49).toFixed(1)}"/>`;
  }).join('');
  return `<svg class="knob" viewBox="0 0 100 100" data-k="${k.toFixed(3)}"><g class="tk">${ticks}</g>
    <circle class="trk" cx="50" cy="50" r="${R}" stroke-dasharray="${L} ${C}" transform="rotate(135 50 50)"/>
    <circle class="arc" cx="50" cy="50" r="${R}" stroke-dasharray="0 ${C}" transform="rotate(135 50 50)"/>
    <circle cx="50" cy="50" r="27" class="cap"/>
    <g class="ptr" style="transform:rotate(-135deg)"><line x1="50" y1="50" x2="50" y2="27"/></g></svg>`;
}
function animateKnobs(root) {
  root.querySelectorAll('.knob').forEach((svg, i) => {
    const k = +svg.dataset.k;
    setTimeout(() => {
      svg.querySelector('.arc').setAttribute('stroke-dasharray', `${k * L} ${C}`);
      svg.querySelector('.ptr').style.transform = `rotate(${-135 + 270 * k}deg)`;
    }, 120 + i * 70);
  });
}
const sw = (opts, sel) => `<div class="sw">${opts.map(o => `<span class="${o === sel ? 'on' : ''}">${esc(o)}</span>`).join('')}</div>`;

function adsr(a, d, s, r) {
  const w = t => 8 + 52 * Math.log10(1 + t * 8) / Math.log10(1 + 32 * 8);
  const W = 300, top = 8, bot = 64;
  let x = 4; const pts = [[x, bot]];
  x += w(a); pts.push([x, top]);
  x += w(d); const sy = bot - (bot - top) * s; pts.push([x, sy]);
  x += 40; pts.push([x, sy]);
  x += w(r); pts.push([x, bot]);
  const sc = (W - 8) / x, path = 'M' + pts.map(([px, py]) => `${(px * sc).toFixed(1)},${py}`).join(' L');
  return `<svg class="adsr" viewBox="0 0 ${W} 70" preserveAspectRatio="none"><path class="fillp" d="${path} Z"/><path d="${path}"/></svg>`;
}

/* График компрессии: вход по горизонтали, выход по вертикали (−60…0 dB) */
function compCurve({ threshold = -20, ratio = 4, knee = 6, ceiling = null, label = '' }) {
  const S = 180, lo = -60, px = db => ((db - lo) / -lo) * S, py = db => S - px(db);
  const out = x => {
    if (ceiling !== null) return Math.min(x, ceiling);
    const r = ratio === Infinity ? 1e6 : ratio, h = knee / 2;
    if (x < threshold - h) return x;
    if (knee > 0 && x <= threshold + h) return x + (1 / r - 1) * (x - threshold + h) ** 2 / (2 * knee);
    return threshold + (x - threshold) / r;
  };
  const pts = Array.from({ length: 61 }, (_, i) => lo + i).map(x => `${px(x).toFixed(1)},${py(out(x)).toFixed(1)}`).join(' L');
  const t = ceiling !== null ? ceiling : threshold;
  const grid = [-48, -36, -24, -12].map(g => `<line class="g" x1="${px(g)}" y1="0" x2="${px(g)}" y2="${S}"/><line class="g" x1="0" y1="${py(g)}" x2="${S}" y2="${py(g)}"/>`).join('');
  return `<svg class="ccurve" viewBox="-6 -6 ${S + 12} ${S + 26}" role="img" aria-label="График компрессии">
    <rect class="bgc" x="0" y="0" width="${S}" height="${S}"/>${grid}
    <line class="diag" x1="0" y1="${S}" x2="${S}" y2="0"/>
    <line class="thr" x1="${px(t)}" y1="0" x2="${px(t)}" y2="${S}"/>
    <path class="cv" d="M${pts}"/>
    <text x="${S / 2}" y="${S + 16}">${esc(label || `порог ${fmt({ unit: 'dB' }, t)}`)}</text></svg>`;
}

window.Widgets = { esc, toK, fmt, knob, animateKnobs, sw, adsr, compCurve };
})();
