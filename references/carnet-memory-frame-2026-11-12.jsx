import React, { useMemo, useState } from "react";
import { Search, Layers, Gem, ChevronRight, ChevronLeft, Eye, EyeOff } from "lucide-react";

/* ============================================================
   DONNÉES — mises à jour par Claude au fil de la conversation
   ============================================================ */

// Nom du deck
const NOM_DECK = "Memory Fragment";

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
  { id: "eli", nom: "Groupe Eli" },
  { id: "dorian", nom: "Groupe Dorian" },
  { id: "nana", nom: "Groupe Nana" },
  { id: "groupes", nom: "Groupes" },
  { id: "speciaux", nom: "Spéciaux" },
  { id: "noel", nom: "Cadeaux de Noël (temporaire)" },
];

// Cartes : { id, nom, contexte, rarete, groupe }
const R = ["commune", "peu-commune", "rare", "epique", "legendaire"];
const carte = (id, nom, niveau, groupe, contexte = "") => ({ id, nom, rarete: R[niveau - 1], groupe, contexte });

const CARTES = [
  // Groupe Thomas
  carte("t-classique", "Thomas classique", 1, "thomas"),
  carte("t-voyageur", "Thomas voyageur", 2, "thomas", "Japon"),
  carte("t-etudiant", "Thomas étudiant", 3, "thomas", "Kanji"),
  carte("nana-diff", "Nana Diff", 4, "nana"),
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
  carte("overwatch", "Thomas Overwatch", 1, "thomas", "Ancien nom : Overwatch"),
  carte("t-muscle", "Thomas musclé", 3, "thomas"),
  carte("t-citron", "thomas_citron", 4, "thomas"),
  carte("t-minis", "Mini's Thomas", 4, "thomas"),
  carte("t-inventeur", "Thomas inventeur", 1, "thomas"),
  carte("t-randonneur", "Thomas randonneur", 1, "thomas"),
  carte("t-parisien", "Thomas parisien", 1, "thomas"),
  carte("t-conducteur", "Thomas conducteur", 2, "thomas", "Vague 2"),
  carte("t-petit", "Petit Thomas", 1, "thomas", "Vague 2"),
  carte("t-immigration", "Thomas vs immigration", 3, "thomas", "Vague 2"),
  carte("t-arabe", "Thomas arabe", 1, "thomas", "Vague 2"),
  carte("t-spotteur", "Thomas spotteur", 2, "thomas", "Vague 2"),

  // Groupe Matthieu
  carte("m-classique", "Matthieu classique", 1, "matthieu"),
  carte("m-voyageur", "Matthieu voyageur", 2, "matthieu", "Québec"),
  carte("m-etudiant", "Matthieu étudiant", 3, "matthieu", "Anglais"),
  carte("eli-diff", "Eli Diff", 4, "eli"),
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
  carte("minecraft-pouletto", "Minecraft Pouletto", 1, "matthieu"),
  carte("m-routier", "Matthieu camionneur", 1, "matthieu", "Ancien nom : Matthieu routier"),
  carte("m-jungler", "Matthieu jungler", 1, "matthieu"),
  carte("les-noirs", "Les Noirs", 1, "matthieu"),
  carte("cegep", "Cégep Lévis", 2, "matthieu", "Ancien nom : Cégep"),
  carte("vieille-appart", "La vieille de l'appart'", 2, "matthieu"),
  carte("chanteuse-nocturne", "La chanteuse nocturne", 3, "matthieu"),
  carte("jus-orange", "Le jus d'orange", 2, "matthieu"),
  carte("m-capitaine", "Matthieu capitaine", 3, "matthieu"),
  carte("m-premier", "Matthieu Ier", 1, "matthieu", "Throne and Liberty"),
  carte("m-exorciste", "Matthieu exorciste", 1, "matthieu", "Phasmophobia"),
  carte("m-bouffon", "Matthieu costume bouffon", 1, "matthieu"),
  carte("splatoon", "Matthieu Splatoon", 1, "matthieu", "Ancien nom : Splatoon"),
  carte("m-muscle", "Matthieu musclé", 3, "matthieu"),
  carte("m-tempete", "matthieu_tempete", 4, "matthieu"),
  carte("m-minis", "Mini's Matthieu", 4, "matthieu"),
  carte("m-ingenieur", "Matthieu ingénieur", 1, "matthieu"),
  carte("m-coureur", "Matthieu coureur", 1, "matthieu"),
  carte("m-parisien", "Matthieu parisien", 1, "matthieu"),
  carte("m-dest-quebec", "Matthieu destination Québec", 3, "matthieu", "Vague 2"),
  carte("m-reparateur", "Matthieu réparateur", 1, "matthieu", "Vague 2"),
  carte("m-infirmier", "Matthieu infirmier", 2, "matthieu", "Vague 2"),
  carte("m-belgique", "Matthieu en Belgique", 2, "matthieu", "Vague 2"),
  carte("m-arabe", "Matthieu arabe", 1, "matthieu", "Vague 2"),

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
  carte("pgw-2022", "PGW 2022", 2, "groupes"),
  carte("eli-support", "Eli support", 1, "eli", "League of Legends"),
  carte("eli-camionneuse", "Eli camionneuse", 1, "eli", "Euro Truck Simulator"),
  carte("eli-cerisier", "Eli biome cerisier", 1, "eli", "Minecraft"),
  carte("eli-chasseuse", "Eli chasseuse de fantômes", 1, "eli"),
  carte("eli-canotiere", "Eli canotière", 1, "eli"),
  carte("eli-parisienne", "Eli parisienne", 1, "eli"),
  carte("glaciere-picard", "La glacière Picard", 2, "speciaux"),
  carte("eli-arabe", "Eli arabe", 1, "eli", "Vague 2"),
  carte("nana-arabe", "Nana arabe", 5, "nana", "Vague 2"),
  carte("resto-poutine", "Resto de poutine", 2, "groupes", "Vague 2"),
  carte("date-aquarium", "Date à l'aquarium", 4, "groupes", "Vague 2"),
  carte("eli-kpop", "Eli K-pop star", 3, "eli", "Vague 2"),
  carte("worlds-lcs", "Worlds 2024", 3, "groupes", "Vague 2 · Ancien nom : World LCS 2025"),
  carte("trisomie-21", "Trisomie 21", 3, "speciaux"),
  carte("soiree-film-1", "Soirée film #1", 2, "thomas"),
  carte("soiree-film-2", "Soirée film #2", 2, "matthieu"),
  carte("soiree-film-3", "Soirée film #3", 2, "eli"),
  carte("stagiaires", "Les stagiaires", 5, "speciaux"),
  carte("lacher-poule", "Lâcher de poule", 3, "speciaux"),

  // ---- Vague 2 (suite) ----
  carte("cafe-glace-mcdo", "Café glacé McDo", 2, "speciaux", "Vague 2"),
  carte("micro-ondes-pizza", "Micro-ondes pizza", 2, "speciaux", "Vague 2"),
  carte("ubigi-esim", "Ubigi e-SIM", 4, "speciaux", "Vague 2"),
  carte("pgw-2023", "PGW 2023", 2, "groupes", "Vague 2"),
  carte("c-est-pas-loin", "C'est pas loin", 1, "groupes", "Vague 2"),
  carte("t-romantique", "Thomas romantique", 3, "groupes", "Vague 2"),
  carte("d-romantique", "Dorian romantique", 3, "groupes", "Vague 2"),
  carte("d-classique", "Dorian classique", 1, "dorian", "Vague 2"),
  carte("d-vs-ubigi", "Dorian vs Ubigi", 4, "dorian", "Vague 2"),
  carte("d-pas-muscle", "Dorian pas musclé", 3, "dorian", "Vague 2"),
  carte("d-arabe", "Dorian arabe", 1, "dorian", "Vague 2"),
  carte("d-bourre", "Dorian à la bourre", 4, "dorian", "Vague 2"),
  carte("d-chamelier", "Dorian chamelier", 1, "dorian", "Vague 2"),
  carte("d-mer", "Dorian à la mer", 1, "dorian", "Vague 2"),
  carte("d-lutoza", "Dorian Lutosa", 3, "dorian", "Vague 2"),
  carte("d-bouffon", "Dorian costume bouffon", 1, "dorian", "Vague 2"),
  carte("d-motard", "Dorian motard", 1, "dorian", "Vague 2"),
  carte("d-viandard", "Dorian viandard", 2, "dorian", "Vague 2"),
  carte("d-parisien", "Dorian parisien", 1, "dorian", "Vague 2"),
  carte("d-mma", "Dorian MMA", 5, "dorian", "Vague 2"),
  carte("t-mer", "Thomas à la mer", 1, "thomas", "Vague 2"),
  carte("t-motard", "Thomas motard", 1, "thomas", "Vague 2"),
  carte("m-yoga", "Matthieu passion yoga", 2, "matthieu", "Vague 2"),
  carte("m-caca-chien", "Matthieu caca de chien", 1, "matthieu", "Vague 2"),
  carte("eli-bouffonne", "Eli costume bouffonne", 1, "eli", "Vague 2"),
  carte("eli-traitresse", "Eli traîtresse", 2, "eli", "Vague 2"),
  carte("eli-bilingue", "Eli bilingue", 3, "eli", "Vague 2"),
  carte("statue-thomas", "Statue de Thomas", 2, "thomas", "Vague 2 · Série statue"),
  carte("statue-matthieu", "Statue de Matthieu", 2, "matthieu", "Vague 2 · Série statue"),
  carte("statue-eli", "Statue de Eli", 2, "eli", "Vague 2 · Série statue"),
  carte("statue-dorian", "Statue de Dorian", 2, "dorian", "Vague 2 · Série statue"),
  carte("statue-nana", "Statue de Nana", 2, "nana", "Vague 2 · Série statue"),
  carte("t-bizave", "Thomas BIZAVE", 5, "thomas"),
  carte("eli-veilleuse", "Eli veilleuse de nuit", 3, "eli", "Vague 2"),
  carte("nana-office-lady", "Nana Office Lady", 3, "nana", "Vague 2"),
  carte("claude-bizave", "Claude BIZAVE", 5, "speciaux"),
  carte("chatgpt-bizave", "ChatGPT BIZAVE", 5, "speciaux"),
  carte("salvatore-buisson", "Salvatore et le buisson", 4, "groupes"),
  carte("crotte-buisson", "La crotte du buisson", 3, "speciaux"),
  carte("m-correspondant", "Matthieu correspondant", 2, "matthieu"),
  carte("ciel-bleu", "Ciel bleu", 3, "groupes"),
  carte("le-bus", "Le bus", 1, "matthieu"),

  // Série Tho’ Mafia
  carte("thomafia-parrain", "Tho’ Mafia : Le Parrain", 5, "thomas", "Série Tho’ Mafia"),
  carte("thomafia-consigliere", "Tho’ Mafia : Le Consigliere", 3, "matthieu", "Série Tho’ Mafia"),
  carte("thomafia-comptable", "Tho’ Mafia : La Comptable", 3, "eli", "Série Tho’ Mafia"),
  carte("thomafia-gros-bras", "Tho’ Mafia : Le Gros Bras", 3, "dorian", "Série Tho’ Mafia"),
  carte("thomafia-negociatrice", "Tho’ Mafia : La Négociatrice", 3, "nana", "Série Tho’ Mafia"),

  // Série Matt’ Yakuza
  carte("mattyakuza-oyabun", "Matt’ Yakuza : L'Oyabun", 5, "matthieu", "Série Matt’ Yakuza"),
  carte("mattyakuza-anesan", "Matt’ Yakuza : L'Ane-san", 3, "eli", "Série Matt’ Yakuza"),
  carte("mattyakuza-wakagashira", "Matt’ Yakuza : Le Wakagashira", 3, "thomas", "Série Matt’ Yakuza"),
  carte("mattyakuza-tatoue", "Matt’ Yakuza : Le Tatoué", 3, "dorian", "Série Matt’ Yakuza"),
  carte("mattyakuza-informatrice", "Matt’ Yakuza : L'Informatrice", 3, "nana", "Série Matt’ Yakuza"),

  // Vague 2 (suite : rééquilibrage communes / peu communes)
  carte("t-jetlag", "Thomas jet-lag", 1, "thomas", "Vague 2"),
  carte("t-cables", "Thomas câble management", 1, "thomas", "Vague 2"),
  carte("t-ramen", "Thomas Ramen Museum", 1, "thomas", "Vague 2"),
  carte("t-parapluie", "Thomas parapluie volé", 1, "thomas", "Vague 2"),
  carte("t-konbini", "Thomas konbini", 1, "thomas", "Vague 2"),
  carte("m-pelle-neige", "Matthieu pelle à neige", 1, "matthieu", "Vague 2"),
  carte("m-depanneur", "Matthieu au dépanneur", 1, "matthieu", "Vague 2"),
  carte("m-hockey", "Matthieu hockey", 2, "matthieu", "Vague 2"),
  carte("eli-hockey", "Eli hockey", 2, "eli", "Vague 2"),
  carte("eli-bons-plats", "Eli bons p'tits plats", 2, "groupes", "Vague 2"),
  carte("d-motive", "Dorian le motivé", 2, "dorian", "Vague 2"),
  carte("d-souk", "Dorian au souk", 2, "dorian", "Vague 2"),

  // Événement Noël (temporaire)
  carte("noel-c1", "Le petit cube rouge", 1, "noel", "Événement Noël · temporaire"),
  carte("noel-c2", "Le paquet kraft", 1, "noel", "Événement Noël · temporaire"),
  carte("noel-c3", "Le tube vert", 1, "noel", "Événement Noël · temporaire"),
  carte("noel-c4", "La pochette rayée", 1, "noel", "Événement Noël · temporaire"),
  carte("noel-pc1", "La boîte à pois", 2, "noel", "Événement Noël · temporaire"),
  carte("noel-pc2", "Le paquet flocons", 2, "noel", "Événement Noël · temporaire"),
  carte("noel-pc3", "La boîte à rennes", 2, "noel", "Événement Noël · temporaire"),
  carte("noel-pc4", "Le paquet sapin", 2, "noel", "Événement Noël · temporaire"),
  carte("noel-r1", "La boîte étoilée", 3, "noel", "Événement Noël · temporaire"),
  carte("noel-r2", "Le carton à chapeau", 3, "noel", "Événement Noël · temporaire"),
  carte("noel-r3", "La boîte hexagonale", 3, "noel", "Événement Noël · temporaire"),
  carte("noel-r4", "Le long écrin", 3, "noel", "Événement Noël · temporaire"),
  carte("noel-e1", "Le coffre de velours", 4, "noel", "Événement Noël · temporaire"),
  carte("noel-e2", "Le cadeau sur luge", 4, "noel", "Événement Noël · temporaire"),
  carte("noel-e3", "La tour de cadeaux", 4, "noel", "Événement Noël · temporaire"),
  carte("noel-e4", "Le cœur emballé", 4, "noel", "Événement Noël · temporaire"),
  carte("noel-l1", "Le grand cadeau d'or", 5, "noel", "Événement Noël · temporaire"),
  carte("noel-l2", "Le cadeau de cristal", 5, "noel", "Événement Noël · temporaire"),
  carte("noel-l3", "Le cadeau flottant", 5, "noel", "Événement Noël · temporaire"),
  carte("noel-l4", "Le cadeau du pôle Nord", 5, "noel", "Événement Noël · temporaire"),
  carte("noel-merry-wifemas", "Merry Wifemas", 5, "noel", "Récompense de l'événement Noël · Message : peu importe la culture, Noël c'est beau :)"),

  // Vague 2 (suite)
  carte("insh-allah-airline", "Insh'Allah Airline", 2, "thomas", "Vague 2"),
  carte("gras-thomas", "Thogras", 1, "thomas", "Vague 2"),
  carte("gras-matthieu", "Gratthieu", 1, "matthieu", "Vague 2"),
  carte("gras-eli", "Élidiabète", 1, "eli", "Vague 2"),
  carte("gras-dorian", "Grorian", 1, "dorian", "Vague 2"),
  carte("gras-nana", "Nangras", 1, "nana", "Vague 2"),
  carte("pres-thomas", "Président Thomas", 2, "thomas", "Vague 2"),
  carte("pres-matthieu", "Président Matthieu", 2, "matthieu", "Vague 2"),
  carte("pres-dorian", "Président Dorian", 2, "dorian", "Vague 2"),
  carte("pres-eli", "Première ministre Eli", 2, "eli", "Vague 2"),
  carte("pres-nana", "Première ministre Nana", 2, "nana", "Vague 2"),
  carte("m-zelda", "Matthieu Zelda", 1, "matthieu", "Vague 2"),
  carte("eli-link", "Eli Link", 1, "eli", "Vague 2"),
  carte("eli-paiement", "Eli paiement refusé", 1, "eli", "Vague 2"),
  carte("eli-pigeons", "Eli passion pigeon", 1, "eli", "Vague 2"),
  carte("eli-chat", "Chat d'Eli", 1, "eli", "Vague 2"),
  carte("eli-perd-tout", "Eli perd tout", 1, "eli", "Vague 2"),
  carte("eli-supporter", "Eli supporter", 1, "eli", "Vague 2"),
  carte("m-photographe", "Matthieu photographe", 1, "matthieu", "Vague 2"),
  carte("sel-chambre", "Sel de chambre", 1, "matthieu", "Vague 2"),
  carte("la-bresilienne", "La Brésilienne", 2, "speciaux", "Vague 2"),
  carte("t-import", "Thomas import", 2, "thomas", "Vague 2"),
  carte("le-douanier", "Le douanier", 2, "thomas", "Vague 2"),
  carte("nana-bouffonne", "Nana costume bouffonne", 1, "nana", "Vague 2"),
  carte("nana-modele", "Nana modèle", 2, "nana", "Vague 2"),
  carte("village-hors-du-temps", "Le village médiéval", 2, "groupes", "Vague 2"),
  carte("nana-bourre", "Nana à la bourre", 4, "nana", "Vague 2"),
  carte("t-mangaka", "Thomas mangaka", 1, "thomas", "Vague 2"),
  carte("nana-pause", "Nana en pause", 1, "nana", "Vague 2"),
  carte("nana-tanuki", "Nana vs la tanuki", 1, "nana", "Vague 2"),
];

// Fiches détaillées : "création" (ce que la carte doit représenter / montrer)
// et "description" (le texte de la carte). Clé = id de la carte.
const FICHES = {
  "t-classique": {
    creation: "Simplement @Thomas, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Chauve, petit, perfectionniste… oui, c'est bien la version classique de Thomas.",
  },
  "t-voyageur": {
    creation:
      "@Thomas en short et t-shirt, sac à dos style Peak Design Travel, bob sur la tête. Il marche à Tokyo dans de petites ruelles, avec quelques Japonais qui passent.",
    description: "Voyage au Japon en 2024-2026. Comme d'habitude, il lui arrivera des situations improbables.",
  },
  "t-etudiant": {
    creation: "@Thomas à son bureau, en train de tracer des kanji, avec un cahier d'exercices Kumon comme référence.",
    description:
      "Il étudie depuis 2019 et reste bloqué au niveau JLPT N5. Un jour, il saura parler et écrire couramment.",
  },
  "nana-diff": {
    creation: "Simplement @Nana, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Nanami, celle qui se plaint tout le temps, celle qui a changé le destin de Thomas.",
  },
  "t-accueil": {
    creation:
      "@Thomas attend @Matthieu devant les « Arrivals », une pancarte « @Matthieu » à la main. L'attente est longue et se lit sur son visage.",
    description: "Un jour, Matthieu descendra de son avion. Un jour, nous serons réunis…",
  },
  "deuxieme-expedition": {
    creation:
      "@Thomas au premier plan, vu de face, sac au dos : il marche vers nous en s'éloignant de @Matthieu pour aller chercher de quoi manger. Derrière lui, @Matthieu est resté assis par terre, à droite de la carte. Le London Eye se dresse à gauche. Une foule de petites silhouettes qui marchent, presque invisibles (opacité 2 %), remplit la scène.",
    description: "Deuxième ravitaillement avant le feu d'artifice ! Espérons que Thomas ne se perde pas…",
  },
  "t-support": {
    creation:
      "Vue de face : @Thomas au bureau avec un casque-micro sur la tête. Ses écrans apparaissent devant lui en transparence (opacité 2 %).",
    description: "10 h 30 – 18 h 30. Il reste des incidents à gérer et des tickets à clôturer.",
  },
  "t-lowpoly": {
    creation: "Simplement @Thomas au design low poly PlayStation 1, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Thomas rétro PlayStation 1. Ce modèle 3D est collector… mais ne vaut rien.",
  },
  "t-perenoel": {
    creation: "@Thomas en costume de Père Noël, un sac de cadeaux sur l'épaule, marche dans la neige le soir.",
    description: "Père Thomas distribue les cadeaux de Noël, même en pleine tempête de neige.",
  },
  "t-bizarre": {
    creation: "Une pose et une référence à l'anime JoJo's Bizarre Adventure.",
    description:
      "Stand : Lucky Corrupted\nCorrompt la chance d'autrui ou la sienne, figée jusqu'au dimanche. Perçoit le temps inconsciemment.",
  },
  "t-gundam": {
    creation:
      "Au premier plan, le bureau de @Thomas avec un tapis de découpe type modélisme. Derrière, @Thomas face à nous galère à monter son Gunpla : la boîte, quelques pièces et la pince coupante sont posées sur le bureau. Il peine à emboîter deux petites pièces.",
    description:
      "Chacun sa bataille. Pour Thomas, ce fut un combat difficile, mais il a réussi à emboîter les deux pièces du Gundam !",
  },
  "t-risitas": {
    creation: "@Thomas reproduit le mème Risitas « Issou », avec l'image originale comme référence.",
    description: "ISSOU",
  },
  "t-stronk": {
    creation: "@Thomas reproduit le mème « Stronk », avec l'image originale comme référence.",
    description: "C'est STRONK !",
  },
  "t-notstronk": {
    creation: "@Thomas reproduit le mème « Not Stronk », avec l'image originale comme référence.",
    description: "C'est pas STRONK !",
  },
  "t-chat": {
    creation: "Tout simplement le chat de @Thomas, avec son lit en fond.",
    description: "Le Nyan Cat de Thomas.",
  },
  "t-bourre": {
    creation:
      "@Thomas court dans la rue pour essayer de ne pas arriver en retard. Fine pluie, temps légèrement gris.",
    description:
      "Mieux vaut bien dormir et arriver en retard que se réveiller tôt et… arriver en avance…",
  },
  mcdeal: {
    creation:
      "Un menu McDeal de chez McDo : petite boisson, petite frite et petit burger emballé, avec le logo M gardé sur le sachet. Fond en dégradé radial bicolore.",
    description: "Un petit menu, un ticket resto et ça repart !",
  },
  "minecraft-sncf": {
    creation:
      "Référence à Minecraft : un chemin de fer type SNCF dans une plaine du monde de Minecraft. Au premier plan, un wagonnet qui file vers l'arrière-plan.",
    description: "La MineSNCF n'a aucun retard ! Sauf pour la construction des voies ferrées, peut-être…",
  },
  "t-bouffon": {
    creation:
      "Simplement @Thomas en costume de bouffon, sur un fond sur le thème du cirque, flouté pour mettre en avant le sujet.",
    description: "Parfois, il faut accepter d'être pris pour un bouffon…",
  },
  overwatch: {
    creation:
      "Référence à Overwatch : @Thomas incarne Zenyatta, même pose, mêmes accessoires. En fond, la map « Népal ».",
    description: "Passe dans l'Iris.",
  },
  "t-muscle": {
    creation: "Simplement @Thomas musclé, version Giga Chad, sur un fond en dégradé radial bicolore.",
    description: "Énorme et sec !",
  },
  "t-citron": {
    creation: "@Thomas en citron anthropomorphe, avec une forêt de citronniers en fond.",
    description: "L'origin story de sa présence sur Internet.",
  },
  "t-minis": {
    creation:
      "Plein de petits @Thomas qui travaillent ensemble dans un open space de bureau rempli de verdure.",
    description: "Le consulat des Mini's Thomas.",
  },
  "t-inventeur": {
    creation: "@Thomas dans le rôle d'un inventeur des années 1900, au travail dans son atelier.",
    description: "Prendre les idées, les faire fonctionner et les concrétiser : telle est ma vocation.",
  },
  "t-randonneur": {
    creation:
      "@Thomas en pleine randonnée, en train de gravir une pente assez raide, avec l'horizon vu d'en haut.",
    description: "Je gravirai cette montagne coûte que coûte ! Puis la suivante ! Et après… une petite sieste.",
  },
  "t-parisien": {
    creation: "Simplement @Thomas dans une tenue cliché de Parisien, avec les rues de Paris en fond.",
    description: "Thomas Furansu-jin Desu",
  },
  "m-parisien": {
    creation: "Simplement @Matthieu dans une tenue cliché de Parisien, avec les rues de Paris en fond.",
    description: "Matthieu Furansu-jin Desu",
  },
  "eli-parisienne": {
    creation: "Simplement @Eli dans une tenue cliché de Parisienne, avec les rues de Paris en fond.",
    description: "Eli Furansu-jin Desu",
  },
  "m-coureur": {
    creation: "@Matthieu en pleine course, en tenue de sport, sur le trottoir, de nuit, sous une fine pluie.",
    description: "Mais pourquoi j'ai décidé de courir de nuit sous la pluie ?",
  },
  chaise: {
    creation: "L'emoji 🪑 (version iOS) sur un fond en dégradé radial bicolore.",
    description: "Cette chaise a une signification bien précise. Peu de personnes en connaissent vraiment le sens.",
  },
  stagiaires: {
    creation:
      "Petit @Thomas et petit @Matthieu en costume de travail, cravates légèrement mal nouées, assis sur des chaises dans un bureau devant une pile de documents à traiter. Ils se regardent, désespérés.",
    description:
      "Stagiaires depuis maintenant 10 ans, ils ont peu de chances de retrouver un jour le poste qu'ils occupaient au départ.",
  },
  pspp: {
    creation: "Simplement Paul St-Pierre Plamondon, d'après la référence, sur un fond en dégradé radial bicolore noir et or.",
    description: "L'immigration, c'est NON !",
  },
  takaichi: {
    creation: "Simplement Sanae Takaichi, d'après la référence, sur un fond en dégradé radial bicolore noir et or.",
    description: "L'immigration, c'est NON !",
  },
  "visa-japon": {
    creation: "Un visa de travail japonais sur un fond en dégradé radial bicolore clair.",
    description: "Une relique rare, que peu de gens parviennent à obtenir.",
  },
  "visa-quebec": {
    creation: "Un visa de travail québécois sur un fond en dégradé radial bicolore clair.",
    description: "Une relique rare, que peu de gens parviennent à obtenir.",
  },
  oyster: {
    creation: "Simplement la carte de transport Oyster Card sur un fond en dégradé radial bicolore.",
    description:
      "Cette carte aurait pu valoir bien plus si Thomas avait accepté de payer plus cher pour inclure la zone 1 de Londres…",
  },
  daronned: {
    creation:
      "Deux vieilles mamans japonaises, admiratives et malicieuses, regardent vers la caméra. Fond abstrait d'inspiration japonaise, flouté pour mettre en avant les deux sujets.",
    description: "« Juste un petit café ? » Trois heures plus tard, tu connais toute la famille.",
  },
  "cursed-week": {
    creation:
      "Série « Week » : une même petite rue d'une ville neutre, même cadrage pour les trois cartes. Version maudite : ciel d'orage, teintes violettes et grises. Un chat noir traverse, une échelle est posée contre un mur, un parapluie retourné au-dessus d'une flaque.",
    description: "Tout ce qui peut mal tourner tournera mal. Courage, dimanche arrive.",
  },
  "lucky-week": {
    creation:
      "Série « Week » : la même petite rue d'une ville neutre, même cadrage. Version chanceuse : grand soleil, teintes vertes. Un trèfle à quatre feuilles pousse entre les pavés, un billet traîne par terre, le distributeur donne deux canettes au lieu d'une.",
    description: "Une semaine où tout sourit. Profites-en, ça ne durera que jusqu'à dimanche.",
  },
  "golden-week": {
    creation:
      "Série « Week » : la même petite rue d'une ville neutre, même cadrage. Version ultime : la rue baigne dans une lumière dorée, pluie de pièces d'or et de confettis, tout scintille, un arc-en-ciel traverse le ciel.",
    description: "La chance à son paroxysme : la Golden Week ultime !",
  },
  "sous-3-ans": {
    creation:
      "Un calendrier au premier plan, avec les feuilles des mois précédents qui s'y mêlent, sur un fond en dégradé radial bicolore.",
    description: "C'est la règle ! Toute information ou action sera prise en compte et traitée sous 3 ans.",
  },
  "centre-du-monde": {
    creation:
      "Une représentation de la France vue du ciel, façon planisphère, entourée uniquement d'océan : aucun autre pays ne la touche. On est le centre du monde.",
    description: "Le point originel de l'univers, le centre du monde.",
  },
  commencement: {
    creation:
      "Vue d'un spectateur dans les gradins, pendant un match en référence à Rocket League : la grosse balle sur le terrain, des voitures qui la poursuivent, d'autres propulsées dans les airs comme dans le jeu.",
    description: "C'est ici que Thomas et Matthieu se sont rencontrés, dans l'une de ces voitures.",
  },
  "proton-vpn": {
    creation: "Simplement le logo Proton VPN sur un fond en dégradé radial bicolore aux couleurs du logo.",
    description: "Pour pouvoir voyager à la vitesse de la 5G+.",
  },
  kayak: {
    creation:
      "Reprise de La Grande Vague de Kanagawa d'Hokusai : le kayak, pris dans l'immense vague, est sur le point d'être englouti.",
    description: "N'importe quelle rivière, lac, mer ou océan est traversable en kayak…",
  },
  "compte-renault": {
    creation:
      "Dans un univers à la Seigneur des anneaux, le compte Renault est un concessionnaire (de chevaux) sans pitié, digne des plus grands antagonistes. L'illustration représente ce personnage.",
    description:
      "Sans doute la personne la plus dangereuse de nos contrées. Ses contrats et sa bourse n'ont pas de limites.",
  },
  "fc-papillon": {
    creation:
      "Une nuée de papillons bleus qui volent au-dessus d'une plaine. En fond, de douces collines et un joli ciel.",
    description: "Un groupe d'amis, ou un harem… on ne sait pas vraiment.",
  },
  mkqb: {
    creation:
      "Une table dans un food court de centre commercial français, avec quatre menus fast-food : McDo, KFC, Quick et Burger King.",
    description: "Le concept, c'était d'enchaîner McDo, KFC, Quick et Burger King… ça s'est mal terminé.",
  },
  "pgw-2022": {
    creation:
      "@Thomas et @Matthieu prennent un selfie à la Paris Games Week 2022. Autour d'eux, une foule immense représentée par des silhouettes colorées transparentes (opacité 5 %).",
    description: "Ce qui se passe à la PGW reste à la PGW.",
  },
  "eli-support": {
    creation:
      "@Eli vue de face, à hauteur d'homme, sur un fond de bot lane de League of Legends, avec les attributs de Nami en référence au champion.",
    description: "A : Prison aqueuse\nZ : Flux et reflux\nE : Bénédiction de l'Aquamancienne\nR : Raz-de-marée",
  },
  "eli-camionneuse": {
    creation:
      "@Eli chantonne dans son camion : tout va bien pour elle, elle conduit parfaitement sur l'autoroute. En fond, un autre camion roule sur deux roues en faisant des zigzags.",
    description: "Les hommes sont de meilleurs conducteurs, qu'ils disaient…",
  },
  "eli-cerisier": {
    creation:
      "Référence à Minecraft : @Eli en version cubique, adossée à un arbre sous les cerisiers en fleurs, quelques fleurs au sol et une abeille qui bourdonne non loin, en fond.",
    description: "Il est beau ce biome, il est vraiment joli… oui, apaisant.",
  },
  douilled: {
    creation:
      "En Italie, deux maisons modestes et voisines vues de l'extérieur. @Thomas, version italienne, salue depuis son palier @Matthieu, version italienne lui aussi, qui récupère le courrier dans sa boîte aux lettres.",
    description: "Les douilles nous mèneront tous deux à Rome.",
  },
  "glaciere-picard": {
    creation: "Une glacière Picard, d'après la référence, sur un fond en dégradé radial bicolore.",
    description: "La meilleure façon de transporter des mangas, selon Matthieu.",
  },
  "soiree-film-2": {
    creation:
      "@Matthieu dans son lit, écouteurs sans fil dans les oreilles, regarde une soirée film sur sa tablette. Vu de face, avec l'écran de la tablette en transparence (opacité 4 %) pour qu'on le voie sur la carte.",
    description: "Jujutsu Kaisen, My Hero Academia, Dr. Stone… on peut aussi se refaire les JoJo.",
  },
  "soiree-film-3": {
    creation:
      "@Eli, allongée sur le côté dans son lit, écouteurs sans fil dans les oreilles, regarde une soirée film sur l'écran de son PC fixe, posé sur son bureau à l'autre bout de la pièce. Vue à travers l'écran du PC, en transparence (opacité 4 %), pour qu'on la voie bien sur l'illustration.",
    description: "Scream, Smile… Ah, il y a aussi ce film d'horreur que je veux vous faire voir : They Will Kill You.",
  },
  "lacher-poule": {
    creation:
      "Une poule qui fait office de chien de garde, énervée et prête à en découdre, dans un jardin avec une piscine creusée en fond.",
    description: "Attention ! Je lâche la poule !\nLa poule est libérée !",
  },
  "eli-chasseuse": {
    creation:
      "Référence à Phasmophobia : @Eli dans une chambre sombre, grelottante, un thermomètre à la main. Des effets de froid dessinés en transparence (opacité 5 %).",
    description: "Alors ici, il fait au moins -8 000 les gars !",
  },
  "eli-canotiere": {
    creation:
      "Référence à Sea of Thieves : @Eli seule dans son petit canoë, en tenue civile, révise ses cours (type université moderne). Océan calme, grand soleil.",
    description: "Vous en faites pas, je finis de réviser et je rejoins votre bateau, promis !",
  },
  // ---- Vague 2 ----
  "t-conducteur": {
    creation:
      "@Thomas conduit de nuit avec le pare-brise gelé : la voiture dévie un peu mais évite l'accident. Voiture vue de face, pare-brise gelé en transparence (opacité 10 %) laissant voir @Thomas au volant. Routes bien éclairées, un peu de verglas au sol.",
    description: "Je suis un pilote, je vous dis ! Même avec le pare-brise gelé.",
  },
  "t-petit": {
    creation:
      "@Thomas, de taille normale, vu de dos en forte contre-plongée (intensité 5) : la porte automatique du magasin paraît démesurée. Il la regarde, tête levée, l'air désespéré.",
    description: "Les portes automatiques ne me détectent pas… ça s'ouvre pas !",
  },
  "t-immigration": {
    creation:
      "Vue depuis l'intérieur d'une borne d'enregistrement de l'immigration à l'aéroport. Au premier plan, l'écran de la borne en transparence (opacité 10 %), avec quelques informations en miroir (cohérentes). Derrière, la tête et le buste de @Thomas qui essaie de comprendre le texte en japonais et hésite entre le bouton blanc et le bouton rouge.",
    description: "テロリストですか？\nJe ne comprends pas ce qu'on me demande. Dans le doute, je vais répondre oui.",
  },
  "t-arabe": {
    creation: "Simplement @Thomas, dans un décor et une tenue clichés arabes.",
    description: "Alors non, moi de base je suis pas arabe, je suis berbère !",
  },
  "t-spotteur": {
    creation: "Vue depuis l'observation deck de l'aéroport de Haneda : @Thomas regarde les avions ANA décoller.",
    description: "Lui, c'est un A350-900. On le reconnaît grâce à son nez un peu différent des autres modèles.",
  },
  "m-dest-quebec": {
    creation:
      "@Matthieu à bord d'un avion, en première classe, une hôtesse lui sert du champagne. Les autres passagers sont des silhouettes colorées transparentes (opacité 5 %).",
    description: "Il ne restait plus que ce vol-là, 4 000 $ le billet… mais au moins, j'ai droit au champagne.",
  },
  "m-reparateur": {
    creation:
      "@Matthieu vendeur-réparateur dans une petite boutique de téléphones et tablettes. Il accueille des clients en silhouettes colorées transparentes (opacité 5 %). En fond, un établi avec des pièces détachées de téléphones en cours de réparation.",
    description: "Bienvenue chez KV Mobile ! Que puis-je faire pour vous ?",
  },
  "m-infirmier": {
    creation: "@Matthieu infirmier dans un hôpital, des notes à la main, marche vite dans les couloirs.",
    description: "Prochain patient : il s'est fracturé « le petit frère » en y allant trop fort…",
  },
  "m-belgique": {
    creation:
      "@Matthieu vu en forte contre-plongée (intensité 5), des frites belges en bouche, regarde devant lui en marchant dans un décor belge reconnaissable.",
    description: "Elles sont bonnes ces frites ! Ah, ils sont forts ! Mieux que la poutine.",
  },
  "m-arabe": {
    creation: "Simplement @Matthieu, dans un décor et une tenue clichés arabes.",
    description: "Alors non, moi je suis vraiment pas arabe, je suis allemand-italien, hein !",
  },
  "eli-arabe": {
    creation: "Simplement @Eli, dans un décor et une tenue clichés arabes.",
    description: "Alors non, moi je suis québécoise… et à la limite, colonisée par les Français.",
  },
  "nana-arabe": {
    creation: "Simplement @Nana, dans un décor et une tenue clichés arabes.",
    description: "Alors non, moi je suis japonaise… ce n'est vraiment pas le même continent.",
  },
  "resto-poutine": {
    creation:
      "@Matthieu et @Eli, face à face à la même table, partagent une poutine pour deux. En fond, d'autres tables du restaurant avec des clients en silhouettes colorées transparentes (opacité 5 %).",
    description: "Elle est bonne cette poutine ! Ah, ils sont forts ! Mieux que les frites belges.",
  },
  "date-aquarium": {
    creation:
      "@Matthieu et @Eli à l'océanarium. @Eli cache derrière son dos un cadeau d'anniversaire de la taille d'une boîte de jeu vidéo, pendant que @Matthieu regarde les grandes baies vitrées remplies de poissons. Quelques visiteurs en silhouettes transparentes (opacité 5 %).",
    description: "– Oh, regarde, il est drôle ce poisson !\n– Tu me crois si je te dis que je tiens un poulpe dans les mains ?",
  },
  "worlds-lcs": {
    creation:
      "De nuit, @Matthieu et @Thomas devant The O2 Arena en pleine activité, dégoûtés de ne pas pouvoir entrer. Une foule de silhouettes colorées transparentes (opacité 5 %) se dirige vers l'arena.",
    description: "Bon, on regarde sur Twitch du coup ?",
  },
  "eli-kpop": {
    creation:
      "@Eli chante et danse aux côtés des membres de BLACKPINK (d'après la référence), dans la même tenue qu'elles. On ne voit que la scène, immense et impressionnante.",
    description: "Eli, cinquième membre de BLACKPINK.",
  },
  "trisomie-21": {
    creation: "Simplement cette référence.",
    description: "Trisomie 21, t'es mongole mais on t'aime bien !",
  },
  "green-card": {
    creation: "Un contrat de mariage sur un fond en dégradé radial bicolore.",
    description: "Finalement, la seule bonne façon d'immigrer facilement.",
  },
  // ---- Groupe Matthieu ----
  "m-classique": {
    creation: "Simplement @Matthieu, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Grand, chevelu, négligent… oui, c'est bien la version classique de Matthieu.",
  },
  "m-etudiant": {
    creation: "@Matthieu dans le bus, appuyé contre la fenêtre, en train de réviser un cahier d'anglais niveau CE2.",
    description: "Il est parti étudier au Québec, mais s'efforce de faire échouer son projet.",
  },
  "m-voyageur": {
    creation:
      "@Matthieu en tenue d'hiver et doudoune, marche sur le trottoir dans les grandes rues enneigées du Québec, avec quelques voitures qui passent.",
    description: "Arrivée au Québec en 2025. Comme d'habitude, il va tout faire à la dernière minute.",
  },
  "eli-diff": {
    creation: "Simplement @Eli, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Eli, celle qui étudie et travaille sans relâche, celle qui a changé le destin de Matthieu.",
  },
  "m-boucle": {
    creation:
      "Vue de l'extérieur : on voit @Matthieu à travers le hublot de l'avion, qui enchaîne les circuits d'attente (holds) et ne semble pas décidé à atterrir à Londres.",
    description: "368ᵉ hold. Matthieu espère atterrir avant la fin de l'année.",
  },
  "m-timhortons": {
    creation:
      "Vue de face : @Matthieu galère avec le glaçage des donuts pendant que sa manageuse lui crie dessus pour qu'il aille plus vite.",
    description: "Donuts du matin, et l'autre qui fait le petit chef et qui n'aide pas…",
  },
  "m-lutin": {
    creation:
      "@Matthieu dans un atelier de Noël, en train de préparer les cadeaux. Au premier plan, la tête d'un renne regarde vers la caméra.",
    description:
      "Pendant que le Père Thomas fait sa tournée, le lutin Matthieu emballe les cadeaux… à la dernière minute, évidemment.",
  },
  "m-moufette": {
    creation:
      "Tôt le matin, dehors : une moufette surgit de derrière une poubelle et attaque @Matthieu. Son odeur est visible en transparence (opacité 4 %). @Matthieu choisit la fuite.",
    description: "J'étais sa proie ! C'est moi qui me faisais chasser !",
  },
  "ferry-quebecois": {
    creation:
      "L'intérieur d'un ferry à moitié bondé. Les autres passagers sont des silhouettes colorées transparentes (opacité 5 %), de la même taille que @Matthieu, au premier plan comme à l'arrière-plan. @Matthieu est debout et regarde la rive.",
    description: "Certains vont à l'école en tramway, Matthieu y va en ferry.",
  },
  "minecraft-pouletto": {
    creation:
      "Référence à Minecraft : une usine de poulet cuit en redstone, type KFC, dans une plaine du monde de Minecraft. Au premier plan, un poulet qui fuit la machine.",
    description:
      "Le KFC Pouletto peut produire jusqu'à 1 stack toutes les 10 minutes ! Sauf quand il ne fonctionne plus…",
  },
  cegep: {
    creation: "Vue extérieure du Cégep de Lévis au Québec, d'après la référence.",
    description: "J'arrive pas à me connecter sur mon espace étudiant…",
  },
  "vieille-appart": {
    creation:
      "@Matthieu déménage : on le voit dans son nouvel appartement vide. L'ancienne locataire, grande, blonde et âgée, refuse de lui donner les clés avant minuit. @Matthieu est décidé à les lui prendre, mais @Eli l'en empêche.",
    description: "Tout ça pour 200 $…",
  },
  "chanteuse-nocturne": {
    creation:
      "En pleine nuit, @Matthieu est réveillé dans son lit et fixe le plafond, avec une drôle de tête entre l'écoute attentive et l'énervement. Des bruits suspects se font entendre du côté des voisins.",
    description: "Le mec a fait une pause fraîcheur de 2 minutes, et ils recommencent…",
  },
  "jus-orange": {
    creation: "Une petite bouteille de jus d'orange sans marque apparente, sur un fond en dégradé radial bicolore.",
    description: "L'élément qui contribue le plus au bonheur de Matthieu.",
  },
  "m-capitaine": {
    creation:
      "Référence à Sea of Thieves : @Matthieu, en tenue de capitaine avec son épée accrochée à la hanche, pilote son galion qui part à la dérive.",
    description: "T'en fais pas, on est bientôt arrivés au port !",
  },
  "m-premier": {
    creation:
      "@Matthieu dans l'univers médiéval fantasy de Throne and Liberty, vêtu d'habits de noble de l'époque, une carte en main (intensité 5). Dans le ciel, une énorme baleine passe au-dessus de lui : on voit son ventre.",
    description: "Mais comment on fait pour monter sur son dos ?!",
  },
  "m-exorciste": {
    creation:
      "Référence à Phasmophobia : @Matthieu dans la maison, une croix d'exorciste à la main, verse du sel sur le sol. La maison est sombre, seule la lampe de sa pièce est allumée.",
    description: "Moi, je pense que c'est un poltergeist. Nan mais oui, je crois bien.",
  },
  splatoon: {
    creation:
      "Référence à Splatoon : @Matthieu incarne un personnage armé d'un pistolet à peinture, prêt à reprendre le territoire ennemi.",
    description: "20 kills, aucune mort. Je suis un monstre.",
  },
  "m-tempete": {
    creation: "@Matthieu en petite tempête anthropomorphe, sur un fond de typhon en plein océan.",
    description: "L'origin story de sa présence sur Internet.",
  },
  "m-ingenieur": {
    creation: "@Matthieu dans le rôle d'un ingénieur des années 1900, au travail dans son bureau.",
    description: "Penser et avoir des idées, mais ne jamais les concrétiser : telle est ma vocation.",
  },
  "m-routier": {
    creation:
      "@Matthieu dans son camion, vu de l'intérieur, face à lui. Le camion (et toute l'illustration) est penché à 75°, sur deux roues : il vient d'esquiver un autre camion accidenté sur l'autoroute.",
    description:
      "Punaise, il y a un idiot qui roulait sur la bande d'arrêt d'urgence et qui m'a foncé dessus !",
  },
  "premiere-expedition": {
    creation:
      "@Matthieu au premier plan, vu de face, sac au dos : il marche vers nous en s'éloignant de @Thomas pour aller chercher de quoi manger. Derrière lui, @Thomas est resté assis par terre. Le London Eye en fond. Une foule de petites silhouettes qui marchent, presque invisibles (opacité 2 %), remplit la scène.",
    description: "Premier ravitaillement avant le feu d'artifice ! Espérons que Matthieu ne se perde pas…",
  },
  "m-lowpoly": {
    creation: "Simplement @Matthieu au design low poly PlayStation 1, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Matthieu rétro PlayStation 1. Ce modèle 3D est collector… mais ne vaut rien.",
  },
  "m-bizarre": {
    creation: "Une pose et une référence à l'anime JoJo's Bizarre Adventure.",
    description:
      "Stand : State Shifter\nModifie sans limite tout état physique, mental ou conceptuel, jusqu'au destin. Effets imprévisibles, difficilement réversibles.",
  },
  "m-risitas": {
    creation: "@Matthieu reproduit le mème Risitas « Issou », avec l'image originale comme référence.",
    description: "ISSOU",
  },
  "m-stronk": {
    creation: "@Matthieu reproduit le mème « Stronk », avec l'image originale comme référence.",
    description: "C'est STRONK !",
  },
  "m-notstronk": {
    creation: "@Matthieu reproduit le mème « Not Stronk », avec l'image originale comme référence.",
    description: "C'est pas STRONK !",
  },
  "m-chat": {
    creation:
      "Le chat de @Matthieu endormi sur son bureau. En fond, l'écran de son PC avec une partie de League of Legends, flouté.",
    description: "Le Nyan Cat de Matthieu.",
  },
  "m-bourre": {
    creation:
      "@Matthieu court dans la rue pour essayer de ne pas arriver en retard. Fine pluie, temps légèrement gris.",
    description:
      "Mieux vaut bien dormir et arriver en retard que se réveiller tôt et… arriver en avance…",
  },
  ol: {
    creation:
      "@Matthieu dans les gradins du stade de l'OL à Lyon pendant un match, vu de face (le terrain n'est pas visible). Il soutient son équipe, la scène est pleine d'énergie.",
    description: "Supporter un jour, supporter toujours.",
  },
  "m-jungler": {
    creation:
      "@Matthieu vu de face, à hauteur d'homme, sur un fond de jungle de League of Legends, avec les attributs d'Elise en référence au champion.",
    description:
      "A : Neurotoxine / Morsure venimeuse\nZ : Araignée explosive / Frénésie symbiotique\nE : Cocon / Suspension\nR : Forme arachnéenne",
  },
  "les-noirs": {
    creation:
      "Au premier plan, un échiquier en pleine partie. La caméra est à hauteur d'une pièce, légèrement surélevée pour bien voir le plateau. En arrière-plan, @Matthieu, beaucoup plus grand et un peu flou, pour mettre l'accent sur l'échiquier.",
    description: "Euh… j'ai pas appris d'ouverture, je vais jouer au hasard.",
  },
  "m-bouffon": {
    creation:
      "Simplement @Matthieu en costume de bouffon, sur un fond sur le thème du cirque, flouté pour mettre en avant le sujet.",
    description: "Parfois, il faut accepter d'être pris pour un bouffon…",
  },
  "m-muscle": {
    creation: "Simplement @Matthieu musclé, version Giga Chad, sur un fond en dégradé radial bicolore.",
    description: "Énorme et sec !",
  },
  "m-minis": {
    creation:
      "Plein de petits @Matthieu qui travaillent ensemble dans un open space de bureau rempli de verdure.",
    description: "Le consulat des Mini's Matthieu.",
  },
  "patate-mcdo": {
    creation:
      "La patate McDo de chez McDo Québec, qui dépasse de son petit sachet dédié, avec le logo M gardé sur le sachet. Fond en dégradé radial bicolore.",
    description: "Une patate McDo et ça démarre !",
  },
  "metro-japonais": {
    creation:
      "L'intérieur d'un métro japonais à moitié bondé. Les autres passagers sont des silhouettes colorées transparentes (opacité 5 %), de la même taille que @Thomas, debout et assises, au premier plan comme à l'arrière-plan. @Thomas est debout et attend le prochain arrêt en regardant les écrans d'annonce au-dessus des portes.",
    description: "Métro, boulot, dodo.",
  },
  losc: {
    creation:
      "@Thomas dans les gradins du stade de Lille pendant un match du LOSC, vu de face (le terrain n'est pas visible). Il soutient son équipe, la scène est pleine d'énergie.",
    description: "Supporter un jour, supporter toujours.",
  },
  "soiree-film-1": {
    creation:
      "@Thomas dans son lit, écouteurs sans fil dans les oreilles, regarde une soirée film sur son téléphone. Vu de face, avec l'écran du téléphone en transparence (opacité 4 %) pour qu'on le voie sur la carte.",
    description: "La saga Harry Potter, la saga The Hobbit… il faudra aussi regarder tous les Star Wars !",
  },
  "t-routier": {
    creation:
      "@Thomas à côté de son camion renversé sur l'autoroute, les mains sur les hanches, dégoûté. Sur la route, on voit les traces de pneus d'un autre camion qui l'a dépassé.",
    description: "La bande d'arrêt d'urgence, c'est ma voie réservée.",
  },
  "t-midlaner": {
    creation:
      "@Thomas vu de face, à hauteur d'homme, sur un fond de lane de League of Legends. Il porte les queues d'Ahri et ses orbes, en référence au champion.",
    description: "A : Orbe d'illusion\nZ : Feux follets\nE : Charme\nR : Ruée spirituelle",
  },
  "les-blancs": {
    creation:
      "Au premier plan, un échiquier en pleine partie. La caméra est à hauteur d'une pièce, légèrement surélevée pour bien voir le plateau. En arrière-plan, @Thomas, beaucoup plus grand et un peu flou, pour mettre l'accent sur l'échiquier.",
    description:
      "d4 : le pion de la dame avance de deux cases.\nFf4 : le fou sort pour contrôler le centre.\ne3 : le pion renforce le centre.\nCf3 : le cavalier se développe.\nc3 : le pion consolide la structure.",
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
      "Scène en extérieur, légèrement surélevée, sur de l'herbe, avec en arrière-plan l'océan calme et l'horizon. Deux peintres doivent peindre un concept en 4 minutes sans préparation : ils se démènent sur leurs chevalets pour gagner le duel. Au premier plan, la silhouette floue de @Thomas (il n'est pas le sujet principal).",
    description: "Finalement, le Fuderock, c'est pas si mal !",
  },
  "gateau-anniv": {
    creation: "Simplement une part de gâteau d'anniversaire, d'après la référence, sur un fond en dégradé radial bicolore.",
    description: "Joyeux anniversaire Thomas !",
  },
  "t-moussaillon": {
    creation:
      "Référence à Sea of Thieves : @Thomas sur son galion en tenue de moussaillon, un seau à la main. Sans trop savoir pourquoi, il porte aussi un léger maquillage rose.",
    description: "On est en train de prendre l'eau ! On prend l'eau !",
  },
  "t-lancier": {
    creation:
      "@Thomas dans un univers médiéval fantasy, en référence à Throne and Liberty, vêtu d'habits de noble de l'époque, une lance à la main.",
    description: "Le prochain event est à 16 h 09, on le fait ?",
  },
  "t-trouillard": {
    creation:
      "Référence à Phasmophobia : @Thomas au fond du camion, vu de face, lampe torche en main, terrifié à l'idée d'en sortir. Au premier plan, les portes ouvertes du camion.",
    description: "Nan mais allez-y, vous ! Moi, je surveille votre rythme cardiaque !",
  },
  // ---- Vague 2 (suite) ----
  "cafe-glace-mcdo": {
    creation: "Un café glacé McDo sur un fond en dégradé radial bicolore.",
    description: "L'élément qui contribue le plus au bonheur d'Eli.",
  },
  "micro-ondes-pizza": {
    creation: "Un micro-ondes ouvert dans une cuisine peu détaillée, avec une pizza à l'intérieur.",
    description: "Seuls les fous font cuire leur pizza au micro-ondes. Méfiez-vous d'eux.",
  },
  "ubigi-esim": {
    creation: "Un téléphone affichant l'app Ubigi, d'après la référence jointe, sur un fond en dégradé radial bicolore.",
    description: "Restez connecté en toute circonstance avec Ubigi.",
  },
  "pgw-2023": {
    creation: "@Dorian et @Thomas prennent un selfie au stand Red Bull de la Paris Games Week 2023, chacun une canette de Red Bull à la main. Autour d'eux, une foule immense représentée par des silhouettes colorées transparentes (opacité 5 %).",
    description: "6ᵉ Red Bull gratuit… on attend que le staff change et on y retourne.",
  },
  "c-est-pas-loin": {
    creation: "@Thomas et @Dorian marchent ensemble sur un petit sentier rural, un peu fatigués mais déterminés.",
    description: "Thomas disait : « Le McDo est pas très loin. » On marche depuis 20 minutes.",
  },
  "t-romantique": {
    creation: "@Thomas et @Dorian marchent ensemble sur un sentier rural. @Dorian manque de marcher dans une crotte de chien : tel un gentleman, @Thomas pose la main sur son ventre pour l'arrêter et le sauver de la catastrophe. On sent la passion et l'amour dans la scène.",
    description: "Attention bébou, il y a une merde de chien juste là.",
  },
  "d-romantique": {
    creation: "@Thomas et @Dorian marchent ensemble sur un sentier rural. @Thomas trébuche sur un pavé et manque de tomber, mais @Dorian le rattrape, les mains dans son dos, et le sauve de la catastrophe. On sent la passion et l'amour dans la scène.",
    description: "Attention bébou, ne trébuche pas… même si je serai toujours là pour te rattraper.",
  },
  "d-classique": {
    creation: "Simplement @Dorian, en pose neutre, sur un fond en dégradé radial bicolore.",
    description: "Musclé, imberbe, impulsif… oui, c'est bien la version classique de Dorian.",
  },
  "d-vs-ubigi": {
    creation: "En vacances, devant une villa marocaine, @Dorian s'énerve sur son téléphone : il a perdu son abonnement Ubigi.",
    description: "Ils m'ont retiré mon abonnement ! J'ai payé et j'ai plus de connexion !",
  },
  "d-pas-muscle": {
    creation: "Simplement @Dorian pas musclé, version cliché gringalet (l'inverse du Giga Chad), sur un fond en dégradé radial bicolore.",
    description: "Pas énorme et pas sec…",
  },
  "d-arabe": {
    creation: "Simplement @Dorian, dans un décor et une tenue clichés arabes.",
    description: "Alors non, moi je suis pas arabe, je suis marocain. C'est pas la même chose.",
  },
  "d-bourre": {
    creation: "@Dorian affalé sur un canapé (d'après la référence jointe), profondément endormi.",
    description: "Mieux vaut bien dormir et arriver en retard que se réveiller tôt et… arriver en avance…",
  },
  "d-chamelier": {
    creation: "@Dorian sur un chameau dans le désert marocain, en tenue de chamelier.",
    description: "Dorian a obtenu le permis chameau au Maroc.",
  },
  "d-mer": {
    creation: "Simplement @Dorian à la mer, en caleçon de bain, de l'eau jusqu'aux genoux dans une baïne. Ciel dégagé, plein été, 30 °C.",
    description: "L'eau m'arrive même pas au niveau des genoux !",
  },
  "d-lutoza": {
    creation: "@Dorian en tenue professionnelle, au travail chez Lutosa, en train de contrôler les frites sur les tapis roulants.",
    description: "14 h – 22 h. Il reste des frites à produire !",
  },
  "d-bouffon": {
    creation: "Simplement @Dorian en costume de bouffon, sur un fond sur le thème du cirque, flouté pour mettre en avant le sujet.",
    description: "Parfois, il faut accepter d'être pris pour un bouffon…",
  },
  "d-motard": {
    creation: "Chez le concessionnaire, @Dorian regarde une moto bleue. Très investi, une main sur le guidon sans monter dessus, il inspecte le modèle présenté.",
    description: "Celle-là, c'est la meilleure des A2, mais elle sera limitée sur l'autoroute… ou alors je pars sur une A1 ?",
  },
  "d-viandard": {
    creation: "@Dorian au restaurant, devant une grosse pièce de bœuf qu'il regarde en s'apprêtant à la dévorer.",
    description: "Il n'y a rien de mieux qu'une bonne pièce de viande.",
  },
  "d-parisien": {
    creation: "Simplement @Dorian dans une tenue cliché de Parisien, avec les rues de Paris en fond.",
    description: "Dorian Furansu-jin Desu",
  },
  "d-mma": {
    creation: "@Dorian en plein entraînement de MMA : on sent l'énergie et la concentration de la scène.",
    description: "Je crois que le coach veut nous tuer. C'est sûr, il veut nous assassiner.",
  },
  "t-mer": {
    creation: "Simplement @Thomas à la mer, de l'eau jusqu'au menton dans une baïne, les bras levés pour tenir un petit sac à dos au-dessus de sa tête. Ciel dégagé, plein été, 30 °C.",
    description: "J'ai pas pied ! Dorian, c'est la merde, j'ai pas pied !",
  },
  "t-motard": {
    creation: "Chez le concessionnaire, @Thomas regarde une moto noire. Très investi, accroupi devant, il inspecte le modèle présenté.",
    description: "Une A2, ça coûte moins cher pour le permis et la moto, puis l'assurance nous fera un peu plus confiance…",
  },
  "m-yoga": {
    creation: "@Matthieu, en t-shirt blanc et short, fait du yoga au milieu d'autres participants en silhouettes colorées transparentes (opacité 5 %). Dans une posture assez spéciale (dos vers le haut, bras tendus, mains au sol), il a du mal à placer ses pieds… et un chat lui est monté sur le dos.",
    description: "Non mais je suis pas un arbre à chat !",
  },
  "m-caca-chien": {
    creation: "@Matthieu marche dans la rue et évite de justesse une crotte de chien.",
    description: "Non mais ils savent pas ramasser les merdes de leurs chiens ?!",
  },
  "eli-bouffonne": {
    creation: "Simplement @Eli en costume de bouffonne, sur un fond sur le thème du cirque, flouté pour mettre en avant le sujet.",
    description: "Parfois, il faut accepter d'être prise pour une bouffonne…",
  },
  "eli-traitresse": {
    creation: "Référence à Minecraft : @Eli, en version cubique, dépose des diamants dans un coffre… qui est en réalité la façade d'un système de redstone qui jette les objets dans la lave.",
    description: "Mais je ne savais pas que c'était une poubelle ! Mettez un panneau « Ceci est une poubelle » !",
  },
  "eli-bilingue": {
    creation: "@Eli, en tenue cliché anglaise de Londres, parle anglais avec éloquence, avec les rues de Londres en fond.",
    description: "You know, English isn't hard to learn. It's actually a really simple language!",
  },
  "statue-thomas": {
    creation:
      "Une statue en pierre taillée à l'effigie de @Thomas, en pose héroïque sur un socle gravé à son nom. En fond, un village médiéval fantasy flouté pour mettre la statue en valeur.",
    description: "Ici se dresse Thomas. Son nom résonne encore dans chaque taverne du royaume.",
  },
  "statue-matthieu": {
    creation:
      "Une statue en pierre taillée à l'effigie de @Matthieu, en pose héroïque sur un socle gravé à son nom. En fond, un village médiéval fantasy flouté pour mettre la statue en valeur.",
    description: "En l'honneur de Matthieu, dont le courage fit trembler les montagnes et taire les légendes.",
  },
  "statue-eli": {
    creation:
      "Une statue en pierre taillée à l'effigie de @Eli, en pose héroïque sur un socle gravé à son nom. En fond, un village médiéval fantasy flouté pour mettre la statue en valeur.",
    description: "À Eli, lumière des temps sombres. Que nul n'oublie jamais son nom.",
  },
  "statue-dorian": {
    creation:
      "Une statue en pierre taillée à l'effigie de @Dorian, en pose héroïque sur un socle gravé à son nom. En fond, un village médiéval fantasy flouté pour mettre la statue en valeur.",
    description: "Gloire à Dorian, qui affronta mille batailles et n'en perdit aucune… sauf une.",
  },
  "statue-nana": {
    creation:
      "Une statue en pierre taillée à l'effigie de @Nana, en pose héroïque sur un socle gravé à son nom. En fond, un village médiéval fantasy flouté pour mettre la statue en valeur.",
    description: "À Nana, gardienne de la cité. Sa légende se raconte encore à la veillée.",
  },
  "t-bizave": {
    creation:
      "@Thomas en costume deux pièces couleur sable, chemise bleu nuit et cravate assortie, sur un fond en dégradé radial bicolore noir et or. Bras croisés, l'air sérieux avec un léger sourire : la vibe d'un dirigeant qui accueille un nouveau contrat.",
    description: "PDG de la BIZAVE Corp.",
  },
  "eli-veilleuse": {
    creation:
      "De nuit, dans le bureau de veille d'une résidence, @Eli est installée dans un fauteuil avec un plaid, téléphone en main, entre une partie de Spam et un épisode de série. L'écran est en transparence (opacité 4 %) pour qu'on la voie bien. Derrière elle, un couloir faiblement éclairé par une veilleuse, avec des portes de chambres entrouvertes.",
    description: "22 h – 6 h. Il reste des enfants à recoucher… et des épisodes à regarder.",
  },
  "nana-office-lady": {
    creation:
      "Vue de face : @Nana en tenue d'office lady japonaise (gilet, jupe, badge) à son bureau, dans un open space aux néons. Une pile de dossiers et des tampons hanko devant elle. Ses collègues sont des silhouettes colorées transparentes (opacité 5 %).",
    description: "9 h – 17 h. Il reste des dossiers à tamponner.",
  },
  "claude-bizave": {
    creation:
      "Claude, personnifié en humain aux traits doux et au regard bienveillant, en costume deux pièces couleur terracotta, chemise crème et cravate assortie au costume, sur un fond en dégradé radial bicolore noir et or. Tablette et agenda à la main, attentif et souriant, l'air de déjà connaître le prochain rendez-vous : la vibe d'un assistant de direction impeccable.",
    description: "Assistant de direction (EA) de la BIZAVE Corp.",
  },
  "chatgpt-bizave": {
    creation:
      "ChatGPT, personnifié en humain aux traits nets et au regard analytique, en costume deux pièces noir, chemise blanche et cravate vert émeraude, sur un fond en dégradé radial bicolore noir et or. Un dossier sous le bras, il consulte sa montre, sûr de lui : la vibe d'un directeur des opérations qui fait tourner la machine.",
    description: "Directeur des opérations (COO) de la BIZAVE Corp.",
  },
  "salvatore-buisson": {
    creation:
      "Souvenir d'enfance : dans un coin d'herbe au pied du mur d'une petite résidence, @Thomas enfant fait le guet devant un buisson, les mains sur les hanches, très fier de son plan. Derrière le buisson, on ne voit dépasser que la tête de son cousin Salvatore, cheveux noirs très courts et très bouclés, l'air à la fois gêné et concentré. À une fenêtre de la résidence, un rideau légèrement entrouvert.",
    description: "Le buisson garde ses secrets. Le cousin, un peu moins.",
  },
  "crotte-buisson": {
    creation:
      "Même coin d'herbe au pied du mur de la petite résidence, mais cette fois la caméra est enfoncée à travers les buissons : quelques branches floues au premier plan donnent l'impression d'y être entré. Au centre, la fameuse crotte, avec un morceau de papier toilette non loin. Aucun personnage.",
    description: "Une crotte derrière les buissons… qui a bien pu laisser ça là ?",
  },
  "m-correspondant": {
    creation:
      "Souvenir d'enfance : @Matthieu enfant, à son bureau, écrit une lettre à son correspondant espagnol, content et très concentré, la langue légèrement tirée. L'écriture sur la lettre est illustrée de façon illisible (simples traits manuscrits). Autour de lui : une enveloppe avec un timbre espagnol, un petit drapeau de l'Espagne et des crayons de couleur.",
    description: "¡Hola amigo! Aujourd'hui, j'ai… euh, comment on dit ça en espagnol ?",
  },
  "ciel-bleu": {
    creation:
      "Référence à la scène culte de GTO : dans une salle de classe, @Thomas et @Matthieu sont adossés contre le mur, sous la fenêtre, et regardent le ciel. Cadrage serré mais les deux bien visibles. À travers la fenêtre, un ciel d'un bleu éclatant avec quelques nuages.",
    description: "Pas la peine de paniquer, tout ça c'est que du provisoire. Putain, le ciel il est d'un bleu !",
  },
  "le-bus": {
    creation:
      "Vue de derrière @Matthieu, légèrement de côté : il court sur le trottoir, bras tendu, au moment précis où le bus démarre pile devant lui. Les portes viennent de se refermer, on voit les feux arrière et un petit nuage de gaz d'échappement. Dans le bus, les passagers sont des silhouettes colorées transparentes (opacité 5 %).",
    description: "Non mais t'y crois ? J'ai encore raté mon bus, il est parti devant moi !",
  },
  "thomafia-parrain": {
    creation:
      "Ambiance « Le Parrain » : dans un bureau sombre aux boiseries, @Thomas en costume trois pièces rayé et chapeau feutre trône dans un grand fauteuil en cuir, un chat sur les genoux, le regard calme et menaçant. Lumière tamisée d'une lampe de bureau.",
    description: "Personne ne refuse une offre de la Tho’ Mafia.",
  },
  "thomafia-consigliere": {
    creation:
      "Même ambiance mafieuse : @Matthieu en costume sombre mal ajusté, cravate de travers, se gratte la tête devant la porte du bureau du Parrain, les mains vides, l'air de réaliser qu'il a oublié quelque chose d'important. Lumière tamisée.",
    description: "Le colis ? Quel colis ?",
  },
  "thomafia-comptable": {
    creation:
      "Même ambiance mafieuse : @Eli en tailleur sombre, lunettes sur le nez, à un bureau couvert de liasses de billets et d'un grand registre de comptes, calculatrice à la main, imperturbable. Lumière tamisée.",
    description: "Les comptes sont propres. Ne posez pas de questions.",
  },
  "thomafia-gros-bras": {
    creation:
      "Même ambiance mafieuse : @Dorian en costume sombre tendu sur ses muscles, bras croisés devant une porte, regard menaçant, dans une ruelle sombre éclairée par un réverbère.",
    description: "Il a regardé le patron de travers.",
  },
  "thomafia-negociatrice": {
    creation:
      "Même ambiance mafieuse : @Nana, assise à une table de négociation, parle encore, très sûre d'elle, face à un homme en costume épuisé, la tête dans les mains, stylo prêt à signer. Lumière tamisée.",
    description: "Au bout de trois heures, ils ont tous signé.",
  },
  "mattyakuza-oyabun": {
    creation:
      "Ambiance yakuza, Tokyo la nuit : dans une salle en tatami éclairée par des lanternes rouges, @Matthieu en kimono sombre est assis en seiza devant un grand parchemin calligraphié, un sabre posé sur son support à côté de lui… mais il pique du nez, à moitié endormi.",
    description: "Réunion du clan reportée : l'Oyabun dort encore.",
  },
  "mattyakuza-anesan": {
    creation:
      "Même ambiance yakuza : @Eli, en kimono élégant aux motifs sombres, debout dans l'encadrement d'une porte coulissante, un éventail à la main et le regard assuré. Lanternes rouges en fond.",
    description: "Le clan obéit à l'Oyabun. L'Oyabun obéit à Ane-san.",
  },
  "mattyakuza-wakagashira": {
    creation:
      "Même ambiance yakuza : dans une ruelle de Kabukichō aux néons, @Thomas en costume noir impeccable et lunettes, un carnet à la main, donne ses ordres avec calme. Il fait tout tourner dans l'ombre.",
    description: "Tout est prêt, Oyabun. Comme d'habitude… sans vous.",
  },
  "mattyakuza-tatoue": {
    creation:
      "Même ambiance yakuza : @Dorian, torse nu et vu de trois quarts dos, le dos entièrement couvert d'un tatouage irezumi, en garde, prêt à se battre, dans une ruelle éclairée par des néons.",
    description: "Il a laissé sa marque. Littéralement.",
  },
  "mattyakuza-informatrice": {
    creation:
      "Même ambiance yakuza : @Nana, dans un petit bar de Tokyo aux néons, téléphone à la main, glisse une enveloppe sur le comptoir avec un sourire en coin.",
    description: "Elle sait tout. Surtout ce qui ne la regarde pas.",
  },
  "t-jetlag": {
    creation:
      "Premier jour au Japon, au stade de Yokohama pour un match des BayStars. @Thomas, en t-shirt et short sous une pluie fine, est bien placé, un peu sur la droite derrière le marbre. Son sac de 30 L est coincé entre ses jambes et le siège de devant. Épuisé, il somnole, les yeux mi-clos : les bords de l'image sont légèrement flous. Dans les escaliers, des vendeuses de bière font des allers-retours, un fût sur le dos.",
    description: "Premier jour au Japon : un match des BayStars, la pluie… et le sommeil qui gagne à chaque manche.",
  },
  "t-cables": {
    creation:
      "Dans l'open space, @Thomas est à quatre pattes sous son bureau, empêtré dans un enchevêtrement de câbles, l'air agacé mais déterminé à tout remettre au propre.",
    description: "Cette fois, c'est la bonne. Comme la dernière fois.",
  },
  "t-ramen": {
    creation:
      "Au Ramen Museum, dans une salle bondée, @Thomas est assis à un comptoir face au mur, coude à coude avec ses voisins. Devant lui, un bol de ramen énorme, recouvert d'un bon centimètre d'huile, avec deux œufs mollets. Il galère visiblement à tout finir.",
    description: "Le bol était plus grand que l'estomac.",
  },
  "t-parapluie": {
    creation:
      "Devant l'entrée d'un konbini sous la pluie, @Thomas au premier plan, légèrement flou. Le point est fait au centre de l'image, sur le porte-parapluies à l'entrée du konbini… où son parapluie n'est plus.",
    description: "Entré avec un parapluie, ressorti sans. Bienvenue au Japon.",
  },
  "t-konbini": {
    creation:
      "Dans un FamilyMart, @Thomas, face au rayon des onigiri, hésite longuement, un onigiri dans chaque main.",
    description: "Thon-mayo ou saumon ? Le dilemme quotidien.",
  },
  "m-pelle-neige": {
    creation:
      "Au Québec, @Matthieu déblaie son bout d'allée à la pelle, au milieu d'énormes couches de neige, en pestant à voix haute.",
    description: "Câlisse de tabarnak, y'en est encore tombé un pied, esti !",
  },
  "m-depanneur": {
    creation:
      "Dans un dépanneur québécois, @Matthieu, face aux rayons, hésite sur quoi prendre, les bras déjà chargés de petites choses.",
    description: "Un p'tit tour au dépanneur, et on repart avec bien plus que prévu.",
  },
  "m-hockey": {
    creation:
      "Diptyque avec « @Eli hockey » : dans les gradins d'un aréna bondé à Québec, pendant un match de hockey, @Matthieu se lève et crie vers la glace. @Eli est coupée au bord droit de l'image, pour que les deux cartes posées côte à côte forment une seule scène.",
    description: "Tabarnak, c'était hors-jeu !",
  },
  "eli-hockey": {
    creation:
      "Diptyque avec « @Matthieu hockey » : dans les gradins d'un aréna bondé à Québec, pendant un match de hockey, @Eli, assise, suit le match avec attention. @Matthieu est coupé au bord gauche de l'image, pour que les deux cartes posées côte à côte forment une seule scène.",
    description: "Il crie sur l'arbitre, je regarde le match.",
  },
  "eli-bons-plats": {
    creation:
      "@Eli cuisine dans son appartement, concentrée sur ses casseroles. En fond, presque hors champ et flou, @Matthieu joue sur le canapé, manette en main (on ne voit pas la télé).",
    description: "Le meilleur restaurant de Québec n'a qu'une table… et une cheffe.",
  },
  "d-motive": {
    creation:
      "Dans un magasin d'équipement moto, @Dorian essaie des casques devant un miroir, très sérieux, à la recherche du bon : il veut l'acheter avant même de passer son permis.",
    description: "Acheter le casque avant le permis : comme ça, impossible de faire demi-tour.",
  },
  "d-souk": {
    creation:
      "Dans un souk marocain bondé, @Dorian tente sa chance auprès d'une jeune Marocaine aux cheveux bruns à hauteur d'épaules, au milieu des étals d'épices et de tissus.",
    description: "Il était venu pour les épices. Il est reparti avec la Marocaine.",
  },
  // ---- Événement Noël (temporaire) ----
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
  "insh-allah-airline": {
    creation:
      "Dans le cockpit d'un avion en train de piquer du nez, @Thomas, en uniforme de pilote, garde un sourire parfaitement serein, les mains sur le manche. À côté de lui, sa copilote Rashida, une femme d'origine arabe aux cheveux mi-longs bouclés, panique complètement. Voyants rouges et alarmes partout.",
    description: "Mesdames et messieurs, nous amorçons notre descente. Inch'Allah, nous atterrirons sans dégâts.",
  },
  "gras-thomas": {
    creation:
      "Simplement @Thomas en version bien en chair, grand sourire satisfait, une assiette bien garnie à la main, sur un fond en dégradé radial bicolore.",
    description: "Thogras commence son régime lundi. Comme tous les lundis.",
  },
  "gras-matthieu": {
    creation:
      "Simplement @Matthieu en version bien en chair, grand sourire satisfait, une assiette bien garnie à la main, sur un fond en dégradé radial bicolore.",
    description: "Gratthieu commence son régime lundi. Comme tous les lundis.",
  },
  "gras-eli": {
    creation:
      "Simplement @Eli en version bien en chair, grand sourire satisfaite, une assiette bien garnie à la main, sur un fond en dégradé radial bicolore.",
    description: "Élidiabète commence son régime lundi. Comme tous les lundis.",
  },
  "gras-dorian": {
    creation:
      "Simplement @Dorian en version bien en chair, grand sourire satisfait, une assiette bien garnie à la main, sur un fond en dégradé radial bicolore.",
    description: "Grorian commence son régime lundi. Comme tous les lundis.",
  },
  "gras-nana": {
    creation:
      "Simplement @Nana en version bien en chair, grand sourire satisfaite, une assiette bien garnie à la main, sur un fond en dégradé radial bicolore.",
    description: "Nangras commence son régime lundi. Comme tous les lundis.",
  },
  "pres-thomas": {
    creation:
      "Déclaration présidentielle à la française : @Thomas, en costume sombre, derrière un pupitre officiel dans un salon doré de l'Élysée, drapeaux français et européen derrière lui, regard solennel face caméra.",
    description: "Tous les câbles de France seront rangés d'ici la fin du mandat. Le japonais devient langue obligatoire à l'école.",
  },
  "pres-matthieu": {
    creation:
      "Déclaration présidentielle à la française : @Matthieu, en costume sombre, cravate un peu de travers, derrière un pupitre officiel dans un salon doré de l'Élysée, drapeaux français et européen derrière lui.",
    description: "Toutes les échéances nationales sont repoussées à la dernière minute. Les bus attendront désormais les citoyens.",
  },
  "pres-dorian": {
    creation:
      "Déclaration présidentielle à la française : @Dorian, en costume sombre tendu sur ses épaules, derrière un pupitre officiel dans un salon doré de l'Élysée, drapeaux français et européen derrière lui, poing fermé sur le pupitre.",
    description: "Une salle de sport dans chaque commune. La pièce de viande devient un droit constitutionnel.",
  },
  "pres-eli": {
    creation:
      "Déclaration officielle à la québécoise : @Eli, en tailleur élégant, derrière un pupitre à l'Assemblée nationale du Québec, drapeaux fleurdelisés derrière elle, regard assuré face caméra.",
    description: "Chaque citoyen a droit à une soirée série par soir. Plus aucun paiement de billet de concert ne sera refusé.",
  },
  "pres-nana": {
    creation:
      "Déclaration officielle à la japonaise : @Nana, en tailleur sombre, derrière un pupitre officiel, drapeau japonais derrière elle, s'incline légèrement face aux journalistes.",
    description: "Chaque citoyen a droit à une plainte officielle par jour. Toutes les réunions finiront à 17 h pile.",
  },
  "m-zelda": {
    creation:
      "Référence à The Legend of Zelda : @Matthieu en princesse Zelda, robe royale et diadème, dans un château d'Hyrule, attend tranquillement d'être secouru.",
    description: "Le rôle de celle qui attend sagement d'être sauvée ? Matthieu l'a pris sans hésiter.",
  },
  "eli-link": {
    creation:
      "Référence à The Legend of Zelda : @Eli en Link, tunique verte, épée et bouclier à la main, prête à partir à l'aventure dans les plaines d'Hyrule.",
    description: "Les monstres, les énigmes, le sauvetage : comme toujours, c'est Eli qui fait tout.",
  },
  "eli-paiement": {
    creation:
      "Vue de dos, depuis derrière l'écran du PC (on ne voit pas l'écran) : @Eli, de face, assise à une table, galère à réserver des billets de concert, carte bancaire à la main, l'air dépité.",
    description: "Comment ça, paiement refusé ? Tu m'as débitée et remboursée ! Garde l'argent, non ?",
  },
  "eli-pigeons": {
    creation:
      "À Paris, sur une place, @Eli, les bras à moitié tendus, est entourée de pigeons, dont plusieurs se sont posés sur ses bras.",
    description: "Les Parisiens les fuient. Eli, elle, les adopte.",
  },
  "eli-chat": {
    creation:
      "Tout simplement le chat d'@Eli, d'après l'image de référence.",
    description: "Le Nyan Cat d'Eli.",
  },
  "eli-perd-tout": {
    creation:
      "Dans un salon, @Eli, vue de dos, cherche à quatre pattes sous le canapé. Au premier plan, sur un meuble, sa carte de bus est posée bien en évidence.",
    description: "Eli perd toujours tout… mais ce n'est jamais bien loin.",
  },
  "eli-supporter": {
    creation:
      "@Eli dans les gradins du stade de l'OL à Lyon pendant un match, vue de face (le terrain n'est pas visible). Elle soutient son équipe, la scène est pleine d'énergie.",
    description: "Supporter un jour, supporter toujours.",
  },
  "m-photographe": {
    creation:
      "@Matthieu, un appareil photo type Lumix devant l'œil, est en train de photographier @Eli, hors champ. On ne voit que lui, concentré, un genou au sol pour trouver le bon angle.",
    description: "Bouge pas… encore une. Bon, une dernière.",
  },
  "sel-chambre": {
    creation:
      "Sur le bureau de la chambre de @Matthieu, au milieu du désordre, une salière de sel de table, posée là depuis très, très longtemps.",
    description: "Il ne sert à rien. Mais il est là. Depuis toujours.",
  },
  "la-bresilienne": {
    creation:
      "Sur une plage de Rio, deux jeunes femmes brésiliennes en couple se taquinent en riant, très complices, dans leur bulle.",
    description: "Thomas a tenté sa chance. Il n'en avait aucune.",
  },
  "t-import": {
    creation:
      "@Thomas, devant la porte de chez lui, tient un tout petit colis venu du Japon et regarde, dépité, la facture qui l'accompagne.",
    description: "Colis : 25 €. Livraison : 70 €. Douane : 50 €. Le bonheur n'a pas de prix.",
  },
  "le-douanier": {
    creation:
      "Point de vue d'un douanier à son bureau : le petit colis venu du Japon devant lui, tampon dans une main, il colle une étiquette de taxe supplémentaire avec un sourire malicieux.",
    description: "Encore un colis du Japon ? Allez, une petite taxe pour la route.",
  },
  "nana-bouffonne": {
    creation:
      "Simplement @Nana en costume de bouffonne, sur un fond sur le thème du cirque, flouté pour mettre en avant le sujet.",
    description: "Parfois, il faut accepter d'être prise pour une bouffonne…",
  },
  "nana-modele": {
    creation:
      "Dans un atelier de peinture lumineux, @Nana, élégamment habillée, pose immobile sur une petite estrade. Autour d'elle, plusieurs peintres travaillent derrière leurs chevalets, et chaque toile la représente dans un style différent.",
    description: "Immobile pendant des heures… mais au moins, elle est sur toutes les toiles.",
  },
  "village-hors-du-temps": {
    creation:
      "@Thomas et @Matthieu, en tenues modernes, se promènent dans les ruelles pavées de Pérouges, petite cité médiévale aux maisons de pierre, comme deux voyageurs tombés d'une autre époque.",
    description: "Non loin de Torcieu se cache un petit village médiéval, resté hors du temps moderne.",
  },
  "nana-bourre": {
    creation:
      "Heure de pointe du matin dans une station de métro de Tokyo : @Nana, sur le quai, est bloquée derrière une foule compacte de voyageurs pendant que les portes du métro se referment devant elle. Les autres voyageurs sont des silhouettes colorées transparentes (opacité 5 %).",
    description: "Mieux vaut partir à la dernière minute et rater son métro que partir en avance et… le rater quand même…",
  },
  "t-mangaka": {
    creation:
      "@Thomas dans son petit atelier-bureau de mangaka, penché sur une planche en cours, plume à encre à la main. Autour de lui : encre de Chine, feuilles de trames, règles, gomme et pinceaux, quelques planches terminées accrochées au mur. Concentré, sous la lumière d'une lampe de bureau.",
    description: "Yaku-apa\nPlanche 24 : le clan yakuza encercle la cuisine de l'appart. Armés d'un rice cooker et de baguettes, les quatre étudiants étrangers ripostent.",
  },
  "nana-pause": {
    creation:
      "Dans une cabine de toilettes de bureau, @Nana, en tenue d'office lady, est assise sur le couvercle fermé, complètement affalée : dos contre le mur, bras ballants, jambes étendues n'importe comment, la tête en arrière, elle souffle un grand coup. Pose comique d'épuisement, toujours entièrement habillée.",
    description: "Cinq minutes de pause. Les seules de la journée où personne ne lui demande rien.",
  },
  "nana-tanuki": {
    creation:
      "Dans une rue de Tokyo, @Nana, interloquée, s'est figée sur le trottoir. Juste devant elle, presque à la frôler, une petite femme au visage rond de tanuki, jambes nues et bottes bon marché, laisse tomber sa cigarette et l'écrase nonchalamment du bout de la botte avant de repartir sans un regard. Gros plan sur la botte et le mégot, @Nana médusée en arrière-plan.",
    description: "Elle a écrasé sa clope pile devant moi et elle est partie… c'est une déclaration de guerre ???",
  },
};

/* ============================================================ */

// Cartes dont l'illustration est terminée (id)
const ILLUSTREES = new Set([
  "altimance", "bataille-peintre", "m-chat", "t-chat", "mamushi-chan", "deuxieme-expedition",
  "gateau-anniv", "green-card", "les-blancs", "losc", "m-bouffon", "m-classique", "m-lowpoly",
  "m-muscle", "m-notstronk", "m-risitas", "m-stronk", "m-tempete", "mcdeal", "metro-japonais",
  "minecraft-sncf", "m-minis", "t-minis", "nana-diff", "overwatch", "patate-mcdo",
  "premiere-expedition", "soiree-film-1", "splatoon", "t-accueil", "t-bizarre", "t-bouffon",
  "t-routier", "t-citron", "t-classique", "t-etudiant", "t-bourre", "t-lancier", "t-lowpoly",
  "t-midlaner", "t-moussaillon", "t-muscle", "t-notstronk", "t-perenoel", "t-risitas", "t-stronk",
  "t-support", "t-trouillard", "t-voyageur", "t-gundam", "trisomie-21",
  "t-inventeur", "t-randonneur", "t-parisien",
  "m-bizarre", "eli-diff", "m-moufette", "m-bourre",
  "chanteuse-nocturne", "m-capitaine", "m-timhortons", "m-etudiant", "m-boucle", "cegep",
  "m-voyageur", "m-lutin", "ferry-quebecois", "ol", "minecraft-pouletto", "m-routier", "m-jungler", "les-noirs", "vieille-appart", "jus-orange", "m-premier", "m-exorciste", "m-ingenieur", "m-parisien",
  "m-coureur", "oyster", "daronned", "visa-japon", "visa-quebec", "sous-3-ans", "cursed-week", "lucky-week", "golden-week", "chaise", "takaichi", "pspp", "centre-du-monde", "commencement", "douilled", "proton-vpn", "kayak", "compte-renault", "fc-papillon", "mkqb", "pgw-2022", "eli-support", "eli-camionneuse", "eli-cerisier", "eli-chasseuse", "eli-canotiere", "eli-parisienne", "glaciere-picard", "soiree-film-2", "soiree-film-3", "stagiaires", "lacher-poule",
  "t-conducteur", "t-petit", "t-immigration", "t-arabe", "t-spotteur", "m-dest-quebec", "m-reparateur", "m-infirmier", "m-belgique", "m-arabe", "eli-arabe", "resto-poutine", "date-aquarium", "worlds-lcs", "eli-kpop",
  "nana-arabe", "cafe-glace-mcdo", "micro-ondes-pizza", "ubigi-esim", "pgw-2023", "c-est-pas-loin", "t-romantique", "d-romantique", "d-classique", "d-vs-ubigi", "d-pas-muscle", "d-arabe", "d-bourre", "d-chamelier", "d-mer", "d-lutoza", "d-bouffon", "d-motard", "d-viandard", "d-parisien", "d-mma", "t-mer", "t-motard", "m-yoga", "m-caca-chien", "eli-bouffonne", "eli-traitresse", "eli-bilingue",
  "statue-thomas", "statue-matthieu", "statue-eli", "statue-dorian", "statue-nana",
  "t-bizave",
  "eli-veilleuse", "nana-office-lady", "claude-bizave", "chatgpt-bizave", "salvatore-buisson", "crotte-buisson", "m-correspondant",
  "ciel-bleu", "le-bus", "thomafia-parrain", "thomafia-consigliere", "thomafia-comptable", "thomafia-gros-bras", "thomafia-negociatrice",
  "mattyakuza-oyabun", "mattyakuza-anesan", "mattyakuza-wakagashira", "mattyakuza-tatoue", "mattyakuza-informatrice",
  "t-jetlag", "t-cables", "t-ramen", "t-parapluie", "t-konbini", "m-pelle-neige", "m-depanneur", "m-hockey", "eli-hockey", "eli-bons-plats", "d-motive", "d-souk",
  "noel-c1", "noel-c2", "noel-c3", "noel-c4", "noel-pc1", "noel-pc2", "noel-pc3", "noel-pc4", "noel-r1", "noel-r2", "noel-r3", "noel-r4", "noel-e1", "noel-e2", "noel-e3", "noel-e4", "noel-l1", "noel-l2", "noel-l3", "noel-l4", "noel-merry-wifemas",
  "insh-allah-airline", "gras-thomas", "gras-matthieu", "gras-eli", "gras-dorian", "gras-nana", "pres-thomas", "pres-matthieu", "pres-dorian", "pres-eli", "pres-nana", "m-zelda", "eli-link", "eli-paiement", "eli-pigeons", "eli-chat", "eli-perd-tout", "eli-supporter", "m-photographe", "sel-chambre", "la-bresilienne", "t-import", "le-douanier", "nana-bouffonne", "nana-modele", "village-hors-du-temps", "nana-bourre",
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
