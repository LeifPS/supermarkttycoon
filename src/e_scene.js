"use strict";
// Seitenschnitt durch den Supermarkt (handgezeichnetes SVG): Laden mit Abteilungen nebeneinander,
// darunter der Parkplatz in Draufsicht (senkrechte Buchten). Jeder Standort sieht anders aus.
const R = { t: 0, vis: [], coins: [], pops: [], amb: [], spawn: 0, vipT: 20, sig: "", G: null, ids: 0, nodes: {} };
const NS = "http://www.w3.org/2000/svg";
const CEIL = 210, FB = 340, FF = 378, SIDE = 410, PAD = 70, EW = 100, DW = 150, XW = 100;
const SCALE_MIN = 0.9, TOPPAD = 170;
let world, svg, dyn, SCL = 1.25;
const CAR_COLS = ["#e0303c", "#3a9ae0", "#f2b705", "#4fa84a", "#a83ad0", "#f2f2f2", "#e89a3a", "#6a7aa8", "#2f9a9a", "#c46a8a"];

// ---------- Layout ----------
function geom() {
  const li = S.loc, loc = LOCS[li];
  const ids = DEPTS.filter(d => S.dept[d.id]).map(d => d.id);
  const ghost = DEPTS.find(d => !S.dept[d.id]);
  const kn = S.kasse.n, kmax = loc.maxKasse;
  const G = { li, loc, ids, ghost: ghost ? ghost.id : null, kn, kmax };
  G.bx = PAD; G.ex = G.bx; G.dx = G.bx + EW;
  G.nd = ids.length + (G.ghost ? 1 : 0);
  G.kx = G.dx + G.nd * DW; G.kw = 30 + kmax * 46;
  G.xx = G.kx + G.kw; G.bw = EW + G.nd * DW + G.kw + XW;
  G.W = Math.max(G.bx + G.bw + PAD, 700);
  G.doorX = G.bx + EW / 2 + 4; G.exitX = G.xx + XW / 2;
  G.cols = Math.max(4, Math.floor((G.W - 2 * PAD - 30) / 26));
  G.spots = C ? C.spots : 6; G.rows = Math.max(1, Math.ceil(G.spots / G.cols));
  G.lotX0 = PAD + 20;
  G.lane = r => SIDE + 22 + r * 74;
  G.lotEnd = SIDE + 14 + G.rows * 74 + 6;
  G.roadY = G.lotEnd + 6;
  G.H = G.roadY + 96 + 320;
  G.bay = i => { const r = Math.floor(i / G.cols), c = i % G.cols; return { r, c, x: G.lotX0 + c * 26 + 13, y: G.lane(r) + 13 + 24, lane: G.lane(r), bx: G.lotX0 + c * 26 }; };
  G.cellX = id => { const i = G.ids.indexOf(id); return G.dx + i * DW; };
  return G;
}

// ---------- Himmel, Horizont ----------
const SKY = [["#bfe6ff", "#eaf7ff"], ["#cfe8ff", "#fff3d6"], ["#b8dcff", "#e8f4ff"], ["#9ec4ec", "#dcecf8"], ["#0f1636", "#3a3f78"]];
function backdrop(G) {
  const li = G.li, W = G.W; let s = "";
  s += '<rect x="0" y="' + (-TOPPAD) + '" width="' + W + '" height="' + (G.H + TOPPAD) + '" fill="url(#sky' + li + ')"/>';
  if (li === 4) { for (let i = 0; i < 60; i++) s += '<circle cx="' + hs(i, 1, 9) * W + '" cy="' + hs(i, 2, 9) * 190 + '" r="' + (0.6 + hs(i, 3, 9) * 1.4) + '" fill="#fffdf2" opacity="' + (0.4 + hs(i, 4, 9) * 0.6) + '" class="tw" style="animation-delay:' + (hs(i, 5, 9) * 3) + 's"/>'; s += circ(W - 140, 70, 24, "#fff6c8", { sw: 2 }) + circ(W - 132, 64, 22, "#0f1636", { nostroke: 1 }); }
  else { s += '<g class="sun">' + circ(150, 74, 22, li === 1 ? "#ffd070" : "#ffe680", { sw: 2.4 }); for (let i = 0; i < 10; i++) { const a = i * .628; s += line(150 + Math.cos(a) * 29, 74 + Math.sin(a) * 29, 150 + Math.cos(a) * 38, 74 + Math.sin(a) * 38, 2.2, "#e8a020", { one: 1 }); } s += "</g>"; }
  if (li < 4) for (let i = 0; i < Math.ceil(W / 380); i++) s += '<g class="cl" style="animation-duration:' + (70 + i * 13) + "s;animation-delay:-" + (i * 31) + 's">' + cloud(80 + i * 380 + hs(i, 1, 1) * 120, 56 + hs(i, 2, 1) * 50, 1.1 + hs(i, 3, 1) * 0.5) + "</g>";
  const gy = 330;
  // ferne Hügel / Skyline
  if (li === 0) { for (let i = 0; i < W / 220 + 1; i++) s += shp([[i * 220 - 40, gy], [i * 220 + 50, gy - 70 - hs(i, 1, 2) * 30], [i * 220 + 150, gy - 40], [i * 220 + 240, gy]], i % 2 ? "#a8d088" : "#b8dc98", { sw: 2 }); for (let i = 0; i < W / 90; i++) s += tree(30 + i * 90 + hs(i, 1, 4) * 40, gy + 4, 0.8 + hs(i, 2, 4) * 0.5, "#5fa055", i % 3 ? "" : "pine"); }
  if (li === 1) { for (let i = 0; i < W / 260 + 1; i++) s += shp([[i * 260 - 40, gy], [i * 260 + 70, gy - 60 - hs(i, 1, 2) * 26], [i * 260 + 190, gy - 24], [i * 260 + 300, gy]], i % 2 ? "#b8d890" : "#a8cc84", { sw: 2 }); // Kirche
    const cx = W - 160; s += rect(cx - 16, gy - 110, 32, 110, "#f0e0c0", { sw: 2.2 }) + shp([[cx - 20, gy - 110], [cx, gy - 160], [cx + 20, gy - 110]], "#c0392b", { sw: 2.2 }) + ell(cx, gy - 88, 8, 8, "#fffdf2", { sw: 1.8 }) + line(cx, gy - 88, cx, gy - 93, 1.6) + line(cx, gy - 88, cx + 4, gy - 88, 1.6) + line(cx, gy - 160, cx, gy - 172, 2) + line(cx - 4, gy - 167, cx + 4, gy - 167, 2) + shp([[cx - 6, gy], [cx - 6, gy - 22], [cx + 6, gy - 22], [cx + 6, gy]], "#6a4a2a", { sw: 1.6 });
    for (let i = 0; i < W / 150; i++) { const hx = 40 + i * 150 + hs(i, 3, 3) * 40; if (Math.abs(hx - cx) < 70) continue; s += rect(hx, gy - 36, 44, 36, "#f6e6c4", { sw: 1.8 }) + shp([[hx - 5, gy - 36], [hx + 22, gy - 62], [hx + 49, gy - 36]], "#b8473a", { sw: 1.8 }) + rect(hx + 16, gy - 20, 10, 20, "#8a5a3a", { sw: 1.3 }); } }
  if (li === 2) { for (let i = 0; i < W / 240 + 1; i++) s += shp([[i * 240 - 40, gy], [i * 240 + 80, gy - 44], [i * 240 + 200, gy - 18], [i * 240 + 290, gy]], i % 2 ? "#b8d890" : "#a8cc84", { sw: 2 });
    for (let i = 0; i < W / 120; i++) { const hx = 20 + i * 120 + hs(i, 3, 3) * 30, c = ["#e8c8a0", "#f0d8d0", "#d0e0c8", "#f2e0a0"][i % 4]; s += rect(hx, gy - 40, 56, 40, c, { sw: 1.8 }) + shp([[hx - 5, gy - 40], [hx + 28, gy - 66], [hx + 61, gy - 40]], ["#6a7aa8", "#a85a4a", "#5a8a6a"][i % 3], { sw: 1.8 }) + rect(hx + 8, gy - 30, 12, 12, "#bfe6ff", { sw: 1.3 }) + rect(hx + 34, gy - 30, 12, 12, "#bfe6ff", { sw: 1.3 }); s += tree(hx + 66, gy + 2, 0.9, "#5fa055"); } }
  if (li === 3) { for (let i = 0; i < W / 70; i++) { const h = 70 + hs(i, 1, 5) * 150, x = i * 70 - 10, c = ["#a8b8d0", "#98a8c4", "#b8c8dc", "#8a9ab8"][i % 4]; s += rect(x, gy - h, 56, h, c, { sw: 2 }) + hatch(x, gy - h, 56, h, 6, INK, 1, 0.12); for (let r = 0; r < h / 16; r++) for (let q = 0; q < 3; q++) if (hs(i, r * 3 + q, 6) > 0.35) s += rect(x + 7 + q * 16, gy - h + 8 + r * 16, 8, 8, hs(i, r, q) > 0.6 ? "#ffe680" : "#dff2ff", { sw: 0.8 }); } }
  if (li === 4) { for (let i = 0; i < W / 62; i++) { const h = 90 + hs(i, 1, 5) * 190, x = i * 62 - 6, c = ["#2a3a6a", "#222f58", "#33437a"][i % 3]; s += rect(x, gy - h, 50, h, c, { sw: 2 }); for (let r = 0; r < h / 14; r++) for (let q = 0; q < 3; q++) if (hs(i, r * 3 + q, 6) > 0.4) s += rect(x + 6 + q * 14, gy - h + 7 + r * 14, 7, 7, hs(i, r, q) > 0.5 ? "#ffe680" : "#8aa0d0", { sw: 0 , nostroke: 1}); if (i % 5 === 0) s += line(x + 25, gy - h, x + 25, gy - h - 22, 2, "#9ab") + circ(x + 25, gy - h - 24, 2.4, "#e0303c", { nostroke: 1, sw: 0 }); }
    s += '<g class="beam" style="transform-origin:200px 330px">' + shp([[196, 330], [204, 330], [300, 20], [120, 20]], "rgba(255,246,200,.14)", { nostroke: 1 }) + "</g><g class='beam2' style='transform-origin:" + (W - 260) + "px 330px'>" + shp([[W - 264, 330], [W - 256, 330], [W - 150, 20], [W - 380, 20]], "rgba(200,230,255,.12)", { nostroke: 1 }) + "</g>"; }
  // Boden hinter dem Haus
  const gc = [["#cfe3a0", "#bcd78c"], ["#d9e8a8", "#c6dc94"], ["#c8dfa0", "#b7d28c"], ["#a8b4c4", "#98a4b6"], ["#232c50", "#1c2444"]][li];
  s += '<rect x="0" y="' + gy + '" width="' + W + '" height="' + (G.H - gy) + '" fill="' + gc[0] + '"/>';
  for (let i = 0; i < W / 14; i++) { const x = hs(i, 1, 8) * W, y = gy + 4 + hs(i, 2, 8) * 36; s += ink("M" + x + " " + y + "l-2 -4M" + x + " " + y + "l2 -4", 1.4, gc[1]); }
  return s;
}

// ---------- Abteilung: Rückwand, Regale, Möbel ----------
const WALLS = {
  obst: ["#fff2dc", "#c24fb0", "wood"], gemuese: ["#f0f8dc", "#4fa84a", "wood"], back: ["#f6dcc0", "#e89a3a", "brick"], kuehl: ["#eaf6ff", "#3a9ae0", "tile"],
  tk: ["#dce8ff", "#4a6ae0", "frost"], fleisch: ["#fff0ec", "#c8443a", "tile2"], fein: ["#7a3a58", "#8a4ac8", "dark"], elektro: ["#3a4a62", "#2f9a9a", "dark"],
};
function deptCell(G, id, x) {
  const d = DEPT_BY[id], dd = S.dept[id], W = WALLS[id], w = DW; let s = "";
  const tier = itemTier(id, dd.lvl), ms = msCount(dd.lvl);
  s += rect(x, CEIL, w, FB - CEIL, W[0], { sw: 0, nostroke: 1 });
  const dark = W[2] === "dark";
  // Wandmuster
  if (W[2] === "brick") { for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) s += rect(x + c * 25 + (r % 2) * 12 - 6, CEIL + r * 16, 25, 16, "none", { sw: 0.9, st: "#a8643a", op: .8 }); }
  else if (W[2] === "tile" || W[2] === "tile2") { for (let r = 0; r < 9; r++) s += line(x, CEIL + r * 15, x + w, CEIL + r * 15, 0.8, "#a8c0d8", { one: 1 }); for (let c = 1; c < 8; c++) s += line(x + c * 19, CEIL, x + c * 19, FB, 0.8, "#a8c0d8", { one: 1 }); }
  else if (W[2] === "wood") { for (let c = 0; c < 10; c++) s += line(x + c * 15 + 4, CEIL, x + c * 15 + 4, FB, 1, "#d8c090", { one: 1 }); }
  else if (W[2] === "frost") { s += hatch(x, CEIL, w, FB - CEIL, 8, "#7a9ae0", 1, .3); }
  else if (dark) { s += hatch(x, CEIL, w, FB - CEIL, 7, "#000", 1, .18); }
  // Möbel je Abteilung
  const plank = dark ? "#5a2a40" : id === "obst" || id === "gemuese" ? "#b8803a" : W[2] === "tile" ? "#dfe8f0" : W[2] === "frost" ? "#cfe0ff" : "#c8a070";
  const rows = [258, 292, 326];
  const plankMs = ms >= 5 ? "#f2b705" : ms >= 2 ? lt(plank, .25) : plank;
  if (id === "obst" || id === "gemuese") { // Marktstand: Markise und Holzregal
    for (let i = 0; i < 6; i++) s += shp([[x + i * 25, CEIL + 2], [x + i * 25 + 25, CEIL + 2], [x + i * 25 + 28, CEIL + 24], [x + i * 25 + 3, CEIL + 24]], i % 2 ? "#fffdf2" : W[1], { sw: 1.5 });
    s += ink("M" + x + " " + (CEIL + 24) + "Q" + (x + 12) + " " + (CEIL + 32) + " " + (x + 25) + " " + (CEIL + 24) + "Q" + (x + 37) + " " + (CEIL + 32) + " " + (x + 50) + " " + (CEIL + 24) + "Q" + (x + 62) + " " + (CEIL + 32) + " " + (x + 75) + " " + (CEIL + 24) + "Q" + (x + 87) + " " + (CEIL + 32) + " " + (x + 100) + " " + (CEIL + 24) + "Q" + (x + 112) + " " + (CEIL + 32) + " " + (x + 125) + " " + (CEIL + 24) + "Q" + (x + 137) + " " + (CEIL + 32) + " " + (x + 150) + " " + (CEIL + 24), 2);
  }
  if (id === "back") { // Steinofen mit Feuer
    s += shp([[x + 96, FB], [x + 96, FB - 54], [x + 112, FB - 70], [x + 140, FB - 54], [x + 140, FB]], "#8a5a3a", { sw: 2 }) + shp([[x + 104, FB], [x + 104, FB - 36], [x + 118, FB - 46], [x + 132, FB - 36], [x + 132, FB]], "#2a1a12", { sw: 1.6 }) + '<g class="fire">' + shp([[x + 110, FB], [x + 114, FB - 18], [x + 118, FB - 10], [x + 122, FB - 24], [x + 126, FB]], "#f28a1a", { sw: 1.2 }) + shp([[x + 114, FB], [x + 118, FB - 12], [x + 122, FB]], "#ffd34a", { sw: 1 }) + "</g>";
  }
  if (id === "kuehl" || id === "tk") { // Kühlschranktüren / Truhe
    for (let c = 0; c < 3; c++) s += rect(x + 8 + c * 45, 236, 42, FB - 236, id === "tk" ? "rgba(190,215,255,.55)" : "rgba(190,230,255,.45)", { sw: 2 }) + line(x + 12 + c * 45, 240, x + 12 + c * 45, 270, 3, "rgba(255,255,255,.8)", { one: 1 }) + circ(x + 44 + c * 45, 290, 2.4, "#8a95a8", { sw: 1 });
    s += rect(x + 4, 232, w - 8, 6, "#9ab8d8", { sw: 1.6 }) + '<g class="blink">' + rect(x + 10, 233.4, 130, 2.6, "#fffdf2", { nostroke: 1 }) + "</g>";
  }
  if (id === "fleisch") { // Haken mit Würsten, Theke
    s += line(x + 6, CEIL + 24, x + w - 6, CEIL + 24, 3, "#8a95a8");
    for (let c = 0; c < 6; c++) { const hx = x + 14 + c * 24; s += line(hx, CEIL + 24, hx, CEIL + 38, 1.4); s += c % 2 ? ell(hx, CEIL + 52, 5, 14, "#c8443a", { sw: 1.6 }) : ink("M" + hx + " " + (CEIL + 38) + "q-5 6 0 12 q5 6 0 12 q-5 6 0 12", 5.5, "#e8786a") + ink("M" + hx + " " + (CEIL + 38) + "q-5 6 0 12 q5 6 0 12 q-5 6 0 12", 1.2); }
  }
  if (id === "fein") { // Kronleuchter, Weinregal
    s += line(x + 75, CEIL, x + 75, CEIL + 16, 1.6, "#f2b705") + shp([[x + 52, CEIL + 16], [x + 98, CEIL + 16], [x + 88, CEIL + 30], [x + 62, CEIL + 30]], "#f2b705", { sw: 1.8 }) + '<g class="blink">' + circ(x + 58, CEIL + 33, 3, "#fff6b0", { sw: 0.8 }) + circ(x + 75, CEIL + 35, 3, "#fff6b0", { sw: 0.8 }) + circ(x + 92, CEIL + 33, 3, "#fff6b0", { sw: 0.8 }) + "</g>";
    s += rect(x + 6, CEIL + 4, 30, 40, "#3a1a2a", { sw: 1.6 }) + rect(x + 114, CEIL + 4, 30, 40, "#3a1a2a", { sw: 1.6 }) + star(x + 21, CEIL + 24, 8, "#f2b705", { sw: 1 }) + star(x + 129, CEIL + 24, 8, "#f2b705", { sw: 1 });
  }
  if (id === "elektro") { // Fernseherwand
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) s += rect(x + 8 + c * 34, 222 + r * 24, 30, 20, "#1a1f2a", { sw: 1.6 }) + '<g class="tv" style="animation-delay:' + ((r * 4 + c) * 0.37) + 's">' + rect(x + 10 + c * 34, 224 + r * 24, 26, 16, ["#8ae0ff", "#ff8ad0", "#8aff9a", "#ffe680"][(r + c) % 4], { nostroke: 1 }) + "</g>";
  }
  // Regalbretter + Waren (Menge und Güte wachsen mit der Stufe)
  const topY = id === "fleisch" ? 302 : id === "kuehl" || id === "tk" ? 262 : 258;
  const planks = id === "fleisch" ? [326] : id === "kuehl" || id === "tk" ? [258, 290, 322] : rows;
  planks.forEach((py, ri) => {
    s += rect(x + 6, py, w - 12, 5, plankMs, { sw: 1.7 }) + line(x + 10, py + 5, x + 10, py + 30, 1.6, "#8a6a4a", { one: 1 }) + line(x + w - 10, py + 5, x + w - 10, py + 30, 1.6, "#8a6a4a", { one: 1 });
    const t = Math.max(0, tier - ri), n = Math.min(5, 3 + Math.min(2, Math.floor(ms / 3) + (ri === 0 ? 1 : 0)));
    for (let k = 0; k < n; k++) s += ITEMS[id][t](x + 24 + k * (w - 48) / Math.max(1, n - 1), py, id === "obst" ? 1.05 : 1);
  });
  // Schild (wird mit den Meilensteinen schöner)
  s += line(x + 38, CEIL, x + 44, 226, 1.5) + line(x + w - 38, CEIL, x + w - 44, 226, 1.5);
  const tw = Math.max(84, d.name.length * 9.6 + 22);
  if (ms >= 3) {
    s += rect(x + w / 2 - tw / 2 - 3, 212, tw + 6, 28, W[1], { sw: 2.4 }) + rect(x + w / 2 - tw / 2 + 1, 216, tw - 2, 20, "#fffdf2", { sw: 1.2 }) + txt(x + w / 2, 232, d.name.toUpperCase(), 18, W[1]);
    s += star(x + w / 2 - tw / 2 - 9, 226, 7, "#f2b705", { sw: 1.3 });
    if (ms >= 6) s += star(x + w / 2 + tw / 2 + 9, 226, 7, "#f2b705", { sw: 1.3 });
    if (ms >= 10) s += shp([[x + w / 2 - 12, 212], [x + w / 2 - 12, 202], [x + w / 2 - 6, 207], [x + w / 2, 199], [x + w / 2 + 6, 207], [x + w / 2 + 12, 202], [x + w / 2 + 12, 212]], "#f2b705", { sw: 1.5 });
  } else s += rect(x + w / 2 - tw / 2, 214, tw, 24, "#fffdf2", { sw: 2.2 }) + rect(x + w / 2 - tw / 2 + 3, 217, tw - 6, 18, "none", { sw: 1, st: W[1] }) + txt(x + w / 2, 232, d.name.toUpperCase(), 18, W[1]);
  // Meilenstein-Ausbau: jede Stufe bringt etwas Neues
  if (ms >= 1) { s += rect(x + 7, FB - 14, 12, 14, "#b8683a", { sw: 1.5 }) + circ(x + 13, FB - 20, 8, "#4fa84a", { sw: 1.6 }) + circ(x + 8, FB - 24, 5, "#5fc060", { sw: 1.2 }) + circ(x + 18, FB - 25, 5, "#3a9a4a", { sw: 1.2 });
    planks.forEach(py => { for (let k = 0; k < 4; k++) s += rect(x + 22 + k * 28, py + 6, 11, 7, "#fffdf2", { sw: 0.9 }) + line(x + 24 + k * 28, py + 9.5, x + 31 + k * 28, py + 9.5, 0.9, "#e0303c", { one: 1 }); }); }
  if (ms >= 2) [x + 34, x + w - 34].forEach(lx => { s += line(lx, CEIL, lx, CEIL + 22, 1.4) + shp([[lx - 8, CEIL + 30], [lx + 8, CEIL + 30], [lx + 4, CEIL + 20], [lx - 4, CEIL + 20]], "#f6d84a", { sw: 1.6 }) + '<g class="blink">' + circ(lx, CEIL + 32, 3, "#fff6b0", { nostroke: 1 }) + "</g>"; });
  if (ms >= 4) { for (let k = 0; k < 8; k++) s += shp([[x + 8 + k * 17, CEIL + 3], [x + 22 + k * 17, CEIL + 3], [x + 15 + k * 17, CEIL + 14]], [W[1], "#f2b705", "#e0303c", "#3a9ae0"][k % 4], { sw: 1.1 }); s += ink("M" + (x + 8) + " " + (CEIL + 3) + "L" + (x + w - 8) + " " + (CEIL + 3), 1.4); }
  if (ms >= 5) s += rect(x + 22, FF - 20, w - 44, 14, W[1], { sw: 1.8, op: .85 }) + hatch(x + 22, FF - 20, w - 44, 14, 5, "#fff", 1, .45) + line(x + 30, FF - 13, x + w - 30, FF - 13, 1.2, "#f2b705", { one: 1 });
  if (ms >= 6) s += rect(x + w - 30, FB - 12, 24, 12, "#b8803a", { sw: 1.6 }) + rect(x + w - 26, FB - 22, 16, 11, "#c8903a", { sw: 1.6 }) + ITEMS[id][tier](x + w - 18, FB - 22, .8);
  if (ms >= 7) for (let k = 0; k < 6; k++) s += '<g class="tw" style="animation-delay:' + (k * .4) + 's">' + star(x + 14 + hs(k, 3, 3) * (w - 28), CEIL + 40 + hs(k, 4, 4) * 90, 4, "#fff6b0", { sw: 0.8 }) + "</g>";
  if (ms >= 8) s += rect(x - 3, CEIL, 6, FB - CEIL, "#f2b705", { sw: 1.8 });
  if (ms >= 12) s += '<g class="beam" style="transform-origin:' + (x + w / 2) + 'px ' + CEIL + 'px">' + shp([[x + w / 2 - 3, CEIL], [x + w / 2 + 3, CEIL], [x + w / 2 + 30, FB], [x + w / 2 - 30, FB]], "rgba(255,246,200,.28)", { nostroke: 1 }) + "</g>";
  // Pfeiler
  if (ms < 8) s += rect(x - 3, CEIL, 6, FB - CEIL, "#e8dcc0", { sw: 1.8 });
  return s;
}
function ghostCell(G, x, id) {
  const d = DEPT_BY[id], nm = LOCS[d.loc].name;
  let s = rect(x, CEIL, DW, FB - CEIL, "#ddd2b8", { sw: 0, nostroke: 1 }) + hatch(x, CEIL, DW, FB - CEIL, 9, INK, 1, .12);
  // Baustelle
  s += rect(x + 12, 262, DW - 24, 12, "#f2b705", { sw: 2 });
  for (let i = 0; i < 6; i++) s += shp([[x + 14 + i * 21, 262], [x + 24 + i * 21, 262], [x + 18 + i * 21, 274], [x + 8 + i * 21, 274]], INK, { nostroke: 1 });
  s += rect(x + 30, 300, 90, 40, "#fffdf2", { sw: 2.2 }) + line(x + 42, 340, x + 42, 366, 2.4) + line(x + 108, 340, x + 108, 366, 2.4) + txt(x + 75, 318, "Bald:", 15, "#7a6a40") + txt(x + 75, 335, d.name, 17, d.col);
  s += txt(x + 75, 250, "Ab " + nm, 14, "#7a6a40");
  s += shp([[x + 60, 372], [x + 90, 372], [x + 84, 350], [x + 66, 350]], "#e8803a", { sw: 1.8 }) + rect(x + 62, 358, 26, 4, "#fffdf2", { nostroke: 1 });
  s += rect(x - 3, CEIL, 6, FB - CEIL, "#e8dcc0", { sw: 1.8 });
  return s;
}

// ---------- Kassen, Eingang, Ausgang ----------
function kasseZone(G) {
  let s = rect(G.kx, CEIL, G.kw, FB - CEIL, ["#fff2dc", "#fffdf2", "#f6efe6", "#eaf4ff", "#fff3d0"][G.li], { sw: 0, nostroke: 1 });
  s += rect(G.kx + G.kw / 2 - 40, 216, 80, 22, "#3a7ae0", { sw: 2.2 }) + txt(G.kx + G.kw / 2, 233, "KASSEN", 18, "#fff");
  s += line(G.kx + G.kw / 2 - 30, CEIL, G.kx + G.kw / 2 - 30, 216, 1.5) + line(G.kx + G.kw / 2 + 30, CEIL, G.kx + G.kw / 2 + 30, 216, 1.5);
  return s;
}
function kasseFore(G) {
  let s = "";
  for (let i = 0; i < G.kmax; i++) {
    const x = G.kx + 30 + i * 46, own = i < G.kn;
    if (own) {
      s += rect(x - 18, 340, 36, 24, "#8a95a8", { sw: 2 }) + hatch(x - 18, 340, 36, 24, 5, INK, 1, .18) + rect(x - 20, 334, 40, 8, "#cfd6e0", { sw: 1.8 }) + rect(x - 14, 324, 14, 10, "#2a3a5a", { sw: 1.5 }) + rect(x - 12, 326, 10, 5, "#8ae0ff", { nostroke: 1 }) + rect(x + 2, 330, 14, 4, "#3a4a60", { sw: 1.2 });
    } else {
      s += '<g data-a="open:verw">' + rect(x - 18, 338, 36, 30, "rgba(255,253,242,.55)", { sw: 1.6, st: "#8a7a5a" }) + txt(x, 360, "+", 26, "#8a7a5a") + "</g>";
    }
  }
  return s;
}
function entrance(G) {
  const x = G.bx; let s = rect(x, CEIL, EW, FB - CEIL, ["#fff2dc", "#fffdf2", "#f6efe6", "#eaf4ff", "#fff3d0"][G.li], { sw: 0, nostroke: 1 });
  s += rect(x + 20, 250, 64, 90, "rgba(190,230,255,.6)", { sw: 2.4 }) + line(x + 52, 250, x + 52, 340, 2) + line(x + 26, 262, x + 36, 252, 2, "rgba(255,255,255,.9)", { one: 1 }) + line(x + 56, 292, x + 70, 276, 2, "rgba(255,255,255,.9)", { one: 1 });
  s += rect(x + 24, 218, 56, 22, "#3fb04a", { sw: 2 }) + txt(x + 52, 234, "EINGANG", 16, "#fff");
  // Einkaufswagen
  for (let i = 0; i < 3; i++) s += shp([[x + 4 + i * 4, 322 - i * 2], [x + 22 + i * 4, 322 - i * 2], [x + 19 + i * 4, 338 - i * 2], [x + 6 + i * 4, 338 - i * 2]], "#cfd6e0", { sw: 1.3 }) + circ(x + 9 + i * 4, 341 - i * 2, 2, INK, { nostroke: 1 });
  return s;
}
function exitZone(G) {
  const x = G.xx; let s = rect(x, CEIL, XW, FB - CEIL, ["#fff2dc", "#fffdf2", "#f6efe6", "#eaf4ff", "#fff3d0"][G.li], { sw: 0, nostroke: 1 });
  s += rect(x + 18, 250, 64, 90, "rgba(190,230,255,.6)", { sw: 2.4 }) + line(x + 50, 250, x + 50, 340, 2) + line(x + 24, 262, x + 34, 252, 2, "rgba(255,255,255,.9)", { one: 1 });
  s += rect(x + 22, 218, 56, 22, "#e0303c", { sw: 2 }) + txt(x + 50, 234, "AUSGANG", 16, "#fff");
  return s;
}

// ---------- Gebäudehülle je Standort ----------
function shell(G) {
  const li = G.li, L = G.bx - 10, Rr = G.bx + G.bw + 10, w = Rr - L; let s = "";
  const wallC = LOCS[li].wall;
  // Decke + Boden
  s += rect(L + 8, CEIL - 14, w - 16, 14, ["#e8d8b0", "#e8d4a8", "#d8dce4", "#dfe8f2", "#2a2f4a"][li], { sw: 2 });
  for (let i = 0; i < w / 60; i++) s += rect(L + 40 + i * 60, CEIL - 6, 26, 5, "#fff6b0", { sw: 1.2 }) + '<g class="blink">' + rect(L + 42 + i * 60, CEIL - 5, 22, 2, "#fffdf2", { nostroke: 1 }) + "</g>";
  const fl = [LOCS[li].floor, LOCS[li].floor2];
  s += rect(L + 8, FB, w - 16, FF - FB, fl[0], { sw: 1.6 });
  for (let i = 0; i < (w - 16) / 24; i++) s += (i % 2 ? rect(L + 8 + i * 24, FB, 24, FF - FB, fl[1], { sw: 0, nostroke: 1 }) : "");
  s += line(L + 8, FB, Rr - 8, FB, 2.2);
  // Fundament vorne mit Türöffnungen
  const plinth = ["#a8784a", "#b89878", "#a8a8b0", "#8a98b0", "#c8a030"][li];
  const gaps = [[G.bx + 20, G.bx + 84], [G.xx + 18, G.xx + 82]];
  let px = L + 4;
  gaps.forEach(g => { s += rect(px, FF, g[0] - px, 16, plinth, { sw: 2 }) + hatch(px, FF, g[0] - px, 16, 6, INK, 1, .2); px = g[1]; });
  s += rect(px, FF, Rr + 6 - px, 16, plinth, { sw: 2 }) + hatch(px, FF, Rr + 6 - px, 16, 6, INK, 1, .2);
  gaps.forEach((g, i) => { s += rect(g[0] + 4, FF + 3, g[1] - g[0] - 8, 10, i ? "#e0303c" : "#3fb04a", { sw: 1.5, op: .9 }); });
  // Seitenwände
  const sideW = (x, flip) => {
    const c = [wallC, wallC, "#c8ccd4", "#9ec4e8", "#1d2742"][li];
    let o = rect(x, li >= 3 ? 40 : CEIL - 40, 20, li >= 3 ? FF - 40 : FF - CEIL + 40, c, { sw: 2.4 });
    if (li === 0) for (let i = 0; i < 10; i++) o += line(x, CEIL - 30 + i * 18, x + 20, CEIL - 30 + i * 18, 1.2, "#7a4a2a", { one: 1 });
    if (li === 1) o += hatch(x, CEIL - 40, 20, FF - CEIL + 40, 7, "#6a3a1a", 1.4, .5);
    if (li === 3) o += hatch(x, 40, 20, FF - 40, 8, "#fff", 2, .5);
    if (li === 4) { o += rect(x + 4, 40, 12, FF - 40, "#f2b705", { sw: 1.6 }) + hatch(x + 4, 40, 12, FF - 40, 5, "#fff", 1, .45); }
    return o;
  };
  s += sideW(L, 0) + sideW(Rr - 20, 1);
  return s;
}
function roofAndSign(G) {
  const li = G.li, L = G.bx - 22, Rr = G.bx + G.bw + 22, w = Rr - L, cx = G.bx + Math.min(G.bw / 2, 170); let s = "";
  const sg = LOCS[li].sign;
  if (li === 0) { // Kiosk: Markise + Holzschild
    const n = Math.round(w / 34);
    for (let i = 0; i < n; i++) s += shp([[L + i * w / n, 176], [L + (i + 1) * w / n, 176], [L + (i + 1) * w / n + 5, 214], [L + i * w / n + 5, 214]], i % 2 ? "#fffdf2" : "#e0303c", { sw: 1.8 });
    for (let i = 0; i < n; i++) s += ink("M" + (L + i * w / n + 5) + " 214Q" + (L + (i + .5) * w / n + 5) + " 224 " + (L + (i + 1) * w / n + 5) + " 214", 2, INK, i % 2 ? "#fffdf2" : "#e0303c");
    s += rect(L - 6, 168, w + 12, 12, "#8a5a3a", { sw: 2.2 }) + hatch(L - 6, 168, w + 12, 12, 6, INK, 1, .25);
    s += line(cx - 80, 170, cx - 80, 130, 3, "#6a4a2a") + line(cx + 80, 170, cx + 80, 130, 3, "#6a4a2a") + rect(cx - 100, 98, 200, 38, "#c98a5a", { sw: 2.6 }) + hatch(cx - 100, 98, 200, 38, 7, "#6a3a1a", 1, .3) + txt(cx, 128, sg, 34, "#fffdf2", "middle", { stroke: INK, sw: 4 });
  }
  if (li === 1) { // Dorfladen: Ziegeldach, Fachwerk, Schornstein
    s += shp([[L - 6, 216], [Rr + 6, 216], [Rr - 50, 128], [L + 50, 128]], "#c0392b", { sw: 2.6 });
    for (let r = 0; r < 6; r++) { const y = 216 - r * 14.6, a = r * 8.3; for (let c = 0; c < (w - a * 2) / 16; c++) s += ink("M" + (L + 8 + a + c * 16) + " " + y + "q8 10 16 0", 1.3, "#6a1a10"); }
    s += rect(L + 90, 82, 26, 60, "#a85a4a", { sw: 2.2 }) + rect(L + 86, 78, 34, 8, "#8a4a3a", { sw: 2 }) + '<g class="smoke">' + circ(L + 103, 62, 7, "rgba(255,255,255,.85)", { sw: 1.4 }) + circ(L + 112, 46, 9, "rgba(255,255,255,.8)", { sw: 1.4 }) + "</g>";
    s += rect(cx - 90, 134, 180, 38, "#6a4a2a", { sw: 2.6 }) + hatch(cx - 90, 134, 180, 38, 6, "#000", 1, .2) + txt(cx, 164, sg, 30, "#ffe8b0", "middle", { stroke: "#2a1a0a", sw: 4 });
    for (let i = 0; i < 4; i++) s += rect(L + 40 + i * (w - 120) / 3, 192, 30, 24, "#fff3d0", { sw: 1.8 }) + rect(L + 44 + i * (w - 120) / 3, 205, 22, 8, "#8a5a3a", { sw: 1.3 }) + circ(L + 49 + i * (w - 120) / 3, 203, 3, "#e0303c", { sw: 1 }) + circ(L + 57 + i * (w - 120) / 3, 202, 3, "#f2b705", { sw: 1 }) + circ(L + 63 + i * (w - 120) / 3, 203, 3, "#e86aa8", { sw: 1 });
  }
  if (li === 2) { // Vorort: Flachbau mit Farbband
    s += rect(L, 156, w, 60, "#d8dce4", { sw: 2.6 }) + hatch(L, 156, w, 60, 8, INK, 1, .1) + rect(L, 156, w, 14, "#3a5fa8", { sw: 2.2 }) + rect(L - 4, 150, w + 8, 8, "#aab0bc", { sw: 2.2 });
    s += rect(cx - 120, 160, 240, 34, "#fffdf2", { sw: 2.6 }) + txt(cx, 188, sg, 34, "#3a5fa8") + star(cx - 100, 177, 9, "#f2b705", { sw: 1.4 }) + star(cx + 100, 177, 9, "#f2b705", { sw: 1.4 });
    for (let i = 0; i < 4; i++) s += rect(L + 60 + i * (w - 180) / 3, 130, 40, 22, "#aab0bc", { sw: 2 }) + hatch(L + 60 + i * (w - 180) / 3, 130, 40, 22, 5, INK, 1, .3) + circ(L + 80 + i * (w - 180) / 3, 141, 7, "#7a8290", { sw: 1.6 });
    s += line(Rr - 30, 150, Rr - 30, 86, 3) + shp([[Rr - 30, 88], [Rr, 96], [Rr - 30, 106]], "#e0303c", { sw: 1.6 });
  }
  if (li === 3) { // Handelsstadt: Glas-Mall, 2 Etagen darüber
    s += rect(L, 66, w, CEIL - 66 + 2, "#8fb8d8", { sw: 2.6 });
    for (let f = 0; f < 2; f++) for (let c = 0; c < Math.floor(w / 46); c++) { const x = L + 6 + c * 46, y = 74 + f * 64; s += rect(x, y, 40, 54, "rgba(220,240,255,.7)", { sw: 1.8 }) + line(x + 6, y + 40, x + 22, y + 10, 3, "rgba(255,255,255,.85)", { one: 1 }) + line(x + 20, y + 46, x + 34, y + 24, 2, "rgba(255,255,255,.7)", { one: 1 }); if (hs(c, f, 3) > .55) s += '<g transform="translate(' + (x + 20) + " " + (y + 54) + ')">' + figure(SHIRTS[(c + f) % 8], SKINS[c % 4], HAIRS[f], PANTS[c % 4], 2, {}) + "</g>"; }
    s += rect(L - 4, 58, w + 8, 10, "#3f5f8f", { sw: 2.4 });
    s += rect(cx - 150, 18, 300, 44, "#fffdf2", { sw: 2.8 }) + txt(cx, 54, sg, 38, "#3f5f8f") + line(cx - 100, 62, cx - 100, 68, 2) + line(cx + 100, 62, cx + 100, 68, 2);
    for (let i = 0; i < 6; i++) s += bush(L + 30 + i * (w - 60) / 5, 60, 1.1, "#5fa055");
    s += rect(L + 20, 30, 90, 30, "#e86a8a", { sw: 2.2 }) + txt(L + 65, 52, "SALE %", 20, "#fff");
  }
  if (li === 4) { // Weltkonzern: goldener Turm mit Hubschrauberlandeplatz
    s += rect(L, 54, w, CEIL - 54 + 2, "#1d2742", { sw: 2.8 });
    for (let f = 0; f < 3; f++) for (let c = 0; c < Math.floor(w / 36); c++) s += rect(L + 8 + c * 36, 62 + f * 50, 26, 38, hs(c, f, 8) > .35 ? "#ffe680" : "#4a5a98", { sw: 1.4 }) + (hs(c, f, 8) > .35 ? "" : hatch(L + 8 + c * 36, 62 + f * 50, 26, 38, 6, "#fff", 1, .25));
    for (let c = 0; c <= 6; c++) s += rect(L + c * (w - 14) / 6, 54, 14, CEIL - 54, "#f2b705", { sw: 2 }) + hatch(L + c * (w - 14) / 6, 54, 14, CEIL - 54, 5, "#fff", 1, .4);
    s += rect(L - 6, 46, w + 12, 12, "#f2b705", { sw: 2.6 });
    s += rect(cx - 150, 96, 300, 50, "#0f1636", { sw: 3 }) + '<g class="blink">' + txt(cx, 135, sg, 40, "#ffd34a", "middle", { stroke: "#7a4a00", sw: 3 }) + "</g>";
    s += circ(cx + 150, 34, 22, "#fffdf2", { sw: 2.4 }) + txt(cx + 150, 42, "H", 26, "#e0303c");
    s += '<g class="heli">' + ell(cx + 132, 18, 14, 8, "#e0303c", { sw: 1.8 }) + rect(cx + 138, 14, 22, 4, "#e0303c", { sw: 1.4 }) + line(cx + 120, 6, cx + 148, 6, 2.4) + '<g class="rotor">' + line(cx + 106, 6, cx + 160, 6, 2.6) + "</g></g>";
    s += star(L + 40, 30, 12, "#f2b705", { sw: 1.6 }) + star(Rr - 40, 30, 12, "#f2b705", { sw: 1.6 });
  }
  return s;
}

// ---------- Dekoration neben dem Haus, Bürgersteig, Parkplatz ----------
function outside(G) {
  const li = G.li, W = G.W; let s = "";
  const pave = ["#d8c9a0", "#c9c4b4", "#cfd2da", "#b8c0cc", "#3b4468"][li];
  s += rect(0, FF + 16, W, SIDE - FF - 16 + 2, pave, { sw: 0, nostroke: 1 }) + line(0, SIDE, W, SIDE, 2.4);
  if (li === 4) { s += rect(G.doorX - 26, FF + 16, 52, 34, "#e0303c", { sw: 2 }) + rect(G.exitX - 26, FF + 16, 52, 34, "#e0303c", { sw: 2 }); }
  // Dekos links/rechts
  const lx = 14, rx = G.bx + G.bw + 36;
  if (li === 0) s += tree(lx + 4, 380, 1.5) + bush(rx + 10, 388, 1.2) + tree(rx + 50, 384, 1.3, "#6ab060") + rect(rx - 20, 360, 22, 28, "#a8683a", { sw: 2 }) + rect(rx - 20, 372, 22, 4, "#6a4a2a", { sw: 1.4 }) + circ(rx + 20, 392, 6, "#c8e0a0", { sw: 1.4 });
  if (li === 1) s += tree(lx + 4, 380, 1.5) + rect(rx - 12, 350, 22, 40, "#a8a8b0", { sw: 2.2 }) + shp([[rx - 16, 350], [rx - 1, 334], [rx + 14, 350]], "#8a5a3a", { sw: 2 }) + ellipseWell(rx + 40, 388) + tree(rx + 90, 384, 1.2, "#6ab060");
  if (li === 2) s += tree(lx + 4, 384, 1.4) + line(rx, 392, rx, 330, 3) + circ(rx, 326, 5, "#fff6b0", { sw: 1.6 }) + bush(rx + 40, 392, 1.2) + trafficLight(rx + 70, 392);
  if (li === 3) s += lampPost(lx + 6, 392) + lampPost(rx + 6, 392) + tree(rx + 40, 388, 1, "#5fa055", "pine");
  if (li === 4) s += tree(lx + 4, 392, 1.2, "", "palm") + tree(lx + 40, 396, 1, "", "palm") + tree(rx + 6, 392, 1.2, "", "palm") + fountain(rx + 56, 398) + lampPost(rx + 100, 392);
  // Gelände unterhalb der Straße
  const gy = G.roadY + 100;
  for (let i = 0; i < W / 120; i++) { const x = 40 + i * 120 + hs(i, 4, 4) * 60; s += li >= 3 ? rect(x - 30, gy + 30 + hs(i, 5, 5) * 60, 60, 40 + hs(i, 6, 6) * 40, li === 3 ? "#a8b8d0" : "#2a3a6a", { sw: 2 }) : tree(x, gy + 40 + hs(i, 5, 5) * 100, 1 + hs(i, 3, 3) * .6, "", i % 3 ? "" : "pine") + bush(x + 40, gy + 120 + hs(i, 7, 7) * 60, 1); }
  // Bank / Fahrradständer (Bürgersteig)
  for (let i = 0; i < 3; i++) { const x = G.exitX + 70 + i * 90; if (x < W - 40) s += (li <= 1 ? bench(x, 404) : li === 3 ? lampPost(x, 408) : "") ; }
  return s;
}
function ellipseWell(x, y) { return ell(x, y - 10, 14, 6, "#a8a8b0", { sw: 1.8 }) + rect(x - 14, y - 10, 28, 12, "#c8c8d0", { sw: 1.8 }) + ell(x, y - 10, 10, 3.6, "#7ac8f0", { sw: 1.2 }) + line(x - 12, y - 12, x - 12, y - 30, 2) + line(x + 12, y - 12, x + 12, y - 30, 2) + shp([[x - 16, y - 30], [x, y - 40], [x + 16, y - 30]], "#8a5a3a", { sw: 1.8 }); }
function bench(x, y) { return rect(x - 16, y - 12, 32, 5, "#a8683a", { sw: 1.6 }) + rect(x - 16, y - 20, 32, 5, "#b8783a", { sw: 1.6 }) + line(x - 13, y - 7, x - 13, y, 2) + line(x + 13, y - 7, x + 13, y, 2); }
function lampPost(x, y) { return line(x, y, x, y - 52, 3) + shp([[x - 8, y - 52], [x + 8, y - 52], [x + 5, y - 60], [x - 5, y - 60]], "#8a95a8", { sw: 1.6 }) + '<g class="blink">' + circ(x, y - 54, 4, "#fff6b0", { sw: 1 }) + "</g>"; }
function trafficLight(x, y) { return line(x, y, x, y - 54, 3) + rect(x - 6, y - 74, 12, 24, "#2a2a3a", { sw: 1.8 }) + circ(x, y - 68, 3, "#e0303c", { nostroke: 1 }) + circ(x, y - 61, 3, "#f2b705", { nostroke: 1 }) + circ(x, y - 54, 3, "#4fa84a", { nostroke: 1 }); }
function fountain(x, y) { return ell(x, y - 6, 26, 9, "#f2e6c0", { sw: 2 }) + ell(x, y - 8, 20, 6, "#7ad0ff", { sw: 1.4 }) + rect(x - 3, y - 30, 6, 22, "#f2e6c0", { sw: 1.6 }) + '<g class="drip">' + ink("M" + x + " " + (y - 30) + "q-12 -8 -14 10M" + x + " " + (y - 30) + "q12 -8 14 10M" + x + " " + (y - 32) + "L" + x + " " + (y - 14), 2, "#7ad0ff") + "</g>"; }

function lotSvg(G) {
  const li = G.li, loc = G.loc; let s = "";
  const spots = G.spots;
  // Parkfläche je Reihe (so breit wie die Plätze)
  for (let r = 0; r < G.rows; r++) {
    const n = Math.min(G.cols, spots - r * G.cols), x0 = G.lotX0 - 8, w = n * 26 + 16, y0 = G.lane(r) - 14, h = 14 + 14 + 48;
    s += rect(x0, y0, w, h, loc.lot, { sw: 2.4 });
    if (li === 0) for (let i = 0; i < w / 6; i++) s += circ(x0 + hs(i, r, 1) * w, y0 + hs(i, r, 2) * h, 0.9, "#a89870", { nostroke: 1 });
    if (li === 1) for (let i = 0; i < w / 16; i++) for (let j = 0; j < h / 12; j++) s += ell(x0 + 8 + i * 16 + (j % 2) * 8, y0 + 6 + j * 12, 7, 5, "none", { sw: 0.8, st: "#7a7a88", op: .8 });
    if (li === 4) s += hatch(x0, y0, w, h, 14, "#f2b705", 1, .25);
    // Fahrspur-Markierung
    s += line(x0 + 6, G.lane(r), x0 + w - 6, G.lane(r), 1.6, loc.lotLine, { dash: "10 10", one: 1 });
    for (let c = 0; c <= n; c++) { const x = G.lotX0 + c * 26; s += line(x, G.lane(r) + 14, x, G.lane(r) + 14 + 46, 2, loc.lotLine, { one: 1 }); }
    if (li >= 2) for (let c = 0; c < n; c += 6) s += txt(G.lotX0 + c * 26 + 13, G.lane(r) + 60, "P", 14, loc.lotLine);
    if (li === 3 && r === 0) for (let c = 2; c < n; c += 8) s += rect(G.lotX0 + c * 26 + 9, G.lane(r) + 14, 8, 10, "#3fb04a", { sw: 1.3 });
    if (li === 4 && r === 0) s += rect(G.lotX0 + 2, G.lane(r) + 14, n * 26 - 4, 4, "#e0303c", { sw: 1.2 });
  }
  // Zufahrt links + Straße
  const rx = 6, ry = G.lane(0) - 14, rh = G.roadY - ry;
  s += rect(rx, ry, 20, rh + 4, li === 4 ? "#2f3a5c" : "#8a8e9c", { sw: 2 });
  s += rect(-4, G.roadY, G.W + 8, 90, li === 4 ? "#222c4c" : "#6b6e80", { sw: 2.4 });
  s += rect(-4, G.roadY, G.W + 8, 8, li === 4 ? "#3a4670" : "#b8b6a8", { sw: 1.6 });
  s += line(0, G.roadY + 50, G.W, G.roadY + 50, 2.4, "#f2b705", { dash: "18 14", one: 1 });
  if (li >= 2) for (let i = 0; i < 4; i++) s += rect(G.W * (i + 1) / 5 - 14, G.roadY + 10, 28, 8, "#fffdf2", { sw: 1.2, op: .9 });
  s += '<g data-a="open:park" opacity="0"><rect x="0" y="' + (G.lane(0) - 14) + '" width="' + G.W + '" height="' + (G.rows * 74) + '" fill="#000"/></g>';
  return s;
}

// ---------- Defs: Sprites ----------
function defs(G) {
  let s = "<defs>";
  SKY.forEach((c, i) => { s += '<linearGradient id="sky' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".85" stop-color="' + c[1] + '"/></linearGradient>'; });
  // Kunden
  for (let k = 0; k < 10; k++) for (let f = 0; f < 2; f++) for (let b = 0; b < 2; b++) s += '<g id="c' + k + "_" + f + "_" + b + '">' + figure(SHIRTS[k % 8], SKINS[(k * 3) % 4], HAIRS[(k * 5) % 6], PANTS[k % 4], f, { hairStyle: k % 3, glasses: k % 4 === 3, basket: b }) + "</g>";
  s += '<g id="vip">' + figure("#f2b705", "#f2c9a0", "#1a1a1a", "#2a2a3a", 2, { hat: "crown", vip: 1, glasses: 1 }) + "</g>";
  // Personal je Abteilung
  const hats = { obst: ["cap", "#4fa84a"], gemuese: ["cap", "#4fa84a"], back: ["baker"], kuehl: ["cap", "#3a7ae0"], tk: ["cap", "#4a6ae0"], fleisch: ["butcher"], fein: ["chef"], elektro: ["hard"] };
  DEPTS.forEach(d => { for (let i = 0; i < 4; i++) s += '<g id="s_' + d.id + i + '">' + figure(d.col, SKINS[(i + 1) % 4], HAIRS[(i * 2 + 1) % 6], PANTS[i % 4], 2, { apron: i % 2 ? "#fffdf2" : lt(d.col, .45), hat: hats[d.id][0], hatCol: hats[d.id][1], hairStyle: i % 3 }) + "</g>"; });
  for (let i = 0; i < 8; i++) s += '<g id="k' + i + '">' + figure("#2f9a9a", SKINS[(i + 2) % 4], HAIRS[(i * 3) % 6], "#2a3a5a", 2, { apron: "#fffdf2", hairStyle: i % 3 }) + "</g>";
  for (let k = 0; k < 10; k++) s += '<g id="p' + k + '">' + pedTop(SHIRTS[k % 8], SKINS[(k * 3) % 4], HAIRS[(k * 5) % 6]) + "</g>";
  const kinds = [["car", 1], ["car", 1], ["van", 1], ["car", 1]];
  for (let k = 0; k < 10; k++) { s += '<g id="a' + k + '">' + carTop(CAR_COLS[k], k === 2 ? "van" : "car") + "</g>"; }
  s += '<g id="atx">' + carTop("#f2c205", "taxi") + "</g>" + '<g id="alm">' + carTop("#1d2742", "limo") + "</g>";
  s += '<g id="coin">' + circ(0, 0, 8, "#f2b705", { sw: 2 }) + circ(0, 0, 5, "#ffe680", { sw: 1.2 }) + txt(0, 4, "€", 9, "#a87a00") + "</g>";
  return s + "</defs>";
}

// ---------- Aufbau ----------
function buildScene(G) {
  let back = backdrop(G);
  back += roofAndSign(G);
  back += shell(G);
  back += entrance(G);
  G.ids.forEach(id => { back += '<g data-a="dept:' + id + '" class="cell">' + deptCell(G, id, G.cellX(id)) + "</g>"; });
  if (G.ghost) back += '<g>' + ghostCell(G, G.dx + G.ids.length * DW, G.ghost) + "</g>";
  back += kasseZone(G) + exitZone(G);
  G.fore = kasseFore(G);
  back += outside(G);
  back += '<g data-a="open:park">' + lotSvg(G) + "</g>";
  // Tippen-Hinweise (ohne Automatisierung)
  G.ids.forEach(id => { if (!isAuto(id)) { const x = G.cellX(id) + DW / 2; back += '<g class="tapme" data-a="dept:' + id + '"><g>' + rect(x - 34, 296, 68, 24, "#f2b705", { sw: 2.2 }) + shp([[x - 6, 320], [x + 6, 320], [x, 328]], "#f2b705", { sw: 2 }) + txt(x, 314, "Tippen!", 17, INK) + "</g></g>"; } });
  return back;
}
function sigOf(G) { return [G.li, G.W, G.spots, G.kn, G.ids.map(id => id + S.dept[id].lvl + ":" + S.dept[id].emp + (isAuto(id) ? "a" : "m")).join(","), G.ghost].join("|"); }
function sigStruct(G) { return [G.li, G.W, G.spots, G.kn, G.ids.map(id => id + itemTier(id, S.dept[id].lvl) + ":" + msCount(S.dept[id].lvl) + (isAuto(id) ? "a" : "m") + "e" + S.dept[id].emp).join(","), G.ghost].join("|"); }

function mk(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || dyn).appendChild(e); return e; }
function useEl(id, parent) { const e = document.createElementNS(NS, "use"); e.setAttribute("href", "#" + id); e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + id); (parent || dyn).appendChild(e); return e; }

function initRender(host) {
  world = host; world.innerHTML = '<svg id="sc" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>';
  svg = world.firstChild; resizeRender(); addEventListener("resize", resizeRender);
}
function resizeRender() { const vw = innerWidth; SCL = Math.max(SCALE_MIN, Math.min(2, vw / 400)); R.sig = ""; }
function rebuild() {
  const G = geom(); R.G = G;
  svg.setAttribute("width", G.W * SCL); svg.setAttribute("height", (G.H + TOPPAD) * SCL); svg.setAttribute("viewBox", "0 " + (-TOPPAD) + " " + G.W + " " + (G.H + TOPPAD));
  svg.innerHTML = defs(G) + '<g id="back">' + buildScene(G) + '</g><g id="staff"></g><g id="fore">' + G.fore + '</g><g id="dyn"></g><g id="pop"></g>';
  dyn = svg.querySelector("#dyn"); R.staffG = svg.querySelector("#staff"); R.popG = svg.querySelector("#pop");
  R.vis.length = 0; R.coins.length = 0; R.pops.length = 0; R.amb.length = 0; R.stf = [];
  // Personal
  G.ids.forEach(id => { const dd = S.dept[id], x0 = G.cellX(id); for (let i = 0; i < dd.emp; i++) { const e = useEl("s_" + id + i, R.staffG); const bx = x0 + 28 + i * 31, by = 348; e.setAttribute("transform", "translate(" + bx + " " + by + ")"); R.stf.push({ e, x: bx, y: by, id, ph: i * 1.3 }); } });
  for (let i = 0; i < G.kn; i++) { const x = G.kx + 30 + i * 46, e = useEl("k" + i, R.staffG); e.setAttribute("transform", "translate(" + x + " 360)"); R.stf.push({ e, x, y: 360, kas: true, ph: i }); }
  R.cnt = {}; setTimeout(() => { if (R.G === G) warmStart(); }, 0); R.parkedKey = ""; R.pk = null; R.vipE = null;
}

// ---------- Bewegung ----------
function mover(o, dt) {
  let left = dt;
  while (left > 0 && o.i < o.path.length) {
    if (o.wait > 0) { const w = Math.min(o.wait, left); o.wait -= w; left -= w; if (o.wait > 0) break; continue; }
    const t = o.path[o.i], dx = t.x - o.x, dy = t.y - o.y, d = Math.hypot(dx, dy), st = o.v * left;
    if (d > 0.01 && !t.rev) { const ta = Math.atan2(dx, -dy); let da = ta - o.a; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832; o.a += da * Math.min(1, left * 9); }
    if (d <= st) { o.x = t.x; o.y = t.y; left -= d / o.v; o.wait = t.wait || 0; if (t.fn) t.fn(o); o.i++; } else { o.x += dx / d * st; o.y += dy / d * st; left = 0; }
  }
  return o.i >= o.path.length && !(o.wait > 0);
}
function carKind(G) { const r = Math.random(); if (G.li === 3 && r < .25) return "atx"; if (G.li === 4 && r < .3) return "alm"; return "a" + ((Math.random() * 10) | 0); }
function spawnVisit() {
  const G = R.G; if (!G || R.vis.length >= (innerWidth < 500 ? 9 : 14)) return;
  const used = new Set(R.vis.map(v => v.bay)), free = [];
  for (let i = 0; i < G.spots; i++) if (!used.has(i) && !parkedStatic(i)) free.push(i);
  if (!free.length) return;
  const bay = free[(Math.random() * Math.min(free.length, 8)) | 0], b = G.bay(bay);
  const v = { bay, b, ph: "car", t: 0, shop: [], coinChance: 0.35 };
  const kind = carKind(G), car = { x: -30, y: G.roadY + 70, a: Math.PI / 2, v: 120, i: 0, wait: 0, e: useEl(kind), kind };
  car.path = [{ x: 16, y: G.roadY + 70 }, { x: 16, y: b.lane }, { x: b.x, y: b.lane }, { x: b.x, y: b.y - 2, wait: 0.2, fn: () => { v.ph = "park"; } }];
  car.x = -30; v.car = car; v.col = (Math.random() * 10) | 0; R.vis.push(v);
}
function warmStart() {
  const G = R.G, n = Math.min(innerWidth < 500 ? 3 : 5, Math.max(2, Math.round((C ? C.flow : 3) / 10) + 2));
  for (let k = 0; k < n; k++) {
    const used = new Set(R.vis.map(v => v.bay)), free = []; for (let i = 0; i < G.spots; i++) if (!used.has(i) && !parkedStatic(i)) free.push(i); if (!free.length) return;
    const bay = free[(Math.random() * free.length) | 0], b = G.bay(bay), kind = carKind(G);
    const car = { x: b.x, y: b.y - 2, a: Math.PI, v: 120, i: 0, wait: 0, e: useEl(kind), kind, path: [] };
    car.e.setAttribute("transform", "translate(" + b.x + " " + (b.y - 2) + ") rotate(180)");
    const v = { bay, b, ph: "shop", t: 0, coinChance: 0.35, car, col: (Math.random() * 10) | 0 };
    startShopper(v); const c = v.cust; let adv = Math.random() * 14; while (adv > 0) { mover(c, 0.1); adv -= 0.1; if (c.i >= c.path.length) break; }
    if (c.i >= c.path.length) { c.e.remove(); continue; }
    c.e.setAttribute("transform", "translate(" + c.x + " " + c.y + ")"); R.vis.push(v);
  }
}
function parkedStatic(i) { return hs(i, R.G.li, 31) < (C ? C.parkUse : 0.5) * 0.65; }
function startPed(v, from, to, done) {
  const G = R.G, e = useEl("p" + v.col); const ped = { x: from.x, y: from.y, a: 0, v: 48, i: 0, wait: 0, e, path: to, done };
  v.ped = ped;
}
function startShopper(v) {
  const G = R.G; let ids = G.ids.slice().sort(() => Math.random() - 0.5).slice(0, 1 + ((Math.random() * Math.min(3, G.ids.length)) | 0));
  ids.sort((a, b) => G.ids.indexOf(a) - G.ids.indexOf(b));
  const y0 = 358 + Math.random() * 16, path = [{ x: G.doorX + (Math.random() - 0.5) * 20, y: y0 }];
  ids.forEach(id => path.push({ x: G.cellX(id) + 24 + Math.random() * (DW - 48), y: 356 + Math.random() * 20, wait: 0.9 + Math.random() * 1.2, fn: o => { o.b = 1; if (Math.random() < v.coinChance) dropCoin(o.x, o.y); } }));
  // Kasse mit kürzester Schlange
  let best = 0, bl = 1e9; for (let i = 0; i < G.kn; i++) { const l = R.cnt[i] || 0; if (l < bl) { bl = l; best = i; } }
  const kx = G.kx + 30 + best * 46; R.cnt[best] = (R.cnt[best] || 0) + 1;
  path.push({ x: kx - 6 - (bl) * 13, y: 374, wait: 1.1 + Math.random() * 0.8 + bl * 0.4, fn: o => { R.cnt[best] = Math.max(0, (R.cnt[best] || 1) - 1); pop(o.x, 350, "+" + fmt(C ? C.perCust : 0), true); sfxSoft(); } });
  path.push({ x: G.exitX, y: 372 }, { x: G.exitX, y: 386 });
  const e = useEl("c" + v.col + "_0_0"), c = { x: G.doorX, y: 392, v: 40 + Math.random() * 14, i: 0, wait: 0, e, path, b: 0, a: 0, dir: 1 };
  v.cust = c;
}
let lastSfx = 0; function sfxSoft() { const n = performance.now(); if (n - lastSfx > 350 && typeof sfx === "function" && S.set.sound) { lastSfx = n; sfx("coin"); } }
function dropCoin(x, y) {
  if (R.coins.length > 5) return;
  const id = ++R.ids, g = mk("g", { class: "tp coinn", "data-a": "coin:" + id, transform: "translate(" + x + " " + (y - 6) + ")" });
  mk("circle", { r: 18, fill: "transparent" }, g); const u = useEl("coin", g); u.setAttribute("class", "cb");
  R.coins.push({ id, x, y, g, t: 0 });
}
function pop(x, y, tx, green) {
  const g = mk("g", {}, R.popG); g.innerHTML = rect(-24, -11, 48, 18, "#fffdf2", { sw: 1.6 }) + txt(0, 3, tx, 13, "#2a9a3a");
  g.setAttribute("transform", "translate(" + x + " " + y + ")"); R.pops.push({ g, x, y, t: 0 });
}
function collectCoin(id) {
  const i = R.coins.findIndex(c => c.id === id); if (i < 0) return false;
  const c = R.coins[i]; R.coins.splice(i, 1); c.g.remove();
  const v = Math.max(1, (C ? C.perCust : 1) * 3); S.money += v; S.st.earned += v; pop(c.x, c.y - 20, "+" + fmt(v), true); return v;
}
function collectVip() { const vp = R.vipE; if (!vp) return 0; const v = Math.max(5, (C ? C.income : 6) / 60 * 40); S.money += v; S.st.earned += v; pop(vp.x, vp.y - 50, "+" + fmt(v), true); let g = 0; if (Math.random() < 0.25) { g = 1; S.gems += 1; } vp.e.remove(); vp.g.remove(); R.vipE = null; return { v, g }; }
function spawnVip() {
  const G = R.G; if (R.vipE) return; const g = mk("g", { class: "tp", "data-a": "vip" }); const e = useEl("vip", g); mk("circle", { r: 26, cy: -22, fill: "transparent" }, g);
  const path = [{ x: G.doorX, y: 366, wait: 0.4 }]; G.ids.forEach(id => path.push({ x: G.cellX(id) + 40, y: 362 + Math.random() * 12, wait: 0.8 })); path.push({ x: G.exitX, y: 372 }, { x: G.exitX, y: 392 });
  R.vipE = { x: G.doorX, y: 392, v: 36, i: 0, wait: 0, path, e, g, b: 0 }; pop(G.doorX, 330, "VIP!", true);
}

function drawFrame(dt) {
  if (!S || !svg) return;
  const G0 = geom(), sg = sigStruct(G0);
  if (sg !== R.sig) { R.sig = sg; rebuild(); if (!R.scrolled) { R.scrolled = 1; world.scrollLeft = 0; world.scrollTop = 0; } }
  const G = R.G; R.t += dt; const t = R.t;
  // Personal wippt
  R.stf.forEach(o => { let a = 0; if (o.kas) a = (C && C.flow > 0) ? Math.abs(Math.sin(t * 5 + o.ph)) * 1.6 : 0; else { const st = C && C.depts[o.id]; a = st && st.active ? Math.abs(Math.sin(t * 6 + o.ph)) * 2.2 : 0; } o.e.setAttribute("transform", "translate(" + o.x + " " + (o.y - a) + ")"); });
  // Besuche erzeugen
  const rate = Math.min(1.1, Math.max(0.3, (C ? C.flow : 3) / 60 * 2));
  R.spawn += dt * rate; while (R.spawn >= 1) { R.spawn -= 1; spawnVisit(); }
  R.vipT -= dt; if (R.vipT <= 0) { R.vipT = 28 + Math.random() * 25; spawnVip(); }
  for (let k = R.vis.length - 1; k >= 0; k--) {
    const v = R.vis[k];
    if (v.ph === "car" || v.ph === "park") {
      const done = mover(v.car, dt);
      v.car.e.setAttribute("transform", "translate(" + f1(v.car.x) + " " + f1(v.car.y) + ") rotate(" + f1(v.car.a * 57.3) + ")");
      if (v.ph === "park" && !v.ped && !v.cust) { v.car.a = Math.PI; v.car.e.setAttribute("transform", "translate(" + v.car.x + " " + v.car.y + ") rotate(180)"); // Fahrer steigt aus
        v.ph = "walkin"; const b = v.b, px = b.bx;
        startPed(v, { x: b.x + 10, y: b.y }, [{ x: px, y: b.y }, { x: px, y: 402 }, { x: G.doorX, y: 400 }, { x: G.doorX, y: 392 }]); }
    }
    if (v.ph === "walkin") {
      const p = v.ped; if (mover(p, dt)) { p.e.remove(); v.ped = null; startShopper(v); v.ph = "shop"; } else p.e.setAttribute("transform", "translate(" + f1(p.x) + " " + f1(p.y) + ") rotate(" + f1(p.a * 57.3) + ")");
    } else if (v.ph === "shop") {
      const c = v.cust, px = c.x; const done = mover(c, dt);
      const moving = Math.abs(c.x - (c.lx === undefined ? c.x : c.lx)) > 0.01; c.lx = c.x; const fr = (Math.floor(t * 5 + v.col) % 2);
      c.e.setAttribute("href", "#c" + v.col + "_" + (moving ? fr : 0) + "_" + (c.b ? 1 : 0)); c.e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#c" + v.col + "_" + (moving ? fr : 0) + "_" + (c.b ? 1 : 0));
      if (moving) c.dir = c.x > px ? 1 : -1;
      c.e.setAttribute("transform", "translate(" + f1(c.x) + " " + f1(c.y) + ") scale(" + (c.dir || 1) + " 1)");
      const topY = c.y > 380 ? Math.max(0, 1 - (c.y - 380) / 14) : 1; c.e.setAttribute("opacity", topY);
      if (done) { c.e.remove(); v.cust = null; const b = v.b, px2 = b.bx; v.ph = "walkout"; startPed(v, { x: G.exitX, y: 394 }, [{ x: G.exitX, y: 402 }, { x: px2, y: 402 }, { x: px2, y: b.y }, { x: b.x + 10, y: b.y }]); }
    } else if (v.ph === "walkout") {
      const p = v.ped; if (mover(p, dt)) { p.e.remove(); v.ped = null; v.ph = "leave"; const b = v.b, c = v.car; c.a = Math.PI; c.i = 0; c.wait = 0.3;
        c.path = [{ x: b.x, y: b.lane, rev: true }, { x: 16, y: b.lane }, { x: 16, y: G.roadY + 20 }, { x: G.W + 60, y: G.roadY + 20 }]; } else p.e.setAttribute("transform", "translate(" + f1(p.x) + " " + f1(p.y) + ") rotate(" + f1(p.a * 57.3) + ")");
    } else if (v.ph === "leave") {
      if (mover(v.car, dt)) { v.car.e.remove(); R.vis.splice(k, 1); } else v.car.e.setAttribute("transform", "translate(" + f1(v.car.x) + " " + f1(v.car.y) + ") rotate(" + f1(v.car.a * 57.3) + ")");
    }
  }
  // VIP
  if (R.vipE) { const c = R.vipE, px = c.x; const done = mover(c, dt); c.dir = c.x >= px ? 1 : -1; c.g.setAttribute("transform", "translate(" + f1(c.x) + " " + f1(c.y) + ") scale(" + c.dir + " 1)"); if (done) { c.g.remove(); R.vipE = null; } }
  // Münzen
  for (let i = R.coins.length - 1; i >= 0; i--) { const c = R.coins[i]; c.t += dt; if (c.t > 9) { c.g.remove(); R.coins.splice(i, 1); } else c.g.setAttribute("transform", "translate(" + c.x + " " + f1(c.y - 8 - Math.abs(Math.sin(c.t * 4)) * 3) + ")"); }
  // Preis-Blasen
  for (let i = R.pops.length - 1; i >= 0; i--) { const p = R.pops[i]; p.t += dt; if (p.t > 1.5) { p.g.remove(); R.pops.splice(i, 1); } else { p.g.setAttribute("transform", "translate(" + p.x + " " + f1(p.y - p.t * 18) + ")"); p.g.setAttribute("opacity", Math.min(1, (1.5 - p.t) * 2)); } }
  // Vorbeifahrende Autos
  R.amb = R.amb.filter(a => { a.x += a.v * dt * a.d; a.e.setAttribute("transform", "translate(" + f1(a.x) + " " + a.y + ") rotate(" + (a.d > 0 ? 90 : -90) + ")"); if (a.x > G.W + 60 || a.x < -60) { a.e.remove(); return false; } return true; });
  R.ambT = (R.ambT || 0) - dt; if (R.ambT <= 0) { R.ambT = 3 + Math.random() * 5; const d = Math.random() < 0.5 ? 1 : -1; const k = carKind(G); R.amb.push({ x: d > 0 ? -50 : G.W + 50, y: G.roadY + (d > 0 ? 70 : 28), v: 60 + Math.random() * 40, d, e: useEl(k) }); }
  // Statische Autos (belegte Plätze) nur beim Neuaufbau
  if (!R.parkedKey || R.parkedKey !== G.spots + ":" + (C ? Math.round(C.parkUse * 20) : 0) + ":" + G.li) { R.parkedKey = G.spots + ":" + (C ? Math.round(C.parkUse * 20) : 0) + ":" + G.li; drawParked(G); }
}
function drawParked(G) {
  if (R.pk) R.pk.remove(); const g = mk("g", { id: "parked" }); dyn.insertBefore(g, dyn.firstChild); R.pk = g;
  for (let i = 0; i < G.spots; i++) if (parkedStatic(i)) { const b = G.bay(i), k = hs(i * 13 + 5, i * 7 + 1, G.li + 9); const u = useEl(G.li === 4 && k < .25 ? "alm" : G.li === 3 && k < .12 ? "atx" : "a" + ((hs(i * 29 + 1, G.li, 77) * 10) | 0), g); u.setAttribute("transform", "translate(" + b.x + " " + (b.y + 2) + ") rotate(" + (180 + (hs(i, 7, 8) - .5) * 6) + ")"); }
}
function resetScene() { R.sig = ""; R.parkedKey = ""; }
function focusDept(id) {
  if (!world || !R.G || !world.scrollTo) return;
  if (!id) { world.scrollTo({ top: 0, behavior: "smooth" }); return; }
  const x = R.G.cellX(id) + DW / 2; world.scrollTo({ left: Math.max(0, x * SCL - innerWidth / 2), top: Math.max(0, (CEIL - 30 + TOPPAD) * SCL - 78), behavior: "smooth" });
}
