# SONAH — 5-minute pitch outline

One idea per slide. Each judging criterion is named where it is answered.

| # | Time | Slide | Key message | Criterion |
|---|---|---|---|---|
| 1 | 0:00–0:30 | **Problem.** Public chatbots giving wrong legal information (Moffatt v. Air Canada 2024; NYC MyCity 2024) | A wrong legal answer is a public-service failure, and someone is liable for it. | — |
| 2 | 0:30–1:00 | **SONAH.** A bilingual citizen assistant answering from official texts, citing articles. Live demo link. | It answers with the article, or refuses with a reason. | Knowledge base quality |
| 3 | 1:00–1:45 | **Architecture = Y.3172.** SRC → C → PP → M → **P (blocking)** → D → SINK, with MLFO and a sandbox. Six typed verdicts. | Deterministic policy node: replayable, fails closed. | Alignment with ITU standards |
| 4 | 1:45–2:45 | **Four progressive errors.** S1 outdated law (1996 vs 2008), S2 personal data, S3 LLM outage, S4 conflicting ministries. Expected vs actual verdicts. | The agent behaves correctly under failure; each failure is scripted and measured. | Agent capability in error scenarios |
| 5 | 2:45–3:45 | **Eight domain-level gaps.** Consolidated machine-readable law; AI disclosure standard; retention conflict; accountability; continuity; language parity; procedure registry; escalation and redress. Each has verified global examples. | The scenarios reveal what policy must supply. These are domain gaps, not one country's to-do list. | Policy, strategy and standards gaps |
| 6 | 3:45–4:20 | **Audit and evidence.** traceId + hash-chained log; 100-item FR/EN gold set; Wilson CIs; "every figure ← its command"; Colab sandbox with no key | Anyone can re-run every number. | Auditability |
| 7 | 4:20–4:45 | **AI Readiness 2.0.** D10 AI & Policies (primary), D4, D6, D9 (partial); the other nine listed as not claimed, with reasons | We claim only what we can evidence. | Alignment with ITU standards |
| 8 | 4:45–5:00 | **Ask and close.** Open source repository; reuse the gap register and gate design for any public AI information service | Safe public AI needs both a gate in the code and these gaps closed in policy. | — |

## Backup slides (Q&A)

- Gate rules and the verdict decision order (`docs/itu/y3172-pipeline.yaml`).
- Gap register details and "to verify" items (`docs/itu/policy-gap-register.md`).
- Evaluation definitions and limits (`eval/README.md`): citation validity is measured from outside the API; the
  audit trace gives the exact retrieved set.
- Why no maturity level is claimed: Report 2.0 defines none.
