/* Vinyl Distortion — мануал Live 12; диапазоны и 7 заводских пресетов — из Live 12.4.6
   (Drive секций 0…100 %, Freq 50 Hz…18 kHz, Q 0.1…3, Crackle Density 0…50, Crackle Volume 0…100 %).
   В данных пресетов секции названы Band 1 / Band 2 — какая из них Tracing Model, а какая Pinch, по данным понять нельзя,
   как и какое положение переключателей Soft/Hard и Stereo/Mono им соответствует. Поэтому у заводских пресетов указаны только
   однозначные значения (треск, частоты секций, включены ли секции). */
registerDevice({
  id: 'vinyl-distortion',
  what: 'Имитация винила: искажения от того, как игла идёт по канавке, плюс генератор треска (Crackle). Две секции искажений: Tracing Model добавляет чётные гармоники, Pinch — нечётные и делает стерео богаче. Главный приём в электронике — лёгкий треск для «пыльной» атмосферы.',
  when: [
    'Downtempo, lo-fi, UK Garage — нужен треск пластинки.',
    'Клавиши, Rhodes, сэмплы — «винтажный» характер.',
    'Хэты и перкуссия — пыль и шорох.',
    'Атмосфера и переходы — треск как отдельный слой текстуры.',
  ],
  how: [
    'Начни с треска: Crackle Density — сколько щелчков, Crackle Volume — их громкость. Обе ставь малыми.',
    'Добавь искажение: Drive в Tracing Model (чётные гармоники) и/или Pinch (нечётные).',
    'Частоту («цвет») искажения меняй, таская точку по экрану секции по горизонтали.',
    'Soft — как дабплейт, Hard — как обычная пластинка.',
    'Для реализма Pinch ставь в Stereo.',
  ],
  parts: ['keys', 'hats'],
  controls: [
    { id: 'tdrive', name: 'Tracing Model: Drive', kind: 'knob', min: 0, max: 100, unit: '%', range: '0…100 %', desc: 'Сила искажения Tracing Model — чётные гармоники (тёплый «ламповый» оттенок). На экране секции — по вертикали.' },
    { id: 'tfreq', name: 'Tracing Model: Freq', kind: 'knob', min: 50, max: 18000, curve: 'log', unit: 'Hz', range: '50 Hz…18 kHz', desc: 'Частота («цвет») искажения Tracing Model. Двойной клик по полю Freq — ввод числа.' },
    { id: 'pdrive', name: 'Pinch: Drive', kind: 'knob', min: 0, max: 100, unit: '%', range: '0…100 %', desc: 'Сила искажения Pinch — нечётные гармоники в противофазе: стерео становится богаче.' },
    { id: 'pfreq', name: 'Pinch: Freq', kind: 'knob', min: 50, max: 18000, curve: 'log', unit: 'Hz', range: '50 Hz…18 kHz', desc: 'Частота искажения Pinch.' },
    { id: 'mode', name: 'Soft / Hard', kind: 'switch', opts: ['Soft', 'Hard'], desc: 'Soft — звук дабплейта, Hard — обычной виниловой пластинки.' },
    { id: 'stereo', name: 'Stereo / Mono', kind: 'switch', opts: ['Stereo', 'Mono'], desc: 'Где происходит искажение Pinch. Для реалистичного винила — Stereo.' },
    { id: 'density', name: 'Crackle Density', kind: 'knob', min: 0, max: 50, unit: '', range: '0…50', desc: 'Плотность треска — сколько щелчков.' },
    { id: 'cvol', name: 'Crackle Volume', kind: 'knob', min: 0, max: 100, unit: '%', range: '0…100 %', desc: 'Громкость треска.' },
  ],
  extra: [
    { name: 'Q (Width) секций', range: '0.1…3', desc: 'Ширина полосы искажения: тяни по экрану секции вертикально с Alt (Win) / Option (Mac).' },
    { name: 'Drive (общий)', range: '—', desc: 'Общая сила искажений обеих секций — Tracing Model и Pinch.' },
  ],
  presets: {
    keys: { label: 'Клавиши / Rhodes (lo-fi)', note: 'Треск и Drive — малые: эффект чувствуется, а не слышится.', set: [
      { c: 'density', v: 5, w: 'Малая плотность — редкие щелчки.' },
      { c: 'cvol', v: 20, w: 'Тихо — треск в фоне.' },
      { c: 'tdrive', v: 20, w: 'Мягкое тёплое искажение.' },
      { c: 'mode', v: 'Hard', w: 'Как обычная пластинка.' },
      { c: 'stereo', v: 'Stereo', w: 'Реалистичнее.' },
    ] },
    hats: { label: 'Хэты / перкуссия (пыль)', set: [
      { c: 'density', v: 8, w: 'Немного шороха.' },
      { c: 'cvol', v: 15, w: 'Тихо.' },
      { c: 'pdrive', v: 15, w: 'Немного нечётных гармоник — богаче стерео.' },
      { c: 'stereo', v: 'Stereo', w: 'Шире.' },
    ] },
    drums: { label: 'Барабаны (downtempo)', set: [
      { c: 'tdrive', v: 15, w: 'Тёплый оттенок.' },
      { c: 'density', v: 5, w: 'Редкий треск.' },
      { c: 'cvol', v: 15, w: 'Тихо.' },
      { c: 'mode', v: 'Soft', w: 'Мягче — как дабплейт.' },
    ] },
    vocal: { label: 'Вокальные чопы (lo-fi)', set: [
      { c: 'tdrive', v: 30, w: 'Заметное тёплое искажение.' },
      { c: 'pdrive', v: 20, w: 'Немного «грязи» в стерео.' },
      { c: 'density', v: 5, w: 'Редкий треск.' },
      { c: 'cvol', v: 20, w: 'В фоне.' },
    ] },
    fx: { label: 'Треск как слой атмосферы', note: 'Отдельная дорожка или Return: искажения выключены, работает только треск (как в заводском Crack).', set: [
      { c: 'tdrive', v: 0, w: 'Искажения не нужны.' },
      { c: 'pdrive', v: 0, w: 'Искажения не нужны.' },
      { c: 'density', v: 20, w: 'Заметный треск.' },
      { c: 'cvol', v: 40, w: 'Громкость слоя — дальше фейдером.' },
    ] },
  },
  styles: {
    house: { note: 'Едва заметный винтаж.', set: [{ c: 'cvol', v: 10, w: 'House: треск почти не слышен.', not: ['fx'] }] },
    techhouse: { note: 'Обычно не нужен — только в переходах.', set: [{ c: 'cvol', v: 8, w: 'Tech house: минимум.', not: ['fx'] }] },
    techno: { note: 'Редко: разве что треск в интро или брейке.', set: [{ c: 'density', v: 30, w: 'Techno: плотный треск как индастриал-текстура.', only: ['fx'] }] },
    melodic: { note: 'Тонкая «пыль» в атмосферах.', set: [{ c: 'cvol', v: 12, w: 'Melodic: тихо.', not: ['fx'] }] },
    afro: { note: 'Живые сэмплы с налётом винтажа.', set: [{ c: 'tdrive', v: 10, w: 'Afro: мягко.', only: ['keys', 'drums'] }] },
    organic: { note: 'Тёплый винтаж.', set: [{ c: 'mode', v: 'Soft', w: 'Organic: мягче.', not: ['fx'] }] },
    garage: { note: 'Треск винила — часть атмосферы UK Garage.', set: [{ c: 'density', v: 12, w: 'Garage: треск заметнее.' }, { c: 'cvol', v: 25, w: 'Громче.', not: ['fx'] }] },
    downtempo: { note: 'Винил и тремоло — классика downtempo.', set: [{ c: 'density', v: 12, w: 'Downtempo: больше треска.' }, { c: 'tdrive', v: 30, w: 'Теплее.', only: ['keys', 'drums', 'vocal'] }] },
    ambient: { note: 'Треск как тихая текстура.', set: [{ c: 'cvol', v: 15, w: 'Ambient: тихо.', not: ['fx'] }, { c: 'density', v: 6, w: 'Редко.', not: ['fx'] }] },
  },
  hacks: [
    { h: 'Ввод частоты с клавиатуры', t: 'Двойной клик по полю Freq секции — набери число и Enter. Удобнее, чем таскать точку по экрану.' },
    { h: 'Ширина полосы с Alt / Option', t: 'Тяни по экрану секции вертикально с зажатым Alt (Win) / Option (Mac) — меняется Q (ширина полосы искажения).' },
    { h: 'Треск звучит и в тишине', t: 'Live считает Vinyl Distortion «генератором»: треск идёт даже без входного звука. Не забудь про это при экспорте и Bounce — выключи устройство или автоматизируй Crackle Volume.' },
    { h: 'Треск отдельным слоем', t: 'Поставь Vinyl Distortion на Return или пустую аудиодорожку с выключенными секциями искажений — получишь независимый слой треска, который удобно автоматизировать.' },
  ],
  factoryFolder: 'Vinyl Distortion',
  factory: [
    { name: 'Crack', use: 'только треск', vals: [['Секции искажений', 'обе выкл'], ['Crackle Density', '50'], ['Crackle Volume', '100 %']] },
    { name: 'Vinyl', use: 'пластинка', vals: [['Секции', 'обе вкл, ~5.1 и ~10.4 kHz'], ['Crackle Density', '0'], ['Crackle Volume', '43 %']] },
    { name: 'Dubplate', use: 'дабплейт', vals: [['Секции', 'обе вкл, ~127 Hz и ~14.4 kHz'], ['Crackle Density', '10'], ['Crackle Volume', '0 %']] },
    { name: 'Klirr', use: 'звон верха', vals: [['Секции', 'обе вкл, ~6.3 и ~7.5 kHz'], ['Crackle Volume', '0 %']] },
    { name: 'Zerr', use: 'грязь низа и середины', vals: [['Секции', 'обе вкл, ~53 Hz и ~700 Hz'], ['Crackle Volume', '0 %']] },
    { name: 'Nonreal', use: 'нереальный винил', vals: [['Секции', 'обе вкл, ~78 Hz и ~7.1 kHz'], ['Crackle Volume', '43 %']] },
  ],
  chain: 'Клавиши: EQ Eight → Compressor → Dynamic Tube или Saturator → Auto Pan-Tremolo → Vinyl Distortion → Reverb (Return). Downtempo-барабаны: Glue Compressor → Drum Buss (Transients в минус) → Vinyl Distortion.',
  src: [['Мануал Live 12: Vinyl Distortion', 'https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#vinyl-distortion'], ['Release notes Live 12', 'https://www.ableton.com/en/release-notes/live-12/']],
});
