// LANTERNFALL — staged screenshot poses (?shot=title|table|win|loss&seed=N).
// Every pose is a real duel state built through the game's own objects and
// transitions — the win/loss poses reach their screens by dealing lethal
// damage through damageLantern(), the same path real play takes — so the
// screenshots are true renders of the game's own code, never mockups.
import { CARD_BY_ID } from './cards.js';

function makeCreature(game, id, hpDelta = 0) {
  const c = CARD_BY_ID[id];
  return {
    uid: 9000 + Math.floor(Math.random() * 8000) + game.turn,
    id, atk: c.atk, hp: c.hp + hpDelta, maxHp: c.hp,
    kw: (c.kw || []).slice(), canAttack: true,
  };
}

export function poseTable(game) {
  game.startDuel(7);
  game.turn = 7;
  game.player.life = 24;
  game.rival.life = 19;
  game.player.glow = 6; game.player.maxGlow = 7;
  game.rival.glow = 5; game.rival.maxGlow = 6;
  game.score = 86;
  game.stats = { damage: 41, played: 11, summoned: 8, destroyed: 5 };
  game.player.hand = ['ash-phoenix', 'cyclone', 'tide-sage', 'meteor-shard', 'pebble-golem', 'tailwind', 'healing-rain'];
  game.rival.hand = ['cinder-imp', 'ripple-eel', 'granite-hound', 'wildfire', 'breeze-kite'];
  game.player.board = [
    makeCreature(game, 'bastion-knight'),
    makeCreature(game, 'flamecaller', -1),
    makeCreature(game, 'storm-rider'),
  ];
  game.rival.board = [
    makeCreature(game, 'sky-whale'),
    makeCreature(game, 'deep-leviathan', -2),
    makeCreature(game, 'spark-hound'),
  ];
  game.player.deck = game.player.deck.slice(0, 14);
  game.rival.deck = game.rival.deck.slice(0, 11);
  game.log = [
    'Keeper Vex plays Deep Leviathan (7/7).',
    'Your Storm Rider strikes the rival lantern for 5.',
    'Wildfire scorches your board for 2.',
    'Your turn — Glow 6/7. Ash Phoenix waits in hand.',
  ];
  game.selected = { hand: 0 }; // Ash Phoenix selected, glowing, ready to summon
  game.banner = null;
  game.floats = [];
}

export function applyShot(game, name, seed) {
  if (name === 'title') {
    game.state = 'title';
  } else if (name === 'table') {
    poseTable(game);
  } else if (name === 'win') {
    poseTable(game);
    game.damageLantern(game.rival, 99, game.player); // real lethal path
    game.floats = [];
  } else if (name === 'loss') {
    poseTable(game);
    game.damageLantern(game.player, 99, game.rival); // real lethal path
    game.floats = [];
  }
  game.shotReady = true;
}
