// Spielstand (localStorage) + Offline-Fortschritt
window.PF = window.PF || {};

PF.Save = {
  KEY: 'mondkessel.save.v1',

  save() {
    const s = PF.S;
    if (!s) return;
    s.lastSave = Date.now();
    const a = PF.Audio.settings;
    s.settings = { music: a.music, sfx: a.sfx, muted: a.muted, mainTrack: a.mainTrack, stings: a.stings };
    try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch (e) { console.warn('Speichern fehlgeschlagen', e); }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },

  wipe() { localStorage.removeItem(this.KEY); },

  // Offline: Pflanzen wachsen weiter, Einkommen = gemessene Rate × Zeit × 60 % (max. 8 h)
  applyOffline(s) {
    if (!s.lastSave) return null;
    const secs = Math.min((Date.now() - s.lastSave) / 1000, PF.OFFLINE.maxHours * 3600);
    if (secs < 60) return null;
    for (const e of Object.values(s.ents)) {
      if (e.type === 'plot' && e.crop) e.growth = Math.min(1, (e.growth || 0) + secs / PF.CROP[e.crop].grow);
    }
    const gold = Math.floor((s.autoRate || 0) * secs * PF.OFFLINE.rate * PF.Game.mult('gold'));
    return { secs, gold };
  },
};
