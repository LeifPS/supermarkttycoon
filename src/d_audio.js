"use strict";
// Ton: erst Dateien aus public/audio/*.mp3 (ElevenLabs), sonst eingebauter Synth
const AU = { ctx: null, buf: {}, musicSrc: null, musicGain: null, timer: null, step: 0, ok: false };
const AU_FILES = ["tap", "buy", "coin", "up", "err", "pack", "claim", "quest", "music"];
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === "suspended") AU.ctx.resume(); return; }
  try {
    AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.8; AU.master.connect(AU.ctx.destination);
    AU.ok = true; auLoadFiles(); auMusic();
  } catch (e) { AU.ok = false; }
}
function auLoadFiles() {
  AU_FILES.forEach(n => {
    fetch("audio/" + n + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => AU.ctx.decodeAudioData(b)).then(d => { AU.buf[n] = d; if (n === "music") auMusic(true); }).catch(() => { });
  });
}
function tone(f, dur, type, vol, when, slide) {
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + (when || 0);
  o.type = type || "sine"; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(AU.master); o.start(t0); o.stop(t0 + dur + 0.05);
}
function sfx(name) {
  if (!AU.ok || !S || !S.set.sound) return;
  if (AU.buf[name]) { const s = AU.ctx.createBufferSource(), g = AU.ctx.createGain(); s.buffer = AU.buf[name]; g.gain.value = 0.9; s.connect(g); g.connect(AU.master); s.start(); return; }
  switch (name) {
    case "tap": tone(520, 0.06, "triangle", 0.14, 0, 1.4); break;
    case "buy": tone(660, 0.08, "square", 0.08); tone(990, 0.12, "square", 0.08, 0.07); break;
    case "coin": tone(1320, 0.07, "sine", 0.12); tone(1760, 0.14, "sine", 0.12, 0.06); break;
    case "up": [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, "triangle", 0.16, i * 0.08)); break;
    case "err": tone(180, 0.18, "sawtooth", 0.1, 0, 0.7); break;
    case "pack": [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, "triangle", 0.15, i * 0.07)); break;
    case "claim": tone(880, 0.1, "sine", 0.15); tone(1175, 0.1, "sine", 0.15, 0.09); tone(1568, 0.2, "sine", 0.15, 0.18); break;
    case "quest": [523, 659, 784].forEach((f, i) => tone(f, 0.14, "sine", 0.15, i * 0.09)); break;
  }
}
// Hintergrundmusik: Datei oder kleiner Zufalls-Arpeggio-Loop
function auMusic(fromFile) {
  if (!AU.ok) return;
  if (AU.musicSrc) { try { AU.musicSrc.stop(); } catch (e) { } AU.musicSrc = null; }
  if (AU.timer) { clearInterval(AU.timer); AU.timer = null; }
  if (!S || !S.set.music) return;
  if (AU.buf.music) {
    const s = AU.ctx.createBufferSource(), g = AU.ctx.createGain(); s.buffer = AU.buf.music; s.loop = true; g.gain.value = 0.35; s.connect(g); g.connect(AU.master); s.start(); AU.musicSrc = s; return;
  }
  const scale = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3], bass = [130.8, 98, 110, 87.3];
  AU.timer = setInterval(() => {
    if (!S.set.music || AU.buf.music) return;
    const s = AU.step++, bar = (s >> 3) % 4;
    if (s % 8 === 0) tone(bass[bar], 0.9, "sine", 0.07);
    if (s % 2 === 0) tone(scale[(s * 3 + bar * 2 + (Math.random() * 2 | 0)) % 7], 0.35, "triangle", 0.035);
  }, 260);
}
