/* ça fitte — données fictives et dessin partagés par les deux prototypes.
   Toutes les valeurs sont illustratives. */

const NB = "\u202f"; // espace fine insécable

const PROJET = {
  nom: "Résidence Papineau",
  lieu: "Montréal (QC)",
  phase: "Dossier préliminaire",
  code: "RMC-001",
  typologie: "Copropriété résidentielle",
  niveaux: 6,
  reference: { rev: "R03", date: "10 janvier 2026", etat: "Acceptée" },
  courante: { rev: "R04", date: "24 janvier 2026", etat: "À réviser" },
  fichiers: {
    plan: { nom: "RMC-001_Plans_R04.dxf", poids: "12,4 Mo", source: "AutoCAD · plans d'étage 2D", detecte: "24 symboles de fenêtre" },
    modele: { nom: "RMC-001_Volumetrie_R04.dae", poids: "86,1 Mo", source: "SketchUp · volumétrie 3D", detecte: "26 ouvertures de façade" }
  }
};

/* 7 écarts. Les cinq types demandés sont représentés. */
const ECARTS = [
  {
    id: "F-204", type: "redimensionnee", libelle: "Redimensionnée",
    facade: "est", travee: 3, niveau: 2, piece: "Séjour", unite: "2-03",
    resume: "Plan 1" + NB + "800" + NB + "mm · modèle 1" + NB + "560" + NB + "mm",
    delta: "240" + NB + "mm", gravite: "haute", statut: "ouvert", confiance: 93,
    plan: { l: 1800, h: 1500, allege: 900 }, modele: { l: 1560, h: 1500, allege: 900 },
    aire: { plan: 2.70, modele: 2.34 },
    explication: "Deux ouvertures occupent la même position à ±40" + NB + "mm près. La largeur diffère de 240" + NB + "mm. Fitte propose qu'il s'agisse de la même fenêtre physique."
  },
  {
    id: "F-207", type: "deplacee", libelle: "Déplacée",
    facade: "est", travee: 5, niveau: 3, piece: "Chambre", unite: "3-05",
    resume: "Décalage horizontal de 420" + NB + "mm",
    delta: "420" + NB + "mm", gravite: "haute", statut: "ouvert", confiance: 88,
    plan: { l: 1500, h: 1500, allege: 900 }, modele: { l: 1500, h: 1500, allege: 900 },
    aire: { plan: 2.25, modele: 2.25 },
    explication: "Dimensions identiques, position différente. Le modèle n'a probablement pas suivi la révision du plan."
  },
  {
    id: "F-211", type: "absente", libelle: "Absente du modèle",
    facade: "est", travee: 6, niveau: 2, piece: "Cuisine", unite: "2-06",
    resume: "Présente au plan, introuvable au modèle",
    delta: "2,16" + NB + "m²", gravite: "haute", statut: "ouvert", confiance: null,
    plan: { l: 1200, h: 1800, allege: 700 }, modele: null,
    aire: { plan: 2.16, modele: 0 },
    explication: "Aucune ouverture du modèle ne correspond dans la tolérance de 150" + NB + "mm. Fenêtre ajoutée au plan, ou volumétrie simplifiée."
  },
  {
    id: "F-309", type: "ambigue", libelle: "Ambiguë",
    facade: "est", travee: 2, niveau: 4, piece: "Séjour", unite: "4-02",
    resume: "Deux correspondances possibles au modèle",
    delta: "—", gravite: "moyenne", statut: "ouvert", confiance: 51,
    plan: { l: 2400, h: 1500, allege: 900 }, modele: { l: 1200, h: 1500, allege: 900 },
    aire: { plan: 3.60, modele: 1.80 },
    explication: "Une baie au plan face à deux ouvertures au modèle. Un partage en deux unités est possible. Confirmation requise."
  },
  {
    id: "F-305", type: "ajoutee", libelle: "Ajoutée au modèle",
    facade: "nord", travee: 1, niveau: 3, piece: "Chambre", unite: "3-01",
    resume: "Présente au modèle, absente du plan",
    delta: "1,44" + NB + "m²", gravite: "moyenne", statut: "en revision", confiance: null,
    plan: null, modele: { l: 1200, h: 1200, allege: 1000 },
    aire: { plan: 0, modele: 1.44 },
    explication: "Ouverture modélisée sans contrepartie au plan. Peut être une fenêtre d'étude non reportée."
  },
  {
    id: "F-312", type: "retiree", libelle: "Retirée depuis R03",
    facade: "ouest", travee: 4, niveau: 2, piece: "Rangement", unite: "2-04",
    resume: "Présente en R03, absente des deux sources en R04",
    delta: "−0,96" + NB + "m²", gravite: "basse", statut: "regle", confiance: null,
    plan: null, modele: null,
    aire: { plan: 0, modele: 0 },
    explication: "Retrait volontaire confirmé par l'équipe le 22 janvier. Conservé au registre comme écart résolu."
  },
  {
    id: "F-318", type: "redimensionnee", libelle: "Redimensionnée",
    facade: "ouest", travee: 6, niveau: 5, piece: "Séjour", unite: "5-06",
    resume: "Plan 1" + NB + "680" + NB + "mm · modèle 1" + NB + "500" + NB + "mm",
    delta: "180" + NB + "mm", gravite: "moyenne", statut: "ouvert", confiance: 90,
    plan: { l: 1680, h: 1500, allege: 900 }, modele: { l: 1500, h: 1500, allege: 900 },
    aire: { plan: 2.52, modele: 2.25 },
    explication: "Écart de largeur de 180" + NB + "mm, sous le seuil d'impact mais au-dessus de la tolérance."
  }
];

const FACADES = [
  { id: "est", nom: "Façade est", ecarts: 4, etat: "Révision requise", classe: "attention" },
  { id: "nord", nom: "Façade nord", ecarts: 1, etat: "Ouvert", classe: "ouvert" },
  { id: "ouest", nom: "Façade ouest", ecarts: 2, etat: "1 réglé", classe: "regle" },
  { id: "sud", nom: "Façade sud", ecarts: 0, etat: "Aucun écart", classe: "neutre" }
];

const IMPACT = {
  facade: "Façade est",
  aireFacade: 200.0,
  reference: 30.2,
  courante: 35.0,
  delta: 4.8,
  pourcentage: 17.5,
  pourcentageRef: 15.1,
  etat: "Géométrie seulement",
  intrants: [
    { nom: "Aire de la façade de rayonnement", valeur: "200,0" + NB + "m²", source: "Saisie par l'utilisateur", etat: "Confirmée", ok: true },
    { nom: "Géométrie des ouvertures", valeur: "Issue de la comparaison", source: "Mesurée · 6 confirmées sur 7", etat: "Partielle", ok: null },
    { nom: "Distance limitative", valeur: "Non renseignée", source: "—", etat: "Saisie requise", ok: false },
    { nom: "Édition du code applicable", valeur: "Non renseignée", source: "—", etat: "Saisie requise", ok: false },
    { nom: "Hypothèse de gicleurs", valeur: "Non confirmée", source: "—", etat: "Non confirmée", ok: false },
    { nom: "Méthode de calcul", valeur: "Non sélectionnée", source: "—", etat: "Saisie requise", ok: false }
  ]
};

const REVISEURS = [
  "Alexandre Chénier — architecte responsable",
  "Marie-Pier Gagnon — architecte associée",
  "Consultant en code du bâtiment (externe)"
];

/* ---------------------------------------------------------------- outils */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const ecartPar = (id) => ECARTS.find((e) => e.id === id);
const ecartsFacade = (f) => ECARTS.filter((e) => e.facade === f);

function icone(nom) {
  const p = {
    fleche: '<path d="M4 10h12M11 5l5 5-5 5"/>',
    retour: '<path d="M16 10H4M9 5L4 10l5 5"/>',
    depot: '<path d="M10 13V3M6 7l4-4 4 4"/><path d="M3 13v3a1 1 0 001 1h12a1 1 0 001-1v-3"/>',
    doc: '<path d="M5 2h6l4 4v12H5z"/><path d="M11 2v4h4"/>',
    cube: '<path d="M10 2l7 4v8l-7 4-7-4V6z"/><path d="M3 6l7 4 7-4M10 10v8"/>',
    alerte: '<path d="M10 3L2 17h16z"/><path d="M10 8v4M10 15h.01"/>',
    coche: '<path d="M4 10.5l4 4 8-9"/>',
    info: '<circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 6h.01"/>',
    croix: '<path d="M5 5l10 10M15 5L5 15"/>',
    loupe: '<circle cx="9" cy="9" r="5.5"/><path d="M13 13l4 4"/>',
    telecharger: '<path d="M10 3v9M6 8l4 4 4-4"/><path d="M3 15v2h14v-2"/>',
    lien: '<path d="M8 12a3 3 0 010-4l2-2a3 3 0 014 4l-1 1"/><path d="M12 8a3 3 0 010 4l-2 2a3 3 0 01-4-4l1-1"/>',
    interdit: '<circle cx="10" cy="10" r="7"/><path d="M5 5l10 10"/>',
    personne: '<circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>',
    plan: '<path d="M3 3h14v14H3z"/><path d="M3 8h14M8 3v14"/>',
    elevation: '<path d="M3 17V7l7-4 7 4v10z"/><path d="M8 17v-5h4v5"/>',
    superpose: '<path d="M3 7l7-4 7 4-7 4z"/><path d="M3 13l7 4 7-4"/>'
  }[nom] || "";
  return '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>";
}

/* ------------------------------------------------- élévation est (hero) */
const ELEV = { x0: 92, x1: 908, sol: 582, hNiv: 80, hRdc: 94, travees: 7 };

function bandeNiveau(n) {
  const bas = n === 1 ? ELEV.sol : ELEV.sol - ELEV.hRdc - (n - 2) * ELEV.hNiv;
  const haut = n === 1 ? ELEV.sol - ELEV.hRdc : bas - ELEV.hNiv;
  return { haut: haut, bas: bas };
}
function traveeX(t) {
  const l = (ELEV.x1 - ELEV.x0) / ELEV.travees;
  return ELEV.x0 + (t - 0.5) * l;
}

/* fenêtres de la façade est : 7 travées × 6 niveaux */
function svgElevation(opt) {
  opt = opt || {};
  const surligne = opt.surligne || null;      // id d'écart sélectionné
  const comptees = opt.comptees || false;     // mode impact : teinter les ouvertures comptées
  const montrerRef = opt.montrerRef || false; // superposer la géométrie R03
  let s = "";

  // sol + contexte
  s += '<rect x="0" y="0" width="1000" height="640" fill="#faf9f7"/>';
  s += '<path d="M0 582h1000" stroke="#b8b7b3" stroke-width="1.2"/>';


  // volume
  const toit = bandeNiveau(6).haut;
  s += '<rect x="' + ELEV.x0 + '" y="' + (toit - 14) + '" width="' + (ELEV.x1 - ELEV.x0) + '" height="' + (ELEV.sol - toit + 14) + '" fill="#ffffff" stroke="#111" stroke-width="1.4"/>';
  s += '<path d="M' + ELEV.x0 + " " + toit + "H" + ELEV.x1 + '" stroke="#111" stroke-width="1"/>';

  // planchers + repères de niveau
  for (let n = 1; n <= 6; n++) {
    const b = bandeNiveau(n);
    s += '<path d="M' + ELEV.x0 + " " + b.haut + "H" + ELEV.x1 + '" stroke="#cfcecb" stroke-width="1"/>';
    s += '<path d="M' + (ELEV.x1 + 6) + " " + b.haut + "H" + (ELEV.x1 + 52) + '" stroke="#e0dfdb" stroke-width="1"/>';
    s += '<text x="' + (ELEV.x1 + 10) + '" y="' + (b.haut + 13) + '" font-family="ui-monospace,Menlo,monospace" font-size="10" fill="#9a9a9a">Niveau 0' + n + "</text>";
  }
  // trumeaux
  for (let t = 1; t < ELEV.travees; t++) {
    const x = ELEV.x0 + t * ((ELEV.x1 - ELEV.x0) / ELEV.travees);
    s += '<path d="M' + x + " " + toit + "V" + ELEV.sol + '" stroke="#eceae6" stroke-width="1"/>';
  }

  const lF = 74, hF = 46;
  for (let n = 1; n <= 6; n++) {
    const b = bandeNiveau(n);
    for (let t = 1; t <= ELEV.travees; t++) {
      const cx = traveeX(t), cy = b.haut + (n === 1 ? 40 : 34);
      const ec = ECARTS.find((e) => e.facade === "est" && e.travee === t && e.niveau === n);
      const x = cx - lF / 2, y = cy - hF / 2;
      const sel = ec && surligne === ec.id;

      if (ec && ec.type === "absente") {
        // au plan seulement : contour plein, aucune contrepartie au modèle
        s += '<g data-fen="' + ec.id + '" class="fen" style="cursor:pointer">';
        s += '<rect x="' + x + '" y="' + y + '" width="' + lF + '" height="' + hF + '" fill="#fff" stroke="#111" stroke-width="1.6"/>';
        s += '<path d="M' + x + " " + y + "l" + lF + " " + hF + "M" + (x + lF) + " " + y + "l-" + lF + " " + hF + '" stroke="#cfcecb" stroke-width="1"/>';
      } else if (ec && ec.type === "redimensionnee") {
        const lM = lF * (ec.modele.l / ec.plan.l);
        s += '<g data-fen="' + ec.id + '" class="fen" style="cursor:pointer">';
        s += '<rect x="' + x + '" y="' + y + '" width="' + lF + '" height="' + hF + '" fill="#f1f6da" stroke="#111" stroke-width="1.6"/>';
        s += '<rect x="' + (cx - lM / 2) + '" y="' + y + '" width="' + lM + '" height="' + hF + '" fill="none" stroke="#111" stroke-width="1.3" stroke-dasharray="4 3"/>';
      } else if (ec && ec.type === "deplacee") {
        const dx = 13;
        s += '<g data-fen="' + ec.id + '" class="fen" style="cursor:pointer">';
        s += '<rect x="' + x + '" y="' + y + '" width="' + lF + '" height="' + hF + '" fill="#f1f6da" stroke="#111" stroke-width="1.6"/>';
        s += '<rect x="' + (x + dx) + '" y="' + y + '" width="' + lF + '" height="' + hF + '" fill="none" stroke="#111" stroke-width="1.3" stroke-dasharray="4 3"/>';
        s += '<path d="M' + (cx + 4) + " " + (cy + hF / 2 + 9) + "h" + (dx - 2) + '" stroke="#6f7f0d" stroke-width="1.4" marker-end="url(#pointe)"/>';
      } else if (ec && ec.type === "ambigue") {
        s += '<g data-fen="' + ec.id + '" class="fen" style="cursor:pointer">';
        s += '<rect x="' + (x - 10) + '" y="' + y + '" width="' + (lF + 20) + '" height="' + hF + '" fill="#f1f6da" stroke="#111" stroke-width="1.6"/>';
        s += '<rect x="' + (x - 6) + '" y="' + (y + 3) + '" width="' + (lF / 2 - 2) + '" height="' + (hF - 6) + '" fill="none" stroke="#111" stroke-width="1.2" stroke-dasharray="3 3"/>';
        s += '<rect x="' + (x + lF / 2 + 8) + '" y="' + (y + 3) + '" width="' + (lF / 2 - 2) + '" height="' + (hF - 6) + '" fill="none" stroke="#111" stroke-width="1.2" stroke-dasharray="3 3"/>';
        s += '<text x="' + cx + '" y="' + (y - 5) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#111">?</text>';
      } else {
        // conforme : contexte neutre
        const teinte = comptees ? "#ececea" : "#f4f3f0";
        s += '<g class="fen-neutre">';
        s += '<rect x="' + x + '" y="' + y + '" width="' + lF + '" height="' + hF + '" fill="' + teinte + '" stroke="#cfcecb" stroke-width="1"/>';
        s += '<path d="M' + cx + " " + y + "V" + (y + hF) + '" stroke="#e0dfdb" stroke-width="1"/>';
      }

      if (ec) {
        if (sel) {
          s += '<rect x="' + (x - 9) + '" y="' + (y - 9) + '" width="' + (lF + 18) + '" height="' + (hF + 18) + '" fill="none" stroke="#6f7f0d" stroke-width="2"/>';
          s += '<rect x="' + (x - 13) + '" y="' + (y - 13) + '" width="' + (lF + 26) + '" height="' + (hF + 26) + '" fill="none" stroke="#c0d739" stroke-width="3" opacity=".55"/>';
        }
        s += '<rect class="cible" x="' + (x - 14) + '" y="' + (y - 14) + '" width="' + (lF + 28) + '" height="' + (hF + 28) + '" fill="transparent"/>';
        s += '<text x="' + cx + '" y="' + (y + hF + 15) + '" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="10" font-weight="700" fill="#111">' + ec.id + "</text>";
        s += "</g>";
      } else {
        s += "</g>";
      }
      // balcons sur les travées paires
      if (t % 2 === 0 && n > 1) {
        s += '<path d="M' + (cx - 46) + " " + (b.bas - 4) + "h92" + '" stroke="#b8b7b3" stroke-width="2.5"/>';
      }
    }
  }

  if (comptees) {
    s += '<text x="' + ELEV.x0 + '" y="' + (toit - 24) + '" font-size="11" fill="#6b6b6b">Ouvertures comptées dans l\u2019aire des ouvertures non protégées</text>';
  }

  return '<svg viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid meet">' +
    '<defs><marker id="pointe" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1l6 3-6 3z" fill="#6f7f0d"/></marker></defs>' +
    s + "</svg>";
}

/* ------------------------------------------------------- plan d'étage */
function svgPlan(opt) {
  opt = opt || {};
  const surligne = opt.surligne || null;
  const niveau = opt.niveau || 2;
  const X0 = 92, X1 = 908, Y0 = 86, Y1 = 374, m = 9;
  let s = '<rect x="0" y="0" width="1000" height="470" fill="#faf9f7"/>';

  // murs extérieurs (double trait)
  s += '<rect x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '" fill="#fff" stroke="#111" stroke-width="1.4"/>';
  s += '<rect x="' + (X0 + m) + '" y="' + (Y0 + m) + '" width="' + (X1 - X0 - 2 * m) + '" height="' + (Y1 - Y0 - 2 * m) + '" fill="none" stroke="#111" stroke-width="1.1"/>';

  // corridor
  s += '<path d="M' + (X0 + m) + " 218H" + (X1 - m) + "M" + (X0 + m) + " 248H" + (X1 - m) + '" stroke="#111" stroke-width="1"/>';
  s += '<text x="500" y="237" text-anchor="middle" font-size="10" fill="#9a9a9a" letter-spacing=".08em">CORRIDOR</text>';

  // refends + pièces
  const l = (X1 - X0) / 7;
  const pieces = ["Séjour", "Cuisine", "Chambre", "Séjour", "Chambre", "Cuisine", "Séjour"];
  for (let t = 1; t <= 7; t++) {
    const xa = X0 + (t - 1) * l, xb = X0 + t * l;
    if (t > 1) {
      s += '<path d="M' + xa + " " + (Y0 + m) + "V218M" + xa + " 248V" + (Y1 - m) + '" stroke="#111" stroke-width="1"/>';
    }
    s += '<text x="' + (xa + l / 2) + '" y="196" text-anchor="middle" font-size="10.5" fill="#6b6b6b">' + pieces[t - 1] + "</text>";
    s += '<text x="' + (xa + l / 2) + '" y="286" text-anchor="middle" font-size="10.5" fill="#6b6b6b">' + pieces[7 - t] + "</text>";
    s += '<text x="' + (xa + l / 2) + '" y="300" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="9" fill="#b8b7b3">' + niveau + "-0" + t + "</text>";
  }
  // noyau
  s += '<rect x="452" y="' + (Y0 + m) + '" width="96" height="' + (218 - Y0 - m) + '" fill="#f2f1ee" stroke="#111" stroke-width="1"/>';
  s += '<path d="M452 100h96M452 114h96M452 128h96M452 142h96" stroke="#cfcecb" stroke-width="1"/>';
  s += '<text x="500" y="166" text-anchor="middle" font-size="9.5" fill="#9a9a9a">NOYAU</text>';

  // ouvertures : mur du bas = façade est
  for (let t = 1; t <= 7; t++) {
    const cx = X0 + (t - 0.5) * l;
    const ec = ECARTS.find((e) => e.facade === "est" && e.travee === t && e.niveau === niveau);
    const lo = ec && ec.type === "ambigue" ? 96 : 68;
    const x = cx - lo / 2;
    s += '<g' + (ec ? ' data-fen="' + ec.id + '" class="fen" style="cursor:pointer"' : "") + ">";
    s += '<rect x="' + x + '" y="' + (Y1 - m - 0.5) + '" width="' + lo + '" height="' + (m + 1) + '" fill="#fff"/>';
    s += '<path d="M' + x + " " + (Y1 - m) + "h" + lo + "M" + x + " " + Y1 + "h" + lo + "M" + x + " " + (Y1 - m / 2) + "h" + lo + '" stroke="#111" stroke-width="1"/>';
    if (ec) {
      if (ec.type === "redimensionnee") {
        const lm = lo * (ec.modele.l / ec.plan.l);
        s += '<path d="M' + (cx - lm / 2) + " " + (Y1 + 7) + "h" + lm + '" stroke="#111" stroke-width="1.4" stroke-dasharray="4 3"/>';
      }
      if (surligne === ec.id) {
        s += '<rect x="' + (x - 8) + '" y="' + (Y1 - m - 9) + '" width="' + (lo + 16) + '" height="' + (m + 18) + '" fill="none" stroke="#6f7f0d" stroke-width="2"/>';
      }
      s += '<rect class="cible" x="' + (x - 10) + '" y="' + (Y1 - m - 12) + '" width="' + (lo + 20) + '" height="' + (m + 24) + '" fill="transparent"/>';
      s += '<text x="' + cx + '" y="' + (Y1 + 24) + '" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="9.5" font-weight="700">' + ec.id + "</text>";
    }
    s += "</g>";
    // mur du haut = façade ouest, ouvertures neutres
    s += '<rect x="' + (cx - 34) + '" y="' + (Y0 - 0.5) + '" width="68" height="' + (m + 1) + '" fill="#fff"/>';
    s += '<path d="M' + (cx - 34) + " " + Y0 + "h68M" + (cx - 34) + " " + (Y0 + m) + "h68" + '" stroke="#cfcecb" stroke-width="1"/>';
  }

  // repères d'axes
  for (let t = 1; t <= 8; t++) {
    const x = X0 + (t - 1) * l;
    s += '<circle cx="' + x + '" cy="54" r="9" fill="#fff" stroke="#b8b7b3" stroke-width="1"/>';
    s += '<text x="' + x + '" y="58" text-anchor="middle" font-size="9.5" fill="#6b6b6b">' + t + "</text>";
    s += '<path d="M' + x + " 63V" + Y0 + '" stroke="#e4e3df" stroke-width="1"/>';
  }

  // étiquettes de façade + nord
  s += '<text x="500" y="' + (Y1 + 42) + '" text-anchor="middle" font-size="10" fill="#111" letter-spacing=".1em" font-weight="600">FAÇADE EST</text>';
  s += '<text x="500" y="' + (Y0 - 28) + '" text-anchor="middle" font-size="10" fill="#b8b7b3" letter-spacing=".1em">FAÇADE OUEST</text>';
  s += '<g transform="translate(46,230)"><circle r="17" fill="#fff" stroke="#cfcecb"/><path d="M-9 0h14" stroke="#111" stroke-width="1.2" marker-end="url(#nord)"/><text x="-2" y="-7" text-anchor="middle" font-size="9" font-weight="700">N</text></g>';
  s += '<text x="' + (X1 + 16) + '" y="234" font-size="10" fill="#b8b7b3" letter-spacing=".1em">SUD</text>';

  // cote générale
  s += '<path d="M' + X0 + ' 410h' + (X1 - X0) + '" stroke="#b8b7b3" stroke-width="1"/>';
  s += '<path d="M' + X0 + ' 404v12M' + X1 + ' 404v12" stroke="#b8b7b3" stroke-width="1"/>';
  s += '<text x="500" y="406" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="10" fill="#6b6b6b">32' + NB + '400 mm</text>';

  return '<svg viewBox="0 0 1000 470" preserveAspectRatio="xMidYMid meet">' +
    '<defs><marker id="nord" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1l6 3-6 3z" fill="#111"/></marker></defs>' +
    s + "</svg>";
}

/* --------------------------------------- détail d'une fenêtre (preuve) */
function svgDetail(ec) {
  if (!ec) return "";
  const W = 560, mur = { y: 150, h: 30 };
  const ref = Math.max(ec.plan ? ec.plan.l : 0, ec.modele ? ec.modele.l : 0) || 1800;
  const ech = 230 / ref;
  const cx = W / 2;
  let s = '<rect x="0" y="0" width="560" height="300" fill="#faf9f7"/>';

  // mur avec hachure
  s += '<defs><pattern id="hach" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><path d="M0 0v7" stroke="#d8d7d3" stroke-width="1.4"/></pattern></defs>';
  s += '<rect x="40" y="' + mur.y + '" width="480" height="' + mur.h + '" fill="url(#hach)" stroke="#111" stroke-width="1.3"/>';

  const lp = ec.plan ? ec.plan.l * ech : 0;
  const lm = ec.modele ? ec.modele.l * ech : 0;

  if (ec.plan) {
    s += '<rect x="' + (cx - lp / 2) + '" y="' + (mur.y - 1) + '" width="' + lp + '" height="' + (mur.h + 2) + '" fill="#fff"/>';
    s += '<path d="M' + (cx - lp / 2) + " " + mur.y + "h" + lp + "M" + (cx - lp / 2) + " " + (mur.y + mur.h) + "h" + lp + "M" + (cx - lp / 2) + " " + (mur.y + mur.h / 2) + "h" + lp + '" stroke="#111" stroke-width="1.3"/>';
    s += '<path d="M' + (cx - lp / 2) + " " + (mur.y - 26) + "v" + (mur.h + 52) + "M" + (cx + lp / 2) + " " + (mur.y - 26) + "v" + (mur.h + 52) + '" stroke="#111" stroke-width="1"/>';
    // cote plan au-dessus
    s += cote(cx - lp / 2, cx + lp / 2, mur.y - 44, (ec.plan.l + "").replace(/\B(?=(\d{3})+(?!\d))/g, NB) + NB + "mm", "Plan (2D)", false);
  }
  if (ec.modele) {
    const dec = ec.type === "deplacee" ? 42 : 0;
    s += '<rect x="' + (cx - lm / 2 + dec) + '" y="' + (mur.y + mur.h + 16) + '" width="' + lm + '" height="10" fill="none" stroke="#111" stroke-width="1.3" stroke-dasharray="5 3"/>';
    s += cote(cx - lm / 2 + dec, cx + lm / 2 + dec, mur.y + mur.h + 54, (ec.modele.l + "").replace(/\B(?=(\d{3})+(?!\d))/g, NB) + NB + "mm", "Modèle (3D)", true);
  }

  // delta vert
  if (ec.plan && ec.modele && ec.plan.l !== ec.modele.l) {
    const a = cx - lp / 2, b = cx - lm / 2;
    s += '<rect x="' + a + '" y="' + mur.y + '" width="' + (b - a) + '" height="' + mur.h + '" fill="#c0d739" opacity=".8"/>';
    s += '<rect x="' + (cx + lm / 2) + '" y="' + mur.y + '" width="' + (b - a) + '" height="' + mur.h + '" fill="#c0d739" opacity=".8"/>';
    s += '<text x="' + cx + '" y="' + (mur.y + mur.h / 2 + 5) + '" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="15" font-weight="700" fill="#111">écart ' + ec.delta + "</text>";
  }
  if (ec.type === "deplacee") {
    s += '<path d="M' + cx + " " + (mur.y + mur.h + 36) + "h42" + '" stroke="#6f7f0d" stroke-width="2" marker-end="url(#pt2)"/>';
    s += '<text x="' + (cx + 21) + '" y="' + (mur.y + mur.h + 32) + '" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="11" font-weight="700" fill="#6f7f0d">' + ec.delta + "</text>";
  }
  if (!ec.modele && ec.plan) {
    s += '<text x="' + cx + '" y="' + (mur.y + mur.h + 48) + '" text-anchor="middle" font-size="11.5" fill="#6b6b6b">Aucune ouverture correspondante au modèle</text>';
  }
  if (!ec.plan && ec.modele) {
    s += '<text x="' + cx + '" y="' + (mur.y - 50) + '" text-anchor="middle" font-size="11.5" fill="#6b6b6b">Aucune ouverture correspondante au plan</text>';
  }

  s += '<text x="40" y="282" font-size="12" fill="#9a9a9a">Coupe au droit de l\u2019ouverture · ' + ec.piece + " · unité " + ec.unite + " · niveau 0" + ec.niveau + "</text>";

  return '<svg viewBox="24 78 512 214" preserveAspectRatio="xMidYMid meet">' +
    '<defs><marker id="pt2" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1l6 3-6 3z" fill="#6f7f0d"/></marker></defs>' + s + "</svg>";
}

function cote(x1, x2, y, texte, etiquette, tirete) {
  const d = tirete ? ' stroke-dasharray="5 3"' : "";
  let s = '<path d="M' + x1 + " " + y + "H" + x2 + '" stroke="#111" stroke-width="1"' + d + "/>";
  s += '<path d="M' + x1 + " " + (y - 4) + "v8M" + x2 + " " + (y - 4) + 'v8" stroke="#111" stroke-width="1"/>';
  s += '<rect x="' + ((x1 + x2) / 2 - 56) + '" y="' + (y - 12) + '" width="112" height="19" fill="#faf9f7"/>';
  s += '<text x="' + ((x1 + x2) / 2) + '" y="' + (y + 2) + '" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="15" font-weight="600" fill="#111">' + texte + "</text>";
  s += '<text x="' + ((x1 + x2) / 2) + '" y="' + (y + (tirete ? 20 : -19)) + '" text-anchor="middle" font-size="11.5" fill="#9a9a9a" letter-spacing=".06em">' + etiquette.toUpperCase() + "</text>";
  return s;
}

/* vignette 38px pour les listes */
function vignette(ec) {
  const t = ec.type;
  let g = '<rect x="4" y="12" width="30" height="16" fill="#fff" stroke="#111" stroke-width="1.4"/>';
  if (t === "redimensionnee") g += '<rect x="9" y="12" width="20" height="16" fill="none" stroke="#111" stroke-width="1.1" stroke-dasharray="3 2"/>';
  if (t === "deplacee") g += '<rect x="10" y="12" width="30" height="16" fill="none" stroke="#111" stroke-width="1.1" stroke-dasharray="3 2"/>';
  if (t === "absente") g += '<path d="M4 12l30 16M34 12L4 28" stroke="#cfcecb" stroke-width="1.2"/>';
  if (t === "ajoutee") g = '<rect x="4" y="12" width="30" height="16" fill="#f1f6da" stroke="#111" stroke-width="1.2" stroke-dasharray="3 2"/><path d="M19 15v10M14 20h10" stroke="#6f7f0d" stroke-width="1.4"/>';
  if (t === "ambigue") g += '<text x="19" y="25" text-anchor="middle" font-size="12" font-weight="700" fill="#111">?</text>';
  if (t === "retiree") g = '<rect x="4" y="12" width="30" height="16" fill="none" stroke="#cfcecb" stroke-width="1.2" stroke-dasharray="2 2"/>';
  return '<svg viewBox="0 0 38 38">' + g + "</svg>";
}

/* ------------------------------------------------------------- outils UI */
function majEtat(el, texte, classe) {
  el.className = "etat " + (classe || "");
  el.textContent = texte;
}

/* simulation de téléversement */
function simulerDepot(zone, info, apresFini) {
  zone.innerHTML =
    '<div class="fichier"><span style="color:var(--ink-3)">' + icone("doc") + "</span>" +
    '<div class="grow"><div class="nom">' + info.nom + '</div><div class="det">' + info.poids + " · lecture en cours…</div>" +
    '<div class="barreprog" style="margin-top:6px"><i></i></div></div></div>';
  const barre = zone.querySelector(".barreprog i");
  let p = 0;
  const h = setInterval(() => {
    p += 14 + Math.random() * 16;
    barre.style.width = Math.min(100, p) + "%";
    if (p >= 100) {
      clearInterval(h);
      zone.innerHTML =
        '<div class="fichier"><span style="color:var(--ink-3)">' + icone("doc") + "</span>" +
        '<div class="grow"><div class="nom">' + info.nom + '</div><div class="det">' + info.poids + " · " + info.source + "</div></div>" +
        '<span class="etat regle">Importé</span></div>' +
        '<div class="avis marque" style="margin-top:8px">' + icone("coche") +
        "<div><b>" + info.detecte + " détectés</b>Géométrie extraite sans modifier le fichier source.</div></div>";
      if (apresFini) apresFini();
    }
  }, 160);
}

function miniFacade(id) {
  const n = { est: 4, nord: 1, ouest: 2, sud: 0 }[id];
  let s = '<rect x="3" y="6" width="38" height="30" fill="#fff" stroke="#b8b7b3" stroke-width="1"/>';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const marque = n > 0 && r * 4 + c < n * 2 && (r + c) % 2 === 0;
    s += '<rect x="' + (7 + c * 8) + '" y="' + (10 + r * 7) + '" width="5" height="4.5" fill="' + (marque ? "#c0d739" : "#ececea") + '" stroke="' + (marque ? "#6f7f0d" : "#dcdbd7") + '" stroke-width=".7"/>';
  }
  return '<svg viewBox="0 0 44 42" style="width:44px;height:42px;display:block">' + s + "</svg>";
}
