// Gartenpflanzen. sheet/row = Sprite-Zeile mit 4 Wachstumsstufen (Spalten 0–3)
window.PF = window.PF || {};

PF.CROPS = [
  // Basis-Pflanzen: Samen kosten Gold
  { id: 'moonpetal',  name: 'Mondblüte',      sheet: 'crops', row: 0, grow: 60, seedCost: 2,  unlock: 1,  rarity: 0, color: '#a9b4ff', icon: 'ingredients/0_0', powder: 'ingredients/1_0', powderName: 'Mondblüten-Pulver' },
  { id: 'nightshade', name: 'Nachtschatten',  sheet: 'crops', row: 1, grow: 90, seedCost: 3,  unlock: 5,  rarity: 0, color: '#8a4dd6', icon: 'ingredients/0_1', powder: 'ingredients/1_1', powderName: 'Nachtschatten-Paste' },
  { id: 'batwing',    name: 'Fledermausfarn', sheet: 'crops', row: 4, grow: 120, seedCost: 5,  unlock: 8,  rarity: 1, color: '#9b5bd0', icon: 'ingredients/0_4', powder: 'ingredients/1_4', powderName: 'Flügelstaub' },
  { id: 'glowcap',    name: 'Glühkappe',      sheet: 'crops', row: 2, grow: 150, seedCost: 6,  unlock: 10,  rarity: 1, color: '#62ff7a', icon: 'ingredients/0_2', powder: 'ingredients/1_2', powderName: 'Glühsporen' },
  { id: 'mandrake',   name: 'Alraune',        sheet: 'crops', row: 3, grow: 240, seedCost: 9,  unlock: 13,  rarity: 1, color: '#c9a36b', icon: 'ingredients/0_3', powder: 'ingredients/1_3', powderName: 'Alraunen-Scheiben' },
  { id: 'ember',      name: 'Glutschote',     sheet: 'crops', row: 5, grow: 300, seedCost: 12, unlock: 15,  rarity: 1, color: '#ff7a2e', icon: 'ingredients/0_5', powder: 'ingredients/1_5', powderName: 'Glutflocken' },
  // Seltene Pflanzen: Samen aus Truhen oder Forschung (Sternenstaub)
  { id: 'bloodrose',    name: 'Blutrose',       sheet: 'crops_rare', row: 0, grow: 480,  seedItem: true, seedStardust: 4,  unlock: 18, rarity: 2, color: '#e0303f', icon: 'ingredients_b/3_5' },
  { id: 'frostlily',    name: 'Frostlilie',     sheet: 'crops_rare', row: 1, grow: 600,  seedItem: true, seedStardust: 5,  unlock: 21, rarity: 2, color: '#8fe3ff', icon: 'ingredients_b/2_1' },
  { id: 'starwheat',    name: 'Sternenweizen',  sheet: 'crops_rare', row: 2, grow: 900,  seedItem: true, seedStardust: 7,  unlock: 25, rarity: 3, color: '#ffe27a', icon: 'ingredients_b/4_3' },
  { id: 'ghostpumpkin', name: 'Geisterkürbis',  sheet: 'crops_rare', row: 3, grow: 1200,  seedItem: true, seedStardust: 8,  unlock: 28, rarity: 3, color: '#b8ffd9', icon: 'ingredients/4_1' },
  { id: 'dragonfruit',  name: 'Drachenkaktus',  sheet: 'crops_rare', row: 4, grow: 1800, seedItem: true, seedStardust: 12, unlock: 34, rarity: 4, color: '#ff4d1f', icon: 'ingredients_b/4_1' },
  { id: 'eyeball',      name: 'Augenpflanze',   sheet: 'crops_rare', row: 5, grow: 2400, seedItem: true, seedStardust: 15, unlock: 38, rarity: 4, color: '#ff9ad5', icon: 'ingredients/2_1' },
];
PF.CROP = Object.fromEntries(PF.CROPS.map(c => [c.id, c]));
