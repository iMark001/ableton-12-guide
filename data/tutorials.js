/* Туториалы: общие приёмы из обучающих материалов сэмпл-паков, пересказанные своими словами и перенесённые в Live 12.
   Названия паков и их авторов не упоминаются. Факты про Live — по мануалу Live 12 (ref/manual), ручки — по data/devices.
   Урок: { id, title, goal, styles: [] = для всех, steps: [{ do, see }], devices: [id из CATALOG], links: [{ href, label }], why, tip?, demo? }.
   demo — плеер на 1 такт: { bpm, a: { label, tracks }, b: { label, tracks }, note? };
   дорожка: { sound, steps: 16 громкостей 0–127, swing?: 0–0.75, duck?: 0–1 (сайдчейн от кика), pan?: −1…1, note?: MIDI }. */

const TUT_TABS = [
  { id: 'start',   icon: '🚀', title: 'С чего начать',        sub: 'Первый дроп в Live 12 с нуля: бас, барабаны, аккорды, плак, сведение. Только встроенные устройства.' },
  { id: 'drums',   icon: '🥁', title: 'Барабаны и грув', short: 'Барабаны',      sub: 'Кик, хэты, грув и «живость»: громкость ударов, свинг, Groove Pool, слои, румбл.' },
  { id: 'harmony', icon: '🎹', title: 'Гармония и мелодия', short: 'Гармония',   sub: 'Аккорды, лады и мелодии в Scale Mode — без знания нот. Подробная теория — на странице MIDI.' },
  { id: 'sound',   icon: '🎛️', title: 'Звук',                 sub: 'Саунд-дизайн стоком: лиды, плаки, басы, пэды, SFX и текстуры.' },
  { id: 'serum',   icon: '🌀', title: 'Serum 2',              sub: 'Приёмы из видеоуроков: гранулярные и спектральные аккорды, эмбиент, лиды, басы, кик, клэп и тарелки в Serum 2.' },
  { id: 'arrange', icon: '🧱', title: 'Аранжировка',          sub: 'Как из 8-тактовой петли сделать трек: части, контраст, брейки, дропы, переходы.' },
  { id: 'mix',     icon: '🎚️', title: 'Сведение и мастеринг', short: 'Сведение', sub: 'Посылы, сайдчейн, параллельная компрессия, ширина, мастер-цепочка из стока.' },
  { id: 'work',    icon: '⚡', title: 'Рабочий процесс', short: 'Работа',      sub: 'Шаблоны, клавиши, свои пресеты, разгрузка процессора, как доделывать треки.' },
];

/* Типичный темп и свинг стиля — для примеров и расчётов «в темп» (общепринятые диапазоны жанров, ориентир). */
const FOUR = [0, 4, 8, 12];
/* prog — прогрессия жанра из страницы MIDI (js/midi/chords.js, PROGS): ступени от тоники, лад, септаккорды. */
const TUT_STYLE = {
  house:     { bpm: 124, range: '120–126', swing: 0.12, kick: FOUR,    prog: { id: 'm-deep',  fam: 'minor', deg: [0, 3, 0, 3], seventh: true, name: 'Глубокий грув' } },
  techhouse: { bpm: 126, range: '124–128', swing: 0.08, kick: FOUR,    prog: { id: 'm-two',   fam: 'minor', deg: [0, 6, 0, 6], name: 'Два аккорда' } },
  techno:    { bpm: 132, range: '128–140', swing: 0,    kick: FOUR,    prog: { id: 'm-drive', fam: 'minor', deg: [0, 6, 5, 6], name: 'Тёмный драйв' } },
  melodic:   { bpm: 123, range: '120–126', swing: 0,    kick: FOUR,    prog: { id: 'm-epic',  fam: 'minor', deg: [0, 5, 2, 6], name: 'Эпичная' } },
  afro:      { bpm: 122, range: '118–124', swing: 0.18, kick: FOUR,    prog: { id: 'm-swing', fam: 'minor', deg: [0, 3, 4, 0], name: 'Минимал-качели' } },
  organic:   { bpm: 118, range: '110–122', swing: 0.15, kick: FOUR,    prog: { id: 'M-calm',  fam: 'major', deg: [0, 3, 0, 3], seventh: true, name: 'Светлые качели' } },
  garage:    { bpm: 132, range: '130–136', swing: 0.3,  kick: [0, 10], prog: { id: 'M-jazz',  fam: 'major', deg: [1, 4, 0, 0], seventh: true, name: 'Джазовая ii–V–I' } },
  downtempo: { bpm: 100, range: '85–110',  swing: 0.15, kick: [0, 10], prog: { id: 'm-sad',   fam: 'minor', deg: [0, 4, 5, 3], name: 'Грустная' } },
  ambient:   { bpm: 80,  range: '60–90',   swing: 0,    kick: [0],     prog: { id: 'M-calm',  fam: 'major', deg: [0, 3, 0, 3], seventh: true, name: 'Светлые качели' } },
};
/* Урок: short (3–4 строки) + схемы. Если visual не задан, схема собирается сама: цепочка из devices со значениями
   «партия (part) × стиль» из data/devices, совет стиля из «По партиям», рецепт Serum 2 для part, prog: true — прогрессия жанра,
   recipes: true — приёмы автоматизации жанра. byStyle { 'house garage': {…} } — свои правки под стили.
   В текстах: {bpm}, {style}, {ms:0.5} (доля четверти в мс в темпе стиля). Демо всегда в темпе стиля; кик в 1-тактовых
   демо — рисунок стиля (keepKick: true — оставить свой); swing: 'style' у дорожки — свинг стиля. */

/* Звуки плеера (синтез в браузере, js/tutorials/groove.js) */
const TUT_SOUNDS = ['kick', 'hat', 'ohat', 'shaker', 'clap', 'snare', 'tom', 'rim', 'bass', 'pad'];

const TUTORIALS = [];
function tutAdd(tab, list) {
  list.forEach(t => TUTORIALS.push(Object.assign({ tab, styles: [], devices: [], links: [] }, t)));
}

/* Ступени 16-х: удобные сетки для демо (громкость 0–127) */
const tutGrid = (hits, vel = 110) => Array.from({ length: 16 }, (_, i) => (hits.includes(i) ? vel : 0));
const TUT_KICK = tutGrid([0, 4, 8, 12], 120);
/* 4 такта (64 шестнадцатых): удар в начале каждого такта / каждых двух тактов — для аккордов и баса */
const TUT_BARS4 = Array.from({ length: 64 }, (_, i) => (i % 16 === 0 ? 100 : 0));
const TUT_BARS2X = Array.from({ length: 64 }, (_, i) => (i % 32 === 0 ? 100 : 0));
