// Juice: Partikel, Zahlen-Pop-ups, fliegende Icons, Konfetti, Screenshake
window.PF = window.PF || {};

PF.FX = {
  parts: [], pops: [], flyers: [], arcs: [],
  shakeAmt: 0, shakeT: 0,

  burst(x, y, color, n = 10, speed = 80) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.6, life: 0.6 + Math.random() * 0.5, t: 0, color, size: 2 + Math.random() * 3, g: 180 });
    }
  },
  confetti(x, y, n = 60) {
    const cols = ['#ffbf3f', '#c47bff', '#5fe39a', '#5fb0ff', '#ff7ab8', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 200 + Math.random() * 260;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.4 + Math.random(), t: 0, color: PF.U.pick(cols), size: 3 + Math.random() * 3, g: 380, rect: true, rot: Math.random() * 6 });
    }
  },
  popup(x, y, text, color = '#fff', scale = 1) {
    this.pops.push({ x, y, text, color, t: 0, life: 1.3, scale });
  },
  // Weltposition -> HUD-Ziel (Währungsanzeige) als fliegendes Icon im Bildschirmraum
  flyIcon(icon, from, cur) {
    const el = document.querySelector(`[data-cur="${cur}"] img`);
    if (!el) return;
    const r0 = el.getBoundingClientRect(), cr = PF.Render.c.getBoundingClientRect();
    const r = { left: r0.left - cr.left, top: r0.top - cr.top, width: r0.width, height: r0.height };
    const s = PF.Cam.toScreen(from.x, from.y);
    for (let i = 0; i < 4; i++) {
      this.flyers.push({ icon, x0: s.x + (Math.random() - 0.5) * 30, y0: s.y + (Math.random() - 0.5) * 30, x1: r.left + r.width / 2, y1: r.top + r.height / 2, t: -i * 0.06, dur: 0.75 });
    }
  },
  flyItem(icon, from) {
    this.arcs.push({ icon, x0: from.x, y0: from.y, x1: from.x, y1: from.y - 70, t: 0, dur: 0.7, h: 30, fade: true });
  },
  flyPotion(icon, fromT, toT) {
    this.arcs.push({ icon, x0: fromT[0] * PF.TILE, y0: fromT[1] * PF.TILE, x1: toT[0] * PF.TILE, y1: toT[1] * PF.TILE, t: 0, dur: 0.45, h: 70 });
  },
  shake(a, d) { this.shakeAmt = Math.max(this.shakeAmt, a); this.shakeT = Math.max(this.shakeT, d); },
  shakeOffset() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    const a = this.shakeAmt * Math.min(1, this.shakeT * 3);
    return { x: (Math.random() - 0.5) * a, y: (Math.random() - 0.5) * a };
  },

  update(dt) {
    if (this.shakeT > 0) this.shakeT -= dt;
    for (const p of this.parts) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; if (p.rot !== undefined) p.rot += dt * 8; }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const p of this.pops) p.t += dt;
    this.pops = this.pops.filter(p => p.t < p.life);
    for (const f of this.flyers) f.t += dt;
    this.flyers = this.flyers.filter(f => f.t < f.dur);
    for (const a of this.arcs) a.t += dt;
    this.arcs = this.arcs.filter(a => a.t < a.dur);
  },

  drawWorld(g) {
    for (const p of this.parts) {
      const k = 1 - p.t / p.life;
      g.globalAlpha = k;
      g.fillStyle = p.color;
      if (p.rect) { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); g.restore(); }
      else { g.beginPath(); g.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, 6.283); g.fill(); }
    }
    g.globalAlpha = 1;
    for (const a of this.arcs) {
      const t = Math.min(1, a.t / a.dur), e = PF.U.easeOut(t);
      const x = PF.U.lerp(a.x0, a.x1, e), y = PF.U.lerp(a.y0, a.y1, e) - Math.sin(t * Math.PI) * a.h;
      const img = PF.Assets.img(a.icon);
      if (!img) continue;
      g.globalAlpha = a.fade ? 1 - t : 1;
      const sz = 34;
      g.drawImage(img, x - sz / 2, y - sz / 2, sz, sz * img.height / img.width);
    }
    g.globalAlpha = 1;
    g.textAlign = 'center';
    for (const p of this.pops) {
      const t = p.t / p.life;
      const sc = p.scale * (t < 0.15 ? PF.U.easeOutBack(t / 0.15) : 1);
      g.globalAlpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      g.font = `bold ${Math.round(20 * sc)}px Georgia, serif`;
      g.lineWidth = 4; g.strokeStyle = 'rgba(10,5,20,0.85)';
      const y = p.y - t * 50;
      g.strokeText(p.text, p.x, y); g.fillStyle = p.color; g.fillText(p.text, p.x, y);
    }
    g.globalAlpha = 1;
  },

  drawScreen(g) {
    for (const f of this.flyers) {
      if (f.t < 0) continue;
      const t = Math.min(1, f.t / f.dur), e = t * t;
      const x = PF.U.lerp(f.x0, f.x1, e), y = PF.U.lerp(f.y0, f.y1, e) - Math.sin(t * Math.PI) * 60;
      const img = PF.Assets.img(f.icon);
      if (!img) continue;
      const sz = 30 * (1 - t * 0.4);
      g.drawImage(img, x - sz / 2, y - sz / 2, sz, sz);
    }
  },
};
