# bizave-tcg.v1.6.1 — 14 novembre 2026

- Publication silencieuse : version **1.6.1**, compteur d’annonce **11** et note précédente inchangés.
- Codes de partage en Base62 : amis `FR3.`, cartes `TR3.`, fragments `TF2.`, collections `CL2.`. Le corps des codes contient uniquement des lettres et chiffres, pour éviter les caractères Markdown des messageries.
- Les données et signatures restent identiques ; les clés JWK et signatures internes conservent leur encodage existant. Les identités et contacts déjà enregistrés restent utilisables.
- Les anciens codes Base64url ne sont plus acceptés en réception. Les anciennes collections mémorisées nécessitent un nouveau partage. Les sauvegardes contenant une ancienne boîte d’envoi restent importables.
- Cartes, fragments, collections et sauvegardes : extension de téléchargement `.btcg` et type `application/octet-stream`. Correction du suffixe `.btcg.json` des collections.
- Sur la page Collection, un second clic sur Collection dans le menu mobile ou bureau remonte en haut, sans effacer les filtres ni modifier l’historique. Les autres liens gardent leur navigation normale ; le mouvement réduit est respecté.
- Aucun changement du schéma Dexie **13** ni remise à zéro des parties.

[Format Base62](../codes-base62.md) · [Partage de collection](../partage-collection.md) · [Validation](../../VALIDATION.md)
