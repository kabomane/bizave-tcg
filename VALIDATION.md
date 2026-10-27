# Validation — bizave-tcg.v1.2.5

## Publication du 27 octobre 2026

- `npm run check` réussi : lint, **128 tests unitaires et d’intégration**, TypeScript et build de production.
- `npx playwright test --reporter=line` : **28 parcours réussis**, deux exécutions du test de compatibilité ignorées car il pilote lui-même les trois moteurs depuis son unique exécution Chromium. Les parcours couvrent les échanges signés, les migrations, la suppression, les confirmations en minuscules/majuscules, la collection, les ouvertures, le clavier et le responsive sur Chromium, Firefox et WebKit.
- Migration réelle de l’identité **Firefox → Chromium → WebKit**, puis envoi et retour d’une carte sans refaire le contact.
- Build de production vérifié dans Chromium : métadonnée `bizave-tcg.v1.2.5`, absence du mode dev, collection vide sans bouton Phantom Blood, export/import en minuscules et conservation de l’ID joueur.
- **121 fichiers** statiques, dont **110 WebP versionnés**, pour **22 875 600 octets**. Aucun PNG original, certificat, clé privée ou fichier de sauvegarde n’est inclus dans les ressources publiées. Les identités sont créées localement à l’exécution du jeu.
- Alignement des boutons contrôlé de 320 à 1280 px : Exporter/Importer sur une même ligne ; Retour/Annuler et action principale alignés sur la largeur du champ, de même hauteur et dans un rapport 1/3–2/3.
- README, guide de sauvegarde, guide des boosters, roadmap et note de publication revus. Les rapports d’audit antérieurs sont explicitement historiques.

Le protocole courant utilise une seule paire de signature transférable, les formats FR2/TR2 et la base `bizave-tcg-v2` (schéma 5). Les anciennes identités et les anciens formats ne sont pas repris. Cible de publication : Firebase Hosting `bizave-tcg`, avec `VITE_DEV_CATALOG=false`.


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
