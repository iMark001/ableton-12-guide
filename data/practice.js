/* Практикум «куда нажать»: пошаговые сценарии маппинга ручек MiniLab 3 в Live 12.
   909 Core Kit — по самому пресету Core Library Live 12.4.6 (Racks/Drum Racks/Drum Machines/909 Core Kit.adg):
   макросы Drum Rack и макросы внутри пэдов взяты из файла. Кнопки Live — по мануалу Live 12 (Racks, MIDI and Key Remote Control).
   mock — что нарисовать справа: view (drum | fx | midimap), состояние и подсвеченные элементы (hl). */

const PR_909_PADS = [
  ['C1', 'Bass Drum', ['Tune', 'Attack', 'Decay', 'Level']], ['C#1', 'Rim Shot', ['Level']], ['D1', 'Snare Drum', ['Tune', 'Snappy', 'Tone', 'Level']], ['D#1', 'Hand Clap', ['Level']],
  ['E1', 'Bass Drum', ['Tune', 'Attack', 'Decay', 'Level']], ['F1', 'Snare Drum', ['Tune', 'Snappy', 'Tone', 'Level']], ['F#1', 'Closed Hi Hat', ['Decay', 'Level']], ['G1', 'Snare Drum', ['Tune', 'Snappy', 'Tone', 'Level']],
  ['G#1', 'Low Tom', ['Tune', 'Drive', 'Decay', 'Level']], ['A1', 'Mid Tom', ['Tune', 'Drive', 'Decay', 'Level']], ['A#1', 'Open Hi Hat', ['Decay', 'Level']], ['B1', 'Hi Tom', ['Tune', 'Drive', 'Decay', 'Level']],
  ['C2', 'Crash', ['Tune', 'Level']], ['C#2', 'Crash', ['Tune', 'Level']], ['D2', 'Ride', ['Tune', 'Level']], ['D#2', 'Ride', ['Tune', 'Level']],
];
const PR_909_MACROS = ['Low Gain', '—', '—', 'Gain', 'Drive Amount', 'Drive Tone', 'Glue', 'Vintage'];
const PR_909_DONE = ['Кик тон', 'Кик длина', 'Снейр щелчок', 'Хэт длина', 'Drive Amount', 'Drive Tone', 'Glue', 'Vintage'];
const prMacros = (...first) => [...first, ...PR_909_MACROS.slice(first.length)];

const PRACTICE = [
  { id: 'drums', icon: '🥁', title: 'Драм-кит 909', sub: 'Кик, снейр и хэт — на ручки 1–4',
    why: 'Почему сейчас «не работает»: ручки MiniLab крутят макросы Drum Rack, а у 909 Core Kit там обработка всего кита (Low Gain, Gain, Drive, Glue, Vintage), две ручки вообще пустые. Тюн и длина каждого барабана спрятаны внутри пэдов. За 5 минут выведем их на ручки 1–4, а 5–8 оставим как есть.',
    steps: [
      { do: 'На MiniLab: Shift + Pad 3 → DAW. На дорожке с 909 Core Kit включи Arm (Shift + нажать главный энкодер).', see: 'На заголовке Drum Rack появится ✋ — ручки MiniLab закреплены за ним. Покрути ручку 1 — на экране MiniLab «Low Gain».',
        mock: { view: 'drum', macros: PR_909_MACROS, hand: true, screen: 'Low Gain', hl: ['hand', 'm1'] } },
      { do: 'Посмотри на 8 ручек слева в Drum Rack — это и есть ручки MiniLab 1–8.', see: 'Low Gain, пусто, пусто, Gain, Drive Amount, Drive Tone, Glue, Vintage. Пустые 2 и 3 ничего не делают — поэтому и кажется, что MiniLab не работает.',
        mock: { view: 'drum', macros: PR_909_MACROS, hand: true, hl: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'] } },
      { do: 'Кликни пэд Bass Drum (C1) в сетке пэдов.', see: 'Справа откроется Bass Drum 909 — у него свои ручки Tune, Attack, Decay, Level. Их и выведем на MiniLab.',
        mock: { view: 'drum', macros: PR_909_MACROS, hand: true, pad: 'C1', hl: ['pad-C1', 'chain'] } },
      { do: 'Нажми Map — кнопка над ручками Drum Rack.', see: 'Под каждой ручкой Drum Rack появится маленькая кнопка Map, всё, что можно назначить, подсветится, слева откроется Mapping Browser — список назначений.',
        mock: { view: 'drum', macros: PR_909_MACROS, hand: true, pad: 'C1', map: true, browser: [['Macro 1', 'Low Gain'], ['Macro 4', 'Gain'], ['Macro 5', 'Drive Amount']], hl: ['map', 'browser'] } },
      { do: 'В Mapping Browser выдели строку Macro 1 (Low Gain) и нажми Delete.', see: 'Строка исчезнет — Macro 1 освободился. Без этого ручка крутила бы сразу и старое, и новое.',
        mock: { view: 'drum', macros: prMacros('—'), hand: true, pad: 'C1', map: true, browser: [['Macro 1', 'Low Gain', 'del'], ['Macro 4', 'Gain'], ['Macro 5', 'Drive Amount']], hl: ['row-1'] } },
      { do: 'Кликни ручку Tune у Bass Drum 909, затем кнопку Map под Macro 1.', see: 'Macro 1 станет «Tune». Ручка 1 на MiniLab теперь меняет высоту кика.',
        mock: { view: 'drum', macros: prMacros('Tune'), hand: true, pad: 'C1', map: true, browser: [['Macro 1', 'Bass Drum · Tune', 'new'], ['Macro 4', 'Gain'], ['Macro 5', 'Drive Amount']], screen: 'Tune', hl: ['in-Tune', 'mapm1'] } },
      { do: 'Кликни Decay у Bass Drum 909 → Map под Macro 2.', see: 'Macro 2 = длина кика. Он был пустой — если в Mapping Browser всё же есть строка Macro 2, удали её так же, как Low Gain.',
        mock: { view: 'drum', macros: prMacros('Tune', 'Decay'), hand: true, pad: 'C1', map: true, hl: ['in-Decay', 'mapm2'] } },
      { do: 'Нажми Map (выключить), кликни пэд Snare Drum (D1), снова Map. Кликни Snappy → Map под Macro 3.', see: 'Macro 3 = «щелчок» снейра (шум пружин). Пэды переключай только с выключенным Map — так надёжнее.',
        mock: { view: 'drum', macros: prMacros('Tune', 'Decay', 'Snappy'), hand: true, pad: 'D1', map: true, hl: ['pad-D1', 'in-Snappy', 'mapm3'] } },
      { do: 'Map выкл → пэд Closed Hi Hat (F#1) → Map. В Mapping Browser удали строку Macro 4 (Gain). Кликни Decay → Map под Macro 4.', see: 'Macro 4 = длина закрытого хэта. Ручки 5–8 не трогаем: Drive Amount, Drive Tone, Glue, Vintage — полезная обработка кита.',
        mock: { view: 'drum', macros: prMacros('Tune', 'Decay', 'Snappy', 'Decay'), hand: true, pad: 'F#1', map: true, browser: [['Macro 1', 'Bass Drum · Tune'], ['Macro 2', 'Bass Drum · Decay'], ['Macro 3', 'Snare Drum · Snappy'], ['Macro 4', 'Gain', 'del']], hl: ['pad-F#1', 'row-4', 'in-Decay', 'mapm4'] } },
      { do: 'Нажми Map (выключить). Дай понятные имена: кликни Macro 1 → Cmd+R → «Кик тон», Enter. Так же: «Кик длина», «Снейр щелчок», «Хэт длина».', see: 'Эти имена покажет экран MiniLab, когда крутишь ручку, — не перепутаешь два Decay.',
        mock: { view: 'drum', macros: PR_909_DONE, hand: true, pad: 'F#1', screen: 'Кик тон', hl: ['m1', 'm2', 'm3', 'm4'] } },
      { do: 'Сохрани кит: кнопка 💾 в заголовке Drum Rack → имя «909 MiniLab».', see: 'Кит с твоими ручками появится в браузере Live (User Library) — в следующий раз просто перетащи его на дорожку.',
        mock: { view: 'drum', macros: PR_909_DONE, hand: true, hl: ['save'] } },
      { do: 'Записать движения: Automation Arm → Shift + Pad 7 на MiniLab → крути ручки 1–4 → Shift + Pad 5 (стоп).', see: 'На дорожке появятся красные линии автоматизации кика, снейра и хэта. Подробно — на странице «Автоматизация».',
        mock: { view: 'drum', macros: PR_909_DONE, hand: true, screen: 'Снейр щелчок', hl: ['m1', 'm2', 'm3', 'm4'] } },
    ] },
  { id: 'fx', icon: '🔊', title: 'Эффекты на басе', sub: 'Фильтр, резонанс, драйв — на ручки 1–3',
    why: 'Когда на дорожке несколько эффектов, ручки MiniLab крутят только одно выбранное устройство. Собираем эффекты в Rack и выводим главное на его ручки — тогда все нужные параметры всегда на MiniLab.',
    steps: [
      { do: 'На дорожке баса кликни заголовок первого эффекта (EQ Eight), затем Shift-клик по заголовку последнего (Auto Filter).', see: 'Все три заголовка подсветятся.',
        mock: { view: 'fx', sel: true, hl: ['dev-eq', 'dev-sat', 'dev-af'] } },
      { do: 'Нажми Cmd+G.', see: 'Эффекты окажутся внутри Audio Effect Rack (скобки по краям), слева — 8 пустых ручек Macro 1–8.',
        mock: { view: 'fx', rack: true, macros: ['Macro 1', 'Macro 2', 'Macro 3', 'Macro 4', 'Macro 5', 'Macro 6', 'Macro 7', 'Macro 8'], hl: ['rack', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'] } },
      { do: 'Нажми Map над ручками Rack. Кликни Freq у Auto Filter → Map под Macro 1.', see: 'Macro 1 станет «Freq» — это ручка 1 на MiniLab.',
        mock: { view: 'fx', rack: true, map: true, macros: ['Freq', 'Macro 2', 'Macro 3', 'Macro 4', 'Macro 5', 'Macro 6', 'Macro 7', 'Macro 8'], browser: [['Macro 1', 'Auto Filter · Frequency', 'new']], hl: ['map', 'p-freq', 'mapm1'] } },
      { do: 'Так же: Res у Auto Filter → Map под Macro 2; Drive у Saturator → Map под Macro 3.', see: 'Три главные ручки баса на MiniLab 1–3.',
        mock: { view: 'fx', rack: true, map: true, macros: ['Freq', 'Res', 'Drive', 'Macro 4', 'Macro 5', 'Macro 6', 'Macro 7', 'Macro 8'], browser: [['Macro 1', 'Auto Filter · Frequency'], ['Macro 2', 'Auto Filter · Resonance', 'new'], ['Macro 3', 'Saturator · Drive', 'new']], hl: ['p-res', 'p-drive', 'mapm2', 'mapm3'] } },
      { do: 'В Mapping Browser у строки Macro 1 поставь Min = 80 Hz, Max = 8 kHz.', see: 'Ручка 1 будет крутить фильтр только в полезной зоне — без глухого «ничего» и без писка.',
        mock: { view: 'fx', rack: true, map: true, macros: ['Freq', 'Res', 'Drive', 'Macro 4', 'Macro 5', 'Macro 6', 'Macro 7', 'Macro 8'], browser: [['Macro 1', 'Auto Filter · Frequency', 'minmax']], hl: ['row-1'] } },
      { do: 'Нажми Map (выключить) и кликни заголовок Rack — не Auto Filter внутри!', see: 'Покрути ручку 1 на MiniLab — на экране «Freq» и частота. Если видишь другие имена, ты выбрал устройство внутри Rack.',
        mock: { view: 'fx', rack: true, macros: ['Freq', 'Res', 'Drive', 'Macro 4', 'Macro 5', 'Macro 6', 'Macro 7', 'Macro 8'], screen: 'Freq 900 Hz', hl: ['rack-title'] } },
      { do: 'Сохрани: 💾 в заголовке Rack → «Бас MiniLab».', see: 'Rack лежит в User Library — кидай на любой бас. Готовые наборы ручек для других партий — ниже на этой вкладке.',
        mock: { view: 'fx', rack: true, macros: ['Freq', 'Res', 'Drive', 'Macro 4', 'Macro 5', 'Macro 6', 'Macro 7', 'Macro 8'], hl: ['save'] } },
    ] },
  { id: 'midimap', icon: '📌', title: 'Одна ручка навсегда', sub: 'Ручка 1 всегда крутит один и тот же параметр',
    why: 'Режим DAW переключает ручки за выбранным устройством. Если хочешь, чтобы ручка 1 всегда крутила, например, фильтр на группе — где бы ты ни был в проекте, — нужна программа User и MIDI Map.',
    steps: [
      { do: 'На MiniLab: Shift + Pad 3 → программа User 1.', see: 'На экране MiniLab — User. Теперь Live не раздаёт ручкам работу, они свободны.',
        mock: { view: 'midimap', screen: 'User 1', hl: [] } },
      { do: 'Live → Settings (Cmd+,) → Tempo & MIDI → MIDI Ports: у In: Minilab3 MIDI включи Remote.', see: 'Без Remote Live не даст назначать ручки MiniLab вручную.',
        mock: { view: 'midimap', ports: true, hl: ['remote'] } },
      { do: 'Нажми Cmd+M.', see: 'Справа вверху загорится MIDI, всё, что можно назначить, станет синим.',
        mock: { view: 'midimap', map: true, hl: ['midi-btn'] } },
      { do: 'Кликни параметр — например Freq у Auto Filter на группе.', see: 'Ручка обведётся рамкой — Live ждёт сигнал с контроллера.',
        mock: { view: 'midimap', map: true, picked: true, hl: ['p-freq'] } },
      { do: 'Покрути ручку 1 на MiniLab.', see: 'На ручке Freq появится метка «1/74» (канал 1, CC 74), в Mapping Browser — новая строка.',
        mock: { view: 'midimap', map: true, picked: true, mapped: true, browser: [['CC 74 · Ch 1', 'Auto Filter · Frequency', 'new']], hl: ['p-freq', 'browser'] } },
      { do: 'Cmd+M — выйти. Чтобы так было в каждом новом проекте: File → Save Live Set As Default Set…', see: 'Ручка 1 крутит фильтр группы всегда. Если параметр прыгает при первом касании — Settings → Tempo & MIDI → Takeover Mode: Value Scaling.',
        mock: { view: 'midimap', mapped: true, screen: 'CC 74', hl: ['p-freq'] } },
    ] },
];
