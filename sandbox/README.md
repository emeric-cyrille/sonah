# SONAH in the ITU AI for Good sandbox format

This folder follows the catalog layout of [CrashingGuru/Sandbox_Training](https://github.com/CrashingGuru/Sandbox_Training):
`agents/<slug>/{agent,metadata}` and `notebooks/<slug>/{notebook,metadata}`. The `metadata.yaml` files validate
against that repository's `schema/agent.metadata.schema.json` and `schema/notebook.metadata.schema.json`
(JSON Schema draft-07; slug = folder name).

| Item | Path | What it is |
|---|---|---|
| Agent | `agents/sonah-legal-agent/agent/agent.py` | `SonahLegalAgent(embedder, llm, kb_docs, tau, k)`: tools `retrieve` / `answer` / `refuse`, `run(question, options)`, and `self.log` recording every tool call and policy decision. Its blocking P node returns typed verdicts. `SonahHTTPBackend` calls a running SONAH API. Requires only numpy. |
| Notebook | `notebooks/sonah-agentic-rag-reference/notebook/SONAH_Agentic_RAG.ipynb` | Colab-runnable with no API key. It downloads the FAOLEX texts, chunks them by article, retrieves with TF-IDF (or optionally a multilingual embedder) and runs the agent. It reports answered / refused / accuracy-on-answered / recall@k with Wilson 95% CIs, a τ sweep and tool traces. Sections 2.1.1, 2.1.3, 2.1.4, 2.1.7 and 2.1.8 follow the L1 template. |
| `refresh_metadata.py` | | Recomputes `bytes` and `sha256` in the metadata after an edit. `--check` exits non-zero when a hash is stale. |

## Reproduce

```bash
# Colab: open the badge at the top of the notebook and choose Runtime > Run all.
# Locally, using the repository's PDFs instead of downloading them:
pip install pypdf scikit-learn numpy nbclient ipykernel
SONAH_PDF_DIR=$PWD/data/sources jupyter nbconvert --to notebook --execute \
  sandbox/notebooks/sonah-agentic-rag-reference/notebook/SONAH_Agentic_RAG.ipynb --output /tmp/sonah_run.ipynb
python3 sandbox/refresh_metadata.py --check
```

## Reference run (local, 2026-10-23)

Configuration: TF-IDF character 3–5-grams, τ = 0.20, k = 3, extractive (no LLM). The run covers the 75 gold items
from `eval/questions.jsonl` whose sources are the two FAOLEX texts, plus the expected refusals.

| Metric | Value | Wilson 95% CI |
|---|---|---|
| answered | 31/75 | [0.31, 0.53] |
| refused (typed verdict) | 44/75 | [0.47, 0.69] |
| accuracy on answered (answerable items) | 26/30 = 0.87 | [0.70, 0.95] |
| recall@3 | 35/55 = 0.64 | [0.50, 0.75] |
| refusal accuracy (expected refusals) | 21/22 = 0.95 | [0.78, 0.99] |
| verdict accuracy (all, incl. S1) | 41/75 = 0.55 | [0.43, 0.65] |

How to read these numbers:

- The baseline is lexical and gives up on English questions over French texts. Per-language results are printed
  in §10 of the notebook. Set `USE_NEURAL = True` for cross-lingual retrieval.
- "Accuracy on answered" credits an answer when any of its k citations is the expected article.
- The τ sweep (§11) shows the trade-off the P node controls: higher τ means fewer answers and more accurate ones.
- The S1 item `OUT-01` returns `OUTDATED_TEXT`, because Article 6 is flagged as amended by Law No. 2008/001.
- Prototype accuracy is not a judging criterion. These figures show a reproducible measurement, not a
  performance claim.

## Contributing upstream

```bash
python scripts/add_agent.py --slug sonah-legal-agent --name "SONAH Legal Information Agent" \
  --agent <path>/agent.py --framework "custom (retrieve / answer / refuse) + deterministic policy gate" \
  --tools retrieve,answer,refuse --notebook sonah-agentic-rag-reference ...
python scripts/add_notebook.py --slug sonah-agentic-rag-reference --notebook <path>/SONAH_Agentic_RAG.ipynb ...
```
