import React, { useMemo, useState } from "react";
import { Search, Layers, Gem, ChevronRight, ChevronLeft } from "lucide-react";

/* ============================================================
   DONNÉES — mises à jour par Claude au fil de la conversation
   ============================================================ */

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
  { id: "thomas", nom: "Groupe Thomas" },
  { id: "matthieu", nom: "Groupe Matthieu" },
  { id: "speciaux", nom: "Spéciaux" },
];

// Cartes : { id, nom, contexte, rarete, groupe }
const R = ["commune", "peu-commune", "rare", "epique", "legendaire"];
const carte = (id, nom, niveau, groupe, contexte = "") => ({ id, nom, rarete: R[niveau - 1], groupe, contexte });

const CARTES = [
  // Groupe Thomas
  carte("t-classique", "Thomas classique", 1, "thomas"),
  carte("t-voyageur", "Thomas voyageur", 2, "thomas", "Japon"),
  carte("t-etudiant", "Thomas étudiant", 3, "thomas", "Kanji"),
  carte("nana-diff", "Nana Diff", 4, "thomas"),
  carte("t-accueil", "Thomas Agent d'accueil", 3, "thomas", "Attend avec la carte dans l'aéroport"),
  carte("deuxieme-expedition", "Deuxième expédition", 2, "thomas", "Thomas part en expédition à Londres"),
  carte("t-support", "Thomas support informatique", 3, "thomas"),
  carte("t-lowpoly", "Thomas low poly", 1, "thomas"),
  carte("t-perenoel", "Thomas Père Noël", 2, "thomas"),
  carte("t-bizarre", "Thomas Bizarre Aventure", 5, "thomas", "Carte continuité"),
  carte("t-gundam", "Thomas vs Gundam", 4, "thomas"),
  carte("t-risitas", "Thomas Risitas", 5, "thomas"),
  carte("t-stronk", "Thomas Stronk", 2, "thomas"),
  carte("t-notstronk", "Thomas Not Stronk", 2, "thomas"),
  carte("t-chat", "Chat de Thomas", 1, "thomas"),
  carte("t-bourre", "Thomas à la bourre", 4, "thomas"),
  carte("mcdeal", "Le McDeal McDo", 1, "thomas"),
  carte("metro-japonais", "Métro japonais", 2, "thomas"),
  carte("losc", "Thomas supporter", 1, "thomas", "Ancien nom : LOSC"),
  carte("discord-1", "Soirée Discord #1", 1, "thomas"),
  carte("minecraft-sncf", "Minecraft SNCF", 1, "thomas"),
  carte("t-routier", "Thomas camionneur", 1, "thomas", "Ancien nom : Thomas routier"),
  carte("t-midlaner", "Thomas mid laner", 1, "thomas"),
  carte("les-blancs", "Les Blancs", 1, "thomas"),
  carte("altimance", "Altimance", 2, "thomas"),
  carte("mamushi-chan", "Chez Mamushi-chan", 2, "thomas"),
  carte("bataille-peintre", "La bataille de peintre", 3, "thomas"),
  carte("gateau-anniv", "Le gâteau d'anniv'", 2, "thomas"),
  carte("t-moussaillon", "Thomas moussaillon", 3, "thomas"),
  carte("t-lancier", "Thomas le lancier", 1, "thomas", "Throne and Liberty"),
  carte("t-trouillard", "Thomas trouillard", 1, "thomas", "Phasmophobia"),
  carte("t-bouffon", "Thomas costume bouffon", 1, "thomas"),
  carte("overwatch", "Overwatch", 1, "thomas"),
  carte("t-exp33", "Thomas Expedition 33", 1, "thomas"),
  carte("t-mansion", "Thomas's Mansion", 2, "thomas"),
  carte("t-muscle", "Thomas musclé", 3, "thomas"),
  carte("t-citron", "thomas_citron", 4, "thomas"),
  carte("t-minis", "Mini's Thomas", 4, "thomas"),
  carte("t-inventeur", "Thomas inventeur", 1, "thomas"),
  carte("t-randonneur", "Thomas randonneur", 1, "thomas"),

  // Groupe Matthieu
  carte("m-classique", "Matthieu classique", 1, "matthieu"),
  carte("m-voyageur", "Matthieu voyageur", 2, "matthieu", "Québec"),
  carte("m-etudiant", "Matthieu étudiant", 3, "matthieu", "Anglais"),
  carte("eli-diff", "Eli Diff", 4, "matthieu"),
  carte("m-boucle", "Matthieu qui boucle", 3, "matthieu", "Coincé dans l'avion"),
  carte("premiere-expedition", "Première expédition", 2, "matthieu", "Matthieu part en expédition à Londres"),
  carte("m-timhortons", "Matthieu Tim Hortons", 3, "matthieu"),
  carte("m-lowpoly", "Matthieu low poly", 1, "matthieu"),
  carte("m-lutin", "Matthieu lutin de Noël", 2, "matthieu"),
  carte("m-bizarre", "Matthieu Bizarre Aventure", 5, "matthieu", "Carte continuité"),
  carte("m-moufette", "Matthieu vs Moufette", 4, "matthieu"),
  carte("m-risitas", "Matthieu Risitas", 5, "matthieu"),
  carte("m-stronk", "Matthieu Stronk", 2, "matthieu"),
  carte("m-notstronk", "Matthieu Not Stronk", 2, "matthieu"),
  carte("m-chat", "Chat de Matthieu", 1, "matthieu"),
  carte("m-bourre", "Matthieu à la bourre", 4, "matthieu"),
  carte("patate-mcdo", "La patate McDo", 1, "matthieu"),
  carte("ferry-quebecois", "Ferry québécois", 2, "matthieu"),
  carte("ol", "Matthieu supporter", 1, "matthieu", "Ancien nom : OL"),
  carte("discord-2", "Soirée Discord #2", 1, "matthieu"),
  carte("minecraft-pouletto", "Minecraft Pouletto", 1, "matthieu"),
  carte("m-routier", "Matthieu camionneur", 1, "matthieu", "Ancien nom : Matthieu routier"),
  carte("m-jungler", "Matthieu jungler", 1, "matthieu"),
  carte("les-noirs", "Les Noirs", 1, "matthieu"),
  carte("cegep", "Cégep", 2, "matthieu"),
  carte("vieille-appart", "La vieille de l'appart'", 2, "matthieu"),
  carte("chanteuse-nocturne", "La chanteuse nocturne", 3, "matthieu"),
  carte("jus-orange", "Le jus d'orange", 2, "matthieu"),
  carte("m-capitaine", "Matthieu capitaine", 3, "matthieu"),
  carte("m-premier", "Matthieu Ier", 1, "matthieu", "Throne and Liberty"),
  carte("m-exorciste", "Matthieu exorciste", 1, "matthieu", "Phasmophobia"),
  carte("m-bouffon", "Matthieu costume bouffon", 1, "matthieu"),
  carte("splatoon", "Splatoon", 1, "matthieu"),
  carte("m-exp33", "Matthieu Expedition 33", 1, "matthieu"),
  carte("m-galaxy", "Super Matthieu Galaxy", 2, "matthieu"),
  carte("m-muscle", "Matthieu musclé", 3, "matthieu"),
  carte("m-tempete", "matthieu_tempete", 4, "matthieu"),
  carte("m-minis", "Mini's Matthieu", 4, "matthieu"),
  carte("m-ingenieur", "Matthieu ingénieur", 1, "matthieu"),
  carte("m-coureur", "Matthieu coureur", 1, "matthieu"),

  // Spéciaux
  carte("oyster", "Oyster Card", 4, "speciaux"),
  carte("daronned", "Daronned", 4, "speciaux"),
  carte("visa-japon", "Visa Japon", 5, "speciaux"),
  carte("visa-quebec", "Visa Québec", 5, "speciaux"),
  carte("sous-3-ans", "Sous 3 ans", 1, "speciaux"),
  carte("cursed-week", "Cursed Week", 3, "speciaux"),
  carte("lucky-week", "Lucky Week", 3, "speciaux"),
  carte("golden-week", "Golden Week", 4, "speciaux"),
  carte("chaise", "Chaise", 5, "speciaux"),
  carte("takaichi", "Sanae Takaichi", 5, "speciaux"),
  carte("pspp", "Paul St-Pierre Plamondon", 5, "speciaux"),
  carte("centre-du-monde", "Centre du monde", 3, "speciaux"),
  carte("commencement", "Le Commencement", 3, "speciaux", "Carte Rocket League"),
  carte("douilled", "Douilled", 4, "speciaux"),
  carte("proton-vpn", "Proton VPN", 4, "speciaux"),
  carte("kayak", "Le kayak", 1, "speciaux"),
  carte("compte-renault", "Le compte Renault", 2, "speciaux"),
  carte("green-card", "La Green Card", 3, "speciaux"),
  carte("fc-papillon", "Le FC Papillon", 3, "speciaux"),
  carte("mkqb", "MKQB", 4, "speciaux", "Enchaînement de 4 fast-foods"),
  carte("pgw-2022", "PGW 2022", 2, "speciaux"),
  carte("eli-support", "Eli support", 1, "speciaux", "League of Legends"),
  carte("eli-camionneuse", "Eli camionneuse", 1, "speciaux", "Euro Truck Simulator"),
  carte("eli-cerisier", "Eli biome cerisier", 1, "speciaux", "Minecraft"),
  carte("trisomie-21", "Trisomie 21", 3, "speciaux"),
  carte("soiree-film-1", "Soirée film #1", 2, "speciaux"),
  carte("soiree-film-2", "Soirée film #2", 2, "speciaux"),
  carte("soiree-film-3", "Soirée film #3", 3, "speciaux"),
  carte("stagiaires", "Les stagiaires", 5, "speciaux"),
  carte("lacher-poule", "Lâcher de poule", 3, "speciaux"),
];

// Fiches détaillées : "création" (ce que la carte doit représenter / montrer)
// et "description" (le texte de la carte). Clé = id de la carte.
const FICHES = {
  "t-classique": {
    creation: "Simplement Thomas, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Chauve, petit, perfectionniste… oui, c'est bien la version classique de Thomas.",
  },
  "t-voyageur": {
    creation:
      "Thomas en short et t-shirt, sac à dos style Peak Design Travel, bob sur la tête. Il marche à Tokyo dans de petites ruelles, avec quelques Japonais qui passent.",
    description: "Voyage au Japon en 2024-2026. Comme d'habitude, il lui arrivera des situations improbables.",
  },
  "t-etudiant": {
    creation: "Thomas à son bureau, en train de tracer des kanji, avec un cahier d'exercices Kumon comme référence.",
    description:
      "Il étudie depuis 2019 et reste bloqué au niveau JLPT N5. Un jour, il saura parler et écrire couramment.",
  },
  "nana-diff": {
    creation: "Simplement Nana, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Nanami, celle qui se plaint tout le temps, celle qui a changé le destin de Thomas.",
  },
  "t-accueil": {
    creation:
      "Thomas attend Matthieu devant les « Arrivals », une pancarte « Matthieu » à la main. L'attente est longue et se lit sur son visage.",
    description: "Thomas à l'aéroport. Un jour, Matthieu descendra de son avion, un jour nous serons réunis…",
  },
  "deuxieme-expedition": {
    creation:
      "Thomas au premier plan, vu de face, sac au dos : il marche vers nous en s'éloignant de Matthieu pour aller chercher de quoi manger. Derrière lui, Matthieu est resté assis par terre, à droite de la carte. Le London Eye se dresse à gauche. Une foule de petites silhouettes qui marchent, presque invisibles (opacité 2 %), remplit la scène.",
    description: "Deuxième ravitaillement avant le feu d'artifice ! Espérons que Thomas ne se perde pas…",
  },
  "t-support": {
    creation:
      "Vue de face : Thomas au bureau avec un casque-micro sur la tête. Ses écrans apparaissent devant lui en transparence (opacité 2 %).",
    description: "10 h 30 – 18 h 30. Il reste des incidents à gérer et des tickets à clôturer.",
  },
  "t-lowpoly": {
    creation: "Simplement Thomas au design low poly PlayStation 1, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Thomas rétro PlayStation 1. Ce modèle 3D est collector… mais ne vaut rien.",
  },
  "t-perenoel": {
    creation: "Thomas en costume de Père Noël, un sac de cadeaux sur l'épaule, marche dans la neige le soir.",
    description: "Père Thomas distribue les cadeaux de Noël, même en pleine tempête de neige.",
  },
  "t-bizarre": {
    creation: "Une pose et une référence à l'anime JoJo's Bizarre Adventure.",
    description: "Stand : Lucky Corrupted\nForce : 8\nVitesse : 9\nAgilité : 3\nPrécision : 7\n…",
  },
  "t-gundam": {
    creation:
      "Au premier plan, le bureau de Thomas avec un tapis de découpe type modélisme. Derrière, Thomas face à nous galère à monter son Gunpla : la boîte, quelques pièces et la pince coupante sont posées sur le bureau. Il peine à emboîter deux petites pièces.",
    description:
      "Chacun sa bataille. Pour Thomas, ce fut un combat difficile, mais il a réussi à emboîter les deux pièces du Gundam !",
  },
  "t-risitas": {
    creation: "Thomas reproduit le mème Risitas « Issou », avec l'image originale comme référence.",
    description: "ISSOU",
  },
  "t-stronk": {
    creation: "Thomas reproduit le mème « Stronk », avec l'image originale comme référence.",
    description: "C'est STRONK !",
  },
  "t-notstronk": {
    creation: "Thomas reproduit le mème « Not Stronk », avec l'image originale comme référence.",
    description: "C'est pas STRONK !",
  },
  "t-chat": {
    creation: "Tout simplement le chat de Thomas, avec son lit en fond.",
    description: "Le Nyan Cat de Thomas.",
  },
  "t-bourre": {
    creation:
      "Thomas court dans la rue pour essayer de ne pas arriver en retard. Fine pluie, temps légèrement gris.",
    description:
      "Mieux vaut bien dormir et arriver en retard que se réveiller tôt et… arriver en avance…",
  },
  mcdeal: {
    creation:
      "Un menu McDeal de chez McDo : petite boisson, petite frite et petit burger emballé, avec le logo M gardé sur le sachet. Fond en dégradé radial bicolore.",
    description: "Un petit menu, un ticket resto et ça repart !",
  },
  "patate-mcdo": {
    creation:
      "La patate McDo de chez McDo Québec, qui dépasse de son petit sachet dédié, avec le logo M gardé sur le sachet. Fond en dégradé radial bicolore.",
    description: "Une patate McDo et ça démarre !",
  },
  "metro-japonais": {
    creation:
      "L'intérieur d'un métro japonais à moitié bondé. Les autres passagers sont des silhouettes colorées transparentes (opacité 5 %), de la même taille que Thomas, debout et assises, au premier plan comme à l'arrière-plan. Thomas est debout et attend le prochain arrêt en regardant les écrans d'annonce au-dessus des portes.",
    description: "Métro, boulot, dodo.",
  },
  losc: {
    creation:
      "Thomas dans les gradins du stade de Lille pendant un match du LOSC, vu de face (le terrain n'est pas visible). Il soutient son équipe, la scène est pleine d'énergie.",
    description: "Supporter un jour, supporter toujours.",
  },
  "discord-1": {
    creation:
      "Thomas dans son lit, écouteurs sans fil dans les oreilles, regarde une soirée film sur son téléphone. Vu de face, avec l'écran du téléphone en transparence (opacité 4 %) pour qu'on le voie sur la carte.",
    description: "La saga Harry Potter, la saga The Hobbit… il faudra aussi regarder tous les Star Wars !",
  },
  "t-routier": {
    creation:
      "Thomas à côté de son camion renversé sur l'autoroute, les mains sur les hanches, dégoûté. Sur la route, on voit les traces de pneus d'un autre camion qui l'a dépassé.",
    description: "La bande d'arrêt d'urgence, c'est ma voie réservée.",
  },
  "t-midlaner": {
    creation:
      "Thomas vu de face, à hauteur d'homme, sur un fond de lane de League of Legends. Il porte les queues d'Ahri et ses orbes, en référence au champion.",
    description: "A : Orbe d'illusion\nZ : Feux follets\nE : Charme\nR : Ruée spirituelle",
  },
  "les-blancs": {
    creation:
      "Au premier plan, un échiquier en pleine partie. La caméra est à hauteur d'une pièce, légèrement surélevée pour bien voir le plateau. En arrière-plan, Thomas, beaucoup plus grand et un peu flou, pour mettre l'accent sur l'échiquier.",
    description:
      "d4 : le pion de la dame avance de deux cases.\nFf4 : le fou sort pour contrôler le centre.\ne3 : renforcer le centre et libérer l'autre fou.\nCf3 : développer le cavalier.\nc3 : consolider la structure de pions.",
  },
  altimance: {
    creation: "Vue extérieure du bâtiment de l'entreprise Altimance, d'après la référence.",
    description: "Support informatique, bonjour ?",
  },
  "mamushi-chan": {
    creation:
      "Un petit appartement transformé en petit maid bar. Mamushi, en tenue de maid, nous accueille en s'inclinant. En fond, plein de bouteilles peu détaillées. Six places au comptoir, dont une occupée par un homme vu de dos, un peu affalé, son verre à côté de lui.",
    description: "Petit, étroit, mais tellement chaleureux. J'ai hâte de goûter le repas de Mamushi-chan.",
  },
  "bataille-peintre": {
    creation:
      "Scène en extérieur, légèrement surélevée, sur de l'herbe, avec en arrière-plan l'océan calme et l'horizon. Deux peintres doivent peindre un concept en 4 minutes sans préparation : ils se démènent sur leurs chevalets pour gagner le duel. Au premier plan, la silhouette floue de Thomas (il n'est pas le sujet principal).",
    description: "Finalement, le Fuderock, c'est pas si mal !",
  },
  "gateau-anniv": {
    creation: "Simplement une part de gâteau d'anniversaire, d'après la référence, sur un fond en dégradé radial bicolore.",
    description: "Joyeux anniversaire Thomas !",
  },
  "t-moussaillon": {
    creation:
      "Référence à Sea of Thieves : Thomas sur son galion en tenue de moussaillon, un seau à la main. Sans trop savoir pourquoi, il porte aussi un léger maquillage rose.",
    description: "On est en train de prendre l'eau ! On prend l'eau !",
  },
  "t-lancier": {
    creation:
      "Thomas dans un univers médiéval fantasy, en référence à Throne and Liberty, vêtu d'habits de noble de l'époque, une lance à la main.",
    description: "Le prochain event est à 16 h 09, on le fait ?",
  },
  "t-trouillard": {
    creation:
      "Référence à Phasmophobia : Thomas au fond du camion, vu de face, lampe torche en main, terrifié à l'idée d'en sortir. Au premier plan, les portes ouvertes du camion.",
    description: "Nan mais allez-y, vous ! Moi, je surveille votre rythme cardiaque !",
  },
};

/* ============================================================ */

const SANS_GROUPE = "__aucun";

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
  const [detail, setDetail] = useState(null);

  const rareteParId = useMemo(() => Object.fromEntries(RARETES.map((r) => [r.id, r])), []);
  const ordreRarete = useMemo(() => Object.fromEntries(RARETES.map((r, i) => [r.id, i])), []);
  const groupeParId = useMemo(() => Object.fromEntries(GROUPES.map((g) => [g.id, g])), []);

  const cartesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return CARTES.filter((c) => filtreRarete === "toutes" || c.rarete === filtreRarete)
      .filter((c) => {
        if (!q) return true;
        const f = FICHES[c.id] || {};
        return [c.nom, c.contexte, f.creation, f.description].some((t) => (t || "").toLowerCase().includes(q));
      })
      .sort((a, b) => (ordreRarete[b.rarete] ?? -1) - (ordreRarete[a.rarete] ?? -1) || a.nom.localeCompare(b.nom));
  }, [recherche, filtreRarete, ordreRarete]);

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
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50">Mes cartes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {CARTES.length} cartes · {GROUPES.length} groupes · {nbCompletes} fiche{nbCompletes > 1 ? "s" : ""} complète
            {nbCompletes > 1 ? "s" : ""}
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-amber-500/70 transition-all"
              style={{ width: `${(nbCompletes / CARTES.length) * 100}%` }}
            />
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
        <div className="relative mb-3">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une carte, une fiche…"
            className="w-full min-h-11 rounded-xl bg-zinc-800/80 border border-zinc-700/60 pl-10 pr-3.5 py-2.5 text-[15px] text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

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
                    const complete = ficheComplete(c.id);
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
                        {complete && (
                          <span
                            aria-label="Fiche complète"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/80"
                          />
                        )}
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
