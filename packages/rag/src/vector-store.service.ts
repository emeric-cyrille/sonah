import { Prisma, type PrismaClient } from '@sonah/database';
import { z } from 'zod';
import { assertDimensions, type Embedder } from './embeddings/embedder';
import {
  consoleLogger,
  DOCUMENT_TYPES,
  type DocumentInput,
  type RagLogger,
  type SearchResult,
  type StoredDocument,
} from './types';

const documentInputSchema = z.object({
  chunkKey: z.string().min(1).max(200),
  sourceId: z.string().min(1).max(100),
  type: z.enum(DOCUMENT_TYPES),
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
  /**
   * Score minimal (similarité cosinus, de -1 à 1). En mode hybride, un fragment retrouvé en plein texte
   * pour une requête contenant un numéro (« Article 12 », « 2010/012 ») est conservé même en dessous.
   */
  readonly minScore?: number;
  /** Recherche hybride vectorielle + plein texte (défaut : true). */
  readonly hybrid?: boolean;
}

/** Constante k de la Reciprocal Rank Fusion (valeur usuelle). */
export const RRF_K = 60;

/** Fusionne plusieurs classements : score = somme des 1 / (k + rang). */
export function reciprocalRankFusion(
  rankings: ReadonlyArray<readonly string[]>,
  k = RRF_K,
): Array<{ id: string; score: number }> {
  const scores = new Map<string, number>();
  for (const ranking of rankings) {
    ranking.forEach((id, index) => scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1)));
  }
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

/** Termes de la requête plein texte : mots (config « french ») et numéros (config « simple »). */
export interface TextQueryTerms {
  readonly words: string[];
  readonly numbers: string[];
}

/**
 * Extrait les termes d'une requête : mots de 2 lettres ou plus, et références numériques
 * (« 12 », « 2010/012 », « 96-06 »). Seuls lettres, chiffres, « / » et « - » sont conservés :
 * la chaîne transmise à to_tsquery ne peut pas contenir d'opérateur.
 */
export function extractQueryTerms(query: string): TextQueryTerms {
  const tokens = query
    .normalize('NFC')
    .split(/[^\p{L}\p{N}/-]+/u)
    .map((token) => token.replace(/^[-/]+|[-/]+$/g, ''))
    .filter((token) => token.length > 0);
  const numbers = [...new Set(tokens.filter((token) => /\d/.test(token)))].slice(0, 10);
  const words = [
    ...new Set(
      tokens.filter((token) => !/\d/.test(token) && token.length >= 2).map((t) => t.toLowerCase()),
    ),
  ].slice(0, 30);
  return { words, numbers };
}

function orQuery(terms: readonly string[]): string {
  return terms.map((term) => `'${term}'`).join(' | ');
}

/** Sous-requête SQL produisant la tsquery (OU logique entre les termes), ou null si aucun terme. */
function buildTextQuery(query: string): { sql: Prisma.Sql; hasNumbers: boolean } | null {
  const { words, numbers } = extractQueryTerms(query);
  const parts: Prisma.Sql[] = [];
  if (words.length > 0) parts.push(Prisma.sql`to_tsquery('french', ${orQuery(words)})`);
  if (numbers.length > 0) parts.push(Prisma.sql`to_tsquery('simple', ${orQuery(numbers)})`);
  if (parts.length === 0) return null;
  return {
    sql: Prisma.sql`(SELECT ${Prisma.join(parts, ' || ')} AS query)`,
    hasNumbers: numbers.length > 0,
  };
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

  /** Calcule l'embedding d'un texte. */
  async createEmbedding(text: string): Promise<number[]> {
    const [vector] = await this.embedder.embed([text]);
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
        const vectors = await this.embedder.embed(batch.map((item) => item.embeddingText));
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

  /**
   * Recherche hybride : similarité vectorielle (pgvector) et plein texte (PostgreSQL, configurations
   * « french » et « simple »), fusionnées par Reciprocal Rank Fusion. La recherche plein texte retrouve
   * les références exactes (« Article 12 », « Loi n° 2010/012 ») que l'embedding peut manquer.
   * `score` reste la similarité cosinus du fragment ; l'ordre est celui de la fusion.
   * `hybrid: false` revient à la recherche purement vectorielle.
   */
  async search(query: string, topK = 5, options: SearchOptions = {}): Promise<SearchResult[]> {
    const input = searchSchema.parse({ query, topK });
    try {
      const vector = await this.createEmbedding(input.query);
      const literal = toVectorLiteral(vector);
      const sourceFilter =
        options.sourceIds && options.sourceIds.length > 0
          ? Prisma.sql`AND "sourceId" IN (${Prisma.join([...options.sourceIds])})`
          : Prisma.empty;
      const minScore = options.minScore ?? -1;
      const toResult = (row: SearchRow): SearchResult => ({
        ...row,
        score: Number(row.score),
        metadata: asRecord(row.metadata),
      });

      if (options.hybrid === false) {
        const rows = await this.prisma.$queryRaw<SearchRow[]>`
          SELECT "id", "sourceId", "title", "reference", "content", "category", "source", "metadata",
                 1 - ("embedding" <=> ${literal}::vector) AS "score"
          FROM "documents"
          WHERE "embedding" IS NOT NULL
            AND "embeddingModel" = ${this.embedder.model}
            ${sourceFilter}
          ORDER BY "embedding" <=> ${literal}::vector
          LIMIT ${input.topK}`;
        return rows.map(toResult).filter((row) => row.score >= minScore);
      }

      const candidates = Math.min(Math.max(input.topK * 4, 20), 100);
      const vectorRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "documents"
        WHERE "embedding" IS NOT NULL
          AND "embeddingModel" = ${this.embedder.model}
          ${sourceFilter}
        ORDER BY "embedding" <=> ${literal}::vector
        LIMIT ${candidates}`;

      const terms = buildTextQuery(input.query);
      const textRows = terms
        ? await this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT "id"
            FROM "documents", ${terms.sql} AS q
            WHERE "embedding" IS NOT NULL
              AND "embeddingModel" = ${this.embedder.model}
              AND "search_vector" @@ q.query
              ${sourceFilter}
            ORDER BY ts_rank_cd("search_vector", q.query, 1) DESC, "chunkKey"
            LIMIT ${candidates}`
        : [];

      const fused = reciprocalRankFusion([
        vectorRows.map((row) => row.id),
        textRows.map((row) => row.id),
      ]);
      if (fused.length === 0) return [];
      const textRank = new Map(textRows.map((row, index) => [row.id, index + 1]));

      const rows = await this.prisma.$queryRaw<SearchRow[]>`
        SELECT "id", "sourceId", "title", "reference", "content", "category", "source", "metadata",
               1 - ("embedding" <=> ${literal}::vector) AS "score"
        FROM "documents"
        WHERE "id" IN (${Prisma.join(fused.map((entry) => entry.id))})`;
      const byId = new Map(rows.map((row) => [row.id, toResult(row)]));

      // Seuil : appliqué à la similarité cosinus, sauf pour une référence exacte trouvée en plein texte
      // (requête contenant un numéro d'article ou de loi, fragment classé parmi les premiers)
      const exactReference = Boolean(terms?.hasNumbers);
      return fused
        .map((entry) => byId.get(entry.id))
        .filter((row): row is SearchResult => row !== undefined)
        .filter((row) => {
          const rank = textRank.get(row.id);
          return (
            row.score >= minScore || (exactReference && rank !== undefined && rank <= input.topK)
          );
        })
        .slice(0, input.topK);
    } catch (error) {
      this.logger.error(
        `Échec de la recherche « ${input.query.slice(0, 80)} »`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Supprime les fragments d'un texte qui ne font plus partie de son indexation (texte corrigé,
   * redécoupé ou segmenté autrement). Retourne le nombre de fragments supprimés.
   */
  async deleteStaleChunks(sourceId: string, keepKeys: readonly string[]): Promise<number> {
    const { count } = await this.prisma.document.deleteMany({
      where: { sourceId, chunkKey: { notIn: [...keepKeys] } },
    });
    return count;
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
