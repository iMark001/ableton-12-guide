/* Cabinet (совместно с Softube) — мануал Live 12; 11 заводских пресетов — из Live 12.4.6.
   Номера Speaker сверены с названиями пресетов (1x12, 2x12, 4x12, 4x10, 4x10 Bass); Microphone — по порядку из мануала
   (Near On-Axis, Near Off-Axis, Far). Тип микрофона в пресетах не указан: по данным нельзя понять, какое положение — Dynamic. */
registerDevice({
  id: 'cabinet',
  what: 'Эмуляция пяти гитарных колонок с виртуальным микрофоном (сделано вместе с Softube). Ставится после Amp: усилитель без колонки звучит резко и «плоско». Сам по себе Cabinet — быстрый способ сделать звук «маленьким», «комнатным» или lo-fi.',
  when: [
    'После Amp — чтобы гитара звучала как настоящий комбик.',
    'Барабанам нужна «маленькая комната» (заводские Small Drum Room, Studio Room).',
    'Синт или вокальные чопы — эффект «маленького динамика».',
    'Бас-гитара или синт-бас — колонка 4x10 Bass.',
  ],
  how: [
    'Поставь Cabinet сразу после Amp.',
    'Выбери Speaker: число динамиков × размер в дюймах (4x12 — четыре 12-дюймовых).',
    'Microphone: Near On-Axis — ярко и сфокусировано, Near Off-Axis — резонанснее и мягче, Far — баланс с «комнатой».',
    'Dynamic — грязнее (классика ближнего микрофона), Condenser — точнее (обычно на расстоянии).',
    'Dry/Wet ниже 100 % — колонка только окрашивает звук.',
  ],
  parts: ['guitar'],
  controls: [
    { id: 'speaker', name: 'Speaker', kind: 'switch', opts: ['1x12', '2x12', '4x12', '4x10', '4x10 Bass'], desc: 'Колонка: число динамиков × размер в дюймах. В реальности больше и крупнее динамики — громче.' },
    { id: 'mic', name: 'Microphone', kind: 'switch', opts: ['Near On-Axis', 'Near Off-Axis', 'Far'], desc: 'Положение микрофона. Near On-Axis — ярко и сфокусировано, Near Off-Axis — резонанснее и чуть темнее, Far — сбалансированно и с «комнатой».' },
    { id: 'mictype', name: 'Dynamic / Condenser', kind: 'switch', opts: ['Dynamic', 'Condenser'], desc: 'Динамический микрофон — грязнее, его ставят вплотную к громким колонкам. Конденсаторный — точнее, его ставят на расстоянии.' },
    { id: 'output', name: 'Output', kind: 'switch', opts: ['Mono', 'Dual'], desc: 'Моно или стерео (Dual) обработка. Dual нагружает процессор вдвое.' },
    { id: 'drywet', name: 'Dry/Wet', kind: 'knob', min: 0, max: 100, unit: '%', range: '0…100 %', desc: 'Смесь обработанного и исходного звука.' },
  ],
  presets: {
    guitar: { label: 'Гитара (после Amp)', note: 'Хочешь смешать два микрофона — смотри лайфхак про Audio Effect Rack.', set: [
      { c: 'speaker', v: '2x12', w: 'Универсальная колонка.' },
      { c: 'mic', v: 'Near Off-Axis', w: 'Near Off-Axis или Far — мягче, чем On-Axis.' },
      { c: 'mictype', v: 'Dynamic', w: 'Классика ближнего микрофона.' },
      { c: 'output', v: 'Mono', w: 'Моно-гитара — хватит Mono.' },
      { c: 'drywet', v: 100, w: 'Полностью.' },
    ] },
    bass: { label: 'Бас / синт-бас', set: [
      { c: 'speaker', v: '4x10 Bass', w: 'Басовая колонка.' },
      { c: 'mic', v: 'Near Off-Axis', w: 'Как в заводском Bottom Up.' },
      { c: 'output', v: 'Dual', w: 'Стерео, как в Bottom Up.' },
      { c: 'drywet', v: 55, w: 'Около половины — низ исходника остаётся.' },
    ] },
    drums: { label: 'Барабаны («маленькая комната»)', note: 'Значения заводского Small Drum Room.', set: [
      { c: 'speaker', v: '2x12', w: '2x12.' },
      { c: 'mic', v: 'Far', w: 'Дальний микрофон — слышно «комнату».' },
      { c: 'output', v: 'Dual', w: 'Стерео.' },
      { c: 'drywet', v: 60, w: '60 % — комната поверх сухих барабанов.' },
    ] },
    keys: { label: 'Клавиши / синт (в миксе)', note: 'Значения заводского Sit in the Mix.', set: [
      { c: 'speaker', v: '4x10', w: '4x10.' },
      { c: 'mic', v: 'Near On-Axis', w: 'Ярко и сфокусировано.' },
      { c: 'drywet', v: 40, w: '40 % — лёгкая окраска, звук «садится» в микс.' },
    ] },
    vocal: { label: 'Вокальные чопы (маленький динамик)', note: 'Основа — заводской Bright Small Box. Для брейков и переходов.', set: [
      { c: 'speaker', v: '1x12', w: 'Самая маленькая колонка.' },
      { c: 'mic', v: 'Near On-Axis', w: 'Ярко.' },
      { c: 'drywet', v: 45, w: 'Подмешиваем; 100 % — эффект целиком.' },
    ] },
  },
  styles: {
    house: { note: 'Чистые гитары и клавиши.', set: [{ c: 'mic', v: 'Near Off-Axis', w: 'House: мягче.', only: ['guitar', 'keys'] }] },
    techhouse: { note: 'Сухо и коротко.', set: [{ c: 'mic', v: 'Near On-Axis', w: 'Tech house: без «комнаты».', not: ['bass'] }] },
    techno: { note: 'Грязь и вес.', set: [{ c: 'speaker', v: '4x12', w: 'Techno: большая колонка — плотнее.', only: ['guitar', 'drums'] }] },
    melodic: { note: 'Мягко, без резкости.', set: [{ c: 'mic', v: 'Far', w: 'Melodic: сбалансированно, с воздухом.', only: ['guitar', 'keys'] }] },
    afro: { note: 'Яркие гитары.', set: [{ c: 'mic', v: 'Near On-Axis', w: 'Afro: ярко и сфокусировано.', only: ['guitar'] }] },
    organic: { note: 'Живой тёплый звук с комнатой.', set: [{ c: 'mic', v: 'Far', w: 'Organic: слышна «комната».', only: ['guitar', 'keys'] }, { c: 'mictype', v: 'Condenser', w: 'Точнее на расстоянии.', only: ['guitar'] }] },
    garage: { note: 'Lo-fi вставки.', set: [{ c: 'drywet', v: 70, w: 'Garage: эффект «маленького динамика» заметнее.', only: ['vocal'] }] },
    downtempo: { note: 'Винтажная комната.', set: [{ c: 'mic', v: 'Far', w: 'Downtempo: больше «комнаты».', not: ['bass'] }] },
    ambient: { note: 'Окраска едва заметна.', set: [{ c: 'drywet', v: 30, w: 'Ambient: только оттенок.' }] },
  },
  hacks: [
    { h: 'Несколько микрофонов на одной колонке', t: 'Совет мануала: положи Cabinet в Audio Effect Rack, продублируй цепь, во второй выбери другой микрофон или тип, громкости цепей сведи в миксере рэка.' },
    { h: 'Amp и Cabinet — пара', t: 'Обычно стоят вместе. Но по отдельности тоже работают: Cabinet без Amp — быстрый «комнатный» или lo-fi эффект.' },
    { h: 'Dual = вдвое больше нагрузки', t: 'Для моно-источника хватит Mono. Dual — когда важно стерео.' },
    { h: 'Dry/Wet как «расстояние»', t: 'Заводские Studio Room (40 %) и Slight Reflections (33 %) показывают: малый Dry/Wet даёт только оттенок комнаты.' },
  ],
  factoryFolder: 'Cabinet',
  factory: [
    { name: '1x12 Cab', use: 'маленькая колонка', vals: [['Speaker', '1x12'], ['Microphone', 'Near On-Axis'], ['Dry/Wet', '100 %']] },
    { name: '4x12 Cab', use: 'большая колонка', vals: [['Speaker', '4x12'], ['Microphone', 'Near On-Axis'], ['Dry/Wet', '100 %']] },
    { name: '4x10 Bass Cab', use: 'бас', vals: [['Speaker', '4x10 Bass'], ['Microphone', 'Near On-Axis'], ['Dry/Wet', '100 %']] },
    { name: 'Bottom Up', use: 'бас параллельно', vals: [['Speaker', '4x10 Bass'], ['Microphone', 'Near Off-Axis'], ['Output', 'Dual'], ['Dry/Wet', '56 %']] },
    { name: 'Sit in the Mix', use: 'окраска в миксе', vals: [['Speaker', '4x10'], ['Microphone', 'Near On-Axis'], ['Dry/Wet', '40 %']] },
    { name: 'Small Drum Room', use: 'барабаны', vals: [['Speaker', '2x12'], ['Microphone', 'Far'], ['Output', 'Dual'], ['Dry/Wet', '60 %']] },
    { name: 'Studio Room', use: 'комната', vals: [['Speaker', '2x12'], ['Microphone', 'Far'], ['Dry/Wet', '40 %']] },
    { name: 'Bright Small Box', use: 'маленький яркий динамик', vals: [['Speaker', '1x12'], ['Microphone', 'Near On-Axis'], ['Dry/Wet', '45 %']] },
  ],
  chain: 'Гитара: Pedal → Amp → Cabinet → EQ Eight → Chorus-Ensemble / Auto Pan-Tremolo. Барабаны: Drum Buss → Cabinet (Small Drum Room, параллельно) → Utility.',
  src: [['Мануал Live 12: Cabinet', 'https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#cabinet']],
});
