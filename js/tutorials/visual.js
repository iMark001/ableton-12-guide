/* Схемы для уроков «Туториалов»: цепочка устройств с ручками (значения — из data/devices под партию и стиль,
   как на страницах устройств), дорожки автоматизации, пиано-ролл, кривая сайдчейна, рецепт Serum 2 из «По партиям».
   API: window.TutVisual.block(b, ctx) → Promise<html>, ctx = { style, bpm }. */
(function () {
'use strict';
const W = window.Widgets, DV = window.DeviceView;
const e = W.esc;
const NAME = Object.fromEntries(CATALOG.map(d => [d.id, d.name]));
const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = m => NOTE[m % 12] + (Math.floor(m / 12) - 2); // как в Ableton: 60 = C3

/* ---------- цепочка устройств ---------- */
function rowsFor(dev, node, ctx) {
  const base = node.part && dev.presets && dev.presets[node.part] ? DV.merge(dev, node.part, ctx.style) : [];
  const map = new Map(base.map(r => [r.ctl.id, r]));
  (node.set || []).forEach(s => {
    const ctl = dev.controls.find(c => c.id === s.c);
    if (!ctl) return;
    const v = s.tempo ? Math.round(s.tempo * 60000 / ctx.bpm) : s.v;
    map.set(s.c, { ctl, s: { ...s, v, styled: !!s.tempo } });
  });
  const order = node.show || [...map.keys()];
  return order.map(id => map.get(id)).filter(Boolean).slice(0, node.show ? 5 : 4);
}
const valText = (ctl, s) => (s.t ? s.t : ctl.kind === 'toggle' ? (s.v ? 'On' : 'Off') : ctl.kind === 'switch' ? String(s.v) : W.fmt(ctl, s.v));
function tile(node, dev, ctx) {
  const rows = dev ? rowsFor(dev, node, ctx) : [];
  const knobs = rows.map(({ ctl, s }) => ctl.kind === 'knob'
    ? `<div class="lk${s.styled ? ' st' : ''}">${W.knob(s.t && s.v == null ? 0.5 : W.toK(ctl, s.v))}<b>${e(valText(ctl, s))}</b><span>${e(ctl.name)}</span></div>`
    : `<div class="lk sw1"><b>${e(valText(ctl, s))}</b><span>${e(ctl.name)}</span></div>`).join('');
  return `<a class="lpanel ctile" href="${e(window.TutLinks.device(node.dev))}" title="Все ручки ${e(NAME[node.dev] || node.dev)}">
    <div class="lp-title"><span class="led"></span>${e(NAME[node.dev] || node.dev)}</div>
    ${knobs ? `<div class="lp-knobs">${knobs}</div>` : ''}${node.note ? `<div class="cnote">${e(node.note)}</div>` : ''}${!knobs && !node.note && dev && dev.styles && dev.styles[ctx.style] ? `<div class="cnote st">${e(STYLES[ctx.style].name)}: ${e(dev.styles[ctx.style].note)}</div>` : ''}</a>`;
}
async function chain(b, ctx) {
  const devs = await Promise.all(b.nodes.map(n => DV.load(n.dev).catch(() => null)));
  return `<div class="vchain">${b.nodes.map((n, i) => tile(n, devs[i], ctx)).join('<span class="carr" aria-hidden="true">→</span>')}</div>`;
}

/* ---------- дорожки автоматизации (линии — SVG, подписи — HTML, чтобы текст не растягивался) ---------- */
function lanes(b) {
  const Wd = 640, H = 46, gap = 8, top = 18;
  const bars = b.bars || 8, n = b.lanes.length, total = top + n * (H + gap);
  const pct = y => `${(y / total) * 100}%`;
  const grid = Array.from({ length: bars + 1 }, (_, i) => `<line x1="${(i / bars) * Wd}" y1="0" x2="${(i / bars) * Wd}" y2="${total}" class="${i % 4 === 0 ? 'g4' : ''}"/>`).join('');
  const rows = b.lanes.map((l, i) => {
    const y0 = top + i * (H + gap);
    const d = l.pts.map(([x, y], j) => {
      const px = (x * Wd).toFixed(1), py = (y0 + H - y * H).toFixed(1);
      return l.steps && j ? `H${px}V${py}` : `${j ? 'L' : 'M'}${px} ${py}`;
    }).join(' ');
    return `<rect x="0" y="${y0}" width="${Wd}" height="${H}" class="lbg"/><path d="${d}" class="lline" style="--c:${e(l.color || '#ff5a5a')}"/>`;
  }).join('');
  const marks = (b.marks || []).map(m => `<line x1="${m.x * Wd}" y1="${top}" x2="${m.x * Wd}" y2="${total}" class="mkl"/>`).join('');
  const labels = b.lanes.map((l, i) => `<span class="llab" style="top:${pct(top + i * (H + gap) + 3)}">${e(l.label)}</span>`).join('');
  const nums = Array.from({ length: bars }, (_, i) => (bars <= 8 || i % 4 === 0 ? `<span class="lbar" style="left:${(i / bars) * 100}%">${i + 1}</span>` : '')).join('');
  const mtext = (b.marks || []).map((m, i) => `<span class="lmark" style="left:${m.x * 100}%;${i % 2 ? 'bottom:2px' : 'top:2px'}">${e(m.label)}</span>`).join('');
  return `<div class="vlanes" style="aspect-ratio:${Wd} / ${total}"><svg viewBox="0 0 ${Wd} ${total}" preserveAspectRatio="none" role="img" aria-label="${e(b.title || 'Автоматизация')}"><g class="grid">${grid}</g>${rows}${marks}</svg>${nums}${mtext}${labels}</div>`;
}

/* ---------- пиано-ролл ---------- */
function roll(b) {
  const bars = b.bars || 4, Wd = 640, rowH = 11;
  const ms = b.notes.map(n => n[0]);
  const lo = Math.min(...ms) - 1, hi = Math.max(...ms) + 1;
  const n = hi - lo + 1, H = n * rowH;
  const keys = Array.from({ length: n }, (_, i) => {
    const m = hi - i, black = [1, 3, 6, 8, 10].includes(m % 12);
    return `<rect x="0" y="${i * rowH}" width="${Wd}" height="${rowH}" class="${black ? 'rk b' : 'rk'}"/>`;
  }).join('');
  const grid = Array.from({ length: bars * 4 + 1 }, (_, i) => `<line x1="${(i / (bars * 4)) * Wd}" y1="0" x2="${(i / (bars * 4)) * Wd}" y2="${H}" class="${i % 4 === 0 ? 'g4' : ''}"/>`).join('');
  const notes = b.notes.map(([m, st, len, cls]) => `<rect x="${(st / (bars * 16)) * Wd + 1}" y="${(hi - m) * rowH + 1}" width="${Math.max(4, (len / (bars * 16)) * Wd - 2)}" height="${rowH - 2}" rx="2" class="nt ${cls || ''}"/>`).join('');
  const labels = [...new Set(ms)].map(m => `<span style="top:${((hi - m) / n) * 100}%">${noteName(m)}</span>`).join('');
  return `<div class="vroll"><div class="rlab">${labels}</div><svg viewBox="0 0 ${Wd} ${H}" preserveAspectRatio="none" role="img" aria-label="Ноты">${keys}<g class="grid">${grid}</g>${notes}</svg></div>`;
}

/* ---------- кривая сайдчейна: громкость пэда под 4 киками ---------- */
function duck(b, ctx) {
  const Wd = 640, H = 70, beat = Wd / 4;
  const relMs = b.release ? b.release : Math.round(60000 / ctx.bpm / 2);
  const relW = Math.min(beat * 0.95, (relMs / (60000 / ctx.bpm)) * beat);
  const depth = b.depth || 0.8;
  const loud = 6, low = loud + depth * (H - 12);
  let d = `M0 ${loud}`;
  for (let i = 0; i < 4; i++) {
    const x = i * beat;
    d += ` L${x} ${loud} L${x + 2} ${low} Q${(x + relW * 0.55).toFixed(1)} ${low} ${(x + relW).toFixed(1)} ${loud} L${x + beat} ${loud}`;
  }
  const kicks = Array.from({ length: 4 }, (_, i) => `<circle cx="${i * beat + 6}" cy="${H + 12}" r="5" class="kk"/>`).join('');
  return `<div class="vduck"><svg viewBox="0 0 ${Wd} ${H + 22}" preserveAspectRatio="none" role="img" aria-label="Громкость под киком">
    <path d="${d}" class="dline"/>${kicks}</svg>
    <div class="dlab"><span>громкость пэда</span><span>● удары кика · Release ≈ ${e(relMs)} ms при ${e(ctx.bpm)} BPM</span></div></div>`;
}

/* ---------- Serum 2: рецепт из «По партиям» под стиль ---------- */
function serum(b, ctx) {
  const g = (typeof PART_GUIDE !== 'undefined' ? PART_GUIDE : {})[b.part];
  const all = (g && g.make ? g.make : []).filter(m => m.kind === 'serum');
  const r = all.find(m => !m.styles || m.styles.includes(ctx.style)) || all[0];
  if (!r) return '<p class="muted">Рецепта Serum 2 для этой партии пока нет.</p>';
  return `<div class="vserum"><div class="sh"><b>${e(r.tool)}</b> · ${e(r.title)}</div>
    <div class="srows">${r.params.map(([k, v]) => `<div class="sr"><span>${e(k)}</span><b>${e(v)}</b></div>`).join('')}</div>
    <p class="swhy">${e(r.why)}</p></div>`;
}

/* ---------- прогрессия жанра: аккорды и бас (MusicCore — как на странице MIDI) ---------- */
function progData(ctx) {
  const P = TUT_STYLE[ctx.style].prog, M = window.MusicCore;
  const root = P.fam === 'major' ? 0 : 9;
  const ch = M.diatonicChords(root, P.fam, P.seventh ? 4 : 3);
  const chords = P.deg.map(d => {
    const pcs = ch[d].pcs;
    let base = 55 + ((pcs[0] - 55 % 12 + 12) % 12);
    if (base > 64) base -= 12;
    const out = [base];
    pcs.slice(1).forEach(pc => { let m = out[out.length - 1] + 1; while (m % 12 !== pc) m++; out.push(m); });
    return out;
  });
  return { chords, bass: chords.map(c => 36 + ((c[0] - 36) % 12 + 12) % 12), names: P.deg.map(d => ch[d].name), key: P.fam === 'major' ? 'C Major' : 'A Minor', name: P.name };
}
function prog(b, ctx) {
  const d = progData(ctx);
  const notes = d.chords.flatMap((c, i) => c.map(m => [m, i * 16, 16, 'ch'])).concat(d.bass.map((m, i) => [m, i * 16, 16, 'bs']));
  return `<div class="vprog"><div class="pnames">${d.names.map(n => `<span>${e(n)}</span>`).join('')}</div>${roll({ bars: 4, notes })}
    <p class="muted small">«${e(d.name)}» — прогрессия для ${e(STYLES[ctx.style].name)} в ${e(d.key)}. Другие — на странице MIDI → Аккорды.</p></div>`;
}

/* ---------- скриншот с обведёнными ручками (x, y, w, h — в процентах картинки) ---------- */
function shot(b) {
  const marks = b.marks || [];
  return `<figure class="vshot"><a class="shw" href="${e(b.src)}" target="_blank" rel="noopener" style="aspect-ratio:${e(b.w)} / ${e(b.h)}" title="Открыть крупно">
      <img src="${e(b.src)}" alt="${e(b.alt || 'Скриншот Serum 2')}" loading="lazy" width="${e(b.w)}" height="${e(b.h)}">
      ${marks.map((m, i) => `<i class="smk" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%"><b>${i + 1}</b></i>`).join('')}</a>
    ${marks.length ? `<ol class="slegend">${marks.map((m, i) => `<li><b>${i + 1}</b>${e(window.TutText(m.label))}</li>`).join('')}</ol>` : ''}
    ${b.note ? `<figcaption>${e(b.note)}</figcaption>` : ''}</figure>`;
}

/* ---------- карта трека: какие партии играют в каких частях ---------- */
function blocks(b) {
  const bars = b.bars;
  const pct = x => `${(x / bars) * 100}%`;
  const secs = (b.sections || []).map(([name, start, len]) => `<span class="bsec" style="left:${pct(start)};width:${pct(len)}">${e(name)}</span>`).join('');
  const rows = b.rows.map(r => `<div class="brow"><span class="blab">${e(r.label)}</span><div class="btrack">${r.on.map(([st, len]) => `<i style="left:${pct(st)};width:${pct(len)};--c:${e(r.color || '#ffc93c')}"></i>`).join('')}</div></div>`).join('');
  return `<div class="vblocks"><div class="brow bhead"><span class="blab"></span><div class="btrack">${secs}</div></div>${rows}${b.note ? `<p class="muted small">${e(b.note)}</p>` : ''}</div>`;
}

/* ---------- приёмы автоматизации жанра (data/automation.js) ---------- */
function recipes(b, ctx) {
  const list = (typeof AUTO_RECIPES !== 'undefined' && AUTO_RECIPES[ctx.style]) || [];
  return `<div class="vrcp">${list.map(r => `<div class="rcp1"><b>${e(r.h)}</b><p>${e(r.t)}</p>${(r.devs || []).length ? `<div class="chips">${r.devs.map(id => `<a class="chip sm" href="${e(window.TutLinks.device(id))}">${e(NAME[id] || id)}</a>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
}

/* ---------- Serum 2: свои строки (уроки из видео) ---------- */
const serumRows = b => `<div class="vserum"><div class="sh"><b>Serum 2</b>${b.sub ? ` · ${e(b.sub)}` : ''}</div>
  <div class="srows">${b.rows.map(([k, v]) => `<div class="sr"><span>${e(k)}</span><b>${e(window.TutText(v))}</b></div>`).join('')}</div></div>`;

async function block(b, ctx) {
  const title = b.title ? `<div class="vtitle">${e(b.title)}</div>` : '';
  const R = { lanes, roll, duck, serum, prog, recipes, blocks, shot, serumrows: serumRows };
  const body = b.type === 'chain' ? await chain(b, ctx) : R[b.type] ? R[b.type](b, ctx) : '';
  return `<div class="vblock v-${e(b.type)}">${title}${body}</div>`;
}

window.TutVisual = { block, noteName, progData };
})();
