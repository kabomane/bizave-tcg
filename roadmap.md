# Roadmap — Bizave TCG

Document de conception du 25 octobre 2026. Les fonctionnalités ci-dessous sont prévues ; elles ne sont pas encore implémentées.

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
- Étudier des versions WebP optimisées pour la diffusion, avec comparaison visuelle avant validation et conservation des PNG originaux.

État mesuré le 25 octobre 2026 : **37 illustrations PNG, 140 409 985 octets, soit environ 140 Mo**, hors code et autres ressources. Cette mesure ne préjuge pas du poids après optimisation ni des futures illustrations.

### Mise à jour du jeu

1. Vérifier la version disponible sans bloquer le démarrage de la version installée.
2. Télécharger uniquement les nouveautés, avec des ressources identifiées par leur version ou leur empreinte.
3. Vérifier leur intégrité et leur disponibilité avant de déclarer la mise à jour prête.
4. Proposer **Mise à jour prête — Relancer** lorsqu’un redémarrage est nécessaire.
5. Activer une version cohérente de l’application et de son catalogue ; nettoyer les anciennes ressources uniquement lorsqu’elles ne sont plus nécessaires.

Préserver la version précédente en cas de téléchargement interrompu ou invalide. Prévoir une reprise sans retélécharger les fichiers déjà vérifiés. Ne jamais imposer un rechargement pendant une ouverture de booster ou un transfert. Les mises à jour doivent conserver la collection, les fragments, les stocks, les amis, l’identité et l’historique des échanges.

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

## 2. Déplacement de sauvegarde sans backend — piste retenue

### Objectif et contraintes

Permettre de déplacer sa sauvegarde vers un autre appareil au moyen d’un fichier **.btcg dédié à la sauvegarde**, distinct par son type interne des fichiers .btcg de transfert de carte. Le fonctionnement doit être **sans backend**. Cette section consigne une piste de conception issue du brainstorm ; aucun code n’est implémenté et le protocole détaillé reste à valider.

Le déplacement doit désactiver la sauvegarde source et activer sa version transférée sur la destination. Il ne doit jamais additionner deux collections.

### Idée initiale et problème identifié

Le joueur prépare un fichier sur le premier appareil, puis récupère un code dans ses paramètres d’export pour autoriser l’import sur le second. La sauvegarde source reste présente avant la confirmation du départ.

Un code générique associé au fichier ne suffit pas : le joueur peut conserver le fichier et le code, puis les réutiliser sur plusieurs appareils. La disparition du code de l’interface ne supprime pas les copies déjà réalisées. Sans liaison entre les appareils, le premier ne peut pas savoir que le code a été saisi sur le second.

### Parcours proposé : autorisation liée à une destination

1. **Recevoir ma sauvegarde — destination.** La nouvelle installation crée une demande unique liée à une clé privée locale. La demande est transmise au premier appareil par fichier ou QR code ; la clé privée reste sur la destination.
2. **Déplacer ma sauvegarde — source.** Le premier appareil lit la demande et prépare un fichier final chiffré pour cette destination. L’autorisation est liée à la demande, à la destination et au contenu exact de la sauvegarde.
3. **Figer la progression source.** Dès la préparation du fichier final, bloquer les ouvertures, achats, recyclages, échanges et autres mutations de cette sauvegarde. Une activité parallèle pourrait rendre le fichier obsolète et permettre la restauration de cartes déjà envoyées ou dépensées. Le verrouillage doit couvrir tous les onglets ou fenêtres utilisant la même sauvegarde.
4. **Confirmer le départ — source.** Désactiver durablement la collection source avant de délivrer l’autorisation finale. Un code ou QR code peut servir de confirmation dans l’interface ; la protection repose sur la liaison cryptographique à la destination, et non sur la disparition du code.
5. **Activer la sauvegarde — destination.** Vérifier le fichier et son autorisation, puis effectuer un import cohérent et indivisible. Mémoriser l’identifiant du déplacement pour empêcher son application répétée dans la même installation. Ne jamais fusionner ou cumuler les collections.

La liaison concerne une **installation et sa clé**, pas une identité matérielle garantie du téléphone ou de l’ordinateur. Le simple partage du fichier et du code ne doit pas permettre une activation sur une autre installation dépourvue de cette clé.

### Interruptions et récupération

- Un téléchargement annulé, une fermeture ou une panne pendant le déplacement ne doit pas provoquer une perte silencieuse de collection.
- Prévoir la possibilité de redonner **exactement le même transfert à la même destination**, en conservant côté source les éléments de reprise nécessaires sous un état verrouillé et non jouable.
- Ne pas réactiver librement la source après délivrance d’une autorisation : une copie de cette autorisation pourrait encore activer la destination.
- Définir les possibilités d’annulation selon l’étape atteinte. Après délivrance, l’invalidation d’une autorisation sur un autre appareil isolé ne peut pas être supposée.
- Définir le traitement d’une destination déjà utilisée, la confirmation d’un remplacement et le sort de sa sauvegarde précédente.
- Définir le cas où la destination perd sa clé ou efface ses données avant la fin du transfert. Ne pas promettre de récupération universelle.

### Portée de la protection

Objectif : empêcher les duplications au moyen des fonctions normales du jeu, notamment la redistribution d’un fichier et d’un code à plusieurs installations et les imports répétés qui additionneraient des cartes.

**Limite acceptée pour cette piste sans serveur : aucune garantie absolue d’unicité face au clonage, à la modification ou à la restauration complète du stockage local.** Un état de navigateur sauvegardé avant le déplacement peut notamment rétablir une source antérieure à son verrouillage. Un registre local des imports ou déplacements ne constitue pas un registre partagé entre appareils.

Le chiffrement protège le contenu et les signatures son authenticité ; ils ne rendent pas à eux seuls un fichier consommable une seule fois sur tous les appareils. Les clés non exportables limitent les opérations d’export via Web Crypto, sans garantir une protection contre une copie de l’environnement local.

### Identité et contenu à concevoir

- Préserver les identifiants des exemplaires, la progression, les fragments, les stocks et ouvertures en cours, ainsi que l’historique nécessaire pour éviter les réutilisations de transferts.
- Définir la migration des amis et de l’identité d’échange. Les clés privées actuelles sont non exportables : un simple export JSON ne permet pas de conserver cette identité sur un autre appareil. Prévoir une stratégie de migration avant toute implémentation.
- Ne pas embarquer les illustrations dans la sauvegarde ; elles appartiennent aux ressources du jeu et au téléchargement PWA.
- Versionner et valider le format ; distinguer explicitement une sauvegarde d’un transfert de carte malgré l’extension commune .btcg.
- Concevoir et vérifier le protocole complet avant de revendiquer ses garanties de sécurité.

### Validation à prévoir

- Parcours normal entre deux installations, puis refus du fichier sur une troisième installation.
- Refus de réimport sur la source avec le seul fichier et le code conservés.
- Import répété et tentatives simultanées dans plusieurs onglets, sans cumul ni double activation locale.
- Blocage de toutes les mutations source pendant la préparation finale et après confirmation du départ.
- Interruption à chaque étape, reprise du même transfert et cohérence de l’état final.
- Fichier altéré, tronqué, mauvaise destination, mauvaise autorisation et version incompatible.
- Conservation ou migration explicite de l’identité, des amis, des ouvertures en cours et des historiques d’échange.
- Documentation visible des limites concernant la restauration d’un ancien profil et la perte des clés de destination.

### Source technique

- [W3C — limites de sécurité du stockage des clés Web Crypto](https://www.w3.org/TR/webcrypto/#security-developers)
