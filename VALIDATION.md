# Validation — bizave-tcg.v1.6.0

## Publication 1.6.0 — 14 novembre 2026

- Version npm, lockfile, HTML, écran de transition, changelog et landing : **1.6.0**. Annonce **11**, avec la note exacte fournie pour les fiches amis et le partage par code ou fichier .btcg.
- Documentation fonctionnelle et technique actualisée : partage CL1., mode automatique, mémoire locale, préférences d’affichage communes aux amis, méthode d’envoi, filtres événement/promotionnel et points dorés de boutique. **30 documents Markdown**, aucun lien local manquant.
- `npm run check` : ESLint, **355 tests dans 40 fichiers**, TypeScript et build réussis. Schéma Dexie conservé à **13**.
- Contrôle ciblé du build de production en contexte Chromium isolé : conservation d’une partie 1.5.x (carte, fragments et schéma), annonce 11, ajout FR2, génération CL1., réception de la collection de test (200 modèles, 212 variantes, 235 exemplaires), lecture seule, filtres, préférences amies indépendantes et landing mobile. Aucune erreur JavaScript.
- Build **25ac3b5f-809a-4ff9-bd57-0256831fd8f0**, `betaClosed: false`, **513 fichiers**. Aucun fichier .btcg, certificat, clé ou archive dans dist.
- Firebase Hosting publié sur **https://bizave-tcg.web.app** et **https://bizave-tcg.kabomane.me**. Même contrôle ciblé de production réussi sur chaque domaine, dans des profils temporaires sans toucher aux sauvegardes des utilisateurs.
- **27 ressources comparées par SHA-256 sur chaque domaine** : HTML, landing, scripts/styles compilés et manifeste. Identiques au build local ; manifeste servi avec `Cache-Control: no-store`.

## Publication 1.5.2 — 14 novembre 2026

- Version npm, lockfile, HTML, écran de sortie de bêta, changelog et landing : **1.5.2**. Compteur d’annonce **10**, note exacte avec deux retours à la ligne avant le code fourni.
- 77 nouvelles cartes Anima Isekai (220 modèles) et 12 cartes événement permanentes (454 modèles au total). Les 365 anciennes définitions, 363 anciens numéros et illustrations restent inchangés ; 89 nouveaux originaux et WebP vérifiés par empreinte, dimensions et format. Planche de contrôle inspectée.
- Hunger Games et Nouvel An désactivés par défaut ; cartes exclues des boosters et vitrines courants, prix de 30 fragments, une carte permanente par ouverture, raretés 90/10 et finitions/illustrations habituelles. Noël conserve son fonctionnement temporaire.
- Raccourci Boutique dans le menu sur Boosters, lien Boosters ailleurs, vérifié à 390 et 1440 px. Métadonnée HTML color-scheme ajoutée.
- `npm run check` : ESLint, **282 tests dans 33 fichiers**, TypeScript et build réussis. Parcours événements validés sur Chromium et WebKit, avec animation d’une carte, reprise et collection permanente.
- Validation de publication Chromium : 12 parcours (boosters, migration bêta, événements, landing et annonces). Une ambiguïté du sélecteur Anima Isekai a été corrigée et le test relancé avec succès.
- Build de production **faa8e7b7-a1f4-4ece-b690-c087e541ae15** vérifié en contexte isolé : annonce 10 et note exacte, partie 1.5.x préservée, cadeau de deux Anima Isekai, événements masqués, paramètres de développement absents, raccourci et compteurs de landing conformes ; aucune erreur JavaScript.
- Firebase Hosting publié sur **https://bizave-tcg.web.app** et **https://bizave-tcg.kabomane.me**. Les mêmes parcours de production passent sur les deux domaines, sans erreur JavaScript.
- **111 ressources comparées par SHA-256 sur chaque domaine**, dont les 89 nouvelles illustrations, les routes HTML, la landing, les JavaScript/CSS compilés et le manifeste : identiques au build local. `/version.json` est servi avec `Cache-Control: no-store`.

## Publication 1.5.1 — 12 novembre 2026

- Documentation courante relue et corrigée (bonus en carrousel, stock cadeaux, reroll commun, taux en plein écran, suppression du lien Ouvrir le lot, Dexie 13). Les 27 fichiers Markdown parcourus ne contiennent aucun lien local manquant. Les archives et notes historiques restent identifiées comme telles.
- Version npm, lockfile, métadonnée HTML, landing, écran de sortie de bêta et changelog mis à jour en 1.5.1. Compteur d’annonce 9 et note exacte avec une ligne vide avant le code fourni.
- Landing actualisée : 220 Memory Frame, lot journalier remisé, cartes du jour, legenda completa et reroll commun aux deux sélections.
- `npm run check` réussi : ESLint, **274 tests Vitest dans 32 fichiers**, TypeScript et build. **16 parcours Chromium** réussis pour la migration, la landing, les annonces, les achats, le swipe, les bonus, les taux et les renouvellements.
- Build de production vérifié avant publication dans un contexte isolé : migration réelle d’une sauvegarde Dexie 12 vers 13, fragments, crédit gratuit, cartes et réserve préservés ; annonce 9 et code de deux Memory Frame utilisable ; options de développement masquées ; bonus et reroll commun fonctionnels.
- Firebase Hosting déployé sur `bizave-tcg`. Build **8ad6f51f-5990-4ba6-ad4a-eafea865a9be**, version 1.5.1, `betaClosed: false`.
- Contrôles après publication réussis sur **https://bizave-tcg.web.app** et **https://bizave-tcg.kabomane.me** : mêmes parcours isolés de migration, annonce, cadeau, boutique et landing, sans erreur JavaScript.
- **53 ressources comparées par SHA-256 sur chaque domaine** : HTML, routes Boutique/Landing, manifeste, JavaScript et CSS compilés, ressources de landing, purge du cache et 30 nouvelles illustrations. Toutes identiques au build local ; `/version.json` servi avec `Cache-Control: no-store`.


## Import Memory Frame — 12 novembre 2026, intégré en 1.5.1

- 30 nouvelles cartes et illustrations importées depuis le carnet et le ZIP fournis : 18 communes, 11 peu communes et une épique. Memory Frame compte 220 modèles ; catalogue actif de 365 modèles, dont deux promos.
- Les 80 PNG déjà présents sont identiques aux originaux et ignorés. Vérification avant/après : 335 définitions, anciens numéros, 355 illustrations publiées et 335 originaux inchangés (SHA-256 et dates de modification des images). Aucun doublon de Merry Wifemas / PR-002.
- `npm run check` réussi : ESLint, 274 tests dans 32 fichiers, TypeScript et build. Les attentes de taille de pool et de valeur totale du catalogue ont été actualisées ; les taux et prix des boosters restent inchangés.
- Deux parcours Chromium réussis : ouverture gratuite, reprise et collection persistante ; landing avec compteur Memory Frame actualisé. Les 30 nouveaux WebP se décodent dans le navigateur en 900 × 1200 ; grille complète et aperçu détaillé de Thomas mangaka inspectés, recherche et description longue vérifiées.
- Manifestes et correspondances dans `illustrations/imports/2026-11-12/manifest.json`. Captures dans `artifacts/memory-frame-import-2026-11-12.png` et `artifacts/thomas-mangaka-import-2026-11-12.png`.

## Refonte de la boutique — 12 novembre 2026, intégrée en 1.5.1

- `npm run check` réussi : ESLint, **273 tests Vitest dans 32 fichiers**, TypeScript et build de production.
- **40 parcours ciblés validés** sur Chromium (14), Firefox (13) et WebKit (13), avec relance des échecs après correction des attentes de navigation et de persistance des tests. Le swipe CDP est exécuté sur Chromium et ignoré sur les deux autres moteurs.
- Vérifications : lot quotidien et ouverture séparée, cartes achetables une fois, renouvellement à minuit sans perte des cartes, absence de vitrine vide fictive, grille permanente, bonus et reroll, taux standards/hebdomadaires, Noël temporaire, migration de partie et de bêta.
- Moteur : probabilités exactes des catégories et éditions, remises/quantités, dates Paris de 23/25 heures, concurrence entre deux connexions Dexie, annulation transactionnelle, garde de compte exporté, sauvegarde transférée avant/après expiration et reprise d’ouverture.
- Captures plein écran inspectées sur bureau et mobile. Aucun débordement horizontal aux largeurs 320, 390, 768 et 1440 px. Captures dans `artifacts/new-shop-*.png`.
- Archive ZIP précédente vérifiée : 165 entrées, comprenant les sources, fichiers npm et documentation hebdomadaire. Aucun déploiement effectué pour cette refonte.

[Fonctionnement et paramètres provisoires](docs/boutique-journaliere.md).

## Publication 1.5.0 — 11 novembre 2026

- `npm run check` réussi avec 253 tests Vitest dans 30 fichiers, ESLint, TypeScript et build de production. Knip sans signalement.
- Cinq parcours Chromium réussis pour le nouveau joueur, le passage de la bêta, la récompense PR-001 et la landing. Le build compilé a également été vérifié dans Chromium avant déploiement.
- Firebase Hosting publié sur `bizave-tcg`. Manifeste, HTML, landing, ses styles et son script, ressources d’entrée et nouvelle illustration PR-001 identiques au build local `eaa5d6a4-8bb6-432c-8310-c2a75a759032` sur `bizave-tcg.web.app` et `bizave-tcg.kabomane.me`.
- Parcours Chromium réussi sur les deux domaines publiés avec une sauvegarde bêta isolée. Vérifications du nouvel écran, des trois illustrations, de la réinitialisation au clic, du schéma 12, du cache vidé et du retour direct au jeu après rechargement. Aucun défaut JavaScript relevé.
- Landing en 1.5.0 et en-tête HTTP de purge du cache vérifiés sur les deux domaines. Compteur de mise à jour 8.

## Publication 1.4.4

- `npm run check` réussi avec 249 tests Vitest dans 32 fichiers, ESLint, TypeScript et compilation. Six parcours de la landing réussis dans Chromium et WebKit. Contrôles ciblés des cartes, des achats hebdomadaires et des compteurs réussis.
- Firebase Hosting publié sur `bizave-tcg`. Le manifeste, la landing, ses styles et son script, la route boutique et les deux nouvelles illustrations correspondent au build local `29d95db3-d1b4-41fa-8a54-b21cee0b22bb` sur `bizave-tcg.web.app` et `bizave-tcg.kabomane.me`.
- Contrôle Chromium du site publié : thème sombre système, Ciel bleu et Le bus visibles sur la landing, SVG Atelier, taux et nombre de cartes de lucky boost, bonus gratuits, reroll direct et compteur de disponibilité. Changelog 1.4.4 et notification 7 vérifiés. Aucune erreur navigateur.

## Boutique hebdomadaire — 7 novembre 2026

- Version **1.4.3**, compteur **7** et note : « Refonte de la boutique, ajout de la boutique hebdomadaire plus souple sur les taux de drop. »
- La nouvelle boutique est publiée sur la route `/boutique` et incluse dans le build de production ; la route `/test` et l’ancienne page indépendante sont supprimées. Les boosters permanents restent achetables dans leur rubrique.
- Lucky boost vient après les boosters classiques dans Vos boosters. Son bouton Taux de drop reste visible mais désactivé, comme dans la boutique. Les cartes achetées de la vitrine conservent leurs couleurs et sont signalées par le bouton Épuisée.
- `npm run check` réussi : ESLint, 247 tests Vitest dans 32 fichiers, TypeScript et build de production. Typage des tests vérifié avec `tsconfig.tests.json`.
- Dix parcours Chromium vérifiés : achats hebdomadaires et permanents, ouverture/reprise, renouvellement, taux selon la sélection, verrous pendant le mouvement, espacements responsive et swipe tactile natif. Neuf ont réussi ensemble ; le parcours epico stellari, interrompu une fois au clic après une capture, a réussi à la relance isolée. Les autres moteurs et la suite E2E complète n’ont pas été relancés pour cette publication.


- Firebase Hosting publié sur `bizave-tcg`. Manifeste, HTML et ressources d’entrée identiques au build local `ab856eb1-cc13-4195-8ea9-9a55dcd74787` sur les domaines `https://bizave-tcg.web.app` et `https://bizave-tcg.kabomane.me`.
- Contrôle Chromium du site publié : boutique, achat lucky boost, placement après les classiques, taux désactivés puis réactivés sur un autre booster, changelog 1.4.3 et nouvelle note. Continuer mémorise le compteur 7 ; aucune erreur navigateur.

## Ajout de cinq cartes et publication — 6 novembre 2026

- Version **1.4.2**, `UPDATE_VERSION = 6` et note existante inchangées ; aucun changement de schéma ou de taux.
- Cinq cartes du carnet du 5 novembre importées avec leurs descriptions, groupes, raretés et illustrations. Numéros 305 à 309 ajoutés en fin d’ordre ; Memory Frame 166, Anima Isekai 143, epico stellari 55, rarity only 53, catalogue 309 modèles illustrés.
- Les 304 anciennes définitions, leurs numéros, le préfixe du pool Memory Frame et les empreintes SHA-256 des 304 illustrations précédentes sont inchangés. Les cinq PNG locaux correspondent aux sources fournies ; les WebP et leurs empreintes sont consignés dans `illustrations/imports/2026-11-05/manifest.json`.
- `npm run check` réussi : ESLint, 226 tests Vitest dans 29 fichiers, TypeScript et build de production. Totaux du catalogue et valeur globale de recyclage actualisés dans les tests. Configuration ESLint corrigée pour les variables navigateur de `public/landing.js`, auparavant non déclarées.
- Sept parcours Chromium réussis : ouverture et reprise, collection et filtres, responsive, clavier et mouvement réduit, échanges signés avec antirejeu, epico stellari et rarity only. Le test d’échange utilise désormais le dialogue et les métadonnées de l’aperçu actuel, au lieu de l’ancien dialogue « Carte reçue ». Suite E2E complète et autres moteurs non relancés pour cet ajout.
- Rendu des cinq cartes inspecté en Classique et Full Art : dix aperçus mobile 390 × 844 et collection ordinateur, images décodées et descriptions exactes, aucune erreur navigateur. Captures dans `.local/import-2026-11-05/`, hors Git. Dix-huit liens Markdown locaux vérifiés dans les cinq documents concernés.
- Firebase Hosting déployé sur `bizave-tcg`. Build technique `101c8d4e-652f-4981-9dd6-a958f6c6795d`. Onze ressources comparées au build local par SHA-256 sur chacun des domaines `https://bizave-tcg.web.app` et `https://bizave-tcg.kabomane.me` : HTML, manifeste, ressources d’entrée et cinq nouvelles illustrations ; toutes identiques.
- Contrôle Chromium du site publié : compteurs des quatre paquets 166 / 143 / 53 / 55, version 1.4.2, notification 6, catalogue de développement désactivé et aucune erreur d’exécution.

## Publication 1.4.2 — 4 novembre 2026

- Firebase Hosting publié sur https://bizave-tcg.web.app, avec le build validé ci-dessous. Manifeste public identique au build local `5a6da5d3-5fe4-4e1e-9ca1-f2c15909e007`.
- Contrôle Chromium du site publié : version 1.4.2 dans le changelog, croix à droite par défaut, mode Gaucher conservé après rechargement et fermeture à gauche, notification toujours à 6, catalogue de développement désactivé.
- Aucun nouveau test complet relancé pour la publication ; les contrôles locaux ci-dessous restent ceux du code publié.

## Préparation locale 1.4.2 — 4 novembre 2026

- Version du paquet et du lockfile : 1.4.2. `UPDATE_VERSION` reste à 6 ; note inchangée. Aucun déploiement ni push effectué pour cette préparation.
- `npm run check` réussi : lint, TypeScript, 226 tests unitaires dans 29 fichiers et build de production.
- Trois parcours ciblés Chromium réussis : réception de fragments par code depuis Fragments et par fichier depuis Amis, solde exact et antirejeu, navigation Terminé / Mes fragments, persistance Droitier / Gaucher et croix / actions dans les modes deux et quatre actions. Réception depuis Amis vérifiée en mouvement réduit et mode gaucher.
- Captures examinées sur téléphone (390 × 844), tablette (820 × 1180) et ordinateur (1440 × 900), thèmes clair et sombre. Carte contenue dans l’écran et séparée de la barre d’actions. PNG dans `artifacts/fragments-recus-*.png` (hors Git).
- WebKit indisponible sur ce poste : les trois essais échouent au lancement de `Playwright.exe`, avant toute navigation (`exitCode=3236495362`). Aucun résultat Safari réel revendiqué. La suite E2E complète n’a pas été relancée.
- Documentation courante révisée : README, réception / aperçu, sauvegarde, cadeaux, boosters et notes de version. Comptages vérifiés dans les données : 304 modèles, 161 Memory Frame, 52 rares. Liens locaux vérifiés dans les 20 documents README / CHANGELOG / VALIDATION / docs : aucun lien absent. Les audits, notes de versions anciennes et maquettes restent historiques.

## Publication 1.4.1 — 3 novembre 2026

- Version 1.4.1, notification 6 et note du propriétaire.
- npm run check réussi : lint, TypeScript, 225 tests unitaires et build de production.
- Sept tests ciblés de récupération après code ami invalide réussis, dont Safari mobile simulé ; fonctionnement confirmé ensuite par le propriétaire. La suite E2E complète n’a pas été relancée pour cette publication.
- Production vérifiée : notification 6, navigation Fragments et catalogue de développement désactivé.
- Firebase Hosting publié : manifeste public identique au build local 454d2929-bce1-40ec-b6e4-5ee27d5be662.

## Publication 1.4.0 — 2 novembre 2026

- `package.json` et lockfile en 1.4.0 ; notification 5. Note du propriétaire avec une ligne vide avant le code cadeau DEE5-AVCY-8L4W-JL7A, récompense d’un paquet Memory Frame.
- Lint, TypeScript, 209 tests et build de production réussis. Deux parcours de notification et un parcours avec le vrai code cadeau réussis sur Chromium : crédit d’un paquet, deuxième utilisation refusée, stock inchangé.
- Firebase Hosting déployé sur https://bizave-tcg.web.app. Build ID `8d83bde6-7e5f-4460-a5c3-0d935a4df11c`, identique au build local. Vérification navigateur du site publié : notification 4 → 5, note et code visibles, crédit et anti-réutilisation confirmés, options de développement absentes.
- Les sections locales ci-dessous retracent les contrôles effectués avant cette publication ; leurs mentions « Aucun déploiement » se rapportent à ces étapes antérieures.

## Correctif local — illustration du premier partage

- Les images de partage attendent leur décodage et des dimensions valides avant le dessin Canvas. Une erreur retire la ressource du cache ; aucun PNG incomplet n’est proposé.
- Quatre parcours réussis sur Chromium/WebKit : première carte seule et première carte de pile avec décodage export volontairement retardé. Le bouton reste désactivé pendant cette attente ; les pixels du PNG téléchargable confirment la présence de l’illustration.
- Lint, TypeScript, 209 tests et build réussis. Aucun déploiement ; appareil iPhone réel non testé.

## Ajustement local — chargement de l’aperçu et navigation

- Skeleton neutre sans logo, avec balayage animé à la taille de la carte, conservé jusqu’au décodage de l’image et au chargement des polices. Apparition par fondu, sans frames d’attente supplémentaires ; effets désactivés en mouvement réduit. Une image en erreur ne bloque pas la vue.
- Mémoire des illustrations prêtes limitée à la consultation : un passage de miniature à détail, un changement de finition ou le remontage d’une carte distante ne relance pas le placeholder. Les voisines sont chargées sans attendre leur entrée dans l’écran.
- Fond de navigation mobile renforcé de 80 à 94 %, flou réduit de 24 à 8 px dans les deux thèmes.
- Lint, TypeScript, 209 tests métier et build réussis. Décodage retardé, skeleton immédiat et animé, dimensions stables, fin du chargement, focus restitué, image en erreur, mouvement réduit et styles de navigation vérifiés sur Chromium et WebKit. Le parcours des six variantes contrôle chaque frame et les appels de décodage, y compris au retour sur une carte démontée. Glissé tactile natif Chromium également validé après chargement.
- Captures : `artifacts/apercu-placeholder-chromium.png` et `artifacts/navigation-opaque-light-chromium.png`. Aucun déploiement.

## Correctif local — bandeaux des Classiques

- Alignement Canvas normalisé avant les mesures : la signature Story laissait textBaseline à middle, ce qui décalait les titres et la typographie. Le titre est centré selon ses limites de glyphes.
- Titre Fusion rendu une seule fois dans un calque aux dimensions du bandeau ; aucune peinture de dorure ne peut atteindre l’illustration. Le second titre caché de card-info est retiré du composant. Hauteur et interligne des bandeaux affichés uniformisés pour les trois finitions.
- Lint, TypeScript, 209 tests métier et build réussis. Quatre parcours ciblés réussis sur Chromium et WebKit : six exports par moteur (Mate/Holographique/Alternative × Carte/Story), comparaison des pixels avec une carte sans titre, centrage à moins de 1,5 unité CSS et aucune différence sur le haut de l’illustration. Un seul titre vérifié dans les miniatures et l’aperçu.
- Captures dans `artifacts/titre-corrige-*.png` et `artifacts/titres-classiques-*.png`. Aucun déploiement.

## Ajustements locaux — Story, réserve et alignement

- Story passe en PNG 1080 × 1920 avec halos de rareté sur le fond du thème actif. Génération portable sans Canvas filter. Cache sensible au thème résolu ; un changement d’apparence système prégénère le nouveau fichier avant le clic. La carte seule reste transparente.
- Invitation « Toucher pour ouvrir » retirée. Réserve achetée placée dans le compteur « 0 / 5 + n », sans changement de priorité de consommation ni de recharge.
- Piles et cartes seules utilisent les mêmes dimensions de face ; légendes alignées et fragments à droite. Géométrie vérifiée à 320, 390, 820 et 1440 px.
- Lint, TypeScript, 209 tests unitaires/intégration et build réussis. Dix parcours ciblés réussis : quatre Chromium (dont partage natif simulé sans attente avant le geste), trois Firefox et trois WebKit. Vérification des PNG téléchargés, des dimensions, des pixels de fond clair/sombre et du changement de thème système.
- Revue visuelle : `artifacts/collection-alignee-chromium.png`, `artifacts/stock-reserve-chromium.png`, `artifacts/story-halos-light-chromium.png` et `artifacts/story-halos-dark-chromium.png`. Aucun déploiement.

## Ajustements locaux — options, orbes et halos

- Options regroupées en rubriques natives dépliantes : une ouverte à la fois, état des contrôles conservé. En-tête dédié option TCG et ID joueur ; fragments et marque habituelle retrouvés en quittant la page. Contrôlé de 320 à 1440 px.
- Anciennes règles grises des indicateurs retirées : finitions holo/dorées et forme Full Art préservées en mode sombre, seule la carte courante est agrandie.
- Le fond suit le thème clair, sombre ou système. Le radial central a été remplacé à la demande du propriétaire par des halos statiques diffus vers les bords, sans illustration en arrière-plan.
- Lint, TypeScript et 209 tests unitaires/intégration réussis lors de cette refonte. Parcours de sauvegarde, suppression, cadeaux, préférences, catalogue et partage réussis sur Chromium ; nouvelles options et orbes également contrôlés sur Firefox/WebKit.
- Revue visuelle : `artifacts/options-nouveau-mobile.png`, `artifacts/options-nouveau-desktop.png`, `artifacts/halos-dark-mobile.png` et `artifacts/halos-light-desktop.png`.

## Travail local — 2 novembre 2026, aperçu D et partage

- Deux rares importées : Eli veilleuse de nuit et Nana Office Lady. Catalogue 304, Memory Frame 161, Anima Isekai 143, epico stellari 52, rarity only 52. Le manifeste du 2 novembre conserve les dimensions et SHA-256 des originaux et WebP. Les numéros existants sont conservés.
- `npm run check` réussi : lint, 209 tests unitaires/intégration et build de production. `git diff --check` réussi.
- 32 parcours Chromium réussis lors des exécutions ciblées : Collection, filtres, favoris, Atelier, dons, boosters, reprise, récapitulatif, options, miniatures et nouveau visualiseur. Le glissé tactile injecté par CDP change de carte et déclenche pointercancel sans capture du pointeur.
- 12 parcours D réussis sur Firefox et 12 sur WebKit : quatre tailles (390 × 844, 820 × 1180, 1180 × 820, 1440 × 900), deux modes de barre, absence de défilement vertical, flèches centrées, feuilles alignées, focus, doublons séparés, favoris et recyclage jusqu’à pile vide.
- Partage simulé avec activation utilisateur conservée : JPEG Story 1080 × 1920 et PNG Carte 978 × 1620. Téléchargement, six variantes, coins transparents, AbortError silencieux et révocation des URL contrôlés. Réduction des animations vérifiée.
- Revue visuelle des six exports, du Story, de D sur mobile/ordinateur et de l’ouverture. Correctifs vérifiés : miniature vide au retour, suspension des reflets de fond, points de révélation et lisibilité de l’en-tête sur fond flouté.
- Captures : `artifacts/viewer-D-eli-mobile.png`, `artifacts/viewer-D-eli-desktop.png`, `artifacts/share/gallery.png`, `artifacts/share/eli-story.jpg`. Sources et procédure dans `docs/apercu-partage.md`.
- Aucun déploiement ni changement de notification. Le partage natif vers Photos, LINE et Messages reste à valider sur un iPhone réel en HTTPS.

## Publication — 1er novembre 2026, version 1.3.2 et mise à jour 4

- Documents Markdown courants, historique et note de publication revus ; liens locaux valides. Les chiffres actuels sont 302 modèles illustrés, Memory Frame 159, Anima Isekai 143, epico stellari 52 et rarity only 50. Les documents historiques restent datés.
- Lint et 207 tests unitaires/intégration réussis. Le contrôle TypeScript a révélé un paramètre non typé dans le nouveau test cadeau ; il est corrigé et le build final réussit.
- 18 parcours Chromium réussis : ouvertures et reprise, collection et filtres, responsive/clavier, échanges signés, favoris, piles et sorties directes, cadeau groupé, notification et actualisation des builds.
- Build de production contrôlé dans un navigateur vierge : métadonnée 1.3.2, note exacte de mise à jour 4, confirmation, absence de mode dev, crédit persistant d’un exemplaire des quatre boosters et aucune erreur JavaScript.
- Audit : 324 fichiers, 63036787 octets, 85 empreintes de cadeaux et 85 codes privés contrôlés. Seul le code explicitement annoncé dans la note apparaît en clair ; aucun original, certificat, sauvegarde, archive, source de laboratoire ou liste privée n’est publié.
- Build technique : ee70371b-85dd-4fd5-b15a-189f0d609a4b. Le manifeste version.json correspond au code compilé.
- Déploiement Firebase Hosting réussi sur bizave-tcg. Vingt ressources vérifiées par SHA-256 sur les deux domaines : HTML racine et route Collection, manifeste, ressources d’entrée et trois nouvelles illustrations. Toutes correspondent au build local.
- Cache vérifié en production : pages no-cache, version.json no-store et assets immutable. Parcours navigateur réussi sur https://bizave-tcg.web.app et https://bizave-tcg.kabomane.me : version, note, cadeau, persistance et absence d’erreur JS.
- Les premiers onglets sans moniteur doivent être actualisés manuellement une fois. Les tests automatisés ne remplacent pas les vérifications sur un iPhone réel.

## Correctif silencieux — 31 octobre 2026

- Version 1.3.1, compteur 3 et note de mise à jour conservés à l’identique.
- Encarts blancs Full Art à 75 % et flou désactivé dans les miniatures et aperçus, y compris sur les titres alternatifs ; comparaison des styles sur les trois navigateurs validée lors du correctif.
- Nouveau paquet rarity only : 400 fragments, cinq rares garanties, pool dynamique de 40 modèles. Ordre des sélecteurs : Memory Frame, Anima Isekai, rarity only, epico stellari.
- Dix nouveaux codes donnant chacun cinq paquets rarity only ; 80 empreintes au catalogue. Liste en clair uniquement dans le dossier privé local.
- Vérifications avant publication : lint, 195 tests unitaires/intégration et build réussis. Trois parcours Chromium passent : epico stellari, rarity only et cohérence des encarts entre miniatures et aperçus.
- Firebase Hosting publié sans changement de version ni de notification. HTML et ressources d’entrée identiques au build local par SHA-256 sur les deux domaines publics.

## Version 1.3.1 — 31 octobre 2026, mise à jour 3

- `npm run check` réussi : lint, 193 tests unitaires/intégration, TypeScript et build de production.
- Neuf parcours Chromium ciblés validés : retrait des favoris avec et sans pile, favoris existants, cadeaux, concurrence de deux onglets, couverture des piles et persistance, contrôles personnalisés et notification de mise à jour. Le scénario de pile recharge désormais les préférences de préparation avant de commencer, pour éviter une course lors de l’initialisation.
- Build testé dans un navigateur vierge : version 1.3.1, note de mise à jour 3 et confirmation, sélecteur personnalisé, mode dev masqué, cadeau annoncé créditant deux Memory Frame et 100 fragments ; aucune erreur JavaScript.
- Audit du build : 232 fichiers ; aucune page de laboratoire, source originale, configuration privée ou liste de codes. Les 120 entrées des lots privés locaux sont contrôlées ; seul le code explicitement annoncé dans la note de mise à jour est publié en clair.
- `/test` et `.local/vite.config.ts` conservés sur le poste et ignorés par Git. Le middleware du laboratoire reste exclusivement dans cette configuration locale ; Firebase ignore explicitement les dossiers `test`.
- Déploiement Firebase Hosting réussi sur `bizave-tcg`. HTML, ressources d’entrée et nouvelle illustration comparés au build local par SHA-256, identiques sur `https://bizave-tcg.web.app` et `https://bizave-tcg.kabomane.me`.

## Publication — 30 octobre 2026, mise à jour 2

- 32 modèles illustrés ajoutés à Memory Frame : 158 modèles dans ce booster, 217 dans le catalogue complet. Les 185 originaux et 185 WebP précédents restent inchangés, empreintes et dates contrôlées ; 16 images déjà présentes dans l’archive sont ignorées. Les numéros précédents sont préservés.
- Thomas Sakamoto et Nana Sakamoto renommés. Soirée film #3 passe de rare à peu commune avec un correctif de compatibilité temporaire.
- Tri Rareté indépendant des fragments, compteur filtré des exemplaires détenus, `UPDATE_VERSION = 2` et nouvelle note en trois lignes fournie par le propriétaire.
- `npm run check` réussi : lint, 189 tests unitaires/intégration, TypeScript et build. Huit parcours Chromium réussis sur la collection, la migration et la notification de mise à jour.
- Build de production : 232 fichiers, 44 915 210 octets, mode dev désactivé. Audit des 60 empreintes de cadeaux réussi, aucun code en clair, original, archive, certificat ou fichier privé dans `dist/`.
- Firebase Hosting déployé sur `bizave-tcg`. HTML et quatre ressources d’entrée identiques au build local par SHA-256 sur `https://bizave-tcg.web.app` et `https://bizave-tcg.kabomane.me`.
- Parcours du build puis du site publié : note exacte et retours à la ligne, validation de la mise à jour 2, booster à 158 cartes, option Rareté et absence d’Ordre, mode dev absent et aucune erreur JavaScript. Capture locale : `.local/publication-2026-10-30-note.png`.

## Publication — 29 octobre 2026

Publication reprise à la demande du propriétaire : version 1.3.0 déployée sur Firebase Hosting, sources destinées à la branche GitHub main. Aucune suite de tests relancée pour cette publication.

- Build de production reconstruit avec les derniers ajustements : TypeScript et Vite réussis, 200 fichiers et 38 853 807 octets. Les 60 empreintes de cadeaux sont présentes, aucun code en clair ni original privé dans dist.
- Déploiement Hosting réussi sur le projet bizave-tcg. HTML et quatre ressources d’entrée comparés par SHA-256 au build local, identiques sur https://bizave-tcg.web.app et https://bizave-tcg.kabomane.me.

- Ajustements finaux : recharge à 15 minutes, dix cadeaux de deux epico stellari (60 empreintes uniques au total) et cadrage haut sur les 185 modèles. Contrôles ciblés précédents : 22 tests réussis, empreintes et récompenses des dix codes vérifiées ; liste privée ignorée par Git. La suite complète ci-dessous précède ces ajustements ; seul le build a été reconstruit pour publier.
- Version 1.3.0 : package, lockfile, métadonnées HTML, README, changelog et nouvelle note de publication actualisés. Les anciennes notes ci-dessous restent historiques.
- `npm run check` réussi : lint, 183 tests unitaires/intégration, TypeScript et build de production. Après ajustement du test de sélection du booster, lint et TypeScript ciblés restent valides.
- Chromium et Firefox : 45 parcours réussis sur 46. Échec Chromium sur la sélection epico stellari à l’arrivée dans Vos boosters ; le test a été ajusté pour attendre les sélections visibles, mais ce parcours corrigé reste à relancer.
- WebKit : 22 parcours réussis, 1 non applicable, 1 échec par délai de 45 secondes dans le parcours Atelier, en attendant l’option Classique. Migration IndexedDB, nouveaux joueurs, favoris, échanges, cadeaux et mise à jour réussis sur ce moteur.
- La validation croisée Firefox → Chromium → WebKit reste à exécuter ; elle était exclue de la première suite et la commande suivante n’a pas démarré après l’échec WebKit.
- Build statique contrôlé dans un navigateur vierge : version 1.3.0, seule base bizave-tcg avec version 9, options de développement masquées, boutique et taux epico stellari corrects, favoris et page de mise à jour fonctionnels, aucune erreur JavaScript.
- Build : 200 fichiers, 38 843 818 octets ; contrôle de 100 références locales de codes cadeaux en clair, aucune présente dans le build. Aucun original PNG, certificat, archive, document ou fichier de sauvegarde publié dans dist.
- Liens locaux des 13 documents Markdown courants et guides vérifiés, aucun lien manquant.

## Historique : vérification complète pour publication — 28 octobre 2026

- `npm run check` réussi : lint sans avertissement, **146 tests unitaires et d’intégration**, TypeScript et build de production.
- Suite Playwright complète : **46 parcours réussis, 2 ignorés**, sur Chromium, Firefox et WebKit. Les deux exécutions ignorées correspondent au test de compatibilité qui pilote déjà les trois moteurs depuis Chromium.
- Contrôle du build statique dans un navigateur vierge : version **bizave-tcg.v1.2.5**, mode développeur absent, les trois catégories de cadeaux réellement acceptées, refus après réutilisation et rechargement, stocks gratuit et acheté distincts, carrousels et prix des deux boosters corrects.
- Build : **232 fichiers, 29 687 174 octets**. Les 50 empreintes de cadeaux sont présentes ; aucun code en clair, original PNG, certificat, archive, fichier de sauvegarde ou document d’administration n’est publié.
- Documents courants revus : README, guides des boosters, des cadeaux, du rendu et de sauvegarde, roadmap, historique et note française de publication. Liens locaux vérifiés ; schéma courant **6**, import du schéma 5 conservé, aucune restauration ni synchronisation distante.
- Fiche de carte vérifiée sur les trois moteurs à **320, 390, 768 et 1440 px** : Envoyer et Recycler encadrés à parts égales, même hauteur, sans retour à la ligne ni débordement, y compris pour **+115 fragments**. La confirmation garde sa répartition un tiers / deux tiers.
- Origines de production : Firebase Hosting `bizave-tcg` et domaine personnalisé `bizave-tcg.kabomane.me`. Déploiement limité à Hosting, avec `VITE_DEV_CATALOG=false`. Codes privés conservés dans `.local/gift-codes/`, hors Git et du build.
- Déploiement effectué et contrôlé sur les deux domaines : HTML et quatre ressources d’entrée identiques au build local. Le parcours réel sur le domaine personnalisé valide les trois récompenses, leur conservation après rechargement, le refus d’un code déjà utilisé et les deux offres de la boutique, sans erreur de page.

## Codes cadeaux — 28 octobre 2026

- `npm run check` réussi : lint sans avertissement, **146 tests unitaires/intégration**, vérification TypeScript et build statique.
- **12 parcours Playwright réussis** sur Chromium, Firefox et WebKit : cadeaux des deux boosters et de fragments, saisie en minuscules/majuscules, espaces et tirets, code inconnu ou déjà utilisé, rechargement, concurrence entre onglets, transfert et suppression de compte.
- Migration du schéma 5 vers le schéma 6 sans changement des possessions ni des échéances. Le registre des cadeaux suit les transferts `.btcg` et fusionne avec celui du destinataire ; import des fichiers du schéma 5 conservé. Registres manquants, dupliqués et mal formés rejetés pour les fichiers récents.
- Crédit et enregistrement atomiques vérifiés, y compris lors d’une erreur de stockage. Les boosters cadeaux utilisent la réserve achetée sans dépense ni achat fictif et la recharge gratuite reste indépendante.
- Formulaire placé sous Envoi des cartes ; champ et bouton de même hauteur sur une ligne, sans débordement à **320, 390, 768 et 1440 px**. Captures locales `artifacts/codes-cadeaux-<navigateur>.png`.
- Ajustement du formulaire : aide, récompense et erreur partagent le même paragraphe permanent ; saisie limitée à 16 caractères utiles et 19 avec les séparateurs. Les trois parcours ciblés Chromium/Firefox/WebKit, le lint et le build ont été revérifiés avec succès.
- **50 codes privés uniques** vérifiés contre le catalogue public : 20 × 10 Memory Frame, 20 × 10 Anima Isekai et 10 × 500 fragments. Aucune expiration. Codes en clair uniquement dans `.local/gift-codes/`, ignoré par Git.
- Build contrôlé avant publication : **232 fichiers**, les **50 empreintes** présentes et **aucun code cadeau en clair**. Aucun fichier `.btcg`, certificat ou archive privée dans la publication statique.
- README, guide de sauvegarde et guide des codes cadeaux actualisés. Le schéma courant est **6** ; les états antérieurs ci-dessous restent historiques.

## Refonte des miniatures holographiques — 28 octobre 2026

- `npm run check` réussi : lint sans avertissement, **130 tests unitaires/intégration**, TypeScript et build de production.
- Deux présentations explicites : miniatures 2D dans la collection et les piles ; rendu complet pour la carte agrandie et les ouvertures. L'inclinaison détaillée conserve sa limite de **20°**, vérifiée au clavier.
- Les miniatures holo ne montent plus les couches `holo`, `sparkle` et `foil-frame` du rendu détaillé. Aucun filtre, masque CSS de paillettes ou backdrop-filter dans leurs descendants ; un seul reflet animé par translation. La texture et le cadre nacré restent visibles avec la réduction des animations.
- Un seul asset partagé : WebP RGBA sRGB **326 × 540, 65 112 octets**, importé par Vite et versionné au build. Régénération déterministe et idempotente, octets et date de modification conservés. **290 fichiers vérifiés par SHA-256 sans modification** : 145 originaux et 145 illustrations publiées des cartes.
- Les six parcours holo couvrent Chromium, Firefox et WebKit, à une densité d'écran de **3** : texture unique, aperçu statique et animé, détail complet, suspension des reflets derrière les dialogues, puis **111 cartes** et ouvertures répétées de piles Classique/Full Art après défilements lents et rapides. Moins de 24 faces montées dans la collection pendant ces parcours, aucune erreur de page, aucun crash et possessions strictement inchangées.
- Suite globale : **40 parcours actifs validés**, deux exécutions du test de compatibilité ignorées car il pilote déjà les trois moteurs depuis Chromium. Le premier passage comptait 36 réussites et quatre échecs ; `--last-failed` a ensuite validé les quatre cas. Trois contrôles comptaient à tort le module JavaScript `?import` de Vite comme un deuxième téléchargement de texture ; le quatrième est l'écart WebKit décrit ci-dessous.
- Build final : **229 fichiers, 29 671 256 octets**, avec 145 illustrations WebP de cartes et une texture holo supplémentaire. Aucun PNG original, ZIP, certificat ou fichier de sauvegarde publié dans le build. Version maintenue : `bizave-tcg.v1.2.5`.
- Aperçus statiques, animés et réduits inspectés, cadres et gabarits conservés. Guide : [rendu des cartes](docs/rendu-cartes.md). Les serveurs locaux HTTP 5173 et HTTPS 5174 restent actifs.

### Réserve du banc de test WebKit

Un export de sauvegarde a été refusé une fois avec « Clé privée de sauvegarde invalide ». La reproduction isolée avec une clé de test a identifié un comportement du WebKit Windows utilisé par Playwright : le champ privé P-256 `d`, fourni sur 32 octets, peut être réexporté sans ses zéros initiaux (un octet pour la valeur de test 1). Le validateur actuel exige 32 octets. Le nouveau passage du parcours avec une autre identité a réussi. Ce comportement est indépendant du rendu et préexiste à la refonte ; le protocole et le code cryptographique n'ont pas été modifiés dans cette tâche. Il reste à traiter séparément et ne démontre pas le même comportement sur Safari iOS.

Le WebKit automatisé sur PC n'émule ni les quotas mémoire ni les pilotes graphiques de l'iPhone 17 Pro. **La disparition du crash doit encore être confirmée sur l'appareil concerné, avec « Réduire les animations » désactivé.** Aucune publication Firebase ou GitHub effectuée pour cette refonte.

Les sections suivantes conservent les validations réalisées avant cette refonte.

## Mise à jour des boosters — 28 octobre 2026

- `npm run check` réussi : lint, **130 tests unitaires et d’intégration**, TypeScript et build de production.
- **31 parcours actifs validés sur Chromium, Firefox et WebKit**, dont l’achat puis l’ouverture d’Anima Isekai sans consommation du gratuit. Deux exécutions du scénario de compatibilité restent ignorées : son exécution Chromium pilote déjà les trois moteurs. Les contrôles détaillés des deux carnets, des SVG chargés et des filtres sont également passés directement dans les trois navigateurs ; ils complètent les tests unitaires de pools et d’assets.
- Catalogue conforme aux deux carnets : **126 cartes Memory Frame** et **55 cartes Anima Isekai**, avec noms, raretés et descriptions exacts. Les 110 anciens modèles et numéros sont inchangés ; les 71 ajouts sont placés en fin d’ordre.
- Offre Anima Isekai à **50 fragments**, cinq cartes par ouverture, refus du crédit gratuit et des soldes insuffisants, réserve consommée sans nouveau débit et pool exclusif vérifiés. Memory Frame garde le gratuit et son offre à 70 fragments ; son ID technique `phantom-blood` conserve les stocks existants.
- **35 nouveaux PNG** identiques aux octets des archives, convertis uniquement pour les nouvelles cartes : WebP 900 × 1200, sRGB, sans EXIF/ICC/XMP, nom cohérent avec le SHA-256. Les empreintes et dates des **220 fichiers précédents** (110 PNG + 110 WebP) sont inchangées.
- **36 cartes Anima Isekai avec illustration provisoire**, conformément au choix du propriétaire. Les 19 images de son ZIP sont associées ; la divergence `matthieu_uzumaki.png` → `nar-thomas` est consignée dans le manifeste.
- Boutique en carrousel partagé avec Vos boosters, contrôlée de 320 à 1440 px sans débordement : dimensions des sachets identiques, bouton d’achat fixe en position et en taille, prix et disponibilité adaptés à la sélection, navigation par flèches, clavier et défilement. Cartes Memory Frame, Anima Isekai et placeholder inspectés sur mobile ; cadrages Classique des nouvelles illustrations alignés en haut pour conserver les visages.
- Verrou d’achat pendant le mouvement et flèche tournante vérifiés dans Chromium, Firefox et WebKit : deux clics dans la même tâche ne créent aucun achat, le toucher maintient le verrou, les changements rapides au clavier restent bloqués jusqu’à l’alignement, puis seul le paquet affiché est débité au bon prix. Les six scénarios boutique (sécurité du mouvement et parcours complet d’achat/ouverture, dans les trois moteurs) ont été rejoués directement avec les callbacks des tests Playwright. Le bouton conserve aussi sa géométrie pendant l’animation à 320 px.
- Défilement vertical à la molette et geste tactile vertical vérifiés sans désactivation, même transitoire, du bouton d’achat. Le verrou réagit uniquement à une intention ou un déplacement horizontal du carrousel.
- Build : **228 fichiers**, **29 603 798 octets**, dont 145 WebP et 72 SVG provisoires (plus le favicon). Aucun original PNG, ZIP, certificat ou fichier de sauvegarde dans `dist/`. Le mode développeur reste désactivé en production.
- Carnets archivés dans `references/`, associations et empreintes dans [le manifeste du 28 octobre](illustrations/imports/2026-10-28/manifest.json). README, guide des boosters, instructions d’illustration et roadmap actualisés. Version conservée : `bizave-tcg.v1.2.5`.

Validation locale de cette mise à jour. Les sections suivantes décrivent les états historiques du projet.

## Publication du 27 octobre 2026

- `npm run check` réussi : lint, **128 tests unitaires et d’intégration**, TypeScript et build de production.
- `npx playwright test --reporter=line` : **28 parcours réussis**, deux exécutions du test de compatibilité ignorées car il pilote lui-même les trois moteurs depuis son unique exécution Chromium. Les parcours couvrent les échanges signés, les migrations, la suppression, les confirmations en minuscules/majuscules, la collection, les ouvertures, le clavier et le responsive sur Chromium, Firefox et WebKit.
- Migration réelle de l’identité **Firefox → Chromium → WebKit**, puis envoi et retour d’une carte sans refaire le contact.
- Build de production vérifié dans Chromium : métadonnée `bizave-tcg.v1.2.5`, absence du mode dev, collection vide sans bouton Phantom Blood, export/import en minuscules et conservation de l’ID joueur.
- **121 fichiers** statiques, dont **110 WebP versionnés**, pour **22 875 600 octets**. Aucun PNG original, certificat, clé privée ou fichier de sauvegarde n’est inclus dans les ressources publiées. Les identités sont créées localement à l’exécution du jeu.
- Alignement des boutons contrôlé de 320 à 1280 px : Exporter/Importer sur une même ligne ; Retour/Annuler et action principale alignés sur la largeur du champ, de même hauteur et dans un rapport 1/3–2/3.
- README, guide de sauvegarde, guide des boosters, roadmap et note de publication revus. Les rapports d’audit antérieurs sont explicitement historiques.

L’état publié le 27 octobre utilise une seule paire de signature transférable, les formats FR2/TR2 et la base `bizave-tcg-v2` (alors schéma 5). Les anciennes identités et les anciens formats ne sont pas repris. Cible de publication : Firebase Hosting `bizave-tcg`, avec `VITE_DEV_CATALOG=false`. La mise à jour du 28 octobre migre cette même base au schéma 6.


Les sections suivantes sont historiques : leurs chiffres, captures, clés non exportables et descriptions d’échanges chiffrés concernent les versions antérieures. Elles ne décrivent pas le protocole publié dans `bizave-tcg.v1.2.5`.

## Audit optimisation et nettoyage — 27 octobre 2026

- `npm run check` réussi : lint, **113 tests unitaires/intégration**, TypeScript et build de production.
- **168 fichiers** publiables, dont **63 WebP versionnés** et **94 SVG** pour les 47 cartes sans illustration. `dist/` : **13 130 789 octets**, contre 246 267 504 avant audit.
- Conversion 900 × 1200 qualité 85 : originaux préservés par SHA-256, chemins vérifiés, aucune ressource orpheline ; seconde conversion sans changement de contenu ni de date.
- Horloge React contrôlée : aucun commit périodique en Collection, seul RechargeClock se met à jour sur Boosters.
- 60 vues comparées sur desktop 1440 px et mobile 390 px, clair/sombre : géométrie et styles calculés conservés.
- `npx knip` sans signalement ; carnet de référence explicitement conservé.
- Rapport détaillé : [audit du 27 octobre](docs/audit-2026-10-27.md), avec tailles, suppressions, anomalies CSS et écarts justifiés.
- `npm run test:e2e` : **21 parcours réussis sur Chromium, Firefox et WebKit** ; échanges actuels, antirejeu, reprise, filtres, mobile et clavier. Tous les contrôles de l’audit sont validés avant publication.

Les sections suivantes sont historiques et décrivent les versions antérieures à l’optimisation.

## Déploiement Firebase Hosting — 26 octobre 2026

- Version applicative `1f608b2` publiée sur **https://bizave-tcg.web.app** avec `firebase deploy --only hosting --project bizave-tcg`. Site `bizave-tcg` lié explicitement dans `firebase.json`.
- Build statique de production, aperçu développeur désactivé avec `VITE_DEV_CATALOG=false` ; **297 fichiers**, dont 63 PNG. Aucun backend applicatif déployé.
- Quatre parcours Chromium existants passent sur le build de production : ouverture/reprise/collection, filtres, responsive et clavier. Le parcours historique des échanges est obsolète : il attend l’ancien bouton « Mon contact » et doit être actualisé.
- Le parcours actuel des échanges est vérifié séparément dans un test local non versionné : copie/collage des codes amis, ajout réciproque, transfert chiffré, passage de cinq à quatre cartes chez l’expéditeur et réception d’une carte chez le destinataire, puis refus du même transfert. Le récapitulatif conserve l’espace de ses libellés masqués. Ce test vérifie aussi l’absence du mode dev dans la production.
- Après publication : HTML, JavaScript et CSS identiques au build par SHA-256 ; accueil et cinq routes internes répondant 200 ; 63 illustrations PNG accessibles avec le bon type MIME et une illustration comparée à son original par SHA-256.
- Accueil public inspecté dans le navigateur. Capture locale : `artifacts/firebase-hosting-2026-10-26.png`. Aucune sauvegarde utilisateur téléversée : seuls les fichiers de `dist/` sont publiés.

## Tri par valeur et filtre booster — 26 octobre 2026

- `npm run check` réussi : lint, **97 tests unitaires**, TypeScript et build Vite. Lint, TypeScript et build revérifiés après les derniers ajustements.
- **Deux parcours Chromium réussis** : valeurs des six variantes, sens du tri, couverture des piles, contenu des piles et mémorisation après rechargement ; sélection de plusieurs boosters avec cartes partagées, recherche et Full Art combinés.
- Le deuxième booster est simulé dans une réponse réseau du test uniquement. La configuration publiée conserve le seul Phantom Blood ; le filtre Boosters reste masqué tant qu’une deuxième édition n’est pas activée.
- Panneau Affichage et menus contrôlés à **320 et 390 px**, sans débordement horizontal. Les valeurs sont affichées sous les cartes uniquement lorsque le tri Valeur est actif.
- Aperçus : `artifacts/collection-affichage-valeur.png`, `artifacts/collection-affichage-valeur-mobile.png`, `artifacts/collection-filtre-boosters-mobile.png`.
- Les validations ci-dessous décrivent les étapes antérieures. Les nouveaux parcours n’ont pas été exécutés dans Firefox ou WebKit.
- Contrôle final avant push : `npm run check` réussi et **trois parcours Chromium réussis**, incluant l’ouverture, la reprise et le récapitulatif des cinq cartes. Le dossier supprimé de Soirée Discord #1 est libéré de son ancien verrou de surveillance.

## Actualisation du catalogue — 26 octobre 2026

- `npm run check` réussi : lint sans erreur, **92 tests réussis**, TypeScript et build Vite.
- Catalogue, pool Phantom Blood et ordre alignés sur les **110 cartes** du nouveau carnet : six retraits, six ajouts et trois renommages ; répartition 40/23/21/16/10.
- **27 nouvelles illustrations PNG** originales ; **63 cartes actives illustrées**, même image pour Classique et Full Art.
- Empreintes des 183 anciens fichiers référencés inchangées ; 27 imports identiques aux octets de l’archive ; 220 chemins actifs valides. Les anciennes images hors catalogue sont conservées sans réaffectation.
- 50 descriptions nouvelles ou modifiées reprises du carnet. Aperçu de Thomas parisien et rendu des descriptions longues Bizarre Aventure inspectés dans le navigateur.
- Manifeste : `illustrations/imports/2026-10-26/manifest.json` ; capture : `artifacts/import-illustrations-2026-10-26.png`.
- Aucune migration des anciennes sauvegardes de test ; aucune publication effectuée. Les validations ci-dessous décrivent les étapes antérieures.

## Refonte Phantom Blood

- `npm run check` : ESLint sans avertissement, **50 tests Vitest réussis**, TypeScript et build Vite vérifiés.
- Nouveau test de publication : un seul booster, titre/sous-titre exacts, 110 modèles éligibles.
- Nouveau parcours vérifié dans Chromium : clic sur le sachet, révélation au clic sur les cartes, même carte après refresh, cinq cartes au récapitulatif.
- Filtres custom vérifiés : Full Art + Brillante combinés, gabarit Gundam conservé ; deux filtres uniquement, sans `select` natif.
- Accueil mobile 390×844 inspecté ; nouvelle palette, packaging et navigation à quatre entrées.
- Les scénarios Playwright ont été adaptés à la refonte ; `npm run test:e2e -- --list` reconnaît **15 scénarios** (cinq parcours × trois moteurs). Leur exécution complète n’est pas revendiquée.

Les sections ci-dessous conservent les validations initiales du moteur, de la persistance et des échanges. Les captures et textes de la première DA ne décrivent plus l’interface actuelle.

## Exécuté avec succès

- `npm run check` : **ESLint sans avertissement, 49 tests Vitest réussis, TypeScript et build Vite réussis**.
- Catalogue : les 110 modèles fournis, leur répartition 39/24/21/16/10 et les 220 fichiers placeholders sont vérifiés.
- Le CSS des compositions de cartes est comparé à la démo source par un test.
- Simulation déterministe de 100 000 cartes ; 30 valeurs de recyclage ; probabilités, profils et validation des pools.
- IndexedDB simulé : reprise d’ouverture, atomicité, concurrence entre connexions, recharge hors jeu, recyclage, archives et migration.
- Web Crypto réel de Node : clés non exportables, contacts, chiffrement, signatures, altérations, antirejeu, retours A→B→C→B→A et transactions concurrentes.

## Parcours vérifiés dans Chromium

- Ouverture gratuite et cinq révélations.
- Rechargement après la première révélation : même carte et progression conservées.
- Collection persistante, fiche ouverte au clavier et fermeture par Échap.
- Deux origines de test distinctes (`localhost` et `127.0.0.1`) : création des identités, ajout réciproque des contacts, envoi d’un exemplaire, réception, refus d’un second import.
- Écrans Boosters, Collection, Atelier et Amis & échanges.
- Formats 390×844, 768×1024, 1024×768, 1440×900 et 1920×1080 : inspection visuelle et absence de débordement horizontal sur les vues contrôlées. L’action d’ouverture reste fixe au-dessus de la navigation sur téléphone.
- L’URL Tailscale `http://100.79.153.115:5173/` a été ouverte et affiche un carnet vierge.

## Réseau

Les adresses HTTP localhost, Wi-Fi `192.168.1.188:5173` et Tailscale `100.79.153.115:5173` répondent **200** depuis cette machine. Vite écoute sur `0.0.0.0`, avec une seconde instance HTTPS sur le port 5174. Aucun changement de pare-feu.

L’accès depuis un **autre appareil physique** n’a pas été vérifié. Il dépend du pare-feu et de l’appartenance au réseau Wi-Fi/Tailscale. Les échanges entre appareils exigent HTTPS. Le certificat autosigné de développement n’a pas été accepté automatiquement par l’agent.

## À valider avant une diffusion finale

- Les scénarios Playwright sont fournis pour Chromium, Firefox et WebKit ; leur exécution automatisée complète n’est pas incluse dans cette validation.
- Safari/iOS réel, Firefox réel, clavier et lecteur d’écran sur appareils cibles.
- Les illustrations définitives et leurs cadrages dans les deux gabarits.
- Le projet Firebase et son déploiement final (configuration Hosting fournie, aucune publication effectuée).

Les données créées dans les carnets de test localhost/127.0.0.1 ne se mélangent pas à celles des adresses réseau : chaque origine possède sa sauvegarde.
