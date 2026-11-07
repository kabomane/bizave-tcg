# Landing de découverte

`/landing` sert une page autonome issue du HTML fourni, sans démarrer le jeu ni créer de sauvegarde. Le HTML est dans `public/landing.html` ; les ajouts sont dans `public/landing.css` et `public/landing.js`. Le rendu des cartes et les animations du fichier d’origine sont conservés. Les illustrations utilisent les fichiers du catalogue existant et les polices sont hébergées localement.

Les cartes sont affichées directement avec leurs illustrations, noms et descriptions, y compris Ciel bleu et Le bus. La page présente les quatre boosters permanents, lucky boost, la vitrine et les bonus de la semaine. Le thème clair ou sombre suit la préférence système via `prefers-color-scheme`. Sans JavaScript, les aperçus et les liens vers le jeu restent visibles.

Aucun lien vers cette page n’est ajouté à l’application. La balise `robots` et l’en-tête Firebase `X-Robots-Tag` demandent `noindex, nofollow, noarchive`. La page reste publique pour toute personne possédant l’URL ; l’absence d’indexation ne constitue pas un contrôle d’accès. Ne pas bloquer son exploration dans `robots.txt`, car les moteurs doivent pouvoir lire la directive `noindex`.

Les réécritures Firebase et Vite exposent `/landing` et `/landing/`, paramètres compris, tout en conservant les routes du jeu. Le déploiement Firebase habituel publie la landing avec le catalogue des codes découverte.
