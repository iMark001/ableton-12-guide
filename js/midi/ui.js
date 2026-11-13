/* Общие элементы страницы MIDI: состояние, клавиатура, пиано-ролл, выбор тональности. */
(function () {
'use strict';
const M = window.MusicCore;
const MP = window.MidiPage = window.MidiPage || { tabs: {} };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- состояние (тональность общая для всех вкладок) ---------- */
const STORE = 'abl-guide-key';
function loadKey() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (v && Number.isInteger(v.root) && v.root >= 0 && v.root < 12 && M.SCALES[v.scale]) return v;
  } catch (_) { /* приватный режим — работаем без памяти */ }
  return { root: 9, scale: 'minor' };
}
const state = { key: loadKey(), sound: true };
const listeners = new Set();
function setKey(root, scale) {
  state.key = { root: M.mod12(root), scale: M.SCALES[scale] ? scale : state.key.scale };
  try { localStorage.setItem(STORE, JSON.stringify(state.key)); } catch (_) { /* без памяти */ }
  listeners.forEach(fn => fn(state.key));
}
const onKey = fn => { listeners.add(fn); return () => listeners.delete(fn); };

/* ---------- подписи ---------- */
const keyTitle = (root, scale) => {
  const sp = M.spellScale(root, scale), kn = M.keyName(root, scale);
  return { short: kn.short, long: kn.ableton, dj: kn.dj,
    ru: `${M.ruName(sp.root)} ${M.SCALES[scale].ru.toLowerCase()}`, sp };
};
/* код DJ-программ (Traktor, Rekordbox, Mixed In Key) — только для сравнения */
const djTag = (root, scale) => { const d = M.keyName(root, scale).dj; return d ? `<span class="dj" title="Код в DJ-программах (Traktor, Rekordbox, Mixed In Key). В Ableton его нет.">DJ ${d}</span>` : ''; };
const noteChip = (name, cls = '') => `<span class="nchip ${cls}"><b>${esc(M.pretty(name))}</b><small>${esc(M.ruName(name))}</small></span>`;
const chordLabel = name => esc(M.pretty(name.replace('m7b5', 'm7♭5')));

/* ---------- раскладка аккорда в нотах (средняя «до» = C3 = MIDI 60) ---------- */
function voice(pcs, { base = 60, bass = false } = {}) {
  const root = pcs[0];
  let m = base + M.mod12(root - base);
  if (m > base + 6) m -= 12;
  const out = [m];
  for (let i = 1; i < pcs.length; i++) {
    let n = out[i - 1] + M.mod12(pcs[i] - out[i - 1]);
    if (n === out[i - 1]) n += 12;
    out.push(n);
  }
  return bass ? [out[0] - 24, ...out] : out;
}
function invert(midis, times) {
  const v = [...midis];
  for (let i = 0; i < times; i++) v.push(v.shift() + 12);
  return v;
}

/* ---------- клавиатура (SVG) ---------- */
const IS_BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
function piano({ from = 48, to = 83, marks = {}, labels = true, cls = '' } = {}) {
  const WW = 26, WH = 104, BW = 16, BH = 64;
  const whites = [], blacks = [];
  let x = 0;
  for (let m = from; m <= to; m++) {
    const pc = M.mod12(m), mk = marks[m] || '';
    if (!IS_BLACK[pc]) {
      const lab = labels && (pc === 0 || mk) ? `<text x="${x + WW / 2}" y="${WH - 8}" class="kl ${mk ? 'on' : ''}">${pc === 0 && !mk ? M.midiName(m) : esc(mk.split('|')[1] || M.midiName(m))}</text>` : '';
      whites.push(`<g class="pk w ${esc(mk.split('|')[0])}" data-m="${m}"><rect x="${x}" y="0" width="${WW - 1}" height="${WH}" rx="4"/>${lab}</g>`);
      x += WW;
    } else {
      blacks.push(`<g class="pk b ${esc(mk.split('|')[0])}" data-m="${m}"><rect x="${x - BW / 2 - 0.5}" y="0" width="${BW}" height="${BH}" rx="3"/></g>`);
    }
  }
  return `<svg class="piano ${cls}" viewBox="-1 -1 ${x + 1} ${WH + 2}" role="img" aria-label="Клавиатура">${whites.join('')}${blacks.join('')}</svg>`;
}

/* ---------- пиано-ролл в стиле Ableton ---------- */
/* notes: [{ pitch, start, dur (в шестнадцатых), cls }] */
function pianoRoll({ notes = [], low, high, steps = 16, scale = null, rootPc = null, rowH = 13, stepW = 14, title = '', fold = false } = {}) {
  const pitches = notes.map(n => n.pitch);
  const lo = low ?? Math.min(...pitches, 60) - 2, hi = high ?? Math.max(...pitches, 64) + 2;
  const inScale = scale ? new Set(scale) : null;
  /* fold = как кнопка Fold в Ableton: только строки, где есть ноты */
  const list = fold ? [...new Set(pitches)].sort((a, b) => b - a) : Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  const rowOf = new Map(list.map((p, i) => [p, i]));
  const KW = 44, W = KW + steps * stepW, H = list.length * rowH;
  const rows = [], keys = [];
  for (const p of list) {
    const y = rowOf.get(p) * rowH, pc = M.mod12(p);
    const rowCls = ['row', IS_BLACK[pc] ? 'bk' : 'wk', inScale && inScale.has(pc) ? 'sc' : '', pc === rootPc ? 'rt' : ''].join(' ');
    rows.push(`<rect class="${rowCls}" x="${KW}" y="${y}" width="${W - KW}" height="${rowH}"/>`);
    keys.push(`<rect class="rk ${IS_BLACK[pc] ? 'bk' : 'wk'} ${inScale && inScale.has(pc) ? 'sc' : ''} ${pc === rootPc ? 'rt' : ''}" x="0" y="${y}" width="${KW - 2}" height="${rowH}"/>`);
    if (fold || pc === 0 || pc === rootPc) keys.push(`<text class="rl" x="4" y="${y + rowH - 3}">${M.midiName(p)}</text>`);
  }
  const grid = [];
  for (let s = 0; s <= steps; s++) {
    const gx = KW + s * stepW;
    grid.push(`<line class="${s % 16 === 0 ? 'gb' : s % 4 === 0 ? 'gq' : 'gs'}" x1="${gx}" y1="0" x2="${gx}" y2="${H}"/>`);
  }
  const nn = notes.filter(n => rowOf.has(n.pitch)).map((n, i) => {
    const y = rowOf.get(n.pitch) * rowH + 1, x = KW + n.start * stepW + 1;
    return `<rect class="nt ${esc(n.cls || '')}" x="${x}" y="${y}" width="${Math.max(3, n.dur * stepW - 2)}" height="${rowH - 2}" rx="2" style="animation-delay:${Math.min(i * 25, 900)}ms"><title>${M.midiName(n.pitch)}</title></rect>`;
  }).join('');
  return `<div class="roll-wrap"><svg class="roll" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title || 'Пиано-ролл')}">
    ${rows.join('')}${grid.join('')}${keys.join('')}${nn}<line class="ph" x1="${KW}" y1="0" x2="${KW}" y2="${H}"/></svg></div>`;
}
/* бегущая линия воспроизведения */
function playhead(root, totalSteps, secPerStep) {
  const svg = $('svg.roll', root), line = svg && $('.ph', svg);
  if (!line) return;
  const KW = 44, stepW = (svg.viewBox.baseVal.width - KW) / totalSteps;
  const t0 = performance.now(), dur = totalSteps * secPerStep * 1000;
  line.classList.add('on');
  (function frame(now) {
    const k = Math.min(1, (now - t0) / dur), x = KW + k * totalSteps * stepW;
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    if (k < 1 && line.isConnected) requestAnimationFrame(frame); else line.classList.remove('on');
  })(t0);
}

/* ---------- выбор тональности ---------- */
function keyPicker({ root, scale, scales = ['major', 'minor'] }) {
  const sp = M.spellScale(root, scale);
  const roots = Array.from({ length: 12 }, (_, pc) => {
    const nm = pc === root ? sp.root : (M.SHARP[pc] === M.FLAT[pc] ? M.SHARP[pc] : `${M.SHARP[pc]}/${M.FLAT[pc]}`);
    return `<button class="chip sm ${pc === root ? 'on' : ''}" data-root="${pc}">${esc(M.pretty(nm))}</button>`;
  }).join('');
  const sc = scales.map(id => `<button class="chip sm ${id === scale ? 'on' : ''}" data-scale="${id}" title="${esc(M.SCALES[id].mood)}">${esc(M.SCALES[id].name)} <small>${esc(M.SCALES[id].ru)}</small></button>`).join('');
  return `<div class="kp"><div class="chips">${roots}</div><div class="chips">${sc}</div></div>`;
}
function bindKeyPicker(el, scales) {
  el.addEventListener('click', e => {
    const r = e.target.closest('[data-root]'), s = e.target.closest('[data-scale]');
    if (r) setKey(+r.dataset.root, state.key.scale);
    else if (s && scales.includes(s.dataset.scale)) setKey(state.key.root, s.dataset.scale);
  });
}

/* ---------- скачать MIDI ---------- */
function download(bytes, filename) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const safeName = s => String(s).replace(/[♯#]/g, 's').replace(/[♭]/g, 'b').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'midi';

const sound = (fn) => { if (state.sound && window.Synth) fn(window.Synth); };

MP.ui = { esc, $, $$, state, setKey, onKey, keyTitle, djTag, noteChip, chordLabel, voice, invert, piano, pianoRoll, playhead, keyPicker, bindKeyPicker, download, safeName, sound, IS_BLACK };
})();
