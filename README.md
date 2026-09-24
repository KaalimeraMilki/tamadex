# TamaDex V3.2

V3.2 ajoute le **suivi d'un élevage dès l'œuf**, sans obliger à choisir l'adulte à l'avance.

## Nouveautés

- Deux démarrages : **🥚 mode découverte** ou **🎯 objectif précis**.
- Un élevage peut ne pas avoir de `target_tamagotchi_id`.
- Contexte de départ : appareil, génération, origine de l'œuf et sexe si connus.
- Bouton **✨ Mon Tama a évolué** avec stade et nom du nouveau Tama.
- Chronologie mêlant évolutions et actions enregistrées.
- Liste des routes **vérifiées encore compatibles** et séparation explicite des guides non vérifiés.
- Possibilité de choisir un adulte objectif plus tard et de basculer vers le guide détaillé V3.1.
- Les élevages V3.1 existants restent en mode objectif.

## Installation

1. Exécuter `tamadex-v3.2-migration.sql` dans Supabase après V3.1.
2. Remplacer les fichiers du frontend dans GitHub Pages.
3. Attendre le déploiement puis recharger complètement la PWA.

## Sécurité de l'assistant

TamaDex n'élimine automatiquement un adulte que si sa règle structurée est marquée `rules_verified=true`. Les autres personnages restent « à confirmer » afin d'éviter les faux diagnostics d'évolution.
