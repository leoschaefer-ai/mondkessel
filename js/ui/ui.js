// HUD, Bau-Werkzeug, Inspektor, Toasts, Overlays
window.PF = window.PF || {};

const ic = (key, cls = '') => `<img class="${cls}" src="${PF.Assets.url(key)}" draggable="false">`;
PF.ic = ic;

PF.UI = {
  tool: { mode: 'select', type: null, dir: 0, decor: null },
  selected: null,
  _dirty: true,
  _t: 0,
  buildTab: 'garden',

  dirty() { this._dirty = true; },

  init() {
    const root = document.getElementById('ui');
    root.innerHTML = `
      <div class="hud-top">
        <div class="lvl frame thin" id="hudLvl" data-info="level" title="Level & Erfahrung – klicken für Erklärung">
          <div class="lvl-badge">${ic('ui/0_3')}<span id="lvlNum">1</span></div>
          <div class="xpwrap"><div class="bar"><div class="fill" id="xpFill"></div></div><div class="xptext" id="xpText"></div></div>
        </div>
        <div class="mid-top">
          <div class="curs" id="curs">${PF.CURRENCY_ORDER.map(k => `<div class="cur" data-cur="${k}" data-info="cur:${k}" title="${PF.CURRENCIES[k].name} – klicken für Erklärung">${ic(PF.CURRENCIES[k].icon)}<span>0</span></div>`).join('')}<div class="cur builders" id="builderChip" title="Baumeister: freie / gesamt. Klicken für mehr Baumeister.">${ic('construct/0_3')}<span>1/1</span></div><div class="cur water" id="waterChip" data-info="water" title="Wasser – klicken für Erklärung">${ic('ingredients/5_1')}<span>0</span><div class="wbar"><i></i></div></div></div>
        </div>
        <div class="wave frame thin" id="hudWave" data-info="wave" title="Kunden-Wellen – klicken für Erklärung">
          <div class="wave-head">${ic('ui/5_2')}<span id="waveLbl">Welle 1</span><span id="bossInfo"></span></div>
          <div class="bar"><div class="fill" id="waveFill"></div></div>
          <div class="combo" id="combo"></div>
        </div>
      </div>
      <div class="menu-left frame thin" id="menu"></div>
      <div class="rightcol frame thin" id="rightcol">
        <div class="rhead"><span id="ordToggle" title="Aufträge ein-/ausklappen">✦ Aufträge <b id="ordCount"></b> <i id="ordArrow">▾</i></span><button id="deliverAll" title="Alle möglichen Tränke übergeben">Alle übergeben</button></div>
        <div class="orders" id="orders"></div>
        <div class="surplus hidden" id="surplus"></div>
        <div class="teaser" id="teaser"></div>
      </div>
      <div class="inspector hidden" id="inspector"></div>
      <div class="buildbar frame thin" id="buildbar"></div>
      <div class="mapnav" id="zones"></div>
      <div class="tip hidden" id="tip"></div>
      <div id="safeProbe" style="position:fixed;inset:0;visibility:hidden;pointer-events:none;z-index:-1;padding:var(--sat) var(--sar) var(--sab) var(--sal)"></div>
      <div class="floatbar hidden" id="buildFloat"></div>
      <div class="floatbar hidden" id="selFloat"></div>
      <div class="toasts" id="toasts"></div>
      <div class="panel-wrap hidden" id="panelWrap"><div class="panel frame" id="panel"></div></div>
      <div class="overlay hidden" id="overlay"></div>
      <div class="panel-wrap confirm-wrap hidden" id="confirmWrap"><div class="panel frame confirm" id="confirmBox"></div></div>
    `;
    this.$ = (id) => document.getElementById(id);
    this.buildMenu();
    this.buildZones();
    this.buildBuildBar();
    PF.Info.init();
    this.$('builderChip').onclick = () => PF.Panels.open('builders');
    this.$('ordToggle').onclick = () => { this.$('rightcol').classList.toggle('collapsed'); this.$('ordArrow').textContent = this.$('rightcol').classList.contains('collapsed') ? '▸' : '▾'; PF.Audio.sfx('click'); };
    if (innerWidth < 820 || innerHeight < 520) { this.$('rightcol').classList.add('collapsed'); this.$('ordArrow').textContent = '▸'; }
    this.$('deliverAll').onclick = () => PF.Shop.walkDeliver(null);
    this.$('panelWrap').addEventListener('pointerdown', (e) => { if (e.target.id === 'panelWrap') this.closePanel(); });
  },

  // ---------- Linkes Menü ----------
  MENU: [
    { id: 'chests', icon: 'chests/2_0', label: 'Truhen' },
    { id: 'inventory', icon: 'ui/5_3', label: 'Inventar' },
    { id: 'shop', icon: 'ui/4_5', label: 'Laden' },
    { id: 'treasury', icon: 'pchests/4_0', label: 'Schatzkammer', cls: 'gold' },
    { id: 'helpers', icon: 'helpers/0_4', label: 'Helfer' },
    { id: 'research', icon: 'ui/2_0', label: 'Forschung' },
    { id: 'biomes', icon: 'biome_props/1_0', label: 'Biome' },
    { id: 'album', icon: 'ui/1_2', label: 'Album' },
    { id: 'achievements', icon: 'ui/1_1', label: 'Erfolge' },
    { id: 'daily', icon: 'ui/1_0', label: 'Täglich' },
    { id: 'prestige', icon: 'ui/1_3', label: 'Wiedergeburt' },
    { id: 'settings', icon: 'ui/4_0', label: 'Optionen', cls: 'bottom' },
  ],
  buildMenu() {
    this.$('menu').innerHTML = '<div class="quest" id="quest"></div>' + this.MENU.map(m => `<button class="mbtn ${m.cls || ''} ${m.label.length > 10 ? 'long' : ''}" data-panel="${m.id}" data-label="${m.label}" aria-label="${m.label}">${ic(m.icon)}<span>${m.label}</span><i class="dot" id="dot_${m.id}"></i></button>`).join('');
    this.$('menu').querySelectorAll('.mbtn').forEach(b => b.onclick = () => { PF.Audio.sfx('click'); PF.Panels.open(b.dataset.panel); });
  },
  buildZones() {
    this.$('zones').innerHTML = PF.World.ZONES.map((z, i) => `<button data-z="${z.id}"><i class="znum">${i + 1}</i> ${z.name}</button>`).join('') + '<button data-z="biomes"><i class="znum">4</i> Biome</button><button class="ztoggle" id="zToggle" title="Orte">⌖</button><button data-zoom="out" title="Rauszoomen (−)">−</button><button data-zoom="in" title="Reinzoomen (+)">+</button><button data-zoom="all" title="Ganze Welt (0)">⊙<span class="ztxt"> Übersicht</span></button>';
    this.$('zones').querySelectorAll('button').forEach(b => b.onclick = () => {
      PF.Audio.sfx('click');
      if (b.id === 'zToggle') { this.$('zones').classList.toggle('zopen'); return; }
      this.$('zones').classList.remove('zopen');
      const zm = b.dataset.zoom;
      if (zm === 'in') return PF.Cam.zoomTo(PF.Cam.zoom * 1.35);
      if (zm === 'out') return PF.Cam.zoomTo(PF.Cam.zoom / 1.35);
      if (zm === 'all') return PF.Cam.overview();
      const c = PF.World.zoneCenter(b.dataset.z); PF.Cam.focus(c.x, c.y);
      if (PF.Cam.zoom < 0.6) PF.Cam.zoomTo(0.85);
    });
  },

  // ---------- Bau-Leiste ----------
  BUILD_TABS: { garden: ['plot', 'sprinkler', 'well', 'rainbarrel'], factory: ['belt', 'tank', 'collector', 'mortar', 'mill', 'cauldron', 'distillery', 'bottler', 'labeler', 'sorter', 'seller', 'storage'], special: ['desk', 'recycler', 'condenser', 'runes', 'teleporter', 'forge', 'infuser', 'frost', 'mixer', 'ghost', 'soul'], decor: [] },
  buildBuildBar() {
    const t = this.tool;
    const tabs = [['garden', 'Garten'], ['factory', 'Fabrik'], ['special', '✦ Spezial'], ['decor', 'Deko']];
    let items = '';
    if (this.buildTab === 'decor') {
      items = PF.DECOR.map(d => {
        const locked = PF.S.level < d.unlock;
        return `<button class="bitem r${d.r} ${t.decor === d.id ? 'on' : ''} ${locked ? 'locked' : ''}" data-decor="${d.id}" title="${d.name}: +${Math.round(d.bonus * 100)}% Gold">
          ${ic(d.sprite)}<div class="bcost">${locked ? '🔒 Lv ' + d.unlock : PF.costText(d.cost)}</div></button>`;
      }).join('');
    } else {
      // feste Grundgebäude + alle Erweiterungs-Maschinen dieser Kategorie, nach Freischalt-Level sortiert
      const base = this.BUILD_TABS[this.buildTab];
      const extra = Object.keys(PF.BUILD).filter(k => PF.BUILD[k].buildTime && PF.BUILD[k].cat === this.buildTab && !base.includes(k));
      const list = base.concat(extra).sort((a, b) => (PF.BUILD[a].unlock || 0) - (PF.BUILD[b].unlock || 0));
      items = list.map(k => {
        const d = PF.BUILD[k], locked = PF.S.level < d.unlock;
        return `<button class="bitem ${t.type === k && t.mode === 'build' ? 'on' : ''} ${locked ? 'locked' : ''}" data-type="${k}" title="${d.name}: ${d.desc}">
          ${ic(d.icon)}<div class="bname">${d.name}</div><div class="bcost">${locked ? '🔒 Level ' + d.unlock : PF.costText(PF.Game.buildCost(k)) + (PF.Build.newSecs(k) ? ' ⏱' + PF.U.fmtTime(PF.Build.newSecs(k)) : '')}</div></button>`;
      }).join('');
    }
    this.$('buildbar').innerHTML = `
      <div class="btabs">${tabs.map(([id, n]) => `<button class="${this.buildTab === id ? 'on' : ''}" data-tab="${id}">${n}</button>`).join('')}
        <span class="sep"></span>
        <span class="bhint">${t.mode === 'build' ? 'R = drehen · Rechtsklick / Esc = fertig' : t.mode === 'demolish' ? 'Klicken oder ziehen zum Abreißen · Esc = fertig' : 'Gebäude anklicken, dann auf die Karte setzen'}</span>
        ${t.mode !== 'select' ? '<button class="on" data-mode="select" title="Fertig (Esc)">✓ Fertig</button>' : ''}
        <button class="${t.mode === 'demolish' ? 'on danger' : 'danger'}" data-mode="demolish" title="Abreißen (X)">✖ Abriss</button>
      </div>
      <div class="bitems">${items}</div>`;
    const bb = this.$('buildbar');
    const bi = bb.querySelector('.bitems'); if (bi) { bi.scrollLeft = this._biScroll || 0; bi.onscroll = () => { this._biScroll = bi.scrollLeft; }; bi.onwheel = (ev) => { if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { bi.scrollLeft += ev.deltaY; ev.preventDefault(); } }; }
    bb.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { this.buildTab = b.dataset.tab; this.buildBuildBar(); PF.Audio.sfx('click'); });
    bb.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
      const m = b.dataset.mode;
      if (m === 'rotate') this.rotate();
      else this.setMode(m);
    });
    bb.querySelectorAll('[data-type]').forEach(b => b.onclick = () => {
      const k = b.dataset.type;
      if (PF.S.level < PF.BUILD[k].unlock) { this.toast(`${PF.BUILD[k].name} ab Level ${PF.BUILD[k].unlock}`, '#ff8080'); return; }
      this.tool = { mode: 'build', type: k, dir: this.tool.dir, decor: null };
      this.select(null); this.buildBuildBar(); PF.Audio.sfx('click');
    });
    bb.querySelectorAll('[data-decor]').forEach(b => b.onclick = () => {
      const d = PF.DECOR.find(q => q.id === b.dataset.decor);
      if (PF.S.level < d.unlock) { this.toast(`Ab Level ${d.unlock}`, '#ff8080'); return; }
      this.tool = { mode: 'build', type: 'decor', dir: 0, decor: d.id };
      this.select(null); this.buildBuildBar(); PF.Audio.sfx('click');
    });
  },
  setMode(m) { this.tool = { mode: m, type: null, dir: this.tool.dir, decor: null }; this.buildBuildBar(); PF.Audio.sfx('click'); },
  rotate() {
    if (this.tool.mode === 'build') this.tool.dir = (this.tool.dir + 1) % 4;
    else if (this.selected && (this.selected.type === 'belt' || this.selected.type === 'machine')) { this.selected.dir = (this.selected.dir + 1) % 4; this.showInspector(); }
    PF.Audio.sfx('click');
  },

  // ---------- Platzieren ----------
  canPaint() { return (this.tool.mode === 'build' && (this.tool.type === 'belt' || this.tool.type === 'plot')) || this.tool.mode === 'demolish'; },
  paint(wx, wy, first) {
    const T = PF.TILE, x = Math.floor(wx / T), y = Math.floor(wy / T);
    if (first) { this._stroke = null; this._painted = false; }
    if (this._stroke && this._stroke.x === x && this._stroke.y === y) return;
    if (this.tool.mode === 'demolish') { const e = PF.World.ent(x, y); if (e) { this.demolish(e); this._painted = true; } this._stroke = { x, y }; return; }
    let dir = this.tool.dir;
    const prev = this._stroke;
    if (this.tool.type === 'belt' && prev && Math.abs(prev.x - x) + Math.abs(prev.y - y) === 1) {
      dir = x > prev.x ? 0 : y > prev.y ? 1 : x < prev.x ? 2 : 3;
      const pe = PF.World.ent(prev.x, prev.y);
      if (pe && pe.type === 'belt' && prev.placed) pe.dir = dir;
      this.tool.dir = dir;
    }
    const placed = this.tryBuild(x, y, dir, !first);
    this._stroke = { x, y, placed };
    if (placed) this._painted = true;
  },
  endPaint() { setTimeout(() => { this._stroke = null; this._painted = false; }, 0); },

  tryBuild(x, y, dir, quiet) {
    const t = this.tool;
    if (t.type === 'decor') {
      const d = PF.DECOR.find(q => q.id === t.decor);
      const c = PF.World.canPlace('plot', x, y);
      if (!c.ok) { if (!quiet) this.toast(c.why, '#ff8080'); return false; }
      if (!PF.Game.pay(d.cost)) { if (!quiet) this.toast('Nicht genug Währung', '#ff8080'); return false; }
      PF.World.place('decor', x, y, { decor: d.id });
      this.afterBuild(x, y); return true;
    }
    const c = PF.World.canPlace(t.type, x, y);
    if (!c.ok) { if (!quiet) { this.toast(c.why, '#ff8080'); PF.Audio.sfx('error'); } return false; }
    const secs = PF.Build.newSecs(t.type);
    if (secs > 0 && !PF.Build.needBuilder()) return false;
    const cost = PF.Game.buildCost(t.type);
    if (!PF.Game.pay(cost)) { if (!quiet) this.toast('Zu wenig Gold', '#ff8080'); return false; }
    const e = PF.World.place(t.type, x, y, { dir });
    PF.Build.start(e, 'new', secs);
    if (t.type === 'plot' && PF.S.level >= 1) { PF.Garden.plant(e, PF.S.lastCrop || 'moonpetal', true); }
    this.afterBuild(x, y);
    // Maschinen: Baumodus endet, die neue Maschine ist ausgewählt (Bänder/Beete bleiben im Baumodus)
    if (e.type === 'machine') { this.tool = { mode: 'select', type: null, dir: this.tool.dir, decor: null }; this.buildBuildBar(); this.select(e); }
    return true;
  },
  afterBuild(x, y) {
    PF.S.stats.built++;
    PF.Audio.sfx('place');
    PF.FX.burst((x + 0.5) * PF.TILE, (y + 0.6) * PF.TILE, '#d9c2ff', 10, 70);
    this.buildBuildBar();
  },
  demolish(e) {
    if (e.type === 'obstacle') { this.toast(`${PF.OBSTACLES[e.kind].verb} kostet Gold – klicke es an.`, '#e0b080'); return; }
    if (e.kind === 'workbench') { this.toast('Der Alchemietisch bleibt stehen', '#e0b080'); return; }
    if (e.type === 'machine' && PF.kindOf(e) === 'seller' && Object.values(PF.S.ents).filter(q => PF.kindOf(q) === 'seller').length <= 1) { this.toast('Der letzte Verkaufsschacht bleibt stehen', '#ff8080'); return; }
    const kind = e.type === 'machine' ? e.kind : e.type;
    if (PF.BUILD[kind]) PF.Game.addGold(PF.BUILD[kind].cost * 0.5);
    if (e.type === 'belt' && e.item && (e.item.t === 'raw' || e.item.t === 'pow')) PF.Game.addItem(e.item.t + ':' + e.item.id);
    PF.World.remove(e);
    PF.FX.burst((e.x + 0.5) * PF.TILE, (e.y + 0.5) * PF.TILE, '#888', 12, 90);
    PF.Audio.sfx('place');
    if (this.selected === e) this.select(null);
    this.buildBuildBar();
  },

  onTap(wx, wy) {
    const T = PF.TILE, x = Math.floor(wx / T), y = Math.floor(wy / T);
    if (this._painted) { this._painted = false; return; }
    if (this.tool.mode === 'build') { this.tryBuild(x, y, this.tool.dir); return; }
    if (this.tool.mode === 'demolish') { const e = PF.World.ent(x, y); if (e) this.demolish(e); return; }
    // Kunden anklicken?
    for (const o of PF.S.wave.orders) {
      if (o.state === 'wait' && Math.abs(o.x - wx / T) < 0.7 && wy / T < o.y + 0.2 && wy / T > o.y - (o.boss ? 3.4 : 2.4)) { PF.Shop.walkDeliver(o); return; }
    }
    const z = PF.World.zoneAt(x, y);
    if (z.type === 'biome' && z.locked && y >= PF.BIOME_Y0) { PF.Panels.open('biomes'); return; }
    const e = PF.World.ent(x, y);
    if (!e) { this.select(null); return; }
    if (e.type === 'plot') { PF.Garden.click(e); this.select(e); return; }
    if (e.type === 'machine' && e.kind === 'workbench') { this.select(e); PF.Garden.go(e.x, e.y, () => PF.Panels.open('craft'), { key: 'workbench' }); return; }
    if (e.type === 'machine' && PF.kindOf(e) === 'well' && !e.build) PF.Garden.go(e.x, e.y, () => PF.Water.pump(e), { key: 'well' + e.id });
    else if (e.type === 'machine' && !e.build) PF.Garden.go(e.x, e.y, () => PF.Factory.boost(e), { key: 'boost' + e.id });
    this.select(e);
  },

  select(e) {
    this.selected = e;
    this._selKey = null;
    if (!e) { this.$('inspector').classList.add('hidden'); return; }
    this.showInspector();
  },

  // ---------- Inspektor ----------
  // Was eine Aufwertung konkret bringt: [Bezeichnung, jetzt, danach]
  upgradeRows(e, t) {
    const TS = PF.TIER_SPEED, n = t + 1, x = (v) => '×' + (+v.toFixed(2)).toLocaleString('de-DE');
    const kind = e.type === 'machine' ? PF.kindOf(e) : e.type, def = PF.BUILD[e.type === 'machine' ? e.kind : e.type] || {};
    const rows = [];
    if (e.type === 'plot') {
      rows.push(['Wachstum', x(TS[t] ** 0.6), x(TS[n] ** 0.6)]);
      rows.push(['Chance auf Extra-Ernte', `+${t * 12} %`, `+${n * 12} %`]);
      return rows;
    }
    if (e.type === 'belt') return [['Band-Tempo', x(TS[t] ** 0.7), x(TS[n] ** 0.7)]];
    if (def.water && def.water.regen) rows.push(['Wasser pro Sekunde', '+' + (def.water.regen * TS[t]).toFixed(2), '+' + (def.water.regen * TS[n]).toFixed(2)]);
    if (def.water && def.water.cap) rows.push(['Wasserspeicher', '+' + def.water.cap * (1 + t), '+' + def.water.cap * (1 + n)]);
    if (kind === 'well') rows.push(['Wasser pro Pumpen', '+' + Math.round(PF.WATER.pump * TS[t]), '+' + Math.round(PF.WATER.pump * TS[n])]);
    if (kind === 'sprinkler') rows.push(['Reichweite', `${(def.range || 1) + t} Felder`, `${(def.range || 1) + n} Felder`]);
    if (def.aura) {
      const r0 = (def.auraR || (def.aura === 'belt' ? 3 : 2));
      rows.push(['Aura-Reichweite', `${r0 + t} Felder`, `${r0 + n} Felder`]);
      if (def.aura === 'belt') rows.push(['Band-Bonus', `+${Math.round((1 + 0.25 * t) * 100)} %`, `+${Math.round((1 + 0.25 * n) * 100)} %`]);
      else rows.push([def.aura === 'grow' ? 'Wachstums-Bonus' : 'Maschinen-Bonus', `+${Math.round(((def.auraBonus || 0.4) + 0.2 * t) * 100)} %`, `+${Math.round(((def.auraBonus || 0.4) + 0.2 * n) * 100)} %`]);
    }
    if (e.type === 'machine' && !def.passive && !def.water && kind !== 'sprinkler' && !['seller', 'storage', 'sorter', 'teleporter'].includes(kind)) rows.push(['Arbeitstempo', x(TS[t]), x(TS[n])]);
    if (kind === 'condenser') rows.push(['Intervall', PF.U.fmtTime(def.time / TS[t]), PF.U.fmtTime(def.time / TS[n])]);
    if (kind === 'bottler' && n === 4) rows.push(['Chance auf Doppel-Flasche', '–', '20 %']);
    if (!rows.length) rows.push(['Optik & Prestige', PF.RARITY[t].name, PF.RARITY[n].name]);
    return rows;
  },
  upgradeBox(e, up) {
    const t = e.tier || 0, def = PF.BUILD[e.type === 'machine' ? e.kind : e.type];
    if (e.type === 'decor' || !def || def.noTiers) return '';
    if (t >= 4) return `<div class="ins-up max"><div class="iu-head">⭐ Höchste Stufe erreicht</div><div class="small">Legendär – stärker geht es nicht.</div></div>`;
    if (!up) return '';
    const secs = PF.Build.tierSecs(e), R = PF.RARITY[t + 1];
    return `<div class="ins-up">
      <div class="iu-head">⬆ Aufwerten auf <b style="color:${R.color}">${R.name}</b></div>
      <table class="iu-tab">${this.upgradeRows(e, t).map(([l, a, b]) => `<tr><td>${l}</td><td class="now">${a}</td><td class="arr">→</td><td class="next">${b}</td></tr>`).join('')}</table>
      <div class="iu-foot"><span class="small">${secs ? '⏱ ' + PF.U.fmtTime(secs) + ' · braucht einen Baumeister' : 'sofort fertig'}</span>
      <button class="up" id="insUp" ${PF.Game.can(up) ? '' : 'disabled'}>${PF.costText(up)}</button></div></div>`;
  },
  showInspector() {
    const e = this.selected, el = this.$('inspector');
    if (!e || !PF.S.ents[e.id]) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    if (e.type === 'obstacle' || e.build) { this.showBuildInspector(e, el); return; }
    const kind = e.type === 'machine' ? e.kind : e.type;
    const def = PF.BUILD[kind];
    const tier = e.tier || 0;
    let body = '', icon = def ? (e.type === 'machine' ? PF.Render.machineKey(e) : def.icon) : '';
    let title = def ? def.name : 'Deko';
    if (e.type === 'decor') { const d = PF.DECOR.find(q => q.id === e.decor); title = d.name; icon = d.sprite; body = `<p>+${Math.round(d.bonus * 100)}% Gold global</p>`; }
    if (e.type === 'plot') {
      icon = e.crop ? `${PF.CROP[e.crop].sheet}/${PF.CROP[e.crop].row}_${PF.Garden.stage(e)}` : 'tiles/0_3';
      body = e.crop ? `<p><b>${PF.CROP[e.crop].name}</b> – ${Math.round(e.growth * 100)}% ${e.water > 0 ? '💧 gegossen' : ''}</p>` : '<p>Leer</p>';
      body += `<div class="seedrow">${PF.CROPS.filter(c => PF.S.level >= c.unlock).map(c => `<button class="seed ${e.last === c.id ? 'on' : ''}" data-crop="${c.id}" title="${c.name}${c.seedItem ? ' (Samen: ' + (PF.S.inv.seeds[c.id] || 0) + ')' : ' – ' + c.seedCost + ' Gold'}">${ic(c.icon)}${c.seedItem ? `<i>${PF.S.inv.seeds[c.id] || 0}</i>` : ''}</button>`).join('')}</div>`;
    }
    if (e.type === 'machine') {
      body = `<p class="desc">${def.desc}</p>`;
      if (def.time) body += `<p>Tempo: ${(PF.Factory.machineSpeed(e)).toFixed(1)}× · Warteschlange ${e.inq.length}</p>`;
      if (PF.kindOf(e) === 'cauldron') {
        const opts = PF.POTIONS.filter(p => PF.Factory.usable(p));
        body += `<div class="recipes"><button class="rec ${e.recipe === 'auto' ? 'on' : ''}" data-rec="auto" title="Braut automatisch, was Kunden gerade brauchen">AUTO</button>${opts.map(p => `<button class="rec r${p.r} ${e.recipe === p.id ? 'on' : ''}" data-rec="${p.id}" title="${p.name}: ${Object.entries(p.in).map(([c, n]) => n + '× ' + PF.CROP[c].name).join(', ')} → ${p.value} Gold">${ic(p.icon)}</button>`).join('')}</div>`;
        const inside = Object.entries(e.have).map(([c, n]) => `${n}× ${PF.Factory.itemName('pow:' + c)}`).join(', ');
        body += `<p class="small">Im Kessel: ${inside || 'nichts'}</p>`;
      }
      if (PF.kindOf(e) === 'sprinkler') body += `<p>Reichweite: ${(def.range || 1) + tier} Felder · 0,5 Wasser pro Gießen</p>`;
      if (def.water) body += `<p>💧 ${def.water.regen ? '+' + (def.water.regen * PF.TIER_SPEED[tier]).toFixed(2) + '/s' : ''} ${def.water.cap ? ' · Speicher +' + def.water.cap * (1 + tier) : ''}</p>`;
      if (PF.kindOf(e) === 'well') body += `<p class="small">${e.cd > 0 ? 'Erholt sich: ' + Math.ceil(e.cd) + ' s' : 'Bereit zum Pumpen (+' + Math.round(PF.WATER.pump * PF.TIER_SPEED[tier]) + ')'}</p>`;
      if ((PF.kindOf(e) === 'cauldron' || PF.kindOf(e) === 'mixer') && e.noWater) body += `<p style="color:#ff9b8a">💧 Kein Wasser – der Kessel wartet!</p>`;
      if (def.aura) body += `<p>Aura-Reichweite: ${(def.aura === 'belt' ? 3 : 2) + tier} Felder</p>`;
      if (PF.kindOf(e) === 'condenser') body += `<p>Nächster Mondstein in ${PF.U.fmtTime((def.time - e.timer) / PF.Factory.machineSpeed(e))}</p>`;
      if (PF.kindOf(e) === 'mixer') body += `<p class="small">Braut immer automatisch. Im Mixer: ${Object.entries(e.have).map(([c, n]) => `${n}× ${PF.Factory.itemName('pow:' + c)}`).join(', ') || 'nichts'}</p>`;
      if (PF.kindOf(e) === 'sorter') {
        const f = e.filter || 'pot';
        const opts = [['raw', 'Alle Ernte'], ['pow', 'Alle Pulver'], ['brew', 'Alles Gebräu'], ['pot', 'Alle Tränke']]
          .concat(PF.CROPS.filter(c => PF.S.level >= c.unlock).map(c => ['c:' + c.id, '🌿 ' + c.name]))
          .concat(PF.POTIONS.filter(p => PF.Factory.usable(p)).map(p => ['p:' + p.id, '⚗ ' + p.name]));
        body += `<label class="small">Filter (geradeaus): <select id="insFilter">${opts.map(([v, n]) => `<option value="${v}" ${v === f ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
      }
    }
    if (e.type === 'belt') body = `<p class="desc">Tempo ${PF.Factory.beltSpeed(e).toFixed(1)} Felder/s. Ziehen zum Bauen, R zum Drehen.</p>`;
    const up = (e.type !== 'decor') ? PF.Game.tierCost(e) : null;
    el.innerHTML = `
      <div class="ins-head r${tier}">${ic(icon, 'ins-ic')}<div><h3>${title}</h3><div class="rar" style="color:${PF.RARITY[tier].color}">${PF.RARITY[tier].name}</div></div><button class="x" id="insClose">✕</button></div>
      ${body}
      ${(e.type === 'belt' || (e.type === 'machine' && PF.kindOf(e) !== 'sprinkler' && !def.passive)) ? '<div class="ins-btns"><button id="insRot">⟳ Drehen</button></div>' : ''}
      ${this.upgradeBox(e, up)}
      ${e.kind === 'workbench' ? '' : `<div class="ins-del"><button class="danger" id="insDel">✖ Abreißen</button><span class="small">gibt 50 % der Baukosten zurück</span></div>`}`;
    this.$('insClose').onclick = () => this.select(null);
    const upB = this.$('insUp');
    if (upB) upB.onclick = () => {
      const secs = PF.Build.tierSecs(e);
      if (secs > 0 && !PF.Build.needBuilder()) return;
      if (!PF.Game.pay(up)) { this.toast('Nicht genug Währung', '#ff8080'); return; }
      if (secs > 0) { PF.Build.start(e, 'tier', secs, tier + 1); PF.Audio.sfx('place'); this.showInspector(); return; }
      e.tier = tier + 1; PF.S.stats.upgrades++;
      PF.Audio.sfx('upgrade');
      PF.FX.burst((e.x + 0.5) * PF.TILE, (e.y + 0.3) * PF.TILE, PF.RARITY[e.tier].color, 30, 160);
      PF.FX.popup((e.x + 0.5) * PF.TILE, e.y * PF.TILE, PF.RARITY[e.tier].name + '!', PF.RARITY[e.tier].color, 1.3);
      if (e.tier >= 3) PF.FX.shake(6, 0.3);
      this.showInspector();
    };
    const rot = this.$('insRot'); if (rot) rot.onclick = () => this.rotate();
    const fil = this.$('insFilter'); if (fil) fil.onchange = () => { e.filter = fil.value; PF.Audio.sfx('click'); };
    const del = this.$('insDel');
    if (del) del.onclick = () => {
      const kind2 = e.type === 'machine' ? e.kind : e.type, back = PF.BUILD[kind2] ? Math.floor(PF.BUILD[kind2].cost * 0.5) : 0;
      this.confirm('Abreißen?', `${title} wird entfernt. Du bekommst <b>${PF.U.fmt(back)} Gold</b> zurück.${tier ? ` Die Stufe <b style="color:${PF.RARITY[tier].color}">${PF.RARITY[tier].name}</b> geht dabei verloren.` : ''}`, 'Abreißen', () => this.demolish(e), true);
    };
    el.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => { e.recipe = b.dataset.rec; PF.Audio.sfx('click'); this.showInspector(); });
    el.querySelectorAll('[data-crop]').forEach(b => b.onclick = () => {
      const cid = b.dataset.crop;
      PF.S.lastCrop = cid;
      if (e.crop && e.crop !== cid && e.growth < 1) { e.crop = null; }
      e.last = cid;
      if (!e.crop) PF.Garden.go(e.x, e.y, () => { if (!e.crop) PF.Garden.plant(e, cid); }, { key: 'plot' + e.id });
      PF.Audio.sfx('click'); this.showInspector();
    });
  },
  openSeedPicker(p) { this.select(p); },

  // Inspektor für Hindernisse und laufende Baustellen
  showBuildInspector(e, el) {
    const name = PF.Build.name(e);
    let body = '', icon;
    if (e.type === 'obstacle') {
      icon = `${e.kind === 'tree' ? 'trees' : 'rocks'}/0_${e.size - 1}`;
      const sz = PF.OBSTACLE_SIZE[e.size];
      body = `<p class="desc">Größe ${e.size} von 5 · blockiert ein Feld.</p><p>Belohnung: ${sz.xp} XP · ${Math.round(sz.gem * 100)} % Chance auf Mondsteine</p>`;
    } else icon = e.type === 'machine' ? PF.Render.machineKey(e) : PF.BUILD[e.type] ? PF.BUILD[e.type].icon : 'tiles/0_3';
    if (e.build) {
      const left = PF.Build.left(e), pct = 1 - left / e.build.secs, sk = PF.Build.skipCost(e);
      body += `<p>${e.build.kind === 'clear' ? 'Wird freigeräumt' : e.build.kind === 'tier' ? 'Wird aufgewertet' : 'Wird gebaut'} … noch <b>${PF.U.fmtTime(left)}</b></p>
        <div class="bar"><div class="fill" style="width:${pct * 100}%"></div></div>`;
      body += `<div class="ins-btns"><button class="up" id="bSkip">${sk ? '⏩ Sofort fertig ' + PF.costText({ moonstone: sk }) : '⏩ Gratis fertigstellen'}</button></div>`;
    } else {
      const c = PF.Build.clearCost(e), t = PF.Build.clearSecs(e);
      body += `<div class="ins-btns"><button class="up" id="bClear">${PF.OBSTACLES[e.kind].verb} ${PF.costText(c)} · ⏱ ${PF.U.fmtTime(t)}</button></div>`;
    }
    el.innerHTML = `<div class="ins-head">${ic(icon, 'ins-ic')}<div><h3>${name}</h3><div class="rar">${e.type === 'obstacle' ? (e.kind === 'tree' ? 'Baum' : 'Fels') : 'Baustelle'}</div></div><button class="x" id="insClose">✕</button></div>${body}`;
    this.$('insClose').onclick = () => this.select(null);
    const sk = this.$('bSkip'); if (sk) sk.onclick = () => { PF.Build.skip(e); this.showInspector(); };
    const cl = this.$('bClear'); if (cl) cl.onclick = () => { PF.Build.startClear(e); this.showInspector(); };
  },

  showOrderInfo(o) {
    const def = o.boss ? PF.BOSSES.find(b => b.id === o.cust) : PF.CUSTOMERS.find(c => c.id === o.cust);
    this.toast(`${def.name}: ${o.lines.map(l => `${l.need}× ${PF.POTION[l.p].name}`).join(', ')}`, o.boss ? '#ff8080' : '#e8d9ff');
  },

  // ---------- HUD-Aktualisierung ----------
  update(dt) {
    this._t += dt;
    if (this._t < 0.12 && !this._dirty) return;
    this._t = 0; this._dirty = false;
    const s = PF.S;
    this.$('lvlNum').textContent = s.level;
    const need = PF.xpForLevel(s.level), pct = s.xp / need;
    this.$('xpFill').style.width = (pct * 100) + '%';
    this.$('hudLvl').classList.toggle('almost', pct > 0.8);
    this.$('xpText').textContent = pct > 0.8 ? `Gleich geschafft! Noch ${PF.U.fmt(need - s.xp)} XP` : `${PF.U.fmt(s.xp)} / ${PF.U.fmt(need)} XP`;
    for (const k of PF.CURRENCY_ORDER) {
      const el = document.querySelector(`[data-cur="${k}"] span`);
      const v = PF.U.fmt(s.cur[k]);
      if (el.textContent !== v) { el.textContent = v; el.parentNode.classList.remove('bump'); void el.parentNode.offsetWidth; el.parentNode.classList.add('bump'); }
    }
    const bc = this.$('builderChip'); bc.querySelector('span').textContent = `${PF.Build.free()}/${s.builders || 1}`; bc.classList.toggle('low', PF.Build.free() <= 0);
    const cap = PF.Water._cap || PF.Water.cap(), wv = s.water || 0;
    const wc = this.$('waterChip');
    wc.querySelector('span').textContent = `${Math.floor(wv)}/${cap}`;
    wc.querySelector('i').style.width = (wv / cap * 100) + '%';
    wc.classList.toggle('low', wv < 3);
    // Welle
    const w = s.wave, boss = PF.Shop.isBossWave(w.n);
    this.$('waveLbl').textContent = boss ? `BOSS-WELLE ${w.n}` : `Welle ${w.n}`;
    this.$('hudWave').classList.toggle('boss', boss);
    let total = 0, got = 0;
    for (const o of w.orders) for (const l of o.lines) { total += l.need; got += Math.min(l.got, l.need); }
    const wp = w.phase === 'pause' ? 1 - Math.max(0, w.timer) / (w.pauseMax || 4) : total ? got / total : 0;
    this.$('waveFill').style.width = (wp * 100) + '%';
    this.$('hudWave').classList.toggle('almost', w.phase === 'active' && wp > 0.8);
    const toBoss = PF.WAVE.bossEvery - ((w.n - 1) % PF.WAVE.bossEvery) - 1;
    this.$('bossInfo').innerHTML = boss && w.phase === 'active' ? `${ic('ui/5_1')} ${PF.U.fmtTime(w.bossTimer)}` : w.phase === 'pause' ? ` · nächste in ${Math.ceil(Math.max(0, w.timer))}s` : ` · Boss in ${toBoss}`;
    this.$('combo').innerHTML = s.combo.n > 1 ? `${ic('ui/1_5')} Combo ×${(1 + 0.05 * Math.min(10, s.combo.n - 1)).toFixed(2)} <span class="cbar"><span style="width:${100 - s.combo.t / 25 * 100}%"></span></span>` : '';
    this.renderOrders();
    this.$('deliverAll').style.display = s.shopkeeper ? 'none' : '';
    // Punkte am Menü
    this.$('dot_chests').textContent = s.inv.chests.length || '';
    this.$('dot_chests').classList.toggle('on', s.inv.chests.length > 0);
    this.$('dot_daily').classList.toggle('on', PF.Progress.dailyReady());
    const ua = PF.Progress.unclaimed();
    this.$('dot_achievements').textContent = ua || ''; this.$('dot_achievements').classList.toggle('on', ua > 0);
    this.$('dot_prestige').classList.toggle('on', s.level >= PF.PRESTIGE.minLevel && PF.Progress.soulGain() > 0);
    this.$('dot_biomes').classList.toggle('on', PF.BIOMES.some(b => !s.biomes[b.id] && s.level >= b.unlock.level && PF.Game.can(b.unlock.cost)));
    // Tutorial & Teaser
    this.renderQuest();
    const sp = PF.Shop.surplus(), spEl = this.$('surplus');
    spEl.classList.toggle('hidden', !sp.n);
    const spSig = sp.n + ':' + sp.gold;
    if (sp.n && spSig !== this._spSig) {
      this._spSig = spSig;
      spEl.innerHTML = `<span>${sp.n} Tränke übrig</span><button id="sellSp" title="Tränke, die kein offener Auftrag braucht, für ${Math.round(PF.SURPLUS_RATE * 100)} % ihres Werts verkaufen">An Händler · +${PF.U.fmt(sp.gold)} ${ic('currency/0_0')}</button>`;
      spEl.querySelector('#sellSp').onclick = () => { PF.Shop.sellSurplus(); this._spSig = null; };
    }
    const nx = PF.Progress.nextUnlock();
    this.$('teaser').innerHTML = nx ? `Nächstes Ziel: ${ic(nx.icon)} <b>${nx.t}</b> bei Level ${nx.l}` : '';
    if (this.selected && this.selected.type !== 'belt' && (this.selected.build || Math.random() < 0.15)) this.refreshInspectorLight();
  },
  // Safe-Areas (Notch, Dynamic Island, Home-Balken) in Pixeln – env() ist per JS nicht direkt lesbar
  safe() {
    const p = this.$ && this.$('safeProbe'); if (!p) return { l: 0, r: 0, t: 0, b: 0 };
    const c = getComputedStyle(p);
    return { l: parseFloat(c.paddingLeft) || 0, r: parseFloat(c.paddingRight) || 0, t: parseFloat(c.paddingTop) || 0, b: parseFloat(c.paddingBottom) || 0 };
  },
  // Schwebende Info am Mauszeiger (z. B. Werkzeuge im Laden)
  tip(html, ev) {
    const t = this.$('tip');
    if (!html) { t.classList.add('hidden'); return; }
    if (t._html !== html) { t.innerHTML = html; t._html = html; }
    t.classList.remove('hidden');
    const w = t.offsetWidth, h = t.offsetHeight;
    let x = ev.clientX + 16, y = ev.clientY + 16;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 16;
    if (y + h > innerHeight - 8) y = innerHeight - h - 8;
    t.style.left = x + 'px'; t.style.top = y + 'px';
  },
  renderQuest() {
    const q = PF.Quests.cur(), done = q.val >= q.n, open = this.questOpen;
    const rew = Object.entries(q.rew).filter(([k, v]) => v || k === 'chest').map(([k, v]) => k === 'chest' ? `${ic(PF.chestIcon(v))}` : k === 'xp' ? `${PF.U.fmt(v)} XP` : `${PF.U.fmt(v)} ${ic(PF.CURRENCIES[k].icon)}`).join(' ');
    const sig = q.t + q.val + done + rew + open;
    if (sig === this._qSig) return;
    this._qSig = sig;
    const el = this.$('quest');
    el.className = 'quest' + (done ? ' done' : '') + (open ? ' open' : '');
    el.innerHTML = `<div class="qbar" id="qToggle" title="Aufgabe – klicken für Details"><div class="qhead">✦ Aufgabe <span class="qarrow">${open ? '◂' : '▸'}</span></div><div class="qrow">${ic(q.icon)}<b>${q.t}</b></div><div class="bar sm"><div class="fill" style="width:${q.val / q.n * 100}%"></div></div><span class="qcount">${q.val} / ${q.n}</span></div>
      ${done ? '<button class="ok qclaim" id="qClaim">✓ Belohnung abholen</button>' : ''}
      ${open ? `<div class="qdrop"><p class="qhow small">${q.how}</p><div class="qrew small">Belohnung: ${rew}</div>${!done && q.focus ? '<button id="qShow">Zeigen</button>' : ''}</div>` : ''}`;
    el.querySelector('#qToggle').onclick = () => { this.questOpen = !this.questOpen; PF.Audio.sfx('click'); this.renderQuest(); };
    const c = el.querySelector('#qClaim'); if (c) c.onclick = () => PF.Quests.claim();
    const sh = el.querySelector('#qShow'); if (sh) sh.onclick = () => PF.Quests.show();
  },
  refreshInspectorLight() {
    // Inspektor nur neu zeichnen, wenn kein Button gehovert wird
    const el = this.$('inspector');
    if (!el.matches(':hover')) this.showInspector();
  },
  renderOrders() {
    const w = PF.S.wave;
    const sig = w.orders.map(o => o.uid + o.state + o.lines.map(l => l.got).join('.') + PF.Shop.readiness(o)).join('|') + w.n + PF.S.shopkeeper;
    if (sig === this._orderSig) return;
    this._orderSig = sig;
    const open = w.orders.filter(o => o.state !== 'out').length;
    this.$('ordCount').textContent = open ? `(${open})` : '';
    this.$('orders').innerHTML = w.orders.filter(o => o.state !== 'out').map(o => {
      const def = o.boss ? PF.BOSSES.find(b => b.id === o.cust) : PF.CUSTOMERS.find(c => c.id === o.cust);
      const portrait = o.boss ? `${def.sheet}/${def.row}_idle_f` : def.portrait;
      return `<div class="ocard ${o.boss ? 'boss' : ''}">
        <div class="oport">${ic(portrait)}</div>
        <div class="obody"><div class="oname">${def.name}</div>
        ${o.lines.map(l => {
          const p = PF.POTION[l.p], pct = l.got / l.need;
          const have = PF.S.inv.potions[l.p] ? PF.S.inv.potions[l.p].n : 0;
          const ings = Object.entries(p.in).map(([c, n]) => `${n}×${ic(PF.CROP[c].icon)}`).join(' ');
          return `<div class="oline ${pct >= 0.8 && pct < 1 ? 'almost' : ''}" data-info="potion:${p.id}" title="${p.name} – klicken für Rezept & Erklärung">${ic(p.icon)}<div class="ol"><div class="otxt"><span style="color:${PF.RARITY[p.r].color}">${p.name}</span><b>${l.got}/${l.need}</b></div><div class="bar sm"><div class="fill" style="width:${pct * 100}%"></div></div><div class="oings">${ings}</div></div></div>`;
        }).join('')}
        ${PF.S.shopkeeper ? '' : (() => { const rd = PF.Shop.readiness(o); return `<button class="odeliver ${rd === 'all' ? 'ready' : ''}" data-deliver="${o.uid}" ${rd === 'none' ? 'disabled' : ''}>${rd === 'all' ? '✓ Übergeben' : rd === 'some' ? 'Teilweise übergeben' : 'Noch nicht im Vorrat'}</button>`; })()}
        </div></div>`;
    }).join('');
    this.$('orders').querySelectorAll('[data-deliver]').forEach(b => b.onclick = () => { const o = PF.S.wave.orders.find(q => q.uid === b.dataset.deliver); if (o) PF.Shop.walkDeliver(o); });
  },

  // ---------- Toasts & Overlays ----------
  toast(text, color = '#fff', icon) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = (icon ? ic(icon) : '') + `<span style="color:${color}">${text}</span>`;
    this.$('toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
    const all = this.$('toasts').children;
    if (all.length > 5) all[0].remove();
  },
  bigBanner(title, sub, color) {
    const el = document.createElement('div');
    el.className = 'banner';
    el.innerHTML = `<h1 style="color:${color}">${title}</h1><p>${sub}</p>`;
    document.getElementById('ui').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  },
  overlay(html, cls = '') {
    const o = this.$('overlay');
    o.className = 'overlay ' + cls;
    o.innerHTML = html;
    return o;
  },
  closeOverlay() { this.$('overlay').className = 'overlay hidden'; this.$('overlay').innerHTML = ''; },

  levelUp(lvl, rew, unlocks) {
    const show = () => {
      if (!this.$('overlay').classList.contains('hidden')) { setTimeout(show, 800); return; }
      const o = this.overlay(`
        <div class="lvlup frame">
          ${ic('ui/0_4', 'crown')}
          <h1>LEVEL ${lvl}!</h1>
          <div class="rewards">${rew.moonstone ? `<div>${ic('currency/1_1')} +${rew.moonstone}</div>` : ''}${rew.stardust ? `<div>${ic('currency/2_1')} +${rew.stardust}</div>` : ''}<div>${ic('chests/' + rew.chest + '_0')} ${PF.CHESTS[rew.chest].name}</div></div>
          ${unlocks.length ? `<h3>Freigeschaltet</h3><div class="unlocks">${unlocks.map(u => `<div>${ic(u.icon)}<span>${u.text}</span></div>`).join('')}</div>` : ''}
          <button class="big" id="lvlOk">Weiter</button>
        </div>`, 'show');
      PF.FX.confetti(PF.Cam.x, PF.Cam.y - 100, 70);
      o.querySelector('#lvlOk').onclick = () => { this.closeOverlay(); PF.Audio.sfx('click'); };
      this.buildBuildBar();
    };
    show();
  },
  bossIntro(boss) {
    const o = this.overlay(`
      <div class="bossintro frame">
        ${ic(`${boss.sheet}/${boss.row}_idle_f`, 'bossimg')}
        <div><h4>⚠ BOSS-KUNDE ⚠</h4><h1>${boss.name}</h1><p>${boss.title}</p>
        <p class="small">Erfülle den großen Auftrag, bevor die Zeit abläuft!<br>Belohnung: Mondsteine, Boss-Siegel & eine seltene Truhe</p>
        <button class="big danger" id="bossOk">Annehmen</button></div>
      </div>`, 'show boss');
    o.querySelector('#bossOk').onclick = () => { this.closeOverlay(); const c = PF.World.zoneCenter('shop'); PF.Cam.focus(c.x, c.y); };
    setTimeout(() => { if (o.querySelector('#bossOk')) this.closeOverlay(); }, 7000);
  },

  // ---------- Truhen: Slotmaschine ----------
  // Ein Band aus vielen Truhen rauscht durch und bleibt langsam stehen.
  // Das Band besteht fast nur aus der eigenen Truhenart plus ein paar besseren – je besser die Truhe, desto besser auch das Band.
  rollUpgrade(r) {
    // Chance, dass das Band auf einer besseren Truhe stehen bleibt (Glück erhöht sie)
    const x = Math.random() / PF.Game.mult('luck');
    const up = x < 0.002 ? 4 : x < 0.01 ? 3 : x < 0.04 ? 2 : x < 0.16 ? 1 : 0;
    return Math.min(r >= 5 ? 9 : 4, r + up);
  },
  reelStrip(r, result, n, land) {
    const pick = () => {
      const x = Math.random();
      const up = x < 0.006 ? 4 : x < 0.03 ? 3 : x < 0.1 ? 2 : x < 0.3 ? 1 : 0;
      return Math.min(r >= 5 ? 9 : 4, r + up);
    };
    const list = [];
    for (let i = 0; i < n; i++) list.push(pick());
    list[land] = result;
    // Beinahe-Treffer: direkt dahinter oft eine bessere Truhe
    const top = r >= 5 ? 9 : 4;
    if (result < top && Math.random() < 0.55) list[land + 1] = Math.min(top, result + 1 + (Math.random() < 0.25 ? 1 : 0));
    return list;
  },
  openChestFlow(index) {
    const s = PF.S;
    const base = s.inv.chests[index];
    if (base === undefined) return;
    const result = (base === 4 || base === 9) ? base : this.rollUpgrade(base);
    const N = 46, LAND = 40;
    let H = 120;
    const strip = this.reelStrip(base, result, N, LAND);
    const o = this.overlay(`
      <div class="chestfx">
        <h2 style="color:${PF.chestColor(base)}">${PF.CHESTS[base].name}</h2>
        <div class="reelbox frame thin"><div class="reel-window"><div class="reel-strip" id="reelStrip">${strip.map(r => `<div class="reel-item">${ic(PF.chestIcon(r))}</div>`).join('')}</div><div class="reel-marker"></div></div></div>
        <div class="upgrade-txt" id="upTxt"></div>
      </div>`, 'show chest');
    const el = o.querySelector('#reelStrip');
    H = (el.children[0] && el.children[0].getBoundingClientRect().height) || 120; // echte Höhe (Handy: kleiner)
    const target = -(LAND * H - H);
    el.style.transform = 'translateY(0px)';
    void el.offsetWidth;
    const dur = 3600;
    el.style.transition = `transform ${dur}ms cubic-bezier(0.08, 0.72, 0.12, 1)`;
    el.style.transform = `translateY(${target}px)`;
    PF.Audio.sfx('chest');
    let lastIdx = -1;
    const t0 = performance.now();
    const tick = () => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      const idx = Math.floor(-m.m42 / H);
      if (idx !== lastIdx) { lastIdx = idx; PF.Audio.sfx('click'); }
      if (performance.now() - t0 < dur) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const skip = () => { el.style.transition = 'none'; el.style.transform = `translateY(${target}px)`; };
    o.addEventListener('pointerdown', skip, { once: true });
    setTimeout(() => {
      skip();
      const win = el.children[LAND];
      win.classList.add('win');
      s.inv.chests[index] = result;
      const txt = o.querySelector('#upTxt');
      if (result > base) {
        txt.innerHTML = `Aufgewertet: <span style="color:${PF.chestColor(result)}">${PF.CHESTS[result].name}!</span>`;
        const rr = PF.chestRarity(result);
        PF.Audio.sfx(rr >= 3 ? 'legendary' : 'levelup'); PF.FX.shake(6 + rr * 3, 0.5);
      } else {
        txt.textContent = PF.CHESTS[result].name;
        PF.Audio.sfx('reveal', PF.chestRarity(result));
      }
      setTimeout(() => this.openChestNow(index), result > base ? 1500 : 800);
    }, dur + 80);
  },

  // ---------- Truhe öffnen + Karten ----------
  openChestNow(index) {
    const s = PF.S;
    const r = s.inv.chests[index];
    if (r === undefined) return;
    const def = PF.CHESTS[r];
    let phase = 0;
    const o = this.overlay(`
      <div class="chestfx r${Math.min(4, PF.chestRarity(r))} ${r >= 5 ? 'premium' : ''}">
        <div class="beam"></div>
        <div class="chestimg" id="chestImg">${ic(PF.chestIcon(r))}</div>
        <h2 style="color:${PF.chestColor(r)}">${def.name}</h2>
        <p class="small" id="chestHint">Klicken zum Öffnen</p>
        <div class="cards" id="cards"></div>
        <div class="cbtns" id="cbtns"></div>
      </div>`, 'show chest');
    const img = o.querySelector('#chestImg');
    PF.Audio.playSting('reward', 12);
    img.onclick = () => {
      if (phase !== 0) return;
      phase = 1;
      PF.Audio.sfx('chest');
      img.innerHTML = ic(PF.chestIcon(r, 1)); img.classList.add('shake');
      o.querySelector('#chestHint').textContent = '';
      setTimeout(() => {
        img.classList.remove('shake');
        img.innerHTML = ic(PF.chestIcon(r, 2)); img.classList.add('opened');
        o.querySelector('.chestfx').classList.add('open');
        const res = PF.Loot.openChest(index);
        const cards = o.querySelector('#cards');
        res.drops.forEach((d, i) => setTimeout(() => {
          const c = document.createElement('div');
          c.className = `card r${d.r}`;
          c.innerHTML = `${ic(d.icon)}<div class="cname">${d.label}</div>${d.sub ? `<div class="csub">${d.sub}</div>` : ''}<div class="crar">${PF.RARITY[d.r].name}</div>`;
          cards.appendChild(c);
          PF.Audio.sfx(d.r >= 4 ? 'legendary' : 'reveal', d.r);
          if (d.r >= 3) PF.FX.shake(d.r >= 4 ? 16 : 7, 0.5);
          if (i === res.drops.length - 1) {
            const more = PF.S.inv.chests.length;
            o.querySelector('#cbtns').innerHTML = `<button class="big" id="cDone">Einsammeln</button>${more ? `<button class="big alt" id="cNext">Nächste öffnen (${more})</button>` : ''}`;
            o.querySelector('#cDone').onclick = () => { this.closeOverlay(); PF.UI.dirty(); };
            const nx = o.querySelector('#cNext'); if (nx) nx.onclick = () => this.openChestFlow(PF.S.inv.chests.length - 1);
          }
        }, 450 + i * 520));
      }, 650);
    };
  },

  // ---------- Schwebende Leisten (Bauen am Cursor, Aktionen über dem ausgewählten Objekt) ----------
  floats() {
    const bf = this.$('buildFloat'), sf = this.$('selFloat');
    const blocked = !PF.started || !this.$('overlay').classList.contains('hidden') || !this.$('panelWrap').classList.contains('hidden') || (PF.Tutorial && PF.Tutorial.blocking);
    const rect = PF.Render.c.getBoundingClientRect(), T = PF.TILE, m = PF.Input.mouse;
    const place = (el, wx, wy) => {
      const p = PF.Cam.toScreen(wx, wy);
      // freie Kartenfläche zwischen den HUD-Elementen (Leiste links, Karten rechts, Bauleiste unten)
      const css = getComputedStyle(document.documentElement), num = (v) => parseFloat(css.getPropertyValue(v)) || 0;
      const L = rect.left + num('--rail') + 90, R = rect.right - num('--side') - 90, B = rect.bottom - num('--bb-h') - 64, Tp = rect.top + 110;
      const off = p.x < -40 || p.y < -40 || p.x > rect.width + 40 || p.y > rect.height + 40;
      el.style.visibility = off ? 'hidden' : '';
      const x = PF.U.clamp(rect.left + p.x, L, Math.max(L, R)), y = PF.U.clamp(rect.top + p.y, Tp, Math.max(Tp, B));
      el.style.left = x + 'px'; el.style.top = y + 'px';
    };
    // Bauleiste am Cursor
    if (!blocked && this.tool.mode !== 'select') {
      if (m.inside) { this._ft = { x: Math.floor(m.wx / T), y: Math.floor(m.wy / T) }; }
      const ft = this._ft || { x: 0, y: 0 };
      const t = this.tool;
      const key = t.mode + t.type + t.decor + t.dir + PF.S.cur.gold;
      if (key !== this._bfKey) {
        this._bfKey = key;
        const name = t.mode === 'demolish' ? '✖ Abriss' : t.type === 'decor' ? PF.DECOR.find(d => d.id === t.decor).name : PF.BUILD[t.type].name;
        const cost = t.mode === 'build' ? (t.type === 'decor' ? PF.DECOR.find(d => d.id === t.decor).cost : PF.Game.buildCost(t.type)) : null;
        const rotatable = t.mode === 'build' && t.type !== 'plot' && t.type !== 'decor' && t.type !== 'sprinkler' && !(PF.BUILD[t.type] && PF.BUILD[t.type].passive);
        bf.innerHTML = `<span class="flabel">${name} ${cost ? PF.costText(cost) : ''}</span>
          ${rotatable ? `<button id="bfRot" title="Drehen">⟳ ${'→↓←↑'[t.dir]}<span class="key">R</span></button>` : ''}
          <button class="ok" id="bfDone" title="Fertig">✓ Fertig<span class="key">Esc</span></button>`;
        const r = bf.querySelector('#bfRot'); if (r) r.onclick = () => { this.rotate(); this._bfKey = null; };
        bf.querySelector('#bfDone').onclick = () => { this.setMode('select'); };
      }
      place(bf, (ft.x + 0.5) * T, (ft.y - 0.5) * T);
      bf.classList.remove('hidden');
    } else bf.classList.add('hidden');

    // Aktionsleiste über dem ausgewählten Objekt
    const e = this.selected;
    if (!blocked && this.tool.mode === 'select' && e && PF.S.ents[e.id] && (e.type === 'obstacle' || e.build)) {
      const key = 'b' + e.id + ':' + (e.build ? PF.Build.skipCost(e) : 'c') + PF.Game.can(PF.Build.clearCost ? (e.type === 'obstacle' ? PF.Build.clearCost(e) : {}) : {});
      if (key !== this._selKey) {
        this._selKey = key;
        if (e.build) { const sk = PF.Build.skipCost(e); sf.innerHTML = `<span class="flabel">⏱ ${PF.U.fmtTime(PF.Build.left(e))}</span><button class="up" id="sfSkip">⏩ ${sk ? PF.costText({ moonstone: sk }) : 'gratis'}</button><button id="sfX">✕</button>`; }
        else sf.innerHTML = `<button class="up" id="sfClear" ${PF.Game.can(PF.Build.clearCost(e)) ? '' : 'disabled'}>${e.kind === 'tree' ? '🪓' : '⛏'} ${PF.OBSTACLES[e.kind].verb} ${PF.costText(PF.Build.clearCost(e))}</button><button id="sfX">✕</button>`;
        const a = sf.querySelector('#sfSkip'); if (a) a.onclick = () => { PF.Build.skip(e); this._selKey = null; this.showInspector(); };
        const b = sf.querySelector('#sfClear'); if (b) b.onclick = () => { PF.Build.startClear(e); this._selKey = null; this.showInspector(); };
        sf.querySelector('#sfX').onclick = () => this.select(null);
      }
      if (e.build) { const fl = sf.querySelector('.flabel'); if (fl) fl.textContent = '⏱ ' + PF.U.fmtTime(PF.Build.left(e)); }
      place(sf, (e.x + 0.5) * T, (e.y - 0.4) * T);
      sf.classList.remove('hidden');
    } else if (!blocked && this.tool.mode === 'select' && e && PF.S.ents[e.id] && e.type !== 'plot') {
      const up = e.type !== 'decor' ? PF.Game.tierCost(e) : null;
      const def = PF.BUILD[e.type === 'machine' ? e.kind : e.type];
      const key = e.id + ':' + e.tier + ':' + e.dir + ':' + (up ? PF.Game.can(up) : 'x');
      if (key !== this._selKey) {
        this._selKey = key;
        const rotatable = e.type === 'belt' || (e.type === 'machine' && PF.kindOf(e) !== 'sprinkler' && !(def && def.passive));
        sf.innerHTML = `${rotatable ? '<button id="sfRot" title="Drehen (R)">⟳</button>' : ''}
          ${up ? `<button class="up" id="sfUp" ${PF.Game.can(up) ? '' : 'disabled'} title="Aufwerten auf ${PF.RARITY[(e.tier || 0) + 1].name}">⬆ ${PF.costText(up)}</button>` : ''}
          <button id="sfX" title="Abwählen (Esc)">✕</button>`;
        const r = sf.querySelector('#sfRot'); if (r) r.onclick = () => { this.rotate(); this._selKey = null; };
        const u = sf.querySelector('#sfUp'); if (u) u.onclick = () => { const b = this.$('insUp'); if (b) b.click(); this._selKey = null; };
        sf.querySelector('#sfX').onclick = () => this.select(null);
      }
      const lift = e.type === 'belt' ? 0.1 : (def && def.scale ? def.scale : 1.2) * 0.95;
      place(sf, (e.x + 0.5) * T, (e.y + 1 - lift) * T - 8);
      sf.classList.remove('hidden');
    } else sf.classList.add('hidden');
  },

  // ---------- Panels ----------
  openPanel(html, cls = '') {
    this.$('panel').className = 'panel frame ' + cls;
    this.$('panel').innerHTML = `<button class="pclose" id="pClose">✕</button>` + html;
    this.$('panelWrap').classList.remove('hidden');
    this.$('pClose').onclick = () => this.closePanel();
    return this.$('panel');
  },
  // Eigener Bestätigungsdialog (Browser-confirm() wird im App-Browser unterdrückt)
  confirm(title, text, yes, onYes, danger) {
    const box = this.$('confirmBox');
    box.innerHTML = `<h2>${title}</h2><div class="ctext">${text}</div><div class="cbtns"><button class="big ${danger ? 'danger' : 'ok'}" id="cfYes">${yes}</button><button class="big alt" id="cfNo">Abbrechen</button></div>`;
    this.$('confirmWrap').classList.remove('hidden');
    const close = () => this.$('confirmWrap').classList.add('hidden');
    box.querySelector('#cfNo').onclick = () => { close(); PF.Audio.sfx('click'); };
    box.querySelector('#cfYes').onclick = () => { close(); onYes(); };
  },
  closePanel() { this.$('panelWrap').classList.add('hidden'); PF.Panels.current = null; this.tip(null); },
};
