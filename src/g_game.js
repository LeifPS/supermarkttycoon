"use strict";
// Steuerung: Eingaben, Seiten, Spielschleife
const PAGES = { verw: pageVerw, park: pagePark, map: pageMap, cards: pageCards, lab: pageLab, resel: pageResel, orders: pageOrders, shop: pageShop, pass: pagePass, set: pageSet };
const lastHtml = { chrome: "", layer: "" };

function openPage(name, arg) {
  UI.page = name; UI.dept = null; focusDept(null);
  if (arg) UI.tab[name] = arg;
  renderAll(true);
}
function closeTop() {
  if (UI.modal) { closeModal(); return; }
  if (UI.page === "resel") UI.page = "lab"; else if (UI.page) UI.page = null; else if (UI.dept) { UI.dept = null; focusDept(null); }
  renderAll(true);
}
function openDept(id) {
  if (!S.dept[id]) return;
  UI.page = null; UI.dept = id; S.dept[id].act = nowMs() + 30000; calc(false); focusDept(id); renderAll(true);
}
function renderLayer(force) {
  const L = $id("layer");
  let html = ""; if (UI.page && PAGES[UI.page]) html += PAGES[UI.page](); if (UI.dept) html += deptSheet();
  if (!force && html === lastHtml.layer) return;
  const keep = {}; L.querySelectorAll("[data-sc],.sheet .in").forEach(e => { keep[e.dataset.sc || "sheet"] = e.scrollTop; });
  L.innerHTML = html; lastHtml.layer = html;
  L.querySelectorAll("[data-sc],.sheet .in").forEach(e => { const k = e.dataset.sc || "sheet"; if (keep[k]) e.scrollTop = keep[k]; });
}
function renderAll(force) {
  renderChrome(); renderLayer(force);
}

function done(ok, snd, err) {
  if (ok) { sfx(snd || "buy"); } else { sfx("err"); if (err) toast(err); }
  renderAll(true); return ok;
}
function act(a) {
  const p = a.split(":"), k = p[0];
  switch (k) {
    case "noop": return;
    case "mclose": closeModal(); return;
    case "close": closeTop(); sfx("tap"); return;
    case "open": sfx("tap"); openPage(p[1], p[2]); return;
    case "tab": sfx("tap"); UI.tab[p[1]] = p[2]; renderAll(true); return;
    case "dept": sfx("tap"); openDept(p[1]); return;
    case "lv": return done(levelUp(p[1]), "up", "Nicht genug Geld");
    case "hire": return done(hire(p[1]), "buy", "Nicht genug Geld");
    case "proc": return done(procUp(p[1]), "buy", "Nicht genug Geld");
    case "skip": return done(skipMilestone(p[1]), "up", "Nicht genug Edelsteine");
    case "mode": S.mode = +p[1]; sfx("tap"); renderAll(true); return;
    case "mup": return done(upMgr(p[1]), "up", "Dir fehlen Karten oder Forschungspunkte");
    case "park": return done(buyPark(), "buy", "Nicht genug Geld");
    case "ad": return done(buyAd(), "buy", "Nicht genug Geld");
    case "kasse": return done(buyKasse(), "buy", "Nicht genug Geld");
    case "loc": { const ok = buyLoc(); if (ok) { sfx("up"); toast("Neuer Standort: " + locOf().name); R.cust.length = 0; } return done(ok, "up", "Nicht genug Geld"); }
    case "chest": { const r = openChest(); if (!r) { sfx("err"); toast("Schließe 5 Quests ab für die Truhe"); return; } sfx("pack"); packModal(r.cards, "Quest-Truhe: +" + r.r.gems + " 💎 +" + r.r.rp + " FP" + (r.r.gold ? " +1 Gold" : "")); renderAll(true); return; }
    case "adboost": adBoost(); sfx("claim"); toast("Werbe-Boost aktiv (Test)"); renderAll(true); return;
    case "mcard": modal(mcardModal(p[1])); sfx("tap"); return;
    case "resel": UI.resSlot = +p[1]; UI.page = "resel"; sfx("tap"); renderAll(true); return;
    case "rstart": { const ok = startRes(p[1], UI.resSlot); if (ok) { UI.page = "lab"; } return done(ok, "buy", "Forschung nicht möglich (Forschungspunkte?)"); }
    case "rskip": return done(finishRes(+p[1], true), "claim", "Nicht genug Edelsteine");
    case "labunl": return done(unlockLab(), "up", "Nicht genug Edelsteine");
    case "ult": return done(buyUlt(p[1]), "up", "Nicht genug Goldbarren");
    case "subup": { if (upSub(p[1], p[2])) { sfx("up"); renderAll(true); } else { sfx("tap"); toast("Dir fehlen Karten oder Forschungspunkte"); } return; }
    case "ostart": return done(startOrder(+p[1]), "buy", "Nicht genug Vorrat");
    case "oskip": { const r = claimOrder(+p[1], true); if (r) { sfx("claim"); toast("+" + fmt(r.cash) + " Geld, +" + r.rp + " FP"); renderAll(true); } else done(false, 0, "Nicht genug Edelsteine"); return; }
    case "oclaim": { const r = claimOrder(+p[1], false); if (r) { sfx("claim"); toast("+" + fmt(r.cash) + " Geld, +" + r.rp + " FP"); renderAll(true); } return; }
    case "pack": { const r = openPack(p[1], false); if (!r) { sfx("err"); toast("Nicht genug Edelsteine"); return; } sfx("pack"); packModal(r); renderAll(true); return; }
    case "freepack": { const r = freePack(); if (!r) { sfx("err"); toast("Gerade kein Gratis-Paket (lädt nach)"); return; } sfx("pack"); packModal(r); renderAll(true); return; }
    case "rppack": return done(buyRp(+p[1]), "claim", "Nicht genug Edelsteine");
    case "tboost": { const r = buyTimeBoost(+p[1]); if (r) toast("+" + fmt(r) + " Geld"); return done(!!r, "coin", "Nicht genug Edelsteine"); }
    case "eur": { const kind = p[1], id = p[2]; const ok = euroBuy(kind, id); if (ok) toast("Testmodus: Kauf gewährt"); return done(ok, "claim", "Testmodus ist aus"); }
    case "daily": { const r = claimDaily(); if (r) { sfx("claim"); toast("Tag " + r.day + ": +" + r.gems + " Edelsteine"); } renderAll(true); return; }
    case "pclaim": { const r = passClaim(p[1], +p[2]); if (!r) { sfx("tap"); return; } sfx("claim"); if (r.cards) packModal(r.cards); renderAll(true); return; }
    case "set": S.set[p[1]] = !S.set[p[1]]; if (p[1] === "music") auMusic(); sfx("tap"); renderAll(true); return;
    case "export": { saveGame(); const s = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); try { navigator.clipboard.writeText(s); toast("Spielstand kopiert"); } catch (e) { prompt("Spielstand:", s); } return; }
    case "import": { const s = prompt("Spielstand einfügen:"); if (!s) return; try { const o = JSON.parse(decodeURIComponent(escape(atob(s.trim())))); localStorage.setItem(SAVE_KEY, JSON.stringify(o)); location.reload(); } catch (e) { toast("Ungültiger Spielstand"); } return; }
    case "reset": modal("<h2>Neu anfangen?</h2><div class='muted'>Dein gesamter Fortschritt wird gelöscht.</div><div class='row' style='margin-top:12px'><button class='btn white sp' data-a='mclose'>Abbrechen</button><button class='btn red sp' data-a='reset2'>Löschen</button></div>"); return;
    case "reset2": resetGame(); closeModal(); UI.page = null; UI.dept = null; focusDept(null); renderAll(true); return;
  }
}

// ---------- Eingaben ----------
function canvasTap(x, y) {
  if (UI.page || UI.modal) return;
  const id = hitStall(x, y);
  if (id) { sfx("tap"); openDept(id); return; }
  const w = screenToWorld(x, y), L = R.L;
  if (L && w.y > L.lotTop - 6 && w.y < L.lotTop + L.prow * L.cellH + 6 && w.x > 6 && w.x < 354) { sfx("tap"); openPage("park"); return; }
  if (UI.dept) { UI.dept = null; focusDept(null); renderAll(true); }
}
document.addEventListener("pointerdown", e => {
  auInit();
  const t = e.target.closest && e.target.closest("[data-a]");
  UI.down = { a: t ? t.dataset.a : null, x: e.clientX, y: e.clientY, cv: e.target.id === "cv" }; UI.busy = true;
}, true);
document.addEventListener("pointerup", e => {
  UI.busy = false; const d = UI.down; UI.down = null; if (!d) return;
  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 14) return;
  if (d.cv) { canvasTap(e.clientX, e.clientY); return; }
  if (!d.a) return;
  const t = document.elementFromPoint(e.clientX, e.clientY), el = t && t.closest("[data-a]");
  if (!el || el.dataset.a !== d.a) return;
  act(d.a);
}, true);
document.addEventListener("pointercancel", () => { UI.busy = false; UI.down = null; }, true);
document.addEventListener("contextmenu", e => e.preventDefault());

// ---------- Start und Schleife ----------
let lastT = 0, accUI = 0, accSave = 0;
function frame(ts) {
  const dt = Math.min(0.1, (ts - lastT) / 1000 || 0.016); lastT = ts;
  tick(dt);
  drawFrame(dt, !!UI.page);
  accUI += dt; accSave += dt;
  if (questFlash) { toast(questFlash); sfx("quest"); questFlash = null; }
  if (accUI > 0.25 && !UI.busy) { accUI = 0; renderChrome(); renderLayer(false); }
  if (accSave > 5) { accSave = 0; saveGame(); }
  requestAnimationFrame(frame);
}
function onReturn() {
  if (!S) return;
  const o = applyOffline(); if (o) { S.last = nowMs(); welcomeModal(o); }
}
document.addEventListener("visibilitychange", () => { if (document.hidden) saveGame(); else onReturn(); });
addEventListener("pagehide", saveGame);

function startGame() {
  const loaded = loadGame(); if (!loaded) newState();
  calc(false);
  initRender($id("cv"));
  const o = loaded ? applyOffline() : null;
  renderAll(true);
  if (o) welcomeModal(o);
  else if (!S.seen.intro) { S.seen.intro = true; modal("<h2>Willkommen!</h2><div class='muted' style='font-size:16px'>Tippe auf eine Abteilung, um sie zu verbessern. Stelle Mitarbeiter ein, baue den Parkplatz aus und steige vom Kiosk bis zum Weltkonzern auf.<br><br>Im Testmodus gewähren die €- und Werbe-Buttons alles sofort.</div><button class='btn green wide' style='margin-top:12px' data-a='mclose'>Los geht's</button>"); }
  requestAnimationFrame(frame);
}
if (typeof window !== "undefined" && !window.__NOSTART) startGame();
