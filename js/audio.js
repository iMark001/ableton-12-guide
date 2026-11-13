/* Мини-синтезатор на WebAudio: «электропиано» из трёх осцилляторов.
   Работает только после клика пользователя (так требуют браузеры). */
(function () {
'use strict';
let ctx = null, master = null;
const live = new Set();
const ATTACK = 0.008, RELEASE = 0.35;

function ensure() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.42;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
const freq = midi => 440 * Math.pow(2, (midi - 69) / 12);

function voice(midi, t0, dur, vel) {
  const f = freq(midi);
  const out = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(9000, 1400 + f * 3);
  lp.connect(out);
  out.connect(master);
  const peak = 0.18 * vel;
  out.gain.setValueAtTime(0, t0);
  out.gain.linearRampToValueAtTime(peak, t0 + ATTACK);
  out.gain.exponentialRampToValueAtTime(peak * 0.35, t0 + ATTACK + 0.55);
  out.gain.setValueAtTime(peak * 0.35, t0 + Math.max(dur, ATTACK + 0.56));
  const end = t0 + Math.max(dur, ATTACK + 0.56) + RELEASE;
  out.gain.exponentialRampToValueAtTime(0.0001, end);
  const parts = [['triangle', 1, 1], ['sine', 2, 0.22], ['sawtooth', 1.003, 0.05]].map(([type, mul, g]) => {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.value = f * mul; gn.gain.value = g;
    o.connect(gn); gn.connect(lp);
    o.start(t0); o.stop(end + 0.05);
    return o;
  });
  const v = { out, parts };
  live.add(v);
  parts[0].onended = () => { live.delete(v); out.disconnect(); };
}

/* events: [{ midi: number | number[], at: секунды от старта, dur: секунды, vel?: 0..1 }] */
function play(events) {
  if (!ensure()) return 0;
  const t = ctx.currentTime + 0.03;
  let last = 0;
  for (const e of events) {
    const notes = Array.isArray(e.midi) ? e.midi : [e.midi];
    notes.forEach(m => voice(m, t + e.at, e.dur, e.vel ?? 0.8));
    last = Math.max(last, e.at + e.dur);
  }
  return last;
}
const chord = (midis, dur = 1.4) => play([{ midi: midis, at: 0, dur }]);
const arp = (midis, step = 0.2, dur = 0.5) => play(midis.map((m, i) => ({ midi: m, at: i * step, dur })));

function stop() {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const v of live) {
    v.out.gain.cancelScheduledValues(now);
    v.out.gain.setTargetAtTime(0, now, 0.03);
    v.parts.forEach(o => { try { o.stop(now + 0.15); } catch (_) { /* уже остановлен */ } });
  }
  live.clear();
}

window.Synth = { play, chord, arp, stop, freq };
})();
