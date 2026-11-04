# Aperçu D et partage — 2 novembre 2026

Actualisé pour la version 1.4.2, le 4 novembre 2026. Les croix des aperçus et fenêtres sont à droite par défaut ; Apparence → Main dominante propose le mode Gaucher, avec fermeture à gauche. En mode deux actions, Favori et Partager sont en haut à l’opposé de la croix. Pour une carte reçue, seules ces deux actions restent en bas, quel que soit le mode. La réception des fragments utilise la même structure plein écran : [version 1.4.2](releases/bizave-tcg.v1.4.2.md).

La Collection ouvre directement `CardViewer` sur les `entries` de `collectionView`. La pile intermédiaire disparaît. Les filtres, le tri, le choix de couverture, les doublons et les favoris par variante conservent leur logique. Donner et Recycler ciblent toujours le dernier ID de l’entrée regroupée.

La vue contient un fond presque uni suivant le thème, avec des halos diffus de la couleur de rareté décentrés vers les bords. Ces lumières statiques restent très légères ; aucun ovale central ni illustration n’est utilisé. Elle contient aussi un carrousel natif avec snap, des flèches relatives à la carte, la date, les points de finition et un îlot d’actions. Elle suit le thème clair, sombre ou système. À partir de 700 px, les voisines apparaissent à 86 % de taille et 38 % d’opacité. Les Options proposent quatre actions (défaut) ou deux, et Story (défaut) ou Carte. Le libellé Donner a été choisi par le propriétaire ; les URL existantes restent compatibles.

`ViewerCard` présente un skeleton neutre avec balayage animé pendant le chargement, sans logo ni motif. Le décodage de l’illustration et les polices précèdent un fondu de 240 ms, sans frames d’attente supplémentaires ni variation de dimensions. Les illustrations prêtes sont mémorisées pendant toute la consultation, indépendamment de la finition et de la présentation : le passage de voisine à carte active ou le retour sur une carte démontée ne réaffiche pas le skeleton. Seules la carte courante et ses voisines sont montées ; la mémoire de chargement est libérée à la fermeture. Une erreur d’image laisse apparaître les textes et le repli natif ; fermer la vue reste possible pendant l’attente. Les effets sont désactivés en mouvement réduit.

Le recyclage utilise la transaction existante et ses contrôles de possession. Sa feuille native reprend exactement la position et la largeur de l’îlot. Après suppression, la vue conserve la variante si elle existe, passe à la voisine sinon, et se ferme si la pile est vide. Les feuilles et la vue rendent le focus et bloquent le défilement de fond ; Échap ferme d’abord la feuille.

## Partage

- Chaque image destinée au Canvas attend `load`, puis `decode()` et des dimensions naturelles valides avant tout dessin. Le bouton reste en préparation jusqu’à la création du PNG complet. Un échec de chargement ou de décodage retire l’image du cache et remonte une erreur au lieu de mémoriser un export vide.
- `src/share/cardCanvas.ts` porte en TypeScript le dessin de la démo fournie : repère 326 × 540, palette CSS, Path2D, polices locales, grain déterministe et texture holo.
- L’alignement de texte Canvas est réinitialisé avant les mesures. Les titres des Classiques sont centrés selon les glyphes puis dessinés dans un calque limité au bandeau, afin de contenir les ombres de dorure. Le composant affiché ne conserve qu’un seul titre.
- `renderShareImage.ts` produit Story PNG opaque 1080 × 1920 ou Carte PNG transparente 978 × 1620. Le fond Story reprend les halos de rareté et le thème actif. `storyBackdrop.ts` reproduit les lumières sur un petit canevas avec un flou gaussien calculé en JavaScript, sans illustration de fond ni dépendance à Canvas filter. La signature reste lisible dans les deux thèmes.
- `useShareImage.ts` prégénère à l’ouverture et lors d’un changement de carte, de format ou de thème résolu. Le cache est propre à la consultation, indexé par variante, format et thème pour Story. Le mode système réagit à un changement d’apparence de l’appareil. Les URL sont révoquées à la fermeture, y compris pour une génération encore en cours.
- Le clic appelle immédiatement `navigator.share` avec le File déjà prêt, après `canShare`. Aucun await avant l’appel. Le bouton indique la préparation tant que l’image manque. AbortError reste silencieux ; les autres erreurs proposent le téléchargement.
- Sans partage de fichiers, une feuille affiche l’image, « Appui long pour l’enregistrer » et Télécharger. Le fichier ne contient aucune clé privée, identité ou donnée de transfert.

## Cohérence visuelle

La navigation mobile devient un îlot flottant avec un fond à 94 % et un flou de 8 px, pour limiter l’effet verre. Les carrousels de boosters utilisent les flèches rondes et des points sobres ; le bouton d’achat est arrondi. L’ouverture reprend ces halos et des points selon les finitions révélées : un seul point est agrandi, celui de la carte courante. Les anciennes règles de progression grise sont retirées pour préserver l’irisation et le doré en mode sombre. Le récapitulatif remplace ses légendes par ces points et ouvre D sur les cartes du booster. L’Atelier utilise la même feuille pour ses confirmations. Les pages gardent leur direction éditoriale.

Les Options sont organisées en rubriques natives dépliantes : Apparence, Collection, Code cadeau, Don des cartes, Compte et sauvegarde, puis Développement uniquement en local. Une seule rubrique s’ouvre à la fois ; les contrôles restent montés. Sur cette route, l’en-tête affiche « option TCG » et l’ID joueur à la place des fragments, sans titre Options supplémentaire. Les autres routes conservent leur en-tête habituel.

Dans la Collection, piles et cartes seules réservent le même espace autour de la face : dimensions et légendes s’alignent. La valeur en fragments reste à droite dans les deux cas. Le compteur des boosters gratuits regroupe stock gratuit et réserve achetée (« 0 / 5 + n »), sans invitation à toucher. Les boosters exclusifs à la boutique affichent leur réserve seule.

## Contrôles

`tests/stack-return.spec.ts` remplace le parcours de retour à l’ancienne pile. Il couvre les quatre dimensions de référence, les deux modes de barre, la géométrie des flèches et des feuilles, le focus, les doublons séparés, les favoris, le recyclage jusqu’à pile vide, le geste utilisateur au partage, les deux formats, le téléchargement, les six variantes Canvas et les coins transparents. Il contrôle aussi la réduction des animations, AbortError et la libération des URL.

Le test unitaire `cardCanvas.test.ts` compare la palette au CSS. Les contrôles de préférences vérifient les valeurs absentes et inconnues. Les exports et captures de contrôle sont dans `artifacts/`, hors publication.

Le partage natif, Photos, LINE et Messages restent à valider sur un iPhone réel en HTTPS : WebKit automatisé et le partage simulé ne remplacent pas cet essai.

Références : `references/bizave-apercu-D-et-partage-2026-11-02.md`, `references/bizave-apercu-pistes-2026-11-02.html` (D uniquement), `references/bizave-partage-demo-2026-11-02.html`.
