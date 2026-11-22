// Ember Duel — everything the player sees, painted on one canvas.
//
// The table is a felt green-baize with ember-orange trim. Cards are drawn,
// not images: a rounded body, a big cost gem, a shape icon (flame, shield,
// leaf, scroll, ember, skull) in the card's colour, a big central value and
// a one-line effect text. Colour + shape + number together carry the card,
// so it reads at thumbnail size.

import { CANVAS_H, CANVAS_W, KIND_STYLE, MAX_EMBER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const CARD_W = 132;
export const CARD_H = 196;
export const BACK_W = 104;
export const BACK_H = 146;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'center', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- kind shapes, drawn with paths so they are shapes, not text -----------

function drawShape(ctx, shape, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.09;
  ctx.lineJoin = 'round';
  if (shape === 'flame') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.55);
    ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.1, cx + s * 0.42, cy + s * 0.35, cx + s * 0.12, cy + s * 0.42);
    ctx.bezierCurveTo(cx + s * 0.28, cy + s * 0.2, cx, cy + s * 0.05, cx - s * 0.08, cy + s * 0.28);
    ctx.bezierCurveTo(cx - s * 0.42, cy + s * 0.32, cx - s * 0.5, cy - s * 0.05, cx - s * 0.18, cy - s * 0.3);
    ctx.bezierCurveTo(cx - s * 0.05, cy - s * 0.12, cx + s * 0.05, cy - s * 0.2, cx, cy - s * 0.55);
    ctx.fill();
  } else if (shape === 'shield') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.42, cy - s * 0.28);
    ctx.lineTo(cx + s * 0.42, cy + s * 0.1);
    ctx.quadraticCurveTo(cx + s * 0.4, cy + s * 0.45, cx, cy + s * 0.55);
    ctx.quadraticCurveTo(cx - s * 0.4, cy + s * 0.45, cx - s * 0.42, cy + s * 0.1);
    ctx.lineTo(cx - s * 0.42, cy - s * 0.28);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.5);
    ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 0.1, cx + s * 0.2, cy + s * 0.45);
    ctx.quadraticCurveTo(cx - s * 0.35, cy + s * 0.35, cx - s * 0.4, cy - s * 0.15);
    ctx.quadraticCurveTo(cx - s * 0.2, cy - s * 0.4, cx, cy - s * 0.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.35);
    ctx.lineTo(cx - s * 0.05, cy + s * 0.35);
    ctx.stroke();
  } else if (shape === 'scroll') {
    ctx.beginPath();
    ctx.rect(cx - s * 0.38, cy - s * 0.3, s * 0.76, s * 0.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(cx - s * 0.26, cy - s * 0.14, s * 0.52, s * 0.07);
    ctx.fillRect(cx - s * 0.26, cy + s * 0.02, s * 0.52, s * 0.07);
    ctx.fillRect(cx - s * 0.26, cy + s * 0.18, s * 0.34, s * 0.07);
  } else if (shape === 'ember') {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const r = i % 2 === 0 ? s * 0.5 : s * 0.22;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'skull') {
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.08, s * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - s * 0.26, cy + s * 0.18, s * 0.52, s * 0.28);
    ctx.fillStyle = '#1b1030';
    ctx.beginPath();
    ctx.arc(cx - s * 0.15, cy - s * 0.1, s * 0.09, 0, Math.PI * 2);
    ctx.arc(cx + s * 0.15, cy - s * 0.1, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --- cards -----------------------------------------------------------------

export function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const def = card.def;
  const style = KIND_STYLE[def.kind];
  const selected = !!opts.selected;
  const playable = opts.playable !== false;
  const lift = selected ? -26 : 0;
  const top = y + lift;

  ctx.save();
  if (!playable) ctx.globalAlpha = 0.55;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = selected ? 22 : 10;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, x, top, w, h, 14);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = selected ? 5 : 2;
  ctx.strokeStyle = selected ? '#ffd166' : style.dark;
  ctx.stroke();

  // Header band in the kind colour.
  roundRect(ctx, x + 4, top + 4, w - 8, 44, 10);
  ctx.fillStyle = style.color;
  ctx.fill();
  // Name starts right of the cost gem, so the gem never covers a letter.
  text(ctx, def.name.toUpperCase(), x + 36, top + 27, 12, '#fff', 'bold', 'left');

  // Cost gem, top-left, overlapping the band.
  ctx.beginPath();
  ctx.arc(x + 18, top + 24, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#7c4a03';
  ctx.stroke();
  text(ctx, String(def.cost), x + 18, top + 25, 17, '#fff');

  // Big kind shape in the middle.
  drawShape(ctx, style.shape, x + w / 2, top + h * 0.42, 58, style.color);

  // Big central value.
  text(ctx, String(def.value), x + w / 2, top + h * 0.68, 40, style.dark, '900');
  if (!opts.compact) {
    text(ctx, kindNoun(def.kind), x + w / 2, top + h * 0.82, 12, '#5b5346', 'bold');

    // One-line effect text.
    ctx.fillStyle = '#3d3428';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    wrapText(ctx, def.text, x + w / 2, top + h - 14, w - 16, 14);
  }
  ctx.restore();
}

function kindNoun(kind) {
  return { damage: 'DAMAGE', shield: 'SHIELD', heal: 'HEAL', draw: 'DRAW', ember: 'EMBER', gambit: 'GAMBIT' }[kind] || '';
}

function wrapText(ctx, str, cx, y, maxW, lineH) {
  const words = str.split(' ');
  const lines = [''];
  for (const word of words) {
    const test = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(test).width > maxW && lines[lines.length - 1]) lines.push(word);
    else lines[lines.length - 1] = test;
  }
  const startY = y - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineH));
}

export function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#5b21b6';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#c4b5fd';
  ctx.stroke();
  roundRect(ctx, x + 7, y + 7, w - 14, h - 14, 7);
  ctx.strokeStyle = 'rgba(196,181,253,0.6)';
  ctx.stroke();
  drawShape(ctx, 'flame', x + w / 2, y + h / 2, 44, '#f59e0b');
  ctx.restore();
}

// --- table pieces -----------------------------------------------------------

function drawHeart(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.45);
  ctx.bezierCurveTo(cx - s * 0.6, cy - s * 0.05, cx - s * 0.35, cy - s * 0.55, cx, cy - s * 0.15);
  ctx.bezierCurveTo(cx + s * 0.35, cy - s * 0.55, cx + s * 0.6, cy - s * 0.05, cx, cy + s * 0.45);
  ctx.fill();
  ctx.restore();
}

function drawLifePips(ctx, x, y, life, shield) {
  drawHeart(ctx, x + 12, y, 26, '#e2483a');
  text(ctx, `${life}`, x + 32, y + 1, 30, '#fff', '900', 'left');
  if (shield > 0) {
    drawShape(ctx, 'shield', x + 96, y, 26, '#7db8f0');
    text(ctx, `${shield}`, x + 116, y + 1, 24, '#bcd9f7', '900', 'left');
  }
}

function drawEmberPips(ctx, x, y, ember, emberMax) {
  text(ctx, 'EMBER', x, y - 16, 11, '#fbbf24', 'bold', 'left');
  // Two rows of five pips, so the meter fits the narrow side panel.
  for (let i = 0; i < MAX_EMBER; i += 1) {
    const row = i >= 5 ? 1 : 0;
    const col = i % 5;
    ctx.beginPath();
    ctx.arc(x + 12 + col * 24, y + 8 + row * 22, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < ember ? '#f59e0b' : 'rgba(255,255,255,0.14)';
    ctx.fill();
    if (i >= emberMax) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.stroke();
    }
  }
}

function drawLog(ctx, log, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, 'DUEL LOG', x + 12, y + 18, 12, '#fbbf24', 'bold', 'left');
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const lines = log.slice(-9);
  lines.forEach((line, i) => {
    ctx.fillStyle = i === lines.length - 1 ? '#fff' : 'rgba(255,255,255,0.65)';
    ctx.fillText(line, x + 12, y + 34 + i * 18, w - 24);
  });
  ctx.restore();
}

// --- layout: shared by renderer and input ----------------------------------

export function layoutPlay(state) {
  const hand = state.player.hand;
  const gap = 6;
  const totalW = hand.length * CARD_W + (hand.length - 1) * gap;
  const startX = (CANVAS_W - totalW) / 2;
  const rects = hand.map((card, i) => ({
    card,
    x: startX + i * (CARD_W + gap),
    y: 478,
    w: CARD_W,
    h: CARD_H,
    selected: state.selectedUid === card.uid,
    playable: state.turn === 'player' && state.screen === SCREEN_PLAY && state.player.ember >= card.def.cost,
  }));
  const backTotal = state.rival.hand.length * BACK_W + (state.rival.hand.length - 1) * 10;
  const rivalBacks = state.rival.hand.map((_, i) => ({
    x: (CANVAS_W - backTotal) / 2 + i * (BACK_W + 10),
    y: 24,
    w: BACK_W,
    h: BACK_H,
  }));
  return {
    handRects: rects,
    rivalBacks,
    endTurn: { x: 1080, y: 620, w: 170, h: 56 },
    mute: { x: 1216, y: 12, w: 52, h: 32 },
  };
}

// --- the renderer ------------------------------------------------------------

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function paintBackground() {
    const g = ctx.createRadialGradient(640, 300, 80, 640, 360, 760);
    g.addColorStop(0, '#2f6b4f');
    g.addColorStop(1, '#123626');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = 'rgba(255,209,102,0.35)';
    ctx.lineWidth = 3;
    roundRect(ctx, 14, 14, CANVAS_W - 28, CANVAS_H - 28, 22);
    ctx.stroke();
  }

  function paintTitle(state) {
    paintBackground();
    drawShape(ctx, 'flame', 640, 150, 120, '#f59e0b');
    text(ctx, 'EMBER DUEL', 640, 268, 84, '#ffd166', '900');
    text(ctx, 'A duel of cunning cards and burning ember', 640, 322, 22, '#e8f5e9');
    text(ctx, 'Outwit the rival. Spend ember wisely. Bring their life to zero.', 640, 352, 16, 'rgba(255,255,255,0.75)');
    text(ctx, 'HOW TO PLAY', 640, 408, 15, '#fbbf24', 'bold');
    text(ctx, 'Click a card (or press 1–7) to play it · Space ends your turn · R restarts · M mutes', 640, 436, 15, '#fff');
    text(ctx, 'Each turn you gain ember. Damage, shields, healing, draws — combine them.', 640, 462, 15, 'rgba(255,255,255,0.8)');
    text(ctx, 'The rival banks ember for Inferno when it can. Raise a shield when it does.', 640, 488, 15, 'rgba(255,255,255,0.8)');
    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 350);
    ctx.globalAlpha = pulse;
    text(ctx, '▶  CLICK OR PRESS ENTER TO BEGIN  ◀', 640, 566, 24, '#ffd166', '900');
    ctx.globalAlpha = 1;
    if (state.best) {
      text(ctx, `Best result: ${state.best}`, 640, 612, 14, 'rgba(255,255,255,0.6)');
    }
    text(ctx, 'An original card game — no borrowed names, art or music.', 640, 648, 12, 'rgba(255,255,255,0.45)');
  }

  function paintPlay(state) {
    paintBackground();
    const layout = layoutPlay(state);

    // Rival zone (top).
    text(ctx, 'RIVAL · CINDER', 60, 44, 18, '#e8b4ff', 'bold', 'left');
    drawLifePips(ctx, 60, 84, state.rival.life, state.rival.shield);
    drawEmberPips(ctx, 60, 128, state.rival.ember, state.rival.emberMax);
    layout.rivalBacks.forEach((r) => drawCardBack(ctx, r.x, r.y, r.w, r.h));
    text(ctx, `${state.rival.deck.length} cards in deck`, 60, 196, 13, 'rgba(255,255,255,0.6)', 'bold', 'left');

    // Turn banner + last played card, centre.
    const banner = state.turn === 'player' ? 'YOUR TURN' : 'RIVAL THINKING…';
    text(ctx, banner, 640, 240, 26, state.turn === 'player' ? '#ffd166' : '#e8b4ff', '900');
    text(ctx, `Turn ${state.turnCount}`, 640, 270, 14, 'rgba(255,255,255,0.6)');
    if (state.lastPlayed) {
      text(ctx, `${state.lastPlayed.by} played`, 640, 292, 13, 'rgba(255,255,255,0.7)');
      drawCard(ctx, state.lastPlayed.card, 640 - 60, 300, 120, 168, { playable: true, compact: true });
    } else {
      text(ctx, 'Play a card from your hand,', 640, 340, 15, 'rgba(255,255,255,0.65)');
      text(ctx, 'then end your turn.', 640, 362, 15, 'rgba(255,255,255,0.65)');
    }

    // Duel log, right side.
    drawLog(ctx, state.log, 990, 210, 276, 300);

    // Player zone (bottom).
    text(ctx, 'YOU', 60, 452, 18, '#ffd166', 'bold', 'left');
    drawLifePips(ctx, 60, 490, state.player.life, state.player.shield);
    drawEmberPips(ctx, 60, 534, state.player.ember, state.player.emberMax);
    text(ctx, `${state.player.deck.length} cards in deck`, 60, 592, 13, 'rgba(255,255,255,0.6)', 'bold', 'left');
    layout.handRects.forEach((r) => drawCard(ctx, r.card, r.x, r.y, r.w, r.h, r));

    // End Turn button.
    const b = layout.endTurn;
    const enabled = state.turn === 'player';
    ctx.save();
    if (!enabled) ctx.globalAlpha = 0.45;
    roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#7c4a03';
    ctx.stroke();
    text(ctx, 'END TURN', b.x + b.w / 2, b.y + b.h / 2 + 1, 20, '#fff', '900');
    text(ctx, '[Space]', b.x + b.w / 2, b.y + b.h - 12, 11, 'rgba(255,255,255,0.8)');
    ctx.restore();

    text(ctx, '1–7 play card · Space end turn · R restart · M mute', 640, 700, 12, 'rgba(255,255,255,0.5)');
    paintFx(state);
  }

  function paintOver(state) {
    paintBackground();
    const won = state.winner === 'player';
    // Ember confetti burst on a win.
    if (won) {
      for (const p of state.fx.embers) {
        ctx.globalAlpha = Math.max(0, p.life);
        drawShape(ctx, 'ember', p.x, p.y, p.size, p.color);
      }
      ctx.globalAlpha = 1;
    }
    drawShape(ctx, won ? 'flame' : 'skull', 640, 170, 110, won ? '#f59e0b' : '#8b5cf6');
    text(ctx, won ? 'VICTORY!' : 'DEFEAT', 640, 300, 76, won ? '#ffd166' : '#c4b5fd', '900');
    text(ctx, won ? 'The rival’s last ember fades. The table is yours.' : 'The rival’s embers burn on. Shuffle up and try again.', 640, 352, 18, '#fff');
    text(ctx, `Final life — You ${state.player.life} · Rival ${state.rival.life}   ·   ${state.turnCount} turns`, 640, 396, 16, 'rgba(255,255,255,0.8)');
    text(ctx, won ? 'You outplayed the rival. Well duelled.' : 'Tip: shield up when the rival banks ember for Inferno.', 640, 428, 15, 'rgba(255,255,255,0.65)');
    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 350);
    ctx.globalAlpha = pulse;
    text(ctx, 'PRESS R TO DUEL AGAIN', 640, 500, 22, '#ffd166', '900');
    ctx.globalAlpha = 1;
  }

  function paintFx(state) {
    // Floating numbers (damage, healing, …) drift up and fade.
    for (const f of state.fx.floats) {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      text(ctx, f.label, f.x, f.y, 30, f.color, '900');
    }
    ctx.globalAlpha = 1;
    // Ember particles.
    for (const p of state.fx.embers) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    canvas.style.width = `${Math.floor(CANVAS_W * scale)}px`;
    canvas.style.height = `${Math.floor(CANVAS_H * scale)}px`;
  }

  return {
    resize,
    draw(state) {
      ctx.save();
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      if (state.screen === SCREEN_TITLE) paintTitle(state);
      else if (state.screen === SCREEN_PLAY) paintPlay(state);
      else paintOver(state);
      ctx.restore();
    },
  };
}
