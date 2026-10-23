import { Injectable, Logger } from '@nestjs/common';
import { getAgent } from '../agents/agent-registry';
import { AnswerEngine } from '../agents/answer-engine.service';
import { AuditService } from '../audit/audit.service';
import { TraceRecorder } from '../audit/trace-recorder';
import { buildRetrievalQuery } from '../policy/follow-up';
import { detectLanguage } from '../policy/language';
import { maskPii, piiNotice } from '../policy/pii';
import type { Citation, Language } from '../policy/policy.types';
import { PrismaService } from '../prisma/prisma.service';
import type { ChatResponse, ChatSource } from './chat.schemas';
import type { ChatTurn } from './language-model';

/** Nombre de messages précédents repris pour garder le fil de la conversation. */
const HISTORY_SIZE = 8;

interface StoredTurn {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
}

/** Sources au format historique : une par texte et article cités. */
function legacySources(citations: readonly Citation[]): ChatSource[] {
  const seen = new Set<string>();
  return citations.flatMap((citation) => {
    const key = `${citation.title}|${citation.reference}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        title: citation.title,
        ...(citation.reference ? { reference: citation.reference } : {}),
        ...(citation.url ? { url: citation.url } : {}),
      },
    ];
  });
}

/**
 * Pipeline de conversation : masquage des données personnelles, détection de la langue,
 * recherche (avec relance elliptique), rédaction contrôlée par le nœud de politique,
 * historisation et trace d'audit pour chaque requête.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: AnswerEngine,
    private readonly audit: AuditService,
  ) {}

  async reply(
    message: string,
    conversationId?: string,
    languageOverride?: Language,
  ): Promise<ChatResponse> {
    const recorder = new TraceRecorder();
    const sonah = getAgent('sonah');

    // Données personnelles masquées avant tout stockage ou envoi au modèle
    const pii = maskPii(message);
    const detection = detectLanguage(pii.text, languageOverride);
    const language = detection.language;

    const conversation = await this.findOrCreateConversation(conversationId);
    const history = await this.loadHistory(conversation.id);
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: pii.text,
        metadata: { language, piiMasked: pii.findings },
      },
    });

    const previousQuestion = [...history].reverse().find((turn) => turn.role === 'USER')?.content;
    const retrieval = buildRetrievalQuery(pii.text, previousQuestion);
    recorder.add({
      type: 'input',
      agent: sonah.id,
      summary: `Message reçu (${language}, ${detection.source})${
        pii.total > 0 ? `, ${pii.total} donnée(s) personnelle(s) masquée(s)` : ''
      }${retrieval.previousQuestionUsed ? ', relance elliptique' : ''}`,
      data: {
        messageLength: message.length,
        language,
        languageSource: detection.source,
        languageScores: detection.scores,
        piiMasked: pii.findings,
        elliptical: retrieval.elliptical,
        previousQuestionUsed: retrieval.previousQuestionUsed,
        historyTurns: history.length,
      },
    });

    const outcome = await this.engine.answer({
      agent: sonah,
      question: pii.text,
      retrievalQuery: retrieval.query,
      language,
      recorder,
      history: history.map((turn): ChatTurn => ({
        role: turn.role === 'USER' ? 'user' : 'assistant',
        content: turn.content,
      })),
    });

    const reply = pii.total > 0 ? `${piiNotice(language)}\n\n${outcome.reply}` : outcome.reply;
    const sources = legacySources(outcome.citations);
    recorder.add({
      type: 'output',
      agent: sonah.id,
      summary: `Réponse ${outcome.verdict} avec ${outcome.citations.length} citation(s)`,
      data: {
        verdict: outcome.verdict,
        citations: outcome.citations.map((c) => ({
          index: c.index,
          documentId: c.documentId,
          status: c.status,
        })),
        replyLength: reply.length,
        writer: outcome.model,
        piiNoticeShown: pii.total > 0,
      },
    });

    await this.audit.record(recorder, {
      kind: 'chat',
      verdict: outcome.verdict,
      conversationId: conversation.id,
      agentId: sonah.id,
      promptVersion: outcome.promptVersion,
      model: outcome.model,
    });

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: reply,
        metadata: {
          model: outcome.model,
          verdict: outcome.verdict,
          traceId: recorder.id,
          language,
          citations: outcome.citations.map((c) => ({ ...c })),
        },
      },
    });
    this.logger.log(
      `Réponse ${outcome.verdict} (${outcome.model}, ${outcome.evidence.length} extraits) — conversation ${conversation.id}, trace ${recorder.id}`,
    );

    return {
      conversationId: conversation.id,
      reply,
      language,
      verdict: outcome.verdict,
      citations: outcome.citations,
      sources,
      traceId: recorder.id,
    };
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
}
