import type { SearchResult, VectorStoreService } from '@sonah/rag';
import type { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import type { ChatTurn, LanguageModel } from './language-model';

const ARTICLE: SearchResult = {
  id: '1',
  sourceId: 'code-du-travail-1992',
  title: 'Code du travail (loi n° 92-007 du 14 août 1992)',
  reference: 'Article 2',
  content:
    'Le droit au travail est reconnu à chaque citoyen comme un droit fondamental. Le travail forcé est interdit.',
  category: 'Code du travail',
  source: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
  score: 0.82,
  metadata: {
    shortTitle: 'Code du travail',
    path: ['Titre 1 - Dispositions générales'],
    note: 'Texte de 1992.',
  },
};

interface StoredMessage {
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: Date;
  metadata?: unknown;
}

/** Prisma en mémoire, limité aux appels du service. */
function memoryPrisma(): { prisma: PrismaService; messages: StoredMessage[] } {
  const conversations = new Set<string>();
  const messages: StoredMessage[] = [];
  let counter = 0;
  const prisma = {
    conversation: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        conversations.has(where.id) ? { id: where.id } : null,
      create: async () => {
        counter += 1;
        const id = `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
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

function fakeVectorStore(results: SearchResult[]): {
  store: VectorStoreService;
  queries: string[];
} {
  const queries: string[] = [];
  const store = {
    embeddingModel: 'hashing-fr-v1',
    relevanceThreshold: 0.15,
    search: async (query: string, _topK: number, options?: { minScore?: number }) => {
      queries.push(query);
      return results.filter((result) => result.score >= (options?.minScore ?? -1));
    },
  } as unknown as VectorStoreService;
  return { store, queries };
}

class RecordingModel implements LanguageModel {
  readonly name = 'modele-test';
  readonly calls: ChatTurn[][] = [];
  async complete(turns: readonly ChatTurn[]): Promise<string> {
    this.calls.push([...turns]);
    return 'Le travail forcé est interdit [1].';
  }
}

describe('ChatService', () => {
  it('rédige la réponse avec le modèle, à partir des extraits numérotés', async () => {
    const { prisma, messages } = memoryPrisma();
    const model = new RecordingModel();
    const service = new ChatService(prisma, fakeVectorStore([ARTICLE]).store, model);

    const response = await service.reply('Le travail forcé est-il autorisé ?');

    expect(response.reply).toBe('Le travail forcé est interdit [1].');
    expect(response.sources).toEqual([
      {
        title: 'Code du travail',
        reference: 'Article 2',
        url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
      },
    ]);
    const context = model.calls[0]?.[1]?.content ?? '';
    expect(context).toContain('[1] Code du travail › Titre 1 - Dispositions générales › Article 2');
    expect(context).toContain('Note de version : Texte de 1992.');
    expect(messages.map((m) => m.role)).toEqual(['USER', 'ASSISTANT']);
  });

  it('garde le fil : historique transmis et question précédente ajoutée à la recherche', async () => {
    const { prisma } = memoryPrisma();
    const model = new RecordingModel();
    const { store, queries } = fakeVectorStore([ARTICLE]);
    const service = new ChatService(prisma, store, model);

    const first = await service.reply(
      'Quels sont mes droits si mon employeur me licencie sans motif ?',
    );
    await service.reply('Et pendant un arrêt maladie ?', first.conversationId);

    expect(queries[1]).toBe(
      'Quels sont mes droits si mon employeur me licencie sans motif ?\nEt pendant un arrêt maladie ?',
    );
    const secondTurns = model.calls[1] ?? [];
    expect(secondTurns.map((turn) => turn.role)).toEqual([
      'system',
      'system',
      'user',
      'assistant',
      'user',
    ]);
  });

  it('crée une nouvelle conversation si l’identifiant fourni est inconnu', async () => {
    const { prisma } = memoryPrisma();
    const service = new ChatService(prisma, fakeVectorStore([]).store, new RecordingModel());
    const response = await service.reply('Bonjour', '11111111-1111-4111-8111-111111111111');
    expect(response.conversationId).not.toBe('11111111-1111-4111-8111-111111111111');
  });

  it('sans modèle de langage, cite honnêtement les articles trouvés', async () => {
    const { prisma } = memoryPrisma();
    const service = new ChatService(prisma, fakeVectorStore([ARTICLE]).store, null);
    const response = await service.reply('travail forcé');
    expect(response.reply).toContain(
      '1. Code du travail, Article 2 : « Le droit au travail est reconnu',
    );
    expect(response.reply).toContain('vérifiez auprès de l’administration concernée');
    expect(response.reply).toContain('⚠️ Code du travail : Texte de 1992.');
  });

  it('cite les textes si le modèle de langage échoue (clé refusée, quota)', async () => {
    const { prisma, messages } = memoryPrisma();
    const failing: LanguageModel = {
      name: 'gemini-3.8-flash',
      complete: async () => {
        throw new Error('403 Your project has been denied access');
      },
    };
    const service = new ChatService(prisma, fakeVectorStore([ARTICLE]).store, failing);
    const response = await service.reply('Le travail forcé est-il interdit ?');
    expect(response.reply).toContain('1. Code du travail, Article 2');
    expect((messages[1]?.metadata as { model: string }).model).toBe('extractif');
  });

  it('écarte les extraits sous le seuil de pertinence', async () => {
    const { prisma } = memoryPrisma();
    const offTopic: SearchResult = { ...ARTICLE, id: '2', reference: 'Article 124', score: 0.07 };
    const service = new ChatService(prisma, fakeVectorStore([offTopic]).store, null);
    const response = await service.reply('Comment obtenir un passeport ?');
    expect(response.sources).toEqual([]);
    expect(response.reply).toContain("Je n'ai pas trouvé de texte officiel");
  });

  it('sans modèle ni extrait, le dit clairement', async () => {
    const { prisma } = memoryPrisma();
    const service = new ChatService(prisma, fakeVectorStore([]).store, null);
    const response = await service.reply('Quel temps fait-il ?');
    expect(response.reply).toContain("Je n'ai pas trouvé de texte officiel");
    expect(response.sources).toEqual([]);
  });
});
