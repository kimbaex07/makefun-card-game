// Ember Duel — table and card constants.
//
// One duel: two duelists, 20 life each, a shared ember economy. Every card
// costs ember, and every card is told apart by colour AND shape, never by
// text alone, so a hand stays readable at thumbnail size.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const START_LIFE = 20;
export const START_HAND = 5;
export const MAX_HAND = 7;
export const MAX_EMBER = 10;
export const START_EMBER = 3;

// Card kinds: damage, shield, heal, draw, ember, drain (damage + self cost).
export const KIND_DAMAGE = 'damage';
export const KIND_SHIELD = 'shield';
export const KIND_HEAL = 'heal';
export const KIND_DRAW = 'draw';
export const KIND_EMBER = 'ember';
export const KIND_GAMBIT = 'gambit';

// Colour and shape per kind: the shape is drawn on the card, the colour
// fills it, so kind is readable even without reading the name.
export const KIND_STYLE = {
  [KIND_DAMAGE]: { color: '#e2483a', dark: '#8f1f16', shape: 'flame' },
  [KIND_SHIELD]: { color: '#3a86d8', dark: '#174a80', shape: 'shield' },
  [KIND_HEAL]: { color: '#3fae5a', dark: '#1d6b32', shape: 'leaf' },
  [KIND_DRAW]: { color: '#8b5cf6', dark: '#4c2a9e', shape: 'scroll' },
  [KIND_EMBER]: { color: '#f59e0b', dark: '#92580a', shape: 'ember' },
  [KIND_GAMBIT]: { color: '#d946ef', dark: '#7a1d8f', shape: 'skull' },
};

// Every card in the game. value means damage, shield, healing, cards drawn
// or ember gained depending on kind; extra holds the secondary effect.
export const CARD_DEFS = [
  { id: 'spark', name: 'Spark', cost: 1, kind: KIND_DAMAGE, value: 2, text: 'Deal 2 damage.' },
  { id: 'lash', name: 'Flame Lash', cost: 2, kind: KIND_DAMAGE, value: 4, text: 'Deal 4 damage.' },
  { id: 'inferno', name: 'Inferno', cost: 4, kind: KIND_DAMAGE, value: 7, text: 'Deal 7 damage.' },
  { id: 'cinder', name: 'Cinder Burst', cost: 3, kind: KIND_DAMAGE, value: 3, extra: { draw: 1 }, text: 'Deal 3. Draw a card.' },
  { id: 'chill', name: 'Frostbite', cost: 2, kind: KIND_DAMAGE, value: 3, extra: { drainEmber: 1 }, text: 'Deal 3. Foe loses 1 ember.' },
  { id: 'phoenix', name: 'Phoenix Rise', cost: 5, kind: KIND_DAMAGE, value: 5, extra: { heal: 3 }, text: 'Deal 5. Heal 3.' },
  { id: 'gambit', name: 'Ashen Gambit', cost: 3, kind: KIND_GAMBIT, value: 6, extra: { selfDamage: 2 }, text: 'Deal 6. Take 2 damage.' },
  { id: 'wall', name: 'Stone Wall', cost: 1, kind: KIND_SHIELD, value: 3, text: 'Gain 3 shield.' },
  { id: 'bulwark', name: 'Ember Bulwark', cost: 2, kind: KIND_SHIELD, value: 5, text: 'Gain 5 shield.' },
  { id: 'mend', name: 'Mend', cost: 2, kind: KIND_HEAL, value: 4, text: 'Heal 4 life.' },
  { id: 'kindle', name: 'Kindle', cost: 0, kind: KIND_DRAW, value: 2, text: 'Draw 2 cards.' },
  { id: 'stoke', name: 'Stoke', cost: 1, kind: KIND_EMBER, value: 2, text: 'Gain 2 ember.' },
];

// How many copies of each card id make one 30-card deck.
export const DECK_RECIPE = {
  spark: 4, lash: 3, inferno: 2, cinder: 2, chill: 2, phoenix: 1,
  gambit: 2, wall: 4, bulwark: 3, mend: 3, kindle: 2, stoke: 2,
};

export const DECK_SIZE = Object.values(DECK_RECIPE).reduce((a, b) => a + b, 0);

export function cardDef(id) {
  return CARD_DEFS.find((d) => d.id === id);
}
