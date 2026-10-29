import React, { useMemo, useState } from "react";
import { Search, Layers, Gem, ChevronRight, ChevronLeft } from "lucide-react";

/* ============================================================
   DONNÉES — mises à jour par Claude au fil de la conversation
   ============================================================ */

// Nom du deck
const NOM_DECK = "Anima Isekai";

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
  { id: "shonen", nom: "Shōnen" },
  { id: "seinen", nom: "Seinen" },
  { id: "shojo", nom: "Shōjo" },
];

// Cartes : { id, nom, contexte, rarete, groupe }
const R = ["commune", "peu-commune", "rare", "epique", "legendaire"];
const carte = (id, nom, niveau, groupe, contexte = "") => ({ id, nom, rarete: R[niveau - 1], groupe, contexte });

const CARTES = [
  // One Piece
  carte("op-matthieu", "Monkey D. Matthieu", 1, "shonen", "One Piece"),
  carte("op-eli", "Nico Eli", 1, "shonen", "One Piece"),
  carte("op-thomas", "Roronoa Thomas", 1, "shonen", "One Piece"),

  // Jujutsu Kaisen
  carte("jjk-matthieu", "Matthieu Itadori", 1, "shonen", "Jujutsu Kaisen"),
  carte("jjk-eli", "Eli Kugisaki", 1, "shonen", "Jujutsu Kaisen"),
  carte("jjk-thomas", "Thomas Fushiguro", 1, "shonen", "Jujutsu Kaisen"),
  carte("jjk-nana", "Nana Zen'in", 5, "shonen", "Jujutsu Kaisen"),

  // Blue Box
  carte("bb-matthieu", "Matthieu Inomata", 3, "shojo", "Blue Box"),
  carte("bb-eli", "Eli Kano", 3, "shojo", "Blue Box"),
  carte("bb-thomas", "Thomas Kasahara", 3, "shojo", "Blue Box"),

  // Spy x Family
  carte("sxf-thomas", "Thomas Forger", 2, "shonen", "Spy x Family"),
  carte("sxf-eli", "Eli Forger", 2, "shonen", "Spy x Family"),
  carte("sxf-matthieu", "Matthieu Forger", 2, "shonen", "Spy x Family"),

  // Pokémon
  carte("pkm-matthieu", "Matthieu dresseur Électrik", 4, "shonen", "Pokémon"),
  carte("pkm-thomas", "Thomas dresseur Roche", 4, "shonen", "Pokémon"),
  carte("pkm-eli", "Eli dresseuse Eau", 4, "shonen", "Pokémon"),

  // Naruto
  carte("nar-thomas", "Thomas Uzumaki", 3, "shonen", "Naruto"),
  carte("nar-eli", "Eli Haruno", 3, "shonen", "Naruto"),
  carte("nar-matthieu", "Matthieu Uchiwa", 3, "shonen", "Naruto"),

  // JoJo's Bizarre Adventure
  carte("jojo-thomas", "Thomas Giovanna", 4, "shonen", "JoJo's Bizarre Adventure"),
  carte("jojo-matthieu", "Matthieu Anasui", 4, "shonen", "JoJo's Bizarre Adventure"),
  carte("jojo-nana", "Nana Una", 5, "shonen", "JoJo's Bizarre Adventure"),
  carte("jojo-eli", "Eli Cujoh", 4, "shonen", "JoJo's Bizarre Adventure"),

  // Sakamoto Days
  carte("sd-matthieu", "Matthieu Asakura", 1, "shonen", "Sakamoto Days"),
  carte("sd-thomas", "Thomas Taro", 1, "shonen", "Sakamoto Days"),
  carte("sd-eli", "Eli Lu", 1, "shonen", "Sakamoto Days"),
  carte("sd-nana", "Nana Aoi", 1, "shonen", "Sakamoto Days"),

  // Black Clover
  carte("bc-matthieu", "Matthieu Asta", 2, "shonen", "Black Clover"),
  carte("bc-thomas", "Thomas Grinberryall", 2, "shonen", "Black Clover"),
  carte("bc-eli", "Eli Silva", 2, "shonen", "Black Clover"),
  carte("bc-nana", "Nana Vermillion", 2, "shonen", "Black Clover"),

  // Frieren
  carte("fr-matthieu", "Matthieu Stark", 2, "shonen", "Frieren"),
  carte("fr-eli", "Eli Fern", 2, "shonen", "Frieren"),
  carte("fr-thomas", "Thomas Himmel", 2, "shonen", "Frieren"),
  carte("fr-nana", "Nana Frieren", 2, "shonen", "Frieren"),

  // Dandadan
  carte("dd-nana", "Nana Ayase", 1, "shonen", "Dandadan"),
  carte("dd-thomas", "Thomas Takakura", 1, "shonen", "Dandadan"),
  carte("dd-eli", "Eli Ayase", 2, "shonen", "Dandadan"),
  carte("dd-matthieu", "Matthieu Enjoji", 2, "shonen", "Dandadan"),

  // Demon Slayer
  carte("ds-thomas", "Thomas Kamado", 4, "shonen", "Demon Slayer"),
  carte("ds-matthieu", "Matthieu Agatsuma", 4, "shonen", "Demon Slayer"),
  carte("ds-eli", "Eli Tsuyuri", 4, "shonen", "Demon Slayer"),
  carte("ds-nana", "Nana Kamado", 5, "shonen", "Demon Slayer"),

  // Chainsaw Man
  carte("csm-matthieu", "Matthieu Denji", 1, "seinen", "Chainsaw Man"),
  carte("csm-eli", "Eli Makima", 5, "seinen", "Chainsaw Man"),
  carte("csm-thomas", "Thomas Hayakawa", 1, "seinen", "Chainsaw Man"),
  carte("csm-nana", "Nana Ange", 1, "seinen", "Chainsaw Man"),

  // Kiseijū
  carte("kis-arashi", "Arashi Shinichi", 3, "seinen", "Kiseijū"),
  carte("kis-eli", "Eli Murano", 3, "seinen", "Kiseijū"),

  // Chi. Du mouvement de la Terre
  carte("chi-nana", "Nana Draka", 3, "seinen", "Chi. Du mouvement de la Terre"),
  carte("chi-thomas", "Thomas Rafal", 3, "seinen", "Chi. Du mouvement de la Terre"),

  // Grand Blue
  carte("gb-thomas", "Thomas Kitahara", 1, "seinen", "Grand Blue"),
  carte("gb-matthieu", "Matthieu Imamura", 1, "seinen", "Grand Blue"),
  carte("gb-eli", "Eli Kotegawa", 1, "seinen", "Grand Blue"),
  carte("gb-nana", "Nana Yoshiwara", 1, "seinen", "Grand Blue"),

  // Sword of the Demon Hunter
  carte("sdh-thomas", "Thomas Jinya", 3, "seinen", "Sword of the Demon Hunter"),
  carte("sdh-matthieu", "Matthieu Akitsu", 2, "seinen", "Sword of the Demon Hunter"),
  carte("sdh-eli", "Eli Suzune", 2, "seinen", "Sword of the Demon Hunter"),
  carte("sdh-nana", "Nana Shirayuki", 4, "seinen", "Sword of the Demon Hunter"),
];

// Fiches détaillées : "création" (ce que la carte doit représenter / montrer)
// et "description" (le texte de la carte). Clé = id de la carte.
const FICHES = {
  // Création : « Référence à [anime] : [nom] incarnant [personnage], à partir des références fournies. »
  "op-matthieu": { creation: "Référence à One Piece : Matthieu incarnant Monkey D. Luffy, à partir des références fournies.", description: "Monkey D. Luffy\nOne Piece" },
  "op-eli": { creation: "Référence à One Piece : Eli incarnant Nico Robin, à partir des références fournies.", description: "Nico Robin\nOne Piece" },
  "op-thomas": { creation: "Référence à One Piece : Thomas incarnant Roronoa Zoro, à partir des références fournies.", description: "Roronoa Zoro\nOne Piece" },
  "jjk-matthieu": { creation: "Référence à Jujutsu Kaisen : Matthieu incarnant Yuji Itadori, à partir des références fournies.", description: "Yuji Itadori\nJujutsu Kaisen" },
  "jjk-eli": { creation: "Référence à Jujutsu Kaisen : Eli incarnant Nobara Kugisaki, à partir des références fournies.", description: "Nobara Kugisaki\nJujutsu Kaisen" },
  "jjk-thomas": { creation: "Référence à Jujutsu Kaisen : Thomas incarnant Megumi Fushiguro, à partir des références fournies.", description: "Megumi Fushiguro\nJujutsu Kaisen" },
  "jjk-nana": { creation: "Référence à Jujutsu Kaisen : Nana incarnant Maki Zen'in, à partir des références fournies.", description: "Maki Zen'in\nJujutsu Kaisen" },
  "bb-matthieu": { creation: "Référence à Blue Box : Matthieu incarnant Taiki Inomata, à partir des références fournies.", description: "Taiki Inomata\nBlue Box" },
  "bb-eli": { creation: "Référence à Blue Box : Eli incarnant Chinatsu Kano, à partir des références fournies.", description: "Chinatsu Kano\nBlue Box" },
  "bb-thomas": { creation: "Référence à Blue Box : Thomas incarnant Kyo Kasahara, à partir des références fournies.", description: "Kyo Kasahara\nBlue Box" },
  "sxf-thomas": { creation: "Référence à Spy x Family : Thomas incarnant Anya Forger, à partir des références fournies.", description: "Anya Forger\nSpy x Family" },
  "sxf-eli": { creation: "Référence à Spy x Family : Eli incarnant Yor Forger, à partir des références fournies.", description: "Yor Forger\nSpy x Family" },
  "sxf-matthieu": { creation: "Référence à Spy x Family : Matthieu incarnant Loid Forger, à partir des références fournies.", description: "Loid Forger\nSpy x Family" },
  "pkm-matthieu": { creation: "Référence à Pokémon : Matthieu incarnant Sacha, à partir des références fournies.", description: "Sacha\nPokémon" },
  "pkm-thomas": { creation: "Référence à Pokémon : Thomas incarnant Pierre, à partir des références fournies.", description: "Pierre\nPokémon" },
  "pkm-eli": { creation: "Référence à Pokémon : Eli incarnant Ondine, à partir des références fournies.", description: "Ondine\nPokémon" },
  "nar-thomas": { creation: "Référence à Naruto : Thomas incarnant Naruto Uzumaki, à partir des références fournies.", description: "Naruto Uzumaki\nNaruto" },
  "nar-eli": { creation: "Référence à Naruto : Eli incarnant Sakura Haruno, à partir des références fournies.", description: "Sakura Haruno\nNaruto" },
  "nar-matthieu": { creation: "Référence à Naruto : Matthieu incarnant Sasuke Uchiwa, à partir des références fournies.", description: "Sasuke Uchiwa\nNaruto" },
  "jojo-thomas": { creation: "Référence à JoJo's Bizarre Adventure : Thomas incarnant Giorno Giovanna, à partir des références fournies.", description: "Giorno Giovanna\nJoJo's Bizarre Adventure" },
  "jojo-matthieu": { creation: "Référence à JoJo's Bizarre Adventure : Matthieu incarnant Narciso Anasui, à partir des références fournies.", description: "Narciso Anasui\nJoJo's Bizarre Adventure" },
  "jojo-nana": { creation: "Référence à JoJo's Bizarre Adventure : Nana incarnant Trish Una, à partir des références fournies.", description: "Trish Una\nJoJo's Bizarre Adventure" },
  "jojo-eli": { creation: "Référence à JoJo's Bizarre Adventure : Eli incarnant Jolyne Cujoh, à partir des références fournies.", description: "Jolyne Cujoh\nJoJo's Bizarre Adventure" },
  "kis-arashi": { creation: "Référence à Kiseijū : Arashi incarnant Shinichi Izumi, à partir des références fournies.", description: "Shinichi Izumi\nKiseijū" },
  "kis-eli": { creation: "Référence à Kiseijū : Eli incarnant Satomi Murano, à partir des références fournies.", description: "Satomi Murano\nKiseijū" },
  "chi-nana": { creation: "Référence à Chi. Du mouvement de la Terre : Nana incarnant Draka, à partir des références fournies.", description: "Draka\nChi. Du mouvement de la Terre" },
  "chi-thomas": { creation: "Référence à Chi. Du mouvement de la Terre : Thomas incarnant Rafal, à partir des références fournies.", description: "Rafal\nChi. Du mouvement de la Terre" },
  "sd-matthieu": { creation: "Référence à Sakamoto Days : Matthieu incarnant Shin Asakura, à partir des références fournies.", description: "Shin Asakura\nSakamoto Days" },
  "sd-thomas": { creation: "Référence à Sakamoto Days : Thomas incarnant Taro Sakamoto, à partir des références fournies.", description: "Taro Sakamoto\nSakamoto Days" },
  "sd-eli": { creation: "Référence à Sakamoto Days : Eli incarnant Lu Xiaotang, à partir des références fournies.", description: "Lu Xiaotang\nSakamoto Days" },
  "sd-nana": { creation: "Référence à Sakamoto Days : Nana incarnant Aoi Sakamoto, à partir des références fournies.", description: "Aoi Sakamoto\nSakamoto Days" },
  "bc-matthieu": { creation: "Référence à Black Clover : Matthieu incarnant Asta, à partir des références fournies.", description: "Asta\nBlack Clover" },
  "bc-thomas": { creation: "Référence à Black Clover : Thomas incarnant Yuno Grinberryall, à partir des références fournies.", description: "Yuno Grinberryall\nBlack Clover" },
  "bc-eli": { creation: "Référence à Black Clover : Eli incarnant Noelle Silva, à partir des références fournies.", description: "Noelle Silva\nBlack Clover" },
  "bc-nana": { creation: "Référence à Black Clover : Nana incarnant Mimosa Vermillion, à partir des références fournies.", description: "Mimosa Vermillion\nBlack Clover" },
  "fr-matthieu": { creation: "Référence à Frieren : Matthieu incarnant Stark, à partir des références fournies.", description: "Stark\nFrieren" },
  "fr-eli": { creation: "Référence à Frieren : Eli incarnant Fern, à partir des références fournies.", description: "Fern\nFrieren" },
  "fr-thomas": { creation: "Référence à Frieren : Thomas incarnant Himmel, à partir des références fournies.", description: "Himmel\nFrieren" },
  "fr-nana": { creation: "Référence à Frieren : Nana incarnant Frieren, à partir des références fournies.", description: "Frieren\nFrieren" },
  "gb-thomas": { creation: "Référence à Grand Blue : Thomas incarnant Iori Kitahara, à partir des références fournies.", description: "Iori Kitahara\nGrand Blue" },
  "gb-matthieu": { creation: "Référence à Grand Blue : Matthieu incarnant Kōhei Imamura, à partir des références fournies.", description: "Kōhei Imamura\nGrand Blue" },
  "gb-eli": { creation: "Référence à Grand Blue : Eli incarnant Chisa Kotegawa, à partir des références fournies.", description: "Chisa Kotegawa\nGrand Blue" },
  "gb-nana": { creation: "Référence à Grand Blue : Nana incarnant Aina Yoshiwara, à partir des références fournies.", description: "Aina Yoshiwara\nGrand Blue" },
  "dd-nana": { creation: "Référence à Dandadan : Nana incarnant Momo Ayase, à partir des références fournies.", description: "Momo Ayase\nDandadan" },
  "dd-thomas": { creation: "Référence à Dandadan : Thomas incarnant Ken Takakura, à partir des références fournies.", description: "Ken Takakura\nDandadan" },
  "dd-eli": { creation: "Référence à Dandadan : Eli incarnant Seiko Ayase, à partir des références fournies.", description: "Seiko Ayase\nDandadan" },
  "dd-matthieu": { creation: "Référence à Dandadan : Matthieu incarnant Jin Enjoji, à partir des références fournies.", description: "Jin Enjoji\nDandadan" },
  "ds-thomas": { creation: "Référence à Demon Slayer : Thomas incarnant Tanjiro Kamado, à partir des références fournies.", description: "Tanjiro Kamado\nDemon Slayer" },
  "ds-matthieu": { creation: "Référence à Demon Slayer : Matthieu incarnant Zenitsu Agatsuma, à partir des références fournies.", description: "Zenitsu Agatsuma\nDemon Slayer" },
  "ds-eli": { creation: "Référence à Demon Slayer : Eli incarnant Kanao Tsuyuri, à partir des références fournies.", description: "Kanao Tsuyuri\nDemon Slayer" },
  "ds-nana": { creation: "Référence à Demon Slayer : Nana incarnant Nezuko Kamado, à partir des références fournies.", description: "Nezuko Kamado\nDemon Slayer" },
  "sdh-thomas": { creation: "Référence à Sword of the Demon Hunter : Thomas incarnant Jinya, à partir des références fournies.", description: "Jinya\nSword of the Demon Hunter" },
  "sdh-matthieu": { creation: "Référence à Sword of the Demon Hunter : Matthieu incarnant Somegorō Akitsu, à partir des références fournies.", description: "Somegorō Akitsu\nSword of the Demon Hunter" },
  "sdh-eli": { creation: "Référence à Sword of the Demon Hunter : Eli incarnant Suzune, à partir des références fournies.", description: "Suzune\nSword of the Demon Hunter" },
  "sdh-nana": { creation: "Référence à Sword of the Demon Hunter : Nana incarnant Shirayuki, à partir des références fournies.", description: "Shirayuki\nSword of the Demon Hunter" },
  "csm-matthieu": { creation: "Référence à Chainsaw Man : Matthieu incarnant Denji, à partir des références fournies.", description: "Denji\nChainsaw Man" },
  "csm-eli": { creation: "Référence à Chainsaw Man : Eli incarnant Makima, à partir des références fournies.", description: "Makima\nChainsaw Man" },
  "csm-thomas": { creation: "Référence à Chainsaw Man : Thomas incarnant Aki Hayakawa, à partir des références fournies.", description: "Aki Hayakawa\nChainsaw Man" },
  "csm-nana": { creation: "Référence à Chainsaw Man : Nana incarnant le Démon de l'Ange, à partir des références fournies.", description: "Démon de l'Ange\nChainsaw Man" },
};

/* ============================================================ */

// Cartes dont l'illustration est terminée (id)
const ILLUSTREES = new Set([
  "op-matthieu", "op-eli", "op-thomas", "jjk-matthieu", "jjk-eli", "jjk-thomas", "jjk-nana", "bb-matthieu", "bb-eli", "bb-thomas", "sxf-thomas", "sxf-eli", "sxf-matthieu", "pkm-matthieu", "pkm-thomas", "pkm-eli", "nar-thomas", "nar-eli", "nar-matthieu",
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
              style={{ width: `${(CARTES.length ? nbCompletes / CARTES.length : 0) * 100}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all"
              style={{ width: `${(CARTES.length ? nbIllustrees / CARTES.length : 0) * 100}%` }}
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
