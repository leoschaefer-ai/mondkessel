// Spielwelt: Raster, Zonen, Bodenkacheln, Kulisse, Platzieren/Abreißen
// Oben (y 2–25): Garten | Fabrik | Laden. Trennwald y 26–27. Unten (y 28–47): Biome. Waldrand y 48–49.
window.PF = window.PF || {};

PF.World = {
  W: 56, H: 50,
  TOP_Y1: 25,
  ZONES: [
    { id: 'garden',  name: 'Garten', x0: 0,  x1: 17, type: 'garden' },
    { id: 'factory', name: 'Fabrik', x0: 18, x1: 45, type: 'factory' },
    { id: 'shop',    name: 'Laden',  x0: 46, x1: 55, type: 'shop' },
  ],
  zoneAt(x, y) {
    if (y !== undefined && y > this.TOP_Y1) {
      const b = PF.BIOMES.find(b => x >= b.x0 && x <= b.x1) || PF.BIOMES[0];
      return { id: b.id, name: b.name, type: 'biome', biome: b, locked: !(PF.S && PF.S.biomes && PF.S.biomes[b.id]) };
    }
    return this.ZONES.find(z => x >= z.x0 && x <= z.x1) || this.ZONES[0];
  },
  zoneCenter(id) {
    const b = PF.BIOME[id];
    if (b) return { x: (b.x0 + b.x1 + 1) / 2 * PF.TILE, y: (PF.BIOME_Y0 + PF.BIOME_Y1 + 1) / 2 * PF.TILE };
    if (id === 'biomes') return { x: this.W / 2 * PF.TILE, y: (PF.BIOME_Y0 + PF.BIOME_Y1 + 1) / 2 * PF.TILE };
    const z = this.ZONES.find(z => z.id === id); return { x: (z.x0 + z.x1 + 1) / 2 * PF.TILE, y: 13 * PF.TILE };
  },
  biomeUnlocked(id) { return !!(PF.S.biomes && PF.S.biomes[id]); },

  ground(x, y) {
    const h = PF.U.hash(x, y);
    if (y >= PF.BIOME_Y0 && y <= PF.BIOME_Y1) {
      const b = this.zoneAt(x, y).biome;
      const c = h < 0.45 ? 0 : h < 0.8 ? 1 : h < 0.93 ? 3 : 2;
      return `biome_tiles/${b.row}_${c}`;
    }
    if (y < 2 || y > this.TOP_Y1) return h < 0.5 ? 'tiles/0_0' : h < 0.8 ? 'tiles/0_1' : 'tiles/3_3';
    const z = this.zoneAt(x).id;
    if (z === 'garden') {
      return h < 0.55 ? 'tiles/0_0' : h < 0.82 ? 'tiles/0_1' : h < 0.93 ? 'tiles/3_3' : 'tiles/0_2';
    }
    if (z === 'factory') return 'tiles/1_2';
    return 'tiles/2_1';
  },

  // Statische Kulisse: sprite, Anker (Fußpunkt, Kachelkoordinaten), Breite in Kacheln, blockierte Kacheln [x0,y0,x1,y1]
  SCENERY: [
    // Garten
    { s: 'buildings/0_0', x: 2.5, y: 4.2, w: 3.6, block: [1, 1, 4, 4] },
    { s: 'buildings/0_1', x: 16.4, y: 4.4, w: 2.2, block: [15, 1, 17, 4] },
    { s: 'buildings/1_0', x: 2.2, y: 25.6, w: 4.2, block: [0, 22, 4, 25] },
    { s: 'buildings/1_1', x: 14.5, y: 25.8, w: 3.2, block: [13, 23, 16, 25] },
    { s: 'props/1_0', x: 6.0, y: 5.4, w: 1.0, block: [] },
    { s: 'props/1_1', x: 4.6, y: 15.4, w: 0.7, block: [] },
    { s: 'props/0_4', x: 1.0, y: 13.4, w: 1.3, block: [0, 12, 1, 13] },
    { s: 'props/0_4', x: 17.0, y: 16.0, w: 1.2, block: [] },
    { s: 'props/4_2', x: 8.5, y: 22.4, w: 1.0, block: [] },
    { s: 'props/1_4', x: 11.0, y: 5.2, w: 1.1, block: [] },
    // Fabrik
    { s: 'buildings/2_0', x: 21.5, y: 4.2, w: 3.6, block: [20, 1, 23, 4] },
    { s: 'buildings/2_1', x: 37.5, y: 4.4, w: 3.2, block: [36, 1, 39, 4] },
    { s: 'props/2_3', x: 18.5, y: 9.4, w: 0.9, block: [18, 8, 18, 9] },
    { s: 'props/2_3', x: 18.5, y: 15.4, w: 0.9, block: [18, 15, 18, 15] },
    { s: 'props/2_4', x: 45.6, y: 9.3, w: 0.9, block: [45, 8, 45, 9] },
    { s: 'props/2_4', x: 45.6, y: 15.3, w: 0.9, block: [45, 15, 45, 15] },
    { s: 'props/3_2', x: 25.5, y: 25.5, w: 1.1, block: [] },
    { s: 'props/3_3', x: 27.0, y: 25.5, w: 1.2, block: [] },
    { s: 'props/3_4', x: 29.0, y: 25.5, w: 1.0, block: [] },
    { s: 'props/4_0', x: 40.0, y: 25.6, w: 1.0, block: [] },
    // Laden
    { s: 'buildings/0_2', x: 49.6, y: 4.6, w: 4.4, block: [47, 1, 52, 4] },
    { s: 'buildings/2_2', x: 52.6, y: 25.9, w: 3.6, block: [51, 23, 54, 25] },
    { s: 'shop/0_0', x: 47.0, y: 11.9, w: 2.0, block: [46, 10, 47, 13] },
    { s: 'shop/0_1', x: 47.0, y: 9.4, w: 1.4, block: [] },
    { s: 'shop/0_2', x: 47.0, y: 14.6, w: 1.2, block: [47, 14, 47, 14] },
    { s: 'shop/2_3', x: 51.6, y: 12.5, w: 2.4, block: [], under: true },
    { s: 'shop/3_3', x: 47.6, y: 16.2, w: 1.0, block: [47, 16, 48, 16] },
    { s: 'shop/2_0', x: 48.5, y: 2.2, w: 1.3, block: [] },
  ],

  init() {
    this.blocked = new Set();
    const block = (b) => { if (!b || b.length < 4) return; for (let x = b[0]; x <= b[2]; x++) for (let y = b[1]; y <= b[3]; y++) this.blocked.add(PF.U.key(x, y)); };
    this.scenery = this.SCENERY.slice();
    // Biom-Kulisse: Wahrzeichen + Props
    const Y0 = PF.BIOME_Y0, Y1 = PF.BIOME_Y1;
    for (const b of PF.BIOMES) {
      const cx = (b.x0 + b.x1 + 1) / 2;
      this.scenery.push({ s: b.landmark.s, x: cx, y: Y0 + 3.2, w: b.landmark.w, block: [Math.floor(cx) - 1, Y0 + 1, Math.floor(cx), Y0 + 2], biome: b.id, landmark: true });
      const spots = [[b.x0 + 1.5, Y0 + 2.4], [b.x0 + 12.5, Y0 + 5.4], [b.x0 + 1.5, Y1 - 0.6], [b.x0 + 12.5, Y1 - 1.6]];
      const cols = [0, 1, 2, 3, 4].filter(c => `biome_props/${b.row}_${c}` !== b.landmark.s);
      spots.forEach(([x, y], i) => this.scenery.push({ s: `biome_props/${b.row}_${cols[i % cols.length]}`, x, y, w: 1.4, block: [Math.floor(x), Math.floor(y) - 1, Math.floor(x), Math.floor(y) - 1], biome: b.id }));
    }
    this.scenery.forEach(sc => block(sc.block));
    // Waldränder (nicht bebaubar)
    this.border = [];
    for (let x = -1; x <= this.W; x += 1) {
      for (const y of [0.9, this.TOP_Y1 + 2.6, this.H - 0.3]) {
        const h = PF.U.hash(x * 3, Math.floor(y));
        this.border.push({ s: h < 0.45 ? 'props/0_1' : h < 0.7 ? 'props/0_0' : h < 0.85 ? 'props/0_2' : 'props/1_2', x: x + h * 0.6, y, w: 1.2 + h * 0.6 });
      }
    }
    for (let x = 0; x < this.W; x++) for (const y of [0, 1, this.TOP_Y1 + 1, this.TOP_Y1 + 2, this.H - 2, this.H - 1]) this.blocked.add(PF.U.key(x, y));
    // Kundenbereich im Laden frei halten
    for (let x = 48; x <= 55; x++) for (let y = 5; y <= 24; y++) this.blocked.add(PF.U.key(x, y));
  },

  ent(x, y) { const id = PF.S.grid[PF.U.key(x, y)]; return id ? PF.S.ents[id] : null; },
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; },

  canPlace(type, x, y) {
    if (!this.inBounds(x, y)) return { ok: false, why: 'Außerhalb' };
    if (this.blocked.has(PF.U.key(x, y))) return { ok: false, why: 'Hier ist kein Platz' };
    if (this.ent(x, y)) return { ok: false, why: 'Belegt' };
    const def = PF.BUILD[type] || { zone: 'garden' };
    const z = this.zoneAt(x, y);
    if (z.type === 'biome' && z.locked) return { ok: false, why: `${z.name} ist noch gesperrt` };
    if (def.zone === 'garden' && z.type !== 'garden' && z.type !== 'biome') return { ok: false, why: 'Nur im Garten oder in Biomen' };
    if (z.type === 'shop' && x > 47) return { ok: false, why: 'Kundenbereich' };
    return { ok: true };
  },

  place(type, x, y, opts = {}) {
    const s = PF.S;
    const id = s.nextId++;
    let e;
    if (type === 'plot') e = { type: 'plot', crop: null, growth: 0, water: 0, last: null };
    else if (type === 'belt') e = { type: 'belt', item: null, prog: 0, from: null };
    else if (type === 'decor') e = { type: 'decor', decor: opts.decor };
    else e = { type: 'machine', kind: type, inq: [], have: {}, out: [], timer: 0, busy: false, recipe: 'auto', cur: null, buf: [] };
    Object.assign(e, { id, x, y, dir: opts.dir || 0, tier: 0 }, opts);
    s.ents[id] = e;
    s.grid[PF.U.key(x, y)] = id;
    PF.Render && PF.Render.invalidate();
    return e;
  },

  remove(e) {
    delete PF.S.ents[e.id];
    delete PF.S.grid[PF.U.key(e.x, e.y)];
    PF.Render && PF.Render.invalidate();
  },

  defaultLayout() {
    // Start: nichts gebaut. Nur ein Brunnen, der Alchemietisch und ein paar wilde Mondblüten.
    // Alles andere muss freigeräumt, gekauft und gebaut werden.
    const P = (t, x, y, o) => this.place(t, x, y, o);
    P('well', 9, 7, {});
    P('workbench', 6, 7, {});
    [[5, 10], [7, 11], [8, 9]].forEach(([x, y], i) => {
      const p = P('plot', x, y); p.wild = true; p.crop = 'moonpetal'; p.last = 'moonpetal'; p.growth = i < 2 ? 1 : 0.5 + i * 0.1;
    });
    PF.Build.genObstacles(PF.S);
  },

  // Spielstand v1 (40 breit, Biome ab y 22, 10 breit) -> v2
  migrate(s) {
    if ((s.worldVersion || 1) >= 2) return;
    const ents = Object.values(s.ents);
    s.grid = {};
    for (const e of ents) {
      if (e.y >= 22) { const bi = Math.min(3, Math.floor(e.x / 10)); e.x = bi * 14 + (e.x - bi * 10) + 2; e.y = e.y + 6; }
      else if (e.x >= 32) e.x += 14;
      else if (e.x >= 13) e.x += 5;
      const k = PF.U.key(e.x, e.y);
      if (s.grid[k] || this.blocked.has(k)) { delete s.ents[e.id]; continue; }
      s.grid[k] = e.id;
    }
    s.helpers.forEach(h => { h.x = h.homeX = 3 + Math.random() * 12; h.y = h.homeY = 7 + Math.random() * 14; h.target = null; });
    s.wave.orders = []; s.wave.phase = 'pause'; s.wave.timer = 3;
    s.worldVersion = 2;
  },
  // Spielstände ohne Brunnen bekommen einen geschenkt
  ensureWell(s) {
    if (Object.values(s.ents).some(e => e.kind === 'well')) return;
    for (const [x, y] of [[9, 8], [10, 8], [9, 6], [11, 6], [12, 9], [13, 7]]) if (this.canPlace('well', x, y).ok) { this.place('well', x, y, {}); return; }
  },
};
