// Ember Duel — decks, hands and the duelist's state.
//
// A duelist is plain data: life, shield, ember, a draw pile, a hand and a
// discard pile. Nothing here touches the canvas or the network.

import {
  CARD_DEFS,
  DECK_RECIPE,
  MAX_EMBER,
  MAX_HAND,
  START_EMBER,
  START_HAND,
  START_LIFE,
} from './config.js';
import { shuffleInPlace } from './random.js';

let nextCardUid = 1;

export function makeCard(defId) {
  const def = CARD_DEFS.find((d) => d.id === defId);
  return { uid: nextCardUid, def, played: false };
}

export function buildDeck(rng) {
  const ids = [];
  for (const [id, count] of Object.entries(DECK_RECIPE)) {
    for (let i = 0; i < count; i += 1) ids.push(id);
  }
  shuffleInPlace(rng, ids);
  return ids.map((id) => makeCard(id));
}

export function createDuelist(name, isAi, rng) {
  return {
    name,
    isAi,
    rng,
    life: START_LIFE,
    shield: 0,
    ember: START_EMBER,
    emberMax: START_EMBER,
    deck: buildDeck(rng),
    hand: [],
    discard: [],
  };
}

export function drawCards(duelist, count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (duelist.hand.length >= MAX_HAND) break;
    if (duelist.deck.length === 0) {
      if (duelist.discard.length === 0) break;
      // Reshuffle the discard pile into a fresh deck with the duelist's
      // seeded source, so a seeded duel stays replayable.
      duelist.deck = duelist.discard.splice(0);
      shuffleInPlace(duelist.rng, duelist.deck);
    }
    const card = duelist.deck.pop();
    duelist.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

export function dealOpeningHands(player, rival, rng) {
  drawCards(player, START_HAND);
  drawCards(rival, START_HAND);
}

// Start of a duelist's turn: one more ember pip (up to the cap), refill the
// ember pool, draw a card. Shield is kept: a wall you raised stays up until
// it is broken.
export function startTurn(duelist) {
  if (duelist.emberMax < MAX_EMBER) duelist.emberMax += 1;
  duelist.ember = duelist.emberMax;
  drawCards(duelist, 1);
}

// Damage first eats shield, then life. Returns the life lost.
export function dealDamage(target, amount) {
  let rest = amount;
  if (target.shield > 0) {
    const blocked = Math.min(target.shield, rest);
    target.shield -= blocked;
    rest -= blocked;
  }
  const lifeLost = Math.min(target.life, rest);
  target.life -= lifeLost;
  return lifeLost;
}

export function healLife(duelist, amount) {
  duelist.life = Math.min(START_LIFE, duelist.life + amount);
}

export function gainShield(duelist, amount) {
  duelist.shield += amount;
}

export function isDefeated(duelist) {
  return duelist.life <= 0;
}
