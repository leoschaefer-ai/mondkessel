// Zeichnet die Welt: Boden-Cache, Bänder, Y-sortierte Objekte, Licht & Nebel
window.PF = window.PF || {};

PF.Render = {
  t: 0,
  init(canvas) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.groundCanvas = document.createElement('canvas');
    this.groundDirty = true;
    window.addEventListener('resize', () => this.resize());
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
    PF.Assets.onLoad = (k) => { if (k.startsWith('tiles/') || k.startsWith('biome_tiles/')) this.groundDirty = true; };
  },
  resize() {
    // Handys: Auflösung begrenzen (iPhone hat Faktor 3 – das kostet ~4× Rechenzeit, sieht aber kaum besser aus)
    const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(touch ? 1.5 : 2, window.devicePixelRatio || 1);
    PF.Cam.dpr = dpr;
    // Canvas füllt nur den Kartenbereich (per CSS), Auflösung folgt seiner echten Größe
    const r = this.c.getBoundingClientRect();
    PF.Cam.w = Math.max(100, r.width); PF.Cam.h = Math.max(100, r.height);
    this.c.width = Math.round(PF.Cam.w * dpr); this.c.height = Math.round(PF.Cam.h * dpr);
  },
  invalidate() { this.entsDirty = true; },

  buildGround() {
    const T = PF.TILE, W = PF.World.W, H = PF.World.H;
    const gc = this.groundCanvas;
    gc.width = W * T; gc.height = H * T;
    const g = gc.getContext('2d');
    g.fillStyle = '#1b1426'; g.fillRect(0, 0, gc.width, gc.height);
    let missing = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const img = PF.Assets.img(PF.World.ground(x, y));
      if (!img) { missing++; continue; }
      g.drawImage(img, x * T - 1, y * T - 1, T + 2, T + 2);
    }
    // weiche Zonenübergänge
    for (const z of PF.World.ZONES.slice(1)) {
      const gr = g.createLinearGradient(z.x0 * T - 18, 0, z.x0 * T + 18, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(10,6,18,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(z.x0 * T - 18, 2 * T, 36, (H - 4) * T);
    }
    // Biom-Grenzen
    for (const b of PF.BIOMES.slice(1)) {
      const gr = g.createLinearGradient(b.x0 * T - 22, 0, b.x0 * T + 22, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(8,4,14,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(b.x0 * T - 22, PF.BIOME_Y0 * T, 44, (PF.BIOME_Y1 - PF.BIOME_Y0 + 1) * T);
    }
    this.groundDirty = missing > 0;
  },

  // ---------- Hilfen ----------
  sprite(g, key, cx, footY, width, opts = {}) {
    const img = PF.Assets.img(key);
    if (!img) return null;
    const w = width, h = width * img.height / img.width;
    g.save();
    g.translate(cx, footY);
    if (opts.scaleY) g.scale(1 + (1 - opts.scaleY) * 0.5, opts.scaleY);
    if (opts.flip) g.scale(-1, 1);
    if (opts.alpha !== undefined) g.globalAlpha = opts.alpha;
    g.drawImage(img, -w / 2, -h, w, h);
    g.restore();
    return { w, h };
  },
  shadow(g, cx, cy, rx, ry, a = 0.35) {
    g.fillStyle = `rgba(5,0,12,${a})`;
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 6.283); g.fill();
  },
  charFrame(sheet, row, face, moving, t) {
    const i = Math.floor(t * 7) % 4;
    const has = (n) => window.SPRITES[`${sheet}/${row}_${n}`];
    let name = `idle_${face}`, flip = false;
    if (moving) {
      if (face === 'f' && has(`walk_f${i}`)) name = `walk_f${i}`;
      else if (face === 'r' && has(`walk_r${i}`)) name = `walk_r${i}`;
      else if (face === 'l' && has(`walk_l${i}`)) name = `walk_l${i}`;
      else if (face === 'l' && has(`walk_r${i}`)) { name = `walk_r${i}`; flip = true; }
      else if (face === 'b' && has(`walk_b${i}`)) name = `walk_b${i}`;
    }
    if (!has(name)) name = 'idle_f';
    return { key: `${sheet}/${row}_${name}`, flip };
  },

  // Band-Form bestimmen: gerade oder Kurve (abhängig davon, wer hinein liefert)
  feeds(n, into) {
    if (!n) return false;
    if (n.type !== 'belt' && n.type !== 'machine') return false;
    const [dx, dy] = PF.U.DIRS[n.dir];
    return n.x + dx === into.x && n.y + dy === into.y;
  },
  beltShape(e) {
    const back = (e.dir + 2) % 4;
    const [bx, by] = PF.U.DIRS[back];
    if (this.feeds(PF.World.ent(e.x + bx, e.y + by), e)) return { corner: false };
    for (const side of [(e.dir + 1) % 4, (e.dir + 3) % 4]) {
      const [sx, sy] = PF.U.DIRS[side];
      if (this.feeds(PF.World.ent(e.x + sx, e.y + sy), e)) {
        const m = (side + 2) % 4; // Bewegungsrichtung des Zuflusses
        return { corner: true, m, cw: e.dir === (m + 1) % 4 };
      }
    }
    return { corner: false };
  },
  drawBelt(g, e) {
    const T = PF.TILE, cx = (e.x + 0.5) * T, cy = (e.y + 0.5) * T;
    const shape = this.beltShape(e);
    e._shape = shape;
    const key = `belt_tiers/${e.tier || 0}_${shape.corner ? 1 : 0}`;
    const img = PF.Assets.img(key);
    if (!img) return;
    g.save(); g.translate(cx, cy);
    if (shape.corner) {
      g.rotate(shape.m * Math.PI / 2);
      if (!shape.cw) g.scale(1, -1);
      g.drawImage(img, -T / 2 - 1, -T / 2 - 1, T + 2, T + 2);
    } else {
      g.rotate(e.dir * Math.PI / 2);
      const h = T * img.height / img.width;
      g.drawImage(img, -T / 2 - 1, -h / 2, T + 2, h);
    }
    g.restore();
  },
  beltItemPos(e) {
    const T = PF.TILE, cx = (e.x + 0.5) * T, cy = (e.y + 0.5) * T;
    const p = e.prog;
    const [dx, dy] = PF.U.DIRS[e.dir];
    const sh = e._shape;
    if (sh && sh.corner) {
      const [mx, my] = PF.U.DIRS[sh.m];
      if (p < 0.5) return { x: cx - mx * T * (0.5 - p), y: cy - my * T * (0.5 - p) };
      return { x: cx + dx * T * (p - 0.5), y: cy + dy * T * (p - 0.5) };
    }
    return { x: cx + dx * T * (p - 0.5), y: cy + dy * T * (p - 0.5) };
  },
  drawItem(g, it, x, y, size = 30) {
    if (it.t === 'brew') {
      const p = PF.POTION[it.id];
      const col = PF.RARITY[p.r].color;
      const gr = g.createRadialGradient(x, y, 2, x, y, size * 0.55);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, col); gr.addColorStop(1, 'rgba(120,60,200,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, size * 0.55, 0, 6.283); g.fill();
      if (it.q) { g.fillStyle = '#ffe27a'; g.font = 'bold 11px Georgia'; g.textAlign = 'center'; g.fillText('★'.repeat(it.q), x, y - size * 0.5); }
      return;
    }
    const img = PF.Factory.itemIcon(it);
    if (!img) return;
    this.shadow(g, x, y + size * 0.42, size * 0.35, size * 0.12, 0.4);
    const h = size * img.height / img.width;
    g.drawImage(img, x - size / 2, y - h / 2 - 4, size, h);
    if (it.l) { g.fillStyle = '#f2e3b3'; g.fillRect(x - 6, y + 2, 12, 5); }
    if (it.c) { g.fillStyle = '#e0b8ff'; g.font = 'bold 12px Georgia'; g.textAlign = 'center'; g.fillText('◆', x + size * 0.38, y - size * 0.3); }
  },

  // ---------- Hauptzeichnung ----------
  draw(dt) {
    this.t += dt;
    const g = this.g, cam = PF.Cam, T = PF.TILE, s = PF.S, t = this.t;
    // Boden höchstens alle 0,5 s neu aufbauen (beim Laden kamen sonst pro Bild 2.800 Kacheln dazu)
    if (this.groundDirty && (!this._gT || performance.now() - this._gT > 500)) { this._gT = performance.now(); this.buildGround(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#0d0815'; g.fillRect(0, 0, this.c.width, this.c.height);
    const sh = PF.FX.shakeOffset();
    const z = cam.zoom * cam.dpr;
    g.setTransform(z, 0, 0, z, (cam.w / 2 - cam.x * cam.zoom + sh.x) * cam.dpr, (cam.h / 2 - cam.y * cam.zoom + sh.y) * cam.dpr);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';

    g.drawImage(this.groundCanvas, 0, 0);

    // Sichtbereich
    const tl = cam.toWorld(0, 0), br = cam.toWorld(cam.w, cam.h);
    const vis = (x, y, m = 3) => x > tl.x / T - m && x < br.x / T + m && y > tl.y / T - m && y < br.y / T + m + 2;

    const ents = Object.values(s.ents);
    // Beete-Boden + Bänder (flach)
    for (const e of ents) {
      if (!vis(e.x, e.y)) continue;
      if (e.type === 'belt') this.drawBelt(g, e);
      else if (e.type === 'plot') this.drawPlotBase(g, e);
    }
    for (const sc of PF.World.scenery) if (sc.under) this.sprite(g, sc.s, sc.x * T, sc.y * T, sc.w * T);
    // Gegenstände auf Bändern
    for (const e of ents) {
      if (e.type !== 'belt' || !e.item || !vis(e.x, e.y)) continue;
      const p = this.beltItemPos(e);
      this.drawItem(g, e.item, p.x, p.y + Math.sin(t * 8 + e.x) * 1.2, 30);
    }

    this.drawSelGlow(g);

    // Y-sortierte Objekte
    const list = [];
    for (const sc of PF.World.scenery) if (!sc.under) list.push({ y: sc.y, f: () => this.sprite(g, sc.s, sc.x * T, sc.y * T, sc.w * T, { flip: sc.flip }) });
    for (const b of PF.World.border) if (vis(b.x, b.y, 4)) list.push({ y: b.y, f: () => this.sprite(g, b.s, b.x * T, b.y * T, b.w * T) });
    for (const e of ents) {
      if (!vis(e.x, e.y)) continue;
      if (e.type === 'plot' && e.crop) list.push({ e, y: e.y + 0.9, f: () => this.drawCrop(g, e) });
      else if (e.type === 'machine') list.push({ e, y: e.y + 0.95, f: () => { this.drawMachine(g, e); if (e.build) this.drawConstruction(g, e); } });
      else if (e.type === 'obstacle') list.push({ e, y: e.y + 0.97, f: () => this.drawObstacle(g, e) });
      else if (e.type === 'decor') { const d = PF.DECOR.find(q => q.id === e.decor); list.push({ y: e.y + 0.95, f: () => { this.shadow(g, (e.x + 0.5) * T, (e.y + 0.9) * T, T * 0.4, T * 0.14); this.sprite(g, d.sprite, (e.x + 0.5) * T, (e.y + 0.98) * T, T * 1.25); } }); }
    }
    for (const h of s.helpers) list.push({ y: h.y, f: () => this.drawHelper(g, h) });
    const pl = PF.Garden.player;
    list.push({ y: pl.y, f: () => this.drawPlayer(g, pl) });
    if (s.equip.pet !== null && s.inv.pets[s.equip.pet]) list.push({ y: pl.petY, f: () => this.drawPet(g, pl, s.inv.pets[s.equip.pet]) });
    for (const o of s.wave.orders) if (!(o.delay > 0)) list.push({ y: o.y, f: () => this.drawCustomer(g, o) });
    if (s.shopkeeper) list.push({ y: 10.95, f: () => { this.shadow(g, 46.6 * T, 10.9 * T, T * 0.3, T * 0.1); this.sprite(g, 'skins/1_idle_r', 46.6 * T, 10.95 * T + Math.sin(this.t * 2) * 1.2, T * 0.8); } });
    list.sort((a, b) => a.y - b.y);
    const selE = PF.UI.selected;
    const glowOn = selE && PF.S.ents[selE.id] && selE.type !== 'belt';
    for (const d of list) {
      if (glowOn && d.e === selE) {
        // weicher, unscharfer Lichtkranz direkt an der Silhouette (hinter dem Objekt)
        g.save();
        g.shadowColor = 'rgba(255,205,120,' + (0.85 + Math.sin(this.t * 3) * 0.15).toFixed(2) + ')';
        g.shadowBlur = 26; d.f(); g.shadowBlur = 14; d.f();
        g.restore();
      } else d.f();
    }
    // Ausgewähltes Objekt sanft aufleuchten lassen (additiv nochmal zeichnen)
    if (selE && PF.S.ents[selE.id] && selE.type !== 'belt') {
      const d = list.find(q => q.e === selE);
      if (d) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16 + Math.sin(this.t * 3) * 0.06; d.f(); g.restore(); }
    }

    this.drawBiomeLocks(g);
    this.drawEdgeFog(g);

    // Kunden-Sprechblasen über allem
    for (const o of s.wave.orders) if (o.state === 'wait') this.drawSign(g, o);

    this.drawSelection(g);
    this.drawJobs(g);
    this.drawGhost(g);
    this.drawLights(g);
    PF.FX.drawWorld(g);

    // Bildschirmraum: Nebel, Vignette, fliegende Icons
    g.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
    this.drawAtmosphere(g);
    PF.FX.drawScreen(g);
  },

  drawPlotBase(g, e) {
    const T = PF.TILE, x = e.x * T, y = e.y * T;
    if (e.wild) return;
    const img = PF.Assets.img(e.water > 0 ? 'tiles/1_0' : 'tiles/0_3');
    if (img) g.drawImage(img, x + 2, y + 2, T - 4, T - 4);
    if (e.tier) {
      g.strokeStyle = PF.RARITY[e.tier].color; g.globalAlpha = 0.7; g.lineWidth = 2;
      g.strokeRect(x + 3, y + 3, T - 6, T - 6); g.globalAlpha = 1;
    }
    if (!e.crop) {
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.font = '22px Georgia'; g.textAlign = 'center';
      g.fillText('+', x + T / 2, y + T / 2 + 8);
    }
  },
  OBS_W: { tree: [0, 1.0, 1.15, 1.45, 2.1, 2.9], rock: [0, 0.9, 1.05, 1.25, 1.55, 1.9] },
  drawObstacle(g, e) {
    const T = PF.TILE, h = PF.U.hash(e.x * 5 + 1, e.y * 9 + 2), h2 = PF.U.hash(e.y * 3 + 7, e.x * 11);
    // leichter Versatz + Größenvariation, damit es nicht wie ein Raster aussieht
    const cx = (e.x + 0.5 + (h - 0.5) * 0.6) * T, foot = (e.y + 1 + (h2 - 0.5) * 0.45) * T - 2;
    const w = this.OBS_W[e.kind][e.size] * T * (0.88 + h * 0.3);
    this.shadow(g, cx, foot - 6, w * 0.33, w * 0.11);
    const shake = e.build ? Math.sin(this.t * 30) * 1.5 : 0;
    this.sprite(g, `${e.kind === 'tree' ? 'trees' : 'rocks'}/0_${e.size - 1}`, cx + shake, foot, w, { flip: h2 > 0.5 });
    if (e.build) this.drawWorkers(g, e, foot);
  },
  // Baustelle: Gerüst + hämmernder Baumeister + Fortschritt
  drawConstruction(g, e) {
    const T = PF.TILE, cx = (e.x + 0.5) * T, foot = (e.y + 1) * T - 2;
    if (e.build.kind === 'new') this.sprite(g, 'construct/0_0', cx, foot, T * 1.05, { alpha: 0.9 });
    this.drawWorkers(g, e, foot);
  },
  drawWorkers(g, e, foot) {
    const T = PF.TILE, cx = (e.x + 0.5) * T;
    const f = Math.floor(this.t * 6) % 4;
    this.sprite(g, `construct/0_${3 + f}`, cx + T * 0.55, foot + 2, T * 0.62, { flip: true });
    const p = 1 - PF.Build.left(e) / e.build.secs;
    const bw = T * 0.9, by = foot - T * 1.5;
    g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(cx - bw / 2 - 1, by - 1, bw + 2, 8);
    g.fillStyle = '#e2bd6d'; g.fillRect(cx - bw / 2, by, bw * p, 6);
    g.font = 'bold 12px Georgia'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.85)';
    const txt = PF.U.fmtTime(PF.Build.left(e));
    g.strokeText(txt, cx, by - 4); g.fillStyle = '#f2e3c0'; g.fillText(txt, cx, by - 4);
  },
  drawCrop(g, e) {
    const T = PF.TILE, c = PF.CROP[e.crop], st = PF.Garden.stage(e);
    const cx = (e.x + 0.5) * T, foot = (e.y + 0.98) * T;
    let sy = 1;
    if (st === 3) {
      sy = 1 + Math.sin(this.t * 5 + e.x) * 0.04;
      const gr = g.createRadialGradient(cx, foot - T * 0.5, 4, cx, foot - T * 0.5, T * 0.8);
      gr.addColorStop(0, c.color + '88'); gr.addColorStop(1, c.color + '00');
      g.fillStyle = gr; g.fillRect(cx - T, foot - T * 1.4, T * 2, T * 1.6);
    }
    this.sprite(g, `${c.sheet}/${c.row}_${st}`, cx, foot, T * 1.12, { scaleY: sy });
    if (st === 3) {
      const b = Math.sin(this.t * 4 + e.y) * 3;
      g.fillStyle = '#fff6c2'; g.font = 'bold 14px Georgia'; g.textAlign = 'center';
      g.fillText('✦', cx + T * 0.32, foot - T * 0.95 + b);
    } else {
      // Fortschrittsbalken
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(cx - 20, foot - 6, 40, 5);
      g.fillStyle = e.water > 0 ? '#7fd4ff' : '#8bd46a'; g.fillRect(cx - 20, foot - 6, 40 * e.growth, 5);
    }
  },
  machineKey(e) {
    const def = PF.BUILD[e.kind];
    return def.tiers ? def.tiers[Math.min(e.tier || 0, def.tiers.length - 1)] : def.icon;
  },
  drawMachine(g, e) {
    const T = PF.TILE, def = PF.BUILD[e.kind];
    const cx = (e.x + 0.5) * T, foot = (e.y + 1) * T - 2;
    this.shadow(g, cx, foot - 8, T * 0.5, T * 0.17);
    const pulse = e.pulse > 0 ? 1 - Math.sin(e.pulse * 20) * 0.06 : 1;
    const busyWob = e.busy ? 1 + Math.sin(this.t * 14) * 0.012 : 1;
    if (PF.kindOf(e) === 'sprinkler' && e.spray > 0) {
      g.fillStyle = 'rgba(170,120,255,0.18)';
      const r = (1.5 + (e.tier || 0)) * T;
      g.beginPath(); g.arc(cx, (e.y + 0.5) * T, r * (1 - e.spray * 0.5), 0, 6.283); g.fill();
    }
    if ((e.tier || 0) > 0 && def.tiers && def.tiers.length === 1) {
      const col = PF.RARITY[e.tier].glow;
      const gr = g.createRadialGradient(cx, foot - 10, 4, cx, foot - 10, T * 0.75);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(cx, foot - 10, T * 0.75, T * 0.3, 0, 0, 6.283); g.fill();
    }
    if (def.aura) {
      const a = 0.12 + Math.sin(this.t * 2 + e.x) * 0.05;
      g.strokeStyle = def.aura === 'belt' ? `rgba(140,255,200,${a})` : `rgba(200,140,255,${a})`; g.lineWidth = 2;
      g.beginPath(); g.ellipse(cx, foot - 12, T * (0.7 + Math.sin(this.t * 3) * 0.08), T * 0.28, 0, 0, 6.283); g.stroke();
    }
    this.sprite(g, this.machineKey(e), cx, foot, T * (def.scale || 1.25), { scaleY: pulse * busyWob, alpha: e.build && e.build.kind === 'new' ? 0.45 : 1 });
    if (e.noWater && (PF.kindOf(e) === 'cauldron' || PF.kindOf(e) === 'mixer')) {
      const top = foot - T * (def.scale || 1.25) * 1.05, b = Math.sin(this.t * 5) * 2;
      g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.fillText('💧', cx, top + b);
      g.strokeStyle = '#ff5a4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 11, top - 16 + b); g.lineTo(cx + 11, top + 4 + b); g.stroke();
    }
    if (PF.kindOf(e) === 'well' && e.cd > 0) {
      const p = 1 - e.cd / PF.BUILD.well.pumpCd, top = foot - T * 1.5;
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 5; g.beginPath(); g.arc(cx + T * 0.5, top, 9, 0, 6.283); g.stroke();
      g.strokeStyle = '#7fd4ff'; g.lineWidth = 3; g.beginPath(); g.arc(cx + T * 0.5, top, 9, -Math.PI / 2, -Math.PI / 2 + p * 6.283); g.stroke();
    }
    if (PF.kindOf(e) === 'condenser') {
      const p = e.timer / def.time, top = foot - T * (def.scale || 1.25) * 0.95;
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 5; g.beginPath(); g.arc(cx + T * 0.42, top + 6, 9, 0, 6.283); g.stroke();
      g.strokeStyle = '#c47bff'; g.lineWidth = 3; g.beginPath(); g.arc(cx + T * 0.42, top + 6, 9, -Math.PI / 2, -Math.PI / 2 + p * 6.283); g.stroke();
    }
    // Ausgaberichtung
    const [dx, dy] = PF.U.DIRS[e.dir];
    if (PF.kindOf(e) === 'sorter') {
      const [rx, ry] = PF.U.DIRS[(e.dir + 1) % 4];
      g.fillStyle = 'rgba(255,170,90,0.9)';
      g.save(); g.translate(cx + rx * T * 0.46, (e.y + 0.5) * T + ry * T * 0.46); g.rotate(((e.dir + 1) % 4) * Math.PI / 2);
      g.beginPath(); g.moveTo(7, 0); g.lineTo(-4, -6); g.lineTo(-4, 6); g.fill(); g.restore();
    }
    if (!def.passive && !['sprinkler', 'seller', 'storage', 'teleporter', 'desk', 'soul'].includes(PF.kindOf(e)) || PF.kindOf(e) === 'teleporter') {
      g.fillStyle = 'rgba(200,170,255,0.85)';
      g.save(); g.translate(cx + dx * T * 0.46, (e.y + 0.5) * T + dy * T * 0.46); g.rotate(e.dir * Math.PI / 2);
      g.beginPath(); g.moveTo(7, 0); g.lineTo(-4, -6); g.lineTo(-4, 6); g.fill(); g.restore();
    }
    // Fortschritt / Rezept
    if (e.busy && e.cur) {
      const total = (PF.kindOf(e) === 'cauldron' || PF.kindOf(e) === 'mixer') ? PF.POTION[e.cur.id].time : def.time;
      const p = Math.min(1, e.timer / total);
      const top = foot - T * (def.scale || 1.25) * 0.95;
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 5;
      g.beginPath(); g.arc(cx + T * 0.42, top + 6, 9, 0, 6.283); g.stroke();
      g.strokeStyle = '#8dff9a'; g.lineWidth = 3;
      g.beginPath(); g.arc(cx + T * 0.42, top + 6, 9, -Math.PI / 2, -Math.PI / 2 + p * 6.283); g.stroke();
      if (PF.kindOf(e) === 'cauldron' || PF.kindOf(e) === 'mixer') { const ic = PF.Assets.img(PF.POTION[e.cur.id].icon); if (ic) g.drawImage(ic, cx - T * 0.5 - 4, top - 8, 24, 24); }
    }
    if ((PF.kindOf(e) === 'cauldron' || PF.kindOf(e) === 'mixer') && !e.busy && Object.keys(e.have).length) {
      let i = 0;
      for (const [c, n] of Object.entries(e.have)) {
        const img = PF.CROP[c].powder ? PF.Assets.img(PF.CROP[c].powder) : PF.Assets.tinted('ingredients/1_0', PF.CROP[c].color);
        if (img) g.drawImage(img, cx - 30 + i * 20, foot - T * 1.55, 18, 18);
        g.fillStyle = '#fff'; g.font = 'bold 10px Georgia'; g.fillText(n, cx - 21 + i * 20, foot - T * 1.55 + 26);
        i++;
      }
    }
  },
  drawPlayer(g, p) {
    const T = PF.TILE, sk = PF.S.equip.skin || 0;
    const f = this.charFrame('skins', sk, p.face, p.moving, this.t);
    this.shadow(g, p.x * T, p.y * T - 2, T * 0.3, T * 0.1);
    const bob = p.moving ? Math.abs(Math.sin(this.t * 10)) * 2 : 0;
    this.sprite(g, f.key, p.x * T, p.y * T - bob, T * 0.78, { flip: f.flip });
    // trägt Tränke zum Laden: Kiste mit Trank über dem Kopf
    if (p.job && p.job.carry) {
      const pot = Object.keys(PF.S.inv.potions)[0];
      const hy = p.y * T - T * 0.95 - bob;
      this.sprite(g, 'containers/0_1', p.x * T, hy + T * 0.14, T * 0.44);
      if (pot) this.sprite(g, PF.POTION[pot].icon, p.x * T, hy - T * 0.05, T * 0.34);
    }
  },
  drawPet(g, p, pet) {
    const T = PF.TILE;
    const key = `pets/${pet.r}_${PF.PET_SPECIES[pet.sp].col}`;
    const bob = Math.abs(Math.sin(this.t * 6)) * 3;
    this.shadow(g, p.petX * T, p.petY * T, T * 0.2, T * 0.07);
    this.sprite(g, key, p.petX * T, p.petY * T - bob, T * 0.62, { flip: p.x < p.petX });
  },
  drawHelper(g, h) {
    const T = PF.TILE, def = PF.HELPERS.find(d => d.id === h.id);
    const i = Math.floor(this.t * 8) % 4;
    const col = (h.face === 'f' || h.face === 'b') ? 4 + (h.moving ? i : 0) : (h.moving ? i : 0);
    this.shadow(g, h.x * T, h.y * T, T * 0.3, T * 0.1);
    this.sprite(g, `helpers/${def.row}_${col}`, h.x * T, h.y * T + 2, T * 0.9, { flip: h.face === 'l' });
  },
  drawCustomer(g, o) {
    const T = PF.TILE;
    const def = o.boss ? PF.BOSSES.find(b => b.id === o.cust) : PF.CUSTOMERS.find(c => c.id === o.cust);
    const f = this.charFrame(def.sheet, def.row, o.face, o.moving, this.t + o.x);
    const width = o.boss ? T * 1.9 : T * 1.0;
    this.shadow(g, o.x * T, o.y * T, width * 0.35, width * 0.12);
    const idleBob = !o.moving ? Math.sin(this.t * 2 + o.x * 3) * 1.2 : Math.abs(Math.sin(this.t * 9)) * 2;
    if (o.boss) {
      const gr = g.createRadialGradient(o.x * T, o.y * T - T, 10, o.x * T, o.y * T - T, T * 2.2);
      gr.addColorStop(0, 'rgba(255,40,60,0.28)'); gr.addColorStop(1, 'rgba(255,40,60,0)');
      g.fillStyle = gr; g.fillRect(o.x * T - T * 2.5, o.y * T - T * 3.4, T * 5, T * 4);
    }
    this.sprite(g, f.key, o.x * T, o.y * T + 2 - idleBob, width, { flip: f.flip });
  },
  uiImg(name) {
    this._ui = this._ui || {};
    if (!this._ui[name]) { const im = new Image(); im.src = `assets/ui/${name}.png`; this._ui[name] = im; }
    const im = this._ui[name];
    return im.complete && im.naturalWidth ? im : null;
  },
  // 9-Slice: gemalte Platte beliebig groß zeichnen
  panel9(g, img, x, y, w, h, sl, bw) {
    if (!img) { g.fillStyle = 'rgba(30,20,14,.92)'; g.fillRect(x, y, w, h); return; }
    const iw = img.width, ih = img.height;
    const sx = [0, sl[1], iw - sl[1], iw], sy = [0, sl[0], ih - sl[0], ih];
    const dx = [x, x + bw[1], x + w - bw[1], x + w], dy = [y, y + bw[0], y + h - bw[0], y + h];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const sw = sx[i + 1] - sx[i], sh = sy[j + 1] - sy[j], dw = dx[i + 1] - dx[i], dh = dy[j + 1] - dy[j];
      if (sw > 0 && sh > 0 && dw > 0 && dh > 0) g.drawImage(img, sx[i], sy[j], sw, sh, dx[i], dy[j], dw, dh);
    }
  },
  drawBubbleOld(g, o) {
    const T = PF.TILE;
    const lines = o.lines.filter(l => l.got < l.need);
    if (!lines.length) return;
    const top = o.y * T - (o.boss ? T * 3.2 : T * 1.85);
    const w = 22 + lines.length * 62, h = 40, x = o.x * T - w / 2;
    g.fillStyle = o.boss ? 'rgba(60,8,16,0.92)' : 'rgba(26,16,40,0.92)';
    g.strokeStyle = o.boss ? '#ff5a5a' : '#b49bff'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(x, top, w, h, 10); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(o.x * T - 6, top + h); g.lineTo(o.x * T + 6, top + h); g.lineTo(o.x * T, top + h + 8); g.fill();
    lines.forEach((l, i) => {
      const img = PF.Assets.img(PF.POTION[l.p].icon);
      const ix = x + 10 + i * 62;
      if (img) g.drawImage(img, ix, top + 5, 30, 30);
      g.fillStyle = '#fff'; g.font = 'bold 13px Georgia'; g.textAlign = 'left';
      g.fillText(`${l.got}/${l.need}`, ix + 31, top + 26);
    });
  },
  drawSign(g, o) {
    const T = PF.TILE;
    const lines = o.lines.filter(l => l.got < l.need);
    if (!lines.length) return;
    const ready = !PF.S.shopkeeper && PF.Shop.readiness(o) === 'all';
    const bob = Math.sin(this.t * 2.2 + o.x) * 2;
    const w = 14 + lines.length * 74, h = 44;
    const cx = o.x * T, x = cx - w / 2, y = o.y * T - (o.boss ? T * 3.3 : T * 2.0) + bob;
    g.fillStyle = '#3a2716'; g.fillRect(cx - 2, y + h - 2, 4, 10);
    if (ready) {
      const gr = g.createRadialGradient(cx, y + h / 2, 4, cx, y + h / 2, w * 0.7);
      gr.addColorStop(0, 'rgba(150,230,140,0.35)'); gr.addColorStop(1, 'rgba(150,230,140,0)');
      g.fillStyle = gr; g.fillRect(cx - w, y - h, w * 2, h * 3);
    }
    this.panel9(g, this.uiImg(ready ? 'btn_green' : o.boss ? 'btn_red' : 'btn'), x, y, w, h, [34, 46], [9, 12]);
    lines.forEach((l, i) => {
      const img = PF.Assets.img(PF.POTION[l.p].icon);
      const ix = x + 10 + i * 74;
      if (img) g.drawImage(img, ix, y + 7, 30, 30);
      g.font = 'bold 13px Georgia'; g.textAlign = 'left';
      g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.8)';
      const txt = `${l.got}/${l.need}`;
      g.strokeText(txt, ix + 32, y + 27); g.fillStyle = '#f2e3c0'; g.fillText(txt, ix + 32, y + 27);
    });
    if (ready) { g.font = 'bold 15px Georgia'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.fillStyle = '#d8ffcc'; g.strokeText('✓ klicken', cx, y - 6); g.fillText('✓ klicken', cx, y - 6); }
  },
  // Weiches, pulsierendes Leuchten unter dem ausgewählten Objekt (statt Rahmen)
  drawSelGlow(g) {
    const sel = PF.UI.selected;
    if (!sel || !PF.S.ents[sel.id]) return;
    const T = PF.TILE;
    let w = 1.1;
    if (sel.type === 'obstacle') w = this.OBS_W[sel.kind][sel.size];
    else if (sel.type === 'machine') w = (PF.BUILD[sel.kind] && PF.BUILD[sel.kind].scale) || 1.25;
    else if (sel.type === 'decor') w = 1.25;
    const cx = (sel.x + 0.5) * T, cy = (sel.y + (sel.type === 'belt' ? 0.5 : 0.85)) * T;
    const pulse = 1 + Math.sin(this.t * 3) * 0.06;
    const rx = w * T * 0.62 * pulse, ry = rx * 0.42;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.translate(cx, cy); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, 'rgba(255,214,130,0.75)'); gr.addColorStop(0.45, 'rgba(240,170,80,0.4)'); gr.addColorStop(1, 'rgba(200,120,60,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 6.283); g.fill();
    g.restore();
  },
  // Ziele der Laufaufträge: sanft pulsierende Ringe, nummeriert
  drawJobs(g) {
    const p = PF.Garden.player, T = PF.TILE, jobs = [p.job, ...(p.queue || [])].filter(Boolean);
    jobs.forEach((j, i) => {
      const cx = (j.x + 0.5) * T, cy = (j.y + 0.55) * T, r = T * (0.42 + Math.sin(this.t * 4 + i) * 0.04);
      g.save(); g.translate(cx, cy); g.scale(1, 0.5);
      g.strokeStyle = i === 0 ? 'rgba(255,214,130,0.85)' : 'rgba(255,214,130,0.45)'; g.lineWidth = 3; g.setLineDash([7, 6]);
      g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke(); g.restore();
      if (jobs.length > 1) {
        g.fillStyle = 'rgba(20,12,8,0.85)'; g.beginPath(); g.arc(cx + T * 0.34, cy - T * 0.3, 9, 0, 6.283); g.fill();
        g.fillStyle = '#ffd98a'; g.font = 'bold 11px Georgia'; g.textAlign = 'center'; g.fillText(i + 1, cx + T * 0.34, cy - T * 0.3 + 4);
      }
    });
  },
  drawSelection(g) {
    const sel = PF.UI.selected;
    if (!sel || !PF.S.ents[sel.id]) return;
    const T = PF.TILE;
    const sdef = sel.type === 'machine' && PF.BUILD[sel.kind];
    if (sdef && sdef.aura) {
      const r = (sdef.auraR || (sdef.aura === 'belt' ? 3 : 2)) + (sel.tier || 0);
      g.strokeStyle = 'rgba(160,255,200,0.6)'; g.setLineDash([6, 6]);
      g.strokeRect((sel.x - r) * T, (sel.y - r) * T, (2 * r + 1) * T, (2 * r + 1) * T); g.setLineDash([]);
    }
    if (sel.type === 'machine' && PF.kindOf(sel) === 'sprinkler') {
      const r = (PF.BUILD[sel.kind].range || 1) + (sel.tier || 0);
      g.strokeStyle = 'rgba(160,120,255,0.6)'; g.setLineDash([6, 6]);
      g.strokeRect((sel.x - r) * T, (sel.y - r) * T, (2 * r + 1) * T, (2 * r + 1) * T); g.setLineDash([]);
    }
  },
  drawGhost(g) {
    const tool = PF.UI.tool, m = PF.Input.mouse;
    if (!m.inside || tool.mode === 'select') return;
    const T = PF.TILE, x = Math.floor(m.wx / T), y = Math.floor(m.wy / T);
    if (!PF.World.inBounds(x, y)) return;
    if (tool.mode === 'demolish') {
      const e = PF.World.ent(x, y);
      g.fillStyle = e ? 'rgba(255,60,60,0.35)' : 'rgba(255,255,255,0.08)';
      g.fillRect(x * T, y * T, T, T);
      return;
    }
    const type = tool.type;
    const ok = PF.World.canPlace(type === 'decor' ? 'plot' : type, x, y).ok && (type !== 'decor' || ['garden', 'biome'].includes(PF.World.zoneAt(x, y).type));
    g.fillStyle = ok ? 'rgba(120,255,140,0.22)' : 'rgba(255,60,60,0.3)';
    g.fillRect(x * T, y * T, T, T);
    g.globalAlpha = 0.7;
    if (type === 'belt') {
      this.drawBelt(g, { x, y, dir: tool.dir, tier: 0, type: 'belt' });
    } else if (type === 'decor') {
      const d = PF.DECOR.find(q => q.id === tool.decor);
      this.sprite(g, d.sprite, (x + 0.5) * T, (y + 0.98) * T, T * 1.25);
    } else if (type === 'plot') {
      const img = PF.Assets.img('tiles/0_3'); if (img) g.drawImage(img, x * T + 2, y * T + 2, T - 4, T - 4);
    } else {
      const def = PF.BUILD[type];
      this.sprite(g, def.tiers ? def.tiers[0] : def.icon, (x + 0.5) * T, (y + 1) * T - 2, T * (def.scale || 1.25));
    }
    g.globalAlpha = 1;
    if (type !== 'plot' && type !== 'decor' && type !== 'sprinkler') {
      const [dx, dy] = PF.U.DIRS[tool.dir];
      g.fillStyle = '#fff'; g.save(); g.translate((x + 0.5 + dx * 0.55) * T, (y + 0.5 + dy * 0.55) * T); g.rotate(tool.dir * Math.PI / 2);
      g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -9); g.lineTo(-6, 9); g.fill(); g.restore();
    }
  },
  LIGHTS: [[3.4, 2.8, '#7dff8a', 110], [2.0, 2.4, '#ffb347', 70], [16.4, 2.4, '#7dff8a', 70], [18.5, 8.2, '#ffb347', 90], [18.5, 14.2, '#ffb347', 90],
    [45.6, 8.0, '#7dff8a', 90], [45.6, 14.0, '#7dff8a', 90], [49.0, 2.6, '#ff8a3d', 130], [51.0, 3.0, '#ff8a3d', 90], [52.6, 24.4, '#ff3040', 150], [7.5, 2.9, '#56ff7a', 70], [2.0, 23.5, '#56ff7a', 120], [47.6, 15.6, '#7dff8a', 50]],
  drawLights(g) {
    const T = PF.TILE;
    g.globalCompositeOperation = 'lighter';
    for (const b of PF.BIOMES) {
      if (!PF.World.biomeUnlocked(b.id)) continue;
      const x = (b.x0 + b.x1 + 1) / 2 * T, y = (PF.BIOME_Y0 + 2.2) * T, r = 170 * (1 + Math.sin(this.t * 2 + b.row) * 0.05);
      const gr = g.createRadialGradient(x, y, 4, x, y, r);
      gr.addColorStop(0, b.light + '55'); gr.addColorStop(1, b.light + '00');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (const [x, y, c, r] of this.LIGHTS) {
      const fl = 1 + Math.sin(this.t * 3 + x * 7) * 0.06;
      const gr = g.createRadialGradient(x * T, y * T, 2, x * T, y * T, r * fl);
      gr.addColorStop(0, c + '55'); gr.addColorStop(1, c + '00');
      g.fillStyle = gr; g.fillRect(x * T - r, y * T - r, r * 2, r * 2);
    }
    // Maschinen glühen beim Arbeiten
    for (const e of Object.values(PF.S.ents)) {
      if (e.type !== 'machine' || !e.busy) continue;
      const x = (e.x + 0.5) * T, y = (e.y + 0.3) * T;
      const gr = g.createRadialGradient(x, y, 2, x, y, 60);
      gr.addColorStop(0, 'rgba(170,100,255,0.25)'); gr.addColorStop(1, 'rgba(170,100,255,0)');
      g.fillStyle = gr; g.fillRect(x - 60, y - 60, 120, 120);
    }
    g.globalCompositeOperation = 'source-over';
  },
  // Weicher Nebel-Fleck (einmal vorberechnet, dann nur noch gezeichnet – billig)
  fogBlob(tint) {
    this._fog = this._fog || {};
    if (this._fog[tint]) return this._fog[tint];
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, tint + '1)'); gr.addColorStop(0.45, tint + '0.55)'); gr.addColorStop(1, tint + '0)');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    return (this._fog[tint] = c);
  },
  // Gesperrte Biome: dichter, wabernder Nebel – man erahnt nur Umrisse, kein Name, kein Schloss
  drawBiomeLocks(g) {
    const T = PF.TILE, t = this.t;
    const locked = PF.BIOMES.filter(b => !PF.World.biomeUnlocked(b.id));
    if (!locked.length) return;
    const y = PF.BIOME_Y0 * T, h = (PF.BIOME_Y1 - PF.BIOME_Y0 + 1) * T;
    const x0 = Math.min(...locked.map(b => b.x0)) * T, x1 = (Math.max(...locked.map(b => b.x1)) + 1) * T;
    // eine zusammenhängende Nebelfläche über alle gesperrten Biome (keine Nähte)
    g.save(); g.beginPath();
    for (const b of locked) g.rect(b.x0 * T, y - T * 0.6, (b.x1 - b.x0 + 1) * T, h + T * 0.6);
    g.clip();
    g.fillStyle = 'rgba(16,12,24,0.93)'; g.fillRect(x0, y - T * 0.6, x1 - x0, h + T * 0.6);
    const blob = this.fogBlob('rgba(112,104,138,'), blob2 = this.fogBlob('rgba(150,142,175,');
    for (let gx = x0 - T * 2; gx < x1 + T * 2; gx += T * 2.4) for (let gy = y - T; gy < y + h + T; gy += T * 2.4) {
      const k = PF.U.hash((gx / T) | 0, (gy / T) | 0);
      const ox = Math.sin(t * 0.13 + k * 6.3) * T * 1.3, oy = Math.cos(t * 0.11 + k * 4.1) * T * 0.9;
      const r = T * (2.8 + k * 1.6) * (1 + Math.sin(t * 0.2 + k * 9) * 0.12);
      g.globalAlpha = 0.32 + k * 0.25;
      g.drawImage(k > 0.7 ? blob2 : blob, gx + ox - r, gy + oy - r, r * 2, r * 2);
    }
    g.restore(); g.globalAlpha = 1;
  },
  // Rand der Welt: dunkler Nebel nach außen, sanft wabernde Schwaden am Rand
  drawEdgeFog(g) {
    const T = PF.TILE, W = PF.World.W * T, H = PF.World.H * T, t = this.t, D = T * 3;
    g.fillStyle = '#0c0812';
    g.fillRect(-4000, -4000, W + 8000, 4000); g.fillRect(-4000, H, W + 8000, 4000);
    g.fillRect(-4000, 0, 4000, H); g.fillRect(W, 0, 4000, H);
    const band = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(12,8,18,0.95)'); gr.addColorStop(1, 'rgba(12,8,18,0)'); return gr; };
    g.fillStyle = band(0, 0, 0, D); g.fillRect(0, 0, W, D);
    g.fillStyle = band(0, H, 0, H - D); g.fillRect(0, H - D, W, D);
    g.fillStyle = band(0, 0, D, 0); g.fillRect(0, 0, D, H);
    g.fillStyle = band(W, 0, W - D, 0); g.fillRect(W - D, 0, D, H);
    const blob = this.fogBlob('rgba(110,98,140,');
    const puff = (px, py, k) => {
      const r = T * (2.2 + k * 1.4) * (1 + Math.sin(t * 0.25 + k * 7) * 0.15);
      g.globalAlpha = 0.22 + k * 0.2;
      g.drawImage(blob, px - r, py - r, r * 2, r * 2);
    };
    const step = T * 2.2;
    for (let a = 0; a < W; a += step) {
      const k = PF.U.hash(a | 0, 11), k2 = PF.U.hash(a | 0, 23), s = Math.sin(t * 0.18 + k * 6.3) * T * 0.9;
      puff(a + s, T * (0.4 + Math.sin(t * 0.15 + k * 5) * 0.4), k);
      puff(a - s, H - T * (0.4 + Math.sin(t * 0.17 + k2 * 5) * 0.4), k2);
    }
    for (let b = 0; b < H; b += step) {
      const k = PF.U.hash(31, b | 0), k2 = PF.U.hash(47, b | 0), s = Math.sin(t * 0.16 + k * 6.3) * T * 0.9;
      puff(T * (0.4 + Math.sin(t * 0.14 + k * 5) * 0.4), b + s, k);
      puff(W - T * (0.4 + Math.sin(t * 0.19 + k2 * 5) * 0.4), b - s, k2);
    }
    g.globalAlpha = 1;
  },
  drawAtmosphere(g) {
    const w = PF.Cam.w, h = PF.Cam.h;
    // Nebelschwaden
    for (let i = 0; i < 5; i++) {
      const x = ((this.t * (8 + i * 3) + i * 400) % (w + 600)) - 300;
      const y = h * (0.2 + i * 0.16);
      const gr = g.createRadialGradient(x, y, 10, x, y, 260);
      gr.addColorStop(0, 'rgba(150,120,210,0.07)'); gr.addColorStop(1, 'rgba(150,120,210,0)');
      g.fillStyle = gr; g.fillRect(x - 260, y - 260, 520, 520);
    }
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(10,4,24,0)'); v.addColorStop(1, 'rgba(10,4,24,0.6)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    if (PF.Shop.bossActive()) {
      g.fillStyle = `rgba(120,0,20,${0.08 + Math.sin(this.t * 2) * 0.04})`; g.fillRect(0, 0, w, h);
    }
  },
};
