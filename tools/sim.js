// Headless-Balance-Simulation: greedy Bot kauft immer das beste Upgrade
const fs = require("fs"), vm = require("vm");
let T = 1.7e12;
class FDate extends Date { static now() { return T; } constructor(...a) { if (a.length) super(...a); else super(T); } }
const ctx = { console, Math, JSON, Date: FDate, localStorage: { getItem() { return null; }, setItem() { }, removeItem() { } } };
vm.createContext(ctx);
const src = ["a_util", "b_data", "c_state"].map(f => fs.readFileSync(__dirname + "/../src/" + f + ".js", "utf8")).join("\n");
vm.runInContext(src + "\nthis.api={get S(){return S},get C(){return C},newState,calc,tick,levelUp,hire,procUp,buyPark,buyAd,buyKasse,buyLoc,levelCostN,hireCost,procCost,parkCost,adCost,kasseCost,nextLoc,buyCount,fmt,DEPTS,LOCS};", ctx);
const A = ctx.api; A.newState();
const hours = +(process.argv[2] || 6);
const clone = () => JSON.parse(JSON.stringify(A.S));
function options() {
  const o = [], S = A.S, loc = A.LOCS[S.loc];
  for (const id in S.dept) {
    const d = S.dept[id];
    if (d.lvl < loc.maxLvl) o.push({ n: "lvl " + id, cost: A.levelCostN(id, 1), f: () => { S.mode = 1; return A.levelUp(id); } });
    if (d.emp < 4) o.push({ n: "emp " + id, cost: A.hireCost(id), f: () => A.hire(id) });
    if (d.proc < 60) o.push({ n: "proc " + id, cost: A.procCost(id), f: () => A.procUp(id) });
  }
  if (S.park.lvl < loc.maxPark) o.push({ n: "park", cost: A.parkCost(), f: () => A.buyPark() });
  if (S.park.ad < loc.maxAd) o.push({ n: "ad", cost: A.adCost(), f: () => A.buyAd() });
  if (S.kasse.n < loc.maxKasse) o.push({ n: "kasse", cost: A.kasseCost(), f: () => A.buyKasse() });
  const nl = A.nextLoc(); if (nl) o.push({ n: "LOC " + nl.id, cost: nl.cost, f: () => A.buyLoc() });
  return o;
}
let log = [], nextPrint = 0, lastLoc = 0, buys = 0;
const end = T + hours * 3600e3;
while (T < end) {
  A.calc(false);
  const base = A.C.income;
  const snap = clone();
  let best = null;
  for (const op of options()) {
    // Delta-Einkommen testen: Kopie des Zustands
    const keep = A.S; const tmp = JSON.parse(JSON.stringify(keep)); tmp.money = 1e300;
    ctxSet(tmp); const ok = op.f(); A.calc(false); const di = A.C.income - base; ctxSet(keep); A.calc(false);
    if (!ok || di <= 0) { if (op.n.startsWith("LOC")) di2(op, 0); continue; }
    const score = op.cost / di + (op.n.startsWith("LOC") ? 0 : 0);
    if (!best || score < best.score) best = { ...op, score };
  }
  if (!best) { T += 60e3; A.tick(60); continue; }
  const need = best.cost - A.S.money;
  if (need > 0) { const secs = Math.max(1, Math.min(600, need / Math.max(1e-9, A.C.income / 60))); T += secs * 1e3; A.tick(secs); if (A.S.money < best.cost) continue; }
  // kaufen
  best.f(); buys++;
  if (A.S.loc !== lastLoc) { lastLoc = A.S.loc; log.push(`Standort ${A.S.loc} (${A.LOCS[A.S.loc].id}) nach ${((T - 1.7e12) / 3600e3).toFixed(2)} h, Einkommen ${A.fmt(A.C.income)}/min, ${buys} Käufe`); }
  if ((T - 1.7e12) / 3600e3 >= nextPrint) { log.push(`  t=${nextPrint}h: Geld ${A.fmt(A.S.money)} Einkommen ${A.fmt(A.C.income)}/min C=${A.C.flow.toFixed(1)}/min`); nextPrint += 1; }
}
function di2() { }
function ctxSet(s) { vm.runInContext("S=__tmp", Object.assign(ctx, { __tmp: s })); }
console.log(log.join("\n"));
