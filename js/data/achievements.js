// Erfolge. stat = Feld in state.stats (oder Funktion). Belohnung in Mondsteinen, Badge-Sprite badges/<r>_<col>
window.PF = window.PF || {};

PF.ACHIEVEMENTS = [];
const ach = (id, name, stat, steps, col, desc) => steps.forEach((n, i) => PF.ACHIEVEMENTS.push({
  id: `${id}_${i}`, name: `${name} ${['I', 'II', 'III', 'IV', 'V'][i]}`, stat, goal: n, r: i, badge: `badges/${i}_${col}`,
  desc: desc.replace('#', n.toLocaleString('de-DE')), reward: { moonstone: [5, 10, 20, 40, 80][i] },
}));

ach('ernte', 'Grüner Daumen', 'harvests', [25, 250, 2500, 25000, 250000], 1, '# Pflanzen geerntet');
ach('brau', 'Braumeister', 'crafted', [10, 100, 1000, 10000, 100000], 2, '# Tränke gebraut');
ach('auftrag', 'Kundenliebling', 'orders', [5, 50, 300, 1500, 8000], 4, '# Aufträge erfüllt');
ach('welle', 'Wellenreiter', 'maxWave', [5, 15, 30, 60, 120], 3, 'Welle # erreicht');
ach('boss', 'Bossbezwinger', 'bosses', [1, 3, 6, 12, 30], 5, '# Boss-Kunden zufriedengestellt');
ach('gold', 'Goldrausch', 'goldEarned', [1e3, 1e5, 1e7, 1e9, 1e11], 0, '# Gold verdient');
ach('truhe', 'Schatzjäger', 'chestsOpened', [3, 25, 100, 400, 1500], 3, '# Truhen geöffnet');
ach('legende', 'Legendensammler', 'legendaries', [1, 5, 15, 40, 100], 4, '# legendäre Funde');
ach('album', 'Sammelwut', 'albumCount', [5, 12, 20, 30, 42], 2, '# verschiedene Tränke im Album');
ach('level', 'Aufstieg', 'level', [5, 10, 20, 35, 50], 4, 'Level # erreicht');
