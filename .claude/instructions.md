# Instructions pour travailler sur SONAH

## Contexte

**SONAH** (Système d'Orientation Nationale et d'Accompagnement Harmonisé) est un prototype indépendant d'assistant
citoyen : il répond aux questions sur les démarches administratives et les droits au Cameroun en **citant les
textes officiels**. Il est préparé pour l'ITU AI for Good Lab Hackathon (UAE), rendu le **10 novembre 2026**.

Le jury évalue : la qualité de la base de connaissances, le comportement de l'agent dans les scénarios d'erreur,
l'identification des lacunes réglementaires et normatives, l'auditabilité, et l'alignement avec ITU-T Y.3172 et
l'AI Readiness Framework de l'UIT. La précision du prototype n'est pas notée en elle-même ; l'honnêteté l'est.
Livrables pour le jury en anglais.

## Règle n° 1 : ne jamais inventer

Aucun chiffre, résultat, loi, article, partenariat ou affiliation sans source vérifiable. En cas de doute :
« à confirmer », ou ne pas l'écrire. SONAH n'a mené aucun pilote et n'est affilié à aucun ministère.

## Architecture réelle

```
sonah/
├── apps/
│   ├── web/          # Next.js 14 (App Router, Tailwind, Zustand) — PWA : accueil, chat, démarches
│   └── api/          # NestJS — chat, recherche, documents, health ; env validé par Zod (src/config/env.ts)
├── packages/
│   ├── rag/          # découpage juridique par article, embeddings, pgvector, graphe Neo4j, ingestion
│   └── database/     # schéma Prisma + migrations (pgvector)
├── data/sources/     # PDF officiels + manifest.json (URL source, note de version)
├── docker/           # Dockerfiles dev et prod
├── docs/DEPLOYMENT.md
└── scripts/deploy.sh # déploiement VPS : migrations, health checks, rollback, indexation
```

- **Modèle de langage** : Gemini (prioritaire) ou OpenAI, optionnels. Sans clé, ou si le modèle échoue, Sonah
  passe en **mode extractif** : il cite les articles retrouvés, sans rien rédiger.
- **Embeddings** : Gemini, OpenAI, ou un embedder lexical hors ligne (aucune clé requise).
- **PostgreSQL + pgvector** : articles indexés, conversations anonymes.
- **Neo4j** (optionnel) : structure loi → article et dépendances entre démarches.
- **CI/CD** : GitHub Actions (format, lint, typecheck, tests avec PostgreSQL et Neo4j, build), images GHCR,
  déploiement SSH avec rollback et smoke tests (`/api/v1/health/ready`, `POST /api/v1/chat`).

Il n'y a pas de LangChain/LangGraph, de Redis, de RabbitMQ ni de Socket.io dans le code.

## Priorités du hackathon

1. **Base de connaissances** : textes officiels sourcés (URL, version, note d'amendement), découpés par article.
2. **Conseiller multi-agents** (politique publique et droit) avec une **vérification déterministe des citations**
   qui rend un verdict typé pour chaque réponse.
3. **Piste d'audit chaînée par hachage** : chaque réponse, ses sources et son verdict sont vérifiables.
4. **Scénarios d'erreur progressifs** (`sandbox/`) : modèle indisponible, aucune source, texte obsolète, prompt
   malveillant… avec le comportement sûr attendu.
5. **Registre des lacunes** réglementaires et normatives, et correspondance Y.3172 / AI Readiness (`docs/itu/`).
6. **Banc d'évaluation** (`eval/`) et rapport (`report/`).

## Conventions de code

- **TypeScript strict**, **pas de `any`** (utiliser `unknown` puis affiner), types de retour explicites.
- **Zod** pour valider toutes les entrées : corps HTTP, variables d'environnement, fichiers de données.
- **Erreurs** : jamais avalées ; `Logger` NestJS ; dégradation vers le mode extractif plutôt qu'une réponse non sourcée.
- **Nommage** : fichiers `kebab-case`, classes `PascalCase`, fonctions/variables `camelCase`, constantes `UPPER_SNAKE_CASE`.
- **Commentaires en français** ; documentation destinée au jury en anglais.
- Ne jamais afficher ni committer de fichier `.env` ou de secret.

## Conventions Git

Format Conventional Commits :

```
type(scope): description courte

[corps optionnel : le pourquoi]
```

Types : `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `ci`.
Scopes : `web`, `api`, `rag`, `database`, `deploy`, `deps`, `docs`, `data`.

**Interdictions** :

- Jamais de mention « Claude », « AI assistant » ou similaire dans les commits
- Jamais de « Co-Authored-By » automatique
- Jamais de force push sur `main`

## Commandes

```bash
pnpm install
docker compose up -d postgres neo4j
pnpm build
export DATABASE_URL="postgresql://postgres:password@localhost:5432/sonah"
pnpm --filter @sonah/database exec prisma migrate deploy
pnpm --filter @sonah/rag seed
pnpm dev                               # web :3000, api :4000/api/v1

# Avant chaque commit (identique à la CI)
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
RAG_INTEGRATION=1 pnpm test            # tests d'intégration (bases requises)
```

## Fichiers clés

- `apps/api/src/config/env.ts` : variables d'environnement (toute nouvelle variable va aussi dans `.env.example`)
- `apps/api/src/chat/` : service de chat, prompt de Sonah, modèle de langage et mode extractif
- `packages/rag/src/chunking/legal-chunker.ts` : découpage par article
- `packages/database/prisma/schema.prisma` : modèle de données
- `data/sources/manifest.json` : textes indexés
