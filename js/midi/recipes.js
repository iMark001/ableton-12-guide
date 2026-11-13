/* «Рецепт звука» в карточках партий на странице MIDI: берёт данные раздела «По партиям». */
(function () {
'use strict';
const MP = window.MidiPage;
/* партия генератора → партия гида */
const MAP = { sub: 'sub', bass: 'bass', chords: 'keys', pad: 'pad', pluck: 'pluck', arp: 'arp', lead: 'lead', chop: 'vocal' };
MP.recipes = {
  markup(part) {
    const id = MAP[part] || part;
    return `${window.PartView.makeMarkup(id, { base: 'index.html', kinds: ['live', 'serum', 'diva'] })}
      <a class="btn sm" href="index.html#p-${id}">Обработка этой партии: цепочка эффектов →</a>`;
  },
};
})();
