# Datasheet for the SONAH knowledge base

This datasheet follows the "Datasheets for Datasets" questions (motivation, composition, collection, preprocessing,
uses, distribution, maintenance) for the corpus that SONAH retrieves from. Every figure below comes from the
repository: `data/sources/manifest.json`, `data/procedures/*.json` and the offline chunker
(`pnpm --filter @sonah/rag kb:report`), run on 29 October 2026.

## 1. Purpose

SONAH answers Cameroonian citizens' legal and administrative questions in French and English. Its knowledge base
has two parts:

- **Reference texts** (`data/sources/`): Cameroonian legislation and regulations, the national digital strategy,
  and international or African AI policy instruments. They let SONAH cite the article it relies on, and they support
  the AI-policy gap analysis (what Cameroon has, compared with continental and international references).
- **Procedure sheets** (`data/procedures/`): structured, sourced descriptions of 26 everyday procedures (identity
  card, birth certificate, business registration…). They answer "how do I…" questions with steps, documents, costs
  and offices.

The corpus is meant for retrieval and citation. It is not a training set and is not used to fine-tune a model.

## 2. Composition

### 2.1 Reference texts (26 manifest entries)

25 texts are indexed; one (`itu-t-y3172`) is listed for metadata only. Together they produce **2,057 chunks**:
1,691 for the 19 texts indexed before 29 October 2026 and 366 for the six AI policy references added on 29 October 2026.

Columns: **Type** is the manifest `type`; **Jur.** the `jurisdiction` (CM Cameroon, AU African Union, EU, INT
international, or a country code); **Bind.** `binding` or `advisory`; **Lang.** the language indexed; **Status**
summarises the legal statuses computed from `amends` declarations (see section 4.4); **Redistr.** says whether the
original is committed (`redistributable`), downloaded at indexing time and checked against its SHA-256
(`fetch-only`), or not indexed (`metadata-only`).

| id | Issuing body | Type | Jur. | Bind. | Lang. | Version / date | Status | Licence / Redistr. | Chunks |
|---|---|---|---|---|---|---|---|---|---|
| `constitution-1996` | Presidency of the Republic (National Assembly) | CONSTITUTION | CM | binding | fr | Law No. 96-06, 1996-01-18; certified copy, not consolidated | 10 articles `amended` | Official act, convenience copy (OCR text) / redistributable | 77 |
| `constitution-2008-amendment` | Presidency of the Republic | CONSTITUTION | CM | binding | fr | Law No. 2008/001, 2008-04-14 | 2 new wordings later `amended` (2026) | Official act (OCR text) / redistributable | 8 |
| `constitution-2026-amendment` | Presidency of the Republic (Parliament in Congress) | CONSTITUTION | CM | binding | fr | Law No. 2026/002, 2026-04-14 | in force | Official act (OCR text) / redistributable | 9 |
| `constitution-1996-en` | Presidency of the Republic | CONSTITUTION | CM | binding | en | 1996 English text, certified copy | 10 articles `amended` | Official act (OCR text) / redistributable | 75 |
| `constitution-2008-amendment-en` | Presidency of the Republic | CONSTITUTION | CM | binding | en | Law No. 2008/001, English | 2 new wordings later `amended` | Official act (OCR text) / redistributable | 8 |
| `constitution-2026-amendment-en` | Presidency of the Republic | CONSTITUTION | CM | binding | en | Law No. 2026/002, English | in force | Official act (OCR text) / redistributable | 9 |
| `code-du-travail-1992` | National Assembly (Droit-Afrique edition via FAOLEX) | LAW | CM | binding | fr | Law No. 92/007, 1992-08-14, not consolidated | in force as indexed | Official act / redistributable (PDF) | 179 |
| `labour-code-1992-en` | National Assembly (ILO NATLEX English version) | LAW | CM | binding | en | 1992 text, archived NATLEX page | in force as indexed | Not redistributed / fetch-only | 181 |
| `loi-2010-012-cybersecurite` | Presidency; published by the telecom regulator (ART) | LAW | CM | binding | fr | Law No. 2010/012, 2010-12-21 | in force as indexed | Official act / redistributable (PDF) | 109 |
| `loi-2010-013-communications-electroniques` | Presidency; published by ART | LAW | CM | binding | fr | Law No. 2010/013, 2010-12-21 | 14 articles `amended` by Law No. 2015/006 | Official act / redistributable (PDF) | 123 |
| `loi-2015-006-communications-electroniques` | Presidency; published by ART | LAW | CM | binding | fr | Law No. 2015/006, 2015-04-20 | in force | Official act / redistributable (PDF) | 20 |
| `loi-2024-017-donnees-personnelles` | Presidency of the Republic (Parliament) | LAW | CM | binding | fr | Law No. 2024/017, 2024-12-23 | in force (18-month compliance period, art. 73) | Official act (OCR text) / redistributable | 80 |
| `loi-2024-016-etat-civil` | Presidency of the Republic (Parliament) | LAW | CM | binding | fr | Law No. 2024/016, 2024-12-23 | in force | Official act (OCR text) / redistributable | 134 |
| `decret-2017-0877-pm-cfce` | Prime Minister's Services | DECREE | CM | binding | fr | Decree No. 2017/0877/PM, 2017-02-28 | in force as indexed | Official act (OCR text) / redistributable | 7 |
| `cameroun-numerique-2020` | Ministry of Posts and Telecommunications (MINPOSTEL) | STRATEGY | CM | advisory | fr | May 2016 edition, horizon 2020 (expired) | expired plan | Terms not stated (Cyber Policy Portal mirror) / fetch-only | 101 |
| `au-continental-ai-strategy-2024` | African Union Commission | INTERNATIONAL | AU | advisory | en | Adopted July 2024 (Executive Council, Accra) | current | © African Union, no open licence / fetch-only | 115 |
| `unesco-ethics-ai-2021` | UNESCO General Conference | INTERNATIONAL | INT | advisory | en | Adopted 2021-11-23 | current | CC BY-NC-SA 3.0 IGO / redistributable (PDF) | 152 |
| `ocde-recommandation-ia` | OECD Council | INTERNATIONAL | INT | advisory | fr | OECD/LEGAL/0449, revised 2024-05-03 | current | Free unaltered redistribution / redistributable (PDF) | 16 |
| `eu-ai-act-2024-1689` | European Parliament and Council | INTERNATIONAL | EU | binding | fr | Regulation (EU) 2024/1689, OJ of 2024-07-12, not consolidated | as published | EUR-Lex reuse with attribution; not committed (size) / fetch-only | 288 |
| `itu-ai-ready-report-2-0` | International Telecommunication Union (ITU-T, AI for Good) | INTERNATIONAL | INT | advisory | en | Report 2.0, January 2026 | current | © ITU, no open licence / fetch-only | 81 |
| `rwanda-national-ai-policy-2023` | Ministry of ICT and Innovation (MINICT), Rwanda | INTERNATIONAL | RW | advisory | en | Approved by Cabinet April 2023 (document marked "MINICT - 2022") | current | No terms stated / fetch-only | 22 |
| `nigeria-national-ai-strategy-2025` | Federal Ministry of Communication, Innovation and Digital Economy, with NITDA and NCAIR | INTERNATIONAL | NG | advisory | en | September 2025 edition | current | No terms stated / fetch-only | 113 |
| `smart-africa-ai-blueprint-2021` | Smart Africa Secretariat | INTERNATIONAL | AU | advisory | en | First Edition, 2021 | current | © 2021 Smart Africa, no open licence / fetch-only | 86 |
| `africa-declaration-ai-kigali-2025` | Global AI Summit on Africa: AU, Smart Africa and African States (Cameroon among signatories) | INTERNATIONAL | AU | advisory | en (+ fr column) | Signed in Kigali, 2025-04-04 | current | No terms stated / fetch-only | 27 |
| `singapore-mgf-genai-2024` | IMDA and AI Verify Foundation, Singapore | INTERNATIONAL | SG | advisory | en | Released 2024-05-30 | current | © IMDA and AI Verify Foundation, all rights reserved / fetch-only | 37 |
| `itu-t-y3172` | ITU-T Study Group 13 | INTERNATIONAL | INT | advisory | en | Y.3172 (06/2019) | in force | © ITU / metadata-only | 0 |

By jurisdiction: 15 Cameroonian entries (14 binding texts and 1 expired strategy), 3 continental African (AU strategy,
Smart Africa blueprint, Kigali Declaration), 2 other African national policies (Rwanda, Nigeria), 1 EU, 1 Singapore
and 4 international (UNESCO, OECD, two ITU documents). By language: 13 French and 13 English entries (the Kigali
Declaration also contains the French text). By binding force: 15 binding (14 Cameroonian texts and the EU AI Act),
11 advisory.

Every entry also records `titleFr` / `titleEn`, `domains` tags, `accessedAt`, `ituDimensions` and `ituFolder`
(`AI_Strategies` for all entries except the CFCE decree and ITU-T Y.3172, filed under `AI_Use_Cases`). Exact wording of each licence
is in the `license` field of the manifest.

### 2.2 Procedure sheets (26)

- **Count and coverage**: 26 sheets in 11 categories (état civil 6, identité 5, fiscalité 3, justice 2, entreprise 2,
  social 2, transport 2, élections 1, éducation 1, santé 1, autre 1). Content is in French; `title_en` and
  `keywords_en` exist for retrieval.
- **Schema**: one JSON file per procedure, validated by `data/procedures/procedure.schema.json` (JSON Schema
  2020-12) and by the zod loader in `packages/rag/src/procedures/schema.ts`. Required fields: `id`, `title_fr`,
  `title_en`, `category`, `keywords_fr`, `keywords_en`, `authority`, `where`, `who_can_apply`, `documents`, `steps`,
  `cost`, `delay`, `validity`, `legal_basis`, `tips`, `sources`, `verified_at`, `unverified`, `language_versions`.
- **Verification date**: `verified_at` (ISO date). All 26 sheets carry `2026-10-23`.
- **How sources are attached**: each sheet lists its `sources` (title, URL, publisher, `official` flag). Factual
  items carry `source_refs`, 0-based indexes into that list. `legal_basis[].sourceId` links to a manifest entry when
  the text is in the corpus: 19 of 50 legal-basis items do so (15 to `loi-2024-016-etat-civil`, 3 to
  `code-du-travail-1992`, 1 to `decret-2017-0877-pm-cfce`); the other 31 cite texts not in the corpus (`null`).
  60 of the 86 cited sources are flagged `official`.
- **Uncertainty**: anything that could not be confirmed from an official source is `null` and explained in
  `unverified`. All 26 sheets have at least one `unverified` entry; 22 list the cost (or its amount) as unverified,
  and 16 have no fixed amount (`cost.amount_fcfa` is `null`).
- Each sheet is indexed as one document of type PROCEDURE (`packages/rag/src/procedures/seed-procedures.ts`).

## 3. Collection process

- **Official sources only.** Each reference text was downloaded from its publisher (Presidency `prc.cm`, Prime
  Minister's Services `spm.gov.cm`, telecom regulator `art.cm`, ministries, AU, UNESCO, OECD, EUR-Lex, ITU, national
  ministries and agencies). Where the official host could not be used, the manifest says so: the English Labour
  Code comes from an archived ILO NATLEX page (NATLEX blocks automated downloads), *Cameroun numérique 2020* from the
  Cyber Policy Portal, and the ITU AI Ready report is fetched from the byte-identical copy in the ITU AI Readiness
  reference repository because itu.int rejects automated requests (the `url` field still points to itu.int).
- **Integrity.** Every downloaded original has its `sha256` recorded. `kb:fetch` (or `scripts/fetch-sources.sh`)
  re-downloads all originals and compares hashes; the seed refuses a fetch-only text whose hash changed. For
  committed PDFs, `manifest.spec.ts` recomputes the hash.
- **Access date.** `accessedAt` is 2026-10-23 for the first 20 entries and 2026-10-29 for the six AI policy
  references.
- **Selection.** Cameroonian texts cover the questions SONAH handles (constitution, labour, digital and personal
  data, civil status, business creation). International texts were chosen for the AI-policy gap analysis, following
  the ITU AI Readiness reference set (`AI_Strategies` folder of github.com/CrashingGuru/ITUAIReadiness): continental
  instruments (AU strategy, Smart Africa blueprint, Kigali Declaration), African national policies (Rwanda, Nigeria),
  global norms (UNESCO, OECD, EU AI Act), a generative-AI governance framework (Singapore) and the ITU AI Readiness
  framework itself.
- **Redistribution.** Only texts whose terms allow it are committed (Cameroonian official acts as convenience copies,
  UNESCO under CC BY-NC-SA 3.0 IGO, OECD unaltered). All other originals are downloaded into the git-ignored
  `data/sources/.cache/` at seed time; the repository holds only their metadata and hash.

## 4. Preprocessing

### 4.1 Text extraction and OCR

- Born-digital PDFs are extracted with `pdf-parse`, page by page (`packages/rag/src/ingestion/pdf.ts`); HTML sources
  (EUR-Lex, NATLEX) are converted to text (`html.ts`).
- Scanned certified copies from prc.cm and spm.gov.cm were converted with Apple Vision OCR at 300 dpi and committed as
  `*.ocr.txt` (9 files), with a `derivation` note in the manifest. Each chunk carries `metadata.derivation`.

### 4.2 Cleaning

- `noisePatterns` (per-line regular expressions) remove running headers, footers, page numbers, certification stamps
  and chapter title pages.
- `replacements` fix extraction defects explicitly and reviewably: OCR errors in article numbers, ligatures that two
  PDFs (Rwanda, Nigeria) encode as control characters (restored to "ff"/"ffi"), a replacement character in the ITU
  report, repeated running footers (Singapore), a signatory list (Kigali Declaration).
- `segment.start` / `segment.end` keep only the body of the text, dropping covers, tables of contents, contributor
  lists, acronym lists and references. Hyphenated line breaks are re-joined (`text-normalizer.ts`).

### 4.3 Chunking

`packages/rag/src/chunking/legal-chunker.ts`, configured per text by `chunking`:

- `articles`: one unit per article (French "Article 12.-", English "Section 12:", or EU "Article 12" on its own line),
  with the title / chapter / section path; used for all binding texts.
- `numbered-paragraphs`: one unit per numbered paragraph (UNESCO Recommendation).
- `sections`: one unit per heading matched by `unitPatterns` (strategies, reports, declarations).

Units longer than `maxChars` (1,800 by default; 1,200 for the Kigali Declaration) are split at paragraph, then sentence
boundaries. Sections shorter than 200 characters are merged into the previous one. Chunk keys are stable
(`<source>:art-<n>:<part>`, `<source>:s-<n>:<part>`…), so re-seeding is idempotent. Each chunk keeps `pageStart` /
`pageEnd` in the original document.

### 4.4 Legal status

`amends` / `repeals` declarations in the manifest are turned into a per-chunk `status` (`in_force`, `amended`,
`repealed`) with `amendedBy`, `currentVersion` and `amendmentHistory`. Example: Article 6 of the 1996 Constitution is
`amended`, rewritten in 2008 (itself `amended`) and again in 2026 (`in_force`). Seeding fails if a declared amended
article cannot be found. Status counts are those shown in section 2.1.

### 4.5 Checks

`manifest.spec.ts` validates the manifest against the JSON Schema and the zod schema, checks unique ids and the hash
of committed PDFs, and forbids committing a non-redistributable file. `knowledge-base.spec.ts` checks article counts,
key uniqueness, statuses and page numbers on the committed texts. Fetch-only texts were checked with `kb:report` (unit
and chunk counts, no leftover control characters, no duplicate keys).

## 5. Known gaps and limitations

- **Missing Cameroonian law.** No OHADA Uniform Acts (business law applicable in Cameroon), no Penal Code, no Code of
  Civil Procedure, no finance laws. Answers in these areas can only rely on procedure sheets or general knowledge.
- **No national AI strategy.** No official Cameroonian AI strategy text was found (checked minpostel.gov.cm, October
  2026); the only national strategy indexed (*Cameroun numérique 2020*) expired in 2020. This gap is itself a finding
  of the policy-gap analysis.
- **Not consolidated.** Cameroonian texts are indexed as published, not consolidated; amendments are handled through
  status metadata only for the texts whose amending law is in the corpus (Constitution, Law No. 2010/013).
- **Language imbalance.** English versions exist for the Constitution and the Labour Code only; no official English
  text of Laws No. 2010/012, 2010/013 or 2024/017 was found.
- **OCR.** Nine texts come from OCR; figures should be checked against the official PDF before being quoted.
- **Layout artefacts in fetched references.** The Rwanda policy is a graphic summary whose implementation tables are
  flattened and some headings follow their text; the Kigali Declaration is a two-column EN/FR layout, so a few lines
  at page breaks are attached to the item in the other language; Nigeria's infographic pages are flattened.
- **Procedure costs.** 22 of 26 sheets list the cost as unverified and 16 have no fixed amount; fees change with each
  finance law.
- **Availability.** Fetch-only texts depend on the publisher's site staying online and unchanged; a changed file is
  rejected by its hash and must be re-reviewed.
- **Not obtained.** Kenya's final National AI Strategy 2025–2030 (only the implementation roadmap and a draft policy
  are on ict.go.ke; the reference-repository copy cannot be parsed); the 2012 inter-ministerial CFCE circular.

## 6. Maintenance

- **Adding or updating a text** (`data/sources/README.md`, "Adding a text"): download it into an empty directory,
  check it is the official text, declare it in `manifest.json` with its hash, `accessedAt`, licence and chunking
  settings, commit the file only if its licence allows it, then run `kb:report -- --show <id>` until the units match
  the document, and the `@sonah/rag` tests.
- **Amendments**: a new amending law is added with an `amends` block; statuses of the base text are recomputed at the
  next seed.
- **Link and hash monitoring**: `scripts/fetch-sources.sh --strict` re-downloads every original and fails on an
  unreachable source or a changed hash.
- **Procedure sheets**: re-check `unverified` entries and costs after each finance law, and update `verified_at`.
- **Re-indexing**: `pnpm --filter @sonah/rag seed` is idempotent and deletes chunks that no longer exist;
  `kb:export-itu` regenerates `data/itu-export/` in the ITU reference layout.

## 7. Mapping to ITU AI Readiness 2.0 dimensions

The 13 dimensions come from the ITU report *AI Ready – Analysis Towards a Standardized Readiness Framework*, Report
2.0 (indexed as `itu-ai-ready-report-2-0`). The table lists, for each dimension, the entries whose `ituDimensions`
include it. The ITU report itself defines all 13 and is omitted from the rows.

| Dimension | Documents |
|---|---|
| Data/model marketplace (`data_marketplace`) | Law 2024/017 (personal data), Law 2024/016 (civil status), Rwanda policy, Kigali Declaration |
| Generated content marketplace (`generated_content`) | EU AI Act, Singapore GenAI framework |
| Cross-domain correlation (`cross_domain`) | ITU-T Y.3172 |
| Contextualization and regional impact (`contextualization`) | AU strategy, Smart Africa blueprint |
| Integration of AI in workflows (`ai_integration`) | Law 2024/016, CFCE decree, ITU-T Y.3172 |
| Human interface (`human_interface`) | EU AI Act |
| Strategy alignment (`strategy_alignment`) | Cameroun numérique 2020, AU strategy, OECD Recommendation, Rwanda, Nigeria, Smart Africa, Kigali Declaration |
| Collaboration (`collaboration`) | OECD Recommendation, Nigeria, Smart Africa, Kigali Declaration, Singapore |
| Impact of humans in AI integration (`human_impact`) | Constitution 1996 (FR/EN), Labour Code (FR/EN), Law 2010/012, Law 2024/017, UNESCO, Rwanda, Singapore |
| AI and policies (`ai_policies`) | Constitution and amendments (FR/EN), Laws 2010/012, 2010/013, 2015/006, 2024/017, AU strategy, UNESCO, OECD, EU AI Act, Rwanda, Nigeria, Smart Africa, Kigali Declaration, Singapore |
| AI for inclusion (`ai_inclusion`) | Labour Code (FR/EN), Cameroun numérique 2020, AU strategy, UNESCO, Nigeria |
| Granular priorities (`granular_priorities`) | CFCE decree, Smart Africa blueprint |
| Digital infrastructure (`digital_infrastructure`) | Laws 2010/012, 2010/013, 2015/006, 2024/016, Cameroun numérique 2020, Rwanda, Nigeria, Kigali Declaration, ITU-T Y.3172 |

Weakly covered dimensions (`cross_domain`, `human_interface`, `generated_content`) are also gaps in the Cameroonian
corpus itself: no Cameroonian text addresses them.
