// The campus: layout, collisions and drawing.

const World = (() => {
  const W = 960, H = 640;
  const FONT = '8px "Press Start 2P", monospace';
  const api = { W, H, unlocked: false };

  // ---------- Layout ----------
  const buildings = [
    { id: 'model', name: '3D MODELLING', x: 150, y: 50, w: 140, h: 90, wall: '#efe2c4', roof: PAL.blue, doorC: PAL.wood, icon: 'cube' },
    { id: 'elec', name: 'ELECTRONICS', x: 660, y: 50, w: 140, h: 90, wall: '#e8e0d0', roof: PAL.red, doorC: PAL.woodD, icon: 'led' },
    { id: 'code', name: 'PROGRAMMING', x: 790, y: 240, w: 130, h: 90, wall: '#e4dccb', roof: PAL.plum, doorC: PAL.wood, icon: 'code' },
    { id: 'stem', name: 'STEM HALL', x: 640, y: 420, w: 128, h: 80, wall: '#f3e6c8', roof: PAL.orange, doorC: PAL.wood, icon: 'atom' },
    { id: 'mission', name: 'MISSION ROOM', x: 420, y: 240, w: 120, h: 90, wall: '#c9cfdf', roof: PAL.navy, doorC: PAL.slate, icon: 'mission' }
  ];
  const tower = { id: 'vision', x: 116, y: 150, w: 60, h: 150 };
  [...buildings, tower].forEach(b => { b.dx = b.x + Math.round(b.w / 2); b.dy = b.y + b.h; });

  const PLAZA = [370, 220, 220, 180];
  const PATHS = [
    [468, 400, 24, 240],   // main avenue from the gate
    [694, 500, 20, 40], [480, 520, 234, 20],   // STEM Hall
    [290, 470, 190, 20],   // garden
    [136, 300, 20, 50], [136, 330, 240, 20],   // vision tower
    [210, 140, 20, 50], [720, 140, 20, 50], [210, 170, 530, 20], [470, 170, 20, 60],   // labs road
    [845, 330, 20, 40], [580, 350, 285, 20]    // programming lab
  ];
  const GARDEN = { x: 150, y: 410, w: 160, h: 130 };
  const HEDGES = [
    [150, 410, 160, 8], [150, 532, 160, 8], [150, 410, 8, 130], [302, 410, 8, 52], [302, 498, 8, 42]
  ];
  const FOUNTAIN = { x: 230, y: 465 };
  const BENCH = { x: 181, y: 500 };

  const TREES = [
    [60, 60], [100, 40], [40, 120], [330, 60], [370, 100], [420, 50], [540, 60], [590, 100], [620, 40],
    [840, 60], [900, 110], [930, 40], [40, 220], [60, 300], [250, 250], [300, 220], [640, 240], [700, 300],
    [740, 230], [920, 200], [40, 420], [60, 520], [100, 600], [360, 450], [380, 560], [560, 450], [600, 580],
    [820, 440], [860, 520], [920, 600], [800, 600], [250, 600], [940, 400], [380, 620]
  ];
  const LAMPS = [[452, 430], [508, 430], [452, 570], [508, 570], [360, 228], [600, 228]];

  const NPC_POS = {
    stem: [726, 520], vision: [172, 318], goal: [272, 498],
    model: [246, 160], elec: [756, 160], code: [882, 350]
  };
  const npcs = ZONE_ORDER.map(z => ({
    zone: z, x: NPC_POS[z][0], y: NPC_POS[z][1], dir: 'down',
    sprites: makeCharacter(CHAR_COLORS[z])
  }));

  const walkers = [
    { a: [260, 180], b: [700, 180], c: 'w1' },
    { a: [520, 530], b: [690, 530], c: 'w2' },
    { a: [610, 360], b: [830, 360], c: 'w3' }
  ].map(w => ({ x: w.a[0], y: w.a[1], a: w.a, b: w.b, to: 1, dir: 'right', anim: 0, pause: 0, sprites: makeCharacter(CHAR_COLORS[w.c]) }));

  // ---------- Collisions ----------
  const colliders = [];
  const addC = (x, y, w, h) => colliders.push({ x, y, w, h });
  [...buildings, tower].forEach(b => addC(b.x, b.y, b.w, b.h));
  TREES.forEach(([x, y]) => addC(x - 4, y - 4, 8, 5));
  LAMPS.forEach(([x, y]) => addC(x - 2, y - 3, 4, 3));
  HEDGES.forEach(h => addC(...h));
  addC(FOUNTAIN.x - 18, FOUNTAIN.y - 13, 36, 26);
  addC(BENCH.x - 11, BENCH.y - 6, 22, 6);
  addC(428, 624, 12, 8);
  addC(520, 624, 12, 8);
  npcs.forEach(n => addC(n.x - 6, n.y - 4, 12, 5));

  api.blocked = (x, y) => {
    const bx = x - 5, by = y - 4, bw = 10, bh = 4;
    if (bx < 8 || bx + bw > W - 8 || by < 16 || y > H - 8) return true;
    for (const c of colliders) {
      if (bx < c.x + c.w && bx + bw > c.x && by < c.y + c.h && by + bh > c.y) return true;
    }
    return false;
  };

  // ---------- Sprites ----------
  const TREE = buildSprite([
    '........LLLLLLLL........',
    '......LLGGGGGGGGLL......',
    '....LLGGGGgGGGGGGGLL....',
    '...LGGGGgggGGGGGGGGGL...',
    '..LGGGGGGgGGGGGGgGGGGL..',
    '..LGGGGGGGGGGGGgggGGGL..',
    '.LGGgGGGGGGGGGGGgGGGGGL.',
    '.LGgggGGGGGgGGGGGGGGGGL.',
    '.LGGgGGGGGgggGGGGGGgGGL.',
    '.LGGGGGGGGGgGGGGGGgggGL.',
    '.LGGGGGgGGGGGGGGGGGgGGL.',
    '..LGGGgggGGGGGGgGGGGGL..',
    '..LDGGGgGGGGGGgggGGGDL..',
    '...LDDGGGGGGGGGgGGDDL...',
    '....LLDDDGGGGGDDDDLL....',
    '......LLLDDDDDDLLL......',
    '..........wWWw..........',
    '..........wWWw..........',
    '..........wWWw..........',
    '.........wwWWww.........'
  ], { L: PAL.leaf, G: PAL.leafM, g: PAL.leafL, D: PAL.leafD, w: PAL.woodD, W: PAL.wood }, PAL.ink);

  // ---------- Drawing helpers ----------
  function poly(g, pts, fill) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  }

  function sign(g, text, cx, y) {
    g.font = FONT;
    g.textBaseline = 'top';
    const w = text.length * 8;
    const x = Math.round(cx - w / 2);
    g.fillStyle = PAL.cream;
    g.fillRect(x - 4, y - 3, w + 8, 14);
    g.fillStyle = PAL.ink;
    g.fillRect(x - 3, y - 2, w + 6, 12);
    g.fillStyle = PAL.gold;
    g.fillText(text, x, y);
  }

  function windowAt(g, x, y, w, h) {
    g.fillStyle = PAL.ink;
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = PAL.sky;
    g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,0.65)';
    g.fillRect(x + 1, y + 1, 2, 3);
    g.fillStyle = PAL.ink;
    g.fillRect(x + Math.floor(w / 2), y, 1, h);
  }

  function door(g, cx, by, color, state, t) {
    const x = cx - 8, y = by - 22;
    if (state === 'open') {
      const p = 0.5 + 0.5 * Math.sin(t * 4);
      g.fillStyle = `rgba(255,210,63,${0.2 + p * 0.3})`;
      g.fillRect(x - 5, y - 5, 26, 30);
    }
    g.fillStyle = PAL.ink;
    g.fillRect(x - 1, y - 1, 18, 23);
    if (state === 'open') {
      g.fillStyle = '#fff2b0';
      g.fillRect(x, y, 16, 22);
      g.fillStyle = PAL.gold;
      g.fillRect(x + 2, y + 2, 12, 20);
    } else {
      g.fillStyle = color;
      g.fillRect(x, y, 16, 22);
      g.fillStyle = shade(color, -0.25);
      g.fillRect(x + 2, y + 2, 5, 8); g.fillRect(x + 9, y + 2, 5, 8);
      g.fillRect(x + 2, y + 12, 5, 8); g.fillRect(x + 9, y + 12, 5, 8);
      g.fillStyle = PAL.gold;
      g.fillRect(x + 12, y + 11, 2, 2);
    }
    if (state === 'locked') {
      g.fillStyle = PAL.steel;
      for (let i = 0; i < 4; i++) g.fillRect(x + 1 + i * 4, y, 2, 22);
      g.fillStyle = PAL.red;
      g.fillRect(x + 5, y + 9, 6, 6);
      g.fillStyle = PAL.ink;
      g.fillRect(x + 7, y + 11, 2, 2);
    }
    g.fillStyle = PAL.stoneD;
    g.fillRect(x - 2, by, 20, 2);
  }

  function drawIcon(g, b, t) {
    const cx = b.dx, top = b.y;
    switch (b.icon) {
      case 'cube': {
        const s = 7, a = t * 1.2, tilt = 0.45, oy = top - 14;
        const V = [];
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
          const X = x * Math.cos(a) - z * Math.sin(a);
          const Z = x * Math.sin(a) + z * Math.cos(a);
          const Y = y * Math.cos(tilt) - Z * Math.sin(tilt);
          V.push([cx + X * s, oy + Y * s]);
        }
        const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
        g.fillStyle = PAL.slate;
        g.fillRect(cx - 1, oy + 9, 2, top - oy - 9);
        for (const [w, col] of [[3, PAL.ink], [1, PAL.gold]]) {
          g.strokeStyle = col;
          g.lineWidth = w;
          g.beginPath();
          E.forEach(([i, j]) => { g.moveTo(V[i][0], V[i][1]); g.lineTo(V[j][0], V[j][1]); });
          g.stroke();
        }
        break;
      }
      case 'led': {
        const on = Math.floor(t * 2) % 2 === 0;
        if (on) {
          g.fillStyle = 'rgba(255,90,90,0.3)';
          g.beginPath(); g.arc(cx, top - 13, 12, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = PAL.steel;
        g.fillRect(cx - 3, top - 7, 1, 7);
        g.fillRect(cx + 2, top - 7, 1, 7);
        g.fillStyle = PAL.ink;
        g.fillRect(cx - 5, top - 19, 10, 13);
        g.fillStyle = on ? '#ff5a5a' : '#7a1f28';
        g.fillRect(cx - 4, top - 18, 8, 11);
        g.fillStyle = on ? '#ffd0d0' : '#a3404a';
        g.fillRect(cx - 3, top - 17, 2, 3);
        break;
      }
      case 'code': {
        const x = cx - 14, y = top - 22;
        g.fillStyle = PAL.slate;
        g.fillRect(cx - 2, y + 16, 4, 6);
        g.fillStyle = PAL.steel;
        g.fillRect(x - 1, y - 1, 30, 19);
        g.fillStyle = PAL.ink;
        g.fillRect(x + 1, y + 1, 26, 15);
        g.font = FONT;
        g.textBaseline = 'top';
        g.fillStyle = PAL.mint;
        g.fillText('>', x + 3, y + 5);
        if (Math.floor(t * 2.5) % 2 === 0) g.fillRect(x + 13, y + 11, 7, 2);
        break;
      }
      case 'atom': {
        const cy = top - 13;
        g.lineWidth = 1;
        for (let k = 0; k < 3; k++) {
          const rot = k * Math.PI / 3;
          g.strokeStyle = PAL.sky;
          g.beginPath(); g.ellipse(cx, cy, 11, 4, rot, 0, Math.PI * 2); g.stroke();
          const p = t * 3 + k * 2.1;
          const ex = Math.cos(p) * 11, ey = Math.sin(p) * 4;
          g.fillStyle = PAL.cream;
          g.fillRect(Math.round(cx + ex * Math.cos(rot) - ey * Math.sin(rot)) - 1, Math.round(cy + ex * Math.sin(rot) + ey * Math.cos(rot)) - 1, 2, 2);
        }
        g.fillStyle = PAL.gold;
        g.fillRect(cx - 2, cy - 2, 4, 4);
        break;
      }
      case 'mission': {
        const cy = top - 13;
        if (!api.unlocked) {
          g.strokeStyle = PAL.ink; g.lineWidth = 4;
          g.beginPath(); g.arc(cx, cy - 2, 5, Math.PI, 0); g.stroke();
          g.strokeStyle = PAL.steel; g.lineWidth = 2;
          g.beginPath(); g.arc(cx, cy - 2, 5, Math.PI, 0); g.stroke();
          g.fillStyle = PAL.ink; g.fillRect(cx - 8, cy - 3, 16, 13);
          g.fillStyle = PAL.gold; g.fillRect(cx - 7, cy - 2, 14, 11);
          g.fillStyle = PAL.ink; g.fillRect(cx - 1, cy + 1, 2, 5);
        } else {
          const r = 8 + Math.sin(t * 5) * 1.5;
          g.fillStyle = 'rgba(255,210,63,0.3)';
          g.beginPath(); g.arc(cx, cy, r + 5, 0, Math.PI * 2); g.fill();
          const pts = [];
          for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5 + t * 0.6;
            const rr = i % 2 ? r * 0.45 : r;
            pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
          }
          poly(g, pts, PAL.gold);
        }
        break;
      }
    }
  }

  function drawBuilding(g, b, t) {
    const { x, y, w, h } = b;
    const roofH = Math.round(h * 0.4);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.fillRect(x + 3, y + h, w, 4);
    // walls
    g.fillStyle = PAL.ink;
    g.fillRect(x - 1, y + roofH - 1, w + 2, h - roofH + 2);
    g.fillStyle = b.wall;
    g.fillRect(x, y + roofH, w, h - roofH);
    g.fillStyle = shade(b.wall, -0.15);
    g.fillRect(x, y + h - 5, w, 5);
    // windows (skip the door area)
    const wy = y + roofH + 8;
    for (let wx = x + 8; wx + 12 <= x + w - 6; wx += 22) {
      if (wx + 12 > b.dx - 14 && wx < b.dx + 14) continue;
      windowAt(g, wx, wy, 12, 12);
    }
    // roof
    g.fillStyle = PAL.ink;
    g.fillRect(x - 5, y - 1, w + 10, roofH + 2);
    g.fillStyle = b.roof;
    g.fillRect(x - 4, y, w + 8, roofH);
    g.fillStyle = shade(b.roof, 0.22);
    for (let i = y + 3; i < y + roofH - 5; i += 5) g.fillRect(x - 4, i, w + 8, 1);
    g.fillStyle = shade(b.roof, -0.3);
    g.fillRect(x - 4, y + roofH - 4, w + 8, 4);
    sign(g, b.name, b.dx, y + Math.round(roofH / 2) - 5);
    // door
    const state = b.id === 'mission' ? (api.unlocked ? 'open' : 'locked') : 'closed';
    door(g, b.dx, y + h, b.doorC, state, t);
    drawIcon(g, b, t);
  }

  function drawTower(g, b, t) {
    const { x, y, w, h } = b, cx = b.dx;
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.fillRect(x + 3, y + h, w, 4);
    // body
    g.fillStyle = PAL.ink;
    g.fillRect(x - 1, y + 27, w + 2, h - 26);
    g.fillStyle = PAL.stone;
    g.fillRect(x, y + 28, w, h - 28);
    g.fillStyle = PAL.stoneD;
    for (let yy = y + 40; yy < y + h - 4; yy += 10) {
      g.fillRect(x, yy, w, 1);
      const off = ((yy - y) / 10) % 2 ? 6 : 0;
      for (let xx = x + off; xx < x + w; xx += 12) g.fillRect(xx, yy - 9, 1, 9);
    }
    for (let yy = y + 52; yy < y + h - 36; yy += 24) windowAt(g, cx - 6, yy, 12, 14);
    // balcony
    g.fillStyle = PAL.ink;
    g.fillRect(x - 7, y + 21, w + 14, 9);
    g.fillStyle = PAL.wine;
    g.fillRect(x - 6, y + 22, w + 12, 7);
    g.fillStyle = shade(PAL.wine, 0.3);
    g.fillRect(x - 6, y + 22, w + 12, 1);
    // lantern room
    g.fillStyle = PAL.ink;
    g.fillRect(x + 9, y + 3, w - 18, 19);
    g.fillStyle = PAL.sky;
    g.fillRect(x + 10, y + 4, w - 20, 17);
    const glow = 0.6 + 0.4 * Math.sin(t * 3);
    g.fillStyle = `rgba(255,230,120,${glow})`;
    g.fillRect(cx - 5, y + 8, 10, 10);
    // cone roof
    poly(g, [[x + 4, y + 5], [x + w - 4, y + 5], [cx, y - 16]], PAL.ink);
    poly(g, [[x + 6, y + 4], [x + w - 6, y + 4], [cx, y - 13]], PAL.red);
    g.fillStyle = PAL.gold;
    g.fillRect(cx - 1, y - 20, 2, 5);
    // rotating light beam
    const dx = Math.cos(t * 1.4) * 80;
    g.fillStyle = 'rgba(255,230,120,0.22)';
    poly(g, [[cx, y + 13], [cx + dx, y + 1], [cx + dx, y + 25]], 'rgba(255,230,120,0.22)');
    sign(g, 'VISION', cx, y + 36);
    door(g, cx, y + h, PAL.wood, 'closed', t);
  }

  function drawFountain(g, t) {
    const { x, y } = FOUNTAIN;
    g.fillStyle = PAL.ink;
    g.beginPath(); g.ellipse(x, y + 2, 20, 12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = PAL.stone;
    g.beginPath(); g.ellipse(x, y + 1, 19, 11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = PAL.stoneD;
    g.beginPath(); g.ellipse(x, y + 4, 19, 8, 0, 0, Math.PI); g.fill();
    g.fillStyle = PAL.blue;
    g.beginPath(); g.ellipse(x, y, 15, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = PAL.sky;
    g.beginPath(); g.ellipse(x, y - 1, 13, 6, 0, 0, Math.PI * 2); g.fill();
    // ripples
    g.fillStyle = 'rgba(255,255,255,0.6)';
    const r = (t * 8) % 12;
    g.fillRect(Math.round(x - r), y, 2, 1);
    g.fillRect(Math.round(x + r - 2), y - 2, 2, 1);
    // spout
    g.fillStyle = PAL.stoneD;
    g.fillRect(x - 2, y - 10, 4, 10);
    for (let i = 0; i < 6; i++) {
      const p = ((t * 1.6 + i / 6) % 1);
      const side = i % 2 ? 1 : -1;
      const dx = side * p * 9;
      const dy = -12 - Math.sin(p * Math.PI) * 8 + p * 10;
      g.fillStyle = i % 3 ? PAL.sky : '#d8f2ff';
      g.fillRect(Math.round(x + dx), Math.round(y + dy), 2, 2);
    }
  }

  function drawBench(g) {
    const { x, y } = BENCH;
    g.fillStyle = PAL.ink;
    g.fillRect(x - 12, y - 9, 24, 7);
    g.fillStyle = PAL.wood;
    g.fillRect(x - 11, y - 8, 22, 2);
    g.fillRect(x - 11, y - 5, 22, 2);
    g.fillStyle = PAL.woodD;
    g.fillRect(x - 10, y - 2, 2, 3);
    g.fillRect(x + 8, y - 2, 2, 3);
  }

  function drawLamp(g, x, y) {
    g.fillStyle = PAL.ink;
    g.fillRect(x - 2, y - 24, 4, 24);
    g.fillStyle = PAL.slate;
    g.fillRect(x - 1, y - 23, 2, 22);
    g.fillStyle = PAL.ink;
    g.fillRect(x - 4, y - 30, 8, 7);
    g.fillStyle = '#ffe9a0';
    g.fillRect(x - 3, y - 29, 6, 5);
    g.fillStyle = PAL.ink;
    g.fillRect(x - 3, y - 3, 6, 3);
  }

  function drawPillar(g, x) {
    g.fillStyle = PAL.ink;
    g.fillRect(x - 1, 596, 14, 37);
    g.fillStyle = PAL.stone;
    g.fillRect(x, 597, 12, 35);
    g.fillStyle = PAL.stoneD;
    g.fillRect(x, 607, 12, 1); g.fillRect(x, 617, 12, 1); g.fillRect(x + 9, 597, 3, 35);
  }

  // Objects sorted by their base y, so the player can walk behind them.
  api.sortables = [];
  buildings.forEach(b => api.sortables.push({ y: b.y + b.h, draw: (g, t) => drawBuilding(g, b, t) }));
  api.sortables.push({ y: tower.y + tower.h, draw: (g, t) => drawTower(g, tower, t) });
  TREES.forEach(([x, y]) => api.sortables.push({ y, draw: g => g.drawImage(TREE, x - 13, y - 21) }));
  LAMPS.forEach(([x, y]) => api.sortables.push({ y, draw: g => drawLamp(g, x, y) }));
  api.sortables.push({ y: FOUNTAIN.y + 13, draw: (g, t) => drawFountain(g, t) });
  api.sortables.push({ y: BENCH.y, draw: g => drawBench(g) });
  api.sortables.push({ y: 632, draw: g => { drawPillar(g, 428); drawPillar(g, 520); } });

  // ---------- Ground ----------
  api.drawGround = (g, cx, cy, vw, vh, t) => {
    g.fillStyle = PAL.grass;
    g.fillRect(cx, cy, vw, vh);
    const x0 = Math.floor(cx / 16), y0 = Math.floor(cy / 16);
    const x1 = Math.ceil((cx + vw) / 16), y1 = Math.ceil((cy + vh) / 16);
    const flowers = [PAL.cream, PAL.gold, PAL.pink];
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const hs = hash2(tx, ty), px = tx * 16, py = ty * 16;
        if (hs % 3 === 0) {
          g.fillStyle = PAL.grassD;
          g.fillRect(px + (hs >> 3) % 13, py + (hs >> 7) % 13, 1, 2);
          g.fillRect(px + (hs >> 11) % 12 + 2, py + (hs >> 5) % 12, 1, 2);
        }
        if (hs % 7 === 0) {
          g.fillStyle = PAL.grassL;
          g.fillRect(px + (hs >> 4) % 14, py + (hs >> 9) % 14, 2, 1);
        }
        if (hs % 23 === 0) {
          g.fillStyle = flowers[hs % 3];
          g.fillRect(px + (hs >> 6) % 13 + 1, py + (hs >> 2) % 13 + 1, 2, 2);
        }
      }
    }

    // paths and plaza share one outline
    g.fillStyle = PAL.pathD;
    for (const r of PATHS.concat([PLAZA])) g.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2);
    g.fillStyle = PAL.path;
    for (const r of PATHS) g.fillRect(r[0], r[1], r[2], r[3]);
    g.fillStyle = PAL.pathD;
    for (const r of PATHS) {
      for (let i = 0; i < (r[2] * r[3]) / 160; i++) {
        const hs = hash2(r[0] + i * 7, r[1] + i * 13);
        g.fillRect(r[0] + hs % r[2], r[1] + (hs >> 8) % r[3], 1, 1);
      }
    }
    // plaza tiles
    const [px, py, pw, ph] = PLAZA;
    g.fillStyle = PAL.stone;
    g.fillRect(px, py, pw, ph);
    g.fillStyle = shade(PAL.stone, -0.06);
    for (let yy = py; yy < py + ph; yy += 16) {
      for (let xx = px; xx < px + pw; xx += 16) {
        if (((xx - px) / 16 + (yy - py) / 16) % 2) g.fillRect(xx, yy, Math.min(16, px + pw - xx), Math.min(16, py + ph - yy));
      }
    }
    // emblem in front of the mission room
    g.fillStyle = PAL.stoneD;
    g.beginPath(); g.ellipse(480, 370, 26, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = api.unlocked ? PAL.gold : PAL.slate;
    g.beginPath(); g.ellipse(480, 370, 22, 11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = PAL.stone;
    g.beginPath(); g.ellipse(480, 370, 16, 7, 0, 0, Math.PI * 2); g.fill();

    // garden
    const G = GARDEN;
    g.fillStyle = '#5bb85a';
    g.fillRect(G.x, G.y, G.w, G.h);
    g.fillStyle = PAL.stone;
    g.fillRect(G.x + 60, G.y + 58, 100, 14);
    const fl = [PAL.red, PAL.gold, PAL.pink, PAL.cream];
    for (let i = 0; i < 14; i++) {
      g.fillStyle = PAL.leaf;
      g.fillRect(G.x + 14 + i * 10, G.y + 14, 3, 3);
      g.fillRect(G.x + 14 + i * 10, G.y + 112, 3, 3);
      g.fillStyle = fl[i % 4];
      g.fillRect(G.x + 14 + i * 10, G.y + 12, 3, 2);
      g.fillRect(G.x + 14 + i * 10, G.y + 110, 3, 2);
    }
    for (const [hx, hy, hw, hh] of HEDGES) {
      g.fillStyle = PAL.ink;
      g.fillRect(hx - 1, hy - 7, hw + 2, hh + 8);
      g.fillStyle = PAL.leaf;
      g.fillRect(hx, hy - 6, hw, hh + 6);
      g.fillStyle = PAL.leafM;
      g.fillRect(hx, hy - 6, hw, 3);
    }
    sign(g, 'GOAL GARDEN', G.x + G.w / 2, G.y - 18);

    // fence around the campus
    g.fillStyle = PAL.woodD;
    g.fillRect(0, 9, W, 2); g.fillRect(0, 13, W, 2);
    g.fillRect(3, 0, 2, H); g.fillRect(W - 5, 0, 2, H);
    g.fillRect(0, 634, 428, 2); g.fillRect(532, 634, W - 532, 2);
    g.fillStyle = PAL.wood;
    for (let xx = 0; xx < W; xx += 16) {
      g.fillRect(xx, 6, 3, 11);
      if (xx < 428 || xx > 532) g.fillRect(xx, 630, 3, 10);
    }
    for (let yy = 0; yy < H; yy += 16) { g.fillRect(2, yy, 4, 3); g.fillRect(W - 6, yy, 4, 3); }
  };

  // Drawn above everything: the entrance arch.
  api.drawTop = g => {
    g.fillStyle = PAL.ink;
    g.fillRect(426, 588, 108, 12);
    g.fillStyle = PAL.wine;
    g.fillRect(427, 589, 106, 10);
    sign(g, 'STEM CLUB', 480, 591);
  };

  // ---------- Animation ----------
  api.npcs = npcs;
  api.walkers = walkers;
  api.update = dt => {
    for (const w of walkers) {
      if (w.pause > 0) { w.pause -= dt; w.anim = 0; continue; }
      const tg = w.to ? w.b : w.a;
      const dx = tg[0] - w.x, dy = tg[1] - w.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) { w.to ^= 1; w.pause = 1 + Math.random() * 2; continue; }
      const s = Math.min(d, 22 * dt);
      w.x += dx / d * s;
      w.y += dy / d * s;
      w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      w.anim += dt;
    }
  };

  api.missionDoor = { x: 480, y: 336 };
  // true when the point is on a sand path or the plaza (the path hint prefers these)
  api.onPath = (x, y) => PATHS.concat([PLAZA]).some(r => x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]);
  return api;
})();
