# Jeu de collection et d'ouverture de boosters — Dossier de conception pour Codex

> **Statut :** spécification fonctionnelle et technique V1, faisant seule autorité pour l’implémentation.  
> **Mise à jour :** 23 octobre 2026 — profils de finition 81/15/4, Full Art 8 %, catalogue 110 modèles.  
> **Destinataire :** Codex, pour créer puis faire évoluer le projet.  
> **Produit :** application web statique privée, à partager avec des membres de la famille et des amis.  
> **Référence conceptuelle uniquement :** https://www.livarium.fr — reprendre l'idée générale d'ouvertures régulières de boosters et de collection, **sans copier le site, ses graphismes, ses textes, ses ressources ni sa direction artistique**.

## 0. Consigne générale à Codex

Construire une application réellement fonctionnelle et maintenable, pas seulement une landing page ni une maquette cliquable. Respecter les décisions ci-dessous. Les règles chiffrées ci-dessous sont les paramètres de référence de la V1. Centraliser les configurations du jeu ; ne jamais substituer des taux, tarifs ou mécaniques implicites. Les animations sont un habillage : les transactions IndexedDB font autorité.

Aucun nom, logo ou visuel appartenant au site de référence externe ne doit être repris. « Éclats » désigne un booster configurable, pas nécessairement l’application ; « Nocturne » et « Floraison » sont des données d’exemple remplaçables, avec des identités visuelles distinctes.

## 1. Vision et limites du produit

- Jeu de cartes virtuelles à collectionner, destiné à la famille et à des amis ; usage privé et convivial.
- Recharge **d’un booster gratuit toutes les dix minutes**, sur **un stock global par installation de cinq ouvertures gratuites maximum**, partagé entre tous les boosters gratuits. La recharge continue **hors jeu** à partir des horodatages persistés ; au retour après 50 minutes ou davantage, un stock vide est revenu à **5/5**, jamais au-delà. Une ouverture consomme une unité du stock, **sans réinitialiser une recharge déjà en cours**. Voir §2.6 (règle prioritaire).
- Plusieurs boosters/collections, chacun doté d'une identité visuelle, d'un contenu et d'un éventuel mode d'accès.
- Certains boosters sont **accessibles exclusivement contre des fragments** gagnés en recyclant les cartes ; **pas d'argent réel**. **Économie V1 :** recyclage de base `1/3/7/12/19` par rareté, multiplicateurs de finition brillante `×2,3` / alternative `×3,2`, multiplicateur Full Art `×1,9`, avec **un seul arrondi inférieur en fin de produit** ; prix de référence **60 fragments** par ouverture spéciale, configurable par booster.
- Les boosters payés en fragments peuvent contenir **uniquement leurs cartes exclusives**, **certaines cartes des boosters gratuits**, ou un **mélange** : cela se définit **dans les fichiers de configuration** pour chaque booster, pas dans des conditions codées en dur.
- Chaque modèle de carte a **six variantes obligatoires** : illustration standard ou Full Art, chacune avec finition normale, brillante ou alternative. Le Full Art est une dimension indépendante tirée à **8 %** ; la rareté du modèle ne change jamais.
- Découverte progressive : **aucun catalogue des cartes jamais obtenues**. Pas de silhouettes, cases « ??? », fiches verrouillées, pourcentage du set révélant les manquantes ou aperçu détaillé des cartes inconnues.
- Aucun compte, aucune authentification, aucun serveur applicatif, aucune sauvegarde déportée, aucun transfert de sauvegarde par clé ou code dans la V1. Les échanges de cartes entre amis par codes chiffrés et signés sont inclus, avec carnet de contacts cryptographiques local et registre antirejeu IndexedDB (voir §9).
- Sauvegarde sur **l'appareil/le navigateur et l'origine web** uniquement. Préparer les schémas de données pour une éventuelle fonction future d'import/export sans la développer maintenant.
- Site lisible et élégant, sans textes superflus (ne **pas** afficher des slogans techniques tels que « 100 % fictif », « monnaie virtuelle only », une explication de l'absence de backend, etc.). L'interface doit parler comme un jeu, pas comme une notice.
- Build React/Vite distribué statiquement via **Firebase Hosting** ; Firebase Hosting est uniquement l'hébergement des assets.

### Hors périmètre V1

Authentification, backend, base de données distante, synchro multiappareil, **échanges de cartes en temps réel ou livraison automatique**, achats réels, marketplace, leaderboard compétitif, catalogue des cartes inconnues, codes de restauration, mécanique de gacha pity/garantie non validée, publicité, analytics distants, administration en ligne et éditeur de collections intégré au site. **Ne pas confondre avec les transferts manuels chiffrés et signés entre amis, qui sont bien inclus dans la V1.**

## 2. Règles de gameplay

### 2.1 Tirage de rareté — sur chaque carte

| Rareté | Probabilité | Couleur indicative |
|---|---:|---|
| Commun | **57 %** | gris |
| Peu commun | **24 %** | vert |
| Rare | **12 %** | bleu |
| Épique | **5 %** | violet |
| Légendaire | **2 %** | or |
| **Total** | **100 %** | |

**Profil obligatoire de la V1 : `57 / 24 / 12 / 5 / 2`.** Centraliser les poids dans une configuration typée ; vérifier que leur somme vaut 100 au démarrage et dans les tests. Ces taux s'appliquent à tous les boosters, y compris ceux payés en fragments ; aucun bonus de rareté implicite ni système de garantie. L'architecture permet de définir ultérieurement un profil explicite par booster, sans en activer un dans la V1.

```ts
// Taux V1 — pourcentages par tirage individuel.
export const DEFAULT_RARITY_RATES = {
  common: 57,
  uncommon: 24,
  rare: 12,
  epic: 5,
  legendary: 2,
} as const;
```


### 2.2 Finition et Full Art — deux tirages supplémentaires indépendants

Chaque carte tirée fait l'objet de **trois tirages indépendants** : (1) rareté du modèle, (2) finition, (3) variante d'illustration. La rareté est une propriété fixe du `CardDefinition`, **pas** de sa finition ni de sa variante d'illustration. Aucun pity ni règle de garantie.

**Finitions (une carte)** :

| Finition | Taux | Présentation |
|---|---:|---|
| Normale / sans effet (`normal`) | **81 %** | carte sobre, aucun reflet foil |
| Brillante (`glossy`) | **15 %** | reflets/foil réagissant délicatement au mouvement |
| Alternative (`alternative`) | **4 %** | encadrement noir, titres et détails dorés, reflets dorés |
| **Total** | **100 %** | |

**Variante d'illustration (une carte)** :

| Illustration | Taux | Présentation |
|---|---:|---|
| Standard (`standard`) | **92 %** | illustration dans la zone prévue de la carte |
| Full Art (`fullArt`) | **8 %** | illustration dédiée couvrant toute la surface de la carte, informations lisibles en superposition |
| **Total** | **100 %** | |

**Chaque modèle doit posséder exactement les six possibilités** : standard normale, standard brillante, standard alternative, Full Art normale, Full Art brillante et Full Art alternative. Deux illustrations par modèle (`artwork.standard`, `artwork.fullArt`) sont **obligatoires** ; les finitions sont des effets et styles HTML/CSS/JS appliqués à l'une des deux images. Pas de substitution d'une Full Art manquante, pas de « reroll » ni de modulation de son taux : validation du catalogue dès le chargement. Une Full Art ne change **jamais** de `cardId` ni de rareté.

**Probabilités de présence dans un booster de cinq cartes indépendantes** :

| Événement | Calcul | Probabilité par booster |
|---|---|---:|
| Au moins une brillante | `1 - 0.85^5` | **55,63 %** |
| Au moins une alternative | `1 - 0.96^5` | **18,46 %** |
| Au moins une finition non normale | `1 - 0.81^5` | **65,13 %** |
| Cinq finitions normales | `0.81^5` | **34,87 %** |
| Au moins une Full Art (toute finition) | `1 - 0.92^5` | **34,09 %** |

Les événements « brillante », « alternative » et « Full Art » peuvent se produire simultanément dans un même booster, sur différentes cartes ou sur une même carte pour Full Art + finition. **Ne pas additionner** les chances de présence par booster.

```ts
export const DEFAULT_FINISH_RATES = {
  normal: 81,
  glossy: 15,
  alternative: 4,
} as const;

export const DEFAULT_ART_VARIANT_RATES = {
  standard: 92,
  fullArt: 8,
} as const;
```

### 2.3 Probabilités combinées des trois tirages

La probabilité d'une combinaison est `P(rareté) × P(finition) × P(variante d'illustration)` ; la carte modèle est ensuite choisie dans le sous-pool de la rareté. Il existe **30 combinaisons** de catégories (`5 × 3 × 2`) et **six variantes par modèle**.

**Illustration standard (92 %) — probabilités par carte tirée :**

| Rareté | Normale standard (81 %) | Brillante standard (15 %) | Alternative standard (4 %) |
|---|---:|---:|---:|
| Commune (57 %) | 42,4764 % | 7,866 % | 2,0976 % |
| Peu commune (24 %) | 17,8848 % | 3,312 % | 0,8832 % |
| Rare (12 %) | 8,9424 % | 1,656 % | 0,4416 % |
| Épique (5 %) | 3,726 % | 0,69 % | 0,184 % |
| Légendaire (2 %) | 1,4904 % | 0,276 % | 0,0736 % |

**Illustration Full Art (8 %) — probabilités par carte tirée :**

| Rareté | Full Art normale (81 %) | Full Art brillante (15 %) | Full Art alternative (4 %) |
|---|---:|---:|---:|
| Commune (57 %) | 3,6936 % | 0,684 % | 0,1824 % |
| Peu commune (24 %) | 1,5552 % | 0,288 % | 0,0768 % |
| Rare (12 %) | 0,7776 % | 0,144 % | 0,0384 % |
| Épique (5 %) | 0,324 % | 0,06 % | 0,016 % |
| Légendaire (2 %) | 0,1296 % | 0,024 % | **0,0064 %** |

Toutes ces probabilités sont les **taux pour n'importe quel modèle de la rareté**, pas pour un modèle particulier : par défaut, les modèles sont équiprobables dans leur rareté si leurs `weight` sont égaux. Les deux matrices réunies totalisent **100 %**. Les 110 modèles nécessitent **220 illustrations originales** (deux par modèle) ; leurs effets CSS produisent les **660 variantes** collectionnables.

**Référence rareté extrême** : une **légendaire Full Art alternative** = `2 % × 8 % × 4 % = 0,0064 %` par carte, **1 sur 15 625 cartes** (toutes légendaires confondues). Dans cinq tirages indépendants, la probabilité d'en obtenir au moins une est `1 - (1 - 0.000064)^5 ≈ 0,0319959 %`, soit environ **1 booster sur 3 125** en moyenne. Une légendaire alternative **toutes illustrations confondues** a `2 % × 4 % = 0,08 %` par carte, soit 1 sur 1 250. Ce sont des espérances / probabilités, jamais des garanties.

```ts
// Trois tirages indépendants par carte :
// Rarity 57/24/12/5/2, finish 81/15/4, artVariant 92/8.
// P(legendary + alternative + fullArt) = .02 * .04 * .08 = .000064.
```

### 2.4 Nombre de cartes et tirage de boosters

**Cinq cartes par booster** dans la V1 (`cardsPerPack: 5` configurable). Chaque exemplaire reçoit son propre `dropId` UUID v4, même en cas de doublons.

**Catalogue actuel : 110 modèles** :

| Rareté fixe du modèle | Modèles | Variantes par modèle | Variantes distinctes possibles |
|---|---:|---:|---:|
| Commune | 39 | 6 | 234 |
| Peu commune | 24 | 6 | 144 |
| Rare | 21 | 6 | 126 |
| Épique | 16 | 6 | 96 |
| Légendaire | 10 | 6 | 60 |
| **Total** | **110** | **6** | **660** |

Ces nombres renseignent le catalogue courant, **pas** une limite codée dans le moteur et **pas** une confirmation de livraison des assets. Valider que le catalogue configuré contient ces modèles lorsque ces 110 définitions seront intégrées ; toute nouvelle carte devra disposer de ses deux illustrations, standard et Full Art.

Tirer chaque carte **indépendamment avec remise**, sans garantie de rareté, de finition ni de Full Art. Cinq exemplaires identiques peuvent apparaître dans le même booster, avec cinq `dropId` différents. En cas de catégorie vide dans un pool alors que son taux est positif : **erreur explicite de configuration**, jamais reroll silencieux.

**Probabilités dans cinq tirages indépendants** :

| Événement (au moins une carte) | Calcul | Chance par booster |
|---|---|---:|
| Rare exactement | `1 - 0.88^5` | **47,23 %** |
| Rare ou mieux | `1 - 0.81^5` | **65,13 %** |
| Épique exactement | `1 - 0.95^5` | **22,62 %** |
| Épique ou mieux | `1 - 0.93^5` | **30,43 %** |
| Légendaire | `1 - 0.98^5` | **9,61 %** |
| Brillante, toute rareté / illustration | `1 - 0.85^5` | **55,63 %** |
| Alternative, toute rareté / illustration | `1 - 0.96^5` | **18,46 %** |
| Full Art, toute rareté / finition | `1 - 0.92^5` | **34,09 %** |
| Légendaire Full Art alternative | `1 - (1 - 0.000064)^5` | **0,0319959 %** |

**Les probabilités par booster ne s'additionnent pas.** `crypto.getRandomValues()` et une abstraction RNG injectable sont recommandés ; une source aléatoire locale ne protège pas d'un client intentionnellement modifié, ce qui est accepté dans ce jeu privé.

### 2.5 Modes d'accès aux boosters

- **Gratuit** : ouverture possible dès que le **stock commun `freePackStock` est supérieur à zéro**. Une ouverture consomme **un** crédit de ce stock (capacité `5`), rechargé à raison de **1 par 600 000 ms** même lorsque le site est fermé. Appliquer l’algorithme du §2.6.
- **Fragments** : ouverture possible dès que `balance >= costFragments`. Le prix est débité atomiquement à l'ouverture. **Ne consomme pas le délai gratuit**, ne le réinitialise pas et ne l'attend pas.
- Une collection exclusive est **impossible à obtenir par une ouverture gratuite** sauf si son pool la référence explicitement. « Exclusif au booster en fragments » n'implique **pas forcément** que toutes les cartes de ce booster sont exclusives : le pool peut mélanger cartes propres et cartes déjà accessibles autrement.
- **Aucun argent réel**, aucun paiement, aucun achat d'une monnaie auprès du site.
- Un booster premium peut réutiliser tout ou partie des cartes d'autres collections selon sa **liste de pools composables** ou ses `cardIds` directs ; pas de logique codée à partir du nom « premium ».

### 2.6 Stock gratuit rechargeable hors jeu

**Règle de la V1 :**

- **Capacité maximum : 5 boosters gratuits** (`FREE_PACK_CAPACITY = 5`). Il s'agit de **cinq droits d'ouverture**, pas de cinq boosters matériels à ajouter à la collection ni de cinq cartes. Chaque droit ouvre **un paquet** de `cardsPerPack` cartes.
- **Une unité de stock est recréditée toutes les 10 minutes** (`FREE_PACK_RECHARGE_MS = 600_000`), pour le joueur dans son ensemble. Tous les boosters `access.type === 'free'` puisent dans **le même stock** ; aucun quota ou minuterie séparée par collection.
- **Hors jeu et navigateur fermé : la recharge continue mathématiquement.** Le navigateur n'a pas besoin de tourner en arrière-plan ; à chaque ouverture du site, retour au premier plan, affichage actualisé ou tentative de dépense, le moteur calcule le nombre d'échéances écoulées depuis le prochain crédit attendu en utilisant `Date.now()` et les horodatages persistés dans IndexedDB.
- **Plafond strict 5/5** : tout temps écoulé alors que le stock a atteint 5 est perdu ; il n'existe **aucune réserve cachée** au-delà de cinq, aucun crédit rétroactif après avoir vidé un stock resté plein des jours. Le stock plein est représenté par `nextFreePackAt = null` : **le prochain délai de dix minutes commence lorsqu'une première place se libère**.
- **Quand le stock est partiellement rempli**, les ouvertures consomment une unité **sans décaler la prochaine échéance**. Exemple : stock `2/5`, prochaine recharge dans 3 minutes ; ouvrir un pack donne `1/5`, prochaine recharge **toujours dans 3 minutes**. Lorsque le joueur dépense depuis `5/5`, le stock passe à `4/5` et le premier crédit suivant arrivera **10 minutes après cette dépense**.
- **À la création d’une installation neuve** : stock initial `5/5`, `nextFreePackAt = null`, pour pouvoir ouvrir immédiatement. `INITIAL_FREE_PACK_STOCK = 5` est une valeur de configuration V1 modifiable ; si elle est abaissée, initialiser correctement l’échéance de la première recharge.
- Un booster acheté avec des fragments ne consomme aucun crédit gratuit, ne bloque pas et ne relance pas la recharge. Une ouverture gratuite fait gagner les cartes immédiatement après commit, même si l'animation n'est pas terminée.
- **Exemples depuis un stock vide `0/5` avec une échéance dans 10 minutes :** 9 min → `0/5` ; 10 min → `1/5` ; 25 min → `2/5` avec 5 min restantes avant le suivant ; 50 min → `5/5` ; 3 jours → **`5/5`**, jamais 432 boosters. Si le stock était `3/5` avant une absence de 3 jours, retour également à `5/5`.
- **Affichage UI** : montrer `X/5 boosters disponibles` et, uniquement si `X < 5`, le temps restant avant la **prochaine** unité. À `5/5`, afficher « Stock plein » ou équivalent et masquer le compte à rebours. La minuterie à l'écran est une **projection** ; `setInterval` peut rafraîchir l'affichage, mais ne constitue jamais la source de vérité. Recalculer sur `visibilitychange`/focus et avant toute transaction.

**État persistant** dans `PlayerStateRow` : `freePackStock: number` et `nextFreePackAt: number | null` (timestamp Unix en **millisecondes**). Utiliser des horodatages UTC absolus en ms (sans dépendance au fuseau horaire ou changement été/hiver). Le jeu reste basé sur l'horloge locale de l'appareil : aucune garantie anti-manipulation du temps sans backend, acceptable pour ce projet familial.

Algorithme TypeScript de référence (fonction pure à tester ; son état doit être lu/écrit **atomiquement** dans la transaction de dépense) :

```ts
export const FREE_PACK_CAPACITY = 5;
export const FREE_PACK_RECHARGE_MS = 10 * 60 * 1000;
export const INITIAL_FREE_PACK_STOCK = 5;

export type FreePackState = {
  freePackStock: number;          // entier entre 0 et 5
  nextFreePackAt: number | null;  // null si et seulement si stock plein
};

export function settleFreePackRecharge(
  state: FreePackState,
  now: number,
): FreePackState {
  const { freePackStock, nextFreePackAt } = state;
  if (!Number.isInteger(freePackStock) ||
      freePackStock < 0 || freePackStock > FREE_PACK_CAPACITY) {
    throw new Error('Stock gratuit invalide');
  }
  if (freePackStock === FREE_PACK_CAPACITY) {
    return { freePackStock: FREE_PACK_CAPACITY, nextFreePackAt: null };
  }
  if (nextFreePackAt === null || !Number.isFinite(nextFreePackAt)) {
    throw new Error('Échéance de recharge manquante');
  }
  const earned = Math.max(
    0,
    Math.floor((now - nextFreePackAt) / FREE_PACK_RECHARGE_MS) + 1,
  );
  if (earned === 0) return state;
  const updated = Math.min(FREE_PACK_CAPACITY, freePackStock + earned);
  return {
    freePackStock: updated,
    nextFreePackAt: updated === FREE_PACK_CAPACITY
      ? null
      : nextFreePackAt + earned * FREE_PACK_RECHARGE_MS,
  };
}

export function spendFreePack(
  rawState: FreePackState,
  now: number,
): FreePackState {
  const state = settleFreePackRecharge(rawState, now);
  if (state.freePackStock === 0) throw new Error('Stock gratuit épuisé');
  return {
    freePackStock: state.freePackStock - 1,
    nextFreePackAt: state.freePackStock === FREE_PACK_CAPACITY
      ? now + FREE_PACK_RECHARGE_MS
      : state.nextFreePackAt,
  };
}
```

**Invariants obligatoires** : `0 ≤ freePackStock ≤ 5` ; `stock === 5 ⇔ nextFreePackAt === null` ; le stock ne peut être consommé qu'une fois par transaction, même avec deux onglets ; une recharge n'ajoute jamais plus de cinq crédits ; l'échéance est conservée lors d'une dépense avec un stock partiel. Éviter de persister des rafraîchissements inutiles à chaque rendu de React ; persister à l'ouverture/reprise et lors des opérations transactionnelles, avec invalidation/actualisation entre onglets si nécessaire.

### 2.7 Recyclage / fragments

Les valeurs de base par rareté sont **1 / 3 / 7 / 12 / 19** fragments. La finition et la variante d'illustration modifient **indépendamment** la valeur de recyclage, sans changer la rareté ou les chances de tirage :

- Finition normale `×1`, brillante `×2,3`, alternative `×3,2` ;
- Illustration standard `×1`, Full Art `×1,9` ;
- **Un seul arrondi à l'entier inférieur après la multiplication des trois facteurs**, jamais d'arrondi intermédiaire.

`fragments = floor(baseRarity × finishMultiplier × artMultiplier)`.

**Grille exhaustive des 30 valeurs (une carte recyclée)** :

| Rareté | Standard normale | Standard brillante | Standard alternative | Full Art normale | Full Art brillante | Full Art alternative |
|---|---:|---:|---:|---:|---:|---:|
| Commune | **1** | **2** | **3** | **1** | **4** | **6** |
| Peu commune | **3** | **6** | **9** | **5** | **13** | **18** |
| Rare | **7** | **16** | **22** | **13** | **30** | **42** |
| Épique | **12** | **27** | **38** | **22** | **52** | **72** |
| Légendaire | **19** | **43** | **60** | **36** | **83** | **115** |

La commune Full Art normale vaut **1 fragment** : `floor(1 × 1 × 1,9) = 1`. Une légendaire Full Art alternative vaut **115 fragments** : `floor(19 × 3,2 × 1,9) = 115`. Une Full Art brillante rare vaut **30 fragments** : il faut calculer `floor(7 × 2,3 × 1,9) = 30` en une seule étape. **Ne pas arrondir `7 × 2,3` avant d’appliquer `×1,9`**, même lorsque les deux calculs tombent par hasard sur la même valeur.

```ts
export const RECYCLE_BASE_FRAGMENTS = {
  common: 1,
  uncommon: 3,
  rare: 7,
  epic: 12,
  legendary: 19,
} as const;

// Multiplicateurs stockés comme entiers, unité = un dixième.
export const FINISH_MULTIPLIER_TENTHS = {
  normal: 10,
  glossy: 23,
  alternative: 32,
} as const;
export const ART_MULTIPLIER_TENTHS = {
  standard: 10,
  fullArt: 19,
} as const;

type Rarity = keyof typeof RECYCLE_BASE_FRAGMENTS;
type Finish = keyof typeof FINISH_MULTIPLIER_TENTHS;
type ArtVariant = keyof typeof ART_MULTIPLIER_TENTHS;

export function getRecycleFragments(
  rarity: Rarity,
  finish: Finish,
  artVariant: ArtVariant,
): number {
  // Pas d'erreur flottante : un seul floor final, après les 2 multiplicateurs.
  return Math.floor(
    RECYCLE_BASE_FRAGMENTS[rarity] *
    FINISH_MULTIPLIER_TENTHS[finish] *
    ART_MULTIPLIER_TENTHS[artVariant] / 100,
  );
}

export const DEFAULT_SPECIAL_BOOSTER_PRICE = 60;
```

**Prix de référence des boosters spéciaux : 60 fragments par ouverture**, configurable **individuellement** par `access.price`. Ils ne consomment jamais les crédits gratuits et peuvent avoir des pools exclusifs, partagés ou mixtes.

**Économie calculée avec les trois tirages indépendants 57/24/12/5/2, 81/15/4, 92/8 :**

- **Valeur moyenne par carte intégralement recyclée : 4,149816 fragments** ; **20,74908 fragments pour un booster de cinq cartes intégralement recyclé**.
- Un booster spécial de 60 fragments équivaut en valeur moyenne à `60 / 20,74908 ≈ 2,89` boosters gratuits entièrement recyclés ; **ce n'est pas** le nombre moyen exact de boosters nécessaires pour atteindre 60 fragments.
- Probabilité qu'un seul booster (ses cinq cartes recyclées) rapporte **au moins 60 fragments** : **≈ 2,00 %**.
- Probabilité d'avoir atteint **au moins 60 fragments** après le recyclage intégral de `2 / 3 / 4 / 5` boosters gratuits, sans dépense : **15,34 % / 47,57 % / 80,88 % / 96,35 %**.
- Pour les **110 modèles et leurs 660 variantes**, la valeur de recyclage totale d'un exemplaire de chaque variante est **11 817 fragments** (en supposant qu'ils existent tous dans la collection, sans doublon).
- Un booster spécial à 60 fragments dont les cinq cartes sont intégralement recyclées **ne rembourse pas son prix en moyenne** ; éviter une boucle de boosters payés intrinsèquement rentable selon leur pool et taux effectifs.

**Protection des doublons :** une variante est identifiée par le triplet **`(cardId, finish, artVariant)`**. L'action « recycler mes doublons » ne sélectionne automatiquement que les exemplaires au-delà du premier de ce triplet ; conserver par défaut le dernier exemplaire de **chaque variante**, pas seulement un exemplaire de chaque modèle. Recycler volontairement le dernier exige une confirmation explicite. Afficher le gain avant validation, puis changer le statut des `dropId`, créditer les fragments et journaliser l'opération dans **une seule transaction IndexedDB**. Aucun fragment négatif.

**Invariance pendant les échanges** : les fragments découlent de la définition de rareté immuable associée au `cardId`, plus `finish` et `artVariant` de l'exemplaire. Il est interdit de recalculer aléatoirement une finition ou un Full Art lors d'un transfert ou à la réception.

### 2.8 Les cartes jamais découvertes doivent être invisibles

La vue **Collection** affiche par défaut les variantes détenues (`quantity > 0`) et peut proposer un filtre « Déjà découvertes » limité aux variantes **réellement découvertes par l'utilisateur**, même si leur quantité est retombée à zéro. Aucune entrée ne doit être créée pour les cartes jamais tirées. Le moteur peut connaître le catalogue complet en mémoire pour calculer les tirages, mais l'UI ne doit **jamais** l'utiliser pour créer un catalogue des inconnues. Ne pas afficher une liste de silhouettes, des statistiques de type `34/250` si cela révèle un total que l'on souhaite cacher. Chaque variante `(cardId, finish, artVariant)` possède son propre état de découverte : les versions Full Art et standard sont distinctes, tout comme leurs trois finitions.

**Limite assumée :** comme les définitions et ressources sont livrées avec un site statique, un utilisateur techniquement averti peut retrouver les cartes inconnues en inspectant les fichiers téléchargés. L'interface ne les expose pas ; ce n'est **pas** un système de secret serveur.

## 3. Parcours utilisateur

### 3.1 Écran Boosters — écran d'accueil

1. À l'ouverture du site, afficher directement la sélection de boosters ; **pas** de landing page marketing.
2. Afficher les boosters disponibles sans dévoiler leurs cartes inconnues.
3. Le joueur choisit un booster ; sa face avant apparaît en grand, avec **logo central, titre et sous-titre**. Les couleurs et visuels changent selon sa configuration.
4. Une action principale ouvre le booster ou explique discrètement pourquoi l’ouverture n’est pas disponible (**stock gratuit à 0/5**, ou fragments insuffisants). Le joueur voit son **stock gratuit X/5** et le temps restant avant la prochaine recharge, même si le site vient d’être rouvert après plusieurs jours.
5. Ouvrir visuellement le paquet : déchirure de la bordure supérieure, disparition du paquet, apparition du dos de la première carte.
6. Révéler les **cinq cartes une par une** : retournement de carte, rareté, finition et éventuelle illustration Full Art ; appliquer l’habillage noir et doré si la finition alternative est tirée. Une fois le booster ouvert, il est **déjà enregistré** ; l'animation est purement cosmétique.
7. Après la dernière carte, action de retour ou sélection d'un autre booster. Le timer gratuit est visible si concerné.

Le design doit permettre de passer d’un booster à l’autre sans créer de composant spécifique. Prévoir un sélecteur adapté à la taille d’écran et un panneau d’informations latéral sur desktop.

### 3.2 Écran Collection

- Grille de cartes **découvertes seulement**.
- Filtrer/ordonner par rareté, finition, **Full Art / standard**, origine/collection et nombre d'exemplaires.
- Nom **centré** sous l'image ; description dans un **bloc centré mais texte aligné à gauche**.
- Afficher un indicateur de rareté **discret**, pas d'élément qui masque l'illustration.
- **Carte standard** avec environ **2/3 de surface image et 1/3 pour les infos** ; **Full Art** avec illustration couvrant toute la carte et les informations lisibles en superposition (dégradé/voile discret). Coins arrondis, marges sobres et typographie lisible.
- Ne pas ouvrir de galerie secrète de cartes non obtenues.
- Afficher le nombre d’exemplaires pour chaque **variante de finition ET d’illustration** et proposer le recyclage explicite.
- Ajouter une action « Envoyer » sur un **exemplaire précis** : choisir un ami ayant partagé ses clés, générer le code de transfert et le retrouver dans la boîte d’envoi (voir §9).

### 3.3 Écran Atelier

- Solde de fragments visible dans la navigation ou l'en-tête.
- Liste des cartes présentes dans l'inventaire et estimation du gain en fragments avant validation.
- Recyclage de doublons par défaut ; confirmation pour dernière copie.
- Catalogue des boosters accessibles contre fragments, avec prix et bouton d'achat/ouverture ; cartes inconnues de ces boosters **non affichées**.
- Achat et ouverture font partie d’une transaction locale cohérente, sans perdre les fragments ni dupliquer une carte après refresh.

### 3.4 Échanges et amis

- L’interface principale reste épurée : **Boosters / Collection / Atelier**. Accéder à **Amis et échanges** depuis la Collection (ou une entrée discrète de navigation), sans ajouter un réseau social.
- **Mon code ami** : montrer l’identifiant maison `1234-56-78` et un bouton « Copier mon contact ». Le code de contact contient **UUID + clés publiques de signature et de chiffrement** ; aucune clé privée.
- **Ajouter un ami** : coller son code de contact. L’ajout est **unilatéral, immédiat, sans demande d’acceptation ni retour obligatoire**. Si A partage son code à B, B peut ajouter A sans qu’A ait ajouté B. Dans la pratique, chacun partagera habituellement son code dans l’autre sens.
- **Transférer** : sélectionner un exemplaire et un ami, générer un code textuel de transfert, puis copier ce code pour l’envoyer par la messagerie de son choix. **Pas de QR code**, pas de messagerie interne.
- **Recevoir** : coller un code ; si vérifications positives, ajouter la carte à la collection. Afficher un message clair pour code déjà utilisé, code non destiné au joueur, contact manquant, code invalide ou carte déjà possédée sous le même `dropId`.
- **Boîte d’envoi** : retrouver les codes générés après fermeture/rechargement. Ne jamais afficher « reçu par B » puisqu’il n’existe aucun accusé de réception distant. Voir §9 sur le caractère définitif des envois.
- Un transfert chiffré/signé dans **les deux sens** exige que **chacun ait importé le code de contact de l’autre** : l’ajout reste unilatéral, mais l’échange réciproque des deux codes de contact fournit toutes les clés nécessaires. Sans cela, ne pas prétendre qu’un transfert est possible.


## 4. Design system et charte

### 4.1 Direction générale

**Épurée, sombre, moderne, avec quelques accents lumineux.** Le booster « Éclats » utilise une matière bleu irisé / métallisé, un symbole lumineux et une ambiance nocturne céleste. Tous les assets du projet doivent être originaux. Chaque booster dispose de sa propre identité visuelle configurable.

L'**identité du site** reste neutre ; l'**identité de chaque booster** vient de sa configuration. Trop de reflets et de dégradés dans l'interface ordinaire affaiblissent la valeur des effets spéciaux ; réserver les effets marquants aux cartes et boosters.

| Jeton indicatif | Valeur | Usage |
|---|---|---|
| `--surface-root` | `#0D1524` | fond principal bleu nuit |
| `--surface-elevated` | `#17243A` | panneaux secondaires |
| `--accent` | `#A7F3DF` | boutons et interactions |
| `--text-primary` | `#F1F5F9` | typographie principale |
| `--gold` | `#D9B874` | éléments exceptionnels |

La palette des raretés demeure indépendante de la palette des boosters.

### 4.2 Cartes : structure retenue

- Format **vertical**, ombre légère et coins arrondis.
- Illustration placeholder au départ, puis image de collection réelle.
- **Carte standard :** environ 66,67 % de hauteur pour l’illustration et 33,33 % pour les informations.
- **Carte Full Art :** l’illustration couvre toute la carte, même derrière la zone d’informations (texte toujours accessible et contrasté).
- Titre **centré** juste sous l'image.
- Description contenue dans un bloc étroit centré, **texte `text-align: left`**, jamais justifié ni centré ligne par ligne.
- Indicateur de rareté discret sous le titre ou dans une zone secondaire, sans alourdir.
- Trois styles de finition : normal, brillant, alternatif noir et or.
- **Deux compositions d’illustration obligatoires par modèle** : standard (image environ 2/3) et Full Art (image couvrant toute la carte). En Full Art, superposer les informations sans nuire à la lisibilité ni masquer inutilement le sujet.
- Il existe cinq raretés fixes, trois finitions et deux types d’illustration : **trois axes distincts**, six présentations possibles pour chaque modèle.

### 4.3 Packaging d'un booster : contenu et éléments interdits

**Packaging de référence « Éclats » :** bleu irisé, emblème lumineux, aspect métallisé, bords sertis/crantés, relief, symbole, titre et sous-titre configurables.

**Seuls éléments textuels exigés sur la face avant** :

1. **Logo / symbole** propre au booster.
2. **Titre** — exemple `Éclats`.
3. **Sous-titre** — exemple `Le hasard a ses secrets`.

Ces valeurs sont des **données du booster**, pas des chaînes codées dans le composant. « Éclats » est le titre du booster et « Le hasard a ses secrets » son sous-titre.

**Mentions interdites sur la face avant** :

- `OUVERTURE` ;
- `SÉRIE 001` / `SÉRIE ORIGINE · N°001` ;
- `5 CARTES` / `ÉDITION ORIGINALE` ;
- toute ligne de texte technique ou accessoire.

Le nombre de cartes, le prix, le **stock gratuit X/5 et la prochaine recharge**, les règles d’accès et autres informations utiles **peuvent apparaître dans le panneau UI autour du paquet**, mais **pas sur son emballage**.

### 4.4 Effets

- **Sans effet** : carte standard sans reflets animés.
- **Brillante** : balayage lumineux de surface délicat, matière légèrement irisée, relief interactif discret ; pas d’animation permanente obligatoire, respecte `prefers-reduced-motion`.
- **Alternative** : fond/cadre noir, bordures/accent or, texte/titre en dégradé doré avec éclat/foilage ; l’illustration Full Art reste visible sous les informations. Reflets principalement réactifs à l’interaction, sans mouvement incessant.
- Le paquet lui-même peut être irisé **indépendamment de la finition de la carte contenue**. La finition est une surprise du tirage ; ne pas l'annoncer via le paquet.

### 4.5 Ne pas surcharger

Éviter les slogans inutiles, les sections marketing, les écrans d'onboarding longs, les pictogrammes gratuits et les mentions du type « aucune monnaie réelle » dans l'interface courante. Les informations vraiment nécessaires (fragments, nombre de cartes, stock gratuit et prochaine recharge, disponibilité) doivent rester simples, discrètes et compréhensibles.

## 5. Responsive — quatre contextes majeurs et adaptation grand écran

Construire **mobile-first**, tester aussi l'orientation paysage et les faibles hauteurs. Les coupures ci-dessous sont des **repères techniques ajustables par le résultat visuel**, pas des appareils définis par leur nom.

| Contexte | Repère | Mise en page |
|---|---|---|
| Téléphone | `< 600px` | une colonne ; booster centré ; choix de boosters en carrousel/liste horizontale ; navigation fixe en bas ; action atteignable au pouce |
| Tablette portrait | `600–899px` ou conteneur de largeur comparable | une colonne enrichie, paquet plus grand ; collection en 3 à 4 colonnes selon largeur réelle |
| Tablette paysage | `900–1199px` ou orientation paysage | deux zones : booster à gauche, choix + informations à droite ; limiter la hauteur utile pour ne pas exiger de scroll pendant l'ouverture |
| PC | `≥ 1200px` | trois zones possibles : liste des boosters, zone centrale du paquet, panneau d'informations/actions ; collection en grille adaptée |
| Grand écran | `≥ 1600px` | largeur maximale du contenu d'environ `1400–1500px` ; ne pas agrandir indéfiniment la carte et le booster |

Ne pas dépendre uniquement d'un breakpoint en pixels : utiliser `aspect-ratio`, `min()`, `clamp()`, `max-height`, container queries si utile, et styles sous `@media (max-height: ...)`. Cibles tactiles confortables (au moins ~44 × 44 px), navigation clavier, états focus, contraste et préférence `prefers-reduced-motion`. Tester la vue téléphone, tablette portrait, tablette paysage, desktop et ultralarge en responsive.

## 6. Stack et deployment

**Stack choisie** : React, Vite, TypeScript, Tailwind CSS v4, CSS spécifique pour les cartes/paquets/effets, Dexie.js + IndexedDB, React Router si nécessaire. Pas de backend. Utiliser npm ou l'outil de build préféré de l'équipe, avec scripts `dev`, `build`, `preview`, `test` et `lint`.

**Pourquoi Tailwind :** grilles, layouts, responsive, marges, boutons simples et cohérence typographique. **Pourquoi CSS classique également :** animations foil, déchirure, finitions shiny, dégradés animés et traitements graphiques complexes. Garder le JSX lisible et séparer les styles des animations complexes.

Commandes indicatives (adapter aux versions compatibles au moment du build) :

```bash
npm create vite@latest collection-boosters -- --template react-ts
cd collection-boosters
npm install
npm install dexie dexie-react-hooks react-router-dom
npm install tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

Configurer le plugin Tailwind dans `vite.config.ts` et importer `@import 'tailwindcss';` dans le CSS principal. Vérifier versions et compatibilités ; configurer Tailwind CSS v4 conformément à sa documentation.

**Firebase Hosting** : servir le dossier `dist`. Pour des URLs de pages dédiées, prévoir une réécriture SPA `** → /index.html` dans `firebase.json`. Fichiers de bundles hashés : cache longue durée immutable ; HTML : cache court afin d'éviter les versions obsolètes. Ne pas activer Auth, Firestore, Functions ou Storage pour la V1.

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

## 7. Configuration extensible des boosters

**Objectif :** ajouter, retirer ou modifier un booster **sans changer le code des composants React ni du moteur de tirage**. Chaque booster décrit son design, sa disponibilité, son prix éventuel, sa quantité de cartes, son profil de probabilité et **son pool de cartes**.

### 7.1 Types de domaine recommandés

```ts
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Finish = 'normal' | 'glossy' | 'alternative';
export type ArtVariant = 'standard' | 'fullArt';

export type CardDefinition = {
  id: string;                  // stable, ne jamais renommer après publication
  title: string;
  description: string;
  rarity: Rarity;
  collectionId: string;        // identité éditoriale d'origine
  artwork: {
    standard: string;          // illustration de la carte classique, obligatoire
    fullArt: string;           // illustration Full Art dédiée, obligatoire
  };
  weight?: number;             // poids relatif DANS sa rareté (défaut 1)
};

export type CardPoolSource =
  | { type: 'collection'; collectionId: string; excludeCardIds?: string[]; multiplier?: number }
  | { type: 'cards'; cardIds: string[]; multiplier?: number };

export type BoosterDefinition = {
  id: string;                  // identifiant stable
  title: string;               // titre de la face avant (ex. Éclats)
  subtitle: string;            // sous-titre de la face avant
  artwork: {
    symbol: string;            // URL SVG / PNG ou identifiant de symbole
    backgroundImage?: string;
    colors: {
      primary: string;
      secondary: string;
      shine: string;
      glow: string;
    };
  };
  access:
    | { type: 'free' }
    | { type: 'fragments'; price: number };
  cardsPerPack: number;        // 5 au départ
  sources: CardPoolSource[];   // assemblage de collections et/ou IDs précis
  probabilityProfileId?: string; // défaut = global
  enabled: boolean;
  order: number;
};
```

`collectionId` n'est **pas** synonyme de « booster » : une collection éditoriale peut être référencée par plusieurs boosters. Un booster peut mélanger plusieurs collections ou réutiliser seulement quelques cartes d'une collection. Cette distinction répond au dernier choix de conception confirmé.

### 7.2 Exemples de configuration — gratuit, exclusif, mixte

```ts
export const boosters: BoosterDefinition[] = [
  {
    id: 'eclats',
    title: 'Éclats',
    subtitle: 'Le hasard a ses secrets',
    artwork: {
      symbol: '/assets/boosters/eclats/symbol.svg',
      colors: {
        primary: '#087e89', secondary: '#253663',
        shine: '#b9ffec', glow: '#40d9df'
      }
    },
    access: { type: 'free' },
    cardsPerPack: 5,
    sources: [{ type: 'collection', collectionId: 'eclats-core' }],
    enabled: true,
    order: 0
  },
  {
    id: 'nocturne-premium',
    title: 'Nocturne',
    subtitle: 'Au cœur de la nuit',
    artwork: {
      symbol: '/assets/boosters/nocturne/symbol.svg',
      colors: {
        primary: '#6862b9', secondary: '#24204e',
        shine: '#e5d4ff', glow: '#9b77f4'
      }
    },
    access: { type: 'fragments', price: DEFAULT_SPECIAL_BOOSTER_PRICE }, // 60 fragments, prix de référence V1
    cardsPerPack: 5,
    // Seulement des cartes exclusives à ce pool :
    sources: [{ type: 'collection', collectionId: 'nocturne-exclusive' }],
    enabled: true,
    order: 1
  },
  {
    id: 'floraison-mixte',
    title: 'Floraison',
    subtitle: "La beauté de l'éphémère",
    artwork: {
      symbol: '/assets/boosters/floraison/symbol.svg',
      colors: {
        primary: '#b75c91', secondary: '#5b304f',
        shine: '#ffe1c6', glow: '#f185b5'
      }
    },
    access: { type: 'fragments', price: DEFAULT_SPECIAL_BOOSTER_PRICE }, // valeur individuelle configurable
    cardsPerPack: 5,
    sources: [
      { type: 'collection', collectionId: 'floraison-exclusive', multiplier: 1 },
      { type: 'cards', cardIds: ['eclats-card-01', 'eclats-card-09'], multiplier: 0.5 }
    ],
    enabled: true,
    order: 2
  }
];
```

**Important sur les multipliers** : les multiplicateurs sont des poids relatifs *au sein d'une rareté* après choix de celle-ci, et non des taux absolus entre raretés. Ils ne doivent pas modifier le taux global des cartes « rares », fixé à **12 %** en V1. Éviter le double comptage d'une même `cardId` si elle apparaît dans plusieurs sources du même booster : dédupliquer par ID et appliquer une règle documentée (par exemple somme des poids des sources ou priorité explicite), avec tests.

Le projet peut choisir une définition plus simple (`cardIds` directs) en V1 si nécessaire, **mais conserver dès le début la possibilité de composer pools exclusifs et cartes partagées sans toucher à l'UI**.

### 7.3 Validation et robustesse

- Refuser les doublons d'ID dans la définition globale des cartes / boosters. Chaque modèle possède obligatoirement `artwork.standard` **et** `artwork.fullArt` (fichiers réellement accessibles) : aucune Full Art facultative et aucune rareté modifiée pour une illustration différente.
- Refuser une référence vers carte/collection inconnue, un prix négatif, un multiplicateur ≤ 0, un tirage à zéro carte, des pourcentages dont la somme diffère de 100.
- Pour chaque booster, s'assurer qu'il a **au moins une carte éligible dans chaque rareté ayant un poids de tirage positif**. Ne pas transformer les probabilités de façon invisible.
- Seules les cartes du pool résolu peuvent être tirées.
- Effectuer **trois tirages indépendants** (rareté `57/24/12/5/2`, finition `81/15/4`, artVariant `92/8`) ; sélectionner le `cardId` dans le sous-pool de rareté selon ses poids. L’ordre des tirages indépendants peut varier sans modifier la distribution. Le modèle définit la rareté et les deux illustrations, sans substitution silencieuse.
- Ne pas utiliser un nom affiché pour retrouver une carte : IDs stables seulement.
- Dans les exemples, produire des illustrations placeholders originales, n'utiliser aucun art de Livarium.

## 8. Modèle de sauvegarde locale

**IndexedDB avec Dexie.js** comme source de vérité. `localStorage` seulement pour les préférences non critiques (thème, choix du booster courant, réduction des animations, etc.). Ne jamais stocker le **stock et la recharge des boosters gratuits**, le solde ou l’inventaire autoritatif dans localStorage.

### Modèle de données V1

**Un exemplaire = une ligne `drops`, clé primaire `dropId` UUID v4** ; cinq doublons de la même variante ont cinq UUID différents. Aucun `cardInstanceId`. La variante **ne se résume plus à `(cardId, finish)`** mais au triplet `(cardId, finish, artVariant)` : six variantes par `cardId` ; la rareté est lue depuis `CardDefinition` (ne pas la dupliquer en champ modifiable sur le drop).

```ts
export type Finish = 'normal' | 'glossy' | 'alternative';
export type ArtVariant = 'standard' | 'fullArt';
export type CardStatus = 'owned' | 'outgoing' | 'recycled';

export type CardDropRow = {
  dropId: string;                    // UUID v4 stable de l'exemplaire
  cardId: string;                    // rareté immuable via CardDefinition
  finish: Finish;
  artVariant: ArtVariant;            // IMMUTABLE, conservé en échange
  status: CardStatus;                // 'outgoing' : carte non jouable/non recyclable
  acquiredAt: number;
  updatedAt: number;
};

export type CardDiscoveryRow = {
  key: string;                       // `${cardId}::${finish}::${artVariant}`
  cardId: string;
  finish: Finish;
  artVariant: ArtVariant;
  firstDiscoveredAt: number;
};

export type PlayerStateRow = {
  id: 'local';
  fragments: number;
  freePackStock: number;             // 0..5 ; stock global partagé
  nextFreePackAt: number | null;    // timestamp UTC ms ; null si stock plein
  maxObservedClockAt?: number;
  schemaVersion: number;
};

export type OpenRecord = {
  id: string;                        // UUID d'ouverture, distinct des dropId
  boosterId: string;
  openedAt: number;
  payment: 'free' | 'fragments';
  fragmentsSpent: number;
  results: Array<{
    dropId: string;
    cardId: string;
    finish: Finish;
    artVariant: ArtVariant;
  }>;
  revealComplete: boolean;
};

export type RecyclingRecord = {
  id: string;
  createdAt: number;
  dropIds: string[];
  fragmentsGained: number;
};

// Identité/amis/outbox/registre utilisés au §9.
```

**Schéma Dexie V1** (types crypto/imports définis au §9) :

```ts
import Dexie, { type EntityTable } from 'dexie';

export const db = new Dexie('collection-boosters') as Dexie & {
  drops: EntityTable<CardDropRow, 'dropId'>;
  discoveries: EntityTable<CardDiscoveryRow, 'key'>;
  player: EntityTable<PlayerStateRow, 'id'>;
  openings: EntityTable<OpenRecord, 'id'>;
  recycling: EntityTable<RecyclingRecord, 'id'>;
  identity: EntityTable<LocalIdentityRow, 'id'>;
  friends: EntityTable<FriendContactRow, 'playerUuid'>;
  outbox: EntityTable<OutgoingTransferRow, 'transferId'>;
  usedTransfers: EntityTable<UsedTransferRow, 'transferId'>;
};

db.version(1).stores({
  drops: '&dropId, cardId, [cardId+finish+artVariant], finish, artVariant, status',
  discoveries: '&key, cardId, [cardId+finish+artVariant], artVariant',
  player: '&id',
  openings: '&id, boosterId, openedAt, revealComplete',
  recycling: '&id, createdAt',
  identity: '&id, &playerUuid',
  friends: '&playerUuid, fingerprint, addedAt',
  outbox: '&transferId, dropId, recipientId, createdAt',
  usedTransfers: '&transferId, receivedAt',
});
```

**Migrations sans perte** : le schéma ci-dessus est la V1 de référence pour une nouvelle installation. Si le jeu possède **déjà des données IndexedDB créées avant l’introduction de `artVariant`**, ne jamais modifier rétroactivement le schéma de leur version Dexie : déclarer une **nouvelle version** et migrer atomiquement. Attribuer `artVariant: 'standard'` aux exemplaires et résultats d’ouvertures concernés ; convertir les clés de découverte au format triplet (`cardId::finish::artVariant`) en conservant `firstDiscoveredAt` ; préserver les `dropId`, la balance, les horodatages, les clés d’identité, les contacts, l’outbox et **tous** les `usedTransfers`. Tester la migration depuis une base préexistante vers le schéma final.

**Codes déjà émis** : la structure cryptographique signée est immuable. Si de véritables transferts ont déjà été publiés avec un payload qui ne possède pas `artVariant`, ne pas les « compléter » silencieusement ou leur appliquer une nouvelle interprétation sous le même identifiant de protocole : prévoir une version de protocole distincte et un import rétrocompatible explicite, ou gérer ces codes avant déploiement. Pour toute nouvelle implémentation sans codes émis, `TR1.` désigne directement le payload final **avec `artVariant` obligatoire** ; rejeter une valeur absente ou inconnue.

La Collection regroupe les exemplaires `status === 'owned'` par `(cardId, finish, artVariant)` ; les découvertes sont persistantes pour chaque variante distincte, même après recyclage ou transfert. L'ouverture génère un `dropId` par carte ; elle insère les exemplaires, découvertes et `OpenRecord` atomiquement. Le recyclage cible des `dropId` et marque leur statut `recycled` dans la même transaction qui crédite les fragments. **Un exemplaire recyclé ne peut pas être réactivé localement par import d'un code.**

### Transactions et animations

**Ouverture gratuite :** lire le `player` **dans une transaction Dexie `readwrite`**, appliquer `settleFreePackRecharge` au `now` courant, vérifier `freePackStock > 0` et les règles du booster sélectionné, puis consommer **exactement un** crédit avec `spendFreePack`. Insérer dans la **même transaction** les cinq nouveaux `CardDropRow` (ou `cardsPerPack`), leurs `CardDiscoveryRow`, un `OpenRecord`, et le nouvel état `freePackStock` / `nextFreePackAt`. **Ouverture à fragments :** vérifier le solde et débiter le prix dans la **même transaction** que l'ajout des cartes et le journal ; ne jamais toucher au stock ni à la recharge gratuite. Dans les deux cas, ne lancer la révélation visuelle qu'**après commit réussi**. Si le rechargement survient en cours d'animation, les résultats déjà acquis sont retrouvés dans le journal et peuvent être révélés à nouveau sans refaire de tirage ni redébiter les fragments.

Ne pas appeler `fetch`, de promesse non Dexie ou de temporisateur **à l'intérieur** de la transaction IndexedDB ; préparer les résultats avant, puis revérifier toutes les conditions à l'intérieur. Prévoir l'ouverture concurrente dans deux onglets : la mise à jour du même `player` doit être atomique et la condition d'éligibilité doit être relue sous transaction. Afficher un message discret et reprendre l'état si une autre tab a déjà ouvert.

**Horloge sans backend :** la recharge hors jeu dépend de `Date.now()` de l’appareil et de `nextFreePackAt` persisté. Un utilisateur peut régler son horloge et contourner la mécanique. Le champ optionnel `maxObservedClockAt` peut limiter certains retours en arrière accidentels mais ne constitue pas une protection contre la triche. Accepter explicitement le compromis. Les notifications de changement de visibilité, focus et l’actualisation inter-onglets permettent de rafraîchir le compteur, mais ne remplacent jamais les transactions IndexedDB.

**Conservation des données :** envisager `navigator.storage.persist()` quand l'utilisation régulière le justifie ; le navigateur n'est pas obligé d'accepter. IndexedDB n'est **pas** une sauvegarde serveur ; suppression du stockage du site, navigation privée, changement de navigateur/appareil peuvent entraîner la perte. Ne pas créer de promesse de récupération sans sauvegarde distante. Sur le site, un libellé « Sauvegardé sur cet appareil » dans les paramètres suffit.

## 9. Système d'amis et de transferts de cartes

**Périmètre :** échanges manuels entre amis/famille de confiance, entièrement locaux, sans backend, sans compte, sans QR code, sans demande d'ami et sans confirmation distante. Utiliser les codes textuels transmis hors du jeu (SMS, messagerie, etc.). **Ne pas développer d'antifraude absolue** : le code client et IndexedDB restent sous contrôle de l'utilisateur, et une restauration de sauvegarde peut contourner les protections locales. Ces limites sont acceptées pour le public cible. Les garde-fous ci-dessous visent les erreurs, collisions de données et doubles utilisations dans une sauvegarde normale.

### 9.1 Identité locale et format obligatoire

- Chaque **installation** possède un identifiant public « UUID maison » **exactement sous la forme `1234-56-78`**, soit **huit chiffres décimaux** séparés 4-2-2. Regex : `^\d{4}-\d{2}-\d{2}$`. Exemple : `0042-08-19` ; **préserver les zéros initiaux**. Il ne s'agit **pas** d'un vrai UUID RFC 4122.
- Générer chaque chiffre équitablement avec un tirage cryptographique (idéalement rejet pour éliminer le biais modulo) ou générer un entier uniforme entre `0` et `99_999_999` par rejet, puis le formatter avec `padStart(8, '0')`. Ne pas utiliser `Math.random()`, pas de génération séquentielle et pas d'identité dérivée de l'heure.
- Il y a `10^8` codes possibles, soit ~26,6 bits. **Risque de collision non nul entre installations** ; si un UUID déjà connu est présenté avec des clés publiques différentes, détecter le conflit et demander une résolution explicite, jamais écraser automatiquement un contact existant.
- L'identité correspond à une **installation**, pas à une personne authentifiée. Ni changement d'appareil ni synchronisation automatique. La perte d'IndexedDB peut entraîner la perte des clés et donc l'impossibilité de lire d'anciens codes chiffrés.
- **Ne jamais dériver une clé privée du code `1234-56-78`**. Il possède trop peu d'entropie pour être un secret. Générer indépendamment deux paires de clés via Web Crypto (clés privées non exportables si compatible avec le stockage local) : une paire **ECDSA P-256** pour signer/vérifier ; une paire **ECDH P-256** pour établir le secret de chiffrement. Stocker les clés privées `CryptoKey` dans IndexedDB, et exporter **seulement** les clés publiques pour les contacts (JWK vérifiés). Toute opération crypto dépend de la disponibilité des primitives `crypto.subtle` en contexte HTTPS, fourni par Firebase Hosting.

```ts
export type LocalIdentityRow = {
  id: 'local';
  playerUuid: string;          // huit chiffres : 1234-56-78
  signingPrivateKey: CryptoKey;
  signingPublicJwk: JsonWebKey;
  encryptionPrivateKey: CryptoKey;
  encryptionPublicJwk: JsonWebKey;
  createdAt: number;
};

export type FriendContactRow = {
  playerUuid: string;          // identifiant du contact, clé primaire
  signingPublicJwk: JsonWebKey;
  encryptionPublicJwk: JsonWebKey;
  fingerprint: string;         // empreinte stable des deux clés publiques canonisées
  label?: string;              // surnom optionnel choisi LOCALEMENT
  addedAt: number;
};
```

### 9.2 Ajout d'amis : UNE SEULE ACTION, sans acceptation

- Chaque joueur peut copier **son code de contact** ; il contient `version`, `playerUuid`, `signingPublicJwk`, `encryptionPublicJwk` et éventuellement une somme de contrôle pour détecter les fautes de copie. **Jamais** de clé privée. Sérialisation stable en Base64URL avec un préfixe versionné tel que `FR1.` ; ce code est public et ne doit pas être présenté comme secret.
- B colle le code de A dans « Ajouter un ami » : **A entre directement dans les contacts locaux de B**. Aucun flux de demande, aucune acceptation/confirmation ni réponse obligatoire ; A n'est pas automatiquement informé et B n'est pas automatiquement ajouté chez A.
- **Ajout unilatéral ≠ association réciproque automatique.** Sans serveur, une seule importation ne peut pas modifier le carnet d'adresses de l'autre navigateur. Si B partage aussi son code de contact à A, A ajoute B de la même manière : la relation devient réciproque, **sans demande à accepter**. Cette réciprocité est souhaitable et naturelle dans le petit groupe, mais **n'est pas obligatoire pour stocker un ami**.
- Contrairement à une demande d'ami classique, pas de statuts « invitation envoyée », « en attente d'approbation », ni bouton « accepter ».
- Contrôler format, algorithmes/tailles des clés, auto-ajout de soi-même, doublons, conflits UUID/fingerprint. Un ajout identique est idempotent ; un UUID déjà associé à d'autres clés ne doit jamais être remplacé silencieusement. Prévoir un petit affichage d'empreinte pour comparaison hors bande si les joueurs le souhaitent.
- **Condition des transferts sans clés publiques dans le code** : pour **A → B**, **A doit avoir importé B** (pour chiffrer), **et B doit avoir importé A** (pour déchiffrer/vérifier). Si B n'a pas importé A, son application ne connaît pas la clé publique de A et le transfert échoue. L'interface peut expliquer sobrement : « Échangez vos codes amis une fois avant le premier transfert ». A ne peut pas détecter à distance si B a effectué sa moitié ; il ne faut pas afficher « échange prêt des deux côtés » comme certitude serveur.

### 9.3 Identifiants de cartes et d'opérations

- **`cardId`** : identifie le modèle éditorial et sa rareté immuable. **`finish`** : `normal`, `glossy`, `alternative`. **`artVariant`** : `standard`, `fullArt`. Les deux propriétés de variante sont fixées au drop et restent identiques pendant tous les transferts.
- **`dropId`** : **vrai UUID v4 unique pour CHAQUE exemplaire tombé** (cinq doublons = cinq `dropId` différents). Le `dropId` reste **identique** tant que cet exemplaire circule entre joueurs ; il **ne renseigne pas le booster d'origine** et ne crée aucune obligation de tracer ce booster. Aucun `cardInstanceId` supplémentaire.
- **`transferId`** : **nouveau UUID v4 pour CHAQUE transfert**, y compris lors du retour de la même carte au même joueur. Il sert à la protection antirejeu locale ; sa valeur **est dans le contenu du code** et **dans le registre local de réception**.
- Refuser tout transfert vers soi-même. Un exemplaire `outgoing` ou `recycled` ne peut être sélectionné pour un nouvel envoi ni être recyclé par l'expéditeur.

```ts
export type Card = {
  dropId: string;
  cardId: string;
  finish: Finish;
  artVariant: ArtVariant;
};

export type TransferPayload = Card & {
  version: 1;
  transferId: string;
  senderId: string;            // UUID maison de l'expéditeur
  recipientId: string;         // UUID maison du destinataire
  issuedAt: number;
};

export type SignedTransfer = {
  payload: TransferPayload;
  signature: string;           // ECDSA P-256, signature du payload canonique
};

export type OutgoingTransferRow = {
  transferId: string;
  dropId: string;
  recipientId: string;
  code: string;                // code CHIFFRÉ pour le réafficher / recopier
  createdAt: number;
  status: 'generated';         // pas de statut 'delivered' sans serveur / accusé
};

export type UsedTransferRow = {
  transferId: string;          // clé UNIQUE, jamais supprimée normalement
  receivedAt: number;         // métadonnée facultative, sans code ni dropId
};
```

### 9.4 Contenu du code et protocole crypto

- **Aucune clé publique permanente dans le code de TRANSFERT** : les clés de signature et de chiffrement des amis ont déjà été échangées via les **codes de contact**. Distinguer strictement `FR1.` (fiche contact publique) et `TR1.` (transfert chiffré).
- Ne pas exposer en clair les UUID expéditeur/destinataire dans le transfert. Les protéger dans le message chiffré, sans leur substituer un hash isolé (espace limité à 100 millions de possibilités). Les UUID figurent dans le **contenu chiffré**, et B doit vérifier `recipientId === identity.playerUuid` après déchiffrement.
- Algorithmes de référence Web Crypto, largement utilisables sur navigateurs modernes : **ECDSA P-256/SHA-256** pour la signature ; **ECDH P-256** (clé privée locale + clé publique ECDH du contact) pour dériver un secret partagé ; **HKDF-SHA-256** avec un sel cryptographiquement aléatoire et `info` de protocole/version pour obtenir une clé **AES-GCM-256** ; **IV aléatoire de 96 bits, nouveau pour chaque transfert**. Ne pas réutiliser un IV avec une même clé. Tests croisés obligatoires sur Safari iOS, Chrome et Firefox ; prévoir une erreur explicite si l'environnement n'offre pas Web Crypto.
- Canonicaliser le `TransferPayload` de façon déterministe (ordre de champs stable, types stricts, encodage UTF-8), puis **le signer avec la clé privée ECDSA de A**. Emballer `{payload, signature}` dans un message chiffré avec la clé obtenue pour le couple A/B. Le code `TR1.` contient **uniquement version technique, sel HKDF, IV AES-GCM et ciphertext/tag en Base64URL** ; pas de clés publiques d'utilisateur, pas d'UUID en clair. Prévoir un contrôle strict des tailles/max longueurs et du schéma.
- **Réception** : B essaie de dériver la clé partagée avec chacun de ses amis enregistrés jusqu’au déchiffrement AES-GCM valide (approprié pour un petit carnet familial, sans exposer l’identifiant en clair). Puis il vérifie la signature avec **la clé publique ECDSA enregistrée pour A**, la cohérence des UUID/contact, la version du protocole, `cardId` existant, `finish` et `artVariant` permis. **La signature couvre impérativement `artVariant`**, comme les autres données de la carte : un code ne peut pas être changé de standard vers Full Art ou vice versa sans invalidation cryptographique. Ne jamais faire confiance à une clé fournie par un transfert inconnu, puisqu’aucune n’y figure.
- La signature valide prouve qu’une clé associée à A a signé ce contenu (y compris `cardId`, `dropId`, `finish`, **`artVariant`**, `transferId`, expéditeur et destinataire) ; **elle ne prouve pas qu'un tirage a eu lieu honnêtement ni qu'A possédait réellement cette carte** : sans backend, aucune application Web statique ne peut certifier l'origine d'un drop au niveau mondial. Notre V1 accepte cette limite.
- Chiffrement et signature de bout en bout entre ces deux navigateurs, **sans aucun service de messagerie**. Le transfert n'est pas envoyé automatiquement : l'utilisateur copie/colle son code hors du jeu.

### 9.5 Création du code et gestion de l'outbox

1. A ouvre une carte **possédée** (`status === 'owned'`), choisit B **dans ses amis** (A doit connaître la clé publique de B), puis clique « Générer le code » ; aucun UUID à saisir pour ce transfert.
2. Préparer **hors transaction** un `transferId` UUID v4, l'objet signé, le ciphertext et le code `TR1.` ; vérifier format et limites. Le `dropId`, la finition **et `artVariant`** proviennent **uniquement de l’exemplaire stocké**, pas d’une saisie utilisateur.
3. En **une transaction IndexedDB** : relire la ligne `drops[dropId]` et s'assurer qu'elle est encore `owned` et inchangée ; la passer à `outgoing` ; insérer la ligne `outbox[transferId]` contenant le **code réutilisable pour copier**, et valider. Si l'exemplaire a été recyclé ou envoyé depuis un autre onglet, **tout annuler** ; ne montrer aucun code prêt à transmettre avant le commit.
4. Afficher le code, le bouton « Copier » et sa présence durable dans la **boîte d'envoi**. A peut recopier le même code, mais ne peut plus envoyer ou recycler l'exemplaire localement.
5. **Pas d'annulation/récupération automatique dans la V1.** Sans serveur, A ne peut pas savoir si B a déjà importé un code et une annulation risquerait de dupliquer la carte. Le transfert généré est définitif : si le code n'est jamais importé, la carte reste immobilisée/perdue localement. Bien prévenir avant la confirmation.
6. La boîte d'envoi **n'est pas une boîte d'envoi réseau** ; le jeu ne connaît pas la réception. Pas de statuts fictifs « reçu », « en attente de B » ou « confirmé » ; utiliser simplement « Code généré », et laisser copier à nouveau.

### 9.6 Importation, registres et allers-retours

1. B colle le code reçu ; parser/décoder sans exécuter son contenu. Déchiffrer et vérifier la signature avec le carnet de contacts, contrôler le destinataire et la cohérence des champs signés.
2. Vérifier dans la **même transaction Dexie de réception** : `usedTransfers[transferId]` **absent** ; `drops[dropId]` **absent** ou à l'état **`outgoing`** (dans ce dernier cas, il s'agit d'un retour légitime). Si `owned`, refuser la duplication ; si `recycled`, refuser, car cet exemplaire a été détruit localement.
3. Dans cette transaction : créer ou réactiver `drops[dropId]` avec le `cardId`, `finish` **et `artVariant`** du transfert ; si ligne déjà présente (`outgoing`), **exiger même `cardId`, même `finish` et même `artVariant`** ; inscrire la découverte dans `discoveries` si nécessaire ; insérer `usedTransfers[transferId]`, clé unique ; valider l'ensemble d'un seul coup. Vérifier tous les cas d'écriture concurrente, ne pas enregistrer une partie seulement.
4. **Ne jamais effacer `usedTransfers` lors du recyclage ou du renvoi de la carte.** Garder la table distincte de l'inventaire. Le registre ne contient **que `transferId` (et facultativement la date d'importation)** ; il ne conserve **ni le code complet, ni le `dropId`, ni la carte**. Le `dropId` appartient à l'inventaire par exemplaires et ne sert **pas** de clé antirejeu : cela permet les allers-retours d'une carte.
5. Exemple : carte `dropId = D` : A→B via `T1` (B mémorise T1) ; B→C via `T2` (C mémorise T2) ; C→B via `T3` (B **accepte T3** et **refuse toujours T1**). Chaque `transferId` identifie un **mouvement**, `dropId` identifie l'**exemplaire constant**.
6. Une même carte qui a été recyclée ne doit pas revenir : la ligne `recycled` constitue une **tombstone locale**. Cela n'est pas une preuve mondiale de destruction, mais cela bloque une incohérence évidente. L'historique des découvertes reste accessible même après destruction.
7. Deux onglets qui tentent de recevoir le même code : **exactement une transaction réussit**. Le deuxième est refusé par unicité `transferId` (et état du drop).

### 9.7 Cas limites, UX, limites assumées

| Cas | Comportement V1 |
|---|---|
| A donne son code de contact à B ; B ne répond pas | B peut stocker A unilatéralement ; aucun accusé chez A. L'envoi de carte bidirectionnel reste impossible tant que les **deux codes de contact** n'ont pas été importés réciproquement. |
| Un ami renvoie son propre code déjà importé | Idempotent, pas de deuxième entrée. |
| Même UUID utilisateur avec clés différentes | Bloquer l'écrasement silencieux ; afficher conflit. |
| Code de carte transmis par erreur à C | C ne dispose normalement pas du bon secret de déchiffrement ; refus. |
| Code invalide, corrompu, altéré ou signé par un inconnu | Refus, sans modifier inventaire ni registre. |
| B importe T1 deux fois | Première fois acceptée, deuxième fois refusée via `usedTransfers`. |
| B a déjà D dans l’inventaire | Refus (prévention du doublon d’exemplaire), **même si le nouveau payload prétend une autre finition ou illustration**. |
| D retourne à B via un **nouveau** transfert T3 | Accepté si B avait envoyé D et que sa ligne est `outgoing` ; T1 reste refusé. |
| A recharge la page après création du code | Code toujours dans l'outbox ; exemplaire toujours `outgoing`. |
| A ouvre deux onglets et tente d'envoyer D deux fois | Une seule création peut réussir grâce à la transaction sur l'état du `dropId`. |
| A génère un code, B ne le reçoit jamais | Pas de récupération automatique, code consultable indéfiniment dans outbox. |
| B supprime A de ses contacts | Les anciens codes de A ne sont plus vérifiables/déchiffrables via ce contact ; une réimportation du même code de contact rétablit les clés. Aucune révocation automatique chez A. |
| A ou B régénère son identité/les paires de clés | Les anciens codes de contact et transferts peuvent cesser de fonctionner ; ne jamais régénérer silencieusement les clés au démarrage. |
| B perd le navigateur/IndexedDB ou ses clés | Impossibilité possible d'importer d'anciens codes ; pas de récupération promise. |
| L'application est modifiée ou une sauvegarde restaurée intentionnellement | Hors du modèle de confiance familial ; pas de garantie antifraude mondiale. |

### 9.8 Tests spécifiques obligatoires

- Validation regex stricte `1234-56-78`, zéros initiaux, génération sûre et détection de collisions dans le carnet d'amis.
- Génération de deux paires de clés indépendantes du code joueur, stockage durable des `CryptoKey` dans IndexedDB, restauration après refresh. Les clés privées **ne doivent jamais être sérialisées dans un code de contact**.
- Import de contact **unilatéral sans acceptation**, import idempotent, blocage des UUID déjà liés à d'autres clés, rejet du contact soi-même.
- A→B : fonctionne après import **réciproque des contacts**, sans aucune clé publique permanente dans `TR1.` ; échoue proprement si une clé manque.
- Signatures valides/invalides, erreur de destinataire, faux payload, code malformé, tentatives avec un ami non connu, altération du ciphertext/IV/salt, absence de Web Crypto.
- `dropId` UUID v4 distinct pour chacun des cinq exemplaires d’un booster, y compris cinq doublons ; invariant après transferts A→B→C→A ; `cardInstanceId` absent. `finish` et `artVariant` doivent rester **identiques** tout au long de cette chaîne.
- Envoi atomique `owned`→`outgoing` + outbox ; double génération impossible ; copie du code après rechargement ; pas d'annulation réintroduisant une duplication.
- Réception atomique via registre `transferId`, rejet du code déjà utilisé, y compris après renvoi/recyclage ; deux imports concurrents ; rejet si l’exemplaire est déjà owned ou tombstone recycled ; retour via nouveau `transferId` accepté. Contrôler **l’immuabilité de `artVariant`** au même titre que `cardId` et `finish`, y compris quand la ligne locale était `outgoing`.
- Tester Safari iOS, tablette portrait/paysage, PC et navigateur secondaire, et ajouter des tests d'intégration Dexie avec IndexedDB simulé ; ne pas se contenter de tests unitaires sur les fonctions cryptographiques.

## 10. Structure de projet proposée

```text
collection-boosters/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── firebase.json
├── public/
│   └── assets/
│       ├── cards/                 # illustrations optimisées WebP/AVIF
│       ├── boosters/              # symboles et éventuels backgrounds
│       └── logos/
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers/
│   ├── components/
│   │   ├── cards/
│   │   │   ├── CollectibleCard.tsx
│   │   │   ├── CardFinishLayer.tsx
│   │   │   ├── CardArtwork.tsx        # standard / Full Art
│   │   │   └── RarityBadge.tsx
│   │   ├── boosters/
│   │   │   ├── BoosterPack.tsx
│   │   │   ├── BoosterSelector.tsx
│   │   │   ├── BoosterOpening.tsx
│   │   │   └── RevealSequence.tsx
│   │   └── ui/
│   ├── pages/
│   │   ├── BoostersPage.tsx
│   │   ├── CollectionPage.tsx
│   │   ├── AtelierPage.tsx
│   │   └── ExchangesPage.tsx       # contacts et codes, accessible depuis Collection
│   ├── game/
│   │   ├── types.ts
│   │   ├── draw.ts
│   │   ├── probabilityProfiles.ts
│   │   ├── artVariant.ts            # tirage et affichage Full Art
│   │   ├── resolveBoosterPool.ts
│   │   ├── validation.ts
│   │   ├── economy.ts
│   │   └── freePackRecharge.ts
│   ├── exchanges/
│   │   ├── contactCode.ts        # génération/import de contact FR1
│   │   ├── crypto.ts             # Web Crypto ECDSA/ECDH/HKDF/AES-GCM
│   │   ├── transferCode.ts       # payload TR1, signature, chiffrement
│   │   ├── sendTransfer.ts
│   │   └── receiveTransfer.ts
│   ├── data/
│   │   ├── boosters.ts
│   │   ├── cards.ts
│   │   └── collections.ts
│   ├── storage/
│   │   ├── database.ts
│   │   ├── playerRepository.ts
│   │   ├── openingService.ts
│   │   ├── recyclingService.ts
│   │   ├── friendsRepository.ts
│   │   ├── identityRepository.ts
│   │   ├── transfersRepository.ts
│   │   └── schema.ts
│   ├── hooks/
│   │   ├── usePlayerState.ts
│   │   └── useInventory.ts
│   └── styles/
│       ├── index.css
│       ├── theme.css
│       ├── booster.css
│       ├── cards.css
│       └── effects.css
└── tests/
    ├── game/
    ├── storage/
    ├── exchanges/
    └── ui/
```

Les calculs de tirage, de fragments et le protocole de transfert sont **séparés des composants React**. Les clés de contact n’entraînent aucun appel réseau : toutes les opérations de contacts, envois et réceptions sont locales et déclenchées par la copie/import d’un code. Les calculs de tirage et de fragments sont des fonctions pures et **ne dépendent pas de React**. React affiche les états issus du moteur et de Dexie (`dexie-react-hooks` / `useLiveQuery`). Limiter les dépendances ; ne pas utiliser un framework backend.

## 11. Animations et accessibilité

- Un vrai booster métallisé avec bord supérieur et inférieur crantés (avec un rendu soigné).
- Interaction « déchirer le paquet » activable au toucher, souris, Entrée et Espace ; éviter de dépendre d'un geste drag difficile sur téléphone.
- Déchirure de bordure supérieure puis transition vers les dos de cartes.
- Révélation une carte à la fois, bouton ou tap, avec annonce accessible de la rareté, de la finition **et du statut Full Art/standard**.
- Garantir un bouton « passer les animations » ou révélation immédiate si mouvements réduits ; le résultat **ne dépend jamais de la durée d'animation**.
- Pas de sons obligatoires ; si ajout futur, option muet par défaut ou contrôle explicite.
- Respecter `prefers-reduced-motion`, les états focus, le clavier, le contraste, les petits écrans.
- Favoriser les transformations `transform` et `opacity` (performances), ne pas mettre des dizaines de flous coûteux actifs dans de grandes grilles. Une Full Art couvre la carte entière ; conserver les textes lisibles même avec finition brillante/alternative et `prefers-reduced-motion`.

## 12. Qualité et critères d'acceptation

### Tests moteur

1. Les taux V1 **57/24/12/5/2** (rareté), **81/15/4** (finition) et **92/8** (illustration) totalisent chacun 100 %. Refuser les profils invalides.
2. Trois tirages indépendants ; injecter une suite RNG déterministe. Ne jamais modifier une rareté parce que le Full Art ou une finition est obtenu.
3. Les **30 probabilités combinées** sont les produits exacts des trois taux ; en particulier `P(legendary + alternative + fullArt) = 0,0064 %` par carte ; `P(legendary + alternative) = 0,08 %` toutes illustrations.
4. Catalogue courant **39 communes, 24 peu communes, 21 rares, 16 épiques, 10 légendaires** = **110 modèles, 660 variantes** ; aucune quantité codée en dur dans les mécanismes.
5. **Chaque `CardDefinition`** possède `artwork.standard` **et** `artwork.fullArt` valides ; aucune illustration Full Art facultative ni inventaire de modèle dont la rareté change selon l'art.
6. Un booster gratuit utilise son pool propre et ne récupère pas automatiquement des cartes d'un autre booster.
7. Un booster à fragments **100 % exclusif** ne renvoie aucune carte du pool gratuit ; un booster mixte peut retourner ses cartes exclusives ET partagées selon ses sources configurées.
8. Tout ID inconnu, rareté vide malgré taux positif, image manquante, prix négatif ou poids nul/invalide cause une erreur de validation explicite.
9. Un même `cardId` possède **six variantes possibles**, tirées selon les taux de finition et de Full Art (elles **ne sont pas équiprobables**) ; sa rareté reste identique. Les cinq tirages d’un booster sont avec remise, sans garantie.
10. Simulations statistiques de grande taille et tests déterministes : finition alternative 4 %, Full Art 8 %, brillantes 15 %, légendaires 2 % ; matrice exhaustive correcte.

### Tests de persistance / économie

1. `drops`, découvertes et historiques persistent après rafraîchissement, avec **`artVariant`** présent partout où une variante existe.
2. Le **stock gratuit global 0..5** persiste après rafraîchissement et changement de booster ; il se recharge à raison d'**une ouverture toutes les dix minutes**, hors jeu, jusqu'à cinq.
3. Tests déterministes : stock `0/5`, première recharge dans dix minutes → `0/5` à 9 min, `1/5` à 10 min, `2/5` à 25 min (prochain crédit dans 5 min), `5/5` après 50 min ou trois jours ; stock `3/5` devient `5/5` après trois jours.
4. Stock plein = `nextFreePackAt = null` ; dépense à T = `4/5`, recharge T+10 min. Depuis un stock partiel, dépense sans remettre le délai à zéro.
5. Un booster à fragments ne touche ni au stock gratuit ni à son échéance ; débit et cartes reçues ensemble, ou aucun des deux.
6. Deux onglets ne peuvent pas consommer le même crédit gratuit ; recharge pendant l'animation ne provoque pas de double débit ni de reroll.
7. Recyclage des doublons par **`(cardId, finish, artVariant)`** ; protection de dernière copie de **chaque variante**, confirmation de destruction, aucun solde négatif.
8. Tester exhaustivement la **grille des 30 valeurs** avec `floor(base × finish × artVariant)` à **un seul arrondi final**. Exemples : commune Full Art normale `1`, commune Full Art brillante `4`, rare Full Art brillante `30`, épique Full Art alternative `72`, légendaire Full Art alternative `115`.
9. Moyenne théorique de recyclage à ces taux : **4,149816 fragments/carte**, **20,74908 fragments/booster**. Probabilité `P(5 cartes recyclées ≥ 60 fragments) ≈ 2,00 %`.
10. Catalogue complet 110 modèles × six variantes = 660 variantes ; valeur recyclable **11 817 fragments** pour une copie de chacune.
11. Prix de référence booster spécial **60 fragments**, configurable indépendamment ; pas de boucle moyenne de fragments positive involontaire pour les pools officiels.
12. `discoveries` distingue les six variantes, y compris pour une copie recyclée ou envoyée ; `dropId` reste identique à l'échange.
13. Les migrations Dexie préservent `drops`, `discoveries`, `usedTransfers`, `outbox`, horodatages, solde et réparent les clés de découvertes en cas de schéma antérieur.
14. Si un modèle est retiré du catalogue, conserver une définition d'archive consultable pour que les exemplaires et leur rareté/recyclage restent interprétables.

### Tests des amis et échanges (voir §9)

1. `dropId` : UUID v4 distinct par exemplaire, permanent entre propriétaires, sans `cardInstanceId` ; tests avec cinq doublons identiques dans une ouverture.
2. UUID joueur **8 chiffres décimaux formatés `1234-56-78`**, clés privées indépendantes de cet UUID.
3. Un ajout d'ami ne demande **aucune** approbation et ne synchronise pas le carnet de l'autre joueur ; les deux codes de contact doivent être importés pour un transfert bilatéral chiffré.
4. Les codes de carte `TR1.` n'incluent **aucune** clé publique longue durée, aucun UUID en clair ; ils signent/chiffrent aussi **`artVariant`**, et restent valides uniquement pour le destinataire prévu.
5. Transaction d'envoi : `owned` → `outgoing` et enregistrement de l'outbox atomiques ; pas de code visible avant le commit ; récupération du code après refresh.
6. Transaction de réception : vérification cryptographique, non-réutilisation de `transferId`, contrôle du `dropId` **et des trois champs `cardId/finish/artVariant`**, ajout/retour d’exemplaire, découverte, tout atomique ; deux onglets ne peuvent accepter le même transfert deux fois.
7. Un ancien `transferId` reste refusé après recyclage ou transfert ultérieur ; la carte peut revenir avec un **nouveau** `transferId` si elle est sortie vers un autre joueur et non recyclée.
8. Prévoir erreurs explicites pour clés manquantes, UUID conflit, format invalide, code destiné à quelqu'un d'autre, et perte du stockage local.

### Tests UI / responsive

1. Pas de catalogue ni silhouettes des cartes jamais obtenues.
2. Titre et sous-titre du booster sont configurables ; **aucune mention interdite sur le sachet**.
3. Le design et les couleurs d'Éclats constituent le point de départ graphique.
4. **Standard** : illustration ~2/3, infos ~1/3 ; **Full Art** : illustration sur toute la carte avec infos superposées. Titre centré et description alignée à gauche dans bloc centré.
5. Chaque modèle a ses **six variantes** (standard / Full Art × normale / brillante / alternative). Alternative = noir/or ; reflets et textes lisibles sur les deux types d’illustration.
6. Scénarios mobile, tablette portrait, tablette paysage, PC, grand écran ; pas de débordement horizontal.
7. Clavier et reduced-motion fonctionnent ; les cartes restent consultables sans hover.
8. Build statique Vite et routes Firebase Hosting fonctionnent après refresh profond.

## 13. Jalons conseillés à Codex

1. **Fondation** : React/Vite/TS/Tailwind, thème, navigation 3 pages, cartes/paquets configurables, responsive.
2. **Moteur** : 110 modèles configurés et six variantes obligatoires par modèle, pools composables, trois tirages indépendants rareté/finition/Full Art, validation et tests.
3. **Persistance** : IndexedDB/Dexie, transactions de dépense d’un crédit gratuit / de fragments, **recharge hors ligne 1 crédit/10 min plafonnée à 5**, reprise d’ouverture.
4. **Collection / Atelier** : inventaire regroupé par `(cardId, finish, artVariant)`, découvertes distinctes des six variantes, fragments et boosters spéciaux.
5. **Amis et échanges locaux** : identité `1234-56-78`, paires de clés Web Crypto, import unilatéral des codes de contact, envoi chiffré/signé, outbox, registre des `transferId`, retour de carte, tests sur navigateurs.
6. **Polish** : ouverture des boosters, révélations, compositions Full Art, effets des finitions, reduced-motion, optimisation des deux illustrations obligatoires par modèle.
7. **Livraison** : tests, build de production, configuration Firebase Hosting, README pour éditer/ajouter booster et cartes sans connaître React, ainsi qu’une explication brève des limites et du protocole d’échange.

**Instruction impérative** : documenter dans le README comment créer une nouvelle collection, ajouter les **deux illustrations obligatoires de chaque carte** (standard et Full Art), créer un booster gratuit, créer un booster exclusif aux fragments, configurer un booster mixte qui réutilise des cartes déjà publiées, et régler **le stock initial, le plafond de cinq et les dix minutes de recharge**. L'utilisateur doit pouvoir changer cette distribution **dans le code de configuration** sans créer une nouvelle page ou dupliquer une interface.

## 14. Instructions de livraison à Codex

1. **Autorité des règles** : implémenter **seulement** les taux de rareté `57/24/12/5/2`, finitions `81/15/4`, illustrations `92/8`, **trois tirages indépendants** et aucun bonus/pity caché. La légendaire Full Art alternative est **0,0064 % par carte**.
2. **Catalogue éditorial courant** : `39 communes + 24 peu communes + 21 rares + 16 épiques + 10 légendaires = 110 modèles`, chacun possédant **six variantes** possibles, soit **660 variantes distinctes**. Ne pas coder les totaux en dur dans le moteur.
3. **Illustrations** : chaque `CardDefinition` a obligatoirement deux fichiers, `artwork.standard` et `artwork.fullArt`. La rareté est fixée sur `cardId`. Les finitions normale/brillante/alternative s'appliquent en HTML/CSS/JS aux deux types d'illustration ; elles ne créent pas de nouveaux modèles.
4. **Booster** : cinq cartes indépendantes par paquet (`cardsPerPack` configurable), chacune ayant un `dropId` UUID v4 unique, même pour des doublons.
5. **Grille économique** : fragments de base `1/3/7/12/19` ; finitions `×1/×2,3/×3,2`, illustration standard `×1` / Full Art `×1,9`, **un seul `floor` final**. Booster spécial **60 fragments** par défaut, prix individuel configurable. Valeur moyenne d'un booster intégralement recyclé : **20,74908 fragments**.
6. **Stock gratuit** : crédit commun 0..5, recharge 1/10 minutes en temps écoulé même hors jeu, plafond 5, aucune accumulation cachée, indépendant de l'achat via fragments.
7. **Sauvegarde / découvertes / doublons** : `CardDropRow`, `CardDiscoveryRow` et `OpenRecord.results` possèdent `artVariant` ; regrouper/protéger les copies par `(cardId, finish, artVariant)` ; conserver les six découvertes indépendantes, et ne montrer que ce que le joueur a déjà découvert.
8. **Transfert** : le `TransferPayload` signé et chiffré contient `dropId`, `cardId`, `finish`, **`artVariant`**, `transferId`, UUID expéditeur/destinataire et date. Toute altération du Full Art invalide la signature. Lors d'un retour, le jeu vérifie l'égalité des trois champs du drop.
9. **Amis / cryptographie** : contact `FR1.` = UUID maison `1234-56-78` + clés publiques, ajout **unilatéral** sans acceptation ; transfert `TR1.` sans clés publiques ni UUID en clair, chiffré/signé ; import réciproque des codes de contact requis pour une transmission opérationnelle dans les deux sens.
10. **Antirejeu** : **ne pas indexer le registre par `dropId` ou variante** ; `usedTransfers` conserve uniquement le `transferId` unique consommé (date facultative). Une même carte Full Art peut revenir avec le **même `dropId`, `finish` et `artVariant`**, mais un **nouveau** `transferId` ; un ancien code reste refusé même après recyclage.
11. **Intégrité** : transactions IndexedDB atomiques pour booster, recyclage, envoi, réception ; sauvegarder la boîte d'envoi ; ne jamais annuler localement un transfert sans savoir si le destinataire l'a importé.
12. **Livraison** : React/Vite/TS/Tailwind + Dexie, aucune API backend, Firefox/Chrome/Safari iOS, responsive mobile/tablette portrait/paysage/PC/ultralarge, accessibilité clavier et `prefers-reduced-motion`. Livrer `npm install`, `npm run dev`, `npm run build`, tests automatisés, README de configuration et Firebase Hosting statique.

**Livrable attendu :** une application de collection privée, statique et configurable, gérant 110 modèles éditoriaux (extensibles), six variantes par modèle, boosters gratuits rechargeables hors jeu, économie de fragments et transferts locaux de cartes signés et chiffrés sans backend.

## 15. Références techniques

- Tailwind CSS / Vite : https://tailwindcss.com/docs/installation/using-vite
- Dexie React `useLiveQuery` : https://dexie.org/docs/dexie-react-hooks/useLiveQuery%28%29
- Firebase Hosting SPA rewrites : https://firebase.google.com/docs/hosting/full-config
- Web Crypto `SubtleCrypto` / ECDH-HKDF / ECDSA / AES-GCM : https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
- Web Crypto dérivation de secret partagé : https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits
- Sérialisation `CryptoKey` / API Web Crypto : https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
- MDN stockage navigateur : https://developer.mozilla.org/en-US/docs/Web/API/Storage_API
- MDN quotas/éviction : https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
