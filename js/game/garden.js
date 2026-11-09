// Garten: Wachstum, Gießen, Ernten, Pflanzen, Sprinkler, Helfer, Spielerfigur
window.PF = window.PF || {};

// Wasser: Speicher (Fässer/Tonnen), Zufluss (Brunnen/Tonnen), Verbrauch (Gießen, Sprinkler, Kessel)
PF.Water = {
  cap() {
    let c = PF.WATER.baseCap;
    for (const e of Object.values(PF.S.ents)) { const d = e.type === 'machine' && !e.build && PF.BUILD[e.kind]; if (d && d.water && d.water.cap) c += d.water.cap * (1 + (e.tier || 0)); }
    return c;
  },
  regen() {
    let r = 0;
    for (const e of Object.values(PF.S.ents)) { const d = e.type === 'machine' && !e.build && PF.BUILD[e.kind]; if (d && d.water && d.water.regen) r += d.water.regen * PF.TIER_SPEED[e.tier || 0]; }
    return r;
  },
  update(dt) {
    const s = PF.S;
    this._t = (this._t || 0) - dt;
    if (this._t <= 0 || this._cap === undefined) { this._t = 1; this._cap = this.cap(); this._regen = this.regen(); }
    if (!isFinite(s.water)) s.water = 0;
    s.water = Math.min(this._cap, (s.water || 0) + this._regen * dt);
    for (const e of Object.values(s.ents)) if (PF.kindOf(e) === 'well' && e.cd > 0) e.cd -= dt;
  },
  use(n) { if ((PF.S.water || 0) < n) return false; PF.S.water -= n; return true; },
  // Brunnen anklicken: kräftiger Schub, aber mit Abklingzeit (kein Dauer-Spammen)
  pump(e) {
    const def = PF.BUILD.well;
    if (e.cd > 0) { PF.UI.toast(`Der Brunnen muss sich erholen (${Math.ceil(e.cd)} s)`, '#9fc6e8'); return; }
    const add = PF.WATER.pump * PF.TIER_SPEED[e.tier || 0] * PF.Game.mult('click');
    PF.S.water = Math.min(this.cap(), (PF.S.water || 0) + add);
    e.cd = def.pumpCd; e.pulse = 0.3; PF.S.stats.pumps = (PF.S.stats.pumps || 0) + 1;
    PF.Audio.sfx('water');
    PF.FX.burst((e.x + 0.5) * PF.TILE, (e.y + 0.3) * PF.TILE, '#7fd4ff', 14, 90);
    PF.FX.popup((e.x + 0.5) * PF.TILE, (e.y - 0.6) * PF.TILE, `+${Math.round(add)} 💧`, '#9fdcff');
    PF.UI.dirty();
  },
};

PF.Garden = {
  growMult(p) {
    let m = PF.Game.mult('growth') * PF.TIER_SPEED[p.tier || 0] ** 0.6;
    if (p.water > 0) m *= 1.7;
    if (p.wild) m *= 0.8;
    const z = PF.World.zoneAt(p.x, p.y);
    if (z.biome && z.biome.crops[p.crop]) m *= z.biome.crops[p.crop];
    m *= (PF.Factory.aura.g && PF.Factory.aura.g[PF.U.key(p.x, p.y)]) || 1;
    return m;
  },

  update(dt) {
    const s = PF.S;
    for (const e of Object.values(s.ents)) {
      if (e.build) continue;
      if (e.type === 'plot') {
        if (e.water > 0) e.water -= dt;
        if (e.crop && e.growth < 1) {
          e.growth = Math.min(1, e.growth + dt / PF.CROP[e.crop].grow * this.growMult(e));
          if (e.growth >= 1) e.ripeT = 0;
        }
        if (e.growth >= 1) e.ripeT = (e.ripeT || 0) + dt;
      } else if (e.type === 'machine' && PF.kindOf(e) === 'sprinkler') {
        e.timer += dt;
        if (e.timer > 1) {
          e.timer = 0;
          const r = (PF.BUILD[e.kind].range || 1) + (e.tier || 0);
          for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
            const p = PF.World.ent(e.x + dx, e.y + dy);
            if (p && p.type === 'plot' && p.crop && p.growth < 1 && p.water < 2 && PF.Water.use(PF.WATER.sprinkler)) { p.water = 12; e.spray = 0.6; }
          }
        }
        if (e.spray > 0) e.spray -= dt;
      }
    }
    PF.Water.update(dt);
    this.updateHelpers(dt);
    this.updatePlayer(dt);
  },

  stage(p) { return p.growth >= 1 ? 3 : Math.min(2, Math.floor(p.growth * 3)); },

  // Klick auf ein Beet
  click(p) {
    // Saatwahl ohne Vorauswahl: Auswahl sofort zeigen, Zwerg pflanzt nach Wahl
    if (!p.crop && !p.last) { PF.UI.openSeedPicker(p); return; }
    this.go(p.x, p.y, () => this.doClick(p), { key: 'plot' + p.id });
  },
  doClick(p) {
    if (!PF.S.ents[p.id]) return;
    if (!p.crop) {
      if (p.last && this.plant(p, p.last, true)) return;
      PF.UI.openSeedPicker(p);
      return;
    }
    if (p.growth >= 1) { this.harvest(p, true); return; }
    // Gießen + Klick-Boost – kostet Wasser
    if (!PF.Water.use(PF.WATER.water)) { PF.UI.toast('Kein Wasser! Klicke einen Brunnen oder baue Regentonnen.', '#9fc6e8', 'ingredients/5_1'); PF.Audio.sfx('error'); return; }
    const boost = 0.04 * PF.Game.mult('click');
    p.growth = Math.min(1, p.growth + boost);
    p.water = Math.max(p.water, 15);
    PF.Audio.sfx('water');
    PF.FX.burst((p.x + 0.5) * PF.TILE, (p.y + 0.4) * PF.TILE, '#7fd4ff', 8, 60);
    PF.FX.popup((p.x + 0.5) * PF.TILE, p.y * PF.TILE, '💧 +' + Math.round(boost * 100) + '%', '#9fdcff');
  },

  // free = Nachpflanzen nach der Ernte (Samen fallen bei der Ernte ab) – verhindert Soft-Lock bei 0 Gold
  plant(p, cropId, silent, free) {
    const c = PF.CROP[cropId];
    if (!c || !PF.Game.unlocked(c.unlock)) return false;
    if (free && !c.seedItem) { /* gratis */ } else if (c.seedItem) {
      if (!(PF.S.inv.seeds[cropId] > 0)) { if (!silent) { PF.UI.toast(`Keine ${c.name}-Samen! (Truhen / Forschung)`, '#ff8080'); PF.Audio.sfx('error'); } return false; }
      PF.S.inv.seeds[cropId]--;
    } else {
      const cost = Math.max(1, Math.round(c.seedCost / PF.Game.mult('seedCost')));
      if (!PF.Game.pay({ gold: cost })) { if (!silent) PF.UI.toast('Zu wenig Gold für Samen', '#ff8080'); return false; }
    }
    p.crop = cropId; p.last = cropId; p.growth = 0;
    PF.FX.burst((p.x + 0.5) * PF.TILE, (p.y + 0.5) * PF.TILE, '#8bd46a', 6, 40);
    return true;
  },

  harvest(p, byPlayer) {
    const c = PF.CROP[p.crop];
    let n = 1;
    if (Math.random() < PF.Game.mult('yield') - 1 + (p.tier || 0) * 0.12) n++;
    PF.Game.addItem('raw:' + c.id, n);
    const s = PF.S;
    s.stats.harvests += n;
    PF.Game.addXP((0.5 + c.rarity) * (byPlayer ? PF.Game.mult('harvestXp') : 0.4));
    // Samenfund bei seltenen Pflanzen
    const seedChance = 0.04 * PF.Game.mult('seedDrop') * PF.Game.mult('luck');
    if (Math.random() < seedChance) {
      const pool = PF.CROPS.filter(cc => cc.seedItem && s.level >= cc.unlock - 3);
      if (pool.length) {
        const sc = PF.U.pick(pool);
        s.inv.seeds[sc.id] = (s.inv.seeds[sc.id] || 0) + 1;
        PF.UI.toast(`Samenfund: ${sc.name}!`, PF.RARITY[sc.rarity].color);
      }
    }
    const wx = (p.x + 0.5) * PF.TILE, wy = (p.y + 0.4) * PF.TILE;
    PF.FX.burst(wx, wy, c.color, 14, 110);
    PF.FX.popup(wx, wy - 20, `+${n} ${c.name}`, c.color);
    PF.FX.flyItem(c.icon, { x: wx, y: wy });
    if (byPlayer) PF.Audio.sfx('harvest');
    p.crop = null; p.growth = 0;
    this.plant(p, p.last, true, true);
    PF.UI.dirty();
  },

  // ---------- Helfer ----------
  updateHelpers(dt) {
    const s = PF.S;
    for (const h of s.helpers) {
      const def = PF.HELPERS.find(d => d.id === h.id);
      if (h.cool > 0) { h.cool -= dt; continue; }
      let tgt = h.target ? PF.S.ents[h.target] : null;
      if (!tgt || tgt.type !== 'plot' || !tgt.crop || tgt.growth < 1 || (tgt.claimed && tgt.claimed !== h.uid)) {
        tgt = null; h.target = null;
        let best = null, bd = 1e9;
        for (const e of Object.values(s.ents)) {
          if (e.type !== 'plot' || !e.crop || e.growth < 1 || (e.claimed && e.claimed !== h.uid)) continue;
          const d = Math.hypot(e.x - h.x, e.y - h.y);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) { h.target = best.id; best.claimed = h.uid; tgt = best; }
      }
      const gx = tgt ? tgt.x + 0.5 : h.homeX, gy = tgt ? tgt.y + 0.7 : h.homeY;
      const dx = gx - h.x, dy = gy - h.y, d = Math.hypot(dx, dy);
      if (d > 0.08) {
        const sp = def.speed * dt;
        h.x += dx / d * Math.min(sp, d); h.y += dy / d * Math.min(sp, d);
        h.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'f' : 'b');
        h.moving = true;
      } else {
        h.moving = false;
        if (tgt) { tgt.claimed = null; this.harvest(tgt, false); h.cool = 0.5; h.target = null; }
      }
    }
  },

  buyHelper(id) {
    const def = PF.HELPERS.find(d => d.id === id);
    const owned = PF.S.helpers.filter(h => h.id === id).length;
    const cost = {};
    for (const [k, v] of Object.entries(def.cost)) cost[k] = Math.round(v * Math.pow(def.costGrow, owned));
    if (!PF.Game.pay(cost)) return false;
    const hx = 3 + Math.random() * 12, hy = 7 + Math.random() * 14;
    PF.S.helpers.push({ id, uid: 'h' + Date.now() + Math.random(), x: hx, y: hy, homeX: hx, homeY: hy, face: 'f', cool: 0 });
    PF.Audio.sfx('upgrade');
    PF.UI.toast(`${def.name} hilft jetzt im Garten!`, PF.RARITY[def.r].color);
    return true;
  },
  helperCost(id) {
    const def = PF.HELPERS.find(d => d.id === id);
    const owned = PF.S.helpers.filter(h => h.id === id).length;
    const cost = {};
    for (const [k, v] of Object.entries(def.cost)) cost[k] = Math.round(v * Math.pow(def.costGrow, owned));
    return cost;
  },

  // ---------- Spielerfigur + Pet ----------
  player: { x: 8.5, y: 13, tx: 8.5, ty: 13, face: 'f', moving: false, idle: 0, petX: 7.5, petY: 13.4, job: null, queue: [], work: 0 },
  SPEED: 4.2,           // Felder pro Sekunde (Weg Garten -> Laden ~10 s)
  walkPlayerTo(x, y) { this.player.tx = x + 0.5; this.player.ty = y + 1.1; this.player.idle = 0; },
  // Laufauftrag: der Zwerg geht erst hin, dann passiert die Aktion. key verhindert Doppelaufträge.
  // stand = genaue Standposition (Weltfelder) statt "unter dem Feld"
  go(x, y, fn, opt = {}) {
    const p = this.player, all = [p.job, ...p.queue].filter(Boolean);
    if (opt.key && all.some(j => j.key === opt.key)) return false;
    if (p.queue.length >= 12) { PF.UI && PF.UI.toast('Der Zwerg hat schon genug zu tun', '#e0b080'); return false; }
    const j = { x, y, fn, key: opt.key, carry: opt.carry, label: opt.label, sx: opt.stand ? opt.stand[0] : x + 0.5, sy: opt.stand ? opt.stand[1] : y + 1.1 };
    p.queue.push(j); p.idle = 0;
    return true;
  },
  busyWith(key) { const p = this.player; return [p.job, ...p.queue].some(j => j && j.key === key); },
  updatePlayer(dt) {
    const p = this.player;
    if (!p.queue) { p.queue = []; p.job = null; p.work = 0; }
    p.idle += dt;
    // nächsten Laufauftrag holen
    if (!p.job && p.queue.length && p.work <= 0) { p.job = p.queue.shift(); p.tx = p.job.sx; p.ty = p.job.sy; }
    const panelOpen = PF.Panels && PF.Panels.current;
    if (!p.job && !p.queue.length && !panelOpen && p.idle > 6 && Math.random() < dt * 0.3) { p.tx = 3 + Math.random() * 13; p.ty = 6 + Math.random() * 16; p.idle = 0; }
    if (p.work > 0) { p.work -= dt; p.moving = false; }
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
    if (d > 0.05 && p.work <= 0) {
      const sp = this.SPEED * PF.Game.mult('speed') ** 0.3 * dt;
      p.x += dx / d * Math.min(sp, d); p.y += dy / d * Math.min(sp, d);
      p.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'f' : 'b');
      p.moving = true;
    } else if (p.work <= 0) p.moving = false;
    // angekommen -> Aktion ausführen, kurz arbeiten
    if (p.job && d <= 0.15) {
      const j = p.job; p.job = null; p.work = 0.3; p.idle = 0;
      try { j.fn && j.fn(); } catch (err) { console.error(err); }
    }
    // Pet folgt
    const px = p.x - 0.7, py = p.y + 0.3;
    p.petX += (px - p.petX) * Math.min(1, dt * 3); p.petY += (py - p.petY) * Math.min(1, dt * 3);
  },
};
