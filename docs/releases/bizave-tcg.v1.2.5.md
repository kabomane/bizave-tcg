# bizave-tcg.v1.2.5

Publication initiale du 27 octobre 2026, mise à jour du 28 octobre 2026. Cette note accompagne le code sur `main` ; elle ne correspond pas à une release GitHub.

## Mise à jour du 28 octobre

- Phantom Blood devient **Memory Frame**, avec 16 cartes illustrées supplémentaires, soit 126 modèles. L’identifiant technique reste stable pour conserver les stocks et les ouvertures.
- **Anima Isekai** rejoint la boutique à **50 fragments** : 55 modèles, dont 19 illustrés et 36 avec illustration provisoire. Le catalogue totalise 181 cartes, dont 145 illustrées.
- Boutique en carrousel partagé avec Vos boosters : tailles conservées, bouton fixe adapté à la sélection et achat désactivé pendant le changement horizontal. Le défilement vertical ne bloque pas l’achat.
- Miniatures holographiques avec texture irisée partagée, cadre nacré et reflet animé limité aux cartes visibles. Le détail conserve les effets complets ; l’irisation reste visible sans animation.
- **50 codes cadeaux sans expiration** : 20 codes de 10 Memory Frame, 20 de 10 Anima Isekai et 10 de 500 fragments. Seules leurs empreintes sont publiées. Les boosters cadeaux rejoignent la réserve achetée sans coût en fragments.
- Champ cadeau limité à 16 caractères utiles et trois tirets facultatifs, espaces retirés avant la limite, et aide/récompense/erreur au même emplacement.
- Fiche d’une carte : Envoyer et Recycler encadrés, de même hauteur et répartis à parts égales. Confirmation de recyclage répartie en un tiers pour Annuler et deux tiers pour Recycler.
- Schéma local 6 ajouté sans remise à zéro. Les codes déjà utilisés suivent les transferts et leurs registres sont réunis ; les fichiers du schéma 5 restent importables.

## Publication initiale du 27 octobre

- Échanges simplifiés : une seule paire de signature ECDSA P-256/SHA-256, contacts FR2 et transferts TR2. Les cartes sont lisibles ; l’expéditeur, le destinataire et leur contenu sont vérifiés avec la clé de l’ami déjà enregistré.
- Transfert complet de sauvegarde par fichier `.btcg`, lié à l’ID d’installation destinataire. L’ID joueur, la clé de signature, les amis, la progression et les historiques suivent la partie. Les amis peuvent continuer à envoyer et recevoir des cartes après la migration.
- Effacement et verrouillage de la partie source après préparation et vérification du fichier. Le téléchargement reste disponible après actualisation et dans les autres onglets.
- Suppression du compte avec remise à zéro de la progression, des options et des registres, nouvel ID joueur, nouvel ID d’appareil et nouvelle paire de signature.
- Options allégées : ID joueur discret à droite du titre, actions de compte en bas de page, boutons adaptés au mobile et confirmations insensibles aux majuscules et minuscules. Les boutons d’annulation et d’action partagent la largeur dans un rapport 1/3–2/3.
- Collection vide sans bouton « Phantom Blood » et description de « Les Blancs » ajustée.

## Changement avant la sortie officielle

Cette édition utilise la base locale `bizave-tcg-v2`, distincte de l’ancienne base de test. Les anciennes parties, les contacts FR1, les transferts chiffrés TR1 et les fichiers de sauvegarde version 1 ne sont pas repris. L’application démarre une nouvelle partie pour ces installations de test. La mise à jour du 28 octobre conserve les parties de `bizave-tcg-v2` et accepte leurs transferts de sauvegarde du schéma 5.

Le fichier de migration de sauvegarde contient l’identité privée du joueur et doit rester personnel. Aucun code de sauvegarde à copier, aucune restauration et aucune synchronisation entre appareils ne sont proposés. La protection contre les réutilisations concerne le fonctionnement normal de l’application locale.

## Vérifications

Les contrôles de cette publication sont consignés dans [VALIDATION.md](../../VALIDATION.md) : lint, tests unitaires et d’intégration, TypeScript, build de production, parcours Chromium/Firefox/WebKit et migration entre navigateurs. L’aperçu développeur est désactivé pour le déploiement Firebase Hosting.
