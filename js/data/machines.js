// Alles was man bauen kann. tiers = Sprites je Seltenheitsstufe (0 = Gewöhnlich … 4 = Legendär)
// zone: 'garden' nur im Garten, 'any' überall außer auf Beeten
window.PF = window.PF || {};

const tierRow = (sheet, row) => [0, 1, 2, 3, 4].map(c => `${sheet}/${row}_${c}`);

PF.BUILD = {
  plot: {
    name: 'Beet', cat: 'garden', zone: 'garden', cost: 25, costGrow: 1.14, unlock: 1,
    desc: 'Hier wachsen deine Zutaten. Klick: gießen / ernten.',
    icon: 'beds/0_0', tiers: tierRow('beds', 0).map((s, i) => `beds/${i}_0`),
  },
  sprinkler: {
    name: 'Zauber-Sprinkler', cat: 'garden', zone: 'garden', cost: 1500, costGrow: 1.35, unlock: 9,
    desc: 'Gießt automatisch alle Beete im Umkreis.', icon: 'machine_tiers_b/3_0',
    tiers: tierRow('machine_tiers_b', 3), scale: 1.25,
  },
  // Startgebäude: Handwerk von Hand (Mörsern + Brauen per Klick)
  workbench: {
    name: 'Alchemietisch', cat: 'none', zone: 'any', cost: 0, costGrow: 1, unlock: 99, passive: true, noTiers: true,
    desc: 'Hier mörserst und braust du von Hand – bis Maschinen das übernehmen.', icon: 'shop/2_1', tiers: ['shop/2_1'], scale: 1.25,
  },
  // ---------- Wasser ----------
  well: {
    name: 'Brunnen', cat: 'garden', zone: 'garden', cost: 1500, costGrow: 1.9, unlock: 5, passive: true,
    water: { regen: 0.5 }, pumpCd: 4,
    desc: 'Liefert Wasser (+0,5/s je Stufe). Anklicken = kräftig pumpen (alle 4 s).', icon: 'buildings/1_2', tiers: ['buildings/1_2'], scale: 1.6,
  },
  rainbarrel: {
    name: 'Regentonne', cat: 'garden', zone: 'garden', cost: 400, costGrow: 1.5, unlock: 4, passive: true,
    water: { regen: 0.12, cap: 15 },
    desc: 'Sammelt Regen (+0,12/s) und speichert 15 Wasser je Stufe.', icon: 'beds/0_2', tiers: [0, 1, 2, 3, 4].map(r => `beds/${r}_2`), scale: 1.2,
  },
  tank: {
    name: 'Wasserfass', cat: 'factory', zone: 'any', cost: 1200, costGrow: 1.6, unlock: 8, passive: true,
    water: { cap: 40 },
    desc: 'Speichert 40 Wasser je Stufe. Kessel brauchen Wasser zum Brauen.', icon: 'props/3_2', tiers: ['props/3_2'], scale: 0.95,
  },
  belt: {
    name: 'Förderband', cat: 'factory', zone: 'any', cost: 10, costGrow: 1.0, unlock: 4,
    desc: 'Transportiert Zutaten und Tränke. R = drehen.', icon: 'belt_tiers/0_0', belt: true,
  },
  collector: {
    name: 'Erntekiste', cat: 'factory', zone: 'any', cost: 300, costGrow: 1.6, unlock: 4, speed: 4,
    desc: 'Nimmt Ernte aus dem Vorrat und legt sie aufs Band.', icon: 'machine_tiers_b/2_0',
    tiers: tierRow('machine_tiers_b', 2), scale: 1.25,
  },
  mortar: {
    name: 'Mörser', cat: 'factory', zone: 'any', cost: 600, costGrow: 1.45, unlock: 4, time: 2.4,
    desc: 'Zermahlt Ernte zu Pulver.', icon: 'machine_tiers_a/0_0', tiers: tierRow('machine_tiers_a', 0), scale: 1.3,
  },
  mill: {
    name: 'Mahlwerk', cat: 'factory', zone: 'any', cost: 12000, costGrow: 1.6, unlock: 18, time: 3.0, yield: 2,
    desc: 'Mahlt doppelt: 1 Ernte = 2 Pulver.', icon: 'machines/0_1', tiers: ['machines/0_1'], scale: 1.3, noTiers: true,
  },
  cauldron: {
    name: 'Kessel', cat: 'factory', zone: 'any', cost: 2500, costGrow: 1.5, unlock: 7,
    desc: 'Braut aus Pulvern Tränke. Rezept wählbar oder Auto.', icon: 'machine_tiers_a/1_0', tiers: tierRow('machine_tiers_a', 1), scale: 1.35,
  },
  distillery: {
    name: 'Destille', cat: 'factory', zone: 'any', cost: 10000, costGrow: 1.6, unlock: 14, time: 3,
    desc: 'Veredelt Gebräu: +1 Qualitätsstern (max. 3), je Stern +50 % Wert.', icon: 'machine_tiers_a/2_0', tiers: tierRow('machine_tiers_a', 2), scale: 1.35,
  },
  bottler: {
    name: 'Abfüller', cat: 'factory', zone: 'any', cost: 2000, costGrow: 1.5, unlock: 7, time: 2.0,
    desc: 'Füllt Gebräu in Flaschen ab.', icon: 'machine_tiers_a/3_0', tiers: tierRow('machine_tiers_a', 3), scale: 1.3,
  },
  labeler: {
    name: 'Etikettierer', cat: 'factory', zone: 'any', cost: 6000, costGrow: 1.6, unlock: 12, time: 1.6,
    desc: 'Etikettierte Tränke sind 30 % mehr wert.', icon: 'machine_tiers_b/0_0', tiers: tierRow('machine_tiers_b', 0), scale: 1.3,
  },
  seller: {
    name: 'Verkaufsschacht', cat: 'factory', zone: 'any', cost: 1500, costGrow: 1.7, unlock: 7,
    desc: 'Schickt Tränke in den Laden-Vorrat.', icon: 'machines_adv/2_2', tiers: ['machines_adv/2_2'], scale: 1.3, noTiers: true,
  },
  sorter: {
    name: 'Sortierer', cat: 'factory', zone: 'any', cost: 5000, costGrow: 1.4, unlock: 13,
    desc: 'Passendes geht geradeaus (Pfeil), alles andere nach rechts. Filter im Inspektor wählen.', icon: 'machine_tiers_b/1_0', tiers: tierRow('machine_tiers_b', 1), scale: 1.3,
  },
  storage: {
    name: 'Lager', cat: 'factory', zone: 'any', cost: 300, costGrow: 1.5, unlock: 4,
    desc: 'Nimmt alles vom Band und legt es in den Vorrat.', icon: 'machines/2_2', tiers: ['machines/2_2'], scale: 1.25, noTiers: true,
  },

  // ---------- Spezialmaschinen (Sprites machines_adv/<zeile>_<spalte>) ----------
  desk: {
    name: 'Forschungstisch', cat: 'special', zone: 'any', cost: 40000, costGrow: 2.2, unlock: 16, time: 2.0,
    desc: 'Verbraucht Tränke und wandelt sie in Sternenstaub um (mehr bei seltenen Tränken).', icon: 'machines_adv/3_0', tiers: ['machines_adv/3_0'], scale: 1.35,
  },
  recycler: {
    name: 'Recycler', cat: 'special', zone: 'any', cost: 60000, costGrow: 2.0, unlock: 19, time: 2.5,
    desc: 'Frisst 3 Ernte/Pulver und spuckt 1 Ernte einer selteneren Pflanze aus.', icon: 'machines_adv/3_1', tiers: ['machines_adv/3_1'], scale: 1.35,
  },
  condenser: {
    name: 'Mondlicht-Kondensator', cat: 'special', zone: 'any', cost: 120000, costGrow: 2.6, unlock: 21, time: 240,
    desc: 'Sammelt Mondlicht: erzeugt alle paar Minuten einen Mondstein. Ganz von allein.', icon: 'machines_adv/0_1', tiers: ['machines_adv/0_1'], scale: 1.4, passive: true,
  },
  runes: {
    name: 'Runenkreis', cat: 'special', zone: 'any', cost: 150000, costGrow: 2.2, unlock: 23,
    desc: 'Aura: Maschinen im Umkreis arbeiten schneller (+40 %, +20 % je Stufe).', icon: 'machines_adv/1_1', tiers: ['machines_adv/1_1'], scale: 1.35, passive: true, aura: 'machine',
  },
  teleporter: {
    name: 'Teleporter', cat: 'special', zone: 'any', cost: 200000, costGrow: 1.8, unlock: 25,
    desc: 'Schickt Items zum nächsten Teleporter. Ohne Partner landen sie direkt im Vorrat – perfekt für Biome.', icon: 'machines_adv/3_2', tiers: ['machines_adv/3_2'], scale: 1.35,
  },
  forge: {
    name: 'Feuerschmiede', cat: 'special', zone: 'any', cost: 250000, costGrow: 2.0, unlock: 27, time: 2.5, yield: 3,
    desc: 'Schmilzt Ernte zu dreifachem Pulver.', icon: 'machines_adv/1_0', tiers: ['machines_adv/1_0'], scale: 1.35,
  },
  infuser: {
    name: 'Kristall-Infuser', cat: 'special', zone: 'any', cost: 350000, costGrow: 2.0, unlock: 29, time: 4,
    desc: 'Kristallisiert Tränke: doppelter Verkaufswert.', icon: 'machines_adv/0_0', tiers: ['machines_adv/0_0'], scale: 1.35,
  },
  frost: {
    name: 'Frostkammer', cat: 'special', zone: 'any', cost: 450000, costGrow: 2.0, unlock: 31, time: 7,
    desc: 'Schockfrostet Gebräu: +2 Qualitätssterne auf einmal (max. 3).', icon: 'machines_adv/0_2', tiers: ['machines_adv/0_2'], scale: 1.35,
  },
  mixer: {
    name: 'Trank-Mixer', cat: 'special', zone: 'any', cost: 600000, costGrow: 2.0, unlock: 33,
    desc: 'Ein Kessel mit Turbo: braut automatisch und liefert 2 Gebräue pro Durchgang.', icon: 'machines_adv/1_2', tiers: ['machines_adv/1_2'], scale: 1.35,
  },
  ghost: {
    name: 'Geister-Generator', cat: 'special', zone: 'any', cost: 500000, costGrow: 2.2, unlock: 35,
    desc: 'Aura: Förderbänder im Umkreis laufen doppelt so schnell.', icon: 'machines_adv/2_0', tiers: ['machines_adv/2_0'], scale: 1.35, passive: true, aura: 'belt',
  },
  soul: {
    name: 'Seelenextraktor', cat: 'special', zone: 'any', cost: 1000000, costGrow: 2.2, unlock: 38, time: 3,
    desc: 'Verbraucht Tränke: epische geben 1, legendäre 3 Mondsteine, andere selten einen.', icon: 'machines_adv/2_1', tiers: ['machines_adv/2_1'], scale: 1.35,
  },
};

// Deko (Garten): kleiner globaler Gold-Bonus je Seltenheit
PF.DECOR = [];
['Statue', 'Brunnen', 'Banner', 'Laternenbogen', 'Zauberbaum'].forEach((n, c) => {
  for (let r = 0; r < 5; r++) {
    PF.DECOR.push({
      id: `decor_${c}_${r}`, name: `${n} (${PF.RARITY[r].name})`, sprite: `decor/${r}_${c}`, r,
      cost: r < 2 ? { gold: [300, 2500][r] * (c + 1) } : r < 4 ? { moonstone: [25, 70][r - 2] } : { bossSeal: 4 },
      bonus: [0.01, 0.02, 0.04, 0.07, 0.12][r], unlock: 2 + r * 5,
    });
  }
});

// Upgrade-Kosten je Stufe (Index = Zielstufe)
PF.TIER_COST = [
  null,
  (b) => ({ gold: Math.round(b * 6) }),
  (b) => ({ gold: Math.round(b * 30), stardust: 10 }),
  (b) => ({ gold: Math.round(b * 250), moonstone: 10 }),
  (b) => ({ gold: Math.round(b * 1500), moonstone: 25, bossSeal: 1 }),
];
PF.TIER_SPEED = [1, 1.5, 2.2, 3.2, 4.6];
