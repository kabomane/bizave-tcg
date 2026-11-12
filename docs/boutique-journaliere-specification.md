# Bizave TCG — Boutique journalière

> Document de conception fourni avant implémentation. Les ajustements validés ensuite (reroll commun, fermeture des ventes, interface finale) sont décrits dans [le fonctionnement livré](boutique-journaliere.md).

> **Spécification fonctionnelle et technique — préparation de mise à jour**\
> État : **conception validée sur les principes**, sans implémentation dans le dépôt.\
> Projet : [`kabomane/bizave-tcg`](https://github.com/kabomane/bizave-tcg)\
> Référentiel examiné : branche `main` (novembre 2026).\
> Audience : propriétaire du projet, développeurs, agents IA / Codex.

## 0. Résumé exécutable

Ajouter à `/boutique` une **boutique journalière personnelle**, renouvelée à **minuit, fuseau `Europe/Paris`**, indépendante de la boutique hebdomadaire. Elle propose :

1. **Un lot de 5 à 10 boosters strictement identiques**, au sens où **tous les boosters du lot sont de la même édition** (et non un assortiment de types). Leur nombre est tiré selon une distribution décroissante. Le **type de booster** est sélectionné par deux tirages pondérés : catégorie, puis édition dans la catégorie.
2. **Une remise aléatoire de 5 % à 20 %**, appliquée au prix habituel du lot ; le tirage est indépendant de son type et de sa quantité.
3. **0 à 3 cartes individuelles**, avec les **taux normaux** du jeu, une seule acquisition possible par offre et le **même algorithme de prix** que la vitrine hebdomadaire : facteur `×2,75`, variation triangulaire et arrondi existants.
4. Un nouveau booster **`legenda completa`**, **exclusif à cette boutique**, coûtant **1 600 fragments l'unité avant remise**, avec **5 légendaires garanties**, mais les finitions et variantes d'illustration habituelles.
5. Une **seule ligne courante** dans une nouvelle table IndexedDB (`dailyShop/current`) pour les offres, les achats journaliers et le stock journalier restant. Au renouvellement, cette ligne est **remplacée**, les boosters journaliers **achetés mais non ouverts expirent** ; aucune archive historique d'offres ou de transactions journalières ne doit s'accumuler. Les ouvertures déjà commencées doivent rester récupérables.

**Non-objectifs :** ne pas changer les taux globaux des boosters existants ; ne pas rendre `legenda completa` gratuit ou achetable dans la boutique permanente ; ne pas ajouter de texte d'avertissement « Expire au prochain renouvellement » ; ne pas créer de reroll ni de nouvelle monnaie ; ne pas modifier le fonctionnement de la boutique hebdomadaire.

---

## 1. Décisions retenues / points restant à paramétrer

### 1.1. Décisions retenues

| Sujet | Règle |
|---|---|
| Fréquence | Chaque jour à 00:00 `Europe/Paris` |
| Offre boosters | Un **seul type** pour l'ensemble du lot ; quantité entière de 5 à 10 |
| Sélection type | Tirage pondéré **catégorie**, puis tirage pondéré **booster** avec la **même fonction générique** |
| Catégories | `classic`, `special`, `event` |
| Classiques | Memory Frame et Anima Isekai, chacun de poids **1** |
| Spéciaux | rarity only **20**, epico stellari **5**, legenda completa **1** |
| Probabilités globales des spéciaux (sans modification de catégorie) | **8 % / 2 % / 0,4 %** |
| Prix de référence des boosters | Memory Frame 70 ; Anima Isekai 50 ; rarity only 400 ; epico stellari 700 ; legenda completa **1 600** fragments |
| Remise lot | Tirage **uniforme entier** de 5 à 20 % inclus, indépendante du type de booster |
| Lot : quantité | 5 : 30 % ; 6 : 25 % ; 7 : 20 % ; 8 : 12 % ; 9 : 8 % ; 10 : 5 % |
| Événements | Catégorie active seulement lorsqu'un ou plusieurs boosters événementiels sont disponibles ; ceux-ci utilisent le **même moteur pondéré** |
| Vitrine de cartes | **0, 1, 2 ou 3 cartes**, sans taux de rareté/finitions/Full Art boostés |
| Prix des cartes individuelles | Même calcul que vitrine hebdomadaire : référence `×2,75` et variation existante |
| Limites d'achat | Chaque carte individuelle au plus une fois ; pour le lot, **une proposition par jour à acheter comme lot entier** (hypothèse fonctionnelle de mise en œuvre, voir § 1.2) |
| Expiration | Boosters achetés via l'offre journalière et non ouverts perdus à la bascule journalière |
| Ouverture commencée | Résultats persistés et récupérables après minuit, sans nouveau tirage |
| Stockage | `dailyShop/current`, une seule ligne persistée pour l'état de boutique ; **pas de logs d'achats journaliers** |
| Interface | Même conventions visuelles et tactiles que la boutique actuelle, sans nouvelle mention textuelle sur l'expiration |

### 1.2. Paramètres non arrêtés explicitement

Afin d'éviter que l'IA de développement transforme une supposition en règle définitive :

- **Probabilité de la catégorie Événement lorsqu'elle est active : à définir.** Elle sera configurable. La catégorie spéciale conserve 10,4 % ; la part événementielle est prélevée sur les classiques. Exemple seulement : si `eventCategoryWeight = 50` sur 1 000, alors Événement = 5 %, Spécial = 10,4 %, Classique = 84,6 %. **L'exemple de 5 % n'est pas une décision.**
- **Distribution entre 0, 1, 2 et 3 cartes journalières : non fixée.** Une distribution uniforme 25/25/25/25 peut servir de valeur provisoire si nécessaire, mais ne doit pas être présentée comme un arbitrage validé.
- **Achat du lot :** l'interprétation du « lot de 5 à 10 boosters » retenue dans ce document est **un achat unique du lot entier** (et non 5 à 10 ventes unitaires). À confirmer lors du maquettage/recette si l'intention est différente. Le stockage et les transactions restent adaptables.
- **Fermeture anticipée des ventes :** l'hebdomadaire ferme les ventes Lucky Boost deux heures avant échéance. Rien n'impose de reproduire cette fermeture dans une boutique de seulement 24 h : ne pas l'ajouter sans décision explicite.
- **Prix et pondérations d'événements futurs :** à fournir par chaque événement. Un événement qui donne une carte temporaire n'est pas équivalent à un booster normal de cinq cartes.

**Directive pour l'IA :** implémenter les paramètres décidés ; isoler les autres dans des constantes documentées au lieu d'inventer des règles cachées.

---

## 2. Architecture de sélection — deux tirages pondérés génériques

### 2.1. Principe

```
                   CRÉATION DE LA BOUTIQUE JOURNALIÈRE
                                  │
                                  ▼
                   [1] Tirage pondéré catégorie
                     classic / special / event
                                  │
                                  ▼
              [2] Tirage pondéré du booster éligible
                  avec la MÊME fonction weightedPick
                                  │
                                  ▼
                 [3] Tirage quantité : 5 à 10
                                  │
                                  ▼
                  [4] Tirage remise : 5 à 20 %
                                  │
                                  ▼
            Offre figée : N × [même booster] à prix réduit
                                  │
                                  ▼
            Tirage indépendant de 0 à 3 cartes à l'unité
```

**Important :** le « booster classique » n'est **pas un nouveau booster mélangé**. C'est simplement la catégorie au sein de laquelle on choisit **une** édition : Memory Frame **ou** Anima Isekai. Une fois l'édition choisie, **N copies de cette édition** constituent le lot.

### 2.2. Pourquoi des poids et non des taux figés ?

La même fonction sélectionne des entrées munies de `{ id, weight }`, sans exiger que les poids totalisent 100.

Soit un ensemble d'entrées éligibles `E` de poids strictement positifs `w_i` :

\[
P(i\mid E) = \frac{w_i}{\sum_{j\in E} w_j}.
\]

Toute entrée désactivée ou indisponible est retirée **avant** la normalisation ; sa présence ne consomme pas de probabilité. Cela rend l'architecture extensible (plusieurs classiques, plusieurs spéciaux, plusieurs événements).

L'implémentation existante `src/game/engine.ts::weightedPick` normalise **déjà** des poids arbitraires de cette manière : on peut la réutiliser, en ajoutant au besoin un petit adaptateur pour tableaux.

### 2.3. Catégories — masses globales

Sans événement, conserver exactement les taux initialement approuvés :

| Catégorie | Poids sur 1 000 | Probabilité |
|---|---:|---:|
| `classic` | 896 | 89,6 % |
| `special` | 104 | 10,4 % |
| `event` | 0 | 0 % |
| **Total** | **1 000** | **100 %** |

Si des événements sont actifs et qu'on décide de leur accorder `e` unités de masse globale :

```
categoryWeights = {
  classic: 896 - e,
  special: 104,
  event: e,
}
```

avec `0 <= e <= 896`, `e = 0` si aucun événement actif, et `e` configurable. Les poids totalisent toujours 1 000. **Les probabilités absolues de tous les spéciaux restent inchangées lorsque les événements sont ajoutés.**

Si l'on souhaite plus tard modifier la probabilité globale des spéciaux, le faire explicitement par une nouvelle configuration de catégorie, et non par l'ajout implicite d'une édition.

### 2.4. Poids des boosters dans leur catégorie

| Catégorie | ID technique | Nom affiché | Poids | Probabilité conditionnelle |
|---|---|---|---:|---:|
| `classic` | `phantom-blood` | Memory Frame | 1 | 50 % |
| `classic` | `anima-isekai` | Anima Isekai | 1 | 50 % |
| `special` | `rarity-only` | rarity only | 20 | 20/26 = 76,923 % |
| `special` | `epico-stellari` | epico stellari | 5 | 5/26 = 19,231 % |
| `special` | `legenda-completa` | legenda completa | 1 | 1/26 = 3,846 % |
| `event` | ID propre à l'événement | Selon événement | 1 par défaut | 1 / nombre d'événements actifs si poids égaux |

**Pourquoi 20 / 5 / 1 ?** Parce que `20 + 5 + 1 = 26`, et donc, avec la catégorie spéciale à 10,4 % :

\[
P(\text{rarity only}) = 0{,}104 \times \frac{20}{26} = 0{,}08 = 8\%.
\]
\[
P(\text{epico stellari}) = 0{,}104 \times \frac{5}{26} = 0{,}02 = 2\%.
\]
\[
P(\text{legenda completa}) = 0{,}104 \times \frac{1}{26} = 0{,}004 = 0{,}4\%.
\]

**Distribution globale sans événement :**

| Booster proposé dans le lot du jour | Probabilité |
|---|---:|
| Memory Frame | 44,8 % |
| Anima Isekai | 44,8 % |
| rarity only | 8 % |
| epico stellari | 2 % |
| legenda completa | **0,4 %** |
| **Total** | **100 %** |

Sous un événement qui reçoit une masse globale `e`, chaque classique devient `(896 − e) / 2 000` en probabilité, tandis que les spéciaux restent respectivement à 8 %, 2 %, 0,4 %.

### 2.5. Sélection et disponibilité

- Réutiliser les **IDs stables** des boosters actuels. Ne pas renommer `phantom-blood` : cet ID correspond déjà à Memory Frame.
- La pondération de **l'offre journalière** n'altère **jamais** les taux de drop `rates` propres à un booster.
- `event` est éligible uniquement si un ou plusieurs événements sont actifs **à la génération de l'offre du jour**.
- Les événements utilisent exactement la même fonction de pondération que les autres catégories. Si deux événements ont chacun le poids 1, ils ont 50/50 *conditionnellement à la catégorie Événement*.
- Vérifier avant le tirage la disponibilité de la définition, de son pool, du prix et du statut d'activation. Une catégorie vide n'est jamais sélectionnée.
- Toute modification des pools/taux après publication doit respecter les règles actuelles de compatibilité. Ne pas régénérer une offre déjà sauvegardée au cours de la journée sans raison de sécurité ou migration.

---

## 3. Le lot journalier : quantité, remise et prix

### 3.1. Quantité — courbe validée

| Nombre de boosters `N` | Poids | Probabilité |
|---:|---:|---:|
| 5 | 30 | 30 % |
| 6 | 25 | 25 % |
| 7 | 20 | 20 % |
| 8 | 12 | 12 % |
| 9 | 8 | 8 % |
| 10 | 5 | 5 % |
| **Total** | **100** | **100 %** |

Espérance :

\[
E[N] = 5(0{,}30) + 6(0{,}25) + 7(0{,}20) + 8(0{,}12) + 9(0{,}08) + 10(0{,}05) = \boxed{6{,}58}.
\]

Les quantités importantes sont moins fréquentes ; **la quantité n'influence pas le type du booster** et réciproquement.

### 3.2. Remise — tirage uniforme validé

\[
D \sim \mathrm{UniformeDiscrète}\{5,6,\dots,20\}, \qquad E[D]=12{,}5\%.
\]

Il y a **16 remises possibles**, chacune avec une chance de `1/16 = 6,25 %`.

Pour une édition de prix unitaire `U` et un lot de `N` boosters :

\[
P_{\mathrm{normal}} = U \times N.
\]
\[
P_{\mathrm{final}} = \operatorname{round}\left(P_{\mathrm{normal}}\times \left(1-\frac{D}{100}\right)\right).
\]

`round` arrondit **une seule fois le total** au fragment entier le plus proche ; conserver un entier sûr (`Number.isSafeInteger`). Ce choix préserve la remise de 5–20 % plus fidèlement qu'un arrondi à la dizaine. **Si la DA exige des prix en multiples de 10, décider explicitement d'une autre convention et vérifier l'écart entre la remise affichée et la remise réellement obtenue.**

La remise **ne s'applique qu'au lot**, pas aux cartes individuelles de vitrine.

### 3.3. Prix unitaires de référence

| Booster | Prix unitaire normal | Lot de 5 sans remise | Lot de 10 sans remise |
|---|---:|---:|---:|
| Memory Frame | 70 | 350 | 700 |
| Anima Isekai | 50 | 250 | 500 |
| rarity only | 400 | 2 000 | 4 000 |
| epico stellari | 700 | 3 500 | 7 000 |
| legenda completa | **1 600** | **8 000** | **16 000** |

**Exemples de prix après remise** (arrondis à l'entier) :

| Composition | Remise | Prix total |
|---|---:|---:|
| 5 Memory Frame | −20 % | 280 |
| 5 Anima Isekai | −5 % | 238 |
| 7 rarity only | −15 % | 2 380 |
| 6 epico stellari | −10 % | 3 780 |
| 5 legenda completa | −20 % | 6 400 |
| 10 legenda completa | −20 % | 12 800 |

Ne **pas** appliquer des tarifs séparés aux boosters du lot ni faire varier leur probabilité de drop en fonction de la remise. Les probabilités de catégorie, d'édition, de quantité et de remise sont des tirages **distincts**.

### 3.4. Achat et consommation

- Une seule offre de lot par journée et par sauvegarde. L'offre est **persistée**, elle ne se régénère pas à chaque visite.
- **Achat du lot entier**, en une transaction qui débite le prix final et crédite exactement `N` boosters dans le **stock journalier de `dailyShop/current`**.
- Après l'achat, marquer l'offre comme vendue. **Pas de second achat** avant le prochain renouvellement (interprétation d'implémentation ; cf. § 1.2).
- Le joueur peut ouvrir ses exemplaires au fil de la journée ; chaque ouverture consomme une unité de stock journalier.
- À l'expiration de la journée, le stock journalier non consommé est supprimé sans remboursement. Le contenu des cartes déjà tirées reste acquis.
- **Ne pas** transférer ce stock vers `boosterStock` ; sinon les exemplaires survivraient au renouvellement, contrairement à la règle demandée.

---

## 4. Nouveau booster « legenda completa »

### 4.1. Définition

| Élément | Règle |
|---|---|
| ID conseillé | `legenda-completa` |
| Nom | `legenda completa` |
| Catégorie de boutique journalière | `special` |
| Poids interne | **1** |
| Probabilité globale de proposition (sans changement des catégories) | **0,4 %** |
| Prix unitaire hors remise | **1 600 fragments** |
| Cartes par booster | **5** |
| Pool | Toutes les légendaires éligibles du catalogue normal, sans promos ni cartes événementielles temporaires |
| Taux de rareté | Commune 0 %, peu commune 0 %, rare 0 %, épique 0 %, **légendaire 100 %** |
| Finition | Mate 81 %, Holographique 15 %, Alternative 4 % |
| Illustration | Classique 92 %, Full Art 8 % |
| Boutique permanente | **Jamais proposé** |
| Boosters gratuits | **Jamais proposé** |
| Boutique hebdomadaire | **Jamais proposé comme offre standard** |
| Boutique journalière | **Seul canal d'obtention du booster** |

Les **cinq cartes** sont tirées indépendamment selon le pool des légendaires disponibles. Les doublons restent possibles. Aucune garantie de cinq modèles différents, de Full Art ou de finition particulière.

**Important :** « taux des cartes classiques mais 100 % de légendaire » signifie que seule la **distribution des raretés** est remplacée. Les taux de finitions et d'illustrations restent ceux par défaut du jeu.

### 4.2. Disponibilité technique

Ne pas l'ajouter comme produit permanent achetable. Deux voies possibles :

- Ajouter sa définition au registre des boosters **tout en excluant explicitement** les modes d'accès gratuits et permanents ; ou
- Créer un registre de définitions propre aux éditions disponibles pour la boutique journalière.

**Préférence :** centraliser les définitions des boosters sans les confondre avec leurs **canaux de distribution**. Le moteur de tirage `drawPack` doit rester partagé avec les autres éditions ; l'exclusivité ne doit dépendre que des services de distribution et d'inventaire.

Ne jamais faire passer les achats journaliers par `buyBooster()` classique simplement parce qu'une définition porte un prix. Il faut une opération `buyDailyBundle()` dédiée qui fait respecter la disponibilité du jour.

### 4.3. Équilibrage — effet attendu

Un booster Legenda Completa donne cinq légendaires ; un lot de 5 à 10 boosters donne donc **25 à 50 cartes légendaires**, avant dédoublonnage.

- La probabilité d'obtenir **une offre Legenda Completa un jour donné** est de 0,4 % hors modification de la catégorie spéciale.
- En supposant un tirage journalier indépendant : **250 jours en moyenne entre deux apparitions** pour un joueur qui consulte toutes ses boutiques ; ce n'est pas une garantie, et l'offre peut rester inaccessible faute de fragments.
- La probabilité d'au moins une apparition sur `d` jours est : `1 − (1 − 0,004)^d`.
- La rareté de l'offre et son coût élevé limitent la disponibilité, **pas** le taux de légendaires **une fois le booster ouvert**.

Le prix de **1 600 fragments par unité est une décision retenue**, à surveiller après déploiement. Il ne doit pas être automatiquement ramené à 1 100 au nom d'une autre estimation.

---

## 5. Cartes individuelles journalières

### 5.1. Génération de la vitrine

- Tirer un nombre `K ∈ {0,1,2,3}`. **La distribution de `K` reste à paramétrer (§ 1.2)**.
- Tirer les cartes du catalogue normal (sans promos ni cartes événementielles temporaires).
- Utiliser les **taux standards**, et non les taux boostés de la vitrine hebdomadaire :

| Rareté | Taux |
|---|---:|
| Commune | 57 % |
| Peu commune | 24 % |
| Rare | 12 % |
| Épique | 5 % |
| Légendaire | 2 % |

| Finition | Taux |
|---|---:|
| Mate | 81 % |
| Holographique | 15 % |
| Alternative | 4 % |

| Illustration | Taux |
|---|---:|
| Classique | 92 % |
| Full Art | 8 % |

Les trois axes (rareté, finition, illustration) sont tirés indépendamment. À rareté donnée, sélectionner un modèle éligible selon les poids existants des cartes. Privilégier des **modèles distincts entre les 0–3 offres**, comme dans la vitrine hebdomadaire ; les différents exemplaires détenus par le joueur n'entrent pas dans cette contrainte. Chaque offre est à **achat unique** jusqu'au renouvellement.

### 5.2. Algorithme de prix — identique à l'hebdomadaire

Le code de référence est `src/game/weeklyShop.ts` : `cardValue`, `variation`, `round10`, `rollWeeklyShowcase`.

Avec :

- `B_r` : valeur de recyclage de base par rareté = `1 / 3 / 7 / 12 / 19` fragments ;
- `M_f` : multiplicateur de finition = `1 / 2,3 / 3,2` ;
- `M_a` : multiplicateur d'illustration = `1 / 1,9` ;
- `U` et `V` : uniformes indépendantes sur `[0,1)` ;
- `T = 0,8 + 0,2(U + V)` : variation **triangulaire**, comprise entre 0,8 et 1,2.

Le prix de la carte est :

\[
V_{\text{référence}} = 3\,B_r\,M_f\,M_a
\]
\[
P_{\text{carte}}=\max\left(10,\;10\times\operatorname{round}\left(\frac{V_{\text{référence}}\times2{,}75\times T}{10}\right)\right).
\]

**C'est le calcul d'affichage/vente, pas la valeur de recyclage**, laquelle conserve sa formule actuelle avec un unique `floor` final sur les multiplicateurs.

- Calculer et conserver le prix dès la génération du jour. Ne pas recalculer lors de l'achat.
- **Pas de réduction de 5–20 % sur les cartes individuelles** ; celle-ci appartient exclusivement au lot de boosters.
- À achat confirmé, ajouter immédiatement la carte dans `drops` et mettre à jour `discoveries`, comme pour `buyWeeklyOffer()`.
- La carte obtenue reste permanente après le renouvellement ; seule son **offre de vente** disparaît.

---

## 6. Stockage, cycle de vie et expiration

### 6.1. Une ligne courante, pas d'historique

Créer une table Dexie `dailyShop` avec clé primaire `&id`, et **une unique entrée** `{ id: 'current', ... }`.

- Les champs de cette entrée décrivent l'offre, le lot acheté, le stock restant, les cartes et leur statut vendu/non vendu.
- La régénération **remplace** cette même ligne : pas une entrée par jour, pas une entrée par booster, pas de `dailyPurchases`.
- Les opérations légitimes sur les autres tables (`player`, `drops`, `discoveries`, `openings`) restent nécessaires. « Une seule ligne » concerne **l'état de la boutique journalière**, pas l'ensemble de la base du joueur.
- Une offre qui n'a jamais été ouverte n'est pas générée rétroactivement pour les jours manqués.

### 6.2. Exemple de modèle TypeScript (proposition)

```ts
type DailyCategory = 'classic' | 'special' | 'event'

type DailyBoosterEntry = {
  id: string                 // ID stable de l'édition (ex.: phantom-blood)
  category: DailyCategory
  weight: number             // > 0, relatif à sa catégorie
  unitPrice: number          // Prix normal, en fragments
  active: boolean            // Statut d'éligibilité au moment du tirage
}

type DailyBundle = {
  boosterId: string          // Tous les boosters achetés sont de ce type
  category: DailyCategory
  quantity: number           // 5..10
  unitPrice: number          // Prix de référence au moment du tirage
  discountPercent: number    // 5..20
  normalPrice: number        // quantity * unitPrice
  price: number              // Total remisé, entier
  purchased: boolean        // Achat du lot validé ?
  owned: number              // Exemplaires achetés mais non ouverts, 0..quantity
  // Ajouter un snapshot minimal de la définition si nécessaire pour
  // garantir une ouverture cohérente jusqu'au prochain minuit.
}

type DailyCardOffer = {
  id: string
  cardId: string
  finish: 'normal' | 'glossy' | 'alternative'
  artVariant: 'standard' | 'fullArt'
  price: number
  sold: boolean
}

type DailyShopRow = {
  id: 'current'
  dayStart: number           // Minuit Europe/Paris, timestamp UTC ms
  renewAt: number            // Minuit suivant Europe/Paris, UTC ms
  bundle: DailyBundle
  cards: DailyCardOffer[]    // 0..3
}
```

Ce schéma est **illustratif**, pas une obligation de reprendre tous ces noms de types. En revanche, les invariants, les transactions et l'absence d'historique doivent être conservés.

### 6.3. Calcul du jour civil Europe/Paris

Créer une fonction pure `dailyPeriod(now)` utilisant **les dates civiles de `Europe/Paris`**, sur le modèle de `weeklyPeriod` existant.

```
{ dayStart: minuit de la date parisienne en cours,
  renewAt: minuit de la date parisienne suivante }
```

**Ne pas calculer `renewAt = dayStart + 86_400_000`** : les journées de changement d'heure peuvent durer 23 ou 25 heures. Un joueur au Japon ou au Québec voit le même instant de renouvellement que les autres joueurs, car la règle de référence est Paris.

En jeu : utiliser `Math.max(Date.now(), player.maxObservedClockAt)` comme dans la boutique hebdomadaire afin de limiter la régression accidentelle de l'horloge. Cela ne constitue **pas** une sécurité absolue contre la manipulation d'une sauvegarde locale hors ligne.

### 6.4. Renouvellement

À l'arrivée de `now >= renewAt` :

1. Effectuer un changement atomique de la ligne `dailyShop/current`.
2. Supprimer implicitement les offres de la veille et le `owned` journalier restant en remplaçant la ligne.
3. Créer **une nouvelle offre**, et seulement celle du jour courant.
4. Conserver **toutes** les cartes déjà obtenues dans `drops` et `discoveries`.
5. Préserver l'`OpenRecord` d'une **ouverture déjà commencée** (`revealComplete === false`) : les résultats doivent demeurer récupérables au retour dans le jeu.

Ne pas rajouter de bouton/rappel « Expire au prochain renouvellement » : cette règle est déjà exposée dans les règles du jeu, selon le choix du propriétaire.

### 6.5. Cas critique : classique acheté au quotidien + stock gratuit

`Memory Frame` et `Anima Isekai` sont aussi disponibles en crédits gratuits. **La seule présence d'un `boosterId` ne suffit pas à identifier quel stock consommer.** Le `openBooster()` actuel tente de consommer le stock gratuit pour une édition `access.type === 'free'`.

**Solution recommandée :** une entrée distincte « stock journalier » dans l'interface et un point d'entrée explicite `openDailyBooster(dayStart)` / `openDailyBooster({ dayStart, boosterId })` qui :

- Vérifie l'identité de l'offre active et l'existence d'un exemplaire journalier ;
- Décrémente `dailyShop.current.bundle.owned` ;
- **Ne touche ni `freePackStock`, ni `boosterStock`** ;
- Résout la définition réelle du booster (`phantom-blood`, `anima-isekai`, etc.) ;
- Appelle le **même moteur `drawPack`** que les ouvertures normales ;
- Persiste l'ouverture et les cartes en une transaction, puis réutilise la même interface de révélation.

Il est possible de conserver dans `OpenRecord` l'ID réel de l'édition et `payment: 'shop'` (déjà accepté par les sauvegardes), afin d'éviter d'élargir inutilement l'énumération des paiements. Si le rendu exige une distinction explicite, envisager un champ d'origine optionnel validé lors des migrations.

**Ne pas créer un second moteur de probabilité des cartes.** La nouveauté concerne seulement la *sélection de l'offre* et *le stock consommé*.

### 6.6. Booster événementiel temporaire

Actuellement, `merry xmas` est un cas particulier : **une carte par booster**, uniquement Mate/Classique, **carte temporaire qui ne rejoint pas la collection**. Il coûte normalement 30 fragments et est activé via la configuration d'événement.

Le système journalier doit pouvoir sélectionner son édition **si elle est active** mais réutiliser ses règles propres au moment de `drawPack` et de l'attribution : ne pas injecter une carte temporaire dans `drops` sous prétexte qu'elle a été achetée via le journalier. Les contrôles d'éligibilité événementielle devront être **cohérents entre la génération et l'ouverture**, y compris pour une offre générée pendant un événement qui arrive à son terme au changement de jour.

Le nombre `5..10` désigne **des boosters**, pas nécessairement `25..50` cartes dans le cas des éditions événementielles à `cardsPerPack = 1`.

---

## 7. Fonctions recommandées et pseudo-code TypeScript

> **Objectif :** mutualiser un seul algorithme de sélection pondérée. On réutilise le `weightedPick()` existant, plutôt que de coder plusieurs branches de tirage manuelles.

### 7.1. Configuration proposée

```ts
export const DAILY_CATEGORY_MASS = {
  classic: 896,   // 89,6 % sans événement
  special: 104,   // 10,4 % (reste FIXE avec des événements)
  event: 0,       // variable lorsque les événements sont actifs
} as const

export const DAILY_BUNDLE_SIZE_WEIGHTS = {
  5: 30,
  6: 25,
  7: 20,
  8: 12,
  9: 8,
  10: 5,
} as const

export const DAILY_DISCOUNT_MIN = 5
export const DAILY_DISCOUNT_MAX = 20

export const DAILY_BOOSTER_SELECTION = [
  { id: 'phantom-blood',    category: 'classic', weight: 1 },
  { id: 'anima-isekai',     category: 'classic', weight: 1 },
  { id: 'rarity-only',      category: 'special', weight: 20 },
  { id: 'epico-stellari',   category: 'special', weight: 5 },
  { id: 'legenda-completa', category: 'special', weight: 1 },
  // Événements : enregistrés dynamiquement avec catégorie 'event'
] as const
```

**Important :** ce tableau est une **configuration de disponibilité journalière**, pas une invitation à modifier les IDs ou les sources actuelles des boosters. Le prix unitaire doit venir de la définition centrale du booster, non d'une copie divergent silencieusement.

### 7.2. Adaptateur de `weightedPick` pour n'importe quelle catégorie

```ts
type WeightedItem<T extends string> = { id: T; weight: number }

function pickWeighted<T extends string>(
  eligible: readonly WeightedItem<T>[],
  rng: () => number = secureRandom,
): T {
  if (eligible.length === 0) throw new Error('Aucune entrée éligible.')
  if (new Set(eligible.map(e => e.id)).size !== eligible.length)
    throw new Error('Identifiant pondéré dupliqué.')
  if (eligible.some(e => !Number.isFinite(e.weight) || e.weight <= 0))
    throw new Error('Poids pondéré invalide.')

  return weightedPick(
    Object.fromEntries(eligible.map(e => [e.id, e.weight])) as Record<T, number>,
    rng,
  )
}
```

Un seul `pickWeighted()` pour les catégories, les boosters, les tailles de lots et, éventuellement, le nombre de cartes si sa distribution est pondérée.

### 7.3. Générateur de l'offre quotidienne (pseudo-code proche de TS)

```ts
function rollDailyBundle(
  allEntries: DailyBoosterEntry[],
  eventCategoryWeight: number,
  rng: () => number = secureRandom,
): DailyBundle {
  const entries = allEntries.filter(e => e.active && e.weight > 0)
  const hasEvent = entries.some(e => e.category === 'event')
  const e = hasEvent ? eventCategoryWeight : 0
  if (!Number.isFinite(e) || e < 0 || e > 896)
    throw new Error('Poids événementiel invalide.')

  const categoryWeights = [
    { id: 'classic', weight: 896 - e },
    { id: 'special', weight: 104 },
    { id: 'event', weight: e },
  ] as const

  const eligibleCategories = categoryWeights.filter(
    c => c.weight > 0 && entries.some(b => b.category === c.id),
  )
  // Le catalogue normal doit toujours fournir au minimum un classique
  // et un spécial. Ne jamais repondérer silencieusement une catégorie
  // manquante sans règle explicite.
  const category = pickWeighted(eligibleCategories, rng)

  const boosterId = pickWeighted(
    entries.filter(b => b.category === category),
    rng,
  )
  const booster = entries.find(b => b.id === boosterId)!
  const quantity = Number(pickWeighted(
    Object.entries(DAILY_BUNDLE_SIZE_WEIGHTS).map(([id, weight]) => ({ id, weight })),
    rng,
  ))
  const discountPercent = 5 + Math.floor(rng() * 16)
  const normalPrice = quantity * booster.unitPrice
  const price = Math.round(normalPrice * (100 - discountPercent) / 100)

  return {
    boosterId, category, quantity, unitPrice: booster.unitPrice,
    discountPercent, normalPrice, price,
    purchased: false, owned: 0,
  }
}
```

> La signature et les types peuvent être ajustés au projet réel. Les invariants sont plus importants que la forme précise de cet exemple.

### 7.4. Vitrine de cartes

Fonction pure `rollDailyCards(catalogue, rng)` :

1. Tirer `K` entre 0 et 3 via la distribution configurée.
2. Déterminer pour chaque emplacement une rareté via `DEFAULT_RARITY_RATES`, puis une carte éligible.
3. Retirer le modèle choisi des candidats de la vitrine du jour pour éviter les doublons **entre offres**.
4. Tirer finition et illustration via `DEFAULT_FINISH_RATES` et `DEFAULT_ART_VARIANT_RATES`.
5. Appliquer **`cardValue × 2.75 × variation` + `round10`**, comme `rollWeeklyShowcase` ; stocker le prix obtenu.
6. Ajouter `{id, cardId, finish, artVariant, price, sold:false}` à la ligne du jour.

Éviter de dupliquer le code du prix dans deux fichiers : extraire au besoin `cardValue`, `variation` et `round10` vers un module économique commun et réutiliser depuis la boutique hebdomadaire. Vérifier que cela ne change aucun résultat hebdomadaire existant.

### 7.5. Transactions

**`refreshDailyShop(database, now)`**

- Sous transaction (`player`, `dailyShop`, `accountState`), vérifier la partie active ; calculer le temps observé et `dailyPeriod` ; lire `current` ; conserver si la journée correspond ; sinon le remplacer par une génération unique. Ne pas recalculer l'offre à chaque rerender.

**`buyDailyBundle(expectedDayStart)`**

- Sous transaction (`player`, `dailyShop`, `accountState`), relire la date active et la ligne du jour, vérifier `purchased=false`, le prix, le solde, l'absence de renouvellement et les valeurs entières sûres ; débiter `price`, poser `purchased=true`, `owned=quantity`, et mettre à jour l'horloge observée. **Tout ou rien.**

**`buyDailyCard(expectedDayStart, offerId)`**

- Sous transaction (`player`, `dailyShop`, `accountState`, `drops`, `discoveries`), vérifier date/ID/état `sold=false` et solde ; débiter le prix ; créer un `dropId` ; ajouter la carte et sa découverte ; marquer l'offre `sold=true`. **Tout ou rien.**

**`openDailyBooster(expectedDayStart, boosterId)`**

- Sous transaction (`player`, `dailyShop`, `accountState`, `drops`, `discoveries`, `openings`), préserver en priorité une ouverture déjà commencée ; vérifier que `owned > 0` et que le jour n'a pas expiré ; décrémenter `owned`, résoudre l'édition réelle, exécuter `drawPack` avec le bon pool et les bons taux, persister les résultats et la révélation en cours, et mettre à jour les découvertes pour les cartes non temporaires. **Ne jamais consommer le stock gratuit ou permanent.**

Toutes les écritures doivent revalider l'état **dans** la transaction pour résister aux doubles clics, deux onglets et offres obsolètes. Utiliser des identifiants/échéances attendus fournis par l'UI et les comparer à l'état courant en base.

### 7.6. Validation et import/export

Créer `validDailyShop(value, catalogue, registry)` sur le modèle de `validWeeklyShop` :

- `id === 'current'`, `dayStart` correspondant à un minuit de Paris valide, `renewAt` au minuit suivant ;
- `quantity` entier 5..10, `discountPercent` entier 5..20, `normalPrice === quantity × unitPrice`, `price` cohérent avec la formule et bornes des fragments ;
- `category` valide, `boosterId` dans le registre de référence et catégorisation cohérente ;
- `purchased` booléen ; `owned` entier ; `purchased=false => owned=0` ; `purchased=true => 0<=owned<=quantity` ;
- entre 0 et 3 cartes, IDs distincts, modèles valides (sans promos/temporaires), finitions/illustrations valides, prix entiers positifs, `sold` booléen ;
- données importées non modifiables pour s'attribuer un stock gratuit ou prix négatif par simple corruption de champs ;
- toute boutique importée expirée est renouvelée sans restaurer un stock journalier obsolète.

La validation locale protège la cohérence mais **ne fournit pas d'anti-triche absolue** : sans serveur, l'utilisateur garde le contrôle de sa base et de son horloge.

---

## 8. Modifications à prévoir dans le dépôt actuel

### 8.1. Composants existants à réutiliser

| Fichier existant | Ce qu'il apporte / impact |
|---|---|
| `src/game/engine.ts` | `weightedPick`, `secureRandom`, `drawPack`, `resolveBoosterPool`, `uuid` : **réutilisation**, ne pas réinventer |
| `src/game/config.ts` | Taux de rareté 57/24/12/5/2, finitions 81/15/4, illustration 92/8, valeurs de fragments |
| `src/data/boosters.ts` | Définitions et prix des quatre éditions permanentes ; préserver l'ID `phantom-blood` |
| `src/data/christmas.ts` | Exemple d'événement actuel, avec disponibilité et cartes temporaires |
| `src/game/weeklyShop.ts` | Référence pour date Paris, variation triangulaire, arrondi dizaine, prix des cartes et validations |
| `src/storage/weeklyShop.ts` | Modèle de transactions atomiques, contrôle des offres obsolètes et de l'horloge |
| `src/storage/services.ts` | `openBooster`, logique d'ouverture et de sauvegarde des cartes ; **ajouter un chemin de stock journalier sans régression** |
| `src/storage/database.ts` | Schéma Dexie courant **12** ; prévoir une nouvelle version et table `dailyShop` |
| `src/storage/gameState.ts`, `src/components/useGame.ts` | Exposer `dailyShop` au contexte et aux pages |
| `src/storage/saveTransfer.ts` | Liste de tables exportées, validations, compatibilité des fichiers anciens et import de nouvelles sauvegardes |
| `src/pages/ShopPage.tsx` | Intégrer la rubrique journalière sans casser `Cette semaine`, permanents ou bonus |
| `src/pages/BoostersPage.tsx` | Montrer le stock journalier et appeler l'ouverture journalière explicite |
| `src/components/ShopCarousel.tsx`, `ShopBuyButton.tsx`, `CollectibleCard.tsx` | Réutiliser les conventions d'interface et les composants d'achat |
| `src/styles/weekly-shop.css` | Base visuelle ; isoler les styles journaliers si nécessaire |
| `src/data/update.ts`, `README.md`, `CHANGELOG.md`, `VALIDATION.md` | Documentation de la version et instructions, à harmoniser |

### 8.2. Modules proposés (noms indicatifs)

```
src/
├─ game/
│  ├─ weightedSelection.ts       # Optionnel : adaptateur générique, pas de moteur dupliqué
│  ├─ dailyShop.ts               # Types, config, dates, génération, calculs, validation
│  └─ dailyShop.test.ts
├─ data/
│  ├─ boosters.ts                # Définition de legenda completa ou registre partagé
│  └─ dailyShopConfig.ts         # Références d'éditions + catégories + poids
├─ storage/
│  ├─ dailyShop.ts               # Transactions refresh, buy lot/card, open daily
│  ├─ dailyShop.test.ts
│  ├─ database.ts                # Nouvelle version Dexie, table dailyShop
│  └─ saveTransfer.ts            # Import/export et migration
├─ components/
│  └─ DailyShop.tsx              # Rubrique et carrousel
├─ pages/
│  ├─ ShopPage.tsx               # Composition de la boutique
│  └─ BoostersPage.tsx           # Stock journalier à ouvrir
└─ styles/
   └─ daily-shop.css            # Si pertinent

tests/
└─ daily-shop.spec.ts            # Parcours UI de bout en bout

docs/
└─ boutique-journaliere.md      # Cette spécification / documentation mise à jour
```

**Ne pas copier tout le code hebdomadaire** dans une version journalière : partager seulement les utilitaires qui ont réellement les mêmes règles et laisser les cycles de vie (hebdomadaire/journalier) indépendants.

### 8.3. Sauvegardes et migration

- Ajouter une nouvelle version Dexie (`13` si le projet demeure en `12` au moment du développement ; vérifier la version réelle avant édition).
- Adapter les schémas déclarés, les `SAVE_TABLES`, les règles de validation et les anciennes sauvegardes acceptées.
- Une ancienne sauvegarde **sans boutique journalière** doit être importable et générer sa ligne lors de la première ouverture du jeu ; ne pas forcer une remise à zéro du compte.
- Une sauvegarde avec une ancienne boutique du jour doit perdre les offres et boosters non ouverts **si le jour a expiré** ; une ouverture commencée doit rester restaurable.
- Conserver les cartes, fragments, amis, cartes reçues, crédits gratuits et stock permanent existants.
- Les transactions et le nettoyage de compte doivent inclure `dailyShop`.
- La boutique ne doit ajouter ni journal permanent d'achats ni historique de journées passées.

### 8.4. UI/UX

La page `/boutique` actuelle contient `Cette semaine`, `Boosters permanents`, `Bonus de la semaine`. Ajouter une rubrique journalière en cohérence avec les carrousels existants.

Pour le lot, afficher **l'édition unique**, la **quantité**, le **prix normal**, la **remise tirée** et le **prix final** ; les cartes 0..3 sont des offres distinctes du lot, achetables à l'unité. Si aucune carte n'est tirée, ne pas afficher de fausses cartes ou d'emplacements fictifs.

Les boutons suivent les conventions actuelles (`Acheter`, `Épuisé`, états d'attente / achat confirmé), avec verrouillage des clics concurrents, mobile/tactile/clavier, accessibilité et prise en charge des animations réduites. **Ne pas ajouter de texte nouveau sur l'expiration.**

Éviter de mélanger visuellement le stock **journalier** et le stock **gratuit/permanent**, même si le booster sous-jacent est une édition classique : l'action d'ouverture doit savoir précisément quel stock elle consomme.

---

## 9. Tests de recette et invariants à respecter

### 9.1. Probabilités et calculs

- [ ] `pickWeighted` accepte des poids entiers ou décimaux strictement positifs et ne requiert pas une somme de 100.
- [ ] Catégories sans événement : `896 / 104 / 0` ; résultats attendus `89,6 % / 10,4 % / 0 %`.
- [ ] Classiques `1 / 1` → probabilités globales `44,8 % / 44,8 %`.
- [ ] Spéciaux `20 / 5 / 1` → probabilités globales exactement `8 % / 2 % / 0,4 %`.
- [ ] Plusieurs événements actifs de même poids → répartition égale **entre événements**.
- [ ] Événement inactif → catégorie événement non sélectionnable ; ne modifie pas les taux spéciaux.
- [ ] Augmenter les éditions classiques change leur répartition interne, **pas** la probabilité globale de la catégorie classique.
- [ ] La sélection du type, `N` et la remise est indépendante ; un lot n'a **qu'un seul type** de booster.
- [ ] Quantités 5 à 10 : `30/25/20/12/8/5` et espérance `6,58`.
- [ ] Remises 5 à 20 inclus : 16 valeurs équiprobables, moyenne 12,5 %, arrondi du total une seule fois.
- [ ] Tests statistiques à graine fixe / injection de RNG pour contrôler les bords ; les tests déterministes doivent valider la logique et les tests statistiques les distributions à tolérance définie.

### 9.2. Booster Legenda Completa

- [ ] Cinq cartes, **100 % légendaires** (hors promos/temporaires).
- [ ] Finitions 81/15/4 ; illustrations 92/8 ; doublons permis.
- [ ] Coût normal : 1 600 fragments par booster.
- [ ] Absent du stock gratuit, de la boutique permanente et de toute acquisition hors journalier.
- [ ] Présent à 0,4 % de l'offre journalière sans événement, via la catégorie spéciale.
- [ ] Illustration, prix et pool compatibles avec les composants existants, sans renommer les IDs publiés.

### 9.3. Cartes de vitrine

- [ ] Génération `K ∈ {0,1,2,3}` ; `K=0` géré sans crash.
- [ ] Aucun boost : raretés 57/24/12/5/2, finitions 81/15/4, illustration 92/8.
- [ ] Prix identiques à l'algorithme hebdomadaire `×2,75` et variation triangulaire.
- [ ] Les cartes individuelles ne bénéficient **pas** de la remise de lot.
- [ ] Pas de modèles doublés entre offres du même jour.
- [ ] Achat unique par offre ; cartes obtenues persistantes après minuit.

### 9.4. Stockage, ouverture et renouvellement

- [ ] **Une seule** ligne `dailyShop/current` ; aucune accumulation des jours précédents.
- [ ] Rechargement de page / fermeture / réouverture dans la même journée → tirage identique, prix identique, achats conservés.
- [ ] Achat du lot → crédit de **N** exemplaires journaliers, débit atomique du prix ; aucune écriture dans `boosterStock`.
- [ ] Double clic / deux onglets / requête obsolète → aucun double débit, double lot ni double achat de carte.
- [ ] Lors de l'ouverture d'un Memory Frame ou Anima Isekai journalier, le stock gratuit **ne diminue pas**.
- [ ] Les stocks permanents et hebdomadaires sont inchangés par l'ouverture journalière.
- [ ] À minuit Paris : boosters journaliers non ouverts perdus, jamais remboursés ; cartes et découvertes acquises préservées.
- [ ] Ouverture commencée avant minuit, terminée après : résultats conservés **sans second tirage**.
- [ ] Changements d'heure de Paris (journées 23/25 h), joueurs dans d'autres fuseaux et jours manqués gérés correctement.
- [ ] Après import d'une sauvegarde, transaction de renouvellement vérifie l'expiration et refuse les stocks journaliers périmés.
- [ ] Le nettoyage / suppression de compte couvre `dailyShop`.
- [ ] Événements temporaires : le type d'événement sélectionné conserve ses règles d'attribution de cartes (par exemple `merry xmas`).
- [ ] Tests E2E mobile, carrousel, navigation clavier, états indisponibles, petites tailles d'écran, faible solde et accessibilité.

---

## 10. Ordre d'implémentation conseillé pour Codex / IA

1. **Tests et configuration d'abord** : fixer les IDs, catégories, masses globales, poids par édition, loi de quantité et loi de remise. Ajouter les tests exacts `20/5/1 -> 8/2/0,4`.
2. **Définition de `legenda completa`** : nouveau booster avec pool légendaire 100 %, finitions/illustrations par défaut, prix 1 600 et accès exclusivement journalier. Valider qu'il ne fuite pas dans les flux permanent/gratuit.
3. **Logique pure** : `dailyPeriod`, `pickWeighted`, `rollDailyBundle`, `rollDailyCards`, `createDailyShop`, `validDailyShop`. Reprendre les fonctions communes sans modifier les résultats hebdomadaires.
4. **Dexie / transactions** : nouvelle table courante et services de renouvellement, achat du lot, achat de carte, ouverture journalière. Vérifier les écritures atomiques et les collisions multi-onglets.
5. **Intégration du stock** : garantir que les éditions classiques achetées au quotidien ne consomment **jamais** les crédits gratuits. Protéger les ouvertures déjà commencées.
6. **Sauvegardes / migrations** : import/export, passage de schéma, régénération des jours expirés, anciens comptes.
7. **UI** : rubrique journalière, lot à édition unique, quantité/remise/prix, 0 à 3 cartes, achat et stock d'ouverture. Réutiliser les composants existants et **aucun nouveau message sur l'expiration**.
8. **Régression complète** : hebdomadaire, permanent, gratuit, événements, échanges, fragments, compte, PWA/offline, mise à jour des documents et de la note de version.

### Critères de livraison

Une implémentation est complète seulement si :

- le moteur peut tirer n'importe quelle catégorie/édition éligible **sans branche spéciale par nom de booster** ;
- les probabilités **20/5/1** aboutissent exactement à **8 % / 2 % / 0,4 %** dans la configuration de référence ;
- le lot contient **N boosters du même type**, avec remise correcte ;
- `legenda completa` est rare dans l'offre mais garantit cinq légendaires avec finitions/illustrations habituelles ;
- les cartes journalières utilisent les **taux normaux** et le **prix hebdomadaire ×2,75** ;
- la boutique n'accumule pas d'historique IndexedDB ;
- le renouvellement fait disparaître les boosters non ouverts et **pas** les cartes acquises ni les ouvertures commencées ;
- aucune régression n'est introduite sur la boutique hebdomadaire, les boosters gratuits ou permanents.

---

## 11. Sources techniques consultées

- Dépôt : <https://github.com/kabomane/bizave-tcg>
- Spécification de la boutique existante : <https://github.com/kabomane/bizave-tcg/blob/main/docs/boutique-hebdomadaire.md>
- Définitions actuelles des boosters : <https://github.com/kabomane/bizave-tcg/blob/main/src/data/boosters.ts>
- Taux et fragments : <https://github.com/kabomane/bizave-tcg/blob/main/src/game/config.ts>
- Calculs hebdomadaires : <https://github.com/kabomane/bizave-tcg/blob/main/src/game/weeklyShop.ts>
- Moteur de tirage : <https://github.com/kabomane/bizave-tcg/blob/main/src/game/engine.ts>
- Transactions hebdomadaires : <https://github.com/kabomane/bizave-tcg/blob/main/src/storage/weeklyShop.ts>
- Ouverture des boosters : <https://github.com/kabomane/bizave-tcg/blob/main/src/storage/services.ts>
- Sauvegarde/import/export : <https://github.com/kabomane/bizave-tcg/blob/main/src/storage/saveTransfer.ts>
- Schéma IndexedDB : <https://github.com/kabomane/bizave-tcg/blob/main/src/storage/database.ts>

**État du dépôt :** ce document décrit une **future modification** ; aucun fichier du dépôt GitHub n'a été créé, modifié ni déployé lors de sa rédaction.
