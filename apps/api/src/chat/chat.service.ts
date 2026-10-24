import { Injectable, Logger } from '@nestjs/common';
import { getAgent } from '../agents/agent-registry';
import { AnswerEngine } from '../agents/answer-engine.service';
import { AuditService } from '../audit/audit.service';
import { TraceRecorder } from '../audit/trace-recorder';
import { buildRetrievalQuery } from '../policy/follow-up';
import { classifyIntent, type IntentResult } from '../policy/intent';
import { detectLanguage } from '../policy/language';
import { maskPii, piiNotice } from '../policy/pii';
import type { Citation, Language, Verdict } from '../policy/policy.types';
import type { ProcedurePayload } from '../policy/procedure-answer';
import { detectSensitiveSituation } from '../policy/situations';
import { PrismaService } from '../prisma/prisma.service';
import { ProcedureService } from '../procedures/procedure.service';
import type { AnswerType, ChatResponse, ChatSource } from './chat.schemas';
import type { ChatTurn } from './language-model';

/** Nombre de messages précédents repris pour garder le fil de la conversation. */
const HISTORY_SIZE = 8;

/**
 * Marge ajoutée au seuil de pertinence pour citer une loi dans une demande mixte (démarche + droit)
 * sans fiche : seul un texte nettement pertinent est cité.
 */
export const MIXED_LAW_MARGIN = 0.02;
/**
 * Demande classée « démarche » sans fiche correspondante : c'est parfois une question de droit
 * formulée comme une démarche (« combien de jours de congé payé par an ? »). Les textes ne sont
 * alors cités que s'ils sont très pertinents (seuil + 0,03) ; sinon, orientation honnête.
 */
export const PROCEDURE_LAW_MARGIN = 0.03;

interface RoutedAnswer {
  readonly reply: string;
  readonly verdict: Verdict;
  readonly citations: readonly Citation[];
  readonly sources: ChatSource[];
  readonly model: string;
  readonly promptVersion: string;
  readonly answerType: AnswerType;
  readonly procedure?: ProcedurePayload;
  readonly evidenceCount: number;
}

/** Sources d'une fiche de démarche au format historique. */
function procedureSources(
  sources: ReadonlyArray<{ title: string; url: string | null }>,
): ChatSource[] {
  return sources.map((source) => ({
    title: source.title,
    ...(source.url ? { url: source.url } : {}),
  }));
}

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
    private readonly procedures: ProcedureService,
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
    let intent = classifyIntent(pii.text);
    // Relance elliptique sans indice propre (« et pour un mineur ? ») : intention de la question précédente
    if (retrieval.previousQuestionUsed && intent.signals.every((s) => s.startsWith('default:'))) {
      const previous = classifyIntent(retrieval.query);
      intent = { intent: previous.intent, signals: ['elliptical', ...previous.signals] };
    }
    recorder.add({
      type: 'input',
      agent: sonah.id,
      summary: `Message reçu (${language}, ${detection.source})${
        pii.total > 0 ? `, ${pii.total} donnée(s) personnelle(s) masquée(s)` : ''
      }${retrieval.previousQuestionUsed ? ', relance elliptique' : ''}, intention ${intent.intent}`,
      data: {
        messageLength: message.length,
        language,
        languageSource: detection.source,
        languageScores: detection.scores,
        piiMasked: pii.findings,
        elliptical: retrieval.elliptical,
        previousQuestionUsed: retrieval.previousQuestionUsed,
        historyTurns: history.length,
        intent: intent.intent,
        intentSignals: intent.signals,
      },
    });

    const answer = await this.route(intent, pii.text, retrieval.query, language, recorder, history);

    const reply = pii.total > 0 ? `${piiNotice(language)}\n\n${answer.reply}` : answer.reply;
    recorder.add({
      type: 'output',
      agent: sonah.id,
      summary: `Réponse ${answer.verdict} (${answer.answerType}) avec ${answer.citations.length} citation(s)`,
      data: {
        verdict: answer.verdict,
        answerType: answer.answerType,
        intent: intent.intent,
        procedureId: answer.procedure?.id ?? null,
        citations: answer.citations.map((c) => ({
          index: c.index,
          documentId: c.documentId,
          status: c.status,
        })),
        replyLength: reply.length,
        writer: answer.model,
        piiNoticeShown: pii.total > 0,
      },
    });

    await this.audit.record(recorder, {
      kind: 'chat',
      verdict: answer.verdict,
      conversationId: conversation.id,
      agentId: sonah.id,
      promptVersion: answer.promptVersion,
      model: answer.model,
    });

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: reply,
        metadata: {
          model: answer.model,
          verdict: answer.verdict,
          answerType: answer.answerType,
          intent: intent.intent,
          procedureId: answer.procedure?.id ?? null,
          traceId: recorder.id,
          language,
          citations: answer.citations.map((c) => ({ ...c })),
        },
      },
    });
    this.logger.log(
      `Réponse ${answer.verdict} (${answer.answerType}, ${answer.model}) — conversation ${conversation.id}, trace ${recorder.id}`,
    );

    return {
      conversationId: conversation.id,
      reply,
      language,
      verdict: answer.verdict,
      citations: answer.citations,
      sources: answer.sources,
      traceId: recorder.id,
      // Hors sujet : ni démarche, ni texte, ni orientation
      ...(answer.verdict === 'OUT_OF_SCOPE' ? {} : { answerType: answer.answerType }),
      ...(answer.procedure ? { procedure: answer.procedure } : {}),
    };
  }

  /**
   * Aiguillage selon l'intention : démarche → fiche (ou orientation sans fiche, jamais une loi sans
   * rapport) ; mixte sans fiche → textes seulement s'ils sont nettement pertinents ; droits et hors
   * sujet → pipeline juridique inchangé. Une situation sensible suit toujours le pipeline juridique
   * (orientation vers un humain).
   */
  private async route(
    intent: IntentResult,
    question: string,
    retrievalQuery: string,
    language: Language,
    recorder: TraceRecorder,
    history: readonly StoredTurn[],
  ): Promise<RoutedAnswer> {
    const sonah = getAgent('sonah');
    const legal = async (minScoreMargin?: number): Promise<RoutedAnswer> => {
      const outcome = await this.engine.answer({
        agent: sonah,
        question,
        retrievalQuery,
        language,
        recorder,
        minScoreMargin,
        history: history.map((turn): ChatTurn => ({
          role: turn.role === 'USER' ? 'user' : 'assistant',
          content: turn.content,
        })),
      });
      return {
        reply: outcome.reply,
        verdict: outcome.verdict,
        citations: outcome.citations,
        sources: legacySources(outcome.citations),
        model: outcome.model,
        promptVersion: outcome.promptVersion,
        answerType: 'legal',
        evidenceCount: outcome.evidence.length,
      };
    };

    const procedural = intent.intent === 'procedure' || intent.intent === 'mixed';
    if (!procedural || detectSensitiveSituation(question)) return legal();

    const match = await this.procedures.find(retrievalQuery, recorder, sonah.id);
    if (match.best) {
      const outcome = await this.procedures.answerWithSheet(
        match.best,
        question,
        language,
        recorder,
        sonah.id,
      );
      return {
        reply: outcome.gate.reply,
        verdict: outcome.gate.verdict,
        citations: outcome.gate.citations,
        sources: procedureSources(match.best.sheet.sources),
        model: outcome.model,
        promptVersion: outcome.promptVersion,
        answerType: 'procedure',
        procedure: outcome.procedure ?? undefined,
        evidenceCount: 1,
      };
    }

    if (intent.intent === 'procedure') {
      const answer = await legal(PROCEDURE_LAW_MARGIN);
      const grounded = !['INSUFFICIENT_EVIDENCE', 'OUT_OF_SCOPE'].includes(answer.verdict);
      if (answer.evidenceCount > 0 && grounded) return answer;
    }

    const orientation = this.procedures.orientation(question, language, recorder, sonah.id);
    if (intent.intent === 'mixed') {
      // Question de droit associée : un texte n'est cité que s'il est nettement pertinent
      const answer = await legal(MIXED_LAW_MARGIN);
      if (answer.evidenceCount > 0 && answer.verdict !== 'OUT_OF_SCOPE') {
        return { ...answer, reply: `${orientation.gate.reply}\n\n${answer.reply}` };
      }
    }
    return {
      reply: orientation.gate.reply,
      verdict: orientation.gate.verdict,
      citations: [],
      sources: [],
      model: orientation.model,
      promptVersion: orientation.promptVersion,
      answerType: 'orientation',
      evidenceCount: 0,
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
