// Erklär-Fenster: alles mit data-info="…" ist anklickbar und erklärt, was es ist und wie man daran kommt.
// Schlüssel: cur:<id> · water · builders · level · wave · potion:<id> · item:raw:<crop> · item:pow:<crop> · crop:<id>
window.PF = window.PF || {};

PF.Info = {
  init() {
    // Delegiert für die ganze Oberfläche: Klick auf [data-info] (aber nicht auf Buttons darin)
    document.getElementById('ui').addEventListener('click', (ev) => {
      if (ev.target.closest('button')) return;
      const el = ev.target.closest('[data-info]');
      if (!el) return;
      ev.stopPropagation();
      this.show(el.dataset.info);
    });
  },

  // kleiner Abschnitt mit Überschrift + Stichpunkten
  sec(title, items) { return `<h3>${title}</h3><ul class="infolist">${items.filter(Boolean).map(i => `<li>${i}</li>`).join('')}</ul>`; },

  show(key) {
    const html = this.content(key);
    if (!html) return;
    PF.Audio.sfx('click');
    const back = PF.Panels.current;
    const p = PF.UI.openPanel(html, 'info');
    p.classList.add('info');
    // aus einem Menü heraus geöffnet -> "Zurück" statt nur schließen
    if (back) {
      const b = document.createElement('button'); b.className = 'big alt infoback'; b.textContent = '← Zurück';
      b.onclick = () => PF.Panels.open(back); p.appendChild(b);
      PF.Panels.current = back;
    }
  },

  content(key) {
    const s = PF.S, [kind, a, b] = key.split(':');
    const fmt = PF.U.fmt;
    if (kind === 'cur') return this.currency(a);
    if (kind === 'water') {
      return `<h2>${ic('ingredients/5_1')} Wasser</h2>
        <p>Du hast <b>${Math.floor(s.water || 0)} / ${Math.floor(PF.Water.cap ? PF.Water.cap() : 25)}</b> Wasser.</p>
        ${this.sec('Wofür?', ['Jeder gebraute Trank kostet Wasser – am Alchemietisch und im Kessel.', 'Gießen und Sprinkler lassen Pflanzen schneller wachsen.'])}
        ${this.sec('Wie bekomme ich Wasser?', ['<b>Brunnen anklicken</b> – pumpt sofort Wasser (kurze Abklingzeit).', 'Brunnen und Regentonnen füllen den Vorrat langsam von selbst auf.', 'Wasserfässer erhöhen, wie viel du speichern kannst.'])}`;
    }
    if (kind === 'builders') { PF.Panels.open('builders'); return null; }
    if (kind === 'level') {
      const L = s.level, r = PF.levelReward(L + 1);
      return `<h2>${ic('ui/0_3')} Level ${L}</h2>
        <p>Erfahrung (XP): <b>${fmt(s.xp)} / ${fmt(PF.xpForLevel(L))}</b></p>
        ${this.sec('Wie bekomme ich XP?', ['Tränke brauen und an Kunden übergeben', 'Ernten und Mörsern', 'Gebäude bauen und aufwerten (je länger die Bauzeit, desto mehr XP)', 'Bäume fällen und Felsen sprengen'])}
        ${this.sec(`Belohnung für Level ${L + 1}`, [`${r.moonstone} Mondstein${r.moonstone > 1 ? 'e' : ''}`, r.stardust && `${r.stardust} Sternenstaub`, r.chest ? `${r.chest} Truhe${r.chest > 1 ? 'n' : ''}` : null, 'Neue Pflanzen, Rezepte und Gebäude werden freigeschaltet'])}`;
    }
    if (kind === 'wave') {
      const w = s.wave;
      return `<h2>${ic('ui/5_2')} Kunden-Wellen</h2>
        <p>Du bist bei <b>Welle ${w.n}</b>. Kunden kommen in Wellen und bestellen Tränke – rechts in der Auftragsliste.</p>
        ${this.sec('So funktioniert es', ['Braue die gewünschten Tränke und klicke <b>Übergeben</b> – dein Zwerg trägt sie zur Ladentheke (der Weg vom Garten dauert ein paar Sekunden).', `Aufträge zahlen ${PF.WAVE.orderMult}× so viel wie der normale Trankwert.`, 'Ist eine Welle erfüllt, gibt es Gold, XP und einen Mondstein – nach einer Pause kommt die nächste.', '<b>Alle 10 Wellen kommt ein Boss</b> mit großer Bestellung. Belohnung: viele Mondsteine und Boss-Siegel.', 'Schaffst du eine Welle nicht, wird sie wiederholt und etwas leichter.'])}
        ${this.sec('Später', [`Ab Level ${PF.SHOPKEEPER.unlock} kannst du den <b>Laden-Gnom</b> anstellen (Helfer). Er übergibt automatisch und verkauft Reste an Laufkundschaft.`])}`;
    }
    if (kind === 'potion') return this.potion(PF.POTION[a]);
    if (kind === 'item') return this.crop(PF.CROP[b], a);
    if (kind === 'crop') return this.crop(PF.CROP[a], 'raw');
    return null;
  },

  currency(id) {
    const c = PF.CURRENCIES[id], s = PF.S, have = PF.U.fmt(s.cur[id] || 0);
    const head = `<h2>${ic(c.icon)} ${c.name}</h2><p>Du hast <b style="color:${c.color}">${have}</b>.</p>`;
    const T = {
      gold: [
        ['Woher?', ['Tränke an Kunden übergeben – das ist die Haupteinnahme', 'Wellen abschließen', 'Truhen und der tägliche Kalender', `Mit dem Laden-Gnom (ab Level ${PF.SHOPKEEPER.unlock}) kaufen Laufkunden auch übrige Tränke – und dein Laden verdient etwas, während du weg bist`]],
        ['Wofür?', ['Beete, Maschinen, Förderbänder und Wassertechnik bauen', 'Bäume fällen und Felsen sprengen (schafft Platz)', 'Gebäude aufwerten', 'Samen für neue Pflanzen, Helfer und Biome']],
      ],
      moonstone: [
        ['Woher?', ['Jeder Level-Aufstieg (mehr bei höheren Levels)', 'Jede abgeschlossene Kunden-Welle (+1)', 'Boss-Kunden (viele auf einmal)', 'Beim Fällen und Sprengen liegen manchmal Mondsteine darunter – je größer, desto wahrscheinlicher', 'Erfolge, Truhen und der tägliche Kalender']],
        ['Wofür?', ['Weitere <b>Baumeister</b> anheuern (mehr gleichzeitige Baustellen)', 'Bauzeiten <b>beschleunigen</b> (1 Mondstein je 5 Minuten, unter 15 Sek. gratis)', 'Truhen im Laden', 'Skins, epische und legendäre Ausrüstung']],
      ],
      stardust: [
        ['Woher?', ['Seltene Tränke (ab <span style="color:' + PF.RARITY[2].color + '">Selten</span>) verkaufen', 'Wellen mit seltenen Tränken', 'Jedes dritte Level', 'Truhen', 'Später: Forschungspult und Kristallhöhle (Biom)']],
        ['Wofür?', ['<b>Forschung</b>: neue seltene, epische und legendäre Rezepte freischalten', 'Samen seltener Pflanzen kaufen']],
      ],
      soul: [
        ['Woher?', [`Nur durch <b>Wiedergeburt</b> (ab Level ${PF.PRESTIGE.minLevel})`, 'Je mehr Gold du insgesamt verdient hast, desto mehr Essenz bekommst du']],
        ['Wofür?', [`Dauerhafter Bonus: jede Essenz macht alles <b>${Math.round(PF.PRESTIGE.bonusPerSoul * 100)}%</b> wertvoller – auch nach jeder weiteren Wiedergeburt`]],
      ],
      bossSeal: [
        ['Woher?', ['Nur von <b>Boss-Kunden</b> – alle 10 Wellen', 'Spätere Bosse geben mehr Siegel']],
        ['Wofür?', ['Boss-Tränke erforschen (sehr wertvoll)', 'Besondere Ware im Boss-Laden']],
      ],
    }[id];
    return head + `<p class="small">${c.desc}</p>` + T.map(([t, l]) => this.sec(t, l)).join('');
  },

  potion(p) {
    if (!p) return null;
    const s = PF.S, R = PF.RARITY[p.r], F = PF.Factory;
    const stock = s.inv.potions[p.id] ? s.inv.potions[p.id].n : 0;
    const known = F.recipeUnlocked(p), usable = F.usable(p);
    const ings = Object.entries(p.in).map(([c, n]) => {
      const cr = PF.CROP[c], ok = s.level >= cr.unlock;
      return `<span class="ing" data-info="crop:${c}">${n}× ${ic(cr.icon)} ${cr.powderName || cr.name}${ok ? '' : ` <i class="small">(ab Level ${cr.unlock})</i>`}</span>`;
    }).join('');
    let unlock;
    if (usable) unlock = '✓ Kannst du schon herstellen.';
    else if (known) unlock = 'Rezept bekannt – dir fehlt noch eine Zutat (siehe oben).';
    else if (p.boss) unlock = `Ab Level ${p.unlock} mit <b>${p.seals} Boss-Siegeln</b> in der Forschung freischalten.`;
    else if (p.research) unlock = `Ab Level ${p.unlock} mit <b>${p.research} Sternenstaub</b> in der Forschung freischalten (oder als Rezept in Truhen finden).`;
    else unlock = `Wird automatisch mit <b>Level ${p.unlock}</b> freigeschaltet.`;
    return `<h2>${ic(p.icon)} ${p.name}</h2>
      <p><span style="color:${R.color}">${R.name}</span> · Grundwert <b>${PF.U.fmt(F.potionValue({ id: p.id, q: 0, l: 0 }))} Gold</b> · im Vorrat: <b>${stock}</b> · gebraut: ${s.album[p.id] || 0}×</p>
      <h3>Zutaten</h3><div class="ings">${ings}</div>
      ${this.sec('So stellst du ihn her', ['Pflanzen im Garten anbauen und ernten', 'Ernte zu Pulver mörsern (Alchemietisch, später Mörser)', 'Pulver + 1 Wasser zum Trank brauen (Alchemietisch, später Kessel → Abfüller)', 'Dann an einen Kunden übergeben – Aufträge zahlen das ' + PF.WAVE.orderMult + '-fache'])}
      <h3>Freischaltung</h3><p>${unlock}</p>
      ${p.r >= 2 ? `<p class="small">Seltene Tränke bringen beim Verkauf zusätzlich Sternenstaub.</p>` : ''}`;
  },

  crop(c, form) {
    if (!c) return null;
    const s = PF.S, R = PF.RARITY[c.rarity];
    const raw = s.inv.items['raw:' + c.id] || 0, pow = s.inv.items['pow:' + c.id] || 0;
    const uses = PF.POTIONS.filter(p => p.in[c.id]);
    const seed = c.seedItem ? `Samen aus Truhen oder für ${c.seedStardust} Sternenstaub in der Forschung` : `Samen kosten ${c.seedCost} Gold – wird beim Bepflanzen eines Beets automatisch bezahlt`;
    return `<h2>${ic(form === 'pow' && c.powder ? c.powder : c.icon)} ${form === 'pow' ? (c.powderName || c.name + '-Pulver') : c.name}</h2>
      <p><span style="color:${R.color}">${R.name}</span> · Wachstum ${PF.U.fmtTime(c.grow)} · Vorrat: ${raw}× Ernte, ${pow}× Pulver</p>
      ${this.sec('Woher?', [s.level >= c.unlock ? 'Im <b>Garten</b> auf einem Beet anbauen und ernten' : `Wird mit <b>Level ${c.unlock}</b> freigeschaltet`, seed, 'Pulver entsteht durch <b>Mörsern</b> der Ernte (Alchemietisch oder Mörser)'])}
      <h3>Steckt in</h3><div class="ings">${uses.map(p => `<span class="ing" data-info="potion:${p.id}">${ic(p.icon)} <span style="color:${PF.RARITY[p.r].color}">${p.name}</span></span>`).join('') || '<span class="small">–</span>'}</div>`;
  },
};
