# Historique des versions

## bizave-tcg.v1.3.1 — 31 octobre 2026

- Nouvelle illustration de Soirée film #3 et retrait des scores des deux cartes Bizarre Aventure.
- Illustrations fixes à 100 %, inclinaison et reflets conservés. Full Art : titre compact en bas, pictogrammes remontés, encarts clairs à 65 %, flou à 2 px, liserés à 2 px et typographie des Classiques.
- Options compactes avec sélecteur personnalisé ; couverture des piles au choix, mémorisée localement.
- Retrait d’un favori : aperçu conservé, filtre actualisé à la fermeture et suppression de la réouverture involontaire.
- Dix cadeaux combinant chacun deux boosters Memory Frame et 100 fragments. Mise à jour 3 et note fournie par le propriétaire.
- Laboratoire `/test` conservé uniquement en local, exclu de Git et de Firebase.

Note de publication : [bizave-tcg.v1.3.1](docs/releases/bizave-tcg.v1.3.1.md).

## bizave-tcg.v1.3.0 — 29 octobre 2026

- Recharge du stock gratuit portée à un booster toutes les 15 minutes ; cadrage des illustrations aligné en haut via le paramètre existant, en Classique et Full Art.
- Dix nouveaux codes cadeaux donnant chacun deux boosters epico stellari ; seuls leurs empreintes et récompenses sont publiés.
- Anima Isekai accessible au stock gratuit commun ; ajout de quatre cartes Chainsaw Man et de 40 illustrations WebP, pour 59 cartes illustrées dans le booster et 185 modèles au total.
- epico stellari en boutique à 700 fragments : cinq cartes, 91 % épiques et 9 % légendaires, pool dynamique de 42 modèles actuels. Trois profils de taux configurables par booster ; panneaux adaptés au paquet sélectionné, sans changer les taux par défaut.
- Favoris par variante dans Collection ; filtre étoile, transfert de sauvegarde et suppression du favori à la perte du dernier exemplaire. Favoris protégés dans l’Atelier.
- Atelier : trois filtres partagés avec Collection, choix Classique / Full Art et mode Toutes vos cartes pour recycler en lot les dernières copies non favorites.
- Réception : vue détaillée de la carte et confirmation de réussite. Libellé Mate et compteurs de boosters harmonisés.
- Page dédiée de mise à jour, vérifiée uniquement au chargement, confirmation dans localStorage.updated et interrupteur de test dans les options de développement.
- Stockage allégé : suppression des ouvertures terminées et du journal détaillé des recyclages ; les nouveaux tirages jamais échangés sont entièrement supprimés au recyclage. Les cartes ayant circulé gardent seulement leur identifiant bloqué.
- Issue #1 : base canonique unique bizave-tcg, migration vérifiée depuis bizave-tcg-v2, table version et patch temporaire isolé. Schéma 9, imports des schémas 5 à 8 conservés.
- Suppression de roadmap.md et documentation actualisée.

Note de publication : [bizave-tcg.v1.3.0](docs/releases/bizave-tcg.v1.3.0.md). Les sections suivantes sont historiques.

## Ajustements de l’interface — 28 octobre 2026

- Fiche d’une carte : boutons Envoyer et Recycler encadrés, de même hauteur, alignés sur une ligne et répartis à parts égales. Le libellé et les fragments restent sur une ligne sur téléphone.
- Confirmation du recyclage : Annuler sur un tiers de la largeur et Recycler sur deux tiers, sur une même ligne.
- Codes cadeaux : aide, récompense et erreur dans le même texte sous le champ ; limite de 16 caractères utiles avec trois tirets facultatifs. Les espaces sont ignorés au clavier et retirés au collage avant d’appliquer la limite.

## Codes cadeaux — 28 octobre 2026

- Section Code cadeau dans les options, sous Envoi des cartes ; saisie insensible à la casse, aux espaces et aux tirets.
- Catalogue hors ligne de 50 codes sans expiration : 20 cadeaux de 10 Memory Frame, 20 de 10 Anima Isekai et 10 de 500 fragments. Seules les empreintes sont publiées ; les codes restent dans les fichiers d’administration locaux.
- Boosters ajoutés à la réserve achetée sans coût en fragments ni modification de la recharge gratuite.
- Récompense et consommation du code atomiques, y compris entre onglets. Registre transféré et fusionné avec les sauvegardes ; migration IndexedDB vers le schéma 6 sans perte et import du schéma 5 conservé.

## Rendu holographique — 28 octobre 2026

- Rendu des miniatures distinct de la carte agrandie : texture irisée et pailletée partagée, cadre nacré et un seul reflet animé par translation.
- Irisation conservée sans animation ; retrait des filtres, masques et contrôleurs d'inclinaison des miniatures holo. Le détail garde ses effets complets et sa limite de 20°.
- Reflets limités aux cartes visibles et suspendus derrière les dialogues ; affichage différé des piles rattaché à leur propre zone de défilement.
- Tests de collection sur écran haute densité avec 111 cartes et parcours de piles holo. Validation sur l'iPhone concerné encore nécessaire.

## Mise à jour des boosters — 28 octobre 2026

- Phantom Blood devient **Memory Frame** : 16 nouvelles cartes illustrées, soit 126 modèles. L’identifiant technique reste stable pour les stocks et ouvertures existants.
- Nouveau booster **Anima Isekai**, exclusif à la boutique à **50 fragments**, avec 55 cartes et cinq cartes par ouverture.
- Boutique en carrousel partagé avec Vos boosters, dimensions des sachets conservées et bouton d’achat fixe adapté à la sélection. Achat verrouillé pendant le déplacement, avec flèche tournante jusqu’à la stabilisation du paquet et de son offre.
- 35 nouvelles illustrations WebP redimensionnées depuis les PNG originaux ; 36 cartes Anima Isekai avec illustration provisoire. Les 110 anciens modèles et leurs illustrations sont conservés.
- Noms, raretés et descriptions repris des deux carnets ; pools distincts, numéros existants et taux de tirage inchangés. Carnets et manifeste d’import archivés, documentation actualisée.

## bizave-tcg.v1.2.5 — 27 octobre 2026

- Échanges signés FR2/TR2 avec une seule paire de clés transférable ; retrait du chiffrement des cartes.
- Migration de sauvegarde complète par `.btcg`, avec maintien de l’identité et des amis, verrouillage de la source, téléchargement persistant et contrôles atomiques des imports.
- Suppression du compte avec nouveaux ID joueur/appareil, nouvelle clé et remise à zéro complète.
- Options plus discrètes, fenêtres adaptées au mobile, actions alignées en 1/3–2/3 et confirmations insensibles à la casse.
- Retrait du bouton Phantom Blood dans la collection vide et retouche de la description de Les Blancs.
- Documentation et roadmap actualisées ; le transfert est livré, la PWA et le hors ligne restent prévus.
- Rupture avant sortie officielle : nouvelle base locale `bizave-tcg-v2`, sans reprise des anciennes parties de test, des contacts FR1/TR1 ni des anciens fichiers de sauvegarde.

Note de publication complète : [bizave-tcg.v1.2.5](docs/releases/bizave-tcg.v1.2.5.md). Les sections ci-dessous décrivent les états historiques du projet.

## Optimisation du 27 octobre 2026

- 63 illustrations converties en WebP 900 × 1200 qualité 85, URLs versionnées par contenu ; originaux conservés localement, hors Git et publication.
- Préchargement des ouvertures, horloge partagée isolée, échéance de recharge et lectures IndexedDB ciblées ; collection mémoïsée.
- Pages secondaires chargées à la demande, chiffrement séparé du bundle principal et analyse Tailwind limitée au code applicatif.
- Assets orphelins, anciens carnets, code et dépendances inutilisés retirés ; copie et durées factorisées ; CSS consolidé sans changement de rendu.
- Garde-fous assets/conversion et parcours d’échanges actuels automatisés.

## Révision du 26 octobre 2026

- Catalogue Phantom Blood actualisé : six retraits, six nouvelles cartes, noms et descriptions du carnet à jour.
- 49 illustrations ajoutées depuis la V1, sans remplacement des illustrations conservées ; 63 cartes actives illustrées. Fichiers de Soirée Discord #1 supprimés.
- Filtre par booster prêt pour les futures éditions et tri Nom, Ordre, Date, Valeur, avec valeur de recyclage et couverture des piles adaptée.
- Interface allégée : libellé « Par carte & format », retrait du lien Collection dans l’atelier vide, libellés du récapitulatif masqués en conservant leur espace.
- Roadmap PWA/hors ligne et déplacement de sauvegarde sans backend documentée ; ces fonctionnalités restent à concevoir et ne sont pas implémentées.

## 1.0.0 — V1 de Bizave TCG

Première version du projet. Le premier booster **Phantom Blood** est prêt, avec ses **110 cartes** et les formats Classique et Full Art.

- Ouverture des boosters, collection avec recherche, filtres, tri et piles.
- Atelier de recyclage et boutique : Phantom Blood à 70 fragments l’unité.
- Crédits gratuits communs, recharge et réserve des boosters achetés.
- Amis et transferts de cartes signés et chiffrés, par code ou fichier .btcg.
- Thèmes clair, sombre et système ; interface adaptée au mobile et au PC.
- Sauvegarde locale dans le navigateur.

**Illustrations en cours :** de nombreuses cartes restent à illustrer et affichent des placeholders. Cette V1 constitue la base fonctionnelle du jeu ; le travail d’illustration continue.
