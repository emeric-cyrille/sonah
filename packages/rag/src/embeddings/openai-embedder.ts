import OpenAI from 'openai';
import { assertDimensions, EMBEDDING_DIMENSIONS, type Embedder } from './embedder';

const BATCH_SIZE = 96;

/** Embeddings OpenAI (text-embedding-3-small par défaut, 1536 dimensions). */
export class OpenAIEmbedder implements Embedder {
  readonly model: string;
  readonly relevanceThreshold = 0.3;
  private readonly client: OpenAI;

  constructor(apiKey: string, model = 'text-embedding-3-small') {
    this.client = new OpenAI({ apiKey, maxRetries: 3, timeout: 60_000 });
    this.model = model;
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += BATCH_SIZE) {
      const batch = texts.slice(start, start + BATCH_SIZE);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: [...batch],
        dimensions: EMBEDDING_DIMENSIONS,
      });
      const ordered = [...response.data]
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
      vectors.push(...ordered);
    }
    assertDimensions(vectors);
    return vectors;
  }
}
