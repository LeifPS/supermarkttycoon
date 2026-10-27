"use strict";
// Oberfläche (HTML-Overlay über der Canvas-Szene): Icons, HUD, Abteilungs-Fenster, Verwaltung, Standorte
const UI = { page: null, tab: {}, dept: null, busy: false, down: null, scroll: {}, modal: null, toasts: [] };
const $id = id => document.getElementById(id);

// ---------- Icons (handgezeichnet, 24x24) ----------
const ICONS = {
  cash: '<rect x="2" y="6" width="20" height="12" rx="3" fill="#3fc05a"/><circle cx="12" cy="12" r="3.6" fill="#d6f7c8"/><path d="M5 9v.1M19 15v.1" />',
  gem: '<path d="M12 3l7 3 3 5-10 11L2 11l3-5z" fill="#ffb020"/><path d="M2 11h20M8.5 6.5L12 11l3.5-4.5M12 11v11" fill="none"/>',
  rp: '<path d="M12 2l8 4.5v9L12 22l-8-6.5v-9z" fill="#7a4ad0"/><path d="M12 7l4 2.2v4.6L12 16l-4-2.2V9.2z" fill="#b890ff"/>',
  gold: '<path d="M3 16l3-8h12l3 8-2 3H5z" fill="#f2b705"/><path d="M7 8l-1 6h12l-1-6" fill="#ffe680"/>',
  card: '<rect x="3" y="5" width="13" height="16" rx="3" fill="#7a4ad0" transform="rotate(-10 9 13)"/><rect x="8" y="3" width="13" height="16" rx="3" fill="#f2b705"/><path d="M14.5 8l1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3z" fill="#fffdf2"/>',
  flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 006.2 22h11.6a2 2 0 001.7-3.5L14 9V3" fill="#bfe6ff"/><path d="M7.4 16h9.2l2 3.4a1 1 0 01-.9 1.6H6.3a1 1 0 01-.9-1.6z" fill="#3a7ae0"/>',
  box: '<path d="M12 2.5l9 4.5v10l-9 4.5-9-4.5V7z" fill="#f2a050"/><path d="M3 7l9 4.5L21 7M12 11.5v10M7.5 4.8l9 4.5" fill="none"/>',
  hammer: '<path d="M3 20l9-9" fill="none" stroke-width="3.4"/><path d="M11 3l6 1 4 4-3 3-3-1-2 2-5-5 2-2z" fill="#9ab8f0"/>',
  chart: '<rect x="3" y="14" width="5" height="7" fill="#4fa84a"/><rect x="10" y="9" width="5" height="12" fill="#f2b705"/><rect x="17" y="4" width="5" height="17" fill="#e0303c"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#bfe6ff"/><path d="M9 4v14M15 6v14" fill="none"/><circle cx="14" cy="10" r="2.5" fill="#e0303c"/>',
  cart: '<path d="M2 4h3l3 11h11l2-8H6.5" fill="#bfe6ff"/><circle cx="9" cy="19.5" r="1.8" fill="#fffdf2"/><circle cx="18" cy="19.5" r="1.8" fill="#fffdf2"/>',
  clock: '<circle cx="12" cy="12" r="9.5" fill="#bfe6ff"/><path d="M12 6v6l4 2.5" fill="none" stroke-width="2.2"/>',
  mega: '<path d="M3 10v4h4l9 5V5L7 10z" fill="#e86aa8"/><path d="M19 9a4 4 0 010 6" fill="none" stroke-width="2"/>',
  star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#ffb020"/>',
  check: '<path d="M4 12.5l5 5L20 6" fill="none" stroke-width="3.4" stroke="#fff"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3" fill="#9aa0c0"/><path d="M8 10V7a4 4 0 018 0v3" fill="none" stroke-width="2.4"/>',
  play: '<circle cx="12" cy="12" r="10" fill="#fffdf2"/><path d="M10 7.5l6 4.5-6 4.5z" fill="#1d2742"/>',
  plus: '<path d="M12 4v16M4 12h16" fill="none" stroke-width="4.5" stroke="#fff"/>',
  left: '<path d="M15 5l-7 7 7 7" fill="none" stroke-width="3.4"/>',
  right: '<path d="M9 5l7 7-7 7" fill="none" stroke-width="3.4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke-width="4" stroke="#fff"/>',
  gear: '<circle cx="12" cy="12" r="3.2" fill="#fffdf2"/><path d="M12 2.5l1.8 2.6 3.1-.7.7 3.1 2.6 1.8-1.8 2.6.7 3.1-3.1.7-1.8 2.6-2.6-1.8-3.1.7-.7-3.1-2.6-1.8 1.8-2.6-.7-3.1 3.1-.7z" fill="#8a95a8"/><circle cx="12" cy="12" r="3.2" fill="#fffdf2"/>',
  kasse: '<rect x="3" y="11" width="18" height="9" rx="2" fill="#8a95a8"/><rect x="7" y="4" width="10" height="7" rx="1.5" fill="#cfe8ff"/>',
  kiste: '<path d="M12 2.5l9 4.5v10l-9 4.5-9-4.5V7z" fill="#f6d84a"/><path d="M3 7l9 4.5L21 7M12 11.5v10" fill="none"/>',
  wagen: '<path d="M2 4h3l3 11h11l2-8H6.5" fill="#9ae0f0"/><circle cx="9" cy="19.5" r="1.8" fill="#fffdf2"/><circle cx="18" cy="19.5" r="1.8" fill="#fffdf2"/>',
  leute: '<circle cx="8" cy="8" r="3.2" fill="#e86aa8"/><circle cx="16" cy="9" r="3" fill="#9a6ae0"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6zM13 20c0-3 2-5 4-5s5 2 5 5z" fill="#e86aa8"/>',
  uhr: '<circle cx="12" cy="12" r="9.5" fill="#bfe6ff"/><path d="M12 6v6l4 2.5" fill="none" stroke-width="2.2"/>',
  megafon: '<path d="M3 10v4h4l9 5V5L7 10z" fill="#e86aa8"/><path d="M19 9a4 4 0 010 6" fill="none" stroke-width="2"/>',
  boost: '<rect x="2" y="6" width="20" height="12" rx="3" fill="#3fc05a"/><path d="M12 15V8M8.5 11.5L12 8l3.5 3.5" fill="none" stroke="#fff" stroke-width="2.6"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9z" fill="#e0303c"/><circle cx="8" cy="8" r="1.6" fill="#fffdf2"/><path d="M10 16l5-5" fill="none" stroke="#fff" stroke-width="2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3" fill="#7a4ad0"/><path d="M8 3v4M16 3v4" stroke-width="2.6"/><path d="M12 10l1.4 2.9 3.1.4-2.3 2.1.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.1 3.1-.4z" fill="#fffdf2" stroke-width="1"/>',
  info: '<circle cx="12" cy="12" r="10" fill="#3a7ae0"/><path d="M12 11v6M12 7v.1" stroke="#fff" stroke-width="3"/>',
  ult: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#fffdf2"/>',
  person: '<circle cx="12" cy="8" r="4" fill="#3a7ae0"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7z" fill="#3a7ae0"/>',
  park: '<rect x="3" y="3" width="18" height="18" rx="4" fill="#3a7ae0"/><path d="M9 18V6h4.5a3.4 3.4 0 010 7H9" fill="none" stroke="#fff" stroke-width="3"/>',
};
function ico(n, s) { s = s || 24; return '<svg class="i" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" stroke="#1d2742" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">' + (ICONS[n] || "") + "</svg>"; }

// Porträt-Figuren (zufällige, aber feste Gesichter)
function portrait(key, bg, size, shirt) {
  const h = i => hs(key.length * 31 + key.charCodeAt(0), key.charCodeAt(key.length - 1), i);
  const skin = SKINS[(h(1) * 4) | 0], hair = ["#3a2a1a", "#8a4a1a", "#c8a050", "#1a1a1a", "#b0b0b8", "#a83a1a"][(h(2) * 6) | 0];
  const glasses = h(3) < 0.4, stache = h(4) < 0.3, long = h(5) < 0.5, hat = key === "back" || h(6) < 0.15;
  const sh = shirt || ["#3a7ae0", "#a83ad0", "#e0303c", "#2f9a9a", "#4fa84a"][(h(7) * 5) | 0];
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 60 60" style="display:block;background:' + bg + '" stroke="#1d2742" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">' +
    (long ? '<path d="M14 40V26c0-12 8-16 16-16s16 4 16 16v14z" fill="' + hair + '"/>' : "") +
    '<path d="M6 62c0-12 9-16 24-16s24 4 24 16z" fill="' + sh + '"/><path d="M26 46l4 6 4-6" fill="#fffdf2"/><rect x="26" y="38" width="8" height="9" fill="' + skin + '"/>' +
    '<ellipse cx="30" cy="28" rx="12.5" ry="14" fill="' + skin + '"/>' +
    (long ? "" : '<path d="M17.5 26c0-10 5-14 12.5-14s12.5 4 12.5 14c-3-6-8-8-12.5-8s-9.5 2-12.5 8z" fill="' + hair + '"/>') +
    (hat ? '<path d="M16 21c0-9 6-13 14-13s14 4 14 13z" fill="#fffdf2"/><rect x="15" y="20" width="30" height="4" rx="2" fill="#fffdf2"/>' : "") +
    '<circle cx="25" cy="29" r="1.6" fill="#1d2742" stroke="none"/><circle cx="35" cy="29" r="1.6" fill="#1d2742" stroke="none"/>' +
    '<path d="M25 35c2.5 3 7.5 3 10 0" fill="none"/>' + (stache ? '<path d="M23 33.5c3-2 5-1 7 0 2-1 4-2 7 0-3 2-5 1.5-7 .5-2 1-4 1.5-7-.5z" fill="' + hair + '"/>' : "") +
    (glasses ? '<circle cx="25" cy="29" r="4.4" fill="rgba(200,230,255,.5)"/><circle cx="35" cy="29" r="4.4" fill="rgba(200,230,255,.5)"/><path d="M29.4 29h1.2" fill="none"/>' : "") + "</svg>";
}
// Abteilungs-Symbol als SVG
function deptIcon(id, size) {
  const d = DEPT_BY[id], g = { obst: '<circle cx="12" cy="13" r="6" fill="#c24fb0"/><path d="M12 7c0-2 1-3 3-3" fill="none"/>', gemuese: '<path d="M12 21c-5-3-6-9-3-14 2 2 4 2 6 0 3 5 2 11-3 14z" fill="#4fa84a"/>', back: '<path d="M3 14c0-5 4-8 9-8s9 3 9 8c0 3-2 4-4 4H7c-2 0-4-1-4-4z" fill="#e8a050"/>', kuehl: '<rect x="7" y="8" width="10" height="13" rx="2" fill="#fff"/><rect x="9" y="3" width="6" height="5" fill="#3a9ae0"/>', tk: '<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10" fill="none" stroke="#4a6ae0"/>', fleisch: '<ellipse cx="12" cy="13" rx="8" ry="6" fill="#e86a6a"/><circle cx="16" cy="12" r="2" fill="#fff"/>', fein: '<rect x="6" y="8" width="12" height="13" rx="3" fill="#8a4ac8"/><rect x="8" y="4" width="8" height="4" fill="#f2b705"/>', elektro: '<rect x="3" y="5" width="18" height="12" rx="2" fill="#6a7a8a"/><rect x="5" y="7" width="14" height="8" fill="#8ae0ff"/><path d="M8 21h8" fill="none"/>' }[id];
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" stroke="#1d2742" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><circle cx="12" cy="12" r="12" fill="' + d.col2 + '" stroke="none"/>' + g + "</svg>";
}
function productIcon(id, size) { // größeres Produkt-Bild
  return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:#fffdf2;border:3px solid #d8dcf8;display:flex;align-items:center;justify-content:center">' + deptIcon(id, size * 0.7) + "</div>";
}

// ---------- Hilfen ----------
function canPay(c) { return S.money >= c; }
function priceBtn(act, cost, cls, extra) { return '<button class="btn ' + (cls || "green") + (canPay(cost) ? "" : " dis") + '" data-a="' + act + '">' + (extra || "") + ico("cash", 20) + "<span>" + fmtFull(cost) + "</span></button>"; }
function gemBtn(act, g, cls, label) { return '<button class="btn ' + (cls || "yel") + (S.gems >= g ? "" : " dis") + '" data-a="' + act + '">' + (label ? "<span>" + label + "</span>" : "") + ico("gem", 20) + "<span>" + fmtFull(g) + "</span></button>"; }
function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.textContent = t; $id("toasts").appendChild(d); setTimeout(() => d.remove(), 2300); }
function bar(v, max, txt, col) { return '<div class="pg"' + (col ? ' style="background:' + col + '"' : "") + '><i style="width:' + clamp(v / Math.max(1e-9, max) * 100, 0, 100) + '%"></i><b>' + (txt == null ? fmtFull(v) + "/" + fmtFull(max) : txt) + "</b></div>"; }
function modal(html, noClose) { UI.modal = html; $id("modal").innerHTML = '<div class="modal" data-a="' + (noClose ? "noop" : "mclose") + '"><div class="box" data-a="noop">' + html + "</div></div>"; }
function closeModal() { UI.modal = null; $id("modal").innerHTML = ""; }
function accent(c) { return c; }

// ---------- HUD, Quest-Leiste, Seitenleisten ----------
function renderChrome() {
  const boosted = nowMs() < S.boost.until;
  $id("hud").innerHTML =
    '<div class="pill">' + ico("cash", 30) + '<div class="col"><span>' + fmtFull(S.money) + "</span><small>" + ico("chart", 16) + " " + fmt(C.income) + " /min</small></div></div>" +
    '<div class="pill sm" data-a="open:lab">' + ico("rp", 22) + "<span>" + fmtFull(S.rp) + "</span></div>" +
    '<div class="pill sm" data-a="open:lab:ult">' + ico("gold", 22) + "<span>" + fmtFull(S.gold) + "</span></div>" +
    '<div class="pill gem" data-a="open:shop:gems">' + ico("gem", 26) + "<span>" + fmtFull(S.gems) + '</span><div class="plus">+</div></div>';
  const q = S.q, qh = q.list.map(x => '<div class="q"><span>' + x.txt + "</span>" + bar(questProg(x), x.target, null) + "</div>").join("");
  const rdy = chestReady();
  $id("quest").style.display = UI.page || UI.dept ? "none" : "";
  $id("quest").innerHTML = '<div class="bar"><i style="width:' + (q.done / 5 * 100) + '%"></i></div><div class="chest ' + (rdy ? "rdy" : "") + '" data-a="chest">' + ico("box", 36) + (rdy ? '<span class="dot">!</span>' : "") + '</div><div class="qs">' + qh + "</div>";
  const hide = UI.page || UI.dept;
  $id("sl").style.display = hide ? "none" : ""; $id("sr").style.display = hide ? "none" : ""; $id("sr2").style.display = hide ? "none" : ""; $id("bot").style.display = hide ? "none" : "";
  $id("sl").innerHTML = '<button class="ib" data-a="open:shop:perm">' + portrait("ceo", "#8ab8f0", 44) + '<span class="dot" style="background:#3fc05a">+</span></button>' +
    '<button class="ib" data-a="open:pass" style="width:64px;height:64px;background:linear-gradient(#5aa0ff,#3a5ce0)">' + portrait("passgirl", "#f2d070", 52, "#2a3a8a") + '<span class="dot">' + (S.pass.xp >= PASS_XP ? "!" : "") + '</span></button><div class="pill sm" style="justify-content:center;font-size:15px;background:#3a5ce0">' + fmtTime(passLeft()) + "</div>";
  $id("sr").innerHTML = '<button class="ib" data-a="open:map">' + ico("map", 34) + '</button><button class="ib" data-a="open:verw:stat">' + ico("chart", 34) + '</button><button class="ib sm" data-a="open:set">' + ico("gear", 28) + "</button>";
  $id("sr2").innerHTML = '<button class="ib" data-a="open:lab">' + ico("flask", 38) + (S.res.slots.some((x, i) => i < S.res.unl && !x) ? '<span class="dot">!</span>' : "") + '</button><button class="ib" data-a="open:orders">' + ico("box", 40) + '<span class="dot" style="background:#3a7ae0">' + Math.floor(S.ord.stock / 10) + "</span></button>";
  $id("bot").innerHTML = '<button class="ib" data-a="open:shop" style="background:#3a7ae0;width:64px;height:64px">' + ico("cart", 40) + (S.packs.free > 0 || dailyReady() ? '<span class="dot">!</span>' : "") + '</button><div class="grow"><div class="boost" style="display:inline-flex">' + ico("cash", 24) + "<span>x" + (boosted ? trimNum(2 * resVal("p_werb"), 1) : "1") + "</span><small>" + (boosted ? fmtTime((S.boost.until - nowMs()) / 1000) : "Inaktiv") + "</small></div></div>" +
    '<button class="ib" data-a="adboost">' + ico("boost", 38) + '</button><button class="ib" data-a="open:cards">' + ico("card", 38) + (Object.keys(S.mgr).some(id => S.mgr[id].lvl >= 1 && canUpMgr(id)) ? '<span class="dot">!</span>' : "") + '</button><button class="ib" data-a="open:verw">' + ico("hammer", 38) + "</button>";
}

// ---------- Abteilungs-Fenster (unteres Blatt) ----------
function deptSheet() {
  const id = UI.dept, d = DEPT_BY[id], dd = S.dept[id], st = C.depts[id], m = S.mgr[id];
  const prod = d.prod.filter(p => p[0] <= dd.lvl).pop() || d.prod[0];
  const nm = nextMilestone(dd.lvl), n = buyCount(id), mc = levelCostN(id, n), cap = lvlCap();
  const ids = Object.keys(S.dept), i = ids.indexOf(id);
  const next = MGR_MULT[Math.min(MGR_MAX, m.lvl + 1)];
  const gain = (() => { const keep = dd.lvl; const p0 = st.price; const p1 = deptPrice(id, keep + n) * mgrMult(id) * resVal("r_" + id) * C.gm; return Math.max(0, (p1 - p0) * Math.min(C.flow, st.cap)); })();
  const mile = dd.lvl >= cap ? "" : '<div class="bubble" style="flex:none;width:44%;padding:6px;background:#3a5ce0;color:#fff;border-radius:14px;text-align:center"><div style="background:#fffdf2;color:#3a5ce0;border-radius:10px;padding:2px;font-family:var(--f-display);font-size:13px">Multiplizieren ' + ico("cash", 14) + ' x2</div><div style="font-size:13px;margin:3px 0">Erreiche Stufe ' + nm + '!</div>' + gemBtn("skip:" + id, Math.ceil((nm - dd.lvl) * 0.7), "yel", "VERBESSERN") + "</div>";
  return '<div class="sheet" style="--hc:' + d.col + '">' +
    '<div class="tt"><button class="arr" data-a="dept:' + ids[(i + ids.length - 1) % ids.length] + '">' + ico("left", 20) + "</button><h1>" + d.name.toUpperCase() + '</h1><button class="arr" data-a="dept:' + ids[(i + 1) % ids.length] + '">' + ico("right", 20) + '</button><button class="arr" style="background:#ee4444" data-a="close">' + ico("x", 20) + "</button></div>" +
    '<div class="in"><div class="prod"><div class="row" style="align-items:flex-start">' + productIcon(id, 64) + '<div style="flex:1"><h3 style="font-size:24px">' + prod[1].toUpperCase() + '</h3><div class="muted">' + prod[2] + '</div></div></div>' +
    '<div class="row" style="margin-top:6px;align-items:stretch"><div style="flex:1;display:flex;flex-direction:column;justify-content:center">' + bar(dd.lvl, nm, dd.lvl + "", "#a0a8f0").replace('<b>' + dd.lvl + '</b>', '<b style="text-align:left;padding-left:8px">' + dd.lvl + '</b><b style="text-align:right;padding-right:8px">' + nm + "</b>") + "</div>" + mile + "</div>" +
    '<div class="stats"><div><small>EINKOMMEN</small>' + ico("chart", 26) + "<br>" + fmtFull(st.inc) + '</div><div><small>PREIS</small>' + ico("cash", 26) + "<br>" + fmtFull(st.price) + '</div><div><small>MITARBEITER</small>' + ico("person", 26) + "<br>" + dd.emp + "/4</div><div><small>VERARBEITEN</small>" + ico("clock", 26) + "<br>" + trimNum(st.T, 2) + "s</div></div></div>" +
    '<div class="mgr"><div class="pic" style="--bg:' + d.col + '">' + portrait(id, d.col, 56) + '</div><div style="flex:1"><div style="font-family:var(--f-display);font-size:20px">' + d.mgr + "</div>" +
    '<div class="row" style="font-size:14px"><span>' + ico("boost", 20) + " PREIS</span><b style='font-family:var(--f-display)'>x" + trimNum(MGR_MULT[m.lvl], 1) + " » x" + trimNum(next, 1) + "</b></div>" +
    '<div class="row" style="font-size:14px;color:' + (isAuto(id) ? "#6af07a" : "#cdd") + '"><span>' + ico("gear", 18) + " AUTOMATISIERUNG</span><i>" + (isAuto(id) ? "Aktiviert" : "Auf Stufe 2") + "</i></div></div>" +
    '<div style="width:128px;text-align:center">' + bar(m.cards, m.lvl >= MGR_MAX ? 1 : cardsNeed(m.lvl), m.cards + "/" + (m.lvl >= MGR_MAX ? "MAX" : cardsNeed(m.lvl)), "#4a4a9a") + '<button class="btn blue' + (canUpMgr(id) ? "" : " dis") + ' sm" style="margin-top:4px;width:100%" data-a="mup:' + id + '">VERBESSERN<br>' + ico("card", 16) + " " + cardsNeed(m.lvl) + " " + ico("rp", 16) + " " + mgrRpCost(m.lvl) + "</button></div></div>" +
    '<div class="chips">' + [1, 10, 100, 0].map(x => '<button class="chip' + (S.mode === x ? " on" : "") + '" data-a="mode:' + x + '">' + (x ? "x" + x : "Max") + "</button>").join("") + "</div>" +
    '<div class="tiles">' +
    '<div class="tile">' + ico("person", 38) + "MITARBEITER<br>+1" + (dd.emp >= 4 ? '<div class="btn green wide dis" style="background:#3fc05a">MAX.</div>' : priceBtn("hire:" + id, hireCost(id), "green").replace('class="btn', 'class="btn wide')) + "</div>" +
    '<div class="tile">' + ico("boost", 38) + "STUFENAUFSTIEG" + '<span class="pill" style="font-size:13px;padding:0 6px;color:#6af07a">' + ico("chart", 14) + " +" + fmtFull(gain) + "</span>" + (dd.lvl >= cap ? '<div class="btn wide dis">LIMIT ' + cap + "</div>" : priceBtn("lv:" + id, mc, "green").replace('class="btn', 'class="btn wide')) + "</div>" +
    '<div class="tile">' + ico("clock", 38) + "VERARBEITEN -2,5%" + (dd.proc >= 60 ? '<div class="btn wide dis">MAX.</div>' : priceBtn("proc:" + id, procCost(id), "green").replace('class="btn', 'class="btn wide')) + "</div></div>" +
    (isAuto(id) ? "" : '<div class="hint" style="color:#fff">Ohne Automatisierung arbeitet die Abteilung nur nach dem Antippen (30 s). Manager Stufe 2 automatisiert sie.</div>') +
    "</div></div>";
}

// ---------- Seiten ----------
function pageWrap(name, title, hc, body, tabs) {
  return '<div class="page" style="--hc:' + hc + '"><div class="top"><h1>' + title + '</h1><button class="x" data-a="close">' + ico("x", 22) + "</button>" + (tabs || "") + '</div><div class="scroll" data-sc="' + name + '">' + body + "</div></div>";
}
function tabsHtml(page, list, cur) { return '<div class="tabs">' + list.map(t => '<button class="tab' + (t[0] === cur ? " on" : "") + '" data-a="tab:' + page + ":" + t[0] + '">' + (t[2] ? ico(t[2], 22) : "") + t[1] + "</button>").join("") + "</div>"; }

function pageVerw() {
  const cur = UI.tab.verw || "geb";
  let b;
  if (cur === "geb") {
    b = '<div class="card row"><div style="width:70px">' + ico("map", 64) + '</div><div><h2>GEBÄUDE</h2><div class="muted">Hier kannst du die Abteilungen und Einrichtungen erweitern, um deinen Profit zu erhöhen.</div></div></div>';
    b += DEPTS.map(d => { const has = !!S.dept[d.id]; return '<div class="card row" ' + (has ? 'data-a="dept:' + d.id + '"' : "") + ">" + deptIcon(d.id, 54) + '<div class="sp"><h3>' + d.name.toUpperCase() + '</h3><div class="muted">' + (has ? "Stufe " + S.dept[d.id].lvl + " · " + fmtFull(C.depts[d.id].inc) + " /min" : "Wird im Standort „" + LOCS[d.loc].name + "“ freigeschaltet.") + "</div></div>" + (has ? '<div style="width:40px;height:40px;background:#5ed05a;border:3px solid var(--ink);border-radius:10px;display:flex;align-items:center;justify-content:center">' + ico("check", 28) + "</div>" : ico("lock", 36)) + "</div>"; }).join("");
    b += '<div class="card row" data-a="open:park">' + ico("park", 54) + '<div class="sp"><h3>PARKPLATZ</h3><div class="muted">Stufe ' + S.park.lvl + " · " + C.spots + " Plätze · " + trimNum(C.arrival, 1) + ' Kunden/min</div></div>' + ico("right", 28) + "</div>";
    b += '<div class="card row">' + ico("kasse", 54) + '<div class="sp"><h3>KASSEN</h3><div class="muted">' + S.kasse.n + "/" + locOf().maxKasse + " Kassen · " + trimNum(C.cashCap, 1) + " Kunden/min</div></div>" + (S.kasse.n >= locOf().maxKasse ? '<span class="btn dis">MAX.</span>' : priceBtn("kasse", kasseCost(), "green", "")) + "</div>";
  } else {
    b = '<div class="card"><div class="row"><div style="width:70px">' + ico("chart", 64) + '</div><div><h2 style="margin:0">STATISTIK</h2><div class="muted">Hier siehst du den Gesamtstatus deines Supermarkts. Unten werden die Durchschnittswerte angezeigt.</div></div></div>' +
      [["GEWINN PRO KUNDE", fmtFull(C.perCust), "#3fb04a", "cash"], ["KUNDEN KAUFEN", trimNum(C.flow, 0), "#3a8ae8", "leute"], ["KUNDENKAPAZITÄT", trimNum(C.cashCap, 0) + "/min", "#3a8ae8", "leute"], ["PARKPLATZNUTZUNG", Math.round(C.parkUse * 100) + " %", "#e82020", "park"], ["DURCHSCHN. KASSENSCHLANGE", C.queue, "#e82020", "leute"], ["DURCHSCHN. KASSENWARTEZEIT", trimNum(C.wait, 2) + " s", "#e82020", "kasse"]].map(x => '<div style="background:' + x[2] + ';border-radius:12px;color:#fff;font-family:var(--f-display);padding:5px 12px;margin-top:6px;display:flex;justify-content:space-between;align-items:center;border:2px solid var(--ink)"><span>' + x[0] + "</span><span>" + ico(x[3], 20) + " " + x[1] + "</span></div>").join("") + "</div>";
    let best = null, worst = null; for (const id in C.depts) { if (!best || C.depts[id].inc > C.depts[best].inc) best = id; if (!worst || C.depts[id].inc < C.depts[worst].inc) worst = id; }
    b += Object.keys(S.dept).map(id => { const d = DEPT_BY[id], s = C.depts[id], dd = S.dept[id], pr = d.prod.filter(p => p[0] <= dd.lvl).pop(); return '<div class="card row">' + '<div style="text-align:center"><div style="background:#3a4ad0;color:#fff;border-radius:12px;font-family:var(--f-display);padding:0 10px">' + dd.lvl + "</div>" + deptIcon(id, 50) + '</div><div class="sp"><div><b style="font-family:var(--f-display);font-size:19px;color:#3a4ad0">' + d.name.toUpperCase() + "</b> " + pr[1] + '</div><div class="muted">Wert: ' + fmtFull(s.price) + "<br>Profite: " + fmtFull(s.inc) + "/min<br>Kundenkapazität: " + trimNum(s.cap, 1) + "/min</div></div>" + (id === best ? '<div style="color:#e89a3a;font-family:var(--f-display);text-align:center;font-size:14px">' + ico("star", 34) + "<br>BESTE<br>ABTEILUNG!</div>" : id === worst && Object.keys(S.dept).length > 2 ? '<div style="color:#e03030;font-family:var(--f-display);text-align:center;font-size:14px">!<br>WENIGER<br>PROFITABEL</div>' : "") + "</div>"; }).join("");
  }
  return pageWrap("verw", "VERWALTUNG", "#3a5ce0", b, tabsHtml("verw", [["geb", "GEBÄUDE", "hammer"], ["stat", "STATISTIK", "chart"]], cur));
}

function pagePark() {
  const loc = locOf();
  const b = '<div class="card"><div class="row" style="align-items:flex-start">' + ico("park", 80) + '<div style="flex:1"><div class="row"><h2 style="margin:0">PARKPLATZ</h2><span class="sp"></span><span class="pill" style="font-size:14px">STUFE ' + S.park.lvl + '</span></div><div class="muted">Die Anzahl der Leute, die deinen Supermarkt besuchen können, hängt von der Größe des Parkplatzes ab. Verbessere ihn, um mehr Kunden zu bekommen.</div></div></div>' +
    '<div class="row ctr" style="justify-content:space-around;margin-top:8px"><div><small style="color:#e89a3a;font-family:var(--f-display)">PARKMÖGLICHKEITEN</small><br>' + ico("park", 40) + "<br><b style='font-family:var(--f-display);color:#e89a3a;font-size:22px'>" + C.spots + "</b></div><div><small style='color:#3a7ae0;font-family:var(--f-display)'>AUFFAHRT</small><br>" + ico("clock", 40) + "<br><b style='font-family:var(--f-display);color:#3a7ae0;font-size:22px'>" + trimNum(C.arrival, 1) + "/min</b></div></div></div>" +
    '<div class="card row">' + ico("boost", 52) + '<div class="sp"><h3>PARKEN VERBESSERN</h3><div class="muted">Verbessere den Parkplatz mit 6 weiteren Parkplätzen.</div></div>' + (S.park.lvl >= loc.maxPark ? '<span class="btn dis">MAX.</span>' : priceBtn("park", parkCost(), "green")) + "</div>" +
    '<div class="card"><div class="row">' + ico("chart", 52) + '<div class="sp"><h3>WERBUNG</h3><div class="muted">Erhöht die Anzahl der Kunden, die deinen Supermarkt aufsuchen, um +2/min.</div></div>' + (S.park.ad >= loc.maxAd ? '<span class="btn dis">MAX.</span>' : priceBtn("ad", adCost(), "green")) + '</div><div class="row" style="margin-top:6px"><div style="flex:1">' + bar(S.park.ad, loc.maxAd, S.park.ad + "") + "</div><b style='font-family:var(--f-display);color:#2a9a3a'>" + trimNum(C.arrival, 1) + "/min</b></div></div>" +
    '<div class="hint">Stufenlimit in diesem Standort: ' + loc.maxPark + " Parkplatz-Stufen, " + loc.maxAd + " Werbe-Stufen.</div>";
  return pageWrap("park", "PARKPLATZ", "#5a88e8", b);
}

function pageMap() {
  const b = LOCS.map((l, i) => {
    const owned = i <= S.loc, nxt = i === S.loc + 1;
    const deps = DEPTS.filter(d => d.loc === i).map(d => d.name).join(", ") || "Obst, Gemüse";
    return '<div class="card" style="' + (owned ? "" : "opacity:" + (nxt ? 1 : 0.7)) + '"><div style="height:96px;border-radius:12px;border:2.5px solid var(--ink);margin-bottom:6px;background:' + l.ground + ';display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">' + locThumb(i) + "</div>" +
      '<div class="row"><div class="sp"><h2 style="margin:0">' + l.name.toUpperCase() + "</h2><div class='muted'>" + l.desc + "</div></div></div>" +
      '<div class="row" style="margin-top:6px"><span class="pill" style="font-size:15px;background:#3a4a80">Gewinn ' + ico("cash", 16) + " x" + l.mult + "</span><span class='muted sp'>Neu: " + deps + "</span>" +
      (owned ? '<span class="btn dis" style="background:#3fb04a">' + ico("check", 20) + " AKTIV</span>" : nxt ? priceBtn("loc", l.cost, "green", "VERBESSERN ") : '<span class="btn dis">' + ico("lock", 18) + " " + fmt(l.cost) + "</span>") + "</div></div>";
  }).join("");
  return pageWrap("map", "STANDORTE", "#3a5ce0", b);
}
function locThumb(i) {
  const l = LOCS[i], k = i;
  let o = '<rect x="0" y="0" width="360" height="170" fill="url(#thsky' + i + ')"/>';
  const sky = SKY[i];
  const g = '<defs><linearGradient id="thsky' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs>';
  o += rect(0, 100, 360, 70, ["#cfe3a0", "#d9e8a8", "#c8dfa0", "#a8b4c4", "#232c50"][i], { sw: 0, nostroke: 1 });
  if (i === 4) for (let q = 0; q < 14; q++) o += rect(q * 26, 20 + (q % 3) * 14, 20, 90 - (q % 3) * 14, "#2a3a6a", { sw: 1.6 });
  if (i === 3) for (let q = 0; q < 9; q++) o += rect(q * 40, 30 + (q % 3) * 12, 32, 80 - (q % 3) * 12, "#98a8c4", { sw: 1.6 });
  const bw = [220, 250, 290, 310, 320][i], bx = (360 - bw) / 2, top = [70, 56, 58, 28, 22][i];
  o += rect(bx, top + 14, bw, 112 - top, l.wall, { sw: 2.6 }) + rect(bx + 8, 78, bw - 16, 46, l.floor, { sw: 1.8 });
  o += i === 1 ? shp([[bx - 8, top + 18], [bx + bw + 8, top + 18], [bx + bw - 30, top - 8], [bx + 30, top - 8]], l.roof, { sw: 2.4 }) : rect(bx - 8, top, bw + 16, 22, l.roof, { sw: 2.4 });
  if (i === 0) for (let q = 0; q < 8; q++) o += rect(bx - 8 + q * (bw + 16) / 8, top, (bw + 16) / 16, 22, "#fffdf2", { sw: 0, nostroke: 1 });
  o += rect(bx + bw / 2 - 52, top - 8, 104, 22, "#fffdf2", { sw: 2 }) + txt(bx + bw / 2, top + 9, l.sign, 17, INK);
  for (let q = 0; q < Math.min(8, 2 + i * 2); q++) o += rect(bx + 14 + q * ((bw - 40) / Math.min(8, 2 + i * 2)), 86, 16, 32, [DEPTS[q % 8].col2][0], { sw: 1.6 });
  o += rect(10, 134, 340, 30, l.lot, { sw: 2 });
  for (let q = 0; q < 7; q++) o += '<g transform="translate(' + (36 + q * 46) + ' 149) scale(.75)">' + carTop(CAR_COLS[(q + i * 3) % 10], "car") + "</g>";
  return '<svg width="100%" height="96" viewBox="0 0 360 170" preserveAspectRatio="xMidYMid slice" style="display:block">' + g + o + "</svg>";
}
