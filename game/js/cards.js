// LANTERNFALL — the cards. 24 original cards in four Aspects, each with its
// own name, art sigil, cost, attack and health (or spell effect). Nothing is
// copied from a commercial game: no Hearthstone, no Magic, no Slay the Spire
// names, numbers or art — the Ember Court, its Wardens and its Wisps are ours.
import { ASPECTS } from './config.js';

// type: 'creature' | 'spell'. target: where a spell may land.
//   'foe' = enemy lantern, 'foeCreature' = one enemy creature,
//   'allFoeCreatures', 'ownCreature', 'allOwnCreatures', 'self' = no target.
export const CARDS = [
  // ---- EMBER (aggression: Swift strikes, face damage) ----
  { id: 'cinder-imp', name: 'Cinder Imp', aspect: 'ember', type: 'creature', cost: 1, atk: 2, hp: 1, text: 'A spark with teeth.' },
  { id: 'spark-hound', name: 'Spark Hound', aspect: 'ember', type: 'creature', cost: 2, atk: 3, hp: 2, kw: ['swift'], text: 'SWIFT — strikes at once.' },
  { id: 'flamecaller', name: 'Flamecaller', aspect: 'ember', type: 'creature', cost: 3, atk: 4, hp: 3, text: 'She sings, the torches answer.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', aspect: 'ember', type: 'creature', cost: 5, atk: 6, hp: 5, kw: ['drain'], text: 'DRAIN — its strikes mend you.' },
  { id: 'meteor-shard', name: 'Meteor Shard', aspect: 'ember', type: 'spell', cost: 4, target: 'foe', dmg: 5, text: 'Deal 5 to the rival lantern.' },
  { id: 'wildfire', name: 'Wildfire', aspect: 'ember', type: 'spell', cost: 3, target: 'allFoeCreatures', dmg: 2, text: 'Deal 2 to every foe creature.' },
  // ---- TIDE (control: card draw, healing, one great beast) ----
  { id: 'dew-sprite', name: 'Dew Sprite', aspect: 'tide', type: 'creature', cost: 1, atk: 1, hp: 2, text: 'Small. Patient. Everywhere.' },
  { id: 'ripple-eel', name: 'Ripple Eel', aspect: 'tide', type: 'creature', cost: 2, atk: 2, hp: 3, text: 'It never swims twice the same.' },
  { id: 'tide-sage', name: 'Tide Sage', aspect: 'tide', type: 'creature', cost: 3, atk: 3, hp: 4, onPlay: 'draw1', text: 'Draw a card when played.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', aspect: 'tide', type: 'creature', cost: 6, atk: 7, hp: 7, text: 'The drowned court bows to it.' },
  { id: 'ebb-flow', name: 'Ebb Flow', aspect: 'tide', type: 'spell', cost: 2, target: 'self', draw: 2, text: 'Draw 2 cards.' },
  { id: 'healing-rain', name: 'Healing Rain', aspect: 'tide', type: 'spell', cost: 3, target: 'self', heal: 8, text: 'Mend your lantern for 8.' },
  // ---- GALE (tempo: Swift board, buffs, removal) ----
  { id: 'breeze-kite', name: 'Breeze Kite', aspect: 'gale', type: 'creature', cost: 1, atk: 2, hp: 1, kw: ['swift'], text: 'SWIFT — strikes at once.' },
  { id: 'thorn-falcon', name: 'Thorn Falcon', aspect: 'gale', type: 'creature', cost: 2, atk: 3, hp: 1, kw: ['swift'], text: 'SWIFT — strikes at once.' },
  { id: 'storm-rider', name: 'Storm Rider', aspect: 'gale', type: 'creature', cost: 4, atk: 5, hp: 4, kw: ['swift'], text: 'SWIFT — strikes at once.' },
  { id: 'sky-whale', name: 'Sky Whale', aspect: 'gale', type: 'creature', cost: 5, atk: 4, hp: 7, kw: ['guard'], text: 'GUARD — foes must strike it first.' },
  { id: 'tailwind', name: 'Tailwind', aspect: 'gale', type: 'spell', cost: 2, target: 'allOwnCreatures', buffAtk: 2, text: 'Your creatures gain +2 attack.' },
  { id: 'cyclone', name: 'Cyclone', aspect: 'gale', type: 'spell', cost: 4, target: 'foeCreature', dmg: 4, draw: 1, text: 'Deal 4 to a foe creature. Draw 1.' },
  // ---- STONE (defence: Guards that wall the lantern) ----
  { id: 'pebble-golem', name: 'Pebble Golem', aspect: 'stone', type: 'creature', cost: 1, atk: 1, hp: 3, kw: ['guard'], text: 'GUARD — foes must strike it first.' },
  { id: 'granite-hound', name: 'Granite Hound', aspect: 'stone', type: 'creature', cost: 2, atk: 2, hp: 4, kw: ['guard'], text: 'GUARD — foes must strike it first.' },
  { id: 'bastion-knight', name: 'Bastion Knight', aspect: 'stone', type: 'creature', cost: 3, atk: 3, hp: 5, kw: ['guard'], text: 'GUARD — foes must strike it first.' },
  { id: 'mountain-titan', name: 'Mountain Titan', aspect: 'stone', type: 'creature', cost: 6, atk: 5, hp: 8, kw: ['guard'], text: 'GUARD — foes must strike it first.' },
  { id: 'fortify', name: 'Fortify', aspect: 'stone', type: 'spell', cost: 2, target: 'allOwnCreatures', buffHp: 2, text: 'Your creatures gain +2 health.' },
  { id: 'quake', name: 'Quake', aspect: 'stone', type: 'spell', cost: 5, target: 'allFoeCreatures', dmg: 3, foeDmg: 2, text: 'Deal 3 to all foes, 2 to their lantern.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// A duel deck: 30 cards — every card once, plus a second copy of each
// 1-cost creature and each 2-cost creature, so early turns always have plays.
export function buildDeck(rng) {
  const ids = CARDS.map((c) => c.id);
  for (const c of CARDS) if (c.type === 'creature' && c.cost <= 2) ids.push(c.id);
  const deck = ids.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function aspectOf(card) { return ASPECTS[card.aspect]; }

// Seeded RNG (mulberry32) — ?seed=N makes a duel (and its screenshots)
// reproducible; without it the seed comes from the clock.
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
