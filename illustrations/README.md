# Illustrations de Bizave TCG

## Référence de génération

La DA officielle est [Souvenir × Moment culte](prompts/DA-illustrations-Souvenir-Moment-culte.md). Elle remplace le prompt global provisoire. Son contenu est conservé à l’identique pour les futures demandes de génération. Aucune génération n’est lancée par son ajout.

- prompts/instructions-cartes.md : consignes historiques des 110 premiers modèles. Les carnets du 28 octobre dans `references/` font référence pour les cartes initiales du catalogue ; le carnet Anima Isekai du 29 octobre ajoute quatre cartes Chainsaw Man.
- references/ : références visuelles, éventuellement rangées par personnage ou carte.

Ces sources sont hors de public/ et ne sont pas publiées avec l’application.

## Illustrations finales

Les originaux sont déposés par le propriétaire dans `illustrations/originals/<identifiant>.<ext>` (png, jpg, jpeg ou webp), hors publication et hors Git. En conserver une sauvegarde ailleurs. Le script les lit sans les modifier. `npm run illustrations` ou `npm run illustrations -- --only <identifiant>` génère `public/assets/cards/<identifiant>/illustration.<hash>.webp` : 900 × 1200, qualité 85, sRGB, dix caractères de SHA-256 dans le nom. Une seule illustration sert aux versions **Classique** et **Full Art** ; les dispositions Fusion et Gundam assurent leur cadrage.

Les chemins artwork.standard et artwork.fullArt de src/data/catalogue.json pointent vers ce même fichier. Les clés techniques standard et normal restent compatibles avec les sauvegardes existantes ; les libellés affichés sont actualisés dans le jeu.

Le catalogue actuel compte **185 cartes**, toutes illustrées avec un WebP versionné. Les 185 originaux sont conservés localement dans `originals/`, hors Git et publication. Les sections d’import retracent les ajouts successifs.

## Import du 29 octobre 2026

L’archive `vague 1 - 59 cartes.zip` complète les **36 illustrations manquantes** des 55 cartes actuelles d’Anima Isekai. Les 145 PNG et WebP précédents sont inchangés (290 fichiers vérifiés par empreinte SHA-256 et date de modification). Les nouveaux originaux sont copiés à l’identique dans `originals/<id>.png` ; l’archive extraite complète reste dans `.local/imports/2026-10-29-anima/`. Les quatre cartes Chainsaw Man du nouveau carnet sont également ajoutées au booster, avec leurs illustrations, noms, descriptions et raretés. Leurs numéros sont ajoutés à la fin de l’ordre global. Anima Isekai compte désormais 59 cartes.

Conversion avec le script existant, uniquement pour les 36 cartes complétées et les quatre nouvelles cartes : WebP 900 × 1200, qualité 85, sRGB. Les deux variantes partagent le même fichier. Le manifeste `imports/2026-10-29/manifest.json` consigne les sources, dimensions et empreintes. Correspondances particulières : `nana_taro.png` → `sd-nana`, `emi_ayase.png` → `dd-eli`, `matthieu_shinichi.png` → `kis-arashi`. Les noms, descriptions, raretés et numéros des cartes existantes restent inchangés.

Le nouveau carnet est conservé dans `references/carnet-anima-isekai-2026-10-29.jsx` comme référence ; ses consignes de génération ne sont pas exécutées.

## Import du 28 octobre 2026

**Memory Frame** remplace le nom Phantom Blood et ajoute les 16 cartes du carnet `references/carnet-memory-frame-2026-10-28.jsx`. Toutes leurs images sont fournies dans `vague 2 - 16 cartes.zip` : le booster compte 126 cartes illustrées.

**Anima Isekai** suit les 55 cartes de `references/carnet-anima-isekai-2026-10-28.jsx`. Son archive fournit 19 illustrations ; les 36 autres cartes conservent des SVG « Illustration à venir », conformément au choix du propriétaire. `matthieu_uzumaki.png` est associé à `nar-thomas` (Thomas Uzumaki, unique carte Naruto Uzumaki du carnet) ; cette divergence de nom et les autres associations sont consignées dans `imports/2026-10-28/manifest.json`.

Les **35 nouveaux PNG** 1086 × 1448 sont copiés à l’identique depuis les archives dans `originals/<id>.png`. Seules ces 35 cartes sont converties en WebP 900 × 1200, qualité 85, sRGB, sans métadonnées. Leur cadrage Classique est aligné en haut pour conserver les visages ; le Full Art reste centré. Les 110 anciennes définitions et leurs 220 fichiers (PNG + WebP) restent inchangés, empreintes et dates de modification vérifiées. Les descriptions proviennent uniquement de `FICHES.description` ; aucune description des 110 modèles précédents ne diffère du nouveau carnet.

## Import du 24 octobre 2026

14 PNG originaux de TCG - bizave card..zip sont intégrés, dont les deux Risitas en remplacement des JPEG compressés. Chaque fichier fait 1086 × 1448 px. Les octets sont conservés à l’identique.

Les associations, raretés, dimensions et empreintes SHA-256 sont dans imports/2026-10-24/manifest.json. Les raretés et identifiants des 110 cartes restent inchangés. Les deux Mini utilisent toujours leurs placeholders.

Les 10 descriptions FICHES.description du carnet sont intégrées. Les champs Mémo et Création ne sont pas affichés comme descriptions. Le carnet du 24 octobre a été retiré du dépôt lors du nettoyage ; il reste dans l’historique Git, commit `b37dbb2`.

## Import du 25 octobre 2026

23 nouvelles illustrations PNG de `TCG - bizave card. (1).zip` sont ajoutées, sans remplacement des 14 images déjà présentes. Les fichiers originaux (1086 × 1448 px) sont conservés à l’identique. Le jeu compte désormais 37 cartes illustrées. Chaque nouvelle image sert aux versions Classique et Full Art, avec le cadrage Classique aligné en haut comme pour les imports précédents.

Les quatre noms sont actualisés d’après le carnet, sans changer les identifiants : LOSC → Thomas supporter (`losc`), OL → Matthieu supporter (`ol`), Thomas routier → Thomas camionneur (`t-routier`), Matthieu routier → Matthieu camionneur (`m-routier`). Les deux cartes de Matthieu conservent leurs placeholders : aucune nouvelle illustration correspondante dans cette archive.

Les 21 descriptions supplémentaires du carnet sont intégrées ; seuls les champs `FICHES.description` servent au texte des cartes. Le carnet du 25 octobre a été retiré du dépôt lors du nettoyage ; il reste dans l’historique Git, commit `1f608b2`. Le manifeste `imports/2026-10-25/manifest.json` détaille les ajouts, images ignorées, empreintes SHA-256, renommages et descriptions.

Validation : les 14 images existantes et leurs cadrages sont inchangés ; les 23 nouveaux PNG correspondent exactement à l’archive ; les 110 identifiants, raretés et groupes restent identiques ; les 220 chemins du catalogue existent. Vérification TypeScript sans erreur pour les trois projets. Rendu des versions Classique et Full Art de Thomas supporter inspecté dans le navigateur ; recherche de Thomas camionneur et ses six variantes vérifiée. Capture : `artifacts/import-illustrations-2026-10-25.png`.

## Import du 26 octobre 2026

Le catalogue actif et le pool Phantom Blood suivent les 110 cartes du nouveau carnet : **40 communes, 23 peu communes, 21 rares, 16 épiques et 10 légendaires**. L’ordre de l’édition reprend celui du carnet. Il s’agit d’une révision avant publication, sans migration des anciennes sauvegardes de test. Les identifiants fournis dans le carnet sont conservés.

- Six cartes retirées : Soirée Discord #1, Thomas Expedition 33, Thomas’s Mansion, Soirée Discord #2, Matthieu Expedition 33 et Super Matthieu Galaxy.
- Six cartes ajoutées : Thomas parisien, Matthieu parisien, Eli chasseuse de fantômes, Eli canotière, Eli parisienne et La glacière Picard.
- Trois noms actualisés : Overwatch → Thomas Overwatch, Splatoon → Matthieu Splatoon, Cégep → Cégep Lévis.
- 50 descriptions nouvelles ou modifiées, reprises uniquement des champs FICHES.description.

**27 nouveaux PNG** sont ajoutés depuis `TCG - bizave card..zip`, tous en 1086 × 1448 px, sans modification des octets. Les 36 illustrations précédemment importées des cartes toujours actives restent intactes. À la demande du propriétaire, l’illustration et les deux placeholders de Soirée Discord #1 ont ensuite été supprimés définitivement de `public/assets/cards/discord-1/` et du build local : cette carte ne reviendra pas. Les manifestes et carnets historiques conservent la trace de son ancien import. Le jeu compte **63 cartes actives illustrées**, avec une image partagée entre Classique et Full Art. Les cinq autres nouvelles cartes conservent des placeholders : leur illustration n’est pas fournie dans l’archive.

Le carnet est conservé dans `references/carnet-cartes-2026-10-26.jsx`. Le manifeste `imports/2026-10-26/manifest.json` consigne les associations, dimensions et empreintes SHA-256, les fichiers ignorés, les retraits, ajouts, renommages et descriptions. Les anciennes images et leurs cadrages restent inchangés.

Validation : 183 fichiers existants référencés par l’ancien catalogue contrôlés par SHA-256 sans modification ; 27 nouveaux PNG identiques à l’archive ; 220 chemins actifs valides ; pool et ordre couvrant exactement les 110 cartes actuelles. `npm run check` réussi : lint, 92 tests, TypeScript et build Vite. Aperçus de Thomas parisien et des descriptions longues Bizarre Aventure inspectés dans le navigateur, en Classique et Full Art. Capture : `artifacts/import-illustrations-2026-10-26.png`.

## Import du 27 octobre 2026

L’archive `TCG - bizave card. (1).zip` fournit 109 PNG pour les 110 cartes du carnet `references/carnet-cartes-2026-10-27.jsx`. Les identifiants, noms, raretés, groupes, cadrages et pools du projet sont conservés.

- 46 illustrations manquantes sont ajoutées. Leurs PNG 1086 × 1448 sont conservés sans modification dans `originals/<id>.png`, hors Git et publication. Chaque nouvelle carte est traitée avec `npm run illustrations -- --only <id>` : WebP 900 × 1200, qualité 85, sRGB, recadrage central, métadonnées retirées et nom versionné par SHA-256. Les sorties totalisent 9 678 220 octets pour 180 036 538 octets d’originaux.
- Les 63 illustrations WebP précédentes et leurs 63 originaux sont inchangés : empreintes et dates de modification contrôlées. Aucune de ces cartes n’a été reconvertie.
- Le propriétaire confirme que `soiree_discord_#1.png` correspond à la carte renommée **Soirée film #1**. Cette image est importée sous `soiree-film-1`, sans recréer l’ancien identifiant `discord-1`.
- 31 descriptions sont ajoutées et 3 sont corrigées (**Thomas Agent d’accueil**, **Les Blancs**, **Matthieu jungler**), exclusivement depuis `FICHES.description`. Les 110 cartes ont désormais une description.
- **Eli biome cerisier** (`eli-cerisier`) est ensuite fournie séparément dans `eli_cerisier.png` : original 1086 × 1448 conservé dans `originals/eli-cerisier.png`, sans modification (3 850 529 octets). Seule cette carte est convertie en WebP 900 × 1200 (159 200 octets), et ses deux placeholders sont retirés. Les 109 images déjà présentes restent inchangées, empreintes et dates vérifiées. Le catalogue est complet : **110 cartes illustrées**, avec une image partagée entre Classique et Full Art.

Le manifeste `imports/2026-10-27/manifest.json` détaille les associations source/identifiant, les dimensions, les empreintes des PNG et WebP, le renommage confirmé et les changements de descriptions. Les 46 PNG importés correspondent exactement aux octets de l’archive. Vérification des dimensions WebP, de l’espace sRGB, du retrait EXIF/ICC et des noms versionnés ; planche des nouvelles illustrations inspectée. `npm run check` valide lint, 113 tests, TypeScript et build Vite.
