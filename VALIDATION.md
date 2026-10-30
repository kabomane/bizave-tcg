# Validation — bizave-tcg.v1.3.0

## Publication — 30 octobre 2026, mise à jour 2

- 32 modèles illustrés ajoutés à Memory Frame : 158 modèles dans ce booster, 217 dans le catalogue complet. Les 185 originaux et 185 WebP précédents restent inchangés, empreintes et dates contrôlées ; 16 images déjà présentes dans l’archive sont ignorées. Les numéros précédents sont préservés.
- Thomas Sakamoto et Nana Sakamoto renommés. Soirée film #3 passe de rare à peu commune ; correctif de compatibilité isolé dans `src/storage/patches/soireeFilm3Rarity.ts`, retrait documenté dans `docs/patch-soiree-film-3.md`.
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
