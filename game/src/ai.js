// Ember Duel — the rival's mind.
//
// The rival is meant to be readable, not optimal. It shows its plan in the
// open so the player can counter it:
//  - When it holds Inferno but cannot afford it yet, it banks its ember and
//    ends the turn early — the log says so, and a shield answers it.
//  - When hurt, it walls up or mends instead of swinging.
//  - When the player is nearly beaten, it spends everything on damage.
// Otherwise it plays the best card it can afford, biggest first, and stops
// when nothing affordable is worth playing.

import { KIND_DAMAGE, KIND_DRAW, KIND_EMBER, KIND_HEAL, KIND_SHIELD } from './config.js';
import { canAfford } from './rules.js';

function scoreCard(rival, player, card) {
  const def = card.def;
  let score = def.value;
  if (def.kind === KIND_DAMAGE) {
    score += 3;
    // Finishing the player is worth more than anything.
    if (player.life - def.value <= 0) score += 100;
    if (player.life <= 6) score += 4;
  }
  if (def.kind === KIND_SHIELD) {
    score += rival.life <= 8 ? 8 : 2;
    if (rival.shield > 0) score -= 3;
  }
  if (def.kind === KIND_HEAL) {
    score += rival.life <= 10 ? 7 : 1;
    if (rival.life >= 18) score -= 5;
  }
  if (def.kind === KIND_DRAW) {
    score += rival.hand.length <= 2 ? 6 : 1;
  }
  if (def.kind === KIND_EMBER) {
    score += rival.ember <= 1 ? 3 : 0;
  }
  // Prefer cheap cards when ember is tight: value per ember.
  score += def.value / Math.max(1, def.cost);
  return score;
}

// Decide the rival's next move. Returns { card } to play a card,
// { save: true } when it banks ember for a big card, or { end: true }.
export function rivalNextMove(rival, player, rng) {
  const affordable = rival.hand.filter((c) => canAfford(rival, c));

  // Banking: Inferno in hand, ember short of its cost, and nothing urgent.
  const inferno = rival.hand.find((c) => c.def.id === 'inferno');
  if (inferno && rival.ember < inferno.def.cost && rival.life > 7) {
    const urgent = affordable.some((c) => c.def.kind === KIND_SHIELD || c.def.kind === KIND_HEAL);
    if (!urgent && rng.next() < 0.8) return { save: true };
  }

  if (affordable.length === 0) return { end: true };

  let best = affordable[0];
  let bestScore = scoreCard(rival, player, best);
  for (const card of affordable.slice(1)) {
    const s = scoreCard(rival, player, card);
    if (s > bestScore) {
      best = card;
      bestScore = s;
    }
  }
  // A free card is always worth playing; anything else needs a decent score.
  if (best.def.cost > 0 && bestScore < 4) return { end: true };
  return { card: best };
}
