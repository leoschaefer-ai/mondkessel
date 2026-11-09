// Musiksystem: nahtloser Loop (Überblendung am Loop-Punkt) + Crossfade zwischen Bereichen.
// SFX werden mit Web Audio synthetisiert (keine Dateien nötig).
window.PF = window.PF || {};

PF.Audio = (() => {
  const TRACKS = {
    title:   'assets/audio/moonlit_hollow.mp3',
    garden:  'assets/audio/forest_of_quiet_moon.mp3',
    factory: 'assets/audio/clockwork_cauldron.mp3',
    shop:    'assets/audio/lantern_waltz.mp3',
    boss:    'assets/audio/omen_of_the_black_gate.mp3',
    reward:  'assets/audio/fairytale_reward.mp3',
  };
  const AREA_FADE = 2.2;   // Sekunden Crossfade zwischen Bereichen
  const LOOP_FADE = 2.5;   // Sekunden Überlappung am Loop-Punkt

  const tracks = {};
  let scene = null, sting = null, stingUntil = 0, unlocked = false;
  // mainTrack: der eine Song, der im Spiel dauerhaft läuft (Boss überschreibt). stings: kurze Belohnungs-Jingles
  const settings = { music: 0.6, sfx: 0.6, muted: false, mainTrack: 'garden', stings: false };
  // Lautstärke-Abgleich: synthetische Effekte sind von Natur aus leiser als gemasterte Musik.
  // Mit diesem Faktor klingen beide Regler auf gleicher Stufe gleich laut.
  const SFX_BOOST = 3.6;
  // iOS ignoriert audio.volume – deshalb läuft Musik (über http) durch Web-Audio-Gain-Knoten
  const gains = new Map();
  function setVol(el, v) { const g = gains.get(el); if (g) { g.gain.value = v; el.volume = 1; } else el.volume = v; }
  function routeMusic() {
    if (!/^https?:/.test(location.protocol)) return;
    const c = sfxCtx(); if (!c) return;
    for (const t of Object.values(tracks)) for (const el of t.els) {
      if (gains.has(el)) continue;
      try { const src = c.createMediaElementSource(el), g = c.createGain(); g.gain.value = 0; src.connect(g); g.connect(c.destination); gains.set(el, g); } catch (e) { /* bleibt bei el.volume */ }
    }
  }

  function makeTrack(name) {
    const els = [new Audio(TRACKS[name]), new Audio(TRACKS[name])];
    els.forEach(e => { e.preload = 'auto'; e.volume = 0; e.setAttribute('playsinline', ''); });
    return { name, els, cur: 0, vol: 0, target: 0, playing: false, loopT: 1, prev: -1 };
  }

  function init() { Object.keys(TRACKS).forEach(n => tracks[n] = makeTrack(n)); }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    sfxCtx();
    routeMusic();
  }

  function setScene(name) { scene = name; }
  function playSting(name, seconds) { if (!settings.stings) return; sting = name; stingUntil = performance.now() + seconds * 1000; }

  function activeName() {
    if (sting && performance.now() < stingUntil) return sting;
    sting = null;
    return scene;
  }

  function update(dt) {
    if (!unlocked) return;
    const active = activeName();
    const master = settings.muted ? 0 : settings.music;
    for (const t of Object.values(tracks)) {
      t.target = t.name === active ? 1 : 0;
      const step = dt / AREA_FADE;
      t.vol = t.vol < t.target ? Math.min(t.target, t.vol + step) : Math.max(t.target, t.vol - step);

      if (t.vol > 0 && !t.playing) {
        const el = t.els[t.cur];
        if (t.name === 'reward') el.currentTime = 0;
        el.play().catch(() => {});
        t.playing = true; t.loopT = 1;
      }
      if (t.vol <= 0 && t.playing) {
        t.els.forEach(e => e.pause());
        t.playing = false;
        if (t.name === 'reward' || t.name === 'boss') t.els.forEach(e => { e.currentTime = 0; });
      }
      if (!t.playing) continue;

      // Nahtloser Loop: kurz vor Ende den Zwilling starten und überblenden
      const el = t.els[t.cur];
      if (el.duration && el.currentTime > el.duration - LOOP_FADE && t.loopT >= 1) {
        t.prev = t.cur;
        t.cur = 1 - t.cur;
        const nx = t.els[t.cur];
        nx.currentTime = 0;
        nx.play().catch(() => {});
        t.loopT = 0;
      }
      if (t.loopT < 1) t.loopT = Math.min(1, t.loopT + dt / LOOP_FADE);
      const curV = t.vol * master * (t.loopT < 1 ? Math.sin(t.loopT * Math.PI / 2) : 1);
      setVol(t.els[t.cur], PF.U.clamp(curV, 0, 1));
      if (t.prev >= 0) {
        const pv = t.vol * master * Math.cos(t.loopT * Math.PI / 2);
        const pe = t.els[t.prev];
        setVol(pe, PF.U.clamp(pv, 0, 1));
        if (t.loopT >= 1) { pe.pause(); t.prev = -1; }
      }
    }
  }

  // ---------- SFX ----------
  let ctx = null, bus = null;
  function sfxCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Effekt-Bus: Lautstärke + sanfter Limiter, damit lautere Effekte nicht übersteuern
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -10; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.15;
        bus = ctx.createGain(); bus.connect(comp); comp.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (bus) bus.gain.value = settings.muted ? 0 : settings.sfx * SFX_BOOST;
    return ctx;
  }
  function tone(freq, dur, type = 'sine', vol = 0.2, delay = 0, slide = 0) {
    const c = sfxCtx(); if (!c || settings.muted) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol = 0.15, freq = 1200) {
    const c = sfxCtx(); if (!c || settings.muted) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(bus || c.destination); s.start();
  }
  const SFX = {
    click: () => tone(520, 0.06, 'triangle', 0.12),
    harvest: () => { tone(660, 0.08, 'triangle', 0.16); tone(990, 0.1, 'sine', 0.1, 0.05); },
    water: () => noise(0.25, 0.08, 2400),
    place: () => { tone(180, 0.12, 'square', 0.08, 0, 0.6); noise(0.08, 0.1, 500); },
    coin: () => { tone(1320, 0.07, 'square', 0.06); tone(1760, 0.12, 'square', 0.06, 0.06); },
    sell: () => { tone(880, 0.06, 'triangle', 0.1); tone(1320, 0.1, 'triangle', 0.1, 0.05); },
    brew: () => { tone(220, 0.25, 'sine', 0.08, 0, 1.8); },
    order: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.07)),
    levelup: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.15, i * 0.08)),
    chest: () => { noise(0.4, 0.15, 300); tone(140, 0.4, 'sawtooth', 0.06, 0, 0.5); },
    reveal: (r = 0) => [0, 1, 2, 3].slice(0, 1 + r).forEach((k, i) => tone(660 * Math.pow(1.26, k), 0.22, 'sine', 0.12, i * 0.06)),
    legendary: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.5, 'triangle', 0.16, i * 0.06)); noise(0.6, 0.1, 4000); },
    error: () => tone(160, 0.18, 'square', 0.08, 0, 0.7),
    boss: () => { tone(80, 1.2, 'sawtooth', 0.15, 0, 0.5); noise(1.0, 0.18, 200); },
    combo: (n = 1) => tone(500 + n * 60, 0.1, 'triangle', 0.12),
    upgrade: () => [440, 554, 659, 880].forEach((f, i) => tone(f, 0.16, 'square', 0.07, i * 0.05)),
  };
  function sfx(name, arg) { if (unlocked && SFX[name]) SFX[name](arg); }

  return { init, unlock, setScene, playSting, update, sfx, settings, tracks };
})();
