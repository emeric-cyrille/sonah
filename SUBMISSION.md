# SONAH – ITU AI for Good Sandbox Hackathon (UAE 2026) submission

**Team SONAH** · Team leader: Kenmegne Fokam Emeric Cyrille (emeric.kenmegne@facsciences-uy1.cm) · Member:
Chignheng Tchitchi Chirol (chirol.chignheng@facsciences-uy1.cm) · Université de Yaoundé I, Cameroon

**Live application:** https://sonah.fokamemeric.com · **Repository:** https://github.com/emeric-cyrille/sonah

![SONAH home page](docs/guide/img/en/01-home.jpg)

## Deliverables

| Deliverable | Where |
|---|---|
| Technical report (5 pages, official template) | [`report/SONAH-technical-report.docx`](report/SONAH-technical-report.docx) · PDF copy [`report/SONAH-technical-report.pdf`](report/SONAH-technical-report.pdf) · source [`report/technical-report.md`](report/technical-report.md) |
| GitHub repository | this repository (MIT licence) |
| Knowledge base | [`data/sources/`](data/sources/) (26 official sources with URL, version, sha256 and licence), [`data/procedures/`](data/procedures/) (26 verified procedure sheets), datasheet [`data/sources/DATASHEET.md`](data/sources/DATASHEET.md) |
| Demo video (≤ 7 min) | provided separately if shortlisted |
| User guide | [English](docs/guide/USER_GUIDE.md) · [Français](docs/guide/GUIDE_UTILISATEUR.md) |

## Evidence for each judging criterion

| Criterion | Evidence | How to check it |
|---|---|---|
| Knowledge-base quality | 15 Cameroonian texts (FR/EN, with amendment status), 10 African and international AI policy references, 26 procedure sheets, all with official source and verification date | [`DATASHEET.md`](data/sources/DATASHEET.md); `pnpm --filter @sonah/rag kb:report` rebuilds every chunk from the official files and checks their sha256 |
| Agent capability in progressive error scenarios | 6 scenarios released step by step, 6 agents (Sonah, legal adviser, telecom regulator, data-protection authority, business ministry, coordinator) | [Policy Lab](https://sonah.fokamemeric.com/lab); production replay [`eval/scenario-runs/2026-10-29/SUMMARY.md`](eval/scenario-runs/2026-10-29/SUMMARY.md); `node --experimental-strip-types eval/run-scenarios.ts` |
| Policy, strategy and standards gaps | 8 domain-level gaps, each traced to a scenario and paired with verified international examples | [`docs/itu/policy-gap-register.md`](docs/itu/policy-gap-register.md), machine-readable [`policy-gaps.json`](docs/itu/policy-gaps.json) |
| Auditability | Every answer has a trace ID; append-only, hash-chained audit log; traces record retrieval scores, the model that actually answered, the policy rule applied and the verdict | [Audit page](https://sonah.fokamemeric.com/audit) → *Verify chain integrity*; `GET /api/v1/audit/verify` |
| Alignment with ITU-T Y.3172 and the AI Readiness Framework 2.0 | Pipeline built node by node (SRC, C, PP, M, blocking P, D, SINK, MLFO, sandbox); readiness dimensions claimed with code-level evidence | [`docs/itu/y3172-mapping.md`](docs/itu/y3172-mapping.md), [`docs/itu/ai-readiness-mapping.md`](docs/itu/ai-readiness-mapping.md), [`y3172-pipeline.yaml`](docs/itu/y3172-pipeline.yaml) |

## Measured behaviour

From [`eval/results/2026-10-29T05-05-07-199Z.md`](eval/results/2026-10-29T05-05-07-199Z.md) (100-item gold set,
54 FR / 46 EN, policy gate 1.4 as deployed): verdict accuracy 0.91, off-topic refusal 10/10, questions without a
source never answered as if sourced 13/14, retrieval hit@5 0.80, citation validity 0.86, median latency 3.9 s.
Every figure comes with a Wilson 95 % interval in the result file; earlier runs are kept next to it.

## Reproduce

Follow the [Quickstart](README.md#quickstart) to run SONAH locally (PostgreSQL + pgvector, no API key required),
then:

```bash
node --experimental-strip-types eval/run-eval.ts       # 100-question evaluation
node --experimental-strip-types eval/run-scenarios.ts  # six error scenarios + audit chain check
```

Add `--base-url https://sonah.fokamemeric.com/api/v1` to run them against the live application. A Colab notebook
reproduces the pipeline without any API key: [`sandbox/`](sandbox/).
