# SONAH

**A citizen assistant that answers questions about Cameroonian administrative procedures and rights, and cites the official text behind every answer.**

SONAH stands for _Système d'Orientation Nationale et d'Accompagnement Harmonisé_ (National System for Harmonised Guidance and Support). The prototype is being built for the ITU AI for Good Lab Hackathon (UAE, 2026).

[![CI](https://github.com/emeric-cyrille/sonah/actions/workflows/ci.yml/badge.svg)](https://github.com/emeric-cyrille/sonah/actions/workflows/ci.yml)
[![Deploy](https://github.com/emeric-cyrille/sonah/actions/workflows/deploy.yml/badge.svg)](https://github.com/emeric-cyrille/sonah/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**Live demo:** https://sonah.fokamemeric.com · **Hackathon submission:** [SUBMISSION.md](SUBMISSION.md) · **User guide:** [English](docs/guide/USER_GUIDE.md) · [Français](docs/guide/GUIDE_UTILISATEUR.md)

![SONAH: a sourced answer and its audit trace](report/figures/answer.jpg)

> SONAH is an independent prototype. It is not an official government service, and its answers give guidance only. They are not legal advice.

---

## The problem

Cameroon is officially bilingual (French and English). Its laws, codes and procedures are published in many places, some of them out of date or not consolidated. To find which rule applies (how long a working week may last, what the Constitution guarantees, which office handles a procedure), people often rely on informal intermediaries or on hearsay. The information is public, but it is hard for most people to find, read and trust.

## The solution

SONAH is a conversational assistant (a web app that can be installed on a phone) that:

1. **retrieves** the relevant articles from an indexed corpus of official texts, split article by article, or the matching structured procedure sheet;
2. **answers** in plain language with numbered citations to those articles, the source URL, and a note when the cited text has been amended or repealed;
3. **checks every answer** with a deterministic policy gate before it reaches the user: each citation must point to a retrieved extract, each quotation must be verbatim, and each answer gets a typed verdict;
4. **degrades safely**: when no language model is available, or when every model in the chain fails, SONAH does not write an answer of its own. It returns the most relevant articles word for word, so the user never gets an unsupported answer;
5. **keeps an audit trail**: every answer is recorded in a hash-chained, append-only log that anyone can verify.

## Alignment with the Sustainable Development Goals

These are the SDG targets the project is designed to support. They are **not** impact claims: nothing has been measured in the field yet.

| SDG target | How SONAH aligns                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| **16.6**   | Effective, accountable and transparent institutions: traceable answers grounded in official texts               |
| **16.10**  | Public access to information: plain-language access to the Constitution and the codes                           |
| **10.2**   | Inclusion: a free channel that does not depend on paid intermediaries                                           |
| **8.3**    | Entrepreneurship and formalisation: guidance on administrative procedures (business creation, CNPS, NIU sheets) |

---

## Architecture today

What is implemented and deployed on `main`:

```
 Browser / PWA (Next.js 14): chat, procedures, audit viewer, scenario lab
        │  /api/v1  (same domain, Traefik)
        ▼
 NestJS API ── chat: PII masking → small talk / intent routing → retrieval or procedure sheet
        │            → language model chain (Gemini → Groq gpt-oss-120b → Groq qwen; optional)
        │            → policy gate (typed verdict) → answer + citations + traceId
        │            no model, or every model fails: extractive answer (quotes retrieved articles only)
        ├── search / documents / agents / scenarios / audit
        ▼
 @sonah/rag ── PostgreSQL + pgvector (article-level chunks, local multilingual embeddings,
            │                       full-text search for explicit article references)
            ├─ PostgreSQL audit traces (hash-chained, append-only)
            └─ Neo4j (optional; disabled in production, not used to answer)
```

| Component           | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`          | Next.js 14 PWA (App Router, Tailwind, Zustand): home, chat, procedures (`/demarches`), audit trail viewer (`/audit`), error-scenario lab (`/lab`), about                                                                                                                                                                                                                                                                                                                                                |
| `apps/api`          | NestJS API: `POST /api/v1/chat`, `POST /api/v1/search`, documents endpoints (admin token), `GET /api/v1/agents`, scenario runs (`/api/v1/scenarios`), audit (`GET /api/v1/audit/traces/:id`, `GET /api/v1/audit/verify`), `GET /api/v1/health` and `/health/ready` (database, graph, model chain, number of indexed documents). Policy gate, procedure gate, PII masking and intent routing in `apps/api/src/policy/`; agents and coordinator in `apps/api/src/agents/`; audit in `apps/api/src/audit/` |
| `packages/rag`      | Legal article chunker (titles, chapters, articles; noise removal), embeddings (local `Xenova/multilingual-e5-small` by default; Gemini, OpenAI or an offline hashing embedder selectable), pgvector store with full-text search for explicit references, procedure-sheet loader and matcher, Neo4j graph service (optional), idempotent ingestion                                                                                                                                                       |
| `packages/database` | Prisma schema and migrations (pgvector extension, full-text search, anonymous conversations, article-level documents, append-only audit traces, scenario runs)                                                                                                                                                                                                                                                                                                                                          |
| `data/sources`      | Official source documents and `manifest.json` (title, URL, version note and the text it amends, for each text)                                                                                                                                                                                                                                                                                                                                                                                          |
| `data/procedures`   | 26 structured procedure sheets and their JSON schema                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CI/CD               | GitHub Actions: format, lint, typecheck, tests against real PostgreSQL and Neo4j, build, Docker images on GHCR, SSH deployment with health checks, automatic rollback and HTTPS smoke tests                                                                                                                                                                                                                                                                                                             |

Input is validated with Zod at the API boundary. Environment variables are validated at startup.

## Built for the hackathon

These items are implemented and deployed, unless marked otherwise.

- **Deterministic policy gate** ([`apps/api/src/policy/policy-gate.ts`](./apps/api/src/policy/policy-gate.ts)). Every citation must point to a retrieved extract and every quotation must be verbatim; a failing draft is replaced by the extractive answer. Typed verdicts: `ANSWERED_WITH_CITATIONS`, `INSUFFICIENT_EVIDENCE`, `CONFLICT_BETWEEN_TEXTS`, `OUTDATED_TEXT`, `REFER_TO_HUMAN`, `OUT_OF_SCOPE`, and `CONVERSATION` for small talk. A procedure gate ([`procedure-gate.ts`](./apps/api/src/policy/procedure-gate.ts)) rejects any number or document that is not in the procedure sheet.
- **PII masking** ([`apps/api/src/policy/pii.ts`](./apps/api/src/policy/pii.ts)). E-mail addresses, phone numbers and identity numbers are masked before storage or any model call.
- **Agents and coordinator** ([`apps/api/src/agents/`](./apps/api/src/agents/)). Six agents: the citizen assistant `sonah`, a legal adviser, three simulated authorities (telecom regulator, data protection authority, business ministry) and a deterministic coordinator that routes events, detects contradictions and escalates to a human.
- **Hash-chained audit trail** ([`apps/api/src/audit/`](./apps/api/src/audit/)). One trace per answer, with retrieval scores, gate checks, verdict and model. A database trigger refuses updates and deletes. `GET /api/v1/audit/verify` checks the chain.
- **Progressive error scenarios** ([`apps/api/src/scenarios/scenario-definitions.ts`](./apps/api/src/scenarios/scenario-definitions.ts)). Released step by step through the API and the `/lab` page: outdated law, personal data in chat, LLM outage, conflicting requirements. Two later-stage scenarios (reuse of chat logs, language equity) and the one-command replay [`eval/run-scenarios.ts`](./eval/run-scenarios.ts) are on branch `feat/submission-prep`, pending deploy.
- **Policy and standards gap register** → [`docs/itu/policy-gap-register.md`](./docs/itu/policy-gap-register.md)
- **Evaluation harness**: 100 FR/EN gold questions, retrieval, verdict and citation metrics with Wilson intervals → [`eval/`](./eval/)
- **Mapping to ITU-T Y.3172** (architectural framework for machine learning in future networks) **and to the ITU AI Readiness Framework** → [`docs/itu/`](./docs/itu/)
- **Sandbox notebook and agent** in the ITU sandbox format → [`sandbox/`](./sandbox/)
- **Hackathon report** → [`report/`](./report/)

Not implemented (future work): WhatsApp or SMS channel, monitoring of new regulations, letter or form templates, answers in national languages, and use of the Neo4j graph in production.

---

## Knowledge base

The manifest [`data/sources/manifest.json`](./data/sources/manifest.json) lists 20 sources. Each entry has its official URL and a version note.

| Group                               | Texts                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Constitution                        | Law No. 96-06 of 18 Jan 1996 (FR and EN), amended by Law No. 2008/001 of 14 Apr 2008 (FR and EN) and Law No. 2026/002 of 14 Apr 2026 (FR and EN)                                            |
| Labour                              | Labour Code, Law No. 92-007 of 14 Aug 1992 (FR and EN)                                                                                                                                      |
| Digital and data                    | Law No. 2010/012 (cybersecurity), Law No. 2010/013 and Law No. 2015/006 (electronic communications), Law No. 2024/017 (personal data protection)                                            |
| Civil status and business           | Law No. 2024/016 (civil status registration), Decree No. 2017/0877/PM (CFCE one-stop shop)                                                                                                  |
| Policy and international references | _Cameroun numérique 2020_ plan, AU Continental AI Strategy (2024), UNESCO Recommendation on the Ethics of AI (2021), OECD AI Recommendation, EU AI Act (Regulation 2024/1689), ITU-T Y.3172 |

In addition, [`data/procedures/`](./data/procedures/) holds 26 structured procedure sheets (civil status, identity card, passport, driving licence, business creation, CNPS, NIU, etc.). On 2026-10-29 the live index reported 1,717 indexed documents (`GET /api/v1/health/ready`). To add a text, see [`data/sources/README.md`](./data/sources/README.md).

## Evaluation

There are no field results yet. The figures below come from the gold-set runner (`eval/run-eval.ts`) on a local API with `gemini-3.1-flash-lite`, run `eval/results/2026-10-29T01-47-53-637Z` (100 items, 97 run). Sample sizes are small; see the Wilson 95% intervals in the results file.

| Target                                                      | Result                                                 | How it is measured                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Correct article retrieved                                   | hit@1 0.643 (45/70), hit@5 0.843 (59/70), MRR@10 0.735 | Expected article references in the gold set                               |
| Correct typed verdict                                       | 0.866 (84/97)                                          | Returned verdict in the accepted verdicts of each item                    |
| Citations point to real, retrieved articles                 | 0.915 (140/153)                                        | Cited (source, article) present in `/search` top 20 for the same question |
| Refuses out-of-scope questions                              | 10/10                                                  | `OUT_OF_SCOPE` verdict                                                    |
| Abstains instead of answering as if grounded                | 0.556 (10/18)                                          | Items expected `OUT_OF_SCOPE` or `INSUFFICIENT_EVIDENCE`                  |
| Service answers and returns a `traceId`                     | 97/97                                                  | HTTP status and `traceId` of `POST /api/v1/chat`                          |
| Safe behaviour in each error scenario                       | recorded runs, no pass rate yet                        | `eval/scenario-runs/2026-10-23/` (four scenarios)                         |
| Every answer has a verifiable audit record                  | checked per run                                        | `GET /api/v1/audit/verify`                                                |
| Service stays up and cites sources without a language model | checked on deploy                                      | Deploy smoke test: `POST /api/v1/chat` returns HTTP 200 with a reply      |

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

Without an API key, SONAH needs no external model service: embeddings use the local `Xenova/multilingual-e5-small` model (downloaded once from Hugging Face) and answers quote the retrieved articles. To get written answers, set `GEMINI_API_KEY` and/or `GROQ_API_KEY` (or `OPENAI_API_KEY`) in `.env`; `LLM_PROVIDER` forces the provider. With `LLM_PROVIDER=gemini` and a Groq key, the Groq models act as fallbacks; without `LLM_PROVIDER`, Groq is preferred when its key is set. Embeddings stay local unless `EMBEDDING_PROVIDER` says otherwise.

Quality checks (the same ones CI runs): `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Database integration tests run when `RAG_INTEGRATION=1` is set.

More details: [QUICKSTART.md](./QUICKSTART.md) · Deployment: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) · Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## Responsible AI and limitations

- **Not legal advice.** SONAH gives guidance and points to the text. For anything with real stakes (dismissal, disputes), check with the relevant administration or a legal professional.
- **Versions of texts.** The indexed texts are not consolidated versions. Some articles may have been amended or repealed. Each source carries a version note, and SONAH repeats it when citing.
- **Limited coverage.** Only the texts and procedure sheets listed above are indexed. The policy gate returns `OUT_OF_SCOPE` or `INSUFFICIENT_EVIDENCE` when it has no evidence, but it is not perfect: in the latest gold-set run, 8 of 18 items expected to abstain were still answered as if grounded.
- **Language.** Most texts are in French; the Constitution, its amendments and the Labour Code are also indexed in English. English questions are part of the gold set (46 of 100 items). The 26 procedure sheets are in French only (with English titles and keywords).
- **Data retention.** Conversations are anonymous (no account) and stored in PostgreSQL, after PII masking, to keep the conversation context. No automatic retention period is enforced yet; one is to be defined. Audit traces are append-only. Do not enter personal data.
- **Third-party model providers.** When a Gemini, Groq or OpenAI key is set, masked questions and retrieved extracts are sent to that provider. On free tiers, provider terms may allow the content to be used to improve their products. Do not send sensitive information when a free tier is in use. Embeddings are computed on the server. Without a model key, nothing leaves the server.
- **No field evaluation yet.** No user study or pilot has been run. Any figure in this repository that is not in the evaluation plan above is not a SONAH result.

## Project structure

```
apps/web            Next.js PWA
apps/api            NestJS API (chat, search, documents, policy, agents, scenarios, audit, health)
packages/rag        chunking, embeddings, pgvector store, procedures, Neo4j graph, ingestion
packages/database   Prisma schema and migrations
data/sources        official texts + manifest
data/procedures     structured procedure sheets + JSON schema
eval/               gold set, evaluation and scenario runners, results
sandbox/            ITU sandbox-format notebook and agent
docker/             Dockerfiles (dev and production)
docs/               deployment guide, ITU mappings and policy gap register (docs/itu/)
scripts/deploy.sh   VPS deployment with health checks and rollback
```

## Team

Kenmegne Fokam Emeric Cyrille (team leader) and Chignheng Tchitchi Chirol, Université de Yaoundé I. This is an independent prototype: it is not endorsed by, or affiliated with, any Cameroonian ministry or public body.

Contact: fokamemeric@gmail.com · GitHub [@emeric-cyrille](https://github.com/emeric-cyrille)

## License

[MIT](./LICENSE) © 2026 SONAH contributors

## References

- [ITU AI for Good](https://aiforgood.itu.int/)
- [ITU-T Recommendation Y.3172](https://www.itu.int/rec/T-REC-Y.3172)
- [UN Sustainable Development Goals: targets](https://sdgs.un.org/goals)

---

## Résumé (français)

**SONAH** (_Système d'Orientation Nationale et d'Accompagnement Harmonisé_) est un prototype indépendant d'assistant citoyen. Il répond aux questions sur les démarches administratives et les droits au Cameroun et cite l'article officiel sur lequel repose chaque réponse. Vingt textes (Constitution et ses révisions, Code du travail, lois sur le numérique, les données personnelles et l'état civil, références internationales sur l'IA) sont indexés article par article (pgvector), ainsi que 26 fiches de démarches. Chaque réponse passe par un nœud de politique déterministe (citations vérifiées, verdict typé) et laisse une trace d'audit chaînée. Sans modèle de langage disponible, SONAH cite les textes mot pour mot sans rien rédiger lui-même. Pour le hackathon ITU AI for Good, SONAH comprend aussi des agents coordonnés, des scénarios d'erreur progressifs, un registre des lacunes réglementaires et un banc d'évaluation. Aucun résultat terrain n'a encore été mesuré. SONAH ne fournit pas d'avis juridique.
