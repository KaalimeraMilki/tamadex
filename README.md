# TamaDex V3

PWA Tamagotchi Uni & Paradise avec Supabase.

## Nouveautés V3

- Assistant d'évolution et élevages actifs
- Compteurs illustrés : repas, repas spécial, erreur de soin, jeux, promenades, etc.
- Traductions françaises des repas Paradise avec nom anglais conservé en référence
- Validation d'un objectif => ajout automatique à la collection
- Résolution des illustrations par lots, préchargement en arrière-plan et cache navigateur
- Images affichées en entier (`contain`) avec zoom/position réglables
- Back-office administrateur sécurisé par RLS
- Édition des textes FR, conditions, URL d'image et cadrage
- Édition des traductions directement depuis l'admin

## Installation

1. Dans Supabase > SQL Editor, exécuter `tamadex-v3-migration.sql`.
2. Vérifier le résultat : 1 admin, 62 traductions de repas et 19 traductions d'actions.
3. Envoyer les fichiers web à la racine du dépôt GitHub Pages (ne pas envoyer le fichier SQL sur le site si vous ne le souhaitez pas).
4. Commit puis attendre le redéploiement GitHub Pages.
5. Faire Ctrl+F5 une fois.

Le script de migration considère le premier compte créé dans ce projet Supabase comme administrateur initial.
