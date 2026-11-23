// LANTERNFALL — everything the eye sees: the felt table, the lanterns, the
// cards with their big readable costs and values, the HUD panels, the
// title/win/loss screens. Canvas 1280x720, drawn from the Game state alone,
// so a screenshot is always a true render of the duel.
import { W, H, ASPECTS, LAYOUT, START_LIFE } from './config.js';
import { CARD_BY_ID, aspectOf } from './cards.js';

export const WIN_BTNS = {
  again: { x: 400, y: 470, w: 200, h: 56 },
  title: { x: 680, y: 470, w: 200, h: 56 },
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, font, color, align = 'left', baseline = 'alphabetic') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(s, x, y);
}

function wrapText(ctx, s, maxW) {
  const words = s.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------- aspect sigils (original art, drawn with canvas paths) ----------
function drawGlyph(ctx, glyph, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.14;
  ctx.lineJoin = 'round';
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -1.1);
    ctx.bezierCurveTo(0.75, -0.4, 0.85, 0.35, 0.35, 0.85);
    ctx.bezierCurveTo(0.15, 1.05, -0.15, 1.05, -0.35, 0.85);
    ctx.bezierCurveTo(-0.85, 0.35, -0.75, -0.4, 0, -1.1);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -0.25);
    ctx.bezierCurveTo(0.4, 0.15, 0.45, 0.6, 0.1, 0.85);
    ctx.bezierCurveTo(-0.3, 0.85, -0.4, 0.3, 0, -0.25);
    ctx.fill();
  } else if (glyph === 'wave') {
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const y = -0.6 + k * 0.55;
      ctx.moveTo(-1, y);
      ctx.bezierCurveTo(-0.5, y - 0.45, 0, y + 0.45, 0.5, y);
      ctx.bezierCurveTo(0.75, y - 0.15, 0.9, y - 0.1, 1, y);
      ctx.moveTo(-1, y);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0.55, 0.28, 0, Math.PI * 2); ctx.fill();
  } else if (glyph === 'wind') {
    ctx.beginPath();
    ctx.arc(0, 0, 0.9, 0.3, Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0.15, 0.1, 0.55, 0.6, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.9, -0.28); ctx.lineTo(0.45, -0.55); ctx.lineTo(0.85, -0.75);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(-0.1, 0.15, 0.2, 0, Math.PI * 2); ctx.fill();
  } else { // peak
    ctx.beginPath();
    ctx.moveTo(-1, 0.9); ctx.lineTo(-0.25, -0.9); ctx.lineTo(0.35, 0.1); ctx.lineTo(0.7, -0.5); ctx.lineTo(1, 0.9);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(-0.25, -0.9); ctx.lineTo(0.05, -0.35); ctx.lineTo(-0.1, -0.25); ctx.lineTo(-0.5, -0.35);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawHeart(ctx, cx, cy, s, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0.9);
  ctx.bezierCurveTo(-1.1, 0, -0.9, -1, 0, -0.35);
  ctx.bezierCurveTo(0.9, -1, 1.1, 0, 0, 0.9);
  ctx.fill(); ctx.restore();
}

function drawSword(ctx, cx, cy, s, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4); ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fillRect(-0.09, -1, 0.18, 1.7);
  ctx.beginPath(); ctx.moveTo(0, -1.5); ctx.lineTo(0.28, -0.8); ctx.lineTo(-0.28, -0.8); ctx.closePath(); ctx.fill();
  ctx.fillRect(-0.55, 0.62, 1.1, 0.16);
  ctx.fillRect(-0.12, 0.78, 0.24, 0.5);
  ctx.restore();
}

function drawLantern(ctx, cx, cy, s, lit) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  if (lit) {
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 3.2);
    g.addColorStop(0, 'rgba(255,200,90,0.55)'); g.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#2a2118';
  ctx.fillRect(-0.55, -1.15, 1.1, 0.22); // cap
  ctx.fillStyle = lit ? '#ffb84d' : '#4a4038';
  rr(ctx, -0.5, -0.95, 1, 1.5, 0.18); ctx.fill();
  ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 0.09; rr(ctx, -0.5, -0.95, 1, 1.5, 0.18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.5, -0.2); ctx.lineTo(0.5, -0.2); ctx.moveTo(-0.5, 0.15); ctx.lineTo(0.5, 0.15);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.06; ctx.stroke();
  if (lit) drawGlyph(ctx, 'flame', 0, -0.15, 0.42, '#ffe9a8');
  ctx.fillStyle = '#2a2118'; ctx.fillRect(-0.62, 0.55, 1.24, 0.2);
  ctx.restore();
}

// ---------- cards ----------
export function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const a = aspectOf(card);
  const s = w / 118; // scale against the 118x172 reference card
  ctx.save();
  if (opts.dimmed) ctx.globalAlpha = 0.55;
  // Body
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, a.light); g.addColorStop(0.45, '#f7efdd'); g.addColorStop(1, a.dark);
  rr(ctx, x, y, w, h, 10 * s); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 2.5 * s;
  ctx.strokeStyle = opts.selected ? '#ffd24d' : a.color;
  if (opts.canAttack) { ctx.shadowColor = '#7ee081'; ctx.shadowBlur = 14; }
  rr(ctx, x, y, w, h, 10 * s); ctx.stroke();
  ctx.shadowBlur = 0;
  // Art panel
  const artY = y + 24 * s, artH = 62 * s;
  ctx.fillStyle = a.dark;
  rr(ctx, x + 7 * s, artY, w - 14 * s, artH, 6 * s); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.rect(x + 7 * s, artY, w - 14 * s, artH); ctx.clip();
  const glow = ctx.createRadialGradient(x + w / 2, artY + artH / 2, 2, x + w / 2, artY + artH / 2, 46 * s);
  glow.addColorStop(0, a.color); glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.55; ctx.fillStyle = glow; ctx.fillRect(x + 7 * s, artY, w - 14 * s, artH);
  ctx.globalAlpha = 1;
  drawGlyph(ctx, a.glyph, x + w / 2, artY + artH / 2 + 2 * s, 30 * s, 'rgba(255,255,255,0.92)');
  ctx.restore();
  // Aspect chip
  ctx.fillStyle = a.color;
  rr(ctx, x + w - 34 * s, artY + 4 * s, 28 * s, 13 * s, 6 * s); ctx.fill();
  text(ctx, a.name.toUpperCase(), x + w - 20 * s, artY + 14 * s, `bold ${8.5 * s}px sans-serif`, '#fff', 'center');
  // Cost gem
  ctx.beginPath(); ctx.arc(x + 16 * s, y + 15 * s, 14 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#1d4ed8'; ctx.fill();
  ctx.lineWidth = 2 * s; ctx.strokeStyle = '#bfdbfe'; ctx.stroke();
  text(ctx, String(card.cost), x + 16 * s, y + 20.5 * s, `bold ${17 * s}px sans-serif`, '#fff', 'center');
  // Name bar
  ctx.fillStyle = 'rgba(20,14,8,0.88)';
  rr(ctx, x + 6 * s, y + 90 * s, w - 12 * s, 20 * s, 4 * s); ctx.fill();
  text(ctx, card.name, x + w / 2, y + 104.5 * s, `bold ${11.5 * s}px sans-serif`, '#ffe9b8', 'center');
  // Keyword ribbon
  if (card.kw && card.kw.length) {
    text(ctx, card.kw.map((k) => k.toUpperCase()).join(' · '), x + w / 2, y + 120 * s, `bold ${9 * s}px sans-serif`, a.dark, 'center');
  }
  // Rules text (full-size cards show two lines; compact board cards show
  // none — the keyword ribbon above already says what the creature does,
  // and the small card has no room for a second line without clipping).
  // Lines sit above the attack/health badges and the SPELL pill.
  if (!opts.compact) {
    ctx.font = `${9 * s}px sans-serif`;
    const lines = wrapText(ctx, card.text, w - 18 * s).slice(0, 2);
    lines.forEach((ln, i) => text(ctx, ln, x + w / 2, y + (133 + i * 11) * s, `${9 * s}px sans-serif`, '#3a2c18', 'center'));
  }
  // Attack / health badges (creatures only)
  if (card.type === 'creature') {
    ctx.beginPath(); ctx.arc(x + 18 * s, y + h - 13 * s, 11.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#c2410c'; ctx.fill(); ctx.lineWidth = 2 * s; ctx.strokeStyle = '#fed7aa'; ctx.stroke();
    drawSword(ctx, x + 18 * s, y + h - 17 * s, 6 * s, '#fff');
    text(ctx, String(card.atk), x + 18 * s, y + h - 3.5 * s, `bold ${10.5 * s}px sans-serif`, '#fff', 'center');
    ctx.beginPath(); ctx.arc(x + w - 18 * s, y + h - 13 * s, 11.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#15803d'; ctx.fill(); ctx.lineWidth = 2 * s; ctx.strokeStyle = '#bbf7d0'; ctx.stroke();
    drawHeart(ctx, x + w - 18 * s, y + h - 17 * s, 5.5 * s, '#fff');
    text(ctx, String(card.hp), x + w - 18 * s, y + h - 3.5 * s, `bold ${10.5 * s}px sans-serif`, '#fff', 'center');
  } else {
    ctx.fillStyle = a.dark;
    rr(ctx, x + w / 2 - 26 * s, y + h - 24 * s, 52 * s, 16 * s, 8 * s); ctx.fill();
    text(ctx, 'SPELL', x + w / 2, y + h - 12.5 * s, `bold ${10 * s}px sans-serif`, '#fff', 'center');
  }
  ctx.restore();
}

export function drawCardBack(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 7); ctx.fillStyle = '#241b3a'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#d9a441'; rr(ctx, x, y, w, h, 7); ctx.stroke();
  ctx.strokeStyle = 'rgba(217,164,65,0.5)'; ctx.lineWidth = 1;
  rr(ctx, x + 5, y + 5, w - 10, h - 10, 5); ctx.stroke();
  drawLantern(ctx, x + w / 2, y + h / 2, 11, true);
}

function drawGlowPips(ctx, x, y, glow, maxGlow, r = 7) {
  for (let i = 0; i < maxGlow; i++) {
    ctx.beginPath(); ctx.arc(x + i * (r * 2 + 4), y, r, 0, Math.PI * 2);
    ctx.fillStyle = i < glow ? '#38bdf8' : 'rgba(255,255,255,0.14)';
    ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = i < glow ? '#bae6fd' : 'rgba(255,255,255,0.25)'; ctx.stroke();
  }
}

// ---------- table ----------
function drawBackground(ctx, game) {
  const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 780);
  g.addColorStop(0, '#1d3a2f'); g.addColorStop(0.6, '#12261f'); g.addColorStop(1, '#0a130f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(217,164,65,0.35)'; ctx.lineWidth = 3;
  rr(ctx, 8, 8, W - 16, H - 16, 18); ctx.stroke();
  ctx.strokeStyle = 'rgba(217,164,65,0.12)'; ctx.lineWidth = 1;
  rr(ctx, 16, 16, W - 32, H - 32, 14); ctx.stroke();
  // Faint table motif: two crossed lanterns behind the centre band.
  ctx.globalAlpha = 0.06;
  drawLantern(ctx, 640, 340, 60, true);
  ctx.globalAlpha = 1;
}

function drawTopBar(ctx, game) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = 'rgba(8,6,14,0.85)'; ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = '#d9a441'; ctx.fillRect(0, b.h - 2, W, 2);
  text(ctx, 'LANTERNFALL', 24, 29, 'bold 20px Georgia, serif', '#ffd24d');
  text(ctx, 'Duel of the Ember Court', 168, 29, 'italic 13px Georgia, serif', '#c9b48a');
  const mid = game.state === 'play'
    ? `TURN ${game.turn}  •  ${game.phase === 'player' ? 'YOUR TURN' : "RIVAL'S TURN"}`
    : game.state === 'title' ? 'A DUEL OF CARDS AND LANTERNS' : game.state === 'win' ? 'VICTORY' : 'DEFEAT';
  text(ctx, mid, W / 2, 29, 'bold 16px sans-serif', game.phase === 'player' ? '#7ee081' : '#ffb84d', 'center');
  text(ctx, `SCORE ${game.score}`, W - 330, 29, 'bold 16px sans-serif', '#fff', 'right');
  text(ctx, `DUELS  W ${game.duels.won} · L ${game.duels.lost}`, W - 170, 29, '13px sans-serif', '#c9b48a', 'right');
  text(ctx, game.muted ? 'M · sound off' : 'M · sound on', W - 24, 29, '12px sans-serif', '#8a7a5c', 'right');
}

function drawLanternPanel(ctx, game, side, box, isPlayer) {
  rr(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fillStyle = 'rgba(10,8,18,0.82)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = side.life <= 10 ? '#ff6b5e' : '#d9a441'; ctx.stroke();
  drawLantern(ctx, box.x + 42, box.y + 52, 26, side.life > 0);
  text(ctx, side.name, box.x + 78, box.y + 26, 'bold 14px sans-serif', '#ffe9b8');
  text(ctx, isPlayer ? 'YOUR LANTERN' : 'RIVAL LANTERN', box.x + 78, box.y + 44, '10px sans-serif', '#8a7a5c');
  drawHeart(ctx, box.x + 92, box.y + 68, 9, '#ff6b5e');
  text(ctx, `${side.life}`, box.x + 108, box.y + 78, 'bold 34px sans-serif', side.life <= 10 ? '#ff8a7a' : '#fff');
  text(ctx, `/ ${START_LIFE}`, box.x + 148, box.y + 78, '14px sans-serif', '#8a7a5c');
  text(ctx, `DECK ${side.deck.length}   HAND ${side.hand.length}`, box.x + 78, box.y + 96, '11px sans-serif', '#c9b48a');
}

function drawBoard(ctx, game, side, isPlayer) {
  const board = isPlayer ? LAYOUT.playerBoard : LAYOUT.rivalBoard;
  const label = isPlayer ? 'YOUR CREATURES' : 'RIVAL CREATURES';
  text(ctx, label, board.x + board.w / 2, board.y - 6, 'bold 11px sans-serif', '#c9b48a', 'center');
  if (side.board.length === 0) {
    ctx.save(); ctx.globalAlpha = 0.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.5;
    rr(ctx, board.x, board.y, board.w, board.h, 10); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, isPlayer ? 'No creatures yet — play a card from your hand' : 'No creatures yet', board.x + board.w / 2, board.y + board.h / 2 + 4, '13px sans-serif', '#c9b48a', 'center');
    ctx.restore();
    return;
  }
  side.board.forEach((inst) => {
    const r = game.creatureRect(side, inst);
    const card = CARD_BY_ID[inst.id];
    const live = { ...card, atk: inst.atk, hp: inst.hp };
    const selected = game.selected && game.selected.board === side.board.indexOf(inst);
    drawCardFace(ctx, live, r.x, r.y, r.w, r.h, {
      canAttack: isPlayer && game.phase === 'player' && inst.canAttack,
      selected,
      compact: true,
    });
    if (inst.hp < inst.maxHp) {
      text(ctx, `-${inst.maxHp - inst.hp}`, r.x + r.w / 2, r.y - 4, 'bold 11px sans-serif', '#ff8a7a', 'center');
    }
  });
}

function drawRivalHand(ctx, game) {
  const box = LAYOUT.rivalHand;
  const n = Math.min(game.rival.hand.length, 8);
  const w = 44, h = 62, gap = 6;
  const total = n * w + (n - 1) * gap;
  for (let i = 0; i < n; i++) {
    const x = box.x + (box.w - total) / 2 + i * (w + gap);
    drawCardBack(ctx, x, box.y + 8, w, h);
  }
  text(ctx, `RIVAL'S HAND — ${game.rival.hand.length} CARDS`, box.x, box.y + 92, 'bold 11px sans-serif', '#c9b48a');
  const info = LAYOUT.rivalInfo;
  rr(ctx, info.x, info.y, info.w, info.h, 12);
  ctx.fillStyle = 'rgba(10,8,18,0.82)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#d9a441'; ctx.stroke();
  text(ctx, 'KEEPER VEX', info.x + 16, info.y + 24, 'bold 14px sans-serif', '#ffe9b8');
  text(ctx, 'Rival Warden · plays for real', info.x + 16, info.y + 42, '11px sans-serif', '#8a7a5c');
  text(ctx, 'RIVAL GLOW', info.x + 16, info.y + 68, 'bold 10px sans-serif', '#38bdf8');
  drawGlowPips(ctx, info.x + 76, info.y + 64, game.rival.glow, Math.max(game.rival.maxGlow, 1));
  text(ctx, `TURN ${game.turn}`, info.x + 16, info.y + 92, '12px sans-serif', '#c9b48a');
}

function drawMidBand(ctx, game) {
  const band = LAYOUT.midBand;
  // Log panel
  const log = LAYOUT.log;
  rr(ctx, log.x, log.y, log.w, log.h, 8);
  ctx.fillStyle = 'rgba(10,8,18,0.8)'; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(217,164,65,0.4)'; ctx.stroke();
  game.log.slice(-2).forEach((line, i) => {
    text(ctx, line, log.x + 10, log.y + 17 + i * 15, '11px sans-serif', i === game.log.slice(-2).length - 1 ? '#ffe9b8' : '#9a8a68');
  });
  // Turn banner
  if (game.banner && game.time < game.banner.until) {
    const alpha = Math.min(1, (game.banner.until - game.time) / 0.5);
    ctx.save(); ctx.globalAlpha = alpha;
    text(ctx, game.banner.text, W / 2, 336, 'bold 22px sans-serif', '#ffd24d', 'center');
    text(ctx, game.banner.sub, W / 2, 356, '12px sans-serif', '#c9b48a', 'center');
    ctx.restore();
  } else if (game.selected && game.selected.hand !== undefined) {
    const c = CARD_BY_ID[game.player.hand[game.selected.hand]];
    if (c) {
      const hint = c.type === 'spell' && c.target === 'foe' ? 'Click the rival lantern to cast'
        : c.type === 'spell' && c.target === 'foeCreature' ? 'Click a rival creature to cast'
        : c.type === 'spell' ? 'Click again to cast'
        : 'Click the table to summon — or press ESC to cancel';
      text(ctx, hint, W / 2, 346, 'bold 14px sans-serif', '#ffd24d', 'center');
    }
  } else if (game.selected && game.selected.board !== undefined) {
    text(ctx, 'Choose a target — a rival creature, or the rival lantern (ESC to cancel)', W / 2, 346, 'bold 14px sans-serif', '#ffd24d', 'center');
  }
  // End Turn button
  const b = LAYOUT.endTurn;
  const enabled = game.state === 'play' && game.phase === 'player';
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fillStyle = enabled ? '#b45309' : 'rgba(120,90,40,0.5)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = enabled ? '#ffd24d' : '#8a7a5c'; ctx.stroke();
  text(ctx, 'END TURN', b.x + b.w / 2, b.y + 22, 'bold 17px sans-serif', '#fff', 'center');
  text(ctx, 'SPACE', b.x + b.w / 2, b.y + 38, '10px sans-serif', '#ffe9b8', 'center');
}

function drawPlayerArea(ctx, game) {
  // Player lantern + glow
  const box = LAYOUT.playerLantern;
  drawLanternPanel(ctx, game, game.player, box, true);
  text(ctx, 'YOUR GLOW', box.x + 16, box.y + 132, 'bold 10px sans-serif', '#38bdf8');
  drawGlowPips(ctx, box.x + 16, box.y + 150, game.player.glow, Math.max(game.player.maxGlow, 1));
  text(ctx, `Glow ${game.player.glow}/${Math.max(game.player.maxGlow, 1)}`, box.x + 16, box.y + 176, '12px sans-serif', '#c9b48a');
  // Hand (the hint lives in the mid band; this label stays short so the
  // raised selected card never covers a descender of it).
  text(ctx, `YOUR HAND — ${game.player.hand.length} CARDS`, LAYOUT.playerHand.x, LAYOUT.playerHand.y - 6, 'bold 11px sans-serif', '#c9b48a');
  game.player.hand.forEach((id, i) => {
    const r = game.handRect(i);
    const card = CARD_BY_ID[id];
    const affordable = card.cost <= game.player.glow && game.phase === 'player';
    const selected = game.selected && game.selected.hand === i;
    const hovered = game.hover && game.hover.where === 'hand' && game.hover.index === i;
    const lift = selected || hovered ? -14 : 0;
    drawCardFace(ctx, card, r.x, r.y + lift, r.w, r.h, { dimmed: !affordable, selected });
  });
  // Tip panel (left, above the lantern): how to play, always visible.
  const tip = LAYOUT.tip;
  rr(ctx, tip.x, tip.y, tip.w, tip.h, 10);
  ctx.fillStyle = 'rgba(10,8,18,0.8)'; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(217,164,65,0.4)'; ctx.stroke();
  text(ctx, 'HOW TO PLAY', tip.x + 12, tip.y + 20, 'bold 12px sans-serif', '#ffd24d');
  const lines = [
    '1 Draw, then spend Glow',
    '   to play cards.',
    '2 Creatures strike foes',
    '   or the rival lantern.',
    '3 GUARD must be struck first.',
    '4 Lantern at 0 loses.',
    'Keys: 1-8 card · SPACE end',
    'M mute · R restart',
  ];
  lines.forEach((ln, i) => text(ctx, ln, tip.x + 12, tip.y + 38 + i * 13, '11px sans-serif', '#c9b48a'));
}

function drawFloats(ctx, game) {
  for (const f of game.floats) {
    const a = 1 - f.t / 1.1;
    ctx.save(); ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y - f.t * 46, 'bold 24px sans-serif', f.color, 'center');
    ctx.restore();
  }
}

function drawTooltip(ctx, game) {
  const h = game.hover;
  if (!h || !h.card) return;
  const card = h.card;
  // 172x250 keeps the card's own 118:172 proportions, so every anchor lands.
  const w = 172, hh = 250;
  let x = Math.min(Math.max(8, h.x + 16), W - w - 8);
  let y = Math.min(Math.max(48, h.y - hh - 12), H - hh - 8);
  drawCardFace(ctx, card, x, y, w, hh, { compact: true });
  // Full rules text under the card face.
  ctx.fillStyle = 'rgba(10,8,18,0.92)';
  rr(ctx, x, y + hh + 6, w, 44, 8); ctx.fill();
  ctx.font = '11px sans-serif';
  wrapText(ctx, card.text, w - 16).forEach((ln, i) => text(ctx, ln, x + w / 2, y + hh + 24 + i * 13, '11px sans-serif', '#ffe9b8', 'center'));
}

// ---------- screens ----------
function drawTitle(ctx, game) {
  drawBackground(ctx, game);
  ctx.fillStyle = 'rgba(8,6,14,0.72)'; ctx.fillRect(0, 0, W, H);
  drawLantern(ctx, 300, 150, 46, true);
  drawLantern(ctx, 980, 150, 46, true);
  text(ctx, 'LANTERNFALL', W / 2, 150, 'bold 72px Georgia, serif', '#ffd24d', 'center');
  text(ctx, '— DUEL OF THE EMBER COURT —', W / 2, 188, 'bold 20px Georgia, serif', '#c9b48a', 'center');
  // Fanned sample cards
  const sample = ['ash-phoenix', 'deep-leviathan', 'sky-whale', 'meteor-shard', 'tide-sage'];
  sample.forEach((id, i) => {
    const card = CARD_BY_ID[id];
    const cx = W / 2 + (i - 2) * 128;
    ctx.save();
    ctx.translate(cx, 330); ctx.rotate((i - 2) * 0.09); ctx.translate(-cx, -330);
    drawCardFace(ctx, card, cx - 59, 250, 118, 172, {});
    ctx.restore();
  });
  text(ctx, 'CLICK OR PRESS ENTER TO BEGIN', W / 2, 478, 'bold 22px sans-serif', '#fff', 'center');
  text(ctx, 'Two Wardens. Thirty life each. Glow grows every turn. First lantern out loses.', W / 2, 506, '15px sans-serif', '#c9b48a', 'center');
  // Aspect legend + rules strip
  const aspects = Object.values(ASPECTS);
  aspects.forEach((a, i) => {
    const x = W / 2 - 330 + i * 170;
    ctx.fillStyle = a.color; rr(ctx, x, 540, 150, 52, 10); ctx.fill();
    drawGlyph(ctx, a.glyph, x + 24, 566, 13, '#fff');
    text(ctx, a.name.toUpperCase(), x + 46, 562, 'bold 14px sans-serif', '#fff');
    text(ctx, i === 0 ? 'Swift strikes' : i === 1 ? 'Draw & heal' : i === 2 ? 'Tempo & buffs' : 'Guards that wall', x + 46, 580, '11px sans-serif', '#fff');
  });
  text(ctx, '24 original cards  •  4 Aspects  •  Guards, Swift, Drain  •  a rival Warden who plays for real', W / 2, 632, '13px sans-serif', '#8a7a5c', 'center');
  text(ctx, 'Keyboard + mouse  •  1-8 select a card  •  SPACE end turn  •  M mute  •  R restart', W / 2, 658, '13px sans-serif', '#8a7a5c', 'center');
}

function drawEndScreen(ctx, game, won) {
  drawBackground(ctx, game);
  drawTopBar(ctx, game);
  ctx.fillStyle = 'rgba(8,6,14,0.78)'; ctx.fillRect(0, 0, W, H);
  const px = 340, py = 130, pw = 600, ph = 400;
  rr(ctx, px, py, pw, ph, 18);
  ctx.fillStyle = 'rgba(16,12,24,0.96)'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = won ? '#7ee081' : '#ff6b5e'; ctx.stroke();
  drawLantern(ctx, W / 2, py + 62, 30, won);
  text(ctx, won ? 'VICTORY' : 'DEFEAT', W / 2, py + 132, 'bold 56px Georgia, serif', won ? '#7ee081' : '#ff6b5e', 'center');
  text(ctx, won ? 'The rival lantern gutters out. The Ember Court is yours.' : 'Your lantern is dark. Keeper Vex keeps the flame.', W / 2, py + 168, '15px sans-serif', '#c9b48a', 'center');
  // Stats grid
  const stats = [
    ['TURNS', String(game.turn)],
    ['DAMAGE DEALT', String(game.stats.damage)],
    ['CARDS PLAYED', String(game.stats.played)],
    ['CREATURES FELLED', String(game.stats.destroyed)],
    ['FINAL SCORE', String(game.score)],
    ['DUELS', `W ${game.duels.won} · L ${game.duels.lost}`],
  ];
  stats.forEach(([label, value], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = px + 40 + col * 180, y = py + 210 + row * 62;
    rr(ctx, x, y, 160, 50, 8); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    text(ctx, label, x + 80, y + 18, 'bold 10px sans-serif', '#8a7a5c', 'center');
    text(ctx, value, x + 80, y + 40, 'bold 20px sans-serif', '#fff', 'center');
  });
  for (const [key, b] of Object.entries(WIN_BTNS)) {
    rr(ctx, b.x, b.y, b.w, b.h, 10);
    ctx.fillStyle = key === 'again' ? '#b45309' : 'rgba(255,255,255,0.1)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = key === 'again' ? '#ffd24d' : '#8a7a5c'; ctx.stroke();
    text(ctx, won ? (key === 'again' ? 'PLAY AGAIN' : 'TITLE SCREEN') : (key === 'again' ? 'REMATCH' : 'TITLE SCREEN'), b.x + b.w / 2, b.y + 35, 'bold 17px sans-serif', '#fff', 'center');
  }
  text(ctx, 'ENTER — play again   •   ESC — title screen', W / 2, py + ph + 34, '13px sans-serif', '#8a7a5c', 'center');
}

// ---------- frame ----------
export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, W, H);
  if (game.state === 'title') { drawTitle(ctx, game); return; }
  if (game.state === 'win' || game.state === 'loss') {
    drawEndScreen(ctx, game, game.state === 'win');
    return;
  }
  drawBackground(ctx, game);
  drawTopBar(ctx, game);
  drawLanternPanel(ctx, game, game.rival, LAYOUT.rivalLantern, false);
  drawRivalHand(ctx, game);
  drawBoard(ctx, game, game.rival, false);
  drawMidBand(ctx, game);
  drawBoard(ctx, game, game.player, true);
  drawPlayerArea(ctx, game);
  drawFloats(ctx, game);
  drawTooltip(ctx, game);
}
