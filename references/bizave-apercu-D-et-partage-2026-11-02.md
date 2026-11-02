# Bizave TCG — Aperçu de carte « D », partage d'image et cohérence de l'app

> Document de passation pour les développeurs humains **et** les agents IA.
> Langue du code et des libellés : français. Dépôt : `kabomane/bizave-tcg` (React 19, Vite, Dexie, CSS maison).
> Date : 2 novembre 2026.

---

## 0. À lire en premier (règles pour humains et IA)

1. **La piste retenue est D · Synthèse.** C'est la seule à implémenter pour l'aperçu de carte et la pile.
2. **A · Épurée** est une refonte légère de la fenêtre actuelle. Elle est traitée **séparément** par l'équipe et n'est pas décrite ici.
3. **B · Vitrine** et **C · Carrousel** sont **abandonnées**. Dans le fichier maquette, tout bloc marqué `⛔ TEST VISUEL ABANDONNÉ — NE PAS COPIER NI UTILISER` est une archive. **Ne pas le copier, ne pas s'en inspirer comme source de code.**
4. La maquette est du HTML/JS sans framework, faite pour valider l'expérience. **Ce n'est pas du code de production** : le transposer en composants React et en CSS de l'app, avec les conventions du dépôt.
5. Les valeurs chiffrées (tailles, seuils, couleurs) de ce document sont celles validées en maquette. Elles peuvent être ajustées si l'intégration le demande, mais pas sans raison.
6. Ne rien inventer qui ne soit pas dans ce document ou dans les fichiers de référence. En cas de doute, la section 7 liste les points encore ouverts.

### Fichiers de référence

| Fichier | Rôle |
|---|---|
| `bizave-apercu-pistes.html` | Maquette interactive. Seule la piste D est visible. Onglets Téléphone / Tablette / Paysage / Ordinateur, réglage de la barre 4 ou 2 actions, bouton « Doublons regroupés / séparés ». |
| `bizave-partage-demo.html` | Démo autonome du rendu de l'image de partage dans un canvas. Contient la fonction `drawCard` de référence. |

Les deux fichiers sont autonomes (polices, illustrations et texture holo intégrées en base64). Pour tester le vrai partage sur iPhone, ils doivent être servis en HTTPS : par exemple les déposer dans `public/` et lancer `npm run dev:https`, ou les déployer sur Firebase.

---

## 1. D'où on part

La fenêtre d'aperçu actuelle (`CollectionPage.tsx`, composant `Modal`) pose trois problèmes :

- **Trop de clics :** Collection → pile (grille de miniatures) → carte. Deux niveaux avant de voir une carte en grand.
- **Actions éparpillées :** retour, date, favori et fermeture en haut ; Envoyer et Recycler en bas. Pas de place logique pour un bouton Partager.
- **Hauteur :** la fenêtre est très verticale, et on voulait éviter de faire défiler.

Quatre pistes ont été maquettées et testées par le porteur du projet sur téléphone, tablette et ordinateur :

| Piste | Idée | Verdict |
|---|---|---|
| A · Épurée | Fenêtre actuelle remise en ordre, en feuille du bas | Refonte légère, traitée à part |
| B · Vitrine | Plein écran, fond flou, barre d'actions en bas, pile en grille des 6 variantes | Abandonnée : 3 clics pour voir une carte, grille jugée encombrante. **La barre du bas a été gardée.** |
| C · Carrousel | Pile et aperçu fusionnés, on glisse d'une variante à l'autre | Abandonnée telle quelle : bouton ⋯ maladroit en paysage et sur ordinateur, favori et partage un peu cachés. **Le carrousel et les points ont été gardés.** |
| **D · Synthèse** | Carrousel de C + barre d'actions de B | **Retenue** |

---

## 2. Spécification de D

### 2.1 Principe

- **Un toucher** sur une pile (ou une carte seule) dans la Collection ouvre directement la **grande carte**, en plein écran.
- La pile et l'aperçu ne forment **plus qu'une seule vue** : on passe d'une carte de la pile à l'autre en glissant, avec les flèches, avec les points ou avec le clavier.
- **Plus de niveau « pile » intermédiaire** et plus de bouton « La pile ».
- Toutes les actions sont dans une **barre d'actions en bas**, en forme d'îlot vitré.

### 2.2 Anatomie de l'écran

```
┌──────────────────────────────────────┐
│ (✕)                      [(★) (⤴)]   │  ← barre du haut ; ★ ⤴ seulement en mode « 2 actions »
│                                      │
│   (←)   ┌──────────────┐   (→)       │  ← flèches collées aux bords de la carte,
│         │              │             │     centrées verticalement sur elle
│         │    CARTE     │             │
│         │  (inclinable)│             │
│         └──────────────┘             │
│                                      │
│      Obtenue le 1 novembre 2026 (×2) │  ← date ; pastille ×N seulement en doublons regroupés
│              ●  ·  ◆                 │  ← points de position, stylés selon la finition
│  ┌────────────────────────────────┐  │
│  │ ★ Favori  ⤴ Partager  ✈ Donner  ◇ Recycler │  ← barre d'actions (mode 4)
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Fond** : l'illustration de la carte, en plein cadre, floutée (`blur(46px) saturate(1.5) brightness(.42)`, agrandie de 5 % pour masquer les bords), plus un dégradé vers le noir en bas pour la lisibilité. La vue reste sombre quel que soit le thème de l'app : c'est un choix assumé, comme un visualiseur photo.

**Barre du haut** : un bouton Fermer à gauche. À droite, Favori et Partager en mode 2 actions uniquement. Ces boutons sont **ronds et vitrés** (40 px, fond `#ffffff14`, bordure `#ffffff1c`, `backdrop-filter: blur(14px)`), pour rester visibles sur n'importe quelle illustration.

**Sous la carte**, il ne reste que deux lignes :
1. « Obtenue le {date longue} », plus une pastille `×N` **seulement** si les doublons sont regroupés et que la variante a plus d'un exemplaire.
2. Les **points de position**.

Les informations rareté, finition et illustration ne sont **pas répétées** sous la carte : elles sont déjà sur la carte. Le compteur « 2 / 4 » a aussi été retiré, car les points le remplacent.

### 2.3 Barre d'actions : option utilisateur 4 ou 2 actions

Le choix entre les deux modes est un **réglage utilisateur**, à placer dans Options (voir section 4).

| Mode | Barre du bas | Barre du haut |
|---|---|---|
| **4 actions** (par défaut proposé) | Favori, Partager, Donner, Recycler, icône au-dessus du libellé. La valeur de recyclage `+N` est un petit exposant à côté de l'icône. | Fermer seulement |
| **2 actions** | Deux boutons côte à côte : **Donner** (fond clair, mis en avant) et **Recycler `+N`** | Fermer à gauche ; Favori et Partager à droite |

Règles de la barre :
- Forme d'îlot : marges latérales de 14 px, rayon de 24 px, fond `#ffffff14`, bordure `#ffffff17`, `backdrop-filter: blur(24px)`.
- À partir de 700 px de large, la barre a une **largeur fixe** et reste centrée : 440 px en mode 4, 400 px en mode 2. Elle ne doit jamais s'étirer sur toute la largeur d'une tablette paysage ou d'un ordinateur.
- Le favori actif prend la couleur d'accent de l'app (`--accent`) et l'icône étoile remplie, avec une petite animation de rebond.

### 2.4 Confirmation de recyclage

- Le recyclage passe par une **feuille d'actions** : « Recycler cet exemplaire ? », une phrase d'explication, un bouton rouge **Recycler · +N**, puis un bloc séparé **Annuler**.
- Si c'est le dernier exemplaire de la variante, ajouter « C'est ton dernier exemplaire de cette variante. ». Ce texte existe déjà dans l'app actuelle, en vouvoiement.
- **La feuille prend exactement la largeur et la position de la barre d'actions** : mêmes bords gauche et droit, même bas. Vérifié au pixel près en maquette, sur téléphone et ordinateur, dans les deux modes.
- Un fond sombre semi-transparent couvre le reste. Toucher ce fond ou appuyer sur Échap annule.
- Après un recyclage : on reste sur la même variante s'il en reste, sinon on passe à la carte voisine. Si la pile est vide, la vue se ferme. Un message court confirme l'opération : « Recyclée · +N fragments ».

### 2.5 Navigation dans la pile

**Flèches** :
- rondes et vitrées, 40 px, icône flèche ← / → ;
- positionnées **par rapport à la carte**, pas aux bords de l'écran : `left: max(6px, calc(50% - var(--cw) / 2 - 56px))`, et l'équivalent à droite ;
- centrées verticalement sur la carte ;
- **cachées** (opacité 0, non cliquables) en début et en fin de pile ;
- absentes si la pile n'a qu'une carte.

**Glissé horizontal** : carrousel natif `overflow-x: auto` + `scroll-snap-type: x mandatory` + `scroll-snap-stop: always`. Pas de librairie.

**Clavier** : ← et → changent de carte ; Échap ferme d'abord la feuille ouverte, puis la vue.

**Points de position** :
- un point par carte de la pile, touchables (zone de touche agrandie à environ 25 px) ;
- point actif à 145 % de taille et opacité 1, inactifs à 0.32 ;
- **le style du point dépend de la carte** :

| Carte | Point |
|---|---|
| Finition Mate | Rond, couleur neutre (blanc cassé) |
| Finition Holographique | Rond, dégradé conique arc-en-ciel avec un léger halo et un `hue-rotate` animé en continu (3 s) |
| Finition Alternative | Rond, dégradé doré, cerclé d'or |
| Illustration Full Art | Même couleur que sa finition, mais en **losange** (carré tourné de 45°, coins arrondis à 1,5 px) |

- `aria-label` de chaque point : « {Finition}, {Illustration}, obtenue le {date} ».

```css
.dot{--s:1;--r:0deg;width:7px;height:7px;border-radius:50%;background:#f2efe8;opacity:.32;
  transform:rotate(var(--r)) scale(var(--s));transition:opacity .25s,transform .25s}
.dot[aria-current=true]{opacity:1;--s:1.45}
.dot.f-glossy{background:conic-gradient(#ff8fa3,#ffe07a,#8dffb8,#8ad8ff,#c79bff,#ff8fa3);
  box-shadow:0 0 7px #bfe6ffaa;animation:dotHolo 3s linear infinite}
.dot.f-alternative{background:linear-gradient(135deg,#fcf6ba,#bf953f 45%,#fbf5b7 70%,#aa771c);
  box-shadow:0 0 0 1.5px #0d0d0f,0 0 0 2.5px #bf953f}
.dot.a-fullArt{border-radius:1.5px;--r:45deg;width:6.5px;height:6.5px}
@keyframes dotHolo{to{filter:hue-rotate(360deg)}}
```

### 2.6 Doublons : regroupés ou séparés

D respecte le réglage existant `collectionDisplay.duplicates` (`'hide'` | `'show'`). Le modèle de données de l'app convient déjà : `collectionView()` renvoie des `CollectionItem` dont les `entries` sont **exactement** les cartes du carrousel.

| Réglage | Une carte du carrousel = | Sous la carte |
|---|---|---|
| `duplicates: 'hide'` (regroupés) | une **variante** (`entry.ids` contient tous les exemplaires) | date + pastille `×N` si N > 1 |
| `duplicates: 'show'` (séparés) | un **exemplaire** (`entry.ids` en contient un seul) | date de cet exemplaire, sans pastille |

En mode regroupé, Donner et Recycler agissent sur l'exemplaire déjà choisi par l'app aujourd'hui (`detail.ids` / `copies.at(-1)`). **Ne pas changer ce comportement dans ce chantier.**

Les favoris restent par **variante** (`variantKey`), comme aujourd'hui.

### 2.7 Inclinaison de la carte (« tilt »)

- La carte suit le doigt ou la souris, jusqu'à ±9° sur chaque axe : `rotateX` / `rotateY` en `perspective(1000px)`, avec un reflet radial en `soft-light`. Elle revient en place avec un ressort de 0,6 s au relâchement.
- Pour les finitions holographiques, une couche irisée en `color-dodge` suit la position horizontale du doigt, et ondule doucement au repos.
- **Cohabitation avec le carrousel** : la carte a `touch-action: pan-x`, et on ne capture **pas** le pointeur. Dès que le navigateur prend le geste horizontal pour faire défiler, il envoie `pointercancel`, et l'inclinaison se relâche. L'app a déjà `useCardTilt` (limite combinée de 20°) : l'adapter à cette règle plutôt que d'en écrire un nouveau.

### 2.8 Mise en page selon l'écran

La maquette utilise des *container queries* sur l'écran simulé. Dans l'app, utiliser les mêmes seuils en media queries.

| Largeur | Appareil type | Comportement |
|---|---|---|
| < 700 px | Téléphone | Une carte à la fois, les voisines hors champ |
| ≥ 700 px | Tablette portrait | Carte plus grande. **Les cartes voisines dépassent sur les côtés**, à 86 % de taille et 38 % d'opacité, et se touchent pour y aller. Barre de largeur fixe. |
| ≥ 1100 px | Tablette paysage, ordinateur | Même chose, avec un plafond de taille un peu plus haut |

La largeur de carte est une seule variable, `--cw`, dont dépendent la carte, les flèches et le carrousel :

```css
.viewer.d       { --cw: min(calc(100vw - 124px), calc((100dvh - 290px) * .6037)); }  /* barre 4 */
.viewer.d.dock2 { --cw: min(calc(100vw - 124px), calc((100dvh - 276px) * .6037)); }  /* barre 2 */
@media (min-width: 700px)  { .viewer.d, .viewer.d.dock2 { --cw: min(420px, calc((100dvh - 290px) * .6037)); } }
@media (min-width: 1100px) { .viewer.d, .viewer.d.dock2 { --cw: min(440px, calc((100dvh - 280px) * .6037)); } }
/* 0.6037 = 326 / 540, le ratio des cartes. La hauteur commande : rien ne défile. */
```

Pour que les voisines dépassent à partir de 700 px :

```css
.slide { flex: 0 0 calc(var(--cw) + 64px); scroll-snap-align: center; }
.track { padding-inline: calc(50% - (var(--cw) + 64px) / 2); }
/* index courant = round(scrollLeft / largeurDiapositive) */
```

### 2.9 Accessibilité et mouvement

- La vue est un `dialog` modal avec `aria-label` = titre de la carte. Le focus va sur la vue à l'ouverture et revient à la tuile d'origine à la fermeture.
- Tous les boutons qui n'ont qu'une icône ont un `aria-label`. Favori a `aria-pressed`.
- Points : `aria-current="true"` sur le point actif.
- `prefers-reduced-motion: reduce` : aucune animation (points holo, ondulation, rebond, glissés animés), changement de carte instantané.
- Les feuilles de confirmation sont aussi des dialogues modaux, fermés par Échap ou en touchant le fond.

### 2.10 Ce que D remplace dans le code actuel

- **`CollectionPage.tsx`** : les états `stackKey` et `detailKey`, la grille `stack-grid` dans le `Modal` et le bouton « La pile » sont remplacés par **une seule vue** `CardViewer`, qui prend un `CollectionItem` et l'index de départ.
- **Collection :** toucher une tuile ouvre `CardViewer` sur la première carte de la pile, ou sur l'unique carte si la tuile n'en contient qu'une.
- **Actions existantes conservées :** la logique de `toggleFavorite`, de `recycle` (avec `getRecycleFragments`) et la navigation vers `/envoyer/:id` est réutilisée telle quelle. Seul l'emplacement des boutons change.
- **`preserveViewScroll` et la mémoire de défilement de la pile** n'ont plus lieu d'être. À retirer avec prudence : `tests/stack-return.spec.ts` couvre ce comportement et devra être réécrit pour D.
- **`CollectibleCard`** reste le rendu de la carte (présentation `detail` pour la carte active). Les voisines visibles sur grand écran peuvent utiliser la présentation `thumbnail`, pour limiter le coût graphique (voir `docs/rendu-cartes.md`).

---

## 3. Système de partage d'image

### 3.1 Le problème rencontré

Capturer la carte telle qu'elle est affichée (html2canvas, html-to-image) échoue ou donne une image fausse :

- **Masques et mélanges ignorés :** les cartes utilisent des masques CSS, `color-mix`, `mix-blend-mode`, des filtres SVG `feTurbulence` et des couches holographiques. Ces librairies les rendent mal ou pas du tout.
- **Safari :** il gère mal `foreignObject`, que ces librairies utilisent (images absentes au premier rendu, filtres ignorés).
- **Canvas « tainted » :** si une image vient d'un autre domaine sans en-tête CORS, `toBlob` lève une `SecurityError`.
- **Geste utilisateur expiré :** sur iOS, `navigator.share()` exige d'être appelé pendant ce geste. Si on génère l'image *après* le toucher, on obtient `NotAllowedError`.

### 3.2 La solution qui fonctionne : redessiner la carte dans un canvas

On ne capture pas le DOM. On **redessine la carte** avec l'API Canvas 2D, à partir des **mêmes données et des mêmes cotes** que `cards-reference.css`. Testé et validé sur iPhone par le porteur du projet.

**Principe** :
1. Tout se dessine dans un repère de **326 × 540 unités** : la taille de base de la carte en CSS. On applique ensuite `ctx.scale(S, S)` pour la résolution voulue.
2. Les couleurs de rareté (`--r-info`, `--r-f1..3`, `--r-metal`) sont copiées depuis `cards-reference.css` dans une table JS.
3. Les **icônes SVG** (rareté, finition) reprennent les mêmes tracés que `CollectibleCard.tsx` et sont dessinées avec `new Path2D(d)`. Pas de rasterisation de SVG.
4. L'**illustration WebP** est chargée avec `new Image()`. Elle est servie par le même domaine que l'app (`/assets/cards/…`), donc pas de souci de CORS ni de canvas « tainted ».
5. Les **polices** (Fraunces 700, Fraunces 500 italique, Barlow Condensed 500) sont déjà hébergées par l'app. On attend `document.fonts.load()` avant de dessiner. Le texte est dessiné avec `fillText`, **jamais à l'intérieur d'un SVG** : un SVG transformé en image ne charge pas de police externe.
6. La finition **holographique** réutilise la texture précalculée `src/assets/holo-preview.webp` (la même que les miniatures), plus un reflet blanc fixe.
7. Le grain papier (`--paper`, un `feTurbulence`) est imité par un bruit généré une fois, avec une graine fixe, dans un petit canvas de 220 × 220 utilisé comme motif.
8. L'export se fait avec `canvas.toBlob()`, puis on crée un `File`.

**Repères de la disposition Fusion (illustration Classique)**, en unités de base :

| Élément | x | y | largeur | hauteur | Remarque |
|---|---|---|---|---|---|
| Carte | 0 | 0 | 326 | 540 | rayon 20, découpe arrondie |
| Bandeau du nom | 15 | 15 | 296 | 34.5 | rayon 8 ; titre Fraunces 700 15 px, interligne 1.5 |
| Illustration | 15 | 55.5 | 296 | 313.2 | 58 % de 540 ; bordure de 2 px ; `object-fit: cover`, position issue du catalogue |
| Encart de texte | 15 | 374.7 | 296 | 131.55 | Fraunces 500 italique 13 px, interligne 19.5 px, marges 11 / 13 |
| Mention « rareté · finition » | centrée | 511 | — | 12.75 | Barlow Condensed 500, 8.5 px, majuscules, espacement 0.22 em |
| Cadre | bord | — | — | 6 | anneau entre le rectangle arrondi extérieur (r 20) et l'intérieur (r 14) |

La disposition **Gundam** (Full Art) met l'illustration en pleine carte. Ses pastilles hexagonales de 32 × 36 sont en (16, 16) et (16, 62). L'encart du bas est calé sur la hauteur du texte, à 12 px du bas. La plaque du nom est 6 px au-dessus de l'encart. Le détail est dans `drawGundamText()` de la démo.

**Pièges déjà résolus dans le code de référence** :
- `ctx.letterSpacing` n'existe pas partout : l'espacement des lettres est appliqué caractère par caractère.
- Les ombres du canvas (`shadowBlur`, `shadowOffsetY`) ne suivent **pas** `ctx.scale` : il faut les multiplier par `S`.
- `ctx.filter` est ignoré par Safari. Le léger contraste en plus de la finition Alternative y est donc absent. C'est acceptable.
- Le centrage vertical du texte utilise `measureText().fontBoundingBoxAscent / Descent`, avec une valeur de secours.

### 3.3 Les deux formats

| Format | Taille | Type | Contenu |
|---|---|---|---|
| **Story** | 1080 × 1920 | JPEG qualité 0.92 (≈ 250 Ko) | Carte de 740 px de large sur un fond sombre, avec ombre portée et la signature « BIZAVE TCG » en bas |
| **Carte** | 978 × 1620 (×3) | PNG transparent (≈ 2 à 3 Mo) | La carte seule, coins transparents |

> Amélioration recommandée pour rester cohérent avec D : en format Story, remplacer le fond actuel (dégradé radial teinté par la rareté) par l'**illustration floutée**, comme le fond de la vue D. On dessine l'illustration en `cover` sur 1080 × 1920 avec `ctx.filter = 'blur(60px) brightness(.45) saturate(1.4)'`. Comme Safari ignore `ctx.filter`, il faut un repli : dessiner l'image réduite à environ 1/16 puis l'agrandir avec lissage, ce qui donne un flou équivalent.

### 3.4 Le flux de partage (la partie qui rend iOS fiable)

1. **À l'ouverture de D, et à chaque changement de carte**, lancer la génération de l'image de la carte affichée, en arrière-plan. Garder le résultat en cache par `variantKey + format`.
2. Le bouton **Partager** :
   - si l'image est prête : appeler **directement** `navigator.share({ files: [file], title })`, sans aucun `await` avant ;
   - si elle n'est pas encore prête (cas rare, la génération prend environ 90 ms) : montrer un indicateur de chargement sur le bouton, sans appeler `share`.
3. Avant d'appeler `share`, vérifier `navigator.canShare?.({ files: [file] })`.
4. `AbortError` veut dire que l'utilisateur a fermé la feuille de partage : rester silencieux. Toute autre erreur : message court.
5. **Repli** si le partage de fichiers n'est pas disponible (ordinateur sans Web Share, iframe, contexte non sécurisé) : afficher l'image dans la feuille d'actions de D, avec « Appui long pour l'enregistrer » et un bouton **Télécharger**.
6. Libérer les `URL.createObjectURL` à la fermeture de la vue.

### 3.5 Implémentation proposée dans l'app

```
src/share/
  cardCanvas.ts         // drawCard(ctx, S, card, finish, artVariant, assets) — port TS de la démo
  cardCanvas.palette.ts // couleurs de rareté et tracés Path2D, source unique partagée avec le CSS si possible
  renderShareImage.ts   // renderShareImage(card, definition, format) → Promise<File>
  useShareImage.ts      // hook : pré-génère, met en cache, expose { file, ready, share() }
```

```ts
// renderShareImage.ts — signature cible
export type ShareFormat = 'story' | 'card'
export async function renderShareImage(card: Card, definition: CardDefinition, format: ShareFormat): Promise<File> {
  const [art, holo] = await Promise.all([
    loadImage(definition.artwork[card.artVariant]), // même domaine : pas de crossOrigin nécessaire
    loadImage(holoPreviewTexture),                  // import Vite de src/assets/holo-preview.webp
    document.fonts.load('700 15px Fraunces'),
    document.fonts.load('italic 500 13px Fraunces'),
    document.fonts.load('500 9px "Barlow Condensed"'),
  ])
  // … même logique que renderShareImage() de bizave-partage-demo.html
}

// useShareImage.ts — idée générale
export function useShareImage(card: Card | null, definition: CardDefinition | null) {
  const { shareFormat } = useSettings()
  // useEffect : lance renderShareImage dès que card change ; cache Map<`${variantKey(card)}|${shareFormat}`, Promise<File>>
  // share() : synchrone jusqu'à navigator.share — aucun await avant l'appel
}
```

Tests à prévoir :
- **Unitaires (Vitest) :** la palette correspond aux valeurs de `cards-reference.css` (lire le CSS et comparer), et le format choisi dans les réglages est bien respecté.
- **De bout en bout (Playwright) :** générer l'image pour une carte de chaque finition et de chaque disposition, puis la comparer à une capture de référence avec une tolérance (le grain papier est approximé).
- **Manuel sur iPhone réel :** le partage, l'enregistrement dans Photos et l'envoi via LINE ou Messages.

---

## 4. Nouveaux réglages dans Options

Deux options à ajouter dans `Preferences` (`src/settings/preferences.ts`), avec analyse défensive comme les autres champs :

```ts
export type ActionBarMode = 'four' | 'two'
export type ShareFormat = 'story' | 'card'
export type Preferences = { /* existant… */ actionBar: ActionBarMode; shareFormat: ShareFormat }
export const DEFAULT_PREFERENCES = { /* … */ actionBar: 'four', shareFormat: 'story' }
// parsePreferences :
//   actionBar:   data.actionBar === 'two' ? 'two' : 'four',
//   shareFormat: data.shareFormat === 'card' ? 'card' : 'story',
```

Dans `SettingsPage.tsx`, section **Collection** ou nouvelle section **Aperçu des cartes**, avec le même sélecteur segmenté que **Thème** :

| Libellé | Choix | Aide affichée dessous |
|---|---|---|
| Barre d'actions | **4 actions** · 2 actions | « 2 actions : Favori et Partager passent en haut de l'aperçu. » |
| Image de partage | **Story** · Carte | « Story : format vertical pour les réseaux. Carte : la carte seule, fond transparent. » |

Ajouter les tests de `parsePreferences` pour les valeurs inconnues ou absentes, qui doivent revenir aux valeurs par défaut.

---

## 5. Cohérence du reste de l'app avec D

D est une vue immersive et sombre. **On ne passe pas toute l'app dans ce style** : les pages gardent leur ton éditorial (titres à empattement, traits fins, accent rose). On réutilise seulement **quatre éléments** de D aux bons endroits :

1. la **forme d'îlot vitré** de la barre d'actions ;
2. les **flèches rondes vitrées** ;
3. les **points de finition** ;
4. la **feuille de confirmation**.

Par ordre d'impact :

| Écran | Changement proposé | Effort |
|---|---|---|
| **Barre de navigation du bas** (`.mobile-nav` : Boosters, Collection, Atelier, Amis) | Devient un **îlot flottant** arrondi et vitré, de la même forme que la barre de D. Le contenu défile derrière en flou. Le trait rose au-dessus de l'onglet actif disparaît : la couleur de l'icône et du libellé suffit. La barre est masquée quand D est ouverte. | Faible |
| **Ouverture d'un booster** | Pendant la révélation, le fond prend le **flou de l'illustration** de la carte révélée, comme D. Les traits de progression « 5 / 5 » deviennent des **points qui se colorent selon la finition** révélée : un point irisé qui apparaît crée un petit moment de suspense. | Moyen |
| **Récap « Dans votre collection »** | Les légendes texte « Holographique · Full Art » sont remplacées par les points de finition. **Toucher une carte ouvre D** sur toutes les cartes du booster. | Moyen |
| **Boosters et Boutique** | Les chevrons du carrousel de boosters deviennent les flèches rondes vitrées de D, et ses points roses prennent le style des points de D. Le bouton « Acheter · 70 » prend la forme du bouton Donner de la barre à 2 actions. | Faible |
| **Collection** | Grille et filtres inchangés. Sous une pile, la légende « 3 variantes » est remplacée par une **rangée de points de finition**. | Faible |
| **Atelier** | Presque rien : la liste avec cases à cocher est efficace. La fenêtre de confirmation du recyclage en masse prend le style de la feuille de D. | Faible |
| **Amis** | Rien à changer pour D. (La « carte reçue » pourra plus tard s'ouvrir dans D, avec seulement Favori et Partager.) | — |
| **Options** | Les deux réglages de la section 4. | Faible |

---

## 6. Plan d'implémentation conseillé

1. **Réglages** (section 4) : types, analyse, tests, interface Options. Rien de visible ailleurs.
2. **Module de partage** (section 3) : port TS de `drawCard`, `renderShareImage`, `useShareImage`, tests. Testable seul.
3. **`CardViewer` (D)** :
   1. la structure : fond flou, barre du haut, carrousel, points, barre d'actions ;
   2. le branchement des actions existantes (favori, Donner, recyclage avec confirmation) ;
   3. le partage, avec la pré-génération ;
   4. le responsive (voisines visibles à partir de 700 px) ;
   5. l'accessibilité et le mouvement réduit.
4. **Remplacer** dans `CollectionPage` l'ancienne pile et l'ancien aperçu par `CardViewer`. Réécrire `tests/stack-return.spec.ts` en conséquence.
5. **Cohérence de l'app** (section 5), dans l'ordre du tableau.

**Critères d'acceptation de D :**
- Depuis la Collection, la grande carte s'affiche en **un seul toucher**, que ce soit une pile ou une carte seule.
- Aucun défilement vertical dans D sur un téléphone de 390 × 844, une tablette de 820 × 1180, une tablette paysage de 1180 × 820 et un ordinateur de 1440 × 900.
- Les flèches restent alignées sur le centre vertical de la carte et collées à ses bords, à toutes les tailles.
- La confirmation de recyclage a exactement la largeur de la barre d'actions, dans les deux modes.
- En partage, la feuille native iOS s'ouvre du premier coup, sans `NotAllowedError`, pour les deux formats.
- Avec la réduction des animations activée, aucune animation ne tourne.

---

## 7. Points ouverts, à ne pas trancher sans le porteur du projet

- **Vocabulaire :** D dit « Donner », le reste de l'app dit « Envoyer » (page « Envoyer une carte », onglet « Envois »). Il faut un seul mot partout.
- **Icône de Recycler :** diamant dans D, flèches en boucle dans l'Atelier et la navigation.
- **Pastille `×N` :** elle est gardée en mode doublons regroupés. Le porteur du projet a demandé de ne pas y toucher pour l'instant.
- **Exemplaire visé en mode regroupé :** l'app prend aujourd'hui `copies.at(-1)`. Le porteur du projet a demandé de ne pas y toucher pour l'instant.
