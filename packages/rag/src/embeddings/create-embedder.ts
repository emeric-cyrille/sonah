import { consoleLogger, type RagLogger } from '../types';
import { withRelevanceThreshold, type Embedder } from './embedder';
import { GeminiEmbedder } from './gemini-embedder';
import { HashingEmbedder } from './hashing-embedder';
import { OpenAIEmbedder } from './openai-embedder';

export interface EmbedderConfig {
  readonly geminiApiKey?: string;
  readonly geminiEmbeddingModel?: string;
  readonly openaiApiKey?: string;
  readonly openaiEmbeddingModel?: string;
  /** Remplace le seuil de pertinence par défaut du modèle (calibrage). */
  readonly relevanceThreshold?: number;
}

/**
 * Choix du modèle d'embedding selon les clés disponibles :
 * Gemini (palier gratuit), sinon OpenAI, sinon embeddings lexicaux hors ligne.
 */
export function createEmbedder(
  config: EmbedderConfig,
  logger: RagLogger = consoleLogger,
): Embedder {
  const geminiKey = config.geminiApiKey?.trim();
  const openaiKey = config.openaiApiKey?.trim();

  let embedder: Embedder;
  if (geminiKey) {
    embedder = new GeminiEmbedder(geminiKey, { model: config.geminiEmbeddingModel });
  } else if (openaiKey) {
    embedder = new OpenAIEmbedder(openaiKey, config.openaiEmbeddingModel);
  } else {
    logger.warn(
      'Aucune clé GEMINI_API_KEY ni OPENAI_API_KEY : embeddings lexicaux hors ligne (hashing-fr-v1)',
    );
    embedder = new HashingEmbedder();
  }

  return config.relevanceThreshold !== undefined
    ? withRelevanceThreshold(embedder, config.relevanceThreshold)
    : embedder;
}
