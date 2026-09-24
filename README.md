# TamaDex V3.3

## Nouveautés
- Collection = tous les Tama rencontrés : bébé, enfant, ado et adulte.
- Filtre par stade dans le TamaDex.
- Reconnaissance visuelle à chaque évolution : grandes cartes illustrées, nom/stade automatiques.
- Depuis un œuf, le bouton devient **🐣 Mon œuf a éclos** et les actions de soin sont masquées avant l’éclosion.
- Chaque personnage choisi pendant un élevage est automatiquement ajouté à la collection.
- Historique avec nombre d'obtentions (`obtained_count`) et dernière obtention.
- Arbre d'évolution via `evolution_edges`.
- Ajout des stades de base Uni (bébés, enfants, ados) et Paradise (bébé, kids, youngs).

## Installation
1. Exécuter `tamadex-v3.3-migration.sql` dans Supabase après les migrations précédentes.
2. Remplacer les fichiers du site par ceux de ce dossier.
3. Attendre GitHub Pages puis faire un rechargement forcé.
4. Vérifier `TAMADEX · V3.3` en haut.

Les branches d'évolution sont enrichies progressivement : TamaDex préfère afficher un choix large plutôt que d'éliminer un personnage sur une règle non vérifiée.
