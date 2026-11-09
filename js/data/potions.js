// Tränke & Rezepte. in = benötigte Pulver (Pflanzen-ID -> Anzahl)
// unlock = Level ab dem das Rezept verfügbar ist.
// Gewöhnlich/Ungewöhnlich werden automatisch freigeschaltet, ab Selten per Forschung (Sternenstaub) oder Rezept-Drop,
// Boss-Tränke nur mit Boss-Siegeln.
window.PF = window.PF || {};

PF.POTIONS = [
  // Gewöhnlich
  { id: 'schlaf',     name: 'Schlaftrank',          icon: 'potions_b/0_0', r: 0, value: 12,  time: 4, unlock: 1,  in: { moonpetal: 2 } },
  { id: 'stink',      name: 'Stinktrank',           icon: 'potions_b/0_4', r: 0, value: 16,  time: 4, unlock: 2,  in: { nightshade: 2 } },
  { id: 'heil',       name: 'Heiltonikum',          icon: 'potions_b/0_1', r: 0, value: 20,  time: 5, unlock: 2,  in: { moonpetal: 1, nightshade: 1 } },
  { id: 'nachtsicht', name: 'Nachtsicht-Tropfen',   icon: 'potions_b/0_2', r: 0, value: 26,  time: 5, unlock: 4,  in: { glowcap: 2 } },
  { id: 'gluehsaft',  name: 'Glühsaft',             icon: 'potions_b/0_5', r: 0, value: 24,  time: 5, unlock: 4,  in: { glowcap: 1, moonpetal: 1 } },
  { id: 'waerme',     name: 'Wärmetrunk',           icon: 'potions_b/0_3', r: 0, value: 34,  time: 6, unlock: 8,  in: { ember: 1, moonpetal: 1 } },
  // Ungewöhnlich
  { id: 'fledermaus', name: 'Fledermaustrank',      icon: 'potions/5_0',   r: 1, value: 48,  time: 6, unlock: 3,  in: { batwing: 2, nightshade: 1 } },
  { id: 'unsichtbar', name: 'Unsichtbarkeitstrank', icon: 'potions_b/1_2', r: 1, value: 58,  time: 6, unlock: 5,  in: { moonpetal: 2, batwing: 1 } },
  { id: 'frosch',     name: 'Froschstimmen-Trank',  icon: 'potions_b/1_1', r: 1, value: 62,  time: 7, unlock: 5,  in: { batwing: 1, glowcap: 1, nightshade: 1 } },
  { id: 'wachstum',   name: 'Wachstumselixier',     icon: 'potions_b/1_0', r: 1, value: 70,  time: 7, unlock: 6,  in: { mandrake: 1, glowcap: 1 } },
  { id: 'glueck',     name: 'Glückstonikum',        icon: 'potions_b/1_3', r: 1, value: 80,  time: 7, unlock: 7,  in: { mandrake: 2, moonpetal: 1 } },
  { id: 'schrumpf',   name: 'Schrumpftrank',        icon: 'potions_b/1_5', r: 1, value: 76,  time: 7, unlock: 7,  in: { mandrake: 1, nightshade: 2 } },
  { id: 'tempo',      name: 'Tempotrank',           icon: 'potions_b/1_4', r: 1, value: 92,  time: 8, unlock: 9,  in: { ember: 1, batwing: 2 } },
  // Selten
  { id: 'flug',       name: 'Flugtrank',            icon: 'potions_b/2_2', r: 2, value: 160, time: 9, unlock: 10, research: 15, in: { batwing: 3, moonpetal: 2 } },
  { id: 'riesen',     name: 'Riesenkraft',          icon: 'potions_b/2_3', r: 2, value: 175, time: 9, unlock: 11, research: 18, in: { mandrake: 2, ember: 2 } },
  { id: 'wahrheit',   name: 'Wahrheitsserum',       icon: 'potions_b/2_4', r: 2, value: 190, time: 9, unlock: 12, research: 20, in: { bloodrose: 1, nightshade: 2 } },
  { id: 'liebe',      name: 'Liebestrank',          icon: 'potions/5_4',   r: 2, value: 210, time: 9, unlock: 12, research: 22, in: { bloodrose: 2, moonpetal: 1 } },
  { id: 'gedanken',   name: 'Gedankenlesen',        icon: 'potions_b/2_5', r: 2, value: 200, time: 10, unlock: 13, research: 24, in: { bloodrose: 1, glowcap: 2, moonpetal: 1 } },
  { id: 'frost',      name: 'Frosttrank',           icon: 'potions_b/2_0', r: 2, value: 220, time: 10, unlock: 14, research: 26, in: { frostlily: 2, moonpetal: 1 } },
  { id: 'wasser',     name: 'Wasseratmung',         icon: 'potions_b/2_1', r: 2, value: 240, time: 10, unlock: 15, research: 28, in: { frostlily: 1, glowcap: 2 } },
  { id: 'mond',       name: 'Mondtrank',            icon: 'potions/5_2',   r: 2, value: 270, time: 10, unlock: 17, research: 32, in: { starwheat: 1, moonpetal: 3 } },
  // Episch
  { id: 'werwolf',    name: 'Werwolf-Heilung',      icon: 'potions_b/3_0', r: 3, value: 480, time: 12, unlock: 18, research: 60,  in: { bloodrose: 2, mandrake: 2 } },
  { id: 'vampir',     name: 'Vampirblut-Elixier',   icon: 'potions_b/3_1', r: 3, value: 540, time: 12, unlock: 19, research: 70,  in: { bloodrose: 3, nightshade: 2 } },
  { id: 'geist',      name: 'Geistertrank',         icon: 'potions/5_1',   r: 3, value: 560, time: 12, unlock: 20, research: 75,  in: { ghostpumpkin: 3 } },
  { id: 'traum',      name: 'Traumtrank',           icon: 'potions_b/3_4', r: 3, value: 600, time: 13, unlock: 21, research: 80,  in: { starwheat: 1, moonpetal: 3, glowcap: 1 } },
  { id: 'gift',       name: 'Totenkopf-Gift',       icon: 'potions/5_3',   r: 3, value: 620, time: 13, unlock: 21, research: 85,  in: { nightshade: 4, ghostpumpkin: 1 } },
  { id: 'schatten',   name: 'Schattengang',         icon: 'potions_b/3_2', r: 3, value: 660, time: 13, unlock: 22, research: 90,  in: { ghostpumpkin: 2, batwing: 2 } },
  { id: 'zeitlupe',   name: 'Zeitlupen-Trank',      icon: 'potions_b/3_3', r: 3, value: 700, time: 14, unlock: 23, research: 100, in: { starwheat: 2, frostlily: 2 } },
  { id: 'sturm',      name: 'Sturmtrank',           icon: 'potions/5_5',   r: 3, value: 720, time: 14, unlock: 24, research: 110, in: { ember: 2, frostlily: 2, batwing: 1 } },
  { id: 'fluch',      name: 'Fluchbrecher',         icon: 'potions_b/3_5', r: 3, value: 760, time: 14, unlock: 25, research: 120, in: { ghostpumpkin: 2, ember: 2, mandrake: 1 } },
  // Legendär
  { id: 'sternenlicht', name: 'Sternenlicht',       icon: 'potions_b/4_3', r: 4, value: 1800, time: 16, unlock: 27, research: 250, in: { starwheat: 4, moonpetal: 3 } },
  { id: 'phoenix',    name: 'Phönix-Elixier',       icon: 'potions_b/4_0', r: 4, value: 2100, time: 16, unlock: 28, research: 300, in: { dragonfruit: 3, ember: 3 } },
  { id: 'drachenherz', name: 'Drachenherz',         icon: 'potions_b/4_2', r: 4, value: 2400, time: 17, unlock: 30, research: 350, in: { dragonfruit: 4, bloodrose: 2 } },
  { id: 'jugend',     name: 'Elixier der Jugend',   icon: 'potions_b/4_4', r: 4, value: 2600, time: 17, unlock: 31, research: 400, in: { eyeball: 2, frostlily: 2, glowcap: 2 } },
  { id: 'weisen',     name: 'Stein der Weisen',     icon: 'potions_b/4_1', r: 4, value: 3000, time: 18, unlock: 33, research: 500, in: { starwheat: 2, dragonfruit: 2, eyeball: 1 } },
  { id: 'krone',      name: 'Krone der Könige',     icon: 'potions_b/4_5', r: 4, value: 3600, time: 18, unlock: 35, research: 650, in: { eyeball: 2, dragonfruit: 2, starwheat: 2 } },
  // Boss-Tränke (Boss-Siegel)
  { id: 'b_schaedel', name: 'Schädel-Tinktur',      icon: 'potions_b/5_0', r: 4, boss: true, value: 2800, time: 18, unlock: 12, seals: 3,  in: { nightshade: 4, bloodrose: 2 } },
  { id: 'b_daemon',   name: 'Dämonenblut',          icon: 'potions_b/5_1', r: 4, boss: true, value: 3400, time: 18, unlock: 16, seals: 5,  in: { bloodrose: 3, ember: 3 } },
  { id: 'b_krake',    name: 'Krakentinte',          icon: 'potions_b/5_2', r: 4, boss: true, value: 4000, time: 19, unlock: 20, seals: 7,  in: { frostlily: 3, glowcap: 3 } },
  { id: 'b_frostgeist', name: 'Frostgeist',         icon: 'potions_b/5_3', r: 4, boss: true, value: 4600, time: 19, unlock: 24, seals: 9,  in: { frostlily: 3, ghostpumpkin: 2 } },
  { id: 'b_kuerbis',  name: 'Kürbisfluch',          icon: 'potions_b/5_4', r: 4, boss: true, value: 5200, time: 20, unlock: 28, seals: 12, in: { ghostpumpkin: 4, ember: 2 } },
  { id: 'b_wurzel',   name: 'Wurzelzorn',           icon: 'potions_b/5_5', r: 4, boss: true, value: 6000, time: 20, unlock: 32, seals: 15, in: { mandrake: 4, dragonfruit: 2 } },
];
PF.POTION = Object.fromEntries(PF.POTIONS.map(p => [p.id, p]));

// Rezepte kommen später: Level ×1,3, aber nie bevor alle Zutaten anbaubar sind
PF.POTIONS.forEach(p => {
  if (p.unlock <= 1) return;
  const need = Math.max(...Object.keys(p.in).map(c => PF.CROP[c].unlock));
  p.unlock = Math.max(Math.round(p.unlock * 1.3), need);
});
