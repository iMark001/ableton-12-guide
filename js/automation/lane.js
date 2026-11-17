/* Тренажёр автоматизации: дорожка на 8 тактов, ручка «Freq» (как у Auto Filter), кнопки как в Control Bar Live.
   Режим 'record' — Automation Arm, запись, Re-Enable; режим 'edit' — карандаш, выделение, формы, Simplify.
   Звук: пила через low-pass, частота = положение ручки (слышно, как работает автоматизация). */
(function () {
'use strict';
const C = window.CtrlCore;
const BARS = 8, BAR_SEC = 1, GRID = 0.5, VW = 800, VH = 170, KNOB_DRAG_PX = 160;
const F_LO = 80, F_HI = 18000, LEVEL = 0.05;
const hz = v => F_LO * Math.pow(F_HI / F_LO, v);
const fmtHz = f => f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 1 : 2)} kHz` : `${Math.round(f)} Hz`;
const clamp = v => Math.max(0, Math.min(1, v));
const snap = t => Math.round(t / GRID) * GRID;

function mount(host, { mode = 'record' } = {}) {
  const st = { points: [], t: 0, playing: false, rec: false, arm: false, overridden: false, manual: 0.5,
    drag: null, base: null, samples: [], draw: false, sel: [2, 6], selDrag: null, sound: true };
  let raf = 0, last = 0, audio = null, alive = true;

  const tools = mode === 'record'
    ? `<button class="lbtn armb" data-act="arm" title="Automation Arm">⤴ Automation Arm</button><button class="lbtn recb" data-act="rec" title="Arrangement Record">● Запись</button><button class="lbtn reb" data-act="reenable" title="Re-Enable Automation">↺ Re-Enable Automation</button>`
    : `<button class="lbtn" data-act="draw" title="Draw Mode (B)">✏️ Карандаш (B)</button><button class="lbtn" data-act="simplify">Simplify Envelope</button>`;
  host.innerHTML = `<div class="alane">
    <div class="abar"><button class="lbtn playb" data-act="play" title="Play / Stop">▶ Play</button>${tools}<button class="lbtn" data-act="clear">Очистить</button>
      <label class="tgl"><input type="checkbox" data-act="sound" checked> звук</label></div>
    <div class="arow">
      <div class="aknob" tabindex="0" role="slider" aria-label="Freq" aria-valuemin="0" aria-valuemax="100">
        <svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="38"/><path class="arc" d=""/><circle class="cap" cx="50" cy="50" r="27"/><line class="ptr" x1="50" y1="50" x2="50" y2="27"/></svg>
        <span class="alamp" title="Лампочка автоматизации"></span><b class="aval"></b><small>Auto Filter · Freq</small></div>
      <div class="lanebox"><svg class="lane" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none" role="img" aria-label="Дорожка автоматизации">
        <g class="grid">${Array.from({ length: BARS * 2 + 1 }, (_, i) => `<line class="${i % 2 ? 'h' : 'b'}" x1="${i * VW / (BARS * 2)}" y1="0" x2="${i * VW / (BARS * 2)}" y2="${VH}"/>`).join('')}</g>
        <rect class="selr" x="0" y="0" width="0" height="${VH}"/><path class="env" d=""/><path class="envf" d=""/><line class="ph" x1="0" y1="0" x2="0" y2="${VH}"/></svg>
        <div class="ruler">${Array.from({ length: BARS }, (_, i) => `<span>${i + 1}</span>`).join('')}</div></div>
    </div>
    <p class="ahint"></p></div>`;
  const $ = s => host.querySelector(s);
  const lane = $('svg.lane'), knob = $('.aknob');

  /* ---------- значение ручки сейчас ---------- */
  const automated = () => st.points.length > 0 && !st.overridden;
  const knobValue = () => st.drag ? st.drag.v : automated() ? C.valueAt(st.points, st.t, st.manual) : st.manual;
  const recording = () => st.rec && st.arm && st.playing;

  /* ---------- отрисовка ---------- */
  const ARC = (v) => { const a0 = -225 * Math.PI / 180, a1 = a0 + 270 * v * Math.PI / 180, r = 38, P = a => `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
    return v <= 0.001 ? '' : `M${P(a0)} A${r},${r} 0 ${270 * v > 180 ? 1 : 0} 1 ${P(a1)}`; };
  function paint() {
    const v = knobValue();
    $('.arc').setAttribute('d', ARC(v));
    $('.ptr').setAttribute('transform', `rotate(${-135 + 270 * v} 50 50)`);
    $('.aval').textContent = fmtHz(hz(v));
    knob.setAttribute('aria-valuenow', Math.round(v * 100));
    $('.alamp').classList.toggle('on', automated());
    const d = C.pathD(st.points, { w: VW, h: VH, len: BARS, def: st.manual });
    $('.env').setAttribute('d', d);
    $('.envf').setAttribute('d', st.points.length ? `${d} L${VW},${VH} L0,${VH} Z` : '');
    lane.classList.toggle('off', st.overridden);
    lane.classList.toggle('blank', !st.points.length);
    const x = st.t / BARS * VW;
    $('.ph').setAttribute('x1', x); $('.ph').setAttribute('x2', x);
    const [a, b] = st.sel;
    $('.selr').setAttribute('x', Math.min(a, b) / BARS * VW); $('.selr').setAttribute('width', Math.abs(b - a) / BARS * VW);
    $('.selr').classList.toggle('on', mode === 'edit');
    host.querySelectorAll('[data-act]').forEach(btn => {
      const k = btn.dataset.act;
      btn.classList.toggle('on', (k === 'play' && st.playing) || (k === 'rec' && st.rec) || (k === 'arm' && st.arm) || (k === 'draw' && st.draw));
      btn.classList.toggle('lit', k === 'reenable' && st.overridden);
    });
    $('.playb').textContent = st.playing ? '■ Stop' : '▶ Play';
    $('.ahint').textContent = hint();
    if (audio) audio.f.frequency.setTargetAtTime(hz(v), audio.ctx.currentTime, 0.03);
  }
  function hint() {
    if (mode === 'edit') return st.draw ? 'Карандаш: веди по дорожке — рисуются ступеньки по сетке (полтакта).' : 'Тяни по дорожке — выделишь участок. Потом выбери форму или нажми Simplify Envelope.';
    if (st.drag && recording()) return 'Пишу автоматизацию: каждое движение ручки становится точкой на красной линии.';
    if (st.overridden) return 'Ты сдвинул ручку без записи — автоматизация на паузе, лампочка погасла. Нажми Re-Enable Automation.';
    if (st.rec && !st.arm) return 'Запись идёт, но Automation Arm выключен — движения ручки не пишутся.';
    if (recording()) return 'Запись включена. Крути ручку (тяни вверх-вниз), пока бежит линия.';
    if (st.points.length) return 'Автоматизация записана: при проигрывании ручка двигается сама. Попробуй покрутить её без записи.';
    return 'Включи Automation Arm, нажми ● Запись и крути ручку, пока играет.';
  }

  /* ---------- время ---------- */
  function frame(now) {
    raf = 0;
    if (!alive || !st.playing) return;
    st.t += (now - last) / 1000 / BAR_SEC;
    last = now;
    if (st.t >= BARS) { st.t -= BARS; commitTake(); }
    if (st.drag) record(st.drag.v);
    paint();
    raf = requestAnimationFrame(frame);
  }
  function play(on) {
    st.playing = on;
    if (on) { last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); sound(true); }
    else { commitTake(); sound(false); }
    paint();
  }

  /* ---------- запись и ручное движение ---------- */
  function commitTake() { st.base = st.points; st.samples = []; }
  function record(v) {
    if (!recording()) return;
    const prev = st.samples[st.samples.length - 1];
    if (prev && st.t < prev.t) return;
    st.samples = [...st.samples, { t: st.t, v }];
    st.points = C.replaceSpan(st.base || [], st.samples);
    st.overridden = false;
  }
  function turn(v) {
    if (!st.drag) { st.drag = { v: knobValue() }; commitTake(); }
    st.drag = { v: clamp(v) };
    if (recording()) record(st.drag.v);
    else { st.manual = st.drag.v; if (st.points.length) st.overridden = true; }
    paint();
  }
  function release() {
    if (!st.drag) return;
    if (!recording()) st.manual = st.drag.v;
    st.drag = null;
    commitTake();
    paint();
  }

  /* ---------- редактирование ---------- */
  const laneT = e => { const r = lane.getBoundingClientRect(); return Math.max(0, Math.min(BARS, (e.clientX - r.left) / r.width * BARS)); };
  const laneV = e => { const r = lane.getBoundingClientRect(); return clamp(1 - (e.clientY - r.top) / r.height); };
  function drawAt(e) {
    const i = Math.min(BARS / GRID - 1, Math.floor(laneT(e) / GRID)), v = laneV(e);
    st.points = C.replaceSpan(st.points, [{ t: i * GRID, v }, { t: (i + 1) * GRID, v }]);
    st.overridden = false;
  }
  function shape(kind) {
    const [a, b] = [Math.min(...st.sel), Math.max(...st.sel)];
    if (b - a < GRID) return;
    st.points = C.replaceSpan(st.points, C.shapePoints(kind, a, b, 0.15, 0.85));
    st.overridden = false;
    paint();
  }
  function simplify() {
    const norm = st.points.map(p => ({ t: p.t / BARS, v: p.v }));
    st.points = C.simplify(norm, 0.012).map(p => ({ t: p.t * BARS, v: p.v }));
    paint();
  }

  /* ---------- звук ---------- */
  function sound(on) {
    if (!on || !st.sound) { if (audio) { const a = audio; audio = null; a.g.gain.setTargetAtTime(0, a.ctx.currentTime, 0.05); setTimeout(() => a.ctx.close().catch(() => {}), 300); } return; }
    if (audio) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.Q.value = 7; g.gain.value = 0;
      const oscs = [55, 110.4, 82.6].map(fr => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); return o; });
      f.connect(g).connect(ctx.destination);
      g.gain.setTargetAtTime(LEVEL, ctx.currentTime, 0.1);
      audio = { ctx, f, g, oscs };
    } catch (err) { console.warn('Звук недоступен:', err); audio = null; }
  }

  /* ---------- события ---------- */
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const k = b.dataset.act;
    if (k === 'play') play(!st.playing);
    else if (k === 'rec') { st.rec = !st.rec; if (st.rec && !st.playing) play(true); commitTake(); paint(); }
    else if (k === 'arm') { st.arm = !st.arm; paint(); }
    else if (k === 'reenable') { st.overridden = false; paint(); }
    else if (k === 'draw') { st.draw = !st.draw; paint(); }
    else if (k === 'simplify') simplify();
    else if (k === 'clear') { st.points = []; st.overridden = false; commitTake(); paint(); }
    else if (k === 'sound') { st.sound = b.checked; sound(st.sound && st.playing); }
  });
  knob.addEventListener('pointerdown', e => {
    e.preventDefault();
    knob.setPointerCapture(e.pointerId);
    const y0 = e.clientY, v0 = knobValue();
    turn(v0);
    const move = ev => turn(v0 + (y0 - ev.clientY) / KNOB_DRAG_PX);
    const up = () => { knob.removeEventListener('pointermove', move); knob.removeEventListener('pointerup', up); knob.removeEventListener('pointercancel', up); release(); };
    knob.addEventListener('pointermove', move); knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up);
  });
  knob.addEventListener('keydown', e => {
    const d = { ArrowUp: 0.03, ArrowRight: 0.03, ArrowDown: -0.03, ArrowLeft: -0.03 }[e.key];
    if (d === undefined) return;
    e.preventDefault(); turn(knobValue() + d); release();
  });
  lane.addEventListener('pointerdown', e => {
    if (mode !== 'edit') return;
    e.preventDefault();
    lane.setPointerCapture(e.pointerId);
    if (st.draw) drawAt(e); else st.sel = [snap(laneT(e)), snap(laneT(e))];
    paint();
    const move = ev => { if (st.draw) drawAt(ev); else st.sel = [st.sel[0], snap(laneT(ev))]; paint(); };
    const up = () => { lane.removeEventListener('pointermove', move); lane.removeEventListener('pointerup', up); lane.removeEventListener('pointercancel', up); };
    lane.addEventListener('pointermove', move); lane.addEventListener('pointerup', up); lane.addEventListener('pointercancel', up);
  });
  paint();

  const api = {
    shape, state: () => ({ ...st, points: st.points.map(p => ({ ...p })) }),
    destroy() { alive = false; if (raf) cancelAnimationFrame(raf); raf = 0; st.playing = false; sound(false); },
    /* для автопроверки в Chrome без окна */
    test: { arm: b => { st.arm = b; paint(); }, rec: b => { st.rec = b; commitTake(); paint(); }, play, turn, release, reenable: () => { st.overridden = false; paint(); } },
  };
  window.AutoLane.last = api;
  return api;
}

window.AutoLane = { mount, last: null };
})();
