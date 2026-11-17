/* Вкладка «Проверка»: живой MiniLab 3 через Web MIDI. Крутишь — элемент подсвечивается на рисунке,
   видно CC, значение, канал, программу (DAW или Arturia/User) и абсолютные/относительные значения.
   Только чтение входящих сообщений, без sysex; данные никуда не уходят. */
(function () {
'use strict';
const T = window.Tabs, P = window.MiniPanel, C = window.CtrlCore;
const NAME = Object.fromEntries(ML_CONTROLS.map(c => [c.id, c.name]));
const LOG_MAX = 12, HISTORY = 8, PAINT_MS = 40;
const REL_TEXT = {
  absolute: 'абсолютные значения 0…127 — в Live поставь Takeover Mode: Value Scaling',
  binoffset: 'Relative 1 — в Live выбери режим Relative (BinOffset)',
  twos: 'Relative 2 — в Live выбери режим Relative (2’s Comp.)',
};
let el = null, access = null, timer = 0, pending = null;
const st = { log: [], hist: {}, program: null, ports: [] };

const isMini = name => /mini\s*lab/i.test(name || '');
const noteName = n => `${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][n % 12]}${Math.floor(n / 12) - 2}`;

function describe(msg, hit, port) {
  const id = hit ? (ML_ALIAS[hit.id] || hit.id) : null;
  let what = id ? NAME[id] || id : 'Неизвестный элемент';
  if (hit && ML_ALIAS_NAME[hit.id]) what = `Главный энкодер — ${ML_ALIAS_NAME[hit.id]}`;
  if (hit && hit.bank) what += `, банк ${hit.bank}`;
  if (hit && hit.id === 'keys') what = `Клавиша ${noteName(hit.note)}`;
  const sig = msg.type === 'cc' ? `CC ${msg.num}` : msg.type === 'pitch' ? 'Pitch Bend' : msg.type.startsWith('note') ? `нота ${msg.num}` : msg.type;
  return { id, what, sig, value: msg.value, ch: msg.ch, type: msg.type, port };
}
function onMessage(port, e) {
  const msg = C.parseMidi(e.data);
  if (!msg || msg.type === 'sysex' || msg.type === 'other') return;
  if (msg.type === 'note-off' || msg.type === 'aftertouch') return; /* сила нажатия пэдов — поток, только засоряет журнал */
  const hit = C.identify(msg, ML_CC);
  if (hit && hit.program) st.program = hit.program;
  let rel = null;
  if (msg.type === 'cc') {
    const h = st.hist[msg.num] = [...(st.hist[msg.num] || []), msg.value].slice(-HISTORY);
    rel = C.guessRelative(h);
  }
  const row = { ...describe(msg, hit, port), rel };
  st.log = [row, ...st.log].slice(0, LOG_MAX);
  pending = { row, hit, msg };
  if (!timer) timer = setTimeout(paint, PAINT_MS);
}
/* перерисовка не чаще 25 раз в секунду: ручки шлют десятки сообщений. Таймер, а не кадр анимации —
   чтобы страница обновлялась, даже пока окно браузера в фоне (крутишь ручки, глядя в Live). */
function paint() {
  timer = 0;
  if (!el || !pending) return;
  const { row, hit, msg } = pending;
  pending = null;
  const svg = T.$('.panelbox', el);
  if (row.id) {
    P.flash(svg, row.id);
    if (/^(enc|fad)\d$/.test(row.id) && hit.program && msg.type === 'cc' && row.rel !== 'binoffset' && row.rel !== 'twos') P.setK(svg, row.id, msg.value / 127);
  }
  P.display(svg, row.id ? `${row.sig} · ${row.value}` : '—');
  T.$('#tsNow', el).innerHTML = `<b>${T.esc(row.what)}</b><span>${T.esc(row.sig)} · значение ${row.value} · канал ${row.ch}</span>
    ${row.rel ? `<span class="rel">${T.esc(REL_TEXT[row.rel])}</span>` : ''}`;
  T.$('#tsProg', el).innerHTML = st.program ? `Программа на MiniLab: <b>${T.esc(ML_PROGRAM[st.program])}</b>${st.program === 'daw' ? ' — Live сам раздаёт ручкам работу.' : ' — ручки свободны для MIDI Map.'}` : 'Покрути ручку — определю программу.';
  T.$('#tsLog', el).innerHTML = st.log.map(r => `<tr><td>${T.esc(r.what)}</td><td>${T.esc(r.sig)}</td><td>${r.value}</td><td>${r.ch}</td><td>${T.esc(r.port)}</td></tr>`).join('');
}

function bindPorts() {
  if (!access) return;
  const ins = [...access.inputs.values()];
  const mine = ins.filter(i => isMini(i.name));
  const use = mine.length ? mine : ins;
  ins.forEach(i => { i.onmidimessage = use.includes(i) ? e => onMessage(i.name, e) : null; });
  st.ports = use.map(i => i.name);
  const box = T.$('#tsPorts', el);
  if (!box) return;
  box.innerHTML = !ins.length ? '<span class="err">MIDI-устройств не видно. Подключи MiniLab кабелем и подожди пару секунд.</span>'
    : `${mine.length ? 'Слушаю MiniLab:' : 'MiniLab не найден, слушаю всё, что есть:'} ${use.map(n => `<span class="badge g">${T.esc(n.name)}</span>`).join(' ')}`;
}
function connect() {
  const status = T.$('#tsStatus', el);
  if (!navigator.requestMIDIAccess) {
    status.innerHTML = '<span class="err">Этот браузер не умеет работать с MIDI. Открой страницу в Chrome или Edge.</span>';
    return;
  }
  status.textContent = 'Жду разрешения… Chrome спросит доступ к MIDI-устройствам — нажми «Разрешить».';
  navigator.requestMIDIAccess({ sysex: false }).then(a => {
    if (!el) return;
    access = a;
    access.onstatechange = () => bindPorts();
    bindPorts();
    status.textContent = 'Подключено. Покрути любую ручку MiniLab.';
    T.$('#tsGo', el).disabled = true;
  }, err => {
    if (!el) return;
    status.innerHTML = `<span class="err">Доступ к MIDI не получен (${T.esc(err && err.name || 'ошибка')}). Нажми на значок слева от адреса сайта → MIDI-устройства → Разрешить и обнови страницу.</span>`;
  });
}
function release() {
  if (timer) clearTimeout(timer);
  timer = 0; pending = null;
  if (access) {
    access.onstatechange = null;
    access.inputs.forEach(i => { i.onmidimessage = null; });
  }
  access = null;
}

function render(host) {
  el = host;
  host.innerHTML = `
    <div class="sec-h"><div><h2>Проверка контроллера</h2><p>Подключи MiniLab к этому компьютеру, нажми кнопку и крути ручки. Сайт только слушает сигналы — ничего не отправляет и не сохраняет.</p></div></div>
    <div class="tester">
      <div class="tsbar"><button class="btn pri" id="tsGo">📡 Подключить MiniLab</button><span id="tsStatus" class="muted">Нужен Chrome или Edge. Live можно не закрывать.</span></div>
      <div id="tsPorts" class="muted small"></div>
      <div class="mgrid"><div class="panelbox">${P.svg({ display: '—' })}</div>
        <div class="tsinfo"><div id="tsNow" class="tsnow"><b>Пока тихо</b><span>Покрути ручку или нажми пэд</span></div><p id="tsProg" class="muted"></p>
          <div class="box"><h3 class="bh">Как читать</h3><ul class="tools">
            <li><b>Номер CC</b> — по нему Live узнаёт ручку. В DAW: ручки ${ML_CC.daw.enc1}…${ML_CC.daw.enc8}, в Arturia и User: ${ML_CC.user.enc1}, ${ML_CC.user.enc2}…</li>
            <li><b>Значение</b> — 0…127. Если при кручении всё время 63/65 или 1/127 — ручка в режиме Relative.</li>
            <li><b>Нет сигналов</b> — проверь кабель и что Chrome получил разрешение (значок слева от адреса).</li></ul></div></div></div>
      <div class="tbl-wrap"><table class="mini tslog"><thead><tr><th>Элемент</th><th>Сигнал</th><th>Значение</th><th>Канал</th><th>Порт</th></tr></thead><tbody id="tsLog"></tbody></table></div>
    </div>`;
  T.$('#tsGo', host).addEventListener('click', connect);
}

window.PageTabs.tester = { title: 'Проверка', icon: '📡', render, destroy() { release(); el = null; } };
})();
