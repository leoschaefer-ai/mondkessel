// Bauen mit Zeit (Baumeister), Hindernisse freiräumen, Handwerk am Alchemietisch
window.PF = window.PF || {};
PF.now = PF.now || (() => Date.now());

PF.Build = {
  // ---------- Zeiten ----------
  count(type) { return Object.values(PF.S.ents).filter(e => (e.type === 'machine' ? e.kind : e.type) === type).length; },
  newSecs(type) {
    const base = PF.BUILD_TIME[type] || (PF.BUILD[type] && PF.BUILD[type].buildTime) || 0;
    if (!base) return 0;
    return Math.round(base * Math.min(3, Math.pow(PF.BUILD_TIME_GROW, this.count(type))));
  },
  tierSecs(e) {
    const kind = e.type === 'machine' ? e.kind : e.type;
    return Math.round(PF.TIER_TIME[(e.tier || 0) + 1] * (PF.TIER_TIME_MUL[kind] || 1));
  },
  busy() { return Object.values(PF.S.ents).filter(e => e.build).length; },
  free() { return (PF.S.builders || 1) - this.busy(); },
  left(e) { return e.build ? Math.max(0, (e.build.end - PF.now()) / 1000) : 0; },

  // Baustelle starten (secs = 0 -> sofort fertig)
  start(e, kind, secs, to) {
    if (secs <= 0) { if (kind === 'tier') e.tier = to; return; }
    const t = PF.now();
    e.build = { kind, start: t, end: t + secs * 1000, secs, to };
    PF.UI && PF.UI.dirty();
  },
  needBuilder() {
    if (this.free() > 0) return true;
    PF.UI.toast('Alle Baumeister sind beschäftigt – warte oder beschleunige.', '#e0b080', 'ui/3_4');
    PF.Audio.sfx('error');
    return false;
  },

  update() {
    const t = PF.now();
    for (const e of Object.values(PF.S.ents)) if (e.build && t >= e.build.end) this.finish(e);
  },
  finish(e) {
    const b = e.build; delete e.build;
    const wx = (e.x + 0.5) * PF.TILE, wy = (e.y + 0.4) * PF.TILE;
    const xp = Math.floor(Math.sqrt(b.secs)) + 1; // wie CoC: Erfahrung ~ Wurzel der Bauzeit
    if (b.kind === 'clear') { this.clearDone(e, b); return; }
    if (b.kind === 'tier') {
      e.tier = b.to; PF.S.stats.upgrades++;
      PF.FX.popup(wx, wy - 30, PF.RARITY[e.tier].name + '!', PF.RARITY[e.tier].color, 1.3);
    } else PF.FX.popup(wx, wy - 30, 'Fertig gebaut!', '#e2bd6d');
    PF.FX.burst(wx, wy, '#e2bd6d', 18, 120);
    PF.Game.addXP(xp, { x: wx, y: wy });
    if (b.secs >= 60) { PF.Audio.sfx('upgrade'); PF.UI.toast(`${this.name(e)} ist fertig!`, '#e2bd6d', 'ui/3_4'); }
    PF.Render && PF.Render.invalidate();
    PF.UI && PF.UI.dirty();
    if (PF.UI && PF.UI.selected === e) PF.UI.showInspector();
  },
  name(e) {
    if (e.type === 'obstacle') return PF.OBSTACLES[e.kind].names[e.size - 1];
    const k = e.type === 'machine' ? e.kind : e.type;
    return PF.BUILD[k] ? PF.BUILD[k].name : 'Bau';
  },
  // Beschleunigen mit Mondsteinen
  skipCost(e) { const l = this.left(e); return l <= PF.SKIP.free ? 0 : Math.ceil(l / PF.SKIP.secPerStone); },
  skip(e) {
    const c = this.skipCost(e);
    if (c && !PF.Game.pay({ moonstone: c })) { PF.UI.toast('Nicht genug Mondsteine', '#ff8080'); return; }
    e.build.end = PF.now();
    this.finish(e);
  },
  buyBuilder() {
    const s = PF.S, n = (s.builders || 1) + 1;
    if (n > PF.BUILDERS.max) return;
    const cost = { moonstone: PF.BUILDERS.cost[n] };
    if (!PF.Game.pay(cost)) { PF.UI.toast('Nicht genug Mondsteine', '#ff8080'); return; }
    s.builders = n;
    PF.Audio.sfx('levelup');
    PF.UI.toast(`Baumeister Nr. ${n} ist eingezogen!`, '#e2bd6d', 'ui/3_4');
  },

  // ---------- Hindernisse ----------
  clearCost(o) { return { gold: Math.round(PF.OBSTACLE_SIZE[o.size].cost * (o.kind === 'rock' ? PF.ROCK_COST_MUL : 1)) }; },
  clearSecs(o) { return PF.OBSTACLE_SIZE[o.size].time; },
  startClear(o) {
    if (o.build) return;
    if (!this.needBuilder()) return;
    if (!PF.Game.pay(this.clearCost(o))) { PF.UI.toast('Zu wenig Gold', '#ff8080'); return; }
    this.start(o, 'clear', this.clearSecs(o));
    PF.Audio.sfx('place');
  },
  clearDone(o, b) {
    const sz = PF.OBSTACLE_SIZE[o.size], wx = (o.x + 0.5) * PF.TILE, wy = (o.y + 0.4) * PF.TILE;
    PF.World.remove(o);
    PF.FX.burst(wx, wy, o.kind === 'tree' ? '#7aa35a' : '#9a92a8', 22, 140);
    PF.Game.addXP(sz.xp, { x: wx, y: wy });
    PF.S.stats.cleared = (PF.S.stats.cleared || 0) + 1;
    // wie CoC: manchmal liegen Edelsteine darunter
    if (Math.random() < sz.gem * PF.Game.mult('luck')) {
      const n = PF.U.randi(1, o.size);
      PF.Game.give({ moonstone: n }, { x: wx, y: wy });
      PF.FX.popup(wx, wy - 40, `+${n} Mondstein${n > 1 ? 'e' : ''}!`, '#c47bff', 1.3);
      PF.Audio.sfx('legendary');
    } else PF.Audio.sfx('harvest');
    PF.UI && PF.UI.dirty();
    if (PF.UI && PF.UI.selected === o) PF.UI.select(null);
  },

  // Glattes Rauschen (Value-Noise) für natürliche Gruppen statt Raster
  noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sm = (t) => t * t * (3 - 2 * t);
    const h = (a, b) => PF.U.hash(a * 31 + 7, b * 57 + 3);
    const a = h(xi, yi), b2 = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    const u = sm(xf), v = sm(yf);
    return (a * (1 - u) + b2 * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  },
  field(x, y) { return 0.6 * this.noise(x / 5.5, y / 5.5) + 0.3 * this.noise(x / 2.4 + 40, y / 2.4 + 17) + 0.1 * PF.U.hash(x * 3 + 1, y * 5 + 2); },

  // Welt zuwachsen lassen: gleichmäßig gestreut über die ganze Fläche (~1/3 bedeckt).
  // Pro 3×3-Block stehen genau 3 Hindernisse an zufälligen Stellen – nie große Löcher, nie dichte Klumpen.
  // Garten: Bäume (weiter weg = größer), Fabrik: Felsen (weiter rechts = größer), Biome: gemischt & groß.
  genObstacles(s) {
    const W = PF.World, H = PF.U.hash;
    const free = (x, y) => {
      const k = PF.U.key(x, y);
      if (W.blocked.has(k) || s.grid[k]) return false;
      const z = W.zoneAt(x, y);
      if (z.type === 'shop') return false;
      // Startlichtung um Tisch, Brunnen und wilde Blüten (unregelmäßiger Rand)
      if (z.type === 'garden' && Math.hypot((x - 7) / 1.2, y - 9.5) < 4 + this.noise(x / 2, y / 2) * 1.4) return false;
      return true;
    };
    const taken = new Set();
    const near = (x, y) => { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && taken.has(PF.U.key(x + dx, y + dy))) n++; return n; };
    // Felder pro Gebiet in zufälliger Reihenfolge; erst nur Felder ohne Nachbarn, dann mit einem, …
    // -> ergibt eine gleichmäßige Streuung ohne Löcher, Klumpen oder Raster-Streifen
    const groups = {};
    for (let y = 2; y < W.H - 2; y++) for (let x = 0; x < W.W; x++) if (free(x, y)) {
      const z = W.zoneAt(x, y), g = z.type === 'biome' ? z.id : z.type;
      (groups[g] = groups[g] || []).push({ x, y, z, o: H(x * 17 + 3, y * 29 + 11) });
    }
    for (const cells of Object.values(groups)) {
      cells.sort((a, b) => a.o - b.o);
      const target = Math.round(cells.length * 0.33);
      let n = 0;
      for (let maxN = 0; maxN <= 3 && n < target; maxN++) for (const c of cells) {
        if (n >= target) break;
        const k = PF.U.key(c.x, c.y);
        if (taken.has(k) || near(c.x, c.y) > maxN) continue;
        taken.add(k); n++;
        const r = H(c.x * 13 + 5, c.y * 7 + 9);
        let kind, size;
        if (c.z.type === 'garden') { kind = 'tree'; size = 0.3 + Math.hypot(c.x - 7, c.y - 10) / 4.5 + (r - 0.5) * 1.6; }
        else if (c.z.type === 'factory') { kind = 'rock'; size = 0.6 + (c.x - 18) / 6.5 + (r - 0.5) * 1.6; }
        else { kind = H(c.x + 7, c.y * 3 + 1) < 0.5 ? 'tree' : 'rock'; size = 1.6 + r * 3.8; }
        size = PF.U.clamp(Math.round(size), 1, 5);
        const id = s.nextId++;
        s.ents[id] = { id, type: 'obstacle', kind, size, x: c.x, y: c.y, dir: 0, tier: 0 };
        s.grid[k] = id;
      }
    }
    s.obstacles = 3;
  },
  // Alte Verteilung (Raster, ~60 %) durch die neue ersetzen
  regrow(s) {
    if (s.obstacles === 3) return;
    for (const e of Object.values(s.ents)) if (e.type === 'obstacle' && !e.build) { delete s.ents[e.id]; delete s.grid[PF.U.key(e.x, e.y)]; }
    this.genObstacles(s);
  },
};

// ---------- Handwerk am Alchemietisch ----------
PF.Craft = {
  prog: {},
  // ein Klick = ein Stück Fortschritt; Handschuhe (Klick-Kraft) helfen
  step(key, clicks) {
    this.prog[key] = (this.prog[key] || 0) + PF.Game.mult('click') / clicks;
    PF.Audio.sfx('click');
    if (this.prog[key] >= 0.999) { this.prog[key] = 0; return true; }
    return false;
  },
  grind(cropId) {
    if (!(PF.S.inv.items['raw:' + cropId] > 0)) { PF.UI.toast('Keine Ernte davon im Vorrat', '#e0b080'); return; }
    if (this.step('g:' + cropId, PF.CRAFT.grindClicks)) {
      PF.Game.takeItem('raw:' + cropId); PF.Game.addItem('pow:' + cropId); PF.S.stats.ground = (PF.S.stats.ground || 0) + 1;
      PF.Game.addXP(PF.CRAFT.xpGrind);
      PF.Audio.sfx('harvest');
    }
  },
  canBrew(p) { return Object.entries(p.in).every(([c, n]) => (PF.S.inv.items['pow:' + c] || 0) >= n); },
  brew(pid) {
    const p = PF.POTION[pid];
    if (!this.canBrew(p)) { PF.UI.toast('Dir fehlen Pulver dafür', '#e0b080'); return; }
    if ((PF.S.water || 0) < PF.WATER.brew) { PF.UI.toast('Kein Wasser! Klicke den Brunnen.', '#9fc6e8', 'ingredients/5_1'); return; }
    if (this.step('b:' + pid, PF.CRAFT.brewClicks)) {
      for (const [c, n] of Object.entries(p.in)) PF.Game.takeItem('pow:' + c, n);
      PF.Water.use(PF.WATER.brew);
      PF.Game.addPotion(pid, PF.Factory.potionValue({ id: pid, q: 0, l: 0 }));
      const s = PF.S; s.stats.crafted++;
      const first = !s.album[pid]; s.album[pid] = (s.album[pid] || 0) + 1;
      PF.Game.addXP(PF.CRAFT.xpBrew + p.r * 3);
      PF.Audio.sfx('brew'); PF.Audio.sfx('reveal', p.r);
      if (first) PF.UI.toast(`Neu im Album: ${p.name}!`, PF.RARITY[p.r].color, p.icon);
    }
  },
};
