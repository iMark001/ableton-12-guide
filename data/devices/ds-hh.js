/* DS HH — мануал Live 12 (Max for Live Devices → DS HH). Диапазоны — из параметров DS HH в «DS Drum Rack»
   (Core Library, Live 12.4): Noise Color White/Pink, Filter Slope 12/24, Volume −70…+18 dB; Tone, Attack, Pitch, Decay —
   шкала 0…100 без единиц в мануале, значения словами. Рецепты — data/parts-drums.js. */
registerDevice({
  id: 'ds-hh',
  pickLabel: 'Тип звука',
  what: 'Синтезатор хэтов: смесь шума и синусоид. Тональная часть проходит через резонансный high-pass фильтр. Из одного устройства — и короткий закрытый хэт, и шипящий открытый.',
  when: [
    'Закрытые хэты шестнадцатыми — держат темп.',
    'Открытый хэт на офбит — «качание» house.',
    'Мягкие хэты для organic и downtempo (розовый шум).',
    'Короткие «тики» для перкуссионного рисунка.',
  ],
  how: [
    'Поставь DS HH в Drum Rack (закрытый обычно F#1, открытый A#1).',
    'Noise: White — ярче, Pink — мягче.',
    'Tone — срез high-pass: выше — только верх.',
    'Decay: очень коротко — закрытый, длиннее — открытый.',
    'Filter Slope 12 или 24 dB, Attack — мягкость начала, Pitch — общая высота.',
  ],
  parts: ['hats'],
  controls: [
    { id: 'noise', name: 'Noise', kind: 'switch', opts: ['White', 'Pink'], desc: 'Тип шума: White (белый) — ярче, Pink (розовый) — мягче, темнее.' },
    { id: 'tone', name: 'Tone', kind: 'knob', min: 0, max: 100, unit: '%', desc: 'Срез high-pass фильтра. Выше — меньше низа, звук тоньше и ярче.' },
    { id: 'slope', name: 'Filter Slope', kind: 'switch', opts: ['12', '24'], desc: 'Крутизна резонансного high-pass фильтра тональной части: 12 или 24 dB на октаву. 24 — резче отрезает низ.' },
    { id: 'attack', name: 'Attack', kind: 'knob', min: 0, max: 100, unit: '%', desc: 'Атака тональной части: минимум — резкий «тик», больше — мягкое начало.' },
    { id: 'pitch', name: 'Pitch', kind: 'knob', min: 0, max: 100, unit: '%', desc: 'Общая высота хэта.' },
    { id: 'decay', name: 'Decay', kind: 'knob', min: 0, max: 100, unit: '%', desc: 'Длина: коротко — закрытый хэт, длиннее — открытый.' },
    { id: 'volume', name: 'Volume', kind: 'knob', min: -70, max: 18, unit: 'dB', range: '−70…+18 dB', desc: 'Общая громкость инструмента.' },
  ],
  extra: [
    { name: 'Предпрослушка', range: '—', desc: 'Клик в верхней половине дисплея проигрывает звук.' },
  ],
  presets: {
    closed: { label: 'Закрытый хэт 1/16', icon: '🪇', note: 'MIDI: шестнадцатые, громче на офбитах (шаги 3, 7, 11, 15).', set: [
      { c: 'noise', v: 'White', w: 'Ярче — хэт читается поверх всего.' },
      { c: 'tone', v: 85, t: 'высоко', w: 'Только верх, без «мути».' },
      { c: 'slope', v: '24', w: 'Резче отрезает низ.' },
      { c: 'decay', v: 15, t: 'очень коротко', w: 'Держит темп и не мешает остальному.' },
      { c: 'attack', v: 0, t: 'минимум', w: 'Чёткий «тик».' },
    ] },
    open: { label: 'Открытый хэт на офбит', icon: '🏠', note: 'MIDI: шаги 3, 7, 11, 15 — между киками, классический house-офбит.', set: [
      { c: 'noise', v: 'White', w: 'White или Pink (мягче) — по вкусу.' },
      { c: 'tone', v: 65, t: 'средне-высоко', w: 'Есть тело, но без низа.' },
      { c: 'decay', v: 60, t: 'длиннее', w: 'Шипит до следующего удара.' },
      { c: 'attack', v: 0, t: 'минимум', w: 'Чёткое начало на офбите.' },
    ] },
    soft: { label: 'Мягкий хэт (organic, downtempo)', icon: '🌿', set: [
      { c: 'noise', v: 'Pink', w: 'Розовый шум мягче и теплее.' },
      { c: 'tone', v: 60, t: 'чуть выше середины', w: 'Не режет уши.' },
      { c: 'slope', v: '12', w: 'Мягче срез.' },
      { c: 'attack', v: 15, t: 'чуть больше минимума', w: 'Начало мягче — «шорох», а не «тик».' },
      { c: 'decay', v: 30, t: 'коротко–средне', w: 'Живее, чем у техно-хэта.' },
    ] },
    tick: { label: 'Короткий «тик» для перкуссии', icon: '⏱️', set: [
      { c: 'decay', v: 5, t: 'минимум', w: 'Только щелчок.' },
      { c: 'tone', v: 95, t: 'почти максимум', w: 'Только самый верх.' },
      { c: 'slope', v: '24', w: 'Никакого низа.' },
      { c: 'pitch', v: 70, t: 'выше середины', w: 'Звонче — отличается от основного хэта.' },
    ] },
  },
  styles: {
    house: { note: 'Открытый хэт на офбитах — главное «качание».', set: [{ c: 'decay', v: 60, t: 'длиннее', w: 'House: офбит шипит до следующего кика.', only: ['open'] }] },
    techhouse: { note: 'Яркие короткие хэты, свинг 56–58 % в Groove Pool.', set: [{ c: 'noise', v: 'White', w: 'Tech house: ярко.', only: ['closed', 'open'] }] },
    techno: { note: 'Короткие жёсткие хэты, часто ровно, без свинга.', set: [{ c: 'decay', v: 10, t: 'очень коротко', w: 'Techno: сухой гипнотичный пульс.', only: ['closed', 'tick'] }] },
    melodic: { note: 'Хэты чуть тише и мягче — место пэдам.', set: [{ c: 'volume', v: -6, w: 'Melodic: хэты на заднем плане.', only: ['closed', 'open'] }] },
    afro: { note: 'Хэты + перкуссия 3-3-2, свинг 56–62 %.', set: [{ c: 'noise', v: 'Pink', w: 'Afro: мягче, ближе к шейкеру.', only: ['closed', 'soft'] }] },
    organic: { note: 'Мягкие, «бумажные» хэты.', set: [{ c: 'noise', v: 'Pink', w: 'Organic: тепло.' }, { c: 'attack', v: 15, t: 'чуть мягче', w: 'Шорох вместо щелчка.', not: ['tick'] }] },
    garage: { note: 'Скипающие хэты со свингом 58–66 %.', set: [{ c: 'decay', v: 20, t: 'коротко', w: 'Garage: короткие хэты подчёркивают свинг.', only: ['closed', 'tick'] }] },
    downtempo: { note: 'Мягко и неспешно.', set: [{ c: 'noise', v: 'Pink', w: 'Downtempo: мягкий шум.' }] },
    ambient: { note: 'Хэты как текстура, тихо.', set: [{ c: 'volume', v: -12, w: 'Ambient: едва слышно.' }] },
  },
  hacks: [
    { h: 'Открытый глушит закрытый', t: 'В Drum Rack поставь закрытый и открытый хэт в одну Choke-группу — открытый обрывается при ударе закрытого, как на живой установке.' },
    { h: 'Живая динамика', t: 'MIDI-эффект Velocity с небольшим Random перед Drum Rack — хэты перестанут звучать «машинно».' },
    { h: 'Свинг', t: 'Groove Pool: шаблоны Swing 16ths 54–61 (Core Library → Grooves → Swing). Global Groove Amount по умолчанию 0 % — подними.' },
    { h: 'Предпрослушка', t: 'Клик в верхней половине дисплея проигрывает хэт — подбирай Tone на слух.' },
  ],
  factoryFolder: 'Core Library → Racks → Drum Racks (DS Drum Rack)',
  factory: [
    { name: 'DS Drum Rack — пэд F#1', use: 'короткий яркий хэт', vals: [['Noise', 'White'], ['Filter Slope', '24'], ['Tone', '91 из 100'], ['Attack', '1.6 из 100'], ['Pitch', '41 из 100'], ['Decay', '54 из 100'], ['Volume', '−13.2 dB']] },
    { name: 'DS Drum Rack — пэд G#1', use: 'тёмный хэт с открытым фильтром', vals: [['Noise', 'White'], ['Tone', '0'], ['Pitch', '54 из 100'], ['Decay', '68 из 100'], ['Volume', '−2.1 dB']] },
    { name: 'DS Drum Rack — пэд A#1', use: 'средний хэт', vals: [['Noise', 'White'], ['Tone', '60 из 100'], ['Pitch', '41 из 100'], ['Decay', '58 из 100'], ['Volume', '−15.5 dB']] },
  ],
  chain: 'DS HH (в Drum Rack) → EQ Eight (убрать низ) → на группе ударных Drum Buss или Glue Compressor. Свинг — через Groove Pool.',
  src: [['Мануал Live 12: DS HH', 'https://www.ableton.com/en/live-manual/12/max-for-live-devices/#ds-hh']],
});
