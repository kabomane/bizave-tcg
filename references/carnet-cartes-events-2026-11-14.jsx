import React, { useMemo, useState } from "react";
import { Search, Layers, Gem, ChevronRight, ChevronLeft, Eye, EyeOff } from "lucide-react";

/* ============================================================
   DONNÉES — mises à jour par Claude au fil de la conversation
   ============================================================ */

// Nom du deck
const NOM_DECK = "Événements";

// Raretés : de la plus courante à la plus rare
const RARETES = [
  { id: "commune", nom: "Commune", couleur: "#8b93a1" },
  { id: "peu-commune", nom: "Peu commune", couleur: "#6fae8f" },
  { id: "rare", nom: "Rare", couleur: "#6b9bd1" },
  { id: "epique", nom: "Épique", couleur: "#a98bd6" },
  { id: "legendaire", nom: "Légendaire", couleur: "#d9a55b" },
];

// Groupes = familles de cartes
const GROUPES = [
  { id: "noel", nom: "Noël 2026" },
  { id: "hunger", nom: "Hunger Games 2026" },
  { id: "nouvel-an", nom: "Nouvel An 2027" },
];

// Cartes : { id, nom, contexte, rarete, groupe }
const R = ["commune", "peu-commune", "rare", "epique", "legendaire"];
const carte = (id, nom, niveau, groupe, contexte = "") => ({ id, nom, rarete: R[niveau - 1], groupe, contexte });

const CARTES = [
  // Noël 2026
  carte("noel-c1", "Le petit cube rouge", 1, "noel", "Événement Noël 2026"),
  carte("noel-c2", "Le paquet kraft", 1, "noel", "Événement Noël 2026"),
  carte("noel-c3", "Le tube vert", 1, "noel", "Événement Noël 2026"),
  carte("noel-c4", "La pochette rayée", 1, "noel", "Événement Noël 2026"),
  carte("noel-pc1", "La boîte à pois", 2, "noel", "Événement Noël 2026"),
  carte("noel-pc2", "Le paquet flocons", 2, "noel", "Événement Noël 2026"),
  carte("noel-pc3", "La boîte à rennes", 2, "noel", "Événement Noël 2026"),
  carte("noel-pc4", "Le paquet sapin", 2, "noel", "Événement Noël 2026"),
  carte("noel-r1", "La boîte étoilée", 3, "noel", "Événement Noël 2026"),
  carte("noel-r2", "Le carton à chapeau", 3, "noel", "Événement Noël 2026"),
  carte("noel-r3", "La boîte hexagonale", 3, "noel", "Événement Noël 2026"),
  carte("noel-r4", "Le long écrin", 3, "noel", "Événement Noël 2026"),
  carte("noel-e1", "Le coffre de velours", 4, "noel", "Événement Noël 2026"),
  carte("noel-e2", "Le cadeau sur luge", 4, "noel", "Événement Noël 2026"),
  carte("noel-e3", "La tour de cadeaux", 4, "noel", "Événement Noël 2026"),
  carte("noel-e4", "Le cœur emballé", 4, "noel", "Événement Noël 2026"),
  carte("noel-l1", "Le grand cadeau d'or", 5, "noel", "Événement Noël 2026"),
  carte("noel-l2", "Le cadeau de cristal", 5, "noel", "Événement Noël 2026"),
  carte("noel-l3", "Le cadeau flottant", 5, "noel", "Événement Noël 2026"),
  carte("noel-l4", "Le cadeau du pôle Nord", 5, "noel", "Événement Noël 2026"),
  carte("noel-merry-wifemas", "Merry Wifemas", 5, "noel", "Récompense de l'événement Noël 2026 · Message : peu importe la culture, Noël c'est beau :)"),

  // Hunger Games 2026
  carte("hg-thomas", "Thomas District 3", 1, "hunger", "Événement Hunger Games 2026"),
  carte("hg-dorian", "Dorian District 2", 1, "hunger", "Événement Hunger Games 2026"),
  carte("hg-matthieu", "Matthieu District 12", 1, "hunger", "Événement Hunger Games 2026"),
  carte("hg-eli", "Eli District 11", 1, "hunger", "Événement Hunger Games 2026"),
  carte("hg-nana", "Nana District 1", 1, "hunger", "Événement Hunger Games 2026"),
  carte("hg-geai-moqueur", "Le Geai moqueur", 5, "hunger", "Événement Hunger Games 2026"),

  // Nouvel An 2027
  carte("na-nana", "Nouvel An : Yokohama", 1, "nouvel-an", "Événement Nouvel An 2027"),
  carte("na-thomas", "Nouvel An : Londres", 1, "nouvel-an", "Événement Nouvel An 2027"),
  carte("na-eli", "Nouvel An : Québec", 1, "nouvel-an", "Événement Nouvel An 2027"),
  carte("na-matthieu", "Nouvel An : Paris", 1, "nouvel-an", "Événement Nouvel An 2027"),
  carte("na-dorian", "Nouvel An : Marrakech", 1, "nouvel-an", "Événement Nouvel An 2027"),
  carte("na-bonne-annee", "Vœu de l'année 2027", 5, "nouvel-an", "Événement Nouvel An 2027"),
];

// Fiches détaillées : "création" (ce que la carte doit représenter / montrer)
// et "description" (le texte de la carte). Clé = id de la carte.
const FICHES = {
  "noel-c1": {
    creation:
      "Au pied d'un sapin, dans un salon chaleureux flouté : au premier plan, bien centré et net, un petit cube emballé de papier rouge brillant, noué d'un ruban blanc tout simple. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-c2": {
    creation:
      "Au pied d'un sapin, dans un salon chaleureux flouté : au premier plan, bien centré et net, un paquet rectangulaire emballé de papier kraft, ficelé de corde avec une branche de houx glissée dans le nœud. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-c3": {
    creation:
      "Au pied d'un sapin, dans un salon chaleureux flouté : au premier plan, bien centré et net, un tube cylindrique emballé de papier vert sapin, fermé aux deux bouts par des nœuds dorés. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-c4": {
    creation:
      "Au pied d'un sapin, dans un salon chaleureux flouté : au premier plan, bien centré et net, un paquet souple et un peu bombé, emballé de papier rayé rouge et blanc façon sucre d'orge. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-pc1": {
    creation:
      "Sur une table en bois devant une fenêtre enneigée floutée : au premier plan, bien centré et net, une boîte carrée moyenne emballée de papier bleu à pois blancs, avec un gros nœud bleu ciel. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-pc2": {
    creation:
      "Sur une table en bois devant une fenêtre enneigée floutée : au premier plan, bien centré et net, une boîte rectangulaire emballée de papier blanc à motifs de flocons argentés, ruban rouge en croix. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau contient quelque chose\nBKB5",
  },
  "noel-pc3": {
    creation:
      "Sur une table en bois devant une fenêtre enneigée floutée : au premier plan, bien centré et net, une boîte haute emballée de papier vert à motifs de rennes, couronnée d'un pompon de ruban. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-pc4": {
    creation:
      "Sur une table en bois devant une fenêtre enneigée floutée : au premier plan, bien centré et net, un paquet en forme de sapin, emballé de papier vert pailleté avec une petite étoile dorée au sommet. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-r1": {
    creation:
      "Sous un sapin illuminé, baigné d'une lumière bleutée floutée : au premier plan, bien centré et net, une grande boîte emballée de papier bleu nuit constellé d'étoiles argentées, ruban satiné argent. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-r2": {
    creation:
      "Sous un sapin illuminé, baigné d'une lumière bleutée floutée : au premier plan, bien centré et net, une boîte ronde façon carton à chapeau, emballée de papier bordeaux, nœud de velours noir. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau contient quelque chose\nDTYA",
  },
  "noel-r3": {
    creation:
      "Sous un sapin illuminé, baigné d'une lumière bleutée floutée : au premier plan, bien centré et net, une boîte hexagonale emballée de papier métallisé vert émeraude, ruban doré en étoile. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-r4": {
    creation:
      "Sous un sapin illuminé, baigné d'une lumière bleutée floutée : au premier plan, bien centré et net, un long écrin fin emballé de papier argenté, avec un nœud blanc et une clochette. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-e1": {
    creation:
      "Devant une cheminée qui crépite, décor flouté : au premier plan, bien centré et net, une grande boîte façon coffre, emballée de velours violet, ruban doré large et sceau de cire. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau contient quelque chose\n6WSU",
  },
  "noel-e2": {
    creation:
      "Devant une cheminée qui crépite, décor flouté : au premier plan, bien centré et net, une imposante boîte emballée de papier rouge et or, posée sur une petite luge en bois. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-e3": {
    creation:
      "Devant une cheminée qui crépite, décor flouté : au premier plan, bien centré et net, trois boîtes emballées empilées en tour, de plus en plus petites, papier violet et argent, un seul grand ruban les reliant. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-e4": {
    creation:
      "Devant une cheminée qui crépite, décor flouté : au premier plan, bien centré et net, une boîte en forme de cœur emballée de papier rose gold, nœud de satin crème. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-l1": {
    creation:
      "Sur un fond doré lumineux, traversé de reflets d'aurore boréale : au premier plan, bien centré et net, une immense boîte emballée de feuille d'or, avec un ruban doré qui scintille et une lueur qui filtre des bords. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-l2": {
    creation:
      "Sur un fond doré lumineux, traversé de reflets d'aurore boréale : au premier plan, bien centré et net, une boîte emballée d'un papier transparent irisé, comme du cristal, ruban blanc lumineux. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-l3": {
    creation:
      "Sur un fond doré lumineux, traversé de reflets d'aurore boréale : au premier plan, bien centré et net, une boîte emballée de papier blanc nacré et de ruban doré, qui flotte légèrement au-dessus du sol dans un halo de lumière. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau contient quelque chose\nFYU6",
  },
  "noel-l4": {
    creation:
      "Sur un fond doré lumineux, traversé de reflets d'aurore boréale : au premier plan, bien centré et net, une boîte emballée de papier rouge profond et de ruban or, couverte d'une fine pellicule de givre étincelant. Le cadeau occupe la majeure partie de l'image et reste le seul sujet.",
    description: "Ce cadeau est vide…",
  },
  "noel-merry-wifemas": {
    creation:
      "Dehors, dans un paysage enneigé avec quelques sapins en fond, quatre femmes se tiennent ensemble, souriantes et complices. La première, européenne et blonde, porte un long manteau de laine, un pull à motifs nordiques et un bonnet à pompon. La deuxième, originaire du Moyen-Orient, porte un long manteau de laine brodé de motifs géométriques et une étole chaude drapée sur les épaules. La troisième, asiatique, porte un hanten matelassé (la veste d'hiver traditionnelle japonaise) sur une tenue moderne, avec une écharpe. La quatrième, originaire du Bangladesh, porte un sari aux couleurs chaudes et un épais châle brodé façon nakshi kantha. Une neige légère tombe, très subtile.",
    description: "Merry Wifemas vous souhaitent un joyeux Noël.",
  },
  "hg-thomas": {
    creation:
      "Vue de face, avant le début des Jeux : @Thomas, tribut du District 3, se tient debout sur sa plateforme de départ. La caméra est placée côté centre de l'arène : on ne voit pas la Corne d'abondance, seulement @Thomas et, derrière lui·elle, le paysage de l'arène d'après les références fournies. Tenue de tribut : veste technique gris anthracite à bandes réfléchissantes, poches à outils. Expression : méfiant, les yeux qui scrutent déjà les autres tributs, prêt·e à appliquer sa stratégie.",
    description: "Joyeux Hunger Games… et puisse le sort vous être favorable !",
  },
  "hg-dorian": {
    creation:
      "Vue de face, avant le début des Jeux : @Dorian, tribut du District 2, se tient debout sur sa plateforme de départ. La caméra est placée côté centre de l'arène : on ne voit pas la Corne d'abondance, seulement @Dorian et, derrière lui·elle, le paysage de l'arène d'après les références fournies. Tenue de tribut : veste renforcée noire avec sangles et protections aux épaules. Expression : déterminé, poings serrés, posture d'attaque, prêt·e à appliquer sa stratégie.",
    description: "Joyeux Hunger Games… et puisse le sort vous être favorable !",
  },
  "hg-matthieu": {
    creation:
      "Vue de face, avant le début des Jeux : @Matthieu, tribut du District 12, se tient debout sur sa plateforme de départ. La caméra est placée côté centre de l'arène : on ne voit pas la Corne d'abondance, seulement @Matthieu et, derrière lui·elle, le paysage de l'arène d'après les références fournies. Tenue de tribut : veste sombre usée, légèrement trop grande, traces de charbon. Expression : la peur au ventre, le regard paniqué, prêt·e à appliquer sa stratégie.",
    description: "Joyeux Hunger Games… et puisse le sort vous être favorable !",
  },
  "hg-eli": {
    creation:
      "Vue de face, avant le début des Jeux : @Eli, tribut du District 11, se tient debout sur sa plateforme de départ. La caméra est placée côté centre de l'arène : on ne voit pas la Corne d'abondance, seulement @Eli et, derrière lui·elle, le paysage de l'arène d'après les références fournies. Tenue de tribut : veste couleur terre et vert olive, capuche baissée. Expression : calme et concentrée, le souffle maîtrisé, prêt·e à appliquer sa stratégie.",
    description: "Joyeux Hunger Games… et puisse le sort vous être favorable !",
  },
  "hg-nana": {
    creation:
      "Vue de face, avant le début des Jeux : @Nana, tribut du District 1, se tient debout sur sa plateforme de départ. La caméra est placée côté centre de l'arène : on ne voit pas la Corne d'abondance, seulement @Nana et, derrière lui·elle, le paysage de l'arène d'après les références fournies. Tenue de tribut : veste ajustée en cuir clair aux finitions dorées. Expression : inquiète et agacée à la fois, déjà prête à râler, prêt·e à appliquer sa stratégie.",
    description: "Joyeux Hunger Games… et puisse le sort vous être favorable !",
  },
  "hg-geai-moqueur": {
    creation:
      "Un geai moqueur bleu posé sur une branche en hauteur, net au premier plan. En contrebas, très flou, on devine le cercle au centre de l'arène, avec la Corne d'abondance et les plateformes des tributs, d'après les références fournies. Aucun personnage : l'oiseau seul, qui observe.",
    description: "Il ne chante qu'une fois l'arène silencieuse. Et ce jour-là, tout le monde l'écoute.",
  },
  "na-nana": {
    creation:
      "Minuit sur le port de Yokohama (Minato Mirai) : @Nana, en manteau d'hiver et écharpe, téléphone levé pour filmer, regarde le feu d'artifice qui éclate au-dessus de la baie et de la grande roue illuminée, au milieu de la foule.",
    description: "3, 2, 1… 明けましておめでとう !",
  },
  "na-thomas": {
    creation:
      "Minuit au bord de la Tamise : @Thomas, en manteau d'hiver et écharpe, au milieu de la foule, regarde le feu d'artifice éclater autour du London Eye, avec Big Ben illuminé à côté.",
    description: "Minuit sonne enfin, le London Eye s'embrase. Happy New Year !",
  },
  "na-eli": {
    creation:
      "Nuit du Nouvel An dans le Vieux-Québec enneigé : @Eli, en parka, tuque et mitaines, un chocolat chaud à la main, regarde le feu d'artifice éclater au-dessus des toits et du Château Frontenac.",
    description: "Moins vingt dehors, mais le ciel est en feu. Bonne année !",
  },
  "na-matthieu": {
    creation:
      "Minuit sur les Champs-Élysées : @Matthieu, en manteau long et écharpe, une coupe de champagne à la main, regarde le spectacle de lumières et de feux d'artifice sur l'Arc de Triomphe, au milieu de la foule.",
    description: "Arrivé à 23 h 59. Il n'est pas encore minuit, donc techniquement… je suis en avance.",
  },
  "na-dorian": {
    creation:
      "Nuit du Nouvel An sur un toit-terrasse de Marrakech : @Dorian, en djellaba, un verre de thé à la menthe à la main, regarde les feux d'artifice tirés au-dessus de la médina illuminée.",
    description: "Un thé à la menthe, la médina en lumière… bonne année depuis Marrakech !",
  },
  "na-bonne-annee": {
    creation:
      "Sur le support d'un temple japonais, des centaines d'ema en bois sont accrochés, couverts de vœux écrits à la main de façon illisible. Au centre, une seule plaquette, nette et mise en lumière, ornée de la chèvre de 2027. En arrière-plan très flou : le temple sous la neige, des lanternes allumées et un feu d'artifice au loin. Aucun personnage.",
    description: "La BIZAVE Corp. vous souhaite une bonne année.",
  },
};

/* ============================================================ */

// Cartes dont l'illustration est terminée (id)
const ILLUSTREES = new Set([
  "noel-c1", "noel-c2", "noel-c3", "noel-c4", "noel-pc1", "noel-pc2", "noel-pc3", "noel-pc4", "noel-r1", "noel-r2", "noel-r3", "noel-r4", "noel-e1", "noel-e2", "noel-e3", "noel-e4", "noel-l1", "noel-l2", "noel-l3", "noel-l4", "noel-merry-wifemas",
  "hg-thomas", "hg-dorian", "hg-matthieu", "hg-eli", "hg-nana", "hg-geai-moqueur",
  "na-nana", "na-thomas", "na-eli", "na-matthieu", "na-dorian",
  "na-bonne-annee",
]);

/* ============================================================ */

const SANS_GROUPE = "__aucun";

// Statut affiché par le point : illustrée (vert), illustrée sans fiche (contour blanc), fiche complète (ambre)
function statutCarte(id) {
  const ill = ILLUSTREES.has(id);
  const fiche = !!(FICHES[id]?.creation && FICHES[id]?.description);
  if (ill && fiche) return "illustree";
  if (ill) return "illustree-sans-fiche";
  if (fiche) return "fiche";
  return null;
}

function PointStatut({ statut }) {
  if (statut === "illustree")
    return <span aria-label="Illustration faite" className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />;
  if (statut === "illustree-sans-fiche")
    return <span aria-label="Illustration faite, fiche à compléter" className="h-2 w-2 shrink-0 rounded-full border border-zinc-200" />;
  if (statut === "fiche")
    return <span aria-label="Fiche complète" className="h-2 w-2 shrink-0 rounded-full bg-amber-500/80" />;
  return null;
}

const LIBELLE_STATUT = {
  illustree: { texte: "Illustration faite", cls: "text-emerald-400" },
  "illustree-sans-fiche": { texte: "Illustration faite · fiche à compléter", cls: "text-zinc-300" },
  fiche: { texte: "Fiche complète · illustration à faire", cls: "text-amber-500" },
};

function Pastille({ rarete, taille = 10 }) {
  if (!rarete) return null;
  return (
    <span
      className="inline-block rotate-45 rounded-sm shrink-0"
      style={{ width: taille, height: taille, background: rarete.couleur, boxShadow: `0 0 10px ${rarete.couleur}55` }}
    />
  );
}

function BlocFiche({ titre, texte }) {
  return (
    <section className="mb-4 rounded-2xl bg-zinc-900/80 px-4 py-4 ring-1 ring-zinc-800/80">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{titre}</h3>
      {texte ? (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-300">{texte}</p>
      ) : (
        <p className="text-[15px] italic text-zinc-600">À définir</p>
      )}
    </section>
  );
}

function PageCarte({ carte, rarete, groupe, onRetour }) {
  const fiche = FICHES[carte.id] || {};
  const c = rarete?.couleur || "#52525b";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{ background: `radial-gradient(ellipse at 50% -10%, ${c}2e, transparent 70%)` }}
      />
      <div className="relative mx-auto max-w-lg px-4 pb-16">
        <nav className="sticky top-0 z-10 -mx-4 flex items-center bg-zinc-950/70 px-2 pt-3 pb-2 backdrop-blur-md">
          <button
            onClick={onRetour}
            className="flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[16px] text-amber-500"
          >
            <ChevronLeft size={24} />
            Cartes
          </button>
        </nav>

        <header className="pt-6 pb-8">
          <div className="mb-5 h-1 w-20 rounded-full" style={{ background: c, boxShadow: `0 0 18px ${c}aa` }} />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{carte.nom}</h1>
          <p className="mt-2 text-sm">
            <span style={{ color: c }}>{rarete?.nom}</span>
            <span className="text-zinc-600"> · </span>
            <span className="text-zinc-500">{groupe ? groupe.nom : "Sans groupe"}</span>
          </p>
          {LIBELLE_STATUT[statutCarte(carte.id)] && (
            <p className={`mt-3 flex items-center gap-2 text-sm ${LIBELLE_STATUT[statutCarte(carte.id)].cls}`}>
              <PointStatut statut={statutCarte(carte.id)} />
              {LIBELLE_STATUT[statutCarte(carte.id)].texte}
            </p>
          )}
        </header>

        {carte.contexte && <BlocFiche titre="Mémo" texte={carte.contexte} />}
        <BlocFiche titre="Création" texte={fiche.creation} />
        <BlocFiche titre="Description" texte={fiche.description} />
      </div>
    </div>
  );
}

const ficheComplete = (id) => !!(FICHES[id]?.creation && FICHES[id]?.description);

export default function CarnetCartes() {
  const [recherche, setRecherche] = useState("");
  const [filtreRarete, setFiltreRarete] = useState("toutes");
  const [vue, setVue] = useState("groupes"); // groupes | rarete
  const [masquerIllustrees, setMasquerIllustrees] = useState(false);
  const [detail, setDetail] = useState(null);

  const rareteParId = useMemo(() => Object.fromEntries(RARETES.map((r) => [r.id, r])), []);
  const ordreRarete = useMemo(() => Object.fromEntries(RARETES.map((r, i) => [r.id, i])), []);
  const groupeParId = useMemo(() => Object.fromEntries(GROUPES.map((g) => [g.id, g])), []);

  const cartesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return CARTES.filter((c) => filtreRarete === "toutes" || c.rarete === filtreRarete)
      .filter((c) => !masquerIllustrees || !ILLUSTREES.has(c.id))
      .filter((c) => {
        if (!q) return true;
        const f = FICHES[c.id] || {};
        return [c.nom, c.contexte, f.creation, f.description].some((t) => (t || "").toLowerCase().includes(q));
      })
      .sort((a, b) => (ordreRarete[b.rarete] ?? -1) - (ordreRarete[a.rarete] ?? -1) || a.nom.localeCompare(b.nom));
  }, [recherche, filtreRarete, ordreRarete, masquerIllustrees]);

  const sections = useMemo(() => {
    if (vue === "rarete") {
      return [...RARETES]
        .reverse()
        .map((r) => ({ id: r.id, titre: r.nom, rarete: r, cartes: cartesFiltrees.filter((c) => c.rarete === r.id) }))
        .filter((s) => s.cartes.length);
    }
    const s = GROUPES.map((g) => ({ id: g.id, titre: g.nom, cartes: cartesFiltrees.filter((c) => c.groupe === g.id) }));
    const orphelines = cartesFiltrees.filter((c) => !groupeParId[c.groupe]);
    if (orphelines.length) s.push({ id: SANS_GROUPE, titre: "Sans groupe", cartes: orphelines });
    return s;
  }, [vue, cartesFiltrees, groupeParId]);

  const compteParRarete = useMemo(() => {
    const m = {};
    CARTES.forEach((c) => (m[c.rarete] = (m[c.rarete] || 0) + 1));
    return m;
  }, []);

  const nbCompletes = CARTES.filter((c) => ficheComplete(c.id)).length;
  const nbIllustrees = CARTES.filter((c) => ILLUSTREES.has(c.id)).length;

  if (detail) {
    return (
      <PageCarte
        carte={detail}
        rarete={rareteParId[detail.rarete]}
        groupe={groupeParId[detail.groupe]}
        onRetour={() => setDetail(null)}
      />
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-200"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-64 opacity-60"
        style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(217,165,91,0.12), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-lg px-4 pb-16">
        <header className="pt-10 pb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-500/80">Carnet de conception</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50">{NOM_DECK}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {CARTES.length} cartes · {GROUPES.length} groupes · {nbCompletes} fiche{nbCompletes > 1 ? "s" : ""} complète
            {nbCompletes > 1 ? "s" : ""}
          </p>
          <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-500/70 transition-all"
              style={{ width: `${(nbCompletes / CARTES.length) * 100}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all"
              style={{ width: `${(nbIllustrees / CARTES.length) * 100}%` }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><PointStatut statut="illustree" /> Illustrée · {nbIllustrees}</span>
            <span className="flex items-center gap-1.5"><PointStatut statut="fiche" /> Fiche complète · {nbCompletes}</span>
            <span className="flex items-center gap-1.5"><PointStatut statut="illustree-sans-fiche" /> Illustrée sans fiche</span>
          </div>
        </header>

        {/* Filtre par rareté */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            onClick={() => setFiltreRarete("toutes")}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition ${
              filtreRarete === "toutes"
                ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40"
                : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800"
            }`}
          >
            Toutes
          </button>
          {RARETES.map((r) => {
            const actif = filtreRarete === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setFiltreRarete(actif ? "toutes" : r.id)}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition"
                style={{
                  background: actif ? `${r.couleur}22` : "rgb(24 24 27)",
                  color: actif ? r.couleur : "rgb(161 161 170)",
                  boxShadow: `inset 0 0 0 1px ${actif ? r.couleur + "66" : "rgb(39 39 42)"}`,
                }}
              >
                <Pastille rarete={r} taille={8} />
                {r.nom}
                <span className="text-xs opacity-60">{compteParRarete[r.id] || 0}</span>
              </button>
            );
          })}
        </div>

        {/* Recherche */}
        <div className="mb-3 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une carte, une fiche…"
              className="w-full min-h-11 rounded-xl bg-zinc-800/80 border border-zinc-700/60 pl-10 pr-3.5 py-2.5 text-[16px] text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <button
            onClick={() => setMasquerIllustrees((v) => !v)}
            aria-pressed={masquerIllustrees}
            aria-label={masquerIllustrees ? "Afficher les cartes illustrées" : "Masquer les cartes illustrées"}
            title={masquerIllustrees ? "Afficher les cartes illustrées" : "Masquer les cartes illustrées"}
            className={`flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
              masquerIllustrees
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                : "border-zinc-700/60 bg-zinc-800/80 text-zinc-400"
            }`}
          >
            {masquerIllustrees ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {masquerIllustrees && (
          <p className="-mt-1 mb-3 px-1 text-xs text-emerald-400/80">Cartes illustrées masquées</p>
        )}

        {/* Vue */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-zinc-900 p-1 ring-1 ring-zinc-800">
          {[
            { id: "groupes", label: "Par groupe", icone: Layers },
            { id: "rarete", label: "Par rareté", icone: Gem },
          ].map(({ id, label, icone: I }) => (
            <button
              key={id}
              onClick={() => setVue(id)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
                vue === id ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-500"
              }`}
            >
              <I size={15} />
              {label}
            </button>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
            <Gem className="mx-auto mb-3 text-zinc-700" size={28} />
            <p className="text-sm text-zinc-400">Aucune carte pour ce filtre.</p>
          </div>
        )}

        <div className="space-y-7">
          {sections.map((s) => (
            <section key={s.id}>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {s.rarete && <Pastille rarete={s.rarete} taille={8} />}
                {s.titre}
                <span className="font-normal text-zinc-600">· {s.cartes.length}</span>
              </h2>

              <div className="overflow-hidden rounded-2xl bg-zinc-900/80 ring-1 ring-zinc-800/80">
                {s.cartes.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-zinc-600">Aucune carte dans cette famille pour l'instant.</p>
                ) : (
                  s.cartes.map((c, i) => {
                    const r = rareteParId[c.rarete];
                    const g = groupeParId[c.groupe];
                    return (
                      <button
                        key={c.id}
                        onClick={() => setDetail(c)}
                        className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition active:bg-zinc-800/80 ${
                          i > 0 ? "border-t border-zinc-800/70" : ""
                        }`}
                      >
                        <div
                          className="h-10 w-1 shrink-0 rounded-full"
                          style={{ background: r?.couleur || "#3f3f46", boxShadow: r ? `0 0 12px ${r.couleur}66` : "none" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-zinc-100">{c.nom}</p>
                          {(c.contexte || (vue === "rarete" && g)) && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
                              {vue === "rarete" && g ? g.nom + (c.contexte ? " · " : "") : ""}
                              {c.contexte}
                            </p>
                          )}
                        </div>
                        <PointStatut statut={statutCarte(c.id)} />
                        <ChevronRight size={18} className="shrink-0 text-zinc-700" />
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
