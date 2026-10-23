export * from './types';
export {
  chunkLegalText,
  chunkToEmbeddingText,
  type ChunkerOptions,
} from './chunking/legal-chunker';
export { normalizeLegalText, stripPageMarkers } from './chunking/text-normalizer';
export {
  EMBEDDING_DIMENSIONS,
  withRelevanceThreshold,
  type Embedder,
  type EmbeddingPurpose,
} from './embeddings/embedder';
export { GeminiEmbedder, formatForGemini } from './embeddings/gemini-embedder';
export { HashingEmbedder } from './embeddings/hashing-embedder';
export {
  DEFAULT_LOCAL_MODEL,
  LocalEmbedder,
  formatForE5,
  padVector,
} from './embeddings/local-embedder';
export { OpenAIEmbedder } from './embeddings/openai-embedder';
export {
  createEmbedder,
  embedderConfigFromEnv,
  type EmbedderConfig,
  type EmbeddingProvider,
} from './embeddings/create-embedder';
export {
  VectorStoreService,
  extractQueryTerms,
  hasExplicitReference,
  reciprocalRankFusion,
  type SearchOptions,
} from './vector-store.service';
export {
  GraphStoreService,
  RELATION_TYPES,
  graphArticleKey,
  type Dependency,
  type GraphConfig,
  type ProcedureNode,
  type RelationType,
} from './graph-store.service';
export { loadSourceManifest, manifestSchema } from './ingestion/sources';
export { downloadSource, sha256 } from './ingestion/download';
export { htmlToText } from './ingestion/html';
export { computeLegalStatuses, unitKeyOf, type ChunkStatus } from './ingestion/legal-status';
export {
  loadRawSourceText,
  loadSourceText,
  sliceSegment,
  SourceUnavailableError,
  type SourceTextOptions,
} from './ingestion/source-text';
export {
  chunkSource,
  seedLegalSources,
  toDocument,
  type SeedOptions,
  type SeedReport,
} from './ingestion/seed-legal';
