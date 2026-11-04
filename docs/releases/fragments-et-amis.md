# Fragments et amis

Livré dans la [version 1.4.1](bizave-tcg.v1.4.1.md), le 3 novembre 2026.

La [version 1.4.2](bizave-tcg.v1.4.2.md) ajoute la réception plein écran des fragments, le solde animé et le choix du côté de fermeture.

- Compteur de fragments cliquable vers `/fragments`, solde et actions Envoyer / Recevoir. Codes de fragments toujours visibles sous les actions, sur tous les écrans.
- Envoi en deux étapes : ami, puis montant à l’unité avec curseur quadratique, réglage accéléré et clavier. Cliquer sur Envoyer pour confirmer ; les fragments quittent le solde à la création du code.
- Protocole signé TF1 séparé de TR2. Débit, crédit et registre antirejeu atomiques ; fichier `.btcg` version 2 commun aux deux types.
- Amis sans onglets, avec les codes de cartes envoyés, fiches de renommage et de retrait. Aucun envoi depuis une fiche ami.
- Réception et sélecteur d’amis partagés. Confirmation de copie dans le bouton pendant trois secondes, sans notification.
- Migration Dexie 10 : anciens envois marqués comme cartes ; sauvegardes des schémas 5 à 9 toujours acceptées, registres antirejeu fusionnés à l’import.

Les copies locales des codes disparaissent après 24 h. Les codes et fichiers expirent eux aussi après 24 h. Aucun remboursement ni annulation sans serveur.

Maquettes et spécification conservées dans `references/`. Publication sur Firebase Hosting et GitHub main.
