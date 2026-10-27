# Historique des versions

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
