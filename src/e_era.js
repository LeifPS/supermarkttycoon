"use strict";
// 24 Ausbaustufen (jeder x2-Meilenstein = neues Aussehen), von normalem Obst bis zu kosmischen Cyborg-Früchten.
const BASE = {
  obst: ["Apfel", "Birne", "Traube", "Melone", "Drachenfrucht", "Ananas"],
  gemuese: ["Möhre", "Salat", "Paprika", "Kürbis", "Brokkoli", "Trüffel"],
  back: ["Brötchen", "Brot", "Brezel", "Torte", "Hochzeitstorte", "Krontorte"],
  kuehl: ["Milch", "Joghurt", "Käse", "Eis", "Butter", "Edelkäse"],
  tk: ["Pommes", "Pizza", "Eisbecher", "Fischfilet", "Hummer", "Eisbombe"],
  fleisch: ["Bratwurst", "Braten", "Filet", "Schinken", "Steak", "Königssteak"],
  fein: ["Oliven", "Lachs", "Pastete", "Kaviar", "Praline", "Safran"],
  elektro: ["Taschenlampe", "Radio", "Fernseher", "Konsole", "Saugroboter", "Raumschiff"],
};
const sp = (x, y, r, c) => star(x, y, r, c || "#fffdf2", { sw: 0.8 });
// t = Farbton, a = Stärke der Einfärbung, ov = Zusatzzeichnung, op = Durchsichtigkeit, fl = schwebt, name/desc für die Anzeige
const ERAS = [
  { mod: "", desc: "Frisch aus dem Lager." },
  { mod: "Bio", desc: "Aus ökologischem Anbau.", ov: (x, y, s) => shp([[x + 4 * s, y - 14 * s], [x + 11 * s, y - 20 * s], [x + 10 * s, y - 12 * s]], "#4fc84a", { sw: 1.1 }) },
  { mod: "Premium", desc: "Nur die beste Qualität.", ov: (x, y, s) => circ(x + 8 * s, y - 14 * s, 4 * s, "#e0303c", { sw: 1.1 }) + txt(x + 8 * s, y - 12.6 * s, "1a", 5 * s, "#fff") },
  { mod: "Edel", t: "#ffffff", a: .15, desc: "Für echte Genießer.", ov: (x, y, s) => sp(x + 8 * s, y - 16 * s, 3 * s) + sp(x - 8 * s, y - 6 * s, 2 * s) },
  { mod: "Gold", t: "#f2b705", a: .55, desc: "Mit Blattgold veredelt.", ov: (x, y, s) => sp(x + 8 * s, y - 16 * s, 3.4 * s, "#fff6b0") + sp(x - 8 * s, y - 8 * s, 2.4 * s, "#fff6b0") },
  { mod: "Diamant", t: "#bfe6ff", a: .6, desc: "Funkelt wie ein Diamant.", ov: (x, y, s) => sp(x + 9 * s, y - 15 * s, 3.6 * s) + sp(x - 9 * s, y - 10 * s, 3 * s) + sp(x + 2 * s, y - 20 * s, 2.4 * s) + line(x - 6 * s, y - 12 * s, x - 2 * s, y - 15 * s, 1.4, "#fff", { one: 1 }) },
  { mod: "Chrom", t: "#c8d0e0", a: .75, desc: "Spiegelglatt poliert.", ov: (x, y, s) => line(x - 5 * s, y - 13 * s, x - 2 * s, y - 4 * s, 2.4, "rgba(255,255,255,.85)", { one: 1 }) },
  { mod: "Kristall", t: "#9ad8ff", a: .6, desc: "Durchsichtig wie Glas.", ov: (x, y, s) => ink("M" + (x - 5 * s) + " " + (y - 12 * s) + "L" + (x + 1 * s) + " " + (y - 6 * s) + "L" + (x + 6 * s) + " " + (y - 12 * s) + "M" + (x + 1 * s) + " " + (y - 6 * s) + "L" + (x + 1 * s) + " " + (y - 1 * s), 1, "rgba(255,255,255,.9)") },
  { mod: "Neon", t: "#ff4ad0", a: .55, glow: "#ff4ad0", desc: "Leuchtet im Dunkeln." },
  { mod: "Laser", t: "#ff5a5a", a: .5, glow: "#ff3a3a", desc: "Von Lasern geschnitten.", ov: (x, y, s) => line(x - 12 * s, y - 7 * s, x + 12 * s, y - 7 * s, 1.4, "#ff2a2a", { one: 1 }) + circ(x - 12 * s, y - 7 * s, 1.6 * s, "#ff2a2a", { nostroke: 1 }) },
  { mod: "Turbo", t: "#ff9a2a", a: .5, desc: "Wächst mit Turbo-Antrieb.", ov: (x, y, s) => shp([[x - 8 * s, y - 4 * s], [x - 16 * s, y - 8 * s], [x - 8 * s, y - 10 * s]], "#f28a1a", { sw: 1 }) + line(x - 18 * s, y - 5 * s, x - 11 * s, y - 5 * s, 1.2, "#f2b705", { one: 1 }) },
  { mod: "Cyber", t: "#8a95a8", a: .45, desc: "Mit eingebautem Chip.", ov: (x, y, s) => circ(x + 4 * s, y - 9 * s, 1.8 * s, "#4affff", { sw: 0.8 }) + ink("M" + (x - 6 * s) + " " + (y - 4 * s) + "L" + (x - 2 * s) + " " + (y - 4 * s) + "L" + (x) + " " + (y - 7 * s) + "L" + (x + 4 * s) + " " + (y - 7 * s), 1.1, "#4affff") },
  { mod: "Cyborg", t: "#a8b0c0", a: .3, desc: "Halb Natur, halb Maschine.", ov: (x, y, s) => rect(x - 7 * s, y - 12 * s, 7 * s, 6 * s, "#9aa4b8", { sw: 1.2 }) + hatch(x - 7 * s, y - 12 * s, 7 * s, 6 * s, 2.6, INK, .8, .5) + circ(x + 3 * s, y - 8 * s, 2.6 * s, "#e0303c", { sw: 1 }) + circ(x + 3 * s, y - 8 * s, 1 * s, "#ffd0d0", { nostroke: 1 }) + circ(x - 5 * s, y - 11 * s, 0.9 * s, INK, { nostroke: 1 }) + line(x + 6 * s, y - 14 * s, x + 9 * s, y - 20 * s, 1.2) + circ(x + 9 * s, y - 20 * s, 1.4 * s, "#e0303c", { nostroke: 1 }) },
  { mod: "Plasma", t: "#b04aff", a: .55, glow: "#b04aff", desc: "Glüht vor Energie.", ov: (x, y, s) => ink("M" + (x - 9 * s) + " " + (y - 14 * s) + "l4 4 -3 2 5 5 -2 -6 4 -2", 1.3, "#fff6b0") },
  { mod: "Hologramm", t: "#7ad0ff", a: .75, op: .75, glow: "#7ad0ff", desc: "Nur ein Lichtbild, aber lecker.", ov: (x, y, s) => { let o = ""; for (let k = 0; k < 5; k++) o += line(x - 10 * s, y - 3 * s - k * 3.4 * s, x + 10 * s, y - 3 * s - k * 3.4 * s, .8, "rgba(255,255,255,.7)", { one: 1 }); return o + ell(x, y + 1, 11 * s, 2.6 * s, "none", { sw: 1.2, st: "#7ad0ff" }); } },
  { mod: "Quanten", t: "#4affb0", a: .6, ghost: 1, desc: "Gleichzeitig hier und dort.", ov: (x, y, s) => sp(x - 10 * s, y - 12 * s, 2 * s, "#4affb0") + sp(x + 11 * s, y - 4 * s, 2 * s, "#4affb0") },
  { mod: "Nano", t: "#e8f4ff", a: .55, desc: "Winzige Roboter halten es frisch.", ov: (x, y, s) => { let o = ""; for (let k = 0; k < 9; k++) o += circ(x + (hs(k, 1, 7) - .5) * 22 * s, y - 2 * s - hs(k, 2, 7) * 16 * s, .9 * s, "#4affff", { nostroke: 1 }); return o; } },
  { mod: "Schwerkraft", t: "#c8b0ff", a: .4, fl: 1, glow: "#b890ff", desc: "Schwebt über dem Regal.", ov: (x, y, s) => ell(x, y + 1, 9 * s, 2 * s, "rgba(184,144,255,.55)", { nostroke: 1 }) },
  { mod: "Stern", t: "#ffe680", a: .6, glow: "#ffe680", desc: "Gewachsen im Sternenlicht.", ov: (x, y, s) => sp(x - 10 * s, y - 14 * s, 3 * s, "#fff6b0") + sp(x + 10 * s, y - 10 * s, 3.4 * s, "#fff6b0") + sp(x + 2 * s, y - 22 * s, 2.4 * s, "#fff6b0") },
  { mod: "Mond", t: "#e8e8f0", a: .6, desc: "Vom Mond geerntet.", ov: (x, y, s) => circ(x - 2 * s, y - 9 * s, 2 * s, "#b8b8c8", { sw: .8 }) + circ(x + 3 * s, y - 5 * s, 1.6 * s, "#b8b8c8", { sw: .8 }) + circ(x + 3 * s, y - 12 * s, 1.2 * s, "#b8b8c8", { sw: .8 }) },
  { mod: "Galaxie", t: "#6a3aa8", a: .6, glow: "#9a6aff", desc: "Direkt aus der Galaxie.", ov: (x, y, s) => ink("M" + x + " " + (y - 8 * s) + "q6 -8 12 0 q-6 10 -14 2", 1.3, "#fff") + sp(x - 8 * s, y - 14 * s, 2 * s) },
  { mod: "Nebel", t: "#ff6ab8", a: .55, glow: "#ff6ab8", desc: "In Sternennebel getaucht.", ov: (x, y, s) => circ(x - 9 * s, y - 4 * s, 4.4 * s, "rgba(255,106,184,.5)", { nostroke: 1 }) + circ(x + 10 * s, y - 12 * s, 5 * s, "rgba(122,208,255,.45)", { nostroke: 1 }) },
  { mod: "Kosmos", t: "#2a1a5a", a: .6, glow: "#6a4aff", desc: "Kosmische Delikatesse.", ov: (x, y, s) => { let o = ell(x, y - 8 * s, 14 * s, 4 * s, "none", { sw: 1.2, st: "#b8a0ff" }); for (let k = 0; k < 8; k++) o += circ(x + (hs(k, 3, 7) - .5) * 20 * s, y - 2 * s - hs(k, 4, 7) * 16 * s, .8 * s, "#fffdf2", { nostroke: 1 }); return o; } },
  { mod: "Unendlich", t: "#ffffff", a: .5, glow: "#ffe680", desc: "Ohne Anfang und ohne Ende.", ov: (x, y, s) => ink("M" + (x - 14 * s) + " " + (y - 2 * s) + "Q" + x + " " + (y - 26 * s) + " " + (x + 14 * s) + " " + (y - 2 * s), 2.2, "#ff6a6a") + ink("M" + (x - 12 * s) + " " + (y - 2 * s) + "Q" + x + " " + (y - 23 * s) + " " + (x + 12 * s) + " " + (y - 2 * s), 2.2, "#ffd34a") + ink("M" + (x - 10 * s) + " " + (y - 2 * s) + "Q" + x + " " + (y - 20 * s) + " " + (x + 10 * s) + " " + (y - 2 * s), 2.2, "#6ad0ff") + sp(x + 12 * s, y - 20 * s, 3 * s, "#fff6b0") + sp(x - 13 * s, y - 16 * s, 2.4 * s, "#fff6b0") },
];
const MS_MAX = ERAS.length - 1;
function stageItem(id, st, x, y, s) { // Ware der Ausbaustufe st
  const e = ERAS[Math.min(MS_MAX, st)], base = ITEMS[id][st % 6];
  let o = base(x, y, s);
  if (e.t) o = o.replace(/fill="(#[0-9a-fA-F]{6})"/g, (m, c) => 'fill="' + mixHex(c, e.t, e.a) + '"');
  if (e.glow) o = circ(x, y - 8 * s, 13 * s, e.glow, { nostroke: 1, op: .28 }) + o;
  if (e.ghost) o = '<g opacity=".35" transform="translate(5 -3)">' + o + "</g>" + o;
  if (e.fl) o = '<g transform="translate(0 -9)">' + o + "</g>";
  if (e.op) o = '<g opacity="' + e.op + '">' + o + "</g>";
  if (e.ov) o += e.ov(x, y + (e.fl ? -9 : 0), s);
  return o;
}
function prodOf(id, lvl) { const ms = Math.min(MS_MAX, msCount(lvl)), e = ERAS[ms], b = BASE[id][ms % 6]; return { name: (e.mod ? e.mod + "-" : "") + b, desc: e.desc, ms }; }

// Regalbrett je Ausbaustufe
function plankSvg(x, w, py, ms, wood, deptCol) {
  if (ms < 3) return rect(x + 6, py, w - 12, 5, ms >= 2 ? lt(wood, .25) : wood, { sw: 1.7 });
  if (ms < 6) return rect(x + 6, py, w - 12, 5, "#cfd6e0", { sw: 1.7 }) + line(x + 10, py + 1.6, x + w - 10, py + 1.6, 1, "#fff", { one: 1 });
  if (ms < 9) return rect(x + 6, py, w - 12, 5, "#f2b705", { sw: 1.7 }) + line(x + 10, py + 1.6, x + w - 10, py + 1.6, 1, "#fff6b0", { one: 1 });
  if (ms < 12) return rect(x + 6, py, w - 12, 6, "rgba(190,230,255,.75)", { sw: 1.7 }) + line(x + 10, py + 2, x + w - 10, py + 2, 1.4, "#fff", { one: 1 });
  if (ms < 15) return rect(x + 6, py, w - 12, 5, "#1a1f3a", { sw: 1.7 }) + '<g class="blink">' + line(x + 8, py - .5, x + w - 8, py - .5, 2.4, deptCol, { one: 1 }) + "</g>";
  if (ms < 18) { let o = rect(x + 6, py, w - 12, 6, "#5a6a7a", { sw: 1.7 }); for (let k = 0; k < 8; k++) o += circ(x + 14 + k * (w - 28) / 7, py + 3, 1.2, k % 2 ? "#4affff" : "#ff4a4a", { nostroke: 1 }); return o; }
  if (ms < 21) return '<g class="blink">' + line(x + 8, py + 1, x + w - 8, py + 1, 2, "#7ad0ff", { dash: "5 4", one: 1 }) + "</g>" + ell(x + w / 2, py + 5, (w - 20) / 2, 2.4, "rgba(122,208,255,.25)", { nostroke: 1 });
  return rect(x + 6, py, w - 12, 5, "#fffdf2", { sw: 1.4, st: "#7ad0ff" }) + '<g class="blink">' + ell(x + w / 2, py + 5, (w - 14) / 2, 3.4, "rgba(184,144,255,.45)", { nostroke: 1 }) + "</g>";
}
// Wandverkleidung je Ausbaustufe (liegt über der Grundwand, unter den Regalen)
function wallFx(x, w, ms, col) {
  let s = "";
  const y0 = CEIL, h = FB - CEIL;
  if (ms >= 9 && ms < 12) for (let c = 0; c < 6; c++) s += rect(x + 8 + c * 25, y0, 4, h, "rgba(255,255,255,.4)", { nostroke: 1 });
  if (ms >= 12 && ms < 15) { s += rect(x, y0, w, h, "rgba(20,24,60,.55)", { nostroke: 1 }); for (let c = 1; c < 6; c++) s += '<g class="blink" style="animation-delay:' + c * .3 + 's">' + line(x + c * 25, y0, x + c * 25, FB, 1.6, col, { one: 1 }) + "</g>"; for (let r = 1; r < 5; r++) s += line(x, y0 + r * 26, x + w, y0 + r * 26, 1, col, { one: 1 }); }
  if (ms >= 15 && ms < 18) { s += rect(x, y0, w, h, "rgba(14,24,50,.7)", { nostroke: 1 }); for (let k = 0; k < 14; k++) { const px = x + 6 + hs(k, 1, 4) * (w - 12), py = y0 + 8 + hs(k, 2, 4) * (h - 16); s += ink("M" + px + " " + py + "h" + (10 + hs(k, 3, 4) * 24) + "v" + (8 + hs(k, 4, 4) * 20), 1.2, k % 2 ? "#4affff" : "#4aff8a") + circ(px, py, 1.8, "#4affff", { nostroke: 1 }); } }
  if (ms >= 18) { s += rect(x, y0, w, h, ms >= 21 ? "rgba(30,10,60,.78)" : "rgba(8,10,40,.78)", { nostroke: 1 }); if (ms >= 21) for (let k = 0; k < 5; k++) s += circ(x + hs(k, 1, 5) * w, y0 + hs(k, 2, 5) * h, 26 + hs(k, 3, 5) * 20, ["rgba(255,106,184,.22)", "rgba(106,138,255,.25)", "rgba(184,106,255,.22)"][k % 3], { nostroke: 1 }); for (let k = 0; k < 16; k++) s += '<g class="tw" style="animation-delay:' + (k * .23) + 's">' + circ(x + 4 + hs(k, 4, 5) * (w - 8), y0 + 4 + hs(k, 5, 5) * (h - 8), .8 + hs(k, 6, 5) * 1.2, "#fffdf2", { nostroke: 1 }) + "</g>"; if (ms < 21) for (let r = 1; r < 5; r++) s += line(x, y0 + r * 26, x + w, y0 + r * 26, .8, "rgba(122,208,255,.5)", { one: 1 }); }
  return s;
}
// Roboter-Personal ab Stufe 15 (ab 21 mit Heiligenschein/Schweben)
function robot(col, fr, halo) {
  let s = halo ? ell(0, -46, 8, 2.4, "none", { sw: 1.6, st: "#ffe680" }) : sh(0, 0, 8, 2.3);
  const L = fr === 0 ? [-2, 2] : [2, -2];
  if (!halo) s += rect(-5 + L[0], -9, 3.6, 9, "#6a7a8a", { sw: 1.4 }) + rect(1.4 + L[1], -9, 3.6, 9, "#5a6a7a", { sw: 1.4 }) + rect(-6, -2.6, 5.4, 2.6, "#2a2a3a", { sw: 1.1 }) + rect(1, -2.6, 5.4, 2.6, "#2a2a3a", { sw: 1.1 });
  else s += shp([[-4, -12], [4, -12], [0, -2]], "rgba(122,208,255,.6)", { sw: 1 });
  s += rect(-7, -28, 14, 18, col, { sw: 1.8 }) + rect(-4.4, -25, 8.8, 7, "#fffdf2", { sw: 1.1 }) + circ(-2, -21.5, 1.2, "#4affff", { nostroke: 1 }) + circ(2, -21.5, 1.2, "#ff4a8a", { nostroke: 1 });
  s += rect(-10.6, -27, 3.6, 12, "#9aa4b8", { sw: 1.3 }) + rect(7, -27, 3.6, 12, "#9aa4b8", { sw: 1.3 });
  s += rect(-6, -40, 12, 11, "#cfd6e0", { sw: 1.7 }) + rect(-4.4, -37.6, 8.8, 5, "#1a2a4a", { sw: 1 }) + circ(-2, -35, 1.3, "#4affff", { nostroke: 1 }) + circ(2, -35, 1.3, "#4affff", { nostroke: 1 });
  s += line(0, -40, 0, -46, 1.4) + circ(0, -47, 1.8, "#e0303c", { sw: 1 });
  return s;
}
