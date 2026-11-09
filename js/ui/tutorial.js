// Geführtes Tutorial: Mentor + Spotlight. Schritte mit `wait` gehen automatisch weiter, sobald die Aufgabe erledigt ist.
window.PF = window.PF || {};

PF.Tutorial = {
  active: false, i: 0, blocking: false,

  // ---------- Ziel-Helfer ----------
  world(x0, y0, x1, y1) {
    const r = PF.Render.c.getBoundingClientRect(), T = PF.TILE;
    const a = PF.Cam.toScreen(x0 * T, y0 * T), b = PF.Cam.toScreen((x1 + 1) * T, (y1 + 1) * T);
    return { x: r.left + a.x, y: r.top + a.y, w: b.x - a.x, h: b.y - a.y };
  },
  dom(sel) {
    const el = document.querySelector(sel);
    if (!el || el.classList.contains('hidden')) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  },
  ent(kind) { return Object.values(PF.S.ents).find(e => (e.type === 'machine' ? e.kind : e.type) === kind); },
  focus(x, y) { PF.Cam.focus((x + 0.5) * PF.TILE, (y + 0.5) * PF.TILE); },

  STEPS: [
    { title: 'Willkommen in der Mondkessel-Manufaktur!', text: 'Ich bin Meister Moosbart. Noch ist hier alles zugewachsen – du fängst mit bloßen Händen an. Ich zeige dir die ersten Schritte.' },
    { title: 'Die Karte', text: 'Ziehen = umsehen, Mausrad = zoomen. Oben springst du mit 1–4 zu Garten, Fabrik, Laden und Biomen, „Übersicht“ zeigt alles.', target: (t) => t.dom('canvas#game') },
    {
      title: 'Wilde Mondblüten', text: 'Diese wilde Mondblüte ist reif – klicke sie an, um sie zu ernten.',
      enter(t) { const p = Object.values(PF.S.ents).find(e => e.type === 'plot' && e.crop); if (p) { p.growth = 1; t.plot = p.id; t.focus(p.x, p.y); } t.h0 = PF.S.stats.harvests; },
      target: (t) => { const p = PF.S.ents[t.plot]; return p ? t.world(p.x, p.y - 0.4, p.x, p.y) : null; },
      wait: (t) => PF.S.stats.harvests > t.h0,
    },
    {
      title: 'Von Hand mörsern & brauen', text: 'Klicke den Alchemietisch an. Mörsere die Mondblüten zu Pulver und braue daraus einen Schlaftrank (2 Pulver + 1 Wasser).',
      enter(t) { const w = t.ent('workbench'); if (w) t.focus(w.x, w.y); PF.S.inv.items['raw:moonpetal'] = Math.max(2, PF.S.inv.items['raw:moonpetal'] || 0); t.c0 = PF.S.stats.crafted; },
      target: (t) => t.dom('.panel') || (t.ent('workbench') && t.world(t.ent('workbench').x, t.ent('workbench').y - 1, t.ent('workbench').x, t.ent('workbench').y)),
      wait: (t) => PF.S.stats.crafted > t.c0, allowPanel: true,
    },
    {
      title: 'Wasser', text: 'Brauen und Gießen kosten Wasser (oben 💧). Klicke den Brunnen, um zu pumpen – danach braucht er kurz Pause.',
      enter(t) { PF.UI.closePanel(); const w = t.ent('well'); if (w) t.focus(w.x, w.y); },
      target: (t) => { const w = t.ent('well'); return w ? t.world(w.x, w.y - 1, w.x, w.y) : null; },
    },
    {
      title: 'Der erste Kunde', text: 'Rechts wartet ein Kunde auf einen Schlaftrank. Klicke „Übergeben“ – das bringt Gold und Erfahrung!',
      enter(t) { t.o0 = PF.S.stats.orders; },
      target: (t) => t.dom('.rightcol'),
      wait: (t) => PF.S.stats.orders > t.o0,
    },
    {
      title: 'Platz schaffen', text: 'Überall stehen Bäume, in der Fabrik liegen Felsen. Klicke einen kleinen Dornbusch an und fälle ihn – das kostet Gold und etwas Zeit. Manchmal liegen Mondsteine darunter!',
      enter(t) { const o = Object.values(PF.S.ents).filter(e => e.type === 'obstacle' && e.kind === 'tree' && e.size === 1).sort((a, b) => Math.hypot(a.x - 7, a.y - 10) - Math.hypot(b.x - 7, b.y - 10))[0]; if (o) { t.obs = o.id; t.focus(o.x, o.y); const c = PF.Build.clearCost(o).gold; if (PF.S.cur.gold < c) PF.Game.give({ gold: c - PF.S.cur.gold }); } t.k0 = PF.S.stats.cleared || 0; },
      target: (t) => { const o = PF.S.ents[t.obs]; return o ? t.world(o.x, o.y - 0.5, o.x, o.y) : null; },
      wait: (t) => { const o = PF.S.ents[t.obs]; return !o || !!o.build; },
    },
    { title: 'Baumeister', text: 'Jeder Bau braucht einen freien Baumeister (oben 🔨). Kleine Dinge dauern Sekunden, große Stunden. Mit Mondsteinen kannst du beschleunigen oder weitere Baumeister anheuern.', target: (t) => t.dom('#builderChip') },
    {
      title: 'Dein erstes Beet', text: 'Wähle unten „Garten“ → „Beet“ und setze es auf eine freie Fläche. Darin wachsen Pflanzen schneller als wild.',
      enter(t) { PF.UI.buildTab = 'garden'; PF.UI.buildBuildBar(); if (PF.S.cur.gold < 30) PF.Game.give({ gold: 30 - PF.S.cur.gold }); t.p0 = Object.values(PF.S.ents).filter(e => e.type === 'plot' && !e.wild).length; },
      target: (t) => t.dom('.buildbar'),
      wait: (t) => Object.values(PF.S.ents).filter(e => e.type === 'plot' && !e.wild).length > t.p0,
    },
    { title: 'Der Weg zur Automation', text: 'Mit jedem Level kommt Neues: Mörser und Förderbänder (Level 4), Kessel & Abfüller (7), Helfer (11), Laden-Gnom (15)… Am Ende läuft alles von allein – aber das dauert.', target: (t) => t.dom('.teaser') || t.dom('.buildbar') },
    { title: 'Bereit, Alchemist!', text: 'Achte auf die roten Punkte im Menü – dort wartet immer etwas. Viel Erfolg!' },
  ],

  start(force) {
    if (!force && PF.S.tutDone) return;
    this.active = true; this.i = 0;
    if (!this.spot) {
      const ui = document.getElementById('ui');
      this.spot = document.createElement('div'); this.spot.className = 'tut-spot none';
      this.box = document.createElement('div'); this.box.className = 'tut-box frame thin';
      ui.appendChild(this.spot); ui.appendChild(this.box);
    }
    this.show();
  },
  finish() {
    this.active = false; PF.S.tutDone = true;
    this.spot.style.display = 'none'; this.box.style.display = 'none';
    PF.Save.save();
  },
  next() {
    this.i++;
    if (this.i >= this.STEPS.length) { this.finish(); PF.Audio.sfx('levelup'); return; }
    PF.Audio.sfx('reveal', 1);
    this.show();
  },
  show() {
    const st = this.STEPS[this.i];
    st.enter && st.enter(this);
    const last = this.i === this.STEPS.length - 1;
    this.box.innerHTML = `<img class="mentor" src="assets/ui/mentor.webp"><div style="flex:1">
      <h4>${st.title}</h4><p>${st.text}</p>
      <div class="tbtns2">${st.wait ? '<span class="small">↳ Probier es aus!</span>' : `<button class="ok" id="tutNext">${last ? 'Los geht’s!' : 'Weiter'}</button>`}
      ${last ? '' : '<button id="tutSkip">Überspringen</button>'}<span class="step">${this.i + 1} / ${this.STEPS.length}</span></div></div>`;
    const n = this.box.querySelector('#tutNext'); if (n) n.onclick = () => this.next();
    const sk = this.box.querySelector('#tutSkip'); if (sk) sk.onclick = () => this.finish();
    this.spot.style.display = ''; this.box.style.display = '';
  },

  update() {
    if (!this.active) return;
    const st = this.STEPS[this.i];
    // Bei offenen Fenstern (Truhe, Level-Up, Panels) ausblenden
    const covered = !document.getElementById('overlay').classList.contains('hidden') || (!st.allowPanel && !document.getElementById('panelWrap').classList.contains('hidden'));
    this.spot.style.display = covered ? 'none' : ''; this.box.style.display = covered ? 'none' : '';
    if (st.wait && st.wait(this)) { this.next(); return; }
    if (covered) return;
    const r = st.target ? st.target(this) : null;
    const pad = 8;
    if (r) {
      this.spot.classList.remove('none');
      Object.assign(this.spot.style, { left: (r.x - pad) + 'px', top: (r.y - pad) + 'px', width: (r.w + pad * 2) + 'px', height: (r.h + pad * 2) + 'px' });
    } else {
      this.spot.classList.add('none');
      Object.assign(this.spot.style, { left: '50%', top: '50%', width: '0px', height: '0px' });
    }
    // Box neben das Ziel setzen (unter, sonst über, sonst Mitte)
    // echte Box-Größe und Safe-Areas (Notch, Home-Balken) berücksichtigen
    const sa = PF.UI.safe();
    const L = 10 + sa.l, Rr = 10 + sa.r, T = 10 + sa.t, B = 10 + sa.b;
    const bw = this.box.offsetWidth || 450, bh = this.box.offsetHeight || 150, W = window.innerWidth, H = window.innerHeight;
    let x, y;
    if (!r) { x = (W - bw) / 2; y = H * 0.32; }
    else {
      x = r.x + r.w / 2 - bw / 2;
      y = r.y + r.h + pad + 14;
      if (y + bh > H - B) y = r.y - pad - 14 - bh;
      if (y < T) { y = r.y + r.h / 2 - bh / 2; x = r.x + r.w + 20 + bw < W - Rr ? r.x + r.w + 20 : r.x - bw - 20; }
    }
    x = PF.U.clamp(x, L, Math.max(L, W - bw - Rr)); y = PF.U.clamp(y, T, Math.max(T, H - bh - B));
    this.box.style.left = x + 'px'; this.box.style.top = y + 'px';
  },
};
