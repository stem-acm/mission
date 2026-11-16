// The three lab puzzles. Each one is optional and can be left at any time with EXIT.

const DV = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N, E, S, W

const Puzzle = (() => {
  const $ = id => document.getElementById(id);
  const root = $('puzzle'), $title = $('puzzleTitle'), $goal = $('puzzleGoal'), $body = $('puzzleBody');
  const $msg = $('puzzleMsg'), $hint = $('puzzleHint'), $actions = $('puzzleActions'), $exit = $('puzzleExit');
  let def = null, cb = null, fails = 0, solved = false, ctx = null, defaultHint = '';

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function btn(label, cls, fn) {
    const b = el('button', 'btn ' + (cls || ''), label);
    b.type = 'button';
    b.addEventListener('click', () => { Sfx.init(); fn(b); });
    return b;
  }
  function canvas(w, h, cls) {
    const c = el('canvas', 'px ' + (cls || ''));
    c.width = w;
    c.height = h;
    return c;
  }
  function msg(text, kind) { $msg.textContent = text || ''; $msg.className = kind || ''; }

  const api = {
    el, btn, canvas, msg,
    body: () => $body,
    actions: () => $actions,
    get solved() { return solved; },
    fail(text, hint) {
      fails++;
      Sfx.fail();
      msg(text, 'bad');
      if (fails >= 2) {
        $hint.textContent = 'HINT: ' + (hint || defaultHint);
        $hint.classList.remove('hidden');
      }
    },
    win(text) {
      if (solved) return;
      solved = true;
      Sfx.success();
      msg(text, 'good');
      $hint.classList.add('hidden');
      $actions.innerHTML = '';
      const c = btn('CONTINUE ▶', 'btn-mint', close);
      $actions.appendChild(c);
      c.focus();
    }
  };

  function open(id, done) {
    def = PUZZLES[id];
    const txt = PUZZLE_TEXT[id];
    cb = done;
    fails = 0;
    solved = false;
    defaultHint = txt.hint;
    $title.textContent = txt.title;
    $goal.textContent = txt.goal;
    $body.innerHTML = '';
    $actions.innerHTML = '';
    msg('');
    $hint.classList.add('hidden');
    root.classList.remove('hidden');
    root.scrollTop = 0;
    ctx = def.setup(api) || {};
  }

  function close() {
    if (!def) return;
    if (def.teardown) def.teardown(ctx);
    root.classList.add('hidden');
    const done = cb, s = solved;
    def = null;
    cb = null;
    ctx = null;
    if (done) done(s);
  }

  function tick(dt) { if (def && def.tick) def.tick(ctx, dt); }

  $exit.addEventListener('click', () => { Sfx.init(); close(); });
  addEventListener('keydown', e => { if (def && e.code === 'Escape') close(); });

  return { open, close, tick, isOpen: () => !!def };
})();

const PUZZLES = {};

// =============== 3D MODELLING: MATCH THE VIEWS ===============
PUZZLES.model = (() => {
  const TARGET = [[0, 1, 0], [1, 3, 1], [0, 2, 0]]; // rows: back -> front, columns: left -> right
  const VIEWS = [['top', 'TOP'], ['front', 'FRONT'], ['side', 'SIDE (from the right)']];

  function viewData(k, Hm) {
    if (k === 'top') return Hm.flat().map(v => (v > 0 ? 1 : 0));
    if (k === 'front') return [0, 1, 2].map(x => Math.max(Hm[0][x], Hm[1][x], Hm[2][x]));
    // seen from the right: the front row is on the left of the picture
    return [0, 1, 2].map(i => Math.max(...Hm[2 - i]));
  }

  function drawView(cv, k, Hm) {
    const g = cv.getContext('2d');
    g.fillStyle = PAL.ink;
    g.fillRect(0, 0, 32, 32);
    const d = viewData(k, Hm);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const on = k === 'top' ? d[j * 3 + i] : (2 - j) < d[i];
        g.fillStyle = on ? PAL.gold : '#2c3150';
        g.fillRect(2 + i * 10, 2 + j * 10, 8, 8);
      }
    }
    if (k !== 'top') { g.fillStyle = PAL.cream; g.fillRect(0, 31, 32, 1); }
  }

  function poly(g, pts, fill) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.strokeStyle = PAL.ink;
    g.lineWidth = 1;
    g.stroke();
  }

  function drawIso(cv, Hm) {
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    const ox = 36, oy = 38;
    for (let z = 0; z < 3; z++) {
      for (let x = 0; x < 3; x++) {
        const sx = ox + (x - z) * 10, sy = oy + (x + z) * 5;
        poly(g, [[sx, sy - 5], [sx + 10, sy], [sx, sy + 5], [sx - 10, sy]], (x + z) % 2 ? '#3a4060' : '#474f78');
      }
    }
    const list = [];
    for (let z = 0; z < 3; z++) for (let x = 0; x < 3; x++) for (let k = 0; k < Hm[z][x]; k++) list.push({ x, z, k });
    list.sort((a, b) => (a.x + a.z) - (b.x + b.z) || a.k - b.k);
    for (const c of list) {
      const sx = ox + (c.x - c.z) * 10;
      const ty = oy + (c.x + c.z) * 5 - (c.k + 1) * 10;
      poly(g, [[sx - 10, ty], [sx, ty + 5], [sx, ty + 15], [sx - 10, ty + 10]], PAL.orange);
      poly(g, [[sx, ty + 5], [sx + 10, ty], [sx + 10, ty + 10], [sx, ty + 15]], PAL.wine);
      poly(g, [[sx, ty - 5], [sx + 10, ty], [sx, ty + 5], [sx - 10, ty]], PAL.gold);
    }
  }

  return {
    setup(api) {
      const Hm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const wrap = api.el('div', 'pz-model');

      const left = api.el('div', 'pz-col');
      left.appendChild(api.el('div', 'pz-label', 'YOUR MODEL'));
      const iso = api.canvas(72, 68, 'iso');
      left.appendChild(iso);
      left.appendChild(api.el('div', 'pz-small', 'BACK'));
      const grid = api.el('div', 'grid3');
      const cells = [];
      for (let z = 0; z < 3; z++) {
        for (let x = 0; x < 3; x++) {
          const b = api.el('button', 'cell');
          b.type = 'button';
          b.setAttribute('aria-label', `Tile row ${z + 1} column ${x + 1}`);
          b.addEventListener('click', () => {
            if (api.solved) return;
            Hm[z][x] = (Hm[z][x] + 1) % 4;
            Sfx.blip();
            refresh();
          });
          grid.appendChild(b);
          cells.push(b);
        }
      }
      left.appendChild(grid);
      left.appendChild(api.el('div', 'pz-small', 'FRONT'));

      const right = api.el('div', 'pz-col');
      right.appendChild(api.el('div', 'pz-label', 'TARGET VIEWS'));
      VIEWS.forEach(([k, label]) => {
        const row = api.el('div', 'view-row');
        const cv = api.canvas(32, 32, 'view');
        drawView(cv, k, TARGET);
        row.append(cv, api.el('div', 'view-name', label));
        right.appendChild(row);
      });

      wrap.append(left, right);
      api.body().appendChild(wrap);

      function refresh() {
        cells.forEach((b, i) => {
          const v = Hm[Math.floor(i / 3)][i % 3];
          b.textContent = v ? String(v) : '';
          b.dataset.h = v;
        });
        drawIso(iso, Hm);
      }

      function check() {
        if (api.solved) return;
        const bad = VIEWS.filter(([k]) => viewData(k, Hm).join() !== viewData(k, TARGET).join()).map(v => v[0].toUpperCase());
        if (!bad.length) api.win('PERFECT MATCH! All three views fit the target.');
        else {
          const names = bad.length > 1 ? bad.slice(0, -1).join(', ') + ' and ' + bad[bad.length - 1] : bad[0];
          api.fail(`Not yet: the ${names} view${bad.length > 1 ? "s don't" : " doesn't"} match.`);
        }
      }

      api.actions().append(
        api.btn('CHECK ✓', '', check),
        api.btn('RESET', 'btn-ghost', () => {
          if (api.solved) return;
          Hm.forEach(r => r.fill(0));
          api.msg('');
          refresh();
        })
      );
      refresh();
      return {};
    }
  };
})();

// =============== ELECTRONICS: LIGHT THE LED ===============
PUZZLES.elec = (() => {
  const COLS = 5, ROWS = 3, CS = 24;
  const BASE = { wire: [0, 2], corner: [0, 1], led: [0, 2], bat: [0, 2] };
  const conns = t => {
    if (t.type === 'slot') return t.part ? [0, 2].map(d => (d + t.rot) % 4) : null;
    const b = BASE[t.type];
    return b ? b.map(d => (d + t.rot) % 4) : null;
  };
  const T = (type, rot, fixed) => ({ type, rot, fixed: !!fixed });

  return {
    setup(api) {
      const s = { grid: null, lit: false, burned: false, smoke: [], flash: null, time: 0 };
      function reset() {
        s.grid = [
          [T('corner', 0), T('wire', 0), T('slot', 1), T('wire', 2), T('corner', 0)],
          [T('bat', 0, true), T('deco', 0, true), T('chip', 0, true), T('deco', 0, true), T('led', 2)],
          [T('corner', 2), T('wire', 0), T('wire', 1), T('wire', 0), T('corner', 1)]
        ];
        s.grid[0][2].part = null;
        s.lit = false;
        s.burned = false;
        s.smoke = [];
        updateTray();
      }

      const wrap = api.el('div', 'elec');
      const cv = api.canvas(COLS * CS, ROWS * CS, 'board');
      s.cv = cv;
      wrap.appendChild(cv);
      const tray = api.el('div', 'tray');
      tray.appendChild(api.el('span', 'lbl', 'EMPTY SLOT:'));
      const bWire = api.btn('WIRE', 'btn-small btn-ghost', () => setPart('wire'));
      const bRes = api.btn('RESISTOR', 'btn-small btn-ghost', () => setPart('res'));
      tray.append(bWire, bRes);
      wrap.appendChild(tray);
      api.body().appendChild(wrap);

      function updateTray() {
        const p = s.grid ? s.grid[0][2].part : null;
        bWire.classList.toggle('picked', p === 'wire');
        bRes.classList.toggle('picked', p === 'res');
      }
      function setPart(p) {
        if (api.solved) return;
        s.grid[0][2].part = p;
        s.lit = false;
        s.burned = false;
        Sfx.blip();
        updateTray();
      }

      cv.addEventListener('pointerdown', e => {
        if (api.solved) return;
        const r = cv.getBoundingClientRect();
        const x = Math.floor((e.clientX - r.left) / r.width * COLS);
        const y = Math.floor((e.clientY - r.top) / r.height * ROWS);
        const t = s.grid[y] && s.grid[y][x];
        if (!t || t.fixed) return;
        if (t.type === 'slot' && !t.part) { api.msg('Pick a part for the empty slot below the board.'); return; }
        t.rot = (t.rot + 1) % 4;
        s.lit = false;
        s.burned = false;
        Sfx.blip();
      });

      function trace() {
        let x = 0, y = 0, enter = 2, reversed = false, resistor = false;
        for (let i = 0; i < 40; i++) {
          if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return { open: true };
          const t = s.grid[y][x];
          if (t.type === 'bat') return enter === 2 ? { reversed, resistor } : { open: true };
          const c = conns(t);
          if (!c || !c.includes(enter)) return { open: true, at: [x, y] };
          if (t.type === 'led' && c[0] !== enter) reversed = true;
          if (t.type === 'slot' && t.part === 'res') resistor = true;
          const out = c[0] === enter ? c[1] : c[0];
          x += DV[out][0];
          y += DV[out][1];
          enter = (out + 2) % 4;
        }
        return { open: true };
      }

      function power() {
        if (api.solved) return;
        const r = trace();
        if (r.open) {
          if (r.at) s.flash = { x: r.at[0], y: r.at[1], t: 1.2 };
          api.fail('No light! The circuit is OPEN: current needs a closed loop from + back to -.',
            'Follow the wire from the battery + (top) all the way around to - (bottom). Every tile must connect to the next one. The red box shows where the loop breaks.');
          return;
        }
        if (r.reversed) {
          api.fail('Still dark... the LED is BACKWARDS. An LED lets current flow only one way.',
            'The + mark of the LED must face the side of the loop that comes from the battery +. Tap the LED to turn it.');
          return;
        }
        if (!r.resistor) {
          s.burned = true;
          api.fail('POOF! Too much current burned the LED. A resistor limits the current.',
            'Put a RESISTOR in the slot instead of a plain wire.');
          return;
        }
        s.lit = true;
        api.win('IT LIGHTS UP! Closed loop + LED the right way + a resistor = a working circuit.');
      }

      api.actions().append(
        api.btn('⚡ POWER', '', power),
        api.btn('RESET', 'btn-ghost', () => { if (!api.solved) { reset(); api.msg(''); } })
      );
      reset();
      return s;
    },

    tick(s, dt) {
      s.time += dt;
      if (s.flash) { s.flash.t -= dt; if (s.flash.t <= 0) s.flash = null; }
      const LX = 4 * CS + 12, LY = CS + 12;
      if (s.burned && Math.random() < dt * 12) s.smoke.push({ x: LX - 3 + Math.random() * 6, y: LY - 5, life: 1 });
      s.smoke.forEach(p => { p.y -= dt * 14; p.x += Math.sin(p.y) * 0.2; p.life -= dt * 0.9; });
      s.smoke = s.smoke.filter(p => p.life > 0);

      const g = s.cv.getContext('2d');
      g.fillStyle = '#efe6cc';
      g.fillRect(0, 0, s.cv.width, s.cv.height);
      g.fillStyle = '#cfc3a3';
      for (let y = 3; y < s.cv.height; y += 6) for (let x = 3; x < s.cv.width; x += 6) g.fillRect(x, y, 1, 1);
      const wc = s.lit ? PAL.gold : '#3b3f63';
      g.font = '8px "Press Start 2P", monospace';
      g.textBaseline = 'top';

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const t = s.grid[y][x], ox = x * CS, oy = y * CS, cx = ox + 12, cy = oy + 12;
          if (!t.fixed) { g.fillStyle = 'rgba(47,111,208,0.1)'; g.fillRect(ox + 1, oy + 1, CS - 2, CS - 2); }
          const c = conns(t);
          if (c) {
            g.fillStyle = wc;
            for (const d of c) {
              if (d === 0) g.fillRect(cx - 1, oy, 3, 13);
              if (d === 2) g.fillRect(cx - 1, cy, 3, 12);
              if (d === 1) g.fillRect(cx, cy - 1, 12, 3);
              if (d === 3) g.fillRect(ox, cy - 1, 13, 3);
            }
          }
          switch (t.type) {
            case 'wire':
            case 'corner':
              g.fillStyle = wc;
              g.fillRect(cx - 2, cy - 2, 5, 5);
              break;
            case 'bat':
              g.fillStyle = PAL.steel; g.fillRect(cx - 2, cy - 10, 5, 2);
              g.fillStyle = PAL.ink; g.fillRect(cx - 7, cy - 9, 15, 19);
              g.fillStyle = PAL.blue; g.fillRect(cx - 6, cy - 8, 13, 17);
              g.fillStyle = PAL.red; g.fillRect(cx - 6, cy - 8, 13, 7);
              g.fillStyle = PAL.cream;
              g.fillRect(cx - 2, cy - 5, 5, 1); g.fillRect(cx, cy - 7, 1, 5);
              g.fillRect(cx - 2, cy + 4, 5, 1);
              break;
            case 'led': {
              const a = c[0];
              if (s.lit) {
                const pulse = 13 + Math.sin(s.time * 6) * 2;
                g.fillStyle = 'rgba(255,80,80,0.25)';
                g.beginPath(); g.arc(cx, cy, pulse, 0, Math.PI * 2); g.fill();
                g.fillStyle = 'rgba(255,200,200,0.35)';
                g.beginPath(); g.arc(cx, cy, 8, 0, Math.PI * 2); g.fill();
              }
              g.fillStyle = PAL.ink;
              g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fill();
              g.fillStyle = s.burned ? '#4a4a4a' : s.lit ? '#ff5a5a' : '#a3262f';
              g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill();
              g.fillStyle = s.burned ? '#222' : '#ffd0d0';
              g.fillRect(cx - 2, cy - 3, 2, 2);
              const pv = [-DV[a][1], DV[a][0]];
              const px = cx + DV[a][0] * 8 + pv[0] * 5, py = cy + DV[a][1] * 8 + pv[1] * 5;
              g.fillStyle = PAL.red;
              g.fillRect(px - 2, py, 5, 1); g.fillRect(px, py - 2, 1, 5);
              break;
            }
            case 'slot':
              if (!t.part) {
                g.setLineDash([2, 2]);
                g.strokeStyle = PAL.plum;
                g.lineWidth = 1;
                g.strokeRect(ox + 3.5, oy + 3.5, CS - 7, CS - 7);
                g.setLineDash([]);
                g.fillStyle = PAL.plum;
                g.fillText('?', cx - 3, cy - 3);
              } else if (t.part === 'wire') {
                g.fillStyle = wc; g.fillRect(cx - 2, cy - 2, 5, 5);
              } else {
                const hor = c.includes(1);
                g.fillStyle = PAL.ink;
                if (hor) g.fillRect(cx - 8, cy - 4, 17, 9); else g.fillRect(cx - 4, cy - 8, 9, 17);
                g.fillStyle = '#d9b98a';
                if (hor) g.fillRect(cx - 7, cy - 3, 15, 7); else g.fillRect(cx - 3, cy - 7, 7, 15);
                [PAL.red, PAL.plum, PAL.gold].forEach((col, i) => {
                  g.fillStyle = col;
                  if (hor) g.fillRect(cx - 4 + i * 3, cy - 3, 2, 7); else g.fillRect(cx - 3, cy - 4 + i * 3, 7, 2);
                });
              }
              break;
            case 'chip':
              g.fillStyle = PAL.steel;
              for (let i = 0; i < 4; i++) { g.fillRect(cx - 6 + i * 4, cy - 7, 1, 2); g.fillRect(cx - 6 + i * 4, cy + 5, 1, 2); }
              g.fillStyle = PAL.ink; g.fillRect(cx - 8, cy - 5, 16, 10);
              g.fillStyle = PAL.cream; g.fillRect(cx - 6, cy - 3, 2, 2);
              break;
          }
          if (s.flash && s.flash.x === x && s.flash.y === y && Math.floor(s.flash.t * 6) % 2 === 0) {
            g.strokeStyle = PAL.red;
            g.lineWidth = 2;
            g.strokeRect(ox + 2, oy + 2, CS - 4, CS - 4);
          }
        }
      }
      for (const p of s.smoke) {
        g.fillStyle = `rgba(90,90,90,${p.life * 0.8})`;
        g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
      }
    }
  };
})();

// =============== PROGRAMMING: GUIDE THE BOT ===============
PUZZLES.code = (() => {
  const COLS = 7, ROWS = 5, CS = 16, LIMIT = 6, MAX_REPEAT = 6;
  const FLOOR = new Set(['0,4', '1,4', '2,4', '3,4', '4,4', '5,4', '5,3', '5,2', '5,1', '5,0', '4,0', '3,0', '1,3', '1,2', '3,1', '3,2']);
  const START = { x: 0, y: 4, d: 1 }, GOAL = { x: 3, y: 0 };
  // cells between the start and the flag, in walking order (used for the path hint)
  const ROUTE = [[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [5, 3], [5, 2], [5, 1], [5, 0], [4, 0]];
  const NAMES = { F: 'forward();', L: 'turnLeft();', R: 'turnRight();' };
  const lineText = st => (st.n > 1 ? `repeat(${st.n}) ${NAMES[st.cmd]}` : NAMES[st.cmd]);

  return {
    setup(api) {
      const s = { prog: [], run: null, bot: null, time: 0 };
      const wrap = api.el('div', 'code-wrap');
      const cv = api.canvas(COLS * CS, ROWS * CS, 'maze');
      s.cv = cv;
      const col = api.el('div', 'code-col');
      const code = api.el('div', 'code');
      const counter = api.el('div', 'counter');
      col.append(code, counter);
      wrap.append(cv, col);
      api.body().appendChild(wrap);

      const cmds = api.el('div', 'cmds');
      cmds.append(
        api.btn('forward()', 'btn-small', () => add('F')),
        api.btn('turnLeft()', 'btn-small', () => add('L')),
        api.btn('turnRight()', 'btn-small', () => add('R')),
        api.btn('UNDO', 'btn-small btn-ghost', () => { if (s.run || api.solved) return; s.prog.pop(); resetBot(); render(); }),
        api.btn('CLEAR', 'btn-small btn-ghost', () => { if (s.run || api.solved) return; s.prog = []; resetBot(); render(); })
      );
      api.body().appendChild(cmds);

      function resetBot() { s.bot = { x: START.x, y: START.y, d: START.d, vx: START.x, vy: START.y, shake: 0 }; }

      function add(cmd) {
        if (s.run || api.solved) return;
        if (s.prog.length >= LIMIT) {
          Sfx.bump();
          api.msg(`Line limit reached (${LIMIT})! Use + on a line to repeat it instead of adding new lines.`, 'bad');
          return;
        }
        s.prog.push({ cmd, n: 1 });
        Sfx.blip();
        api.msg('');
        resetBot();
        render();
      }

      function render() {
        code.innerHTML = '';
        code.appendChild(api.el('div', 'ln-fixed', 'int main(void) {'));
        if (!s.prog.length) code.appendChild(api.el('div', 'ln-empty', '// add commands'));
        s.prog.forEach(st => {
          const row = api.el('div', 'ln');
          row.appendChild(api.el('span', 'ln-text', lineText(st)));
          const rep = api.el('span', 'rep');
          const change = d => {
            if (s.run || api.solved) return;
            const n = Math.max(1, Math.min(MAX_REPEAT, st.n + d));
            if (n === st.n) { Sfx.bump(); return; }
            st.n = n;
            Sfx.blip();
            api.msg('');
            resetBot();
            render();
          };
          const minus = api.el('button', 'rep-btn', '−');
          minus.type = 'button';
          minus.setAttribute('aria-label', 'Repeat fewer times');
          minus.disabled = st.n <= 1;
          minus.addEventListener('click', () => change(-1));
          const plus = api.el('button', 'rep-btn', '+');
          plus.type = 'button';
          plus.setAttribute('aria-label', 'Repeat more times');
          plus.disabled = st.n >= MAX_REPEAT;
          plus.addEventListener('click', () => change(1));
          rep.append(minus, api.el('span', 'rep-n', '×' + st.n), plus);
          row.appendChild(rep);
          code.appendChild(row);
        });
        code.appendChild(api.el('div', 'ln-fixed', '}'));
        counter.textContent = `LINES: ${s.prog.length}/${LIMIT}`;
        counter.classList.toggle('full', s.prog.length >= LIMIT);
      }

      function setActive(i) { code.querySelectorAll('.ln').forEach((b, j) => b.classList.toggle('active', j === i)); }
      s.setActive = setActive;

      function runProg() {
        if (s.run || api.solved) return;
        if (!s.prog.length) { api.msg('Add some commands first!', 'bad'); return; }
        resetBot();
        const actions = [];
        s.prog.forEach((st, i) => { for (let k = 0; k < st.n; k++) actions.push({ cmd: st.cmd, line: i }); });
        s.run = { actions, i: 0, t: 0.25 };
        api.msg('Running...');
      }

      s.step = () => {
        const run = s.run, bot = s.bot;
        if (run.i >= run.actions.length) {
          s.run = null;
          setActive(-1);
          api.fail('The bot stopped before reaching the flag. Check your numbers!');
          return;
        }
        const a = run.actions[run.i++];
        setActive(a.line);
        if (a.cmd === 'F') {
          const nx = bot.x + DV[bot.d][0], ny = bot.y + DV[bot.d][1];
          if (!FLOOR.has(nx + ',' + ny)) {
            bot.shake = 0.4;
            Sfx.bump();
            s.run = null;
            setActive(-1);
            api.fail('BONK! The bot hit a wall. It does exactly what you wrote!');
            return;
          }
          bot.x = nx;
          bot.y = ny;
          Sfx.step();
          if (nx === GOAL.x && ny === GOAL.y) {
            s.run = null;
            setActive(-1);
            api.win('FLAG REACHED! You wrote a program with loops.');
          }
        } else {
          bot.d = a.cmd === 'L' ? (bot.d + 3) % 4 : (bot.d + 1) % 4;
          Sfx.blip();
        }
      };

      api.actions().append(api.btn('▶ RUN', '', runProg));
      resetBot();
      render();
      return s;
    },

    tick(s, dt) {
      s.time += dt;
      if (s.run) {
        s.run.t -= dt;
        if (s.run.t <= 0) { s.run.t = 0.32; s.step(); }
      }
      const bot = s.bot;
      const k = Math.min(1, dt * 14);
      bot.vx += (bot.x - bot.vx) * k;
      bot.vy += (bot.y - bot.vy) * k;
      if (bot.shake > 0) bot.shake -= dt;

      const g = s.cv.getContext('2d');
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const ox = x * CS, oy = y * CS;
          if (FLOOR.has(x + ',' + y)) {
            g.fillStyle = '#3a4068'; g.fillRect(ox, oy, CS, CS);
            g.fillStyle = '#4a5080'; g.fillRect(ox + 1, oy + 1, CS - 2, CS - 2);
          } else {
            g.fillStyle = '#2a2f5a'; g.fillRect(ox, oy, CS, CS);
            g.fillStyle = PAL.night;
            g.fillRect(ox, oy + 5, CS, 1); g.fillRect(ox, oy + 11, CS, 1);
            g.fillRect(ox + 4, oy, 1, 5); g.fillRect(ox + 12, oy + 6, 1, 5); g.fillRect(ox + 6, oy + 12, 1, 4);
          }
        }
      }
      // subtle path hint: faint dots, with a soft glow travelling from start to flag
      const glow = (s.time * 4) % (ROUTE.length + 10);
      ROUTE.forEach(([x, y], i) => {
        const a = 0.35 + Math.max(0, 1 - Math.abs(glow - i) / 1.5) * 0.5;
        g.fillStyle = `rgba(255,210,63,${a})`;
        g.fillRect(x * CS + 6, y * CS + 6, 4, 4);
      });
      // start pad
      g.fillStyle = 'rgba(126,224,138,0.35)';
      g.fillRect(START.x * CS + 2, START.y * CS + 2, CS - 4, CS - 4);
      // goal flag
      const gx = GOAL.x * CS, gy = GOAL.y * CS;
      g.fillStyle = PAL.cream; g.fillRect(gx + 5, gy + 2, 1, 12);
      const wave = Math.floor(s.time * 4) % 2;
      g.fillStyle = PAL.gold; g.fillRect(gx + 6, gy + 2 + wave, 6, 4);
      g.fillStyle = PAL.ink; g.fillRect(gx + 3, gy + 13, 5, 1);
      // bot
      const sh = bot.shake > 0 ? Math.sin(bot.shake * 60) * 2 : 0;
      const bx = Math.round(bot.vx * CS + sh), by = Math.round(bot.vy * CS);
      g.fillStyle = PAL.ink; g.fillRect(bx + 2, by + 3, 12, 11);
      g.fillStyle = PAL.steel; g.fillRect(bx + 3, by + 4, 10, 9);
      g.fillStyle = PAL.red; g.fillRect(bx + 7, by + 1, 2, 2);
      g.fillStyle = PAL.ink; g.fillRect(bx + 7, by + 2, 2, 2);
      g.fillRect(bx + 3, by + 13, 3, 2); g.fillRect(bx + 10, by + 13, 3, 2);
      const ex = bx + 7 + DV[bot.d][0] * 3, ey = by + 7 + DV[bot.d][1] * 3;
      g.fillStyle = PAL.mint; g.fillRect(ex, ey, 2, 2);
    }
  };
})();
