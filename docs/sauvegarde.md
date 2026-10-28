# Transfert de sauvegarde et suppression du compte — bizave-tcg.v1.2.5

Les options affichent l’**ID joueur** en petit à droite du titre et les actions discrètes **Transfert de sauvegarde** et **Supprimer le compte** en bas de page. Le menu de transfert affiche l’**ID d’installation** de cet appareil. Les deux utilisent le format `1234-56-78`, mais ont des rôles distincts : le joueur suit sa partie, l’installation désigne la destination. Ces opérations nécessitent Web Crypto, donc HTTPS ou localhost.

Le protocole avant publication est simplifié : une paire de signature ECDSA P-256/SHA-256 transférable, sans chiffrement des échanges. La base `bizave-tcg-v2` est séparée des anciennes données de test. Aucun ancien contact FR1, transfert TR1 ou fichier de sauvegarde version 1 n’est accepté ; aucune conversion des anciennes clés n’est proposée.

## Déplacer une partie

1. Sur le destinataire, ouvrir **Options → Transfert de sauvegarde** et relever l’ID de son appareil.
2. Sur la source, choisir **Transfert de sauvegarde → Exporter**, saisir cet ID, puis confirmer avec `TRANSFERER`.
3. Le jeu prépare un fichier signé, l’enregistre localement et efface toutes les données jouables dans une seule transaction. La source ne permet plus de jouer, même dans un autre onglet ou après actualisation. Elle affiche uniquement le téléchargement et la suppression du compte.
4. Télécharger le `.btcg`, puis sur le destinataire choisir **Transfert de sauvegarde → Importer**. Aucun mode code ou presse-papiers n’existe pour cette migration, quel que soit le réglage d’envoi des cartes.
5. Vérifier les identifiants affichés et saisir `IMPORTER`. La partie cible est remplacée avec l’identité complète de la source : même ID joueur, même clé de signature, mêmes amis. L’ID d’installation cible reste inchangé. Les registres des deux parties sont réunis et l’import est inscrit dans la même transaction que les données de jeu et la clé privée.

Le fichier conservé sur la source permet de retenter un téléchargement interrompu. Il ne permet pas de reprendre la partie sur cette source. Supprimer le compte source supprime ce fichier ; conserver le téléchargement jusqu’à la réussite de l’import.

Les confirmations `TRANSFERER`, `IMPORTER` et `SUPPRIMER` acceptent les minuscules, majuscules et mélanges de casse. Les deux actions du menu de transfert sont sur une même ligne ; dans les fenêtres d’export, d’import et de suppression, le bouton de retour ou d’annulation occupe un tiers de la largeur et l’action principale deux tiers, avec la même hauteur. Les registres restent une donnée interne et ne sont pas détaillés dans la fenêtre d’import.

## Contenu et vérifications

Le format de sauvegarde est distinct du fichier de transfert d’une carte, bien que les deux utilisent `.btcg`. Enveloppe JSON `bizave-tcg-save-transfer`, version 2, schéma de base 6, limite de 25 Mio. Les fichiers du schéma 5 restent acceptés ; le registre de cadeaux absent y est traité comme vide, tout en conservant celui du destinataire. Elle contient le JSON de la charge utile, sa signature ECDSA P-256/SHA-256 et la clé publique de vérification. La signature couvre les octets exacts de la charge utile avec le domaine `BizaveTCG/SaveTransfer/v2`.

La charge utile contient l’UUID unique du transfert, l’ID joueur source, les ID d’installation source et destinataire, la date, l’identité portable (clé privée JWK comprise), les préférences et toutes les tables de jeu : joueur, exemplaires détenus/envoyés/recyclés, découvertes, ouvertures et révélations en cours, recyclages, amis, envois, transferts de cartes déjà reçus, définitions archivées, stocks et achats de boosters, migrations déjà reçues et codes cadeaux utilisés. Les registres des cadeaux des deux appareils sont réunis comme ceux des transferts, pour ne pas réactiver un code déjà réclamé.

Les clés sont exportables dès leur création pour permettre plusieurs migrations successives. L’import vérifie que la clé privée correspond à sa clé publique par un défi signé, et que cette même clé publique a signé le fichier. Les empreintes des contacts sont recalculées et vérifiées. Les amis n’ont aucune manipulation à faire : un transfert signé pour le joueur reste recevable après son déplacement, même s’il a été préparé avant la migration. Les envois sortants déjà signés restent dans l’historique ; leur délai habituel de conservation locale reste applicable.

Avant écriture, l’import vérifie la taille, le format, la signature, les clés, la version et les structures de données. Dans la transaction finale, il revérifie l’ID d’installation, le destinataire et le registre des imports. Une erreur annule l’ensemble des écritures, y compris le remplacement d’identité. Deux imports concurrents du même fichier ne peuvent pas réussir tous les deux. Les préférences sont appliquées après validation de la transaction et restent en attente si le navigateur bloque leur écriture.

L’export verrouille toutes les tables pendant la capture, la signature et la relecture de vérification via `Dexie.waitFor`. Le fichier généré doit passer les vérifications de l’import et être persisté avant l’effacement ; toute erreur conserve la partie source. Les opérations de jeu et d’échange vérifient le verrou dans leur transaction. Le démarrage ne recrée pas de joueur sur une source transférée.

Le fichier de sauvegarde contient la clé privée : il doit rester privé. Une personne qui le copie peut signer au nom du joueur. L’ID destinataire bloque les imports vers une autre installation dans le fonctionnement normal du jeu ; il ne chiffre pas les données du fichier et ne protège pas contre un client modifié. La signature n’est pas une certification par un serveur.

## Échanges signés

Les fiches FR2 transportent l’ID joueur et une seule clé publique. L’association est mémorisée à l’ajout d’ami. Une autre clé présentée sous le même ID est refusée. Les transferts TR2 contiennent la carte lisible et sa signature ; la vérification utilise uniquement la clé du contact connu, jamais une clé fournie avec le transfert. Modifier le destinataire, l’expéditeur, l’exemplaire, la carte, la finition, le format, la date ou l’UUID du transfert invalide sa signature. Les formats abandonnés sont rejetés.

## Supprimer le compte

La confirmation `SUPPRIMER` efface toutes les tables locales, y compris les registres et le fichier de transfert éventuel. Une nouvelle paire de signature, un nouvel ID joueur et un nouvel ID d’installation sont créés dans la même transaction qu’une nouvelle partie : cinq boosters gratuits, zéro fragment, collection et historique vides. Les définitions du catalogue sont réinstallées et les options retrouvent leurs valeurs initiales. Les autres appareils et les cartes déjà transmises aux amis ne sont pas modifiés.

Depuis la page de téléchargement d’une source transférée, une confirmation distincte avertit que la copie locale du fichier sera également effacée. Aucune restauration n’est proposée.
