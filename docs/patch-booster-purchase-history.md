# Nettoyage temporaire de l’historique d’achats — 6 novembre 2026

`src/storage/patches/boosterPurchaseHistory.ts` efface uniquement les anciennes lignes de `boosterPurchases`. Les achats ne créent plus de journal : ils débitent les fragments et augmentent le stock dans la même transaction. Aucun solde, stock ou exemplaire de carte n’est supprimé par ce patch.

Le patch est appelé au démarrage et dans les transactions d’export et d’import de sauvegarde. L’import vérifie d’abord intégralement le fichier signé, puis efface le journal importé dans la transaction de remplacement. Le fichier signé d’origine reste intact. Le nettoyage est idempotent et ne nécessite pas de registre permanent supplémentaire.

La table vide et le champ vide des sauvegardes sont temporairement conservés pour lire les fichiers des schémas 5 à 10. Ils ne reçoivent plus de nouveaux achats. Le schéma 11 ajoute uniquement la boutique hebdomadaire.

## Retrait après la période de compatibilité

À réévaluer après les prochaines mises à jour mensuelles, quand les anciens clients et les anciens fichiers signés ne sont plus pris en charge. Ne pas programmer une suppression selon la date seule : un appareil peut rester hors ligne plusieurs mois.

1. Supprimer le fichier du patch, son test et ses trois appels : `initializeDatabase`, `exportSave`, `importSave`.
2. Retirer `boosterPurchases` des nouveaux fichiers et du validateur, puis le type `BoosterPurchaseRow` et la propriété de la base. L’accusé retourné par `buyBooster` peut rester un type local sans persistance.
3. Ajouter une migration Dexie qui déclare `boosterPurchases: null` pour supprimer la table vide chez les joueurs existants. Conserver les déclarations historiques des migrations précédentes.
4. Adapter les tests de compatibilité et la documentation. Vérifier les achats concurrents, les stocks et les transferts de sauvegarde.
