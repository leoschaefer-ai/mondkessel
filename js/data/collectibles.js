// Werkzeuge, Truhen, Laden-Angebote, Daily-Rewards
window.PF = window.PF || {};

// Werkzeuge: Sprite <sheet>/<rarity>_<col>. Bonus = PF.RARITY[r].bonus (5 %…50 %). Bestes Werkzeug je Typ wirkt automatisch.
PF.TOOLS = [
  { id: 'schaufel',   name: 'Schaufel',        sheet: 'tools_garden',  col: 0, stat: 'yield',     label: 'Extra-Ernte-Chance' },
  { id: 'kanne',      name: 'Gießkanne',       sheet: 'tools_garden',  col: 1, stat: 'growth',    label: 'Wachstum' },
  { id: 'sichel',     name: 'Sichel',          sheet: 'tools_garden',  col: 2, stat: 'harvestXp', label: 'Ernte-XP' },
  { id: 'hacke',      name: 'Hacke',           sheet: 'tools_garden',  col: 3, stat: 'seedDrop',  label: 'Samenfund-Chance' },
  { id: 'saatbeutel', name: 'Saatbeutel',      sheet: 'tools_garden',  col: 4, stat: 'seedCost',  label: 'Saatgut-Rabatt' },
  { id: 'handschuhe', name: 'Gartenhandschuhe', sheet: 'tools_garden', col: 5, stat: 'click',     label: 'Klick-Kraft' },
  { id: 'stoessel',   name: 'Stößel',          sheet: 'tools_alchemy', col: 0, stat: 'grind',     label: 'Mörser-Tempo' },
  { id: 'kelle',      name: 'Rührkelle',       sheet: 'tools_alchemy', col: 1, stat: 'brew',      label: 'Kessel-Tempo' },
  { id: 'hammer',     name: 'Alchemistenhammer', sheet: 'tools_alchemy', col: 2, stat: 'build',   label: 'Bau-Rabatt' },
  { id: 'schluessel', name: 'Schraubenschlüssel', sheet: 'tools_alchemy', col: 3, stat: 'speed',  label: 'Maschinen-Tempo' },
  { id: 'lupe',       name: 'Magische Lupe',   sheet: 'tools_alchemy', col: 4, stat: 'luck',      label: 'Glück (Loot)' },
  { id: 'brauhand',   name: 'Brau-Handschuhe', sheet: 'tools_alchemy', col: 5, stat: 'value',     label: 'Trankwert' },
];
PF.TOOL = Object.fromEntries(PF.TOOLS.map(t => [t.id, t]));
PF.TOOL_PRICE = [{ gold: 400 }, { gold: 4000 }, { stardust: 60 }, { moonstone: 90 }, { bossSeal: 10 }];

// Truhen: Sprite chests/<r>_<0 zu|1 öffnet|2 offen>
PF.CHESTS = [
  { r: 0, name: 'Holztruhe',          drops: 2, price: { gold: 600 } },
  { r: 1, name: 'Eisentruhe',         drops: 3, price: { moonstone: 15 } },
  { r: 2, name: 'Runentruhe',         drops: 4, price: { moonstone: 40 } },
  { r: 3, name: 'Kristalltruhe',      drops: 5, price: { moonstone: 100 } },
  { r: 4, name: 'Legendäre Goldtruhe', drops: 6, price: { bossSeal: 10 } },
];

// Laden für Mondsteine: Pakete (Sprites currency/<row>_<col>)
PF.MOON_OFFERS = [
  { name: 'Handvoll Sternenstaub', icon: 'currency/2_1', give: { stardust: 25 },  price: { moonstone: 10 } },
  { name: 'Haufen Sternenstaub',   icon: 'currency/2_3', give: { stardust: 120 }, price: { moonstone: 40 } },
  { name: 'Goldbeutel',            icon: 'currency/0_2', give: { goldHours: 1 },  price: { moonstone: 12 }, desc: '1 Stunde Einkommen' },
  { name: 'Goldschatz',            icon: 'currency/0_4', give: { goldHours: 6 },  price: { moonstone: 55 }, desc: '6 Stunden Einkommen' },
];

// 7-Tage-Kalender (Streak)
PF.DAILY = [
  { label: 'Gold',         give: { goldHours: 0.5 },          icon: 'currency/0_2' },
  { label: 'Sternenstaub', give: { stardust: 20 },            icon: 'currency/2_1' },
  { label: 'Holztruhe',    give: { chest: 0 },                icon: 'chests/0_0' },
  { label: 'Mondsteine',   give: { moonstone: 20 },           icon: 'currency/1_1' },
  { label: 'Eisentruhe',   give: { chest: 1 },                icon: 'chests/1_0' },
  { label: 'Mondsteine',   give: { moonstone: 40 },           icon: 'currency/1_2' },
  { label: 'Runentruhe',   give: { chest: 2, moonstone: 50 }, icon: 'chests/2_0' },
];
