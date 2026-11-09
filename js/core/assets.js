// Lädt Sprites aus dem Manifest (js/data/sprites.js) bei Bedarf
window.PF = window.PF || {};

PF.Assets = {
  cache: {},
  tintCache: {},
  pending: 0,
  loaded: 0,

  img(key) {
    if (!key) return null;
    let e = this.cache[key];
    if (!e) {
      const def = window.SPRITES[key];
      if (!def) { console.warn('Sprite fehlt:', key); this.cache[key] = e = { img: null, ok: false }; return null; }
      const img = new Image();
      e = this.cache[key] = { img, ok: false, w: def[1], h: def[2] };
      this.pending++;
      img.onload = () => { e.ok = true; this.loaded++; this.pending--; PF.Assets.onLoad && PF.Assets.onLoad(key); };
      // Mobilnetz / CDN-Aussetzer: bis zu 3 Wiederholversuche, dann aufgeben
      let tries = 0;
      img.onerror = () => {
        if (tries++ < 3) { setTimeout(() => { img.src = def[0] + (def[0].includes('?') ? '&' : '?') + 'r=' + tries; }, 600 * tries); return; }
        this.pending--; console.warn('Ladefehler', key);
      };
      img.src = def[0];
    }
    return e.ok ? e.img : null;
  },

  size(key) {
    const def = window.SPRITES[key];
    return def ? { w: def[1], h: def[2] } : { w: 64, h: 64 };
  },

  url(key) { const d = window.SPRITES[key]; return d ? d[0] : ''; },

  preload(keys) {
    return new Promise((res) => {
      keys.forEach(k => this.img(k));
      const check = () => (this.pending <= 0 ? res() : setTimeout(check, 50));
      check();
    });
  },

  // Eingefärbtes Pulver-Icon für Pflanzen ohne eigenes Pulver-Sprite
  tinted(key, color) {
    const id = key + color;
    if (this.tintCache[id]) return this.tintCache[id];
    const src = this.img(key);
    if (!src) return null;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = 0.55; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    this.tintCache[id] = c;
    return c;
  },
};
