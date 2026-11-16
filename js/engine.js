// Engine helpers: colours, pixel sprites, sound effects and input.

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function hash2(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Build a pixel sprite from text rows. '.' is transparent. Adds a 1px outline when asked.
function buildSprite(rows, map, outline) {
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w + 2;
  c.height = h + 2;
  const g = c.getContext('2d');
  const at = (x, y) => {
    if (y < 0 || y >= h || x < 0) return null;
    const ch = rows[y][x];
    return ch && ch !== '.' && map[ch] ? map[ch] : null;
  };
  if (outline) {
    g.fillStyle = outline;
    for (let y = -1; y <= h; y++) {
      for (let x = -1; x <= w; x++) {
        if (!at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) g.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const col = at(x, y);
      if (col) { g.fillStyle = col; g.fillRect(x + 1, y + 1, 1, 1); }
    }
  }
  return c;
}

// ---------- Characters ----------
const BODY = {
  down: [
    '...hhhhhh...',
    '..hhhhhhhh..',
    '..hhhhhhhh..',
    '..hssssssh..',
    '..sesssses..',
    '..ssssssss..',
    '...ssmmss...',
    '..dttttttd..',
    '.stttttttts.',
    '.stttttttts.',
    '.sdttttttds.',
    '..pppppppp..'
  ],
  up: [
    '...hhhhhh...',
    '..hhhhhhhh..',
    '..hhhhhhhh..',
    '..hhhhhhhh..',
    '..hhhhhhhh..',
    '..shhhhhhs..',
    '...ssssss...',
    '..dttttttd..',
    '.stttttttts.',
    '.stttttttts.',
    '.sdttttttds.',
    '..pppppppp..'
  ],
  side: [
    '...hhhhh....',
    '..hhhhhhh...',
    '..hhhhhhhh..',
    '..hhhsssss..',
    '..hhsssses..',
    '..hhssssss..',
    '...sssssm...',
    '...dtttt....',
    '...tttttt...',
    '...tttstt...',
    '...tttstt...',
    '...pppppp...'
  ]
};
const LEGS = {
  front: [
    ['..ppp..ppp..', '..ppp..ppp..', '..kkk..kkk..'],
    ['..ppp..ppp..', '..ppp..kkk..', '..kkk.......'],
    ['..ppp..ppp..', '..kkk..ppp..', '.......kkk..']
  ],
  side: [
    ['....pppp....', '....pppp....', '....kkkkk...'],
    ['...pp..pp...', '..pp....pp..', '.kk......kk.'],
    ['....pppp....', '...ppppp....', '...kkkkk....']
  ]
};

function makeCharacter(c) {
  const map = { h: c.h, s: c.s, e: PAL.ink, m: '#7a2a2a', t: c.t, d: c.d, p: c.p, k: c.k };
  const out = {};
  for (const dir of ['down', 'up', 'side']) {
    const legs = dir === 'side' ? LEGS.side : LEGS.front;
    out[dir] = legs.map(l => buildSprite(BODY[dir].concat(l), map, PAL.ink));
  }
  return out;
}

const legFrame = anim => (anim > 0 ? [0, 1, 0, 2][Math.floor(anim * 8) % 4] : 0);

// Draws a character with its feet at (x, y).
function drawChar(g, spr, x, y, dir, leg) {
  x = Math.round(x);
  y = Math.round(y);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(x - 5, y - 1, 10, 3);
  const set = dir === 'up' ? spr.up : dir === 'down' ? spr.down : spr.side;
  const img = set[leg] || set[0];
  if (dir === 'left') {
    g.save();
    g.translate(x * 2, 0);
    g.scale(-1, 1);
    g.drawImage(img, x - 7, y - 16);
    g.restore();
  } else {
    g.drawImage(img, x - 7, y - 16);
  }
}

// ---------- Sound (chiptune effects with WebAudio) ----------
const Sfx = {
  ctx: null,
  muted: false,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f, d, type = 'square', v = 0.05, f2 = null, delay = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const gn = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    gn.gain.setValueAtTime(v, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(gn).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  },
  blip() { this.tone(880, 0.03, 'square', 0.015); },
  select() { this.tone(660, 0.06); this.tone(990, 0.08, 'square', 0.05, null, 0.06); },
  bump() { this.tone(140, 0.1, 'square', 0.05, 80); },
  step() { this.tone(520, 0.04, 'triangle', 0.04); },
  fail() { this.tone(220, 0.15, 'sawtooth', 0.04, 110); this.tone(160, 0.25, 'sawtooth', 0.04, 70, 0.15); },
  success() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'square', 0.05, null, i * 0.1)); },
  data() { this.tone(784, 0.08); this.tone(1175, 0.16, 'square', 0.05, null, 0.08); },
  unlock() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.08, null, i * 0.09)); }
};

// ---------- Input (keyboard + touch pad) ----------
const Input = {
  held: { up: false, down: false, left: false, right: false },
  actionQueued: false,
  dirQueued: null,
  capture: false,
  clear() {
    this.actionQueued = false;
    this.dirQueued = null;
    for (const k in this.held) this.held[k] = false;
    document.querySelectorAll('.pad.on').forEach(b => b.classList.remove('on'));
  },
  takeAction() { const a = this.actionQueued; this.actionQueued = false; return a; },
  takeDir() { const d = this.dirQueued; this.dirQueued = null; return d; },
  init() {
    const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
    const ACT = ['Space', 'Enter', 'KeyE', 'KeyZ'];
    addEventListener('keydown', e => {
      if (!this.capture) return;
      Sfx.init();
      const d = KEYS[e.code];
      if (d) {
        this.held[d] = true;
        if (!e.repeat) this.dirQueued = d;
        e.preventDefault();
      } else if (ACT.includes(e.code)) {
        if (!e.repeat) this.actionQueued = true;
        e.preventDefault();
      }
    });
    addEventListener('keyup', e => { const d = KEYS[e.code]; if (d) this.held[d] = false; });
    addEventListener('blur', () => this.clear());

    document.querySelectorAll('#dpad .pad').forEach(btn => {
      const d = btn.dataset.dir;
      const on = e => {
        e.preventDefault();
        Sfx.init();
        this.held[d] = true;
        this.dirQueued = d;
        btn.classList.add('on');
        try { btn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      };
      const off = () => { this.held[d] = false; btn.classList.remove('on'); };
      btn.addEventListener('pointerdown', on);
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, off));
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });
    const a = document.getElementById('btnA');
    a.addEventListener('pointerdown', e => { e.preventDefault(); Sfx.init(); this.actionQueued = true; a.classList.add('on'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => a.addEventListener(ev, () => a.classList.remove('on')));
    a.addEventListener('contextmenu', e => e.preventDefault());
  }
};
