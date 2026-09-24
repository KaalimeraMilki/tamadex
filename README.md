# TamaDex V3.3.1

Correctif de la V3.3 et amélioration de l'arbre d'évolution.

## Installation
1. Exécuter `tamadex-v3.3.1-migration.sql` dans Supabase après la migration V3.3.
2. Remplacer les fichiers du dépôt GitHub Pages par ceux de ce dossier.
3. Faire un rechargement forcé (Ctrl+F5).

## Changements
- Répare les élevages hérités où le nom courant (ex. Welcotchi) était connu mais pas `current_tamagotchi_id/current_stage`.
- Affiche l'illustration du Tama courant et son vrai stade dans le mode découverte.
- Les « évolutions possibles » partent désormais du personnage courant et du prochain stade, au lieu de compter tout le catalogue.
- Le sélecteur visuel utilise en priorité les arêtes vérifiées.
- Arbre Uni enrichi jusqu'aux adultes de base + adultes spéciaux Hypertchi/Bubbletchi/Simasimatchi/Yattatchi.
- Chronologie : noms de stades affichés en français.
