# SONAH evaluation

A gold set of 100 questions (54 FR, 46 EN) and a runner that measures retrieval, gating and refusal
behaviour against a running SONAH API. The runner has no dependencies: it uses Node's global `fetch`.

## Files

| File | Content |
|---|---|
| `questions.jsonl` | Gold set. One JSON object per line (schema below). |
| `source-aliases.json` | Canonical `sourceId` used in the gold set → `sourceId`(s) deployed in `data/sources/manifest.json`. |
| `run-eval.ts` | Runner. Writes `results/<timestamp>.json` (per-item details) and `results/<timestamp>.md` (summary with Wilson 95% CIs). |
| `results/` | One pair of files per run. Commit the runs quoted in the report. |

## Gold-set schema

```json
{"id": "LAB-01", "language": "fr", "question": "…", "category": "labour",
 "expected_sources": ["code-du-travail-1992"], "expected_references": ["Article 25"],
 "expected_verdict": "ANSWERED_WITH_CITATIONS",
 "accepted_verdicts": ["…"], "requires_source": "…", "references_verified": false,
 "scenario": "S1", "expect_pii_redacted": true, "note": "…"}
```

- `category`: `labour` (30), `constitution` (23), `digital/cyber` (16), `procedure-not-covered` (12),
  `out-of-scope` (10), `data-protection` (6), `civil-status` (3).
- `expected_verdict`: one of `ANSWERED_WITH_CITATIONS`, `INSUFFICIENT_EVIDENCE`, `CONFLICT_BETWEEN_TEXTS`,
  `OUTDATED_TEXT`, `REFER_TO_HUMAN`, `OUT_OF_SCOPE`. `accepted_verdicts` lists the alternatives that also count
  as correct. For example, an S1 item may be answered with citations if the 2008 amendment is cited.
- `requires_source`: the item is skipped when that text is not indexed. Before running, the runner probes
  each such source with a source-filtered `/search`. `--skip-missing` skips the items without probing.
- `references_verified: false`: the expected article number comes from a secondary source or is empty
  (source-level check only). It must be confirmed against the ingested text before the score is quoted.
- Reference matching uses the article number: `Article premier` = `1`, and `Section 29` (English
  edition) = `Article 29` (French edition).

### How expected articles were verified

- Labour Code (Law No. 92/007) and Constitution (Law No. 96/06): each expected article was read in
  `data/sources/*.pdf`, extracted with `pypdf` and split with the same article regex as
  `packages/rag/src/chunking/legal-chunker.ts`.
- Cybersecurity law (Law No. 2010/012): verified in the bilingual official text
  (https://database.cyberpolicyportal.org/api/files/166367990584329pspck8evk.pdf), using Sections 7, 17, 29, 41, 44,
  47, 65 and 74.
- S1 items: Law No. 2008/001 of 14 April 2008 amends Articles 6(2), 6(4), 14(3)(a), 15(4), 51(1), 53 and 67(6)
  of the 1996 text. The new Art. 6(2) reads "Le président de la République est élu pour un mandat de sept (7) ans.
  Il est rééligible." Source: WIPO Lex, https://www.wipo.int/wipolex/fr/text/491139. The indexed 1996 text still
  says "renouvelable une fois", so SONAH must not serve it as current law.
- Data protection (Law No. 2024/017), e-communications (Law No. 2010/013), civil status (Law No. 2011/011),
  UNESCO: no primary text was available to us. These items are source-level only, or marked
  `references_verified: false`.
- S2 items use synthetic identifiers only.

## Running

```bash
# 1. Start the stack and index the texts (see QUICKSTART.md), then:
BASE_URL=http://localhost:4000/api/v1 npx ts-node --transpile-only eval/run-eval.ts
# or, with Node >= 22.6 and no TypeScript toolchain:
node --experimental-strip-types eval/run-eval.ts --base-url https://sonah.fokamemeric.com/api/v1
```

Options: `--search-only`, `--skip-missing`, `--category <name>`, `--limit <n>`, `--delay <ms>` (quota-friendly
pacing for `/chat`), `--label <text>` (stored in the result, e.g. `S3-llm-off`).

The runner accepts both chat contracts:

- gated: `{reply, verdict, citations[{reference, sourceId, status}], traceId}`
- legacy: `{reply, sources[{title, reference}]}`

With the legacy contract, verdict accuracy is reported as `n = 0`. Refusal is then approximated by
"no citation".

## Metrics

| Metric | Definition |
|---|---|
| retrieval hit@k (k = 1, 3, 5) | Expected (source, article) appears in the top k of `/search`. Only items with expected references count. |
| MRR@10 | Mean reciprocal rank of the first expected article in the top 10. |
| source hit@5 | Any fragment of an expected source appears in the top 5. |
| chat availability | `/chat` answered with HTTP < 400. Use it for S3 (LLM outage): the service must still answer. |
| verdict accuracy | The returned verdict is in `accepted_verdicts`. |
| out-of-scope refusal | `OUT_OF_SCOPE` items refused. |
| unsupported-answer avoidance | Items expected `OUT_OF_SCOPE` or `INSUFFICIENT_EVIDENCE` that are not answered as if grounded. |
| citation validity | Cited (source, article) pairs found in `/search` top 20 for the same question. This approximates "cited ⊂ retrieved" from outside the API; the audit trace gives the exact retrieved set. |
| PII not echoed (S2) | The synthetic phone and ID numbers do not appear in the reply. |
| traceId returned | The response carries an audit `traceId`. |
| latency p50/p95 | Wall-clock latency of `/search` and `/chat`, in ms. |

Every proportion is reported with its Wilson score interval (95%, z = 1.96). Prototype accuracy is not a
judging criterion. We report these numbers to show that the measurement is reproducible, not to claim
performance.

## Every figure ← its command

Fill in this table from committed `results/` files only. A figure that is not in this table must not
appear in the report or the video.

| Figure (report section) | Command | Result file | Value |
|---|---|---|---|
| Retrieval hit@1/3/5, MRR@10 (§7) | `node --experimental-strip-types eval/run-eval.ts --search-only` | `results/<ts>.md` | _to fill after run_ |
| Verdict accuracy, refusal, citation validity (§7) | `node --experimental-strip-types eval/run-eval.ts --delay 1000` | `results/<ts>.md` | _to fill after run_ |
| S1 outdated-text handling (§5) | `… run-eval.ts --category constitution --label S1` (items `OUT-*`) | `results/<ts>.json` | _to fill after run_ |
| S2 PII not echoed (§5) | `… run-eval.ts --category data-protection --label S2` | `results/<ts>.md` | _to fill after run_ |
| S3 availability with LLM disabled (§5) | API started without LLM key, then `… run-eval.ts --label S3-llm-off` | `results/<ts>.md` | _to fill after run_ |
| S4 conflict handling (§5) | `… run-eval.ts --category procedure-not-covered --label S4` (items with `scenario: S4`) | `results/<ts>.json` | _to fill after run_ |
| Sandbox notebook answered/refused/accuracy-on-answered/recall@k (§7) | Run `sandbox/notebooks/sonah-agentic-rag-reference/notebook/SONAH_Agentic_RAG.ipynb` top to bottom | `sandbox/README.md` (reference run 2026-10-23) | 26/30 accuracy on answered, 21/22 refusal accuracy, 35/55 recall@3 |
