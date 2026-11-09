// Fabrik: Förderbänder + Maschinen
// Item auf dem Band: { t: 'raw'|'pow'|'brew'|'pot', id, q (Qualität 0–3), l (etikettiert) }
window.PF = window.PF || {};

PF.Factory = {
  beltSpeed(e) { return 1.5 * Math.pow(PF.TIER_SPEED[e.tier || 0], 0.7) * Math.sqrt(PF.Game.mult('speed')) * (this.aura.b[PF.U.key(e.x, e.y)] || 1); },

  // Auren (Runenkreis / Geister-Generator) – einmal pro Sekunde neu berechnet
  aura: { m: {}, b: {}, g: {} }, auraT: 0, trickleT: 0,
  rebuildAura() {
    const a = { m: {}, b: {}, g: {} };
    for (const e of Object.values(PF.S.ents)) {
      if (e.type !== 'machine') continue;
      const def = PF.BUILD[e.kind];
      if (!def || !def.aura) continue;
      if (e.build) continue;
      const r = (def.auraR || (def.aura === 'belt' ? 3 : 2)) + (e.tier || 0);
      const bonus = def.aura === 'belt' ? 1 + 0.25 * (e.tier || 0) : (def.auraBonus || 0.4) + 0.2 * (e.tier || 0);
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
        const k = PF.U.key(e.x + dx, e.y + dy);
        if (def.aura === 'belt') a.b[k] = Math.max(a.b[k] || 1, 1 + bonus);
        else if (def.aura === 'grow') a.g[k] = (a.g[k] || 1) + bonus;
        else a.m[k] = (a.m[k] || 1) + bonus;
      }
    }
    this.aura = a;
  },
  sorterMatch(f, it) {
    if (!f) f = 'pot';
    if (f === it.t) return true;
    if (f.startsWith('c:')) return (it.t === 'raw' || it.t === 'pow') && it.id === f.slice(2);
    if (f.startsWith('p:')) return (it.t === 'brew' || it.t === 'pot') && it.id === f.slice(2);
    return false;
  },

  recipeUnlocked(p) {
    const s = PF.S;
    if (s.recipes[p.id]) return true;
    return !p.boss && p.r <= 1 && s.level >= p.unlock;
  },
  usable(p) { return this.recipeUnlocked(p) && Object.keys(p.in).every(c => PF.S.level >= PF.CROP[c].unlock); },
  // Kann der Spieler das gerade wirklich herstellen? (seltene Pflanzen brauchen Samen oder ein Beet damit)
  producible(p) {
    if (!this.usable(p)) return false;
    return Object.keys(p.in).every(c => {
      const cr = PF.CROP[c];
      if (!cr.seedItem) return true;
      if ((PF.S.inv.seeds[c] || 0) > 0) return true;
      return Object.values(PF.S.ents).some(e => e.type === 'plot' && (e.crop === c || e.last === c));
    });
  },

  machineSpeed(m) {
    let sp = PF.TIER_SPEED[m.tier || 0] * PF.Game.mult('speed');
    if (PF.kindOf(m) === 'mortar' || PF.kindOf(m) === 'mill') sp *= PF.Game.mult('grind');
    if (PF.kindOf(m) === 'cauldron' || PF.kindOf(m) === 'mixer') sp *= PF.Game.mult('brew');
    sp *= this.aura.m[PF.U.key(m.x, m.y)] || 1;
    sp *= (PF.BUILD[m.kind] && PF.BUILD[m.kind].speedMul) || 1;
    return sp;
  },

  potionValue(it) {
    const p = PF.POTION[it.id];
    return p.value * (1 + 0.5 * (it.q || 0)) * (it.l === 2 ? 1.5 : it.l ? 1.3 : 1) * (it.c ? 2 : 1) * PF.Game.mult('value');
  },

  insert(t, item, mdir) {
    if (!t) return false;
    if (t.type === 'belt') {
      if (t.item || t.dir === (mdir + 2) % 4) return false;
      t.item = item; t.prog = 0; t.from = mdir;
      return true;
    }
    if (t.type === 'machine') return t.build ? false : this.accept(t, item);
    return false;
  },

  accept(m, it) {
    switch (PF.kindOf(m)) {
      case 'mortar': case 'mill':
        if (it.t !== 'raw' || m.inq.length >= 3) return false;
        m.inq.push(it); return true;
      case 'cauldron': case 'mixer': {
        if (it.t !== 'pow') return false;
        const have = m.have[it.id] || 0;
        if (PF.kindOf(m) === 'mixer' && m.recipe !== 'auto') m.recipe = 'auto';
        // Überschuss wandert ins Lager statt das Band zu blockieren
        const cap = m.recipe !== 'auto' ? (PF.POTION[m.recipe].in[it.id] || 0) * 2 : (PF.kindOf(m) === 'mixer' ? 12 : 6);
        if (have >= cap) { PF.Game.addItem('pow:' + it.id); return true; }
        m.have[it.id] = have + 1; m.pulse = 0.15; return true;
      }
      case 'distillery':
        if (it.t !== 'brew' || (it.q || 0) >= 3 || m.inq.length >= 2) return false;
        m.inq.push(it); return true;
      case 'bottler':
        if (it.t !== 'brew' || m.inq.length >= 3) return false;
        m.inq.push(it); return true;
      case 'labeler':
        if (it.t !== 'pot' || it.l || m.inq.length >= 3) return false;
        m.inq.push(it); return true;
      case 'seller': {
        if (it.t !== 'pot') return false;
        PF.Game.addPotion(it.id, this.potionValue(it) * (PF.BUILD[m.kind].sellBonus || 1));
        m.pulse = 0.25;
        PF.FX.burst((m.x + 0.5) * PF.TILE, (m.y + 0.2) * PF.TILE, PF.RARITY[PF.POTION[it.id].r].color, 8, 70);
        PF.UI.dirty();
        return true;
      }
      case 'forge':
        if (it.t !== 'raw' || m.inq.length >= 3) return false;
        m.inq.push(it); return true;
      case 'recycler':
        if ((it.t !== 'raw' && it.t !== 'pow') || m.inq.length >= 3) return false;
        m.inq.push(it); return true;
      case 'frost':
        if (it.t !== 'brew' || (it.q || 0) >= 3 || m.inq.length >= 2) return false;
        m.inq.push(it); return true;
      case 'infuser':
        if (it.t !== 'pot' || it.c || m.inq.length >= 3) return false;
        m.inq.push(it); return true;
      case 'desk': case 'soul':
        if (it.t !== 'pot' || m.inq.length >= 3) return false;
        m.inq.push(it); return true;
      case 'sorter':
        if (m.out.length >= 2) return false;
        it._od = this.sorterMatch(m.filter, it) ? m.dir : (m.dir + (PF.BUILD[m.kind].mirror ? 3 : 1)) % 4;
        m.out.push(it); m.pulse = 0.1; return true;
      case 'teleporter': {
        const others = Object.values(PF.S.ents).filter(e => e.type === 'machine' && PF.kindOf(e) === 'teleporter' && e.id !== m.id && e.out.length < 3);
        m.pulse = 0.2;
        if (others.length) {
          m.rr = ((m.rr || 0) + 1) % others.length;
          const t = others[m.rr];
          t.out.push(it); t.pulse = 0.25;
          PF.FX.burst((m.x + 0.5) * PF.TILE, (m.y + 0.2) * PF.TILE, '#c47bff', 6, 50);
          PF.FX.burst((t.x + 0.5) * PF.TILE, (t.y + 0.2) * PF.TILE, '#c47bff', 6, 50);
          return true;
        }
        if (it.t === 'pot') { PF.Game.addPotion(it.id, this.potionValue(it)); PF.UI.dirty(); return true; }
        if (it.t === 'raw' || it.t === 'pow') { PF.Game.addItem(it.t + ':' + it.id); return true; }
        return false;
      }
      case 'storage':
        if (it.t === 'raw' || it.t === 'pow') { PF.Game.addItem(it.t + ':' + it.id); m.pulse = 0.15; return true; }
        if (it.t === 'brew' && PF.BUILD[m.kind].bottles) { PF.Game.addPotion(it.id, this.potionValue(it) * PF.BUILD[m.kind].bottles); PF.S.stats.crafted++; PF.S.album[it.id] = (PF.S.album[it.id] || 0) + 1; m.pulse = 0.15; return true; }
        if (it.t === 'pot') { PF.Game.addPotion(it.id, this.potionValue(it)); m.pulse = 0.15; return true; }
        return false;
    }
    return false;
  },

  // Auto-Kessel: welches Rezept als nächstes?
  // Kessel im Leerlauf: fehlende Pulver aus dem Lager nachholen
  pullFromStock(m) {
    const items = PF.S.inv.items;
    const cands = m.recipe !== 'auto' ? [PF.POTION[m.recipe]] :
      PF.POTIONS.filter(p => this.usable(p)).sort((a, b) => (PF.Shop.demand(b.id) * 1e6 + b.value) - (PF.Shop.demand(a.id) * 1e6 + a.value));
    for (const p of cands) {
      const ok = Object.entries(p.in).every(([c, n]) => (m.have[c] || 0) + (items['pow:' + c] || 0) >= n);
      if (!ok) continue;
      for (const [c, n] of Object.entries(p.in)) {
        const miss = n - (m.have[c] || 0);
        if (miss > 0) { PF.Game.takeItem('pow:' + c, miss); m.have[c] = (m.have[c] || 0) + miss; }
      }
      return;
    }
  },

  pickRecipe(m) {
    if (m.recipe !== 'auto') {
      const p = PF.POTION[m.recipe];
      return Object.entries(p.in).every(([c, n]) => (m.have[c] || 0) >= n) ? p : null;
    }
    let best = null, bestScore = -1;
    for (const p of PF.POTIONS) {
      if (!this.usable(p)) continue;
      if (!Object.entries(p.in).every(([c, n]) => (m.have[c] || 0) >= n)) continue;
      const score = PF.Shop.demand(p.id) * 1e6 + p.value;
      if (score > bestScore) { bestScore = score; best = p; }
    }
    return best;
  },

  update(dt) {
    const s = PF.S;
    const ents = Object.values(s.ents);
    // Bänder
    for (const e of ents) {
      if (e.type !== 'belt' || !e.item) continue;
      e.prog += this.beltSpeed(e) * dt;
      if (e.prog >= 1) {
        e.prog = 1;
        const [dx, dy] = PF.U.DIRS[e.dir];
        if (this.insert(PF.World.ent(e.x + dx, e.y + dy), e.item, e.dir)) e.item = null;
      }
    }
    // Maschinen
    for (const m of ents) {
      if (m.type !== 'machine' || m.build) continue;
      if (m.pulse > 0) m.pulse -= dt;
      const def = PF.BUILD[m.kind];
      const sp = this.machineSpeed(m);
      switch (PF.kindOf(m)) {
        case 'collector': {
          m.timer += dt * sp * def.speed;
          if (m.timer >= 1 && m.out.length === 0) {
            const keys = Object.keys(s.inv.items).filter(k => k.startsWith('raw:'));
            if (keys.length) {
              m.rr = ((m.rr || 0) + 1) % keys.length;
              const k = keys[m.rr];
              PF.Game.takeItem(k);
              m.out.push({ t: 'raw', id: k.slice(4) });
              m.timer = 0; m.pulse = 0.12;
            } else m.timer = 1;
          }
          break;
        }
        case 'mortar': case 'mill': case 'distillery': case 'bottler': case 'labeler':
        case 'forge': case 'frost': case 'infuser': case 'desk': case 'soul': case 'recycler': {
          if (!m.busy && m.inq.length && m.out.length < 2) { m.cur = m.inq.shift(); m.busy = true; m.timer = 0; }
          if (m.busy) {
            m.timer += dt * sp;
            if (m.timer >= def.time) this.finish(m);
          }
          break;
        }
        case 'condenser': {
          m.timer += dt * sp;
          if (m.timer >= def.time) {
            m.timer = 0; m.pulse = 0.4;
            if (def.reward === 'gold') {
              const g = Math.max(300, Math.round(PF.Game.incomePerSec() * 90 * (1 + 0.5 * (m.tier || 0))));
              PF.Game.addGold(g, null, true);
              PF.FX.popup((m.x + 0.5) * PF.TILE, m.y * PF.TILE, '+' + PF.U.fmt(g) + ' Gold', '#ffd36b', 1.2);
            } else {
              PF.Game.give({ moonstone: 1 });
              PF.FX.popup((m.x + 0.5) * PF.TILE, m.y * PF.TILE, '+1 Mondstein', '#c47bff', 1.2);
            }
            PF.FX.burst((m.x + 0.5) * PF.TILE, m.y * PF.TILE, '#c47bff', 20, 120);
            PF.Audio.sfx('coin');
          }
          break;
        }
        case 'cauldron': case 'mixer': {
          if (!m.busy && m.out.length < 1 + (def.brewOut || 1)) {
            if (!this.pickRecipe(m)) { m.pullT = (m.pullT || 0) - dt; if (m.pullT <= 0) { m.pullT = 1; this.pullFromStock(m); } }
            const p = this.pickRecipe(m);
            const need = PF.WATER.brew * (PF.kindOf(m) === 'mixer' ? 2 : 1);
            m.noWater = !!p && (PF.S.water || 0) < need;
            if (p && !m.noWater) {
              PF.Water.use(need);
              for (const [c, n] of Object.entries(p.in)) { m.have[c] -= n; if (!m.have[c]) delete m.have[c]; }
              m.cur = { id: p.id }; m.busy = true; m.timer = 0;
              PF.Audio.sfx('brew');
            }
          }
          if (m.busy) {
            m.timer += dt * sp;
            if (m.timer >= PF.POTION[m.cur.id].time) {
              const nOut = def.brewOut || (PF.kindOf(m) === 'mixer' ? 2 : 1);
              for (let i = 0; i < nOut; i++) m.out.push({ t: 'brew', id: m.cur.id, q: 0 });
              m.busy = false; m.cur = null; m.pulse = 0.3;
              PF.FX.burst((m.x + 0.5) * PF.TILE, (m.y - 0.2) * PF.TILE, '#b06bff', 10, 60);
            }
          }
          break;
        }
      }
      // Ausgabe (Sortierer: Richtung je Item)
      if (m.out.length) {
        const it = m.out[0];
        const od = it._od !== undefined ? it._od : m.dir;
        const [dx, dy] = PF.U.DIRS[od];
        if (this.insert(PF.World.ent(m.x + dx, m.y + dy), it, od)) { delete it._od; m.out.shift(); }
      }
    }
  },

  updateGlobal(dt) {
    this.auraT -= dt;
    if (this.auraT <= 0) { this.auraT = 1; this.rebuildAura(); }
    // Kristallhöhle: Sternenstaub-Rinnsal
    if (PF.S.biomes && PF.S.biomes.crystal) {
      this.trickleT += dt;
      if (this.trickleT >= 30) { this.trickleT = 0; PF.S.cur.stardust += 1; PF.UI.dirty(); }
    }
  },

  finish(m) {
    const it = m.cur, s = PF.S;
    m.busy = false; m.cur = null; m.pulse = 0.25;
    const wx = (m.x + 0.5) * PF.TILE, wy = m.y * PF.TILE, def = PF.BUILD[m.kind];
    switch (PF.kindOf(m)) {
      case 'mortar': case 'mill': case 'forge': {
        const n = def.yield || 1;
        for (let i = 0; i < n; i++) m.out.push({ t: 'pow', id: it.id });
        s.stats.groundAuto = (s.stats.groundAuto || 0) + n;
        if (PF.kindOf(m) === 'forge') PF.FX.burst(wx, wy, '#ff8a3d', 10, 80);
        break;
      }
      case 'frost': m.out.push({ t: 'brew', id: it.id, q: Math.min(3, (it.q || 0) + 2) }); PF.FX.popup(wx, wy, '❄ ' + '★'.repeat(Math.min(3, (it.q || 0) + 2)), '#9fe8ff'); break;
      case 'infuser': m.out.push({ t: 'pot', id: it.id, q: it.q, l: it.l, c: 1 }); PF.FX.burst(wx, wy, '#c47bff', 14, 90); PF.FX.popup(wx, wy, '◆ ×2', '#e0b8ff'); break;
      case 'desk': {
        const r = PF.POTION[it.id].r, sd = Math.round((1 + r * 3) * (def.stardustMul || 1));
        PF.Game.give({ stardust: sd });
        PF.FX.popup(wx, wy, `+${sd} Sternenstaub`, '#7fc4ff');
        break;
      }
      case 'soul': {
        const r = PF.POTION[it.id].r;
        const ms = (r >= 4 ? 3 : r >= 3 ? 1 : Math.random() < 0.05 ? 1 : 0) + (r >= 2 ? def.soulBonus || 0 : 0);
        if (ms) { PF.Game.give({ moonstone: ms }); PF.FX.popup(wx, wy, `+${ms} Mondstein`, '#c47bff', 1.2); PF.Audio.sfx('coin'); }
        else PF.FX.burst(wx, wy, '#6dffa8', 8, 60);
        break;
      }
      case 'recycler': {
        const src = PF.CROP[it.id];
        m.rc = (m.rc || 0) + 1; m.rmax = Math.max(m.rmax || 0, src.rarity);
        if (m.rc >= (def.recycleN || 3)) {
          const pool = PF.CROPS.filter(c => s.level >= c.unlock && c.rarity > m.rmax);
          const pick = pool.length ? PF.U.pick(pool) : src;
          m.out.push({ t: 'raw', id: pick.id });
          PF.FX.popup(wx, wy, '♻ ' + pick.name, PF.RARITY[pick.rarity].color);
          m.rc = 0; m.rmax = 0;
        }
        break;
      }
      case 'distillery': m.out.push({ t: 'brew', id: it.id, q: (it.q || 0) + 1 }); PF.FX.popup(wx, wy, '★'.repeat((it.q || 0) + 1), '#ffe27a'); break;
      case 'labeler': m.out.push({ t: 'pot', id: it.id, q: it.q, l: def.labelBonus ? 2 : 1 }); break;
      case 'bottler': {
        const pot = { t: 'pot', id: it.id, q: it.q || 0, l: 0 };
        m.out.push(pot);
        if (m.tier >= 4 && Math.random() < 0.2) m.out.push({ ...pot });
        s.stats.crafted++;
        const first = !s.album[it.id];
        s.album[it.id] = (s.album[it.id] || 0) + 1;
        const p = PF.POTION[it.id];
        PF.Game.addXP(2 + p.r * 4);
        if (p.r >= 2) PF.Game.give({ stardust: p.r - 1 });
        if (first) { PF.UI.toast(`Neu im Album: ${p.name}!`, PF.RARITY[p.r].color, p.icon); PF.Audio.sfx('reveal', p.r); }
        break;
      }
    }
  },

  // Klick auf Maschine = kleiner Schub
  boost(m) {
    if (!m.busy) return;
    const def = PF.BUILD[m.kind];
    const total = (PF.kindOf(m) === 'cauldron' || PF.kindOf(m) === 'mixer') ? PF.POTION[m.cur.id].time : def.time;
    m.timer += total * 0.2 * PF.Game.mult('click');
    m.pulse = 0.2;
    PF.Audio.sfx('click');
    PF.FX.burst((m.x + 0.5) * PF.TILE, (m.y + 0.2) * PF.TILE, '#c9a7ff', 6, 50);
  },

  itemIcon(it) {
    if (it.t === 'raw') return PF.Assets.img(PF.CROP[it.id].icon);
    if (it.t === 'pow') {
      const c = PF.CROP[it.id];
      return c.powder ? PF.Assets.img(c.powder) : PF.Assets.tinted('ingredients/1_0', c.color);
    }
    if (it.t === 'pot') return PF.Assets.img(PF.POTION[it.id].icon);
    return null;
  },
  itemName(key) {
    const [t, id] = key.split(':');
    const c = PF.CROP[id];
    if (t === 'raw') return c.name;
    return c.powderName || c.name + '-Pulver';
  },
};
