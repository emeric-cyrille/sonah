import { z } from 'zod';
import {
  assertDimensions,
  EMBEDDING_DIMENSIONS,
  type Embedder,
  type EmbeddingPurpose,
} from './embedder';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
/** Nombre de textes par appel batchEmbedContents. */
const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 60_000;

const responseSchema = z.object({
  embeddings: z.array(z.object({ values: z.array(z.number()) })),
});

export interface GeminiEmbedderOptions {
  readonly model?: string;
  /** Injection pour les tests. */
  readonly fetchImpl?: typeof fetch;
  /** Attente entre deux tentatives (ms), injectable pour les tests. */
  readonly backoffMs?: (attempt: number) => number;
}

/**
 * gemini-embedding-2 n'accepte pas de « task_type » : Google recommande d'indiquer
 * la tâche dans le texte lui-même.
 * https://ai.google.dev/gemini-api/docs/embeddings
 */
export function formatForGemini(text: string, purpose: EmbeddingPurpose): string {
  return purpose === 'query'
    ? `task: search result | query: ${text}`
    : `title: none | text: ${text}`;
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Embeddings Gemini (gemini-embedding-2), tronqués à 1536 dimensions et normalisés par l'API. */
export class GeminiEmbedder implements Embedder {
  readonly model: string;
  /** Valeur de départ, à calibrer avec scripts/calibrate-threshold.ts (EMBEDDING_RELEVANCE_THRESHOLD). */
  readonly relevanceThreshold = 0.55;
  private readonly fetchImpl: typeof fetch;
  private readonly backoffMs: (attempt: number) => number;

  constructor(
    private readonly apiKey: string,
    options: GeminiEmbedderOptions = {},
  ) {
    this.model = options.model ?? 'gemini-embedding-2';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.backoffMs = options.backoffMs ?? ((attempt) => 1000 * 2 ** attempt);
  }

  async embed(
    texts: readonly string[],
    purpose: EmbeddingPurpose = 'document',
  ): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += BATCH_SIZE) {
      const batch = texts.slice(start, start + BATCH_SIZE);
      vectors.push(...(await this.embedBatch(batch, purpose)));
    }
    assertDimensions(vectors);
    return vectors;
  }

  private async embedBatch(
    texts: readonly string[],
    purpose: EmbeddingPurpose,
  ): Promise<number[][]> {
    const body = JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${this.model}`,
        content: { parts: [{ text: formatForGemini(text, purpose) }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      })),
    });

    for (let attempt = 0; ; attempt += 1) {
      const response = await this.fetchImpl(`${API_BASE}/models/${this.model}:batchEmbedContents`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        const parsed = responseSchema.parse(await response.json());
        if (parsed.embeddings.length !== texts.length) {
          throw new Error(
            `Gemini a renvoyé ${parsed.embeddings.length} vecteurs pour ${texts.length} textes`,
          );
        }
        return parsed.embeddings.map((embedding) => embedding.values);
      }

      if (!isRetryable(response.status) || attempt + 1 >= MAX_ATTEMPTS) {
        const detail = (await response.text()).slice(0, 300);
        throw new Error(`Embeddings Gemini : HTTP ${response.status} ${detail}`);
      }
      // Quota gratuit dépassé (429) ou erreur serveur : nouvelle tentative avec attente croissante
      await new Promise((resolve) => setTimeout(resolve, this.backoffMs(attempt)));
    }
  }
}
