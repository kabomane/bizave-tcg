# Partage de collection

## Essai local

Le serveur HTTPS utilise `npm run dev:https`, port **5174**. Garder la même adresse pour retrouver la même sauvegarde : localhost et l’IP du PC sont deux origines différentes.

1. Sur deux profils de navigateur ou appareils, ajouter réciproquement leurs codes amis FR2.
2. Sur le premier, ouvrir **Amis → fiche du destinataire → Partager ma collection**. Le réglage **Méthode d’envoi** choisit Copier le code CL1. ou Télécharger le fichier `.btcg` ; aucun téléchargement ne démarre automatiquement.
3. Sur le second, ouvrir **Amis → fiche de votre ami → Recevoir sa collection**. Coller le code ou choisir le fichier, puis recevoir pour ouvrir la consultation.
4. Vérifier recherche, favoris du propriétaire, filtres, tris, piles et quantités. Le détail reste en consultation uniquement ; fermer le détail conserve les filtres et le défilement de la grille.
5. Activer **Paramètres → Collection → Collection en mémoire**, puis recevoir à nouveau le code. La fiche ami en plein écran propose **Voir la collection** et **Oublier cette collection** sur une même ligne ; **Mettre à jour sa collection** permet de recevoir un autre instantané.
6. Recevoir un instantané ancien ou différent à la même seconde : confirmer le remplacement ou consulter sans remplacer. Une date de plus de 24 heures dans le futur demande aussi confirmation avant mémorisation.
7. Désactiver l’option : confirmer l’effacement. Retirer l’ami ou remplacer/supprimer/transférer le compte purge également les mémoires concernées.

Sans l’option, fermer la collection termine l’aperçu temporaire. Les mémoires ne sont pas intégrées au fichier de sauvegarde.

## Format et garanties

- Enveloppe binaire v3, préfixe `CL1.`, Base64URL canonique sans padding, aucune compression.
- ECDSA P-256/SHA-256, domaine exact `BizaveTCG/CollectionSnapshot/v3\n`. La clé publique vient du contact enregistré. Vérification avant décodage du corps et à chaque réouverture d’une mémoire.
- Sélection automatique du plus court entre les modes 0 et 1 (égalité : mode 0). Mode 0 : présence LSB-first, favoris des variantes présentes, quantités supplémentaires ULEB128. Les modes 0 et 1 sont émis et décodés.
- Registre `src/data/card-registry.json` en ajout seul. Toute attribution publiée reste dans `src/data/card-registry.lock.json`. Ajouter les nouvelles cartes après le dernier numéro, incrémenter la version, garder les définitions des cartes retirées dans `archivedCards`. Mettre à jour le verrou à la publication, sans renuméroter ses entrées.
- Un lecteur accepte un registre plus récent tant qu’aucune variante possédée n’utilise un numéro inconnu.
- Aucune écriture dans l’inventaire, les découvertes, favoris locaux, dons ou registres anti-rejeu. Aucun changement du schéma Dexie 13 ni du format des dons et sauvegardes.
- `CardViewer` utilise une branche `sharedReadOnly` dédiée, avec variantes agrégées et aucun hook d’action, service de mutation, génération d’image, `dropId` ou date d’acquisition inventée.
- La signature authentifie l’auteur et l’intégrité, pas la possession réelle ni l’exactitude de l’horloge du propriétaire.

## Stockage et limites

La préférence `rememberCollections` est désactivée par défaut et conservée dans `bizave.preferences.v1`. Une clé `bizave.collectionMemory.v1.<playerUuid>` contient uniquement `{ version: 1, code, savedAt }`. L’horodatage de réception local est distinct de la date signée.

Limites : code 32 768 caractères, fichier 64 Kio, 8 192 numéros, quantité 1 000 000 par variante, total 100 000 000 exemplaires. Mémoire : 50 amis et 1 Mio, avec estimation conservatrice en UTF-16 (clés et valeurs). Un refus d’écriture laisse la collection consultable et signale l’échec. Aucun autre ami n’est évincé automatiquement.

La purge locale précède les opérations de remplacement/suppression du compte. IndexedDB et localStorage n’offrent pas de transaction commune : une opération ensuite annulée par IndexedDB peut avoir déjà effacé la mémoire facultative, sans altérer la collection du joueur.

## Mesures

Mesures avec 454 modèles, mode 0, une quantité de 2 toutes les dix variantes, un favori toutes les sept variantes, signature de 64 octets incluse :

| Variantes | Caractères du code |
| ---: | ---: |
| 0 | 563 |
| 50 | 586 |
| 500 | 780 |
| 1 000 | 996 |
| 2 500 | 1 648 |

La taille dépend aussi des quantités. La méthode d’envoi choisie dans les paramètres détermine le bouton proposé. Le choix automatique conserve le format le plus court avant signature.

## Validation

`npm run check` couvre lint, tests et build. Les tests `src/collection/*.test.ts` couvrent les codecs, un vecteur binaire fixe, signatures, registres futurs, agrégation, fichiers, quotas, mémoire et cycle de vie du compte. `tests/shared-collection.spec.ts` couvre les parcours d’export/réception, la lecture seule, le clavier, la mémoire et les écrans mobiles dans des contextes vierges.

WebKit automatisé ne remplace pas un essai sur un vrai iPhone/iPad.

Les réglages d’affichage des collections amies sont indépendants de la collection personnelle et communs à tous les amis : champ `sharedCollectionDisplay` dans `bizave.preferences.v1`. Le compteur porte sur les exemplaires filtrés. Le panneau Affichage propose nom, rareté, valeur, sens du tri, regroupement et couverture des piles ; les dates et les exemplaires individuels absents du code ne sont pas simulés.
