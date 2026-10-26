/* ça fitte — données et dessins partagés des prototypes « plateforme ».
   Projet anonymisé : Le Hauterive III, étage type à 14 logements.
   Les dessins sont les feuilles réelles ; ça fitte pose par-dessus un calque
   de repérage cliquable, il ne redessine jamais le plan. */

/* ------------------------------------------------------------------ projet */

const PROJET = {
  nom: "Le Hauterive III",
  sous: "Multi-Logement et Commerce",
  ville: "Montréal (QC)",
  code: "HAU-III",
  etages: 8,
  niveau: 5,
  type: "Multi-logement et commerce",
  statut: "En cours",
  logements: 14,
  pi2Total: "±15 989",
  pertes: "15 %",
};

const SOURCES = {
  dwg: [
    { nom: "BAL3_Etage_Type.dwg", type: "Plan d’étage type", taille: "4,8 Mo", rev: "R04", maj: "il y a 6 min" },
    { nom: "BAL3_Niveau_0.dwg", type: "Plan du niveau 0", taille: "6,1 Mo", rev: "R03", maj: "il y a 2 h" },
    { nom: "BAL3_Niveau_00.dwg", type: "Plan du niveau 00", taille: "5,4 Mo", rev: "R03", maj: "il y a 2 h" },
  ],
  skp: { nom: "BAL3_Volumetrie_Opt2.skp", type: "Volumétrie", taille: "21,6 Mo", rev: "v2", maj: "il y a 31 min" },
};
/* ------------------------------------------------- l'étage type, 14 unités
   Superficies telles qu'elles apparaissent sur la feuille, en pi² NET.
   Les boîtes sont normalisées 0–1 sur assets/plan-etage.jpg. */

const PLAN_IMG = { src: "assets/plan-etage.jpg", w: 1280, h: 1160 };

const UNITES = [
  { id: "1", ty: "3½", pi2: 707, box: [0.3953, 0.5862, 0.1203, 0.1586], pieces: [["chambre 1", "11-3\" × 10-6\""]] },
  { id: "2", ty: "3½", pi2: 727, box: [0.5063, 0.0328, 0.1141, 0.1552], pieces: [["chambre 1", "12-0\" × 11-0\""]] },
  { id: "3", ty: "3½", pi2: 753, box: [0.6281, 0.0328, 0.1172, 0.1552], pieces: [["chambre 1", "12-0\" × 11-0\""]] },
  { id: "4", ty: "3½ + den", pi2: 880, box: [0.1609, 0.7293, 0.1266, 0.2172], pieces: [["chambre 1", "12-0\" × 11-6\""], ["den", "7-6\" × 8-0\""]] },
  { id: "5", ty: "4½", pi2: 968, box: [0.2203, 0.5207, 0.1422, 0.1724], pieces: [["chambre 1", "14-6\" × 10-4\""], ["chambre 2", "12-4\" × 10-10\""]] },
  { id: "6", ty: "4½", pi2: 1012, box: [0.2203, 0.3483, 0.1422, 0.1724], pieces: [["chambre 1", "11-6\" × 11-3\""], ["chambre 2", "11-6\" × 11-0\""]] },
  { id: "7", ty: "4½", pi2: 1170, box: [0.4891, 0.2259, 0.1984, 0.1552], pieces: [["chambre 1", "12-0\" × 11-0\""], ["chambre 2", "11-0\" × 11-0\""]] },
  { id: "8", ty: "4½", pi2: 1203, box: [0.2203, 0.1362, 0.1625, 0.2034], pieces: [["chambre 1", "11-6\" × 11-0\""], ["chambre 2", "11-6\" × 10-6\""]] },
  { id: "9", ty: "5½", pi2: 1249, box: [0.303, 0.0276, 0.1969, 0.1603], pieces: [["chambre 1", "11-0\" × 11-0\""], ["chambre 2", "10-0\" × 11-0\""], ["chambre 3", "10-0\" × 11-0\""]] },
  { id: "10", ty: "5½", pi2: 1350, box: [0.0266, 0.6966, 0.1859, 0.25], pieces: [["chambre 1", "11-0\" × 12-0\""], ["chambre 2", "12-0\" × 11-0\""], ["chambre 3", "11-0\" × 9-6\""]] },
  { id: "11", ty: "4½", pi2: 1380, box: [0.3938, 0.3155, 0.1438, 0.2638], pieces: [["chambre 1", "14-0\" × 11-0\""], ["chambre 2", "13-0\" × 11-0\""]] },
  { id: "12", ty: "5½", pi2: 1470, box: [0.6953, 0.1966, 0.2719, 0.1845], pieces: [["chambre 1", "12-0\" × 11-0\""], ["chambre 2", "11-0\" × 11-0\""], ["chambre 3", "10-0\" × 10-0\""], ["den", "9-6\" × 7-0\""]] },
  { id: "13", ty: "4½ + den", pi2: 1494, box: [0.7516, 0.0328, 0.2156, 0.1741], pieces: [["chambre 1", "12-0\" × 12-0\""], ["chambre 2", "10-6\" × 11-0\""], ["den", "9-6\" × 7-6\""]] },
  { id: "14", ty: "5½", pi2: 1626, box: [0.2953, 0.7293, 0.2016, 0.2172], pieces: [["chambre 1", "12-6\" × 13-0\""], ["chambre 2", "10-6\" × 12-0\""], ["chambre 3", "12-0\" × 12-0\""], ["den", "8-0\" × 10-6\""]] },
];
UNITES.forEach((u) => { u.m2 = +(u.pi2 / 10.764).toFixed(1); });

/* ------------------------------------------ la façade dans la volumétrie
   Boîtes relevées sur assets/skp-facade.jpg, normalisées 0–1.
   Sept travées, trois niveaux repérés. */

const SKP_IMG = { src: "assets/skp-facade.jpg", w: 1700, h: 1389 };

const TRAVEES_3D = {
  8: [[0.0653, 0.2297, 0.0288, 0.036], [0.2112, 0.2131, 0.03, 0.036], [0.2688, 0.2045, 0.0141, 0.0446], [0.3947, 0.1893, 0.0218, 0.0461], [0.4741, 0.1807, 0.0224, 0.0468], [0.5876, 0.2743, 0.0124, 0.0281], [0.77, 0.2988, 0.0118, 0.0425]],
  5: [[0.0476, 0.4939, 0.0465, 0.0302], [0.1929, 0.4838, 0.0488, 0.031], [0.2688, 0.4788, 0.0147, 0.0439], [0.3953, 0.4694, 0.0218, 0.0454], [0.4747, 0.4644, 0.0229, 0.0454], [0.5553, 0.4543, 0.0294, 0.0374], [0.7706, 0.4744, 0.0118, 0.0418]],
  2: [[0.0606, 0.7466, 0.0388, 0.0562], [0.1929, 0.7444, 0.0488, 0.0353], [0.2688, 0.7415, 0.0147, 0.0439], [0.3953, 0.7387, 0.0218, 0.0439], [0.4747, 0.7365, 0.0229, 0.0454], [0.5524, 0.7351, 0.0459, 0.0374], [0.7706, 0.7408, 0.0118, 0.0418]],
};
const FACADE_NOM = "Façade sud";

/* ------------------------------------------------------------------ écarts */

const ECARTS = [
  {
    id: "F-05-09", unite: "9", niveau: 5, travee: 1, genre: "redimensionnée", piece: "salon / cuisine",
    quoi: "Largeur différente de 240 mm", plan: { l: 1800, h: 1500 }, modele: { l: 1560, h: 1500 }, delta: 240,
    etat: "ouvert", note: "Le plan d’étage type porte 1 800 mm depuis R03. La volumétrie porte 1 560 mm.",
  },
  {
    id: "F-05-02", unite: "2", niveau: 5, travee: 3, genre: "déplacée", piece: "chambre 1",
    quoi: "Décalée de 420 mm", plan: { l: 1500, h: 1500 }, modele: { l: 1500, h: 1500 }, delta: 420,
    etat: "ouvert", note: "Même dimension, même allège. Seul l’axe diffère.",
  },
  {
    id: "F-05-13", unite: "13", niveau: 5, travee: 5, genre: "absente du modèle", piece: "salon / cuisine",
    quoi: "Au plan, pas au modèle", plan: { l: 2400, h: 1500 }, modele: null, delta: null,
    etat: "ouvert", note: "Aucune ouverture correspondante dans un rayon de 1 500 mm.",
  },
  {
    id: "F-05-12", unite: "12", niveau: 5, travee: 7, genre: "ambiguë", piece: "chambre 2",
    quoi: "Deux correspondances possibles", plan: { l: 1500, h: 1500 }, modele: { l: 1500, h: 1500 }, delta: 610,
    etat: "ouvert", note: "Deux ouvertures du modèle sont à portée. Le choix revient à une personne.",
  },
  {
    id: "F-02-07", unite: "7", niveau: 2, travee: 4, genre: "ajoutée au modèle", piece: "séjour",
    quoi: "Au modèle, pas au plan", plan: null, modele: { l: 1800, h: 1500 }, delta: null,
    etat: "ouvert", note: "Ouverture présente dans la volumétrie, absente du plan d’étage type.",
  },
  {
    id: "F-08-14", unite: "14", niveau: 8, travee: 2, genre: "redimensionnée", piece: "chambre 1",
    quoi: "Hauteur différente de 180 mm", plan: { l: 1800, h: 1680 }, modele: { l: 1800, h: 1500 }, delta: 180,
    etat: "ouvert", note: "Linteau relevé au plan à la révision R04.",
  },
  {
    id: "F-05-03", unite: "3", niveau: 5, travee: 6, genre: "déplacée", piece: "chambre 1",
    quoi: "Décalée de 95 mm", plan: { l: 1500, h: 1500 }, modele: { l: 1500, h: 1500 }, delta: 95,
    etat: "regle", decision: "Rien à corriger · écart sous la tolérance de 100 mm", note: "Sous le seuil de tolérance du projet.",
  },
];

/* Façade de rayonnement : la conséquence mesurée, jamais une conclusion. */
const IMPACT = {
  facade: "Sud",
  surfaceFacade: 410.0,
  avant: 68.5,
  apres: 74.2,
  get ecart() { return +(this.apres - this.avant).toFixed(1); },
  get pcAvant() { return +(this.avant / this.surfaceFacade * 100).toFixed(1); },
  get pcApres() { return +(this.apres / this.surfaceFacade * 100).toFixed(1); },
  manquants: ["Distance limitative", "Édition du code applicable", "Présence de gicleurs", "Méthode de calcul retenue"],
};

const MOI = { init: "JD", nom: "Julie Dubois", agence: "Atelier Nord" };

/* Pas de circuit d'approbation : l'agence est petite et tout se dit de vive
   voix. L'outil sert de source unique et garde la trace des changements. */
const JOURNAL = [
  { d: "24 oct · 09:12", qui: "JD", quoi: "Plan d’étage type importé en R04", det: "3 ouvertures modifiées, 1 ajoutée" },
  { d: "24 oct · 08:40", qui: "AC", quoi: "Volumétrie resynchronisée", det: "Option 2 · volume inchangé, 2 ouvertures déplacées" },
  { d: "22 oct · 16:05", qui: "JD", quoi: "F-05-03 — rien à corriger", det: "Écart de 95 mm, sous la tolérance de 100 mm" },
  { d: "21 oct · 11:30", qui: "AC", quoi: "Plan d’étage type importé en R03", det: "Référence courante de l’étage type" },
  { d: "18 oct · 14:22", qui: "JD", quoi: "Volumétrie passée de l’option 1 à l’option 2", det: "Retrait de l’attique au 8e" },
];

const DEPUIS = {
  "F-05-09": "Apparu avec l’étage type R04 · 24 oct",
  "F-05-02": "Apparu avec l’étage type R04 · 24 oct",
  "F-05-13": "Apparu avec l’étage type R04 · 24 oct",
  "F-05-12": "Présent depuis R03 · 21 oct",
  "F-02-07": "Apparu avec la volumétrie option 2 · 18 oct",
  "F-08-14": "Apparu avec l’étage type R04 · 24 oct",
  "F-05-03": "Réglé le 22 oct par JD",
};

/* ------------------------------------------------------------------ outils */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const ecartPar = (id) => ECARTS.find((e) => e.id === id);
const uniPar = (id) => UNITES.find((u) => u.id === id);
const ecartsUnite = (u) => ECARTS.filter((e) => e.unite === u);
const ecartsNiveau = (n) => ECARTS.filter((e) => e.niveau === n);
const ouverts = () => ECARTS.filter((e) => e.etat === "ouvert");
const vg = (n, d = 1) => n.toFixed(d).replace(".", ",");
const TYPO = { "3½": "a", "4½": "b", "5½": "c", "3½ + den": "a", "4½ + den": "b" };

/* ------------------------------------------------------------------ icônes */

const TRACES = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  dna: '<path d="M12 3v18M5 7l14 10M19 7L5 17"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  drawing: '<circle cx="12" cy="5" r="2"/><path d="M11 7 5 20M13 7l6 13"/><path d="M7.5 15h9"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1 2 2 0 0 1-4 0 1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a2 2 0 0 1 0-4 1.6 1.6 0 0 0 1.7-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6a2 2 0 0 1 4 0 1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 11a2 2 0 0 1 0 4z"/>',
  lien: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
  cube: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alerte: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 4v4h-4M3 20v-4h4"/>',
  externe: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
  loupe: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  orbite: '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-28 12 12)"/>',
  main: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V13"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a7 7 0 0 1-7-7v-1a1.5 1.5 0 0 1 3 0"/>',
  etendre: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  pt: '<circle cx="12" cy="12" r="8"/>',
};
function ico(n) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACES[n] || ""}</svg>`;
}

/* ------------------------------------------------------ navigation 08 */

const PROJETS_OUVERTS = [
  { k: "bal", nom: PROJET.nom },
  { k: "cmr", nom: "Condo Mont-Royal" },
  { k: "be", nom: "Beaubien Est" },
];

function railIcones(actif) {
  const sq = (k, nom, icone) =>
    `<button class="ic-sq" data-nav="${k}" title="${nom}" aria-label="${nom}"${actif === k ? ' aria-current="page"' : ""}>${ico(icone)}</button>`;
  return `<div class="rail">
    <span class="marque">ç<i>.</i></span>
    ${sq("projets", "Projets", "grid")}
    <span class="espace"></span>
    ${sq("param", "Paramètres", "settings")}
    <span class="av" title="${MOI.nom}">${MOI.init}</span>
  </div>`;
}

function ongletsProjets(actif) {
  return `<div class="ptabs">
    ${PROJETS_OUVERTS.map((p) => `<button class="ptab" data-projet="${p.k}"${p.k === actif ? ' aria-selected="true"' : ""}><span class="dot"></span><span class="nom">${p.nom}</span><span class="x">×</span></button>`).join("")}
    <button class="plus" data-nouveau="1" title="Ouvrir un projet">+</button>
  </div>`;
}

function ongletsPages(actif, pages, fin) {
  return `<div class="barre-onglets"><div class="tabs">
    ${pages.map(([k, nom, icone, badge]) =>
      `<button class="tab" data-nav="${k}"${actif === k ? ' aria-current="page"' : ""}>${ico(icone)}<span>${nom}</span>${badge ? `<span class="pastille">${badge}</span>` : ""}</button>`).join("")}
  </div>${fin ? `<div class="fin">${fin}</div>` : ""}</div>`;
}

function segments(nom, choix, actif) {
  return `<div class="seg" data-seg="${nom}">${choix.map((c) =>
    `<button data-val="${c}" aria-pressed="${c === actif}">${c}</button>`).join("")}</div>`;
}

/* ---------------------------------------------- calque sur le plan 2D */

function vuePlan(o) {
  o = Object.assign({ sel: null, typologie: false }, o);
  const c = [];
  UNITES.forEach((u) => {
    const x = u.box[0] * PLAN_IMG.w, y = u.box[1] * PLAN_IMG.h;
    const w = u.box[2] * PLAN_IMG.w, h = u.box[3] * PLAN_IMG.h;
    const on = o.sel === u.id;
    const ouv = ecartsUnite(u.id).filter((e) => e.etat === "ouvert").length;
    const fill = on ? "rgba(192,215,57,.42)" : "rgba(255,255,255,0)";
    c.push(`<g class="zu" data-unite="${u.id}" style="cursor:pointer">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${on ? "#5c6b0b" : "transparent"}" stroke-width="${on ? 3 : 0}" vector-effect="non-scaling-stroke"/>
      ${ouv ? `<g transform="translate(${x + w - 22} ${y + 22})">
        <circle r="15" fill="#eef4cf" stroke="#5c6b0b" stroke-width="2.4" vector-effect="non-scaling-stroke"/>
        <text y="5" text-anchor="middle" font-size="18" font-weight="700" font-family="ui-sans-serif,system-ui" fill="#5c6b0b">${ouv}</text></g>` : ""}
    </g>`);
  });
  return plaque(PLAN_IMG, c.join(""), o.typologie ? "" : "monochrome");
}

/* -------------------------------------------- calque sur la volumétrie */

function vue3d(o) {
  o = Object.assign({ niveau: 5, sel: null, reperes: true }, o);
  const boxes = TRAVEES_3D[o.niveau] || TRAVEES_3D[5];
  const c = [];
  // bandeau du niveau courant
  const bande = boxes.reduce((a, b) => [Math.min(a[0], b[1]), Math.max(a[1], b[1] + b[3])], [1, 0]);
  c.push(`<rect x="0" y="${(bande[0] - 0.012) * SKP_IMG.h}" width="${SKP_IMG.w}" height="${(bande[1] - bande[0] + 0.024) * SKP_IMG.h}" fill="#c0d739" fill-opacity=".13"/>`);
  boxes.forEach((b, i) => {
    const t = i + 1;
    const [x, y, w, h] = [b[0] * SKP_IMG.w, b[1] * SKP_IMG.h, b[2] * SKP_IMG.w, b[3] * SKP_IMG.h];
    const ec = ECARTS.find((e) => e.travee === t && e.niveau === o.niveau);
    const id = ec ? ec.id : `t${o.niveau}-${t}`;
    const on = o.sel === id;
    const g = [];
    if (ec && ec.etat === "ouvert") {
      if (ec.genre === "redimensionnée") {
        const k = ec.plan.l / ec.modele.l, dw = w * (k - 1) / 2;
        g.push(`<rect x="${x - dw}" y="${y}" width="${w + 2 * dw}" height="${h}" fill="#c0d739" fill-opacity=".45"/>`);
        g.push(boite(x, y, w, h, "plein"));
        g.push(boite(x - dw, y, w + 2 * dw, h, "tirete"));
      } else if (ec.genre === "déplacée" || ec.genre === "ambiguë") {
        const d = w * 1.15;
        g.push(boite(x, y, w, h, "plein"));
        g.push(boite(x + d, y, w, h, "tirete"));
        g.push(`<line x1="${x + w / 2}" y1="${y + h / 2}" x2="${x + d + w / 2}" y2="${y + h / 2}" stroke="#5c6b0b" stroke-width="3" vector-effect="non-scaling-stroke"/>`);
      } else if (ec.genre === "absente du modèle") {
        g.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c0d739" fill-opacity=".5"/>`);
        g.push(boite(x, y, w, h, "tirete"));
      } else {
        g.push(boite(x, y, w, h, "plein"));
        g.push(`<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" fill="none" stroke="#5c6b0b" stroke-width="3" vector-effect="non-scaling-stroke"/>`);
      }
      g.push(pastille(x + w / 2, y - 16, "!", "#eef4cf", "#5c6b0b"));
    } else if (ec && ec.etat === "regle") {
      g.push(boite(x, y, w, h, "plein", ".35"));
      g.push(pastille(x + w / 2, y - 16, "✓", "#ffffff", "#8e8e8e"));
    } else if (o.reperes) {
      g.push(boite(x, y, w, h, "plein", ".25"));
    }
    if (on) g.push(`<rect x="${x - 7}" y="${y - 7}" width="${w + 14}" height="${h + 14}" fill="none" stroke="#5c6b0b" stroke-width="3.5" vector-effect="non-scaling-stroke"/>`);
    c.push(`<g class="zf" data-ecart="${ec ? ec.id : ""}" data-fen="${id}" style="cursor:pointer">${g.join("")}</g>`);
  });
  const lab = `<text x="18" y="${(bande[0] - 0.022) * SKP_IMG.h}" font-size="26" font-family="ui-sans-serif,system-ui" fill="#3c3c38">Niveau ${o.niveau} · ${FACADE_NOM}</text>`;
  return plaque(SKP_IMG, c.join("") + lab, "");
}

function boite(x, y, w, h, style, op) {
  return style === "plein"
    ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#111" fill-opacity="${op || ".06"}" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#111" stroke-width="2.2" stroke-dasharray="7 4" vector-effect="non-scaling-stroke"/>`;
}
function pastille(x, y, t, fond, trait) {
  return `<g transform="translate(${x} ${y})"><circle r="11" fill="${fond}" stroke="${trait}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    <text y="4" text-anchor="middle" font-size="13" font-weight="700" font-family="ui-sans-serif,system-ui" fill="${trait}">${t}</text></g>`;
}

function plaque(img, calque, cls) {
  return `<div class="plaque ${cls}">
    <img src="${img.src}" alt="">
    <svg viewBox="0 0 ${img.w} ${img.h}" preserveAspectRatio="xMidYMid meet">${calque}</svg>
  </div>`;
}

/* ------------------------------------------------- pièce à conviction */

function svgPreuve(ec) {
  if (!ec) return "";
  const p = [];
  const Y0 = 52, HT = 96, X0 = 96, ech = 0.082;
  const lp = ec.plan ? ec.plan.l * ech : 0, lm = ec.modele ? ec.modele.l * ech : 0;
  const hp = ec.plan ? ec.plan.h * ech : 0, hm = ec.modele ? ec.modele.h * ech : 0;
  const dec = ec.genre === "déplacée" || ec.genre === "ambiguë" ? ec.delta * ech : 0;

  p.push('<rect width="460" height="210" fill="#fff"/>');
  p.push(`<path d="M40 ${Y0 + HT + 14}h380" stroke="#111" stroke-width="1.2"/>`);
  for (let x = 44; x < 420; x += 9) p.push(`<line x1="${x}" y1="${Y0 + HT + 14}" x2="${x - 5}" y2="${Y0 + HT + 20}" stroke="#9a9a9a" stroke-width=".8"/>`);

  if (ec.modele) {
    p.push(`<rect x="${X0}" y="${Y0 + HT - hm}" width="${lm}" height="${hm}" fill="#f2f1ee" stroke="#111" stroke-width="1.4" stroke-dasharray="6 3.5"/>`);
    p.push(`<text x="${X0 + lm / 2}" y="${Y0 + HT - hm - 9}" text-anchor="middle" font-size="11" font-family="ui-sans-serif,system-ui" fill="#6b6b6b">volumétrie 3D</text>`);
  }
  if (ec.plan) {
    const x = X0 + dec;
    if (!ec.modele) p.push(`<rect x="${x}" y="${Y0 + HT - hp}" width="${lp}" height="${hp}" fill="#eef4cf"/>`);
    p.push(`<rect x="${x}" y="${Y0 + HT - hp}" width="${lp}" height="${hp}" fill="none" stroke="#111" stroke-width="1.6"/>`);
    p.push(`<text x="${x + lp / 2}" y="${Y0 + HT + 32}" text-anchor="middle" font-size="11" font-family="ui-sans-serif,system-ui" fill="#111">plan 2D</text>`);
  }
  if (ec.delta) {
    const yc = Y0 - 16;
    let a, b;
    if (ec.genre === "redimensionnée" && ec.plan.l !== ec.modele.l) { a = X0 + lm; b = X0 + lp; }
    else if (ec.genre === "redimensionnée") { a = X0; b = X0 + lp; }
    else { a = X0; b = X0 + dec; }
    p.push(`<rect x="${Math.min(a, b)}" y="${Y0 + HT - Math.max(hp, hm)}" width="${Math.abs(b - a)}" height="${Math.max(hp, hm)}" fill="#c0d739" fill-opacity=".3"/>`);
    p.push(`<line x1="${a}" y1="${yc}" x2="${b}" y2="${yc}" stroke="#5c6b0b" stroke-width="1.6"/>`);
    p.push(`<line x1="${a}" y1="${yc - 6}" x2="${a}" y2="${yc + 6}" stroke="#5c6b0b" stroke-width="1.6"/>`);
    p.push(`<line x1="${b}" y1="${yc - 6}" x2="${b}" y2="${yc + 6}" stroke="#5c6b0b" stroke-width="1.6"/>`);
    p.push(`<text x="${(a + b) / 2}" y="${yc - 12}" text-anchor="middle" font-size="14" font-weight="700" font-family="ui-sans-serif,system-ui" fill="#5c6b0b">${ec.delta} mm</text>`);
  } else {
    p.push(`<text x="${X0 + Math.max(lp, lm) / 2}" y="${Y0 - 20}" text-anchor="middle" font-size="13" font-weight="600" font-family="ui-sans-serif,system-ui" fill="#5c6b0b">${ec.genre}</text>`);
  }
  p.push(`<text x="40" y="200" font-size="11" font-family="ui-monospace,monospace" fill="#9a9a9a">${ec.id} · unité ${ec.unite} · niveau ${ec.niveau} · travée ${ec.travee}</text>`);
  return `<svg viewBox="0 0 460 210" preserveAspectRatio="xMidYMid meet">${p.join("")}</svg>`;
}

function vign(ec) {
  const d = ec.genre === "déplacée" || ec.genre === "ambiguë" ? 7 : 0;
  const k = ec.genre === "redimensionnée" ? 1.35 : 1;
  const m = ec.modele ? `<rect x="8" y="12" width="16" height="16" fill="#f2f1ee" stroke="#111" stroke-width="1.1" stroke-dasharray="3 2"/>` : "";
  const pl = ec.plan ? `<rect x="${8 + d}" y="12" width="${16 * k}" height="16" fill="${ec.modele ? "none" : "#eef4cf"}" stroke="#111" stroke-width="1.3"/>` : "";
  return `<svg viewBox="0 0 44 44">${m}${pl}<line x1="4" y1="33" x2="40" y2="33" stroke="#111" stroke-width="1"/></svg>`;
}
