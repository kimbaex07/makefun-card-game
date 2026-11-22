// Ember Duel — a small seeded random source so a ?seed=N duel replays the
// same deal every time. Mulberry32: short, fast, good enough for a card game.

export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return {
    next() {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(max) {
      return Math.floor(this.next() * max);
    },
  };
}

// Fisher-Yates shuffle driven by the seeded source above.
export function shuffleInPlace(rng, items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}
