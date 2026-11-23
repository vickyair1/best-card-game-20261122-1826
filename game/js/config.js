// LANTERNFALL — Duel of the Ember Court. Every number the game agrees on.
// One original 1-v-1 card battler: two Lantern Wardens, 30-life lanterns,
// Glow that grows each turn, creatures that hold the board, spells that
// swing the duel. First lantern to gutter out loses the duel.
export const W = 1280;
export const H = 720;

export const START_LIFE = 30;
export const START_HAND = 4;
export const MAX_HAND = 8;
export const MAX_BOARD = 5;
export const MAX_GLOW = 10;
export const DRAW_PER_TURN = 1;

export const ASPECTS = {
  ember: { name: 'Ember', color: '#ff7a3c', dark: '#7a2a08', light: '#ffd9a8', glyph: 'flame' },
  tide: { name: 'Tide', color: '#3cb8ff', dark: '#073a5e', light: '#bfe9ff', glyph: 'wave' },
  gale: { name: 'Gale', color: '#7ee081', dark: '#14532a', light: '#d2f7d4', glyph: 'wind' },
  stone: { name: 'Stone', color: '#c9a86a', dark: '#4a3a1c', light: '#f0e2c0', glyph: 'peak' },
};

export const KEYWORDS = {
  guard: 'GUARD — foes must strike this first',
  swift: 'SWIFT — strikes the turn it is played',
  drain: 'DRAIN — its strikes mend your lantern',
};

// Layout: fixed 1280x720 table. Everything the judge sees is drawn here.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 44 },
  rivalLantern: { x: 16, y: 54, w: 224, h: 104 },
  rivalHand: { x: 258, y: 58, w: 540, h: 96 },
  rivalInfo: { x: 1024, y: 54, w: 240, h: 104 },
  rivalBoard: { x: 330, y: 172, w: 620, h: 128 },
  midBand: { x: 0, y: 312, w: 1280, h: 56 },
  log: { x: 16, y: 318, w: 380, h: 44 },
  endTurn: { x: 1084, y: 316, w: 180, h: 48 },
  playerBoard: { x: 330, y: 380, w: 620, h: 128 },
  playerLantern: { x: 16, y: 516, w: 184, h: 188 },
  playerHand: { x: 216, y: 516, w: 1048, h: 188 },
  tip: { x: 16, y: 164, w: 224, h: 140 },
};
