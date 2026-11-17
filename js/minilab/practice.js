/* Практикум «куда нажать»: слева шаги, справа нарисованное окно Live (схема, не скриншот),
   нужная кнопка подсвечена. Данные — data/practice.js. */
(function () {
'use strict';
const T = window.Tabs;
const e = T.esc;
const PADS = Object.fromEntries(PR_909_PADS.map(([note, name, macros]) => [note, { name, macros }]));
const PAD_ROWS = [[12, 13, 14, 15], [8, 9, 10, 11], [4, 5, 6, 7], [0, 1, 2, 3]]; /* в Live C1 — нижний левый пэд */

const hl = id => ` data-hl="${e(id)}"`;
const knob = '<i class="lv-k"></i>';

function browser(rows, mode) {
  if (!rows) return '';
  return `<div class="lv-mb ${mode}"${hl('browser')}><div class="lv-mbh">Mapping Browser</div>
    <table><tr><th>Что</th><th>Параметр</th><th>Min</th><th>Max</th></tr>${rows.map(([a, b, st], i) => `<tr class="${e(st || '')}"${hl(`row-${i + 1}`)}>
      <td>${e(a)}</td><td>${e(b)}</td><td>${st === 'minmax' ? '<b>80 Hz</b>' : '…'}</td><td>${st === 'minmax' ? '<b>8.00 kHz</b>' : '…'}</td></tr>`).join('')}</table></div>`;
}
function macroPanel(macros, map) {
  return `<div class="lv-macros"><div class="lv-mh"><span class="lv-b">Rand</span><span class="lv-b ${map ? 'on' : ''}"${hl('map')}>Map</span></div>
    <div class="lv-mg">${macros.map((n, i) => `<div class="lv-mk ${n === '—' ? 'blank' : ''}"${hl(`m${i + 1}`)}>${knob}<b>${e(n === '—' ? `Macro ${i + 1}` : n)}</b>${map ? `<em${hl(`mapm${i + 1}`)}>Map</em>` : ''}</div>`).join('')}</div></div>`;
}
const title = (name, { hand = false, save = true, id = 'rack-title' } = {}) =>
  `<div class="lv-tb"${hl(id)}><span class="lv-on"></span><b>${e(name)}</b>${hand ? `<span class="lv-hand"${hl('hand')} title="Закреплено за MiniLab">✋</span>` : ''}${save ? `<span class="lv-save"${hl('save')} title="Сохранить пресет">💾</span>` : ''}</div>`;

/* ---------- Drum Rack 909 Core Kit ---------- */
function drum(m) {
  const pads = PAD_ROWS.map(r => r.map(i => {
    const [note, name] = PR_909_PADS[i];
    return `<div class="lv-pad ${m.pad === note ? 'sel' : ''}"${hl(`pad-${note}`)}><b>${e(name)}</b><small>${e(note)}</small></div>`;
  }).join('')).join('');
  const p = m.pad && PADS[m.pad];
  const chain = p ? `<div class="lv-dev lv-chain"${hl('chain')}>${title(`${p.name} 909`, { save: false, id: 'chain-title' })}
    <div class="lv-mg in">${p.macros.map(n => `<div class="lv-mk"${hl(`in-${n}`)}>${knob}<b>${e(n)}</b></div>`).join('')}</div></div>` : '';
  return `${browser(m.browser, 'macro')}<div class="lv-dev lv-rack"${hl('rack')}>${title('909 Core Kit', { hand: m.hand })}
    <div class="lv-in">${macroPanel(m.macros, m.map)}<div class="lv-pads">${pads}</div></div></div>${chain}`;
}

/* ---------- эффекты на дорожке баса ---------- */
const FX = [['dev-eq', 'EQ Eight', [['p-eqf', 'Freq'], ['p-eqg', 'Gain']]], ['dev-sat', 'Saturator', [['p-drive', 'Drive'], ['p-satw', 'Dry/Wet']]], ['dev-af', 'Auto Filter', [['p-freq', 'Freq'], ['p-res', 'Res']]]];
function fxDev([id, name, params], m) {
  return `<div class="lv-dev small ${m.sel ? 'picked' : ''}"${hl(id)}>${title(name, { save: false, id: `${id}-t` })}
    <div class="lv-mg in">${params.map(([pid, n]) => `<div class="lv-mk"${hl(pid)}>${knob}<b>${e(n)}</b></div>`).join('')}</div></div>`;
}
function fx(m) {
  const devs = FX.map(d => fxDev(d, m)).join('');
  if (!m.rack) return `<div class="lv-chainrow">${devs}</div>`;
  return `${browser(m.browser, 'macro')}<div class="lv-dev lv-rack"${hl('rack')}>${title('Audio Effect Rack')}
    <div class="lv-in">${macroPanel(m.macros, m.map)}<div class="lv-chainrow br">${devs}</div></div></div>`;
}

/* ---------- MIDI Map ---------- */
function midimap(m) {
  const bar = `<div class="lv-ctrl"><span>Control Bar</span><span class="lv-b">KEY</span><span class="lv-b ${m.map ? 'blue' : ''}"${hl('midi-btn')}>MIDI</span></div>`;
  if (m.ports) {
    const row = (name, st) => `<div class="pr"><span>${e(name)}</span>${st.map((s, i) => `<i class="${s}"${i === 2 && s === 'on' ? hl('remote') : ''}></i>`).join('')}</div>`;
    return `<div class="lmock ports"><div class="pr ph"><span>Settings → Tempo & MIDI → MIDI Ports</span><em>Track</em><em>Sync</em><em>Remote</em><em>MPE</em></div>
      ${row('In: Minilab3 MIDI', ['on', 'off', 'on', 'off'])}${row('In: Minilab3 DIN THRU', ['off', 'off', 'off', 'off'])}${row('In: Minilab3 MCU', ['off', 'off', 'off', 'off'])}</div>`;
  }
  const cls = id => [m.map ? 'mm' : '', id === 'p-freq' && m.picked ? 'pick' : ''].join(' ');
  const tag = m.mapped ? '<span class="lv-tag">1/74</span>' : '';
  return `${bar}<div class="lv-row">${browser(m.browser, 'midi')}<div class="lv-dev small">${title('Auto Filter · Группа', { save: false, id: 'af-t' })}
    <div class="lv-mg in"><div class="lv-mk ${cls('p-freq')}"${hl('p-freq')}>${knob}<b>Freq</b>${tag}</div><div class="lv-mk ${cls('p-res')}"${hl('p-res')}>${knob}<b>Res</b></div></div></div></div>`;
}

const VIEWS = { drum, fx, midimap };
function mock(m) {
  const body = (VIEWS[m.view] || (() => ''))(m);
  return `<div class="lv ${m.map ? `mapmode ${m.view === 'midimap' ? 'mmode' : ''}` : ''}"><div class="lv-row">${body}</div>
    ${m.screen ? `<div class="lv-screen"><span>Экран MiniLab</span><b>${e(m.screen)}</b></div>` : ''}</div>`;
}
function paintHl(box, ids) {
  T.$$('[data-hl]', box).forEach(n => n.classList.toggle('hl', ids.includes(n.dataset.hl)));
}

/* ---------- компонент ---------- */
const st = { sc: PRACTICE[0].id, step: 0 };
let box = null;
const cur = () => PRACTICE.find(p => p.id === st.sc) || PRACTICE[0];
function view(host) {
  const p = cur(), s = p.steps[st.step];
  T.$('#prWhy', host).textContent = p.why;
  T.$('#prSteps', host).innerHTML = p.steps.map((x, i) => `<li class="${i === st.step ? 'on' : i < st.step ? 'done' : ''}" data-step="${i}"><span class="n">${i + 1}</span><p>${e(x.do)}</p></li>`).join('');
  T.$('#prMock', host).innerHTML = mock(s.mock);
  paintHl(T.$('#prMock', host), s.mock.hl || []);
  T.$('#prDo', host).textContent = s.do;
  T.$('#prSee', host).textContent = s.see;
  T.$('#prCount', host).textContent = `Шаг ${st.step + 1} из ${p.steps.length}`;
  T.$('#prPrev', host).disabled = st.step === 0;
  T.$('#prNext', host).textContent = st.step === p.steps.length - 1 ? 'Сначала ↺' : 'Дальше →';
  T.$$('#prPick .chip', host).forEach(c => c.classList.toggle('on', c.dataset.sc === p.id));
}
function mount(host) {
  box = host;
  host.innerHTML = `<div class="prac">
    <div class="chips" id="prPick">${PRACTICE.map(p => `<button class="chip" data-sc="${p.id}">${p.icon} ${e(p.title)} <small>${e(p.sub)}</small></button>`).join('')}</div>
    <p class="why" id="prWhy"></p>
    <div class="prgrid">
      <ol class="prsteps" id="prSteps"></ol>
      <div class="prright"><div class="prnow"><span id="prCount"></span><b id="prDo"></b></div>
        <div id="prMock"></div>
        <p class="prsee"><b>Что увидишь:</b> <span id="prSee"></span></p>
        <div class="prnav"><button class="btn" id="prPrev">← Назад</button><button class="btn pri" id="prNext">Дальше →</button></div>
        <p class="muted small">Схема окна Live 12, а не скриншот: подсвечено то, куда нажать.</p></div>
    </div></div>`;
  host.addEventListener('click', ev => {
    const sc = ev.target.closest('[data-sc]'), li = ev.target.closest('[data-step]');
    if (sc) { st.sc = sc.dataset.sc; st.step = 0; }
    else if (li) st.step = +li.dataset.step;
    else if (ev.target.closest('#prPrev')) st.step = Math.max(0, st.step - 1);
    else if (ev.target.closest('#prNext')) st.step = st.step === cur().steps.length - 1 ? 0 : st.step + 1;
    else return;
    view(host);
  });
  view(host);
}
/* открыть сценарий (кнопка «Показать по шагам») — без повторного навешивания обработчиков */
function open(id) {
  if (!PRACTICE.some(p => p.id === id)) return;
  st.sc = id; st.step = 0;
  if (box && box.isConnected) view(box);
}

window.Practice = { mount, open };
})();
