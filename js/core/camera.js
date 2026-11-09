// Kamera (Pan/Zoom) + Maus/Touch-Eingabe
window.PF = window.PF || {};

PF.Cam = {
  x: 0, y: 0, zoom: 0.9, tx: null, ty: null, tz: null, minZoom: 0.2, maxZoom: 1.8,
  // kleinster Zoom = ganze Welt passt in den Kartenrahmen
  fitZoom() { return Math.min(this.w / (PF.World.W * PF.TILE), this.h / (PF.World.H * PF.TILE)); },
  zoomBy(f, sx, sy) {
    if (sx === undefined) { sx = this.w / 2; sy = this.h / 2; }
    const before = this.toWorld(sx, sy);
    this.zoom = PF.U.clamp(this.zoom * f, this.minZoom, this.maxZoom);
    const after = this.toWorld(sx, sy);
    this.x += before.x - after.x; this.y += before.y - after.y; this.tx = null; this.tz = null;
  },
  overview() { this.tz = this.fitZoom(); this.focus(PF.World.W * PF.TILE / 2, PF.World.H * PF.TILE / 2); },
  zoomTo(z) { this.tz = PF.U.clamp(z, this.minZoom, this.maxZoom); },
  w: 0, h: 0, dpr: 1,
  toWorld(sx, sy) { return { x: (sx - this.w / 2) / this.zoom + this.x, y: (sy - this.h / 2) / this.zoom + this.y }; },
  toScreen(wx, wy) { return { x: (wx - this.x) * this.zoom + this.w / 2, y: (wy - this.y) * this.zoom + this.h / 2 }; },
  focus(wx, wy) { this.tx = wx; this.ty = wy; },
  update(dt) {
    this.minZoom = Math.min(0.45, this.fitZoom());
    if (this.tz !== null) {
      const k = 1 - Math.pow(0.0005, dt);
      this.zoom += (this.tz - this.zoom) * k;
      if (Math.abs(this.tz - this.zoom) < 0.002) { this.zoom = this.tz; this.tz = null; }
    }
    if (this.tx !== null) {
      const k = 1 - Math.pow(0.002, dt);
      this.x += (this.tx - this.x) * k; this.y += (this.ty - this.y) * k;
      if (Math.hypot(this.tx - this.x, this.ty - this.y) < 2) this.tx = this.ty = null;
    }
    const W = PF.World.W * PF.TILE, H = PF.World.H * PF.TILE;
    const hw = this.w / 2 / this.zoom, hh = this.h / 2 / this.zoom;
    this.x = hw * 2 >= W ? W / 2 : PF.U.clamp(this.x, hw, W - hw);
    this.y = hh * 2 >= H ? H / 2 : PF.U.clamp(this.y, hh, H - hh);
  },
};

PF.Input = {
  mouse: { x: 0, y: 0, wx: 0, wy: 0, down: false, inside: false },
  keys: {},
  onTap: null, onRightTap: null, onKey: null,

  init(canvas) {
    const m = this.mouse;
    let dragStart = null, dragged = false, camStart = null;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const updWorld = () => { const w = PF.Cam.toWorld(m.x, m.y); m.wx = w.x; m.wy = w.y; };

    canvas.addEventListener('pointerdown', (e) => {
      PF.Audio.unlock();
      const p = pos(e); m.x = p.x; m.y = p.y; updWorld();
      dragStart = p; dragged = false; camStart = { x: PF.Cam.x, y: PF.Cam.y };
      if (e.button === 0 && PF.UI && PF.UI.canPaint()) PF.UI.paint(m.wx, m.wy, true);
      m.down = true; m.button = e.button;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = pos(e); m.x = p.x; m.y = p.y; m.inside = true; updWorld();
      if (m.down && dragStart && pinch === null) {
        const dx = p.x - dragStart.x, dy = p.y - dragStart.y;
        if (!dragged && Math.hypot(dx, dy) > 7) dragged = true;
        const paint = m.button === 0 && PF.UI && PF.UI.canPaint();
        if (dragged && paint) PF.UI.paint(m.wx, m.wy);
        else if (dragged) {
          PF.Cam.tx = null;
          PF.Cam.x = camStart.x - dx / PF.Cam.zoom; PF.Cam.y = camStart.y - dy / PF.Cam.zoom;
        }
      }
    });
    canvas.addEventListener('pointerup', (e) => {
      const p = pos(e); m.x = p.x; m.y = p.y; updWorld();
      if (m.down && !dragged) {
        if (e.button === 2) this.onRightTap && this.onRightTap(m.wx, m.wy);
        else this.onTap && this.onTap(m.wx, m.wy);
      }
      m.down = false; dragStart = null;
      PF.UI && PF.UI.endPaint();
    });
    canvas.addEventListener('pointerleave', () => { m.inside = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      // deutlich empfindlicher: ein Mausrad-Klick ≈ 25 %, Trackpad-Pinch (ctrlKey) noch direkter
      const d = PF.U.clamp(e.deltaY, -250, 250);
      PF.Cam.zoomBy(Math.pow(e.ctrlKey ? 0.985 : 0.9972, d), m.x, m.y);
    }, { passive: false });

    // Pinch-Zoom
    const touches = new Map(); let pinch = null;
    canvas.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) touches.set(t.identifier, t);
      if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: PF.Cam.zoom }; dragged = true; }
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) touches.set(t.identifier, t);
      if (pinch && touches.size === 2) { const [a, b] = [...touches.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); PF.Cam.zoom = PF.U.clamp(pinch.z * d / pinch.d, PF.Cam.minZoom, PF.Cam.maxZoom); }
    }, { passive: true });
    canvas.addEventListener('touchend', (e) => { for (const t of e.changedTouches) touches.delete(t.identifier); if (touches.size < 2) pinch = null; }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      this.keys[e.key.toLowerCase()] = true;
      PF.Audio.unlock();
      this.onKey && this.onKey(e.key.toLowerCase(), e);
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
  },

  update(dt) {
    const k = this.keys, sp = 700 * dt / PF.Cam.zoom;
    if (k.w || k.arrowup) { PF.Cam.y -= sp; PF.Cam.tx = null; }
    if (k.s || k.arrowdown) { PF.Cam.y += sp; PF.Cam.tx = null; }
    if (k.a || k.arrowleft) { PF.Cam.x -= sp; PF.Cam.tx = null; }
    if (k.d || k.arrowright) { PF.Cam.x += sp; PF.Cam.tx = null; }
  },
};
