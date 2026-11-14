/* Каталог всех 85 встроенных устройств Ableton Live 12 Suite (по браузеру Live 12.4.6).
   new — появилось в Live 12 (по release notes), upd — заметно обновлено в Live 12,
   card — служебное устройство: короткая карточка без настроек по стилям.
   Ссылка ведёт на раздел официального мануала Live 12. */

const MANUAL_BASE = 'https://www.ableton.com/en/live-manual/12/';
const MANUAL_CH = { a: 'live-audio-effect-reference', i: 'live-instrument-reference', m: 'live-midi-effect-reference', x: 'max-for-live-devices', r: 'instrument-drum-and-effect-racks' };

/* Готовые разборы (файл data/devices/<id>.js). Сейчас готовы все 85; новое устройство — сначала в _staging, после проверки сюда. */
const READY = [
  'align-delay', 'amp', 'analog', 'arpeggiator', 'audio-effect-rack', 'auto-filter', 'auto-pan-tremolo',
  'auto-shift', 'beat-repeat', 'cabinet', 'cc-control', 'channel-eq', 'chord', 'chorus-ensemble', 'collision',
  'compressor', 'corpus', 'delay', 'drift', 'drum-buss', 'drum-rack', 'drum-sampler', 'ds-clang', 'ds-clap',
  'ds-cymbal', 'ds-fm', 'ds-hh', 'ds-kick', 'ds-snare', 'ds-tom', 'dynamic-tube', 'echo', 'electric',
  'envelope-follower', 'envelope-midi', 'eq-eight', 'eq-three', 'erosion', 'expression-control',
  'external-audio-effect', 'external-instrument', 'filter-delay', 'gate', 'glue-compressor', 'grain-delay',
  'hybrid-reverb', 'impulse', 'instrument-rack', 'lfo', 'limiter', 'looper', 'meld', 'midi-effect-rack',
  'midi-monitor', 'mpe-control', 'multiband-dynamics', 'note-echo', 'note-length', 'operator', 'overdrive', 'pedal',
  'phaser-flanger', 'pitch', 'random', 'redux', 'resonators', 'reverb', 'roar', 'sampler', 'saturator', 'scale',
  'shaper', 'shaper-midi', 'shifter', 'simpler', 'spectral-resonator', 'spectral-time', 'spectrum', 'tension',
  'tuner', 'utility', 'velocity', 'vinyl-distortion', 'vocoder', 'wavetable',
];

const CATALOG = [
  /* 1. Динамика */
  ['compressor', 'Compressor', 'dyn', 'a', 'Выравнивает громкость: громкие места тише, тихие ближе к громким.'],
  ['glue-compressor', 'Glue Compressor', 'dyn', 'a', 'Компрессор для групп и мастера: «склеивает» звуки в один.'],
  ['limiter', 'Limiter', 'dyn', 'a', 'Не пускает сигнал выше потолка — громкий мастер без клиппинга.', 'upd'],
  ['multiband-dynamics', 'Multiband Dynamics', 'dyn', 'a', 'Компрессия отдельно для низа, середины и верха.'],
  ['gate', 'Gate', 'dyn', 'a', 'Глушит звук тише порога: убирает шум, режет хвосты.'],
  ['drum-buss', 'Drum Buss', 'dyn', 'a', 'Комбайн для барабанов: драйв, панч и «бум» низа.'],
  /* 2. EQ, фильтры, утилиты */
  ['eq-eight', 'EQ Eight', 'eq', 'a', 'Восьмиполосный эквалайзер: вырезать лишнее, подчеркнуть нужное.'],
  ['eq-three', 'EQ Three', 'eq', 'a', 'DJ-эквалайзер: низ, середина, верх и кнопки выключения полос.'],
  ['channel-eq', 'Channel EQ', 'eq', 'a', 'Простой эквалайзер как на микшерном пульте.'],
  ['auto-filter', 'Auto Filter', 'eq', 'a', 'Фильтр с движением: свипы, LFO, огибающая, сайдчейн.', 'upd'],
  ['utility', 'Utility', 'eq', 'a', 'Громкость, панорама, ширина стерео, моно для баса.'],
  ['align-delay', 'Align Delay', 'eq', 'x', 'Сдвигает сигнал во времени, чтобы выровнять задержки и фазу.'],
  ['spectrum', 'Spectrum', 'eq', 'a', 'Анализатор: показывает, какие частоты звучат.', 'card'],
  ['tuner', 'Tuner', 'eq', 'a', 'Тюнер: какая нота звучит и насколько она фальшивит.', 'card'],
  /* 3. Пространство */
  ['reverb', 'Reverb', 'space', 'a', 'Классический реверб: комната, зал, пространство.'],
  ['hybrid-reverb', 'Hybrid Reverb', 'space', 'a', 'Реверб из двух движков: «слепки» реальных залов и алгоритм.'],
  ['delay', 'Delay', 'space', 'a', 'Эхо в такт: пинг-понг, фильтр, модуляция.'],
  ['echo', 'Echo', 'space', 'a', 'Эхо с характером: лента, аналог, приглушение под сигнал.'],
  ['filter-delay', 'Filter Delay', 'space', 'a', 'Три линии задержки, у каждой свой фильтр.'],
  ['grain-delay', 'Grain Delay', 'space', 'a', 'Режет звук на гранулы и сдвигает высоту — глитч и облака.'],
  /* 4. Сатурация и искажение */
  ['saturator', 'Saturator', 'sat', 'a', 'Тепло и плотность: от лёгкой сатурации до дисторшна.', 'upd'],
  ['roar', 'Roar', 'sat', 'a', 'Мощная сатурация с фильтрами, обратной связью и модуляцией.', 'new'],
  ['dynamic-tube', 'Dynamic Tube', 'sat', 'a', 'Ламповое тепло, которое реагирует на громкость.'],
  ['overdrive', 'Overdrive', 'sat', 'a', 'Овердрайв в духе гитарной педали с фильтром.'],
  ['pedal', 'Pedal', 'sat', 'a', 'Гитарные педали: овердрайв, дисторшн, фузз.'],
  ['amp', 'Amp', 'sat', 'a', 'Модели гитарных усилителей.'],
  ['cabinet', 'Cabinet', 'sat', 'a', 'Модели гитарных кабинетов и микрофонов.'],
  ['erosion', 'Erosion', 'sat', 'a', 'Цифровая «грязь» и шум в верхних частотах.'],
  ['redux', 'Redux', 'sat', 'a', 'Снижает разрядность и частоту дискретизации — lo-fi и биткраш.'],
  ['vinyl-distortion', 'Vinyl Distortion', 'sat', 'a', 'Треск и искажения виниловой пластинки.'],
  /* 5. Модуляция */
  ['chorus-ensemble', 'Chorus-Ensemble', 'mod', 'a', 'Хорус и ансамбль: ширина и «плавание» звука.'],
  ['phaser-flanger', 'Phaser-Flanger', 'mod', 'a', 'Фэйзер и флэнджер: движение и «реактивный» свист.'],
  ['auto-pan-tremolo', 'Auto Pan-Tremolo', 'mod', 'a', 'Качает звук между каналами или по громкости.', 'new'],
  ['shifter', 'Shifter', 'mod', 'a', 'Сдвиг высоты и частоты, кольцевая модуляция.'],
  ['auto-shift', 'Auto Shift', 'mod', 'a', 'Автоподстройка высоты голоса и форманты.', 'new'],
  /* 6. Креатив */
  ['spectral-resonator', 'Spectral Resonator', 'cre', 'a', 'Превращает звук в тональный резонанс, можно играть нотами.'],
  ['spectral-time', 'Spectral Time', 'cre', 'a', 'Заморозка звука и спектральные задержки.'],
  ['resonators', 'Resonators', 'cre', 'a', 'Пять резонаторов, настроенных на ноты.'],
  ['corpus', 'Corpus', 'cre', 'a', 'Резонанс физических тел: труба, пластина, струна.'],
  ['vocoder', 'Vocoder', 'cre', 'a', 'Робот-голос: один звук задаёт тембр другому.'],
  ['beat-repeat', 'Beat Repeat', 'cre', 'a', 'Повторы и статтеры кусков ритма — сбивки и глитч.'],
  ['looper', 'Looper', 'cre', 'a', 'Лупер как педаль: запись и наложение петель вживую.'],
  /* 7. Модуляторы и Racks */
  ['lfo', 'LFO', 'ctl', 'x', 'Модулятор: качает любой параметр по волне.'],
  ['envelope-follower', 'Envelope Follower', 'ctl', 'x', 'Двигает параметр вслед за громкостью сигнала.'],
  ['shaper', 'Shaper', 'ctl', 'x', 'Модулятор по нарисованной форме.'],
  ['audio-effect-rack', 'Audio Effect Rack', 'ctl', 'r:an-overview-of-racks', 'Контейнер эффектов: макро-ручки и параллельные цепи.'],
  ['external-audio-effect', 'External Audio Effect', 'ctl', 'a', 'Подключает внешний «железный» эффект.', 'card'],
  /* 8. Синтезаторы */
  ['drift', 'Drift', 'syn', 'i', 'Простой аналоговый синт: тёплые басы, пэды, лиды.'],
  ['meld', 'Meld', 'syn', 'i', 'Двухголосый синт с макро-осцилляторами: текстуры и необычные звуки.', 'new'],
  ['wavetable', 'Wavetable', 'syn', 'i', 'Вейвтейбл-синт: современные басы, лиды, пэды.'],
  ['operator', 'Operator', 'syn', 'i', 'FM-синтез: колокольчики, басы, плаки.'],
  ['analog', 'Analog', 'syn', 'i', 'Классический аналоговый (вычитательный) синт.'],
  ['tension', 'Tension', 'syn', 'i', 'Физическая модель струны: щипок, удар, смычок.'],
  ['collision', 'Collision', 'syn', 'i', 'Физическая модель ударных: маримба, колокола.'],
  ['electric', 'Electric', 'syn', 'i', 'Модель электропиано.'],
  /* 9. Сэмплеры и барабаны */
  ['simpler', 'Simpler', 'smp', 'i', 'Простой сэмплер: играй сэмпл нотами или нарезай его.'],
  ['sampler', 'Sampler', 'smp', 'i', 'Полный сэмплер: зоны, слои, модуляция.'],
  ['drum-sampler', 'Drum Sampler', 'smp', 'i', 'Сэмплер для одиночных ударов в Drum Rack.', 'new'],
  ['impulse', 'Impulse', 'smp', 'i', 'Драм-машина на 8 ячеек сэмплов.'],
  ['drum-rack', 'Drum Rack', 'smp', 'r:drum-racks', 'Пэды для ударных: каждая клавиша — свой звук и свои эффекты.'],
  ['ds-kick', 'DS Kick', 'smp', 'x', 'Синтезированный кик, без сэмплов.'],
  ['ds-snare', 'DS Snare', 'smp', 'x', 'Синтезированный снейр.'],
  ['ds-clap', 'DS Clap', 'smp', 'x', 'Синтезированный клэп.'],
  ['ds-hh', 'DS HH', 'smp', 'x', 'Синтезированные хэты.'],
  ['ds-cymbal', 'DS Cymbal', 'smp', 'x', 'Синтезированная тарелка.'],
  ['ds-tom', 'DS Tom', 'smp', 'x', 'Синтезированный том.'],
  ['ds-clang', 'DS Clang', 'smp', 'x', 'Синтезированный металлический перкуссионный звук.'],
  ['ds-fm', 'DS FM', 'smp', 'x', 'FM-перкуссия.'],
  ['instrument-rack', 'Instrument Rack', 'smp', 'r:an-overview-of-racks', 'Слои инструментов, сплиты по клавиатуре и макросы.'],
  ['external-instrument', 'External Instrument', 'smp', 'i', 'Подключает внешний синтезатор.', 'card'],
  /* 10. MIDI-эффекты */
  ['arpeggiator', 'Arpeggiator', 'midi', 'm', 'Играет аккорд по нотам — арпеджио.'],
  ['chord', 'Chord', 'midi', 'm', 'Из одной ноты делает аккорд.'],
  ['scale', 'Scale', 'midi', 'm', 'Загоняет любые ноты в выбранную гамму.'],
  ['pitch', 'Pitch', 'midi', 'm', 'Транспонирует входящие ноты.'],
  ['note-echo', 'Note Echo', 'midi', 'x', 'MIDI-эхо: повторяет ноты.'],
  ['note-length', 'Note Length', 'midi', 'm', 'Меняет длину нот.'],
  ['random', 'Random', 'midi', 'm', 'Случайно меняет высоту нот.'],
  ['velocity', 'Velocity', 'midi', 'm', 'Меняет силу нажатия (velocity) нот.'],
  ['cc-control', 'CC Control', 'midi', 'm', 'Отправляет MIDI CC — управление железом и автоматизация.', 'new'],
  ['envelope-midi', 'Envelope MIDI', 'midi', 'x', 'Огибающая по нажатию ноты для любого параметра.'],
  ['shaper-midi', 'Shaper MIDI', 'midi', 'x', 'Модулятор по нарисованной форме, запускается нотой.'],
  ['expression-control', 'Expression Control', 'midi', 'x', 'Направляет velocity, колесо и другие жесты на параметры.'],
  ['mpe-control', 'MPE Control', 'midi', 'x', 'Настраивает MPE-выразительность нот.'],
  ['midi-effect-rack', 'MIDI Effect Rack', 'midi', 'r:an-overview-of-racks', 'Контейнер MIDI-эффектов с макросами.'],
  ['midi-monitor', 'MIDI Monitor', 'midi', 'x', 'Показывает, какие MIDI-сообщения проходят.', 'card'],
].map(([id, name, group, man, tagline, flags = '']) => {
  const [ch, anchor] = man.split(':');
  return {
    id, name, group, tagline,
    manual: `${MANUAL_BASE}${MANUAL_CH[ch]}/#${anchor || id}`,
    isNew: flags.includes('new'), upd: flags.includes('upd'), card: flags.includes('card'), m4l: ch === 'x',
    ready: READY.includes(id) || (typeof window !== 'undefined' && (window.READY_EXTRA || []).includes(id)),
  };
});
