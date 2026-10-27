"use strict";
// Weitere Seiten: Manager/Karten, Labor, Bestellungen, Shop, Pass, Einstellungen
function packArt(type, size) {
  const p = PACKS[type], c = p.col;
  return '<svg width="' + size + '" height="' + size * 1.25 + '" viewBox="0 0 48 60" stroke="#1d2742" stroke-width="2.4" stroke-linejoin="round"><rect x="5" y="3" width="38" height="54" rx="5" fill="' + c[0] + '"/><path d="M5 12h38M5 48h38" stroke-dasharray="3 3" fill="none"/><path d="M5 40L43 16v10L5 50z" fill="' + c[1] + '" stroke="none" opacity=".7"/><circle cx="24" cy="30" r="11" fill="#fffdf2"/><path d="M24 22l2.6 5.4 5.4.8-4 3.8 1 5.5-5-2.7-5 2.7 1-5.5-4-3.8 5.4-.8z" fill="' + c[1] + '" stroke-width="1.6"/></svg>';
}
const GRP_TABS = [["reg", "REGULÄR", "person"], ["eng", "INGENIEURE", "star"], ["leg", "LEGENDÄR", "star"]];

// ----- Karten / Manager -----
function mgrCard(m) {
  const s = S.mgr[m.id], lv = s.lvl, off = lv < 1, need = cardsNeed(Math.max(1, lv));
  const eff = m.grp === "reg" ? "x" + trimNum(MGR_MULT[lv], 1) : "LVL " + lv;
  return '<div class="mc' + (off ? " off" : "") + '" data-a="mcard:' + m.id + '"><div class="pt" style="background:' + m.col + '">' + portrait(m.id, m.col, 96) + (off ? "" : '<span class="lv">LVL ' + lv + "</span>") + (m.grp === "reg" && !off ? '<div class="eff">' + ico("boost", 20) + "x" + trimNum(MGR_MULT[lv], 1) + "</div>" : "") + '</div><div class="nm">' + m.name.toUpperCase() + '</div><div class="cb">' + bar(s.cards, lv >= MGR_MAX ? 1 : need, s.cards + "/" + (lv >= MGR_MAX ? "MAX" : need), "#4a4a9a") + "</div></div>";
}
function pageCards() {
  const cur = UI.tab.cards || "reg";
  const list = MGRS.filter(m => m.grp === cur && (m.grp !== "reg" || S.dept[m.dept] || true));
  const on = list.filter(m => S.mgr[m.id].lvl >= 1), off = list.filter(m => S.mgr[m.id].lvl < 1);
  let b = '<div class="card" style="background:#fff;padding:6px 10px"><h2>' + (cur === "reg" ? "EINGESTELLT" : "AKTIV") + "</h2>" + (on.length ? '<div class="grid">' + on.map(mgrCard).join("") + "</div>" : '<div class="muted ctr" style="padding:14px">Noch niemand. Hol dir Kartenpakete!</div>') + "</div>";
  b += '<div class="card" style="background:#2a3458;color:#fff"><h2 style="color:#fff">NICHT EINGESTELLT</h2>' + (off.length ? '<div class="grid">' + off.map(mgrCard).join("") + "</div>" : '<div class="ctr">Alle eingestellt!</div>') + '<div class="ctr" style="margin-top:10px"><button class="btn blue" data-a="open:shop:cards">' + ico("cart", 24) + " MEHR ERHALTEN</button></div></div>";
  return pageWrap("cards", "MANAGERS", "#2a6af0", b, tabsHtml("cards", GRP_TABS, cur));
}
function mcardModal(id) {
  const m = MGR_BY[id], s = S.mgr[id], lv = s.lvl, d = m.dept ? DEPT_BY[m.dept] : null;
  const effect = m.grp === "reg" ? "Preis x" + trimNum(MGR_MULT[lv], 1) + " » x" + trimNum(MGR_MULT[Math.min(MGR_MAX, lv + 1)], 1) + (lv >= 2 ? "<br>Automatisierung aktiv" : "<br>Automatisierung auf Stufe 2") : m.role;
  return '<h2>' + m.name + "</h2><div class='muted'>" + (d ? d.name + "-Manager" : m.role) + '</div><div style="display:flex;justify-content:center;margin:10px 0"><div class="pic" style="width:110px;height:110px;--bg:' + m.col + '">' + portrait(m.id, m.col, 110) + "</div></div>" +
    (lv < 1 ? '<div class="muted">Noch nicht eingestellt. Ziehe seine Karte aus einem Kartenpaket.</div>' : '<div style="font-family:var(--f-display);font-size:20px">Stufe ' + lv + "</div><div style='margin:6px 0'>" + effect + "</div>" + bar(s.cards, lv >= MGR_MAX ? 1 : cardsNeed(lv), s.cards + "/" + (lv >= MGR_MAX ? "MAX" : cardsNeed(lv)), "#4a4a9a") +
      (lv >= MGR_MAX ? "" : '<button class="btn blue wide' + (canUpMgr(id) ? "" : " dis") + '" style="margin-top:10px" data-a="mup:' + id + '">VERBESSERN ' + ico("card", 20) + " " + cardsNeed(lv) + " " + ico("rp", 20) + " " + mgrRpCost(lv) + "</button>")) +
    '<button class="btn white wide" style="margin-top:8px" data-a="mclose">Schließen</button>';
}

// ----- Labor -----
function resIcon(r, s) { return r.dept ? deptIcon(r.dept, s) : '<div style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:#fffdf2;border:2.5px solid var(--ink);display:flex;align-items:center;justify-content:center">' + ico(r.icon, s * 0.65) + "</div>"; }
function pageLab() {
  const cur = UI.tab.lab || "res", slots = S.res.slots;
  let b = "";
  if (cur === "res") {
    if (!S.seen.offer_o_labor) b += '<div class="ban" style="background:linear-gradient(180deg,#2a50c0,#1a2a80)"><h2 style="color:#ffd040">LABOR-GRÜNDERPAKET</h2><div class="it"><span>+1 Forschungsslot</span><span>x2 Geschwindigkeit</span><span>800 Edelsteine</span></div><div class="row"><span class="sp" style="font-size:14px">DAUERHAFTE UPGRADES UND EDELSTEINE!</span><button class="btn" data-a="eur:offer:o_labor">17,99 €</button></div></div>';
    for (let i = 0; i < 5; i++) {
      const x = slots[i], un = i < S.res.unl;
      let inner;
      if (un && x) { const r = RES_BY[x.id], left = Math.max(0, (x.end - nowMs()) / 1000), tot = (x.end - x.start) / 1000; inner = '<div class="row">' + resIcon(r, 54) + '<div class="sp"><h3>' + r.name + "</h3><div class='muted'>" + resText(r, resLv(x.id)) + "</div>" + bar(tot - left, tot, fmtTime(left)) + '</div></div><div style="margin-top:6px">' + gemBtn("rskip:" + i, resGemSkip(i), "yel", "JETZT ABSCHLIEßEN").replace('class="btn', 'class="btn wide') + "</div>"; }
      else if (un) inner = '<div class="row"><div class="pic" style="background:#bcd4f4;display:flex;align-items:center;justify-content:center;border-color:#9ab">' + ico("plus", 34) + '</div><div class="sp"><h3>Labor verfügbar</h3><div class="muted">Wähle eine Forschung aus</div></div><button class="btn pur" data-a="resel:' + i + '">WÄHLE EINE FORSCHUNG</button></div>';
      else if (i === 4) inner = '<div class="row"><div class="pic" style="background:#f2b705;display:flex;align-items:center;justify-content:center">' + ico("lock", 34) + '</div><div class="sp"><h3>Labor 5 freischalten</h3><div class="muted">Schalte das Labor frei und schaffe Platz für neue Forschung</div></div><button class="btn" data-a="eur:lab5">' + ico("cart", 20) + " PREMIUM HOLEN</button></div>";
      else { const c = LAB_UNLOCK[S.res.unl]; inner = '<div class="row"><div class="pic" style="background:#9aa0c0;display:flex;align-items:center;justify-content:center">' + ico("lock", 34) + '</div><div class="sp"><h3>Labor ' + (i + 1) + ' freischalten</h3><div class="muted">Schalte das Labor frei und schaffe Platz für neue Forschung</div></div>' + (i === S.res.unl ? gemBtn("labunl", c, "yel") : '<span class="btn dis">' + ico("lock", 18) + "</span>") + "</div>"; }
      b += '<div class="card" style="' + (i === 4 ? "background:#ffe9a0" : "") + '"><span class="pill sm" style="position:absolute;top:-12px;left:10px;font-size:14px;padding:1px 8px">' + ico("flask", 16) + " Labor " + (i + 1) + "</span>" + inner + "</div>";
    }
    b += '<div class="card"><h2>LABOR-MANAGER</h2><div class="grid">' + LAB_MGRS.map(m => subCard("lab", m)).join("") + '</div><div class="ctr" style="margin-top:8px"><button class="btn blue" data-a="open:shop:cards">' + ico("cart", 22) + " MEHR ERHALTEN</button></div></div>";
  } else {
    b += '<div class="card row">' + ico("gold", 56) + '<div><h2 style="margin:0">ULTIMATIV</h2><div class="muted">Mit Goldbarren kaufst du dauerhafte, starke Upgrades. Goldbarren gibt es bei Quest-Truhen, täglichen Belohnungen und im Pass.</div></div></div>';
    b += ULTS.map(u => { const l = S.ult[u.id] || 0, c = ultCost(u); return '<div class="card row"><div class="pic" style="background:#f2b705;display:flex;align-items:center;justify-content:center">' + ico("ult", 34) + '</div><div class="sp"><h3>' + u.name + " · St. " + l + "/" + u.max + "</h3><div class='muted'>" + u.desc + "</div></div>" + (l >= u.max ? '<span class="btn dis">MAX.</span>' : '<button class="btn' + (S.gold >= c ? "" : " dis") + '" data-a="ult:' + u.id + '">' + ico("gold", 20) + " " + c + "</button>") + "</div>"; }).join("");
  }
  return pageWrap("lab", "LABOR", "#3a8ae8", b, tabsHtml("lab", [["res", "Forschung", "flask"], ["ult", "Ultimativ", "star"]], cur));
}
function subCard(grp, m) {
  const lv = subLvl(grp, m.id), cards = subCards(grp, m.id), need = cardsNeed(Math.max(1, lv)), col = grp === "lab" ? "#2fc0a0" : "#e8603a";
  return '<div class="mc' + (lv < 1 ? " off" : "") + '" data-a="subup:' + grp + ":" + m.id + '"><div class="pt" style="background:' + col + '">' + portrait(m.id, col, 96) + (lv ? '<span class="lv">LVL ' + lv + "</span>" : "") + '</div><div class="nm" style="font-size:12px">' + m.name.toUpperCase() + '</div><div class="muted" style="font-size:11px;padding:2px">' + m.role + '</div><div class="cb">' + bar(cards, need, cards + "/" + need, "#4a4a9a") + "</div></div>";
}
function pageResel() {
  const slot = UI.resSlot, av = resAvailable(), running = id => S.res.slots.some(x => x && x.id === id);
  const card = r => { const L = resLv(r.id), c = resCost(r.id), t = resTime(r.id); return '<div class="card" style="padding:8px;margin:0" data-a="rstart:' + r.id + '"><div class="row" style="align-items:flex-start">' + resIcon(r, 44) + '<div><h3 style="font-size:17px">' + r.name + '</h3><div style="color:#3a7ae0;font-family:var(--f-display);font-size:15px">St. ' + (L + 1) + '</div></div></div><div class="muted" style="font-size:13px;min-height:30px">' + r.desc + '</div><span class="pill" style="font-size:14px;padding:1px 8px;background:#1d3a8a">' + resText(r, L) + '</span><div class="row" style="margin-top:6px"><span style="font-family:var(--f-display);color:#3a7ae0">' + ico("clock", 18) + " " + fmtTime(t) + '</span><span class="sp"></span><span class="btn sm' + (S.rp >= c && !running(r.id) ? " pur" : " dis") + '">' + ico("rp", 18) + " " + c + "</span></div></div>"; };
  const b = '<div class="card" style="background:#2a7af0;border-radius:18px"><h2 style="color:#fff;text-align:center;justify-content:center;font-size:28px">HAUPTFORSCHUNG</h2><div class="grid2">' + av.filter(r => r.grp === "main").map(card).join("") + '</div></div><div class="card" style="background:#2a7af0"><h2 style="color:#fff;text-align:center;justify-content:center;font-size:28px">PERSONALFORSCHUNG</h2><div class="grid2">' + av.filter(r => r.grp === "pers").map(card).join("") + '</div></div><div class="hint">Schließe Forschungen ab, um deinen Laden effizienter und profitabler zu machen!</div>';
  return pageWrap("resel", "FORSCHUNG", "#2a7af0", b);
}

// ----- Bestellungen -----
function pageOrders() {
  const o = S.ord, mx = stockMax(), per = 56 * (1 - Math.min(0.6, ordBonus("speed")));
  let b = '<div class="card" style="background:#fffdf2"><div class="row">' + ico("box", 84) + '<div class="sp"><h2 style="margin:0;font-size:30px">Vorrat</h2><div class="muted">Aufstocken, um Bestellungen zu erfüllen!</div></div><div class="pill" style="background:#3a7ae0;font-size:16px;flex-direction:column;gap:0">' + ico("box", 20) + " +" + (2 + ordBonus("stock")) + "<small style='color:#fff;font-size:12px'>" + fmtTime(per - o.acc) + "</small></div></div>" + bar(o.stock, mx) + "</div>";
  b += '<div class="card" style="background:#2a3458;color:#fff;padding:8px"><div class="grid" style="grid-template-columns:repeat(4,1fr);gap:6px">' + ORD_MGRS.map(m => { const lv = S.ord.mlv[m.id]; return '<div class="ctr" data-a="subup:ord:' + m.id + '"><div class="pic" style="width:100%;height:auto;border-radius:12px;' + (lv ? "" : "filter:grayscale(1) brightness(.7)") + '">' + portrait(m.id, "#e8603a", 72) + '</div><div style="background:rgba(255,255,255,.12);border-radius:10px;font-family:var(--f-display);font-size:14px;margin-top:3px;padding:2px">' + (lv ? "LVL " + lv : "—") + "</div><div style='font-size:11px;line-height:1.05'>" + m.role + "</div></div>"; }).join("") + '</div><div class="ctr" style="margin-top:8px"><button class="btn blue sm" data-a="open:shop:cards">' + ico("cart", 20) + " MEHR ERHALTEN</button></div></div>";
  b += o.list.map((x, i) => {
    const left = orderLeft(x), run = !!x.start, done = run && left <= 0, cash = x.cashMin * Math.max(60, C.income) * (1 + ordBonus("cash")), rp = Math.round(x.rp * (1 + ordBonus("rp")) + labBonus("rp"));
    return '<div class="card"><div class="row" style="justify-content:center;gap:24px"><div class="ctr">' + ico("rp", 56) + '<br><b style="font-family:var(--f-display);color:#7a4ad0;font-size:20px">' + rp + '</b></div><div class="ctr">' + ico("cash", 56) + '<br><b style="font-family:var(--f-display);color:#2a9a3a;font-size:20px">' + fmt(cash) + '</b></div><div class="ctr">' + ico("box", 40) + '<br><b style="font-family:var(--f-display);font-size:18px">' + x.need + "</b></div></div>" +
      (run ? bar(x.dur - left, x.dur, done ? "FERTIG" : fmtTime(left)) : '<div class="pg" style="background:#1d3a8a"><b>' + ico("clock", 14) + " " + fmtTime(x.dur) + "</b></div>") +
      '<div style="margin-top:8px">' + (done ? '<button class="btn green wide" data-a="oclaim:' + i + '">ABHOLEN</button>' : run ? gemBtn("oskip:" + i, orderSkipGems(x), "yel", "JETZT ABSCHLIEßEN").replace('class="btn', 'class="btn wide') : '<button class="btn wide' + (o.stock >= x.need ? " blue" : " dis") + '" data-a="ostart:' + i + '">' + ico("box", 20) + " STARTEN · " + x.need + " Vorrat</button>") + "</div></div>";
  }).join("");
  return pageWrap("orders", "Bestellungen", "#2a3458", b);
}

// ----- Shop -----
const SHOP_TABS = [["offers", "tag"], ["pass", "cal"], ["boost", "clock"], ["cards", "card"], ["gems", "gem"]];
function pageShop() {
  const cur = UI.tab.shop || "offers";
  let b = "";
  if (cur === "offers") {
    b += dailyReady() ? '<div class="ban" style="background:linear-gradient(180deg,#3fc05a,#2a8a3a)"><h2>TÄGLICHES GESCHENK</h2><div class="ctr" style="padding-bottom:6px"><button class="btn" data-a="daily">' + ico("gem", 22) + " ABHOLEN</button></div></div>" : '<div class="card ctr muted">Tägliches Geschenk abgeholt. Serie: ' + S.daily.day + " Tag(e)</div>";
    b += OFFERS.map(o => '<div class="ban"><h2>' + o.name.toUpperCase() + '</h2><div class="it">' + o.items.map(t => "<span>" + t + "</span>").join("") + '</div><div class="ctr"><button class="btn" data-a="eur:offer:' + o.id + '">' + o.eur + "</button></div></div>").join("");
  } else if (cur === "pass") {
    b += passBanner("prem", "PREMIUM-PASS", "17,99 €", "x10 Wert", ["x1", "30m", "+1", "60"], "PREMIUM-PREISE UND -QUESTS!") + passBanner("elite", "ELITE-PASS", "29,99 €", "x40 Wert", ["x3", "1h", "+1", "120"], "ELITE-PREISE UND -QUESTS!");
    b += '<div class="card"><h2>' + ico("cal", 34) + ' PERMANENTE UPGRADES</h2><div class="grid2">' + PERMS.map(p => '<div class="mc"><div class="pt" style="background:#a8b0f8;height:110px">' + (p.id === "ceo" ? portrait("ceo", "#8ab8f0", 100) : '<div style="padding-bottom:10px">' + ico("star", 90) + "</div>") + '</div><div class="nm" style="color:#fff;background:#6a6ad0">' + p.name.toUpperCase() + '</div><div class="cb" style="background:#2a3458;color:#fff;font-size:13px;line-height:1.1;padding:6px">' + p.desc + '</div><div style="padding:6px;background:#fffdf2">' + (S.perm[p.id] ? '<span class="btn dis" style="background:#3fb04a">' + ico("check", 18) + " GEKAUFT</span>" : '<button class="btn wide" data-a="eur:perm:' + p.id + '">' + p.eur + "</button>") + "</div></div>").join("") + "</div></div>";
  } else if (cur === "boost") {
    b += '<div class="card"><h2>ZEIT-BOOSTS</h2><div class="muted">Springe direkt in die Zukunft: du bekommst sofort die Einnahmen für diese Zeit.</div><div class="grid" style="margin-top:8px">' + TIME_BOOSTS.map((t, i) => '<div class="ctr"><b style="font-family:var(--f-display);color:#3a4ad0;border-bottom:3px solid #3a4ad0">' + t.h + " STUNDEN</b><div style='font-family:var(--f-display);color:#2a9a3a'>" + ico("cash", 16) + " " + fmtFull(moneyHours(t.h)) + '</div><div style="margin:4px 0">' + ico("clock", 70) + "</div>" + gemBtn("tboost:" + i, t.gems, "yel") + "</div>").join("") + "</div></div>";
    b += '<div class="card row">' + ico("boost", 56) + '<div class="sp"><h3>WERBE-BOOST</h3><div class="muted">Gewinne x' + trimNum(2 * resVal("p_werb"), 1) + " für 4 Minuten. Im Testmodus ohne Werbung.</div></div><button class='btn blue' data-a='adboost'>" + ico("play", 22) + " GRATIS</button></div>";
  } else if (cur === "cards") {
    const free = S.packs.free > 0;
    b += '<div class="card"><h2>' + ico("card", 34) + ' KARTENPAKETE</h2><div class="packs">' + [["basis", "BASISPAKET", "#3a4ad0"], ["fort", "FORTGESCHRITTENES PAKET", "#e89a3a"], ["prem", "PREMIUM-PAKET", "#a83ad0"]].map(p => '<div class="pk" style="--ac:' + p[2] + '"><b style="font-size:' + (p[0] === "fort" ? 11 : 14) + 'px">' + p[1] + "</b><div style='position:relative'>" + packArt(p[0], 64) + (p[0] === "basis" ? '<span class="pill sm" style="position:absolute;left:8px;bottom:0;font-size:15px;background:#fffdf2;color:var(--ink)">' + S.packs.free + "/5</span>" : "") + "</div>" + (p[0] === "basis" ? '<button class="btn blue sm' + (free ? "" : " dis") + '" data-a="freepack">' + ico("play", 18) + " GRATIS</button>" : gemBtn("pack:" + p[0], PACKS[p[0]].gems, "yel")) + "</div>").join("") +
      "</div><h2 style='margin-top:10px'>SPEZIELLE MANAGER</h2><div class='packs' style='justify-content:center;gap:24px'>" + [["labor", "LABOR", "#2fa0e0"], ["order", "BESTELLUNGEN", "#e8603a"]].map(p => '<div class="pk" style="--ac:' + p[2] + ';flex:none"><b style="color:' + p[2] + '">' + p[1] + "</b>" + packArt(p[0], 64) + gemBtn("pack:" + p[0], PACKS[p[0]].gems, "yel") + "</div>").join("") + "</div>" +
      "<h2 style='margin-top:10px'>FORSCHUNGSPUNKTE</h2><div class='packs'>" + RP_PACKS.map((p, i) => '<div class="pk"><b>' + p.rp + " FP</b>" + ico("rp", 56) + gemBtn("rppack:" + i, p.gems, "yel") + "</div>").join("") + "</div></div>";
  } else {
    b += '<div class="card"><h2>' + ico("gem", 34) + " EDELSTEINE</h2><div class='grid'>" + GEM_PACKS.map(p => '<div class="ctr"><b style="font-family:var(--f-display);color:#e89a3a;font-size:20px">' + fmtFull(p.gems) + '</b><div>' + ico("gem", 64) + '</div><button class="btn wide" data-a="eur:gems:' + p.id + '">' + p.eur + "</button></div>").join("") + "</div></div>";
  }
  b += '<div style="height:70px"></div>';
  return '<div class="page"><div class="top" style="background:#5a4ae0;--hc:#5a4ae0;padding-bottom:6px"><h1>GESCHÄFT</h1><button class="x" data-a="close">' + ico("x", 22) + '</button></div><div class="scroll" data-sc="shop" style="background:#fff1e8">' + b + '</div><div class="nav">' + SHOP_TABS.map(t => '<button class="nb' + (cur === t[0] ? " on" : "") + '" data-a="tab:shop:' + t[0] + '">' + ico(t[1], 38) + (t[0] === "cards" && S.packs.free > 0 ? '<span class="dot">!</span>' : "") + "</button>").join("") + "</div></div>";
}
function passBanner(key, title, eur, val, items, line) {
  const own = S.pass[key], pr = key === "elite";
  return '<div class="ban' + (pr ? " pr" : "") + '"><h2>' + title + '</h2><div class="muted" style="color:#fff;text-align:center">BELOHNUNGEN FREISCHALTEN!</div><div class="it">' + [ico("person", 44), ico("clock", 44), packArt(pr ? "prem" : "fort", 34), ico("gem", 44)].map((s, i) => '<div class="ctr" style="width:20%">' + s + "<br><span>" + items[i] + "</span></div>").join("") + '</div><div class="row"><span class="sp" style="font-size:14px">' + line + " (" + val + ")</span>" + (own ? '<span class="btn dis" style="background:#3fb04a">' + ico("check", 18) + " AKTIV</span>" : '<button class="btn" data-a="eur:pass:' + key + '">' + eur + "</button>") + "</div></div>";
}
function pagePass() {
  const t = passTier(); let b = '<div class="card"><div class="row">' + portrait("passgirl", "#f2d070", 70, "#2a3a8a") + '<div class="sp"><h2 style="margin:0">PASS · Stufe ' + t + "/" + PASS_TIERS + '</h2><div class="muted">Löse Quests und Bestellungen ein, um Pass-Punkte zu sammeln. Noch ' + fmtTime(passLeft()) + ".</div></div></div>" + bar(S.pass.xp % PASS_XP, PASS_XP, (S.pass.xp % PASS_XP) + "/" + PASS_XP) + '<div class="row" style="margin-top:8px;gap:6px"><button class="btn sm sp" data-a="eur:pass:prem">' + (S.pass.prem ? "Premium aktiv" : "Premium 17,99 €") + '</button><button class="btn sm pur sp" data-a="eur:pass:elite">' + (S.pass.elite ? "Elite aktiv" : "Elite 29,99 €") + "</button></div></div>";
  for (let i = 0; i < PASS_TIERS; i++) {
    b += '<div class="pass"><div style="width:34px;font-family:var(--f-display);font-size:22px;align-self:center;color:#3a4ad0">' + (i + 1) + "</div>" + ["free", "prem", "elite"].map(k => { const r = passReward(k, i), ok = passClaimable(k, i), got = S.pass.claimed[k + i], lock = (k === "prem" && !S.pass.prem) || (k === "elite" && !S.pass.elite); return '<div class="cl' + (ok ? " ok" : "") + (lock || i >= t ? " cl2" : "") + '" data-a="pclaim:' + k + ":" + i + '">' + (r.gems ? ico("gem", 22) + "<br>" + r.gems : r.rp ? ico("rp", 22) + "<br>" + r.rp : r.gold ? ico("gold", 22) + "<br>" + r.gold : r.pack ? packArt(r.pack, 18) + "<br>Paket" : ico("clock", 22) + "<br>" + Math.round(r.hours * 60) + "m") + (got ? "<br>✔" : ok ? "<br><b style='color:#2a9a3a'>Hol!</b>" : lock ? "<br>🔒" : "") + "</div>"; }).join("") + "</div>";
  }
  return pageWrap("pass", "PASS", "#3a5ce0", b);
}
function pageSet() {
  const tg = (k, label) => '<div class="sw"><span>' + label + '</span><button class="tg' + (S.set[k] ? " on" : "") + '" data-a="set:' + k + '"><i></i></button></div>';
  const b = '<div class="card">' + tg("sound", "Soundeffekte") + tg("music", "Musik") +
    '<div class="sw"><span>Testmodus</span><b style="font-family:var(--f-display);color:' + (TESTMODUS ? "#2a9a3a" : "#e03030") + '">' + (TESTMODUS ? "AN" : "AUS") + "</b></div><div class='muted' style='padding:6px 0'>Im Testmodus gewähren die €-Buttons und Werbe-Buttons sofort ihre Belohnung. Es wird nichts bezahlt und keine Werbung gezeigt.</div></div>" +
    '<div class="card"><h3>Spielstand</h3><div class="row" style="margin-top:8px;gap:8px"><button class="btn white sp" data-a="export">Exportieren</button><button class="btn white sp" data-a="import">Importieren</button></div><button class="btn red wide" style="margin-top:10px" data-a="reset">Neu anfangen</button></div>' +
    '<div class="card muted ctr">Supermarkt Tycoon · Spielzeit ' + fmtTime(S.st.played) + "<br>Insgesamt verdient: " + fmt(S.st.earned) + "</div>";
  return pageWrap("set", "EINSTELLUNGEN", "#5c6684", b);
}

// Pack-Öffnen / Willkommen-Dialoge
function packModal(res, title) {
  modal("<h2>" + (title || "Karten erhalten!") + '</h2><div class="grid" style="margin:8px 0">' + res.map(r => { const name = cardName(r.grp, r.id), col = r.grp === "reg" ? MGR_BY[r.id].col : r.grp === "lab" ? "#2fc0a0" : r.grp === "ord" ? "#e8603a" : MGR_BY[r.id].col; return '<div class="mc"><div class="pt" style="background:' + col + ';height:80px">' + portrait(r.id, col, 80) + '<span class="lv" style="left:auto;right:0;border-radius:0 0 0 10px">x' + r.n + '</span></div><div class="nm" style="font-size:12px">' + name + "</div></div>"; }).join("") + '</div><button class="btn green wide" data-a="mclose">Super!</button>');
}
function welcomeModal(o) {
  modal("<h2>Willkommen zurück!</h2><div class='muted'>Du warst " + fmtTime(o.away) + " weg.</div><div style='margin:12px 0;font-family:var(--f-display);font-size:30px;color:#2a9a3a'>" + ico("cash", 36) + " +" + fmtFull(o.earn) + '</div><div class="muted">Die automatisierten Abteilungen haben ' + fmtTime(o.sec) + " lang weitergearbeitet.</div><button class='btn green wide' style='margin-top:12px' data-a='mclose'>Weiter</button>");
}
