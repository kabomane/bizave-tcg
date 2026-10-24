# Illustrations de Bizave TCG

## Référence de génération

La DA officielle est [Souvenir × Moment culte](prompts/DA-illustrations-Souvenir-Moment-culte.md). Elle remplace le prompt global provisoire. Son contenu est conservé à l’identique pour les futures demandes de génération. Aucune génération n’est lancée par son ajout.

- prompts/instructions-cartes.md : noms et identifiants des 110 cartes, avec les consignes propres à chaque carte.
- references/ : références visuelles, éventuellement rangées par personnage ou carte.

Ces sources sont hors de public/ et ne sont pas publiées avec l’application.

## Illustrations finales

Les images utilisées vont dans public/assets/cards/<identifiant>/illustration.png. Une seule illustration sert aux versions **Classique** et **Full Art** ; les dispositions Fusion et Gundam assurent leur cadrage.

Les chemins artwork.standard et artwork.fullArt de src/data/catalogue.json pointent vers ce même fichier. Les clés techniques standard et normal restent compatibles avec les sauvegardes existantes ; les libellés affichés sont actualisés dans le jeu.

## Import du 24 octobre 2026

14 PNG originaux de TCG - bizave card..zip sont intégrés, dont les deux Risitas en remplacement des JPEG compressés. Chaque fichier fait 1086 × 1448 px. Les octets sont conservés à l’identique.

Les associations, raretés, dimensions et empreintes SHA-256 sont dans imports/2026-10-24/manifest.json. Les raretés et identifiants des 110 cartes restent inchangés. Les deux Mini utilisent toujours leurs placeholders.

Les 10 descriptions FICHES.description du carnet sont intégrées. Les champs Mémo et Création ne sont pas affichés comme descriptions. Le carnet fourni est conservé dans references/carnet-cartes-2026-10-24.jsx à la racine du projet.
