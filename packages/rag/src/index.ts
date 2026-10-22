export * from './types';
export {
  chunkLegalText,
  chunkToEmbeddingText,
  type ChunkerOptions,
} from './chunking/legal-chunker';
export { normalizeLegalText } from './chunking/text-normalizer';
export { EMBEDDING_DIMENSIONS, type Embedder } from './embeddings/embedder';
export { HashingEmbedder } from './embeddings/hashing-embedder';
export { OpenAIEmbedder } from './embeddings/openai-embedder';
export { createEmbedder, type EmbedderConfig } from './embeddings/create-embedder';
export { VectorStoreService, type SearchOptions } from './vector-store.service';
export {
  GraphStoreService,
  RELATION_TYPES,
  type Dependency,
  type GraphConfig,
  type ProcedureNode,
  type RelationType,
} from './graph-store.service';
export { loadSourceManifest } from './ingestion/sources';
export { seedLegalSources, type SeedOptions, type SeedReport } from './ingestion/seed-legal';
