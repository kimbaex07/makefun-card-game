// Ember Duel — what a card does when it is played.
//
// One function, shared by the player and the rival, so both sides obey the
// same rules. It returns a list of events (damage, shield, heal, draw,
// ember, self-damage) that the main loop turns into floating numbers,
// sounds and log lines.

import { KIND_DAMAGE, KIND_DRAW, KIND_EMBER, KIND_GAMBIT, KIND_HEAL, KIND_SHIELD } from './config.js';
import { dealDamage, drawCards, gainShield, healLife } from './deck.js';

export function resolveCardPlay(attacker, defender, card) {
  const def = card.def;
  const events = [];
  attacker.ember -= def.cost;

  // Remove the card from the hand into the discard pile.
  const at = attacker.hand.indexOf(card);
  if (at !== -1) attacker.hand.splice(at, 1);
  attacker.discard.push(card);

  if (def.kind === KIND_DAMAGE || def.kind === KIND_GAMBIT) {
    const lost = dealDamage(defender, def.value);
    events.push({ type: 'damage', amount: def.value, lifeLost: lost, target: defender.isAi ? 'rival' : 'player' });
  }
  if (def.kind === KIND_SHIELD) {
    gainShield(attacker, def.value);
    events.push({ type: 'shield', amount: def.value, target: attacker.isAi ? 'rival' : 'player' });
  }
  if (def.kind === KIND_HEAL) {
    healLife(attacker, def.value);
    events.push({ type: 'heal', amount: def.value, target: attacker.isAi ? 'rival' : 'player' });
  }
  if (def.kind === KIND_DRAW) {
    const drawn = drawCards(attacker, def.value);
    events.push({ type: 'draw', amount: drawn.length, target: attacker.isAi ? 'rival' : 'player' });
  }
  if (def.kind === KIND_EMBER) {
    attacker.ember += def.value;
    events.push({ type: 'ember', amount: def.value, target: attacker.isAi ? 'rival' : 'player' });
  }
  if (def.extra) {
    if (def.extra.draw) {
      const drawn = drawCards(attacker, def.extra.draw);
      events.push({ type: 'draw', amount: drawn.length, target: attacker.isAi ? 'rival' : 'player' });
    }
    if (def.extra.heal) {
      healLife(attacker, def.extra.heal);
      events.push({ type: 'heal', amount: def.extra.heal, target: attacker.isAi ? 'rival' : 'player' });
    }
    if (def.extra.drainEmber) {
      defender.ember = Math.max(0, defender.ember - def.extra.drainEmber);
      events.push({ type: 'drain', amount: def.extra.drainEmber, target: defender.isAi ? 'rival' : 'player' });
    }
    if (def.extra.selfDamage) {
      const lost = dealDamage(attacker, def.extra.selfDamage);
      events.push({ type: 'damage', amount: def.extra.selfDamage, lifeLost: lost, target: attacker.isAi ? 'rival' : 'player', self: true });
    }
  }
  return events;
}

export function canAfford(duelist, card) {
  return duelist.ember >= card.def.cost;
}
