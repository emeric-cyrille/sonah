import { Prisma, type PrismaClient } from '@sonah/database';
import { z } from 'zod';
import { assertDimensions, type Embedder, type EmbeddingPurpose } from './embeddings/embedder';
import {
  consoleLogger,
  type DocumentInput,
  type RagLogger,
  type SearchResult,
  type StoredDocument,
} from './types';

const documentInputSchema = z.object({
  chunkKey: z.string().min(1).max(200),
  sourceId: z.string().min(1).max(100),
  type: z.enum(['CONSTITUTION', 'LAW', 'DECREE', 'PROCEDURE', 'FORM', 'OTHER']),
  title: z.string().min(1).max(300),
  reference: z.string().max(100).optional(),
  content: z.string().min(1).max(20_000),
  source: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
});

const searchSchema = z.object({
  query: z.string().trim().min(2).max(2000),
  topK: z.number().int().min(1).max(50),
});

export interface SearchOptions {
  /** Restreint la recherche à certains textes (ex. ["constitution-1996"]). */
  readonly sourceIds?: readonly string[];
  /** Score minimal (similarité cosinus, de -1 à 1). */
  readonly minScore?: number;
}

interface SearchRow {
  id: string;
  sourceId: string;
  title: string;
  reference: string | null;
  content: string;
  category: string;
  source: string;
  metadata: Prisma.JsonValue;
  score: number;
}

const UPSERT_BATCH_SIZE = 64;

function toVectorLiteral(vector: readonly number[]): string {
  return `[${vector.join(',')}]`;
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Base vectorielle (PostgreSQL + pgvector) : indexation et recherche sémantique des textes officiels.
 * La similarité est le cosinus (opérateur <=>), accélérée par un index HNSW.
 */
export class VectorStoreService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly embedder: Embedder,
    private readonly logger: RagLogger = consoleLogger,
  ) {}

  get embeddingModel(): string {
    return this.embedder.model;
  }

  /** Score minimal conseillé pour considérer un résultat comme pertinent. */
  get relevanceThreshold(): number {
    return this.embedder.relevanceThreshold;
  }

  /** Calcule l'embedding d'un texte (une question de recherche par défaut). */
  async createEmbedding(text: string, purpose: EmbeddingPurpose = 'query'): Promise<number[]> {
    const [vector] = await this.embedder.embed([text], purpose);
    if (!vector) throw new Error('Aucun embedding retourné par le modèle');
    return vector;
  }

  /** Indexe (ou met à jour) un document. Retourne son identifiant. */
  async upsert(doc: DocumentInput, embeddingText?: string): Promise<string> {
    const [id] = await this.upsertMany([{ doc, embeddingText }]);
    if (!id) throw new Error(`Échec de l'indexation de ${doc.chunkKey}`);
    return id;
  }

  /**
   * Indexe plusieurs documents, par lots. `embeddingText` permet d'enrichir le texte vectorisé
   * (titre, chapitre…) sans modifier le contenu stocké.
   */
  async upsertMany(
    items: ReadonlyArray<{ doc: DocumentInput; embeddingText?: string }>,
  ): Promise<string[]> {
    const ids: string[] = [];
    for (let start = 0; start < items.length; start += UPSERT_BATCH_SIZE) {
      const batch = items.slice(start, start + UPSERT_BATCH_SIZE).map((item) => ({
        doc: documentInputSchema.parse(item.doc),
        embeddingText: item.embeddingText ?? item.doc.content,
      }));
      try {
        const vectors = await this.embedder.embed(
          batch.map((item) => item.embeddingText),
          'document',
        );
        assertDimensions(vectors);
        const batchIds = await this.prisma.$transaction(
          batch.map(({ doc }, index) => this.upsertQuery(doc, vectors[index] ?? [])),
        );
        ids.push(...batchIds.map((rows) => rows[0]?.id ?? ''));
      } catch (error) {
        this.logger.error(
          `Échec de l'indexation du lot ${start}-${start + batch.length}`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }
    return ids;
  }

  private upsertQuery(doc: z.infer<typeof documentInputSchema>, vector: readonly number[]) {
    const metadata = JSON.stringify(doc.metadata ?? {});
    return this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "documents"
        ("id", "chunkKey", "sourceId", "type", "title", "reference", "content", "source", "category",
         "embedding", "embeddingModel", "metadata", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), ${doc.chunkKey}, ${doc.sourceId}, ${doc.type}::"DocumentType", ${doc.title},
         ${doc.reference ?? null}, ${doc.content}, ${doc.source}, ${doc.category},
         ${toVectorLiteral(vector)}::vector, ${this.embedder.model}, ${metadata}::jsonb, now(), now())
      ON CONFLICT ("chunkKey") DO UPDATE SET
        "sourceId" = EXCLUDED."sourceId",
        "type" = EXCLUDED."type",
        "title" = EXCLUDED."title",
        "reference" = EXCLUDED."reference",
        "content" = EXCLUDED."content",
        "source" = EXCLUDED."source",
        "category" = EXCLUDED."category",
        "embedding" = EXCLUDED."embedding",
        "embeddingModel" = EXCLUDED."embeddingModel",
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = now()
      RETURNING "id"`;
  }

  /** Recherche sémantique : les `topK` fragments les plus proches de la requête. */
  async search(query: string, topK = 5, options: SearchOptions = {}): Promise<SearchResult[]> {
    const input = searchSchema.parse({ query, topK });
    try {
      const vector = await this.createEmbedding(input.query);
      const literal = toVectorLiteral(vector);
      const sourceFilter =
        options.sourceIds && options.sourceIds.length > 0
          ? Prisma.sql`AND "sourceId" IN (${Prisma.join([...options.sourceIds])})`
          : Prisma.empty;

      const rows = await this.prisma.$queryRaw<SearchRow[]>`
        SELECT "id", "sourceId", "title", "reference", "content", "category", "source", "metadata",
               1 - ("embedding" <=> ${literal}::vector) AS "score"
        FROM "documents"
        WHERE "embedding" IS NOT NULL
          AND "embeddingModel" = ${this.embedder.model}
          ${sourceFilter}
        ORDER BY "embedding" <=> ${literal}::vector
        LIMIT ${input.topK}`;

      const minScore = options.minScore ?? -1;
      return rows
        .map((row) => ({ ...row, score: Number(row.score), metadata: asRecord(row.metadata) }))
        .filter((row) => row.score >= minScore);
    } catch (error) {
      this.logger.error(
        `Échec de la recherche « ${input.query.slice(0, 80)} »`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /** Récupère un document par son identifiant, ou null s'il n'existe pas. */
  async findById(id: string): Promise<StoredDocument | null> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        chunkKey: true,
        sourceId: true,
        type: true,
        title: true,
        reference: true,
        content: true,
        category: true,
        source: true,
        metadata: true,
        embeddingModel: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return document ? { ...document, metadata: asRecord(document.metadata) } : null;
  }

  /** Nombre de fragments indexés avec le modèle d'embedding courant. */
  async countIndexed(): Promise<number> {
    return this.prisma.document.count({ where: { embeddingModel: this.embedder.model } });
  }
}
