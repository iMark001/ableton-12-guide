/* Вкладка «Круг-часы»: 12 нот как циферблат, аккорд или гамма — фигура, которая поворачивается. */
(function () {
'use strict';
const M = window.MusicCore, MP = window.MidiPage, U = MP.ui;
const esc = U.esc;
const R = 150, RA = 193, NR = 25, DUR = 650;
const f12 = x => ((x % 12) + 12) % 12;
const near = d => { const v = f12(d); return v > 6 ? v - 12 : v; };
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pt = (h, r) => { const a = h * Math.PI / 6; return [r * Math.sin(a), -r * Math.cos(a)]; };
const fx = v => v.toFixed(2);

const CHORD_ORDER = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'maj7', 'm7', 'dom7', 'm7b5', 'm9', 'maj9'];
const TITLE = { maj: 'Мажор', min: 'Минор', dim: 'Уменьшённый', aug: 'Увеличенный', sus2: 'Sus2', sus4: 'Sus4', maj7: 'Maj7', m7: 'm7', dom7: '7', m7b5: 'm7♭5', m9: 'm9', maj9: 'Maj9' };
const MOOD = {
  maj: 'светлый, «радостный»', min: 'грустный, глубокий', dim: 'напряжённый, тревожный', aug: 'зависший, «сказочный»',
  sus2: 'открытый, воздушный', sus4: 'подвешенный, хочет разрешиться', maj7: 'мягкий, «дорогой» — deep house, ambient',
  m7: 'тёплый минор — house, garage, afro', dom7: 'напряжённый, тянет к следующему аккорду', m7b5: 'тёмный, джазовый',
  m9: 'сочный минор — deep, organic house', maj9: 'светлый и воздушный — ambient, downtempo',
};
const MINORISH = ['min', 'dim', 'm7', 'm7b5', 'm9'];
const SCALES_HERE = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'harmonicMinor', 'phrygianDominant', 'majorPent', 'minorPent', 'minorBlues'];

const st = { mode: 'chord', layout: 'chrom', root: 0, type: 'maj', inv: 0, deg: null };
let el = null, disp = null, anim = null, unsub = null;

/* ---------- данные текущей фигуры ---------- */
const keyNow = () => U.state.key;
const rootPc = () => (st.mode === 'chord' ? st.root : keyNow().root);
const figPcs = () => (st.mode === 'chord' ? M.chordPcs(st.root, st.type) : M.scalePcs(keyNow().root, keyNow().scale));
const hourOf = (pc, layout = st.layout) => (layout === 'chrom' ? f12(pc) : f12(pc * 7));
const nodeHours = layout => Array.from({ length: 12 }, (_, pc) => hourOf(pc, layout));
function sortedHours(pcs, nodeH, root) {
  const r = nodeH[root];
  return pcs.map(pc => nodeH[pc]).sort((a, b) => f12(a - r) - f12(b - r));
}
function chordNames(root, type) {
  const sp = M.spellScale(root, MINORISH.includes(type) ? 'minor' : 'major');
  const byPc = new Map(sp.pcs.map((p, i) => [p, sp.notes[i]]));
  return M.CHORDS[type].iv.map(iv => {
    const pc = f12(root + iv);
    return byPc.get(pc) || M.noteName(pc, [6, 10].includes(f12(iv)));
  });
}
function labelsMap() {
  const map = new Map();
  if (st.mode === 'scale') {
    const sp = M.spellScale(keyNow().root, keyNow().scale);
    sp.pcs.forEach((p, i) => map.set(p, sp.notes[i]));
  } else {
    const names = chordNames(st.root, st.type);
    M.chordPcs(st.root, st.type).forEach((p, i) => map.set(p, names[i]));
  }
  return map;
}

/* ---------- SVG ---------- */
function svgMarkup() {
  const pos = Array.from({ length: 12 }, (_, h) => pt(h, R));
  const web = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) web.push(`<line x1="${fx(pos[i][0])}" y1="${fx(pos[i][1])}" x2="${fx(pos[j][0])}" y2="${fx(pos[j][1])}"/>`);
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const [x1, y1] = pt(i / 5, 214), [x2, y2] = pt(i / 5, i % 5 ? 218 : 224);
    return `<line class="${i % 5 ? '' : 'hr'}" x1="${fx(x1)}" y1="${fx(y1)}" x2="${fx(x2)}" y2="${fx(y2)}"/>`;
  }).join('');
  const nodes = Array.from({ length: 12 }, (_, pc) => `<g class="nd" data-pc="${pc}" tabindex="0" role="button">
      <circle r="${NR}"/><text class="nl" y="1"></text><text class="nr" y="14"></text></g>`).join('');
  return `<svg class="clock" viewBox="-235 -235 470 470" role="img" aria-label="Хроматический круг">
    <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs>
    <circle class="ring" r="${R}"/><g class="ticks">${ticks}</g><g class="web">${web.join('')}</g>
    <path class="fig-glow" filter="url(#glow)"/><path class="fig"/><path class="fig2"/>
    <g class="arcs"></g><g class="nodes">${nodes}</g>
    <g class="center"><text class="cn" y="6"></text><text class="cs" y="28"></text></g></svg>`;
}

function draw(nodeH, figH, showArcs) {
  U.$$('.nd', el).forEach(g => {
    const [x, y] = pt(nodeH[+g.dataset.pc], R);
    g.setAttribute('transform', `translate(${fx(x)} ${fx(y)})`);
  });
  const d = figH.length ? 'M' + figH.map(h => pt(h, R).map(fx).join(' ')).join(' L') + ' Z' : '';
  U.$('.fig', el).setAttribute('d', d);
  U.$('.fig-glow', el).setAttribute('d', d);
  U.$('.arcs', el).innerHTML = showArcs ? arcsMarkup(figH) : '';
}
function arcsMarkup(figH) {
  const closed = st.mode === 'scale';
  const ascending = st.mode === 'scale' || M.CHORDS[st.type].iv.every(v => v < 12);
  if (st.layout !== 'chrom' || !ascending) return '';
  const out = [];
  const n = closed ? figH.length : figH.length - 1;
  for (let i = 0; i < n; i++) {
    const h1 = figH[i], h2 = i + 1 < figH.length ? figH[i + 1] : figH[0];
    const span = f12(h2 - h1) || 12;
    const [x1, y1] = pt(h1, RA), [x2, y2] = pt(h1 + span, RA), [lx, ly] = pt(h1 + span / 2, RA);
    out.push(`<path class="arc" d="M${fx(x1)} ${fx(y1)} A${RA} ${RA} 0 ${span > 6 ? 1 : 0} 1 ${fx(x2)} ${fx(y2)}"/>
      <circle class="adot" cx="${fx(x2)}" cy="${fx(y2)}" r="3.5"/>
      <g class="alab" transform="translate(${fx(lx)} ${fx(ly)})"><rect x="-17" y="-12" width="34" height="24" rx="12"/><text y="5">+${span}</text></g>`);
  }
  return out.join('');
}
function decorate() {
  const pcs = new Set(figPcs()), labels = labelsMap(), root = rootPc();
  const dc0 = st.mode === 'scale' && st.deg !== null ? MP.clock.degreeChord() : null;
  if (!dc0) st.deg = null;
  const chordSel = dc0 ? new Set(dc0.pcs) : null;
  U.$$('.nd', el).forEach(g => {
    const pc = +g.dataset.pc, name = labels.get(pc) || M.SHARP[pc];
    g.classList.toggle('on', pcs.has(pc));
    g.classList.toggle('root', pc === root);
    g.classList.toggle('ch', !!chordSel && chordSel.has(pc));
    g.querySelector('.nl').textContent = M.pretty(name);
    g.querySelector('.nr').textContent = M.ruName(name);
    g.setAttribute('aria-label', `${M.pretty(name)} — ${M.ruName(name)}`);
  });
  const t = centerText();
  U.$('.cn', el).textContent = t[0];
  U.$('.cs', el).textContent = t[1];
  const f2 = U.$('.fig2', el);
  if (chordSel) {
    const dc = MP.clock.degreeChord();
    const hs = sortedHours(dc.pcs, disp.nodeH, dc.rootPc);
    f2.setAttribute('d', 'M' + hs.map(h => pt(h, R).map(fx).join(' ')).join(' L') + ' Z');
    f2.classList.remove('in'); void f2.getBBox(); f2.classList.add('in');
  } else f2.setAttribute('d', '');
}
function centerText() {
  if (st.mode === 'chord') {
    const nm = chordNames(st.root, st.type)[0];
    return [M.pretty(nm + M.CHORDS[st.type].suffix), `${M.ruName(nm)} ${TITLE[st.type].toLowerCase()}`];
  }
  const k = U.keyTitle(keyNow().root, keyNow().scale);
  return [M.pretty(k.sp.root), M.SCALES[keyNow().scale].name];
}

/* ---------- анимация ---------- */
function finish() { if (anim) { cancelAnimationFrame(anim.raf); anim.done(); anim = null; } }
function run(step, done) {
  finish();
  const t0 = performance.now();
  anim = { raf: 0, done };
  const frame = now => {
    const k = Math.min(1, (now - t0) / DUR);
    step(ease(k));
    if (k < 1) anim.raf = requestAnimationFrame(frame);
    else { const d = anim.done; anim = null; d(); }
  };
  anim.raf = requestAnimationFrame(frame);
}
function morphFigure() {
  finish();
  decorate();
  const from = disp.fig.slice();
  const to = sortedHours(figPcs(), disp.nodeH, rootPc());
  const n = Math.max(from.length, to.length);
  const a = Array.from({ length: n }, (_, i) => from[Math.min(i, from.length - 1)] ?? to[i]);
  const b = Array.from({ length: n }, (_, i) => to[Math.min(i, to.length - 1)]);
  const delta = a.map((h, i) => near(b[i] - h));
  const end = () => { disp.fig = to; draw(disp.nodeH, to, true); };
  if (!from.length) return end();
  run(k => draw(disp.nodeH, a.map((h, i) => h + delta[i] * k), false), end);
}
function morphLayout() {
  finish();
  const fromH = disp.nodeH.slice(), toH = nodeHours(st.layout);
  const delta = fromH.map((h, i) => near(toH[i] - h));
  const pcs = figPcs(), root = rootPc();
  run(k => {
    const nh = fromH.map((h, i) => h + delta[i] * k);
    draw(nh, sortedHours(pcs, nh, root), false);
  }, () => {
    disp.nodeH = toH;
    disp.fig = sortedHours(pcs, toH, root);
    draw(toH, disp.fig, true);
    decorate();
  });
}

/* ---------- звук и ноты ---------- */
function currentMidis() {
  if (st.mode === 'chord') return U.invert(U.voice(M.chordPcs(st.root, st.type)), st.inv);
  if (st.deg !== null) return U.voice(MP.clock.degreeChord().pcs);
  const pcs = M.scalePcs(keyNow().root, keyNow().scale);
  const v = U.voice(pcs);
  return [...v, v[0] + 12];
}
function playNow(arp) {
  U.sound(S => {
    S.stop();
    const m = currentMidis();
    if (arp || (st.mode === 'scale' && st.deg === null)) S.arp(m, st.mode === 'scale' && st.deg === null ? 0.22 : 0.2);
    else S.chord(m);
  });
}

/* ---------- панель справа ---------- */
function controls() {
  const chips = CHORD_ORDER.map(id => `<button class="chip ctype ${id === st.type ? 'on' : ''}" data-type="${id}"><b>${esc(TITLE[id])}</b><small>${M.CHORDS[id].steps.join('+')}</small></button>`).join('');
  const scales = SCALES_HERE.map(id => `<button class="chip sm ${id === keyNow().scale ? 'on' : ''}" data-scale="${id}" title="${esc(M.SCALES[id].mood)}">${esc(M.SCALES[id].name)}</button>`).join('');
  return `
    <div class="seg" id="ckMode"><button data-mode="chord" class="${st.mode === 'chord' ? 'on' : ''}">Аккорд</button><button data-mode="scale" class="${st.mode === 'scale' ? 'on' : ''}">Гамма</button></div>
    <div class="ck-types chips ${st.mode === 'chord' ? '' : 'hide'}" id="ckTypes">${chips}</div>
    <div class="chips ${st.mode === 'scale' ? '' : 'hide'}" id="ckScales">${scales}</div>
    <div class="seg sm" id="ckLayout"><button data-l="chrom" class="${st.layout === 'chrom' ? 'on' : ''}">Хроматический круг</button><button data-l="fifth" class="${st.layout === 'fifth' ? 'on' : ''}">Квинтовый круг</button></div>
    <div class="ck-btns">
      <button class="btn" id="ckPrev" title="Повернуть фигуру на час назад">↺ −1 час</button>
      <button class="btn" id="ckNext" title="Повернуть фигуру на час вперёд">+1 час ↻</button>
      <button class="btn pri ${st.mode === 'chord' && ['maj', 'min'].includes(st.type) ? '' : 'hide'}" id="ckFlip"></button>
    </div>
    <div class="ck-btns">
      <button class="btn" id="ckPlay">▶ Вместе</button><button class="btn" id="ckArp">▶ По очереди</button>
      <button class="btn ${st.mode === 'chord' ? '' : 'hide'}" id="ckInv"></button>
      <label class="tgl"><input type="checkbox" id="ckSound" ${U.state.sound ? 'checked' : ''}> звук при клике</label>
    </div>
    <div id="ckInfo" class="ck-info"></div>`;
}

function infoMarkup() {
  if (st.mode === 'chord') {
    const names = chordNames(st.root, st.type), c = M.CHORDS[st.type];
    const flow = names.map((n, i) => (i ? `<span class="hop">+${c.steps[i - 1]} ч</span>` : '') + U.noteChip(n, i ? '' : 'rt')).join('');
    const v = U.invert(U.voice(M.chordPcs(st.root, st.type)), st.inv);
    const byPc = new Map(M.chordPcs(st.root, st.type).map((p, i) => [p, names[i]]));
    const how = v.map(m => M.pretty(byPc.get(M.mod12(m)) || M.SHARP[M.mod12(m)]) + M.octaveOf(m)).join(' → ');
    const tip = st.type === 'maj' ? 'Сдвинь среднюю ноту на 1 час назад — получится минор.'
      : st.type === 'min' ? 'Сдвинь среднюю ноту на 1 час вперёд — получится мажор.'
        : st.type === 'dim' ? 'Это минор, у которого верхняя нота на 1 час ниже.'
          : st.type === 'aug' ? 'Это мажор, у которого верхняя нота на 1 час выше.' : 'Все аккорды этого типа — одна и та же фигура, просто повёрнутая.';
    return `<h3>${U.chordLabel(M.pretty(names[0]) + c.suffix)} <small>${esc(M.ruName(names[0]))} ${esc(TITLE[st.type].toLowerCase())} · ${esc(MOOD[st.type])}</small></h3>
      <div class="flow-n">${flow}</div>
      <p><b>Формула:</b> от корня ${c.steps.map(s => `+${s}`).join(', затем ')} часа (клетки пиано-ролла). ${esc(tip)}</p>
      <p><b>В Ableton:</b> нажми <b>${esc(how.split(' → ')[0])}</b> и отсчитывай клетки вверх: ${esc(how)}.${st.inv ? ' Это обращение — те же ноты, другой порядок по высоте. Фигура на круге не меняется.' : ''}</p>`;
  }
  const k = keyNow(), t = U.keyTitle(k.root, k.scale), sc = M.SCALES[k.scale];
  const steps = sc.iv.map((v, i) => (i + 1 < sc.iv.length ? sc.iv[i + 1] : 12) - v);
  const degs = M.diatonicChords(k.root, k.scale, 3);
  const dchips = degs.length ? `<div class="chips deg">${degs.map(d => `<button class="chip sm ${st.deg === d.degree ? 'on' : ''}" data-deg="${d.degree}"><b>${esc(d.roman)}</b> ${U.chordLabel(d.name)}</button>`).join('')}</div>
      <p class="muted">Нажми ступень — внутри гаммы загорится её аккорд-треугольник.</p>` : '';
  return `<h3>${esc(t.long)} <small>${esc(t.ru)} · ${esc(sc.mood)}</small></h3>
    <div class="flow-n">${t.sp.notes.map((n, i) => U.noteChip(n, i ? '' : 'rt')).join('')}</div>
    <p><b>Шаги по кругу:</b> ${steps.join(' – ')} часа. Эта форма одинакова для любой ноты: поверни фигуру — получишь ту же гамму от другой ноты.</p>
    ${dchips}
    <p><b>В Ableton:</b> в клипе включи <b>Scale</b>, выбери Root Note = <b>${esc(M.pretty(t.sp.root))}</b> и Scale = <b>${esc(sc.name)}</b>, затем нажми <kbd>K</kbd> — строки гаммы подсветятся.</p>`;
}
function belowMarkup() {
  const m = currentMidis(), names = labelsMap();
  const marks = {};
  m.forEach((n, i) => { marks[n] = `${i === 0 ? 'on rt' : 'on'}|${M.pretty(names.get(M.mod12(n)) || M.SHARP[M.mod12(n)])}`; });
  const isRun = st.mode === 'scale' && st.deg === null;
  const notes = isRun ? m.map((p, i) => ({ pitch: p, start: i * 2, dur: 2, cls: i === 0 || i === m.length - 1 ? 'rt' : '' }))
    : m.map((p, i) => ({ pitch: p, start: 0, dur: 16, cls: i === 0 ? 'rt' : '' }));
  const k = keyNow();
  return `<div class="pianobox">${U.piano({ from: 48, to: 83, marks })}</div>
    ${U.pianoRoll({ notes, steps: 16, scale: st.mode === 'scale' ? M.scalePcs(k.root, k.scale) : null, rootPc: rootPc(), stepW: 30, title: 'Как это выглядит в пиано-ролле' })}`;
}
function refreshSide() {
  U.$('#ckSide', el).innerHTML = controls();
  U.$('#ckInfo', el).innerHTML = infoMarkup();
  U.$('#ckBelow', el).innerHTML = belowMarkup();
  const flip = U.$('#ckFlip', el);
  if (flip) flip.textContent = st.type === 'maj' ? 'Средняя нота −1 час → минор' : 'Средняя нота +1 час → мажор';
  const inv = U.$('#ckInv', el);
  if (inv) inv.textContent = `Обращение: ${st.inv === 0 ? 'основной вид' : st.inv}`;
}

/* ---------- события ---------- */
function setRoot(pc) {
  if (st.mode === 'chord') { st.root = f12(pc); st.inv = 0; morphFigure(); refreshSide(); playNow(false); }
  else U.setKey(pc, keyNow().scale);
}
function onClick(e) {
  const t = e.target;
  const nd = t.closest('.nd');
  if (nd) return setRoot(+nd.dataset.pc);
  const b = t.closest('button, input');
  if (!b) return;
  if (b.dataset.mode && b.dataset.mode !== st.mode) {
    st.mode = b.dataset.mode; st.deg = null;
    if (st.mode === 'chord') st.root = keyNow().root;
    morphFigure(); refreshSide(); return;
  }
  if (b.dataset.type) { st.type = b.dataset.type; st.inv = 0; morphFigure(); refreshSide(); playNow(false); return; }
  if (b.dataset.scale) { st.deg = null; U.setKey(keyNow().root, b.dataset.scale); return; }
  if (b.dataset.deg !== undefined) { st.deg = st.deg === +b.dataset.deg ? null : +b.dataset.deg; decorate(); refreshSide(); playNow(false); return; }
  if (b.dataset.l && b.dataset.l !== st.layout) { st.layout = b.dataset.l; morphLayout(); refreshSide(); return; }
  switch (b.id) {
    case 'ckPrev': return setRoot(rootPc() - 1);
    case 'ckNext': return setRoot(rootPc() + 1);
    case 'ckFlip': st.type = st.type === 'maj' ? 'min' : 'maj'; morphFigure(); refreshSide(); return playNow(true);
    case 'ckPlay': return playNow(false);
    case 'ckArp': return playNow(true);
    case 'ckInv': st.inv = (st.inv + 1) % M.CHORDS[st.type].iv.length; refreshSide(); return playNow(true);
    case 'ckSound': U.state.sound = b.checked; return undefined;
    default: return undefined;
  }
}

MP.clock = {
  degreeChord() { return st.deg === null ? null : M.diatonicChords(keyNow().root, keyNow().scale, 3)[st.deg] || null; },
  open(root, scale, mode = 'scale') { st.mode = mode; st.deg = null; if (mode === 'chord') st.root = root; U.setKey(root, scale); },
};
MP.tabs.clock = {
  title: 'Круг-часы',
  render(host) {
    el = host;
    el.innerHTML = `<div class="ck-grid">
        <div class="ck-left"><div class="clockbox">${svgMarkup()}</div>
          <p class="muted ck-cap">12 нот = 12 часов. 1 час = 1 полутон = 1 клетка в пиано-ролле Ableton. Нажми на любую ноту.</p></div>
        <div class="ck-right" id="ckSide"></div></div>
      <div id="ckBelow" class="ck-below"></div>`;
    disp = { nodeH: nodeHours(st.layout), fig: [] };
    draw(disp.nodeH, [], false);
    morphFigure();
    refreshSide();
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.nd')) { e.preventDefault(); setRoot(+e.target.closest('.nd').dataset.pc); } });
    unsub = U.onKey(() => { if (st.mode === 'scale') { morphFigure(); refreshSide(); playNow(false); } });
  },
  destroy() { finish(); if (unsub) unsub(); el = null; },
};
})();
