// Game loop, modes (title, play, dialog, puzzle, ending), HUD and ending sequence.

(() => {
  const VW = 320, VH = 180;
  const FONT = '8px "Press Start 2P", monospace';
  const $ = id => document.getElementById(id);
  const canvas = $('screen'), g = canvas.getContext('2d');
  const stage = $('stage'), app = $('app');
  const $hud = $('hud'), $tracker = $('tracker'), $toast = $('toast');
  const $dialog = $('dialog'), $dName = $('dialogName'), $dText = $('dialogText'), $dChoices = $('dialogChoices'), $dNext = $('dialogNext');
  const $title = $('title'), $ending = $('ending'), $terminal = $('terminal'), $endcard = $('endcard');

  let mode = 'title', time = 0, isTouch = false, unlockTimer = null, toastTimer = 0;
  const visited = new Set();
  let unlocked = false;
  const cam = { x: 320, y: 300 };
  const player = { x: 480, y: 622, dir: 'up', anim: 0, sprites: makeCharacter(CHAR_COLORS.player) };
  const DOOR = { type: 'door' };

  function setMode(m) {
    mode = m;
    Input.clear();
    Input.capture = m === 'title' || m === 'play' || m === 'dialog';
  }

  // ---------- Layout ----------
  function fit() {
    const W = innerWidth, H = innerHeight, portrait = H > W;
    let rx = 0, ry = 0;
    if (isTouch) { if (portrait) ry = 220; else rx = Math.min(300, W * 0.36); }
    const s = Math.max(0.5, Math.min((W - rx - 16) / VW, (H - ry - 16) / VH));
    stage.style.width = Math.floor(VW * s) + 'px';
    stage.style.height = Math.floor(VH * s) + 'px';
    document.documentElement.style.setProperty('--u', s + 'px');
    app.classList.toggle('top', isTouch && portrait);
    app.style.paddingTop = isTouch && portrait ? Math.max(12, (H - ry - VH * s) / 2) + 'px' : '';
  }
  function enableTouch() {
    if (isTouch) return;
    isTouch = true;
    document.body.classList.add('touch');
    $('touch').classList.remove('hidden');
    $('titleHelp').textContent = 'PAD TO MOVE · A TO TALK';
    fit();
  }
  addEventListener('resize', fit);
  addEventListener('touchstart', enableTouch, { passive: true });
  if (matchMedia('(pointer: coarse)').matches) enableTouch();
  fit();

  // ---------- HUD ----------
  const slots = {};
  ZONE_ORDER.forEach(z => {
    const d = document.createElement('div');
    d.className = 'slot';
    d.textContent = ZONE_LABEL[z];
    $tracker.appendChild(d);
    slots[z] = d;
  });
  function updateTracker() { ZONE_ORDER.forEach(z => slots[z].classList.toggle('on', visited.has(z))); }
  function toast(text, dur = 2.8) {
    $toast.textContent = text;
    $toast.classList.remove('hidden');
    $toast.style.animation = 'none';
    void $toast.offsetWidth;
    $toast.style.animation = '';
    toastTimer = dur;
  }
  $('muteBtn').addEventListener('click', e => {
    Sfx.init();
    Sfx.muted = !Sfx.muted;
    e.currentTarget.textContent = Sfx.muted ? 'SND OFF' : 'SND ON';
    e.currentTarget.blur();
  });
  $('fbLink').href = FACEBOOK_URL;

  // ---------- Dialog ----------
  let dlg = null;
  function openDialog(d) {
    dlg = d;
    setMode('dialog');
    $dialog.classList.remove('hidden');
    $dName.textContent = d.name;
    $dChoices.innerHTML = '';
    $dText.textContent = '';
  }
  function say(name, lines, then) { openDialog({ name, lines: lines.slice(), i: 0, c: 0, acc: 0, then, options: null }); }
  function ask(name, text, options, onPick) { openDialog({ name, lines: [text], i: 0, c: 0, acc: 0, options, onPick, sel: 0 }); }

  function setSel(i) {
    const n = dlg.options.length;
    dlg.sel = (i + n) % n;
    [...$dChoices.children].forEach((b, j) => b.classList.toggle('sel', j === dlg.sel));
  }
  function renderChoices() {
    dlg.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.textContent = o;
      b.addEventListener('pointerdown', e => e.stopPropagation());
      b.addEventListener('click', e => { e.stopPropagation(); pick(i); });
      $dChoices.appendChild(b);
    });
    setSel(0);
  }
  function pick(i) {
    if (!dlg || !dlg.options) return;
    Sfx.select();
    const cb = dlg.onPick;
    closeDialog(true);
    if (cb) cb(i);
  }
  function closeDialog(silent) {
    const then = dlg && dlg.then;
    dlg = null;
    $dialog.classList.add('hidden');
    $dChoices.innerHTML = '';
    setMode('play');
    if (!silent && then) then();
  }
  function updateDialog(dt) {
    const line = dlg.lines[dlg.i];
    if (dlg.c < line.length) {
      dlg.acc += dt * 55;
      let n = 0;
      while (dlg.acc >= 1 && dlg.c < line.length) { dlg.c++; dlg.acc--; n++; }
      if (n && dlg.c % 3 === 0) Sfx.blip();
      $dText.textContent = line.slice(0, dlg.c);
    }
    const typed = dlg.c >= line.length;
    const last = dlg.i === dlg.lines.length - 1;
    const choosing = !!dlg.options && last && typed;
    if (choosing && !$dChoices.childElementCount) renderChoices();
    $dNext.classList.toggle('hidden', !typed || choosing);
    if (choosing) {
      const q = Input.takeDir();
      if (q === 'up' || q === 'left') setSel(dlg.sel - 1);
      if (q === 'down' || q === 'right') setSel(dlg.sel + 1);
    }
    if (Input.takeAction()) {
      if (!typed) { dlg.c = line.length; $dText.textContent = line; return; }
      if (choosing) { pick(dlg.sel); return; }
      Sfx.blip();
      dlg.i++;
      dlg.c = 0;
      dlg.acc = 0;
      $dText.textContent = '';
      if (dlg.i >= dlg.lines.length) closeDialog();
    }
  }
  $dialog.addEventListener('pointerdown', () => { Sfx.init(); if (mode === 'dialog') Input.actionQueued = true; });
  // Close button (and Escape): leaves the conversation early. The zone only counts once its dialog is read to the end.
  const $dClose = $('dialogClose');
  $dClose.addEventListener('pointerdown', e => e.stopPropagation());
  $dClose.addEventListener('click', e => { e.stopPropagation(); if (dlg) { Sfx.blip(); closeDialog(true); } });
  addEventListener('keydown', e => { if (mode === 'dialog' && dlg && e.code === 'Escape') { e.preventDefault(); closeDialog(true); } });

  // ---------- Zones ----------
  function markVisited(z) {
    if (visited.has(z)) return;
    visited.add(z);
    updateTracker();
    Sfx.data();
    toast(`MISSION DATA: ${ZONE_LABEL[z]} (${visited.size}/6)`);
    if (visited.size === ZONE_ORDER.length && !unlocked) {
      unlocked = true;
      World.unlocked = true;
      unlockTimer = setTimeout(() => {
        Sfx.unlock();
        toast('MISSION DATA COMPLETE! HEAD TO THE MISSION ROOM.', 4.5);
      }, 1500);
    }
  }

  function talkTo(npc) {
    const d = DIALOGS[npc.zone];
    const finish = () => markVisited(npc.zone);
    if (!d.puzzle) { say(d.name, d.lines, finish); return; }
    say(d.name, d.lines, () => {
      ask(d.name, d.ask, ["YES, LET'S TRY!", 'NOT NOW'], i => {
        if (i === 0) {
          setMode('puzzle');
          Puzzle.open(d.puzzle, solved => say(d.name, [solved ? d.win : d.skip].concat(d.outro), finish));
        } else {
          say(d.name, d.outro, finish);
        }
      });
    });
  }

  function nearest() {
    let best = null, bd = 26;
    for (const n of World.npcs) {
      const d = Math.hypot(n.x - player.x, n.y - player.y);
      if (d < bd) { bd = d; best = n; }
    }
    const dd = Math.hypot(World.missionDoor.x - player.x, World.missionDoor.y - player.y);
    if (dd < bd) best = DOOR;
    return best;
  }

  function interact(it) {
    if (it === DOOR) {
      if (unlocked) enterMission();
      else say('MISSION ROOM', MISSION_LOCKED(visited.size));
      return;
    }
    const dx = player.x - it.x, dy = player.y - it.y;
    it.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    Sfx.select();
    talkTo(it);
  }

  // ---------- Play ----------
  function updatePlay(dt) {
    const vx = (Input.held.right ? 1 : 0) - (Input.held.left ? 1 : 0);
    const vy = (Input.held.down ? 1 : 0) - (Input.held.up ? 1 : 0);
    if (vx || vy) {
      if (vx && !vy) player.dir = vx > 0 ? 'right' : 'left';
      else if (vy && !vx) player.dir = vy > 0 ? 'down' : 'up';
      const len = Math.hypot(vx, vy), sp = 72 * dt;
      const nx = player.x + vx / len * sp, ny = player.y + vy / len * sp;
      if (!World.blocked(nx, player.y)) player.x = nx;
      if (!World.blocked(player.x, ny)) player.y = ny;
      player.anim += dt;
    } else {
      player.anim = 0;
    }
    if (unlocked && Math.abs(player.x - World.missionDoor.x) < 12 && player.y < 341) { enterMission(); return; }
    const near = nearest();
    if (Input.takeAction() && near) interact(near);
  }

  // ---------- Ending ----------
  const Ending = (() => {
    const L = ENDING_LINES;
    let i = 0, c = 0, acc = 0, cur = null, pause = 0, active = false, done = false;
    const line = cls => { const d = document.createElement('div'); d.className = 'tline ' + (cls || ''); return d; };
    function start() {
      $ending.classList.remove('hidden');
      $terminal.classList.remove('hidden');
      $terminal.innerHTML = '';
      $endcard.classList.add('hidden');
      i = 0; c = 0; acc = 0; cur = null; pause = 0.8; active = true; done = false;
    }
    function showAccept() {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn accept';
      b.textContent = '[ ACCEPT ]';
      b.addEventListener('click', accept);
      $terminal.appendChild(b);
      b.focus();
    }
    function accept() {
      Sfx.success();
      $terminal.classList.add('hidden');
      $endcard.classList.remove('hidden');
      $('againBtn').focus();
    }
    function tick(dt) {
      if (!active || done) return;
      if (pause > 0) { pause -= dt; return; }
      if (!cur) {
        if (i >= L.length) { done = true; showAccept(); return; }
        cur = line(L[i].cls);
        $terminal.appendChild(cur);
        c = 0;
      }
      const text = L[i].t;
      acc += dt * 40;
      let n = 0;
      while (acc >= 1 && c < text.length) { c++; acc--; n++; }
      if (n) { cur.textContent = text.slice(0, c); if (c % 2 === 0) Sfx.blip(); }
      if (c >= text.length) { cur.textContent = text; cur = null; i++; pause = text ? 0.35 : 0.15; }
    }
    function skip() {
      if (!active || done) return;
      if (cur) { cur.textContent = L[i].t; cur = null; i++; }
      while (i < L.length) { const d = line(L[i].cls); d.textContent = L[i].t; $terminal.appendChild(d); i++; }
      pause = 0;
    }
    return { start, tick, skip, typing: () => active && !done };
  })();

  $ending.addEventListener('pointerdown', e => { if (Ending.typing() && !e.target.closest('button,a')) Ending.skip(); });
  addEventListener('keydown', e => {
    if (mode === 'ending' && Ending.typing() && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); Ending.skip(); }
  });

  function enterMission() {
    setMode('ending');
    $hud.classList.add('hidden');
    $toast.classList.add('hidden');
    Sfx.unlock();
    Ending.start();
  }

  // ---------- Start / restart ----------
  const introLines = () => INTRO.lines.concat(isTouch ? INTRO.touch : INTRO.keys);
  function beginVisit() {
    player.x = 480;
    player.y = 622;
    player.dir = 'up';
    $hud.classList.remove('hidden');
    setMode('play');
    say(INTRO.name, introLines());
  }
  function startGame() {
    if (mode !== 'title') return;
    Sfx.init();
    Sfx.select();
    $title.classList.add('hidden');
    beginVisit();
  }
  $('startBtn').addEventListener('click', startGame);
  $('againBtn').addEventListener('click', () => {
    clearTimeout(unlockTimer);
    visited.clear();
    unlocked = false;
    World.unlocked = false;
    updateTracker();
    $ending.classList.add('hidden');
    Sfx.select();
    beginVisit();
  });

  // ---------- Path hint: faint dots to the nearest zone not visited yet (then to the Mission Room) ----------
  const GS = 8, GW = World.W / GS, GH = World.H / GS;
  // cost per cell: 0 = blocked, 1 = sand path, 4 = grass (so the hint follows the paths)
  const FREE = new Uint8Array(GW * GH);
  for (let cy = 0; cy < GH; cy++) {
    for (let cx = 0; cx < GW; cx++) {
      const x = cx * GS + 4, y = cy * GS + 4;
      FREE[cy * GW + cx] = World.blocked(x, y) ? 0 : World.onPath(x, y) ? 1 : 4;
    }
  }
  let hintPath = [], hintTimer = 0;
  const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function computeHint() {
    const targets = unlocked ? [World.missionDoor] : World.npcs.filter(n => !visited.has(n.zone));
    hintPath = [];
    if (!targets.length) return;
    const sx = clamp(Math.floor(player.x / GS), 0, GW - 1), sy = clamp(Math.floor(player.y / GS), 0, GH - 1);
    // Dijkstra with a bucket queue (small integer costs)
    const prev = new Int32Array(GW * GH).fill(-1);
    const dist = new Int32Array(GW * GH).fill(1e9);
    const start = sy * GW + sx;
    prev[start] = start;
    dist[start] = 0;
    const buckets = [[start]];
    let end = -1;
    for (let d = 0; d < buckets.length && end < 0; d++) {
      const bucket = buckets[d];
      if (!bucket) continue;
      for (const c of bucket) {
        if (dist[c] !== d) continue;
        const cx = c % GW, cy = (c / GW) | 0;
        const px = cx * GS + 4, py = cy * GS + 4;
        if (targets.some(t => Math.hypot(t.x - px, t.y - py) < 16)) { end = c; break; }
        for (const [dx, dy] of DIRS8) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
          const n = ny * GW + nx;
          if (!FREE[n]) continue;
          if (dx && dy && (!FREE[cy * GW + nx] || !FREE[ny * GW + cx])) continue;
          const nd = d + FREE[n] * (dx && dy ? 3 : 2);
          if (nd >= dist[n]) continue;
          dist[n] = nd;
          prev[n] = c;
          (buckets[nd] || (buckets[nd] = [])).push(n);
        }
      }
    }
    if (end < 0) return;
    const cells = [];
    for (let c = end; c !== start; c = prev[c]) cells.push(c);
    cells.reverse();
    hintPath = cells.map(c => ({ x: (c % GW) * GS + 4, y: ((c / GW) | 0) * GS + 4 }));
  }

  function drawHint() {
    if (mode !== 'play' || hintPath.length < 6) return;
    const dots = [];
    for (let i = 3; i < hintPath.length - 2; i += 2) dots.push(hintPath[i]);
    const glow = (time * 6) % (dots.length + 12);
    dots.forEach((p, i) => {
      const a = 0.55 + Math.max(0, 1 - Math.abs(glow - i) / 2) * 0.45;
      g.fillStyle = `rgba(13,11,30,${a * 0.6})`;
      g.fillRect(p.x - 1, p.y - 1, 3, 3);
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.fillRect(p.x - 1, p.y - 2, 2, 2);
    });
  }

  // ---------- Rendering ----------
  function txt(s, x, y, col) {
    g.fillStyle = PAL.ink;
    g.fillText(s, x + 1, y + 1);
    g.fillStyle = col;
    g.fillText(s, x, y);
  }
  function prompt(x, y) {
    const label = isTouch ? 'A' : 'SPACE';
    const w = label.length * 8 + 6;
    const bx = Math.round(x - w / 2), by = Math.round(y + Math.sin(time * 6) * 1.5);
    g.fillStyle = PAL.ink;
    g.fillRect(bx - 1, by - 1, w + 2, 14);
    g.fillStyle = PAL.cream;
    g.fillRect(bx, by, w, 12);
    g.fillStyle = PAL.ink;
    g.fillText(label, bx + 3, by + 2);
    g.fillRect(Math.round(x) - 1, by + 12, 3, 2);
  }

  function render() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    g.translate(-cx, -cy);
    World.drawGround(g, cx, cy, VW, VH, time);
    drawHint();

    const list = World.sortables.slice();
    for (const n of World.npcs) list.push({ y: n.y, draw: () => drawChar(g, n.sprites, n.x, n.y, n.dir, 0) });
    for (const w of World.walkers) list.push({ y: w.y, draw: () => drawChar(g, w.sprites, w.x, w.y, w.dir, legFrame(w.anim)) });
    if (mode !== 'title') list.push({ y: player.y, draw: () => drawChar(g, player.sprites, player.x, player.y, player.dir, legFrame(player.anim)) });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.draw(g, time);
    World.drawTop(g, time);

    g.font = FONT;
    g.textBaseline = 'top';
    if (mode !== 'title') {
      const near = mode === 'play' ? nearest() : null;
      for (const n of World.npcs) {
        if (n === near) prompt(n.x, n.y - 34);
        else if (!visited.has(n.zone)) txt('!', n.x - 3, Math.round(n.y - 30 + Math.sin(time * 5 + n.x) * 2), PAL.gold);
      }
      const d = World.missionDoor;
      if (near === DOOR) prompt(d.x, d.y - 50);
      else if (unlocked) {
        const by = Math.round(d.y - 44 + Math.sin(time * 6) * 3);
        g.fillStyle = PAL.ink;
        g.fillRect(d.x - 5, by - 1, 11, 4); g.fillRect(d.x - 3, by + 3, 7, 3); g.fillRect(d.x - 1, by + 6, 3, 2);
        g.fillStyle = PAL.gold;
        g.fillRect(d.x - 4, by, 9, 2); g.fillRect(d.x - 2, by + 2, 5, 3); g.fillRect(d.x, by + 5, 1, 2);
      }
    }
  }

  // ---------- Loop ----------
  function update(dt) {
    time += dt;
    World.update(dt);
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $toast.classList.add('hidden'); }
    switch (mode) {
      case 'title':
        cam.x = 320 + Math.sin(time * 0.15) * 300;
        cam.y = clamp(300 + Math.sin(time * 0.11) * 160, 0, World.H - VH);
        if (Input.takeAction()) startGame();
        return;
      case 'play':
        updatePlay(dt);
        hintTimer -= dt;
        if (hintTimer <= 0) { hintTimer = 0.4; computeHint(); }
        break;
      case 'dialog': updateDialog(dt); break;
      case 'puzzle': Puzzle.tick(dt); break;
      case 'ending': Ending.tick(dt); break;
    }
    if (mode !== 'title') {
      cam.x = clamp(player.x - VW / 2, 0, World.W - VW);
      cam.y = clamp(player.y - 8 - VH / 2, 0, World.H - VH);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  Input.init();
  setMode('title');
  const go = () => requestAnimationFrame(t => { last = t; frame(t); });
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load(FONT), new Promise(r => setTimeout(r, 1500))]).then(go, go);
  } else {
    go();
  }
})();
