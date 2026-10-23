"""SonahLegalAgent - citizen legal-information agent with a blocking policy (P) node.

Packaged, reusable definition in the ITU AI for Good Sandbox_Training agent format
(same contract as TelecomRAGAgent: injected embedder and llm, tools
retrieve / answer / refuse, `run()`, and `self.log` of every tool call).

It works in two modes:

* local   - retrieval over an exported corpus of legal articles (`kb_docs`), with
            any embedder exposing `.encode(list[str], normalize_embeddings=True)`;
* remote  - `SonahHTTPBackend` calls a running SONAH API (POST /search, /chat).

The P node (ITU-T Y.3172) is blocking and deterministic: an answer is only
returned with the verdict ANSWERED_WITH_CITATIONS when the best retrieval
similarity is >= tau AND every citation belongs to the retrieved set. Otherwise
the agent refuses with a typed verdict:

    INSUFFICIENT_EVIDENCE   best similarity below tau, or no valid citation
    OUTDATED_TEXT           a cited article is flagged as amended (amended_by)
    OUT_OF_SCOPE            the caller marks the request out of the legal domain

Only numpy is required. The llm is optional: without it the agent answers
extractively (quotes the retrieved articles), which is also SONAH's behaviour
when its language model is unavailable (scenario S3).
"""
from __future__ import annotations

import json
import re
import urllib.request
from typing import Any, Callable, Iterable

import numpy as np

VERDICTS = (
    "ANSWERED_WITH_CITATIONS",
    "INSUFFICIENT_EVIDENCE",
    "CONFLICT_BETWEEN_TEXTS",
    "OUTDATED_TEXT",
    "REFER_TO_HUMAN",
    "OUT_OF_SCOPE",
)


def _as_doc(doc: Any, index: int) -> dict:
    """Accept plain strings or dicts {text, sourceId, reference, amended_by?}."""
    if isinstance(doc, str):
        return {"text": doc, "sourceId": "kb", "reference": f"doc-{index}"}
    out = dict(doc)
    out.setdefault("sourceId", "kb")
    out.setdefault("reference", f"doc-{index}")
    return out


class SonahLegalAgent:
    """Retrieve legal articles, then answer with citations or refuse with a typed verdict.

    Parameters
    ----------
    embedder : object with .encode(list[str], normalize_embeddings=bool) -> np.ndarray
    llm      : optional callable(prompt, max_new_tokens=int) -> [{"generated_text": str}]
    kb_docs  : list[str | dict]  articles; dicts may carry sourceId, reference, amended_by
    tau      : float  P-node threshold: refuse when the best cosine similarity is below it
    k        : int    number of articles retrieved
    """

    def __init__(self, embedder, llm, kb_docs: Iterable[Any], tau: float = 0.25, k: int = 3):
        self.embedder = embedder
        self.llm = llm
        self.kb_docs = [_as_doc(d, i) for i, d in enumerate(kb_docs)]
        self.tau = tau
        self.k = k
        self.kb_emb = np.asarray(
            embedder.encode([d["text"] for d in self.kb_docs], normalize_embeddings=True))
        self.log: list[tuple] = []

    # -- tools ------------------------------------------------------------- #
    def retrieve(self, query: str, k: int | None = None):
        """Return the top-k documents (with score) and the best similarity."""
        k = k or self.k
        q = np.asarray(self.embedder.encode([query], normalize_embeddings=True))[0]
        sims = self.kb_emb @ q
        top = np.argsort(sims)[::-1][:k]
        hits = [dict(self.kb_docs[i], score=float(sims[i])) for i in top]
        conf = float(sims[top[0]]) if len(top) else 0.0
        self.log.append(("retrieve", round(conf, 3), [h["reference"] for h in hits]))
        return hits, conf

    def answer(self, question: str, hits: list[dict]):
        """Draft an answer citing [n] markers; extractive when no llm is injected."""
        if self.llm is None:
            text = "\n".join(
                f"[{n}] {h['reference']}: {h['text'][:280].strip()}" for n, h in enumerate(hits, 1))
            cited = list(range(1, len(hits) + 1))
        else:
            context = "\n\n".join(f"[{n}] {h['reference']}\n{h['text']}" for n, h in enumerate(hits, 1))
            prompt = ("Answer the citizen's question using ONLY the numbered legal extracts. "
                      "Cite them as [n]. If they do not contain the answer, say so.\n\n"
                      f"Extracts:\n{context}\n\nQuestion: {question}\nAnswer:")
            text = self.llm(prompt, max_new_tokens=200)[0]["generated_text"].strip()
            cited = sorted({int(m) for m in re.findall(r"\[(\d+)\]", text)})
        citations = [
            {"index": n, "sourceId": hits[n - 1]["sourceId"], "reference": hits[n - 1]["reference"]}
            for n in cited if 1 <= n <= len(hits)
        ]
        self.log.append(("answer", [c["reference"] for c in citations]))
        return text, citations

    def refuse(self, verdict: str = "INSUFFICIENT_EVIDENCE", reason: str = "low retrieval confidence"):
        assert verdict in VERDICTS
        self.log.append(("refuse", verdict, reason))
        return {"verdict": verdict, "answer": None, "citations": [], "reason": reason}

    # -- P node -------------------------------------------------------------- #
    def policy(self, conf: float, hits: list[dict], citations: list[dict]):
        """Deterministic, blocking gate. Returns (verdict, reason)."""
        if conf < self.tau:
            return "INSUFFICIENT_EVIDENCE", f"best similarity {conf:.3f} < tau {self.tau}"
        retrieved = {(h["sourceId"], h["reference"]) for h in hits}
        if not citations or any((c["sourceId"], c["reference"]) not in retrieved for c in citations):
            return "INSUFFICIENT_EVIDENCE", "no valid citation in the retrieved set"
        cited = {(c["sourceId"], c["reference"]) for c in citations}
        for h in hits:
            if (h["sourceId"], h["reference"]) in cited and h.get("amended_by"):
                return "OUTDATED_TEXT", f"{h['reference']} amended by {h['amended_by']}"
        return "ANSWERED_WITH_CITATIONS", "passed"

    # -- agent loop -------------------------------------------------------- #
    def run(self, question: str, options: dict | None = None):
        """Retrieve -> (answer) -> P node. Returns {verdict, answer, citations, reason}.

        options: {"k": int, "tau": float, "out_of_scope": bool}
        """
        options = options or {}
        self.log = []
        if options.get("out_of_scope"):
            return self.refuse("OUT_OF_SCOPE", "request outside public legal information")
        if "tau" in options:
            self.tau = float(options["tau"])
        hits, conf = self.retrieve(question, options.get("k"))
        if conf < self.tau:  # fail fast: never call the llm without evidence
            return self.refuse("INSUFFICIENT_EVIDENCE", f"best similarity {conf:.3f} < tau {self.tau}")
        text, citations = self.answer(question, hits)
        verdict, reason = self.policy(conf, hits, citations)
        self.log.append(("policy", verdict, reason))
        if verdict != "ANSWERED_WITH_CITATIONS":
            # OUTDATED_TEXT keeps the citations so the citizen sees what changed
            keep = citations if verdict == "OUTDATED_TEXT" else []
            return {"verdict": verdict, "answer": None, "citations": keep, "reason": reason}
        return {"verdict": verdict, "answer": text, "citations": citations, "reason": reason}


class SonahHTTPBackend:
    """Thin client for a running SONAH API (default http://localhost:4000/api/v1).

    `search()` returns hits shaped like SonahLegalAgent.retrieve();
    `chat()` returns the API body ({reply, verdict, citations, traceId} or legacy {reply, sources}).
    """

    def __init__(self, base_url: str = "http://localhost:4000/api/v1", timeout: float = 60.0,
                 opener: Callable[..., Any] | None = None):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._open = opener or urllib.request.urlopen
        self.log: list[tuple] = []

    def _post(self, route: str, body: dict) -> dict:
        req = urllib.request.Request(
            self.base_url + route, data=json.dumps(body).encode(),
            headers={"content-type": "application/json"}, method="POST")
        with self._open(req, timeout=self.timeout) as resp:
            return json.loads(resp.read().decode())

    def search(self, query: str, top_k: int = 5):
        body = self._post("/search", {"query": query, "topK": top_k})
        hits = [{"text": r.get("content", ""), "sourceId": r["sourceId"],
                 "reference": r.get("reference"), "score": float(r["score"])}
                for r in body.get("results", [])]
        self.log.append(("retrieve", hits[0]["score"] if hits else None, [h["reference"] for h in hits]))
        return hits

    def chat(self, message: str, language: str | None = None):
        body = self._post("/chat", {"message": message, **({"language": language} if language else {})})
        self.log.append(("chat", body.get("verdict"), body.get("traceId")))
        return body
