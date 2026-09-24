# TamaDex V3.1

V3.1 corrige le point principal de la V3 : une action mesurable n'est plus présentée comme si elle constituait toute la condition d'évolution.

## Installation

1. Le projet doit déjà avoir reçu la migration V3.
2. Dans Supabase > SQL Editor, exécuter `tamadex-v3.1-migration.sql`.
3. Vérifier le résultat final : `regles_structurees = 3`, `regles_verifiees = 3`, `personnages = 206` sur le catalogue actuel.
4. Remplacer les fichiers du site GitHub Pages par ceux de ce dossier.
5. Attendre le déploiement puis recharger complètement la PWA.

## Nouveautés

- Prérequis séparés des actions à compter.
- Routes alternatives ET / OU.
- Vérification d'éligibilité au démarrage et sur les élevages V3 existants.
- États : prérequis à vérifier, élevage en cours, conditions suivies remplies, route non accessible.
- Actions importantes mises en avant ; actions génériques repliées.
- Barres de progression sur les seuils (ex. 0/3 → 3/3).
- Bloc « Où j'en suis ? ».
- Bouton explicite « J'ai obtenu … ».
- Confirmation avant l'arrêt d'un élevage.
- Règles structurées éditables dans l'administration avec source + marqueur « vérifiée ».
- Analyse prudente du texte existant pour les personnages sans règle JSON : le texte complet reste toujours accessible.

## Règles vérifiées incluses

La migration fournit des règles structurées pour Bubbletchi, Hypertchi et Mametchi (Uni). Les autres entrées continuent d'utiliser le moteur d'analyse du catalogue jusqu'à validation manuelle dans l'administration.
