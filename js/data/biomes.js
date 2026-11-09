// Freischaltbare Biome (untere Welthälfte, y 28–47, je 14 Felder breit). Jedes Biom:
// - eigener Boden (biome_tiles Zeile `row`) und Kulisse (biome_props Zeile `row`)
// - Wachstumsbonus für bestimmte Pflanzen (crops: Pflanze -> Multiplikator)
// - ein Wahrzeichen mit dauerhaftem Perk
window.PF = window.PF || {};

PF.BIOME_Y0 = 28;
PF.BIOME_Y1 = 47;

PF.BIOMES = [
  {
    id: 'graveyard', name: 'Friedhof', row: 0, x0: 0, x1: 13, light: '#7dffb0', fog: 'rgba(120,200,160,',
    unlock: { level: 16, cost: { gold: 80000 } },
    crops: { bloodrose: 2, ghostpumpkin: 2, nightshade: 1.5 },
    perk: { stat: 'xp', v: 0.10, text: '+10 % XP auf alles' },
    landmark: { s: 'biome_props/0_1', name: 'Alte Gruft', w: 2.6 },
    desc: 'Nebel zwischen Grabsteinen. Blutrosen und Geisterkürbisse wachsen hier doppelt so schnell.',
  },
  {
    id: 'crystal', name: 'Kristallhöhle', row: 1, x0: 14, x1: 27, light: '#b47bff', fog: 'rgba(170,120,255,',
    unlock: { level: 24, cost: { gold: 800000, stardust: 80 } },
    crops: { frostlily: 2, starwheat: 2, glowcap: 1.5 },
    perk: { stat: 'stardustTrickle', v: 1, text: '+1 Sternenstaub alle 30 s' },
    landmark: { s: 'biome_props/1_0', name: 'Kristallader', w: 2.4 },
    desc: 'Leuchtende Kristalle nähren Frostlilien und Sternenweizen.',
  },
  {
    id: 'swamp', name: 'Verfluchter Sumpf', row: 2, x0: 28, x1: 41, light: '#62ff7a', fog: 'rgba(110,200,90,',
    unlock: { level: 32, cost: { gold: 6000000, moonstone: 80 } },
    crops: { eyeball: 2, mandrake: 1.5, glowcap: 1.5 },
    perk: { stat: 'brew', v: 0.15, text: '+15 % Kessel-Tempo' },
    landmark: { s: 'biome_props/2_2', name: 'Moorkessel', w: 2.2 },
    desc: 'Blubbernder Morast. Augenpflanzen und Alraunen lieben ihn.',
  },
  {
    id: 'autumn', name: 'Herbstwald', row: 3, x0: 42, x1: 55, light: '#ff9a3d', fog: 'rgba(255,150,70,',
    unlock: { level: 40, cost: { gold: 40000000, bossSeal: 6 } },
    crops: { dragonfruit: 2, ember: 1.5, ghostpumpkin: 1.5 },
    perk: { stat: 'gold', v: 0.15, text: '+15 % Gold' },
    landmark: { s: 'biome_props/3_1', name: 'Kürbis-Altar', w: 2.4 },
    desc: 'Ewiger Oktober. Drachenkakteen und Glutschoten gedeihen prächtig.',
  },
];
PF.BIOME = Object.fromEntries(PF.BIOMES.map(b => [b.id, b]));
