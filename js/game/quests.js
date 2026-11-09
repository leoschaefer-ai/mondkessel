// Aufgaben (wie Hay Day / Clash of Clans): immer genau EIN klares nächstes Ziel mit kleiner Belohnung.
// Erst eine feste Lernkette durch den Spielablauf, danach endlose, mitwachsende Ziele.
window.PF = window.PF || {};

(() => {
  const st = (k) => () => PF.S.stats[k] || 0;
  const built = (k) => () => Object.values(PF.S.ents).filter(e => (e.type === 'machine' ? e.kind : e.type) === k && !e.build).length;
  const plots = () => Object.values(PF.S.ents).filter(e => e.type === 'plot' && !e.wild && !e.build).length;
  const lvl = () => PF.S.level;
  const wavesDone = () => PF.S.wave.n - 1;
  const ic = (k) => PF.BUILD[k] ? PF.BUILD[k].icon : 'ui/0_3';

  // n = Ziel, v = aktueller Wert (absolut), focus = was "Zeigen" ansteuert
  PF.QUESTS = [
    { t: 'Ernte 2 Mondblüten', how: 'Tippe die leuchtenden Mondblüten an – dein Zwerg läuft hin und erntet. Du kannst mehrere nacheinander antippen.', icon: 'ingredients/0_0', v: st('harvests'), n: 2, rew: { gold: 10, xp: 5 }, focus: 'wild' },
    { t: 'Mörsere 2 Pulver', how: 'Klicke den Alchemietisch an und dann „Mörsern" (3 Klicks pro Pulver).', icon: 'ingredients/1_0', v: st('ground'), n: 2, rew: { gold: 10, xp: 5 }, focus: 'workbench' },
    { t: 'Braue deinen ersten Trank', how: 'Im Alchemietisch unter „Brauen": 2 Mondblüten-Pulver + 1 Wasser = Schlaftrank.', icon: 'potions_b/0_0', v: st('crafted'), n: 1, rew: { gold: 15, xp: 8 }, focus: 'workbench' },
    { t: 'Beliefere deinen ersten Kunden', how: 'Rechts beim Auftrag auf „Übergeben" klicken – dein Zwerg trägt die Tränke dann zum Laden und übergibt sie.', icon: 'ui/5_2', v: st('orders'), n: 1, rew: { gold: 20, xp: 10 } },
    { t: 'Pumpe Wasser am Brunnen', how: 'Klicke auf den Brunnen. Jeder Trank kostet 1 Wasser – der Brunnen füllt auch langsam von selbst nach.', icon: 'ingredients/5_1', v: st('pumps'), n: 1, rew: { gold: 10, xp: 5 }, focus: 'well' },
    { t: 'Baue dein erstes Beet', how: 'Unten „Garten → Beet" wählen und auf eine freie Stelle setzen. Gepflanzt wird automatisch.', icon: 'beds/0_0', v: plots, n: 1, rew: { gold: 15, xp: 10 } },
    { t: 'Erfülle 3 Aufträge', how: 'Mehr Beete = mehr Ernte = mehr Tränke. Aufträge zahlen 1,8× den Trankwert.', icon: 'ui/5_2', v: st('orders'), n: 3, rew: { gold: 35, xp: 15 } },
    { t: 'Fälle einen Dornbusch', how: 'Klicke einen kleinen Busch an und dann „Fällen". Das braucht einen freien Baumeister – manchmal liegt ein Mondstein darunter.', icon: 'trees/0_0', v: st('cleared'), n: 1, rew: { gold: 30, moonstone: 2, xp: 10 }, focus: 'obstacle' },
    { t: 'Besitze 4 Beete', how: 'Jedes Beet kostet etwas mehr als das vorige. Fehlt Platz, räume Büsche weg.', icon: 'beds/0_0', v: plots, n: 4, rew: { gold: 50, xp: 20 } },
    { t: 'Braue 10 Tränke', how: 'Tipp: Überschuss kannst du rechts beim Händler verkaufen (60 % Wert) – Aufträge zahlen mehr.', icon: 'potions_b/0_0', v: st('crafted'), n: 10, rew: { gold: 50, xp: 20 } },
    { t: 'Erreiche Level 3', how: 'XP gibt es für Ernten, Brauen, Aufträge, Bauen und Freiräumen.', icon: 'ui/0_3', v: lvl, n: 3, rew: { chest: 0 } },
    { t: 'Schließe Welle 5 ab', how: 'Erfülle alle Aufträge einer Welle, dann kommt nach kurzer Pause die nächste.', icon: 'ui/5_2', v: wavesDone, n: 5, rew: { gold: 80, moonstone: 3 } },
    { t: 'Erreiche Level 4', how: 'Mit Level 4 kommen die ersten Maschinen: Erntekiste, Förderband, Mörser.', icon: 'ui/0_3', v: lvl, n: 4, rew: { gold: 100, xp: 0 } },
    { t: 'Baue eine Erntekiste', how: 'Fabrik → Erntekiste. Sie nimmt Ernte aus dem Vorrat und legt sie aufs Band.', icon: ic('collector'), v: built('collector'), n: 1, rew: { gold: 60, xp: 15 } },
    { t: 'Baue einen Mörser', how: 'Fabrik → Mörser. Er zermahlt Ernte automatisch zu Pulver – kein Klicken mehr.', icon: ic('mortar'), v: built('mortar'), n: 1, rew: { gold: 120, xp: 20 } },
    { t: 'Lass den Mörser 5 Pulver mahlen', how: 'Verbinde Erntekiste → Förderbänder → Mörser → Bänder → Lager. Pfeile zeigen die Laufrichtung (R = drehen).', icon: ic('mortar'), v: st('groundAuto'), n: 5, rew: { gold: 150, moonstone: 3, xp: 25 } },
    { t: 'Baue eine Regentonne', how: 'Garten → Regentonne. Mehr Wasser von allein, mehr Speicher.', icon: ic('rainbarrel'), v: built('rainbarrel'), n: 1, rew: { gold: 100, xp: 15 } },
    { t: 'Besiege den ersten Boss', how: 'Alle 10 Wellen kommt ein Boss mit großer Bestellung – lege vorher Vorrat an!', icon: 'ui/5_2', v: st('bosses'), n: 1, rew: { gold: 300, chest: 1 } },
    { t: 'Erreiche Level 7', how: 'Ab Level 7: Kessel, Abfüller und Verkaufsschacht – die erste vollautomatische Linie.', icon: 'ui/0_3', v: lvl, n: 7, rew: { gold: 400, moonstone: 5 } },
    { t: 'Baue einen Kessel', how: 'Er braut aus Pulver + Wasser automatisch Tränke.', icon: ic('cauldron'), v: built('cauldron'), n: 1, rew: { gold: 300, xp: 40 } },
    { t: 'Baue einen Abfüller', how: 'Stell ihn hinter den Kessel und verbinde beide mit einem Band.', icon: ic('bottler'), v: built('bottler'), n: 1, rew: { gold: 300, xp: 40 } },
    { t: 'Baue einen Verkaufsschacht', how: 'Ans Ende der Linie: Fertige Tränke landen automatisch im Laden-Vorrat.', icon: ic('seller'), v: built('seller'), n: 1, rew: { gold: 400, moonstone: 5, xp: 50 } },
    { t: 'Werte ein Gebäude auf', how: 'Gebäude anklicken → Aufwerten. Höhere Stufen arbeiten schneller.', icon: 'ui/0_3', v: st('upgrades'), n: 1, rew: { gold: 300, xp: 40 } },
  ];

  // Endlose Ziele danach – wachsen mit, Belohnung = einige Minuten Einkommen
  PF.QUEST_LOOP = [
    { t: (n) => `Erfülle ${n} Aufträge`, icon: 'ui/5_2', stat: 'orders', n: (k) => 8 + k * 2 },
    { t: (n) => `Räume ${n} Hindernisse`, icon: 'trees/1_0', stat: 'cleared', n: (k) => 2 + Math.floor(k / 3) },
    { t: (n) => `Stelle ${n} Tränke her`, icon: 'potions_b/0_0', stat: 'crafted', n: (k) => 30 + k * 10 },
    { t: (n) => `Werte ${n} Gebäude auf`, icon: 'ui/0_3', stat: 'upgrades', n: (k) => 1 + Math.floor(k / 4) },
    { t: (n) => `Ernte ${n} Pflanzen`, icon: 'ingredients/0_0', stat: 'harvests', n: (k) => 40 + k * 10 },
    { t: (n) => `Schließe ${n} Wellen ab`, icon: 'ui/5_2', stat: 'waves', n: (k) => 3 + Math.floor(k / 3) },
  ];
})();

PF.Quests = {
  cur() {
    const s = PF.S, q = s.quest || (s.quest = { i: 0, k: 0 });
    if (q.i < PF.QUESTS.length) {
      const d = PF.QUESTS[q.i];
      return { ...d, val: Math.min(d.n, d.v()), loop: false };
    }
    const L = PF.QUEST_LOOP[q.k % PF.QUEST_LOOP.length];
    if (q.base === undefined) q.base = this.statVal(L.stat);
    const n = L.n(Math.floor(q.k / PF.QUEST_LOOP.length) * 2);
    const val = Math.min(n, this.statVal(L.stat) - q.base);
    const inc = PF.Game.incomePerSec();
    const rew = { gold: Math.max(100, Math.round(inc * 240)), xp: Math.round(PF.xpForLevel(s.level) * 0.04) };
    if (q.k % 3 === 2) rew.moonstone = 2 + Math.floor(q.k / 6);
    if (q.k % 5 === 4) rew.chest = Math.min(3, Math.floor(q.k / 10));
    return { t: L.t(n), how: 'Immer neue Ziele – die Belohnung wächst mit deinem Einkommen.', icon: L.icon, n, val, rew, loop: true };
  },
  statVal(k) { return k === 'waves' ? PF.S.wave.n - 1 : (PF.S.stats[k] || 0); },
  done() { const c = this.cur(); return c.val >= c.n; },
  claim() {
    const s = PF.S, c = this.cur();
    if (c.val < c.n) return false;
    const { gold, ...rest } = c.rew;
    if (gold) PF.Game.addGold(gold, null, true);
    PF.Game.give(rest);
    if (c.loop) { s.quest.k++; delete s.quest.base; } else s.quest.i++;
    s.stats.quests = (s.stats.quests || 0) + 1;
    PF.Audio.sfx('levelup');
    PF.UI.toast('Aufgabe erledigt: ' + c.t, '#e2bd6d', c.icon);
    PF.UI.dirty();
    return true;
  },
  // Kamera zum passenden Objekt und es auswählen (leuchtet dann)
  show() {
    const c = this.cur(), ents = Object.values(PF.S.ents);
    let e = null;
    if (c.focus === 'wild') e = ents.find(x => x.type === 'plot' && x.crop && x.growth >= 1) || ents.find(x => x.type === 'plot');
    else if (c.focus === 'workbench') e = ents.find(x => (x.kind || x.type) === 'workbench');
    else if (c.focus === 'well') e = ents.find(x => (x.kind || x.type) === 'well');
    else if (c.focus === 'obstacle') e = ents.filter(x => x.type === 'obstacle' && !x.build).sort((a, b) => a.size - b.size || Math.hypot(a.x - 7, a.y - 10) - Math.hypot(b.x - 7, b.y - 10))[0];
    if (!e) return;
    PF.Cam.focus((e.x + 0.5) * PF.TILE, (e.y + 0.5) * PF.TILE);
    if (PF.Cam.zoom < 0.7) PF.Cam.zoomTo(0.9);
    PF.UI.select(e);
  },
};
