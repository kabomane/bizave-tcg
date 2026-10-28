# bizave-tcg.v1.2.5

Version **bizave-tcg.v1.2.5** de **Bizave TCG**. Deux boosters : **Memory Frame**, 126 cartes, et **Anima Isekai**, 55 cartes. Le catalogue compte 181 modèles, dont 145 illustrés et 36 avec une illustration provisoire.

Jeu de collection privé et statique. React, Vite, TypeScript, Tailwind CSS v4, Dexie/IndexedDB. Aucun serveur applicatif, compte en ligne ou paiement.

## Éditions actuelles

**Memory Frame** remplace le nom Phantom Blood et ajoute 16 cartes aux 110 existantes, toutes illustrées. Son pool est défini explicitement dans `src/data/pools/memory-frame.json` ; son identifiant technique `phantom-blood` conserve les stocks et ouvertures existants. Il utilise les crédits gratuits et reste achetable à 70 fragments.

**Anima Isekai** propose les 55 cartes de son carnet, dans `src/data/pools/anima-isekai.json`. Exclusif à la boutique, il coûte **50 fragments** pour cinq cartes. Ses 19 illustrations fournies sont intégrées ; les 36 autres modèles affichent « Illustration à venir ». Les deux pools sont distincts et utilisent les mêmes taux de tirage.

L’interface utilise une DA ivoire, encre et bordeaux indépendante du cahier de référence. Le sachet se clique directement ; chaque carte révélée se clique pour passer à la suivante. Après la cinquième, un clic affiche le récapitulatif. Les gabarits Fusion/Gundam et la limite de 20° restent inchangés.

La navigation contient **Boosters / Collection / Atelier / Amis**. La collection propose trois filtres custom : **Boosters**, **Rareté** et **Finitions**. Les finitions se combinent avec l’option **Full Art**, qui continue d’être un axe indépendant dans le moteur. Aucun sélecteur natif n’est utilisé. Les instructions et les formulaires de contact sont affichés à la demande.

## Démarrer

Node.js **24.13 ou ultérieur** recommandé (chargement natif de la configuration TypeScript).

```sh
npm install
npm run dev
```

Le serveur écoute sur **toutes les interfaces**, port **5173**. Vite affiche les adresses du Wi-Fi et du réseau étendu, dont Tailscale si présent. Depuis un autre appareil connecté au même réseau : `http://IP_DU_PC:5173`. Si Windows affiche une demande de pare-feu pour Node, autoriser le réseau privé utilisé. Aucune règle de pare-feu n’est ajoutée par le projet.

Pour tester les **échanges signés** depuis un autre appareil :

```sh
npm run dev:https
```

Pour créer ou renouveler le certificat OpenSSL après un changement d’IP : `npm run cert:dev` (OpenSSL de Git pour Windows pris en charge). Les clés restent dans `.local/certificates`, hors publication.

Cette seconde instance écoute en **HTTPS sur le port 5174**, avec un certificat de développement autosigné. Le navigateur de l’utilisateur peut demander d’accepter ce certificat. L’agent ne passe pas cet avertissement à sa place. En production, Firebase fournit un certificat de confiance.

Sur `http://localhost:5173`, Web Crypto fonctionne car localhost est un contexte de confiance. Sur une adresse IP distante en HTTP, le jeu de collection fonctionne, mais les échanges et les codes cadeaux affichent une erreur HTTPS explicite. Pour tester ces fonctions, conserver la même adresse HTTPS : changer de protocole, domaine ou port crée une **autre origine et donc une autre sauvegarde**.

## Commandes

| Commande | Action |
| --- | --- |
| `npm run dev` | Développement HTTP, réseau local et étendu, port 5173 |
| `npm run dev:https` | Développement HTTPS, réseau local et étendu, port 5174 |
| `npm run illustrations` | Convertir les originaux en WebP versionnés |
| `npm run holo:texture` | Régénérer la texture irisée partagée des miniatures |
| `npm run gifts:generate -- --fragments 500 --count 10` | Ajouter un lot de cadeaux ; codes privés dans `.local/gift-codes/` |
| `npm run build` | Vérification TypeScript puis build statique dans `dist/` |
| `npm run preview` | Servir le build sur toutes les interfaces, port 4173 |
| `npm test` | Tests Vitest : moteur, économie, Dexie, migrations, cryptographie et concurrence |
| `npm run test:watch` | Tests en continu |
| `npm run test:e2e` | Parcours Playwright sur Chromium, Firefox et WebKit |
| `npm run lint` | ESLint |
| `npm run check` | Lint, tests unitaires/intégration et build |

Pour les tests de navigateurs, installer leurs exécutables une fois avec `npx playwright install`. Le runner démarre le serveur si nécessaire et utilise des contextes vierges, sans toucher à une collection personnelle. WebKit automatisé ne remplace pas une validation sur un véritable iPhone/iPad. `BIZAVE_TEST_URL` permet de viser une adresse de test précise.

## Ce qui est livré

- Memory Frame : **126 modèles** (45 communs, 28 peu communs, 25 rares, 17 épiques, 11 légendaires), gratuits ou achetables à 70 fragments.
- Anima Isekai : **55 modèles** (16 communs, 15 peu communs, 11 rares, 10 épiques, 3 légendaires), exclusivement en boutique à 50 fragments.
- **145 illustrations WebP versionnées** et 36 illustrations provisoires SVG, pour 181 cartes avec description. Une même illustration sert aux formats Classique et Full Art ; les finitions CSS produisent les six variantes par modèle.
- Disposition **Fusion** pour les cartes classiques et **Gundam** pour les Full Art. Le CSS de la démo est conservé dans `src/styles/cards-reference.css`. Les autres dispositions ne sont pas utilisées. Le plafond d’inclinaison est **20°**, y compris en diagonale et pendant le rebond.
- Trois tirages indépendants, avec remise : rareté **57/24/12/5/2**, finition **81/15/4**, illustration **92/8**. Aucun pity, garantie ni bonus implicite.
- Stock gratuit global **5**, recharge **1/10 min** hors jeu, plafond strict. Les dépenses partielles ne déplacent pas la prochaine échéance.
- Ouvertures persistées avant leur animation, reprise après fermeture/refresh, inventaire par exemplaire, découvertes par variante.
- Collection détenue uniquement, trois filtres custom, atelier, protection de la dernière copie, confirmation de recyclage et historique économique. Les découvertes historiques restent conservées en base.
- Fiche d’une carte : Envoyer et Recycler encadrés sur une même ligne, chacun sur la moitié de la largeur. La confirmation de recyclage conserve Annuler sur un tiers et Recycler sur deux tiers.
- Identité locale, carnet d’amis, codes FR2, transferts TR2 signés et lisibles, boîte d’envoi et registre antirejeu.
- Codes cadeaux courts dans les options, vérifiés hors ligne par empreinte, avec récompenses et registre transférable.
- Navigation clavier, dialogues natifs avec focus piégé, responsive et reduced-motion.

Les fichiers fournis sont archivés dans `references/`. La demande de refonte prime sur la DA initiale du cahier des charges. Les dispositions Fusion/Gundam et le maximum de 20° restent imposés. Les paquets exclusifs à la boutique et les pools mixtes sont pris en charge ; Memory Frame et Anima Isekai sont les deux éditions configurées.

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
    "standard": "/assets/cards/ma-carte/illustration.<hash>.webp",
    "fullArt": "/assets/cards/ma-carte/illustration.<hash>.webp"
  }
}
```

1. Choisir un `id` stable et unique. Après publication, **ne pas renommer cet ID ni changer sa rareté**.
2. Déposer l’original dans `illustrations/originals/ma-carte.png`, puis lancer `npm run illustrations`. Le script génère `public/assets/cards/ma-carte/illustration.<hash>.webp` et met à jour les deux chemins `artwork.standard` et `artwork.fullArt` vers ce même fichier. Les clés techniques restent stables ; le jeu affiche Classique et Full Art.
3. Le gabarit reste 326 × 540 : la même image est cadrée dans la fenêtre Fusion en Classique et sur toute la carte Gundam en Full Art. Les images utilisent `object-fit: cover`. Un point de cadrage peut être défini avec `artworkPosition.standard` ou `artworkPosition.fullArt` si nécessaire.
4. `rarity` vaut `common`, `uncommon`, `rare`, `epic` ou `legendary`. `weight`, facultatif et strictement positif, change le poids du modèle **dans sa rareté**, jamais le taux de la rareté.
5. Exécuter `npm test` et `npm run build`. Les tests vérifient les références et l’existence des illustrations des deux variantes, qui peuvent partager un fichier. Adapter les totaux éditoriaux du test de catalogue si une nouvelle carte est volontairement ajoutée ; le moteur ne dépend d’aucun de ces totaux.

Seules les descriptions éditoriales du carnet sont affichées. Les champs Mémo et Création ne sont pas des descriptions ; les cartes sans description gardent un encart vide. La référence de génération est `illustrations/prompts/DA-illustrations-Souvenir-Moment-culte.md`. Les placeholders contiennent une mention discrète « Illustration à venir ».

## Illustrations

Les originaux restent dans `illustrations/originals/`, hors de `public/`, ignorés par Git et Firebase. Convention : un original `<id>.<ext>` par carte (png, jpg, jpeg ou webp). Le convertisseur lit ces fichiers sans jamais les modifier. Le propriétaire dépose les nouveaux originaux et garde une sauvegarde ailleurs : **ils ne sont plus sauvegardés par Git**.

`npm run illustrations` traite toutes les cartes ; `npm run illustrations -- --only <id>` ne traite qu’une carte. Sortie : 900 × 1200 px, WebP qualité 85, sRGB, recadrage central et métadonnées retirées. Le nom `illustration.<hash>.webp` contient les dix premiers caractères du SHA-256 de l’image produite ; le cache immutable reste valide lorsque l’image change.

Le script refuse les originaux inconnus avant toute écriture, avertit en cas de ratio différent ou d’agrandissement, conserve les cadrages `artworkPosition` et retire les anciens fichiers générés de la carte. Les cartes sans original gardent leurs SVG. Une seconde exécution sans changement ne réécrit aucun fichier.

Les carnets actuels sont `references/carnet-memory-frame-2026-10-28.jsx` et `references/carnet-anima-isekai-2026-10-28.jsx`. Le manifeste `illustrations/imports/2026-10-28/manifest.json` détaille les 35 nouvelles illustrations, les 36 modèles sans image et les correspondances de noms. Les carnets précédents et leurs manifestes restent des références historiques. Les 110 cartes et illustrations précédentes sont inchangées.

## Créer une collection

1. Choisir un identifiant de groupe éditorial `collectionId` unique. Aucun registre de groupes séparé n’est nécessaire.
2. Ajouter ses cartes dans le catalogue avec ce `collectionId` et les chemins Classique et Full Art, qui peuvent partager une même illustration.
3. Référencer explicitement les identifiants voulus dans le pool de chaque booster concerné. Chaque paquet doit contenir un modèle de chaque rareté ; les taux restent communs.

Une collection éditoriale n’est pas un booster : plusieurs boosters peuvent partager les mêmes cartes. Aucune page React à dupliquer.

## Créer ou modifier un booster

Le fonctionnement complet est documenté dans [docs/boosters.md](docs/boosters.md).

Les définitions sont dans `src/data/boosters.ts`. Chaque paquet possède son pool, son habillage, son ordre et son accès. Un paquet gratuit consomme le stock commun. Un paquet `access: { type: 'shop', price: 60 }` s’achète en boutique avant d’être ouvert depuis un stock séparé ; les taux de tirage restent communs.

Le lien Boutique se trouve sous Vos boosters. Le carrousel apparaît seulement si plusieurs paquets sont disponibles ; Anima Isekai y apparaît uniquement quand un exemplaire est détenu. Memory Frame est aussi proposé en boutique à **70 fragments l’unité**, avec achat direct et réserve distincte. Pour Memory Frame, les crédits gratuits sont utilisés en premier, puis les exemplaires achetés lorsque le stock gratuit est vide. Anima Isekai consomme uniquement son propre stock acheté.

Chaque édition référence une liste explicite de modèles : 126 pour Memory Frame, 55 pour Anima Isekai. Ajouter un modèle au catalogue ou à un groupe éditorial ne change pas automatiquement ces listes. Les nouveaux paquets peuvent combiner des cartes existantes et des exclusivités sans dupliquer les modèles.

La boutique reprend le carrousel tactile et clavier de Vos boosters, avec les mêmes dimensions de sachets. Seul le paquet défile ; le bouton d’achat reste fixe et adapte son prix, sa disponibilité et son action au paquet sélectionné. Pendant le déplacement horizontal, il est désactivé et affiche une flèche tournante jusqu’à l’alignement du nouveau paquet et de son offre. Le défilement vertical de la page ne déclenche pas ce verrou.

## Stock, taux et économie

Les constantes sont centralisées dans `src/game/config.ts` :

```ts
FREE_PACK_INITIAL_STOCK = 5 // stock d’une nouvelle installation
FREE_PACK_CAPACITY = 5      // plafond gratuit
FREE_PACK_RECHARGE_MS = 600_000 // dix minutes
```

Le stock initial ne s’applique qu’à une nouvelle sauvegarde. Ne pas effacer une sauvegarde existante pour changer un paramètre. Si le plafond est réduit dans une évolution, écrire une migration de `player` avant de déployer. Le plafond et la durée de recharge sont utilisés dans le moteur et l’interface ; aucune nouvelle page n’est nécessaire.

Quand le stock est plein, `nextFreePackAt = null`. Une première dépense démarre dix minutes. Une dépense sur un stock partiel conserve la prochaine échéance. Au retour, le jeu calcule les crédits écoulés, plafonne à cinq et perd tout temps passé au plafond. `maxObservedClockAt` évite de recréditer du temps déjà observé après un recul de l’horloge ; il ne constitue pas une protection contre un client modifié.

Recyclage : base **1/3/7/12/19**, multiplicateurs de finition **10/23/32 dixièmes**, illustration **10/19 dixièmes**, puis **un seul `floor` final**. Moyenne théorique : **4,149816 fragments/carte**, soit **20,74908** pour cinq cartes intégralement recyclées. Le prix de chaque booster est indépendant, dans `access.shop.price` pour un paquet gratuit également vendu en boutique, ou `access.price` pour un paquet exclusif à la boutique.

## Sauvegarde et évolution

Dexie `bizave-tcg-v2` conserve `drops`, `discoveries`, `player`, `openings`, `recycling`, `identity`, `friends`, `outbox`, `usedTransfers`, `boosterStock`, `boosterPurchases`, `usedGiftCodes` et les définitions d’archive. Les tables `accountState` et `usedSaveTransfers` conservent le verrou, le fichier en attente, les options à appliquer et les migrations reçues ; `installation` conserve l’ID propre à cet appareil. Le schéma courant est la version 6, migrée sans perte depuis la version 5. Le protocole simplifié utilise une nouvelle base avant publication : les anciennes identités et les formats FR1/TR1 ne sont pas repris. `localStorage` conserve le choix visuel du booster et les options d’interface sous `bizave.preferences.v1`, séparément des possessions.

Une variante est `(cardId, finish, artVariant)`. Un exemplaire possède un `dropId` UUID v4 permanent. Les découvertes restent enregistrées après recyclage ou envoi. Les statuts `outgoing` et `recycled` empêchent les réutilisations incohérentes.

Les transactions sérialisent ouvertures, recyclages, envois et réceptions, y compris entre onglets. Les migrations Dexie sont dans `src/storage/database.ts`. Ne pas changer un schéma publié en place : ajouter une version. Les migrations historiques des découvertes et d’`artVariant` restent testées ; elles ne constituent pas une reprise des anciennes identités ou de l’ancienne base de test dans cette édition.

Pendant le développement fermé, un modèle retiré est supprimé du catalogue, de l’ordre, des pools et des assets ; `archivedCards` reste vide. Après publication auprès de vrais joueurs, conserver sa définition dans `archivedCards` (`src/data/cards.ts`) et ses images. Les snapshots locaux sont également gardés en base. Ils permettent de consulter et recycler les anciennes cartes. Une tentative de changer la rareté d’un ID déjà publié est refusée.

Le stockage est lié au **navigateur et à l’origine**. Dans les options, les actions discrètes de transfert et de suppression se trouvent en bas de page ; l’ID joueur figure à droite du titre. **Transfert de sauvegarde** déplace la partie vers un ID destinataire avec un fichier `.btcg` signé : la source est effacée et verrouillée sur la page de téléchargement. L’import remplace la partie cible avec l’ID joueur, la clé de signature et les amis de la source, conserve l’ID d’installation destinataire et fusionne les registres anti-réutilisation. Les amis n’ont rien à modifier ; les cartes envoyées avant ou après la migration restent recevables. Le fichier reste téléchargeable sur la source après rechargement. Les boutons Exporter et Importer partagent une même ligne ; les confirmations `TRANSFERER`, `IMPORTER` et `SUPPRIMER` sont insensibles à la casse. Les boutons de confirmation occupent toute la largeur du champ, dans un rapport 1/3–2/3. Ce parcours est une migration, sans fonction de restauration ou de synchronisation. Détails : [docs/sauvegarde.md](docs/sauvegarde.md).

**Supprimer le compte** réinitialise la partie, les registres et les options, avec un nouvel ID joueur, un nouvel ID d’installation et une nouvelle paire de signature. Cette action supprime aussi un éventuel fichier de migration en attente sur cet appareil. Effacer les données du site supprime également cartes et clés. Aucune copie distante automatique de la sauvegarde n’est effectuée.

## Codes cadeaux

Dans les options, **Code cadeau** se trouve sous **Envoi des cartes**. Les codes acceptent les minuscules et majuscules, avec 16 caractères utiles et trois tirets facultatifs. Les espaces sont ignorés au clavier et retirés au collage avant la limite de longueur. L’aide, la récompense et les erreurs partagent le même texte sous le champ. Le lot initial contient 20 codes de 10 Memory Frame, 20 codes de 10 Anima Isekai et 10 codes de 500 fragments, sans expiration. Les boosters rejoignent le stock acheté sans dépenser de fragments ni modifier les crédits gratuits.

Le jeu publie seulement les empreintes SHA-256 et les récompenses. Les codes en clair restent dans `.local/gift-codes/`, hors Git et build. Chaque code s’utilise une fois par sauvegarde ; son registre suit les transferts et fusionne avec celui du destinataire. Une nouvelle partie peut réutiliser les codes : aucun usage unique mondial n’est garanti hors ligne. La génération de nouveaux lots et leur publication sont décrites dans [docs/codes-cadeaux.md](docs/codes-cadeaux.md).

## Protocole d’échange

- Identifiant lisible : huit chiffres, format `1234-56-78`. Il n’est pas secret et ne dérive aucune clé.
- Une paire **ECDSA P-256/SHA-256**, indépendante de l’ID joueur. La clé privée transférable est stockée comme `CryptoKey` dans IndexedDB et incluse uniquement dans le fichier de migration de sauvegarde.
- `FR2.` est une fiche publique : version 2, identifiant joueur et clé publique de signature. Import immédiat et unilatéral. Le jeu mémorise la clé de chaque ami : un ID déjà lié à une autre clé est refusé.
- Avant le premier transfert, les deux joueurs importent le contact de l’autre. L’interface ne prétend pas savoir si l’autre joueur a effectué cet import.
- `TR2.` contient la charge utile lisible et sa signature. Les neuf champs, dont expéditeur, destinataire, date, identifiants du transfert et de l’exemplaire, carte, finition et format, sont signés avec le domaine `BizaveTCG/CardTransfer/v2`. Aucun chiffrement ni clé jointe au transfert.
- Le destinataire sélectionne le contact déjà enregistré pour l’expéditeur, vérifie sa signature avec cette clé mémorisée et contrôle le destinataire. Il ajoute ensuite le drop et le `transferId` dans une transaction unique.
- Un envoi devient `outgoing` avec sa boîte d’envoi **avant** d’afficher le code. Il est définitif ; aucune annulation locale et aucun faux accusé de réception.
- `usedTransfers` conserve uniquement `transferId` et date. Une carte peut revenir avec le même `dropId` et les mêmes propriétés, mais un **nouveau** `transferId`. Un ancien code reste refusé après renvoi ou recyclage.

Les codes sont copiés dans une messagerie choisie par le joueur. Le jeu n’envoie aucun message. La signature vérifiée avec la clé mémorisée prouve qu’un contact a signé le contenu ; un jeu statique ne certifie pas mondialement l’honnêteté d’un tirage ou l’absence de modification du client. Une identité perdue après des échanges ne se régénère pas silencieusement.

## Hébergement Firebase

Site publié : **https://bizave-tcg.web.app**. Le site Hosting `bizave-tcg` est explicitement défini dans `firebase.json`.

Avant le build de production, créer un fichier local `.env.production` contenant `VITE_DEV_CATALOG=false` pour désactiver l’aperçu développeur. Ce fichier n’est pas versionné ; le serveur de développement conserve son mode d’aperçu.

```sh
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting --project bizave-tcg
```

`firebase.json` sert uniquement les fichiers statiques de `dist/`, réécrit les routes vers `index.html`, met les assets en cache immutable et le HTML en revalidation. Le déploiement de `bizave-tcg.v1.2.5` cible exclusivement Hosting ; aucun service Auth, Firestore, Functions ou Storage n’est nécessaire. Les sauvegardes restent locales à chaque navigateur et à l’origine utilisée : conserver l’adresse `bizave-tcg.web.app` comme adresse de référence.

## Organisation

```text
src/data/           catalogue, collections et boosters configurables
src/game/           types, probabilités, recharge, tirages et économie
src/storage/        schémas Dexie et transactions
src/exchanges/      contacts, crypto et services de transfert
src/gifts/          empreintes, récompenses et utilisation des codes cadeaux
src/components/     cartes, paquets, dialogues et état partagé
src/pages/          pages du jeu et options
src/styles/        thème UI et CSS de carte de référence
tests/             parcours navigateur Playwright
references/        carnets actuels du 28 octobre, références historiques et démo des finitions
public/assets/     145 WebP versionnés et 72 SVG pour les 36 cartes sans illustration
```

Références de stack vérifiées : [Tailwind/Vite](https://tailwindcss.com/docs/installation/using-vite), [Dexie useLiveQuery](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()), [Vite réseau](https://vite.dev/config/server-options).

### Envois et amis

L’envoi passe par une page dédiée avec recherche du destinataire. Un clic crée le transfert et demande sa copie dans le geste utilisateur, y compris avec la transaction asynchrone sur Safari. En cas de refus du presse-papiers, le code reste accessible par un bouton animé dans Envois. Aucun code brut n’est affiché dans ce parcours.

Les entrées d’Envois disparaissent au bout de 24 h et sont nettoyées au démarrage, au retour sur la page et chaque minute. Ce délai porte sur les copies locales : un code déjà transmis reste recevable. Les exemplaires sortants et le registre antirejeu sont conservés. Renommer ou supprimer un ami ne modifie pas ses clés, les cartes ou les envois existants.

## Options

Le logo Bizave ouvre les options. Le thème suit le système par défaut ; les choix Clair et Sombre sont mémorisés. En mode Système, un changement du thème de l’appareil s’applique immédiatement. Les cartes Fusion/Gundam gardent leurs palettes propres.

Le mode dev affiche les 181 modèles et leurs six variantes, sans écrire dans Dexie. Les aperçus ne peuvent être envoyés ni recyclés. Le module temporaire est isolé dans `src/dev/catalogPreview.ts`. Pour la sortie, définir `VITE_DEV_CATALOG=false` dans `.env.production` avant le build : le réglage et la projection sont désactivés, même si une ancienne préférence les activait.

Le mode d’envoi mémorisé est Copier le code par défaut, ou Télécharger le fichier. Un fichier `.btcg` contient une enveloppe JSON versionnée avec le code TR2 exact, sans clé privée. Le fichier de transfert d’une carte est distinct du fichier de migration de sauvegarde, qui contient l’identité privée et doit rester confidentiel. Les deux transports passent par les mêmes vérifications cryptographiques, de destinataire et d’antirejeu. Dans Amis → Recevoir, coller le code ou importer le fichier puis confirmer Recevoir. L’import des cartes accepte uniquement le format version 2, avec une limite de 16 Kio. Les téléchargements des envois existants réutilisent leur code sans créer de nouveau transfert.

La boîte d’envoi garde les entrées 24 h ; un fichier déjà téléchargé reste recevable ensuite, comme un code déjà copié.

## Affichage de la collection

Le bouton Affichage, à droite du titre Collection, ouvre un panneau sur PC et une feuille depuis le bas sur téléphone. Les filtres restent en place et sont appliqués avant le regroupement.

Le tri propose **Nom, Ordre, Date et Valeur**, dans les deux sens. Valeur utilise le montant exact de recyclage d’un exemplaire selon la rareté, la finition et le format ; un petit montant en fragments apparaît sous les cartes uniquement pendant ce tri. Une pile utilise sa variante visible la plus précieuse et la montre en couverture, sans additionner ses doublons ; son contenu suit le sens du tri choisi. Le choix d’affichage est mémorisé localement.

L’ordre fixe est conservé dans `src/data/card-order.json` : les 110 numéros existants sont maintenus, suivis des 16 ajouts Memory Frame puis des 55 cartes Anima Isekai. Après publication, conserver les positions existantes et les identifiants archivés ; ajouter les nouvelles cartes en fin de liste. Le tri Date utilise la dernière acquisition détenue d’une pile ; un retour par transfert utilise sa date de retour.

Le filtre **Boosters** propose Memory Frame et Anima Isekai à côté de Rareté et Finitions. La sélection multiple réunit leurs pools de cartes sans dupliquer les modèles partagés ; elle concerne leur disponibilité dans ces éditions, pas l’historique d’obtention des exemplaires. Elle se combine avec la recherche, la rareté, la finition et Full Art. Ce filtre reste masqué dans une collection vide.

Regroupement : Aucun, Par carte (six variantes possibles), ou Par carte et format (Classique / Full Art séparés). Les piles sont regroupées par identifiant de modèle, même si deux titres se ressemblent. Leur couverture est déterministe et provient toujours des variantes filtrées détenues.

Doublons : Cacher conserve une entrée par variante et son compteur ×N ; Afficher présente chaque exemplaire séparément, dans la pile ou directement dans la collection si le regroupement est désactivé. Le détail d’un exemplaire séparé transmet son identifiant propre aux actions Envoyer et Recycler. La protection de dernière copie se base sur les possessions réelles, indépendamment du nombre d’entrées affichées.

Une pile ouvre une grille, puis le détail d’une carte, dans un seul dialogue natif. Le retour La pile conserve ce parcours. Les cartes hors écran restent différées pour limiter les surfaces graphiques. Aucun tri ni regroupement ne modifie les cartes, les découvertes ou les historiques. Les choix sont mémorisés dans les préférences locales existantes ; Réinitialiser ne réinitialise que l’affichage.

Les holos de la collection et des piles utilisent une texture irisée partagée, un cadre nacré et un seul reflet animé par déplacement. Elles restent distinctes des mates avec « Réduire les animations ». Les miniatures n'utilisent ni les filtres et masques dynamiques de paillettes, ni le contrôleur d'inclinaison ; la carte agrandie conserve le rendu détaillé et sa limite de 20°. Les reflets de l'arrière-plan sont arrêtés pendant l'ouverture d'une fenêtre. Architecture et vérifications : [rendu des cartes](docs/rendu-cartes.md).
