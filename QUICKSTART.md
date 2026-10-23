# Quickstart

Run SONAH locally in about ten minutes. No API key is required.

## Requirements

- Node.js 20 (18+ works for development; the Docker images use 20)
- pnpm 8 (`corepack enable && corepack prepare pnpm@8.15.0 --activate`)
- Docker with Compose v2

## 1. Install

```bash
git clone https://github.com/emeric-cyrille/sonah.git
cd sonah
pnpm install
cp .env.example .env
```

`.env` works as is for local development. The API reads it from the repository root. Every variable is
described in [`.env.example`](./.env.example).

## 2. Start the databases

```bash
docker compose up -d postgres neo4j
docker compose ps        # wait until both are "healthy"
```

- PostgreSQL 16 + pgvector on `localhost:5432` (user `postgres`, password `password`, database `sonah`).
  The `vector` extension is created by `infrastructure/postgres/init.sql`.
- Neo4j 5 on `localhost:7687` (browser on http://localhost:7474, `neo4j` / `password`). It is optional:
  leave `NEO4J_URI` empty in `.env` to run without it.

`docker-compose.yml` also defines `api` and `web` containers and Redis/RabbitMQ services. The application does not
need any of them for local development.

## 3. Build, migrate and index

```bash
pnpm build                                                   # builds @sonah/database, @sonah/rag, api, web
export DATABASE_URL="postgresql://postgres:password@localhost:5432/sonah"
pnpm --filter @sonah/database exec prisma migrate deploy     # creates the schema
pnpm --filter @sonah/rag seed                                # indexes data/sources (idempotent)
```

To also store the structure of the texts in Neo4j, export `NEO4J_URI=bolt://localhost:7687`, `NEO4J_USER=neo4j`
and `NEO4J_PASSWORD=password` before running the seed.

The seed script reads only the shell environment, not `.env`. When you add a model key, export it as well and run
the seed again: the texts are then re-embedded with that provider's embedding model.

## 4. Run

```bash
pnpm dev
```

- Web app: http://localhost:3000 (it proxies `/api/v1` to the API)
- API: http://localhost:4000/api/v1

Or run each app on its own: `pnpm --filter @sonah/api dev` and `pnpm --filter @sonah/web dev`.

## 5. Check

```bash
curl -s http://localhost:4000/api/v1/health          # liveness
curl -s http://localhost:4000/api/v1/health/ready    # database, graph, model, indexed articles
curl -s -X POST http://localhost:4000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Quelle est la durée légale du travail ?"}'
```

Without a key, `health/ready` reports `"languageModel":"extractif"` and the chat reply quotes the most relevant
articles. With `GEMINI_API_KEY` or `OPENAI_API_KEY` set, SONAH writes an answer with numbered citations.

## Useful commands

| Command                                                 | Purpose                                              |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `pnpm format` / `pnpm format:check`                     | Prettier                                             |
| `pnpm lint`                                             | ESLint (zero warnings)                               |
| `pnpm typecheck`                                        | TypeScript, strict                                   |
| `pnpm test`                                             | Unit tests (Jest)                                    |
| `RAG_INTEGRATION=1 pnpm test`                           | Also runs integration tests against PostgreSQL/Neo4j |
| `pnpm build`                                            | Build all packages and apps                          |
| `pnpm --filter @sonah/database exec prisma migrate dev` | Create a new migration after a schema change         |
| `pnpm --filter @sonah/database exec prisma studio`      | Browse the database                                  |
| `docker compose down` / `docker compose down -v`        | Stop the databases (and delete their data)           |

## Troubleshooting

- **`Configuration invalide : DATABASE_URL: Required`** when starting the API: `.env` is missing at the repository root.
- **`Cannot find module '@sonah/database'`**: run `pnpm build` once so the workspace packages have a `dist/`.
- **`type "vector" does not exist`** during migration: the database volume was created without the init script.
  Run `docker exec sonah-postgres psql -U postgres -d sonah -c 'CREATE EXTENSION IF NOT EXISTS vector;'`.
- **Port already in use** (3000, 4000, 5432): stop the other process (`lsof -ti:4000 | xargs kill`).
