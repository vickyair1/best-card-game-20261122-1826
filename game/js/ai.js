// LANTERNFALL — the rival Warden. Keeper Vex plays sensibly, not randomly:
// it spends its Glow on the strongest plays it can afford, answers Guards,
// trades only when the trade is favourable, and goes for the lantern —
// lethal first — whenever the numbers say the duel ends.
//
// Actions are named by card id / creature uid, never by index, so they stay
// valid while the board changes: {kind:'play', id, targetUid?} |
// {kind:'attack', fromUid, to:'lantern'|toUid}
import { CARD_BY_ID } from './cards.js';

export function planAiTurn(game) {
  const me = game.rival;
  const foe = game.player;
  const actions = [];
  // Light simulation of the turn: hand, board (with uids), glow, lives.
  const sim = {
    glow: me.glow,
    hand: me.hand.slice(),
    board: me.board.map((c) => ({ ...c })),
    foeBoard: foe.board.map((c) => ({ ...c })),
    foeLife: foe.life,
    myLife: me.life,
    played: 0,
  };
  const guard = () => sim.foeBoard.find((c) => (c.kw || []).includes('guard'));

  // 1) Play cards: biggest affordable first, but never spend the last Glow
  //    on a weak creature while a removal spell waits for a good target.
  for (;;) {
    let best = -1; let bestScore = -1; let bestTarget = null;
    sim.hand.forEach((id, i) => {
      const c = CARD_BY_ID[id];
      if (!c || c.cost > sim.glow) return;
      let s = c.cost * 2 + (c.atk || 0) + (c.hp || 0);
      let target = null;
      if (c.type === 'spell') {
        if (c.target === 'foe' && sim.foeLife <= (c.dmg || 0)) s += 100; // lethal
        else if (c.target === 'allFoeCreatures' && sim.foeBoard.length >= 2) s += 6;
        else if (c.target === 'foeCreature') {
          const t = [...sim.foeBoard].sort((a, b) => b.atk - a.atk)[0];
          if (t && t.hp <= (c.dmg || 0)) { s += 8; target = t.uid; }
        }
        else if (c.target === 'self' && c.draw && sim.hand.length <= 5) s += 5;
        else if (c.target === 'self' && c.heal && sim.myLife <= 18) s += 7;
        else if (c.target === 'allOwnCreatures' && sim.board.length >= 2) s += 5;
        else s -= 20; // a spell with no good target stays in hand
      }
      if (c.kw && c.kw.includes('guard') && sim.myLife <= 12) s += 4;
      if (s > bestScore) { bestScore = s; best = i; bestTarget = target; }
    });
    if (best < 0 || bestScore <= 0 || (CARD_BY_ID[sim.hand[best]].type === 'creature' && sim.board.length >= 5)) break;
    const c = CARD_BY_ID[sim.hand[best]];
    actions.push({ kind: 'play', id: c.id, ...(bestTarget ? { targetUid: bestTarget } : {}) });
    sim.glow -= c.cost;
    sim.hand.splice(best, 1);
    if (c.type === 'creature') {
      // Placeholder uid: -1000 - (creature plays so far this plan). The
      // game loop maps it to the real uid when the play lands (see aiStep).
      sim.board.push({ uid: -1000 - sim.played, id: c.id, atk: c.atk, hp: c.hp, kw: c.kw || [], canAttack: (c.kw || []).includes('swift') });
      sim.played = (sim.played || 0) + 1;
    } else {
      applySpellSim(sim, c, bestTarget);
    }
  }

  // 2) Attack with every creature that can: lethal first, then Guards,
  //    then favourable trades (my attack kills, I survive), else the lantern.
  for (const c of sim.board) {
    if (!c.canAttack) continue;
    const g = guard();
    if (g) {
      actions.push({ kind: 'attack', fromUid: c.uid, toUid: g.uid });
      g.hp -= c.atk; c.hp -= g.atk;
      if (g.hp <= 0) sim.foeBoard.splice(sim.foeBoard.indexOf(g), 1);
      continue;
    }
    const totalFace = sim.board.filter((x) => x.canAttack).reduce((a, x) => a + x.atk, 0);
    if (totalFace >= sim.foeLife) {
      actions.push({ kind: 'attack', fromUid: c.uid, to: 'lantern' });
      sim.foeLife -= c.atk;
      continue;
    }
    let ti = -1;
    sim.foeBoard.forEach((f, j) => {
      if (f.hp <= c.atk && f.atk < c.hp && ti < 0) ti = j;
    });
    if (ti >= 0) {
      const t = sim.foeBoard[ti];
      actions.push({ kind: 'attack', fromUid: c.uid, toUid: t.uid });
      t.hp -= c.atk; c.hp -= t.atk;
      if (t.hp <= 0) sim.foeBoard.splice(ti, 1);
      continue;
    }
    actions.push({ kind: 'attack', fromUid: c.uid, to: 'lantern' });
    sim.foeLife -= c.atk;
  }
  return actions;
}

function applySpellSim(sim, c, targetUid) {
  if (c.dmg && c.target === 'foe') sim.foeLife -= c.dmg;
  if (c.dmg && c.target === 'allFoeCreatures') {
    sim.foeBoard.forEach((f) => { f.hp -= c.dmg; });
    sim.foeBoard = sim.foeBoard.filter((f) => f.hp > 0);
    if (c.foeDmg) sim.foeLife -= c.foeDmg;
  }
  if (c.dmg && c.target === 'foeCreature' && targetUid) {
    const t = sim.foeBoard.find((f) => f.uid === targetUid);
    if (t) { t.hp -= c.dmg; sim.foeBoard = sim.foeBoard.filter((f) => f.hp > 0); }
  }
  if (c.heal) sim.myLife = Math.min(30, sim.myLife + c.heal);
  if (c.buffAtk) sim.board.forEach((f) => { f.atk += c.buffAtk; });
  if (c.buffHp) sim.board.forEach((f) => { f.hp += c.buffHp; });
}
