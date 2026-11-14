/* MIDI Effect Rack — мануал Live 12 (Instrument, Drum and Effect Racks). Диапазоны: до 16 макросов (по умолчанию 8);
   макрос с несколькими целями — шкала 0…127; Chain Selector 0…127; Velocity Zones 1…127. Примеры — рэки Core Library
   → Racks → MIDI Effect Racks (Live 12.4): состав цепочек и имена макросов прочитаны из файлов пресетов. */
registerDevice({
  id: 'midi-effect-rack',
  pickLabel: 'Задача',
  what: 'Контейнер для MIDI-эффектов: собирает несколько устройств (Arpeggiator, Chord, Scale, Note Echo…) в одно, выводит главные ручки на макросы и позволяет запускать параллельные цепочки. Каждая цепочка может реагировать только на свою часть клавиатуры, силу удара или положение Chain Selector.',
  when: [
    'Собрать «свой» арп или генератор из нескольких MIDI-эффектов и управлять им парой ручек.',
    'Сплит клавиатуры: слева одно, справа другое (Key Zones).',
    'Разная обработка тихих и сильных нот (Velocity Zones).',
    'Переключать варианты одной ручкой — лады, рисунки арпа (Chain Select).',
    'Сохранить находку как пресет и использовать в других треках.',
  ],
  how: [
    'Выдели заголовки MIDI-эффектов → правый клик → Group. Или перетащи пустой MIDI Effect Rack из браузера.',
    'Map → кликни параметр → кнопка Map под макросом. Min/Max задай в Mapping Browser.',
    'Для параллельных цепочек открой Chain List и перетащи туда устройства.',
    'Кнопки Key / Vel / Chain над списком цепочек — редакторы зон.',
    'Сохрани рэк в User Library — это готовый инструмент.',
  ],
  parts: ['arp', 'keys', 'lead'],
  controls: [
    { id: 'macro1', name: 'Macro 1', kind: 'knob', min: 0, max: 127, unit: '', range: '0…127 (или единицы цели)', desc: 'Макро-ручка: управляет любым числом параметров внутри рэка. С одной целью берёт её имя и единицы, с несколькими — шкала 0…127.' },
    { id: 'macro2', name: 'Macro 2', kind: 'knob', min: 0, max: 127, unit: '', range: '0…127', desc: 'Вторая макро-ручка. Всего до 16, по умолчанию видно 8.' },
    { id: 'chainsel', name: 'Chain Selector', kind: 'knob', min: 0, max: 127, unit: '', range: '0…127', desc: 'Указатель в редакторе Chain: звучат только цепочки, чья зона перекрывает его значение. Можно назначить на макрос или MIDI-контроллер.' },
    { id: 'keyzones', name: 'Key', kind: 'toggle', desc: 'Редактор Key Zones: каждая цепочка получает только ноты из своей зоны клавиатуры — сплиты.' },
    { id: 'velzones', name: 'Vel', kind: 'toggle', desc: 'Редактор Velocity Zones: цепочка реагирует только на силу удара в своей зоне (1…127).' },
    { id: 'chainzones', name: 'Chain', kind: 'toggle', desc: 'Редактор Chain Select Zones: «банки» вариантов, переключаемые Chain Selector.' },
    { id: 'map', name: 'Map', kind: 'toggle', desc: 'Режим назначения макросов: параметры подсвечиваются, под макросами появляются кнопки Map.' },
    { id: 'autoselect', name: 'Auto Select', kind: 'toggle', desc: 'Подсвечивает в списке цепочки, которые сейчас обрабатывают ноты — удобно для отладки зон.' },
  ],
  extra: [
    { name: 'Rand', range: 'кнопка', desc: 'Случайные значения всех назначенных макросов. Исключить макрос — Exclude Macro from Randomization в контекстном меню.' },
    { name: 'Macro Variations', range: 'снимки', desc: 'Сохраняют положения всех макросов: New — запомнить, Launch — вернуть. Удобно для сборок и дропов.' },
    { name: 'Fade ranges', range: '—', desc: 'В MIDI Effect Rack плавные края зон снижают velocity нот, входящих в цепочку.' },
    { name: 'Chain Selector Filters MIDI Ctrl', range: 'контекстное меню', desc: 'По умолчанию зоны Chain фильтруют только ноты; эта опция фильтрует и MIDI CC.' },
    { name: 'Правила', range: '—', desc: 'Внутри только MIDI-эффекты; ставится только на MIDI-дорожку. Рэки можно вкладывать друг в друга.' },
  ],
  presets: {
    arpmacro: { label: 'Свой арп под двумя ручками', icon: '🔁', note: 'Как рэк Arp Chord из Core Library: Chord → Arpeggiator, макросы Transp Steps и Transp Distnce.', set: [
      { c: 'map', v: true, w: 'Назначь Steps арпа на Macro 1, Distance — на Macro 2, потом выключи Map.' },
      { c: 'macro1', v: 1, t: 'Steps = 1', w: 'Один повтор рисунка…' },
      { c: 'macro2', v: 12, t: 'Distance +12 st', w: '…на октаву выше. Крути в брейке — арп «растёт».' },
    ] },
    scaleswitch: { label: 'Переключатель ладов одной ручкой', icon: '🎚️', note: 'Как рэк Keys & Scales: 10 цепочек со Scale (Major, Minor, Dorian…), Chain Selector на макросе Scale.', set: [
      { c: 'chainzones', v: true, w: 'Открой редактор Chain: каждой цепочке — своя зона шириной 1.' },
      { c: 'chainsel', v: 1, w: 'Значение 1 — вторая цепочка (например, Minor). 0 — первая.' },
      { c: 'macro1', v: 1, t: 'Scale', w: 'Назначь Chain Selector на макрос — лад меняется одной ручкой.' },
    ] },
    split: { label: 'Сплит: слева аккорды, справа арп', icon: '🎹', note: 'Цепочка 1: Chord (зона до B2). Цепочка 2: Arpeggiator (зона от C3). Играешь двумя руками — две партии.', set: [
      { c: 'keyzones', v: true, w: 'Редактор Key Zones: тяни края зон каждой цепочки.' },
      { c: 'autoselect', v: true, w: 'Видно, какая цепочка сработала — проверка сплита.' },
    ] },
    velsplit: { label: 'Сильный удар — другой эффект', icon: '💪', note: 'Цепочка «тихо»: без эффектов. Цепочка «громко» (Velocity 100–127): Note Echo — эхо только на акцентах.', set: [
      { c: 'velzones', v: true, w: 'Редактор Velocity Zones: зона каждой цепочки по силе удара.' },
      { c: 'autoselect', v: true, w: 'Проверка: какая цепочка ловит ноту.' },
    ] },
    variations: { label: 'Варианты для билда и дропа', icon: '📸', note: 'Macro Variations: сохрани «куплет» и «дроп» как снимки и переключай одним кликом (или автоматизацией).', set: [
      { c: 'macro1', v: 30, t: 'вариант «куплет»', w: 'Выставь макросы → New в Macro Variations.' },
      { c: 'macro2', v: 100, t: 'вариант «дроп»', w: 'Поменяй макросы → ещё раз New. Launch — мгновенный переход.' },
    ] },
  },
  styles: {
    house: { note: 'Chord + Arpeggiator под макросами — стабы и пиано.', set: [{ c: 'macro2', v: 12, t: 'Distance +12', w: 'House: октавный подъём арпа в брейке.', only: ['arpmacro'] }] },
    techhouse: { note: 'Рифф из арпа и Note Length — длина нот на макросе.', set: [{ c: 'macro1', v: 0, t: 'Steps = 0', w: 'Tech house: рифф в одной октаве.', only: ['arpmacro'] }] },
    techno: { note: 'Гипнотичный арп, Rand для поиска вариаций.', set: [{ c: 'macro1', v: 0, t: 'Steps = 0', w: 'Techno: без переноса — гипноз.', only: ['arpmacro'] }] },
    melodic: { note: 'Арп с переносом на октаву, лад на ручке.', set: [{ c: 'macro1', v: 2, t: 'Steps = 2', w: 'Melodic: две октавы вверх в кульминации.', only: ['arpmacro'] }] },
    afro: { note: 'Velocity-зоны: акценты перкуссии с эхом.', set: [{ c: 'velzones', v: true, w: 'Afro: эхо только на сильных ударах.', only: ['velsplit'] }] },
    organic: { note: 'Мягкие переходы между вариантами.', set: [{ c: 'chainzones', v: true, w: 'Organic: плавные края зон (fade) — мягкая смена.', only: ['scaleswitch'] }] },
    garage: { note: 'Сплит: бас левой рукой, аккорды правой.', set: [{ c: 'keyzones', v: true, w: 'Garage: живая игра двумя руками.', only: ['split'] }] },
    downtempo: { note: 'Снимки макросов для частей трека.', set: [{ c: 'map', v: false, w: 'Downtempo: макросы назначены — играем вариациями.', only: ['variations'] }] },
    ambient: { note: 'Медленная автоматизация макросов.', set: [{ c: 'macro1', v: 64, t: 'медленно 0 → 127', w: 'Ambient: автоматизация на десятки тактов.', only: ['variations', 'arpmacro'] }] },
  },
  hacks: [
    { h: 'Группировка за секунду', t: 'Выдели заголовки нескольких MIDI-эффектов → правый клик → Group — рэк готов. Ungroup (меню Edit или правый клик) — разобрать обратно.' },
    { h: 'Rand для идей', t: 'Кнопка Rand в заголовке рэка меняет все назначенные макросы случайно. Исключи макросы, которые трогать нельзя.' },
    { h: 'Изучи готовые рэки', t: 'Core Library → MIDI Effect Racks: Arp Chord, Arp Harmony, Scale Driver, Keys & Scales, Echo Note Bounce. Открой и посмотри макросы и цепочки.' },
    { h: 'Быстрый поиск устройства', t: 'Правый клик по селектору Device View — список всех устройств во всех вложенных рэках.' },
    { h: 'Инвертированный макрос', t: 'В Mapping Browser поставь Min больше Max — ручка работает наоборот (или Invert Range).' },
  ],
  factoryFolder: 'Core Library → Racks → MIDI Effect Racks',
  factory: [
    { name: 'Arp Chord', use: 'аккорд + арп', vals: [['Цепочка', 'Chord → Arpeggiator'], ['Макросы', 'Transp Steps, Transp Distnce']] },
    { name: 'Arp Harmony', use: 'арп с гармонией и случайностью', vals: [['Цепочка', 'Arpeggiator → Chord → Pitch → 2 × Random → Velocity → вложенный рэк со Scale'], ['Макросы', 'Arp Style, Arp Rate, Arp Distance, Random Notes, Harmony 1/2']] },
    { name: 'Scale Driver', use: 'случайные ноты в ладу', vals: [['Цепочка', 'Random → Scale → Velocity'], ['Макросы', 'Velo Drive, Transp']] },
    { name: 'Keys & Scales', use: 'лад одной ручкой', vals: [['Цепочки', '10 × Scale (Major … Major Pentatonic)'], ['Макросы', 'Key, Scale']] },
    { name: 'Echo Single Strum', use: 'перебор с эхом', vals: [['Цепочка', 'Envelope MIDI → Note Echo → Chord → Arpeggiator'], ['Макросы', 'Delay Time, Feed Back, Strum Off/On, Strum Tighten…']] },
    { name: 'Arp Double', use: 'два арпа параллельно', vals: [['Цепочки', 'Arpeggiator + Chord | Arpeggiator'], ['Макросы', 'Synced Rate A/B, Transp Steps A/B, Gate A/B']] },
  ],
  chain: 'MIDI Effect Rack (Chord → Arpeggiator → Scale) → инструмент. Рэк целиком сохраняется как пресет.',
  src: [['Мануал Live 12: Racks', 'https://www.ableton.com/en/live-manual/12/instrument-drum-and-effect-racks/#an-overview-of-racks'], ['Мануал Live 12: Zones', 'https://www.ableton.com/en/live-manual/12/instrument-drum-and-effect-racks/#zones'], ['Мануал Live 12: Macro Controls', 'https://www.ableton.com/en/live-manual/12/instrument-drum-and-effect-racks/#using-the-macro-controls']],
});
