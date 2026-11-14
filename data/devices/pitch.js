/* Pitch — мануал Live 12 (Live MIDI Effect Reference → Pitch). Диапазоны — из заводских пресетов Live 12.4:
   Pitch −48…+48 st (мануал пишет «±128 semitones», но параметр устройства — ±48) или ±30 ступеней с Use Current Scale,
   Step Width 1…48 st / 1…30 ступеней, Lowest 0…127, Range 0…127, Mode — Block, Fold, Limit (порядок по мануалу).
   Сценарии — исследование C (4.4, сценарий 2) и A (регистры). */
registerDevice({
  id: 'pitch',
  pickLabel: 'Задача',
  what: 'Транспонирует входящие ноты: на полутоны или, с Use Current Scale, на ступени лада. Ноты в клипе не меняются — сдвиг можно в любой момент вернуть. Ещё умеет пропускать только ноты из заданного диапазона.',
  when: [
    'Партию нужно на октаву выше или ниже, не трогая клип.',
    'Сменить тональность всего проекта без правки нот: Pitch на каждой MIDI-дорожке.',
    'Транспонировать вживую кнопками Step Up/Down с контроллера.',
    'Удержать бас в нужном регистре (Fold или Limit).',
  ],
  how: [
    'Поставь Pitch перед инструментом.',
    'Pitch: +12 — октава вверх, −12 — вниз.',
    'Use Current Scale в заголовке — сдвиг в ступенях лада клипа (до ±30).',
    'Step Width — шаг кнопок Step Up/Down: назначь им клавиши или MIDI.',
    'Lowest + Range — какие ноты пропускать; Mode решает, что делать с остальными.',
  ],
  parts: ['bass', 'sub', 'lead'],
  controls: [
    { id: 'pitch', name: 'Pitch', kind: 'knob', min: -48, max: 48, unit: 'st', range: '−48…+48 st (или ±30 ступеней)', desc: 'Сдвиг всех нот. С Use Current Scale — в ступенях лада.' },
    { id: 'ucs', name: 'Use Current Scale', kind: 'toggle', desc: 'Сдвиг по ступеням лада клипа: ноты не выходят из лада.' },
    { id: 'stepwidth', name: 'Step Width', kind: 'knob', min: 1, max: 48, unit: 'st', range: '1…48 st (или 1…30 ступеней)', desc: 'На сколько меняют Pitch кнопки Step Up и Step Down.' },
    { id: 'lowest', name: 'Lowest', kind: 'knob', min: 0, max: 127, unit: '', range: '0…127 (C−2…G8)', desc: 'Нижняя нота диапазона, который проходит через устройство.' },
    { id: 'range', name: 'Range', kind: 'knob', min: 0, max: 127, unit: '', range: '0…127 полутонов', desc: 'Ширина диапазона вверх от Lowest.' },
    { id: 'mode', name: 'Mode', kind: 'switch', opts: ['Block', 'Fold', 'Limit'], desc: 'Ноты вне диапазона: Block — не пропускать (мигает LED), Fold — перенести внутрь диапазона, Limit — прижать к краю диапазона.' },
  ],
  extra: [
    { name: 'Step Up / Step Down', range: 'кнопки', desc: 'Увеличивают или уменьшают Pitch на Step Width. Можно назначить клавиши или MIDI (Key/MIDI Map).' },
  ],
  presets: {
    octup: { label: 'Партия на октаву выше', icon: '⬆️', set: [
      { c: 'pitch', v: 12, w: '+12 st — та же мелодия октавой выше (как заводской «+ 12»).' },
      { c: 'ucs', v: false, w: 'Октава = 12 полутонов, лад тут не нужен.' },
    ] },
    octdown: { label: 'Бас или саб на октаву ниже', icon: '⬇️', note: 'Проверь регистр: саб-бас — E0…E1 (MIDI 28–40, 41–82 Гц).', set: [
      { c: 'pitch', v: -12, w: '−12 st — октава вниз (заводской «− 12»).' },
      { c: 'ucs', v: false, w: 'Точная октава.' },
    ] },
    keychange: { label: 'Сменить тональность проекта без правки нот', icon: '🔀', note: 'Пример: луп в C#m, проект в Cm → Pitch +1 на каждой MIDI-дорожке, аудио — Pitch клипа +1. Сдвиг до ±2–3 полутонов обычно безопасен.', set: [
      { c: 'pitch', v: 1, w: '+1 st — весь проект на полтона вверх.' },
      { c: 'ucs', v: false, w: 'Полутоны — сдвигаем тональность целиком.' },
    ] },
    scalestep: { label: 'Сдвиг по ладу: мелодия в терцию', icon: '🎯', note: 'Дубликат дорожки с Pitch +2 ступени — вторая партия в терцию по ладу (как Add Interval в MIDI Tools).', set: [
      { c: 'ucs', v: true, w: 'Сдвиг в ступенях лада клипа.' },
      { c: 'pitch', v: 2, t: '+2 ступени', w: 'Терция в ладу — гармония без теории.' },
    ] },
    live: { label: 'Транспонирование вживую кнопками', icon: '🎚️', note: 'Назначь Step Up/Down на пэды контроллера (MIDI Map) — дроп на октаву выше одной кнопкой.', set: [
      { c: 'stepwidth', v: 12, w: 'Шаг — октава (как в заводских пресетах).' },
      { c: 'pitch', v: 0, w: 'Старт без сдвига.' },
    ] },
    bassfold: { label: 'Удержать бас в регистре (Fold)', icon: '🧲', note: 'Удобно с Random или арпом: ноты, улетевшие выше, возвращаются в басовый регистр.', set: [
      { c: 'lowest', v: 28, t: 'E0', w: 'Нижняя граница саб-регистра.' },
      { c: 'range', v: 24, w: 'Две октавы вверх (до E2).' },
      { c: 'mode', v: 'Fold', w: 'Ноты вне диапазона переносятся внутрь — ничего не пропадает.' },
    ] },
  },
  styles: {
    house: { note: 'Октавные «прыжки» баса и пиано.', set: [{ c: 'pitch', v: 12, w: 'House: дубль партии октавой выше для яркости.', only: ['octup'] }] },
    techhouse: { note: 'Рифф, который поднимается по ходу трека.', set: [{ c: 'stepwidth', v: 12, w: 'Tech house: подъём рифа на октаву в дропе.', only: ['live'] }] },
    techno: { note: 'Фригийский сдвиг на полтон — тёмный приём.', set: [{ c: 'pitch', v: 1, w: 'Techno: рифф ↔ полутон вверх (A ↔ Bb) — автоматизируй Pitch 0 ↔ +1.', only: ['keychange'] }] },
    melodic: { note: 'Второй голос по ладу.', set: [{ c: 'pitch', v: 4, t: '+4 ступени', w: 'Melodic: вторая партия в квинту по ладу.', only: ['scalestep'] }] },
    afro: { note: 'Мотивы маримбы в терцию.', set: [{ c: 'pitch', v: 2, t: '+2 ступени', w: 'Afro: терция в ладу.', only: ['scalestep'] }] },
    organic: { note: 'Мягкие сдвиги в ладу.', set: [{ c: 'ucs', v: true, w: 'Organic: всё в ладу клипа.', only: ['scalestep', 'live'] }] },
    garage: { note: 'Бас «дышит» октавами.', set: [{ c: 'pitch', v: -12, w: 'Garage: глубже бас.', only: ['octdown'] }] },
    downtempo: { note: 'Спокойные переносы октав.', set: [{ c: 'pitch', v: -12, w: 'Downtempo: партия ниже — теплее.', only: ['octdown', 'octup'] }] },
    ambient: { note: 'Октавные дубли пэдов.', set: [{ c: 'pitch', v: 12, w: 'Ambient: дубль пэда октавой выше, тише.', only: ['octup'] }] },
  },
  hacks: [
    { h: 'Неразрушающая смена тональности', t: 'Pitch на каждой MIDI-дорожке вместо правки клипов: вернуть исходную тональность — одним щелчком.' },
    { h: 'Формула сдвига', t: 'Сдвиг = (цель − источник), где C=0, C#=1 … B=11. Больше +6 — вычти 12. Em → Am = +5, C#m → Cm = −1.' },
    { h: 'Октава по ладу = 7', t: 'С Use Current Scale октава — это 7 ступеней (а не 12). Ступени в устройстве — до ±30.' },
    { h: 'Ввод числа', t: 'Кликни по Pitch и набери −12, Enter — быстрее, чем тянуть мышью.' },
  ],
  factoryFolder: 'Pitch (MIDI Effects)',
  factory: [
    { name: '+ 12', use: 'октава вверх', vals: [['Pitch', '+12 st'], ['Step Width', '12 st'], ['Lowest / Range', '0 / 127 — все ноты']] },
    { name: '+ 24', use: 'две октавы вверх', vals: [['Pitch', '+24 st'], ['Step Width', '12 st']] },
    { name: '− 12', use: 'октава вниз', vals: [['Pitch', '−12 st'], ['Step Width', '12 st']] },
  ],
  chain: 'Pitch → (Scale) → инструмент. Для смены тональности проекта — Pitch первым на каждой MIDI-дорожке.',
  src: [['Мануал Live 12: Pitch', 'https://www.ableton.com/en/live-manual/12/live-midi-effect-reference/#pitch']],
});
