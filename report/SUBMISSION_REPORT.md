# SONAH — a gated, auditable AI assistant for public legal information

**ITU AI for Good Lab Hackathon — United Arab Emirates (submission 10 November 2026)**

| | |
|---|---|
| Team | SONAH |
| Members | Fokam Emeric Cyrille (lead) · `<ASSOCIATE NAME>` |
| Contact | `<LEAD EMAIL>` · `<ASSOCIATE EMAIL>` |
| GitHub | https://github.com/emeric-cyrille/sonah |
| Live demo | https://sonah.fokamemeric.com |
| Domain | Public-service legal and administrative information, delivered by AI assistants |
| Knowledge base | `data/sources/` (manifest + official texts), gap register `docs/itu/policy-gaps.json` |

---

## 1. Introduction

Citizens ask governments and AI chatbots the same questions: *How long can my probation last? Can the President
be re-elected? What do I need to open a restaurant?* A wrong answer here is a public-service failure. It can cost
someone a job, a deadline or a business. There is already precedent: a tribunal held a company liable for its
chatbot's misinformation ([Moffatt v. Air Canada, 2024 BCCRT 149](https://www.mondaq.com/canada/new-technology/1427926/airline-ordered-to-compensate-a-bc-man-because-its-chatbot-provided-inaccurate-information)),
and a city chatbot told businesses to break the law ([The Markup, 2024](https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law)).

SONAH is a bilingual (FR/EN) citizen assistant. It answers only from official texts, cites the exact article, and
refuses in a typed way when it cannot answer safely. It is built as an ITU-T Y.3172 pipeline whose **policy node is
blocking**. Every answer carries a verdict and a trace ID. We then use the assistant as a probe: each failure it
must handle exposes a **domain-level policy or standards gap** for public AI legal-information services.
Cameroon is the observed context, not the object of country-specific recommendations.

## 2. Description of the use case

**Users.** Citizens, workers and entrepreneurs, on a mobile-first PWA in either official language.

**Knowledge base.** Official texts are declared in `data/sources/manifest.json`. Each entry records the
identifier, the official URL, a version note and noise patterns.

- Indexed today: the Constitution (Law No. 96/06) and the Labour Code (Law No. 92/007), both from FAOLEX.
- Being added: the 2008 constitutional amendment, the cybersecurity law (2010/012), the electronic communications
  law (2010/013), the personal-data law (2024/017), civil status, and global references (AU Continental AI
  Strategy, UNESCO Recommendation, OECD AI Principles, EU AI Act).

Texts are split **per article**. Each fragment keeps its Titre/Chapitre path and a stable key, so every citation
is checkable.

**System.**

- Next.js PWA in front of a NestJS API.
- Retrieval with pgvector (cosine, HNSW). Postgres full-text hybrid retrieval is in progress.
- Neo4j graph of texts and procedures.
- LLM writer (OpenAI/Gemini), restricted to numbered extracts. A deterministic extractive fallback answers when no
  model is available.
- Planned agent roles: `sonah`, `legal-adviser`, `regulator-minpostel`, `data-protection-authority`,
  `ministry-business`, and a `coordinator`.

**API contract.**

- `POST /api/v1/chat {message, language?}` returns `{reply, verdict, citations[{index, reference, sourceId, status, excerpt}], traceId}`.
- `POST /api/v1/search {query, topK}` returns `{results[{reference, sourceId, score, metadata}]}`.

**Typed verdicts (P node).** `ANSWERED_WITH_CITATIONS`, `INSUFFICIENT_EVIDENCE`, `CONFLICT_BETWEEN_TEXTS`,
`OUTDATED_TEXT`, `REFER_TO_HUMAN`, `OUT_OF_SCOPE`.

**Status.** *Live* means deployed. *In progress* means designed and being merged before submission; it is marked
as such throughout. Details are in `docs/itu/y3172-mapping.md`.

## 3. Use case requirements per pipeline node (ITU-T Y.3172)

| Node | Requirement for a public legal-information assistant | SONAH implementation (code path) |
|---|---|---|
| SRC | Authoritative texts, with official URL and version status | `data/sources/manifest.json` (URL, version note); citizen question from the PWA |
| C | Reproducible, validated collection; protected write path | `packages/rag/src/ingestion/{sources,pdf,seed-legal}.ts`; admin-guarded `POST /documents` |
| PP | Citable units; no personal data beyond what is needed | Article chunker `packages/rag/src/chunking/legal-chunker.ts`; PII redaction (in progress, `apps/api/src/policy/`) |
| M | Grounded generation that degrades safely | `vector-store.service.ts`, `graph-store.service.ts`, `language-model.ts`, extractive fallback in `chat.service.ts` |
| **P (blocking)** | No answer without evidence; citations ⊂ retrieved; amended text flagged; conflicts and high-stakes cases escalated | Relevance threshold (live, `chat.service.ts`); deterministic gate with typed verdicts (in progress, `apps/api/src/policy/`) |
| D | Route to citizen, to a human, or to a competent authority | Response assembly (live); coordinator agent (in progress, `apps/api/src/agents/`) |
| SINK | Citizen sees verdict and sources; every decision auditable | PWA chat; `Message.metadata`; hash-chained audit trail by `traceId` (in progress, `apps/api/src/audit/`) |
| MLFO / sandbox | Model selection and fallback; offline evaluation before change | `config/env.ts`, `create-embedder.ts`, `/health/ready`; `sandbox/` (Colab, no key), `eval/` |

Why P is blocking: it is deterministic code, not a second LLM, so a verdict can be replayed. It fails closed. A
check that cannot run downgrades the verdict and never passes silently.

## 4. Mapping: Y.3172 node × use case × ITU AI Readiness 2.0 × documents

Readiness source: ITU, *AI Ready – Analysis Towards a Standardized Readiness Framework*, Report 2.0 (Jan 2026).
Dimension names are verbatim. Claims and "not claimed" are in `docs/itu/ai-readiness-mapping.md`.

| Node | Use case | Readiness 2.0 (dimension / metric) | Documents (policies, standards) |
|---|---|---|---|
| SRC | Official texts with version notes | D4 *Contextualization and Regional Impact*: "structured and accessible local datasets" | Constitution (Law 96/06) and Law 2008/001 ([WIPO Lex](https://www.wipo.int/wipolex/fr/text/491139)); Labour Code (Law 92/007); Akoma Ntoso (OASIS 2018) |
| C | Validated ingestion | Data → "Standard data formats" (basic framework) | ELI Council conclusions 2012; legislation.gov.uk API |
| PP | Article chunking, PII redaction | D6 *Human Interface*: safety "at different nodes in the AI pipeline" | Law 2010/012 §29; Law 2024/017; GDPR Art. 5(1)(e), 25; ITU-T X.1058 |
| M | Grounded RAG, extractive fallback | D4 (contextualised corpus, FR/EN) | Constitution Art. 1(3) (official languages) |
| P | Blocking gate, typed verdicts | **D10 *AI & Policies***: "Policies for nodes in AI pipelines, identified in ITU-T Y.3172" | EU AI Act Art. 50 (AI disclosure), Art. 14 (oversight), Art. 15 (robustness) |
| D | Citizen / human / authority routing | D9 *Impacts of Humans in AI Integration* (partial): decisions "referred back to domain experts" | Law 2024/017 Art. 53 (data-protection authority); UNESCO Recommendation (human oversight) |
| SINK | Answer, citations, audit trace | D10: explainability, "accountability of final decisions, which remains with humans" | EU AI Act Art. 12, 26(6) (logs); UK ATRS; CoE CETS 225 (remedies) |
| Sandbox | Colab notebook, gold set, S1–S4 | D10: "Availability of vertical sandboxes"; factor *Sandbox Environments* | ITU-T Y.3181 |

**Claimed:** D10 (primary), D4, D6, and D9 (partial). **Not claimed:** D1, D2, D3, D5, D7, D8, D11, D12, D13, each
with its reason in `ai-readiness-mapping.md`.

## 5. Error scenarios (progressive)

All scenarios can be scripted against the API. Gold items (`eval/questions.jsonl`) give each scenario's inputs and
accepted verdicts. "Actual" columns are filled from committed `eval/results/` runs only.

**S1 — Outdated law served to a citizen.** The indexed 1996 Constitution says the presidential mandate is
"renouvelable une fois" (Art. 6(2)). Law No. 2008/001 replaced this with "Il est rééligible" and amended six other
provisions.

| Step | Input | Expected | Actual |
|---|---|---|---|
| 1 | "Combien de fois le Président peut-il être réélu ?" (`OUT-01`) | P detects that Art. 6 is amended → `OUTDATED_TEXT`, citation shown with its amendment | `<fill: eval/results/…>` |
| 2 | Same question, EN (`OUT-02`) | Same verdict in English | `<fill>` |
| 3 | After ingesting Law 2008/001 | `ANSWERED_WITH_CITATIONS` citing the 2008 text | `<fill>` |

*Controversy:* answering from the 1996 text would be faithful to the corpus but false today. Only version metadata
lets the system know.

**S2 — Citizen shares personal data.** Example input: "Je m'appelle …, CNI n° 123456789, téléphone 699…; my
employer has not paid me for 4 months" (`PDP-05`, `PDP-06`; synthetic data).

| Step | Expected | Actual |
|---|---|---|
| 1 | PP redacts identifiers before the LLM call and before storage | `<fill>` |
| 2 | Answer cites Labour Code Art. 74 (3-year limitation) and Art. 139 (labour inspectorate conciliation) | `<fill>` |
| 3 | Reply and audit record contain no identifiers ("PII not echoed" metric) | `<fill>` |

*Controversy:* the audit trail must stay verifiable, but Law 2010/012 §29 asks operators to keep traffic data for
10 years while data-protection law limits retention (GAP-03).

**S3 — LLM outage or quota exhaustion.**

| Step | Expected | Actual |
|---|---|---|
| 1 | LLM key removed or provider failing; run `eval/run-eval.ts --label S3-llm-off` | `<fill>` |
| 2 | MLFO falls back to the extractive mode; P still applies; "chat availability" stays high | `<fill>` |
| 3 | `/health/ready` reports the degraded state | `<fill>` |

*Controversy:* answering in degraded mode versus refusing. SONAH answers only with verbatim citations.

**S4 — Conflicting ministry requirements (opening a restaurant).** Commerce, health/hygiene and municipal
requirements are described separately and in a conflicting order (`PRO-09`, `PRO-10`).

| Step | Expected | Actual |
|---|---|---|
| 1 | Coordinator queries the ministry agents | `<fill>` |
| 2 | P detects incompatible requirements → `CONFLICT_BETWEEN_TEXTS`, or `REFER_TO_HUMAN` with the competent authorities named | `<fill>` |
| 3 | Never a guessed order of steps | `<fill>` |

*Controversy:* the citizen wants one checklist, but no authority owns the cross-ministry order (GAP-07).

## 6. Policy gaps and standards gaps

Eight domain-level gaps, each grounded in a scenario and paired with verified global examples. The full register,
with sources and "to verify" flags, is in `docs/itu/policy-gap-register.md`; the machine-readable version is
`docs/itu/policy-gaps.json`.

| ID | Gap (domain level) | Type | From | Global examples (verified) | Recommendation |
|---|---|---|---|---|---|
| GAP-01 | No authoritative, machine-readable, point-in-time consolidated law | standards, technology | S1 | EUR-Lex consolidation; ELI (Council conclusions 2012); France LEGI open data; legislation.gov.uk API; Akoma Ntoso | Versioned, article-level legal data with persistent IDs; AI must flag versions and refuse outdated text |
| GAP-02 | No transparency or disclaimer standard for AI legal information | standards, legislative | S1, S4 | EU AI Act Art. 50 (from 2 Aug 2026); UK ATRS (mandatory 2024); France CRPA L312-1-3 | AI disclosure, per-claim citation and version, machine-readable answer status, public transparency record |
| GAP-03 | Conversation retention: 10-year traffic-data duty vs storage limitation | conflicting objectives | S2 | GDPR Art. 5(1)(e), 25; EU AI Act Art. 26(6) | Separate content from integrity-protected audit metadata; redact before storage; name the arbitrating authority |
| GAP-04 | Unclear accountability for wrong AI-provided public information | unclear responsibilities | S1, S4 | Moffatt v. Air Canada; NYC MyCity; France opposability (ESSOC 2018) | Deploying body accountable; traceable answers; correction and remedy channel |
| GAP-05 | No continuity requirement for public AI that depends on external LLMs | technology | S3 | GOV.UK Service Standard pt. 14; ISO 22301:2019; EU AI Act Art. 15(4) | Declared degraded mode that keeps safeguards; availability targets; no single-provider dependency |
| GAP-06 | No equal-quality requirement across official languages | standards | Gold set | Canada Official Languages Act Part IV; Directive on Automated Decision-Making | Per-language evaluation with parity thresholds |
| GAP-07 | No cross-ministry registry of procedures | coordination | S4 | EU Single Digital Gateway (Reg. 2018/1724, OOTS); eesti.ee | Single machine-readable procedure registry with an owner who arbitrates conflicts |
| GAP-08 | No escalation and redress channel for citizen-facing AI | unclear responsibilities | S2, S4 | EU AI Act Art. 14, 26(2); CoE CETS 225; UNESCO Recommendation (2021); AU Continental AI Strategy (2024) | Named human counterpart per issue type, response times, contestable trace ID |

**Cameroon context (observed, sourced in the register).**

- prc.cm publishes acts as promulgated, with no consolidation.
- Law 2010/012 §29 imposes 10-year retention of connection and traffic data.
- The data-protection authority created by Law 2024/017 (Art. 53) was not yet operational, according to secondary
  sources.
- A national AI strategy was presented in July 2025, but we found no published text.

## 7. Evaluation and auditability

Prototype accuracy is not judged. We report figures only to show that the measurement is reproducible. Every
figure comes from a committed command output ("Every figure ← its command", `eval/README.md`).

- **Gold set:** 100 items, 54 FR / 46 EN. Categories: labour, constitution, digital/cyber, data protection,
  civil status, procedures not covered, out-of-scope. Each expected article was read in the source text. Items
  that need a text not yet indexed are skipped automatically.
- **Runner:** `eval/run-eval.ts` measures retrieval hit@1/3/5 and MRR, verdict accuracy, citation validity,
  out-of-scope refusal, PII echo, traceId presence and latency. Each figure comes with a Wilson 95% CI.

| Metric (API, live corpus) | Value | 95% CI | Source |
|---|---|---|---|
| Retrieval hit@5 / MRR@10 | `<fill>` | `<fill>` | `eval/results/<ts>.md` |
| Verdict accuracy | `<fill>` | `<fill>` | idem |
| Out-of-scope refusal | `<fill>` | `<fill>` | idem |
| Citation validity | `<fill>` | `<fill>` | idem |
| Chat availability with LLM off (S3) | `<fill>` | `<fill>` | idem, label `S3-llm-off` |

**Sandbox reference run.** Colab notebook, no API key, TF-IDF, τ = 0.20, 75 items. Results: 31 answered and
44 refused. Accuracy on answered was 26/30 (CI 0.70–0.95). Refusal accuracy on expected refusals was 21/22
(0.78–0.99). Recall@3 was 35/55 (0.50–0.75). The S1 item returns `OUTDATED_TEXT`. English questions over French
texts are the weak point of this lexical baseline (`sandbox/README.md`).

**Auditability.**

- Every response carries a `traceId`.
- Each pipeline step (retrieved IDs and scores, rule fired, verdict, model used) is appended to a hash-chained
  audit log (in progress). Any tampering breaks the chain.
- The sandbox agent logs every tool call and policy decision.

## 8. Limitations

- The gate, PII redaction, audit trail, agents and hybrid retrieval are being merged in parallel. The "Actual"
  columns stay empty until they are.
- The corpus is small. The 1996 Constitution copy is not consolidated, and some secondary sources (data-protection
  articles, civil status) are marked "to verify".
- No domain expert has reviewed the gold set yet. Accepted verdicts encode our judgement.
- SONAH gives orientation, not legal advice. It is not affiliated with any Cameroonian administration.

**Links.** Repository https://github.com/emeric-cyrille/sonah · Demo https://sonah.fokamemeric.com · ITU-T Y.3172
https://www.itu.int/rec/T-REC-Y.3172/en · AI Readiness Report 2.0
https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf
