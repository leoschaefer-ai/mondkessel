// Laden: Wellen, Kunden, Aufträge, Boss-Kunden, Laufkundschaft, Combo
window.PF = window.PF || {};

PF.Shop = {
  SPOTS: [[49.4, 7.6], [49.4, 10.4], [49.4, 13.2], [52.0, 8.8], [52.0, 11.8], [52.0, 14.8]],
  BOSS_SPOT: [50.6, 19.8],
  DOOR: [56.6, 11],
  GATE: [52.6, 25.4],
  COUNTER: [47.4, 11.0],
  sellT: 0, fillT: 0,

  demand(pid) {
    let n = 0;
    for (const o of PF.S.wave.orders) if (o.state !== 'out') for (const l of o.lines) if (l.p === pid) n += l.need - l.got;
    return n;
  },

  isBossWave(n) { return n % PF.WAVE.bossEvery === 0; },
  bossFor(n) { return PF.BOSSES[(n / PF.WAVE.bossEvery - 1) % PF.BOSSES.length]; },

  startWave() {
    const s = PF.S, w = s.wave, n = w.n;
    w.orders = []; w.phase = 'active';
    let usable = PF.POTIONS.filter(p => PF.Factory.producible(p));
    if (!usable.length) usable = PF.POTIONS.filter(p => PF.Factory.usable(p));
    if (!usable.length) return;
    w.age = 0; w.lastProgress = 0;
    if (this.isBossWave(n)) {
      const boss = this.bossFor(n);
      const lines = Math.min(4, 2 + Math.floor(n / 30));
      // 1 Prunkstück (wertvollster herstellbarer Trank) + Tränke, die der Spieler oft braut
      const byValue = [...usable].sort((a, b) => b.value - a.value);
      const byCraft = [...usable].sort((a, b) => (s.album[b.id] || 0) - (s.album[a.id] || 0));
      const picks = [byValue[0]];
      for (const p of byCraft) { if (picks.length >= Math.min(lines, usable.length)) break; if (!picks.includes(p)) picks.push(p); }
      const ease = Math.pow(PF.WAVE.bossFailEase, w.bossFails || 0);
      const qty = PF.WAVE.bossQty(n) * ease;
      w.orders.push({
        uid: 'boss' + n, cust: boss.id, boss: true, state: 'in', x: this.GATE[0], y: this.GATE[1], spot: this.BOSS_SPOT, face: 'b',
        lines: picks.map((p, i) => ({ p: p.id, need: Math.max(2, Math.round(qty / (1 + p.r * 0.9) * (i === 0 ? 0.5 : 1))), got: 0 })),
      });
      w.bossTimer = PF.WAVE.bossTime(picks.length);
      w.bossMax = w.bossTimer;
      PF.UI.bossIntro(boss);
      PF.Audio.sfx('boss');
      PF.FX.shake(14, 0.8);
    } else {
      const count = PF.WAVE.customers(n);
      const pool = PF.CUSTOMERS.filter(c => c.from <= n);
      for (let i = 0; i < count; i++) {
        // Bevorzugt: Tränke, deren Zutaten gerade angebaut werden; neue Rezepte bekommen einen Schub
        const planted = new Set(Object.values(s.ents).filter(e => e.type === 'plot' && e.last).map(e => e.last));
        const p = PF.U.weighted(usable, (q) => (1 + q.unlock * 0.4 + (q.unlock >= s.level - 2 ? 3 : 0)) * (Object.keys(q.in).every(c => planted.has(c)) ? 3 : 1));
        const c = PF.U.pick(pool);
        w.orders.push({
          uid: 'c' + n + '_' + i, cust: c.id, boss: false, state: 'in', delay: i * 1.4,
          x: this.DOOR[0], y: this.DOOR[1] + (Math.random() - 0.5), spot: this.SPOTS[i], face: 'l',
          lines: [{ p: p.id, need: PF.WAVE.qty(n, p.r), got: 0 }],
        });
      }
      PF.UI.toast(`Welle ${n} beginnt – ${count} Kunden!`, '#e8d9ff');
    }
    PF.UI.dirty();
  },

  update(dt) {
    const s = PF.S, w = s.wave;
    // Combo verfällt
    if (s.combo.n > 0) { s.combo.t += dt; if (s.combo.t > 25) { s.combo.n = 0; PF.UI.dirty(); } }

    if (w.phase === 'pause') {
      w.timer -= dt;
      if (w.timer <= 0) this.startWave();
    }

    // Kunden bewegen
    for (const o of w.orders) {
      if (o.delay > 0) { o.delay -= dt; continue; }
      const tgt = o.state === 'out' ? (o.boss ? this.GATE : this.DOOR) : o.spot;
      const dx = tgt[0] - o.x, dy = tgt[1] - o.y, d = Math.hypot(dx, dy);
      const sp = (o.boss ? 1.3 : 2.2) * dt;
      if (d > 0.05) {
        o.x += dx / d * Math.min(sp, d); o.y += dy / d * Math.min(sp, d);
        o.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'f' : 'b');
        o.moving = true;
      } else {
        o.moving = false;
        if (o.state === 'in') { o.state = 'wait'; o.face = 'l'; }
        if (o.state === 'out') o.gone = true;
      }
    }
    w.orders = w.orders.filter(o => !o.gone);

    // Aufträge aus dem Vorrat bedienen – nur automatisch, wenn der Laden-Gnom angestellt ist
    this.fillT -= dt;
    if (s.shopkeeper && this.fillT <= 0) {
      this.fillT = 0.18;
      outer: for (const o of w.orders) {
        if (o.state !== 'wait') continue;
        for (const l of o.lines) {
          if (l.got >= l.need) continue;
          const v = PF.Game.takePotion(l.p, 1);
          if (!v) continue;
          l.got++; l.val = (l.val || 0) + v;
          PF.FX.flyPotion(PF.POTION[l.p].icon, this.COUNTER, [o.x, o.y - (o.boss ? 1.6 : 1)]);
          PF.Audio.sfx('sell');
          if (o.lines.every(L => L.got >= L.need)) { PF.Game._auto = true; this.complete(o); PF.Game._auto = false; }
          PF.UI.dirty();
          break outer;
        }
      }
    }

    // Hängende Welle: nach 5 Minuten ohne Fortschritt gehen die Kunden weiter
    if (w.phase === 'active' && !this.isBossWave(w.n)) {
      w.age = (w.age || 0) + dt;
      const got = w.orders.reduce((a, o) => a + o.lines.reduce((b, l) => b + l.got, 0), 0);
      if (got !== w.lastGot) { w.lastGot = got; w.lastProgress = w.age; }
      if (w.age - (w.lastProgress || 0) > 300) {
        for (const o of w.orders) if (o.state !== 'out') o.state = 'out';
        w.stalled = true;
        PF.UI.toast('Die Kunden haben zu lange gewartet und ziehen weiter …', '#ffb080');
      }
    }

    // Boss-Timer
    if (w.phase === 'active' && this.isBossWave(w.n)) {
      w.bossTimer -= dt;
      const boss = w.orders.find(o => o.boss);
      if (w.bossTimer <= 0 && boss && boss.state !== 'out') {
        boss.state = 'out';
        w.bossFails = (w.bossFails || 0) + 1;
        PF.UI.toast(`${this.bossFor(w.n).name} ist wütend abgezogen … Versuch es nochmal!`, '#ff6060');
        PF.FX.shake(10, 0.5);
        PF.Audio.sfx('error');
        w.phase = 'pause'; w.timer = 8;
      }
    }

    // Welle geschafft?
    if (w.phase === 'active' && w.orders.length > 0 && w.orders.every(o => o.state === 'out')) this.waveComplete();
    if (w.phase === 'active' && w.orders.length === 0) { w.phase = 'pause'; w.timer = 3; }

    // Laufkundschaft kauft überschüssige Tränke (nur mit Laden-Gnom)
    this.sellT -= dt;
    if (s.shopkeeper && this.sellT <= 0) {
      let spare = 0, pick = null;
      for (const [id, e] of Object.entries(s.inv.potions)) {
        const free = e.n - this.demand(id);
        if (free > 0) { spare += free; if (!pick || PF.POTION[id].value > PF.POTION[pick].value) pick = id; }
      }
      this.sellT = spare > 0 ? Math.max(0.25, 1.6 - spare * 0.08) : 0.5;
      if (pick) {
        const v = PF.Game.takePotion(pick, 1) * PF.WAVE.walkInMult * PF.Game.mult('gold');
        PF.Game._auto = true; PF.Game.addGold(v); PF.Game._auto = false;
        s.stats.sold++;
        PF.FX.popup((this.COUNTER[0] + 0.4) * PF.TILE, (this.COUNTER[1] - 1.3) * PF.TILE, '+' + PF.U.fmt(v), '#ffd36b', 0.8);
        PF.Audio.sfx('coin');
      }
    }
  },

  // Wie viel eines Auftrags kann gerade aus dem Vorrat bedient werden? 'all' | 'some' | 'none'
  readiness(o) {
    let some = false, all = true;
    for (const l of o.lines) {
      const left = l.need - l.got;
      if (left <= 0) continue;
      const have = PF.S.inv.potions[l.p] ? PF.S.inv.potions[l.p].n : 0;
      if (have > 0) some = true;
      if (have < left) all = false;
    }
    return all ? 'all' : some ? 'some' : 'none';
  },
  // Spieler übergibt Tränke per Klick
  deliver(o) {
    if (o.state !== 'wait') return 0;
    let n = 0;
    for (const l of o.lines) {
      while (l.got < l.need) {
        const v = PF.Game.takePotion(l.p, 1);
        if (!v) break;
        l.got++; l.val = (l.val || 0) + v; n++;
        if (n <= 8) setTimeout(() => PF.FX.flyPotion(PF.POTION[l.p].icon, this.COUNTER, [o.x, o.y - (o.boss ? 1.6 : 1)]), n * 70);
      }
    }
    if (!n) {
      const miss = o.lines.find(l => l.got < l.need);
      PF.UI.toast(`Noch kein ${PF.POTION[miss.p].name} im Vorrat`, '#e0b080', PF.POTION[miss.p].icon);
      PF.Audio.sfx('error');
      return 0;
    }
    PF.Audio.sfx('sell');
    if (o.lines.every(L => L.got >= L.need)) this.complete(o);
    PF.UI.dirty();
    return n;
  },
  // Was die offenen Aufträge noch brauchen -> der Rest ist Überschuss
  surplus() {
    const need = {};
    for (const o of PF.S.wave.orders) if (o.state === 'wait') for (const l of o.lines) need[l.p] = (need[l.p] || 0) + Math.max(0, l.need - l.got);
    let n = 0, gold = 0; const list = [];
    for (const [id, v] of Object.entries(PF.S.inv.potions)) {
      const k = Math.max(0, v.n - (need[id] || 0));
      if (k > 0) { const g = (v.v / v.n) * k * PF.SURPLUS_RATE * PF.Game.mult('gold'); n += k; gold += g; list.push([id, k]); }
    }
    return { n, gold: Math.floor(gold), list };
  },
  sellSurplus() {
    const sp = this.surplus();
    if (!sp.n) return 0;
    for (const [id, k] of sp.list) PF.Game.takePotion(id, k);
    PF.Game.addGold(sp.gold);
    PF.S.stats.sold += sp.n;
    PF.Audio.sfx('coin');
    PF.UI.toast(`${sp.n} Tränke an den Händler verkauft: +${PF.U.fmt(sp.gold)} Gold`, '#ffd36b', 'currency/0_0');
    return sp.n;
  },
  // Von Hand: der Zwerg läuft mit den Tränken zur Theke (o = null -> alle Aufträge)
  walkDeliver(o) {
    const ready = o ? (o.state === 'wait' && this.readiness(o) !== 'none') : PF.S.wave.orders.some(q => q.state === 'wait' && this.readiness(q) !== 'none');
    if (!ready) {
      PF.UI.toast(o ? 'Dafür ist noch nichts im Vorrat' : 'Noch nichts zum Übergeben im Vorrat', '#e0b080');
      PF.Audio.sfx('error'); return;
    }
    const [cx, cy] = this.COUNTER;
    const ok = PF.Garden.go(Math.floor(cx), Math.floor(cy), () => { if (o) this.deliver(o); else this.deliverAll(); },
      { key: 'deliver', carry: true, stand: [cx - 0.9, cy + 0.6] });
    if (ok) {
      const dist = Math.hypot(cx - PF.Garden.player.x, cy - PF.Garden.player.y);
      if (dist > 8) PF.UI.toast(`Der Zwerg bringt die Tränke zum Laden (~${Math.ceil(dist / PF.Garden.SPEED)} s)`, '#e2bd6d', 'skins/0_idle_r');
      PF.Audio.sfx('click');
    } else PF.UI.toast('Der Zwerg ist schon mit Tränken unterwegs', '#e0b080');
  },
  deliverAll() { let n = 0; for (const o of PF.S.wave.orders) if (o.state === 'wait' && this.readiness(o) !== 'none') n += this.deliver(o); return n; },
  hireShopkeeper() {
    if (PF.S.shopkeeper) return;
    if (PF.S.level < PF.SHOPKEEPER.unlock) { PF.UI.toast(`Ab Level ${PF.SHOPKEEPER.unlock}`, '#ff8080'); return; }
    if (!PF.Game.pay(PF.SHOPKEEPER.cost)) { PF.UI.toast('Zu wenig Gold', '#ff8080'); return; }
    PF.S.shopkeeper = true;
    PF.UI.toast('Der Laden-Gnom übernimmt jetzt den Verkauf!', '#86b48f', 'skins/1_idle_f');
    PF.Audio.sfx('upgrade');
  },

  complete(o) {
    const s = PF.S, w = s.wave;
    o.state = 'out';
    s.combo.n++; s.combo.t = 0;
    const combo = 1 + 0.05 * Math.min(10, s.combo.n - 1); // max ×1,5 – Bonus, kein Inflationstreiber
    const base = o.lines.reduce((a, l) => a + (l.val || 0), 0);
    const gold = base * PF.WAVE.orderMult * combo * PF.Game.mult('gold') * (o.boss ? 2 : 1);
    const maxR = Math.max(...o.lines.map(l => PF.POTION[l.p].r));
    const rew = { gold, xp: 8 + Math.pow(base, 0.7) * 0.6 };
    if (maxR >= 1) rew.stardust = maxR * 2 + (maxR >= 2 ? 2 : 0);
    const wx = o.x * PF.TILE, wy = (o.y - 1.3) * PF.TILE;
    if (o.boss) {
      const n = w.n;
      rew.moonstone = 4 + Math.floor(n / 10);
      rew.bossSeal = 1 + Math.floor(n / 20);
      rew.chest = Math.min(4, 1 + Math.floor(n / 20));
      s.stats.bosses++;
      w.bossFails = 0;
      PF.UI.bigBanner('BOSS ZUFRIEDEN!', `${this.bossFor(n).name} zahlt fürstlich`, '#ffbf3f');
      PF.Audio.playSting('reward', 9);
      PF.FX.shake(12, 0.6);
      PF.FX.confetti(wx, wy, 80);
    }
    PF.Game.give(rew, { x: wx, y: wy });
    s.stats.orders++;
    PF.FX.popup(wx, wy - 24, '+' + PF.U.fmt(gold) + ' Gold', '#ffd36b', 1.3);
    if (s.combo.n > 1) { PF.FX.popup(wx, wy - 54, `COMBO ×${combo.toFixed(1)}`, '#ff9de2', 1.2); PF.Audio.sfx('combo', s.combo.n); }
    PF.FX.burst(wx, wy, '#ffd36b', 20, 140);
    PF.Audio.sfx('order');
    w.chestProgress = (w.chestProgress || 0) + 1;
  },

  waveComplete() {
    const s = PF.S, w = s.wave;
    const n = w.n;
    if (w.stalled) { w.stalled = false; w.phase = 'pause'; w.timer = 6; w.orders = []; PF.UI.dirty(); return; }
    const rew = w.stalled ? {} : { moonstone: 1 };
    if (!w.stalled && n % PF.WAVE.chestEvery === 0 && !this.isBossWave(n)) rew.chest = n >= 25 ? 1 : 0;
    w.stalled = false;
    PF.Game.give(rew);
    
    w.n++;
    s.stats.maxWave = Math.max(s.stats.maxWave, w.n);
    w.phase = 'pause'; w.timer = PF.WAVE.pause(n); w.pauseMax = w.timer;
    w.orders = [];
    const next = w.n;
    const toBoss = PF.WAVE.bossEvery - ((next - 1) % PF.WAVE.bossEvery) - 1;
    PF.UI.toast(this.isBossWave(next) ? '⚠ Nächste Welle: BOSS-KUNDE!' : `Welle ${n} geschafft! Boss in ${toBoss + 1} Wellen`, this.isBossWave(next) ? '#ff6060' : '#c9ffb0');
    PF.UI.dirty();
  },

  bossActive() {
    const w = PF.S.wave;
    return w.phase === 'active' && this.isBossWave(w.n) && w.orders.some(o => o.boss && o.state !== 'out');
  },
};
