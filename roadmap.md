# Roadmap — Bizave TCG

État pour **bizave-tcg.v1.2.5**, le 27 octobre 2026. L’installation PWA et le hors ligne restent prévus. Le transfert de sauvegarde est implémenté ; son fonctionnement actuel est résumé en section 2 et décrit dans [le guide de sauvegarde](docs/sauvegarde.md).

## 1. Installation PWA et jeu hors ligne

### Objectif

Permettre l’installation du jeu sur téléphone et ordinateur, son lancement sans connexion et l’accès à toutes les ressources téléchargées, y compris après fermeture de l’application.

La collection, les fragments, les boosters et la progression sont déjà enregistrés localement dans IndexedDB. La PWA doit compléter ce stockage avec les ressources de l’application et les illustrations. L’installation exige une adresse HTTPS stable en production ; les sauvegardes existantes devront être prises en compte si l’origine change.

### Parcours dans les options

Créer une rubrique **Installation et hors ligne** contenant :

| Action ou information | Comportement attendu |
| --- | --- |
| Installer Bizave TCG | Proposer l’installation quand le navigateur le permet ; sinon afficher les instructions adaptées, notamment sur iPhone/iPad. |
| Télécharger le jeu hors ligne | Télécharger l’application, le catalogue et toutes les illustrations disponibles. |
| État du téléchargement | Afficher la progression, le nombre de ressources disponibles et l’espace utilisé. |
| Mettre à jour le jeu | Vérifier les versions et télécharger uniquement les fichiers ajoutés ou modifiés. |
| Version et dernière vérification | Afficher la version installée et la date de la dernière vérification réussie. |
| Réparer les fichiers hors ligne | Vérifier les ressources nécessaires et récupérer celles qui manquent ou sont invalides. |
| Supprimer les fichiers hors ligne | Supprimer les ressources téléchargées en conservant la progression, les cartes et l’identité du joueur. |

L’installation et la disponibilité hors ligne sont deux états distincts. Afficher **Prêt hors ligne** uniquement après vérification de l’ensemble des ressources requises. Prévoir les états : non téléchargé, téléchargement en cours, téléchargement incomplet, prêt hors ligne, mise à jour disponible et erreur récupérable.

### Illustrations et effets

- Télécharger toutes les illustrations disponibles, même celles des cartes non possédées, pour que les prochaines ouvertures de boosters fonctionnent hors ligne.
- Conserver une seule image par carte pour les formats Classique et Full Art.
- Inclure les placeholders pour les cartes sans illustration définitive.
- Conserver les effets holographiques, les cadres et les animations exécutés localement.
- Conserver l’accès aux visuels nécessaires aux anciennes cartes possédées si le catalogue évolue.
- Réutiliser les WebP 900 × 1200 déjà diffusés et versionnés par contenu ; les 110 PNG originaux restent conservés localement, hors Git et publication.

État mesuré le 25 octobre 2026 : **37 illustrations PNG, 140 409 985 octets, soit environ 140 Mo**, hors code et autres ressources. Cette mesure ne préjuge pas du poids après optimisation ni des futures illustrations.

### Mise à jour du jeu

1. Vérifier la version disponible sans bloquer le démarrage de la version installée.
2. Télécharger uniquement les nouveautés, avec des ressources identifiées par leur version ou leur empreinte.
3. Vérifier leur intégrité et leur disponibilité avant de déclarer la mise à jour prête.
4. Proposer **Mise à jour prête — Relancer** lorsqu’un redémarrage est nécessaire.
5. Activer une version cohérente de l’application et de son catalogue ; nettoyer les anciennes ressources uniquement lorsqu’elles ne sont plus nécessaires.

Préserver la version précédente en cas de téléchargement interrompu ou invalide. Prévoir une reprise sans retélécharger les fichiers déjà vérifiés. Ne jamais imposer un rechargement pendant une ouverture de booster ou un transfert. Après la sortie officielle, les mises à jour devront conserver la collection, les fragments, les stocks, les amis, l’identité et l’historique des échanges.

Prévoir une vérification automatique à l’ouverture et au retour de la connexion, ainsi que le bouton manuel **Mettre à jour le jeu**. Ne pas promettre une actualisation permanente lorsque l’application est fermée : les possibilités de travail en arrière-plan dépendent du navigateur et du système.

Ce bouton met à jour le contenu du jeu ; il ne synchronise pas la sauvegarde personnelle entre appareils.

### Fonctions hors connexion

| Fonction | Disponibilité prévue |
| --- | --- |
| Consultation et recherche dans la collection | Oui |
| Ouverture des boosters disponibles localement | Oui |
| Recharge gratuite selon les règles existantes | Oui, avec les limites actuelles d’une horloge locale |
| Recyclage | Oui |
| Boutique utilisant les fragments locaux | Oui |
| Liste des amis déjà enregistrés | Consultation possible |
| Ajout d’amis | Non, selon la règle produit demandée |
| Envoi et réception de cartes | Non, selon la règle produit demandée |
| Téléchargement des nouveautés | Au retour de la connexion |

Afficher clairement l’état de connexion et les raisons d’indisponibilité. Ne pas utiliser le seul indicateur réseau du navigateur comme preuve que le service est joignable.

### Stockage et robustesse

- Utiliser un service worker et Cache Storage pour les ressources ; conserver les données du joueur dans IndexedDB.
- Vérifier l’espace disponible et gérer les erreurs de quota.
- Demander un stockage persistant lorsque disponible, sans en garantir l’octroi.
- Distinguer strictement suppression des ressources hors ligne et effacement de la sauvegarde.
- Vérifier les ressources au lancement ou à la demande ; ne pas annoncer le jeu prêt si elles ont été supprimées par le navigateur.
- L’installation ne garantit pas la conservation définitive du stockage. La sauvegarde personnelle fera l’objet d’une conception distincte.

### Validation à prévoir

- Installation et lancement après fermeture complète, en mode avion.
- Collection, ouvertures, recyclage et achats en fragments hors connexion.
- Affichage Classique et Full Art des illustrations, y compris pour une carte obtenue hors ligne.
- Téléchargement interrompu, reprise, manque d’espace et réparation.
- Mise à jour avec nouvelles illustrations et changements de catalogue, sans perte de progression.
- Conservation d’une ouverture en cours ; absence de rechargement imposé.
- Suppression des ressources hors ligne sans suppression des données du joueur.
- Vérification sur Android/Chrome, iPhone/iPad/Safari et ordinateur, avec attention aux différences de stockage entre navigateur et application installée.

### Sources techniques

- [Ressources et données des PWA](https://web.dev/learn/pwa/assets-and-data)
- [Mises à jour des PWA](https://web.dev/learn/pwa/update)
- [Politique de stockage WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [Limites de l’indicateur de connexion du navigateur](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)

## 2. Transfert de sauvegarde — livré dans bizave-tcg.v1.2.5

Le parcours implémenté remplace la piste initiale à demande chiffrée, code ou QR code. Dans les options, le destinataire relève son ID d’appareil ; la source saisit cet ID et génère un fichier **.btcg signé**, sans code de sauvegarde à copier.

- Une seule paire de signature ECDSA P-256/SHA-256 transférable ; les échanges de cartes FR2/TR2 et les sauvegardes sont signés et lisibles.
- L’ID joueur, la clé privée, les amis et toute la progression suivent la sauvegarde. L’ID d’installation reste propre à l’appareil. Les amis peuvent continuer à envoyer des cartes, y compris celles préparées avant la migration.
- Le fichier est vérifié et enregistré dans la même transaction que l’effacement de la partie source. Celle-ci reste verrouillée sur la page de téléchargement, après fermeture et dans les autres onglets.
- L’import remplace la partie cible, conserve les registres nécessaires et inscrit le transfert de façon atomique. Une erreur annule toutes les écritures. Le fichier est refusé sur une autre installation et en cas de réimport.
- Les confirmations sont insensibles aux majuscules et minuscules ; les fenêtres sont adaptées au téléphone.
- **Supprimer le compte** réinitialise progression, amis, registres, options, identité et ID d’installation ; un fichier de migration en attente est également supprimé après confirmation.

Le fichier de sauvegarde contient l’identité privée et doit rester personnel. La protection vise les usages normaux du jeu local ; elle ne garantit pas l’unicité contre un client modifié ou un clonage complet du stockage. Aucun mécanisme de restauration ni de synchronisation n’est proposé.

Le nouveau protocole utilise la base de test distincte `bizave-tcg-v2`, sans reprise des anciennes identités, des anciens FR1/TR1 ni des sauvegardes version 1. Les illustrations appartiennent aux ressources du jeu et ne sont pas embarquées dans la sauvegarde.

Les tests de migration couvrent les échanges avant et après déplacement, les migrations successives, les erreurs de stockage, les accès concurrents, le maintien des registres et la continuité entre Firefox, Chromium et WebKit. Voir [docs/sauvegarde.md](docs/sauvegarde.md).
