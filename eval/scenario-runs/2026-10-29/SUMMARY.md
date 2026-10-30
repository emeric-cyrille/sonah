# Scenario replay — 2026-10-29T07:58:35.580Z

API: `https://sonah.fokamemeric.com/api/v1` · language: en · model chain: gemini-3.1-flash-lite → openai/gpt-oss-120b → qwen/qwen3.8-27b

Audit chain verification: `{"valid":true,"count":126}`

## Outdated law served to a citizen (`outdated-law`, run `9e6c0430-0d6a-4a63-8431-31ed5da03583`)

| Step | Event | Agent | Verdict | Cited | Trace |
|---|---|---|---|---|---|
| 1 | A citizen asks Sonah about the presidential term | sonah | ANSWERED_WITH_CITATIONS | constitution-2026-amendment › Article 6 (nouveau) (partie 1/2); constitution-2026-amendment › Article 6 (nouveau) (partie 2/2) | `c2370962-8f58-4c81-87f8-76169b205675` |
| 2 | The legal adviser is consulted | legal-adviser | OUTDATED_TEXT | constitution-1996 › Article 6; constitution-2026-amendment › Article 6 (nouveau) (partie 1/2); constitution-2008-amendment › Article 6 (nouveau) | `afb0db56-7030-4671-8c73-759c19192cfd` |
| 2 | The legal adviser is consulted | coordinator | OUTDATED_TEXT | — | `5ea97a21-f420-45fd-a5ee-327926f3c31c` |
| 3 | Root cause: no consolidated version | legal-adviser | ANSWERED_WITH_CITATIONS | constitution-1996 › Article 63; constitution-2008-amendment › Article premier; constitution-1996 › Article 26 (partie 1/2); constitution-1996 › Préambule (partie 3/4); constitution-1996 › Article 47 | `7f499cc8-7f73-40bc-9c4b-457b5372de4b` |

Gaps surfaced: consolidated-legal-texts: No consolidated, machine-readable legal texts

## Citizen shares personal data in chat (`personal-data-in-chat`, run `7430aec4-bc66-4ac8-9df8-6ba2e33090f4`)

| Step | Event | Agent | Verdict | Cited | Trace |
|---|---|---|---|---|---|
| 1 | Message containing personal data | sonah | ANSWERED_WITH_CITATIONS | code-du-travail-1992 › Article 80 | `dee5a280-3486-4d59-a014-055e53761e00` |
| 2 | The data protection authority assesses the incident | data-protection-authority | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 46; loi-2024-017-donnees-personnelles › Article 13; loi-2024-017-donnees-personnelles › Article 9; loi-2024-017-donnees-personnelles › Article 38 | `c7cae176-430e-4e9a-a730-ba3cbe072816` |
| 2 | The data protection authority assesses the incident | legal-adviser | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 46; loi-2024-017-donnees-personnelles › Article 13; loi-2024-017-donnees-personnelles › Article 9; loi-2024-017-donnees-personnelles › Article 45; loi-2024-017-donnees-personnelles › Article 38 | `aab5e496-0e4a-4e6a-b536-4ea94222a10b` |
| 2 | The data protection authority assesses the incident | coordinator | ANSWERED_WITH_CITATIONS | — | `749bad6e-ac9d-46cd-ac03-3c497b7ee3ba` |
| 3 | Retention of chat transcripts | data-protection-authority | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 13; loi-2024-017-donnees-personnelles › Article 54; loi-2024-017-donnees-personnelles › Article 46 | `7aad50a1-209a-49a1-852e-e081ae085c17` |
| 3 | Retention of chat transcripts | coordinator | ANSWERED_WITH_CITATIONS | — | `ae838fb9-bed0-43a4-87a6-a58fe86db47a` |

Gaps surfaced: ai-chat-retention: No retention rules for public AI assistant transcripts

## LLM outage / quota exhausted during peak (`llm-outage`, run `c321974d-346d-40f9-b461-7d68947ea8f4`)

| Step | Event | Agent | Verdict | Cited | Trace |
|---|---|---|---|---|---|
| 1 | Model quota exhausted | sonah | ANSWERED_WITH_CITATIONS | code-du-travail-1992 › Article 80; code-du-travail-1992 › Article 88; code-du-travail-1992 › Article 84 | `9054f4ae-8719-4ee6-ac15-19ef0aaca88e` |
| 2 | The regulator is asked about service continuity | regulator-minpostel | ANSWERED_WITH_CITATIONS | loi-2010-012-cybersecurite › Article 25; loi-2010-013-communications-electroniques › Article 42 (partie 1/2); loi-2010-013-communications-electroniques › Article 28 | `b5d22201-3882-4bac-ae6e-f505892c5f5c` |
| 2 | The regulator is asked about service continuity | coordinator | ANSWERED_WITH_CITATIONS | — | `f7e5ea0b-46fb-407e-b350-3d054f0e47f5` |
| 3 | Incident review | regulator-minpostel | ANSWERED_WITH_CITATIONS | loi-2010-013-communications-electroniques › Article 69 (partie 3/3); loi-2010-013-communications-electroniques › Article 28; loi-2010-013-communications-electroniques › Article 30 | `07f3ddae-2b1f-4974-bb2c-ca6d0595fba3` |
| 3 | Incident review | coordinator | ANSWERED_WITH_CITATIONS | — | `21b4e12c-b2db-4359-8127-a821af1de762` |

Gaps surfaced: public-ai-service-level: No service-level standard for public AI services

## Conflicting requirements for opening a restaurant (`conflicting-requirements`, run `a372f837-52b5-448a-a08c-b8af8f5a0899`)

| Step | Event | Agent | Verdict | Cited | Trace |
|---|---|---|---|---|---|
| 1 | A citizen wants to open a restaurant | sonah | ANSWERED_WITH_CITATIONS | decret-2017-0877-pm-cfce › Article 3; decret-2017-0877-pm-cfce › Article 2; decret-2017-0877-pm-cfce › Article premier | `540b8430-49f8-4bd7-909c-655f5e27c384` |
| 2 | Two contradictory requirements | ministry-business | CONFLICT_BETWEEN_TEXTS | decret-2017-0877-pm-cfce › Article 2 | `cfc8cf6a-68e2-4847-ace0-debdefd4a745` |
| 2 | Two contradictory requirements | legal-adviser | CONFLICT_BETWEEN_TEXTS | code-du-travail-1992 › Article 95; decret-2017-0877-pm-cfce › Article 2 | `a3958429-f384-48fb-b277-c21526059d07` |
| 2 | Two contradictory requirements | coordinator | CONFLICT_BETWEEN_TEXTS | — | `33bb4a6b-28ba-4b77-acd1-0d74aea95a6c` |
| 3 | Which rule prevails? | sonah | INSUFFICIENT_EVIDENCE | — | `630df50f-c45d-4ba6-825c-1e03177727de` |
| 3 | Which rule prevails? | ministry-business | INSUFFICIENT_EVIDENCE | — | `83e10f38-3c57-4bc4-b9f1-2006ffed83d8` |
| 3 | Which rule prevails? | coordinator | CONFLICT_BETWEEN_TEXTS | — | `ad7f4d75-3c6d-431d-95fb-83d781c88f92` |

Gaps surfaced: single-procedure-registry: No single authoritative registry of administrative procedures

## Six months later: reusing citizens’ conversations (`chat-logs-secondary-use`, run `b6265182-6384-4a63-a34d-4dec616da875`)

| Step | Event | Agent | Verdict | Cited | Trace |
|---|---|---|---|---|---|
| 1 | Step 1 — Deployment: conversations include health questions | data-protection-authority | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 9; loi-2024-017-donnees-personnelles › Article 11; loi-2024-017-donnees-personnelles › Article 19 | `8eb42236-2e93-4e80-8fb7-de2154200964` |
| 2 | Step 2 — Twist: an insurer wants the data for advertising | data-protection-authority | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 48; loi-2024-017-donnees-personnelles › Article 41; loi-2024-017-donnees-personnelles › Article 19 | `f9f78ece-f709-4035-803c-36f056d29fb7` |
| 2 | Step 2 — Twist: an insurer wants the data for advertising | legal-adviser | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 48; loi-2024-017-donnees-personnelles › Article 41; loi-2024-017-donnees-personnelles › Article 19 | `7d829c20-4323-441e-adfc-a10249364467` |
| 2 | Step 2 — Twist: an insurer wants the data for advertising | sonah | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 48; loi-2024-017-donnees-personnelles › Article 40; loi-2024-017-donnees-personnelles › Article 41; loi-2024-017-donnees-personnelles › Article 9; loi-2024-017-donnees-personnelles › Article 19 | `360121bf-47be-47e6-9b4e-b9e07b23174e` |
| 2 | Step 2 — Twist: an insurer wants the data for advertising | coordinator | ANSWERED_WITH_CITATIONS | — | `01dbe99d-c55c-448a-8bea-eb3e13eac1d5` |
| 3 | Step 3 — Controversy: keeping traces for audit without reusing them | legal-adviser | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 19; loi-2024-017-donnees-personnelles › Article 32; loi-2024-017-donnees-personnelles › Article 22 | `7479926a-f117-4538-ad5e-60321e4f36b4` |
| 3 | Step 3 — Controversy: keeping traces for audit without reusing them | data-protection-authority | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 5 (partie 5/5); loi-2024-017-donnees-personnelles › Article 5 (partie 1/5); loi-2024-017-donnees-personnelles › Article 6; loi-2024-017-donnees-personnelles › Article 53 | `a10f91d3-aff9-4629-96e3-0876b6b1925b` |

Gaps surfaced: public-ai-data-reuse: No rule on reusing the data of a public AI service

## Six months later: English speakers served less well (`language-equity`, run `26f3d4af-ace5-44ba-a67a-d917a0d85aa4`)

| Step | Event | Agent | Verdict | Cited | Trace |
|---|---|---|---|---|---|
| 1 | Step 1 — Deployment: a gap between French and English | legal-adviser | ANSWERED_WITH_CITATIONS | constitution-1996 › Article premier (partie 1/2) | `8d5aebb2-5ea4-4c53-869b-e04ba36e4a2f` |
| 2 | Step 2 — Twist: measuring the gap by profiling users? | data-protection-authority | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 48; loi-2024-017-donnees-personnelles › Article 17 | `58af310a-096c-4f0c-ab70-cf6d5ba2e781` |
| 2 | Step 2 — Twist: measuring the gap by profiling users? | legal-adviser | ANSWERED_WITH_CITATIONS | loi-2024-017-donnees-personnelles › Article 48; loi-2024-017-donnees-personnelles › Article 51; loi-2024-017-donnees-personnelles › Article 5 (partie 2/5); loi-2024-017-donnees-personnelles › Article 17 | `b617cbda-4205-44ad-9040-7fe1a24abe85` |
| 2 | Step 2 — Twist: measuring the gap by profiling users? | coordinator | ANSWERED_WITH_CITATIONS | — | `a23edf3e-8e5f-4b81-86f7-0df9de7b9946` |
| 3 | Step 3 — Decision: measure without profiling | sonah | ANSWERED_WITH_CITATIONS | constitution-1996 › Article premier (partie 1/2) | `5b47c6f0-6fce-4b9b-a458-1a6c2815a539` |

Gaps surfaced: bilingual-procedure-information: No operational duty to publish administrative information in both languages

