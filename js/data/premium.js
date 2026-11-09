// Schatzkammer: Premium-Truhen und Pakete – alles nur für Gold.
// Preise = Stunden Einkommen (h) mit Mindestpreis (min); jeder weitere Kauf desselben Artikels am selben Tag +25 %.
// So bleibt die Schatzkammer vom ersten bis zum letzten Tag eine echte Gold-Senke.
window.PF = window.PF || {};

// Premium-Truhen hängen hinten an PF.CHESTS an (Index 5–9), damit Inventar, Lotterie-Band und Öffnen sie wie normale Truhen behandeln.
// lootR = Seltenheit der Funde, top = garantierte Spitzenfunde, bonus = feste Extra-Karten (Bonus-Gold immer deutlich unter dem Preis)
PF.PREMIUM_CHESTS = [
  { name: 'Mondschein-Truhe',        drops: 3, lootR: 1, top: { n: 1, r: 2 }, price: { h: 1.5, min: 6000 },   bonus: { stardust: 60 },                                   color: '#cfe0ff' },
  { name: 'Sternenfall-Truhe',       drops: 4, lootR: 2, top: { n: 1, r: 3 }, price: { h: 4,   min: 18000 },  bonus: { goldHours: 1, goldMin: 4000, stardust: 150 },     color: '#7fd8ff' },
  { name: 'Drachenhort-Truhe',       drops: 5, lootR: 2, top: { n: 2, r: 3 }, price: { h: 10,  min: 60000 },  bonus: { goldHours: 2.5, goldMin: 15000, stardust: 300 },  color: '#ff7a3d' },
  { name: 'Seelenschrein',           drops: 6, lootR: 3, top: { n: 1, r: 4 }, price: { h: 24,  min: 180000 }, bonus: { goldHours: 6, goldMin: 40000, bossSeal: 5 },      color: '#6dffa8' },
  { name: 'Kaiserliche Schatztruhe', drops: 7, lootR: 3, top: { n: 2, r: 4 }, price: { h: 60,  min: 500000 }, bonus: { goldHours: 15, goldMin: 120000, bossSeal: 15 },  color: '#ffd36b' },
];
PF.PREMIUM_CHESTS.forEach((c, i) => PF.CHESTS.push({ ...c, r: 5 + i, premium: true, tier: i }));
PF.isPremiumChest = (r) => r >= 5;
PF.chestColor = (r) => r >= 5 ? PF.CHESTS[r].color : PF.RARITY[r].color;
PF.chestIcon = (r, state = 0) => r >= 5 ? `pchests/${r - 5}_${state}` : `chests/${r}_${state}`;
PF.chestRarity = (r) => r >= 5 ? PF.CHESTS[r].lootR + 1 : r; // für Rahmenfarbe der Karten

// Pakete (Gold). give: stardust, bossSeal, builder, pchest:[Index]
PF.PREMIUM_PACKS = {
  offers: [
    { id: 'starter', name: 'Starterpaket', once: true, icon: 'pchests/0_0', price: { h: 2, min: 8000 }, badge: 'Einmalig',
      give: { pchest: [0, 0], stardust: 200 } },
    { id: 'alchemist', name: 'Alchemisten-Schatz', icon: 'pchests/2_0', price: { h: 12, min: 80000 }, badge: 'Bestes Angebot',
      give: { pchest: [2], stardust: 600 } },
    { id: 'builder', name: 'Baumeister-Vertrag', icon: 'construct/0_3', price: { h: 48, min: 250000 },
      give: { builder: 1 }, cond: () => (PF.S.builders || 1) < PF.BUILDERS.max },
  ],
  other: [
    { id: 'sd1', name: 'Sternenstaub-Phiole', icon: 'currency/2_1', price: { h: 2,  min: 10000 },  give: { stardust: 300 } },
    { id: 'sd2', name: 'Sternenstaub-Krug',   icon: 'currency/2_3', price: { h: 5,  min: 28000 },  give: { stardust: 900 }, badge: '+20 %' },
    { id: 'sd3', name: 'Sternenstaub-Fass',   icon: 'currency/2_4', price: { h: 10, min: 60000 },  give: { stardust: 2000 }, badge: '+35 %' },
    { id: 'bs1', name: 'Boss-Siegel ×10',     icon: 'currency/4_1', price: { h: 8,  min: 50000 },  give: { bossSeal: 10 } },
    { id: 'bs2', name: 'Boss-Siegel ×40',     icon: 'currency/4_3', price: { h: 28, min: 180000 }, give: { bossSeal: 40 }, badge: '+15 %' },
  ],
};

// Normale Truhen in der Schatzkammer (gleiches Preisprinzip)
PF.GOLD_CHEST = [
  { r: 0, hours: 0.33, min: 600 },
  { r: 1, hours: 1.5,  min: 8000 },
  { r: 2, hours: 6,    min: 40000 },
  { r: 3, hours: 16,   min: 150000 },
  { r: 4, hours: 40,   min: 400000 },
];
