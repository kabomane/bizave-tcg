# Bizave TCG — V1

Première version de **Bizave TCG**. Le premier booster, **Phantom Blood**, est prêt : 110 cartes, ouverture, collection, recyclage, boutique et échanges. Les illustrations sont encore en cours de réalisation : de nombreuses cartes utilisent provisoirement des placeholders.

Jeu de collection privé et statique. React, Vite, TypeScript, Tailwind CSS v4, Dexie/IndexedDB. Aucun serveur applicatif, compte ou paiement.

## Édition actuelle : Phantom Blood

Un seul booster est publié : **Phantom Blood**, sous-titre **110 cartes**. Son pool gratuit est défini explicitement dans `src/data/pools/phantom-blood.json`. Avant publication, les 110 modèles ont été actualisés d’après le carnet du 26 octobre 2026 : six retraits et six ajouts, sans migration des anciennes sauvegardes de test.

L’interface utilise une DA ivoire, encre et bordeaux indépendante du cahier de référence. Le sachet se clique directement ; chaque carte révélée se clique pour passer à la suivante. Après la cinquième, un clic affiche le récapitulatif. Les gabarits Fusion/Gundam et la limite de 20° restent inchangés.

La navigation contient **Boosters / Collection / Atelier / Amis**. La collection n’a que deux filtres custom : **Rareté** et **Finitions**. Les finitions se combinent avec l’option **Full Art**, qui continue d’être un axe indépendant dans le moteur. Aucun sélecteur natif n’est utilisé. Les instructions et les formulaires de contact sont affichés à la demande.

## Démarrer

Node.js **24.13 ou ultérieur** recommandé (chargement natif de la configuration TypeScript).

```sh
npm install
npm run dev
```

Le serveur écoute sur **toutes les interfaces**, port **5173**. Vite affiche les adresses du Wi-Fi et du réseau étendu, dont Tailscale si présent. Depuis un autre appareil connecté au même réseau : `http://IP_DU_PC:5173`. Si Windows affiche une demande de pare-feu pour Node, autoriser le réseau privé utilisé. Aucune règle de pare-feu n’est ajoutée par le projet.

Pour tester les **échanges chiffrés** depuis un autre appareil :

```sh
npm run dev:https
```

Pour créer ou renouveler le certificat OpenSSL après un changement d’IP : `npm run cert:dev` (OpenSSL de Git pour Windows pris en charge). Les clés restent dans `.local/certificates`, hors publication.

Cette seconde instance écoute en **HTTPS sur le port 5174**, avec un certificat de développement autosigné. Le navigateur de l’utilisateur peut demander d’accepter ce certificat. L’agent ne passe pas cet avertissement à sa place. En production, Firebase fournit un certificat de confiance.

Sur `http://localhost:5173`, Web Crypto fonctionne car localhost est un contexte de confiance. Sur une adresse IP distante en HTTP, le jeu de collection fonctionne, mais les échanges affichent une erreur HTTPS explicite. Pour tester les échanges, conserver la même adresse HTTPS : changer de protocole, domaine ou port crée une **autre origine et donc une autre sauvegarde**.

## Commandes

| Commande | Action |
| --- | --- |
| `npm run dev` | Développement HTTP, réseau local et étendu, port 5173 |
| `npm run dev:https` | Développement HTTPS, réseau local et étendu, port 5174 |
| `npm run build` | Vérification TypeScript puis build statique dans `dist/` |
| `npm run preview` | Servir le build sur toutes les interfaces, port 4173 |
| `npm test` | Tests Vitest : moteur, économie, Dexie, migrations, cryptographie et concurrence |
| `npm run test:watch` | Tests en continu |
| `npm run test:e2e` | Parcours Playwright sur Chromium, Firefox et WebKit |
| `npm run lint` | ESLint |
| `npm run check` | Lint, tests unitaires/intégration et build |

Pour les tests de navigateurs, installer leurs exécutables une fois avec `npx playwright install`. Le runner démarre le serveur si nécessaire et utilise des contextes vierges, sans toucher à une collection personnelle. WebKit automatisé ne remplace pas une validation sur un véritable iPhone/iPad. `BIZAVE_TEST_URL` permet de viser une adresse de test précise.

## Ce qui est livré

- Un seul booster Phantom Blood, ouvrable avec les crédits gratuits ou achetable à 70 fragments, contenant les 110 modèles. Aucun autre booster n’est affiché dans l’atelier.
- Les **110 définitions exactes du carnet du 26 octobre 2026** : 40 communes, 23 peu communes, 21 rares, 16 épiques, 10 légendaires. Le catalogue actif compte 63 cartes illustrées ; une même image sert aux formats Classique et Full Art.
- 14 illustrations PNG finales, partagées entre Classique et Full Art ; placeholders SVG pour les autres modèles. Les finitions CSS produisent toujours les six variantes par modèle.
- Disposition **Fusion** pour les cartes classiques et **Gundam** pour les Full Art. Le CSS de la démo est conservé dans `src/styles/cards-reference.css`. Les autres dispositions ne sont pas utilisées. Le plafond d’inclinaison est **20°**, y compris en diagonale et pendant le rebond.
- Trois tirages indépendants, avec remise : rareté **57/24/12/5/2**, finition **81/15/4**, illustration **92/8**. Aucun pity, garantie ni bonus implicite.
- Stock gratuit global **5**, recharge **1/10 min** hors jeu, plafond strict. Les dépenses partielles ne déplacent pas la prochaine échéance.
- Ouvertures persistées avant leur animation, reprise après fermeture/refresh, inventaire par exemplaire, découvertes par variante.
- Collection détenue uniquement, deux filtres custom, atelier, protection de la dernière copie, confirmation de recyclage et historique économique. Les découvertes historiques restent conservées en base.
- Identité locale, carnet d’amis, codes FR1, transferts TR1 chiffrés/signés, boîte d’envoi et registre antirejeu.
- Navigation clavier, dialogues natifs avec focus piégé, responsive et reduced-motion.

Les fichiers fournis sont archivés dans `references/`. La nouvelle demande de refonte prime sur la DA initiale du cahier des charges. Les dispositions Fusion/Gundam et le maximum de 20° restent imposés. Les futurs paquets exclusifs à la boutique et les pools mixtes sont pris en charge et testés avec des fixtures ; seule l’édition Phantom Blood est publiée.

## Modifier les cartes et leurs illustrations

Le catalogue est dans `src/data/catalogue.json`. Une entrée :

```json
{
  "id": "ma-carte",
  "title": "Ma carte",
  "description": "Une courte description.",
  "rarity": "rare",
  "collectionId": "ma-collection",
  "artwork": {
    "standard": "/assets/cards/ma-carte/illustration.png",
    "fullArt": "/assets/cards/ma-carte/illustration.png"
  }
}
```

1. Choisir un `id` stable et unique. Après publication, **ne pas renommer cet ID ni changer sa rareté**.
2. Ajouter une illustration dans `public/assets/cards/ma-carte/illustration.png`. Les deux chemins `artwork.standard` et `artwork.fullArt` pointent vers ce même fichier. Les clés techniques restent stables ; le jeu affiche Classique et Full Art.
3. Le gabarit reste 326 × 540 : la même image est cadrée dans la fenêtre Fusion en Classique et sur toute la carte Gundam en Full Art. Les images utilisent `object-fit: cover`. Un point de cadrage peut être défini avec `artworkPosition.standard` ou `artworkPosition.fullArt` si nécessaire.
4. `rarity` vaut `common`, `uncommon`, `rare`, `epic` ou `legendary`. `weight`, facultatif et strictement positif, change le poids du modèle **dans sa rareté**, jamais le taux de la rareté.
5. Exécuter `npm test` et `npm run build`. Les tests vérifient les références et l’existence des illustrations des deux variantes, qui peuvent partager un fichier. Adapter les totaux éditoriaux du test de catalogue si une nouvelle carte est volontairement ajoutée ; le moteur ne dépend d’aucun de ces totaux.

Seules les descriptions éditoriales du carnet sont affichées. Les champs Mémo et Création ne sont pas des descriptions ; les cartes sans description gardent un encart vide. La référence de génération est `illustrations/prompts/DA-illustrations-Souvenir-Moment-culte.md`. Les placeholders contiennent une mention discrète « Illustration à venir ».

## Créer une collection

1. Ajouter un `{ id, title }` dans `collections` dans `src/data/cards.ts`.
2. Ajouter ses cartes dans le catalogue avec ce `collectionId` et leurs **deux** illustrations.
3. Référencer explicitement les identifiants voulus dans le pool de chaque booster concerné. Chaque paquet doit contenir un modèle de chaque rareté ; les taux restent communs.

Une collection éditoriale n’est pas un booster : plusieurs boosters peuvent partager les mêmes cartes. Aucune page React à dupliquer.

## Créer ou modifier un booster

Le fonctionnement complet est documenté dans [docs/boosters.md](docs/boosters.md).

Les définitions sont dans `src/data/boosters.ts`. Chaque paquet possède son pool, son habillage, son ordre et son accès. Un paquet gratuit consomme le stock commun. Un paquet `access: { type: 'shop', price: 60 }` s’achète en boutique avant d’être ouvert depuis un stock séparé ; les taux de tirage restent communs.

Le lien Boutique se trouve sous Vos boosters. Le carrousel apparaît seulement si plusieurs paquets sont disponibles ; un paquet de boutique y apparaît uniquement quand un exemplaire est détenu. Phantom Blood est aussi proposé en boutique à **70 fragments l’unité**, avec achat direct et réserve distincte. Les crédits gratuits sont utilisés en premier, puis les exemplaires achetés lorsque le stock gratuit est vide.

Phantom Blood référence une liste figée de 110 identifiants. Ajouter un modèle au catalogue ou à un groupe éditorial ne change plus son contenu. Les nouveaux paquets peuvent combiner des cartes existantes et des exclusivités sans dupliquer les modèles.

## Stock, taux et économie

Les constantes sont centralisées dans `src/game/config.ts` :

```ts
FREE_PACK_INITIAL_STOCK = 5 // stock d’une nouvelle installation
FREE_PACK_CAPACITY = 5      // plafond V1
FREE_PACK_RECHARGE_MS = 600_000 // dix minutes
DEFAULT_SPECIAL_BOOSTER_PRICE = 60
```

Le stock initial ne s’applique qu’à une nouvelle sauvegarde. Ne pas effacer une sauvegarde existante pour changer un paramètre. Si le plafond est réduit dans une évolution, écrire une migration de `player` avant de déployer. Le plafond et la durée de recharge sont utilisés dans le moteur et l’interface ; aucune nouvelle page n’est nécessaire.

Quand le stock est plein, `nextFreePackAt = null`. Une première dépense démarre dix minutes. Une dépense sur un stock partiel conserve la prochaine échéance. Au retour, le jeu calcule les crédits écoulés, plafonne à cinq et perd tout temps passé au plafond. `maxObservedClockAt` évite de recréditer du temps déjà observé après un recul de l’horloge ; il ne constitue pas une protection contre un client modifié.

Recyclage : base **1/3/7/12/19**, multiplicateurs de finition **10/23/32 dixièmes**, illustration **10/19 dixièmes**, puis **un seul `floor` final**. Moyenne théorique : **4,149816 fragments/carte**, soit **20,74908** pour cinq cartes intégralement recyclées. Le prix de chaque booster est indépendant, dans `access.shop.price` pour un paquet gratuit également vendu en boutique, ou `access.price` pour un paquet exclusif à la boutique.

## Sauvegarde et évolution

Dexie `bizave-tcg` conserve `drops`, `discoveries`, `player`, `openings`, `recycling`, `identity`, `friends`, `outbox`, `usedTransfers`, `boosterStock`, `boosterPurchases` et les définitions d’archive. `localStorage` conserve le choix visuel du booster et les options d’interface sous `bizave.preferences.v1`, séparément des possessions.

Une variante est `(cardId, finish, artVariant)`. Un exemplaire possède un `dropId` UUID v4 permanent. Les découvertes restent enregistrées après recyclage ou envoi. Les statuts `outgoing` et `recycled` empêchent les réutilisations incohérentes.

Les transactions sérialisent ouvertures, recyclages, envois et réceptions, y compris entre onglets. Les migrations Dexie sont dans `src/storage/database.ts`. Ne pas changer un schéma publié en place : ajouter une version. Une migration de compatibilité répare les anciennes clés de découvertes et `artVariant`, sans supprimer les historiques ni l’antirejeu.

Pour retirer un modèle, conserver sa définition dans `archivedCards` (`src/data/cards.ts`) et ses images. Les snapshots locaux sont également gardés en base. Ils permettent de consulter et recycler les anciennes cartes. Une tentative de changer la rareté d’un ID déjà publié est refusée.

Le stockage est lié au **navigateur et à l’origine**. Il n’y a ni synchronisation, ni export/import de sauvegarde, ni clé de restauration. Effacer les données du site supprime cartes et clés. Le bouton de protection demande le stockage persistant au navigateur, sans promettre son acceptation ni une sauvegarde distante.

## Protocole d’échange

- Identifiant lisible : huit chiffres, format `1234-56-78`. Il n’est pas secret et ne dérive aucune clé.
- Deux paires indépendantes : **ECDSA P-256/SHA-256** et **ECDH P-256**. Les clés privées non exportables sont stockées comme `CryptoKey` dans IndexedDB.
- `FR1.` est une fiche publique : version, identifiant joueur et deux clés publiques. Import immédiat et unilatéral. Un UUID déjà lié à d’autres clés est bloqué.
- Avant le premier transfert, les deux joueurs importent le contact de l’autre. L’interface ne prétend pas savoir si l’autre joueur a effectué cet import.
- `TR1.` contient uniquement version, sel HKDF aléatoire, IV de 96 bits et ciphertext/tag. Le message est signé, puis chiffré par **ECDH → HKDF-SHA-256 → AES-GCM-256**. La signature inclut les trois propriétés de variante et tous les identifiants.
- Le destinataire essaie ses contacts, déchiffre, vérifie signature et destinataire, puis ajoute le drop et le `transferId` dans une transaction unique.
- Un envoi devient `outgoing` avec sa boîte d’envoi **avant** d’afficher le code. Il est définitif ; aucune annulation locale et aucun faux accusé de réception.
- `usedTransfers` conserve uniquement `transferId` et date. Une carte peut revenir avec le même `dropId` et les mêmes propriétés, mais un **nouveau** `transferId`. Un ancien code reste refusé après renvoi ou recyclage.

Les codes sont copiés dans une messagerie choisie par le joueur. Le jeu n’envoie aucun message. Le chiffrement prouve qu’un contact a signé le contenu ; un jeu statique ne certifie pas mondialement l’honnêteté d’un tirage ou l’absence de modification du client. Une identité perdue après des échanges ne se régénère pas silencieusement.

## Hébergement Firebase

```sh
npm run build
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only hosting
```

Choisir votre projet Firebase existant ou en créer un. `firebase.json` sert `dist/`, réécrit les routes vers `index.html`, met les bundles hashés en cache immutable et le HTML en revalidation. Aucun service Auth, Firestore, Functions ou Storage à activer. L’agent n’a pas publié le projet sur un compte Firebase.

## Organisation

```text
src/data/           catalogue, collections et boosters configurables
src/game/           types, probabilités, recharge, tirages et économie
src/storage/        schémas Dexie et transactions
src/exchanges/      contacts, crypto et services de transfert
src/components/     cartes, paquets, dialogues et état partagé
src/pages/          Boosters, Collection, Atelier, Amis & échanges
src/styles/        thème UI et CSS de carte de référence
tests/             parcours navigateur Playwright
references/        les trois fichiers source fournis
public/assets/     220 placeholders remplaçables
```

Références de stack vérifiées : [Tailwind/Vite](https://tailwindcss.com/docs/installation/using-vite), [Dexie useLiveQuery](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()), [Vite réseau](https://vite.dev/config/server-options).

### Envois et amis

L’envoi passe par une page dédiée avec recherche du destinataire. Un clic crée le transfert et demande sa copie dans le geste utilisateur, y compris avec la transaction asynchrone sur Safari. En cas de refus du presse-papiers, le code reste accessible par un bouton animé dans Envois. Aucun code brut n’est affiché dans ce parcours.

Les entrées d’Envois disparaissent au bout de 24 h et sont nettoyées au démarrage, au retour sur la page et chaque minute. Ce délai porte sur les copies locales : un code déjà transmis reste recevable. Les exemplaires sortants et le registre antirejeu sont conservés. Renommer ou supprimer un ami ne modifie pas ses clés, les cartes ou les envois existants.

## Options

Le logo Bizave ouvre les options. Le thème suit le système par défaut ; les choix Clair et Sombre sont mémorisés. En mode Système, un changement du thème de l’appareil s’applique immédiatement. Les cartes Fusion/Gundam gardent leurs palettes propres.

Le mode dev affiche les 110 modèles et leurs six variantes, sans écrire dans Dexie. Les aperçus ne peuvent être envoyés ni recyclés. Le module temporaire est isolé dans `src/dev/catalogPreview.ts`. Pour la sortie, définir `VITE_DEV_CATALOG=false` dans `.env.production` avant le build : le réglage et la projection sont désactivés, même si une ancienne préférence les activait.

Le mode d’envoi mémorisé est Copier le code par défaut, ou Télécharger le fichier. Un fichier `.btcg` contient une enveloppe JSON versionnée avec le code TR1 exact, sans clé privée. Les deux transports passent par les mêmes vérifications cryptographiques, de destinataire et d’antirejeu. Dans Amis → Recevoir, coller le code ou importer le fichier puis confirmer Recevoir. L’import accepte uniquement le format version 1, avec une limite de 16 Kio. Les téléchargements des envois existants réutilisent leur code sans créer de nouveau transfert.

La boîte d’envoi garde les entrées 24 h ; un fichier déjà téléchargé reste recevable ensuite, comme un code déjà copié.

## Affichage de la collection

Le bouton Affichage, à droite du titre Collection, ouvre un panneau sur PC et une feuille depuis le bas sur téléphone. Les deux filtres existants restent en place et sont appliqués avant le regroupement.

Le tri propose **Nom, Ordre, Date et Valeur**, dans les deux sens. Valeur utilise le montant exact de recyclage d’un exemplaire selon la rareté, la finition et le format ; un petit montant en fragments apparaît sous les cartes uniquement pendant ce tri. Une pile utilise sa variante visible la plus précieuse et la montre en couverture, sans additionner ses doublons ; son contenu suit le sens du tri choisi. Le choix d’affichage est mémorisé localement.

L’ordre fixe de l’édition est conservé dans `src/data/card-order.json` et suit le carnet du 26 octobre 2026. Après publication, conserver les positions existantes et les identifiants archivés ; ajouter les nouvelles cartes en fin de liste. Le tri Date utilise la dernière acquisition détenue d’une pile ; un retour par transfert utilise sa date de retour.

Le filtre **Boosters** apparaît à côté de Rareté et Finitions dès que plusieurs boosters sont activés. La sélection multiple réunit leurs pools de cartes sans dupliquer les modèles partagés ; elle concerne leur disponibilité dans ces éditions, pas l’historique d’obtention des exemplaires. Elle se combine avec la recherche, la rareté, la finition et Full Art. Avec le seul Phantom Blood actuel, les deux filtres existants restent affichés.

Regroupement : Aucun, Par carte (six variantes possibles), ou Par carte et format (Classique / Full Art séparés). Les piles sont regroupées par identifiant de modèle, même si deux titres se ressemblent. Leur couverture est déterministe et provient toujours des variantes filtrées détenues.

Doublons : Cacher conserve une entrée par variante et son compteur ×N ; Afficher présente chaque exemplaire séparément, dans la pile ou directement dans la collection si le regroupement est désactivé. Le détail d’un exemplaire séparé transmet son identifiant propre aux actions Envoyer et Recycler. La protection de dernière copie se base sur les possessions réelles, indépendamment du nombre d’entrées affichées.

Une pile ouvre une grille, puis le détail d’une carte, dans un seul dialogue natif. Le retour La pile conserve ce parcours. Les cartes hors écran restent différées pour limiter les surfaces graphiques. Aucun tri ni regroupement ne modifie les cartes, les découvertes ou les historiques. Les choix sont mémorisés dans les préférences locales existantes ; Réinitialiser ne réinitialise que l’affichage.
