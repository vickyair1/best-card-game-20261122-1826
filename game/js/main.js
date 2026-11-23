// LANTERNFALL — the duel itself: state machine, turns, combat, spells,
// the rival's turn, win/loss, and the log. Rendered by render.js, driven by
// input.js, staged for screenshots by shots.js.
import { W, H, START_LIFE, START_HAND, MAX_HAND, MAX_BOARD, MAX_GLOW, DRAW_PER_TURN, LAYOUT } from './config.js';
import { CARDS, CARD_BY_ID, buildDeck, makeRng } from './cards.js';
import { planAiTurn } from './ai.js';
import { sfx, setMuted, isMuted } from './audio.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';

let uidCounter = 1;

export function newSide(seedRng, name) {
  return {
    name,
    life: START_LIFE,
    deck: buildDeck(seedRng),
    hand: [],
    board: [],
    glow: 0,
    maxGlow: 0,
    fatigue: 0,
  };
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'title'; // title | play | win | loss
    this.rng = makeRng((Date.now() % 2147483647) || 7);
    this.turn = 0;
    this.phase = 'player'; // whose turn it is
    this.player = null;
    this.rival = null;
    this.selected = null; // {hand:i} | {board:i}
    this.hover = null; // {x, y, card, where}
    this.log = [];
    this.banner = null; // {text, sub, until}
    this.floats = []; // {x, y, text, color, t}
    this.score = 0;
    this.stats = { damage: 0, played: 0, summoned: 0, destroyed: 0 };
    this.duels = { won: 0, lost: 0 };
    this.aiQueue = [];
    this.aiTimer = 0;
    this.time = 0;
    this.muted = false;
    this.shotReady = false;
    this.statusEl = document.getElementById('status');
  }

  // ---------- duel setup ----------
  startDuel(seed) {
    this.rng = makeRng(seed ?? ((Date.now() % 2147483647) || 7));
    this.player = newSide(this.rng, 'You');
    this.rival = newSide(this.rng, 'Keeper Vex');
    this.turn = 1;
    this.phase = 'player';
    this.selected = null;
    this.log = ['The duel begins. Two lanterns, one flame.'];
    this.floats = [];
    this.score = 0;
    this.stats = { damage: 0, played: 0, summoned: 0, destroyed: 0 };
    this.aiQueue = [];
    for (let i = 0; i < START_HAND; i++) { this.drawCard(this.player, true); this.drawCard(this.rival, true); }
    this.beginTurn(this.player);
    this.state = 'play';
    this.setBanner('YOUR TURN', 'Draw, play, strike — then End Turn');
    this.announce('Duel started. Your turn.');
    sfx.turn();
  }

  beginTurn(side) {
    side.maxGlow = Math.min(MAX_GLOW, side.maxGlow + 1);
    side.glow = side.maxGlow;
    for (const c of side.board) c.canAttack = true;
    this.drawCard(side);
    if (side === this.player) this.setBanner('YOUR TURN', `Turn ${this.turn} — Glow ${side.glow}/${side.maxGlow}`);
  }

  drawCard(side, opening = false) {
    if (side.deck.length === 0) {
      side.fatigue += 1;
      side.life -= side.fatigue;
      this.logPush(`${side.name} draws from an empty deck — fatigue ${side.fatigue}!`);
      this.checkEnd();
      return;
    }
    const id = side.deck.pop();
    if (side.hand.length >= MAX_HAND) {
      this.logPush(`${side.name}'s hand is full — ${CARD_BY_ID[id].name} burns away.`);
      return;
    }
    side.hand.push(id);
    if (!opening && side === this.player) sfx.draw();
  }

  // ---------- actions ----------
  canPlay(side, handIdx) {
    if (this.state !== 'play' || this.phase !== 'player' || side !== this.player) return false;
    const c = CARD_BY_ID[side.hand[handIdx]];
    return !!c && c.cost <= side.glow;
  }

  playCard(side, handIdx, target) {
    const id = side.hand[handIdx];
    const c = CARD_BY_ID[id];
    if (!c || c.cost > side.glow) return false;
    side.glow -= c.cost;
    side.hand.splice(handIdx, 1);
    this.stats.played += side === this.player ? 1 : 0;
    if (side === this.player) this.score += 5;
    if (c.type === 'creature') {
      if (side.board.length >= MAX_BOARD) {
        side.hand.splice(handIdx, 0, id); // put it back
        side.glow += c.cost;
        this.logPush('The board is full — no room for another creature.');
        return false;
      }
      const inst = {
        uid: uidCounter++, id: c.id, atk: c.atk, hp: c.hp, maxHp: c.hp,
        kw: (c.kw || []).slice(), canAttack: (c.kw || []).includes('swift'),
      };
      side.board.push(inst);
      this.stats.summoned += side === this.player ? 1 : 0;
      this.logPush(`${side.name} plays ${c.name} (${c.atk}/${c.hp}).`);
      if (c.onPlay === 'draw1') { this.drawCard(side); this.logPush(`${c.name} draws a card.`); }
      if (side === this.player) sfx.play(); else sfx.play();
    } else {
      this.resolveSpell(side, c, target);
      if (side === this.player) sfx.spell();
    }
    this.checkEnd();
    return true;
  }

  resolveSpell(side, c, target) {
    const foe = side === this.player ? this.rival : this.player;
    const label = `${side.name} casts ${c.name}`;
    if (c.target === 'self') {
      if (c.draw) { for (let i = 0; i < c.draw; i++) this.drawCard(side); this.logPush(`${label} — draws ${c.draw}.`); }
      if (c.heal) { side.life = Math.min(START_LIFE, side.life + c.heal); this.floatAt(side, `+${c.heal}`, '#7ee081'); this.logPush(`${label} — mends ${c.heal}.`); if (side === this.player) sfx.heal(); }
      return;
    }
    if (c.target === 'foe') {
      this.damageLantern(foe, c.dmg, side);
      this.logPush(`${label} — ${c.dmg} to ${side === this.player ? 'the rival lantern' : 'your lantern'}.`);
      return;
    }
    if (c.target === 'foeCreature' && target) {
      this.damageCreature(foe, target, c.dmg, side);
      this.logPush(`${label} — ${c.dmg} to ${CARD_BY_ID[target.id].name}.`);
      if (c.draw) this.drawCard(side);
      return;
    }
    if (c.target === 'allFoeCreatures') {
      for (const f of foe.board.slice()) this.damageCreature(foe, f, c.dmg, side);
      if (c.foeDmg) this.damageLantern(foe, c.foeDmg, side);
      this.logPush(`${label} — ${c.dmg} to every foe creature${c.foeDmg ? ` and ${c.foeDmg} to ${side === this.player ? 'the rival lantern' : 'your lantern'}` : ''}.`);
      return;
    }
    if (c.target === 'allOwnCreatures') {
      for (const f of side.board) {
        if (c.buffAtk) f.atk += c.buffAtk;
        if (c.buffHp) { f.hp += c.buffHp; f.maxHp += c.buffHp; }
      }
      this.logPush(`${label} — your creatures ${c.buffAtk ? `gain +${c.buffAtk} attack` : `gain +${c.buffHp} health`}.`);
    }
  }

  attackCreature(side, fromUid, toUid) {
    const foe = side === this.player ? this.rival : this.player;
    const atk = side.board.find((c) => c.uid === fromUid);
    const def = foe.board.find((c) => c.uid === toUid);
    if (!atk || !def || !atk.canAttack) return false;
    const guards = foe.board.filter((c) => c.kw.includes('guard'));
    if (guards.length && !def.kw.includes('guard')) return false; // must strike a Guard first
    atk.canAttack = false;
    def.hp -= atk.atk;
    atk.hp -= def.atk;
    this.floatAt(foe, `-${atk.atk}`, '#ff8a7a', def);
    this.floatAt(side, `-${def.atk}`, '#ff8a7a', atk);
    this.stats.damage += side === this.player ? atk.atk : 0;
    if (side === this.player) this.score += atk.atk;
    if (atk.kw.includes('drain')) this.healLantern(side, atk.atk);
    this.logPush(`${CARD_BY_ID[atk.id].name} strikes ${CARD_BY_ID[def.id].name} (${atk.atk} vs ${def.atk}).`);
    sfx.attack();
    this.cleanBoard(side);
    this.cleanBoard(foe);
    this.checkEnd();
    return true;
  }

  attackLantern(side, fromUid) {
    const foe = side === this.player ? this.rival : this.player;
    const atk = side.board.find((c) => c.uid === fromUid);
    if (!atk || !atk.canAttack) return false;
    const guards = foe.board.filter((c) => c.kw.includes('guard'));
    if (guards.length) return false; // a Guard stands in the way
    atk.canAttack = false;
    this.damageLantern(foe, atk.atk, side);
    if (atk.kw.includes('drain')) this.healLantern(side, atk.atk);
    this.logPush(`${CARD_BY_ID[atk.id].name} strikes ${side === this.player ? 'the rival lantern' : 'your lantern'} for ${atk.atk}.`);
    sfx.attack();
    this.checkEnd();
    return true;
  }

  damageLantern(side, n, by) {
    side.life -= n;
    this.floatAt(side, `-${n}`, '#ff6b5e');
    if (by === this.player) { this.stats.damage += n; this.score += n; }
    sfx.hurt();
    this.checkEnd();
  }

  damageCreature(side, inst, n, by) {
    inst.hp -= n;
    this.floatAt(side, `-${n}`, '#ff8a7a', inst);
    if (by === this.player) { this.stats.damage += n; this.score += n; }
    this.cleanBoard(side);
    this.checkEnd();
  }

  healLantern(side, n) {
    side.life = Math.min(START_LIFE, side.life + n);
    this.floatAt(side, `+${n}`, '#7ee081');
  }

  cleanBoard(side) {
    const dead = side.board.filter((c) => c.hp <= 0);
    for (const d of dead) {
      this.logPush(`${CARD_BY_ID[d.id].name} falls.`);
      if (side === this.rival) this.stats.destroyed += 1;
    }
    side.board = side.board.filter((c) => c.hp > 0);
  }

  checkEnd() {
    if (this.state !== 'play') return;
    if (this.rival.life <= 0 && this.player.life <= 0) return this.endDuel(this.player.life >= this.rival.life ? 'player' : 'rival');
    if (this.rival.life <= 0) return this.endDuel('player');
    if (this.player.life <= 0) return this.endDuel('rival');
  }

  endDuel(winner) {
    this.state = winner === 'player' ? 'win' : 'loss';
    this.selected = null;
    if (winner === 'player') { this.duels.won += 1; this.score += 50; this.logPush('VICTORY — the rival lantern gutters out!'); sfx.win(); }
    else { this.duels.lost += 1; this.logPush('DEFEAT — your lantern is dark.'); sfx.lose(); }
    this.announce(winner === 'player' ? 'Victory! The rival lantern is out.' : 'Defeat. Your lantern is dark.');
  }

  endTurn() {
    if (this.state !== 'play' || this.phase !== 'player') return;
    this.selected = null;
    this.phase = 'ai';
    this.beginTurn(this.rival);
    this.setBanner("RIVAL'S TURN", 'Keeper Vex is thinking…');
    this.aiQueue = planAiTurn(this);
    this.aiTimer = 0;
    this.aiUidMap = {}; // plan placeholder uid (-1000-n) -> real creature uid
    this.aiPlayed = 0;
    sfx.turn();
  }

  // One rival action per tick, so the player watches the turn unfold.
  aiStep(dt) {
    if (this.state !== 'play' || this.phase !== 'ai') return;
    this.aiTimer += dt;
    if (this.aiTimer < 0.65) return;
    this.aiTimer = 0;
    const act = this.aiQueue.shift();
    if (!act) {
      this.turn += 1;
      this.phase = 'player';
      this.beginTurn(this.player);
      this.setBanner('YOUR TURN', `Turn ${this.turn} — Glow ${this.player.glow}/${this.player.maxGlow}`);
      this.announce(`Turn ${this.turn}. Your turn.`);
      sfx.turn();
      return;
    }
    if (act.kind === 'play') {
      const idx = this.rival.hand.indexOf(act.id);
      if (idx >= 0) {
        const c = CARD_BY_ID[act.id];
        let target = null;
        if (c.target === 'foeCreature' && act.targetUid) target = this.player.board.find((x) => x.uid === act.targetUid) || null;
        const before = this.rival.board.length;
        this.playCard(this.rival, idx, target);
        if (c.type === 'creature' && this.rival.board.length > before) {
          // Map the plan's placeholder uid to the creature that just landed.
          this.aiUidMap[-1000 - this.aiPlayed] = this.rival.board[this.rival.board.length - 1].uid;
          this.aiPlayed += 1;
        }
      }
    } else if (act.kind === 'attack') {
      const from = act.fromUid < 0 ? this.aiUidMap[act.fromUid] : act.fromUid;
      if (from === undefined) return;
      if (act.to === 'lantern') this.attackLantern(this.rival, from);
      else {
        const to = act.toUid < 0 ? this.aiUidMap[act.toUid] : act.toUid;
        if (to !== undefined) this.attackCreature(this.rival, from, to);
      }
    }
  }

  // ---------- helpers ----------
  logPush(msg) {
    this.log.push(msg);
    if (this.log.length > 4) this.log.shift();
    this.announce(msg);
  }

  announce(msg) { if (this.statusEl) this.statusEl.textContent = msg; }

  setBanner(text, sub) { this.banner = { text, sub, until: this.time + 2.2 }; }

  floatAt(side, text, color, inst) {
    const box = side === this.player ? LAYOUT.playerLantern : LAYOUT.rivalLantern;
    let x = box.x + box.w / 2;
    let y = box.y + 30;
    if (inst) { const r = this.creatureRect(side, inst); if (r) { x = r.x + r.w / 2; y = r.y; } }
    this.floats.push({ x, y, text, color, t: 0 });
  }

  // Board creature screen rect — shared with render.js through LAYOUT.
  creatureRect(side, inst) {
    const board = side === this.player ? LAYOUT.playerBoard : LAYOUT.rivalBoard;
    const idx = side.board.indexOf(inst);
    if (idx < 0) return null;
    const n = side.board.length;
    const w = 104; const h = 122; const gap = 10;
    const total = n * w + (n - 1) * gap;
    const x0 = board.x + (board.w - total) / 2;
    return { x: x0 + idx * (w + gap), y: board.y + 3, w, h };
  }

  handRect(handIdx) {
    const box = LAYOUT.playerHand;
    const n = this.player.hand.length;
    const w = 118; const h = 172; const gap = 8;
    const total = n * w + (n - 1) * gap;
    const x0 = box.x + (box.w - total) / 2;
    return { x: x0 + handIdx * (w + gap), y: box.y + 8, w, h };
  }

  toggleMute() {
    this.muted = !this.muted;
    setMuted(this.muted);
    this.logPush(this.muted ? 'Sound off.' : 'Sound on.');
  }

  update(dt) {
    this.time += dt;
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter((f) => f.t < 1.1);
    this.aiStep(dt);
  }
}

// ---------- boot: one canvas, one duel, one loop ----------
const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__game = game;
attachInput(game);

const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');
const shot = params.get('shot');
if (shot) applyShot(game, shot, seedParam ? Number(seedParam) : undefined);

let last = performance.now();
let frames = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.update(dt);
  drawGame(game.ctx, game);
  frames += 1;
  if (shot && frames >= 2) window.__shotReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
