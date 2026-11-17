/* Вкладка «Подключение»: шаги по PDF Arturia, нарисованная копия окна Settings → Tempo & MIDI, «не работает?». */
(function () {
'use strict';
const T = window.Tabs;

/* копия окна настроек Live: какие значения выбрать (подсвечено) */
function surfaceMock() {
  const rows = [1, 2, 3, 4, 5, 6].map(n => n === 1
    ? '<tr class="sel"><td>1</td><td><b>MiniLab 3</b></td><td><b>Minilab3 MIDI</b></td><td><b>Minilab3 MIDI</b></td></tr>'
    : `<tr><td>${n}</td><td>None</td><td>None</td><td>None</td></tr>`).join('');
  return `<div class="lmock" aria-label="Live Settings → Tempo & MIDI → Control Surface"><div class="lh">MIDI</div>
    <table><tr><th></th><th>Control Surface</th><th>Input</th><th>Output</th></tr>${rows}</table></div>`;
}
function portsMock() {
  const box = (s, title) => `<i class="${s}" title="${T.esc(title)}"></i>`;
  const ins = [['In: MiniLab 3 MIDI', ['on', 'off', 'opt', 'off']], ['In: Minilab3 DIN THRU', ['off', 'off', 'off', 'off']], ['In: Minilab3 MCU', ['off', 'off', 'off', 'off']], ['In: Minilab3 ALV', ['off', 'off', 'off', 'off']]];
  const outs = [['Out: MiniLab 3 MIDI', ['off', 'off', 'off']], ['Out: Minilab3 DIN THRU', ['off', 'off', 'off']], ['Out: Minilab3 MCU', ['off', 'off', 'off']], ['Out: Minilab3 ALV', ['off', 'off', 'off']]];
  const head = cols => `<div class="pr ph"><span>MIDI Ports</span>${cols.map(c => `<em>${c}</em>`).join('')}</div>`;
  const row = ([name, st]) => `<div class="pr"><span>${T.esc(name)}</span>${st.map((s, i) => box(s, ['Track', 'Sync', 'Remote', 'MPE'][i])).join('')}</div>`;
  return `<div class="lmock ports">${head(['Track', 'Sync', 'Remote', 'MPE'])}${ins.map(row).join('')}${head(['Track', 'Sync', 'Remote'])}${outs.map(row).join('')}
    <p class="lg"><i class="on"></i> включить <i class="opt"></i> только для своих маппингов <i class="off"></i> выключено</p></div>`;
}
const MOCK = { surface: surfaceMock, ports: portsMock };

function render(host) {
  host.innerHTML = `
    <div class="sec-h"><div><h2>Подключение к Live 12</h2><p>По инструкции Arturia «MiniLab 3 — Live script». Делается один раз.</p></div></div>
    <div class="msteps">${ML_SETUP.map((s, i) => `<div class="mstep reveal${s.mock ? ' wide' : ''}">
      <span class="n">${i + 1}</span><b>${T.esc(s.title)}</b>${s.keys ? `<div class="keys">${T.kbd(s.keys)}</div>` : ''}<p>${T.esc(s.text)}</p>
      ${s.mock ? MOCK[s.mock]() : ''}</div>`).join('')}</div>
    <div class="dt-grid">
      <div class="box"><h3 class="bh">🎹 ${T.esc(ML_ANALOG.title)}</h3><p class="muted">${T.esc(ML_ANALOG.text)}</p></div>
      <div class="box"><h3 class="bh">➡️ Дальше</h3><p class="muted">Что делает каждая кнопка — вкладка «Кнопки». Как разложить ручки, чтобы крутить автоматизацию, — «Раскладки ручек». Проверить, что MiniLab шлёт сигналы, — «Проверка».</p>
        <div class="links"><a class="btn" href="#controls">🎛️ Кнопки</a><a class="btn" href="#layouts">🧩 Раскладки</a><a class="btn" href="#tester">📡 Проверка</a></div></div>
    </div>
    <div class="sec-h"><div><h2>Не работает?</h2><p>Частые причины и что сделать.</p></div></div>
    <div class="scen">${ML_TROUBLE.map(t => `<details class="ref"><summary>${T.esc(t.q)}</summary><p class="ans">${T.esc(t.a)}</p></details>`).join('')}</div>`;
}

window.PageTabs.setup = { title: 'Подключение', icon: '🔗', render };
})();
