# Textes officiels indexés par Sonah

| Fichier | Texte | Source |
|---------|-------|--------|
| `constitution-1996.pdf` | Constitution de la République du Cameroun, loi n° 96-06 du 18 janvier 1996 | [FAOLEX](https://faolex.fao.org/docs/pdf/cmr117236.pdf) |
| `code-du-travail-1992.pdf` | Code du travail, loi n° 92-007 du 14 août 1992 (édition Droit-Afrique) | [FAOLEX](https://faolex.fao.org/docs/pdf/cmr198304.pdf) |

**Versions** : la Constitution est le texte de 1996. Plusieurs articles ont été modifiés depuis, notamment
par la loi n° 2008-1 du 14 avril 2008. Cette note est enregistrée avec chaque article indexé et Sonah la
rappelle quand il cite le texte. À remplacer par une version consolidée officielle dès qu'elle est disponible.

## Ajouter un texte

1. Déposer le PDF dans ce dossier.
2. Le déclarer dans `manifest.json` (identifiant, titre, type, URL, note de version, lignes parasites à retirer).
3. Lancer l'indexation : `pnpm --filter @sonah/rag seed` en local, ou
   `docker compose -f docker-compose.prod.yml --env-file .env.production exec api node dist/scripts/seed.js` en production.

L'indexation est idempotente : chaque article a une clé stable (`<texte>:art-<numéro>:<partie>`).
