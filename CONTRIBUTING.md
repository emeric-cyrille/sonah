# Contributing to SONAH

Thank you for helping. SONAH gives people guidance on official texts, so **accuracy and traceability come before
features**. Never add a fact, figure, legal reference or affiliation that you cannot source.

## Setup

Follow [QUICKSTART.md](./QUICKSTART.md): install, start PostgreSQL (and optionally Neo4j), build, migrate, seed,
`pnpm dev`.

## Workflow

1. Branch from an up-to-date `main`: `feat/…`, `fix/…`, `docs/…`, `refactor/…`, `test/…`, `chore/…`, `ci/…`.
2. Make focused changes and add or update tests.
3. Run the same checks as CI before pushing:

   ```bash
   pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```

   Integration tests against real databases run with `RAG_INTEGRATION=1` (with `DATABASE_URL` and, optionally,
   `NEO4J_URI` set). CI always runs them.

4. Open a pull request. CI must be green. Merging to `main` deploys to production automatically (see
   [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)).

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description in the imperative (max 72 characters)

Optional body explaining why.
```

- **Types:** `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `ci`
- **Scopes:** `web`, `api`, `rag`, `database`, `deploy`, `deps`, `docs`, `data`
- No tool or assistant attribution in commits (no "Co-Authored-By" trailers).

Examples:

```
feat(rag): keep chapter headings in article chunk metadata
fix(api): fall back to cited articles when the language model fails
docs: document the Gemini key sync
```

## Code standards

- **TypeScript strict**, no `any` (use `unknown` and narrow). Explicit return types on exported functions.
- **Validate inputs with Zod** at every boundary (HTTP bodies, environment variables, files such as
  `data/sources/manifest.json`).
- **Errors:** never swallow them. Log with the NestJS `Logger` and return a meaningful HTTP status. When a dependency
  fails, degrade to the extractive answer (cited articles) instead of returning an unsupported answer.
- **Naming:** files `kebab-case.ts`, classes and types `PascalCase`, functions and variables `camelCase`, constants
  `UPPER_SNAKE_CASE`.
- **Comments** in French (existing style). User-facing documentation for reviewers is in English.
- **Secrets:** never commit `.env` files or keys. Add every new variable to `.env.example` (and
  `.env.production.example` if production needs it), and to `apps/api/src/config/env.ts` if the API reads it.
- **Dependencies:** add a dependency only when it is imported. Remove dependencies that nothing uses anymore.

## Adding an official text

1. Put the PDF in `data/sources/` and declare it in `data/sources/manifest.json`: title, type, **official source
   URL**, a **version note** (is it consolidated? known amendments?) and noise patterns.
2. Run `pnpm --filter @sonah/rag seed` and check the article count it reports.
3. Update the knowledge base table in [README.md](./README.md).

## Reviews

Reviewers check correctness, typing, error handling and tests. For anything the user sees, they also check that the
answer is grounded in a cited text and that limitations are stated.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
