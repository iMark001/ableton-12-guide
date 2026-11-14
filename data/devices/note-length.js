/* Note Length — мануал Live 12 (Live MIDI Effect Reference → Note Length). Диапазоны — из заводских пресетов Live 12.4:
   Length (Time) 10…60000 ms, Gate 1…200 %, Release Velocity 0…100 %, Decay Time 10…60000 ms, Key Scale −1…+1
   (здесь условно −100…+100 %). Длины в режиме Sync — доли такта; полный список значений в пресетах не раскрыт,
   поэтому в Sync значение подписано словами. Мс для 1/16 — при 124 BPM. */
registerDevice({
  id: 'note-length',
  pickLabel: 'Задача',
  what: 'Меняет длину входящих нот: все ноты становятся одной длины (в долях такта или миллисекундах), а Gate растягивает или укорачивает её. Второй режим — запуск нот в момент отпускания клавиши (Note Off).',
  when: [
    'Длинные ноты нужно превратить в короткие стабы или плаки.',
    'Нарисованные «как попало» ноты выровнять по длине.',
    'Легато: ноты перекрываются — для пэдов и синтов с glide.',
    'Эффект «звук на отпускании клавиши» — необычные ритмы при живой игре.',
    'Latch: нота держится до следующей — дрон из одного нажатия.',
  ],
  how: [
    'Поставь Note Length перед инструментом.',
    'Trigger: Note On — обычный режим.',
    'Выбери длину в Sync (1/16, 1/8…) или в миллисекундах (Time).',
    'Gate: 100 % — ровно Length, 50 % — вдвое короче, 200 % — вдвое длиннее.',
    'Note Off — нота звучит, когда отпускаешь клавишу (плюс Release Velocity, Decay Time, Key Scale).',
  ],
  parts: ['pluck', 'keys', 'bass'],
  controls: [
    { id: 'trigger', name: 'Trigger', kind: 'switch', opts: ['Note On', 'Note Off'], desc: 'Note On — обычный запуск. Note Off — нота стартует в момент отпускания клавиши (сдвиг на её длину).' },
    { id: 'timemode', name: 'Time Mode', kind: 'switch', opts: ['Sync', 'Time'], desc: 'Длина в долях такта (Sync) или в миллисекундах (Time).' },
    { id: 'length', name: 'Length', kind: 'knob', min: 10, max: 60000, curve: 'log', unit: 'ms', range: '10 ms…60 s (Time) или доли такта (Sync)', desc: 'Базовая длина всех нот.' },
    { id: 'gate', name: 'Gate', kind: 'knob', min: 1, max: 200, unit: '%', range: '1…200 %', desc: 'Множитель длины: 100 % — ровно Length, 200 % — вдвое длиннее, 50 % — вдвое короче.' },
    { id: 'latch', name: 'Latch', kind: 'toggle', desc: 'Нота держится до следующего нажатия (в Note Off — пока не отпущены все клавиши). Length и Gate отключаются.' },
    { id: 'relvel', name: 'Release Velocity', kind: 'knob', min: 0, max: 100, unit: '%', range: '0…100 %', desc: 'Только Note Off: баланс между силой нажатия и силой отпускания. Клавиатура без release velocity — оставь 0 %.' },
    { id: 'decay', name: 'Decay Time', kind: 'knob', min: 10, max: 60000, curve: 'log', unit: 'ms', range: '10…60000 ms', desc: 'Только Note Off: за это время сила ноты падает до нуля с момента нажатия. Чем дольше держишь — тем тише нота на отпускании.' },
    { id: 'keyscale', name: 'Key Scale', kind: 'knob', min: -100, max: 100, unit: '%', desc: 'Только Note Off: плюс — ноты ниже C3 длиннее, выше C3 короче; минус — наоборот.' },
  ],
  presets: {
    stabs: { label: 'Короткие стабы 1/16 из длинных нот', icon: '✂️', note: 'Как заводской «16th Notes». Рисуй аккорды как угодно длинно — звучать будут короткие стабы.', set: [
      { c: 'trigger', v: 'Note On', w: 'Обычный режим.' },
      { c: 'timemode', v: 'Sync', w: 'По сетке.' },
      { c: 'length', v: 121, t: '1/16', w: 'Шестнадцатая (≈ 121 ms при 124 BPM).' },
      { c: 'gate', v: 100, w: 'Ровно 1/16.' },
    ] },
    half: { label: 'Укоротить всё вдвое', icon: '➗', set: [
      { c: 'timemode', v: 'Sync', w: 'По сетке.' },
      { c: 'length', v: 242, t: '1/8', w: 'Базовая длина — восьмая.' },
      { c: 'gate', v: 50, w: '50 % — в итоге 1/16: отрывистее, больше воздуха.' },
    ] },
    legato: { label: 'Легато: ноты внахлёст', icon: '🫧', note: 'Для синтов с Glide (Drift, Analog) — ноты перекрываются, и высота «скользит».', set: [
      { c: 'timemode', v: 'Sync', w: 'По сетке.' },
      { c: 'length', v: 242, t: '1/8', w: 'Базовая длина.' },
      { c: 'gate', v: 150, w: 'Больше 100 % — каждая нота заходит на следующую.' },
    ] },
    pluckms: { label: 'Ровный плак в миллисекундах', icon: '💧', note: 'Как заводской «Ten Milliseconds», но длиннее: длина не зависит от темпа.', set: [
      { c: 'timemode', v: 'Time', w: 'Миллисекунды.' },
      { c: 'length', v: 80, w: '80 ms — коротко; хвост делает огибающая синта.' },
      { c: 'gate', v: 100, w: 'Ровно Length.' },
    ] },
    drone: { label: 'Дрон из одного нажатия (Latch)', icon: '🌫️', note: 'Нажал — звучит, пока не нажмёшь следующую ноту.', set: [
      { c: 'latch', v: true, w: 'Нота держится до следующего нажатия.' },
      { c: 'trigger', v: 'Note On', w: 'Обычный запуск.' },
    ] },
    noteoff: { label: 'Звук на отпускании клавиши', icon: '🔁', note: 'Нота звучит, когда отпускаешь клавишу: короткое нажатие — быстро, длинное — с задержкой. Необычный ритм при живой игре.', set: [
      { c: 'trigger', v: 'Note Off', w: 'Запуск по отпусканию (как заводской «Note Off»).' },
      { c: 'timemode', v: 'Time', w: 'Длина в мс.' },
      { c: 'length', v: 100, w: '100 ms, как в заводском пресете.' },
      { c: 'decay', v: 2000, w: 'Держишь дольше — нота тише.' },
      { c: 'keyscale', v: 30, t: '+30 % (условно)', w: 'Низкие ноты длиннее, высокие короче.' },
    ] },
  },
  styles: {
    house: { note: 'Короткие аккорд-стабы 1–2 шага.', set: [{ c: 'gate', v: 100, w: 'House: стаб длиной в шаг.', only: ['stabs', 'half'] }] },
    techhouse: { note: 'Очень короткие стабы и бас.', set: [{ c: 'gate', v: 60, w: 'Tech house: ещё короче.', only: ['stabs', 'half'] }] },
    techno: { note: 'Отрывисто, механично.', set: [{ c: 'gate', v: 40, w: 'Techno: короткие ноты 30–50 %.', only: ['stabs', 'half'] }] },
    melodic: { note: 'Ноты длиннее, перекрываются.', set: [{ c: 'gate', v: 130, w: 'Melodic: тянущиеся ноты.', only: ['legato'] }] },
    afro: { note: 'Короткие перкуссионные ноты.', set: [{ c: 'gate', v: 80, w: 'Afro: отрывисто, но не сухо.', only: ['stabs', 'half', 'pluckms'] }] },
    organic: { note: 'Мягче, длиннее.', set: [{ c: 'gate', v: 120, w: 'Organic: чуть внахлёст.', only: ['legato', 'half'] }] },
    garage: { note: 'Рваные короткие стабы.', set: [{ c: 'gate', v: 70, w: 'Garage: короткие стабы со свингом.', only: ['stabs', 'half'] }] },
    downtempo: { note: 'Легато и длинные ноты.', set: [{ c: 'gate', v: 150, w: 'Downtempo: ноты сливаются.', only: ['legato'] }] },
    ambient: { note: 'Дроны и бесконечные ноты.', set: [{ c: 'gate', v: 200, w: 'Ambient: максимум перекрытия.', only: ['legato'] }] },
  },
  hacks: [
    { h: 'Длина в такт', t: '60000 / BPM = длина доли в мс. При 124 BPM: 1/4 ≈ 484 ms, 1/8 ≈ 242, 1/16 ≈ 121.' },
    { h: 'Арп + Note Length', t: 'Рэки Arp Up и One Note Twist из Core Library: Arpeggiator → Note Length — длину нот арпа удобно крутить одной ручкой.' },
    { h: 'Автоматизация Gate', t: 'Автоматизируй Gate от 30 % к 100 % перед дропом — стабы постепенно «раскрываются».' },
    { h: 'Ввод числа', t: 'В режиме Time кликни по Length и набери 80 — без поиска мышью.' },
  ],
  factoryFolder: 'Note Length (MIDI Effects)',
  factory: [
    { name: '16th Notes', use: 'все ноты шестнадцатыми', vals: [['Trigger', 'Note On'], ['Mode', 'Sync'], ['Gate', '100 %']] },
    { name: 'Ten Milliseconds', use: 'сверхкороткие ноты — щелчки', vals: [['Mode', 'Time'], ['Length', '10 ms'], ['Gate', '100 %']] },
    { name: 'Ten Seconds', use: 'очень длинные ноты — дроны', vals: [['Mode', 'Time'], ['Length', '10000 ms'], ['Gate', '100 %']] },
    { name: 'Note Off', use: 'звук на отпускании клавиши', vals: [['Trigger', 'Note Off'], ['Mode', 'Time'], ['Length', '100 ms']] },
  ],
  chain: 'Arpeggiator → Note Length → инструмент. Или Chord → Note Length — аккорды одной длины.',
  src: [['Мануал Live 12: Note Length', 'https://www.ableton.com/en/live-manual/12/live-midi-effect-reference/#note-length']],
});
