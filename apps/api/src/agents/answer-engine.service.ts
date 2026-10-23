import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SearchResult, VectorStoreService } from '@sonah/rag';
import { TraceRecorder } from '../audit/trace-recorder';
import { LANGUAGE_MODEL, type ChatTurn, type LanguageModel } from '../chat/language-model';
import { buildSystemPrompt, formatContext, PROMPT_VERSION } from '../chat/sonah-prompt';
import { shortTitleOf, statusOf } from '../policy/evidence';
import {
  applyPolicyGate,
  normalizeCitationMarkers,
  POLICY_GATE_VERSION,
  type GateResult,
} from '../policy/policy-gate';
import type { Citation, ConflictHint, Language, TextStatus, Verdict } from '../policy/policy.types';
import { VECTOR_STORE } from '../rag/rag.tokens';
import type { AgentDefinition } from './agent.types';
import { CORPUS_CATALOG, type CorpusCatalog } from './corpus-catalog';

/** Nombre d'extraits fournis au modèle. */
export const CONTEXT_SIZE = 6;
/** Taille maximale d'un brouillon conservé dans la trace. */
const TRACE_DRAFT_LIMIT = 4000;

/** Article imposé par un scénario (événement reproductible), cherché par sa référence. */
export interface PinnedEvidence {
  readonly sourceId: string;
  readonly reference: string;
}

/** Statut juridique connu, appliqué quand la base n'en fournit pas (scénario). */
export interface StatusOverlay {
  readonly sourceId: string;
  readonly reference: string;
  readonly status: TextStatus;
  readonly amendedBy?: string;
}

export interface AnswerRequest {
  readonly agent: AgentDefinition;
  /** Question (déjà masquée). */
  readonly question: string;
  /** Requête de recherche, si différente de la question (relance elliptique). */
  readonly retrievalQuery?: string;
  readonly language: Language;
  readonly recorder: TraceRecorder;
  readonly history?: readonly ChatTurn[];
  /** Contexte de l'événement (scénario), transmis au modèle. */
  readonly context?: string;
  readonly conflictHints?: readonly ConflictHint[];
  /** Simule une panne du modèle de langage (scénario « LLM indisponible »). */
  readonly simulateModelOutage?: boolean;
  readonly pinned?: readonly PinnedEvidence[];
  readonly statusOverlay?: readonly StatusOverlay[];
}

export interface AnswerOutcome {
  readonly reply: string;
  readonly verdict: Verdict;
  readonly citations: Citation[];
  readonly evidence: readonly SearchResult[];
  readonly gate: GateResult;
  /** Nom du modèle utilisé, ou « extractive ». */
  readonly model: string;
  readonly promptVersion: string;
  readonly usedFallback: boolean;
}

export const EXTRACTIVE_MODEL = 'extractive';

function round(score: number): number {
  return Math.round(score * 10_000) / 10_000;
}

function applyOverlay(
  results: readonly SearchResult[],
  overlay: readonly StatusOverlay[] | undefined,
): SearchResult[] {
  if (!overlay || overlay.length === 0) return [...results];
  return results.map((result) => {
    const match = overlay.find(
      (o) => o.sourceId === result.sourceId && o.reference === result.reference,
    );
    if (!match || typeof result.metadata?.status === 'string') return result;
    return {
      ...result,
      metadata: {
        ...(result.metadata ?? {}),
        status: match.status,
        ...(match.amendedBy ? { amendedBy: match.amendedBy } : {}),
        statusOrigin: 'scenario',
      },
    };
  });
}

/**
 * Moteur de réponse partagé par Sonah et les agents : recherche dans les sources de l'agent,
 * brouillon du modèle (facultatif), contrôle de politique, résumé de raisonnement tracé.
 */
@Injectable()
export class AnswerEngine {
  private readonly logger = new Logger(AnswerEngine.name);

  constructor(
    @Inject(VECTOR_STORE) private readonly vectorStore: VectorStoreService,
    @Inject(CORPUS_CATALOG) private readonly catalog: CorpusCatalog,
    @Inject(LANGUAGE_MODEL) private readonly languageModel: LanguageModel | null,
  ) {}

  get modelName(): string {
    return this.languageModel?.name ?? EXTRACTIVE_MODEL;
  }

  async answer(request: AnswerRequest): Promise<AnswerOutcome> {
    const { agent, recorder, language } = request;
    const evidence = await this.retrieve(request);

    // Brouillon du modèle, ou repli extractif tracé
    let draft: string | null = null;
    let model = EXTRACTIVE_MODEL;
    let usedFallback = false;
    if (this.languageModel && evidence.length > 0) {
      const turns = this.buildTurns(request, evidence);
      const start = performance.now();
      try {
        if (request.simulateModelOutage) {
          throw new Error('Panne simulée du modèle de langage (quota épuisé)');
        }
        // Les marqueurs « 【n】 » de certains modèles sont ramenés à « [n] » avant le contrôle
        draft = normalizeCitationMarkers(await this.languageModel.complete(turns));
        model = this.languageModel.name;
        recorder.add({
          type: 'llm',
          agent: agent.id,
          summary: `Brouillon rédigé par ${model}`,
          data: {
            model,
            promptVersion: PROMPT_VERSION,
            turns: turns.length,
            draft: draft.slice(0, TRACE_DRAFT_LIMIT),
          },
          durationMs: performance.now() - start,
        });
      } catch (error) {
        usedFallback = true;
        const reason = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Modèle indisponible pour ${agent.id} : ${reason}`);
        recorder.add({
          type: 'fallback',
          agent: agent.id,
          summary: 'Modèle de langage indisponible : réponse extractive à partir des textes cités',
          data: {
            model: this.languageModel.name,
            reason,
            simulated: !!request.simulateModelOutage,
          },
          durationMs: performance.now() - start,
        });
      }
    } else if (request.simulateModelOutage) {
      usedFallback = true;
      recorder.add({
        type: 'fallback',
        agent: agent.id,
        summary: 'Panne du modèle simulée : réponse extractive à partir des textes cités',
        data: { model: this.modelName, simulated: true },
      });
    }

    const start = performance.now();
    const gate = applyPolicyGate({
      question: request.question,
      language,
      evidence,
      draft,
      conflictHints: request.conflictHints,
    });
    recorder.add({
      type: 'gate',
      agent: agent.id,
      summary: `Contrôle de politique : ${gate.verdict} (${gate.rule})`,
      data: {
        gateVersion: POLICY_GATE_VERSION,
        verdict: gate.verdict,
        rule: gate.rule,
        draftAccepted: gate.draftAccepted,
        rejectionReasons: gate.rejectionReasons,
        checks: gate.checks,
        outdated: gate.outdated,
        conflicts: gate.conflicts,
        sensitiveCategory: gate.sensitiveCategory,
      },
      durationMs: performance.now() - start,
    });
    if (gate.draftAccepted === false) {
      recorder.add({
        type: 'fallback',
        agent: agent.id,
        summary: 'Brouillon du modèle rejeté : remplacé par la réponse extractive',
        data: { reasons: gate.rejectionReasons },
      });
      usedFallback = true;
    }

    recorder.add({
      type: 'agent',
      agent: agent.id,
      summary: this.reasoningSummary(agent, evidence, gate, model, language),
      data: {
        role: agent.role,
        mandate: agent.mandate.en,
        rules: agent.rules,
        evidenceConsidered: evidence.map((result, i) => ({
          index: i + 1,
          ref: `${shortTitleOf(result)} ${result.reference ?? ''}`.trim(),
          status: statusOf(result),
          score: round(result.score),
        })),
        evidenceCited: gate.citations.map((c) => c.index),
        ruleApplied: gate.rule,
        decision: gate.verdict,
        writer: gate.draftAccepted === true ? model : EXTRACTIVE_MODEL,
      },
    });

    return {
      reply: gate.reply,
      verdict: gate.verdict,
      citations: gate.citations,
      evidence,
      gate,
      model: gate.draftAccepted === true ? model : EXTRACTIVE_MODEL,
      promptVersion: PROMPT_VERSION,
      usedFallback,
    };
  }

  /** Recherche limitée aux sources de l'agent quand le corpus les contient, sinon tout le corpus. */
  private async retrieve(request: AnswerRequest): Promise<SearchResult[]> {
    const { agent, recorder } = request;
    const start = performance.now();
    const available = await this.catalog.sourceIds();
    const declared = agent.sources.length > 0 || agent.sourcePatterns.length > 0;
    const matched = available.filter(
      (id) => agent.sources.includes(id) || agent.sourcePatterns.some((p) => p.test(id)),
    );
    const sourceIds = matched.length > 0 ? matched : undefined;
    const scope = !declared ? 'all_sources' : sourceIds ? 'agent_sources' : 'fallback_all_sources';

    let results = await this.vectorStore.search(
      request.retrievalQuery ?? request.question,
      CONTEXT_SIZE,
      { minScore: this.vectorStore.relevanceThreshold, sourceIds },
    );

    // Articles imposés par le scénario : placés en tête (événement reproductible)
    const pinned: string[] = [];
    for (const pin of request.pinned ?? []) {
      const isPin = (r: SearchResult) =>
        r.sourceId === pin.sourceId && r.reference === pin.reference;
      const found =
        results.find(isPin) ?? (await this.catalog.findByReference(pin.sourceId, pin.reference));
      if (found) {
        results = [found, ...results.filter((r) => !isPin(r))].slice(0, CONTEXT_SIZE);
        pinned.push(found.id);
      }
    }
    results = applyOverlay(results, request.statusOverlay);

    recorder.add({
      type: 'retrieval',
      agent: agent.id,
      summary: `${results.length} extrait(s) retenu(s) (${scope})`,
      data: {
        query: (request.retrievalQuery ?? request.question).slice(0, 500),
        scope,
        sourceIds: sourceIds ?? null,
        embeddingModel: this.vectorStore.embeddingModel,
        minScore: this.vectorStore.relevanceThreshold,
        pinnedByScenario: pinned,
        results: results.map((result, i) => ({
          index: i + 1,
          documentId: result.id,
          sourceId: result.sourceId,
          reference: result.reference,
          score: round(result.score),
          status: statusOf(result),
          ...(result.metadata?.statusOrigin ? { statusOrigin: result.metadata.statusOrigin } : {}),
        })),
      },
      durationMs: performance.now() - start,
    });
    return results;
  }

  private buildTurns(request: AnswerRequest, evidence: readonly SearchResult[]): ChatTurn[] {
    return [
      { role: 'system', content: buildSystemPrompt(request.agent, request.language) },
      { role: 'system', content: formatContext(evidence) },
      ...(request.context
        ? [{ role: 'system' as const, content: `CONTEXTE DE L'ÉVÉNEMENT :\n${request.context}` }]
        : []),
      ...(request.history ?? []),
      { role: 'user', content: request.question },
    ];
  }

  /** Explication déterministe de la décision : preuves, règle appliquée, rédacteur. */
  private reasoningSummary(
    agent: AgentDefinition,
    evidence: readonly SearchResult[],
    gate: GateResult,
    model: string,
    language: Language,
  ): string {
    const cited = gate.citations.map((c) => `[${c.index}] ${c.title} ${c.reference}`.trim());
    if (language === 'fr') {
      return [
        `${agent.name.fr} : ${evidence.length} extrait(s) examiné(s)`,
        cited.length > 0 ? `cité(s) : ${cited.join(' ; ')}` : 'aucun extrait cité',
        `règle appliquée : ${gate.rule}`,
        `rédaction : ${gate.draftAccepted === true ? model : 'extractive'}`,
        `décision : ${gate.verdict}`,
      ].join(' — ');
    }
    return [
      `${agent.name.en}: ${evidence.length} excerpt(s) examined`,
      cited.length > 0 ? `cited: ${cited.join('; ')}` : 'no excerpt cited',
      `rule applied: ${gate.rule}`,
      `writer: ${gate.draftAccepted === true ? model : 'extractive'}`,
      `decision: ${gate.verdict}`,
    ].join(' — ');
  }
}
