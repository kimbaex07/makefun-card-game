// Ember Duel — boot and the one loop.
//
// The game moves between three screens: title, play and over. A duel is a
// strict alternation: the player plays cards, ends the turn, the rival takes
// its turn one card at a time (so its choices stay readable), then the player
// draws and gains ember. ?seed=N fixes the deal; ?shot=start|play|end stages
// a frozen scene for a screenshot and sets window.__shotReady.

import { createDuelist, dealOpeningHands, isDefeated, startTurn } from './deck.js';
import { rivalNextMove } from './ai.js';
import { resolveCardPlay } from './rules.js';
import {
  soundDamage,
  soundDraw,
  soundHeal,
  soundLose,
  soundPlayCard,
  soundShield,
  soundTurn,
  soundWin,
  toggleMute,
} from './audio.js';
import {
  ACTION_CONFIRM,
  ACTION_END_TURN,
  ACTION_MUTE,
  ACTION_PLAY_CARD,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createRandom } from './random.js';
import {
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

const BEST_KEY = 'ember-duel-best';
const AI_STEP_MS = 750;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const renderer = createRenderer(canvas);
const rng = createRandom(seed);

let state = null;
let aiTimer = null;

function readBest() {
  try {
    return window.localStorage.getItem(BEST_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveBest(text) {
  try {
    window.localStorage.setItem(BEST_KEY, text);
  } catch {
    // Private mode: the record is nice to have, never required.
  }
}

function log(line) {
  state.log.push(line);
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
}

function announce(line) {
  statusEl.textContent = line;
}

function floatAt(target, label, color) {
  const x = target === 'player' ? 240 : 240;
  const y = target === 'player' ? 470 : 80;
  state.fx.floats.push({ x, y, label, color, life: 1 });
}

function burstEmbers(count) {
  for (let i = 0; i < count; i += 1) {
    state.fx.embers.push({
      x: 640 + (rng.next() - 0.5) * 500,
      y: 360 + (rng.next() - 0.5) * 260,
      vx: (rng.next() - 0.5) * 0.6,
      vy: -0.4 - rng.next() * 0.9,
      size: 10 + rng.next() * 20,
      color: rng.next() < 0.5 ? '#f59e0b' : '#ffd166',
      life: 1,
    });
  }
}

function describeEvents(who, card, events) {
  for (const ev of events) {
    if (ev.type === 'damage') {
      const target = ev.self ? who : ev.target === 'player' ? 'player' : 'rival';
      floatAt(target, `-${ev.amount}`, '#ff6b5e');
      soundDamage();
      if (ev.self) log(`${who} took ${ev.amount} backlash damage.`);
    }
    if (ev.type === 'shield') {
      floatAt(ev.target, `+${ev.amount} shield`, '#7db8f0');
      soundShield();
    }
    if (ev.type === 'heal') {
      floatAt(ev.target, `+${ev.amount}`, '#5fd68a');
      soundHeal();
    }
    if (ev.type === 'draw') {
      soundDraw();
      log(`${who} drew ${ev.amount} card${ev.amount === 1 ? '' : 's'}.`);
    }
    if (ev.type === 'ember') {
      floatAt(ev.target, `+${ev.amount} ember`, '#fbbf24');
    }
    if (ev.type === 'drain') {
      log(`${ev.target === 'player' ? 'You lose' : 'Rival loses'} ${ev.amount} ember.`);
    }
  }
}

function checkEnd(who, card) {
  if (isDefeated(state.rival)) return endDuel('player');
  if (isDefeated(state.player)) return endDuel('rival');
  return false;
}

function endDuel(winner) {
  state.winner = winner;
  state.screen = SCREEN_OVER;
  state.selectedUid = null;
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
  if (winner === 'player') {
    const text = `Victory in ${state.turnCount} turns`;
    state.best = text;
    saveBest(text);
    log('Rival defeated. Victory!');
    announce('Victory! The rival is defeated.');
    burstEmbers(60);
    soundWin();
  } else {
    log('You were defeated. The rival wins.');
    announce('Defeat. The rival wins the duel.');
    soundLose();
  }
}

function playCard(duelist, card) {
  const defender = duelist === state.player ? state.rival : state.player;
  const who = duelist === state.player ? 'You' : 'Rival';
  const events = resolveCardPlay(duelist, defender, card);
  state.lastPlayed = { by: who, card };
  state.selectedUid = null;
  soundPlayCard();
  log(`${who} played ${card.def.name} (${card.def.text})`);
  describeEvents(who, card, events);
  announce(`${who} played ${card.def.name}.`);
  return checkEnd(who, card);
}

function startDuel() {
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
  const player = createDuelist('You', false, createRandom(seed + 11));
  const rival = createDuelist('Rival', true, createRandom(seed + 23));
  state = {
    screen: SCREEN_PLAY,
    turn: 'player',
    turnCount: 1,
    selectedUid: null,
    lastPlayed: null,
    log: [],
    winner: null,
    best: readBest(),
    fx: { floats: [], embers: [] },
    player,
    rival,
  };
  dealOpeningHands(player, rival, rng);
  log('Duel begins. You hold 5 cards and 3 ember.');
  log('Your turn — play a card, then end your turn.');
  announce('Duel begins. Your turn.');
  soundTurn();
}

function endPlayerTurn() {
  if (state.screen !== SCREEN_PLAY || state.turn !== 'player') return;
  state.turn = 'rival';
  state.selectedUid = null;
  startTurn(state.rival);
  log(`Turn ${state.turnCount} — Rival draws and gains ember (${state.rival.ember}).`);
  announce("Rival's turn.");
  aiTimer = setTimeout(rivalStep, AI_STEP_MS);
}

function rivalStep() {
  aiTimer = null;
  if (state.screen !== SCREEN_PLAY || state.turn !== 'rival') return;
  const move = rivalNextMove(state.rival, state.player, rng);
  if (move.save) {
    log('Rival banks ember, eyeing something big…');
    announce('The rival banks ember.');
    endRivalTurn();
    return;
  }
  if (move.end || !move.card) {
    endRivalTurn();
    return;
  }
  const over = playCard(state.rival, move.card);
  if (over) return;
  aiTimer = setTimeout(rivalStep, AI_STEP_MS);
}

function endRivalTurn() {
  state.turnCount += 1;
  state.turn = 'player';
  startTurn(state.player);
  log(`Turn ${state.turnCount} — You draw a card and gain ember (${state.player.ember}).`);
  announce(`Turn ${state.turnCount}. Your turn.`);
  soundTurn();
}

function onAction(action, arg) {
  if (action === ACTION_MUTE) {
    toggleMute();
    return;
  }
  if (action === ACTION_RESTART) {
    startDuel();
    return;
  }
  if (state.screen === SCREEN_TITLE && action === ACTION_CONFIRM) {
    startDuel();
    return;
  }
  if (state.screen !== SCREEN_PLAY) return;
  if (action === ACTION_END_TURN) {
    endPlayerTurn();
    return;
  }
  if (action === ACTION_PLAY_CARD) {
    if (state.turn !== 'player') return;
    const card = state.player.hand.find((c) => c.uid === arg);
    if (!card) return;
    if (state.player.ember < card.def.cost) {
      log(`Not enough ember for ${card.def.name} (needs ${card.def.cost}).`);
      return;
    }
    playCard(state.player, card);
  }
}

// --- boot -------------------------------------------------------------------

function updateFx(dt) {
  for (const f of state.fx.floats) {
    f.y -= dt * 0.045;
    f.life -= dt * 0.0011;
  }
  state.fx.floats = state.fx.floats.filter((f) => f.life > 0);
  for (const p of state.fx.embers) {
    p.x += (p.vx ?? 0) * dt * 0.06;
    p.y += (p.vy ?? -0.3) * dt * 0.06;
    p.life -= dt * 0.0006;
  }
  state.fx.embers = state.fx.embers.filter((p) => p.life > 0 && p.y > -40);
  // A slow ambient drift of embers across the table while playing.
  if (state.screen === SCREEN_PLAY && state.fx.embers.length < 14 && rng.next() < 0.02) {
    state.fx.embers.push({
      x: 60 + rng.next() * 1160,
      y: 700,
      vx: (rng.next() - 0.5) * 0.2,
      vy: -0.25 - rng.next() * 0.4,
      size: 6 + rng.next() * 10,
      color: rng.next() < 0.5 ? '#f59e0b' : '#ffd166',
      life: 0.7,
    });
  }
}

let lastNow = performance.now();
function loop(now) {
  const dt = Math.min(100, now - lastNow);
  lastNow = now;
  updateFx(dt);
  renderer.draw(state);
  requestAnimationFrame(loop);
}

if (shot) {
  state = stageShot(shot, seed);
  renderer.resize();
  renderer.draw(state);
  renderer.draw(state);
  window.__shotReady = true;
} else {
  state = {
    screen: SCREEN_TITLE,
    turn: 'player',
    turnCount: 1,
    selectedUid: null,
    lastPlayed: null,
    log: [],
    winner: null,
    best: readBest(),
    fx: { floats: [], embers: [] },
    player: createDuelist('You', false, createRandom(seed + 11)),
    rival: createDuelist('Rival', true, createRandom(seed + 23)),
  };
  renderer.resize();
  window.addEventListener('resize', renderer.resize);
  createInput(canvas, { getState: () => state, onAction });
  requestAnimationFrame(loop);
}

// Test hook: the playtest reads the live state through this handle.
window.__emberDuel = { get state() { return state; }, startDuel, endPlayerTurn };
