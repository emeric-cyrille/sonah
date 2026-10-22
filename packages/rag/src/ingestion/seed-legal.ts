import path from 'node:path';
import { chunkLegalText, chunkToEmbeddingText } from '../chunking/legal-chunker';
import { normalizeLegalText } from '../chunking/text-normalizer';
import type { GraphStoreService } from '../graph-store.service';
import { consoleLogger, type DocumentInput, type LegalSource, type RagLogger } from '../types';
import type { VectorStoreService } from '../vector-store.service';
import { extractPdfText } from './pdf';
import { loadSourceManifest } from './sources';

export interface SeedReport {
  readonly sourceId: string;
  readonly chunks: number;
  readonly articles: number;
  readonly graphArticles: number | null;
}

export interface SeedOptions {
  readonly sourcesDir: string;
  readonly vectorStore: VectorStoreService;
  /** Optionnel : sans Neo4j, seule la base vectorielle est alimentée. */
  readonly graphStore?: GraphStoreService;
  readonly logger?: RagLogger;
}

function toDocument(
  source: LegalSource,
  chunk: ReturnType<typeof chunkLegalText>[number],
): DocumentInput {
  return {
    chunkKey: chunk.key,
    sourceId: source.id,
    type: source.type,
    title: source.title,
    reference:
      chunk.totalParts > 1
        ? `${chunk.reference} (partie ${chunk.part}/${chunk.totalParts})`
        : chunk.reference,
    content: chunk.content,
    source: source.url,
    category: source.category,
    metadata: {
      shortTitle: source.shortTitle,
      path: chunk.path,
      articleNumber: chunk.articleNumber ?? null,
      part: chunk.part,
      totalParts: chunk.totalParts,
      note: source.note ?? null,
    },
  };
}

/**
 * Indexe les textes officiels décrits dans manifest.json :
 * extraction PDF → nettoyage → découpage par article → embeddings → pgvector (+ structure dans Neo4j).
 * Idempotent : relancer le seed met à jour les fragments existants.
 */
export async function seedLegalSources(options: SeedOptions): Promise<SeedReport[]> {
  const logger = options.logger ?? consoleLogger;
  const sources = await loadSourceManifest(options.sourcesDir);
  const reports: SeedReport[] = [];

  if (options.graphStore) await options.graphStore.ensureSchema();

  for (const source of sources) {
    logger.log(`→ ${source.shortTitle} (${source.file})`);
    const raw = await extractPdfText(path.join(options.sourcesDir, source.file));
    const text = normalizeLegalText(raw, source.noisePatterns);
    const chunks = chunkLegalText(source.id, text, {
      preambleLabel: source.type === 'CONSTITUTION' ? 'Préambule' : null,
    });
    if (chunks.length === 0) throw new Error(`Aucun article détecté dans ${source.file}`);

    await options.vectorStore.upsertMany(
      chunks.map((chunk) => ({
        doc: toDocument(source, chunk),
        embeddingText: chunkToEmbeddingText(chunk, source.shortTitle),
      })),
    );

    const graphArticles = options.graphStore
      ? await options.graphStore.upsertLegalStructure(source, chunks)
      : null;
    const articles = new Set(chunks.map((chunk) => chunk.articleNumber).filter(Boolean)).size;
    logger.log(`  ${chunks.length} fragments, ${articles} articles indexés`);
    reports.push({ sourceId: source.id, chunks: chunks.length, articles, graphArticles });
  }

  return reports;
}
