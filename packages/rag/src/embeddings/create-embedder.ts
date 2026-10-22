import { consoleLogger, type RagLogger } from '../types';
import type { Embedder } from './embedder';
import { HashingEmbedder } from './hashing-embedder';
import { OpenAIEmbedder } from './openai-embedder';

export interface EmbedderConfig {
  readonly openaiApiKey?: string;
  readonly openaiEmbeddingModel?: string;
}

/** OpenAI si une clé est fournie, sinon embeddings lexicaux hors ligne. */
export function createEmbedder(
  config: EmbedderConfig,
  logger: RagLogger = consoleLogger,
): Embedder {
  const apiKey = config.openaiApiKey?.trim();
  if (apiKey) return new OpenAIEmbedder(apiKey, config.openaiEmbeddingModel);
  logger.warn('OPENAI_API_KEY absente : embeddings lexicaux hors ligne (hashing-fr-v1)');
  return new HashingEmbedder();
}
