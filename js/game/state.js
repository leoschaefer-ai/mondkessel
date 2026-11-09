// Spielzustand, Währungen, Inventar, Boni
window.PF = window.PF || {};
PF.TILE = 64;

PF.newState = () => ({
  version: 1,
  worldVersion: 2,
  created: Date.now(),
  lastSave: 0,
  cur: { gold: 30, moonstone: 25, stardust: 0, soul: 0, bossSeal: 0 },
  builders: 1,
  level: 1, xp: 0,
  ents: {}, grid: {}, nextId: 1,
  inv: { items: {}, potions: {}, tools: [{ id: 'kanne', r: 0 }], pets: [], skins: [0], seeds: {}, chests: [0] },
  equip: { pet: null, skin: 0 },
  helpers: [],
  recipes: { schlaf: true },
  biomes: {},
  water: 25,
  shopkeeper: false,
  guild: {},
  album: {},
  wave: { n: 1, orders: [], phase: 'pause', timer: 3, bossTimer: 0, chestProgress: 0 },
  stats: { harvests: 0, crafted: 0, orders: 0, bosses: 0, goldEarned: 0, goldAllTime: 0, chestsOpened: 0, legendaries: 0, maxWave: 1, built: 0, upgrades: 0, sold: 0 },
  ach: {},
  daily: { last: 0, streak: 0, day: 0 },
  combo: { n: 0, t: 0 },
  incomeRate: 0,
  autoRate: 0,
  prestige: 0,
  tutorial: 0,
  settings: { music: 0.6, sfx: 0.6, muted: false },
});

PF.Game = {
  // ---------- Währungen ----------
  can(cost) {
    if (!cost) return true;
    return Object.entries(cost).every(([k, v]) => (PF.S.cur[k] || 0) >= v);
  },
  pay(cost) {
    if (!this.can(cost)) { PF.Audio.sfx('error'); return false; }
    for (const [k, v] of Object.entries(cost)) PF.S.cur[k] -= v;
    PF.UI && PF.UI.dirty();
    return true;
  },
  // Belohnung vergeben. from = Weltposition für fliegende Icons (optional)
  give(rew, from, silent) {
    const s = PF.S;
    for (const [k, v] of Object.entries(rew)) {
      if (v === undefined || v === null || v === false || (v === 0 && k !== 'chest')) continue;
      if (k === 'goldHours') { const g = Math.max(50, Math.floor(this.incomePerSec() * 3600 * v)); this.addGold(g, from, true); continue; }
      if (k === 'chest') { const cr = v === true ? 0 : v; s.inv.chests.push(cr); if (!silent) PF.UI.toast(`${PF.CHESTS[cr].name} erhalten!`, PF.chestColor(cr), PF.chestIcon(cr)); continue; }
      if (k === 'xp') { this.addXP(v, from); continue; }
      if (k === 'gold') { this.addGold(v, from); continue; }
      if (s.cur[k] !== undefined) {
        s.cur[k] += v;
        if (from) PF.FX.flyIcon(PF.CURRENCIES[k].icon, from, k);
      }
    }
    PF.UI && PF.UI.dirty();
  },
  // bonus = Geschenk (Truhe, Paket, Tagesbonus): zählt nicht als Einkommen, sonst schaukeln sich Belohnungen hoch
  addGold(v, from, bonus) {
    v = Math.floor(v);
    if (v <= 0) return;
    const s = PF.S;
    s.cur.gold += v;
    s.stats.goldEarned += v; s.stats.goldAllTime += v;
    if (!bonus) this._income += v;
    if (this._auto) this._autoIncome += v;
    if (from) PF.FX.flyIcon('currency/0_0', from, 'gold');
    PF.UI && PF.UI.dirty();
  },
  _income: 0, _autoIncome: 0, _auto: false,
  incomePerSec() { return Math.max(0.1, PF.S.incomeRate || 0); },

  // ---------- XP & Level ----------
  addXP(v, from) {
    const s = PF.S;
    v = Math.max(1, Math.round(v * this.mult('xp')));
    s.xp += v;
    while (s.xp >= PF.xpForLevel(s.level)) {
      s.xp -= PF.xpForLevel(s.level);
      s.level++;
      PF.Progress.onLevelUp(s.level);
    }
    PF.UI && PF.UI.dirty();
  },

  // ---------- Inventar ----------
  addItem(key, n = 1) { const it = PF.S.inv.items; it[key] = (it[key] || 0) + n; },
  takeItem(key, n = 1) { const it = PF.S.inv.items; if ((it[key] || 0) < n) return false; it[key] -= n; if (!it[key]) delete it[key]; return true; },
  addPotion(id, value, n = 1) {
    const p = PF.S.inv.potions;
    const e = p[id] || (p[id] = { n: 0, v: 0 });
    e.n += n; e.v += value * n;
  },
  takePotion(id, n = 1) {
    const e = PF.S.inv.potions[id];
    if (!e || e.n < n) return 0;
    const avg = e.v / e.n;
    e.n -= n; e.v -= avg * n;
    if (e.n <= 0) delete PF.S.inv.potions[id];
    return avg * n;
  },

  // ---------- Boni ----------
  bestTool(stat) {
    let best = -1;
    for (const t of PF.S.inv.tools) if (PF.TOOL[t.id] && PF.TOOL[t.id].stat === stat && t.r > best) best = t.r;
    return best;
  },
  mult(stat) {
    const s = PF.S;
    let m = 1;
    const tr = this.bestTool(stat);
    if (tr >= 0) m += PF.RARITY[tr].bonus;
    if (s.equip.pet !== null && s.inv.pets[s.equip.pet]) {
      const pet = s.inv.pets[s.equip.pet];
      if (PF.PET_SPECIES[pet.sp].stat === stat) m += PF.PET_BONUS[pet.r];
    }
    if (stat === 'gold' || stat === 'value') {
      m += s.cur.soul * PF.PRESTIGE.bonusPerSoul * (stat === 'gold' ? 1 : 0);
      if (stat === 'gold') for (const e of Object.values(s.ents)) if (e.type === 'decor') m += PF.DECOR.find(d => d.id === e.decor).bonus;
    }
    if (stat === 'speed' || stat === 'growth') m += s.cur.soul * 0.01;
    // Gilden-Upgrades
    for (const g of PF.GUILD) if (g.stat === stat) m += (s.guild && s.guild[g.id] || 0) * g.per;
    // Biom-Perks
    for (const b of PF.BIOMES) if (s.biomes && s.biomes[b.id] && b.perk.stat === stat) m += b.perk.v;
    return m;
  },
  // Kosten für das n-te Gebäude eines Typs (mit Bau-Rabatt)
  buildCost(type) {
    const def = PF.BUILD[type];
    const count = Object.values(PF.S.ents).filter(e => !e.wild && (e.type === 'machine' ? e.kind : e.type) === type).length;
    const free = type === 'belt' ? 0 : 0;
    const disc = 1 / this.mult('build');
    return { gold: Math.round(def.cost * Math.pow(def.costGrow, Math.max(0, count - free)) * disc) };
  },
  tierCost(ent) {
    if (ent.wild || ent.type === 'obstacle' || ent.build) return null;
    const kind = ent.type === 'machine' ? ent.kind : ent.type;
    const def = PF.BUILD[kind];
    const t = (ent.tier || 0) + 1;
    if (t > 4 || def.noTiers || !PF.TIER_COST[t]) return null;
    return PF.TIER_COST[t](def.cost);
  },
  unlocked(level) { return PF.S.level >= (level || 1); },
};

PF.costText = (cost) => Object.entries(cost || {}).map(([k, v]) =>
  `<span class="cost"><img src="${PF.Assets.url(PF.CURRENCIES[k].icon)}">${PF.U.fmt(v)}</span>`).join(' ');
