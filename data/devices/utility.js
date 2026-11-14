/* Utility — мануал Live 12 (Live Audio Effect Reference → Utility); диапазоны и заводские пресеты — Core Library Live 12.4.6
   (Gain −∞…+35 dB, Width 0…400 %, Bass Mono 50…500 Hz, Balance 50L…50R).
   Значения по партиям и стилям — стартовые точки из практики сведения (Toolroom, Producer School, EDMProd). */
registerDevice({
  id: 'utility',
  what: 'Маленький «швейцарский нож»: громкость, панорама, ширина стерео, моно, моно только для низа (Bass Mono), переворот фазы. Ставится почти на каждую дорожку — в начале цепочки, чтобы выставить уровень, и в конце, чтобы собрать низ в моно.',
  when: [
    'Сэмпл слишком громкий или тихий до обработки — Gain в начале цепочки.',
    'Кик и саб должны быть строго в моно — Width 0 % или Mono.',
    'Бас, пэд или шина: низ в моно, верх в стерео — Bass Mono 100–150 Hz.',
    'Сделать звук шире или уже — Width.',
    'Проверить микс в моно на мастере и автоматизировать громкость, не трогая фейдер.',
  ],
  how: [
    'Поставь Utility первым и выставь Gain: пики дорожки около −12…−6 dBFS.',
    'Второй Utility — последним в цепочке: Width и Bass Mono.',
    'На басу и шинах включи Bass Mono и подбери частоту, слушая Bass Mono Audition (наушники).',
    'Кику и сабу — Width 0 % (или кнопка Mono).',
    'Громкостные «въезды» и спады пиши автоматизацией Gain, фейдер оставь для баланса.',
  ],
  parts: ['kick', 'bass', 'pad', 'lead', 'hats', 'fx', 'mixbus', 'master'],
  controls: [
    { id: 'gain', name: 'Gain', kind: 'knob', min: -70, max: 35, unit: 'dB', range: '−∞…+35 dB', desc: 'Громкость входа. Между −18 и +35 dB стрелки на клавиатуре меняют её по 1 dB. Удобно для автоматизации, пока фейдер держит баланс микса.' },
    { id: 'width', name: 'Width', kind: 'knob', min: 0, max: 400, unit: '%', range: '0…400 %', desc: 'Ширина стерео. 0 % — моно, 100 % — как есть, больше — шире. Через контекстное меню меняется на Mid/Side (100M…100S).' },
    { id: 'mono', name: 'Mono', kind: 'toggle', desc: 'Сводит стерео в моно.' },
    { id: 'bassmono', name: 'Bass Mono', kind: 'toggle', desc: 'Делает моно только низкие частоты — на мощной системе и в моно низ не «плывёт».' },
    { id: 'bmfreq', name: 'Bass Mono Frequency', kind: 'knob', min: 50, max: 500, curve: 'log', unit: 'Hz', range: '50…500 Hz', desc: 'Ниже этой частоты — моно. Подбирай с кнопкой Bass Mono Audition (слышно только низ).' },
    { id: 'balance', name: 'Balance', kind: 'knob', min: -50, max: 50, unit: '', range: '50L…50R', desc: 'Панорама: влево или вправо.' },
    { id: 'chmode', name: 'Channel Mode', kind: 'switch', opts: ['Left', 'Stereo', 'Right'], desc: 'Left — только левый канал на оба выхода, Right — только правый. Width и Mid/Side при этом не работают.' },
    { id: 'phase', name: 'Phase L / R', kind: 'toggle', desc: 'Переворачивает фазу канала (две кнопки: левый и правый).' },
    { id: 'dc', name: 'DC', kind: 'toggle', desc: 'Убирает постоянное смещение и сверхнизкие частоты. Слышно, только если после Utility стоят компрессор или дисторшн.' },
    { id: 'mute', name: 'Mute', kind: 'toggle', desc: 'Глушит вход. Поставь Utility перед дилеем или ревербом — вход замолчит, а хвост доиграет.' },
  ],
  extra: [
    { name: 'Mid/Side', range: '100M…100S', desc: 'Вместо Width (контекстное меню): 100M — только центр (моно), 100S — только края.' },
    { name: 'Bass Mono Audition', range: 'наушники', desc: 'Слышно только низ ниже Bass Mono Frequency — удобно подобрать частоту.' },
  ],
  presets: {
    kick: { label: 'Кик и саб', note: 'Саб — так же: Width 0 %.', set: [
      { c: 'gain', v: 0, t: 'по уровню', w: 'Первый Utility: кик соло — пик около −10…−6 dBFS. Кик — «якорь» громкости микса.' },
      { c: 'width', v: 0, w: 'Кик и саб всегда в моно.' },
    ] },
    bass: { label: 'Бас', set: [
      { c: 'bassmono', v: true, w: 'Низ в моно, верх может быть стерео.' },
      { c: 'bmfreq', v: 120, w: 'Обычно 100–150 Hz.' },
      { c: 'width', v: 100, w: 'Ширину верха не трогаем.' },
    ] },
    pad: { set: [
      { c: 'bassmono', v: true, w: 'Низ пэда в моно.' },
      { c: 'bmfreq', v: 120, w: '120 Hz.' },
      { c: 'width', v: 115, w: '100–130 % — шире, но без фазовых проблем.' },
    ] },
    lead: { label: 'Лид / синт', set: [
      { c: 'width', v: 120, w: '110–130 % — ширина без хоруса.' },
      { c: 'bassmono', v: true, w: 'Низ лида — в моно.' },
      { c: 'bmfreq', v: 150, w: 'Чуть выше: у лида низ не главный.' },
    ] },
    hats: { label: 'Хэты и перкуссия', set: [
      { c: 'balance', v: -30, t: '30L', w: 'Раскладка: конга влево, бонго вправо (±20–40).' },
      { c: 'width', v: 100, w: 'Стерео как есть.' },
    ] },
    fx: { label: 'FX / атмосферы', set: [
      { c: 'width', v: 135, w: '120–150 % — FX широкие, центр свободен для кика и баса.' },
      { c: 'gain', v: 0, t: 'автоматизация', w: 'Автоматизируй Gain — «въезд» райзера.' },
    ] },
    mixbus: { label: 'Музыкальная шина', set: [
      { c: 'bassmono', v: true, w: 'Низ всей группы в моно.' },
      { c: 'bmfreq', v: 120, w: '120 Hz — стартовая точка.' },
    ] },
    master: { label: 'Мастер (Main)', note: 'Первый Utility на мастере — трим входа, второй — кнопка Mono только для проверки.', set: [
      { c: 'gain', v: 0, t: 'трим', w: 'Перед лимитером пики около −6 dBFS.' },
      { c: 'mono', v: true, w: 'Проверка: 10 секунд в моно. Пропал лид или пэд — фазовая проблема. Перед экспортом выключи!' },
    ] },
  },
  styles: {
    house: { note: 'Пэды и стабы — умеренно широкие.', set: [{ c: 'width', v: 120, w: 'House: пэд в фоне, 100–130 %.', only: ['pad'] }] },
    techhouse: { note: 'Плотный моно-низ, широкие FX.', set: [{ c: 'width', v: 150, w: 'Tech house: FX на максимум диапазона 120–150 %.', only: ['fx'] }] },
    techno: { note: 'Лид почти моно, низ строго в центре.', set: [{ c: 'width', v: 50, w: 'Techno: лид почти моно.', only: ['lead'] }] },
    melodic: { note: 'Широкие лиды и пэды.', set: [{ c: 'width', v: 130, w: 'Melodic: шире, верх диапазона 110–130 %.', only: ['lead', 'pad'] }] },
    afro: { note: 'Перкуссия разведена по панораме.', set: [{ c: 'balance', v: -35, t: '35L', w: 'Afro: конги и бонги на ±20–40.', only: ['hats'] }] },
    organic: { note: 'Полевые записи и атмосферы — мягкая ширина.', set: [{ c: 'width', v: 110, w: 'Organic: мягкий Width.', only: ['fx'] }] },
    garage: { note: 'Органный или Reese-бас с хорусом — низ строго в моно.', set: [{ c: 'bmfreq', v: 150, w: 'Garage: моно-низ повыше.', only: ['bass'] }] },
    downtempo: { note: 'Спокойная стереокартина.', set: [{ c: 'width', v: 100, w: 'Downtempo: без лишней ширины.', only: ['pad'] }] },
    ambient: { note: 'Пэд и атмосферы — главные слои.', set: [{ c: 'width', v: 130, w: 'Ambient: пэд шире.', only: ['pad'] }, { c: 'width', v: 150, w: 'Атмосферы широкие.', only: ['fx'] }] },
  },
  hacks: [
    { h: 'Шаг по 1 dB', t: 'Кликни по Gain и жми стрелки вверх/вниз: между −18 и +35 dB шаг ровно 1 dB. Или набери число с клавиатуры и Enter.' },
    { h: 'Хвост доигрывает', t: 'Utility с Mute перед Echo или Reverb: вход глушится, а хвост эффекта звучит до конца — удобно для «выбросов» в конце фразы (совет мануала).' },
    { h: 'Сайдчейн без компрессора', t: 'LFO или Shaper (Max for Live) → Map на Gain у Utility в конце цепочки, Rate 1/4: ровная «качка», не зависящая от кика.' },
    { h: 'Подбор Bass Mono на слух', t: 'Включи Bass Mono Audition — слышно только низ. Поднимай частоту, пока в моно не уйдёт весь гул, но верх ещё не сузился.' },
    { h: 'Нуль-тест', t: 'Две одинаковые дорожки, на одной Utility с переворотом фазы обеих кнопок — должна быть тишина. Звук остался — значит, версии отличаются.' },
    { h: 'Громкость отдельно от баланса', t: 'Фейды и «въезды» пиши в Gain у Utility, а фейдер дорожки оставь для баланса микса — так советует мануал.' },
  ],
  factoryFolder: 'Utility',
  factory: [
    { name: 'Bass Mono', use: 'низ в моно', vals: [['Bass Mono', 'On'], ['Bass Mono Frequency', '120 Hz']] },
    { name: 'Mono', use: 'весь сигнал в моно', vals: [['Mono', 'On']] },
    { name: 'Wide Stereo', use: 'шире', vals: [['Width', '200 %']] },
    { name: 'Narrow Stereo', use: 'уже', vals: [['Width', '50 %']] },
    { name: 'Mid Only', use: 'только центр', vals: [['Mid/Side', '100M']] },
    { name: 'Sides Only', use: 'только края', vals: [['Mid/Side', '100S']] },
    { name: 'Left', use: 'только левый канал', vals: [['Channel Mode', 'Left']] },
    { name: 'Phase Invert', use: 'перевернуть фазу', vals: [['Phase L', 'On'], ['Phase R', 'On']] },
  ],
  chain: 'Начало цепочки: Utility (Gain) → EQ Eight → Compressor → Saturator → Utility (Width, Bass Mono). На мастере: Utility (трим) → … → Limiter → Utility (Mono — только для проверки).',
  src: [['Мануал Live 12: Utility', 'https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#utility'], ['EDMProd: gain staging', 'https://www.edmprod.com/gain-staging/'], ['Toolroom: low end', 'https://toolroomacademy.com/features/4-ways-to-fix-your-low-end/']],
});
