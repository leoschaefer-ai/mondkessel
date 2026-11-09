// Bauzeiten, Baumeister, Hindernisse, Handwerk – angelehnt an Clash of Clans / DragonVale:
// Anfang Sekunden, dann Minuten, später Stunden. Baumeister sind der Engpass, Mondsteine beschleunigen.
window.PF = window.PF || {};

// Bauzeit in Sekunden für das ERSTE Gebäude eines Typs; jedes weitere dauert ×1,12 länger (max. ×3)
PF.BUILD_TIME = {
  plot: 0, workbench: 0, belt: 0,
  well: 600, rainbarrel: 300, tank: 1200, sprinkler: 1800,
  collector: 120, mortar: 300, storage: 120, cauldron: 900, bottler: 600, seller: 600,
  labeler: 3600, sorter: 2700, distillery: 3 * 3600, mill: 6 * 3600,
  desk: 4 * 3600, recycler: 6 * 3600, condenser: 10 * 3600, runes: 8 * 3600, teleporter: 12 * 3600, forge: 12 * 3600,
  infuser: 16 * 3600, frost: 16 * 3600, mixer: 24 * 3600, ghost: 20 * 3600, soul: 36 * 3600,
};
PF.BUILD_TIME_GROW = 1.12;
// Aufwertung auf Stufe 1–4 (Ungewöhnlich … Legendär)
PF.TIER_TIME = [0, 20 * 60, 2 * 3600, 8 * 3600, 24 * 3600];
PF.TIER_TIME_MUL = { plot: 0.25, belt: 0.03, well: 0.5, rainbarrel: 0.5, tank: 0.5, sprinkler: 0.6 };

// Baumeister: 1 gratis, weitere für Mondsteine (CoC: 250/500/1000/2000 Gems – hier auf unsere Mondstein-Wirtschaft skaliert)
PF.BUILDERS = { start: 1, max: 5, cost: [null, null, 50, 150, 400, 1000] };
// Beschleunigen: 1 Mondstein je angefangene 5 Minuten; unter 15 s gratis
PF.SKIP = { secPerStone: 300, free: 15 };

// Hindernisse: Bäume (Garten/Biome) & Steine (Fabrik), 5 Größen
// CoC: kleine Hindernisse ~500, große ~20.000 (×40); dabei fallen gelegentlich Gems ab
PF.OBSTACLES = {
  tree: { names: ['Dornbusch', 'Moosstumpf', 'Junger Zwielichtbaum', 'Knorrige Eiche', 'Uralter Mondbaum'], verb: 'Fällen' },
  rock: { names: ['Kieselhaufen', 'Moosstein', 'Felsbrocken', 'Zackenfels', 'Kristallfels'], verb: 'Sprengen' },
};
PF.OBSTACLE_SIZE = [
  null,
  { cost: 40,    time: 5,    xp: 3,   gem: 0.10, w: 0.9 },
  { cost: 220,   time: 30,   xp: 8,   gem: 0.15, w: 1.05 },
  { cost: 1000,  time: 120,  xp: 20,  gem: 0.25, w: 1.3 },
  { cost: 4500,  time: 600,  xp: 50,  gem: 0.40, w: 1.6 },
  { cost: 20000, time: 2700, xp: 120, gem: 0.60, w: 2.0 },
];
PF.ROCK_COST_MUL = 1.5;

// Handwerk am Alchemietisch (bevor es Maschinen gibt)
PF.CRAFT = { grindClicks: 3, brewClicks: 5, xpGrind: 0.5, xpBrew: 2 };
