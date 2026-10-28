# TamaDex V6 — stockage local

Version autonome sans Supabase. Toutes les données utilisateur sont conservées dans IndexedDB sur chaque appareil. Le catalogue est fourni dans `catalog.json` et peut être consulté hors ligne après installation.

## Installation GitHub Pages
Déployer tous les fichiers à la racine de la branche `main`. Aucun compte Supabase, aucune migration SQL.

## Limitations
- Les anciens comptes et données Supabase supprimés ne sont pas récupérables automatiquement.
- La collection est différente sur chaque appareil ; export/import JSON depuis Profil pour transférer.
- Les fonctions Amis et Défis réseau sont retirées.
- Catalogue initial inclus : 206 adultes + une sélection de stades intermédiaires. Certaines branches et conditions détaillées de V5.2 ne sont pas encore réintégrées ; les conseils d'évolution sont indicatifs. Ne pas confondre avec une migration fonctionnelle intégrale de V5.2.
- Les images externes de Tamagotchi Wiki peuvent nécessiter une connexion ; le fonctionnement de la base locale n'en dépend pas.
- Le suivi des actions est par stade, les générations et accouplements sont conservés.
- Conserver régulièrement une sauvegarde JSON, surtout avant suppression du navigateur ou changement d'appareil.
