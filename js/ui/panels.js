// Menü-Panels
window.PF = window.PF || {};

PF.Panels = {
  current: null,
  tab: {},
  open(id) { this.current = id; this[id](); },
  refresh() { if (this.current) this[this.current](); },

  tabs(id, list) {
    const cur = this.tab[id] || list[0][0];
    return { cur, html: `<div class="ptabs">${list.map(([k, n]) => `<button class="${k === cur ? 'on' : ''}" data-ptab="${id}:${k}">${n}</button>`).join('')}</div>` };
  },
  bind(p) {
    p.querySelectorAll('[data-ptab]').forEach(b => b.onclick = () => { const [id, k] = b.dataset.ptab.split(':'); this.tab[id] = k; PF.Audio.sfx('click'); this.refresh(); });
  },

  // ---------- Truhen ----------
  chests() {
    const s = PF.S;
    const counts = PF.CHESTS.map(() => 0);
    s.inv.chests.forEach(r => counts[r]++);
    const p = PF.UI.openPanel(`
      <h2>${ic('chests/2_0')} Truhen</h2>
      <p class="small">Truhen gibt es bei Level-Ups, Wellen, Boss-Kunden, im Daily-Kalender – und zu kaufen in der <button class="linkbtn" data-panel="treasury">Schatzkammer</button>.</p>
      <div class="grid chests">${PF.CHESTS.map((c, r) => r >= 5 && !counts[r] ? '' : `
        <div class="tile r${Math.min(4, PF.chestRarity(r))} ${counts[r] ? '' : 'empty'} ${r >= 5 ? 'premium' : ''}">
          ${ic(PF.chestIcon(r))}<div class="tname">${c.name}</div><div class="tsub">${counts[r]}× · ${c.drops} Funde</div>
          ${counts[r] ? `<button data-open="${r}">Öffnen</button>` : '<button disabled>Keine</button>'}
        </div>`).join('')}</div>`);
    p.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => this.open(b.dataset.panel));
    p.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
      const r = +b.dataset.open;
      PF.UI.closePanel();
      PF.UI.openChestFlow(PF.S.inv.chests.lastIndexOf(r));
    });
  },

  // ---------- Inventar ----------
  inventory() {
    const s = PF.S, R = PF.RARITY, fmt = PF.U.fmt;
    const t = this.tabs('inv', [['items', 'Zutaten'], ['potions', 'Tränke'], ['tools', 'Werkzeuge'], ['pets', 'Pets'], ['skins', 'Skins'], ['seeds', 'Saatgut']]);
    const head = (icon, name, r, sub) => `<div class="tiph" style="color:${R[r].color}">${ic(icon)} ${name}</div><div class="tipr" style="color:${R[r].color}">${R[r].name}${sub ? ' · ' + sub : ''}</div>`;
    let list = [], hint = '', empty = '';
    if (t.cur === 'items') {
      empty = 'Noch leer – ernte im Garten! Später holt die Erntekiste die Zutaten automatisch.';
      list = Object.entries(s.inv.items).filter(([, n]) => n > 0).map(([k, n]) => {
        const [ty, id] = k.split(':'), c = PF.CROP[id], icon = ty === 'raw' ? c.icon : (c.powder || 'ingredients/1_0');
        const tint = ty === 'pow' && !c.powder ? c.color : null; // Pulver ohne eigenes Icon: in Pflanzenfarbe einfärben
        const uses = PF.POTIONS.filter(p => p.in[id]).length;
        return { icon, tint, n, r: c.rarity, info: `item:${ty}:${id}`,
          tip: head(icon, PF.Factory.itemName(k), c.rarity, `${n}× im Vorrat`) + `<div class="tipfx">${ty === 'raw' ? `Ernte · wächst in ${PF.U.fmtTime(c.grow)}` : 'Pulver · bereit zum Brauen'}</div><div class="tipnote">Steckt in ${uses} Trank-Rezepten · Klick für Details</div>` };
      }).sort((a, b) => a.r - b.r || b.n - a.n);
    }
    if (t.cur === 'potions') {
      hint = `Tränke im Laden-Vorrat. Aufträge zahlen ${PF.WAVE.orderMult}× den Wert.`;
      empty = 'Kein Vorrat – braue Tränke am Alchemietisch oder im Kessel.';
      list = Object.entries(s.inv.potions).map(([id, v]) => {
        const p = PF.POTION[id], avg = v.v / v.n;
        return { icon: p.icon, n: v.n, r: p.r, info: `potion:${id}`,
          tip: head(p.icon, p.name, p.r, `${v.n}× im Vorrat`) + `<div class="tipfx">Ø ${fmt(avg)} Gold · im Auftrag ≈ ${fmt(avg * PF.WAVE.orderMult)}</div><div class="tipnote">Zusammen ${fmt(v.v)} Gold wert · Klick für Rezept</div>` };
      }).sort((a, b) => a.r - b.r || b.n - a.n);
    }
    if (t.cur === 'tools') {
      hint = 'Das beste Werkzeug jeder Art wirkt automatisch. Kaufen im Laden oder in Truhen finden.';
      list = PF.TOOLS.map(tool => {
        const owned = s.inv.tools.filter(x => x.id === tool.id).map(x => x.r), top = owned.length ? Math.max(...owned) : -1;
        return { icon: `${tool.sheet}/${Math.max(0, top)}_${tool.col}`, n: owned.length, r: Math.max(0, top), dim: top < 0, tip: this.toolTip(tool.id, Math.max(0, top)) };
      });
    }
    if (t.cur === 'pets') {
      hint = 'Klicke ein Pet an, um es auszurüsten. Es läuft dann neben dir her und gibt seinen Bonus.';
      empty = 'Noch keine Pets. Pets findest du in Truhen (häufiger in besseren Truhen).';
      list = s.inv.pets.map((pet, i) => {
        const sp = PF.PET_SPECIES[pet.sp], icon = `pets/${pet.r}_${sp.col}`;
        return { icon, n: 1, r: pet.r, on: s.equip.pet === i, act: () => { s.equip.pet = i; PF.Audio.sfx('click'); this.refresh(); },
          tip: head(icon, sp.name, pet.r) + `<div class="tipfx">+${Math.round(PF.PET_BONUS[pet.r] * 100)} % ${sp.label}</div><div class="tipnote">${s.equip.pet === i ? 'Ausgerüstet ✓' : 'Klick zum Ausrüsten'}</div>` };
      });
    }
    if (t.cur === 'skins') {
      hint = 'Klick: tragen (oder kaufen).';
      list = PF.SKINS.map(sk => {
        const own = s.inv.skins.includes(sk.id), icon = `skins/${sk.id}_idle_f`;
        return { icon, n: 1, r: sk.r, dim: !own, on: s.equip.skin === sk.id,
          act: () => {
            if (own) { s.equip.skin = sk.id; PF.Audio.sfx('click'); return this.refresh(); }
            if (!PF.Game.pay(sk.cost)) { PF.UI.toast('Nicht genug Währung', '#ff8080'); return; }
            s.inv.skins.push(sk.id); s.equip.skin = sk.id; PF.Audio.sfx('legendary'); this.refresh();
          },
          tip: head(icon, sk.name, sk.r) + `<div class="tipnote">${own ? (s.equip.skin === sk.id ? 'Getragen ✓' : 'Klick zum Tragen') : 'Kaufen: ' + PF.costText(sk.cost)}</div>` };
      });
    }
    if (t.cur === 'seeds') {
      hint = 'Seltene Pflanzen brauchen Samen: aus Truhen, beim Ernten (Hacke!) oder in der Forschung.';
      list = PF.CROPS.filter(c => c.seedItem).map(c => {
        const n = s.inv.seeds[c.id] || 0, locked = s.level < c.unlock;
        return { icon: c.icon, n, r: c.rarity, dim: !n, info: `crop:${c.id}`,
          tip: head(c.icon, c.name + '-Samen', c.rarity, `${n} Samen`) + `<div class="tipfx">${locked ? 'Anbaubar ab Level ' + c.unlock : 'Wächst in ' + PF.U.fmtTime(c.grow)}</div><div class="tipnote">Mehr Samen: Forschung (${c.seedStardust} Sternenstaub je Samen) · Klick für Details</div>` };
      });
    }
    // Regal: 4 Böden, pro Boden 10 Plätze, mehr Seiten bei Bedarf
    const PER = 10, ROWS = 4, page = Math.min(this.shelfPage[t.cur] || 0, Math.max(0, Math.ceil(list.length / (PER * ROWS)) - 1));
    const pages = Math.max(1, Math.ceil(list.length / (PER * ROWS)));
    const slice = list.slice(page * PER * ROWS, (page + 1) * PER * ROWS);
    const rows = [];
    for (let r = 0; r < ROWS; r++) rows.push(slice.slice(r * PER, (r + 1) * PER));
    this.shelfItems = slice;
    const body = `${hint ? `<p class="small">${hint}</p>` : ''}
      <div class="shelf">${this.candles()}${rows.map((row, ri) => `<div class="srow s${ri}">${row.map((it, k) => {
        const idx = ri * PER + k;
        return `<div class="sitem r${it.r} ${it.dim ? 'dim' : ''} ${it.on ? 'on' : ''}" data-si="${idx}" style="animation-delay:${(idx % 7) * -0.37}s">
          ${it.n > 1 ? `<span class="scount">${it.n > 999 ? fmt(it.n) : it.n}</span>` : ''}${this.shelfImg(it)}</div>`;
      }).join('')}</div>`).join('')}
      ${!list.length && empty ? `<div class="sempty">${empty}</div>` : ''}</div>
      ${pages > 1 ? `<div class="spager"><button data-sp="-1" ${page ? '' : 'disabled'}>‹</button><span>Regal ${page + 1} / ${pages}</span><button data-sp="1" ${page < pages - 1 ? '' : 'disabled'}>›</button></div>` : ''}`;
    PF.UI.tip(null);
    const p = PF.UI.openPanel(`<h2>${ic('ui/5_3')} Inventar</h2>${t.html}${body}`, 'wide inv');
    this.bind(p);
    p.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { this.shelfPage[t.cur] = page + +b.dataset.sp; PF.Audio.sfx('click'); this.refresh(); });
    p.querySelectorAll('[data-si]').forEach(el => {
      const it = this.shelfItems[+el.dataset.si];
      el.onmouseenter = el.onmousemove = (ev) => PF.UI.tip(it.tip, ev);
      el.onmouseleave = () => PF.UI.tip(null);
      el.onclick = () => { PF.UI.tip(null); if (it.act) it.act(); else if (it.info) PF.Info.show(it.info); };
    });
  },
  shelfPage: {},
  // 8 flackernde Kerzen auf den Wandhaltern – verschiedene Sorten & Größen, jede mit eigenem Takt
  CANDLE: [[185, 204, 99], [123, 325, 96], [181, 249, 95], [193, 135, 89], [181, 322, 95], [159, 273, 89]],
  candles() {
    const spots = [[6.6, 30.1, 0, 1.0], [93.4, 30.1, 4, 0.85], [6.6, 50.5, 3, 1.15], [93.4, 50.5, 1, 1.0], [6.6, 70.4, 2, 0.95], [93.4, 70.4, 5, 1.05], [6.6, 90.3, 4, 0.8], [93.4, 90.3, 0, 0.9]];
    return `<div class="candles">${spots.map(([x, y, t, sc], i) => {
      const [w, h, cut] = this.CANDLE[t], k = 0.026 * sc;
      const style = `left:${x}%;top:${y}%;width:${(w * k).toFixed(2)}cqw;height:${(h * k).toFixed(2)}cqw;--fx:50%;--fy:${(cut / h * 100).toFixed(1)}%;--d:${(1.3 + (i * 0.37) % 0.9).toFixed(2)}s;--dl:${(-i * 0.53).toFixed(2)}s`;
      return `<div class="candle" style="${style}"><i class="cglow"></i><img src="assets/ui/candles/c${t}_body.png" alt=""><img class="cflame" src="assets/ui/candles/c${t}_flame.png" alt=""></div>`;
    }).join('')}</div>`;
  },
  // Regal-Bild: Sprites mit dunklem Kasten (Sheets im keep-Modus) weich ausblenden, Pulver ohne Icon einfärben
  shelfImg(it) {
    const boxed = /^(ingredients_b|tools_alchemy|knowledge)\//.test(it.icon) ? 'boxed' : '';
    if (it.tint) {
      const c = PF.Assets.tinted(it.icon, it.tint);
      if (c && c.toDataURL) { this._tintUrl = this._tintUrl || {}; const k = it.icon + it.tint; return `<img class="${boxed}" src="${this._tintUrl[k] || (this._tintUrl[k] = c.toDataURL())}" draggable="false">`; }
    }
    return ic(it.icon, boxed);
  },

  // ---------- Laden ----------
  shop() {
    const s = PF.S;
    const t = this.tabs('shop', [['guild', 'Gilden-Upgrades'], ['tools', 'Werkzeuge'], ['moon', 'Mondstein-Angebote'], ['boss', 'Boss-Laden']]);
    let body = '';
    if (t.cur === 'guild') {
      body = `<p class="small">Endlose Aufwertungen für Gold. Jede Stufe wirkt sofort auf alles.</p><div class="grid chests">${PF.GUILD.map(g => {
        const lvl = (s.guild && s.guild[g.id]) || 0;
        return `<div class="tile r${Math.min(4, Math.floor(lvl / 5))}">${ic(g.icon)}<div class="tname">${g.name}</div><div class="tsub">Stufe ${lvl} · +${Math.round(lvl * g.per * 100)}% ${g.text}</div><div class="tsub">nächste: +${Math.round(g.per * 100)}%</div><button data-guild="${g.id}">${PF.costText(PF.guildCost(g, lvl))}</button></div>`;
      }).join('')}</div>`;
    }
    if (t.cur === 'chests') {
      body = `<p class="small">Gold-Preise wachsen mit deinem Einkommen – und jede weitere Truhe am selben Tag kostet 25 % mehr. </p>
      <div class="grid chests">${PF.CHESTS.slice(0, 5).map((c, r) => { const gp = PF.Premium.goldChestPrice(r); return `<div class="tile r${r}">${ic(`chests/${r}_0`)}<div class="tname">${c.name}</div><div class="tsub">${c.drops} Funde, min. ${PF.RARITY[Math.max(0, r - 1)].name}</div>${gp ? `<button data-goldchest="${r}">${PF.costText(gp)}</button>` : ''}${c.price.gold ? '' : `<button data-buychest="${r}">${PF.costText(c.price)}</button>`}</div>`; }).join('')}</div>`;
    }
    if (t.cur === 'tools') {
      body = `<p class="small">Jedes Werkzeug in 5 Seltenheiten. Höhere Stufen = stärkerer Bonus.</p><div class="toolshop">${PF.TOOLS.map(tool => `
        <div class="trow"><div class="tlabel">${ic(`${tool.sheet}/0_${tool.col}`)}<div><b>${tool.name}</b><br><span class="small">${tool.label}</span></div></div>
        ${[0, 1, 2, 3, 4].map(r => {
          const own = s.inv.tools.some(x => x.id === tool.id && x.r === r);
          return `<button class="tbuy r${r} ${own ? 'own' : ''}" data-tool="${tool.id}:${r}">${ic(`${tool.sheet}/${r}_${tool.col}`)}<span>${own ? '✓' : PF.costText(PF.TOOL_PRICE[r])}</span></button>`;
        }).join('')}</div>`).join('')}</div>`;
    }
    if (t.cur === 'moon') {
      body = `<div class="grid chests">${PF.MOON_OFFERS.map((o, i) => `<div class="tile r2">${ic(o.icon)}<div class="tname">${o.name}</div><div class="tsub">${o.desc || ''}${o.give.goldHours ? ' ≈ ' + PF.U.fmt(PF.Game.incomePerSec() * 3600 * o.give.goldHours) + ' Gold' : ''}</div><button data-offer="${i}">${PF.costText(o.price)}</button></div>`).join('')}</div>`;
    }
    if (t.cur === 'boss') {
      const bossRecipes = PF.POTIONS.filter(p => p.boss);
      body = `<p class="small">Boss-Siegel gibt es nur von Boss-Kunden (alle 10 Wellen).</p>
        <div class="grid chests"><div class="tile r4">${ic('helpers/4_4')}<div class="tname">Uhrwerk-Käfer</div><div class="tsub">Legendärer Helfer</div><button data-panel="helpers">Zu den Helfern</button></div></div>
        <h3>Boss-Rezepte</h3><div class="grid items">${bossRecipes.map(p => `<div class="tile r4 ${s.recipes[p.id] ? 'equipped' : ''}">${ic(p.icon)}<div class="tname">${p.name}</div><div class="tsub">${PF.U.fmt(p.value)} Gold · ab Lv ${p.unlock}</div>${s.recipes[p.id] ? '<button disabled>Erforscht</button>' : `<button data-research="${p.id}" ${s.level < p.unlock ? 'disabled' : ''}>${PF.costText({ bossSeal: p.seals })}</button>`}</div>`).join('')}</div>`;
    }
    PF.UI.tip(null);
    const p = PF.UI.openPanel(`<h2>${ic('ui/4_5')} Laden</h2>${t.html}${body}`, 'wide');
    this.bind(p);
    p.querySelectorAll('[data-guild]').forEach(b => b.onclick = () => { if (!PF.Progress.buyGuild(b.dataset.guild)) PF.UI.toast('Zu wenig Gold', '#ff8080'); this.refresh(); });
    p.querySelectorAll('[data-buychest]').forEach(b => b.onclick = () => {
      const r = +b.dataset.buychest;
      if (!PF.Game.pay(PF.CHESTS[r].price)) { PF.UI.toast('Nicht genug Währung', '#ff8080'); return; }
      s.inv.chests.push(r); PF.UI.closePanel(); PF.UI.openChestFlow(s.inv.chests.length - 1);
    });
    p.querySelectorAll('[data-goldchest]').forEach(b => b.onclick = () => {
      if (!PF.Premium.buyGoldChest(+b.dataset.goldchest)) return;
      PF.UI.closePanel(); PF.UI.openChestFlow(s.inv.chests.length - 1);
    });
    p.querySelectorAll('[data-tool]').forEach(b => {
      const [id, r] = b.dataset.tool.split(':');
      b.onmouseenter = b.onmousemove = (ev) => PF.UI.tip(this.toolTip(id, +r), ev);
      b.onmouseleave = () => PF.UI.tip(null);
    });
    p.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
      const [id, r] = b.dataset.tool.split(':');
      if (s.inv.tools.some(x => x.id === id && x.r === +r)) return;
      if (!PF.Game.pay(PF.TOOL_PRICE[+r])) { PF.UI.toast('Nicht genug Währung', '#ff8080'); return; }
      s.inv.tools.push({ id, r: +r });
      PF.Audio.sfx(+r >= 4 ? 'legendary' : 'reveal', +r);
      PF.UI.toast(`${PF.TOOL[id].name} (${PF.RARITY[r].name}) gekauft!`, PF.RARITY[r].color, `${PF.TOOL[id].sheet}/${r}_${PF.TOOL[id].col}`);
      this.refresh();
    });
    p.querySelectorAll('[data-offer]').forEach(b => b.onclick = () => {
      const o = PF.MOON_OFFERS[+b.dataset.offer];
      if (!PF.Game.pay(o.price)) { PF.UI.toast('Nicht genug Mondsteine', '#ff8080'); return; }
      PF.Game.give(o.give); PF.Audio.sfx('coin'); this.refresh();
    });
    p.querySelectorAll('[data-research]').forEach(b => b.onclick = () => { PF.Progress.research(b.dataset.research); this.refresh(); });
    p.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => this.open(b.dataset.panel));
  },

  // ---------- Schatzkammer (alles für Gold) ----------
  treasury() {
    const s = PF.S, P = PF.Premium;
    const t = this.tabs('tre', [['chests', 'Truhen'], ['offers', '✦ Angebote'], ['other', 'Sternenstaub & Siegel']]);
    const priceBtn = (cost, attr, ok = true, label) => `<button class="pbuy" ${attr} ${ok ? '' : 'disabled'}>${label || `${ic('currency/0_0')} ${PF.U.fmt(cost.gold)}`}</button>`;
    let body = '';
    if (t.cur === 'chests') {
      body = `<p class="small">Jede Premium-Truhe läuft durchs Lotterie-Band und kann sich zu einer noch besseren aufwerten – bis zur Kaiserlichen Schatztruhe. Preise wachsen mit deinem Einkommen; jede weitere Truhe derselben Art am selben Tag kostet 25 % mehr.</p>
      <h3>Truhen</h3>
      <div class="pgrid">${PF.CHESTS.slice(0, 5).map((c, r) => { const cost = P.goldChestPrice(r); return `<div class="pcard chest n${r} ${PF.Game.can(cost) ? '' : 'poor'}">
        <div class="picon big">${ic(PF.chestIcon(r))}</div><div class="tname" style="color:${PF.RARITY[r].color}">${c.name}</div>
        <div class="tsub">${c.drops} Funde · min. ${PF.RARITY[Math.max(0, r - 1)].name}</div>
        ${priceBtn(cost, `data-goldchest="${r}"`)}</div>`; }).join('')}</div>
      <h3>Premium-Truhen</h3>
      <div class="pgrid">${PF.PREMIUM_CHESTS.map((c, i) => { const cost = P.price('pc' + i, c.price); return `<div class="pcard chest t${i} ${PF.Game.can(cost) ? '' : 'poor'}">
        <div class="picon big">${ic(PF.chestIcon(5 + i))}</div><div class="tname" style="color:${c.color}">${c.name}</div>
        <div class="tsub">${c.drops} Funde · garantiert ${c.top.n}× <span style="color:${PF.RARITY[c.top.r].color}">${PF.RARITY[c.top.r].name}</span></div>
        <ul class="plines">${P.lines(c.bonus).map(([icn, txt]) => `<li>${ic(icn)} ${txt}</li>`).join('')}</ul>
        ${priceBtn(cost, `data-pchest="${i}"`)}</div>`; }).join('')}</div>`;
    } else {
      const list = PF.PREMIUM_PACKS[t.cur];
      body = `<div class="pgrid">${list.map((p, i) => { const ok = P.available(p), cost = P.price(p.id, p.price); return `<div class="pcard ${ok ? '' : 'sold'} ${PF.Game.can(cost) ? '' : 'poor'}">${p.badge ? `<i class="pbadge">${p.badge}</i>` : ''}
        <div class="picon">${ic(p.icon)}</div><div class="tname">${p.name}</div>
        <ul class="plines">${P.lines(p.give).map(([icn, txt]) => `<li>${ic(icn)} ${txt}</li>`).join('')}</ul>
        ${priceBtn(cost, `data-pbuy="${t.cur}:${i}"`, ok, ok ? null : (p.once ? 'Gekauft ✓' : 'Nicht verfügbar'))}</div>`; }).join('')}</div>`;
    }
    const p = PF.UI.openPanel(`<h2>${ic('pchests/4_0')} Schatzkammer</h2><p class="small">Alles hier kostet nur Gold. Du hast ${ic('currency/0_0')} <b>${PF.U.fmt(s.cur.gold)}</b>.</p>${t.html}${body}`, 'wide treasury');
    this.bind(p);
    p.querySelectorAll('[data-pbuy]').forEach(b => b.onclick = () => {
      const [tab, i] = b.dataset.pbuy.split(':');
      P.buy(PF.PREMIUM_PACKS[tab][+i], () => this.refresh());
    });
    p.querySelectorAll('[data-pchest]').forEach(b => b.onclick = () => P.buyChest(+b.dataset.pchest));
    p.querySelectorAll('[data-goldchest]').forEach(b => b.onclick = () => { if (!P.buyGoldChest(+b.dataset.goldchest)) return; PF.UI.closePanel(); PF.UI.openChestFlow(s.inv.chests.length - 1); });
  },

  // Was ein Werkzeug konkret bewirkt – alle 5 Stufen im Vergleich
  TOOL_FX: {
    yield: (p) => `+${p} % Chance auf eine Extra-Ernte`,
    growth: (p) => `Pflanzen wachsen ${p} % schneller`,
    harvestXp: (p) => `+${p} % XP beim Ernten`,
    seedDrop: (p) => `+${p} % Chance auf Samenfunde`,
    seedCost: (p) => `Samen ${Math.round(100 - 100 / (1 + p / 100))} % billiger`,
    click: (p) => `Klicks wirken ${p} % stärker (Mörsern, Brauen, Brunnen, Maschinen-Schub)`,
    grind: (p) => `Mörser & Mühlen ${p} % schneller`,
    brew: (p) => `Kessel brauen ${p} % schneller`,
    build: (p) => `Bauen ${Math.round(100 - 100 / (1 + p / 100))} % billiger`,
    speed: (p) => `Alle Maschinen ${p} % schneller`,
    luck: (p) => `+${p} % Glück: bessere Truhen-Funde & Aufwertungen`,
    value: (p) => `Alle Tränke ${p} % mehr wert`,
  },
  toolTip(id, r) {
    const tool = PF.TOOL[id], s = PF.S, fx = this.TOOL_FX[tool.stat];
    const owned = s.inv.tools.filter(x => x.id === id).map(x => x.r), best = owned.length ? Math.max(...owned) : -1;
    const pct = (k) => Math.round(PF.RARITY[k].bonus * 100);
    return `<div class="tiph" style="color:${PF.RARITY[r].color}">${ic(`${tool.sheet}/${r}_${tool.col}`)} ${tool.name} · ${PF.RARITY[r].name}</div>
      <div class="tipfx">${fx(pct(r))}</div>
      <table class="tiptab">${[0, 1, 2, 3, 4].map(k => `<tr class="${k === r ? 'on' : ''}"><td style="color:${PF.RARITY[k].color}">${PF.RARITY[k].name}</td><td>+${pct(k)} %</td><td>${owned.includes(k) ? '✓' : PF.costText(PF.TOOL_PRICE[k])}</td></tr>`).join('')}</table>
      <div class="tipnote">${best >= 0 ? `Dein bestes: <b style="color:${PF.RARITY[best].color}">${PF.RARITY[best].name}</b> (+${pct(best)} %)${r > best ? ` → mit diesem <b>+${pct(r) - pct(best)} %</b> mehr` : ''}` : 'Du hast noch keins.'}<br>Es zählt immer nur das beste Werkzeug jeder Art.</div>`;
  },

  // ---------- Helfer ----------
  helpers() {
    const s = PF.S;
    const sk = PF.SHOPKEEPER;
    const shopCard = `<div class="tile r1 ${s.shopkeeper ? 'equipped' : ''}">${ic('skins/1_idle_f')}<div class="tname">${sk.name}</div><div class="tsub">Übergibt Tränke automatisch an Kunden und verkauft Überschuss an Laufkundschaft.</div>
      ${s.shopkeeper ? '<button disabled>Angestellt ✓</button>' : s.level < sk.unlock ? `<button disabled>🔒 Level ${sk.unlock}</button>` : `<button data-shopkeeper="1">${PF.costText(sk.cost)}</button>`}</div>`;
    const p = PF.UI.openPanel(`<h2>${ic('helpers/0_4')} Helfer</h2><p class="small">Helfer ernten reife Pflanzen automatisch und pflanzen nach. Höhere Seltenheit = schneller. Der Laden-Gnom automatisiert den Verkauf.</p>
      <div class="grid chests">${shopCard}${PF.HELPERS.map(h => {
        const owned = s.helpers.filter(x => x.id === h.id).length, locked = s.level < (h.unlock || 1);
        return `<div class="tile r${h.r}">${ic(`helpers/${h.row}_4`)}<div class="tname">${h.name}</div><div class="tsub">${PF.RARITY[h.r].name} · Tempo ${h.speed} · ${owned}× im Einsatz</div>
          ${locked ? `<button disabled>🔒 Level ${h.unlock}</button>` : `<button data-helper="${h.id}">${PF.costText(PF.Garden.helperCost(h.id))}</button>`}</div>`;
      }).join('')}</div>`);
    p.querySelectorAll('[data-helper]').forEach(b => b.onclick = () => { PF.Garden.buyHelper(b.dataset.helper); this.refresh(); });
    p.querySelectorAll('[data-shopkeeper]').forEach(b => b.onclick = () => { PF.Shop.hireShopkeeper(); this.refresh(); });
  },

  // ---------- Handwerk (Alchemietisch) ----------
  craft() {
    const s = PF.S, it = s.inv.items;
    const raws = PF.CROPS.filter(c => it['raw:' + c.id] > 0);
    const recs = PF.POTIONS.filter(p => PF.Factory.usable(p));
    const bar = (k) => `<div class="bar sm"><div class="fill" style="width:${(PF.Craft.prog[k] || 0) * 100}%"></div></div>`;
    const p = PF.UI.openPanel(`<h2>${ic('shop/2_1')} Alchemietisch</h2>
      <p class="small">Hier arbeitest du von Hand: Ernte zermahlen, dann Tränke brauen (kostet 1 Wasser). Später übernehmen Mörser, Kessel und Abfüller das automatisch.</p>
      <h3>1 · Mörsern <span class="small">(${PF.CRAFT.grindClicks} Klicks pro Pulver)</span></h3>
      ${raws.length ? `<div class="grid items">${raws.map(c => `<div class="tile r${c.rarity}" data-info="item:raw:${c.id}">${ic(c.icon)}<div class="tname">${c.name}</div><div class="tsub">${it['raw:' + c.id]}× im Vorrat</div>${bar('g:' + c.id)}<button data-grind="${c.id}">Mörsern</button></div>`).join('')}</div>` : '<p class="small">Keine Ernte im Vorrat – ernte erst die Mondblüten im Garten.</p>'}
      <h3>2 · Brauen <span class="small">(${PF.CRAFT.brewClicks} Klicks · 1 Wasser · Wasser: ${Math.floor(s.water || 0)})</span></h3>
      <div class="grid items">${recs.map(r => { const ok = PF.Craft.canBrew(r); return `<div class="tile r${r.r} ${ok ? '' : 'empty'}" data-info="potion:${r.id}">${ic(r.icon)}<div class="tname">${r.name}</div><div class="tsub">${Object.entries(r.in).map(([c, n]) => `${it['pow:' + c] || 0}/${n} ${PF.CROP[c].powderName || PF.CROP[c].name}`).join(' · ')}</div>${bar('b:' + r.id)}<button data-brew="${r.id}" ${ok ? '' : 'disabled'}>Brauen</button></div>`; }).join('')}</div>
      <p class="small">Fertige Tränke liegen im Vorrat – übergib sie rechts an die Kunden.</p>`, 'wide');
    p.querySelectorAll('[data-grind]').forEach(b => b.onclick = () => { PF.Craft.grind(b.dataset.grind); this.refresh(); });
    p.querySelectorAll('[data-brew]').forEach(b => b.onclick = () => { PF.Craft.brew(b.dataset.brew); this.refresh(); });
  },

  // ---------- Baumeister ----------
  builders() {
    const s = PF.S, n = s.builders || 1, busy = Object.values(s.ents).filter(e => e.build);
    const next = n < PF.BUILDERS.max ? PF.BUILDERS.cost[n + 1] : null;
    const p = PF.UI.openPanel(`<h2>${ic('construct/0_1')} Baumeister</h2>
      <p>Jeder Bau, jede Aufwertung und jedes Freiräumen braucht einen freien Baumeister. Du hast <b>${n}</b> (${PF.Build.free()} frei).</p>
      ${busy.length ? `<h3>Laufende Baustellen</h3><div class="achlist">${busy.map(e => `<div class="ach">${ic(e.type === 'obstacle' ? (e.kind === 'tree' ? 'trees' : 'rocks') + '/0_' + (e.size - 1) : 'construct/0_0')}<div class="ab"><b>${PF.Build.name(e)}</b><span class="small">noch ${PF.U.fmtTime(PF.Build.left(e))}</span></div><button class="up" data-skip="${e.id}">⏩ ${PF.Build.skipCost(e) ? PF.costText({ moonstone: PF.Build.skipCost(e) }) : 'gratis'}</button></div>`).join('')}</div>` : '<p class="small">Gerade keine Baustellen.</p>'}
      ${next ? `<h3>Weiteren Baumeister anheuern</h3><button class="big ok" id="buyB">Baumeister Nr. ${n + 1} ${PF.costText({ moonstone: next })}</button>` : '<p>Alle 5 Baumeister sind bei dir!</p>'}`);
    p.querySelectorAll('[data-skip]').forEach(b => b.onclick = () => { PF.Build.skip(s.ents[b.dataset.skip]); this.refresh(); });
    const bb = p.querySelector('#buyB'); if (bb) bb.onclick = () => { PF.Build.buyBuilder(); this.refresh(); };
  },

  // ---------- Biome ----------
  biomes() {
    const s = PF.S;
    const p = PF.UI.openPanel(`<h2>${ic('biome_props/1_0')} Biome</h2>
      <p class="small">Neue Gebiete unterhalb deiner Anlage. Jedes Biom lässt bestimmte Pflanzen schneller wachsen und hat ein Wahrzeichen mit dauerhaftem Bonus. Beete, Sprinkler, Deko und Maschinen sind dort erlaubt – Teleporter verbinden Biome mit der Fabrik.</p>
      <div class="biomes">${PF.BIOMES.map(b => {
        const own = s.biomes[b.id], lvlOk = s.level >= b.unlock.level;
        const crops = Object.entries(b.crops).map(([c, m]) => `<span class="bcrop">${ic(PF.CROP[c].icon)}${PF.CROP[c].name} ×${m}</span>`).join('');
        return `<div class="biome ${own ? 'own' : ''}" style="--bc:${b.light}">
          <div class="bimg">${ic(`biome_tiles/${b.row}_1`, 'bground')}${ic(b.landmark.s, 'blm')}</div>
          <div class="binfo"><h3>${b.name}</h3><p class="small">${b.desc}</p>
            <div class="bcrops">${crops}</div>
            <p class="bperk">${ic(b.landmark.s, 'inl')} ${b.landmark.name}: <b>${b.perk.text}</b></p></div>
          <div class="bact">${own ? `<button data-go="${b.id}">Hinreisen</button>` : !lvlOk ? `<button disabled>🔒 Level ${b.unlock.level}</button>` : `<button class="big" data-unlock="${b.id}">Freischalten<br>${PF.costText(b.unlock.cost)}</button>`}</div>
        </div>`;
      }).join('')}</div>`, 'wide');
    p.querySelectorAll('[data-unlock]').forEach(btn => btn.onclick = () => {
      const b = PF.BIOME[btn.dataset.unlock];
      if (!PF.Game.pay(b.unlock.cost)) { PF.UI.toast('Nicht genug Währung', '#ff8080'); return; }
      s.biomes[b.id] = true;
      PF.UI.closePanel();
      const c = PF.World.zoneCenter(b.id);
      PF.Cam.focus(c.x, c.y);
      PF.UI.bigBanner(b.name.toUpperCase(), `freigeschaltet! ${b.perk.text}`, b.light);
      PF.Audio.sfx('legendary'); PF.Audio.playSting('reward', 9);
      setTimeout(() => { PF.FX.confetti(c.x, c.y - 100, 90); PF.FX.shake(10, 0.5); }, 700);
      PF.UI.dirty();
    });
    p.querySelectorAll('[data-go]').forEach(btn => btn.onclick = () => { const c = PF.World.zoneCenter(btn.dataset.go); PF.Cam.focus(c.x, c.y); PF.UI.closePanel(); });
  },

  // ---------- Forschung ----------
  research() {
    const s = PF.S;
    const t = this.tabs('res', [['recipes', 'Rezepte'], ['seeds', 'Seltene Samen']]);
    let body = '';
    if (t.cur === 'recipes') {
      const list = PF.POTIONS.filter(p => !p.boss && p.r >= 2);
      body = `<p class="small">Seltene, epische und legendäre Rezepte werden mit Sternenstaub erforscht. Sternenstaub gibt es für seltene Tränke, Aufträge und in Truhen.</p>
      <div class="grid items">${list.map(p => {
        const done = s.recipes[p.id], locked = s.level < p.unlock;
        return `<div class="tile r${p.r} ${done ? 'equipped' : locked ? 'empty' : ''}" data-info="potion:${p.id}">${ic(p.icon)}<div class="tname">${p.name}</div>
          <div class="tsub">${Object.entries(p.in).map(([c, n]) => `${n}× ${PF.CROP[c].name}`).join(', ')}</div><div class="tsub">${PF.U.fmt(p.value)} Gold</div>
          ${done ? '<button disabled>Erforscht ✓</button>' : locked ? `<button disabled>🔒 Level ${p.unlock}</button>` : `<button data-research="${p.id}">${PF.costText({ stardust: p.research })}</button>`}</div>`;
      }).join('')}</div>`;
    } else {
      body = `<div class="grid items">${PF.CROPS.filter(c => c.seedItem).map(c => {
        const locked = s.level < c.unlock;
        return `<div class="tile r${c.rarity} ${locked ? 'empty' : ''}" data-info="crop:${c.id}">${ic(c.icon)}<div class="tname">${c.name}</div><div class="tsub">Vorrat: ${s.inv.seeds[c.id] || 0}</div>
          ${locked ? `<button disabled>🔒 Level ${c.unlock}</button>` : `<button data-seed="${c.id}">5 Samen ${PF.costText({ stardust: c.seedStardust * 5 })}</button>`}</div>`;
      }).join('')}</div>`;
    }
    const p = PF.UI.openPanel(`<h2>${ic('ui/2_0')} Forschung</h2>${t.html}${body}`, 'wide');
    this.bind(p);
    p.querySelectorAll('[data-research]').forEach(b => b.onclick = () => { PF.Progress.research(b.dataset.research); this.refresh(); });
    p.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => { PF.Progress.buySeeds(b.dataset.seed, 5); this.refresh(); });
  },

  // ---------- Album ----------
  album() {
    const s = PF.S;
    const per = PF.RARITY.map((r, i) => { const all = PF.POTIONS.filter(p => p.r === i && !p.boss); return { all: all.length, got: all.filter(p => s.album[p.id]).length }; });
    const total = Object.keys(s.album).length;
    const p = PF.UI.openPanel(`<h2>${ic('ui/1_2')} Trank-Album</h2>
      <div class="albumbar"><div class="bar"><div class="fill" style="width:${total / PF.POTIONS.length * 100}%"></div></div><span>${total} / ${PF.POTIONS.length} entdeckt</span></div>
      <div class="rarsum">${PF.RARITY.map((r, i) => `<span style="color:${r.color}">${r.name}: ${per[i].got}/${per[i].all}</span>`).join('')}</div>
      <div class="grid album">${PF.POTIONS.map(pt => {
        const n = s.album[pt.id];
        return `<div class="tile r${pt.r} ${n ? '' : 'unknown'}" title="${n ? pt.name : '???'}" ${n ? `data-info="potion:${pt.id}"` : ''}>${ic(pt.icon)}<div class="tname">${n ? pt.name : '???'}</div><div class="tsub">${n ? n + '× gebraut' : PF.RARITY[pt.r].name}</div></div>`;
      }).join('')}</div>`, 'wide');
  },

  // ---------- Erfolge ----------
  achievements() {
    const s = PF.S;
    const groups = {};
    PF.ACHIEVEMENTS.forEach(a => { const k = a.id.split('_')[0]; (groups[k] = groups[k] || []).push(a); });
    const p = PF.UI.openPanel(`<h2>${ic('ui/1_1')} Erfolge</h2><div class="achlist">${Object.values(groups).map(list => {
      const a = list.find(x => s.ach[x.id] !== 'claimed') || list[list.length - 1];
      const st = s.ach[a.id];
      const v = PF.Progress.statValue(a.stat), pct = Math.min(1, v / a.goal);
      return `<div class="ach r${a.r} ${st || ''}">${ic(a.badge)}<div class="ab"><b>${a.name}</b><span>${a.desc}</span>
        <div class="bar sm"><div class="fill" style="width:${pct * 100}%"></div></div><span class="small">${PF.U.fmt(v)} / ${PF.U.fmt(a.goal)}</span></div>
        ${st === 'done' ? `<button data-claim="${a.id}">${PF.costText(a.reward)} Abholen</button>` : st === 'claimed' ? '<span class="max">✓ Alle</span>' : `<span class="small">${PF.costText(a.reward)}</span>`}</div>`;
    }).join('')}</div>`, 'wide');
    p.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => { PF.Progress.claimAchievement(b.dataset.claim); this.refresh(); });
  },

  // ---------- Daily ----------
  daily() {
    const d = PF.S.daily, ready = PF.Progress.dailyReady();
    const p = PF.UI.openPanel(`<h2>${ic('ui/1_0')} Täglicher Bonus</h2><p>Komm jeden Tag wieder! Streak: <b>${d.streak} Tag(e)</b> ${ic('ui/0_5', 'inl')}</p>
      <div class="daily">${PF.DAILY.map((r, i) => `<div class="day ${i < d.day ? 'got' : ''} ${i === d.day && ready ? 'today' : ''}"><div class="dn">Tag ${i + 1}</div>${ic(r.icon)}<div class="dl">${r.label}</div></div>`).join('')}</div>
      <button class="big" id="dClaim" ${ready ? '' : 'disabled'}>${ready ? 'Abholen!' : 'Morgen wieder'}</button>`);
    const b = p.querySelector('#dClaim');
    if (ready) b.onclick = () => { PF.Progress.claimDaily(); this.refresh(); };
  },

  // ---------- Prestige ----------
  prestige() {
    const s = PF.S, gain = PF.Progress.soulGain(), ok = s.level >= PF.PRESTIGE.minLevel && gain > 0;
    const p = PF.UI.openPanel(`<h2>${ic('ui/1_3')} Wiedergeburt</h2>
      <p>Setze Fabrik, Garten, Gold, Level und Wellen zurück und erhalte <b style="color:#6dffa8">Seelenessenz</b>. Jede Essenz gibt dauerhaft +${PF.PRESTIGE.bonusPerSoul * 100}% Gold und +1% Tempo.</p>
      <p>Du behältst: Mondsteine, Sternenstaub, Boss-Siegel, Werkzeuge, Pets, Skins, Rezepte, Album, Erfolge – und bekommst eine Runentruhe.</p>
      <div class="prest">${ic('currency/3_3')}<div><div class="big-num">+${gain}</div><div class="small">Seelenessenz (aktuell ${s.cur.soul})</div></div></div>
      ${s.level < PF.PRESTIGE.minLevel ? `<p class="small">Verfügbar ab Level ${PF.PRESTIGE.minLevel}.</p>` : ''}
      <button class="big ${ok ? '' : ''}" id="prBtn" ${ok ? '' : 'disabled'}>Wiedergeboren werden</button>`);
    if (ok) p.querySelector('#prBtn').onclick = () => PF.UI.confirm('Wiedergeburt?', 'Fabrik, Garten, Gold und Level werden zurückgesetzt. Du erhältst Seelenessenz und behältst deine Sammlung.', 'Wiedergeboren werden', () => { PF.UI.closePanel(); PF.Progress.prestige(); });
  },

  // ---------- Optionen ----------
  settings() {
    const a = PF.Audio.settings;
    const p = PF.UI.openPanel(`<h2>${ic('ui/4_0')} Optionen</h2>
      <label class="slider">Musik <input type="range" min="0" max="1" step="0.05" value="${a.music}" id="sMus"></label>
      <label class="slider">Effekte <input type="range" min="0" max="1" step="0.05" value="${a.sfx}" id="sSfx"></label>
      <label class="check"><input type="checkbox" id="sMute" ${a.muted ? 'checked' : ''}> Alles stumm</label>
      <label class="slider">Haupt-Musik <select id="sTrack">${[['garden', 'Forest of Quiet Moon'], ['title', 'Moonlit Hollow'], ['shop', 'Lantern Waltz'], ['factory', 'Clockwork Cauldron']].map(([k, n]) => `<option value="${k}" ${a.mainTrack === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="check"><input type="checkbox" id="sStings" ${a.stings ? 'checked' : ''}> Belohnungs-Jingle bei Level-Up & Truhen</label>
      <h3>Tutorial</h3><button id="sTut">Tutorial neu starten</button>
      <h3>Steuerung</h3>
      <p class="small">Ziehen = Kamera bewegen · Mausrad = Zoom · WASD/Pfeile = scrollen · 1/2/3 = Garten/Fabrik/Laden · R = drehen · X = Abriss · Esc = abbrechen · Förderbänder beim Bauen einfach ziehen.</p>
      <h3>Spielstand</h3>
      <p class="small">Wird automatisch alle 15 Sekunden im Browser gespeichert.</p>
      <button id="sSave">Jetzt speichern</button> <button class="danger" id="sReset">Spielstand löschen</button>`);
    p.querySelector('#sMus').oninput = (e) => { a.music = +e.target.value; };
    p.querySelector('#sSfx').oninput = (e) => { a.sfx = +e.target.value; PF.Audio.sfx('click'); };
    p.querySelector('#sMute').onchange = (e) => { a.muted = e.target.checked; };
    p.querySelector('#sTrack').onchange = (e) => { a.mainTrack = e.target.value; };
    p.querySelector('#sStings').onchange = (e) => { a.stings = e.target.checked; };
    p.querySelector('#sTut').onclick = () => { PF.UI.closePanel(); PF.Tutorial.start(true); };
    p.querySelector('#sSave').onclick = () => { PF.Save.save(); PF.UI.toast('Gespeichert', '#9f9'); };
    p.querySelector('#sReset').onclick = () => PF.UI.confirm('Spielstand löschen?', 'Alles wird unwiderruflich gelöscht: Level, Gold, Sammlung, Erfolge. Danach startet das Spiel neu.', 'Endgültig löschen', () => { PF.noSave = true; PF.Save.wipe(); localStorage.removeItem('mondkessel.backup'); location.reload(); }, true);
  },
};
