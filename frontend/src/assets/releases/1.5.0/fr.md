# Frontend 1.5.0 | Backend 1.5.1 | Database 8.2.3

## Détails de la version

- Internationalisation (i18n) complète.
- Ajout d'un service de thèmes pour l'interface utilisateur.
- Refactorisation de la logique d'attribution de l'utilisateur rapporteur afin d'améliorer la lisibilité et de garantir que les champs obligatoires sont validés avant de définir l'utilisateur rapporteur.
- Correction et unification du versionnage, et correction de la CVE-2025-14847 (MongoBleed).
- Revue des CVE : `ip` — catégorisation incorrecte de SSRF dans `isPublic` (ne concerne que l'arborescence de développement et n'affecte pas le build de production [un override est ajouté dans `package.json` pour forcer la dernière version]).
- Les alertes DoS de `multer` sont résolues pour [CVE-2024-52080, CVE-2024-52081, CVE-2024-52082] avec la version actuelle ; de plus, des limites de taille de fichier et un middleware sont ajoutés pour éviter les plantages du serveur dus aux erreurs de `multer` [Backend].
- Correction de l'erreur `upload_maxsize` [Frontend].
- Correction du bug : l'erreur « Error during query MongoDB. » apparaissait lors de la création de services et de procédures.

**Remarque importante :** Cette version introduit l'internationalisation complète du système.
