# Envoi de fragments, page Fragments et refonte de la page Amis

Document de passation, rédigé le 3 novembre 2026. Il s'adresse au développeur, humain ou IA, qui implémentera ces écrans dans `kabomane/bizave-tcg`. Il décrit **ce qui a été décidé**, **ce qui existe déjà dans le code** et **ce qu'il faut changer, dans quel ordre**.

Maquettes de référence (HTML autonomes, sans dépendance), à placer dans `references/` :

| Fichier | Contenu |
| --- | --- |
| `bizave-fragments-E.html` | Nouvelle page **Fragments** (piste E retenue) et sa feuille d'envoi |
| `bizave-amis-refonte.html` | Page **Amis** sans onglets, fiche ami, ajout d'ami, réception |

Chaque maquette se teste en téléphone, tablette portrait, tablette paysage et ordinateur, en thème clair ou sombre. Les maquettes font foi pour la mise en page et les textes. Ce document fait foi pour le comportement et l'architecture.

---

## 1. Résumé en une minute

1. **Nouvelle fonctionnalité** : envoyer des fragments à un ami, avec le même principe que le don de carte. Sans serveur : un code signé (ou un fichier `.btcg`) est créé, les fragments quittent le solde, et le code reste 24 h dans « Codes envoyés ».
2. **Nouvelle page `/fragments`** : on y accède en touchant le compteur de fragments en haut à droite (`.fragment-wallet`), qui devient un lien.
3. **La page Amis perd ses onglets** (Contacts · Recevoir · Dons) et devient une seule page : Recevoir + Ajouter un ami, Codes envoyés, Vos amis.
4. **Quatre composants deviennent communs** et ne doivent exister qu'en un seul exemplaire :
   - `ReceiveSheet` : recevoir un code, carte ou fragments ;
   - `SentCodesList` : « Codes envoyés », cartes et fragments mélangés ;
   - `FriendPicker` : choisir un ami. Il remplace la liste actuelle de `SendCardPage` ;
   - `HoldButton` : maintenir pour confirmer.

---

## 2. Décisions validées (ne pas rediscuter)

### Page Fragments (piste E)
- Mise en page simple :
  - titre « Fragments » et un sous-titre ;
  - un **cadre de solde** : losange + grand chiffre en serif + « FRAGMENTS » ;
  - deux boutons côte à côte, **Envoyer** (principal) et **Recevoir** (secondaire).
- **Aucune liste d'amis sur la page.** L'ami se choisit dans la feuille d'envoi.
- **Aucune comparaison avec les prix des boosters** (« ≈ 17 boosters », « De quoi ouvrir… ») : c'est retiré partout, car cela vieillit mal quand les prix changent.
- **Codes envoyés** : une seule liste, **sans date ni regroupement par jour**. Il n'y a pas d'historique séparé, puisque sans serveur seuls les codes des dernières 24 h existent. La page Fragments n'affiche que les codes de fragments.
  - Téléphone et tablette : bouton texte « Codes envoyés · N » en bas de page, qui ouvre une feuille.
  - Écrans ≥ 1200 px : la liste est affichée à droite du solde.
- **Recevoir est conservé** sur cette page. Il ouvre **exactement le même** `ReceiveSheet` que la page Amis.

### Feuille d'envoi de fragments (2 étapes)
1. **À qui ?** : `FriendPicker` (recherche + liste).
2. **Montant** :
   - pastille « À Nom · Changer » pour revenir à l'étape 1 ;
   - grand chiffre ;
   - boutons **− / +** (±1). Maintenus, ils défilent en accélérant : ±1, puis ±5, puis ±10 ;
   - **curseur gradué** précis **à l'unité** (pas de pas de 5), avec une progression quadratique pour être plus fin sur les petits montants : `montant = round(solde × x²)` ;
   - lien « Max · solde » au bout du curseur ;
   - ligne « Solde X · après envoi Y ».
   - **Pas de pavé numérique.** Sur ordinateur : flèches ±1, Maj + flèches ±10, saisie des chiffres au clavier, Retour arrière.
   - Confirmation par **maintenir pour envoyer** (`HoldButton`, environ 900 ms). Entrée ou Espace au clavier envoient directement.
3. **Succès** : coche, « Code de transfert copié ! », montant + destinataire, code affiché avec un `CopyButton` (confirmation dans le bouton, sans notification), puis « Terminé ».

### Page Amis
- Plus d'onglets. Haut de page : **Recevoir** (principal) + **Ajouter un ami**, puis « Codes envoyés » (filtre Tout · Cartes · Fragments), puis « Vos amis ».
- **On n'envoie rien depuis la page Amis.** Une carte se donne depuis la Collection, des fragments s'envoient depuis la page Fragments.
- Toucher un ami ouvre une **fiche** pour **renommer** ou **retirer** l'ami, et rien d'autre. L'icône de la ligne est un crayon.
- **Aucune pastille « N codes »** sur la ligne d'un ami.
- **Sans ami : un seul bouton**, « Ajouter un ami ». Recevoir n'apparaît pas, car un code ne peut être reçu que d'un ami enregistré (`verifyTransfer` l'exige).
- Les amis s'affichent en liste sur téléphone, en tuiles sur 2 colonnes sur tablette et en paysage, et sur 3 colonnes à partir d'environ 1400 px. L'ID ne doit jamais être écrasé : `white-space: nowrap` + ellipse.

### Visuel commun
- L'icône des fragments est **toujours le `Gem` de lucide-react**, celui du compteur, en couleur `--accent`. Jamais le losange coloré des premières maquettes, ni un emoji.
- Dans une liste de codes, le fragment s'affiche dans un **rectangle au format des miniatures de cartes** : 33 × 44 px, rayon 4 px, bordure accent à 45 %, fond accent à 7 %, même ombre.
- Ligne de code identique pour les cartes et les fragments :
  - **titre** : nom de la carte, ou « 80 fragments », dans la même police et la même taille (pas de chiffre agrandi ni de serif sur le montant) ;
  - **ligne secondaire** : horloge + « 22 h 14 restantes · pour Nana » ;
  - jauge fine du temps restant sur 24 h, et bouton Copier (ou Télécharger, selon `transferMode`).
- **Copie : jamais de notification (toast).** La confirmation se fait **dans le bouton**, comme ailleurs dans l'app (boutique, code ami) :
  - l'icône devient une coche animée et le libellé « Code copié ! » (« Fichier prêt ! » pour un téléchargement), en vert `--positive` (classe `.is-confirmed`), pendant 3 s, puis le bouton revient à son état normal ;
  - on réutilise `CopyButton` / `ConfirmationButton` + `useTransientFlag` (dans `src/components/`) : ne pas recréer ce comportement ;
  - le bouton garde une largeur minimale fixe pour que la ligne ne bouge pas quand le libellé change.
  La règle vaut partout : lignes de codes envoyés, écran de succès après envoi, « Votre code ami » dans l'ajout d'ami.

---

## 3. Ce qui existe déjà (carte du code)

| Sujet | Fichier(s) | Rôle actuel |
| --- | --- | --- |
| Shell, en-tête, routes | `src/App.tsx` | `.fragment-wallet` est un simple `div`. Routes `/echanges` et `/envoyer/:dropId` |
| Page Amis | `src/pages/ExchangesPage.tsx` | Onglets `contacts` / `receive` / `outbox` (`?onglet=envois`), modales d'ajout, de modification et de carte reçue |
| Don de carte | `src/pages/SendCardPage.tsx` | Recherche + liste d'amis **en ligne dans la page** ; un clic envoie aussitôt (`sendTransfer`), puis l'écran de succès renvoie vers `/echanges?onglet=envois` |
| Liste des dons | `src/components/OutboxList.tsx` | Lit `db.outbox` filtré sur 24 h, miniature de carte, compte à rebours, `TransferDeliveryButton` |
| Bouton copier / télécharger | `src/components/TransferDeliveryButton.tsx` | Selon `useSettings().transferMode` (`code` ou `file`) ; s'appuie sur `CopyButton` (« Code copié ! ») et `ConfirmationButton` (« Fichier prêt ! ») |
| Confirmation dans le bouton | `src/components/CopyButton.tsx`, `ConfirmationButton.tsx`, `useTransientFlag.ts` ; CSS `.is-confirmed`, `.clipboard-confirm` dans `application.css` | Le modèle de confirmation à réutiliser partout ; aucun toast pour une copie |
| Protocole | `src/exchanges/crypto.ts` | `TR2.` = transfert de carte signé (ECDSA), `FR2.` = code ami. `canonicalPayload` préfixé `BizaveTCG/CardTransfer/v2` |
| Services | `src/exchanges/services.ts` | `sendTransfer(dropId, friendId)`, `receiveTransfer(code)`, `addContact`, `renameFriend`, `removeFriend`, `ensureIdentity` |
| Fichier `.btcg` | `src/exchanges/transferFile.ts` | `validateCode` n'accepte que `/^TR2\./` |
| Rétention | `src/exchanges/outbox.ts` | `OUTBOX_RETENTION_MS = 24 h`, `pruneOutbox` |
| Types | `src/game/types.ts` | `OutgoingTransferRow` exige `dropId` ; `TransferPayload` est propre aux cartes |
| Base | `src/storage/database.ts` | Dexie, schéma actuel **v9**. `outbox: '&transferId, dropId, createdAt'`, `usedTransfers` sert à refuser un code déjà reçu |
| Sauvegarde | `src/storage/saveTransfer.ts` | `SAVE_TABLES` inclut `outbox` et `usedTransfers` ; l'assertion de l'outbox exige `dropId` et `/^TR2\./` |
| Solde | `player.fragments` (`db.player`) | Débité par la boutique et crédité par le recyclage dans `src/storage/services.ts`, toujours dans une transaction |
| UI de base | `src/components/ui.tsx` | `Modal` (`<dialog>`), `EmptyState`, `ErrorNotice` |
| Garde de compte | `src/storage/accountGuard.ts` | `assertAccountActive` est obligatoire dans toute transaction d'écriture |

---

## 4. Composants communs à créer

À placer dans `src/components/`. Chacun n'existe **qu'une fois** et est importé partout où il sert. Si un deuxième écran a besoin d'une variante, on ajoute une prop au composant : on ne le copie pas.

### 4.1 `FriendPicker`: le sélecteur d'amis unique
- **Remplace** la recherche et la liste en ligne de `SendCardPage`. **Sert aussi** à l'étape 1 de l'envoi de fragments.
- Props : `onPick(friend: FriendContactRow)`, `disabled?`, `emptyAction?` (lien vers Amis quand la liste est vide).
- Contenu :
  - champ « Rechercher un ami… » utilisant `normalize` de `game/cardSearch` comme aujourd'hui ;
  - lignes avatar (initiale en serif italique) + nom + chevron ;
  - tri `localeCompare(…, 'fr')` ;
  - « Aucun ami trouvé. » si la recherche ne donne rien ;
  - `EmptyState` « Ajoutez votre premier ami » si la liste est vide.
- Pas de sous-texte « dernier envoi » : il n'y a pas d'historique, donc rien à afficher.
- Comportement pour les cartes : on garde l'envoi immédiat au clic (comportement actuel validé). Seul le rendu de la liste change.

### 4.2 `ReceiveSheet`: recevoir un code (carte **ou** fragments)
- Il remplace l'onglet « Recevoir » de `ExchangesPage` et sert au bouton Recevoir de la page Fragments.
- Contenu :
  - texte : « Collez le code reçu ou importez le fichier `.btcg`. Une carte ou des fragments : le code sait ce qu'il contient. » ;
  - boutons « Coller le code » / « Importer un fichier » (logique actuelle : presse-papiers, `readTransferFile`) ;
  - erreurs dans `ErrorNotice`.
- Il appelle un **répartiteur unique** `receiveCode(code)` (voir 5.3).
- L'écran de résultat dépend du résultat :
  - **carte** : le résultat actuel (`CollectibleCard`) avec « Carte reçue d'Ami · ajoutée à votre collection » ;
  - **fragments** : losange + « +150 » en serif, « Fragments reçus · De Nom · ajoutés à votre solde », puis le solde mis à jour.
- Visibilité : sur la page Amis, le bouton n'apparaît que s'il y a au moins un ami. Sur la page Fragments, s'il n'y a aucun ami, la feuille affiche le texte d'aide actuel, « Ajoutez d'abord le contact de l'expéditeur. »

### 4.3 `SentCodesList`: « Codes envoyés »
- Il remplace `OutboxList` : on renomme ou on réécrit le fichier, sans le dupliquer.
- Props : `kind?: 'all' | 'card' | 'fragments'` (Amis passe `'all'` avec le filtre visible, la page Fragments passe `'fragments'`), `limit?` (3 sur téléphone, avec « Tout voir · N »).
- Il lit `db.outbox`, filtre sur `createdAt + OUTBOX_RETENTION_MS > now` (`useNow`) et trie du plus récent au plus ancien. **Aucun intitulé de date.**
- Ligne : rectangle (miniature de carte, ou rectangle fragment), titre, puis « restantes · pour Nom », la jauge, et `TransferDeliveryButton` (confirmation dans le bouton, jamais de `notify`/toast pour la copie).
- Note de pied : « Effacés automatiquement après 24 h. »
- Liste vide : « Aucun code en cours. Quand vous donnez une carte ou des fragments, le code reste ici 24 h. »

### 4.4 `HoldButton`: maintenir pour confirmer
- Bouton principal, remplissage accent de gauche à droite en 900 ms. Relâcher avant la fin annule.
- `onConfirm` au bout du délai. Entrée et Espace déclenchent directement (accessibilité).
- `contextmenu` bloqué pour éviter le menu d'appui long sur iOS. `touch-action: none`.
- Libellé fourni par l'appelant (« Maintenir pour envoyer 120 »).

### 4.5 `FragmentAmountPicker` (utilisé une seule fois aujourd'hui)
- Le bloc montant de l'étape 2 : grand chiffre, − / + à répétition accélérée, curseur gradué quadratique précis à l'unité, « Max », ligne solde / après envoi.
- Props : `value`, `max`, `onChange`.
- Rôle `slider` sur le curseur, avec `aria-valuemin`, `aria-valuemax`, `aria-valuenow` et `aria-valuetext` (« 120 fragments »).

---

## 5. Protocole et données pour les fragments

### 5.1 Nouveau code `TF1.` (transfert de fragments)
Le format `TR2` des cartes n'est **pas** modifié : les codes et fichiers `.btcg` déjà en circulation doivent rester valides.

```ts
// src/game/types.ts
export type FragmentTransferPayload = {
  version: 1; transferId: string; senderId: string; recipientId: string; issuedAt: number; amount: number
}
```

- Dans `crypto.ts`, ajouter `signFragmentTransfer(identity, friend, amount)` et `verifyFragmentTransfer(code, identity, friends)`, sur le modèle exact de `signTransfer` et `verifyTransfer` :
  - même algorithme et mêmes contrôles d'expéditeur, de destinataire et de signature ;
  - chaîne canonique **distincte** : `'BizaveTCG/FragmentTransfer/v1\n' + JSON.stringify({ version, transferId, senderId, recipientId, issuedAt, amount })`, pour qu'aucune signature de carte ne puisse passer pour un transfert de fragments, ni l'inverse ;
  - `validateFragmentPayload` : exactement 6 clés, `amount` entier sûr, `1 ≤ amount ≤ 1 000 000` (borne de sécurité), mêmes motifs d'UUID et d'ID joueur.
- `transferFile.ts` : `validateCode` accepte `/^(TR2|TF1)\.[A-Za-z0-9_-]+$/`. Le format de fichier (`version: 2`) ne change pas.

### 5.2 Envoi : `sendFragments(amount, friendId)` dans `exchanges/services.ts`
Même structure que `sendTransfer` :
1. `ensureIdentity`, lire l'ami, vérifier que `amount` est un entier supérieur ou égal à 1.
2. Signer **avant** la transaction (la signature est asynchrone).
3. Transaction `rw` sur `player`, `outbox`, `identity`, `friends` et `accountState` :
   - `assertAccountActive` ;
   - revérifier que l'identité et l'empreinte de l'ami n'ont pas changé ;
   - relire `player.fragments` et **refuser si `amount > fragments`** (« Solde insuffisant. ») ;
   - débiter `player.fragments` ;
   - ajouter la ligne d'outbox.
4. Renvoyer la ligne. L'écran copie le code (`copyPromisedText`, pour conserver l'activation du geste sur Safari, comme dans `SendCardPage`) ou télécharge le fichier selon `transferMode`.

### 5.3 Réception : un répartiteur unique `receiveCode(code)`
```ts
type Received = { kind: 'card'; card: Card } | { kind: 'fragments'; amount: number; senderId: string }
export async function receiveCode(code: string): Promise<Received>  // lit le préfixe TR2 ou TF1
```
- `TR2.` : `receiveTransfer` existant, inchangé.
- `TF1.` : `receiveFragments`. Transaction sur `player`, `usedTransfers`, `identity` et `accountState` :
  - `assertAccountActive` ;
  - refuser si `usedTransfers.get(transferId)` existe déjà (« Ce code a déjà été utilisé. ») ;
  - créditer `player.fragments` ;
  - ajouter la ligne `usedTransfers`.
- Tout autre préfixe : « Code de transfert non reconnu. »
- `ReceiveSheet` n'appelle **que** `receiveCode`.

### 5.4 Outbox et base de données
- Faire de `OutgoingTransferRow` une union discriminée :
  ```ts
  type OutgoingBase = { transferId: string; recipientId: string; recipientLabel?: string; code: string; createdAt: number; status: 'generated' }
  export type OutgoingTransferRow =
    | OutgoingBase & { kind: 'card'; dropId: string }
    | OutgoingBase & { kind: 'fragments'; amount: number }
  ```
- Dexie **v10** : les index ne changent pas (une ligne sans `dropId` n'est simplement pas indexée). Une migration ajoute `kind: 'card'` aux lignes existantes. Mettre à jour `DATABASE_SCHEMA_VERSION` et la table `version`, comme pour les migrations précédentes.
- Tout le code qui lit `outbox.dropId` (`OutboxList`, sauvegarde, tests) doit d'abord tester `kind`.
- `saveTransfer.ts` : adapter l'assertion de l'outbox à l'union (`kind`, `dropId` **ou** `amount`, regex `TR2|TF1`), et conserver la fusion actuelle de `usedTransfers` à l'import. Une ancienne sauvegarde sans `kind` est traitée comme `card`.
- `pruneOutbox` ne change pas : il supprime seulement des copies locales, il ne rembourse rien et ne crédite rien.

### 5.5 Points d'attention
- Comme pour les cartes, les fragments sont **débités à la création du code**. Un code jamais utilisé n'est pas remboursé : il n'y a pas de serveur pour savoir s'il a été reçu. C'est voulu et identique aux cartes. Le texte du bouton le dit (« les fragments quittent votre solde »).
- La protection contre la double réception repose uniquement sur `usedTransfers` chez le destinataire, comme pour les cartes.
- Le libellé `recipientLabel` est figé à l'envoi, comme aujourd'hui.

---

## 6. Changements par écran

### `src/App.tsx`
- `.fragment-wallet` devient un `<Link to="/fragments">`, avec `aria-current="page"` et un style actif sur cette route (bordure et texte accent, fond accent à 6 %). Sur `/fragments`, aucun onglet du bas ni de la navigation principale n'est actif.
- Ajouter la route `/fragments`, chargée en différé (`lazy`) comme les autres pages.
- Le cas `/parametres`, où l'en-tête affiche l'ID joueur, reste inchangé.

### Nouvelle page `src/pages/FragmentsPage.tsx`
- Solde, Envoyer (désactivé si le solde vaut 0), Recevoir, puis `SentCodesList kind="fragments"` : en bas sous forme de bouton + feuille, ou en colonne de droite sur grand écran.
- Envoyer ouvre une `Modal` (feuille sur téléphone) en 2 étapes : `FriendPicker`, puis `FragmentAmountPicker` + `HoldButton`, puis l'écran de succès.

### `src/pages/ExchangesPage.tsx` (page Amis)
- Supprimer `tab-list` et l'état `tab`, et ne plus lire `?onglet=…`.
- Ordre : en-tête (titre « Amis » + nombre, sous-titre « Vos amis, les codes reçus et ceux que vous avez envoyés. »), boutons Recevoir / Ajouter un ami, `SentCodesList kind="all"` avec filtre, puis « Vos amis ».
- Ligne d'ami : avatar, nom, ID, crayon. Un clic ouvre la fiche (renommer ou retirer). On réutilise les modales actuelles de modification et de suppression, sans ajouter d'action d'envoi.
- La modale d'ajout ne change pas sur le fond : « Votre code ami · Copier », « puis », nom, « Coller son code ami », Ajouter.
- État vide : `EmptyState` « Votre cercle commence ici. » avec **seulement** « Ajouter un ami ».

### `src/pages/SendCardPage.tsx`
- Remplacer la recherche et la liste en ligne par `FriendPicker`. Le reste (en-tête, explication, envoi au clic, écran de succès) ne change pas.
- Le lien de succès « Voir les codes de transfert » pointe vers `/echanges` (les onglets disparaissent). Faire de même pour l'`EmptyState` « Mes dons », renommé « Codes envoyés ».

### Textes à renommer
- « Dons » devient « Codes envoyés », partout : UI, tests, README.
- `?onglet=envois` est supprimé. On peut garder une redirection silencieuse vers `/echanges` pour les anciens liens.

---

## 7. Points d'adaptation des maquettes au code
- Les maquettes utilisent des container queries à 600 / 1100 px. Dans l'app, il faut utiliser les media queries existantes de `application.css` : `max-width: 599px` (téléphone), `max-width: 899px`, `max-width: 1199px`. La vue large commence donc à 1200 px.
- Couleurs, rayons, tailles de boutons et typographie : réutiliser les variables et classes existantes (`--accent`, `--line`, `.primary-button`, `.secondary-button`, `.text-button`, `.page-title`, `.friend-avatar`, `.empty-state`). N'introduire que les classes réellement nouvelles : curseur, rectangle fragment, jauge 24 h, `HoldButton`.
- Thème sombre : tout passe par les variables `:root[data-theme='dark']`. Aucune couleur en dur, sauf l'ombre du rectangle.
- Les noms, IDs, montants et durées des maquettes sont fictifs.

---

## 8. Tests à prévoir
- **crypto** : aller-retour `signFragmentTransfer` / `verifyFragmentTransfer` ; refus d'un payload altéré (montant modifié), d'un mauvais destinataire, d'un expéditeur inconnu ; **un code `TR2` ne passe pas comme `TF1`, et l'inverse**.
- **services** :
  - `sendFragments` débite exactement le montant et refuse au-delà du solde ou un montant inférieur à 1 ;
  - transaction annulée si le compte est verrouillé ;
  - `receiveFragments` crédite une seule fois, et une deuxième réception est refusée.
- **transferFile** : un fichier `.btcg` contenant un `TF1` est accepté.
- **migration v10** : les lignes d'outbox existantes reçoivent `kind: 'card'` ; une sauvegarde v9 s'importe.
- **saveTransfer** : export et import avec des lignes `fragments` dans l'outbox.
- **UI (Playwright)** :
  - envoi complet de fragments (ami, curseur, ±, maintenir) ;
  - réception d'une carte puis de fragments par le même `ReceiveSheet` depuis les deux pages ;
  - Copier affiche « Code copié ! » dans le bouton puis revient à l'état normal au bout de 3 s, sans aucun toast ;
  - page Amis sans ami : un seul bouton ;
  - le don de carte utilise `FriendPicker`.
- `npm run check` (lint + tests + build) et `npm run test:e2e`.

---

## 9. Ordre de livraison conseillé
1. Protocole `TF1` + `sendFragments` / `receiveFragments` / `receiveCode` + tests (aucune UI).
2. Migration Dexie v10 + `saveTransfer` + `transferFile` + tests.
3. Composants communs : `FriendPicker`, `HoldButton`, `SentCodesList` (remplace `OutboxList`), `ReceiveSheet`.
4. `SendCardPage` branché sur `FriendPicker` : régression visuelle minimale, à vérifier seule.
5. Refonte de `ExchangesPage` (sans onglets).
6. `FragmentsPage` + compteur cliquable dans `App.tsx`.
7. Textes (« Codes envoyés »), README, CHANGELOG, puis la note de version dans `docs/releases/`.

---

## 10. Hors périmètre
- Pas de message joint à un envoi, de fil de conversation par ami ni d'historique au-delà de 24 h : sans serveur, ces informations ne seraient pas fiables.
- Pas d'annulation d'un code envoyé.
- Pas d'envoi depuis la fiche d'un ami.
