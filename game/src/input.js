// Ember Duel — mouse and keyboard input.
//
// The canvas is scaled to the window, so pointer coordinates are mapped back
// into the 1280x720 logical table before hit-testing the hand, the End Turn
// button and the mute corner. Keys: 1-7 play a card, Space ends the turn,
// Enter starts, R restarts, M mutes.

import { CANVAS_H, CANVAS_W } from './config.js';
import { layoutPlay } from './render.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_END_TURN = 'end-turn';
export const ACTION_PLAY_CARD = 'play-card';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * CANVAS_W,
    y: ((clientY - rect.top) / rect.height) * CANVAS_H,
  };
}

function inside(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function createInput(canvas, hooks) {
  canvas.addEventListener('click', (event) => {
    const { x, y } = toLogical(canvas, event.clientX, event.clientY);
    const state = hooks.getState();
    if (state.screen === 'title') {
      hooks.onAction(ACTION_CONFIRM);
      return;
    }
    if (state.screen === 'over') return;
    const layout = layoutPlay(state);
    if (inside(x, y, layout.mute)) {
      hooks.onAction(ACTION_MUTE);
      return;
    }
    if (inside(x, y, layout.endTurn)) {
      hooks.onAction(ACTION_END_TURN);
      return;
    }
    for (const r of layout.handRects) {
      if (inside(x, y, r)) {
        hooks.onAction(ACTION_PLAY_CARD, r.card.uid);
        return;
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const state = hooks.getState();
    if (event.key === 'm' || event.key === 'M') {
      hooks.onAction(ACTION_MUTE);
      return;
    }
    if (state.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      hooks.onAction(ACTION_CONFIRM);
      return;
    }
    if (state.screen === 'over' && (event.key === 'r' || event.key === 'R')) {
      hooks.onAction(ACTION_RESTART);
      return;
    }
    if (state.screen !== 'play') return;
    if (event.key === ' ') {
      event.preventDefault();
      hooks.onAction(ACTION_END_TURN);
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      hooks.onAction(ACTION_RESTART);
      return;
    }
    const digit = Number.parseInt(event.key, 10);
    if (digit >= 1 && digit <= 7) {
      const card = state.player.hand[digit - 1];
      if (card) hooks.onAction(ACTION_PLAY_CARD, card.uid);
    }
  });
}
