# Sonah knowledge base — sources

Every text indexed by Sonah is declared in [`manifest.json`](manifest.json), validated by
[`manifest.schema.json`](manifest.schema.json) (JSON Schema) and by the zod loader in
`packages/rag/src/ingestion/sources.ts`. Each entry records the issuing body, French and English titles,
version and date, official URL, access date, **SHA-256 of the original document**, licence and redistribution
status, language, domain tags and ITU AI Readiness 2.0 dimensions.

Only texts downloaded from official or reputable hosts are listed. Nothing was typed or summarised by hand:
scanned originals were converted by OCR, and every correction applied to the extracted text is declared in the
manifest (`replacements`, `noisePatterns`) so it can be reviewed.

## Sources (accessed 23 October 2026)

| id (`doc_id`) | Text | Version / status | Lang. | Units indexed | Redistribution |
|---|---|---|---|---|---|
| `constitution-1996` (`CMR-PRC-CONSTITUTION-1996`) | Constitution, Law No. 96-06 of 18 January 1996 — [prc.cm](https://www.prc.cm/fr/multimedia/documents/6283-loi-n-96-06-du-18-01-1996-revision-constitution-1972-fr) | 1996 text, not consolidated; 10 articles flagged `amended` | FR | preamble + 69 articles | committed (OCR text) |
| `constitution-2008-amendment` (`CMR-PRC-LOI-2008-001`) | Law No. 2008/001 of 14 April 2008 amending the Constitution — [prc.cm](https://www.prc.cm/fr/multimedia/documents/6284-loi-n-2008-001-du-14-04-2008-modifian-constitution-1972-fr) | new wording of art. 6, 14, 15, 51, 53, 67 (6 and 53 rewritten again in 2026) | FR | 8 | committed (OCR text) |
| `constitution-2026-amendment` (`CMR-PRC-LOI-2026-002`) | Law No. 2026/002 of 14 April 2026 amending the Constitution (Vice-President) — [prc.cm](https://www.prc.cm/fr/actualites/actes/lois/8244-loi-n-2026-002-du-14-avril-2026-modifiant-et-completant-certaines-dispositions-de-la-constitution-du-02-juin-1972-modifiee-et-completee-par-la-loi-n-96-06-du-18-janvier-1996-et-la-loi-n-2008-001-du-14-avril-2008) | in force; new wording of art. 5, 6, 7, 10, 53, 66 | FR | 8 | committed (OCR text) |
| `constitution-1996-en`, `constitution-2008-amendment-en`, `constitution-2026-amendment-en` | Official English versions of the three texts above — [prc.cm](https://www.prc.cm/en/cameroon/constitution) | same lineage and statuses as French | EN | 69 + 8 + 8 | committed (OCR text) |
| `code-du-travail-1992` (`CMR-LOI-1992-007-CODE-TRAVAIL`) | Labour Code, Law No. 92/007 of 14 August 1992 — [FAOLEX](https://faolex.fao.org/docs/pdf/cmr198304.pdf) (Droit-Afrique edition) | 1992 text, not consolidated | FR | 177 | committed (PDF) |
| `labour-code-1992-en` (`CMR-LAW-1992-007-LABOUR-CODE-EN`) | Labour Code, English version — ILO NATLEX ([archived copy](https://web.archive.org/web/20220926103412/https://www.ilo.org/dyn/natlex/docs/WEBTEXT/31629/64867/E92CMR01.htm); NATLEX blocks automated downloads) | 1992 text | EN | 177 sections | fetched at seed time |
| `loi-2010-012-cybersecurite` | Law No. 2010/012 of 21 December 2010 on cybersecurity and cybercriminality — [ART](https://www.art.cm/sites/default/files/documents/Loi_2010-012_cybersecurite_cybercriminalite.pdf) | original text | FR | 97 | committed (PDF) |
| `loi-2010-013-communications-electroniques` | Law No. 2010/013 of 21 December 2010 governing electronic communications — [ART](https://www.art.cm/sites/default/files/documents/Loi_2010-013_communications_electroniques.pdf) | original text; 14 articles flagged `amended` | FR | 104 | committed (PDF) |
| `loi-2015-006-communications-electroniques` | Law No. 2015/006 of 20 April 2015 amending Law No. 2010/013 — [ART](https://www.art.cm/fr/reglementation/lois) | in force | FR | 16 | committed (PDF) |
| `loi-2024-017-donnees-personnelles` | Law No. 2024/017 of 23 December 2024 on personal data protection — [prc.cm](https://www.prc.cm/fr/actualites/actes/lois/7588-loi-n-2024-017-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-9) | in force; 18-month compliance period from promulgation (art. 73) | FR | 75 | committed (OCR text) |
| `loi-2024-016-etat-civil` | Law No. 2024/016 of 23 December 2024 on the civil status registration system — [prc.cm](https://www.prc.cm/fr/actualites/actes/lois/7589-loi-n-2024-016-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-10) | in force; replaces Ordinance No. 81-02 / Law No. 2011/011 for civil status (art. 129) | FR | 130 | committed (OCR text) |
| `decret-2017-0877-pm-cfce` | Decree No. 2017/0877/PM of 28 February 2017 (authentication of SARL articles at the CFCE) — [spm.gov.cm](https://spm.gov.cm/site/sites/default/files/PM%20%2822%29.pdf) | signed text | FR | visas + 6 | committed (OCR text) |
| `cameroun-numerique-2020` | Plan stratégique Cameroun numérique 2020 (MINPOSTEL, May 2016) — [Cyber Policy Portal](https://database.cyberpolicyportal.org/api/files/1663765272354m2yzhkaqkp.pdf) | expired plan (horizon 2020), advisory | FR | ~77 sections | fetched at seed time |
| `au-continental-ai-strategy-2024` | African Union Continental AI Strategy (July 2024) — [au.int](https://au.int/en/documents/20240809/continental-artificial-intelligence-strategy) | adopted July 2024, advisory | EN | ~47 sections | fetched at seed time |
| `unesco-ethics-ai-2021` | UNESCO Recommendation on the Ethics of AI (2021) — [UNESDOC](https://unesdoc.unesco.org/ark:/48223/pf0000381137) | adopted 23 Nov 2021, advisory | EN | preamble + 141 paragraphs | committed (PDF, CC BY-NC-SA 3.0 IGO) |
| `ocde-recommandation-ia` (`OECD-LEGAL-0449`) | OECD Recommendation of the Council on AI — [OECD](https://legalinstruments.oecd.org/fr/instruments/OECD-LEGAL-0449) | revised 3 May 2024, advisory | FR | 14 sections | committed (PDF, free unaltered redistribution) |
| `eu-ai-act-2024-1689` | Regulation (EU) 2024/1689 (AI Act) — [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=fr) | OJ version of 12 July 2024, not consolidated; recitals not indexed | FR | 113 articles + 13 annexes | fetched at seed time (Publications Office XHTML) |
| `itu-t-y3172` | ITU-T Y.3172 (06/2019), ML architectural framework — [itu.int](https://www.itu.int/rec/T-REC-Y.3172-201906-I/en) | in force | EN | not indexed | metadata only |

Counts are produced by `pnpm --filter @sonah/rag kb:report` and checked by `knowledge-base.spec.ts`.

**Licences.** Cameroonian legislative and regulatory texts are official acts published by the Presidency, the
Prime Minister's services or the telecom regulator (ART); they are redistributed here as convenience copies
(the authoritative version is the *Journal officiel*). The UNESCO PDF keeps its own CC BY-NC-SA 3.0 IGO licence
and is not covered by the repository's MIT licence. The OECD PDF may be redistributed free of charge if not
altered. Documents without an explicit redistribution licence (AU strategy, *Cameroun numérique 2020* mirror,
ILO NATLEX HTML) and the large EU Regulation are **not committed**: only their metadata and SHA-256 are, and the
seed downloads them into `data/sources/.cache/` (git-ignored), verifying the hash.

**OCR.** prc.cm and spm.gov.cm publish scanned certified copies. Their text was produced with Apple Vision
OCR (300 dpi) and committed as `*.ocr.txt` (pages separated by `=====PAGE=====`). Certification stamps are
removed by `noisePatterns`; the few recognition errors that broke the structure (roman numerals of titles,
article numbers) are fixed by explicit `replacements`. Each chunk carries `metadata.derivation`; check figures
against the official PDF before quoting them.

**Correction of the previous source.** The Constitution was previously indexed from a FAOLEX PDF. Comparison
with the official prc.cm copy showed that the FAOLEX copy omits Article 41 (Audit Bench), numbers the following
article 41 instead of 42, and gives an incomplete Law No. 2008/001 (Article 51 lacks its last two sentences).
It also ends with the 2008 law, which the previous chunker merged into Article 69. The official copies replace it.

## Legal status of each chunk

Every chunk stores `metadata.status`:

- `in_force` — the text as indexed is the current wording (for strategies and recommendations: current version);
- `amended` — a later text gives a new wording of this article (in whole or in part). `metadata.amendedBy`
  is the unit that replaced it, `metadata.currentVersion` the wording to cite, `metadata.amendmentHistory`
  every later wording and `metadata.amendedParagraphs` the paragraphs changed by the next text (empty: not
  specified or whole article). `metadata.note` repeats this in French for the chat prompt;
- `repealed` — the text was repealed (`metadata.repealedBy`).

Statuses are computed from `amends` / `repeals` declarations in the manifest. Example: Article 6 of the
Constitution (`constitution-1996:art-6`, "renouvelable une fois") → `amended`, amendedBy
`constitution-2008-amendment:art-6-nouveau` (also `amended`) → current wording
`constitution-2026-amendment:art-6-nouveau` (`in_force`). Seeding fails if a declared amended article cannot be
found, which guards against chunking regressions. Chunks also carry `version`, `date`, `docId`, `sourceId`,
`unitKey`, `binding`, `language`, `jurisdiction`, `domains`, `ituDimensions` and `page` / `pageEnd`.

## Commands

```bash
pnpm --filter @sonah/rag kb:fetch                 # re-download every original and verify its SHA-256
pnpm --filter @sonah/rag kb:fetch -- --cache      # same, and cache non-redistributable texts for the seed
scripts/fetch-sources.sh [--cache] [--strict]     # same from the repository root
pnpm --filter @sonah/rag kb:report [-- --show <id>] [-- --offline]   # counts, gaps, statuses (no database)
pnpm --filter @sonah/rag seed [-- --offline] [-- --source <id>]       # index into pgvector (+ Neo4j)
pnpm --filter @sonah/rag kb:export-itu            # export to data/itu-export (ITU AI Readiness layout)
```

Seeding is idempotent: chunk keys are stable (`<source>:art-<n>:<part>`, `<source>:art-<n>-nouveau:<part>`,
`<source>:p-<n>:<part>`, `<source>:s-<n>:<part>`) and chunks that no longer exist for a source are deleted.

## Not obtained

- **National AI strategy**: presented by MINPOSTEL in July 2025 according to the press, but no official text is
  published (checked minpostel.gov.cm, October 2026). This gap is itself relevant to the policy-gap analysis.
- **English versions** of Laws No. 2010/012, 2010/013 and 2024/017: no official English PDF found on prc.cm or
  art.cm (an English translation of 2010/012 exists on third-party portals only).
- **CFCE procedure**: the 2012 inter-ministerial circular on CFCE formalities was not found on an official host;
  only the 2017 decree is indexed.
- **ITU-T Y.3172**: freely downloadable from itu.int but cited by reference only (not redistributed).

## Adding a text

1. Download it into a new, empty directory and check it is the claimed official text.
2. Declare it in `manifest.json` (all required fields, `sha256` of the original, `chunking` mode, `amends`
   if it modifies another text). Commit the file only if its licence allows redistribution.
3. Run `kb:report -- --show <id>` until article counts match the text, then `pnpm --filter @sonah/rag test`.
