# Codes partagés Base62

Les codes amis `FR3.`, cartes `TR3.`, fragments `TF2.` et collections `CL2.` utilisent le même codec dans `src/encoding/`. Seul l'encodage extérieur change : les charges utiles, versions internes, domaines de signature, clés JWK et signatures gardent leurs formats existants. Aucun changement du schéma IndexedDB.

## Encodage exact

- Alphabet ordonné : `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`. La casse est significative.
- Découper les octets en blocs de 32 octets, puis un dernier bloc de 1 à 31 octets si nécessaire.
- Chaque bloc représente un entier non signé, octet de poids fort en premier. Écrire cet entier en base 62, puis compléter à gauche avec le chiffre `0` pour atteindre `ceil(8 × nombreOctets / log2(62))` caractères. Un bloc complet fait donc toujours 43 caractères. Ces zéros font partie du code.
- Concaténer les blocs, puis ajouter le préfixe et le point. Le codec des octets vides renvoie une chaîne vide, mais les codes partagés exigent un corps non vide.
- Au décodage, découper en blocs de 43 caractères ; la longueur du dernier bloc détermine son nombre d'octets. Refuser les longueurs impossibles, tout caractère hors alphabet et tout entier trop grand pour son bloc. Ne pas convertir la casse ni supprimer des caractères internes.

Ce format par blocs est propre au protocole Bizave : un décodeur Base62 générique qui traite tout le texte comme un seul entier n'est pas interchangeable. Il conserve les zéros initiaux et impose une représentation unique, avec un travail borné par bloc. Le navigateur utilise uniquement des entiers de petite taille : ni `BigInt`, ni `Buffer`, ni dépendance externe. Un bloc de 32 octets occupe 43 caractères contre 42,67 en Base64, soit environ 0,8 % de plus, avec un arrondi supplémentaire possible pour le dernier bloc.

## Réception et fichiers

Les préfixes et validations sont centralisés dans `shareCode.ts`. Les limites restent de 12 000 caractères pour les échanges et de 32 768 pour les collections. Les fichiers `.btcg` transportent exactement les mêmes nouveaux codes ; leurs conteneurs JSON gardent leurs versions existantes. Les lecteurs vérifient ensuite les signatures, destinataires, dates d'expiration et registres anti-rejeu habituels.

Les téléchargements de cartes, fragments, collections et sauvegardes utilisent tous le type `application/octet-stream` et un nom finissant uniquement par `.btcg`. Le contenu reste du JSON, mais le téléchargement n'est pas déclaré `application/json`, pour éviter l'ajout d'une extension `.json` par le navigateur.

Les espaces extérieurs sont tolérés par les parcours de collage. Les caractères internes altérés sont refusés. Base62 évite les marqueurs Markdown `_` et `-` dans le corps, mais ne corrige pas un message tronqué ou modifié par une messagerie.

Les anciens codes `FR2.`, `TR2.`, `TF1.` et `CL1.` ne sont plus reçus. Les identités et amis enregistrés restent valides ; les anciennes collections mémorisées nécessitent un nouveau partage. Les sauvegardes contenant des codes historiques en boîte d'envoi restent importables pour préserver la partie, sans rendre ces codes historiques recevables. Les codes cadeaux ont déjà un alphabet alphanumérique et conservent leur format.

## Vérification

`npm run check` vérifie lint, tests unitaires et build. Les tests du codec couvrent des vecteurs calculés indépendamment, les zéros initiaux, les limites de blocs, tous les octets, une collection à la limite de taille et les entrées non canoniques. Les vecteurs de collection gardent exactement leurs charges utiles et signatures publiées, réencodées avec un calcul indépendant.

`npm run test:codes` vérifie les quatre formats dans Chromium, Firefox et WebKit, ainsi qu'avec des profils Android, iPhone, iPad et tablette Android. Il échange les codes entre Node et chaque navigateur, vérifie les fichiers, les signatures dans les deux sens, les grandes collections et le rejet d'un transfert déjà consommé. Ces profils simulent les appareils ; ils ne remplacent pas un essai sur des appareils physiques ni dans les messageries concernées.

Le même jeu de configurations inclut `tests/btcg-downloads.spec.ts` : quatre téléchargements réels par configuration, avec contrôle du nom `.btcg` et du type MIME. Pour ne relancer que ce contrôle : `npm run test:codes -- tests/btcg-downloads.spec.ts`.
