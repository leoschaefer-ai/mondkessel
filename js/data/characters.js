// Kunden, Bosse, Spieler-Skins, Helfer, Pets
window.PF = window.PF || {};

// sheet + row -> Sprites "<sheet>/<row>_idle_f" usw.
PF.CUSTOMERS = [
  { id: 'vampir',    name: 'Graf Vlad',          sheet: 'cust_a', row: 0, portrait: 'portraits/1_1', from: 1 },
  { id: 'werwolf',   name: 'Wolfram',            sheet: 'cust_a', row: 1, portrait: 'portraits/1_2', from: 1 },
  { id: 'troll',     name: 'Brückentroll Grunz', sheet: 'cust_a', row: 2, portrait: 'portraits/1_3', from: 2 },
  { id: 'fee',       name: 'Dunkelfee Nyx',      sheet: 'cust_a', row: 3, portrait: 'portraits/2_0', from: 1 },
  { id: 'pirat',     name: 'Käpt\'n Knochen',    sheet: 'cust_b', row: 0, portrait: 'portraits/2_1', from: 3 },
  { id: 'pest',      name: 'Doktor Schnabel',    sheet: 'cust_b', row: 1, portrait: 'portraits/2_2', from: 4 },
  { id: 'frosch',    name: 'Froschprinz Quaak',  sheet: 'cust_b', row: 2, portrait: 'portraits/2_3', from: 2 },
  { id: 'katze',     name: 'Händlerin Mauz',     sheet: 'cust_b', row: 3, portrait: 'portraits/3_0', from: 5 },
  { id: 'elf',       name: 'Waldläuferin Ilva',  sheet: 'cust_c', row: 0, portrait: 'portraits/0_1', from: 6 },
  { id: 'zwerg',     name: 'Bergmann Borin',     sheet: 'cust_c', row: 1, portrait: 'portraits/3_1', from: 7 },
  { id: 'nekro',     name: 'Lehrling Morbus',    sheet: 'cust_c', row: 2, portrait: 'portraits/3_2', from: 8 },
  { id: 'scheuche',  name: 'Kürbiskopf Jack',    sheet: 'cust_c', row: 3, portrait: 'portraits/3_3', from: 9 },
  { id: 'banshee',   name: 'Banshee Ailis',      sheet: 'cust_d', row: 0, portrait: 'portraits/1_0', from: 11 },
  { id: 'minotaur',  name: 'Schmied Asterion',   sheet: 'cust_d', row: 1, portrait: 'portraits/0_3', from: 12 },
  { id: 'zyklop',    name: 'Hirte Polyphem',     sheet: 'cust_d', row: 2, portrait: 'portraits/0_2', from: 14 },
  { id: 'imp',       name: 'Tüftler Zibbel',     sheet: 'cust_d', row: 3, portrait: 'portraits/0_0', from: 16 },
];

// Ein Boss pro 10 Wellen (danach Rotation, stärker skaliert)
PF.BOSSES = [
  { id: 'lich',      name: 'Der Lichkönig',        sheet: 'bosses_a', row: 0, title: 'Herr der Gruft' },
  { id: 'hexe',      name: 'Die Sumpfhexe',        sheet: 'bosses_a', row: 1, title: 'Mutter des Moors' },
  { id: 'daemon',    name: 'Schattendämon Azhul',  sheet: 'bosses_a', row: 2, title: 'Fürst der Leere' },
  { id: 'drachen',   name: 'Der Drachenritter',    sheet: 'bosses_a', row: 3, title: 'Eid aus Asche' },
  { id: 'kuerbis',   name: 'Der Kürbiskönig',      sheet: 'bosses_b', row: 0, title: 'Herrscher der Erntenacht' },
  { id: 'frost',     name: 'Die Frostkönigin',     sheet: 'bosses_b', row: 1, title: 'Ewiger Winter' },
  { id: 'baum',      name: 'Der Uralte Hirte',     sheet: 'bosses_b', row: 2, title: 'Wurzel aller Wälder' },
  { id: 'krake',     name: 'Die Krakenhexe',       sheet: 'bosses_b', row: 3, title: 'Stimme der Tiefe' },
  { id: 'vampgraf',  name: 'Der Vampirgraf',       sheet: 'bosses_c', row: 0, title: 'Durst der Jahrhunderte' },
  { id: 'knochen',   name: 'Der Knochendrache',    sheet: 'bosses_c', row: 1, title: 'Seelenfeuer' },
  { id: 'mond',      name: 'Die Mondgöttin',       sheet: 'bosses_c', row: 2, title: 'Hüterin der Nacht' },
  { id: 'narr',      name: 'Der Schattennarr',     sheet: 'bosses_c', row: 3, title: 'Lachen im Dunkel' },
];

// Spieler-Skins (Zeile = Seltenheit)
PF.SKINS = [
  { id: 0, name: 'Werkstatt-Gnom',     r: 0, cost: null },
  { id: 1, name: 'Kräuterlehrling',    r: 1, cost: { gold: 5000 } },
  { id: 2, name: 'Runenmagier',        r: 2, cost: { moonstone: 60 } },
  { id: 3, name: 'Erzmagier der Nacht', r: 3, cost: { moonstone: 180 } },
  { id: 4, name: 'Goldener Alchemist', r: 4, cost: { bossSeal: 12 } },
];

// Helfer ernten automatisch und pflanzen nach (sheet 'helpers', Zeile r, Frames 0–3 rechts, 4–7 vorn)
PF.HELPERS = [
  { id: 'gnom',   name: 'Karren-Gnom',     row: 0, r: 0, speed: 1.6, cost: { gold: 20000 },   costGrow: 2.2, unlock: 11 },
  { id: 'golem',  name: 'Moos-Golem',      row: 1, r: 1, speed: 2.0, cost: { gold: 60000 },   costGrow: 2.2, unlock: 16 },
  { id: 'imp',    name: 'Sack-Imp',        row: 2, r: 2, speed: 2.8, cost: { moonstone: 40 }, costGrow: 1.8, unlock: 22 },
  { id: 'besen',  name: 'Zauberbesen',     row: 3, r: 3, speed: 3.6, cost: { moonstone: 120 }, costGrow: 1.8, unlock: 30 },
  { id: 'kaefer', name: 'Uhrwerk-Käfer',   row: 4, r: 4, speed: 4.8, cost: { bossSeal: 8 },   costGrow: 1.6, unlock: 38 },
];

// Pets folgen dem Spieler und geben Boni. Sprite: pets/<rarity>_<species>
PF.PET_SPECIES = [
  { id: 'katze',  name: 'Schwarze Katze', col: 0, stat: 'gold',   label: 'Gold' },
  { id: 'rabe',   name: 'Rabe',           col: 1, stat: 'xp',     label: 'XP' },
  { id: 'kroete', name: 'Kröte',          col: 2, stat: 'growth', label: 'Wachstum' },
  { id: 'fleder', name: 'Fledermaus',     col: 3, stat: 'speed',  label: 'Maschinen-Tempo' },
  { id: 'fuchs',  name: 'Geisterfuchs',   col: 4, stat: 'luck',   label: 'Glück (Loot)' },
];
PF.PET_BONUS = [0.04, 0.08, 0.14, 0.22, 0.35];
