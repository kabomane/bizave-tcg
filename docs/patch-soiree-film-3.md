# Correctif temporaire : Soirée film #3

Ajouté le 30 octobre 2026, indépendamment du correctif `legacyDatabase`.

Le catalogue corrige `soiree-film-3` de `rare` à `uncommon`. Une ancienne définition persistée empêchait le démarrage et le contrôle équivalent empêchait l’import d’une ancienne sauvegarde signée.

`src/storage/patches/soireeFilm3Rarity.ts` normalise uniquement cette paire identifiant/ancienne rareté, sans modifier l’objet source. Il intervient à trois endroits :

1. `initializeDatabase` normalise les définitions lues pour le contrôle. L’écriture existante du catalogue persiste ensuite la correction dans la même transaction. Une autre incohérence fait toujours échouer et annuler cette transaction.
2. `validatePayload` normalise la vue utilisée pour comparer les raretés. Le contenu du fichier signé et sa signature restent intacts.
3. `importSave` persiste la définition corrigée dans la transaction d’import, sans attendre le prochain démarrage.

Aucune modification du schéma IndexedDB, aucun nouveau marqueur de migration. Le correctif est idempotent et ne touche ni les exemplaires, ni leurs identifiants, ni les favoris, ni les clés, ni les codes de transfert. Les échanges de cartes signent identifiant/finition/format, pas la rareté. Les fragments déjà obtenus par recyclage restent acquis ; les futurs recyclages utilisent la rareté corrigée du catalogue.

## Retrait

Ne pas retirer après un simple nombre arbitraire de versions : un joueur peut sauter des mises à jour et conserver un fichier `.btcg` plus ancien. Retirer uniquement lorsque les sauvegardes locales et fichiers de transfert antérieurs à cette correction ne sont plus pris en charge, ou lorsqu’une autre migration couvre explicitement ce cas.

- Supprimer les deux imports de `patchSoireeFilm3Rarity` dans `services.ts` et `saveTransfer.ts`.
- Retirer les trois appels `.map(patchSoireeFilm3Rarity)` ; l’import peut reprendre directement `payload.tables[name] ?? []`.
- Supprimer le module, son fichier de tests et ce document.
- Conserver le contrôle général d’immutabilité et la rareté `uncommon` dans le catalogue.
- Relancer `npm run check` et les tests navigateur de migration.
