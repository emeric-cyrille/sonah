# SONAH and the ITU AI Readiness framework

**Source.** ITU, *AI Ready – Analysis Towards a Standardized Readiness Framework*, Report 2.0, January 2026,
ISBN 978-92-61-41911-0, https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf.
The text calls it "ITU AI Readiness 2.0" (p. 8). Page numbers below are the printed numbers.

All names below are copied from the report. Some hackathon guides from earlier editions use different labels for the
13 dimensions (for example "Data Governance & Privacy" or "Human Collaboration & Oversight"). We use the
official report's names only.

## 1. Framework structure (verbatim)

**6 factors** (pp. 17–18):

| Factor | Definition |
|---|---|
| Data | "Accessibility and quality of datasets for analysis of AI applications." |
| Research | "Collaboration between domain-specific and AI research communities." |
| Deployment Support | "Infrastructure and ecosystem readiness for AI deployment." |
| Standards | "Ensuring trust, interoperability, and compliance." |
| Open source and Code | "Enabling rapid adoption through an open developer ecosystem." |
| Sandbox Environments | "Platforms for AI experimentation and validation." |

**13 dimensions** (Chapter 3, pp. 18–34). Each is mapped to at least one factor.

| # | Dimension | Mapped factor(s) |
|---|---|---|
| 1 | Data/model Marketplace | open data, open source |
| 2 | Generated Content Marketplace | open data, open source |
| 3 | Cross-domain correlation analysis | open data, standards |
| 4 | Contextualization and Regional Impact | open data, research, deployment |
| 5 | Level of Integration of AI in Workflows | standards |
| 6 | Human Interface | standards, deployment |
| 7 | Strategy Alignment | standards |
| 8 | Collaboration with AI | open source, standards |
| 9 | Impacts of Humans in AI Integration | sandbox |
| 10 | AI & Policies | sandbox, deployment |
| 11 | AI for Inclusion | sandbox |
| 12 | Granular Priorities | deployment |
| 13 | Digital Infrastructure | deployment |

The basic framework (Chapter 2, pp. 12–13) has a second, country-level grid. Its 5 groupings are
Data, Digital Infrastructure, Digital Skills, Innovation Ecosystem and AI Policy, and each has indices and metrics.
It includes the index metric "AI pipeline standards [ITU-T Y.3172]" under Innovation Ecosystem → Standards.

The report defines no numbered maturity scale. Indices are "0/1 filter" or "weightage, which goes from 0-1" (p. 37),
and REQ-004 requires "maturity levels per dimension" without defining them. **SONAH therefore claims no maturity
level, only evidence.**

## 2. Claimed dimensions (3 + 1 partial)

Each claim below is matched to a metric that the report itself lists for that dimension.

### Dimension 10 – AI & Policies (primary claim)

The report's text:

- "Policies for nodes in AI pipelines, identified in ITU-T Y.3172" (p. 28)
- "risk assessment via Sandbox/Policy/SINK as per ITU-T Y.3172" (p. 28)
- metrics (p. 29): "Availability of vertical sandboxes …"; "Domain-specific policies and evaluation mechanisms";
  "explainability, trustability, and reliability"; "Number of Policy inputs from case briefs …"; "accountability of
  final decisions, which remains with humans"

| Report metric | SONAH evidence | How a judge verifies it |
|---|---|---|
| Policies for nodes in AI pipelines (Y.3172) | A blocking P node: relevance threshold, then a deterministic policy gate with typed verdicts (`ANSWERED_WITH_CITATIONS`, `INSUFFICIENT_EVIDENCE`, `CONFLICT_BETWEEN_TEXTS`, `OUTDATED_TEXT`, `REFER_TO_HUMAN`, `OUT_OF_SCOPE`, plus `CONVERSATION` for small talk). It checks citation indices and verbatim quotes, and replaces a failing draft with an extractive answer. A procedure gate rejects any number or document absent from the procedure sheet. PII is masked at the PP node. | `docs/itu/y3172-mapping.md`; `apps/api/src/policy/policy-gate.ts` (`POLICY_GATE_VERSION`), `apps/api/src/policy/procedure-gate.ts`, `apps/api/src/policy/pii.ts`, `apps/api/src/agents/answer-engine.service.ts` (`minScore`); `POST /api/v1/chat` returns `verdict` and `traceId` |
| Vertical sandbox + domain-specific evaluation mechanism | Colab sandbox notebook with a P-node threshold; 100-item FR/EN gold set; runner with Wilson CIs. Latest run on a local API with `gemini-3.1-flash-lite` (97 of 100 items run): retrieval hit@1 0.643, hit@5 0.843, MRR@10 0.735, verdict accuracy 0.866 (84/97), citation validity 0.915 (140/153), out-of-scope refusal 10/10, chat availability 97/97. Six progressive error scenarios run step by step through the API (four are deployed; two are on branch `feat/submission-prep`, pending deploy). | `sandbox/notebooks/sonah-agentic-rag-reference/`; `eval/run-eval.ts`; `eval/README.md`; `eval/results/2026-10-29T01-47-53-637Z.md`; `apps/api/src/scenarios/scenario-definitions.ts`; `eval/run-scenarios.ts`; `GET /api/v1/scenarios` |
| Policy inputs from case briefs (operational lessons → governance lessons) | Policy-gap register (8 gaps) paired with verified global examples. Each error scenario also ends with a domain-level gap returned by the API (for example `consolidated-legal-texts`, `ai-chat-retention`, `public-ai-data-reuse`). | `docs/itu/policy-gap-register.md`, `docs/itu/policy-gaps.json`; `gaps` in `apps/api/src/scenarios/scenario-definitions.ts` |
| Accountability of final decisions remains with humans | `REFER_TO_HUMAN` verdict for sensitive situations; coordinator escalation to a human when positions or verdicts conflict; answers framed as orientation, not legal advice (system prompt) | `apps/api/src/policy/situations.ts`; `apps/api/src/agents/coordinator.ts`; `apps/api/src/chat/sonah-prompt.ts`; gold items `PRO-11`, `PRO-12` |
| Explainability / audits | Article-level citations in every grounded answer. Hash-chained, append-only audit trail: one trace per answer, with input, retrieval scores, gate checks, rule fired, verdict and model. Updates and deletes are refused by a database trigger. Citation-validity metric. | `apps/api/src/audit/hash-chain.ts`, `apps/api/src/audit/audit.controller.ts`; migration `packages/database/prisma/migrations/20261025000000_audit_traces_scenarios/`; `GET /api/v1/audit/traces/:id`, `GET /api/v1/audit/verify`; web page `/audit`; `eval/run-eval.ts` ("citation validity", "traceId returned") |

### Dimension 4 – Contextualization and Regional Impact

The report's metrics (p. 22) include: "Datasets, models, research, guidelines, toolsets, and standards developed with
regional inputs"; "Availability of structured and accessible local datasets"; "Customizations for regional
applications"; "Representation of sub-groups in the dataset for fine-tuning, prompt-tuning or evaluations".

| Report metric | SONAH evidence | How a judge verifies it |
|---|---|---|
| Structured, accessible local datasets | 20 sources in the manifest (Cameroonian laws in French and, for the Constitution and Labour Code, English; international AI references), turned into an article-level, citable index. Each article has a stable key and its hierarchy path. The manifest records the official source URL and a version note. 26 structured procedure sheets validated against a JSON schema. | `data/sources/manifest.json`; `data/procedures/*.json`, `data/procedures/procedure.schema.json`; `packages/rag/src/chunking/legal-chunker.ts` (+ `legal-chunker.spec.ts`) |
| Customization for regional applications | Parser handles Cameroonian drafting conventions ("Article premier", "Art. 2.-", "47 bis"). Droit-Afrique header/footer patterns are stripped. PII masking recognises Cameroonian phone numbers and identity documents (CNI, NIU). The prompt is written for Cameroonian administration. | `packages/rag/src/chunking/legal-chunker.ts`; `apps/api/src/policy/pii.ts`; `apps/api/src/chat/sonah-prompt.ts` |
| Representation of sub-groups in evaluation | Gold set covers both official languages (54 FR / 46 EN items), plus labour, constitutional, digital and civil-status needs | `eval/questions.jsonl` |

### Dimension 6 – Human Interface

The report's metrics (p. 24) include: "Availability of AI models in the local language used in the human interface";
"Interaction channels and devices (e.g., mobiles …)"; "The level of safety integrated into the human interface …
safeguards on destructive practices and steps while applying the inference or different nodes in the AI pipeline".

| Report metric | SONAH evidence | How a judge verifies it |
|---|---|---|
| Local-language availability | French and English, the official languages of Cameroon (Constitution Art. 1(3)). Language is detected per message, and the API accepts a `language` override. Embeddings use the multilingual local model `multilingual-e5-small`, and the Constitution, its amendments and the Labour Code are also indexed in English. National languages are not supported. | `apps/api/src/policy/language.ts`; `apps/api/src/chat/chat.schemas.ts`; `packages/rag/src/embeddings/local-embedder.ts`; `eval/questions.jsonl` (54 FR / 46 EN); live demo https://sonah.fokamemeric.com |
| Interaction channels / devices | Installable mobile-first PWA | `apps/web/src/app/manifest.ts`; `apps/web/src/app/chat/page.tsx` |
| Safety at different pipeline nodes | PII masking at PP before storage or any model call (S2), policy and procedure gates at P, model fallback chain then extractive answer (S3). Verdict and citations are shown to the citizen. | `apps/api/src/policy/pii.ts`; `apps/api/src/policy/policy-gate.ts`; `apps/api/src/chat/language-model.ts` (`FallbackLanguageModel`); `docs/itu/y3172-mapping.md` §Error scenarios |

### Dimension 9 – Impacts of Humans in AI Integration (partial claim)

The report says: "There are scenarios when AI decisions are referred back to domain experts to guarantee the
accountability of the decision" (p. 26). It lists "inference-to-action latency" among the metrics.

SONAH evidence: the `REFER_TO_HUMAN` verdict, and the deterministic coordinator that routes scenario events to
simulated authority agents (`regulator-minpostel`, `data-protection-authority`, `ministry-business`) and escalates
to a human on conflict (`apps/api/src/agents/coordinator.ts`, `apps/api/src/agents/agent-registry.ts`,
`GET /api/v1/agents`). Chat latency is measured by `eval/run-eval.ts` (p50 3.3 s, p95 15.3 s in
`eval/results/2026-10-29T01-47-53-637Z.md`). **This claim is partial:** the authorities are simulated, no domain
expert has reviewed the gold set yet, and no skills/awareness programme is measured.

## 3. Factors

| Factor | Evidence |
|---|---|
| Data | Public FAOLEX sources, manifest with URLs and version notes, gold set |
| Standards | Y.3172 node mapping (`y3172-pipeline.yaml`); gap register cross-referenced to ITU-T and other standards |
| Open source and Code | Public repository https://github.com/emeric-cyrille/sonah; sandbox agent and notebook in Sandbox_Training format |
| Sandbox Environments | `sandbox/` (Colab, no key), `eval/` (gold set, `run-eval.ts`, `run-scenarios.ts`), interactive error scenarios (`/lab` page, `/api/v1/scenarios`), `docker-compose.yml` |
| Research, Deployment Support | Not claimed beyond the live deployment (https://sonah.fokamemeric.com, CI/CD in `.github/workflows/`) |

## 4. Not claimed

| # | Dimension | Reason |
|---|---|---|
| 1 | Data/model Marketplace | We publish a corpus and agent, but no marketplace mechanism. |
| 2 | Generated Content Marketplace | Not applicable. |
| 3 | Cross-domain correlation analysis | Single domain (public legal information). |
| 5 | Level of Integration of AI in Workflows | Not integrated into an administration's workflow; no time-saved measurement. |
| 7 | Strategy Alignment | Cameroon's national AI strategy was presented in July 2025, but we found no official text to align against (see gap register). |
| 8 | Collaboration with AI | Not measured. |
| 11 | AI for Inclusion | No accessibility (sign language, speech, low-literacy) features yet. Bilingualism is covered under Dimension 6. |
| 12 | Granular Priorities | Not addressed. |
| 13 | Digital Infrastructure | No measurement of compute, connectivity or devices. |

We claim three dimensions plus one partial, rather than padding the list.
