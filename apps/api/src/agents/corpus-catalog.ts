import { Injectable } from '@nestjs/common';
import type { SearchResult } from '@sonah/rag';
import { PrismaService } from '../prisma/prisma.service';

/** Vue du corpus indexé : textes disponibles et accès direct à un article. */
export interface CorpusCatalog {
  /** Identifiants des textes effectivement indexés. */
  sourceIds(): Promise<string[]>;
  /** Fragment d'un texte par sa référence (« Article 6 »), ou null. */
  findByReference(sourceId: string, reference: string): Promise<SearchResult | null>;
}

export const CORPUS_CATALOG = Symbol('CORPUS_CATALOG');

const CACHE_TTL_MS = 60_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

@Injectable()
export class PrismaCorpusCatalog implements CorpusCatalog {
  private cache: { ids: string[]; at: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async sourceIds(): Promise<string[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) return this.cache.ids;
    const rows = await this.prisma.document.findMany({
      distinct: ['sourceId'],
      select: { sourceId: true },
    });
    const ids = rows.map((row) => row.sourceId).sort();
    this.cache = { ids, at: Date.now() };
    return ids;
  }

  async findByReference(sourceId: string, reference: string): Promise<SearchResult | null> {
    const row = await this.prisma.document.findFirst({
      where: { sourceId, reference },
      orderBy: { chunkKey: 'asc' },
      select: {
        id: true,
        sourceId: true,
        title: true,
        reference: true,
        content: true,
        category: true,
        source: true,
        metadata: true,
      },
    });
    return row ? { ...row, score: 1, metadata: asRecord(row.metadata) } : null;
  }
}

/** Catalogue en mémoire (tests). */
export class MemoryCorpusCatalog implements CorpusCatalog {
  constructor(private readonly documents: readonly SearchResult[]) {}

  async sourceIds(): Promise<string[]> {
    return [...new Set(this.documents.map((d) => d.sourceId))].sort();
  }

  async findByReference(sourceId: string, reference: string): Promise<SearchResult | null> {
    return this.documents.find((d) => d.sourceId === sourceId && d.reference === reference) ?? null;
  }
}
