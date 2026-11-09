// Inhalts-Erweiterung ×3: 24 neue Pflanzen, 108 neue Tränke, 48 neue Maschinen.
// Maschinen nutzen einen bestehenden Grundtyp (base) mit eigenen Werten – die Fabrik-Logik fragt immer PF.kindOf(e).
window.PF = window.PF || {};

PF.kindOf = (e) => (e && PF.BUILD[e.kind] && PF.BUILD[e.kind].base) || (e && e.kind);

// ---------- Pflanzen ----------
(() => {
  // [id, Name, Pulvername, Farbe, unlock, Wachstum s, Seltenheit]
  const C = [
    // crops_c – gewöhnlich
    ['schattenminze', 'Schattenminze', 'Schattenminz-Pulver', '#8a6bd6', 3, 75, 0],
    ['kroetenpilz', 'Krötenpilz', 'Sporenstaub', '#9a8a4a', 6, 100, 0],
    ['spinnenlilie', 'Spinnenlilie', 'Spinnseide', '#e8e8f0', 9, 140, 0],
    ['nebelklee', 'Nebelklee', 'Nebelstaub', '#a8c0d8', 11, 170, 0],
    ['rabenbeere', 'Rabenbeere', 'Rabenbeer-Mus', '#3a2a4a', 14, 220, 1],
    ['eisenhut', 'Wolfs-Eisenhut', 'Eisenhut-Pulver', '#3f5fd8', 16, 260, 1],
    // crops_d – ungewöhnlich
    ['sumpfkolben', 'Sumpfkolben', 'Kolbenflaum', '#c8e05a', 17, 330, 1],
    ['hexenkraut', 'Hexenkraut', 'Hexenkraut-Schnitt', '#4f8a3a', 19, 380, 1],
    ['feuerlilie', 'Feuerlilie', 'Glutblätter', '#ff6a2a', 20, 420, 1],
    ['mondkuerbis', 'Mondkürbis', 'Mondkürbis-Mark', '#d8e4ff', 22, 480, 1],
    ['silberfarn', 'Silberfarn', 'Silberfarn-Staub', '#c8d0dc', 23, 540, 1],
    ['knochenwurz', 'Knochenwurz', 'Knochenspäne', '#efe6d0', 24, 600, 1],
    // crops_e – selten (Samen aus Truhen / Forschung)
    ['kristallrose', 'Kristallrose', 'Kristallsplitter', '#e08aff', 26, 900, 2],
    ['gewitterdistel', 'Gewitterdistel', 'Blitzdistel-Staub', '#8a6bff', 29, 1000, 2],
    ['vampirorchidee', 'Vampirorchidee', 'Blutblüten', '#c0102a', 30, 1100, 2],
    ['geisterglocke', 'Geisterglocke', 'Geisterstaub', '#9ff0ff', 32, 1200, 3],
    ['sternanis', 'Sternanis', 'Sternschoten', '#ffd24a', 35, 1350, 3],
    ['seelenmohn', 'Seelenmohn', 'Seelenmohn-Pulver', '#3fe08a', 36, 1500, 3],
    // crops_f – legendär
    ['phoenixbluete', 'Phönixblüte', 'Phönixasche', '#ff5a1f', 40, 1800, 4],
    ['leviathanalge', 'Leviathan-Alge', 'Tiefseestreifen', '#1fb8b0', 42, 2100, 4],
    ['zeitlose', 'Zeitlose', 'Zeitsand', '#f0c040', 44, 2400, 4],
    ['schattenlotus', 'Schattenlotus', 'Schattenlotus-Staub', '#6a2aa8', 46, 2700, 4],
    ['himmelsbeere', 'Himmelsbeere', 'Galaxien-Gelee', '#5a5aff', 48, 3000, 4],
    ['weltenbaum', 'Weltenbaum-Setzling', 'Weltenbaum-Laub', '#ffd86a', 50, 3600, 4],
  ];
  const sheets = ['crops_c', 'crops_d', 'crops_e', 'crops_f'];
  C.forEach(([id, name, powderName, color, unlock, grow, rarity], i) => {
    const sheet = sheets[Math.floor(i / 6)], row = i % 6, rare = i >= 12;
    const c = {
      id, name, powderName, color, unlock, grow, rarity, sheet, row,
      icon: `${sheet}/${row}_3`, powder: `powders_c/${Math.floor(i / 6)}_${i % 6}`,
    };
    if (rare) { c.seedItem = true; c.seedStardust = 6 + (i - 12) * 2; }
    else c.seedCost = Math.round(3 + grow / 25);
    PF.CROPS.push(c);
    PF.CROP[id] = c;
  });
})();

// ---------- Tränke ----------
(() => {
  const N = {
    0: ['Krötenschleim-Tonikum', 'Minzfrische', 'Nebeltau', 'Spinnwebsalbe', 'Rabenmut', 'Wolfsruhe', 'Kleeglück-Tropfen', 'Pilzbrühe', 'Schattentee', 'Beerengeist', 'Silbertau', 'Knochenbrühe'],
    1: ['Sumpfgeist-Trank', 'Hexenschuss-Tinktur', 'Feuerzunge', 'Mondkürbis-Punsch', 'Farnflüstern', 'Gebeinstärke', 'Lilienschlaf', 'Rabenflug', 'Eisenhut-Elixier', 'Nebelschleier', 'Krötenkönig', 'Glutminze'],
    2: ['Kristallklarheit', 'Sturmgebräu', 'Blutdurst', 'Geisterruf', 'Sternenpfad', 'Seelenfrieden', 'Rosenfluch', 'Donnerherz', 'Nachtschwinge', 'Spukgeflüster', 'Sternenstaub-Elixier', 'Totenwache',
      'Frostfeuer', 'Hexenblick', 'Silbermond', 'Krötenzauber', 'Schattenschritt', 'Glücksklee-Elixier', 'Flammenwall', 'Nebelwandler', 'Kristallhaut', 'Mitternachtsbrühe', 'Gewitterlaune', 'Seelenspiegel'],
    3: ['Vampirkuss', 'Geisterbann', 'Sternenfall', 'Seelenwanderung', 'Drachenatem', 'Kristallgeist', 'Sturmreiter', 'Blutmond', 'Lichbann', 'Spinnenkönigin', 'Totenmaske', 'Zwielicht-Elixier',
      'Wolfsfluch', 'Rabenkönig', 'Schattenkrone', 'Höllenfeuer', 'Eiskönigin', 'Traumwandler', 'Sternenseele', 'Nachtmahr', 'Knochenkönig', 'Irrlicht', 'Hexensabbat', 'Grabesruhe'],
    4: ['Phönixträne', 'Leviathans Atem', 'Zeitlosigkeit', 'Schattenlotus-Essenz', 'Himmelsfrucht', 'Weltenbaum-Saft', 'Unsterblichkeit', 'Galaxienstaub', 'Sonnenfeuer', 'Drachenkönig', 'Ewige Jugend', 'Götterfunke',
      'Sternenschmiede', 'Seelenkrone', 'Aurora-Elixier', 'Chaosbrühe', 'Mondgöttin', 'Weltenende', 'Ur-Elixier', 'Kosmischer Nektar', 'Himmelsleiter', 'Engelstränen', 'Dämonenpakt', 'Allwissenheit'],
    boss: ['Hydrablut', 'Liche-Essenz', 'Gift der Spinnenkönigin', 'Golemherz', 'Banshee-Schrei', 'Gorgonenblick', 'Minotaurus-Kraft', 'Tiefseegrauen', 'Wendigo-Frost', 'Basilisken-Gift', 'Nekromanten-Tinte', 'Titanenblut'],
  };
  // Icons: potions_c (gewöhnlich/ungewöhnlich/selten), potions_d (selten/episch), potions_e (legendär/boss)
  const icon = (sheet, k) => `${sheet}/${Math.floor(k / 6)}_${k % 6}`;
  const icons = {
    0: N[0].map((_, i) => icon('potions_c', i)),
    1: N[1].map((_, i) => icon('potions_c', 12 + i)),
    2: N[2].map((_, i) => i < 12 ? icon('potions_c', 24 + i) : icon('potions_d', i - 12)),
    3: N[3].map((_, i) => icon('potions_d', 12 + i)),
    4: N[4].map((_, i) => icon('potions_e', i)),
    boss: N.boss.map((_, i) => icon('potions_e', 24 + i)),
  };
  // Level-Spannen und Werte je Seltenheit (an die vorhandenen Tränke angelehnt)
  const R = {
    0: { lv: [3, 22], val: [18, 60], time: [4, 7], n: [2, 3] },
    1: { lv: [8, 28], val: [70, 180], time: [6, 9], n: [2, 4] },
    2: { lv: [18, 42], val: [220, 520], time: [9, 12], n: [3, 5] },
    3: { lv: [26, 48], val: [700, 1600], time: [12, 15], n: [4, 6] },
    4: { lv: [40, 55], val: [2600, 7000], time: [16, 20], n: [5, 8] },
    boss: { lv: [14, 52], val: [3200, 9000], time: [18, 21], n: [5, 8] },
  };
  const H = (a, b) => PF.U ? PF.U.hash(a, b) : ((Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1 + 1) % 1;
  let seed = 1;
  for (const key of [0, 1, 2, 3, 4, 'boss']) {
    const names = N[key], cfg = R[key], cnt = names.length;
    names.forEach((name, i) => {
      const f = cnt > 1 ? i / (cnt - 1) : 0;
      const unlock = Math.round(cfg.lv[0] + (cfg.lv[1] - cfg.lv[0]) * f);
      const r = key === 'boss' ? 4 : key;
      // Zutaten: 1 Pflanze aus dem aktuellen Level-Fenster + 1–2 weitere
      const pool = PF.CROPS.filter(c => c.unlock <= Math.max(unlock, 1) && (r >= 2 || !c.seedItem));
      const recent = pool.filter(c => c.unlock >= unlock - 12);
      const pick = (arr, s) => arr[Math.floor(H(seed * 7 + s, i * 13 + 5) * arr.length) % arr.length];
      const ins = {};
      const main = pick(recent.length ? recent : pool, 1);
      const total = cfg.n[0] + Math.floor(H(seed, i + 3) * (cfg.n[1] - cfg.n[0] + 1));
      ins[main.id] = Math.max(1, Math.ceil(total / 2));
      let left = total - ins[main.id], s = 2;
      while (left > 0 && s < 20) {
        const c = pick(pool, s++);
        if (ins[c.id] && Object.keys(ins).length < 3 && s < 10) continue;
        const n = Math.min(left, 1 + Math.floor(H(seed + s, i) * 2));
        ins[c.id] = (ins[c.id] || 0) + n; left -= n;
      }
      const p = {
        id: 'x' + (key === 'boss' ? 'b' : key) + '_' + i, name, icon: icons[key][i], r, unlock,
        value: Math.round(cfg.val[0] + (cfg.val[1] - cfg.val[0]) * f), time: Math.round(cfg.time[0] + (cfg.time[1] - cfg.time[0]) * f), in: ins,
      };
      if (key === 'boss') { p.boss = true; p.seals = 4 + Math.round(f * 16); }
      else if (r >= 2) p.research = Math.round([0, 0, 30, 90, 300][r] * (1 + f * 1.5));
      PF.POTIONS.push(p);
      PF.POTION[p.id] = p;
      seed++;
    });
  }
})();

// ---------- Maschinen ----------
(() => {
  const bt = (lv) => Math.round(Math.min(30 * 3600, 300 * Math.pow(1.13, lv)));
  // [id, Sprite, Name, Grundtyp, Kategorie, Zone, Level, Kosten, Extra, Beschreibung]
  const M = [
    ['steinmuehle', 'machines_c/0_0', 'Steinmühle', 'mortar', 'factory', 'any', 6, 1500, { time: 2.0 }, 'Mahlt Ernte zu Pulver – etwas schneller als der Mörser.'],
    ['dampfmoerser', 'machines_c/0_1', 'Dampfmörser', 'mortar', 'factory', 'any', 11, 6000, { time: 1.4 }, 'Dampfbetrieben: mahlt fast doppelt so schnell wie der Mörser.'],
    ['kristallmoerser', 'machines_c/0_2', 'Kristallmörser', 'mortar', 'factory', 'any', 20, 30000, { time: 2.4, yield: 2 }, 'Aus 1 Ernte werden 2 Pulver.'],
    ['knochenmuehle', 'machines_c/0_3', 'Knochenmühle', 'mortar', 'factory', 'any', 26, 90000, { time: 1.8, yield: 2 }, 'Schnell und doppelt: 1 Ernte = 2 Pulver.'],
    ['runenmahlwerk', 'machines_c/1_0', 'Runenmahlwerk', 'mortar', 'factory', 'any', 34, 400000, { time: 2.2, yield: 3 }, 'Runen vervielfachen: 1 Ernte = 3 Pulver.'],
    ['drachenmahlstein', 'machines_c/1_1', 'Drachen-Mahlstein', 'mortar', 'factory', 'any', 42, 1500000, { time: 1.5, yield: 3 }, 'Drachenglut mahlt rasend schnell 3 Pulver pro Ernte.'],
    ['kupferkessel', 'machines_c/1_2', 'Kupferkessel', 'cauldron', 'factory', 'any', 10, 6000, { speedMul: 1.3 }, 'Kessel, der 30 % schneller braut.'],
    ['hexenkessel', 'machines_c/1_3', 'Hexenkessel', 'cauldron', 'factory', 'any', 15, 20000, { speedMul: 1.6 }, 'Hexenfeuer: braut 60 % schneller.'],
    ['blutkessel', 'machines_c/2_0', 'Blutkessel', 'cauldron', 'factory', 'any', 22, 70000, { speedMul: 2.0 }, 'Braut doppelt so schnell wie ein normaler Kessel.'],
    ['sternenkessel', 'machines_c/2_1', 'Sternenkessel', 'cauldron', 'factory', 'any', 30, 250000, { speedMul: 2.6 }, 'Kosmisches Gebräu – 2,6× Brautempo.'],
    ['leviathankessel', 'machines_c/2_2', 'Leviathan-Kessel', 'mixer', 'factory', 'any', 37, 900000, { speedMul: 1.4 }, 'Riesenkessel: braut automatisch 2 Gebräue pro Durchgang, schneller als der Mixer.'],
    ['urkessel', 'machines_c/2_3', 'Ur-Kessel', 'mixer', 'factory', 'any', 45, 3000000, { speedMul: 2.2, brewOut: 3 }, 'Uralter Kessel: 3 Gebräue pro Durchgang.'],
    ['glasdestille', 'machines_c/3_0', 'Glasdestille', 'distillery', 'factory', 'any', 17, 25000, { time: 2.2 }, 'Veredelt Gebräu schneller: +1 Qualitätsstern.'],
    ['mondscheindestille', 'machines_c/3_1', 'Mondschein-Destille', 'distillery', 'factory', 'any', 27, 120000, { time: 1.5 }, 'Mondlicht-Destille: +1 Stern, doppelt so schnell.'],
    ['sonnendestille', 'machines_c/3_2', 'Sonnen-Destille', 'distillery', 'factory', 'any', 39, 700000, { time: 1.0 }, 'Sonnenspiegel: +1 Stern in Rekordzeit.'],
    ['schnellabfueller', 'machines_c/3_3', 'Uhrwerk-Abfüller', 'bottler', 'factory', 'any', 9, 4000, { time: 1.2 }, 'Füllt fast doppelt so schnell ab.'],
    ['kristallabfueller', 'machines_d/0_0', 'Kristall-Abfüller', 'bottler', 'factory', 'any', 19, 40000, { time: 0.8 }, 'Füllt in Windeseile ab.'],
    ['goldabfueller', 'machines_d/0_1', 'Gold-Abfüller', 'bottler', 'factory', 'any', 33, 300000, { time: 0.5 }, 'Der schnellste Abfüller.'],
    ['praegepresse', 'machines_d/0_2', 'Siegelpresse', 'labeler', 'factory', 'any', 18, 20000, { time: 1.0 }, 'Etikettiert schneller (+30 % Wert).'],
    ['siegelstempel', 'machines_d/0_3', 'Königsstempel', 'labeler', 'factory', 'any', 31, 200000, { time: 0.6, labelBonus: 1.5 }, 'Königliches Siegel: +50 % statt +30 % Wert.'],
    ['lieferrutsche', 'machines_d/1_0', 'Lieferrutsche', 'seller', 'factory', 'any', 12, 8000, { sellBonus: 1.1 }, 'Schickt Tränke in den Laden – 10 % mehr wert.'],
    ['goldtrichter', 'machines_d/1_1', 'Goldtrichter', 'seller', 'factory', 'any', 28, 150000, { sellBonus: 1.25 }, 'Schickt Tränke in den Laden – 25 % mehr wert.'],
    ['erntekorbturm', 'machines_d/1_2', 'Erntekorb-Turm', 'collector', 'factory', 'any', 13, 7000, { speed: 7 }, 'Legt Ernte fast doppelt so schnell aufs Band.'],
    ['saugrohr', 'machines_d/1_3', 'Zaubersaugrohr', 'collector', 'factory', 'any', 24, 60000, { speed: 11 }, 'Saugt Ernte aus dem Vorrat – sehr schnell.'],
    ['grosseslager', 'machines_d/2_0', 'Abfüll-Lager', 'storage', 'factory', 'any', 10, 3000, { bottles: 0.8 }, 'Nimmt alles vom Band – Gebräu wird direkt zu Tränken (80 % Wert).'],
    ['runensortierer', 'machines_d/2_1', 'Runen-Sortierer', 'sorter', 'factory', 'any', 20, 25000, { mirror: true }, 'Passendes geht geradeaus, alles andere nach LINKS.'],
    ['zisterne', 'machines_d/2_2', 'Zisterne', 'tank', 'garden', 'any', 14, 15000, { water: { cap: 120 } }, 'Speichert 120 Wasser je Stufe.'],
    ['quellstein', 'machines_d/2_3', 'Quellstein', 'rainbarrel', 'garden', 'any', 18, 30000, { water: { regen: 1.2 } }, 'Eine Quelle: +1,2 Wasser pro Sekunde.'],
    ['wolkenfaenger', 'machines_d/3_0', 'Wolkenfänger', 'rainbarrel', 'garden', 'any', 12, 9000, { water: { regen: 0.6, cap: 40 } }, 'Fängt Regenwolken: +0,6/s und 40 Speicher.'],
    ['mondseepumpe', 'machines_d/3_1', 'Mondsee-Pumpe', 'rainbarrel', 'garden', 'any', 30, 250000, { water: { regen: 2.5, cap: 60 } }, 'Pumpt Mondwasser: +2,5/s.'],
    ['kompostsilo', 'machines_d/3_2', 'Kompostsilo', 'aura', 'garden', 'garden', 8, 3000, { aura: 'grow', auraR: 2, auraBonus: 0.25 }, 'Aura: Beete im Umkreis wachsen 25 % schneller.'],
    ['bienenstock', 'machines_d/3_3', 'Zauber-Bienenstock', 'aura', 'garden', 'garden', 12, 8000, { aura: 'grow', auraR: 3, auraBonus: 0.2 }, 'Aura: Bienen bestäuben – Beete im großen Umkreis +20 % Wachstum.'],
    ['vogelscheuche', 'machines_e/0_0', 'Vogelscheuche', 'aura', 'garden', 'garden', 6, 1200, { aura: 'grow', auraR: 4, auraBonus: 0.12 }, 'Aura: hält Krähen fern – Beete weit herum +12 % Wachstum.'],
    ['mondlaterne', 'machines_e/0_1', 'Mondlaterne', 'aura', 'garden', 'garden', 20, 40000, { aura: 'grow', auraR: 2, auraBonus: 0.4 }, 'Aura: Mondlicht – Beete im Umkreis +40 % Wachstum.'],
    ['wurzelobelisk', 'machines_e/0_2', 'Wurzel-Obelisk', 'aura', 'garden', 'garden', 36, 600000, { aura: 'grow', auraR: 3, auraBonus: 0.7 }, 'Aura: uralte Wurzeln – Beete im Umkreis +70 % Wachstum.'],
    ['grosssprinkler', 'machines_e/0_3', 'Großer Sprinkler', 'sprinkler', 'garden', 'garden', 21, 30000, { range: 3 }, 'Gießt alle Beete in großem Umkreis.'],
    ['sternenpresse', 'machines_e/1_0', 'Sternenstaub-Presse', 'desk', 'special', 'any', 24, 150000, { time: 1.6, stardustMul: 2 }, 'Presst Tränke zu doppelt so viel Sternenstaub.'],
    ['seelenbrunnen', 'machines_e/1_1', 'Seelenbrunnen', 'soul', 'special', 'any', 41, 2500000, { soulBonus: 1 }, 'Wie der Seelenextraktor, aber jeder seltene+ Trank gibt einen Mondstein mehr.'],
    ['mondsteinbohrer', 'machines_e/1_2', 'Mondstein-Bohrer', 'condenser', 'special', 'any', 32, 500000, { time: 150 }, 'Bohrt alle paar Minuten einen Mondstein aus dem Boden.'],
    ['zeitkristall', 'machines_e/1_3', 'Zeitkristall', 'aura', 'special', 'any', 34, 450000, { aura: 'machine', auraBonus: 0.7 }, 'Aura: Maschinen im Umkreis +70 % schneller.'],
    ['nebelgenerator', 'machines_e/2_0', 'Nebelgenerator', 'aura', 'special', 'any', 26, 180000, { aura: 'belt', auraR: 5 }, 'Aura: Förderbänder in großem Umkreis laufen schneller.'],
    ['alchemistenturm', 'machines_e/2_1', 'Alchemistenturm', 'mixer', 'special', 'any', 40, 2000000, { speedMul: 1.2, brewOut: 3 }, 'Braut automatisch 3 Gebräue pro Durchgang.'],
    ['goldmine', 'machines_e/2_2', 'Goldmine', 'condenser', 'special', 'any', 16, 50000, { time: 120, reward: 'gold' }, 'Fördert alle 2 Minuten Gold (wächst mit deinem Einkommen).'],
    ['drachenofen', 'machines_e/2_3', 'Drachenofen', 'forge', 'special', 'any', 38, 1200000, { time: 2.0, yield: 4 }, 'Schmilzt Ernte zu vierfachem Pulver.'],
    ['prismainfuser', 'machines_e/3_0', 'Prisma-Infuser', 'infuser', 'special', 'any', 35, 800000, { time: 2.5 }, 'Kristallisiert Tränke schneller: doppelter Wert.'],
    ['eiskammer', 'machines_e/3_1', 'Eiskristall-Kammer', 'frost', 'special', 'any', 37, 1000000, { time: 4 }, 'Schockfrostet schneller: +2 Sterne.'],
    ['verwandlungsaltar', 'machines_e/3_2', 'Verwandlungsaltar', 'recycler', 'special', 'any', 30, 300000, { time: 1.5, recycleN: 2 }, 'Aus 2 Ernte/Pulver wird 1 Ernte einer selteneren Pflanze.'],
    ['sternenportal', 'machines_e/3_3', 'Sternenportal', 'teleporter', 'special', 'any', 33, 500000, {}, 'Teleporter: schickt Items zu jedem anderen Portal/Teleporter.'],
  ];
  for (const [id, sprite, name, base, cat, zone, unlock, cost, extra, desc] of M) {
    const b = PF.BUILD[base] || {};
    const def = {
      name, base: base === 'aura' ? undefined : base, cat, zone, unlock, cost, costGrow: 1.6, desc,
      icon: sprite, tiers: [sprite], scale: 1.3, buildTime: bt(unlock),
      passive: base === 'aura' || b.passive, noTiers: false,
      time: b.time, speed: b.speed, yield: b.yield, water: b.water, pumpCd: b.pumpCd,
      ...extra,
    };
    if (base === 'aura') { def.passive = true; def.base = def.aura === 'machine' ? 'runes' : def.aura === 'belt' ? 'ghost' : 'aura'; }
    PF.BUILD[id] = def;
  }
})();
