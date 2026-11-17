# Taux par défaut de la boutique journalière

Référence enregistrée le 17 novembre 2026 avant la proposition Hunger Games. Source : `src/game/dailyShop.ts`. Ces valeurs permettent de restaurer le fonctionnement habituel après un événement.

## Catégories du lot du jour

Le tirage choisit une catégorie, puis un booster dans cette catégorie.

| Catégorie | Poids sur 1 000 | Probabilité |
|---|---:|---:|
| Classique | 896 | 89,6 % |
| Spéciale | 104 | 10,4 % |
| Événement | 0 | 0 % |

Sans événement éligible, son poids est nul et revient aux classiques. Le poids spécial reste à 104 ; le poids classique vaut `896 - poids événement`.

## Boosters dans chaque catégorie

Les poids internes se comparent uniquement au sein d'une même catégorie.

| Catégorie | Booster | Poids interne | Chance finale par défaut |
|---|---|---:|---:|
| Classique | Memory Frame (`phantom-blood`) | 1 | 44,8 % |
| Classique | Anima Isekai | 1 | 44,8 % |
| Spéciale | rarity only | 20 | 8 % |
| Spéciale | epico stellari | 5 | 2 % |
| Spéciale | legenda completa | 1 | 0,4 % |
| Événement | merry xmas (`christmas-gift`) | 1 | 0 % |

Hunger Games et Nouvel An sont absents de la sélection journalière dans cette configuration de référence.

## Taille du lot

| Nombre de boosters | Poids / probabilité |
|---|---:|
| 5 | 30 % |
| 6 | 25 % |
| 7 | 20 % |
| 8 | 12 % |
| 9 | 8 % |
| 10 | 5 % |

## Remise et cartes du jour

- Remise entière de 5 à 20 %, bornes incluses : chaque valeur a une probabilité de 1/16 (6,25 %).
- Prix du lot arrondi à l'entier le plus proche après remise.
- Nombre de cartes du jour : 0, 1, 2 ou 3, chacun à 25 %.

## Taux Hunger Games validés — 17 novembre 2026

Catégories : classique 693, spéciale 104, événement 203. Hunger Games est le seul booster événement éligible (100 % dans cette catégorie).

| Booster | Chance finale pendant l’événement |
|---|---:|
| Memory Frame | 34,65 % |
| Anima Isekai | 34,65 % |
| rarity only | 8 % |
| epico stellari | 2 % |
| legenda completa | 0,4 % |
| Hunger Games | 20,3 % |

Taille du lot et remise conservées pendant l’événement.
