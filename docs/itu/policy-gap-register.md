# Policy, strategy and standards gap register

**Domain:** Public-service legal information delivered by AI assistants (citizen-facing RAG/LLM systems).

Gaps are stated at domain level. Cameroon is used as the observed context, not as the object of country-specific recommendations. Every external fact carries its URL; facts we could not verify against a primary source are flagged in `to_verify`. Last verified: 2026-10-23.

The machine-readable source of truth is [`policy-gaps.json`](./policy-gaps.json). This page is generated from it, so edit the JSON, not this file, then run `python3 docs/itu/render_gaps.py docs/itu/policy-gaps.json docs/itu/policy-gap-register.md`.
Every gap starts from an observation in an error scenario (S1–S4, see [`y3172-mapping.md`](./y3172-mapping.md#error-scenarios-through-the-pipeline)) or in the gold set ([`eval/questions.jsonl`](../../eval/questions.jsonl)).

## Summary

| ID | Gap | Type | Scenario | Global examples | Recommendation (short) |
|---|---|---|---|---|---|
| GAP-01 | No authoritative, machine-readable, consolidated (point-in-time) legal texts | standards, technology | S1 | [EUR-Lex consolidated texts](https://eur-lex.europa.eu/collection/eu-law/consleg.html) (European Union); [European Legislation Identifier (ELI)](https://data.consilium.europa.eu/doc/document/ST-14172-2017-INIT/en/pdf) (European Union); [LEGI open dataset (DILA)](https://www.data.gouv.fr/datasets/legi-codes-lois-et-reglements-consolides) (France); [legislation.gov.uk API](https://www.legislation.gov.uk/developer) (United Kingdom); [Akoma Ntoso v1.0 (OASIS LegalDocML)](https://www.oasis-open.org/?p=4821) (International standard) | Publish official legal texts as consolidated, versioned, machine-readable data, with persistent identifiers per article and per version (ELI-style URIs, Akoma Ntoso markup) and an amendment graph. |
| GAP-02 | No transparency and disclaimer standard for AI systems that give legal or administrative information | standards, legislative | S1, S4 | [EU AI Act, Article 50(1)](https://artificialintelligenceact.eu/article/50/) (European Union); [Algorithmic Transparency Recording Standard (ATRS)](https://www.gov.uk/government/publications/algorithmic-transparency-recording-standard-mandatory-scope-and-exemptions-policy/algorithmic-transparency-recording-standard-atrs-mandatory-scope-and-exemptions-policy) (United Kingdom); [Code des relations entre le public et l'administration, L312-1-3](https://questions.assemblee-nationale.fr/dyn/taux-application-lois/DLR5L14N34516) (France) | Adopt a domain standard for AI legal-information services. |
| GAP-03 | Retention of citizen conversations: blanket traffic-data retention vs storage limitation | conflicting objectives, legislative | S2 | [GDPR Article 5(1)(e) - storage limitation](https://gdpr-info.eu/art-5-gdpr/) (European Union); [GDPR Article 25 - data protection by design and by default](https://gdpr-info.eu/art-25-gdpr/) (European Union); [EU AI Act Article 26(6)](https://artificialintelligenceact.eu/article/26/) (European Union) | Issue guidance that classifies AI-assistant conversation content separately from connection/traffic metadata. |
| GAP-04 | Unclear accountability when a public AI assistant gives wrong information | unclear responsibilities, legislative | S1, S4 | [Moffatt v. Air Canada, 2024 BCCRT 149](https://www.mondaq.com/canada/new-technology/1427926/airline-ordered-to-compensate-a-bc-man-because-its-chatbot-provided-inaccurate-information) (Canada (British Columbia)); [NYC MyCity chatbot](https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law) (United States (New York City)); [Opposability of published administrative positions (CRPA L312-3, ESSOC law 2018-727)](https://droit.cairn.info/article/RDP_101_1185/pdf?lang=fr) (France) | Define in law or policy that the deploying public body is accountable for information its AI assistant provides. |
| GAP-05 | No continuity or service-level requirement for public AI services that depend on external models | technology, standards | S3 | [GOV.UK Service Standard, point 14 'Operate a reliable service'](https://www.gov.uk/service-manual/service-standard/point-14-operate-a-reliable-service) (United Kingdom); [ISO 22301:2019](https://www.sis.se/en/produkter/sociology-services-company-organization/company-organization-and-management/general/iso-223012019/) (International standard); [EU AI Act, Article 15(4)](https://artificialintelligenceact.eu/article/15/) (European Union) | Require public AI information services to declare a degraded mode that keeps the policy safeguards (extractive, citation-only, or explicit unavailability). |
| GAP-06 | No equal-quality requirement for AI public services in both official languages | standards, coordination | Gold set (FR/EN pairs) | [Official Languages Act, Part IV 'Communications with and Services to the Public'](https://laws-lois.justice.gc.ca/eng/acts/O-3.01/) (Canada); [Directive on Automated Decision-Making + Algorithmic Impact Assessment](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/automated-decision-making/algorithmic-impact-assessment.html) (Canada) | Require per-language evaluation and reporting (retrieval, refusal and error rates) for public AI services, with parity thresholds across official languages, and official translations of key legal texts in machine-readable form. |
| GAP-07 | No authoritative cross-ministry registry of administrative procedures | coordination, unclear responsibilities | S4 | [Single Digital Gateway Regulation (EU) 2018/1724](https://single-market-economy.ec.europa.eu/single-market/single-digital-gateway_en) (European Union); [eesti.ee state portal](https://ria.ee/en/news/20-years-reliable-e-services) (Estonia) | Create a single, authoritative, machine-readable procedure registry. |
| GAP-08 | No human-oversight, escalation and redress channel for citizen-facing AI | unclear responsibilities, legislative | S2, S4 | [EU AI Act, Article 14 (human oversight) and Article 26(2)](https://artificialintelligenceact.eu/article/14/) (European Union); [Council of Europe Framework Convention on AI (CETS No. 225)](https://www.coe.int/en/web/portal/-/council-of-europe-opens-first-ever-global-treaty-on-ai-for-signature) (Council of Europe and other signatories); [UNESCO Recommendation on the Ethics of AI (2021)](https://www.unesco.org/en/artificial-intelligence/recommendation-ethics) (193 UNESCO Member States); [African Union Continental AI Strategy](https://au.int/en/documents/20240809/continental-artificial-intelligence-strategy) (African Union) | Designate, for each public AI service, the human escalation counterpart by category of issue (legal dispute, safety, data protection, procedure conflict). |

## GAP-01 — No authoritative, machine-readable, consolidated (point-in-time) legal texts

**Type:** standards, technology. **Scenario:** S1.

**Gap (domain level).** AI assistants can only be as current as their sources. When the official consolidated version of a law is missing, or exists only as scanned or third-party PDFs without amendment links, the system has no reliable signal that an article was modified. The assistant may then serve a repealed rule as current law.

**Evidence from SONAH.** SONAH's indexed Constitution (Law No. 96/06, FAOLEX copy) says the President is elected for seven years 'renouvelable une fois' (Art. 6(2)). Law No. 2008/001 of 14 April 2008 replaced this with 'Il est rééligible' and also amended Arts. 6(4), 14(3)(a), 15(4), 51(1), 53 and 67(6). Nothing in the source file links the two texts. The only safeguard is a manual version note in data/sources/manifest.json. Artefacts: `data/sources/manifest.json`, `eval/questions.jsonl (items OUT-01..OUT-04)`.

**Observed context (Cameroon).**

- The Presidency publishes acts (lois, ordonnances, décrets) as promulgated, with no consolidated versions or amendment tracking. [source](https://www.prc.cm/fr/actualites/actes)
- Law No. 2008/001 of 14 April 2008 amends Law No. 96/06 (Journal officiel text reproduced by WIPO Lex). The new Art. 6(2) reads 'Il est rééligible'. [source](https://www.wipo.int/wipolex/fr/text/491139)
- The 2015 Open Data Index rated Cameroon's online legislation as outdated (spm.gov.cm). [source](https://2015.index.okfn.org/place/cameroon/legislation)

**Global examples.**

| Instrument | Jurisdiction | What it does |
|---|---|---|
| [EUR-Lex consolidated texts](https://eur-lex.europa.eu/collection/eu-law/consleg.html) | European Union | Merges each act with its later amendments and corrigenda into one consolidated document. It is documentary only and has no legal effect. |
| [European Legislation Identifier (ELI)](https://data.consilium.europa.eu/doc/document/ST-14172-2017-INIT/en/pdf) | European Union | Council conclusions of 26 October 2012 (OJ 2012/C 325/02) invite Member States to give legislation persistent URIs and machine-readable metadata, on a voluntary, gradual basis. |
| [LEGI open dataset (DILA)](https://www.data.gouv.fr/datasets/legi-codes-lois-et-reglements-consolides) | France | Consolidated codes, laws and regulations as open data under Licence Ouverte, available as bulk download and through an API (PISTE). |
| [legislation.gov.uk API](https://www.legislation.gov.uk/developer) | United Kingdom | Permanent URIs and XML/RDF/Atom formats (CLML, Akoma Ntoso) for revised legislation under the Open Government Licence v3.0. |
| [Akoma Ntoso v1.0 (OASIS LegalDocML)](https://www.oasis-open.org/?p=4821) | International standard | OASIS Standard since 29 August 2018. An XML vocabulary for parliamentary, legislative and judicial documents, including amendments and versions. |

**Recommendation.** Publish official legal texts as consolidated, versioned, machine-readable data, with persistent identifiers per article and per version (ELI-style URIs, Akoma Ntoso markup) and an amendment graph. Until that exists, public AI assistants should be required to attach a version status to every citation and to refuse (OUTDATED_TEXT) when a known amendment is not in their corpus.

**ITU link.** [ITU-T Y.3172, SRC node](https://www.itu.int/rec/T-REC-Y.3172/en) (Data provenance and freshness at the source node.); [ITU AI Ready Report 2.0, Data → Data Interoperability → 'Standard data formats' (pp. 12-13)](https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf) (Readiness index this gap depresses.)

## GAP-02 — No transparency and disclaimer standard for AI systems that give legal or administrative information

**Type:** standards, legislative. **Scenario:** S1, S4.

**Gap (domain level).** No rule says what a public-facing AI legal-information service must disclose: that it is an AI, which sources and versions it used, that the answer is orientation and not a binding position, and how confident it is. Each deployer invents its own wording, and citizens cannot compare or rely on it.

**Evidence from SONAH.** SONAH discloses its nature and sources through prompt rules and typed verdicts (apps/api/src/chat/sonah-prompt.ts; verdicts in the P node). These are design choices; no applicable standard required them. Artefacts: `apps/api/src/chat/sonah-prompt.ts`, `docs/itu/y3172-mapping.md`.

**Observed context (Cameroon).**

- A national AI strategy was presented by the Minister of Posts and Telecommunications at CONIA 2025 (Yaoundé, 7-8 July 2025). We found no published official text or implementing instrument. [source](https://www.digitalbusiness.africa/cameroun-minette-libom-li-likeng-devoile-le-contenu-de-la-strategie-nationale-dia-aux-conia-2025/)

**Global examples.**

| Instrument | Jurisdiction | What it does |
|---|---|---|
| [EU AI Act, Article 50(1)](https://artificialintelligenceact.eu/article/50/) | European Union | Providers must design AI systems that interact directly with people so those people are informed they are interacting with an AI system. Applies from 2 August 2026. |
| [Algorithmic Transparency Recording Standard (ATRS)](https://www.gov.uk/government/publications/algorithmic-transparency-recording-standard-mandatory-scope-and-exemptions-policy/algorithmic-transparency-recording-standard-atrs-mandatory-scope-and-exemptions-policy) | United Kingdom | Mandatory for central government departments since February 2024. Covers tools that influence decisions with public effect or interact directly with the public. Each tool gets a published transparency record. |
| [Code des relations entre le public et l'administration, L312-1-3](https://questions.assemblee-nationale.fr/dyn/taux-application-lois/DLR5L14N34516) | France | Administrations publish online the rules of the main algorithmic processes used for individual decisions (Loi pour une République numérique, 2016). |

**Recommendation.** Adopt a domain standard for AI legal-information services. It should require AI disclosure; a citation per claim, with source, article and version; a machine-readable answer status (answered / insufficient evidence / outdated / conflict / referred); a standard 'orientation, not legal advice' notice; and a public transparency record per deployed system.

**ITU link.** [ITU AI Ready Report 2.0, Dimension 10 'AI & Policies' - 'explainability, trustability, and reliability' (p. 29)](https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf) (Horizontal policy metric.)

**To verify.** Exact current text of CRPA L312-1-3 on Légifrance (site returned 403; secondary source used).

## GAP-03 — Retention of citizen conversations: blanket traffic-data retention vs storage limitation

**Type:** conflicting objectives, legislative. **Scenario:** S2.

**Gap (domain level).** Citizens often type identity numbers, health or employment details into public AI assistants. Security and law-enforcement retention duties push operators to keep data for a long time. Data-protection law requires keeping it no longer than necessary. No rule says which regime applies to AI conversation logs and audit trails, or how long they may be kept.

**Evidence from SONAH.** In gold items PDP-05/PDP-06, a citizen shares a national ID number, phone number and date of birth. SONAH currently stores messages in Message.content (packages/database/prisma/schema.prisma). PII redaction before storage is being implemented. The audit trail must stay verifiable (hash chain) without keeping raw PII. Artefacts: `packages/database/prisma/schema.prisma`, `eval/questions.jsonl (items PDP-05, PDP-06)`.

**Observed context (Cameroon).**

- Law No. 2010/012 of 21 December 2010 (cybersecurity), Section 29(1): 'Operators of information systems shall be bound to conserve the connection and traffic data of their information systems for a period of 10 (ten) years.' [source](https://database.cyberpolicyportal.org/api/files/166367990584329pspck8evk.pdf)
- Law No. 2024/017 of 23 December 2024 on personal data protection sets core principles, including a retention period fixed in advance according to purpose (secondary summary). It enters into force on 23 June 2026 after an 18-month transition. [source](https://www.dlapiperdataprotection.com/?c=CM&t=law)
- Entry into force on 23 June 2026. [source](https://droitmediasfinance.com/index.php/actualites/droit-tech-fintech/1297-cameroun-la-loi-sur-la-protection-des-donnees-a-caractere-personnel-entre-en-vigueur-ce-23-juin-2026)

**Global examples.**

| Instrument | Jurisdiction | What it does |
|---|---|---|
| [GDPR Article 5(1)(e) - storage limitation](https://gdpr-info.eu/art-5-gdpr/) | European Union | Personal data must be kept in identifiable form no longer than necessary for the purposes of processing. |
| [GDPR Article 25 - data protection by design and by default](https://gdpr-info.eu/art-25-gdpr/) | European Union | Requires measures such as data minimisation by design, with only the data needed for each purpose processed and stored by default. |
| [EU AI Act Article 26(6)](https://artificialintelligenceact.eu/article/26/) | European Union | Deployers of high-risk systems keep automatically generated logs for at least six months, unless other Union or national law provides otherwise. This sets an explicit minimum and leaves the maximum to data-protection law. |

**Recommendation.** Issue guidance that classifies AI-assistant conversation content separately from connection/traffic metadata. It should mandate redaction of identifiers before storage and model calls, set a maximum retention for conversation content and a separate retention for integrity-protected audit records (hashes, verdicts, source IDs), and name the authority that arbitrates between the two regimes.

**ITU link.** [ITU-T X.1058 (02/2026), controls and guidance for PII protection](https://www.itu.int/rec/T-REC-X.1058/en) (PII controls applicable at the PP node.); [ITU-T Y.3172, PP and SINK nodes](https://www.itu.int/rec/T-REC-Y.3172/en) (Redaction at PP; retention at SINK.)

**To verify.** Article number of the retention / storage-limitation principle in Law No. 2024/017 (primary text not found online). Whether Section 29 of Law 2010/012 applies to AI-service providers as 'operators of information systems' (legal interpretation needed).

## GAP-04 — Unclear accountability when a public AI assistant gives wrong information

**Type:** unclear responsibilities, legislative. **Scenario:** S1, S4.

**Gap (domain level).** The rules do not say who is liable when a citizen relies on information from a government or public-interest AI assistant: the deploying administration, the model provider, or the citizen. They also do not say whether that information binds the administration and what remedy exists.

**Evidence from SONAH.** If SONAH served the outdated Art. 6(2) (S1), or one ministry's requirements in place of another's (S4), the citizen could act on wrong information. No Cameroonian text we reviewed assigns responsibility or gives information supplied by an administration any binding effect. Artefacts: `eval/questions.jsonl (items OUT-*, PRO-09, PRO-10)`.

**Observed context (Cameroon).**

- No national instrument on liability for automated or AI-provided public information was found. The national AI strategy presented in July 2025 has no published text. [source](https://camer.be/actualites/societe/le-cameroun-se-dote-dune-strategie-pour-lia-enjeux-et-perspectives-dun-tournant-numerique-cameroon.html)

**Global examples.**

| Instrument | Jurisdiction | What it does |
|---|---|---|
| [Moffatt v. Air Canada, 2024 BCCRT 149](https://www.mondaq.com/canada/new-technology/1427926/airline-ordered-to-compensate-a-bc-man-because-its-chatbot-provided-inaccurate-information) | Canada (British Columbia) | The tribunal held the company liable for negligent misrepresentation by its website chatbot and rejected the argument that the chatbot was a separate entity. |
| [NYC MyCity chatbot](https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law) | United States (New York City) | A city AI chatbot told businesses they could take actions that are illegal under city law (The Markup, 29 March 2024). The case shows the risk without a clear accountability regime. |
| [Opposability of published administrative positions (CRPA L312-3, ESSOC law 2018-727)](https://droit.cairn.info/article/RDP_101_1185/pdf?lang=fr) | France | A person may rely on a published interpretation by the administration, even an erroneous one, until it is changed. |

**Recommendation.** Define in law or policy that the deploying public body is accountable for information its AI assistant provides. The rule should state which outputs (if any) are opposable, require a logged trace for every answer so disputes can be resolved, and provide a correction and remedy channel.

**ITU link.** [ITU AI Ready Report 2.0, Dimension 10 - 'accountability of final decisions, which remains with humans' (p. 29)](https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf) (Policies for AI metric.)

**To verify.** Primary text of 2024 BCCRT 149 (tribunal site returned 403; secondary report used).

## GAP-05 — No continuity or service-level requirement for public AI services that depend on external models

**Type:** technology, standards. **Scenario:** S3.

**Gap (domain level).** Public AI assistants often call foreign commercial LLM APIs with quotas and outages beyond the deployer's control. No requirement sets minimum availability, a degraded mode, or what the service must do when the model is unavailable. The risk is a service that silently fails, or answers without its safeguards.

**Evidence from SONAH.** When no LLM key is configured, SONAH falls back to a deterministic extractive answer (apps/api/src/chat/chat.service.ts, extractiveReply). On branch feat/gemini, it also falls back when the model call fails. These behaviours are our own design; no external requirement exists. Artefacts: `apps/api/src/chat/chat.service.ts`, `apps/api/src/health/health.controller.ts`.

**Observed context (Cameroon).**

- Law No. 2010/012 gives ANTIC the regulation of electronic security activities (Section 7) but sets no availability or continuity requirement for public digital services. Our review covered only this law and 2010/013; this is a finding of absence. [source](https://database.cyberpolicyportal.org/api/files/166367990584329pspck8evk.pdf)

**Global examples.**

| Instrument | Jurisdiction | What it does |
|---|---|---|
| [GOV.UK Service Standard, point 14 'Operate a reliable service'](https://www.gov.uk/service-manual/service-standard/point-14-operate-a-reliable-service) | United Kingdom | Services must minimise downtime and have a plan for when it happens, deploy without significant downtime, and be monitored. |
| [ISO 22301:2019](https://www.sis.se/en/produkter/sociology-services-company-organization/company-organization-and-management/general/iso-223012019/) | International standard | Requirements for business continuity management systems (amended 2024). |
| [EU AI Act, Article 15(4)](https://artificialintelligenceact.eu/article/15/) | European Union | High-risk systems must be as resilient as possible to errors, faults and inconsistencies. Robustness may be achieved through technical redundancy, including backup or fail-safe plans. |

**Recommendation.** Require public AI information services to declare a degraded mode that keeps the policy safeguards (extractive, citation-only, or explicit unavailability). They should publish availability targets, avoid single-provider dependency for critical services, and report incidents.

**ITU link.** [ITU-T Y.3172, MLFO (model selection and reselection)](https://www.itu.int/rec/T-REC-Y.3172/en) (Orchestrator reselects the model based on performance or conditions.); [ITU AI Ready Report 2.0, Dimension 13 'Digital Infrastructure'](https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf) (Infrastructure readiness.)

**To verify.** Whether a Cameroonian public-service continuity instrument exists outside the two laws reviewed.

## GAP-06 — No equal-quality requirement for AI public services in both official languages

**Type:** standards, coordination. **Scenario:** Gold set (FR/EN pairs).

**Gap (domain level).** In bilingual or multilingual states, AI assistants are usually built and evaluated mostly in one language. Nothing requires answer quality, refusal behaviour and source coverage to be equivalent across official languages. Evaluating each language separately is not required either.

**Evidence from SONAH.** The indexed legal texts are French editions. English questions must be matched cross-lingually (the cybersecurity law is bilingual, with Sections in English and Articles in French). eval/run-eval.ts reports metrics per item, so FR/EN parity can be measured. Artefacts: `eval/questions.jsonl`, `eval/run-eval.ts`.

**Observed context (Cameroon).**

- Constitution Art. 1(3): English and French are the official languages, 'both languages having the same status'; the State guarantees the promotion of bilingualism. [source](https://www.constituteproject.org/constitution/Cameroon_2008)

**Global examples.**

| Instrument | Jurisdiction | What it does |
|---|---|---|
| [Official Languages Act, Part IV 'Communications with and Services to the Public'](https://laws-lois.justice.gc.ca/eng/acts/O-3.01/) | Canada | Sets the public's right to communicate with and receive services from federal institutions in either official language. |
| [Directive on Automated Decision-Making + Algorithmic Impact Assessment](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/automated-decision-making/algorithmic-impact-assessment.html) | Canada | Since 1 April 2019, federal automated decision systems require a mandatory impact assessment that assigns impact levels I-IV and the safeguards that go with them. |

**Recommendation.** Require per-language evaluation and reporting (retrieval, refusal and error rates) for public AI services, with parity thresholds across official languages, and official translations of key legal texts in machine-readable form.

**ITU link.** [ITU AI Ready Report 2.0, Dimension 6 'Human Interface' - 'Availability of AI models in the local language' (p. 24)](https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf) (Readiness metric.)

**To verify.** Exact wording of Official Languages Act ss. 21-22 (page timed out; only the Part IV title is cited).

## GAP-07 — No authoritative cross-ministry registry of administrative procedures

**Type:** coordination, unclear responsibilities. **Scenario:** S4.

**Gap (domain level).** Procedures that involve several authorities (commerce, health and hygiene, municipality, tax) are described separately by each one. There is no single authoritative, machine-readable record of requirements, order, fees and legal basis. When two authorities require conflicting steps, neither the citizen nor an AI assistant can tell which prevails or who arbitrates.

**Evidence from SONAH.** In gold items PRO-09/PRO-10, a citizen opening a restaurant gets requirements from different ministries in a conflicting order. SONAH's knowledge base contains no procedure texts, so the correct behaviour is CONFLICT_BETWEEN_TEXTS or REFER_TO_HUMAN, never a guessed order. The Neo4j graph (REQUIRES / PRECEDES / GOVERNED_BY) can represent a registry once one exists. Artefacts: `packages/rag/src/graph-store.service.ts`, `eval/questions.jsonl (items PRO-09, PRO-10)`.

**Observed context (Cameroon).**

- Business-creation one-stop centres (CFCE) and the mybusiness.cm electronic window exist. Step-by-step business-creation procedures are documented on eRegulations portals for Yaoundé, Douala and Garoua. [source](https://yaounde.eregulations.org/menu/1?l=fr)

**Global examples.**

| Instrument | Jurisdiction | What it does |
|---|---|---|
| [Single Digital Gateway Regulation (EU) 2018/1724](https://single-market-economy.ec.europa.eu/single-market/single-digital-gateway_en) | European Union | Your Europe is the single access point to information on and online access to procedures. Article 14 sets up the Once-Only Technical System (OOTS), live since December 2023. |
| [eesti.ee state portal](https://ria.ee/en/news/20-years-reliable-e-services) | Estonia | Single state portal since 2003, with personalised e-services and information articles in three languages, run by the Information System Authority (RIA). |

**Recommendation.** Create a single, authoritative, machine-readable procedure registry. Each step should carry its competent authority, legal basis, prerequisites, fees and deadlines. The registry needs a designated owner who resolves conflicts between authorities, and an API that AI assistants and portals must use instead of scraping.

**ITU link.** [ITU-T Y.3172, D node and SINK](https://www.itu.int/rec/T-REC-Y.3172/en) (Routing outputs to the competent authority (SINK).); [ITU AI Ready Report 2.0, Dimension 5 'Level of Integration of AI in Workflows' - interoperability gaps, standardized APIs (pp. 22-23)](https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf) (Standardised interfaces for workflow integration.)

**To verify.** Whether eRegulations Cameroon covers sector authorisations (e.g. hygiene/health certificates for restaurants) and their legal basis. Current status and official URL of mybusiness.cm (only secondary sources found).

## GAP-08 — No human-oversight, escalation and redress channel for citizen-facing AI

**Type:** unclear responsibilities, legislative. **Scenario:** S2, S4.

**Gap (domain level).** Where an AI assistant should hand over to a human (danger to the person, a dispute, a contested answer, a data-protection complaint), no rule designates the receiving authority or sets the escalation path, response time or the documentation the citizen receives to contest an answer.

**Evidence from SONAH.** SONAH's REFER_TO_HUMAN verdict (items PRO-11, PRO-12) and its planned authority agents (data-protection-authority, regulator-minpostel, ministry-business) need a real counterpart. The data-protection authority created by Law No. 2024/017 (Art. 53) was not yet operational, according to the secondary sources available. Artefacts: `docs/itu/y3172-pipeline.yaml (D, SINK)`, `eval/questions.jsonl (items PRO-11, PRO-12)`.

**Observed context (Cameroon).**

- Law No. 2024/017, Art. 53 creates the Autorité de protection des données à caractère personnel as an independent public body. [source](https://www.digitalbusiness.africa/cameroun-lautorite-de-protection-des-donnees-a-caractere-personnel-creee/)
- The implementing decree setting up the authority had not been adopted (secondary sources). [source](https://www.dlapiperdataprotection.com/?c=CM&t=law)

**Global examples.**

| Instrument | Jurisdiction | What it does |
|---|---|---|
| [EU AI Act, Article 14 (human oversight) and Article 26(2)](https://artificialintelligenceact.eu/article/14/) | European Union | High-risk systems must be effectively overseeable by natural persons, who can override or stop them. Deployers assign oversight to people with the necessary competence, training and authority. |
| [Council of Europe Framework Convention on AI (CETS No. 225)](https://www.coe.int/en/web/portal/-/council-of-europe-opens-first-ever-global-treaty-on-ai-for-signature) | Council of Europe and other signatories | Opened for signature on 5 September 2024. Chapter IV covers remedies and procedural safeguards, including information sufficient to contest decisions and complaints to competent authorities. |
| [UNESCO Recommendation on the Ethics of AI (2021)](https://www.unesco.org/en/artificial-intelligence/recommendation-ethics) | 193 UNESCO Member States | Principle of human oversight and determination: AI should not displace ultimate human responsibility and accountability. |
| [African Union Continental AI Strategy](https://au.int/en/documents/20240809/continental-artificial-intelligence-strategy) | African Union | Endorsed by the AU Executive Council (Accra, July 2024). It is the continental reference framework for responsible AI adoption. |

**Recommendation.** Designate, for each public AI service, the human escalation counterpart by category of issue (legal dispute, safety, data protection, procedure conflict). Define response times. Give citizens a trace reference (the traceId) that lets them contest an answer before the competent authority.

**ITU link.** [ITU AI Ready Report 2.0, Dimension 9 'Impacts of Humans in AI Integration' - decisions referred back to domain experts (p. 26)](https://www.itu.int/dms_pub/itu-t/opb/ai4g/T-AI4G-AI4GOOD-2025-6-PDF-E.pdf) (Human-in-the-loop readiness.)

**To verify.** Exact text of CETS 225 Articles 14-15 (treaty text fetch blocked; summary from Council of Europe pages and search snippets).
