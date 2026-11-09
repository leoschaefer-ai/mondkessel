// Truhen-Loot: Seltenheit würfeln, Drops erzeugen und gutschreiben
window.PF = window.PF || {};

PF.Loot = {
  // Seltenheit eines Drops: Truhen-Seltenheit verschiebt die Gewichte nach oben, Glück ebenso
  rollRarity(chestR) {
    const luck = PF.Game.mult('luck');
    const w = PF.RARITY.map((r, i) => {
      if (i < chestR - 1) return 0;
      let x = r.weight;
      if (i >= chestR) x *= 1 + chestR * 0.8;
      if (i >= 2) x *= luck;
      return x;
    });
    const idx = PF.U.weighted([0, 1, 2, 3, 4], (i) => w[i]);
    return Math.max(idx, Math.max(0, chestR - 1));
  },

  // Ein Drop: { kind, r, ... , label, icon }
  makeDrop(chestR, guaranteeTop, minR = 0) {
    const s = PF.S;
    const r = Math.max(minR, guaranteeTop ? Math.max(chestR, this.rollRarity(chestR)) : this.rollRarity(chestR));
    const kinds = [
      ['gold', 30], ['stardust', 18], ['moonstone', 8 + r * 2], ['tool', 18 + r * 3], ['seeds', 14],
      ['pet', 4 + r * 2], ['recipe', 8 + r * 3],
    ];
    const kind = PF.U.weighted(kinds, k => k[1])[0];
    switch (kind) {
      case 'gold': {
        const g = Math.round(Math.max([25, 120, 500, 2000, 8000][r], PF.Game.incomePerSec() * 60 * (1.5 + r * 2.5)));
        return { kind, r, amount: g, label: PF.U.fmt(g) + ' Gold', icon: `currency/0_${Math.min(4, r + 1)}` };
      }
      case 'stardust': { const a = [8, 20, 45, 100, 250][r]; return { kind, r, amount: a, label: `${a} Sternenstaub`, icon: `currency/2_${Math.min(4, r + 1)}` }; }
      case 'moonstone': { const a = [3, 8, 20, 50, 120][r]; return { kind, r, amount: a, label: `${a} Mondsteine`, icon: `currency/1_${Math.min(4, r + 1)}` }; }
      case 'tool': {
        const t = PF.U.pick(PF.TOOLS);
        return { kind, r, tool: t.id, label: `${t.name}`, sub: `+${Math.round(PF.RARITY[r].bonus * 100)}% ${t.label}`, icon: `${t.sheet}/${r}_${t.col}` };
      }
      case 'pet': {
        const sp = PF.U.randi(0, 4);
        const d = PF.PET_SPECIES[sp];
        return { kind, r, sp, label: d.name, sub: `+${Math.round(PF.PET_BONUS[r] * 100)}% ${d.label}`, icon: `pets/${r}_${d.col}` };
      }
      case 'seeds': {
        const pool = PF.CROPS.filter(c => c.seedItem && c.rarity <= r + 1 && s.level >= c.unlock - 5);
        if (!pool.length) return this.makeDrop(chestR);
        const c = PF.U.pick(pool);
        const a = [3, 5, 8, 12, 20][r];
        const seedRow = PF.CROPS.indexOf(c) % 6;
        return { kind, r, crop: c.id, amount: a, label: `${a}× ${c.name}-Samen`, icon: `seeds/${Math.min(4, c.rarity)}_${seedRow}` };
      }
      case 'recipe': {
        const pool = PF.POTIONS.filter(p => !p.boss && p.r >= 2 && p.r <= r + 1 && !s.recipes[p.id]);
        if (!pool.length) return this.makeDrop(chestR);
        const p = PF.U.pick(pool);
        return { kind, r: p.r, recipe: p.id, label: `Rezept: ${p.name}`, sub: 'Dauerhaft freigeschaltet', icon: `knowledge/${p.r}_1` };
      }
    }
  },

  grant(d) {
    const s = PF.S;
    switch (d.kind) {
      case 'gold': PF.Game.addGold(d.amount, null, true); break;
      case 'stardust': case 'moonstone': case 'bossSeal': s.cur[d.kind] += d.amount; break;
      case 'tool': s.inv.tools.push({ id: d.tool, r: d.r }); break;
      case 'pet': s.inv.pets.push({ sp: d.sp, r: d.r }); if (s.equip.pet === null) s.equip.pet = s.inv.pets.length - 1; break;
      case 'seeds': s.inv.seeds[d.crop] = (s.inv.seeds[d.crop] || 0) + d.amount; break;
      case 'recipe': s.recipes[d.recipe] = true; break;
    }
    if (d.r >= 4) s.stats.legendaries++;
    PF.UI.dirty();
  },

  openChest(index) {
    const s = PF.S;
    const r = s.inv.chests[index];
    if (r === undefined) return null;
    s.inv.chests.splice(index, 1);
    const def = PF.CHESTS[r];
    const drops = [];
    if (def.premium) {
      for (let i = 0; i < def.drops; i++) drops.push(this.makeDrop(def.lootR, false, i >= def.drops - def.top.n ? def.top.r : def.lootR));
      const b = def.bonus, br = Math.min(4, def.lootR + 1);
      if (b.moonstone) drops.push({ kind: 'moonstone', r: br, amount: b.moonstone, label: `${PF.U.fmt(b.moonstone)} Mondsteine`, icon: 'currency/1_4' });
      if (b.goldHours) { const g = PF.Premium.goldFor(b.goldHours, b.goldMin); drops.push({ kind: 'gold', r: br, amount: g, label: `${PF.U.fmt(g)} Gold`, icon: 'currency/0_4' }); }
      if (b.bossSeal) drops.push({ kind: 'bossSeal', r: 4, amount: b.bossSeal, label: `${b.bossSeal} Boss-Siegel`, icon: 'currency/4_3' });
    } else for (let i = 0; i < def.drops; i++) drops.push(this.makeDrop(r, i === def.drops - 1));
    drops.sort((a, b) => a.r - b.r);
    drops.forEach(d => this.grant(d));
    s.stats.chestsOpened++;
    return { r, drops };
  },
};
