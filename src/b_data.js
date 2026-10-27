"use strict";
// Spieldaten: Standorte, Abteilungen, Manager, Forschung, Shop
const TESTMODUS = true; // true: €- und Werbe-Buttons gewähren sofort (kein echtes Bezahlen)

// Meilensteine: ab diesen Stufen verdoppelt sich der Preis
const MILESTONES = [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 750, 900, 1000];
const LVL_GROWTH = 1.09;      // Kostenwachstum pro Stufe
const PROC_GROWTH = 1.32;     // Kostenwachstum "Verarbeiten"
const CAR_DWELL = 55;         // Sekunden, die ein Auto parkt
const MGR_MULT = [1, 1.5, 2, 3, 5, 8, 12, 20, 35, 60, 100]; // Preis-Multiplikator je Managerstufe
const MGR_MAX = 10;

// 5 Standorte: jeder hat eigene Optik, Parkplatz und Stufenlimit
const LOCS = [
  { id: "kiosk", name: "Kiosk am Weg", desc: "Ein kleiner Stand mit Schotterplatz. Hier fängt alles an.", cost: 0, mult: 1, maxLvl: 100, maxPark: 3, maxAd: 14, maxKasse: 2, stock: 100,
    ground: "#cfe3a0", ground2: "#bcd78c", lot: "#d8c9a0", lotLine: "#a89870", wall: "#c98a5a", roof: "#b8473a", floor: "#f3e2a0", floor2: "#ead58a", sign: "KIOSK" },
  { id: "dorf", name: "Dorfladen", desc: "Der Laden im Ortskern mit Markise und Backstube.", cost: 600000, mult: 3, maxLvl: 250, maxPark: 5, maxAd: 30, maxKasse: 3, stock: 150,
    ground: "#d9e8a8", ground2: "#c6dc94", lot: "#c9c4b4", lotLine: "#f7efd6", wall: "#e6b86a", roof: "#c0392b", floor: "#f6ead0", floor2: "#eadcb8", sign: "DORFLADEN" },
  { id: "vorort", name: "Vorstadtsupermarkt", desc: "Supermarkt am Stadtrand mit Kühltheke und großem Parkplatz.", cost: 1.5e9, mult: 8, maxLvl: 400, maxPark: 8, maxAd: 60, maxKasse: 5, stock: 200,
    ground: "#c8dfa0", ground2: "#b7d28c", lot: "#9a9fb0", lotLine: "#fffdf2", wall: "#e0a070", roof: "#6a7aa8", floor: "#f2e4dc", floor2: "#e6d4c8", sign: "MARKT" },
  { id: "stadt", name: "Handelsstadt", desc: "Ein Einkaufszentrum mit Glasfassade und Parkhaus.", cost: 1.5e12, mult: 25, maxLvl: 600, maxPark: 12, maxAd: 100, maxKasse: 7, stock: 300,
    ground: "#b9c6d4", ground2: "#a9b8c8", lot: "#7d8498", lotLine: "#f2b705", wall: "#8fb8d8", roof: "#3f5f8f", floor: "#e4eef6", floor2: "#d3e2ee", sign: "SUPERMARKT" },
  { id: "welt", name: "Weltkonzern", desc: "Das Imperium: Goldene Türme, Hubschrauberlandeplatz, VIP-Parkplatz.", cost: 5e15, mult: 120, maxLvl: 1000, maxPark: 20, maxAd: 200, maxKasse: 8, stock: 500,
    ground: "#2f3a5c", ground2: "#27304f", lot: "#3b4468", lotLine: "#f2b705", wall: "#e8c04a", roof: "#f2b705", floor: "#fff4cf", floor2: "#f6e4a0", sign: "WELT-KONZERN" },
];

// Abteilungen: p0 = Grundpreis, c0 = Stufenkosten, T = Sekunden pro Kunde
const DEPTS = [
  { id: "obst", name: "Obst", col: "#c24fb0", col2: "#e9a6dc", loc: 0, p0: 6, c0: 30, T: 1.4, mgr: "Berta Beere",
    prod: [[1, "Apfelkorb", "Knackig und regional."], [40, "Saftige Birnen", "Süß wie Honig."], [120, "Blaue Trauben", "Direkt vom Weinberg."], [250, "Wassermelone", "Riesig und erfrischend."], [450, "Drachenfrucht", "Exotisch und selten."], [700, "Goldene Ananas", "Ein Traum aus Sonne."]] },
  { id: "gemuese", name: "Gemüse", col: "#4fa84a", col2: "#a8dc8c", loc: 0, p0: 40, c0: 240, T: 1.9, mgr: "Gustav Grün",
    prod: [[1, "Möhrenbündel", "Frisch aus der Erde."], [40, "Kopfsalat", "Knackig und grün."], [120, "Bunte Paprika", "Rot, gelb, grün."], [250, "Stolze Kürbisse", "Für jede Suppe."], [450, "Riesen-Brokkoli", "Kleine Bäume zum Essen."], [700, "Trüffelknolle", "Selten und teuer."]] },
  { id: "back", name: "Backwaren", col: "#e89a3a", col2: "#f6d08a", loc: 1, p0: 300, c0: 1900, T: 2.6, mgr: "Bruno Backe",
    prod: [[1, "Dorfbrötchen", "Duftet nach Morgen."], [40, "Körnerbrot", "Mit Sonnenblumenkernen."], [120, "Butterbrezel", "Salzig und goldbraun."], [250, "Sahnetorte", "Drei Stockwerke hoch."], [450, "Hochzeitskuchen", "Mit Zuckerperlen."], [700, "Goldkrone-Torte", "Für Könige gebacken."]] },
  { id: "kuehl", name: "Gekühlt", col: "#3a9ae0", col2: "#a8d8f6", loc: 2, p0: 2200, c0: 15000, T: 3.2, mgr: "Molly Milch",
    prod: [[1, "Frischmilch", "Direkt von der Weide."], [40, "Joghurtbecher", "Mit Fruchtstückchen."], [120, "Bergkäse", "Reif und würzig."], [250, "Sahne-Eis", "Cremig kalt."], [450, "Gletscher-Butter", "Fein gesalzen."], [700, "Diamant-Käse", "Zwanzig Jahre gereift."]] },
  { id: "tk", name: "Tiefkühl", col: "#4a6ae0", col2: "#b0bcf6", loc: 3, p0: 16000, c0: 120000, T: 3.6, mgr: "Frieda Frost",
    prod: [[1, "Pommes-Beutel", "Knusprig im Ofen."], [40, "Pizza Margherita", "Steinofen, tiefgekühlt."], [120, "Eisberg-Eis", "Im Becher oder Waffel."], [250, "Fisch-Platte", "Fangfrisch eingefroren."], [450, "Gefrorene Hummer", "Aus dem Nordmeer."], [700, "Polar-Eisbombe", "Für den Festtag."]] },
  { id: "fleisch", name: "Fleisch", col: "#c8443a", col2: "#f0a098", loc: 3, p0: 120000, c0: 900000, T: 4.2, mgr: "Metzger Max",
    prod: [[1, "Bratwurst", "Vom Grill."], [40, "Schweinebraten", "Mit Kruste."], [120, "Rinderfilet", "Zart wie Butter."], [250, "Räucherschinken", "Sechs Monate geräuchert."], [450, "Wagyu-Steak", "Die Königsklasse."], [700, "Goldenes Steak", "Mit Blattgold."]] },
  { id: "fein", name: "Feinkost", col: "#8a4ac8", col2: "#d0a8f0", loc: 4, p0: 900000, c0: 7e6, T: 4.8, mgr: "Dora Delikat",
    prod: [[1, "Oliven-Mix", "Aus dem Süden."], [40, "Räucherlachs", "Dünn geschnitten."], [120, "Pastete", "Mit Pfeffer."], [250, "Kaviar-Dose", "Perlen des Meeres."], [450, "Trüffelpralinen", "Handgemacht."], [700, "Goldsafran", "Teurer als Gold."]] },
  { id: "elektro", name: "Elektro", col: "#2f9a9a", col2: "#a0e0e0", loc: 4, p0: 7e6, c0: 55e6, T: 5.5, mgr: "Elmar Elektro",
    prod: [[1, "Taschenlampe", "Immer hell."], [40, "Radio", "Mit Kurbel."], [120, "Fernseher", "Flach und groß."], [250, "Spielekonsole", "Für Abende."], [450, "Roboter-Sauger", "Fährt allein."], [700, "Mini-Raumschiff", "Fliegt wirklich."]] },
];
const DEPT_BY = {}; DEPTS.forEach(d => DEPT_BY[d.id] = d);

// Manager: reg = Abteilungsmanager, eng = Ingenieure, leg = Legendär
const MGRS = DEPTS.map(d => ({ id: d.id, grp: "reg", name: d.mgr, role: d.name, dept: d.id, col: d.col }));
MGRS.push(
  { id: "e_kasse", grp: "eng", name: "Kasse-Karl", role: "Kassen +25% je Stufe", col: "#e89a3a", eff: "cash" },
  { id: "e_park", grp: "eng", name: "Pia Park", role: "Parkplatz +10% je Stufe", col: "#5a6ab8", eff: "park" },
  { id: "e_werb", grp: "eng", name: "Wanda Werbung", role: "Kunden +10% je Stufe", col: "#c24fb0", eff: "ad" },
  { id: "l_ceo", grp: "leg", name: "Direktor Goldblatt", role: "Gewinn +15% je Stufe", col: "#f2b705", eff: "profit" },
  { id: "l_zeit", grp: "leg", name: "Uhrmacher Tick", role: "Offline +1h je Stufe", col: "#3a9ae0", eff: "offline" },
  { id: "l_gluck", grp: "leg", name: "Glücksfee Lotta", role: "Mehr Karten aus Paketen", col: "#4fa84a", eff: "luck" },
);
const MGR_BY = {}; MGRS.forEach(m => MGR_BY[m.id] = m);

// Spezielle Manager: Labor und Bestellungen
const LAB_MGRS = [
  { id: "lab1", name: "Dr. Tüftel", role: "Forschung 15% schneller", eff: "time", per: 0.15 },
  { id: "lab2", name: "Prof. Funke", role: "Forschung 10% billiger", eff: "cost", per: 0.10 },
  { id: "lab3", name: "Assistentin Mia", role: "Zusätzlich +5 FP je Auftrag", eff: "rp", per: 5 },
];
const ORD_MGRS = [
  { id: "o1", name: "Lagerchefin Hilde", role: "+40% Geld", eff: "cash", per: 0.40 },
  { id: "o2", name: "Mechaniker Jo", role: "+50% Forschungspunkte", eff: "rp", per: 0.50 },
  { id: "o3", name: "Staplerfahrer Olli", role: "Vorrat +5% schneller", eff: "speed", per: 0.05 },
  { id: "o4", name: "Notizbuch-Nora", role: "+10 Vorrat je Lieferung", eff: "stock", per: 10 },
];

// Forschung (Labor): grp main/personal
const RES = [
  { id: "r_obst", grp: "main", dept: "obst", name: "Obst", desc: "Erhöhe das Einkommen von Obst", type: "dept", rp: 93, min: 15 },
  { id: "r_gemuese", grp: "main", dept: "gemuese", name: "Gemüse", desc: "Erhöhe das Einkommen von Gemüse", type: "dept", rp: 78, min: 15 },
  { id: "r_back", grp: "main", dept: "back", name: "Backwaren", desc: "Erhöhe das Einkommen von Backwaren", type: "dept", rp: 115, min: 15 },
  { id: "r_kuehl", grp: "main", dept: "kuehl", name: "Gekühlt", desc: "Erhöhe das Einkommen von Gekühltem", type: "dept", rp: 100, min: 5 },
  { id: "r_tk", grp: "main", dept: "tk", name: "Tiefkühl", desc: "Erhöhe das Einkommen von Tiefkühlware", type: "dept", rp: 160, min: 20 },
  { id: "r_fleisch", grp: "main", dept: "fleisch", name: "Fleisch", desc: "Erhöhe das Einkommen von Fleisch", type: "dept", rp: 190, min: 20 },
  { id: "r_fein", grp: "main", dept: "fein", name: "Feinkost", desc: "Erhöhe das Einkommen von Feinkost", type: "dept", rp: 240, min: 30 },
  { id: "r_elektro", grp: "main", dept: "elektro", name: "Elektro", desc: "Erhöhe das Einkommen von Elektro", type: "dept", rp: 280, min: 30 },
  { id: "p_kasse", grp: "pers", name: "Kassierer-Geschwindigkeit", desc: "Kassierer bedienen schneller", type: "cash", rp: 200, min: 5, icon: "kasse" },
  { id: "p_stock", grp: "pers", name: "Einräumer-Geschwindigkeit", desc: "Einräumer arbeiten schneller", type: "proc", rp: 220, min: 5, icon: "kiste" },
  { id: "p_kunde", grp: "pers", name: "Kunden-Geschwindigkeit", desc: "Kunden gehen schneller", type: "cust", rp: 250, min: 5, icon: "wagen" },
  { id: "p_multi", grp: "pers", name: "Multi-Kunde", desc: "Mehr Käufer pro Auto", type: "multi", rp: 350, min: 5, icon: "leute" },
  { id: "p_offline", grp: "pers", name: "Offline-Zeit", desc: "Längere Offline-Einnahmen", type: "offline", rp: 300, min: 10, icon: "uhr" },
  { id: "p_werb", grp: "pers", name: "Werbe-Boost x", desc: "Werbe-Boost zahlt mehr", type: "ad", rp: 320, min: 10, icon: "megafon" },
];
const RES_BY = {}; RES.forEach(r => RES_BY[r.id] = r);
// Wert einer Forschung bei Stufe L
function resValueOf(r, L) {
  switch (r.type) {
    case "dept": return L <= 0 ? 1 : 1.5 * Math.pow(1.15, L - 1);
    case "cash": return 1 + 0.30 * L;
    case "proc": return 1 + 0.25 * L;
    case "cust": return 1 + 0.30 * L;
    case "multi": return 0.05 * L;
    case "offline": return L;        // Stunden
    case "ad": return 1 + 0.20 * L;
  }
  return 1;
}
function resText(r, L) {
  const f = v => "x" + trimNum(v, 2);
  switch (r.type) {
    case "dept": return f(resValueOf(r, L)) + " » " + f(resValueOf(r, L + 1));
    case "cash": case "proc": case "cust": case "ad": return f(resValueOf(r, L)) + " » " + f(resValueOf(r, L + 1));
    case "multi": return Math.round(resValueOf(r, L) * 100) + "% » " + Math.round(resValueOf(r, L + 1) * 100) + "%";
    case "offline": return L + "h » +" + (L + 1) + "h";
  }
  return "";
}
// Ultimative Upgrades (Goldbarren)
const ULTS = [
  { id: "u_profit", name: "Goldener Gewinn", desc: "Gewinn +20% je Stufe", base: 1, max: 20 },
  { id: "u_cust", name: "Magnet-Werbung", desc: "Kunden +15% je Stufe", base: 1, max: 20 },
  { id: "u_off", name: "Nachtschicht", desc: "Offline-Einnahmen +1h je Stufe", base: 2, max: 10 },
  { id: "u_lab", name: "Turbo-Labor", desc: "Forschung 10% schneller je Stufe", base: 2, max: 8 },
  { id: "u_card", name: "Kartenglück", desc: "+1 Karte je Paket ab Stufe 3", base: 3, max: 3 },
];

// Karten-Pakete: Anzahl Karten, Preis in Edelsteinen
const PACKS = {
  basis: { name: "Basispaket", n: [3, 3], gems: 0, grp: ["reg"], col: ["#3a9ae0", "#e8603a"] },
  fort: { name: "Fortgeschrittenes Paket", n: [5, 6], gems: 300, grp: ["reg", "eng"], col: ["#e8603a", "#f2b705"] },
  prem: { name: "Premium-Paket", n: [8, 10], gems: 500, grp: ["reg", "eng", "leg"], col: ["#a83ad0", "#f2b705"] },
  labor: { name: "Labor", n: [3, 3], gems: 260, grp: ["lab"], col: ["#2fc0a0", "#3a9ae0"] },
  order: { name: "Bestellungen", n: [3, 3], gems: 280, grp: ["ord"], col: ["#e83a8a", "#f2b705"] },
};

// Shop: Zeit-Boosts und Edelstein-Pakete
const TIME_BOOSTS = [{ h: 2, gems: 250 }, { h: 4, gems: 500 }, { h: 8, gems: 900 }];
const GEM_PACKS = [
  { id: "g1", gems: 80, eur: "0,99 €" }, { id: "g2", gems: 500, eur: "4,99 €" }, { id: "g3", gems: 1200, eur: "9,99 €" },
  { id: "g4", gems: 2600, eur: "19,99 €" }, { id: "g5", gems: 7000, eur: "49,99 €" }, { id: "g6", gems: 15000, eur: "99,99 €" },
];
const RP_PACKS = [{ id: "rp1", rp: 150, gems: 100 }, { id: "rp2", rp: 800, gems: 450 }, { id: "rp3", rp: 2400, gems: 1200 }];
const OFFERS = [
  { id: "o_start", name: "Starterpaket", eur: "4,99 €", items: ["500 Edelsteine", "1 Stunde Einnahmen", "Fortgeschrittenes Paket"], gems: 500, hours: 1, packs: ["fort"] },
  { id: "o_fleiss", name: "Fleißiges Paket", eur: "9,99 €", items: ["1.200 Edelsteine", "4 Stunden Einnahmen", "300 Forschungspunkte"], gems: 1200, hours: 4, rp: 300 },
  { id: "o_labor", name: "Labor-Gründerpaket", eur: "17,99 €", items: ["+1 Forschungsslot", "x2 Forschungsgeschwindigkeit", "800 Edelsteine"], gems: 800, lab: true },
];
const PERMS = [
  { id: "ceo", name: "Geschäftsführer", desc: "10 Stunden Offline-Einnahmen", eur: "7,99 €" },
  { id: "seal", name: "Qualitätssiegel", desc: "Doppelte Gewinne", eur: "9,99 €" },
];

// Pass: 30 Stufen
const PASS_TIERS = 30, PASS_XP = 100;
