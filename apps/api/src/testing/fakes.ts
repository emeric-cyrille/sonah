/**
 * Doubles de test : Prisma en mémoire (conversations et messages), base vectorielle et modèle
 * de langage simulés. Aucun service externe n'est requis pour les tests.
 */
import type { SearchResult, VectorStoreService } from '@sonah/rag';
import { randomUUID } from 'node:crypto';
import { AnswerEngine } from '../agents/answer-engine.service';
import { MemoryCorpusCatalog } from '../agents/corpus-catalog';
import { AuditService } from '../audit/audit.service';
import { MemoryTraceStore } from '../audit/trace-store';
import { ChatService } from '../chat/chat.service';
import type { ChatTurn, LanguageModel } from '../chat/language-model';
import { words } from '../policy/text';
import type { PrismaService } from '../prisma/prisma.service';

export interface StoredMessage {
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: Date;
  metadata?: unknown;
}

/** Prisma en mémoire, limité aux appels du pipeline de conversation. */
export function memoryPrisma(): { prisma: PrismaService; messages: StoredMessage[] } {
  const conversations = new Set<string>();
  const messages: StoredMessage[] = [];
  const prisma = {
    conversation: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        conversations.has(where.id) ? { id: where.id } : null,
      create: async () => {
        const id = randomUUID();
        conversations.add(id);
        return { id };
      },
    },
    message: {
      create: async ({ data }: { data: Omit<StoredMessage, 'createdAt'> }) => {
        messages.push({ ...data, createdAt: new Date(Date.now() + messages.length) });
        return data;
      },
      findMany: async ({ where, take }: { where: { conversationId: string }; take: number }) =>
        messages
          .filter((m) => m.conversationId === where.conversationId && m.role !== 'SYSTEM')
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, take),
    },
  } as unknown as PrismaService;
  return { prisma, messages };
}

export interface SearchCall {
  readonly query: string;
  readonly sourceIds?: readonly string[];
  readonly types?: readonly string[];
}

/** Mots significatifs (au moins 5 lettres, sans accents) pour la recherche lexicale simulée. */
function significantWords(text: string): Set<string> {
  return new Set(words(text).filter((word) => word.length >= 5));
}

/**
 * Base vectorielle simulée : renvoie les résultats donnés (filtrés par score et par source).
 * En mode lexical, ne garde que les fragments partageant un mot significatif avec la requête.
 */
export function fakeVectorStore(
  results: readonly SearchResult[],
  options: { lexical?: boolean } = {},
): {
  store: VectorStoreService;
  calls: SearchCall[];
} {
  const calls: SearchCall[] = [];
  const store = {
    embeddingModel: 'hashing-fr-v1',
    relevanceThreshold: 0.15,
    search: async (
      query: string,
      topK: number,
      search?: { minScore?: number; sourceIds?: readonly string[]; types?: readonly string[] },
    ) => {
      calls.push({ query, sourceIds: search?.sourceIds, types: search?.types });
      const queryWords = significantWords(query);
      return results
        .filter(
          (result) =>
            result.score >= (search?.minScore ?? -1) &&
            (!search?.sourceIds || search.sourceIds.includes(result.sourceId)) &&
            (!options.lexical ||
              [...significantWords(result.content)].some((word) => queryWords.has(word))),
        )
        .slice(0, topK);
    },
  } as unknown as VectorStoreService;
  return { store, calls };
}

/** Modèle qui enregistre les messages reçus et renvoie une réponse fixe (ou calculée). */
export class RecordingModel implements LanguageModel {
  readonly name = 'modele-test';
  readonly calls: ChatTurn[][] = [];

  constructor(
    private readonly reply: string | ((turns: readonly ChatTurn[]) => string) = 'Réponse [1].',
  ) {}

  async complete(turns: readonly ChatTurn[]): Promise<string> {
    this.calls.push([...turns]);
    return typeof this.reply === 'string' ? this.reply : this.reply(turns);
  }
}

/** Modèle toujours en panne (quota épuisé). */
export class FailingModel implements LanguageModel {
  readonly name = 'modele-en-panne';
  calls = 0;

  async complete(): Promise<string> {
    this.calls += 1;
    throw new Error('429 quota exceeded');
  }
}

export interface TestHarness {
  readonly chat: ChatService;
  readonly engine: AnswerEngine;
  readonly audit: AuditService;
  readonly traces: MemoryTraceStore;
  readonly messages: StoredMessage[];
  readonly calls: SearchCall[];
}

/** Assemble le pipeline complet avec des doubles en mémoire. */
export function createHarness(
  results: readonly SearchResult[],
  model: LanguageModel | null,
): TestHarness {
  const { prisma, messages } = memoryPrisma();
  const { store, calls } = fakeVectorStore(results);
  const traces = new MemoryTraceStore();
  const audit = new AuditService(traces);
  const engine = new AnswerEngine(store, new MemoryCorpusCatalog(results), model);
  const chat = new ChatService(prisma, engine, audit);
  return { chat, engine, audit, traces, messages, calls };
}
