// Ember Duel — deterministic screenshot staging.
//
// ?shot=start|play|end&seed=N paints one frozen scene instead of running the
// loop, so the same URL always renders the same picture. The states are built
// from the same deck and rules code as a real duel, just dealt to a chosen
// mid-game position.

import { createDuelist, dealOpeningHands, drawCards } from './deck.js';
import { createRandom } from './random.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function baseState() {
  return {
    screen: SCREEN_TITLE,
    turn: 'player',
    turnCount: 1,
    selectedUid: null,
    lastPlayed: null,
    log: [],
    winner: null,
    best: '',
    fx: { floats: [], embers: [] },
    player: null,
    rival: null,
  };
}

// A mid-duel table: both sides hurt, hands full, ember mid-pool, a log with
// a few turns of history and a card on the table.
function stagePlay(seed) {
  const rng = createRandom(seed);
  const state = baseState();
  state.screen = SCREEN_PLAY;
  state.turnCount = 6;
  state.player = createDuelist('You', false, createRandom(seed + 11));
  state.rival = createDuelist('Rival', true, createRandom(seed + 23));
  dealOpeningHands(state.player, state.rival, rng);
  state.player.life = 14;
  state.player.shield = 3;
  state.player.ember = 5;
  state.player.emberMax = 6;
  state.rival.life = 11;
  state.rival.shield = 0;
  state.rival.ember = 4;
  state.rival.emberMax = 6;
  drawCards(state.player, 1);
  drawCards(state.rival, 1);
  state.selectedUid = state.player.hand[1] ? state.player.hand[1].uid : null;
  state.lastPlayed = {
    by: 'Rival',
    card: state.rival.hand[0] || state.player.hand[0],
  };
  state.log = [
    'Turn 4 — You played Flame Lash for 4.',
    'Turn 4 — Rival raised Ember Bulwark (+5 shield).',
    'Turn 5 — Rival played Inferno for 7!',
    'Turn 5 — You played Mend and healed 4.',
    'Turn 6 — Rival banks ember, eyeing something big…',
    'Your turn — play a card, then end your turn.',
  ];
  return state;
}

function stageEnd(seed) {
  const rng = createRandom(seed);
  const state = baseState();
  state.screen = SCREEN_OVER;
  state.turnCount = 9;
  state.player = createDuelist('You', false, createRandom(seed + 11));
  state.rival = createDuelist('Rival', true, createRandom(seed + 23));
  dealOpeningHands(state.player, state.rival, rng);
  state.player.life = 6;
  state.player.shield = 0;
  state.rival.life = 0;
  state.winner = 'player';
  state.best = 'Victory in 9 turns';
  state.log = ['Turn 9 — You played Inferno for 7!', 'Rival defeated. Victory!'];
  // A frozen ember burst for the win screen.
  for (let i = 0; i < 26; i += 1) {
    state.fx.embers.push({
      x: 320 + rng.next() * 640,
      y: 90 + rng.next() * 420,
      size: 10 + rng.next() * 22,
      color: i % 2 === 0 ? '#f59e0b' : '#ffd166',
      life: 0.6 + rng.next() * 0.4,
    });
  }
  return state;
}

export function stageShot(shot, seed) {
  if (shot === 'play') return stagePlay(seed);
  if (shot === 'end') return stageEnd(seed);
  const state = baseState();
  state.screen = SCREEN_TITLE;
  state.best = 'Victory in 9 turns';
  return state;
}
