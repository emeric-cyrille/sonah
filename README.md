# SONAH

**A citizen assistant that answers questions about Cameroonian administrative procedures and rights, and cites the official text behind every answer.**

SONAH stands for _Système d'Orientation Nationale et d'Accompagnement Harmonisé_ (National System for Harmonised Guidance and Support). The prototype is being built for the ITU AI for Good Lab Hackathon (UAE, 2026).

[![CI](https://github.com/emeric-cyrille/sonah/actions/workflows/ci.yml/badge.svg)](https://github.com/emeric-cyrille/sonah/actions/workflows/ci.yml)
[![Deploy](https://github.com/emeric-cyrille/sonah/actions/workflows/deploy.yml/badge.svg)](https://github.com/emeric-cyrille/sonah/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**Live demo:** https://sonah.fokamemeric.com

> SONAH is an independent prototype. It is not an official government service, and its answers give guidance only. They are not legal advice.

---

## The problem

Cameroon is officially bilingual (French and English). Its laws, codes and procedures are published in many places, some of them out of date or not consolidated. To find which rule applies (how long a working week may last, what the Constitution guarantees, which office handles a procedure), people often rely on informal intermediaries or on hearsay. The information is public, but it is hard for most people to find, read and trust.

## The solution

SONAH is a conversational assistant (a web app that can be installed on a phone) that:

1. **retrieves** the relevant articles from an indexed corpus of official texts, split article by article;
2. **answers** in plain language with numbered citations to those articles, the source URL, and a note when the indexed version may be outdated;
3. **degrades safely**: when no language model is available, or when it fails, SONAH does not write an answer of its own. It returns the most relevant articles word for word, so the user never gets an unsupported answer.

## Alignment with the Sustainable Development Goals

These are the SDG targets the project is designed to support. They are **not** impact claims: nothing has been measured in the field yet.

| SDG target | How SONAH aligns                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------- |
| **16.6**   | Effective, accountable and transparent institutions: traceable answers grounded in official texts   |
| **16.10**  | Public access to information: plain-language access to the Constitution and the codes               |
| **10.2**   | Inclusion: a free channel that does not depend on paid intermediaries                               |
| **8.3**    | Entrepreneurship and formalisation: guidance on administrative procedures (as more texts are added) |

---

## Architecture today

What is implemented and deployed on `main`:

```
 Browser / PWA (Next.js 14)
        │  /api/v1  (same domain, Traefik)
        ▼
 NestJS API ──── chat ─────▶ language model (Gemini or OpenAI, optional)
        │                         │ unavailable or failing
        │                         ▼
        │                    extractive mode: quotes the retrieved articles only
        ├── search / documents
        ▼
 @sonah/rag ── PostgreSQL + pgvector (article-level chunks, embeddings)
            └─ Neo4j (optional: law → article structure, procedure dependency graph)
```

| Component           | What it does                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`          | Next.js 14 PWA (App Router, Tailwind, Zustand): home, chat, procedures pages                                                                                                                                                                            |
| `apps/api`          | NestJS API: `POST /api/v1/chat`, `POST /api/v1/search`, documents endpoints (admin token), `GET /api/v1/health` and `/health/ready` (database, graph, model, number of indexed articles)                                                                |
| `packages/rag`      | Legal article chunker (titles, chapters, articles; noise removal), embeddings (Gemini, OpenAI, or an offline hashing embedder with no API key), pgvector store, Neo4j graph service (law → article links, procedure dependencies), idempotent ingestion |
| `packages/database` | Prisma schema and migrations (pgvector extension, anonymous conversations, article-level documents)                                                                                                                                                     |
| `data/sources`      | Official source PDFs and `manifest.json` (title, URL, version note for each text)                                                                                                                                                                       |
| CI/CD               | GitHub Actions: format, lint, typecheck, tests against real PostgreSQL and Neo4j, build, Docker images on GHCR, SSH deployment with health checks, automatic rollback and HTTPS smoke tests                                                             |

Input is validated with Zod at the API boundary. Environment variables are validated at startup.

## In progress for the hackathon

The items below are **being built** and are not on `main` yet. Their folders are linked so reviewers can follow progress.

- **Multi-agent policy and legal adviser.** Specialised roles (retrieval, legal reasoning, policy analysis) coordinated by an orchestrator.
- **Deterministic citation gate.** Every claim must map to a retrieved article. Each answer gets a typed verdict (e.g. supported, partially supported, abstain) before it reaches the user.
- **Hash-chained audit trail.** Every answer, its sources and its verdict are recorded so they can be verified afterwards.
- **Progressive error scenarios.** Model outage, empty retrieval, contradictory or outdated texts, adversarial prompts, each with the expected safe behaviour → [`sandbox/`](./sandbox/)
- **Policy and standards gap register.** Gaps found between Cameroonian texts and international references, with evidence → [`docs/itu/`](./docs/itu/)
- **Evaluation harness.** Gold questions, retrieval and citation metrics, error-scenario pass rates → [`eval/`](./eval/)
- **Mapping to ITU-T Y.3172** (architectural framework for machine learning in future networks) **and to the ITU AI Readiness Framework** → [`docs/itu/`](./docs/itu/)
- **Hackathon report** → [`report/`](./report/)

---

## Knowledge base

| Text                                                                    | Indexed (local run, 2026-10-23) | Source                                                  | Version note                                                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Constitution of the Republic of Cameroon (Law No. 96-06 of 18 Jan 1996) | 68 articles (79 chunks)         | [FAOLEX](https://faolex.fao.org/docs/pdf/cmr117236.pdf) | 1996 text. Several articles were amended later, notably by Law No. 2008-1 of 14 April 2008. SONAH shows this note when it cites the text |
| Labour Code (Law No. 92-007 of 14 Aug 1992)                             | 177 articles (179 chunks)       | [FAOLEX](https://faolex.fao.org/docs/pdf/cmr198304.pdf) | 1992 text (Droit-Afrique edition). Later implementing texts and amendments may complete some provisions                                  |

Indexed texts are currently in French. More texts are being added. To add one, see [`data/sources/README.md`](./data/sources/README.md).

## Targets and evaluation plan

There are no field results yet. These are the targets we will measure with the evaluation harness. Every baseline is still **to be measured**.

| Target                                                                                   | Baseline          | How it will be measured                                                   |
| ---------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| Every legal statement in an answer is backed by a cited, indexed article                 | to be measured    | Citation gate verdicts and manual review of a gold question set (`eval/`) |
| Correct article retrieved in the top 5 for gold questions                                | to be measured    | Recall@5 on gold questions with expected article references (`eval/`)     |
| Abstains instead of guessing when the answer is not in the corpus                        | to be measured    | Out-of-corpus questions in the gold set; abstention rate (`eval/`)        |
| Safe behaviour in each error scenario (model down, empty retrieval, outdated text, etc.) | to be measured    | Scripted scenarios in `sandbox/` with expected verdicts                   |
| Every answer has a verifiable audit record                                               | to be measured    | Audit chain verification over a test session                              |
| Service stays up and cites sources without a language model                              | checked on deploy | Deploy smoke test: `POST /api/v1/chat` returns HTTP 200 with a reply      |

---

## Quickstart

Requirements: Node.js 20, pnpm 8, Docker.

```bash
git clone https://github.com/emeric-cyrille/sonah.git
cd sonah
pnpm install
cp .env.example .env                       # works as is; API keys are optional

# 1. Databases (PostgreSQL + pgvector; Neo4j is optional)
docker compose up -d postgres neo4j

# 2. Build the workspace packages, then apply migrations
pnpm build
export DATABASE_URL="postgresql://postgres:password@localhost:5432/sonah"
pnpm --filter @sonah/database exec prisma migrate deploy

# 3. Index the official texts (add NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD to also fill the graph)
pnpm --filter @sonah/rag seed

# 4. Run the web app (http://localhost:3000) and the API (http://localhost:4000/api/v1)
pnpm dev
```

Check it works:

```bash
curl -s http://localhost:4000/api/v1/health/ready
curl -s -X POST http://localhost:4000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Quelle est la durée légale du travail ?"}'
```

Without an API key, SONAH runs fully offline: embeddings use a local hashing model and answers quote the retrieved articles. To get written answers, set `GEMINI_API_KEY` or `OPENAI_API_KEY` in `.env` (read by the API). Also export the key in your shell and run the seed again, so the texts are re-embedded with that provider's model (the seed script reads only the shell environment).

Quality checks (the same ones CI runs): `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Database integration tests run when `RAG_INTEGRATION=1` is set.

More details: [QUICKSTART.md](./QUICKSTART.md) · Deployment: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) · Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## Responsible AI and limitations

- **Not legal advice.** SONAH gives guidance and points to the text. For anything with real stakes (dismissal, disputes), check with the relevant administration or a legal professional.
- **Versions of texts.** The indexed texts are not consolidated versions. Some articles may have been amended or repealed. Each source carries a version note, and SONAH repeats it when citing.
- **Limited coverage.** Only the texts listed above are indexed. Questions outside the corpus should lead to an abstention, not a guess. Making this systematic is the goal of the citation gate in progress.
- **Language.** The corpus is in French. Answers in English are not yet evaluated.
- **Data retention.** Conversations are anonymous (no account) and stored in PostgreSQL to keep the conversation context. No automatic retention period is enforced yet; one is to be defined. Do not enter personal data.
- **Third-party model providers.** When a Gemini or OpenAI key is set, questions and retrieved extracts are sent to that provider. On the Gemini API free tier, Google's terms allow it to use the content to improve its products. Do not send sensitive information when a free tier is in use. Without a key, nothing leaves the server.
- **No field evaluation yet.** No user study or pilot has been run. Any figure in this repository that is not in the evaluation plan above is not a SONAH result.

## Project structure

```
apps/web            Next.js PWA
apps/api            NestJS API (chat, search, documents, health)
packages/rag        chunking, embeddings, pgvector store, Neo4j graph, ingestion
packages/database   Prisma schema and migrations
data/sources        official texts + manifest
docker/             Dockerfiles (dev and production)
docs/               deployment guide (ITU mapping in progress)
scripts/deploy.sh   VPS deployment with health checks and rollback
```

## Team

Fokam Emeric Cyrille and associate. This is an independent prototype: it is not endorsed by, or affiliated with, any Cameroonian ministry or public body.

Contact: fokamemeric@gmail.com · GitHub [@emeric-cyrille](https://github.com/emeric-cyrille)

## License

[MIT](./LICENSE) © 2026 SONAH contributors

## References

- [ITU AI for Good](https://aiforgood.itu.int/)
- [ITU-T Recommendation Y.3172](https://www.itu.int/rec/T-REC-Y.3172)
- [UN Sustainable Development Goals: targets](https://sdgs.un.org/goals)

---

## Résumé (français)

**SONAH** (_Système d'Orientation Nationale et d'Accompagnement Harmonisé_) est un prototype indépendant d'assistant citoyen. Il répond aux questions sur les démarches administratives et les droits au Cameroun et cite l'article officiel sur lequel repose chaque réponse. Aujourd'hui, la Constitution de 1996 et le Code du travail de 1992 sont indexés article par article (pgvector). Sans modèle de langage disponible, SONAH cite les textes mot pour mot sans rien rédiger lui-même. Pour le hackathon ITU AI for Good, plusieurs éléments sont en cours : un conseiller multi-agents, une vérification déterministe des citations, une piste d'audit chaînée, des scénarios d'erreur, un registre des lacunes réglementaires et un banc d'évaluation. Aucun résultat terrain n'a encore été mesuré. SONAH ne fournit pas d'avis juridique.
