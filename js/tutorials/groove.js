/* Плеер звуковых примеров для «Туториалов»: 1 такт, 16 шагов, варианты A и B («до/после»).
   Звуки синтезируются WebAudio (без файлов). Звучит только после клика пользователя (так требуют браузеры).
   API: window.TutGroove.mount(el, demo, { bpm, swing }) → { destroy() }. Формат demo — data/tutorials.js.
   demo.bars > 1 — несколько тактов (сетку не рисуем, рядом схема нот); bpm: 'style' и swing: 'style' — из выбранного стиля. */
(function () {
'use strict';
const T = window.Tabs;
const e = T.esc;
const LOOKAHEAD = 0.12;   // c — на сколько вперёд планируем ноты
const TICK = 25;          // мс — как часто проверяем очередь
const NAMES = { kick: 'Кик', hat: 'Хэт', ohat: 'Откр. хэт', shaker: 'Шейкер', clap: 'Клэп', snare: 'Снейр', tom: 'Том', rim: 'Рим', bass: 'Бас', pad: 'Пэд' };

let ctx = null, master = null, noise = null;
let active = null; // один играющий плеер на страницу

function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
const velGain = v => Math.pow(v / 127, 1.6);

/* ---------- голоса ---------- */
function env(t, peak, attack, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}
function noiseHit(out, t, peak, { type = 'highpass', freq = 7000, q = 0.7, attack = 0.001, decay = 0.05 }) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = env(t, peak, attack, decay);
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t); src.stop(t + attack + decay + 0.05);
}
function tone(out, t, peak, { type = 'sine', from, to, glide = 0.1, attack = 0.002, decay = 0.3 }) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + glide);
  const g = env(t, peak, attack, decay);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + attack + decay + 0.05);
}
function synth(out, t, peak, notes, dur, { type = 'sawtooth', cut = 900, attack = 0.01 }) {
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + Math.max(attack, dur - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  f.connect(g); g.connect(out);
  notes.forEach((n, i) => [-6, 6].forEach(cents => {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = hz(n); o.detune.value = cents + i;
    o.connect(f); o.start(t); o.stop(t + dur + 0.12);
  }));
}
const VOICES = {
  kick: (o, t, p) => tone(o, t, p, { from: 150, to: 45, glide: 0.11, decay: 0.34 }),
  hat: (o, t, p) => noiseHit(o, t, p * 0.5, { freq: 7500, decay: 0.045 }),
  ohat: (o, t, p) => noiseHit(o, t, p * 0.45, { freq: 6500, decay: 0.22 }),
  shaker: (o, t, p) => noiseHit(o, t, p * 0.45, { type: 'bandpass', freq: 5500, q: 1.2, attack: 0.02, decay: 0.07 }),
  clap: (o, t, p) => { [0, 0.011, 0.022].forEach(dt => noiseHit(o, t + dt, p * 0.55, { type: 'bandpass', freq: 1400, q: 1.1, decay: 0.03 })); noiseHit(o, t + 0.03, p * 0.45, { type: 'bandpass', freq: 1400, q: 1.1, decay: 0.16 }); },
  snare: (o, t, p) => { noiseHit(o, t, p * 0.5, { freq: 1600, decay: 0.12 }); tone(o, t, p * 0.4, { type: 'triangle', from: 190, to: 160, decay: 0.08 }); },
  tom: (o, t, p, tr) => tone(o, t, p * 0.9, { from: hz(tr.note || 50) * 1.5, to: hz(tr.note || 50), glide: 0.12, decay: 0.28 }),
  rim: (o, t, p) => tone(o, t, p * 0.35, { type: 'square', from: 820, decay: 0.03 }),
  bass: (o, t, p, tr, step, len, n) => synth(o, t, p * 0.55, [n || tr.note || 33], step * (tr.hold ? len : 1.6), { type: 'square', cut: 420 }),
  pad: (o, t, p, tr, step, len, n) => { const r = tr.note || 57; synth(o, t, p * 0.22, n || [r, r + 3, r + 7, r + 10], step * len, { cut: 1500, attack: 0.08 }); },
};

/* ---------- плеер ---------- */
function rowHtml(tr) {
  const cells = tr.steps.map((v, i) => `<i class="gc${i % 4 === 0 ? ' beat' : ''}${v ? ' hit' : ''}" data-i="${i}"><b style="height:${Math.round((v / 127) * 100)}%"></b></i>`).join('');
  return `<div class="grow"><span class="gname">${e(NAMES[tr.sound] || tr.sound)}${tr.swing ? ' <em>свинг</em>' : ''}${tr.duck ? ' <em>сайдчейн</em>' : ''}</span><div class="gcells">${cells}</div></div>`;
}

function mount(el, demo, opts = {}) {
  let side = 'a', playing = false, timer = 0, raf = 0, nextT = 0, step = 0;
  const queue = [];
  const STEPS = 16 * (demo.bars || 1);
  const bpm = demo.bpm === 'style' ? opts.bpm || 120 : demo.bpm;
  const swingOf = tr => (tr.swing === 'style' ? opts.swing || 0 : tr.swing || 0);
  /* кик в 1-тактовом примере — рисунок выбранного стиля */
  const styleKick = STEPS === 16 && !demo.keepKick && opts.kick;
  const V = sd => (styleKick ? { ...demo[sd], tracks: demo[sd].tracks.map(tr => (tr.sound === 'kick' ? { ...tr, steps: tr.steps.map((_, i) => (opts.kick.includes(i) ? 120 : 0)) } : tr)) } : demo[sd]);
  const stepDur = () => 60 / bpm / 4;
  el.innerHTML = `<div class="gplayer">
    <div class="gtop">
      <button class="btn pri gplay" type="button" aria-pressed="false">▶ Слушать</button>
      <div class="chips gab" role="group" aria-label="Вариант">
        <button class="chip on" type="button" data-side="a">A · ${e(demo.a.label)}</button>
        <button class="chip" type="button" data-side="b">B · ${e(demo.b.label)}</button>
      </div>
      <span class="muted gbpm">${e(bpm)} BPM · ${demo.bars > 1 ? `${e(demo.bars)} такта` : '1 такт'}</span>
    </div>
    <div class="ggrid"></div>
  </div>`;
  const grid = T.$('.ggrid', el), playBtn = T.$('.gplay', el);
  const draw = () => { grid.innerHTML = demo.bars > 1 ? '' : V(side).tracks.map(rowHtml).join(''); };

  function schedule(i, t) {
    const tracks = V(side).tracks;
    const kick = tracks.find(tr => tr.sound === 'kick');
    tracks.forEach(tr => {
      const v = tr.steps[i];
      if (!v) return;
      const at = t + (i % 2 ? swingOf(tr) * stepDur() : 0);
      const out = ctx.createGain();
      let node = out;
      if (tr.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = tr.pan; out.connect(p); node = p; }
      node.connect(master);
      if (tr.duck && kick) duckCurve(out.gain, kick.steps, i, at, tr.duck);
      let len = 1;
      while (i + len < STEPS && !tr.steps[i + len]) len++;
      const hit = tr.steps.slice(0, i).filter(Boolean).length;
      const n = tr.sound === 'pad' ? tr.chords && tr.chords[hit] : tr.notes && tr.notes[hit];
      VOICES[tr.sound](out, at, velGain(v), tr, stepDur(), len, n);
    });
    queue.push({ i, t });
  }
  /* сайдчейн: на каждом ударе кика громкость проседает и за восьмую возвращается */
  function duckCurve(gain, kicks, from, t0, depth) {
    gain.setValueAtTime(1, t0);
    for (let k = from; k < STEPS; k++) {
      if (!kicks[k]) continue;
      const kt = t0 + (k - from) * stepDur();
      gain.setValueAtTime(1, Math.max(t0, kt - 0.002));
      gain.linearRampToValueAtTime(1 - depth, kt + 0.006);
      gain.linearRampToValueAtTime(1, kt + stepDur() * 2);
    }
  }
  function tick() {
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.02; // вкладка спала или звук только включился — не играем пропущенное пачкой
    while (nextT < ctx.currentTime + LOOKAHEAD) {
      schedule(step, nextT);
      nextT += stepDur();
      step = (step + 1) % STEPS;
    }
  }
  function paint() {
    while (queue.length > 1 && queue[1].t <= ctx.currentTime) queue.shift();
    const cur = queue.length && queue[0].t <= ctx.currentTime ? queue[0].i : -1;
    T.$$('.gc', grid).forEach(c => c.classList.toggle('now', +c.dataset.i === cur));
    raf = requestAnimationFrame(paint);
  }
  function stop() {
    playing = false;
    clearInterval(timer); cancelAnimationFrame(raf);
    queue.length = 0;
    T.$$('.gc.now', grid).forEach(c => c.classList.remove('now'));
    playBtn.textContent = '▶ Слушать';
    playBtn.setAttribute('aria-pressed', 'false');
    if (active === api) active = null;
  }
  function start() {
    if (!audio()) { playBtn.textContent = 'Звук не поддерживается'; return; }
    if (active && active !== api) active.stop();
    active = api;
    playing = true; step = 0; nextT = ctx.currentTime + 0.06;
    timer = setInterval(tick, TICK); tick();
    raf = requestAnimationFrame(paint);
    playBtn.textContent = '■ Стоп';
    playBtn.setAttribute('aria-pressed', 'true');
  }
  playBtn.addEventListener('click', () => (playing ? stop() : start()));
  T.$('.gab', el).addEventListener('click', ev => {
    const b = ev.target.closest('[data-side]');
    if (!b) return;
    side = b.dataset.side;
    T.$$('.gab .chip', el).forEach(c => c.classList.toggle('on', c === b));
    draw();
    if (!playing) start();
  });
  draw();
  const api = { stop, destroy: stop };
  return api;
}

window.TutGroove = { mount, stopAll: () => { if (active) active.stop(); } };
})();
