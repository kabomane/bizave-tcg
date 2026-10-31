# Codes cadeaux hors ligne

Dans **Options**, la section **Code cadeau** suit le bloc **Envoi des cartes**. Un code contient 16 caractères aléatoires, présentés en quatre groupes. La saisie accepte uniquement les lettres ASCII minuscules et majuscules, les chiffres et le tiret du milieu (-). Tous les autres caractères sont retirés à la saisie et au collage avant d’appliquer la limite de 16 caractères utiles et 19 caractères affichés (les trois séparateurs compris). Le texte sous le champ affiche l’aide au départ, puis la récompense ou l’erreur à la même place ; modifier la saisie réaffiche l’aide. Les codes actuels n’expirent pas.

Le catalogue public `src/data/gift-codes.json` contient uniquement des empreintes SHA-256 et les récompenses correspondantes. L’empreinte porte sur le domaine `BizaveTCG/GiftCode/v1\n` suivi du code canonique, sans séparateurs et en majuscules. L’alphabet de 32 caractères exclut I, O, 0 et 1 ; les 16 symboles sont tirés uniformément par le générateur cryptographique de Node, soit 80 bits d’entropie. Il n’y a ni clé secrète dans le navigateur, ni serveur applicatif, ni signature à transporter dans chaque code.

Le lot initial comprend **50 codes** sans expiration :

- 20 codes donnant chacun 10 boosters **Memory Frame** ;
- 20 codes donnant chacun 10 boosters **Anima Isekai** ;
- 10 codes donnant chacun **500 fragments**.

Le lot du 29 octobre ajoute **10 codes donnant chacun 2 boosters epico stellari**, soit **60 codes** au total. Leur liste de distribution reste dans les fichiers privés locaux.

Les boosters cadeaux rejoignent `boosterStock`, la même réserve que les paquets achetés. Ils ne consomment aucun fragment, n’augmentent pas les crédits gratuits et ne modifient pas leur recharge. Aucun achat fictif n’est ajouté à `boosterPurchases`. Les taux d’ouverture restent ceux du booster. Memory Frame consomme ses crédits gratuits avant sa réserve achetée, comme auparavant.

## Génération locale

```sh
npm run gifts:generate -- --booster phantom-blood --quantity 10 --count 20
npm run gifts:generate -- --booster anima-isekai --quantity 10 --count 20
npm run gifts:generate -- --fragments 500 --count 10
npm run gifts:generate -- --booster epico-stellari --quantity 2 --count 10
npm run gifts:generate -- --booster phantom-blood --quantity 2 --fragments 100 --count 10
npm run gifts:generate -- --booster rarity-only --quantity 5 --count 10
```

Chaque commande **ajoute un nouveau lot** au catalogue existant. Ne pas la relancer pour simplement consulter les codes déjà créés. Le générateur écrit d’abord leur liste en clair dans `.local/gift-codes/<lot>.json`, puis ajoute les seules empreintes au catalogue public. Les fichiers privés sont ignorés par Git et restent hors de `public/` et du build. Les conserver ailleurs dans un emplacement privé : ils ne sont pas sauvegardés sur GitHub. La liste Markdown locale du premier lot regroupe les 50 codes pour leur distribution.

Pour rendre un nouveau lot utilisable, publier le build contenant son catalogue. Les codes ne peuvent pas définir eux-mêmes leurs récompenses : le jeu les trouve uniquement par correspondance d’empreinte. La clé d’identité et les signatures des échanges sont indépendantes de ce mécanisme.

## Utilisation et sauvegarde

Un code est utilisable une fois **par sauvegarde**, et peut donc être distribué à plusieurs joueurs. `usedGiftCodes` garde uniquement `codeHash` et `redeemedAt`. L’ajout de la récompense et de cette ligne est atomique ; deux onglets ne peuvent pas doubler un cadeau. Une erreur de stockage annule les deux opérations. Une source déjà transférée ne peut plus réclamer de cadeau.

Le schéma IndexedDB 6 ajoute le registre sans toucher à la collection, aux stocks, au solde ou à la recharge. Le fichier `.btcg` inclut le registre et l’import réunit les historiques des deux appareils. Les fichiers du schéma 5 restent importables et ne suppriment pas les codes déjà utilisés par le destinataire. La suppression du compte efface ce registre avec toutes les autres données.

Le registre est local : il ne garantit ni usage unique mondial ni résistance à la copie ou à l’altération des données du jeu. Une nouvelle partie peut réutiliser les codes. Ces limites sont celles d’un jeu sans backend ; le catalogue empêche la fabrication de nouveaux codes acceptés par le client officiel, sans rendre le client lui-même inviolable.
