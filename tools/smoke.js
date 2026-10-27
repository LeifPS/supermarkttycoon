// Rauchtest: lädt public/index.html in jsdom (Canvas-Stub) und klickt durch alle Seiten
const { JSDOM, VirtualConsole } = require("/tmp/jt/node_modules/jsdom");
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../public/index.html", "utf8");
const errs = [];
const vc = new VirtualConsole(); vc.on("jsdomError", e => errs.push("jsdomError: " + (e.detail && e.detail.stack || e.message))); vc.on("error", e => errs.push("console.error: " + e));
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/", virtualConsole: vc, beforeParse(w) {
  const ctx = new Proxy({}, { get: (t, k) => k === "measureText" ? () => ({ width: 30 }) : k === "canvas" ? {} : (typeof k === "string" ? (t[k] !== undefined ? t[k] : () => { }) : undefined), set: (t, k, v) => { t[k] = v; return true; } });
  w.HTMLCanvasElement.prototype.getContext = () => ctx;
  w.__frames = []; w.requestAnimationFrame = f => { w.__frames.push(f); return 1; };
  w.AudioContext = undefined; w.webkitAudioContext = undefined; w.fetch = () => Promise.reject();
} });
const w = dom.window;
function frames(n) { for (let i = 0; i < n; i++) { const f = w.__frames.shift(); if (f) f(performance.now() + i * 16); } }
try {
  frames(5);
  const ev = (w2, code) => w2.eval(code);
  const run = c => w.eval(c);
  run("closeModal()");
  const pages = ["verw", "park", "map", "cards", "lab", "orders", "shop", "pass", "set"];
  for (const p of pages) { run(`openPage('${p}')`); frames(2); run("renderAll(true)"); }
  for (const t of ["offers", "pass", "boost", "cards", "gems"]) { run(`UI.tab.shop='${t}';renderAll(true)`); }
  run("UI.tab.verw='stat';openPage('verw')"); run("UI.tab.lab='ult';openPage('lab')");
  run("UI.resSlot=0;openPage('resel')"); run("act('rstart:r_obst')");
  run("S.money=1e9;S.rp=5000;S.gems=5000;S.gold=50;");
  for (const d of ["obst", "gemuese"]) { run(`openDept('${d}')`); frames(2); for (const a of ["lv", "hire", "proc"]) run(`act('${a}:${d}')`); run("act('mode:10')"); run(`act('lv:${d}')`); run("act('mode:0')"); run(`act('lv:${d}')`); run(`act('skip:${d}')`); }
  for (const a of ["park", "ad", "kasse", "adboost", "freepack", "pack:fort", "pack:prem", "pack:labor", "pack:order", "rppack:0", "tboost:0", "eur:gems:g1", "eur:perm:seal", "eur:pass:prem", "eur:pass:elite", "eur:offer:o_labor", "eur:lab5", "daily", "chest", "ostart:0", "ult:u_profit", "labunl", "mcard:obst", "mup:obst", "subup:lab:lab1", "subup:ord:o1"]) { run(`act('${a}')`); frames(1); run("closeModal()"); }
  run("act('pclaim:free:0')");
  run("S.money=1e16;act('loc')");
  for (let i = 0; i < 4; i++) { run("S.money=1e18;act('loc')"); run("S.money=1e18"); }
  frames(30);
  run("S.money=1e30;for(const id in S.dept){S.mode=0;act('lv:'+id)}");
  for (const p of pages) { run(`openPage('${p}')`); frames(2); }
  run("openDept(Object.keys(S.dept)[3])"); frames(3);
  run("tick(3600);saveGame();loadGame();calc(false)");
  console.log("Standort:", run("locOf().name"), "Abteilungen:", run("Object.keys(S.dept).join(',')"), "Einkommen/min:", run("fmt(C.income)"));
  console.log("Offline:", JSON.stringify(run("S.last=Date.now()-3600*1000*5;applyOffline()&&fmt(applyOffline().earn)")));
} catch (e) { errs.push("EXC: " + e.stack); }
console.log(errs.length ? errs.slice(0, 12).join("\n") : "OK: keine Fehler");
process.exit(0);
