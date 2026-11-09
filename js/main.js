// Start, Titelbildschirm, Game-Loop
window.PF = window.PF || {};

(function boot() {
  const canvas = document.getElementById('game');
  PF.Audio.init();
  PF.World.init();

  const saved = PF.Save.load();
  PF.S = saved ? Object.assign(PF.newState(), saved, { worldVersion: saved.worldVersion || 1 }) : PF.newState();
  if (!saved) PF.World.defaultLayout();
  else { PF.World.migrate(PF.S); PF.World.ensureWell(PF.S); PF.Build.regrow(PF.S); }
  Object.assign(PF.Audio.settings, PF.S.settings || {});

  PF.Render.init(canvas);
  PF.UI.init();
  PF.Input.init(canvas);
  PF.Input.onTap = (x, y) => { if (PF.started) PF.UI.onTap(x, y); };
  PF.Input.onRightTap = () => { PF.UI.setMode('select'); PF.UI.select(null); };
  PF.Input.onKey = (k) => {
    if (!PF.started) return;
    if (k === 'r') PF.UI.rotate();
    if (k === 'x') PF.UI.setMode('demolish');
    if (k === 'escape') { if (PF.UI.tool.mode !== 'select') PF.UI.setMode('select'); else { PF.UI.select(null); PF.UI.closePanel(); } }
    if (k === '1' || k === '2' || k === '3') { const z = PF.World.ZONES[+k - 1]; const c = PF.World.zoneCenter(z.id); PF.Cam.focus(c.x, c.y); }
    if (k === '4') { const c = PF.World.zoneCenter('biomes'); PF.Cam.focus(c.x, c.y); }
    if (k === '+' || k === '=') PF.Cam.zoomTo(PF.Cam.zoom * 1.35);
    if (k === '-' || k === '_') PF.Cam.zoomTo(PF.Cam.zoom / 1.35);
    if (k === '0') PF.Cam.overview();
  };

  const fc = PF.World.zoneCenter('factory');
  PF.Cam.x = fc.x - 300; PF.Cam.y = fc.y;
  PF.Cam.zoom = Math.min(1.25, Math.max(0.75, window.innerWidth / 1400));

  // Wichtige Sprites vorladen
  // In zwei Wellen: erst was man sofort sieht, dann der Rest (Handy lädt sonst ~700 Bilder gleichzeitig)
  const first = Object.keys(window.SPRITES).filter(k => /^(tiles|biome_tiles|crops|buildings|shop|props|ui|currency|trees|rocks|skins|construct|beds)\//.test(k));
  const later = Object.keys(window.SPRITES).filter(k => /^(biome_props|machines_adv|belt_tiers|machine_tiers_a|machine_tiers_b|chests|pchests|ingredients|powders_c|cust_a|cust_b|cust_c|cust_d|helpers|potions_b|potions)\//.test(k));
  PF.Assets.preload(first).then(() => PF.Assets.preload(later));

  titleScreen(!!saved);

  // Entwickler-Hook für Screenshots: index.html#shot=game|helpers|daily|chest|reel|levelup|tutorial|shop (speichert nichts)
  const shot = (location.hash.match(/shot=(\w+)/) || [])[1];
  if (shot) {
    PF.noSave = true; PF.Save.save = () => {};
    start(true);
    PF.S.tutDone = shot !== 'tutorial'; if (PF.S.tutDone && PF.Tutorial.active) PF.Tutorial.finish();
    if (shot !== 'fresh' && shot !== 'tutorial') { PF.S.level = 9; PF.S.cur.gold = 12345; PF.S.cur.moonstone = 80; PF.S.inv.chests.push(1); }
    PF.UI.buildBuildBar();
    setTimeout(() => {
      if (shot === 'helpers') PF.Panels.open('helpers');
      if (shot === 'daily') PF.Panels.open('daily');
      if (shot === 'shop') PF.Panels.open('shop');
      if (shot === 'fog' || shot === 'fogb') setTimeout(() => { PF.Cam.tz = null; PF.Cam.tx = null; PF.Cam.zoom = shot === 'fog' ? PF.Cam.fitZoom() : 0.55; PF.Cam.x = shot === 'fog' ? PF.World.W * 32 : 20 * 64; PF.Cam.y = shot === 'fog' ? PF.World.H * 32 : 36 * 64; PF.Render.t = 40; PF.Render.draw(0.016); }, 1500);
      if (shot === 'plotsel') { const p = Object.values(PF.S.ents).find(e => e.type === 'plot' && !e.wild) || Object.values(PF.S.ents).find(e => e.type === 'plot'); PF.UI.select(p); PF.Cam.focus((p.x + 0.5) * 64, p.y * 64); }
      if (shot.startsWith('inv')) {
        const s = PF.S;
        PF.CROPS.slice(0, 14).forEach((c, i) => { s.inv.items['raw:' + c.id] = 3 + i * 4; if (i < 8) s.inv.items['pow:' + c.id] = i + 1; });
        PF.POTIONS.slice(0, 26).forEach((p, i) => PF.Game.addPotion(p.id, p.value, (i % 5) + 1));
        PF.Panels.tab.inv = shot === 'inv' ? 'potions' : shot.slice(3);
        PF.Panels.open('inventory');
        if (shot === 'inv') setTimeout(() => { const el = document.querySelector('[data-si="3"]'); el.dispatchEvent(new MouseEvent('mouseenter', { clientX: 520, clientY: 330 })); el.classList.add('hoverdemo'); }, 400);
      }
      if (shot === 'levelup') PF.Progress.onLevelUp(10);
      if (shot === 'reel') PF.UI.openChestFlow(PF.S.inv.chests.length - 1);
      if (shot === 'chest') { PF.UI.openChestNow(PF.S.inv.chests.length - 1); setTimeout(() => document.getElementById('chestImg').click(), 300); }
      if (shot === 'game') { const m = Object.values(PF.S.ents).find(e => e.kind === 'mortar'); PF.UI.select(m); PF.Cam.focus((m.x + 2) * 64, m.y * 64); }
      if (shot === 'fresh') { PF.Cam.tz = null; PF.Cam.zoom = 0.85; PF.Cam.x = 9 * 64; PF.Cam.y = 10 * 64; PF.Cam.tx = null; }
      if (shot === 'shopview') { const c = PF.World.zoneCenter('shop'); PF.Cam.tx = null; PF.Cam.x = c.x - 40; PF.Cam.y = c.y - 60; PF.Cam.zoom = 1; PF.S.wave.timer = 0; setTimeout(() => { const o = PF.S.wave.orders[0]; if (o) for (const l of o.lines) PF.Game.addPotion(l.p, 20, l.need); }, 1500); }
      if (shot === 'overview') { PF.Cam.zoom = PF.Cam.fitZoom(); PF.Cam.x = PF.World.W * 32; PF.Cam.y = PF.World.H * 32; }
      if (shot === 'build') { PF.UI.tool = { mode: 'build', type: 'mortar', dir: 1, decor: null }; PF.UI.buildBuildBar(); PF.Input.mouse.inside = true; PF.Input.mouse.wx = 24.5 * 64; PF.Input.mouse.wy = 15.5 * 64; }
    }, 900);
  }
  let last = performance.now();
  let secT = 0, saveT = 0, incT = 0;

  function frame(now) {
    // rAF-Zeitstempel kann vor `last` liegen -> nie negative Schritte
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    if (PF.started) {
      PF.Build.update();
      PF.Garden.update(dt);
      PF.Factory.updateGlobal(dt);
      PF.Factory.update(dt);
      PF.Shop.update(dt);
      secT += dt; saveT += dt; incT += dt;
      if (secT > 1) { secT = 0; PF.Progress.checkAchievements(); }
      if (incT > 5) {
        const inst = PF.Game._income / incT;
        PF.S.incomeRate = PF.S.incomeRate ? PF.S.incomeRate * 0.85 + inst * 0.15 : inst;
        const ai = PF.Game._autoIncome / incT;
        PF.S.autoRate = PF.S.autoRate ? PF.S.autoRate * 0.85 + ai * 0.15 : ai;
        PF.Game._income = 0; PF.Game._autoIncome = 0; incT = 0;
      }
      if (saveT > 15 && !PF.noSave) { saveT = 0; PF.Save.save(); }
      PF.UI.update(dt);
      // Musik nach Bereich
      // Musik: dauerhaft der Haupt-Track, beim Boss der Boss-Track
      PF.Audio.setScene(PF.Shop.bossActive() ? 'boss' : PF.Audio.settings.mainTrack || 'garden');
    } else {
      PF.Cam.x += Math.sin(now / 4000) * 0.4;
    }
    PF.UI.floats();
    PF.Tutorial && PF.Tutorial.update(dt);
    PF.Input.update(dt);
    PF.Cam.update(dt);
    PF.FX.update(dt);
    PF.Audio.update(dt);
    PF.Render.draw(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('beforeunload', () => { if (PF.started && !PF.noSave) PF.Save.save(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && PF.started && !PF.noSave) PF.Save.save(); });

  function titleScreen(hasSave) {
    PF.Audio.setScene('title');
    document.body.classList.add('title');
    const o = PF.UI.overlay(`
      <div class="title">
        <div class="logo"><span class="l1">Mondkessel</span><span class="l2">Manufaktur</span></div>
        <p class="tag">Baue die größte Trank-Fabrik im verwunschenen Wald</p>
        <div class="tbtns">
          ${hasSave ? `<button class="big" id="tPlay">Weiterspielen</button><button class="big alt" id="tNew">Neues Spiel</button>` : `<button class="big" id="tPlay">Spiel starten</button>`}
        </div>
        <p class="small">🎧 Mit Ton spielen</p>
      </div>`, 'show title-ov');
    o.querySelector('#tPlay').onclick = () => start(false);
    const nb = o.querySelector('#tNew');
    if (nb) nb.onclick = () => PF.UI.confirm('Neues Spiel?', 'Dein bisheriger Spielstand wird gelöscht und du beginnst von vorn.', 'Neu starten', () => { PF.Save.wipe(); start(true); PF.Save.save(); }, true);
  }

  function start(fresh) {
    PF.Audio.unlock();
    if (fresh) { PF.S = PF.newState(); PF.World.defaultLayout(); PF.Garden.player.x = 8.5; }
    PF.UI.closeOverlay();
    document.body.classList.remove('title');
    PF.started = true;
    const gc = PF.World.zoneCenter('garden');
    PF.Cam.focus(gc.x + 300, gc.y);
    PF.UI.buildBuildBar();
    PF.UI.dirty();
    // Offline-Fortschritt
    const off = !fresh && PF.Save.applyOffline(PF.S);
    if (off && off.gold > 0) {
      const o = PF.UI.overlay(`<div class="lvlup">${PF.ic('rewards/3_1', 'crown')}<h1>Willkommen zurück!</h1>
        <p>Du warst ${PF.U.fmtTime(off.secs)} weg. Deine Fabrik hat weitergearbeitet:</p>
        <div class="rewards"><div>${PF.ic('currency/0_3')} +${PF.U.fmt(off.gold)} Gold</div></div>
        <p class="small">Alle Pflanzen sind weitergewachsen.</p>
        <button class="big" id="offOk">Einsammeln</button>
        ${PF.S.cur.moonstone >= 5 ? `<button class="big alt" id="offX2">×2 für ${PF.ic('currency/1_0', 'inl')} 5</button>` : ''}</div>`, 'show');
      o.querySelector('#offOk').onclick = () => { PF.Game.addGold(off.gold); PF.UI.closeOverlay(); PF.Audio.sfx('coin'); };
      const x2 = o.querySelector('#offX2');
      if (x2) x2.onclick = () => { if (PF.Game.pay({ moonstone: 5 })) { PF.Game.addGold(off.gold * 2); PF.UI.closeOverlay(); PF.Audio.sfx('legendary'); } };
      PF.Audio.playSting('reward', 8);
    } else if (PF.Progress.dailyReady() && PF.S.daily.last) {
      setTimeout(() => PF.Panels.open('daily'), 800);
    }
    PF.S.lastSave = Date.now();
    if (!PF.S.tutDone) setTimeout(() => { if (!PF.S.tutDone) PF.Tutorial.start(); }, 700);
  }
})();
