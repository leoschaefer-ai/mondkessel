// Level-Ups, Erfolge, Daily-Reward, Forschung, Prestige, Tutorial
window.PF = window.PF || {};

PF.Progress = {
  onLevelUp(lvl) {
    const rew = PF.levelReward(lvl);
    PF.Game.give(rew, null, true);
    const unlocks = [];
    PF.CROPS.forEach(c => { if (c.unlock === lvl) unlocks.push({ icon: c.icon, text: (c.seedItem ? 'Seltene Pflanze: ' : 'Pflanze: ') + c.name }); });
    PF.POTIONS.forEach(p => { if (p.unlock === lvl && !p.boss) unlocks.push({ icon: p.icon, text: (p.r <= 1 ? 'Rezept: ' : 'Erforschbar: ') + p.name }); });
    Object.entries(PF.BUILD).forEach(([k, b]) => { if (b.unlock === lvl) unlocks.push({ icon: b.icon, text: 'Bauen: ' + b.name }); });
    PF.HELPERS.forEach(h => { if (h.unlock === lvl) unlocks.push({ icon: `helpers/${h.row}_4`, text: 'Helfer: ' + h.name }); });
    PF.BIOMES.forEach(b => { if (b.unlock.level === lvl) unlocks.push({ icon: b.landmark.s, text: 'Biom freischaltbar: ' + b.name }); });
    if (lvl === PF.PRESTIGE.minLevel) unlocks.push({ icon: 'rewards/2_3', text: 'Wiedergeburt (Prestige) verfügbar!' });
    PF.UI.levelUp(lvl, rew, unlocks);
    PF.Audio.sfx('levelup');
    PF.Audio.playSting('reward', 10);
    PF.FX.shake(8, 0.4);
  },

  statValue(stat) {
    const s = PF.S;
    if (stat === 'level') return s.level;
    if (stat === 'albumCount') return Object.keys(s.album).length;
    return s.stats[stat] || 0;
  },

  checkAchievements() {
    const s = PF.S;
    let fresh = 0;
    for (const a of PF.ACHIEVEMENTS) {
      if (s.ach[a.id]) continue;
      if (this.statValue(a.stat) >= a.goal) {
        s.ach[a.id] = 'done'; fresh++;
        PF.UI.toast(`🏆 Erfolg: ${a.name}`, PF.RARITY[a.r].color, a.badge);
      }
    }
    if (fresh) PF.UI.dirty();
  },
  claimAchievement(id) {
    const a = PF.ACHIEVEMENTS.find(x => x.id === id);
    if (PF.S.ach[id] !== 'done') return;
    PF.S.ach[id] = 'claimed';
    PF.Game.give(a.reward);
    PF.Audio.sfx('coin');
  },
  unclaimed() { return Object.values(PF.S.ach).filter(v => v === 'done').length; },

  // ---------- Daily ----------
  dayKey(t) { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); },
  dailyReady() { const d = PF.S.daily; return !d.last || this.dayKey(d.last) !== this.dayKey(Date.now()); },
  claimDaily() {
    const d = PF.S.daily;
    if (!this.dailyReady()) return;
    const gap = d.last ? (Date.now() - d.last) / 3600000 : 0;
    if (d.last && gap > 48) { d.streak = 0; d.day = 0; }
    const rew = PF.DAILY[d.day % 7];
    PF.Game.give(rew.give);
    d.streak++; d.day = (d.day + 1) % 7; d.last = Date.now();
    PF.Audio.sfx('levelup'); PF.Audio.playSting('reward', 6);
    PF.UI.toast(`Tag ${d.streak} in Folge! 🔥`, '#ffbf3f');
  },

  // ---------- Forschung ----------
  research(pid) {
    const p = PF.POTION[pid];
    const cost = p.boss ? { bossSeal: p.seals } : { stardust: p.research };
    if (PF.S.level < p.unlock) return;
    if (!PF.Game.pay(cost)) { PF.UI.toast('Nicht genug ' + (p.boss ? 'Boss-Siegel' : 'Sternenstaub'), '#ff8080'); return; }
    PF.S.recipes[pid] = true;
    PF.Audio.sfx('reveal', p.r);
    PF.UI.toast(`Rezept erforscht: ${p.name}`, PF.RARITY[p.r].color, p.icon);
  },
  buySeeds(cropId, n = 5) {
    const c = PF.CROP[cropId];
    if (!PF.Game.pay({ stardust: c.seedStardust * n })) return;
    PF.S.inv.seeds[cropId] = (PF.S.inv.seeds[cropId] || 0) + n;
    PF.Audio.sfx('coin');
  },

  // ---------- Gilde ----------
  buyGuild(id) {
    const g = PF.GUILD.find(x => x.id === id), s = PF.S;
    s.guild = s.guild || {};
    const lvl = s.guild[id] || 0;
    if (!PF.Game.pay(PF.guildCost(g, lvl))) return false;
    s.guild[id] = lvl + 1;
    PF.Audio.sfx('upgrade');
    return true;
  },

  // ---------- Prestige ----------
  soulGain() { return PF.PRESTIGE.soulFor(PF.S.stats.goldEarned); },
  prestige() {
    const s = PF.S;
    const gain = this.soulGain();
    if (s.level < PF.PRESTIGE.minLevel || gain < 1) return;
    const keep = {
      cur: { gold: 80, moonstone: s.cur.moonstone, stardust: s.cur.stardust, soul: s.cur.soul + gain, bossSeal: s.cur.bossSeal },
      inv: { items: {}, potions: {}, tools: s.inv.tools, pets: s.inv.pets, skins: s.inv.skins, seeds: s.inv.seeds, chests: s.inv.chests.concat([2]) },
      equip: s.equip, recipes: s.recipes, album: s.album, ach: s.ach, daily: s.daily, settings: s.settings,
      prestige: s.prestige + 1, tutorial: s.tutorial,
      stats: Object.assign({}, s.stats, { goldEarned: 0 }),
    };
    PF.S = Object.assign(PF.newState(), keep);
    PF.World.defaultLayout();
    PF.Save.save();
    PF.Render.invalidate();
    PF.UI.bigBanner('WIEDERGEBURT!', `+${gain} Seelenessenz – alles ist jetzt ${Math.round(PF.S.cur.soul * PF.PRESTIGE.bonusPerSoul * 100)}% wertvoller`, '#6dffa8');
    PF.Audio.playSting('reward', 10); PF.Audio.sfx('legendary');
    PF.UI.dirty();
  },

  // ---------- Tutorial ----------
  tutorialText() {
    const s = PF.S;
    while (s.tutorial < PF.TUTORIAL.length && PF.TUTORIAL[s.tutorial].done(s)) s.tutorial++;
    return s.tutorial < PF.TUTORIAL.length ? PF.TUTORIAL[s.tutorial].text : null;
  },

  // "Gleich geschafft"-Teaser: nächstes Ziel
  nextUnlock() {
    const lvl = PF.S.level;
    const items = [];
    PF.CROPS.forEach(c => c.unlock > lvl && items.push({ l: c.unlock, t: c.name, icon: c.icon }));
    Object.values(PF.BUILD).forEach(b => b.unlock > lvl && items.push({ l: b.unlock, t: b.name, icon: b.icon }));
    PF.POTIONS.forEach(p => !p.boss && p.unlock > lvl && items.push({ l: p.unlock, t: p.name, icon: p.icon }));
    PF.BIOMES.forEach(b => !PF.S.biomes[b.id] && b.unlock.level > lvl && items.push({ l: b.unlock.level, t: 'Biom ' + b.name, icon: b.landmark.s }));
    items.sort((a, b) => a.l - b.l);
    return items[0] || null;
  },
};
