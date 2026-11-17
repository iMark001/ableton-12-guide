/* Контроллер и автоматизация: разбор MIDI-сообщений, определение ручки MiniLab 3 по таблице CC,
   абсолютные/относительные значения, точки дорожки автоматизации (запись, упрощение, формы Live).
   Чистые функции без DOM: браузер (window.CtrlCore) и node (require). Входные массивы не меняются. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CtrlCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

/* ---------- MIDI-сообщения ---------- */
const STATUS = { 0x80: 'note-off', 0x90: 'note-on', 0xA0: 'aftertouch', 0xB0: 'cc', 0xC0: 'program', 0xD0: 'aftertouch', 0xE0: 'pitch' };

function parseMidi(bytes) {
  if (!bytes || !bytes.length) return null;
  const st = bytes[0];
  if (st === 0xF0) return { type: 'sysex', ch: null, num: null, value: null };
  if (st < 0x80) return null;
  if (st >= 0xF0) return { type: 'other', ch: null, num: null, value: null };
  const hi = st & 0xF0, ch = (st & 0x0F) + 1, d1 = bytes[1] ?? 0, d2 = bytes[2] ?? 0;
  if (hi === 0xE0) return { type: 'pitch', ch, num: null, value: (d2 << 7) | d1 };
  if (hi === 0x90 && d2 === 0) return { type: 'note-off', ch, num: d1, value: 0 };
  if (hi === 0xC0 || hi === 0xD0) return { type: STATUS[hi], ch, num: null, value: d1 };
  return { type: STATUS[hi], ch, num: d1, value: d2 };
}

/* ---------- какая это ручка MiniLab 3 ---------- */
const PAD_CH = 10, PAD_LOW = 36, PAD_HIGH = 51, PAD_CC_LOW = 102, PAD_CC_HIGH = 109, MOD_CC = 1;

function identify(msg, chart) {
  if (!msg) return null;
  if (msg.type === 'pitch') return { id: 'pitch' };
  if (msg.type === 'note-on' || msg.type === 'note-off') {
    if (msg.ch === PAD_CH && msg.num >= PAD_LOW && msg.num <= PAD_HIGH) {
      const i = msg.num - PAD_LOW;
      return { id: `pad${(i % 8) + 1}`, bank: i < 8 ? 'A' : 'B' };
    }
    return { id: 'keys', note: msg.num };
  }
  if (msg.type !== 'cc') return null;
  for (const program of ['daw', 'user']) {
    const hit = Object.entries((chart && chart[program]) || {}).find(([, n]) => n === msg.num);
    if (hit) return { id: hit[0], program };
  }
  if (msg.num >= PAD_CC_LOW && msg.num <= PAD_CC_HIGH) return { id: `pad${msg.num - PAD_CC_LOW + 1}` };
  if (msg.num === MOD_CC) return { id: 'mod' };
  return null;
}

/* ---------- абсолютные или относительные значения (по последним значениям одной ручки) ----------
   'absolute' — обычные 0…127; 'binoffset' — Relative 1 в MIDI Control Center = Live «Relative (BinOffset)»;
   'twos' — Relative 2 = Live «Relative (2's Comp.)»; null — данных мало или нельзя различить. */
const MIN_SAMPLES = 3;
const inRange = (v, a, b) => v >= a && v <= b;
function guessRelative(values) {
  const vs = Array.from(values || []);
  if (vs.length < MIN_SAMPLES) return null;
  /* относительная ручка не «копит» значение: повторяется или топчется на месте; абсолютная — растёт или падает */
  const diffs = vs.slice(1).map((v, i) => Math.sign(v - vs[i])).filter(Boolean);
  const turns = diffs.filter((d, i) => i > 0 && d !== diffs[i - 1]).length;
  const repeats = vs.length - 1 - diffs.length;
  const narrow = Math.max(...vs) - Math.min(...vs) <= 3;
  const steady = repeats >= (vs.length - 1) / 2 || (turns > 0 && narrow);
  const up = vs.every(v => inRange(v, 1, 15)), down = vs.every(v => inRange(v, 113, 127));
  const mixedTwos = vs.every(v => inRange(v, 1, 15) || inRange(v, 113, 127)) && !up && !down;
  if (mixedTwos) return 'twos';
  if (vs.every(v => v === 127)) return null;
  if ((up || down) && steady) return 'twos';
  if (vs.every(v => inRange(v, 57, 71)) && steady) return 'binoffset';
  return 'absolute';
}

/* ---------- дорожка автоматизации: точки { t, v }, t — время (такты), v — 0…1 ---------- */
function valueAt(points, t, def = 0) {
  if (!points.length) return def;
  if (t < points[0].t) return points[0].v;
  let k = -1;
  for (let i = 0; i < points.length; i++) if (points[i].t <= t) k = i;
  const a = points[k], b = points[k + 1];
  if (!b) return a.v;
  if (b.t === a.t) return b.v;
  return a.v + (b.v - a.v) * (t - a.t) / (b.t - a.t);
}

/* Значение слева от момента t (если в t скачок — то, что было до скачка). */
function leftValue(points, t) {
  let k = -1;
  for (let i = 0; i < points.length; i++) if (points[i].t < t) k = i;
  if (k < 0) return points[0].v;
  const a = points[k], b = points[k + 1];
  if (!b) return a.v;
  return a.v + (b.v - a.v) * (t - a.t) / (b.t - a.t);
}

/* Заменить участок новыми точками (запись, карандаш, вставка формы). Снаружи всё остаётся,
   на краях — старое значение (слева — до участка, справа — после), чтобы автоматизация шла как раньше. */
function replaceSpan(points, fresh) {
  if (!fresh.length) return points.map(p => ({ ...p }));
  const t0 = fresh[0].t, t1 = fresh[fresh.length - 1].t;
  const before = points.filter(p => p.t < t0).map(p => ({ ...p }));
  const after = points.filter(p => p.t > t1).map(p => ({ ...p }));
  const edges = points.length ? [{ t: t0, v: leftValue(points, t0) }] : [];
  const tail = points.length ? [{ t: t1, v: valueAt(points, t1) }] : [];
  return [...before, ...edges, ...fresh.map(p => ({ ...p })), ...tail, ...after];
}

/* Simplify Envelope: убрать лишние точки (алгоритм Рамера — Дугласа — Пекера). */
function distToSegment(p, a, b) {
  const dt = b.t - a.t, dv = b.v - a.v, len2 = dt * dt + dv * dv;
  if (!len2) return Math.hypot(p.t - a.t, p.v - a.v);
  const k = Math.max(0, Math.min(1, ((p.t - a.t) * dt + (p.v - a.v) * dv) / len2));
  return Math.hypot(p.t - (a.t + k * dt), p.v - (a.v + k * dv));
}
function simplify(points, eps) {
  if (points.length < 3) return points.map(p => ({ ...p }));
  const a = points[0], b = points[points.length - 1];
  let far = -1, dmax = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distToSegment(points[i], a, b);
    if (d > dmax) { dmax = d; far = i; }
  }
  if (dmax <= eps) return [{ ...a }, { ...b }];
  const left = simplify(points.slice(0, far + 1), eps), right = simplify(points.slice(far), eps);
  return [...left.slice(0, -1), ...right];
}

/* Формы из контекстного меню автоматизации Live: верхний ряд — волны, нижний — рампы и ADSR. */
const SHAPES = ['sine', 'triangle', 'saw', 'saw-inv', 'square', 'ramp-up', 'ramp-down', 'adsr'];
const SINE_STEPS = 24;
function shapePoints(kind, t0, t1, lo, hi) {
  const at = k => t0 + (t1 - t0) * k, lv = k => lo + (hi - lo) * k;
  const P = (k, v) => ({ t: at(k), v: lv(v) });
  switch (kind) {
    case 'sine': return Array.from({ length: SINE_STEPS + 1 }, (_, i) => P(i / SINE_STEPS, 0.5 + 0.5 * Math.sin(2 * Math.PI * i / SINE_STEPS)));
    case 'triangle': return [P(0, 0), P(0.5, 1), P(1, 0)];
    case 'saw': return [P(0, 0), P(1, 1), P(1, 0)];
    case 'saw-inv': return [P(0, 1), P(1, 0), P(1, 1)];
    case 'square': return [P(0, 1), P(0.5, 1), P(0.5, 0), P(1, 0)];
    case 'ramp-up': return [P(0, 0), P(1, 1)];
    case 'ramp-down': return [P(0, 1), P(1, 0)];
    case 'adsr': return [P(0, 0), P(0.15, 1), P(0.35, 0.6), P(0.8, 0.6), P(1, 0)];
    default: throw new Error(`неизвестная форма: ${kind}`);
  }
}

/* SVG-путь: x — время 0…len → 0…w, y — значение 1…0 → 0…h. */
const num = x => String(+x.toFixed(2));
function pathD(points, { w, h, len, def = 0 }) {
  const X = t => num(t / len * w), Y = v => num(h * (1 - v));
  if (!points.length) return `M0,${Y(def)} L${num(w)},${Y(def)}`;
  const pts = [];
  if (points[0].t > 0) pts.push([0, points[0].v]);
  points.forEach(p => pts.push([p.t, p.v]));
  const last = points[points.length - 1];
  if (last.t < len) pts.push([len, last.v]);
  return pts.map(([t, v], i) => `${i ? 'L' : 'M'}${X(t)},${Y(v)}`).join(' ');
}

return { parseMidi, identify, guessRelative, valueAt, replaceSpan, simplify, SHAPES, shapePoints, pathD };
});
