# bizave-tcg.v1.3.2

Publication du 1er novembre 2026 sur Firebase Hosting, notification de mise à jour 4. Validation détaillée dans [VALIDATION.md](../../VALIDATION.md).

- Memory Frame : ajout de Thomas BIZAVE, soit 159 modèles ; Anima Isekai : 84 ajouts, soit 143 modèles. Le catalogue réunit 302 modèles illustrés, avec 52 modèles dans epico stellari et 50 dans rarity only.
- Arashi Shinichi devient Matthieu Izumi, sans changement d’identifiant ni de numéro. Les mentions A1/A2 des deux cartes motard sont inversées. Le titre rarity only s’affiche sur deux lignes.
- Cartes : titres Fraunces 700, descriptions Fraunces 500 italique, mentions Barlow Condensed 500. Polices WOFF2 hébergées avec leurs licences.
- La pile conserve ses cartes pendant l’aperçu et retrouve son défilement au retour. Fermer directement l’aperçu, quitter par Échap, clic extérieur ou Envoyer libère la pile.
- Un identifiant technique est généré à chaque build et publié dans version.json. Le jeu vérifie les nouvelles publications à l’ouverture, au réveil, au retour du réseau et chaque minute visible. Les joueurs actifs ont un bouton Actualiser ; le retour après une longue absence peut actualiser sur un écran sûr. Ouvertures, échanges, sauvegardes, dialogues et saisies sont protégés ; une garde empêche les boucles automatiques.
- Cinq codes donnent chacun un exemplaire des quatre boosters. Le crédit groupé et le registre sont atomiques et utilisables une fois par sauvegarde. Le premier code est annoncé dans la note ; les autres restent dans les fichiers privés locaux.
- La note fournie par le propriétaire reste inchangée avec ses sauts de ligne. UPDATE_VERSION vaut 4, indépendamment de l’identifiant automatique du build.
- Les essais d’export de cartes sont retirés. Aucun bouton de partage ni dépendance de capture n’est livré.

Les anciens onglets doivent être actualisés une première fois pour recevoir la détection automatique. Les stocks, cartes, fragments, identités et registres existants sont conservés. Le schéma de base reste 9. Les originaux, listes privées, certificats et laboratoire restent hors Git et publication.
