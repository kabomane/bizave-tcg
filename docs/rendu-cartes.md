# Rendu des cartes et holographie

## Deux présentations, un même gabarit

`CollectibleCard` sépare `presentation` de `deferred` :

| Présentation | Usage | Finition holographique |
| --- | --- | --- |
| `thumbnail` | Collection, récapitulatif et voisines dans D | Texture irisée précalculée, cadre nacré, un reflet animé par translation |
| `detail` (défaut) | Carte active dans D et ouvertures | Filtres, paillettes et inclinaison du rendu de référence |

Les dispositions Fusion et Gundam, les illustrations, leurs cadrages et les six variantes restent les mêmes. Le mode miniature conserve son irisation même sans animation. Aucun identifiant, taux de tirage ou élément de sauvegarde ne change.

## Budget graphique des miniatures

- Une seule texture RGBA partagée, `src/assets/holo-preview.webp` (326 × 540, 65 112 octets). Les couleurs, les paillettes et les bandes fixes sont calculées au build de cet asset, sans filtre SVG exécuté par carte.
- Une seule animation possible par holo visible : déplacement d'un reflet via `transform`. Aucun déplacement continu d'arrière-plan, filtre CSS, masque de paillettes ou animation du cadre dans cette présentation.
- Le cadre nacré et la texture restent visibles quand « Réduire les animations » est activé.
- Les cartes éloignées sont démontées via IntersectionObserver, avec une marge de 240 px. Dans D, seules la carte active et ses voisines sont montées.
- Le reflet s'active uniquement dans la zone visible et s'arrête lorsque le document est masqué. Lorsqu'un dialogue est ouvert, les reflets de la collection située derrière sont retirés ; les voisines dans D utilisent la présentation miniature.
- Les miniatures ne créent pas le contrôleur d'inclinaison : aucun ressort, capture du pointeur ou boucle RAF pour leur manipulation. Elles gardent le clic, Entrée et Espace, et ignorent les gestes de défilement.

`useCardTilt` isole la manipulation de la carte agrandie. Il conserve la limite combinée de 20° et nettoie ses écouteurs, minuterie et RAF au démontage.

## Régénérer la texture

```sh
npm run holo:texture
```

Le générateur utilise une graine fixe. Une régénération identique ne réécrit pas l'asset ; les originaux des cartes ne sont jamais traités par cette commande. Vite produit automatiquement une URL avec empreinte de contenu lors du build.

## Vérification

`tests/holographics.spec.ts` couvre les deux formats, le rendu statique et animé, la texture partagée, l'absence de filtres/masques dans les miniatures, la suspension de l'arrière-plan, le détail complet et sa limite d'inclinaison. Le parcours de 111 cartes utilise un écran de densité 3, des défilements lents et rapides et plusieurs piles holo, sans modifier leurs possessions.

Ces essais s'exécutent sur Chromium, Firefox et WebKit. Le WebKit automatisé sur PC ne reproduit pas les limites et pilotes graphiques d'un iPhone : le parcours réel doit aussi être vérifié sur l'appareil concerné, avec ses animations réactivées.

## Typographie des cartes

Les titres utilisent Fraunces Bold 700 ; les descriptions, Fraunces Medium 500 italique. La mention « rareté · finition » utilise Barlow Condensed Medium 500, retenue pour sa lisibilité en miniature. Ces règles s’appliquent aux deux formats et aux trois finitions dans `src/styles/card-typography.css`. Les polices WOFF2 Latin et Latin étendu sont hébergées dans `src/assets/fonts/`, avec leurs licences OFL ; aucun appel à Google Fonts n’est nécessaire au chargement du jeu.

## Pile et aperçu D

La Collection ouvre directement CardViewer. Le carrousel natif respecte les entries de collectionView et le réglage des doublons. Sur grand écran, les voisines restent en miniature ; seule la carte active utilise les effets complets. La mémoire de défilement de l’ancienne grille de pile est retirée.

Dans D, useCardTilt limite chaque axe à ±9° et laisse le navigateur prendre le glissé horizontal : touch-action pan-x, aucune capture de pointeur. Les autres écrans conservent le plafond combiné de 20°. Le clavier navigue entre les cartes. Échap ferme la feuille puis la vue, avec restitution du focus.

Voir [apercu-partage.md](apercu-partage.md) pour le partage, les réglages et les contrôles.
