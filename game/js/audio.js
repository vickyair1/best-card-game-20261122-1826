// LANTERNFALL — synthesized sound. No audio files: every effect is a few
// WebAudio oscillators, so the game stays static files with no network.
let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  } catch { /* audio is decoration; a dead context never breaks the duel */ }
}

export const sfx = {
  draw() { tone(660, 0.07, 'triangle', 0.06); },
  play() { tone(392, 0.12, 'triangle', 0.12); tone(523, 0.1, 'triangle', 0.08, 0.05); },
  attack() { tone(220, 0.14, 'sawtooth', 0.1, 0, 90); },
  hurt() { tone(160, 0.22, 'sawtooth', 0.12, 0, 70); },
  heal() { tone(523, 0.18, 'sine', 0.1); tone(784, 0.22, 'sine', 0.08, 0.09); },
  spell() { tone(880, 0.16, 'sine', 0.1, 0, 1760); tone(440, 0.2, 'triangle', 0.08, 0.08); },
  turn() { tone(494, 0.09, 'triangle', 0.09); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.12, i * 0.13)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, 'sine', 0.11, i * 0.16)); },
  click() { tone(740, 0.05, 'square', 0.04); },
};
