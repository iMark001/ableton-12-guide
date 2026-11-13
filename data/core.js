/* Общие справочники гида: стили, партии (что обрабатываем), группы устройств. */

const STYLES = {
  house:     { name: 'House',          icon: '🏠', color: '#ff9f43', desc: 'Грув, тёплый низ, «дыхание» в такт' },
  techhouse: { name: 'Tech House',     icon: '🔩', color: '#facc15', desc: 'Панчевый кик, басовый грув, сухо' },
  techno:    { name: 'Techno',         icon: '⚙️', color: '#ff4d6d', desc: 'Плотность, драйв, жёсткая компрессия' },
  melodic:   { name: 'Melodic Techno', icon: '🌌', color: '#7c5cff', desc: 'Широкие пэды, пространство, эпик' },
  afro:      { name: 'Afro House',     icon: '🪘', color: '#f97316', desc: 'Перкуссия, живые тембры, полиритм' },
  organic:   { name: 'Organic House',  icon: '🌿', color: '#84cc16', desc: 'Тёплые живые звуки, мягкая динамика' },
  garage:    { name: 'UK Garage',      icon: '🎛️', color: '#22d3ee', desc: 'Свинг, вокальные чопы, септаккорды' },
  downtempo: { name: 'Downtempo',      icon: '🌙', color: '#c084fc', desc: 'Медленно, глубоко, много воздуха' },
  ambient:   { name: 'Ambient',        icon: '🌫️', color: '#5eead4', desc: 'Длинные хвосты, минимум компрессии' },
};

const INSTRUMENTS = {
  vocal:  { name: 'Вокал',              icon: '🎤' },
  kick:   { name: 'Кик',                icon: '🥁' },
  sub:    { name: 'Саб-бас',            icon: '🫧' },
  clap:   { name: 'Клэп / снейр',       icon: '👏' },
  hats:   { name: 'Хэты / перкуссия',   icon: '🪇' },
  drums:  { name: 'Барабанная шина',    icon: '🛢️' },
  bass:   { name: 'Бас',                icon: '🔊' },
  pad:    { name: 'Пэд',                icon: '☁️' },
  lead:   { name: 'Лид / синт',         icon: '⚡' },
  pluck:  { name: 'Плак',               icon: '💧' },
  arp:    { name: 'Арпеджио',           icon: '🔁' },
  keys:   { name: 'Клавиши / аккорды',  icon: '🎹' },
  guitar: { name: 'Гитара / живые',     icon: '🎸' },
  fx:     { name: 'FX / атмосферы',     icon: '✨' },
  mixbus: { name: 'Шина / группа',      icon: '🎚️' },
  master: { name: 'Мастер',             icon: '🏁' },
};

const GROUPS = [
  { id: 'dyn',   name: 'Динамика',              color: '#ffc93c', icon: '🗜️' },
  { id: 'eq',    name: 'EQ, фильтры, утилиты',  color: '#22d3ee', icon: '📈' },
  { id: 'space', name: 'Пространство',          color: '#7c5cff', icon: '🌌' },
  { id: 'sat',   name: 'Сатурация и искажение', color: '#ff6b3d', icon: '🔥' },
  { id: 'mod',   name: 'Модуляция',             color: '#f472b6', icon: '🌀' },
  { id: 'cre',   name: 'Креатив',               color: '#34d399', icon: '🧪' },
  { id: 'ctl',   name: 'Модуляторы и Racks',    color: '#a3e635', icon: '🧷' },
  { id: 'syn',   name: 'Синтезаторы',           color: '#a78bfa', icon: '🎹' },
  { id: 'smp',   name: 'Сэмплеры и барабаны',   color: '#fb923c', icon: '🥁' },
  { id: 'midi',  name: 'MIDI-эффекты',          color: '#60a5fa', icon: '🎼' },
];
