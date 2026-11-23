[![make.fun competition](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/vickyair1/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/vickyair1/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# LANTERNFALL — Duel of the Ember Court

A complete original 1-v-1 card battler for [make.fun's **Make the best card game** bounty](https://make.fun/bounty/best-card-game-20261122-1826). Two Lantern Wardens duel in a drowned city: 30-life lanterns, Glow that grows every turn, 24 original cards in four Aspects, and a rival Warden — Keeper Vex — who plays for real. First lantern to gutter out loses.

## The game

- **24 original cards, 4 Aspects** — Ember (Swift strikes, face damage), Tide (draw and healing, one great Leviathan), Gale (tempo, buffs, removal), Stone (Guards that wall the lantern). Every card has a big readable cost, attack and health, a keyword ribbon and its own canvas-drawn sigil art.
- **A real turn structure** — draw, Glow refills and grows (1 → 10), play cards by clicking, creatures strike foes or the lantern, End Turn hands the duel to the rival. Summoning sickness, Guards that must be struck first, Swift creatures that strike at once, Drain that mends your lantern, fatigue when a deck runs dry.
- **A rival who plays sensibly** — Keeper Vex spends Glow on its strongest plays, answers Guards, trades only when the trade is favourable, and goes for lethal the moment the numbers say the duel ends. Its turn plays out action by action so you can watch it think.
- **Everything visible at a glance** — both lanterns with big life totals, both hands (yours face-up, the rival's as card backs with a count), Glow pips, deck counts, a live event log, a score that grows with every point of damage, turn banners, and a how-to-play panel that never leaves the table.
- **Win and loss screens** — VICTORY and DEFEAT overlays with a full stats grid (turns, damage dealt, cards played, creatures felled, final score, duel record) and Play Again / Title buttons.
- **Synthesized sound** — card plays, strikes, healing, win and loss jingles, all WebAudio. No audio files. Mute with M.

## Play

Open `game/index.html` in desktop Chrome (or `node serve.ts`, then http://localhost:8080). No network, no build step.

| Key | Action |
| --- | --- |
| Click | Select a card / summon / choose a target / attack |
| 1–8 | Select a card from your hand |
| SPACE | End turn |
| ESC | Cancel selection · title screen from an end screen |
| ENTER | Start · play again |
| R | Restart the duel · M mute |

## Layout

- `main.ts` — hands the entry in: copies `game/` + `screenshots/` to `/output`, writes `dossier.json` (Node 22).
- `game/index.html` — the page. `game/js/config.js` — every number the game agrees on.
- `game/js/cards.js` — the 24 cards, the 30-card deck, the seeded RNG.
- `game/js/ai.js` — Keeper Vex: play planning on a simulated turn, uid-based actions.
- `game/js/audio.js` — synthesized WebAudio, no files. `game/js/render.js` — the whole table, cards, screens.
- `game/js/input.js` — mouse + keyboard. `game/js/shots.js` — staged screenshot poses (real duel states).
- `game/js/main.js` — the Game: turns, combat, spells, win/loss, the loop.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Screenshots

`1-title.jpg` — the title screen: fanned sample cards, the four Aspects. `2-table.jpg` — mid-duel, turn 7: both boards full, both hands visible, life 24 vs 19, Glow 6/7, Ash Phoenix selected. `3-win.jpg` — VICTORY, the rival lantern out, stats grid. `4-loss.jpg` — DEFEAT, your lantern dark. All real renders of this game's own code.

## License

MIT — see `LICENSE`.
