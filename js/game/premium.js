// Schatzkammer-Logik: Preise in Gold (mit Tageszuschlag), Gutschrift, Gold-Truhen im Laden
window.PF = window.PF || {};

PF.Premium = {
  goldFor(hours, min) { return Math.max(min || 0, Math.round(PF.Game.incomePerSec() * 3600 * hours)); },
  // Tageszähler: jeder Kauf desselben Artikels am selben Tag macht ihn 25 % teurer
  day() {
    const s = PF.S, d = Math.floor(PF.now() / 86400000);
    if (!s.shopDay || s.shopDay.day !== d) s.shopDay = { day: d, n: {} };
    return s.shopDay;
  },
  price(key, p) { return { gold: Math.round(this.goldFor(p.h, p.min) * Math.pow(1.25, this.day().n[key] || 0)) }; },
  bump(key) { const d = this.day(); d.n[key] = (d.n[key] || 0) + 1; },
  bought() { return PF.S.premium || (PF.S.premium = { bought: {} }); },

  // Was ein Paket genau gibt (für Anzeige)
  lines(g) {
    const out = [];
    if (g.goldHours) out.push([PF.CURRENCIES.gold.icon, `${PF.U.fmt(this.goldFor(g.goldHours, g.goldMin))} Gold`]);
    if (g.stardust) out.push([PF.CURRENCIES.stardust.icon, `${PF.U.fmt(g.stardust)} Sternenstaub`]);
    if (g.bossSeal) out.push([PF.CURRENCIES.bossSeal.icon, `${g.bossSeal} Boss-Siegel`]);
    if (g.builder) out.push(['construct/0_3', `+${g.builder} Baumeister (dauerhaft)`]);
    if (g.pchest) for (const i of g.pchest) out.push([PF.chestIcon(5 + i), PF.PREMIUM_CHESTS[i].name]);
    return out;
  },
  available(p) { return !(p.once && this.bought().bought[p.id]) && (!p.cond || p.cond()); },

  buy(p, onDone) {
    if (!this.available(p)) return;
    const cost = this.price(p.id, p.price);
    if (!PF.Game.pay(cost)) { PF.UI.toast(`Zu wenig Gold – du brauchst ${PF.U.fmt(cost.gold)}`, '#ff8080'); return; }
    const s = PF.S, g = p.give;
    PF.Game.give({ stardust: g.stardust, bossSeal: g.bossSeal }, null, true);
    if (g.builder) s.builders = Math.min(PF.BUILDERS.max, (s.builders || 1) + g.builder);
    if (g.pchest) for (const i of g.pchest) s.inv.chests.push(5 + i);
    this.bump(p.id);
    if (p.once) this.bought().bought[p.id] = true;
    PF.Audio.sfx('levelup'); PF.Audio.sfx('coin');
    PF.UI.toast(`${p.name} gekauft!`, '#ffd36b', p.icon);
    PF.UI.dirty();
    onDone && onDone();
  },
  // Premium-Truhe kaufen und sofort ins Lotterie-Band
  buyChest(i) {
    const c = PF.PREMIUM_CHESTS[i], key = 'pc' + i, cost = this.price(key, c.price);
    if (!PF.Game.pay(cost)) { PF.UI.toast(`Zu wenig Gold – du brauchst ${PF.U.fmt(cost.gold)}`, '#ff8080'); return; }
    this.bump(key);
    PF.S.inv.chests.push(5 + i);
    PF.UI.closePanel();
    PF.UI.openChestFlow(PF.S.inv.chests.length - 1);
  },

  // Gold-Truhen im Laden
  goldChestPrice(r) {
    const d = PF.GOLD_CHEST.find(x => x.r === r);
    return d ? this.price('gc' + r, { h: d.hours, min: d.min }) : null;
  },
  buyGoldChest(r) {
    const price = this.goldChestPrice(r);
    if (!price || !PF.Game.pay(price)) { PF.UI.toast('Zu wenig Gold', '#ff8080'); return false; }
    this.bump('gc' + r);
    PF.S.inv.chests.push(r);
    return true;
  },
};
