import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SearchResult, VectorStoreService } from '@sonah/rag';
import { PrismaService } from '../prisma/prisma.service';
import { VECTOR_STORE } from '../rag/rag.tokens';
import type { ChatResponse, ChatSource } from './chat.schemas';
import { LANGUAGE_MODEL, type ChatTurn, type LanguageModel } from './language-model';
import { formatContext, SONAH_SYSTEM_PROMPT } from './sonah-prompt';

/** Nombre d'extraits fournis au modèle. */
const CONTEXT_SIZE = 6;
/** Nombre de messages précédents repris pour garder le fil de la conversation. */
const HISTORY_SIZE = 8;
/** Un message court (« et pour un étranger ? ») est complété par la question précédente pour la recherche. */
const SHORT_MESSAGE_LENGTH = 80;
const EXCERPT_LENGTH = 320;

interface StoredTurn {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
}

function toSource(result: SearchResult): ChatSource {
  const shortTitle =
    typeof result.metadata?.shortTitle === 'string' ? result.metadata.shortTitle : result.category;
  return {
    title: shortTitle,
    reference: result.reference ?? undefined,
    url: result.source.startsWith('http') ? result.source : undefined,
  };
}

function excerpt(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > EXCERPT_LENGTH
    ? `${compact.slice(0, EXCERPT_LENGTH).replace(/\s\S*$/, '')}…`
    : compact;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(VECTOR_STORE) private readonly vectorStore: VectorStoreService,
    @Inject(LANGUAGE_MODEL) private readonly languageModel: LanguageModel | null,
  ) {}

  /** Répond à un message : recherche des textes pertinents, rédaction, historisation. */
  async reply(message: string, conversationId?: string): Promise<ChatResponse> {
    const conversation = await this.findOrCreateConversation(conversationId);
    const history = await this.loadHistory(conversation.id);
    await this.prisma.message.create({
      data: { conversationId: conversation.id, role: 'USER', content: message },
    });

    // Les extraits hors sujet sont écartés : mieux vaut dire « je n'ai pas ce texte » que citer à côté
    const results = await this.vectorStore.search(
      this.retrievalQuery(message, history),
      CONTEXT_SIZE,
      {
        minScore: this.vectorStore.relevanceThreshold,
      },
    );
    const sources = this.uniqueSources(results);

    let reply: string;
    let model: string;
    if (this.languageModel) {
      reply = await this.languageModel.complete(this.buildTurns(message, history, results));
      model = this.languageModel.name;
    } else {
      reply = this.extractiveReply(results);
      model = 'extractif';
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: reply,
        metadata: {
          model,
          embeddingModel: this.vectorStore.embeddingModel,
          sources: sources.map((s) => ({ ...s })),
        },
      },
    });
    this.logger.log(
      `Réponse ${model} (${results.length} extraits) pour la conversation ${conversation.id}`,
    );

    return { conversationId: conversation.id, reply, sources };
  }

  private async findOrCreateConversation(conversationId?: string): Promise<{ id: string }> {
    if (conversationId) {
      const existing = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true },
      });
      if (existing) return existing;
    }
    return this.prisma.conversation.create({ data: {}, select: { id: true } });
  }

  private async loadHistory(conversationId: string): Promise<StoredTurn[]> {
    const recent = await this.prisma.message.findMany({
      where: { conversationId, role: { in: ['USER', 'ASSISTANT'] } },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_SIZE,
      select: { role: true, content: true },
    });
    return recent.reverse();
  }

  private retrievalQuery(message: string, history: readonly StoredTurn[]): string {
    if (message.length >= SHORT_MESSAGE_LENGTH) return message;
    const previousQuestion = [...history].reverse().find((turn) => turn.role === 'USER');
    return previousQuestion ? `${previousQuestion.content}\n${message}` : message;
  }

  private buildTurns(
    message: string,
    history: readonly StoredTurn[],
    results: readonly SearchResult[],
  ): ChatTurn[] {
    return [
      { role: 'system', content: SONAH_SYSTEM_PROMPT },
      { role: 'system', content: formatContext(results) },
      ...history.map((turn): ChatTurn => ({
        role: turn.role === 'USER' ? 'user' : 'assistant',
        content: turn.content,
      })),
      { role: 'user', content: message },
    ];
  }

  /** Sans modèle de langage : présente honnêtement les articles les plus proches. */
  private extractiveReply(results: readonly SearchResult[]): string {
    if (results.length === 0) {
      return (
        "Je n'ai pas trouvé de texte officiel correspondant à votre question dans ceux que je connais pour l'instant " +
        '(Constitution et Code du travail). Pour une démarche précise, rapprochez-vous de l’administration concernée.'
      );
    }
    const cited = results.slice(0, 3);
    const items = cited.map((result, index) => {
      const source = toSource(result);
      return `${index + 1}. ${source.title}, ${source.reference ?? 'extrait'} : « ${excerpt(result.content)} »`;
    });
    // Avertissements de version (texte modifié depuis), une fois par texte cité
    const notes = [
      ...new Map(
        cited.flatMap((result) => {
          const note = result.metadata?.note;
          return typeof note === 'string'
            ? [[result.sourceId, `⚠️ ${toSource(result).title} : ${note}`] as const]
            : [];
        }),
      ).values(),
    ];
    return [
      'Voici les textes officiels qui se rapprochent le plus de votre question :',
      '',
      ...items,
      ...(notes.length > 0 ? ['', ...notes] : []),
      '',
      'Je vous les cite tels quels pour le moment. Pour une démarche précise (pièces, coûts, délais), ' +
        'vérifiez auprès de l’administration concernée.',
    ].join('\n');
  }

  private uniqueSources(results: readonly SearchResult[]): ChatSource[] {
    const seen = new Set<string>();
    return results.map(toSource).filter((source) => {
      const key = `${source.title}|${source.reference ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
