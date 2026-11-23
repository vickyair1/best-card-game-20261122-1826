// LANTERNFALL — mouse + keyboard. Click a card, then the table or a target;
// 1-8 selects, SPACE ends the turn, ENTER starts, ESC cancels, M mutes,
// R restarts the duel. All hit-testing is in the game's own 1280x720 space.
import { LAYOUT } from './config.js';
import { CARD_BY_ID } from './cards.js';
import { WIN_BTNS } from './render.js';

function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

function toGameCoords(game, ev) {
  const rect = game.canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - rect.left) * (1280 / rect.width),
    y: (ev.clientY - rect.top) * (720 / rect.height),
  };
}

export function attachInput(game) {
  const canvas = game.canvas;

  canvas.addEventListener('mousemove', (ev) => {
    const p = toGameCoords(game, ev);
    game.hover = null;
    if (game.state !== 'play') return;
    // Hover a hand card → tooltip with the full card.
    for (let i = 0; i < game.player.hand.length; i++) {
      const r = game.handRect(i);
      if (inRect(p.x, p.y, r)) { game.hover = { x: p.x, y: p.y, card: CARD_BY_ID[game.player.hand[i]], where: 'hand', index: i }; return; }
    }
    // Hover a board creature → tooltip.
    for (const side of [game.player, game.rival]) {
      for (const inst of side.board) {
        const r = game.creatureRect(side, inst);
        if (r && inRect(p.x, p.y, r)) { game.hover = { x: p.x, y: p.y, card: { ...CARD_BY_ID[inst.id], atk: inst.atk, hp: inst.hp }, where: 'board', inst }; return; }
      }
    }
  });

  canvas.addEventListener('click', (ev) => {
    const p = toGameCoords(game, ev);
    if (game.state === 'title') { game.startDuel(); return; }
    if (game.state === 'win' || game.state === 'loss') {
      if (inRect(p.x, p.y, WIN_BTNS.again)) game.startDuel();
      else if (inRect(p.x, p.y, WIN_BTNS.title)) { game.state = 'title'; }
      return;
    }
    if (game.state !== 'play' || game.phase !== 'player') return;
    handlePlayClick(game, p);
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const k = ev.key;
    if (game.state === 'title' && (k === 'Enter' || k === ' ')) { ev.preventDefault(); game.startDuel(); return; }
    if ((game.state === 'win' || game.state === 'loss') && k === 'Enter') { game.startDuel(); return; }
    if ((game.state === 'win' || game.state === 'loss') && k === 'Escape') { game.state = 'title'; return; }
    if (game.state !== 'play') return;
    if (k === 'm' || k === 'M') { game.toggleMute(); return; }
    if (k === 'r' || k === 'R') { game.startDuel(); return; }
    if (game.phase !== 'player') return;
    if (k === ' ') { ev.preventDefault(); game.endTurn(); return; }
    if (k === 'Escape') { game.selected = null; return; }
    const n = Number(k);
    if (n >= 1 && n <= 8) selectHandCard(game, n - 1);
  });
}

function selectHandCard(game, i) {
  if (i < 0 || i >= game.player.hand.length) return;
  const c = CARD_BY_ID[game.player.hand[i]];
  if (!c) return;
  // Second click on the same no-target card casts it at once.
  if (game.selected && game.selected.hand === i && (c.type === 'creature' || c.target === 'self' || c.target === 'allFoeCreatures' || c.target === 'allOwnCreatures')) {
    game.playCard(game.player, i, null);
    game.selected = null;
    return;
  }
  if (c.cost > game.player.glow) {
    game.logPush(`${c.name} needs ${c.cost} Glow — you have ${game.player.glow}.`);
    return;
  }
  game.selected = { hand: i };
}

function handlePlayClick(game, p) {
  // End Turn button.
  if (inRect(p.x, p.y, LAYOUT.endTurn)) { game.endTurn(); return; }

  // A hand card is selected.
  if (game.selected && game.selected.hand !== undefined) {
    const i = game.selected.hand;
    const c = CARD_BY_ID[game.player.hand[i]];
    if (!c) { game.selected = null; return; }
    // Clicked the same card again → cast/summon if it needs no target.
    const r = game.handRect(i);
    if (inRect(p.x, p.y, r)) {
      if (c.type === 'creature') {
        if (game.player.board.length >= 5) game.logPush('The board is full — no room for another creature.');
        else game.playCard(game.player, i, null);
        game.selected = null;
      } else if (c.target === 'self' || c.target === 'allFoeCreatures' || c.target === 'allOwnCreatures') {
        game.playCard(game.player, i, null);
        game.selected = null;
      }
      return;
    }
    // Targeted spell: click its target.
    if (c.type === 'spell' && c.target === 'foe') {
      if (inRect(p.x, p.y, LAYOUT.rivalLantern)) { game.playCard(game.player, i, null); game.selected = null; }
      return;
    }
    if (c.type === 'spell' && c.target === 'foeCreature') {
      for (const inst of game.rival.board) {
        const br = game.creatureRect(game.rival, inst);
        if (br && inRect(p.x, p.y, br)) { game.playCard(game.player, i, inst); game.selected = null; return; }
      }
      return;
    }
    // Clicked elsewhere with a creature selected → summon it (board click).
    if (c.type === 'creature' && inRect(p.x, p.y, LAYOUT.playerBoard)) {
      if (game.player.board.length >= 5) game.logPush('The board is full — no room for another creature.');
      else game.playCard(game.player, i, null);
      game.selected = null;
      return;
    }
    game.selected = null; // clicked elsewhere: cancel
    return;
  }

  // An attacker is selected.
  if (game.selected && game.selected.board !== undefined) {
    const inst = game.player.board[game.selected.board];
    if (!inst) { game.selected = null; return; }
    for (const foe of game.rival.board) {
      const br = game.creatureRect(game.rival, foe);
      if (br && inRect(p.x, p.y, br)) {
        if (!game.attackCreature(game.player, inst.uid, foe.uid)) game.logPush('A GUARD stands in the way — strike it first.');
        game.selected = null;
        return;
      }
    }
    if (inRect(p.x, p.y, LAYOUT.rivalLantern)) {
      if (!game.attackLantern(game.player, inst.uid)) game.logPush('A GUARD stands in the way — strike it first.');
      game.selected = null;
      return;
    }
    game.selected = null;
    return;
  }

  // Nothing selected: pick a hand card, or an attacker from the board.
  for (let i = 0; i < game.player.hand.length; i++) {
    const r = game.handRect(i);
    if (inRect(p.x, p.y, r)) { selectHandCard(game, i); return; }
  }
  game.player.board.forEach((inst, i) => {
    const r = game.creatureRect(game.player, inst);
    if (r && inRect(p.x, p.y, r) && inst.canAttack) game.selected = { board: i };
  });
}
