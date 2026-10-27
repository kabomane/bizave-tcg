# bizave-tcg.v1.2.5

Publication du 27 octobre 2026.

## Nouveautés

- Échanges simplifiés : une seule paire de signature ECDSA P-256/SHA-256, contacts FR2 et transferts TR2. Les cartes sont lisibles ; l’expéditeur, le destinataire et leur contenu sont vérifiés avec la clé de l’ami déjà enregistré.
- Transfert complet de sauvegarde par fichier `.btcg`, lié à l’ID d’installation destinataire. L’ID joueur, la clé de signature, les amis, la progression et les historiques suivent la partie. Les amis peuvent continuer à envoyer et recevoir des cartes après la migration.
- Effacement et verrouillage de la partie source après préparation et vérification du fichier. Le téléchargement reste disponible après actualisation et dans les autres onglets.
- Suppression du compte avec remise à zéro de la progression, des options et des registres, nouvel ID joueur, nouvel ID d’appareil et nouvelle paire de signature.
- Options allégées : ID joueur discret à droite du titre, actions de compte en bas de page, boutons adaptés au mobile et confirmations insensibles aux majuscules et minuscules. Les boutons d’annulation et d’action partagent la largeur dans un rapport 1/3–2/3.
- Collection vide sans bouton « Phantom Blood » et description de « Les Blancs » ajustée.

## Changement avant la sortie officielle

Cette édition utilise la base locale `bizave-tcg-v2`, distincte de l’ancienne base de test. Les anciennes parties, les contacts FR1, les transferts chiffrés TR1 et les anciens fichiers de sauvegarde ne sont pas repris. L’application démarre une nouvelle partie pour ces installations de test.

Le fichier de migration de sauvegarde contient l’identité privée du joueur et doit rester personnel. Aucun code de sauvegarde à copier, aucune restauration et aucune synchronisation entre appareils ne sont proposés. La protection contre les réutilisations concerne le fonctionnement normal de l’application locale.

## Vérifications

Les contrôles de cette publication sont consignés dans [VALIDATION.md](../../VALIDATION.md) : lint, tests unitaires et d’intégration, TypeScript, build de production, parcours Chromium/Firefox/WebKit et migration entre navigateurs. L’aperçu développeur est désactivé pour le déploiement Firebase Hosting.
