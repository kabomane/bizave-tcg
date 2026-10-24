# Validation — 23 octobre 2026

## Refonte Phantom Blood

- `npm run check` : ESLint sans avertissement, **50 tests Vitest réussis**, TypeScript et build Vite vérifiés.
- Nouveau test de publication : un seul booster, titre/sous-titre exacts, 110 modèles éligibles.
- Nouveau parcours vérifié dans Chromium : clic sur le sachet, révélation au clic sur les cartes, même carte après refresh, cinq cartes au récapitulatif.
- Filtres custom vérifiés : Full Art + Brillante combinés, gabarit Gundam conservé ; deux filtres uniquement, sans `select` natif.
- Accueil mobile 390×844 inspecté ; nouvelle palette, packaging et navigation à quatre entrées.
- Les scénarios Playwright ont été adaptés à la refonte ; `npm run test:e2e -- --list` reconnaît **15 scénarios** (cinq parcours × trois moteurs). Leur exécution complète n’est pas revendiquée.

Les sections ci-dessous conservent les validations initiales du moteur, de la persistance et des échanges. Les captures et textes de la première DA ne décrivent plus l’interface actuelle.

## Exécuté avec succès

- `npm run check` : **ESLint sans avertissement, 49 tests Vitest réussis, TypeScript et build Vite réussis**.
- Catalogue : les 110 modèles fournis, leur répartition 39/24/21/16/10 et les 220 fichiers placeholders sont vérifiés.
- Le CSS des compositions de cartes est comparé à la démo source par un test.
- Simulation déterministe de 100 000 cartes ; 30 valeurs de recyclage ; probabilités, profils et validation des pools.
- IndexedDB simulé : reprise d’ouverture, atomicité, concurrence entre connexions, recharge hors jeu, recyclage, archives et migration.
- Web Crypto réel de Node : clés non exportables, contacts, chiffrement, signatures, altérations, antirejeu, retours A→B→C→B→A et transactions concurrentes.

## Parcours vérifiés dans Chromium

- Ouverture gratuite et cinq révélations.
- Rechargement après la première révélation : même carte et progression conservées.
- Collection persistante, fiche ouverte au clavier et fermeture par Échap.
- Deux origines de test distinctes (`localhost` et `127.0.0.1`) : création des identités, ajout réciproque des contacts, envoi d’un exemplaire, réception, refus d’un second import.
- Écrans Boosters, Collection, Atelier et Amis & échanges.
- Formats 390×844, 768×1024, 1024×768, 1440×900 et 1920×1080 : inspection visuelle et absence de débordement horizontal sur les vues contrôlées. L’action d’ouverture reste fixe au-dessus de la navigation sur téléphone.
- L’URL Tailscale `http://100.79.153.115:5173/` a été ouverte et affiche un carnet vierge.

## Réseau

Les adresses HTTP localhost, Wi-Fi `192.168.1.188:5173` et Tailscale `100.79.153.115:5173` répondent **200** depuis cette machine. Vite écoute sur `0.0.0.0`, avec une seconde instance HTTPS sur le port 5174. Aucun changement de pare-feu.

L’accès depuis un **autre appareil physique** n’a pas été vérifié. Il dépend du pare-feu et de l’appartenance au réseau Wi-Fi/Tailscale. Les échanges entre appareils exigent HTTPS. Le certificat autosigné de développement n’a pas été accepté automatiquement par l’agent.

## À valider avant une diffusion finale

- Les scénarios Playwright sont fournis pour Chromium, Firefox et WebKit ; leur exécution automatisée complète n’est pas incluse dans cette validation.
- Safari/iOS réel, Firefox réel, clavier et lecteur d’écran sur appareils cibles.
- Les illustrations définitives et leurs cadrages dans les deux gabarits.
- Le projet Firebase et son déploiement final (configuration Hosting fournie, aucune publication effectuée).

Les données créées dans les carnets de test localhost/127.0.0.1 ne se mélangent pas à celles des adresses réseau : chaque origine possède sa sauvegarde.
