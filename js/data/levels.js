// Level-Kurve, Level-Belohnungen, Wellen-Balancing, Tutorial
window.PF = window.PF || {};

// ab Level 10 wird jede Stufe zusätzlich 2 % zäher (Hay-Day-artig: früh schnell, später Grind)
PF.xpForLevel = (lvl) => Math.floor((80 * Math.pow(lvl, 2.1) + 40 * lvl) * (1 + Math.max(0, lvl - 10) * 0.02) * (lvl <= 6 ? 0.6 + lvl * 0.066 : 1)); // Laufwege des Zwergs: die ersten Level etwas schneller

PF.levelReward = (lvl) => {
  // Jedes Level eine Truhe: alle 5 Level Eisen, alle 10 Level Runen
  const r = { moonstone: 1 + Math.floor(lvl / 4), chest: lvl % 10 === 0 ? 2 : lvl % 5 === 0 ? 1 : 0 };
  if (lvl % 3 === 0) r.stardust = 5 + lvl;
  return r;
};

PF.WAVE = {
  customers: (n) => Math.min(6, 1 + Math.floor(n / 3)),
  // Menge pro Kunde: bis Welle 25 steil, danach flach (sonst Endlos-Wand)
  qty: (n, rarity) => Math.max(1, Math.round((0.8 + Math.min(n, 25) * 0.4 + Math.max(0, n - 25) * 0.12) / (1 + rarity * 0.8))),
  orderMult: 1.8,              // Aufträge zahlen das 2,4-Fache des Trankwerts
  walkInMult: 0.55,            // Laufkundschaft zahlt nur 55 %
  bossEvery: 10,
  bossTime: (lines) => 240 + lines * 90,
  bossQty: (n) => Math.round(8 + n * 0.42),
  bossFailEase: 0.8,           // nach jedem Scheitern bestellt der Boss 20 % weniger
  chestEvery: 5,
  pause: (n) => Math.min(120, 8 + n * 1.5),  // Sekunden zwischen den Wellen
};

PF.PRESTIGE = {
  minLevel: 45,
  soulFor: (gold) => Math.floor(Math.pow(gold / 25000, 0.5)),
  bonusPerSoul: 0.05,
};

// Offline zählt nur automatischer Verkauf (Laden-Gnom), max. 2 h – sonst wird Handarbeit zum Offline-Goldregen
PF.SURPLUS_RATE = 0.6; // Händler zahlt 60 % – Aufträge (×1,8) bleiben deutlich besser
PF.OFFLINE = { maxHours: 2, rate: 0.5 };

// Wasser: Gießen kostet 1, Sprinkler 0,5 pro Beet, jeder Brauvorgang 1 (Trank-Mixer 2)
PF.WATER = { baseCap: 25, start: 25, water: 1, sprinkler: 0.5, brew: 1, pump: 4 };

// Laden-Gnom: übergibt Tränke automatisch und verkauft Überschuss an Laufkundschaft
PF.SHOPKEEPER = { cost: { gold: 65000 }, unlock: 15, name: 'Laden-Gnom' };

// Kurze Tutorial-Schritte (cond prüft den Spielstand)
PF.TUTORIAL = [
  { text: 'Klicke auf reife Mondblüten im Garten, um sie zu ernten. Gießen beschleunigt das Wachstum!', done: (s) => s.stats.harvests >= 3 },
  { text: 'Die Erntekiste schickt deine Ernte übers Förderband zu Mörser → Kessel → Abfüller → Laden.', done: (s) => s.stats.crafted >= 1 },
  { text: 'Kunden warten im Laden (rechts) auf ihre Bestellungen. Erfülle die Aufträge der Welle!', done: (s) => s.stats.orders >= 2 },
  { text: 'Baue mehr Beete (unten: Bauen → Garten), damit die Fabrik schneller läuft.', done: (s) => s.stats.built >= 2 },
  { text: 'Klicke eine Maschine an, um sie aufzuwerten. Höhere Seltenheit = schneller!', done: (s) => s.stats.upgrades >= 1 },
  { text: 'Öffne deine Truhen (Menü links) – darin warten Werkzeuge, Pets und Rezepte.', done: (s) => s.stats.chestsOpened >= 1 },
];

// Gilden-Upgrades: endlose Gold-Aufwertungen (Gold-Sink fürs Spätspiel)
PF.GUILD = [
  { id: 'value',  name: 'Händlergilde',     stat: 'value',  per: 0.08, base: 2000, grow: 2.1, icon: 'ui/0_0', text: 'Trankwert' },
  { id: 'growth', name: 'Gärtnergilde',     stat: 'growth', per: 0.08, base: 1500, grow: 2.1, icon: 'ui/3_0', text: 'Wachstum' },
  { id: 'speed',  name: 'Mechanikergilde',  stat: 'speed',  per: 0.06, base: 2500, grow: 2.15, icon: 'ui/3_5', text: 'Maschinen-Tempo' },
  { id: 'xp',     name: 'Gelehrtengilde',   stat: 'xp',     per: 0.05, base: 3000, grow: 2.2, icon: 'ui/2_2', text: 'XP' },
];
PF.guildCost = (g, lvl) => ({ gold: Math.round(g.base * Math.pow(g.grow, lvl)) });
