"use strict";
// Spielzustand und Wirtschaft (ohne DOM, damit man sie headless testen kann)
const SAVE_KEY = "supermarkttycoon_v1";
let S = null, C = null;
const nowMs = () => Date.now();

function newState() {
  const s = {
    v: 1, created: nowMs(), last: nowMs(),
    money: 120, gems: 60, rp: 0, gold: 0, loc: 0, mode: 1,
    dept: {}, mgr: {}, cards: {},
    park: { lvl: 1, ad: 2 }, kasse: { n: 1 },
    res: { lv: {}, slots: [null, null, null, null, null], unl: 1, lab2x: false },
    ult: {},
    ord: { stock: 20, acc: 0, list: [], mlv: {}, mcards: {} },
    lab: { mlv: {}, mcards: {} },
    boost: { until: 0 },
    q: { list: [], done: 0 },
    st: { served: {}, earned: 0, played: 0, orders: 0 },
    packs: { free: 5, next: 0 },
    perm: { ceo: false, seal: false },
    pass: { xp: 0, prem: false, elite: false, start: nowMs(), claimed: {} },
    daily: { day: 0, last: "" },
    set: { sound: true, music: true },
    seen: {},
  };
  S = s;
  DEPTS.filter(d => d.loc === 0).forEach((d, i) => unlockDept(d.id, i < 2));
  MGRS.filter(m => m.grp !== "reg").forEach(m => { s.mgr[m.id] = { lvl: 0, cards: 0 }; });
  LAB_MGRS.forEach(m => { s.lab.mlv[m.id] = 0; s.lab.mcards[m.id] = 0; });
  ORD_MGRS.forEach(m => { s.ord.mlv[m.id] = 0; s.ord.mcards[m.id] = 0; });
  DEPTS.forEach(d => { if (!s.mgr[d.id]) s.mgr[d.id] = { lvl: 0, cards: 0 }; });
  calc(false); genQuests(); genOrders();
  return s;
}
function unlockDept(id, auto) {
  S.dept[id] = { lvl: 1, emp: 1, proc: 0, act: 0 };
  S.mgr[id] = { lvl: auto ? 2 : 1, cards: 0 };
  S.st.served[id] = 0;
}

// ---------- Rechenformeln ----------
const msCount = l => { let n = 0; for (const m of MILESTONES) if (l >= m) n++; return n; };
const deptPrice = (id, l) => DEPT_BY[id].p0 * l * Math.pow(2, msCount(l));
const lvlCost = (id, l) => DEPT_BY[id].c0 * Math.pow(LVL_GROWTH, l - 1);
const geo = (c0, r, n) => c0 * (Math.pow(r, n) - 1) / (r - 1);
function maxAfford(c0, r, money, cap) {
  if (money < c0) return 0;
  const n = Math.floor(Math.log(1 + money * (r - 1) / c0) / Math.log(r));
  return clamp(n, 0, cap);
}
const locOf = () => LOCS[S.loc];
const lvlCap = () => locOf().maxLvl;
function nextMilestone(l) { for (const m of MILESTONES) if (m > l && m <= lvlCap()) return m; return lvlCap(); }
function buyCount(id) { // wie viele Stufen würde ein Klick kaufen
  const d = S.dept[id], cap = Math.max(0, lvlCap() - d.lvl);
  if (S.mode === 0) return Math.max(1, Math.min(cap, maxAfford(lvlCost(id, d.lvl), LVL_GROWTH, S.money, cap)));
  return Math.min(S.mode, cap);
}
function levelCostN(id, n) { return geo(lvlCost(id, S.dept[id].lvl), LVL_GROWTH, n); }
function levelUp(id) {
  const d = S.dept[id], n = buyCount(id);
  if (n <= 0) return false;
  const c = levelCostN(id, n);
  if (S.money < c) return false;
  S.money -= c; d.lvl += n; recalc(); return true;
}
function skipMilestone(id) {
  const d = S.dept[id], t = nextMilestone(d.lvl), n = t - d.lvl;
  if (n <= 0) return false;
  const g = Math.ceil(n * 0.7);
  if (S.gems < g) return false;
  S.gems -= g; d.lvl = t; recalc(); return true;
}
const hireCost = id => DEPT_BY[id].c0 * 40 * Math.pow(8, S.dept[id].emp - 1);
const procCost = id => DEPT_BY[id].c0 * 40 * Math.pow(PROC_GROWTH, S.dept[id].proc);
function hire(id) { const d = S.dept[id]; if (d.emp >= 4) return false; const c = hireCost(id); if (S.money < c) return false; S.money -= c; d.emp++; recalc(); return true; }
function procUp(id) { const d = S.dept[id]; if (d.proc >= 60) return false; const c = procCost(id); if (S.money < c) return false; S.money -= c; d.proc++; recalc(); return true; }

// Parkplatz, Werbung, Kassen
const parkCost = () => 400 * Math.pow(2.3, S.park.lvl - 1);
const adCost = () => 60 * Math.pow(1.16, S.park.ad - 2);
const kasseCost = () => 300 * Math.pow(14, S.kasse.n - 1);
function buyPark() { if (S.park.lvl >= locOf().maxPark) return false; const c = parkCost(); if (S.money < c) return false; S.money -= c; S.park.lvl++; recalc(); return true; }
function buyAd() { if (S.park.ad >= locOf().maxAd) return false; const c = adCost(); if (S.money < c) return false; S.money -= c; S.park.ad++; recalc(); return true; }
function buyKasse() { if (S.kasse.n >= locOf().maxKasse) return false; const c = kasseCost(); if (S.money < c) return false; S.money -= c; S.kasse.n++; recalc(); return true; }
function nextLoc() { return LOCS[S.loc + 1] || null; }
function buyLoc() {
  const n = nextLoc(); if (!n || S.money < n.cost) return false;
  S.money -= n.cost; S.loc++;
  DEPTS.filter(d => d.loc === S.loc).forEach(d => unlockDept(d.id, false));
  recalc(); genQuests(); return true;
}

// Manager
const mgrLvl = id => (S.mgr[id] ? S.mgr[id].lvl : 0);
const mgrMult = id => MGR_MULT[mgrLvl(id)] || 1;
const isAuto = id => mgrLvl(id) >= 2;
const cardsNeed = lvl => Math.pow(2, lvl);
const mgrRpCost = lvl => 25 * Math.pow(2, lvl - 1);
function addCards(grp, id, n) {
  if (grp === "lab") { S.lab.mcards[id] += n; if (!S.lab.mlv[id] && S.lab.mcards[id] >= 1) { S.lab.mlv[id] = 1; S.lab.mcards[id]--; } return; }
  if (grp === "ord") { S.ord.mcards[id] += n; if (!S.ord.mlv[id] && S.ord.mcards[id] >= 1) { S.ord.mlv[id] = 1; S.ord.mcards[id]--; } return; }
  const m = S.mgr[id]; m.cards += n;
  if (m.lvl === 0 && m.cards >= 1) { m.lvl = 1; m.cards--; }
}
function canUpMgr(id) { const m = S.mgr[id]; return m.lvl >= 1 && m.lvl < MGR_MAX && m.cards >= cardsNeed(m.lvl) && S.rp >= mgrRpCost(m.lvl); }
function upMgr(id) { const m = S.mgr[id]; if (!canUpMgr(id)) return false; m.cards -= cardsNeed(m.lvl); S.rp -= mgrRpCost(m.lvl); m.lvl++; recalc(); return true; }
function subLvl(grp, id) { return grp === "lab" ? S.lab.mlv[id] : S.ord.mlv[id]; }
function subCards(grp, id) { return grp === "lab" ? S.lab.mcards[id] : S.ord.mcards[id]; }
function upSub(grp, id) {
  const lv = subLvl(grp, id), need = cardsNeed(lv), rp = mgrRpCost(lv);
  if (lv < 1 || lv >= 8 || subCards(grp, id) < need || S.rp < rp) return false;
  if (grp === "lab") { S.lab.mcards[id] -= need; S.lab.mlv[id]++; } else { S.ord.mcards[id] -= need; S.ord.mlv[id]++; }
  S.rp -= rp; return true;
}
const engLvl = eff => { const m = MGRS.find(x => x.eff === eff); return m ? mgrLvl(m.id) : 0; };
const labBonus = eff => { let v = 0; LAB_MGRS.forEach(m => { if (m.eff === eff) v += m.per * (S.lab.mlv[m.id] || 0); }); return v; };
const ordBonus = eff => { let v = 0; ORD_MGRS.forEach(m => { if (m.eff === eff) v += m.per * (S.ord.mlv[m.id] || 0); }); return v; };

// Forschung
const resLv = id => S.res.lv[id] || 0;
const resVal = id => resValueOf(RES_BY[id], resLv(id));
function resAvailable() { return RES.filter(r => !r.dept || S.dept[r.dept]); }
const resCost = id => Math.ceil(RES_BY[id].rp * Math.pow(1.3, resLv(id)) * (1 - Math.min(0.5, labBonus("cost"))));
function resTime(id) {
  const r = RES_BY[id], L = resLv(id);
  let t = r.min * 60 * (1 + 0.5 * L);
  t *= Math.max(0.2, 1 - labBonus("time") - 0.10 * (S.ult.u_lab || 0));
  if (S.res.lab2x) t *= 0.5;
  return Math.ceil(t);
}
function startRes(id, slot) {
  if (S.res.slots[slot] || slot >= S.res.unl) return false;
  if (S.res.slots.some(x => x && x.id === id)) return false;
  const c = resCost(id); if (S.rp < c) return false;
  S.rp -= c; const t = resTime(id);
  S.res.slots[slot] = { id, start: nowMs(), end: nowMs() + t * 1000 };
  return true;
}
function resGemSkip(slot) { const x = S.res.slots[slot]; return x ? Math.max(1, Math.ceil((x.end - nowMs()) / 60000)) : 0; }
function finishRes(slot, instantGems) {
  const x = S.res.slots[slot]; if (!x) return false;
  if (instantGems) { const g = resGemSkip(slot); if (S.gems < g) return false; S.gems -= g; x.end = nowMs(); }
  if (nowMs() < x.end) return false;
  S.res.lv[x.id] = resLv(x.id) + 1; S.res.slots[slot] = null; recalc(); return true;
}
const LAB_UNLOCK = [0, 100, 300, 600];
function unlockLab() { const c = LAB_UNLOCK[S.res.unl]; if (c === undefined || S.res.unl >= 4 || S.gems < c) return false; S.gems -= c; S.res.unl++; return true; }

// ---------- Berechnung ----------
function globalMult() {
  let m = locOf().mult;
  if (S.perm.seal) m *= 2;
  m *= 1 + 0.20 * (S.ult.u_profit || 0);
  m *= 1 + 0.15 * engLvl("profit");
  if (nowMs() < S.boost.until) m *= 2 * resVal("p_werb");
  return m;
}
function calc(offline) {
  const loc = locOf();
  const spots = Math.round(6 * S.park.lvl * (1 + 0.10 * engLvl("park")));
  const arrival = 2 * S.park.ad * resVal("p_kunde") * (1 + 0.10 * engLvl("ad")) * (1 + 0.15 * (S.ult.u_cust || 0));
  const maxFlow = spots * 60 / CAR_DWELL;
  const C0 = Math.min(arrival, maxFlow) * (1 + resVal("p_multi"));
  const cashCap = S.kasse.n * 12 * resVal("p_kasse") * (1 + 0.25 * engLvl("cash"));
  const flow = Math.min(C0, cashCap);
  const gm = globalMult();
  const depts = {}; let income = 0, perCust = 0;
  for (const id in S.dept) {
    const d = S.dept[id], def = DEPT_BY[id];
    const price = deptPrice(id, d.lvl) * mgrMult(id) * resVal("r_" + id) * gm;
    const T = def.T * Math.pow(0.975, d.proc) / resVal("p_stock");
    const cap = d.emp * 60 / T;
    const active = isAuto(id) || (!offline && nowMs() < d.act);
    const sold = active ? Math.min(flow, cap) : 0;
    const inc = sold * price;
    depts[id] = { price, T, cap, active, sold, inc };
    income += inc; perCust += price;
  }
  C = { spots, arrival, maxFlow, C0, cashCap, flow, income, perCust, depts, gm,
    parkUse: Math.min(1, arrival * CAR_DWELL / 60 / Math.max(1, spots)),
    queue: Math.max(0, Math.round((C0 - cashCap) / 6)),
    wait: Math.max(2, 60 / Math.max(1, cashCap) * (C0 > cashCap ? 2 : 0.6)) };
  return C;
}
function recalc() { calc(false); }

// ---------- Tick ----------
function tick(dt) {
  calc(false);
  const earn = C.income / 60 * dt;
  S.money += earn; S.st.earned += earn; S.st.played += dt;
  for (const id in C.depts) S.st.served[id] += C.depts[id].sold / 60 * dt;
  // Vorrat füllt sich
  const o = S.ord, maxS = stockMax();
  o.acc += dt;
  const per = 56 * (1 - Math.min(0.6, ordBonus("speed")));
  while (o.acc >= per) { o.acc -= per; o.stock = Math.min(maxS, o.stock + 2 + ordBonus("stock")); }
  if (o.stock > maxS) o.stock = maxS;
  // Forschung fertig?
  S.res.slots.forEach((x, i) => { if (x && nowMs() >= x.end) finishRes(i, false); });
  // Gratis-Pakete laden nach
  if (S.packs.free < 5 && nowMs() >= S.packs.next) { S.packs.free++; S.packs.next = S.packs.free < 5 ? nowMs() + 30 * 60000 : 0; }
  questTick();
}
const stockMax = () => locOf().stock;

// ---------- Offline ----------
function offlineCapSec() {
  let h = 2 + resVal("p_offline") + (S.ult.u_off || 0) + engLvl("offline");
  if (S.perm.ceo) h += 10;
  return h * 3600;
}
function applyOffline() {
  const el = Math.max(0, (nowMs() - S.last) / 1000);
  if (el < 30) return null;
  const sec = Math.min(el, offlineCapSec());
  const c = calc(true);
  const earn = c.income * sec / 60;
  S.money += earn; S.st.earned += earn;
  S.ord.stock = Math.min(stockMax(), S.ord.stock + Math.floor(sec / 56) * (2 + ordBonus("stock")));
  return { sec, earn, away: el };
}

// ---------- Bestellungen ----------
function genOrders() {
  const o = S.ord;
  while (o.list.length < 3) {
    const need = pick([20, 30, 40, 60, 80]);
    o.list.push({ need, rp: Math.round(need * rnd(1.6, 3.2)), cashMin: Math.round(need * rnd(1.5, 3)), dur: Math.round(pick([10, 20, 45, 63, 90]) * 60), start: 0 });
  }
}
function startOrder(i) {
  const x = S.ord.list[i]; if (!x || x.start || S.ord.stock < x.need) return false;
  S.ord.stock -= x.need; x.start = nowMs(); return true;
}
const orderLeft = x => x.start ? Math.max(0, (x.start + x.dur * 1000 - nowMs()) / 1000) : x.dur;
const orderSkipGems = x => Math.max(1, Math.ceil(orderLeft(x) / 60));
function claimOrder(i, gems) {
  const x = S.ord.list[i]; if (!x || !x.start) return false;
  if (orderLeft(x) > 0) { if (!gems) return false; const g = orderSkipGems(x); if (S.gems < g) return false; S.gems -= g; }
  const cash = x.cashMin * Math.max(60, C.income) * (1 + ordBonus("cash"));
  const rp = Math.round(x.rp * (1 + ordBonus("rp")) + labBonus("rp"));
  S.money += cash; S.rp += rp; S.st.orders++;
  S.ord.list.splice(i, 1); genOrders(); S.pass.xp += 5;
  return { cash, rp };
}

// ---------- Quests ----------
function genQuests() {
  const ids = Object.keys(S.dept), q = S.q;
  const used = q.list.map(x => x.key);
  while (q.list.length < 3) {
    const t = pick(["lvl", "cust", "earn", "emp"]), d = pick(ids), dl = S.dept[d];
    let x;
    if (t === "lvl") { const tg = Math.min(lvlCap(), nextMilestone(dl.lvl) + (Math.random() < 0.4 ? 25 : 0)); if (tg <= dl.lvl) continue; x = { t, d, target: tg, txt: "Aktualisiere deine " + DEPT_BY[d].name + "abteilung auf Stufe " + tg + "." }; }
    else if (t === "cust") { const tg = Math.round(rnd(60, 220) / 10) * 10; x = { t, d, target: tg, base: S.st.served[d], txt: "Bediene " + tg + " Kunden in der " + DEPT_BY[d].name + "abteilung." }; }
    else if (t === "earn") { const tg = Math.max(100, Math.round(C.income * rnd(8, 25))); x = { t, target: tg, base: S.st.earned, txt: "Verdiene " + fmt(tg) + " Geld." }; }
    else { if (dl.emp >= 4) continue; x = { t, d, target: dl.emp + 1, txt: "Stelle in " + DEPT_BY[d].name + " einen Mitarbeiter ein." }; }
    x.key = t + (x.d || ""); if (used.includes(x.key)) continue; used.push(x.key); q.list.push(x);
  }
}
function questProg(x) {
  if (x.t === "lvl") return Math.min(x.target, S.dept[x.d] ? S.dept[x.d].lvl : 0);
  if (x.t === "cust") return Math.min(x.target, Math.floor(S.st.served[x.d] - x.base));
  if (x.t === "earn") return Math.min(x.target, Math.floor(S.st.earned - x.base));
  return Math.min(x.target, S.dept[x.d] ? S.dept[x.d].emp : 0);
}
let questFlash = null;
function questTick() {
  const q = S.q;
  for (let i = q.list.length - 1; i >= 0; i--) {
    const x = q.list[i];
    if (questProg(x) >= x.target) {
      q.list.splice(i, 1); q.done++; S.pass.xp += 10; S.gems += 5; questFlash = "Quest geschafft: +5 💎";
    }
  }
  if (q.list.length < 3) genQuests();
}
// Quest-Truhe: nach 5 geschafften Quests
function chestReady() { return S.q.done >= 5; }
function openChest() {
  if (!chestReady()) return null;
  S.q.done -= 5;
  const r = { gems: 30, rp: 40, gold: S.q.done % 3 === 0 ? 1 : 0, pack: "basis" };
  S.gems += r.gems; S.rp += r.rp; S.gold += r.gold;
  return { r, cards: openPack("basis", true) };
}

// ---------- Karten ----------
function packPool(grp) {
  const out = [];
  if (grp.includes("reg")) DEPTS.forEach(d => out.push({ grp: "reg", id: d.id, w: S.dept[d.id] ? 10 : 2 }));
  if (grp.includes("eng")) MGRS.filter(m => m.grp === "eng").forEach(m => out.push({ grp: "eng", id: m.id, w: 3 }));
  if (grp.includes("leg")) MGRS.filter(m => m.grp === "leg").forEach(m => out.push({ grp: "leg", id: m.id, w: 1 }));
  if (grp.includes("lab")) LAB_MGRS.forEach(m => out.push({ grp: "lab", id: m.id, w: 4 }));
  if (grp.includes("ord")) ORD_MGRS.forEach(m => out.push({ grp: "ord", id: m.id, w: 4 }));
  return out;
}
function openPack(type, free) {
  const p = PACKS[type];
  if (!free) { if (S.gems < p.gems) return null; S.gems -= p.gems; }
  let n = p.n[0] + Math.floor(Math.random() * (p.n[1] - p.n[0] + 1));
  n += engLvl("luck") >= 1 ? 1 : 0; n += (S.ult.u_card || 0) >= 3 ? 1 : 0;
  const pool = packPool(p.grp), got = {};
  for (let i = 0; i < n; i++) { const c = wpick(pool, x => x.w); const k = c.grp + ":" + c.id; got[k] = (got[k] || 0) + 1; }
  const res = [];
  for (const k in got) { const [g, id] = k.split(":"); addCards(g, id, got[k]); res.push({ grp: g, id, n: got[k] }); }
  return res;
}
function freePack() {
  if (S.packs.free <= 0) return null;
  S.packs.free--; if (!S.packs.next) S.packs.next = nowMs() + 30 * 60000;
  return openPack("basis", true);
}
function cardName(grp, id) {
  if (grp === "lab") return LAB_MGRS.find(m => m.id === id).name;
  if (grp === "ord") return ORD_MGRS.find(m => m.id === id).name;
  return MGR_BY[id].name;
}

// ---------- Shop (Testmodus: sofort gewähren) ----------
function moneyHours(h) { return Math.max(100, C.income) * 60 * h; }
function buyTimeBoost(i) { const b = TIME_BOOSTS[i]; if (S.gems < b.gems) return false; S.gems -= b.gems; S.money += moneyHours(b.h); return moneyHours(b.h); }
function buyRp(i) { const p = RP_PACKS[i]; if (S.gems < p.gems) return false; S.gems -= p.gems; S.rp += p.rp; return true; }
function euroBuy(kind, id) {
  if (!TESTMODUS) return false;
  if (kind === "gems") { const p = GEM_PACKS.find(x => x.id === id); S.gems += p.gems; return true; }
  if (kind === "offer") {
    const o = OFFERS.find(x => x.id === id);
    S.gems += o.gems || 0; if (o.hours) S.money += moneyHours(o.hours); if (o.rp) S.rp += o.rp;
    if (o.packs) o.packs.forEach(p => openPack(p, true));
    if (o.lab) { S.res.unl = Math.min(5, S.res.unl + 1); S.res.lab2x = true; }
    S.seen["offer_" + id] = true; return true;
  }
  if (kind === "perm") { S.perm[id] = true; recalc(); return true; }
  if (kind === "pass") { S.pass[id] = true; return true; }
  if (kind === "lab5") { S.res.unl = 5; return true; }
  return false;
}
function adBoost() { S.boost.until = Math.max(nowMs(), S.boost.until) + 4 * 60000; recalc(); return true; }

// Pass-Belohnungen
function passTier() { return Math.min(PASS_TIERS, Math.floor(S.pass.xp / PASS_XP)); }
function passReward(track, t) {
  const n = t + 1;
  if (track === "free") return n % 3 === 0 ? { gems: 10 + n } : { hours: 0.25 + n * 0.05 };
  if (track === "prem") return n % 5 === 0 ? { pack: "fort" } : n % 2 ? { gems: 20 + n * 2 } : { rp: 20 + n * 4 };
  return n % 5 === 0 ? { pack: "prem" } : n % 2 ? { gems: 40 + n * 4 } : { gold: 1 + Math.floor(n / 6) };
}
function passClaimable(track, t) {
  if (t >= passTier()) return false;
  if (track === "prem" && !S.pass.prem) return false;
  if (track === "elite" && !S.pass.elite) return false;
  return !S.pass.claimed[track + t];
}
function passClaim(track, t) {
  if (!passClaimable(track, t)) return null;
  S.pass.claimed[track + t] = true;
  const r = passReward(track, t);
  if (r.gems) S.gems += r.gems; if (r.rp) S.rp += r.rp; if (r.gold) S.gold += r.gold; if (r.hours) S.money += moneyHours(r.hours);
  let cards = null; if (r.pack) cards = openPack(r.pack, true);
  return { r, cards };
}
const passLeft = () => Math.max(0, S.pass.start + 30 * 86400000 - nowMs()) / 1000;

// Ultimative Upgrades
const ultCost = u => Math.ceil(u.base * Math.pow(2, S.ult[u.id] || 0));
function buyUlt(id) { const u = ULTS.find(x => x.id === id), l = S.ult[id] || 0; if (l >= u.max) return false; const c = ultCost(u); if (S.gold < c) return false; S.gold -= c; S.ult[id] = l + 1; recalc(); return true; }

// Täglich
function dailyKey() { return new Date().toISOString().slice(0, 10); }
function dailyReady() { return S.daily.last !== dailyKey(); }
function claimDaily() {
  if (!dailyReady()) return null;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  S.daily.day = S.daily.last === y ? S.daily.day + 1 : 1; S.daily.last = dailyKey();
  const g = 10 + Math.min(S.daily.day, 14) * 5; S.gems += g;
  if (S.daily.day % 7 === 0) S.gold += 1;
  return { day: S.daily.day, gems: g };
}

// ---------- Speichern ----------
function saveGame() { try { S.last = nowMs(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false;
    const o = JSON.parse(raw), base = newState();
    S = deepMerge(base, o);
    Object.keys(S.dept).forEach(id => { if (S.st.served[id] === undefined) S.st.served[id] = 0; if (!S.mgr[id]) S.mgr[id] = { lvl: 1, cards: 0 }; });
    return true;
  } catch (e) { return false; }
}
function deepMerge(a, b) {
  if (Array.isArray(b)) return b;
  if (b && typeof b === "object") { const o = Array.isArray(a) ? [] : Object.assign({}, a); for (const k in b) o[k] = (a && typeof a[k] === "object" && a[k] && !Array.isArray(a[k])) ? deepMerge(a[k], b[k]) : b[k]; return o; }
  return b === undefined ? a : b;
}
function resetGame() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } newState(); recalc(); }
