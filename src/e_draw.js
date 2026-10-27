"use strict";
// Handgezeichnete SVG-Grundformen: wackelige Tintenlinien, doppelte Striche, Schraffur.
// Alles liefert SVG-Text; die Wackelung ist deterministisch (gleiche Zeichnung bei jedem Neuaufbau).
const INK = "#1d2742", PAPER = "#f7efd6";
const f1 = n => Math.round(n * 10) / 10;
function J(x, y, k, a) { return (hs(Math.round(x * 7), Math.round(y * 7), k) - 0.5) * 2 * a; }

// Weicher, leicht verwackelter Pfad durch Punkte
function pth(pts, close, a, k0) {
  a = a === undefined ? 0.9 : a; k0 = k0 || 0;
  const P = pts.map((p, i) => [p[0] + J(p[0], p[1], i + k0, a), p[1] + J(p[0], p[1], i + 50 + k0, a)]);
  let d = "M" + f1(P[0][0]) + " " + f1(P[0][1]);
  const n = P.length, last = close ? n : n - 1;
  for (let i = 1; i <= last; i++) {
    const p = P[i % n], q = P[i - 1];
    const mx = (p[0] + q[0]) / 2 + J(q[0], q[1], i + 9 + k0, a * 0.7), my = (p[1] + q[1]) / 2 + J(p[0], p[1], i + 19 + k0, a * 0.7);
    d += "Q" + f1(mx) + " " + f1(my) + " " + f1(p[0]) + " " + f1(p[1]);
  }
  return d + (close ? "Z" : "");
}
// gefüllte Form mit Tinten-Umriss (Fläche und Linie leicht versetzt, dazu zweiter dünner Strich)
function shp(pts, fill, o) {
  o = o || {}; const sw = o.sw || 2.2, st = o.st || INK, op = o.op === undefined ? 1 : o.op;
  let s = "";
  if (fill && fill !== "none") s += '<path d="' + pth(pts, 1, 0.7, 3) + '" fill="' + fill + '" stroke="none"' + (op < 1 ? ' opacity="' + op + '"' : "") + "/>";
  if (o.nostroke) return s;
  s += '<path d="' + pth(pts, 1, 0.9, 0) + '" fill="none" stroke="' + st + '" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round"/>';
  s += '<path d="' + pth(pts, 1, 1.3, 7) + '" fill="none" stroke="' + st + '" stroke-width="' + f1(sw * 0.4) + '" opacity=".5" stroke-linejoin="round"/>';
  return s;
}
const rect = (x, y, w, h, fill, o) => shp([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, o);
function ell(cx, cy, rx, ry, fill, o) {
  const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.2832; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return shp(pts, fill, o);
}
const circ = (cx, cy, r, fill, o) => ell(cx, cy, r, r, fill, o);
function line(x1, y1, x2, y2, sw, col, o) {
  sw = sw || 2; col = col || INK; o = o || {};
  const p = [[x1, y1], [x2, y2]];
  let s = '<path d="' + pth(p, 0, 0.8, 0) + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") + "/>";
  if (!o.one) s += '<path d="' + pth(p, 0, 1.2, 5) + '" fill="none" stroke="' + col + '" stroke-width="' + f1(sw * 0.4) + '" stroke-linecap="round" opacity=".5"/>';
  return s;
}
// freier Pfad (Kurve) mit Tinte
function ink(d, sw, col, fill) { return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + (col || INK) + '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
// Schraffur (diagonale Striche) in einem Rechteck
function hatch(x, y, w, h, sp, col, sw, op) {
  let s = ""; sp = sp || 5;
  for (let t = -h; t < w; t += sp) {
    let x1 = x + t, y1 = y + h, x2 = x + t + h, y2 = y;
    if (x1 < x) { y1 -= x - x1; x1 = x; }
    if (x2 > x + w) { y2 += x2 - (x + w); x2 = x + w; }
    if (y1 < y2) continue;
    s += "M" + f1(x1 + J(x1, y1, 3, .5)) + " " + f1(y1) + "L" + f1(x2) + " " + f1(y2 + J(x2, y2, 4, .5));
  }
  return '<path d="' + s + '" stroke="' + (col || INK) + '" stroke-width="' + (sw || 1) + '" opacity="' + (op || 0.25) + '" fill="none" stroke-linecap="round"/>';
}
function txt(x, y, s, size, col, anchor, o) {
  o = o || {};
  return '<text x="' + x + '" y="' + y + '" font-family="Caveat Brush,cursive" font-size="' + size + '" fill="' + (col || INK) + '" text-anchor="' + (anchor || "middle") + '"' + (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="' + (o.sw || 2.5) + '" paint-order="stroke" stroke-linejoin="round"' : "") + (o.rot ? ' transform="rotate(' + o.rot + " " + x + " " + y + ')"' : "") + ">" + s + "</text>";
}
const sh = (cx, cy, rx, ry) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="rgba(29,39,66,.22)"/>';
const dk = (c, t) => mixHex(c, "#1d2742", t === undefined ? 0.25 : t);
const lt = (c, t) => mixHex(c, "#ffffff", t === undefined ? 0.35 : t);
function star(cx, cy, r, fill, o) { const p = []; for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.6283, rr = i % 2 ? r * 0.45 : r; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return shp(p, fill, o); }
function tree(x, y, s, col, kind) {
  col = col || "#5fa055";
  if (kind === "palm") {
    let o = line(x, y, x + 3 * s, y - 34 * s, 4 * s, "#8a5a3a");
    for (let i = 0; i < 6; i++) { const a = -2.9 + i * 0.58, ex = x + 3 * s + Math.cos(a) * 20 * s, ey = y - 34 * s + Math.sin(a) * 14 * s + 5 * s; o += ink("M" + (x + 3 * s) + " " + (y - 34 * s) + "Q" + (x + 3 * s + Math.cos(a) * 12 * s) + " " + (y - 44 * s) + " " + ex + " " + ey, 3.2 * s, "#2f8a4a"); }
    return sh(x, y, 9 * s, 2.5 * s) + o;
  }
  if (kind === "pine") return sh(x, y, 9 * s, 2.5 * s) + rect(x - 2 * s, y - 8 * s, 4 * s, 9 * s, "#7a4a2a", { sw: 1.5 }) + shp([[x - 11 * s, y - 6 * s], [x, y - 28 * s], [x + 11 * s, y - 6 * s]], dk(col, .1), { sw: 1.8 }) + shp([[x - 9 * s, y - 16 * s], [x, y - 38 * s], [x + 9 * s, y - 16 * s]], col, { sw: 1.8 });
  return sh(x, y, 11 * s, 3 * s) + rect(x - 2 * s, y - 14 * s, 4 * s, 15 * s, "#8a5a3a", { sw: 1.6 }) + circ(x, y - 22 * s, 12 * s, col, { sw: 2 }) + circ(x - 6 * s, y - 18 * s, 7 * s, lt(col, .2), { sw: 1.2 }) + circ(x + 6 * s, y - 26 * s, 6 * s, dk(col, .12), { sw: 1.2 });
}
function bush(x, y, s, col) { col = col || "#6aa85a"; return circ(x - 6 * s, y - 4 * s, 6 * s, col, { sw: 1.8 }) + circ(x + 5 * s, y - 5 * s, 7 * s, lt(col, .15), { sw: 1.8 }) + circ(x, y - 8 * s, 6 * s, col, { sw: 1.8 }); }
function cloud(x, y, s) { return '<g opacity=".95">' + circ(x, y, 10 * s, "#fffdf2", { sw: 1.6 }) + circ(x + 11 * s, y - 4 * s, 12 * s, "#fffdf2", { sw: 1.6 }) + circ(x + 23 * s, y, 9 * s, "#fffdf2", { sw: 1.6 }) + rect(x - 2 * s, y, 28 * s, 8 * s, "#fffdf2", { sw: 0, nostroke: 1 }) + "</g>"; }

// ---------- Menschen (Seitenansicht) ----------
const SKINS = ["#f2c9a0", "#e0a878", "#c68a5a", "#8a5a3a"];
const HAIRS = ["#3a2a1a", "#8a4a1a", "#d8b050", "#1a1a1a", "#b8b8c0", "#a83a1a"];
const SHIRTS = ["#e0303c", "#3a9ae0", "#f2b705", "#4fa84a", "#a83ad0", "#e89a3a", "#2f9a9a", "#e86aa8"];
const PANTS = ["#3a4a78", "#5a4a3a", "#2a2a3a", "#6a7a8a"];
// Eine Figur: Füße bei (0,0), Höhe ca. 34. frame 0/1 = Laufschritt. opt: hat (baker, butcher, cap, hard, none), apron farbe, basket, vip
function figure(shirt, skin, hair, pants, frame, o) {
  o = o || {};
  const L = frame === 0 ? [-3, 3] : frame === 1 ? [3, -3] : [-2, 2];
  let s = o.half ? "" : sh(0, 0, 8, 2.3);
  if (!o.half) { s += rect(-5 + L[0], -13, 3.6, 13, pants, { sw: 1.6 }) + rect(1.4 + L[1], -13, 3.6, 13, dk(pants, .15), { sw: 1.6 });
  s += rect(-5 + L[0] - 1, -2, 5.6, 2.6, "#2a2a3a", { sw: 1.2 }) + rect(1.4 + L[1] - 1, -2, 5.6, 2.6, "#2a2a3a", { sw: 1.2 }); }
  s += shp([[-7, -27], [7, -27], [6.4, -12], [-6.4, -12]], shirt, { sw: 1.8 });
  if (o.apron) s += shp([[-5, -23], [5, -23], [5.4, -9], [-5.4, -9]], o.apron, { sw: 1.4 });
  s += rect(-9.4, -26, 3.6, 11, shirt, { sw: 1.5 }) + rect(5.8, -26, 3.6, 11, shirt, { sw: 1.5 });
  s += circ(-7.6, -14.4, 2.1, skin, { sw: 1.2 }) + circ(7.6, -14.4, 2.1, skin, { sw: 1.2 });
  s += rect(-2, -30, 4, 4, skin, { sw: 1.2 });
  s += circ(0, -35.4, 6.7, skin, { sw: 1.8 });
  const hs2 = o.hairStyle || 0;
  if (o.hat === "baker") s += rect(-6, -43, 12, 4, "#fffdf2", { sw: 1.5 }) + circ(-3.6, -46, 4, "#fffdf2", { sw: 1.5 }) + circ(3.6, -46, 4, "#fffdf2", { sw: 1.5 }) + circ(0, -48, 4.4, "#fffdf2", { sw: 1.5 });
  else if (o.hat === "butcher") s += shp([[-6.6, -39], [6.6, -39], [5.4, -45], [-5.4, -45]], "#fffdf2", { sw: 1.6 }) + line(-6.6, -39.5, 6.6, -39.5, 1.6, "#e0303c");
  else if (o.hat === "cap") s += shp([[-6.8, -38], [6.8, -38], [5, -44.5], [-5, -44.5]], o.hatCol || "#3a7ae0", { sw: 1.6 }) + rect(2, -39.4, 8, 2, o.hatCol || "#3a7ae0", { sw: 1.3 });
  else if (o.hat === "hard") s += shp([[-7, -38.5], [7, -38.5], [5.6, -45], [-5.6, -45]], "#f2b705", { sw: 1.6 });
  else if (o.hat === "chef") s += rect(-5.6, -42.6, 11.2, 3.6, "#fffdf2", { sw: 1.5 }) + circ(0, -46, 5, "#fffdf2", { sw: 1.5 });
  else if (o.hat === "crown") s += shp([[-6, -41], [-6, -47], [-3, -43.5], [0, -48], [3, -43.5], [6, -47], [6, -41]], "#f2b705", { sw: 1.5 });
  else { // Haare
    if (hs2 === 1) s += shp([[-7.4, -33], [-7, -41.4], [0, -43.4], [7, -41.4], [7.4, -33], [8.4, -26], [4.4, -31], [-4.4, -31], [-8.4, -26]], hair, { sw: 1.6 });
    else if (hs2 === 2) s += shp([[-7.4, -35], [-6.5, -41.6], [0, -43], [6.5, -41.6], [7.4, -35], [3, -38.8], [-3, -38.8]], hair, { sw: 1.6 }) + circ(0, -44, 2.6, hair, { sw: 1.4 });
    else s += shp([[-7.2, -35], [-6.4, -41.6], [0, -42.6], [6.4, -41.6], [7.2, -35], [3.4, -39], [-3.4, -39]], hair, { sw: 1.6 });
  }
  s += circ(-2.4, -35.8, 1, INK, { nostroke: 1 }) + circ(2.4, -35.8, 1, INK, { nostroke: 1 });
  s += ink("M-2 -32.6Q0 -31 2 -32.6", 1.2);
  if (o.glasses) s += circ(-2.5, -35.8, 2.3, "rgba(190,230,255,.5)", { sw: 1 }) + circ(2.5, -35.8, 2.3, "rgba(190,230,255,.5)", { sw: 1 });
  if (o.basket) s += rect(5, -18, 10, 7, "#d89a4a", { sw: 1.4 }) + hatch(5, -18, 10, 7, 3, INK, 0.8, 0.5) + ink("M5.6 -18Q10 -24 14.4 -18", 1.4);
  if (o.vip) s += star(-9, -44, 4, "#f2b705", { sw: 1.2 }) + star(9, -40, 3, "#fffdf2", { sw: 1 });
  return s;
}
// Draufsicht-Figur (auf Parkplatz)
function pedTop(shirt, skin, hair) { return '<g transform="scale(1.5)">' + ell(0, 0, 5, 3.2, shirt, { sw: 1.4 }) + circ(0, -0.5, 2.9, skin, { sw: 1.2 }) + ell(0, -1.4, 2.9, 1.8, hair, { nostroke: 1 }) + "</g>"; }
// Auto in Draufsicht (Front oben), Länge ~30
function carTop(col, kind) {
  const L = kind === "limo" ? 44 : kind === "van" ? 33 : kind === "taxi" ? 30 : 29, W = kind === "van" ? 17 : 15.5, h = L / 2;
  let s = sh(1.5, 1.5, W / 2 + 2, h + 0.5);
  s += rect(-W / 2 - 1.2, -h + 4, 2.4, 6, "#2a2a3a", { sw: 1.1 }) + rect(W / 2 - 1.2, -h + 4, 2.4, 6, "#2a2a3a", { sw: 1.1 }) + rect(-W / 2 - 1.2, h - 10, 2.4, 6, "#2a2a3a", { sw: 1.1 }) + rect(W / 2 - 1.2, h - 10, 2.4, 6, "#2a2a3a", { sw: 1.1 });
  s += shp([[-W / 2 + 2, -h], [W / 2 - 2, -h], [W / 2, -h + 4], [W / 2, h - 3], [W / 2 - 2, h], [-W / 2 + 2, h], [-W / 2, h - 3], [-W / 2, -h + 4]], col, { sw: 1.9 });
  s += shp([[-W / 2 + 2.6, -h + 8], [W / 2 - 2.6, -h + 8], [W / 2 - 3.6, -h + 14], [-W / 2 + 3.6, -h + 14]], "#bfe6ff", { sw: 1.2 });
  s += shp([[-W / 2 + 3, h - 11], [W / 2 - 3, h - 11], [W / 2 - 2.2, h - 7], [-W / 2 + 2.2, h - 7]], "#9ccbe8", { sw: 1.2 });
  s += rect(-W / 2 + 3.2, -h + 14.6, W - 6.4, (kind === "limo" ? 18 : kind === "van" ? 11 : 4.6), lt(col, .25), { sw: 1.2 });
  s += rect(-W / 2 + 1.6, -h + 0.6, 3, 2, "#fff6b0", { sw: 0.9 }) + rect(W / 2 - 4.6, -h + 0.6, 3, 2, "#fff6b0", { sw: 0.9 });
  if (kind === "taxi") s += rect(-2.6, -2, 5.2, 3.2, "#f2f2f2", { sw: 1 });
  return s;
}
// Fahrrad (Draufsicht, für Kiosk/Dorf)
function bikeTop(col) { return sh(1, 1, 3, 11) + line(0, -10, 0, 10, 2, "#4a4a5a") + circ(0, -8, 3, "none", { sw: 1.3 }) + circ(0, 8, 3, "none", { sw: 1.3 }) + line(-5, -6, 5, -6, 1.8, col) + rect(-2, -2, 4, 6, col, { sw: 1.2 }); }
