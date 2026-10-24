import React, { useMemo, useState } from "react";
import { Search, X, Layers, Gem, ChevronRight } from "lucide-react";

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
  carte("losc", "LOSC", 1, "thomas"),
  carte("discord-1", "Soirée Discord #1", 1, "thomas"),
  carte("minecraft-sncf", "Minecraft SNCF", 1, "thomas"),
  carte("t-routier", "Thomas routier", 1, "thomas"),
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
  carte("ol", "OL", 1, "matthieu"),
  carte("discord-2", "Soirée Discord #2", 1, "matthieu"),
  carte("minecraft-pouletto", "Minecraft Pouletto", 1, "matthieu"),
  carte("m-routier", "Matthieu routier", 1, "matthieu"),
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

function BadgeRarete({ rarete }) {
  if (!rarete) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: rarete.couleur, background: `${rarete.couleur}1f`, border: `1px solid ${rarete.couleur}40` }}
    >
      <Pastille rarete={rarete} taille={7} />
      {rarete.nom}
    </span>
  );
}

function Feuille({ ouverte, onFermer, children }) {
  if (!ouverte) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFermer} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl bg-zinc-900 border-t border-zinc-700/60 px-5 pb-10 pt-3">
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-zinc-700" />
        <div className="flex justify-end">
          <button
            onClick={onFermer}
            aria-label="Fermer"
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

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
      .filter((c) => !q || c.nom.toLowerCase().includes(q) || (c.contexte || "").toLowerCase().includes(q))
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

  const rDetail = detail ? rareteParId[detail.rarete] : null;
  const gDetail = detail ? groupeParId[detail.groupe] : null;

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
            {CARTES.length} carte{CARTES.length > 1 ? "s" : ""} · {GROUPES.length} groupe{GROUPES.length > 1 ? "s" : ""}
          </p>
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
            placeholder="Rechercher une carte ou un contexte"
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
                          className="h-12 w-1 shrink-0 rounded-full"
                          style={{ background: r?.couleur || "#3f3f46", boxShadow: r ? `0 0 12px ${r.couleur}66` : "none" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-zinc-100">{c.nom}</p>
                          {c.contexte && <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{c.contexte}</p>}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {vue === "groupes" ? (
                              <BadgeRarete rarete={r} />
                            ) : (
                              g && <span className="text-xs text-zinc-500">{g.nom}</span>
                            )}
                          </div>
                        </div>
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

      {/* Fiche en lecture seule */}
      <Feuille ouverte={!!detail} onFermer={() => setDetail(null)}>
        {detail && (
          <div>
            <div
              className="mb-5 h-1 w-16 rounded-full"
              style={{ background: rDetail?.couleur || "#3f3f46", boxShadow: rDetail ? `0 0 14px ${rDetail.couleur}88` : "none" }}
            />
            <h2 className="text-2xl font-bold tracking-tight text-zinc-50">{detail.nom}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <BadgeRarete rarete={rDetail} />
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                {gDetail ? gDetail.nom : "Sans groupe"}
              </span>
            </div>
            <p className="mt-6 mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Contexte</p>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-300">
              {detail.contexte || "Pas encore de contexte."}
            </p>
          </div>
        )}
      </Feuille>
    </div>
  );
}
