window.PF = window.PF || {};

PF.U = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a = 0, b = 1) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  key: (x, y) => x + ',' + y,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeOutBack: (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  hash: (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; },
  weighted(list, w) {
    const total = list.reduce((s, it) => s + w(it), 0);
    let r = Math.random() * total;
    for (const it of list) { r -= w(it); if (r <= 0) return it; }
    return list[list.length - 1];
  },
  fmt(n) {
    n = Math.floor(n);
    if (n < 10000) return n.toLocaleString('de-DE');
    const u = ['', 'K', 'Mio', 'Mrd', 'Bio', 'Brd', 'Trio'];
    let i = 0; let v = n;
    while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
    return (v >= 100 ? v.toFixed(0) : v.toFixed(1)).replace('.', ',') + ' ' + u[i];
  },
  fmtTime(s) {
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}:${String(sec).padStart(2, '0')}`;
    return `${sec}s`;
  },
  DIRS: [[1, 0], [0, 1], [-1, 0], [0, -1]], // 0 rechts, 1 unten, 2 links, 3 oben
};
