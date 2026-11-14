# Détection des nouvelles versions

Chaque build Vite génère un identifiant UUID, inclus dans le JavaScript via __APP_BUILD_ID__, et le publie dans /version.json (schéma 1). Le fichier et le code sont livrés dans le même dist. Cet identifiant est indépendant de UPDATE_VERSION, qui reste le compteur manuel des notes de mise à jour. Comparer des identifiants différents détecte aussi un retour à une ancienne publication.

Le moniteur vérifie au démarrage, toutes les 60 secondes lorsque la page est visible, au retour de visibilité ou de focus, au retour du réseau et lors de pageshow. Les requêtes sont dédupliquées, limitées à huit secondes et faites avec cache: no-store. Les erreurs réseau, réponses HTML et manifestes invalides sont ignorés ; le jeu reste ouvert. Les onglets gelés ne peuvent exécuter du JavaScript qu’à leur réveil.

Un joueur actif reçoit un bandeau avec Actualiser. Au retour après au moins cinq minutes masqué, ou après une restauration de l’historique, une actualisation automatique est tentée seulement sur un écran sûr. Les écrans sûrs sont Boosters, Collection et Changelog, sans dialogue, ouverture/récapitulatif, opération signalée occupée ou saisie active/non vide. Les parcours d’envoi, d’échanges, d’atelier, de boutique et de gestion de sauvegarde restent manuels après retour à un écran sûr. Une ouverture persistée inachevée bloque aussi le bouton Actualiser.

Avant un rechargement, le manifeste et les ouvertures sont relus, puis la visibilité, l’écran et l’absence de nouvelle interaction sont revérifiés. Un changement de version pendant cette vérification actualise le bandeau. Une seule actualisation automatique par build et par onglet est autorisée via sessionStorage ; sans accès à ce stockage, seul le bouton manuel est proposé. Aucune donnée de jeu n’est supprimée.

Firebase applique no-cache aux documents et routes, no-store à /version.json et conserve le cache immutable d’un an pour les assets versionnés. Le cache des illustrations et des polices reste conservé. Ne pas copier des fichiers isolés de dist entre deux builds.

Déploiement initial : les onglets utilisant une version antérieure à ce mécanisme doivent être actualisés une première fois manuellement. Après cette étape, les prochains déploiements sont détectés automatiquement. Le compteur UPDATE_VERSION et la note restent à mettre à jour seulement pour les publications annoncées selon le fonctionnement existant.

Validation : tests unitaires du moniteur (polling, visibilité, absence longue, restauration, déduplication, arrêt, réseau et validation du manifeste), et tests navigateur dans tests/live-updates.spec.ts (bandeau, actualisation manuelle, anti-boucle, ouverture en cours, saisie et perte réseau).

## Passage en version 1.5.0

Au démarrage, la page de fin de bêta s’affiche si IndexedDB contient une sauvegarde antérieure au schéma 12. La lecture se fait avant les migrations. Un nouveau joueur ou une sauvegarde de version 12 entre directement dans le jeu.

La page présente trois variantes de PR-001. Le code cadeau offre un exemplaire au format Classique, finition Alternative. Le joueur peut copier le code et l’utiliser dans **Options → Code cadeau** après la transition. Le bouton d’entrée demande à Firebase de purger le cache HTTP sur les navigateurs compatibles et vide Cache Storage. Une transaction remplace ensuite les données bêta par une sauvegarde neuve au schéma 12. Le manifeste annonce `betaClosed: false` et `appVersion: "1.5.0"`.

## Version 1.5.1 — 12 novembre 2026

Le compteur d’annonce passe à 9. La note présente la nouvelle boutique, la sélection journalière, les nouvelles cartes Memory Frame et le code `Z5YW-2G99-6JR8-CEEH`, qui donne deux Memory Frame. Une ligne vide sépare le texte du code. La version applicative passe à 1.5.1 et le stockage à Dexie 13 sans réinitialiser les parties 1.5.0. Les sauvegardes bêta (schéma ≤ 11) conservent leur parcours de transition ; le nouveau joueur et les parties de schéma ≥ 12 entrent directement en jeu.

## Version 1.6.0 — 14 novembre 2026

Annonce 11 : fiches amis et partage de collection par code CL1. ou fichier .btcg. Le stockage reste au schéma Dexie 13 ; les parties existantes sont conservées. [Note de version](releases/bizave-tcg.v1.6.0.md).
