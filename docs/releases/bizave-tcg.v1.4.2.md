# bizave-tcg.v1.4.2

Publiée le 4 novembre 2026 sur Firebase Hosting. Le compteur de notification reste à **6** et la note de la version 1.4.1 est conservée.

- `ReceivedFragmentsViewer` remplace le panneau de confirmation par une vue plein écran. Fond bordeaux diffus, carte décorative au format 326 × 540, montant doré et expéditeur. Réutilisation de `CardBackdrop`, `useCardTilt` et des dimensions de `card-viewer.css`.
- Animation d’arrivée et défilement du montant / nouveau solde ; arrêt et nettoyage à la fermeture. Le solde final vient de la transaction de réception. Avec Réduire les animations, les valeurs finales sont présentées directement.
- Boutique ouvre la boutique. Depuis Fragments, Terminé ferme ; depuis Amis, Mes fragments ouvre la page Fragments. Croix et Échap ferment toujours la vue.
- Les fenêtres et aperçus placent leur croix à droite par défaut. Apparence → Main dominante propose Droitier / Gaucher dans `localStorage`, sous la clé existante `bizave.preferences.v1`. Une préférence absente ou invalide utilise Droitier. En mode deux actions, Favori et Partager passent à l’opposé de la croix. La réception de carte conserve uniquement ces deux actions en bas.
- Le montant du module Fragments est un bloc avec chiffres `lining-nums tabular-nums`, pour stabiliser leur hauteur et l’espacement du label.
- README, guides courants, changelog et validation révisés. Les anciennes notes de versions, audits datés et références conservent leur contexte historique.

Référence visuelle : [proposition de réception](../../references/bizave-fragments-recus-2026-11-04.html). État des contrôles et de la publication : [VALIDATION.md](../../VALIDATION.md).
