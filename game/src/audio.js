// Ember Duel — procedural WebAudio sounds. No audio files: every sound is
// a short oscillator blip shaped in code, so the game loads nothing.

let audioCtx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// A single tone: frequency slide from `from` to `to` over `seconds`.
function tone(from, to, seconds, type, gainValue, when = 0) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + seconds);
  gain.gain.setValueAtTime(gainValue, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

export function soundClick() {
  tone(660, 520, 0.06, 'sine', 0.08);
}

export function soundPlayCard() {
  tone(440, 880, 0.12, 'triangle', 0.12);
  tone(880, 1320, 0.1, 'sine', 0.06, 0.05);
}

export function soundDamage() {
  tone(180, 60, 0.25, 'sawtooth', 0.14);
}

export function soundHeal() {
  tone(520, 780, 0.18, 'sine', 0.1);
  tone(780, 1040, 0.18, 'sine', 0.08, 0.12);
}

export function soundShield() {
  tone(300, 420, 0.15, 'square', 0.05);
}

export function soundDraw() {
  tone(900, 700, 0.07, 'sine', 0.06);
}

export function soundTurn() {
  tone(392, 392, 0.09, 'triangle', 0.08);
  tone(523, 523, 0.09, 'triangle', 0.08, 0.09);
}

export function soundWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.12, i * 0.13));
}

export function soundLose() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.9, 0.25, 'sawtooth', 0.08, i * 0.15));
}
