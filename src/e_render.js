"use strict";
// Handgezeichnete 2D-Ansicht (Stil wie Tonlinge: Tinte, wackelige Linien, Papierfarben)
const INK = "#1d2742", PAPER = "#f7efd6";
const R = { t: 0, cust: [], pops: [], cars: [], hits: [], cam: { x: 180, y: 320, z: 1, ay: 0.5 }, target: { x: 180, y: 320, z: 1, ay: 0.5 }, vw: 360, vh: 640, sc: 1, emit: {}, spawn: 0, flash: 0 };
let cv, cx;
const LAY = [
  { bx: 90, by: 150, bw: 180, bh: 130, cols: 2, pcols: 6 },
  { bx: 50, by: 130, bw: 260, bh: 160, cols: 3, pcols: 8 },
  { bx: 25, by: 110, bw: 310, bh: 190, cols: 3, pcols: 10 },
  { bx: 15, by: 90, bw: 330, bh: 215, cols: 4, pcols: 12 },
  { bx: 10, by: 80, bw: 340, bh: 230, cols: 4, pcols: 14 },
];
const CAR_COLS = ["#e0303c", "#3a9ae0", "#f2b705", "#4fa84a", "#a83ad0", "#f2f2f2", "#e89a3a", "#6a7aa8", "#2f9a9a", "#c46a8a"];
const SHIRT = ["#e0303c", "#3a9ae0", "#f2b705", "#4fa84a", "#a83ad0", "#e89a3a", "#2f9a9a", "#c46a8a"];
const SKIN = ["#f2c9a0", "#e0a878", "#c68a5a", "#8a5a3a"];

function initRender(canvas) { cv = canvas; cx = cv.getContext("2d"); resizeRender(); addEventListener("resize", resizeRender); }
function resizeRender() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  R.vw = innerWidth; R.vh = innerHeight; R.dpr = dpr;
  cv.width = Math.round(R.vw * dpr); cv.height = Math.round(R.vh * dpr);
  cv.style.width = R.vw + "px"; cv.style.height = R.vh + "px";
  R.sc = Math.min(R.vw / 360, R.vh / 640 * 1.12);
}

// ---------- Layout ----------
function layoutFor(li, spotsN, depts, kasseN) {
  const A = LAY[li], L = { A, li };
  L.cx = A.bx + A.bw / 2; L.door = { x: L.cx, y: A.by + A.bh };
  const n = depts.length, cols = Math.min(A.cols, Math.max(1, n)), rows = Math.ceil(n / cols);
  const ix = A.bx + 10, iy = A.by + 24, iw = A.bw - 20, ih = A.bh - 24 - 40;
  const sw = iw / cols, sh = Math.min(58, ih / rows);
  L.slots = {};
  depts.forEach((id, i) => { const r = Math.floor(i / cols), c = i % cols; L.slots[id] = { x: ix + c * sw + 4, y: iy + r * sh + 2, w: sw - 8, h: sh - 8 }; });
  L.kasse = []; const kn = kasseN, ky = A.by + A.bh - 24;
  for (let i = 0; i < kn; i++) L.kasse.push({ x: A.bx + 22 + (A.bw - 44) * (kn === 1 ? 0.2 : i / (kn - 1) * 0.7), y: ky });
  L.lotTop = A.by + A.bh + 18; L.pcols = A.pcols;
  const prow = Math.ceil(spotsN / A.pcols); L.prow = prow;
  L.cellW = 340 / A.pcols; L.cellH = Math.min(26, (606 - L.lotTop) / Math.max(1, prow));
  L.spots = [];
  for (let i = 0; i < spotsN; i++) { const r = Math.floor(i / A.pcols), c = i % A.pcols; L.spots.push({ x: 10 + c * L.cellW + L.cellW / 2, y: L.lotTop + r * L.cellH + L.cellH / 2 }); }
  return L;
}

// ---------- Zeichen-Helfer (wackelig) ----------
function wrect(c, x, y, w, h, fill, seed, r, lw) {
  const j = (k) => (hs((x * 7) | 0, (y * 5) | 0, seed + k) - 0.5) * 1.6; r = r === undefined ? 4 : r;
  c.beginPath();
  c.moveTo(x + r + j(1), y + j(2)); c.lineTo(x + w - r + j(3), y + j(4)); c.quadraticCurveTo(x + w + j(5), y + j(6), x + w + j(7), y + r);
  c.lineTo(x + w + j(8), y + h - r); c.quadraticCurveTo(x + w + j(9), y + h + j(10), x + w - r, y + h + j(11));
  c.lineTo(x + r, y + h + j(12)); c.quadraticCurveTo(x + j(13), y + h + j(14), x + j(15), y + h - r);
  c.lineTo(x + j(16), y + r); c.quadraticCurveTo(x + j(17), y + j(18), x + r, y + j(19)); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw !== 0) { c.lineWidth = lw || 2; c.strokeStyle = INK; c.stroke(); }
}
function wline(c, x1, y1, x2, y2, col, w, seed) {
  const mx = (x1 + x2) / 2 + (hs(x1 | 0, y1 | 0, seed) - 0.5) * 2, my = (y1 + y2) / 2 + (hs(x2 | 0, y2 | 0, seed + 1) - 0.5) * 2;
  c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.strokeStyle = col || INK; c.lineWidth = w || 2; c.stroke();
}
function circ(c, x, y, r, fill, lw) { c.beginPath(); c.arc(x, y, r, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || 1.5; c.strokeStyle = INK; c.stroke(); } }
function person(c, x, y, shirt, skin, bob, s) {
  s = s || 1; c.save(); c.translate(x, y + bob); c.scale(s, s);
  c.fillStyle = "rgba(20,30,50,.22)"; c.beginPath(); c.ellipse(0, 5, 4.5, 1.6, 0, 0, 7); c.fill();
  wrect(c, -3.3, -3, 6.6, 8, shirt, 3, 2, 1.3); circ(c, 0, -5.2, 3.2, skin, 1.3); c.restore();
}
function car(c, x, y, col, ang, s) {
  c.save(); c.translate(x, y); c.rotate(ang || 0); c.scale(s || 1, s || 1);
  c.fillStyle = "rgba(20,30,50,.22)"; c.beginPath(); c.ellipse(1, 2, 8, 5, 0, 0, 7); c.fill();
  wrect(c, -8, -4.6, 16, 9.2, col, 11, 3, 1.5);
  wrect(c, -2.5, -3.4, 5.5, 6.8, "rgba(190,230,255,.9)", 12, 1.5, 1); wrect(c, 4.2, -3.2, 2.6, 6.4, "rgba(190,230,255,.9)", 13, 1, 0.8);
  c.restore();
}
function tree(c, x, y, s, seed, col) {
  c.fillStyle = "rgba(20,40,30,.2)"; c.beginPath(); c.ellipse(x, y + 2, 9 * s, 3 * s, 0, 0, 7); c.fill();
  wrect(c, x - 1.6 * s, y - 8 * s, 3.2 * s, 9 * s, "#8a5a3a", seed, 1, 1.4);
  circ(c, x, y - 14 * s, 8 * s, col || "#5fa055", 1.8); circ(c, x - 4 * s, y - 11 * s, 5 * s, mixHex(col || "#5fa055", "#ffffff", 0.18), 0);
}
function lamp(c, x, y, glow) { wline(c, x, y, x, y - 14, INK, 2.4, 5); circ(c, x, y - 15, 3, glow ? "#ffe680" : "#f7efd6", 1.4); }
function bench(c, x, y) { wrect(c, x - 7, y - 3, 14, 5, "#a8683a", 4, 1, 1.3); wline(c, x - 6, y + 2, x - 6, y + 5, INK, 1.4, 6); wline(c, x + 6, y + 2, x + 6, y + 5, INK, 1.4, 7); }
function flowerbed(c, x, y, w, seed) { wrect(c, x, y, w, 7, "#8a5a3a", seed, 2, 1.4); for (let i = 0; i < w / 6; i++) circ(c, x + 4 + i * 6, y + 2, 2.3, ["#e0303c", "#f2b705", "#e86aa8", "#fff"][(hs(i, seed, 3) * 4) | 0], 1); }

// ---------- Waren pro Abteilung ----------
function goods(c, id, x, y, w, h, t) {
  const n = Math.max(2, Math.floor(w / 9));
  for (let i = 0; i < n; i++) {
    const gx = x + 5 + i * (w - 10) / Math.max(1, n - 1), gy = y + h * 0.35 + (i % 2) * 3;
    switch (id) {
      case "obst": circ(c, gx, gy, 3.1, ["#c24fb0", "#e0303c", "#f2b705", "#7a3a98"][i % 4], 1.1); break;
      case "gemuese": c.beginPath(); c.ellipse(gx, gy, 2.6, 3.8, 0.3 * (i % 3 - 1), 0, 7); c.fillStyle = ["#4fa84a", "#f28a2a", "#8ac84a"][i % 3]; c.fill(); c.lineWidth = 1.1; c.strokeStyle = INK; c.stroke(); break;
      case "back": c.beginPath(); c.ellipse(gx, gy, 4, 2.6, 0, 0, 7); c.fillStyle = ["#d89a4a", "#c8803a", "#e8b86a"][i % 3]; c.fill(); c.lineWidth = 1.1; c.strokeStyle = INK; c.stroke(); break;
      case "kuehl": wrect(c, gx - 2.4, gy - 4, 4.8, 8, i % 2 ? "#fff" : "#cfe8ff", 4, 1, 1.1); break;
      case "tk": wrect(c, gx - 3, gy - 3, 6, 6, i % 2 ? "#cfe0ff" : "#9ab8f0", 4, 1, 1.1); wline(c, gx - 1.5, gy, gx + 1.5, gy, INK, 0.9, 3); break;
      case "fleisch": c.beginPath(); c.ellipse(gx, gy, 3.8, 2.6, 0.4, 0, 7); c.fillStyle = ["#e86a6a", "#c8443a", "#f0a098"][i % 3]; c.fill(); c.lineWidth = 1.1; c.strokeStyle = INK; c.stroke(); break;
      case "fein": wrect(c, gx - 2.5, gy - 4, 5, 8, ["#f2b705", "#8a4ac8", "#e0303c"][i % 3], 4, 1.5, 1.1); break;
      case "elektro": wrect(c, gx - 3.5, gy - 3.5, 7, 6, "#6a7a8a", 4, 1, 1.1); wrect(c, gx - 2.4, gy - 2.6, 4.8, 3.6, (Math.sin(t * 2 + i) > 0 ? "#8ae0ff" : "#4a9ac0"), 4, 0.5, 0); break;
    }
  }
}

// ---------- Gebäude je Standort ----------
function drawBuilding(c, L, loc, t) {
  const A = L.A, li = L.li;
  // Boden und Wände
  wrect(c, A.bx - 6, A.by - 6, A.bw + 12, A.bh + 12, loc.wall, 21, 6, 3);
  const fx = A.bx, fy = A.by + 14, fw = A.bw, fh = A.bh - 14;
  c.save(); c.beginPath(); c.rect(fx, fy, fw, fh); c.clip();
  c.fillStyle = loc.floor; c.fillRect(fx, fy, fw, fh);
  c.fillStyle = loc.floor2; const ts = 14; for (let y = 0; y < fh / ts; y++) for (let x = 0; x < fw / ts; x++) if ((x + y) % 2 === 0) c.fillRect(fx + x * ts, fy + y * ts, ts, ts);
  c.restore(); c.lineWidth = 2; c.strokeStyle = INK; c.strokeRect(fx, fy, fw, fh);
  // Dach-/Fassadenband oben
  wrect(c, A.bx - 8, A.by - 8, A.bw + 16, 22, loc.roof, 22, 4, 2.4);
  if (li === 0) { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#fff" : "#e0303c"; c.fillRect(A.bx - 6 + i * ((A.bw + 12) / 8), A.by - 6, (A.bw + 12) / 8, 18); } wrect(c, A.bx - 8, A.by - 8, A.bw + 16, 22, null, 22, 4, 2.4); }
  if (li === 1) { for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#fff3d0" : "#c0392b"; c.fillRect(A.bx - 6 + i * ((A.bw + 12) / 10), A.by - 6, (A.bw + 12) / 10, 18); } wrect(c, A.bx - 8, A.by - 8, A.bw + 16, 22, null, 22, 4, 2.4); }
  if (li === 3) { for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? "#cfe8ff" : "#9ac8f0"; c.fillRect(A.bx - 6 + i * ((A.bw + 12) / 12), A.by - 6, (A.bw + 12) / 12, 18); } wrect(c, A.bx - 8, A.by - 8, A.bw + 16, 22, null, 22, 4, 2.4); }
  if (li === 4) { for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? "#f2b705" : "#e8c04a"; c.fillRect(A.bx - 6 + i * ((A.bw + 12) / 14), A.by - 6, (A.bw + 12) / 14, 18); } wrect(c, A.bx - 8, A.by - 8, A.bw + 16, 22, null, 22, 4, 2.4); }
  // Schild
  const sw = Math.min(A.bw - 30, 20 + loc.sign.length * 9);
  wrect(c, L.cx - sw / 2, A.by - 30, sw, 22, li === 4 ? "#1d2742" : "#fffdf2", 23, 5, 2.2);
  c.font = "15px 'Caveat Brush', cursive"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = li === 4 ? "#f2b705" : INK; c.fillText(loc.sign, L.cx, A.by - 19);
  // Extras je Standort
  if (li >= 2) { // Fenster-Seiten
    for (let i = 0; i < 3; i++) { wrect(c, A.bx - 5, A.by + 40 + i * 40, 4, 22, "#bfe6ff", 30 + i, 1, 1.2); wrect(c, A.bx + A.bw + 1, A.by + 40 + i * 40, 4, 22, "#bfe6ff", 40 + i, 1, 1.2); }
  }
  if (li === 3) { // Türmchen / Parkhaus-Andeutung
    for (let i = 0; i < 4; i++) wrect(c, A.bx + 14 + i * 80, A.by - 50 - (i % 2) * 14, 36, 34, "#8fb8d8", 50 + i, 2, 2);
  }
  if (li === 4) { // goldene Türme und Hubschrauberlandeplatz
    wrect(c, A.bx + 10, A.by - 62, 42, 56, "#f2b705", 60, 3, 2.4); wrect(c, A.bx + A.bw - 52, A.by - 62, 42, 56, "#f2b705", 61, 3, 2.4);
    circ(c, L.cx, A.by - 52, 20, "#fffdf2", 2.2); c.fillStyle = INK; c.font = "16px 'Caveat Brush'"; c.fillText("H", L.cx, A.by - 52);
    const ang = t * 9; c.save(); c.translate(L.cx + 30, A.by - 62); c.rotate(ang); wline(c, -14, 0, 14, 0, INK, 2, 9); c.restore(); circ(c, L.cx + 30, A.by - 62, 3, "#e0303c", 1.2);
  }
  // Tür
  wrect(c, L.cx - 14, A.by + A.bh - 3, 28, 8, "#bfe6ff", 70, 1, 2);
  if (li === 4) wrect(c, L.cx - 8, A.by + A.bh + 6, 16, 12, "#e0303c", 71, 1, 1.4);
}

// ---------- Abteilungen ----------
function drawStall(c, id, sl, t, active, auto) {
  const d = DEPT_BY[id], dd = S.dept[id];
  wrect(c, sl.x, sl.y, sl.w, sl.h, d.col2, 80, 4, 2);
  wrect(c, sl.x + 2, sl.y + 2, sl.w - 4, sl.h * 0.42, d.col, 81, 3, 1.4);
  goods(c, id, sl.x + 2, sl.y + 2, sl.w - 4, sl.h * 0.42, t);
  // Mitarbeiter
  for (let i = 0; i < dd.emp; i++) person(c, sl.x + 8 + i * Math.min(16, (sl.w - 16) / Math.max(1, dd.emp)), sl.y + sl.h * 0.72, SHIRT[(DEPTS.indexOf(d)) % 8], SKIN[i % 4], active ? Math.sin(t * 6 + i * 1.7) * 0.9 : 0, 1);
  // Namensschild
  c.font = "10px 'Patrick Hand', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  const tw = c.measureText(d.name).width + 8; wrect(c, sl.x + sl.w / 2 - tw / 2, sl.y - 7, tw, 12, "#fffdf2", 82, 3, 1.2); c.fillStyle = INK; c.fillText(d.name, sl.x + sl.w / 2, sl.y - 1);
  if (!auto) { // Tippen-Hinweis
    const by = Math.sin(t * 4) * 2; if (!active) { wrect(c, sl.x + sl.w / 2 - 17, sl.y + sl.h * 0.35 + by, 34, 13, "#f2b705", 83, 5, 1.5); c.fillStyle = INK; c.font = "11px 'Caveat Brush'"; c.fillText("Tippen!", sl.x + sl.w / 2, sl.y + sl.h * 0.35 + 6.5 + by); }
  } else { circ(c, sl.x + sl.w - 6, sl.y + 5, 5, "#4fa84a", 1.2); c.fillStyle = "#fff"; c.font = "8px 'Caveat Brush'"; c.fillText("A", sl.x + sl.w - 6, sl.y + 5.5); }
}
function drawKasse(c, k, i, t, busy) {
  wrect(c, k.x - 11, k.y - 4, 22, 9, "#8a95a8", 90, 2, 1.6); wrect(c, k.x - 4, k.y - 8, 9, 5, "#cfe8ff", 91, 1, 1.2);
  person(c, k.x, k.y - 9, "#2f9a9a", SKIN[(i + 1) % 4], busy ? Math.sin(t * 7 + i) * 0.8 : 0, 1);
}

// ---------- Kunden ----------
function spawnCust(L, fl) {
  if (!L.spots.length) return;
  const occ = L.spots.map((s, i) => i).filter(i => hs(i, 3, 7) < (C ? C.parkUse : 0.5));
  const si = occ.length ? occ[(Math.random() * occ.length) | 0] : 0, sp = L.spots[si];
  const ids = Object.keys(S.dept), nv = 1 + ((Math.random() * Math.min(3, ids.length)) | 0), vis = [];
  for (let i = 0; i < nv; i++) vis.push(ids[(Math.random() * ids.length) | 0]);
  const path = [{ x: sp.x, y: sp.y }, { x: L.door.x + rnd(-4, 4), y: L.door.y + 12 }, { x: L.door.x + rnd(-4, 4), y: L.door.y - 10 }];
  vis.forEach(id => { const s = L.slots[id]; if (s) path.push({ x: s.x + rnd(4, s.w - 4), y: s.y + s.h + 6, pause: rnd(0.4, 1.0) }); });
  const k = L.kasse[(Math.random() * L.kasse.length) | 0]; path.push({ x: k.x + rnd(-3, 3), y: k.y + 12, pause: rnd(0.5, 1.2) });
  path.push({ x: L.door.x, y: L.door.y - 6 }, { x: L.door.x, y: L.door.y + 14 }, { x: sp.x, y: sp.y });
  R.cust.push({ x: sp.x, y: sp.y, path, i: 1, pause: 0, shirt: SHIRT[(Math.random() * 8) | 0], skin: SKIN[(Math.random() * 4) | 0], v: rnd(26, 40), seed: Math.random() * 99, col: CAR_COLS[(Math.random() * CAR_COLS.length) | 0], si });
}
function stepCust(dt) {
  for (let k = R.cust.length - 1; k >= 0; k--) {
    const p = R.cust[k];
    if (p.pause > 0) { p.pause -= dt; continue; }
    const tg = p.path[p.i]; if (!tg) { R.cust.splice(k, 1); continue; }
    const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy), st = p.v * dt;
    if (d <= st) { p.x = tg.x; p.y = tg.y; p.pause = tg.pause || 0; p.i++; } else { p.x += dx / d * st; p.y += dy / d * st; }
  }
}

// ---------- Hauptzeichnung ----------
function drawFrame(dt, dim) {
  const c = cx, vw = R.vw, vh = R.vh, dpr = R.dpr;
  R.t += dt;
  const loc = LOCS[S.loc], deptIds = DEPTS.filter(d => S.dept[d.id]).map(d => d.id);
  const L = layoutFor(S.loc, C ? C.spots : 6, deptIds, S.kasse.n); R.L = L;
  // Kamera
  const cm = R.cam, tg = R.target, k = Math.min(1, dt * 6);
  cm.x += (tg.x - cm.x) * k; cm.y += (tg.y - cm.y) * k; cm.z += (tg.z - cm.z) * k; cm.ay += (tg.ay - cm.ay) * k;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = loc.ground; c.fillRect(0, 0, vw, vh);
  const z = cm.z * R.sc;
  c.save(); c.translate(vw / 2, vh * cm.ay); c.scale(z, z); c.translate(-cm.x, -cm.y);
  c.lineJoin = c.lineCap = "round";
  // Boden: große Fläche mit Grasbüscheln
  const gx0 = -300, gx1 = 660, gy0 = -300, gy1 = 940;
  c.fillStyle = loc.ground; c.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  for (let i = 0; i < 90; i++) { const x = hs(i, 1, 1) * 360, y = hs(i, 2, 2) * 640; c.strokeStyle = loc.ground2; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.5, y - 4); c.moveTo(x, y); c.lineTo(x + 1.5, y - 4); c.stroke(); }
  // Straße
  c.fillStyle = S.loc === 4 ? "#202a48" : "#6b6e80"; c.fillRect(gx0, 614, gx1 - gx0, 100); c.fillStyle = S.loc === 4 ? "#2f3a5c" : "#b8b6a8"; c.fillRect(gx0, 606, gx1 - gx0, 8);
  c.setLineDash([14, 12]); c.strokeStyle = "#f2b705"; c.lineWidth = 2; c.beginPath(); c.moveTo(gx0, 642); c.lineTo(gx1, 642); c.stroke(); c.setLineDash([]);
  // Parkplatz
  const pw = 340, ph = L.prow * L.cellH;
  wrect(c, 10, L.lotTop - 4, pw, ph + 8, loc.lot, 100, 5, 2);
  for (let r = 0; r < L.prow; r++) for (let q = 0; q <= L.A.pcols; q++) { const x = 10 + q * L.cellW; wline(c, x, L.lotTop + r * L.cellH + 2, x, L.lotTop + (r + 1) * L.cellH - 2, loc.lotLine, 1.8, r * 31 + q); }
  if (S.loc === 3 || S.loc === 4) for (let q = 0; q < 3; q++) wrect(c, 10 + (q + 1) * pw / 4 - 3, L.lotTop - 2, 6, 6, S.loc === 3 ? "#9aa0b0" : "#e8c04a", 101 + q, 1, 1.2);
  // Parkende Autos
  const occN = C ? C.parkUse : 0.5;
  L.spots.forEach((sp, i) => { if (hs(i, 3, 7) < occN) { const mv = R.cust.some(p => p.si === i && p.i <= 1); if (!mv) car(c, sp.x, sp.y, CAR_COLS[(hs(i, 4, 5) * CAR_COLS.length) | 0], Math.PI / 2, Math.min(1, L.cellH / 22)); } });
  // Deko
  decor(c, L, loc, R.t);
  drawBuilding(c, L, loc, R.t);
  // Abteilungen
  R.hits = [];
  for (const id of deptIds) {
    const sl = L.slots[id], st = C && C.depts[id]; drawStall(c, id, sl, R.t, st && st.active, isAuto(id));
    R.hits.push({ id, x: sl.x, y: sl.y, w: sl.w, h: sl.h });
    // Geld-Blasen
    if (st && st.active && st.inc > 0) {
      R.emit[id] = (R.emit[id] || 0) + dt;
      if (R.emit[id] > 2.2) { R.emit[id] = 0; R.pops.push({ x: sl.x + sl.w / 2, y: sl.y - 8, v: st.inc / 60 * 2.2, t: 0 }); }
    }
  }
  L.kasse.forEach((kk, i) => drawKasse(c, kk, i, R.t, C && C.flow > 0));
  // Kunden
  R.spawn += dt * Math.min(1.4, (C ? C.flow : 3) / 60 * 3);
  while (R.spawn >= 1) { R.spawn -= 1; if (R.cust.length < 46) spawnCust(L, C ? C.flow : 3); }
  stepCust(dt);
  R.cust.slice().sort((a, b) => a.y - b.y).forEach(p => {
    const inLot = p.y > L.door.y + 8 && p.i <= 2;
    if (p.i >= p.path.length - 1 && p.y > L.door.y + 8 && p.i > 5) car(c, p.path[p.path.length - 1].x, p.path[p.path.length - 1].y, p.col, Math.PI / 2, Math.min(1, L.cellH / 22));
    person(c, p.x, p.y, p.shirt, p.skin, Math.sin(R.t * 10 + p.seed) * 0.8, 0.95);
  });
  // vorbeifahrende Autos
  for (let i = 0; i < 3; i++) { const sp = 28 + i * 9, x = ((R.t * sp + i * 160) % 520) - 80; car(c, i % 2 ? 440 - x : x, i % 2 ? 628 : 656, CAR_COLS[(i * 3 + S.loc) % 10], i % 2 ? Math.PI : 0, 1.1); }
  // Geld-Popups
  for (let i = R.pops.length - 1; i >= 0; i--) {
    const p = R.pops[i]; p.t += dt; if (p.t > 1.6) { R.pops.splice(i, 1); continue; }
    c.globalAlpha = Math.min(1, (1.6 - p.t) * 2); const yy = p.y - p.t * 16;
    c.font = "13px 'Caveat Brush'"; c.textAlign = "center"; const tx = "+" + fmt(p.v), tw = c.measureText(tx).width + 14;
    wrect(c, p.x - tw / 2, yy - 9, tw, 17, "#fffdf2", 110, 6, 1.6); c.fillStyle = "#2a9a3a"; c.textBaseline = "middle"; c.fillText(tx, p.x, yy);
    c.globalAlpha = 1;
  }
  c.restore();
  if (dim) { c.fillStyle = "rgba(20,30,60,.35)"; c.fillRect(0, 0, vw, vh); }
}

function decor(c, L, loc, t) {
  const li = L.li, A = L.A;
  if (li === 0) { tree(c, 40, 120, 1.3, 1); tree(c, 320, 150, 1.2, 2); bench(c, 60, 250); flowerbed(c, 250, 290, 50, 3); tree(c, 300, 60, 1, 4); tree(c, 30, 230, 1.1, 5); }
  if (li === 1) { tree(c, 24, 100, 1.2, 1); tree(c, 336, 100, 1.2, 2); flowerbed(c, 40, 304, 90, 3); flowerbed(c, 230, 304, 90, 4); lamp(c, 20, 300, 0); lamp(c, 340, 300, 0); tree(c, 180, 56, 1, 6, "#6ab060"); for (let i = 0; i < 7; i++) wrect(c, 14 + i * 7, 106, 4, 18, "#e6d8b0", 130 + i, 1, 1); }
  if (li === 2) { tree(c, 14, 70, 1.1, 1); tree(c, 346, 70, 1.1, 2); lamp(c, 10, 310, 0); lamp(c, 350, 310, 0); bench(c, 330, 60); wrect(c, 4, 50, 20, 30, "#3a9ae0", 140, 2, 1.8); c.fillStyle = "#fff"; c.font = "12px 'Caveat Brush'"; c.textAlign = "center"; c.fillText("BUS", 14, 65); }
  if (li === 3) { for (let i = 0; i < 6; i++) wrect(c, 4 + i * 60, 10 + (i % 3) * 8, 44, 62 - (i % 3) * 8, ["#a8b8d0", "#98a8c4", "#b8c8dc"][i % 3], 150 + i, 2, 2); lamp(c, 10, 320, 1); lamp(c, 350, 320, 1); }
  if (li === 4) { for (let i = 0; i < 8; i++) wrect(c, 6 + i * 44, 6 + (i % 3) * 7, 34, 60, ["#3a4a78", "#46578a", "#33436c"][i % 3], 160 + i, 2, 2); for (let i = 0; i < 25; i++) { c.fillStyle = Math.sin(t + i) > 0 ? "#ffe680" : "#9ab"; c.fillRect(12 + (i % 8) * 44, 20 + ((i / 8) | 0) * 12, 4, 4); }
    circ(c, 180, 330, 12, "#7ad0ff", 2); circ(c, 180, 330, 6, "#fff", 1.4); const w = Math.sin(t * 3) * 3; wline(c, 180, 322, 180, 316 + w, "#fff", 2, 8); lamp(c, 10, 320, 1); lamp(c, 350, 320, 1); }
}

// Tipp-Erkennung: Bildschirm -> Welt
function screenToWorld(px, py) { const z = R.cam.z * R.sc; return { x: (px - R.vw / 2) / z + R.cam.x, y: (py - R.vh * R.cam.ay) / z + R.cam.y }; }
function hitStall(px, py) { const w = screenToWorld(px, py); for (const h of R.hits) if (w.x >= h.x - 4 && w.x <= h.x + h.w + 4 && w.y >= h.y - 8 && w.y <= h.y + h.h + 4) return h.id; return null; }
function focusDept(id) {
  if (!id) { R.target = { x: 180, y: 330, z: 1, ay: 0.5 }; return; }
  const sl = R.L && R.L.slots[id]; if (!sl) return;
  R.target = { x: sl.x + sl.w / 2, y: sl.y + sl.h / 2, z: 2.0, ay: 0.2 };
}
