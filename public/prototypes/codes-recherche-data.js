/* Shared by codes-recherche.html and codes-recherche-options.html: the
   fixture articles of the three codes and the simulated question matcher. */
/* The project's figures, the ones an article can be read against. */
const P = { logements: 104, etages: 8, cases: 22, hauteurDessinee: 6 };

/* Three codes, each a small index. `k` is the vocabulary the article is
   found by — its own words and the words people use for them. */
const CODES = [
  { short: "Code du Québec", of: "du Code du Québec", name: "Code de construction du Québec, chapitre I — Bâtiment",
    sugg: ["largeur de porte fauteuil roulant", "combien d'issues par étage", "hauteur des garde-corps du balcon", "fenêtres trop proches de la limite"],
    arts: [
      { id: "3.8.1.3", sec: "Partie 3", t: "Parcours sans obstacles", followed: true, state: "red",
        q: "Un parcours sans obstacles doit relier l'entrée principale aux aires desservies; la largeur libre d'une porte ne doit pas être inférieure à 850 mm.",
        k: "porte largeur fauteuil roulant accessible accessibilite handicap universel obstacle entree rampe pmr 850",
        why: "Relevé: 800 mm à la porte d'entrée, 50 mm sous l'exigence." },
      { id: "3.3.4.4", sec: "Partie 3", t: "Portes des logements",
        q: "La largeur libre d'une porte donnant sur un corridor commun ne doit pas être inférieure à 810 mm.",
        k: "porte largeur logement corridor entree 810",
        why: `S'applique aux ${P.logements} portes de logement sur les corridors communs.` },
      { id: "3.4.2.1", sec: "Partie 3", t: "Nombre d'issues par étage", followed: true, state: "green",
        q: "Au moins deux issues doivent desservir chaque étage, placées de manière que les distances de parcours soient respectées.",
        k: "issue issues sortie sorties evacuation escalier etage combien nombre incendie",
        why: `Chacun des ${P.etages} étages est desservi par 2 issues.` },
      { id: "3.3.1.4", sec: "Partie 3", t: "Distance de parcours jusqu'à une issue",
        q: "La distance de parcours jusqu'à une issue ne doit pas dépasser 45 m dans une aire de plancher protégée par gicleurs.",
        k: "distance parcours issue sortie evacuation gicleur gicleurs incendie loin",
        why: "À mesurer depuis la porte de logement la plus éloignée de chaque étage." },
      { id: "3.4.3.2", sec: "Partie 3", t: "Largeur des escaliers d'issue",
        q: "La largeur d'un escalier d'issue doit être d'au moins 1 100 mm entre les mains courantes.",
        k: "escalier escaliers issue largeur main courante marche evacuation",
        why: "Les deux cages d'escalier, au plan de chaque étage." },
      { id: "3.3.1.18", sec: "Partie 3", t: "Hauteur des garde-corps", followed: true, state: "amber",
        q: "La hauteur d'un garde-corps doit être d'au moins 1 070 mm au-dessus de la surface praticable lorsque la dénivellation dépasse 1 800 mm.",
        k: "garde-corps garde corps balcon rampe terrasse chute hauteur toit",
        why: "Coté à 1 020 mm sur l'élévation des balcons." },
      { id: "3.2.3.1", sec: "Partie 3", t: "Baies non protégées", followed: true, state: "amber",
        q: "La surface maximale des baies non protégées dans une façade de rayonnement est fonction de la distance limitative et de la surface de la façade.",
        k: "fenetre fenetres baie baies vitrage ouverture ouvertures facade limite voisin proche distance limitative rayonnement incendie",
        why: "Façade est: 74,2 m² dessinés pour 68,5 m² permis." },
      { id: "3.3.1.9", sec: "Partie 3", t: "Largeur des corridors communs", followed: true, state: "green",
        q: "La largeur libre d'un corridor commun desservant des logements ne doit pas être inférieure à 1 100 mm.",
        k: "corridor couloir largeur commun passage",
        why: "Relevé: 1 120 mm au point le plus étroit." },
      { id: "9.7.2.3", sec: "Partie 9", t: "Surface vitrée des pièces habitables",
        q: "La surface vitrée d'une pièce habitable ne doit pas être inférieure à 5 % de l'aire de plancher desservie.",
        k: "fenetre fenetres vitrage vitree lumiere eclairage naturel chambre piece",
        why: "Se lit pièce par pièce; les vitrages par unité sont dans Unités & ouvertures." },
      { id: "9.5.3.1", sec: "Partie 9", t: "Hauteur sous plafond des pièces",
        q: "La hauteur libre d'une pièce habitable ne doit pas être inférieure à 2 300 mm sur au moins la moitié de sa superficie.",
        k: "plafond hauteur libre piece sous-sol mezzanine",
        why: "À vérifier sous les retombées de poutres et les plafonds suspendus." },
    ] },
  { short: "Loi-cadre", of: "de la Loi-cadre", name: "Loi sur l'aménagement et l'urbanisme",
    sugg: ["peut-on dépasser la hauteur", "qui accorde une dérogation", "le permis peut-il être refusé", "les voisins peuvent-ils s'opposer"],
    arts: [
      { id: "A-19.1", sec: "Loi", t: "Cadre légal du zonage", followed: true, state: "green",
        q: "La loi habilite la municipalité à régir, par règlement, l'usage du sol et l'implantation des bâtiments sur son territoire.",
        k: "zonage cadre loi municipalite reglement pouvoir usage",
        why: "C'est d'elle que vient le règlement de l'arrondissement." },
      { id: "art. 145.1", sec: "Dérogations", t: "Dérogation mineure",
        q: "Le conseil d'une municipalité peut accorder une dérogation mineure aux dispositions du règlement de zonage.",
        k: "derogation mineure depasser exception ecart permettre accorder hauteur marge conseil",
        why: `Seule voie pour l'étage de trop (${P.hauteurDessinee} dessinés, 5 permis) ou les 30 cm de marge.` },
      { id: "art. 145.36", sec: "Projets particuliers", t: "Projet particulier (PPCMOI)",
        q: "Le conseil peut autoriser un projet particulier qui déroge au règlement, à certaines conditions, par résolution.",
        k: "ppcmoi projet particulier depasser exception hauteur densite usage deroger",
        why: "La voie quand l'écart dépasse ce qu'une dérogation mineure admet." },
      { id: "art. 123", sec: "Approbation", t: "Approbation référendaire",
        q: "Certaines modifications au règlement de zonage sont soumises à l'approbation des personnes habiles à voter.",
        k: "referendum referendaire voisins opposer opposition citoyens vote consultation",
        why: "Un projet particulier sur la hauteur peut y être soumis." },
      { id: "art. 119", sec: "Permis", t: "Permis de construction",
        q: "Le règlement peut prescrire les conditions de délivrance d'un permis de construction.",
        k: "permis construction refuser refus delivrance condition",
        why: "Le permis suit la conformité au règlement d'urbanisme." },
    ] },
  { short: "Règlement d'urbanisme", of: "du Règlement d'urbanisme", name: "Règlement d'urbanisme de l'arrondissement",
    sugg: ["combien de cases pour les logements", "stationnement vélo", "hauteur maximale permise", "recul arrière"],
    arts: [
      { id: "art. 9", sec: "Hauteurs", t: "Hauteur en étages", followed: true, img: "assets/code/art-9-hauteur.png", state: "amber",
        q: "La hauteur d'un bâtiment ne doit pas excéder le nombre d'étages prescrit à la grille des usages et normes pour la zone.",
        k: "hauteur etage etages maximale maximum haut grille zone depasser",
        why: `${P.hauteurDessinee} étages dessinés, 5 prescrits à la grille.`, need: "manque pour conclure: grille des usages et normes de la zone" },
      { id: "art. 22", sec: "Implantation", t: "Marge arrière", followed: true, img: "assets/code/art-22-marge.png", state: "amber",
        q: "Une marge arrière minimale doit être conservée entre le bâtiment et la limite arrière du terrain.",
        k: "marge recul arriere limite terrain fond cour distance",
        why: "2,70 m dessinés pour 3,00 m exigés.", need: "manque pour conclure: limite arrière relevée, exceptions et saillies admises" },
      { id: "art. 43", sec: "Implantation", t: "Taux d'implantation", followed: true, img: "assets/code/art-43-implantation.png", state: "green",
        q: "Le taux d'implantation au sol du bâtiment principal ne doit pas excéder le taux maximal prescrit pour la zone.",
        k: "implantation taux sol emprise couverture terrain densite",
        why: "48,2 % pour 55 % permis." },
      { id: "art. 71", sec: "Stationnement", t: "Stationnement", followed: true, img: "assets/code/art-71-stationnement.png", state: "red",
        q: "Le nombre minimal d'unités de stationnement est établi selon l'usage et le nombre de logements.",
        k: "stationnement case cases auto voiture voitures parking garage logement logements combien nombre",
        why: `${P.logements} logements; ${P.cases} cases dessinées pour 30 exigées.`, need: "manque pour conclure: réductions applicables près du transport collectif" },
      { id: "art. 72", sec: "Stationnement", t: "Réduction près du transport collectif",
        q: "Le nombre minimal d'unités de stationnement peut être réduit pour un terrain situé près d'une station de transport collectif.",
        k: "stationnement case cases reduction reduire metro autobus transport collectif station combien",
        why: "C'est la pièce qui manque pour conclure l'art. 71." },
      { id: "art. 86", sec: "Stationnement", t: "Unités de stationnement pour vélos",
        q: "Au moins une unité de stationnement pour vélo doit être aménagée par logement.",
        k: "velo velos bicyclette stationnement support logement",
        why: `${P.logements} supports requis, un par logement.` },
      { id: "art. 134", sec: "Verdissement", t: "Verdissement et pleine terre", followed: true, img: "assets/code/art-134-verdissement.png", state: "amber",
        q: "Une proportion minimale de la superficie du terrain doit être maintenue en pleine terre et végétalisée.",
        k: "vert verdissement pleine terre gazon arbre arbres paysage vegetal vegetalise jardin",
        why: "17 % mesurés pour 20 % exigés." },
      { id: "art. 21", sec: "Implantation", t: "Marges latérales",
        q: "Une marge latérale minimale doit être conservée entre le bâtiment et chaque limite latérale du terrain.",
        k: "marge recul laterale cote limite voisin terrain distance",
        why: "Lu sur le plan d'implantation, des deux côtés." },
    ] },
];
const STATE = { green: ["Clair", "var(--green)"], amber: ["Moyennement clair", "var(--amber)"], red: ["Pas clair du tout", "var(--red)"] };

/* A small French index: accents dropped, a few words that mean nothing on
   their own set aside, plurals folded so « cases » finds « case ». */
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ");
const STOP = new Set("le la les de des du un une pour par sur au aux et ou en a l d est il on peut qui que quoi quel quelle combien peut-on est-ce faut doit dans ce cette mon ma nos notre se s y avec".split(" "));
const words = (s) => norm(s).split(/[^a-z0-9-]+/).filter((w) => w && !STOP.has(w));
const fold = (w) => w.length > 4 ? w.replace(/(s|x)$/, "") : w;
function score(a, qw) {
  const bag = new Set(words(a.k + " " + a.t).map(fold));
  const hits = qw.filter((w) => bag.has(fold(w)) || [...bag].some((b) => b.length > 4 && fold(w).length > 4 && (b.startsWith(fold(w)) || fold(w).startsWith(b))));
  return { n: hits.length, hits };
}
function search(code, q) {
  const qw = words(q);
  if (!qw.length) return [];
  /* A word in common is not an answer: an article stays when it shares at
     least half as many of the question's words as the best one does. */
  const all = code.arts.map((a) => ({ a, ...score(a, qw) })).filter((r) => r.n);
  const top = Math.max(0, ...all.map((r) => r.n));
  return all.filter((r) => r.n >= Math.ceil(top / 2)).sort((x, y) => y.n - x.n || !!y.a.followed - !!x.a.followed).slice(0, 4);
}
/* The quote, with the words that matched lit. */
function lit(text, hits) {
  const keys = hits.map(fold).filter((w) => w.length > 2);
  return text.replace(/[A-Za-zÀ-ÿ-]+/g, (w) => keys.some((k) => fold(norm(w)).startsWith(k) || k.startsWith(fold(norm(w))) && norm(w).length > 3) ? `<mark>${w}</mark>` : w);
}

