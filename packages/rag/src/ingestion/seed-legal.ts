import { chunkLegalText, chunkToEmbeddingText } from '../chunking/legal-chunker';
import { graphArticleKey, type GraphStoreService } from '../graph-store.service';
import {
  consoleLogger,
  type DocumentInput,
  type LegalChunk,
  type LegalSource,
  type RagLogger,
} from '../types';
import type { VectorStoreService } from '../vector-store.service';
import { computeLegalStatuses, type ChunkStatus, unitKeyOf } from './legal-status';
import { loadSourceText, SourceUnavailableError, type SourceTextOptions } from './source-text';
import { loadSourceManifest } from './sources';

export interface SeedReport {
  readonly sourceId: string;
  readonly chunks: number;
  readonly articles: number;
  readonly graphArticles: number | null;
  /** Fragments supprimés car absents de la nouvelle indexation (texte corrigé ou redécoupé). */
  readonly staleDeleted: number;
  readonly amended: number;
  readonly repealed: number;
}

export interface SeedOptions {
  readonly sourcesDir: string;
  readonly vectorStore: VectorStoreService;
  /** Optionnel : sans Neo4j, seule la base vectorielle est alimentée. */
  readonly graphStore?: GraphStoreService;
  readonly logger?: RagLogger;
  /** Textes non redistribuables : téléchargement (« fetch », défaut) ou cache uniquement. */
  readonly remote?: SourceTextOptions['remote'];
  /** Restreint l'indexation à certains textes (les statuts restent calculés sur tout le manifeste). */
  readonly sourceIds?: readonly string[];
}

/** Découpe une source selon sa configuration du manifeste. */
export function chunkSource(source: LegalSource, text: string): LegalChunk[] {
  return chunkLegalText(source.id, text, {
    ...source.chunking,
    language: source.language,
    amendedArticles: source.amends ? Object.keys(source.amends.articles) : undefined,
  });
}

/** Avertissement rappelé avec un article qui n'est plus (entièrement) en vigueur. */
function statusNote(status: ChunkStatus): string | null {
  if (status.status === 'repealed') return `Texte abrogé (${status.repealedBy}).`;
  if (status.status !== 'amended') return null;
  const paragraphs =
    status.amendedParagraphs && status.amendedParagraphs.length > 0
      ? ` (alinéa(s) ou point(s) ${status.amendedParagraphs.join(', ')})`
      : '';
  return `Rédaction modifiée${paragraphs} par : ${status.amendedByLabel}. Citer la rédaction en vigueur.`;
}

export function toDocument(
  source: LegalSource,
  chunk: LegalChunk,
  status: ChunkStatus = { status: 'in_force' },
): DocumentInput {
  const note = [source.note, statusNote(status)].filter(Boolean).join(' ');
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
      note: note || null,
      sourceId: source.id,
      docId: source.docId,
      unitKey: unitKeyOf(chunk),
      status: status.status,
      amendedBy: status.amendedBy ?? null,
      amendedByLabel: status.amendedByLabel ?? null,
      amendmentHistory: status.amendmentHistory ?? [],
      currentVersion: status.currentVersion ?? null,
      amendedParagraphs: status.amendedParagraphs ?? null,
      amends: status.amends ?? null,
      repealedBy: status.repealedBy ?? null,
      version: source.version,
      date: source.date,
      binding: source.binding,
      language: source.language,
      jurisdiction: source.jurisdiction,
      issuingBody: source.issuingBody,
      domains: source.domains,
      ituDimensions: source.ituDimensions,
      page: chunk.pageStart ?? null,
      pageEnd: chunk.pageEnd ?? null,
      derivation: source.derivation ?? null,
    },
  };
}

/**
 * Indexe les textes décrits dans manifest.json :
 * extraction → nettoyage → découpage → statut juridique → embeddings → pgvector (+ structure dans Neo4j).
 * Idempotent : relancer le seed met à jour les fragments existants et supprime ceux qui ont disparu.
 * Un texte non redistribuable indisponible (hors ligne, empreinte changée) est ignoré avec un avertissement.
 */
export async function seedLegalSources(options: SeedOptions): Promise<SeedReport[]> {
  const logger = options.logger ?? consoleLogger;
  const sources = await loadSourceManifest(options.sourcesDir);
  const textOptions: SourceTextOptions = {
    sourcesDir: options.sourcesDir,
    remote: options.remote ?? 'fetch',
  };

  // 1. Découpage de toutes les sources indexables (les statuts dépendent des textes modificatifs)
  const chunksBySource = new Map<string, LegalChunk[]>();
  for (const source of sources) {
    if (source.redistribution === 'metadata-only') continue;
    try {
      const text = await loadSourceText(source, textOptions);
      const chunks = chunkSource(source, text);
      if (chunks.length === 0) throw new Error(`Aucun fragment détecté dans ${source.id}`);
      chunksBySource.set(source.id, chunks);
    } catch (error) {
      if (!(error instanceof SourceUnavailableError)) throw error;
      logger.warn(`Texte ignoré : ${error.message}`);
    }
  }
  const statuses = computeLegalStatuses(sources, chunksBySource);

  // 2. Indexation
  const selected = options.sourceIds ? new Set(options.sourceIds) : undefined;
  if (options.graphStore) await options.graphStore.ensureSchema();
  const reports: SeedReport[] = [];

  for (const source of sources) {
    const chunks = chunksBySource.get(source.id);
    if (!chunks || (selected && !selected.has(source.id))) continue;
    logger.log(`→ ${source.shortTitle} (${source.id})`);

    const documents = chunks.map((chunk) => ({
      doc: toDocument(source, chunk, statuses.get(chunk.key)),
      embeddingText: chunkToEmbeddingText(
        chunk,
        source.shortTitle,
        options.vectorStore.embeddingTextStyle,
      ),
    }));
    await options.vectorStore.upsertMany(documents);
    const staleDeleted = await options.vectorStore.deleteStaleChunks(
      source.id,
      chunks.map((chunk) => chunk.key),
    );

    const graphArticles = options.graphStore
      ? await options.graphStore.upsertLegalStructure(
          source,
          chunks,
          (chunk) => statuses.get(chunk.key)?.status ?? 'in_force',
        )
      : null;

    const units = new Set(chunks.map(unitKeyOf));
    const unitStatus = (wanted: string): number =>
      new Set(
        chunks
          .filter((chunk) => statuses.get(chunk.key)?.status === wanted)
          .map((chunk) => unitKeyOf(chunk)),
      ).size;
    const articles = new Set(chunks.map((chunk) => chunk.articleNumber).filter(Boolean)).size;
    logger.log(
      `  ${chunks.length} fragments, ${units.size} unités, ${articles} articles` +
        (staleDeleted > 0 ? `, ${staleDeleted} fragments obsolètes supprimés` : ''),
    );
    reports.push({
      sourceId: source.id,
      chunks: chunks.length,
      articles,
      graphArticles,
      staleDeleted,
      amended: unitStatus('amended'),
      repealed: unitStatus('repealed'),
    });
  }

  // 3. Relations de modification dans le graphe (nouvelle rédaction -[:AMENDS]-> article modifié)
  if (options.graphStore) {
    const graphKeys = new Map<string, string>();
    for (const chunks of chunksBySource.values()) {
      for (const chunk of chunks) graphKeys.set(unitKeyOf(chunk), graphArticleKey(chunk));
    }
    const links = new Map<string, string>();
    for (const chunks of chunksBySource.values()) {
      for (const chunk of chunks) {
        const amendedBy = statuses.get(chunk.key)?.amendedBy;
        const newKey = amendedBy ? graphKeys.get(amendedBy) : undefined;
        if (newKey) links.set(`${newKey}>${graphArticleKey(chunk)}`, newKey);
      }
    }
    const pairs = [...links.keys()].map((pair) => pair.split('>') as [string, string]);
    if (pairs.length > 0) await options.graphStore.linkAmendments(pairs);
  }

  return reports;
}
