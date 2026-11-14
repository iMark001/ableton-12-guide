/* DS Snare — мануал Live 12 (Max for Live Devices → DS Snare). Диапазоны — из параметров DS Snare в «DS Drum Rack»
   (Core Library, Live 12.4): Filter Type LP/HP/BP, Volume −70…+12 dB; Color, Tone, Decay, Tune — шкала 0…100 без
   единиц в мануале, поэтому значения словами. Рецепт шумового снейра — data/parts-drums.js. */
registerDevice({
  id: 'ds-snare',
  pickLabel: 'Тип звука',
  what: 'Синтезатор снейра из двух частей: тонального генератора («тело» удара) и шума («шуршание» пружин). Можно получить и почти акустический снейр, и короткий «гейтованный» шумовой снейр электронной музыки.',
  when: [
    'Нужен снейр на 2 и 4 или «призрачные» удары для грува.',
    'Шумовой снейр для garage и techno.',
    'Слой под клэп: добавить шума и ширины.',
    'Хочется подогнать высоту снейра под трек (Tune).',
  ],
  how: [
    'Поставь DS Snare в ячейку Drum Rack (обычно D1 или E1).',
    'Color — тон «тела», Tone — сколько шума.',
    'Выбери фильтр шума: LP — темнее, HP — только верх, BP — узкая середина.',
    'Decay — длина. Для техно и garage коротко.',
    'Tune — общая высота: подстрой на слух вместе с киком.',
  ],
  parts: ['clap'],
  controls: [
    { id: 'color', name: 'Color', kind: 'knob', min: 0, max: 100, unit: '%', desc: 'Тон тональной части — «тело» удара.' },
    { id: 'tone', name: 'Tone', kind: 'knob', min: 0, max: 100, unit: '%', desc: 'Сколько шума в звуке. Больше — снейр «шуршит» сильнее.' },
    { id: 'filter', name: 'Filter Type', kind: 'switch', opts: ['LP', 'HP', 'BP'], desc: 'Фильтр для шума: LP (low-pass) — темнее, HP (high-pass) — только верх, BP (band-pass) — узкая полоса.' },
    { id: 'decay', name: 'Decay', kind: 'knob', min: 0, max: 100, unit: '%', desc: 'Длина снейра.' },
    { id: 'tune', name: 'Tune', kind: 'knob', min: 0, max: 100, unit: '%', desc: 'Общая высота всего звука.' },
    { id: 'volume', name: 'Volume', kind: 'knob', min: -70, max: 12, unit: 'dB', range: '−70…+12 dB', desc: 'Общая громкость инструмента.' },
  ],
  extra: [
    { name: 'Предпрослушка', range: '—', desc: 'Клик в верхней половине дисплея проигрывает звук.' },
  ],
  presets: {
    noisesnare: { label: 'Шумовой снейр (garage, techno)', icon: '🌪️', note: 'Классика 2-step и техно: короткий шумовой удар.', set: [
      { c: 'color', v: 50, t: 'середина', w: 'Тело удара есть, но не доминирует.' },
      { c: 'tone', v: 70, t: 'больше середины', w: 'Больше шума — «шуршащий» снейр.' },
      { c: 'filter', v: 'BP', w: 'Band-pass или High-pass: шум без лишнего низа.' },
      { c: 'decay', v: 25, t: 'коротко', w: 'Не размывает ломаный ритм.' },
      { c: 'tune', v: 50, t: 'на слух', w: 'Подстрой вместе с киком.' },
    ] },
    gated: { label: 'Гейтованный снейр (EDM)', icon: '✂️', note: 'В мануале: «gated noise snare» — типичный снейр электронной музыки.', set: [
      { c: 'tone', v: 85, t: 'много шума', w: 'Почти весь звук — шум.' },
      { c: 'filter', v: 'HP', w: 'Только верх — снейр не спорит с киком.' },
      { c: 'decay', v: 15, t: 'очень коротко', w: 'Резкий обрыв — эффект гейта.' },
      { c: 'color', v: 40, t: 'чуть меньше середины', w: 'Тело только для щелчка.' },
    ] },
    acoustic: { label: 'Ближе к акустике (organic, downtempo)', icon: '🪘', set: [
      { c: 'color', v: 65, t: 'больше середины', w: 'Слышно «тело» барабана.' },
      { c: 'tone', v: 45, t: 'середина', w: 'Шум как пружины, но не главный.' },
      { c: 'filter', v: 'LP', w: 'Low-pass — мягче, без цифровой резкости.' },
      { c: 'decay', v: 45, t: 'средне', w: 'Естественное затухание.' },
    ] },
    ghost: { label: 'Тихие «призраки» для грува', icon: '👻', note: 'Ставь между основными ударами со сниженной velocity (60–80) — ритм «едет».', set: [
      { c: 'decay', v: 15, t: 'очень коротко', w: 'Призрак не должен звенеть.' },
      { c: 'tone', v: 55, t: 'середина', w: 'Шорох, а не удар.' },
      { c: 'filter', v: 'HP', w: 'Без низа — не мешает кику.' },
      { c: 'volume', v: -12, w: 'Тише основного снейра; дальше динамику делает velocity.' },
    ] },
    layer: { label: 'Слой под клэп (только шум сверху)', icon: '🧩', note: 'Слой из клэпа и снейра толще одного звука — но у второго убери лишний низ.', set: [
      { c: 'filter', v: 'HP', w: 'High-pass убирает низ — слой не мутит.' },
      { c: 'tone', v: 80, t: 'много шума', w: 'Нужен «воздух», а не второе тело.' },
      { c: 'color', v: 30, t: 'меньше середины', w: 'Тело оставь клэпу.' },
      { c: 'decay', v: 30, t: 'коротко', w: 'Длина как у клэпа.' },
      { c: 'volume', v: -10, w: 'Тише основного звука — подмешивается.' },
    ] },
  },
  styles: {
    house: { note: 'Снейр часто слоем под клэп.', set: [{ c: 'decay', v: 35, t: 'коротко–средне', w: 'House: чуть живее хвост.', only: ['layer', 'noisesnare'] }] },
    techhouse: { note: 'Сухо и коротко.', set: [{ c: 'decay', v: 20, t: 'коротко', w: 'Tech house: сухой удар.', not: ['acoustic'] }] },
    techno: { note: 'Шумовой и короткий, часто с реверб-хвостом на Return.', set: [{ c: 'filter', v: 'HP', w: 'Techno: только верх, низ отдан кику.', not: ['acoustic'] }, { c: 'decay', v: 15, t: 'очень коротко', w: 'Хвост сделает Reverb + Gate.', only: ['noisesnare', 'gated'] }] },
    melodic: { note: 'Мягче, шире, с длинным ревербом.', set: [{ c: 'decay', v: 40, t: 'средне', w: 'Melodic: снейр «дышит» в реверб.', only: ['noisesnare', 'acoustic'] }] },
    afro: { note: 'Живой звук, много призраков.', set: [{ c: 'filter', v: 'LP', w: 'Afro: мягче, ближе к живому барабану.', only: ['acoustic', 'ghost'] }] },
    organic: { note: 'Тёплый, приглушённый.', set: [{ c: 'filter', v: 'LP', w: 'Organic: без резкого верха.', not: ['layer'] }] },
    garage: { note: 'Шумовой снейр + призраки со свингом.', set: [{ c: 'tone', v: 75, t: 'много шума', w: 'Garage: «шуршащий» 2-step снейр.', only: ['noisesnare', 'ghost'] }] },
    downtempo: { note: 'Мягкий и чуть длиннее.', set: [{ c: 'decay', v: 50, t: 'средне', w: 'Downtempo: больше воздуха между ударами.', only: ['acoustic', 'noisesnare'] }] },
    ambient: { note: 'Снейр редко нужен; если нужен — тихий и мягкий.', set: [{ c: 'filter', v: 'LP', w: 'Ambient: никакой резкости.' }] },
  },
  hacks: [
    { h: 'Два снейра — два тона', t: 'В DS Drum Rack два снейра с одинаковыми настройками, но разным Tune (51 и 25 из 100) — основной и пониже. Так же делай «вопрос–ответ» в сбивках.' },
    { h: 'Призраки через Velocity', t: 'Перед Drum Rack поставь MIDI-эффект Velocity с Random 10–20 — призраки и основные удары станут живее без ручной правки.' },
    { h: 'Гейт-реверб', t: 'Send снейра на Return: Reverb → Gate (короткий Hold, быстрый Release) — хвост обрывается резко, как в техно.' },
    { h: 'Ввод числа', t: 'Volume удобнее набрать с клавиатуры: клик по полю, −10, Enter.' },
  ],
  factoryFolder: 'Core Library → Racks → Drum Racks (DS Drum Rack)',
  factory: [
    { name: 'DS Drum Rack — пэд D1', use: 'основной снейр', vals: [['Color', '81 из 100'], ['Tone', '51 из 100'], ['Filter Type', 'HP'], ['Decay', '23 из 100'], ['Tune', '51 из 100'], ['Volume', '−5.8 dB']] },
    { name: 'DS Drum Rack — пэд E1', use: 'тот же снейр ниже и тише', vals: [['Color', '81 из 100'], ['Filter Type', 'HP'], ['Tune', '25 из 100'], ['Volume', '−13.7 dB']] },
  ],
  chain: 'DS Snare → EQ Eight (high-pass — убрать низ, если это слой) → Compressor/Drum Buss на барабанной группе. Хвост — Send на Return с Reverb.',
  src: [['Мануал Live 12: DS Snare', 'https://www.ableton.com/en/live-manual/12/max-for-live-devices/#ds-snare']],
});
