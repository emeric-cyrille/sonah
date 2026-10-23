import { consoleLogger, type RagLogger } from '../types';
import { withRelevanceThreshold, type Embedder } from './embedder';
import { GeminiEmbedder } from './gemini-embedder';
import { HashingEmbedder } from './hashing-embedder';
import { LocalEmbedder } from './local-embedder';
import { OpenAIEmbedder } from './openai-embedder';

export type EmbeddingProvider = 'local' | 'gemini' | 'openai' | 'hashing';

export interface EmbedderConfig {
  /** Fournisseur imposé ; sinon choix automatique selon les clés disponibles. */
  readonly provider?: EmbeddingProvider;
  /** Modèle local (Hugging Face, format ONNX) et dossier de cache. */
  readonly localModel?: string;
  readonly localCacheDir?: string;
  readonly localBatchSize?: number;
  readonly geminiApiKey?: string;
  readonly geminiEmbeddingModel?: string;
  readonly openaiApiKey?: string;
  readonly openaiEmbeddingModel?: string;
  /** Remplace le seuil de pertinence par défaut du modèle (calibrage). */
  readonly relevanceThreshold?: number;
}

const PROVIDERS: readonly EmbeddingProvider[] = ['local', 'gemini', 'openai', 'hashing'];

/** Lit la configuration des embeddings depuis les variables d'environnement (scripts, seed). */
export function embedderConfigFromEnv(env: Record<string, string | undefined>): EmbedderConfig {
  const provider = env.EMBEDDING_PROVIDER?.trim();
  if (provider && !PROVIDERS.includes(provider as EmbeddingProvider)) {
    throw new Error(`EMBEDDING_PROVIDER inconnu : ${provider} (${PROVIDERS.join(', ')})`);
  }
  const threshold = env.EMBEDDING_RELEVANCE_THRESHOLD?.trim();
  return {
    provider: (provider || undefined) as EmbeddingProvider | undefined,
    localModel: env.LOCAL_EMBEDDING_MODEL || undefined,
    localCacheDir: env.EMBEDDINGS_CACHE_DIR || undefined,
    localBatchSize: env.EMBEDDING_BATCH_SIZE ? Number(env.EMBEDDING_BATCH_SIZE) : undefined,
    geminiApiKey: env.GEMINI_API_KEY,
    geminiEmbeddingModel: env.GEMINI_EMBEDDING_MODEL || undefined,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiEmbeddingModel: env.OPENAI_EMBEDDING_MODEL || undefined,
    relevanceThreshold: threshold ? Number(threshold) : undefined,
  };
}

/**
 * Choix du modèle d'embedding : fournisseur imposé (EMBEDDING_PROVIDER), sinon Gemini ou OpenAI
 * si leur clé est présente, sinon le modèle multilingue local (gratuit, données sur le serveur).
 * « hashing » reste disponible pour les tests et les environnements sans accès au modèle.
 */
export function createEmbedder(
  config: EmbedderConfig,
  logger: RagLogger = consoleLogger,
): Embedder {
  const geminiKey = config.geminiApiKey?.trim();
  const openaiKey = config.openaiApiKey?.trim();
  const provider: EmbeddingProvider =
    config.provider ?? (geminiKey ? 'gemini' : openaiKey ? 'openai' : 'local');

  let embedder: Embedder;
  switch (provider) {
    case 'gemini':
      if (!geminiKey) throw new Error('EMBEDDING_PROVIDER=gemini sans GEMINI_API_KEY');
      embedder = new GeminiEmbedder(geminiKey, { model: config.geminiEmbeddingModel });
      break;
    case 'openai':
      if (!openaiKey) throw new Error('EMBEDDING_PROVIDER=openai sans OPENAI_API_KEY');
      embedder = new OpenAIEmbedder(openaiKey, config.openaiEmbeddingModel);
      break;
    case 'hashing':
      logger.warn('Embeddings lexicaux hors ligne (hashing-fr-v1)');
      embedder = new HashingEmbedder();
      break;
    case 'local':
      embedder = new LocalEmbedder({
        model: config.localModel,
        cacheDir: config.localCacheDir,
        batchSize: config.localBatchSize,
      });
      break;
  }

  return config.relevanceThreshold !== undefined
    ? withRelevanceThreshold(embedder, config.relevanceThreshold)
    : embedder;
}
