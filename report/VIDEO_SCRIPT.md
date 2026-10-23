# SONAH — demo video script (6:45, hard limit 7:00)

Format: screen recording with voice-over (English), presenter on camera for the opening and closing.
On-screen numbers must come from committed `eval/results/` files or `sandbox/README.md`. Never type a figure
that is not in those files.

| # | Time | Scene (on screen) | Voice-over (English) |
|---|---|---|---|
| 1 | 0:00–0:30 | Presenter, then a headline montage of "chatbot gave wrong legal information" (Moffatt v. Air Canada 2024; The Markup on NYC MyCity, 2024) | "When a public chatbot gets the law wrong, a citizen loses a job, a deadline, or a business. Courts have already held companies liable for what their chatbots said. We built SONAH to show what a safe public legal assistant needs, and what is missing in policy for it to exist." |
| 2 | 0:30–1:10 | Live PWA at sonah.fokamemeric.com, in French | "SONAH answers Cameroonian citizens in French or English, only from official texts, citing the exact article." (see the FR excerpt below) |
| 3 | 1:10–2:00 | Y.3172 diagram (`docs/itu/y3172-mapping.md` Mermaid); highlight the P node in red | "SONAH is an ITU-T Y.3172 pipeline. Sources are official texts. Pre-processing splits them article by article. The model retrieves and drafts. Then the policy node decides. It is deterministic and blocking: no answer reaches the citizen without passing it. It returns one of six typed verdicts." |
| 4 | 2:00–2:50 | **S1 Outdated law**: ask "Combien de fois le Président peut-il être réélu ?"; show the `OUTDATED_TEXT` verdict and Article 6 with the 2008 amendment note; then the sandbox notebook trace for `OUT-01` | "Our copy of the 1996 Constitution says the mandate is renewable once. A 2008 law changed that. A normal chatbot would quote the old text with confidence. SONAH flags it as outdated. The deeper problem is a gap: there is no machine-readable, consolidated version of the law to check against." |
| 5 | 2:50–3:30 | **S2 Personal data**: message with synthetic ID and phone number; show the redacted audit record and the answer citing Labour Code Art. 74 and 139 | "Citizens overshare. SONAH redacts identifiers before the model sees them and before anything is stored. One law asks operators to keep traffic data for ten years, while data-protection law asks for minimal retention. We document that tension as a policy gap." |
| 6 | 3:30–4:10 | **S3 LLM outage**: restart the API without an LLM key; ask again; show the extractive answer and `/health/ready` in degraded state; eval run labelled `S3-llm-off` | "When the model provider fails or the quota runs out, SONAH keeps answering, quoting the articles verbatim. The policy node still applies. No public AI service should silently fail or drop its safeguards." |
| 7 | 4:10–4:50 | **S4 Conflicting ministries**: "Je veux ouvrir un restaurant à Yaoundé…"; show `CONFLICT_BETWEEN_TEXTS` / `REFER_TO_HUMAN` and the coordinator trace across ministry agents | "Commerce, health and the municipality each describe their own steps. When they conflict, SONAH does not guess an order. It says so and names who must decide. No authority owns the cross-ministry procedure. That is a coordination gap." |
| 8 | 4:50–5:40 | `docs/itu/policy-gap-register.md` summary table; scroll through the 8 gaps with their global examples | "Eight domain-level gaps, each traced to a scenario and paired with verified global practice: EUR-Lex and Légifrance consolidated data, EU AI Act Article 50, the EU Single Digital Gateway, the UK transparency standard, Canada's official-languages rules, UNESCO and the African Union on human oversight." |
| 9 | 5:40–6:20 | Terminal: `node --experimental-strip-types eval/run-eval.ts`; Markdown summary with Wilson CIs; then the Colab notebook τ sweep | "Every figure comes from a command. We use one hundred bilingual gold questions, Wilson confidence intervals, and a Colab sandbox that rebuilds the pipeline with no API key. It shows the trade-off the policy node controls." |
| 10 | 6:20–6:45 | Presenter; slide with the AI Readiness mapping (D10 primary, D4, D6, D9 partial; the rest marked "not claimed") and links | "We claim three readiness dimensions, AI & Policies first, and say plainly what we don't. SONAH is open source. Try it at sonah.fokamemeric.com." |

## FR excerpt (scene 2, subtitled in English)

> **Citoyen :** « Mon employeur peut-il me donner une amende comme sanction ? »
>
> **Sonah :** « Non. Le Code du travail interdit à l'employeur d'infliger des amendes. La seule sanction
> disciplinaire qui peut priver le travailleur de salaire est la mise à pied, et seulement si certaines conditions
> sont remplies [1]. Source : [1] Code du travail, Article 30. Verdict : réponse avec citations. »

*Subtitle:* "Can my employer fine me? — No. The Labour Code forbids employers from imposing fines; only a
suspension can deprive the worker of pay, under conditions [1]. Source: Labour Code, Article 30."

(Article 30(1)–(3) of Law No. 92/007, checked in `data/sources/code-du-travail-1992.pdf`. Record the reply live.
Do not script it; this excerpt is the expected content.)

## Recording checklist

- [ ] Scenario gates merged and deployed; the S1–S4 "Actual" columns are filled in the report from `eval/results/`.
- [ ] Synthetic personal data only (S2).
- [ ] Every on-screen number matches a committed result file.
- [ ] Total length ≤ 7:00; export at 1080p with English subtitles.
