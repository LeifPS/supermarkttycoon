"use strict";
// Hilfsfunktionen: Zahlen, Zeit, Zufall
const $ = (s, r) => (r || document).querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "UDc", "DDc"];
function trimNum(v, d) { let s = v.toFixed(d); if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, ""); return s.replace(".", ","); }
// Kurzschreibweise: 1,5K  31M  15B
function fmt(n) {
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + fmt(-n);
  if (n < 1000) return n < 10 && n % 1 ? trimNum(n, 2) : String(Math.floor(n));
  if (n >= 1e42) { const e = Math.floor(Math.log10(n)); return trimNum(n / Math.pow(10, e), 2) + "e" + e; }
  let i = Math.min(SUF.length - 1, Math.floor(Math.log10(n) / 3));
  let v = n / Math.pow(1000, i);
  let d = v >= 100 ? 0 : v >= 10 ? 1 : 2;
  if (+v.toFixed(d) >= 1000 && i < SUF.length - 1) { i++; v = n / Math.pow(1000, i); d = 2; }
  return trimNum(v, d) + SUF[i];
}
// Volle Zahl mit Punkten, ab Milliarden Kurzschreibweise
function fmtFull(n) {
  if (!isFinite(n)) return "∞";
  if (n < 1e9) return Math.floor(n).toLocaleString("de-DE");
  return fmt(n);
}
function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  if (d > 0) return d + "d " + h + "h";
  if (h > 0) return h + "h " + m + "m";
  if (m > 0) return m + "m" + (m < 5 && s ? " " + s + "s" : "");
  return s + "s";
}
function pct(v) { return trimNum(v * 100, 1) + "%"; }
// deterministischer Zufall (wie in Tonlinge)
function hs(x, y, k) { let h = (x * 374761393 + y * 668265263 + (k || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function wpick(items, wf) { let t = 0; for (const i of items) t += wf(i); let r = Math.random() * t; for (const i of items) { r -= wf(i); if (r <= 0) return i; } return items[items.length - 1]; }
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round((pa >> 16) + ((pb >> 16) - (pa >> 16)) * t), g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t), bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}
