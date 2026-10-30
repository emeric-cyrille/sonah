% AI for Good Sandbox Hackathon – SONAH – SONAH: a policy-gated, auditable assistant for legal and administrative information

%% Team leader: Kenmegne Fokam Emeric Cyrille (Université de Yaoundé I)
%% Team members: Kenmegne Fokam Emeric Cyrille; Chignheng Tchitchi Chirol
%% Contact details: emeric.kenmegne@facsciences-uy1.cm; chirol.chignheng@facsciences-uy1.cm
%% Github link: https://github.com/emeric-cyrille/sonah (live demo: https://sonah.fokamemeric.com)

# Introduction

Citizens now ask AI assistants the questions they used to ask a clerk: *how long can my probation last, what do I need to replace a lost ID card, can my employer dismiss me without notice?* A wrong answer is a public-service failure that can cost someone a job, a deadline or a business; a tribunal has already held a company liable for its chatbot's misinformation (*Moffatt v. Air Canada*, 2024 BCCRT 149). SONAH (Système d'Orientation Nationale et d'Accompagnement Harmonisé) is a bilingual (French/English) assistant for Cameroon that answers only from official texts and verified procedure sheets, cites the exact article, and refuses in a typed, explainable way when it cannot answer safely.

SONAH is built as an ITU-T Y.3172 pipeline whose **policy node (P) is blocking and deterministic**: a language model may draft, but code decides what reaches the citizen. Every answer carries a verdict and a trace identifier that links to a hash-chained audit record. We then use the system as a probe: each error scenario it must handle exposes a policy or standards gap for public AI information services, which we map to the ITU AI Readiness Framework 2.0 and compare with practice abroad.

# Description of the use case

**Problem.** Cameroonian law is published as promulgated acts in two official languages, without consolidated versions (an amended article is not rewritten in the original text), and administrative procedures are described by each ministry separately. Existing channels (counters, ministry websites, informal intermediaries, generic chatbots) are slow, inconsistent or unverifiable; a generic LLM answers fluently but may cite a repealed article or invent a fee.

**What SONAH does.** (1) *Procedures*: for "I lost my ID card" or "I need a medical certificate", it returns a structured procedure sheet (where to go, documents, steps, cost, delay, official source, verification date) and never invents a missing figure: unverified costs are shown as "not verified". (2) *Rights*: for "can my employer dismiss me without notice?", it answers in plain language with verbatim, clickable citations of the articles (Labour Code, Constitution, data-protection law). (3) *Conversation*: greetings, typos, Pidgin or Camfranglais are understood (an LLM rewrites the request, the rest of the pipeline is unchanged). (4) *Audit*: anyone can open the trace of any answer and verify the integrity of the whole log.

**How it closes the gaps of existing solutions.** Answers are grounded and checkable (citation of the exact article and its amendment status), refusals are explicit and typed, personal data are masked before any model call or storage, the service keeps answering with citations when every LLM provider fails, and each decision is replayable from its trace. SONAH is an information and orientation service: it does not replace a lawyer or an administration, and says so.

# Use case requirement

| Node | Requirement | SONAH implementation (verifiable in the repository) |
|---|---|---|
| SRC | Authoritative texts with official URL, version and amendment status; the citizen's question | `data/sources/manifest.json`: 26 sources (15 Cameroonian texts FR/EN, 10 African and international AI policy references, Y.3172 cited) with URL, version, sha256, licence; 26 procedure sheets with official source and verification date (`data/procedures/`); datasheet `data/sources/DATASHEET.md` |
| C | Reproducible, validated collection; protected write path | Schema-validated manifest, checksummed downloads, resumable seed; admin-guarded `POST /documents`; rate-limited `POST /chat` |
| PP | Citable units; no personal data beyond what is needed | Per-article chunking keeping Title › Chapter path (2,057 chunks + 26 sheets indexed); deterministic PII masking (ID numbers, phones, e-mails) before LLM call and storage; greetings stripped; follow-ups rewritten |
| M | Grounded generation that degrades safely | Multilingual-e5 embeddings + pgvector, full-text search for explicit references; LLM chain Gemini 3.1 Flash-Lite → GPT-OSS-120B → Qwen (Groq) → deterministic extractive answer |
| P (blocking) | No answer without evidence; every citation retrieved and verbatim; amended texts flagged; invented numbers or documents rejected; conflicts and sensitive cases escalated | `apps/api/src/policy/`: typed verdicts ANSWERED_WITH_CITATIONS, INSUFFICIENT_EVIDENCE, OUTDATED_TEXT, CONFLICT_BETWEEN_TEXTS, REFER_TO_HUMAN, OUT_OF_SCOPE; a rejected draft is replaced by an extractive answer |
| D | Route to the citizen, a human or the competent authority | Intent routing (procedure / rights / mixed / out of scope); coordinator over 6 agents (Sonah, legal adviser, telecom regulator, data-protection authority, business ministry, coordinator) |
| SINK | Citizen sees verdict and sources; every decision is auditable | Web app with verdict badge, citation drawer and trace link; append-only, hash-chained audit log (`GET /audit/traces/:id`, `GET /audit/verify`) |
| MLFO / sandbox | Model selection and fallback; offline evaluation before change | `LLM_PROVIDER`, fallback chain recording which model answered; 100-item gold set (`eval/`); scenario replay (`eval/run-scenarios.ts`); Colab notebook (`sandbox/`) |

The P node is code, not a second LLM, so a verdict can be replayed exactly. It fails closed: a check that cannot run downgrades the verdict. The model only writes; it never decides what is true.

# Mapping with ITU-T Y.3172, Readiness 2.0 Report, and domain-specific policies

| Node | Use case (public legal information) | Readiness 2.0 (dimension) | Documents (policies, strategies, regulations) |
|---|---|---|---|
| SRC | Official Cameroonian texts with amendment status; procedure sheets; citizen questions | D4 Contextualization and Regional Impact (local, structured datasets) | Constitution 1996 and revisions 2008 and 2026 (FR/EN); Labour Code 1992 (FR/EN); civil-status law 2024/016; decree 2017/0877 (one-stop shop) |
| C | Checksummed, licensed collection; no scraping of personal data | D1 Data/Model Marketplace (dataset properties, licences) | Law 2010/012 (cybersecurity); Law 2010/013 and 2015/006 (electronic communications) |
| PP | Article-level chunking; PII masking before model and storage | D1 (privacy and security; personal data standards) | Law 2024/017 on personal data (arts 9, 11, 48); AU Continental AI Strategy 2024; UNESCO Recommendation 2021 |
| M | Grounded retrieval and generation; multilingual; provider fallback | D2 Generated Content Marketplace (guardrails for hallucinations); D13 Digital Infrastructure | Cameroon Digital Economy Strategy 2020; OECD AI Recommendation (robustness) |
| P | Blocking gate with typed verdicts; verbatim citations; outdated-text detection | D10 AI & Policies ("policies for nodes in AI pipelines, identified in ITU-T Y.3172") | EU AI Act art. 50 (transparency), art. 14 (human oversight), art. 15 (robustness); OECD AI Principles |
| D | Routing to citizen, human expert or authority | D9 Impacts of Humans in AI Integration; D8 Collaboration with AI | Law 2024/017 (data-protection authority); UNESCO Recommendation (human oversight) |
| SINK | Answer with citations, verdict, trace; bilingual interface | D6 Human Interface; D11 AI for Inclusion | Constitution art. 1(3) (English and French of equal value); EU AI Act art. 12 (record-keeping) |
| Sandbox | Gold set, scenario replay, Colab notebook | Sandbox Environments factor; D10 (vertical sandboxes) | ITU-T Y.3172, Y.3181 (ML sandbox) |

**Strategy alignment and collaboration.** The same pipeline can serve any administration that publishes its procedures as structured sheets (`data/procedures/procedure.schema.json`); the knowledge base also holds ten African and international AI policy references (AU Continental AI Strategy, Africa Declaration on AI (Kigali, 2025), Smart Africa Blueprint, Rwanda and Nigeria strategies, ITU AI Ready Report 2.0, UNESCO, OECD, EU AI Act, Singapore GenAI framework), indexed and queryable by the agents.

# Error scenarios.

Six scenarios are released step by step by the API (`POST /scenarios/:id/runs`, then `/next`), each step answered by agents whose verdicts, citations and traces are recorded; `node --experimental-strip-types eval/run-scenarios.ts` replays all of them and verifies the audit chain (production run of 29 October 2026: 18 steps, chain valid over 126 traces, `eval/scenario-runs/2026-10-29/SUMMARY.md`). Institutions are simulated.

## S1 – Deployment, then an amended article is served.
Step 1: SONAH is popular during an election period; a citizen asks how many times the President can be re-elected. The original 1996 Constitution (art. 6, "renewable once", marked *amended*) is indexed next to the 2008 and 2026 revisions; P only lets the version in force through, and the answer cites the 2026 text ("Il est rééligible"). Step 2: asked whether the 1996 article is still in force, the legal-adviser agent returns OUTDATED_TEXT and the coordinator escalates to a human officer. Step 3: asked for an official consolidated version, the agent answers that none exists, citing the "non consolidé" notes of the indexed texts. *Controversy:* without amendment metadata, an answer faithful to the corpus would be false today (GAP-01).

## S2 – Six months later, citizens paste personal data.
Step 1: users include ID numbers and phone numbers in their questions. Step 2: PP masks them before any model call or storage, and the reply warns the citizen. Step 3: the data-protection agent checks the retention duty. *Controversy:* audit traces must stay verifiable for accountability, while Law 2024/017 limits retention (GAP-03).

## S3 – An LLM provider fails or its free quota is exhausted.
Step 1: the primary model fails. Step 2: the fallback chain answers with the next model and records which one; if all fail, the extractive mode still answers with verbatim citations and P still applies. Step 3: `/health/ready` reports the degraded state. *Controversy:* a degraded answer versus a refusal; SONAH only degrades to verbatim citations (GAP-05).

## S4 – Two administrations give contradictory requirements (opening a restaurant).
Step 1: the business ministry says "register first, then hygiene certificate"; the city council says the opposite. Step 2: the ministry agent, the legal adviser and the coordinator all return CONFLICT_BETWEEN_TEXTS, never a guessed order. Step 3: no indexed text designates the competent authority (GAP-07).

## S5 – Six months later, the operator wants to reuse conversations; judges' twist: an insurer wants them for ads.
Step 1: many conversations concern health; the team proposes to train a model on them. The data-protection agent answers "no without new consent", citing Law 2024/017 art. 11 (purpose limitation) and art. 9 (consent). Step 2 (twist): an insurer offers to buy "pseudonymised" health conversations for targeted offers. Three agents answer with arts 40, 41 (consent for direct marketing) and 48 (sensitive data); the coordinator finds them consistent. Step 3: the legal adviser cites art. 19 (prior authorisation by the data-protection authority); asked whether any text governs training AI models on public-service conversations, the data-protection agent answers that none does, while training still falls under the general definition of processing (art. 5): the gap is stated with its source. *Controversy:* two agents read art. 48 ("biometrics in health matters") as a ban on all health data; the gate accepts the citation but cannot judge the interpretation, which is why sensitive outputs are routed to human review.

## S6 – Six months later, English speakers are served less well.
Step 1: associations from the English-speaking regions report "details only in French"; the legal adviser cites Constitution art. 1(3) (English and French of equal value). Step 2 (twist): to prove the gap, the team proposes to record each user's mother tongue and region; the data-protection agent and legal adviser answer that Law 2024/017 art. 48 forbids processing linguistic or regional origin. Step 3: decision, measure the gap from the language of each message only (aggregate counts, no profile) and publish per-language coverage. *Controversy:* measuring discrimination requires the very data the law protects (GAP-06).

**Measured behaviour** (`eval/results/2026-10-29T05-05-07-199Z.md`, policy gate 1.4 as deployed, 100-item gold set, 54 FR / 46 EN, 97 run): verdict accuracy 0.91; off-topic refusal 10/10; questions without a source not answered as if sourced 13/14 (10/14 on the same items before the gate learnt an explicit [NO_EVIDENCE] signal: an honest "the texts do not say" draft had no citation and was replaced by unrelated extracts, a defect found by this evaluation); retrieval hit@1 0.63, hit@5 0.80, MRR@10 0.71, citation validity 0.86 (slightly lower than the 0.84 hit@5 measured before the 366 international-strategy chunks were added to the same index); personal data never echoed 2/2; median latency 3.9 s. Prototype accuracy is not judged; these figures show that the measurement is reproducible (Wilson 95 % intervals and earlier runs in `eval/results/`).

# Policy gaps and standards gaps derived from the mapping exercise

| ID | Gap (domain level) | From | Global examples | Recommendation |
|---|---|---|---|---|
| GAP-01 | No authoritative, machine-readable, consolidated (point-in-time) legal texts | S1 | EUR-Lex consolidation; European Legislation Identifier; legislation.gov.uk API; Akoma Ntoso (OASIS) | Article-level, versioned legal data with persistent identifiers; AI services must flag versions and refuse outdated text |
| GAP-02 | No transparency or disclaimer standard for AI giving legal or administrative information | S1, S4 | EU AI Act art. 50; UK Algorithmic Transparency Recording Standard | AI disclosure, per-claim citation and version, machine-readable answer status |
| GAP-03 | Conversation retention: traffic-data retention duty vs storage limitation | S2, S5 | GDPR art. 5(1)(e) and 25; EU AI Act art. 12 and 26(6) | Separate content from integrity-protected audit metadata; mask before storage; name the arbitrating authority |
| GAP-04 | Unclear accountability for wrong AI-provided public information | S1, S4 | *Moffatt v. Air Canada* (2024); France, right to rely on administrative positions (ESSOC law 2018) | Deploying body accountable; traceable answers; correction and redress channel |
| GAP-05 | No continuity requirement for public AI depending on external models | S3 | GOV.UK Service Standard point 14; ISO 22301; EU AI Act art. 15(4) | Declared degraded mode keeping safeguards; no single-provider dependency |
| GAP-06 | No operational duty and no lawful metric for equal service in both official languages | S6 | Canada Official Languages Act, Part IV | Bilingual machine-readable procedure publication; per-language quality targets measured without profiling users |
| GAP-07 | No authoritative cross-ministry registry of procedures | S4 | EU Single Digital Gateway (Reg. 2018/1724) and Once-Only Technical System; Estonia eesti.ee | Single machine-readable registry with an owner who arbitrates conflicts |
| GAP-08 | No rule on reusing public AI service data, and no escalation channel | S5 | EU AI Act art. 10 (data governance) and art. 14 (human oversight); Council of Europe Framework Convention on AI (CETS 225) | Purpose-bound reuse authorised by the data-protection authority; named human counterpart per issue type; contestable trace IDs |

**African and international reference points in the knowledge base.** The Africa Declaration on AI (Kigali, 2025, §3.2.2) commits signatories to "robust data governance mechanisms" with "standardized data formats, metadata, exchange protocols" (GAP-01, GAP-07). Rwanda's National AI Policy (Priority Area 4, trustworthy AI adoption in the public sector) plans procurement guidelines for AI solutions in the public sector (GAP-04, GAP-05). Singapore's Model AI Governance Framework for Generative AI (2024) recommends incident reporting and treats personal data used for training as "potentially contentious" (GAP-04, GAP-08). The ITU AI Ready Report 2.0 cites ITU-T Y.3172 as the AI pipeline standard and as a metric of Strategy Alignment (Dimension 7), which is how SONAH's pipeline is organised.

**Limitations.** The corpus is partial (no OHADA Uniform Acts or Penal Code yet); many procedure costs remain "not verified"; the gold set has not been reviewed by a lawyer; the gate verifies citations, not legal interpretation. The full gap register with sources and "to verify" flags is in `docs/itu/policy-gap-register.md`.
