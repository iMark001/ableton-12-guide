/* Scale — мануал Live 12 (Live MIDI Effect Reference → Scale). Диапазоны — из заводских пресетов Live 12.4:
   Base — 12 нот, Scale Name — 36 ладов (названия = заводские пресеты), Transpose −36…+36 st, Lowest 0…127, Range 0…128.
   Практика — исследование C (лады по стилям, Pro tips). Нотация Ableton: C3 = MIDI 60. */
registerDevice({
  id: 'scale',
  pickLabel: 'Задача',
  what: 'Переназначает ноты по ладу: каждая входящая нота заменяется на «разрешённую». Играешь любые клавиши — звучат только ноты выбранного лада. Ещё умеет транспонировать партию и работать только в части клавиатуры.',
  when: [
    'Играешь вживую и боишься «чужих» нот — все клавиши попадают в лад.',
    'Нужно сменить лад партии: минор → дорийский или фригийский.',
    'Перенести мелодию в другую тональность (Transpose).',
    'Генеративные цепочки: Random → Scale — случайные ноты, но в ладу.',
  ],
  how: [
    'Поставь Scale перед инструментом (после Random или Arpeggiator, если они есть).',
    'Включи Use Current Scale — лад берётся из клипа. Или выбери Base и Scale Name вручную.',
    'Матрица показывает: столбец — входящая нота, строка — что прозвучит.',
    'Transpose сдвигает всё на ±36 полутонов.',
    'Lowest и Range ограничивают, какие ноты обрабатываются.',
  ],
  parts: ['lead', 'keys', 'arp'],
  controls: [
    { id: 'ucs', name: 'Use Current Scale', kind: 'toggle', desc: 'Берёт корень и лад из клипа. Base и Scale Name при этом отключаются.' },
    { id: 'base', name: 'Base', kind: 'switch', opts: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], desc: 'Корень лада (нижний левый угол матрицы).' },
    { id: 'scalename', name: 'Scale Name', kind: 'switch', opts: ['Major', 'Minor', 'Dorian', 'Phrygian', 'Mixolydian', 'Lydian', 'Minor Pentatonic', 'Major Pentatonic', 'Harmonic Minor', 'Phrygian Dominant', 'User'], desc: 'Лад. Всего в Live 36 ладов (от Major до Hirajoshi и Pelog); здесь — главные для клубной музыки. User — свой лад: кликами по матрице.' },
    { id: 'transpose', name: 'Transpose', kind: 'knob', min: -36, max: 36, unit: 'st', range: '−36…+36 st', desc: 'Сдвиг всех нот. Пример из мануала: мелодия в C major → G major = +7 st.' },
    { id: 'lowest', name: 'Lowest', kind: 'knob', min: 0, max: 127, unit: '', range: '0…127 (C−2…G8)', desc: 'Нижняя нота зоны, где работает переназначение.' },
    { id: 'range', name: 'Range', kind: 'knob', min: 0, max: 128, unit: '', range: '0…128 полутонов', desc: 'Ширина зоны вверх от Lowest. Ноты вне зоны проходят без изменений.' },
    { id: 'fold', name: 'Fold', kind: 'toggle', desc: 'Только для User: если нота уходит дальше 6 полутонов, она «складывается» в ближайшую октаву (C3 → A2 вместо A3).' },
  ],
  extra: [
    { name: 'Note Matrix', range: '13 × 13', desc: 'Сетка: столбцы — входящие ноты, строки — выходящие. Убери квадрат — эта нота перестанет звучать.' },
    { name: 'Все лады Live', range: '36', desc: 'Major, Minor, Dorian, Mixolydian, Lydian, Phrygian, Locrian, Whole Tone, Half-Whole/Whole-Half Diminished, Minor/Major Pentatonic, Minor Blues, Harmonic Minor/Major, Melodic Minor, Phrygian Dominant, Hungarian Minor, Hirajoshi, In-Sen, Iwato, Kumoi, Pelog, Messiaen 3–7 и другие.' },
  ],
  presets: {
    safe: { label: 'Все ноты в ладу трека (живая игра)', icon: '🎯', note: 'Включи Scale у клипа или в Control Bar — устройство подхватит корень и лад.', set: [
      { c: 'ucs', v: true, w: 'Лад берётся из клипа — ничего не надо выбирать.' },
      { c: 'transpose', v: 0, w: 'Без сдвига.' },
      { c: 'range', v: 128, t: 'вся клавиатура', w: 'Работает на всех нотах.' },
    ] },
    penta: { label: 'Хук из минорной пентатоники', icon: '⚡', note: 'В Am это A C D E G — почти никогда не конфликтует с аккордами i, III, iv, v, VI, VII.', set: [
      { c: 'ucs', v: false, w: 'Свой лад, независимо от клипа.' },
      { c: 'base', v: 'A', w: 'Корень трека (пример — ля).' },
      { c: 'scalename', v: 'Minor Pentatonic', w: '5 нот — любая клавиша даёт «правильную» ноту хука.' },
    ] },
    dorian: { label: 'Светлее: дорийский (soulful, afro)', icon: '☀️', note: 'Одна нота (в Am — F#) делает трек «солнечным». Подходит к мажорному IV (D в Am).', set: [
      { c: 'ucs', v: false, w: 'Лад задаём вручную.' },
      { c: 'base', v: 'A', w: 'Корень трека.' },
      { c: 'scalename', v: 'Dorian', w: 'Минор с поднятой 6-й ступенью.' },
    ] },
    phrygian: { label: 'Темнее: фригийский (techno)', icon: '🌑', note: 'Полутон над тоникой (A ↔ Bb) — мрачный колорит техно.', set: [
      { c: 'ucs', v: false, w: 'Лад вручную.' },
      { c: 'base', v: 'A', w: 'Корень трека.' },
      { c: 'scalename', v: 'Phrygian', w: 'Минор с пониженной 2-й ступенью.' },
    ] },
    eastern: { label: 'Восточный колорит (organic house)', icon: '🏜️', note: 'Аккорды A – Bb – A и мелодия по ладу — «восточная» органика.', set: [
      { c: 'ucs', v: false, w: 'Лад вручную.' },
      { c: 'base', v: 'A', w: 'Корень трека.' },
      { c: 'scalename', v: 'Phrygian Dominant', w: 'Фригийский с мажорной терцией.' },
    ] },
    transpose: { label: 'Перенести партию в другую тональность', icon: '🔀', note: 'Пример из мануала: C major → G major = Transpose +7 st. Формула: сдвиг = цель − источник (C=0 … B=11), больше +6 — вычти 12.', set: [
      { c: 'ucs', v: false, w: 'Работаем с исходным ладом партии.' },
      { c: 'base', v: 'C', w: 'Исходная тональность.' },
      { c: 'scalename', v: 'Major', w: 'Исходный лад.' },
      { c: 'transpose', v: 7, w: '+7 st: до мажор → соль мажор.' },
    ] },
    zone: { label: 'Только часть клавиатуры', icon: '🎹', note: 'Пример из мануала: Lowest C2, Range +36 — переназначаются только ноты C2…B4, остальные без изменений.', set: [
      { c: 'lowest', v: 48, t: 'C2', w: 'Нижняя граница зоны.' },
      { c: 'range', v: 36, w: '+36 — три октавы вверх.' },
      { c: 'transpose', v: 7, w: 'Сдвиг только внутри зоны: бас слева остаётся на месте.' },
    ] },
  },
  styles: {
    house: { note: 'Минор и дорийский (soulful).', set: [{ c: 'scalename', v: 'Dorian', w: 'House: дорийский IV — тёплый soulful-колорит.', only: ['dorian', 'penta'] }] },
    techhouse: { note: 'Минор или фригийский рифф root ↔ полутон.', set: [{ c: 'scalename', v: 'Minor', w: 'Tech house: простой минор под рифф.', only: ['penta', 'dorian'] }] },
    techno: { note: 'Фригийский и минор, педаль на тонике.', set: [{ c: 'scalename', v: 'Phrygian', w: 'Techno: тёмный полутон.', only: ['penta', 'dorian', 'phrygian'] }] },
    melodic: { note: 'Минор и гармонический минор (мажорный V — драма).', set: [{ c: 'scalename', v: 'Harmonic Minor', w: 'Melodic: кинематографичная драма.', only: ['dorian', 'phrygian', 'penta'] }] },
    afro: { note: 'Минор/дорийский, пентатоника для маримбы.', set: [{ c: 'scalename', v: 'Minor Pentatonic', w: 'Afro: мотивы маримбы и калимбы.', only: ['penta', 'dorian'] }] },
    organic: { note: 'Минор, дорийский, восточный Phrygian Dominant.', set: [{ c: 'scalename', v: 'Phrygian Dominant', w: 'Organic: восточный колорит.', only: ['eastern', 'phrygian'] }] },
    garage: { note: 'Минор и мажор с септаккордами.', set: [{ c: 'scalename', v: 'Minor', w: 'Garage: минорные m7/m9.', only: ['penta', 'dorian', 'phrygian'] }] },
    downtempo: { note: 'Минор и мажор, джазовые обороты.', set: [{ c: 'scalename', v: 'Dorian', w: 'Downtempo: мягкий дорийский.', only: ['penta', 'phrygian'] }] },
    ambient: { note: 'Мажор и лидийский — «мечтательно».', set: [{ c: 'scalename', v: 'Lydian', w: 'Ambient: лидийский — светлый, «плывущий».', only: ['penta', 'dorian', 'phrygian', 'eastern'] }] },
  },
  hacks: [
    { h: 'Random → Scale', t: 'Random перед Scale: случайные ноты сразу попадают в лад. Так устроен рэк Scale Driver из Core Library (Random → Scale → Velocity).' },
    { h: 'Переключатель ладов', t: 'Рэк Keys & Scales (Core Library → MIDI Effect Racks → Utility): 10 цепочек со Scale и макросы Key и Scale — лад меняется одной ручкой.' },
    { h: 'Убрать ноту из лада', t: 'Выбери User и кликни по квадрату в матрице — эта нота больше не прозвучит, даже если её сыграть.' },
    { h: 'Use Current Scale везде', t: 'Тот же переключатель есть у Arpeggiator, Chord, Pitch и Random — одна настройка лада в клипе управляет всей цепочкой.' },
  ],
  factoryFolder: 'Scale (MIDI Effects)',
  factory: [
    { name: 'Minor', use: 'натуральный минор', vals: [['Base', 'C'], ['Scale Name', 'Minor']] },
    { name: 'Dorian', use: 'минор посветлее', vals: [['Base', 'C'], ['Scale Name', 'Dorian']] },
    { name: 'Phrygian', use: 'минор потемнее', vals: [['Base', 'C'], ['Scale Name', 'Phrygian']] },
    { name: 'Phrygian Dominant', use: 'восточный колорит', vals: [['Base', 'C'], ['Scale Name', 'Phrygian Dominant']] },
    { name: 'Minor Pentatonic', use: 'хуки и мотивы', vals: [['Base', 'C'], ['Scale Name', 'Minor Pentatonic']] },
    { name: 'Hirajoshi', use: 'японский лад — экзотика', vals: [['Base', 'C'], ['Scale Name', 'Hirajoshi']] },
  ],
  chain: 'Random → Scale → Velocity → инструмент. Или Arpeggiator → Scale, чтобы транспонированный арп не выходил из лада.',
  src: [['Мануал Live 12: Scale', 'https://www.ableton.com/en/live-manual/12/live-midi-effect-reference/#scale']],
});
