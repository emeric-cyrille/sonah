import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  matchProcedureKeywords,
  PROCEDURES_SOURCE_ID,
  procedureFromMetadata,
  type ProcedureSheet,
  type SearchResult,
  type VectorStoreService,
} from '@sonah/rag';
import { CORPUS_CATALOG, type CorpusCatalog } from '../agents/corpus-catalog';
import type { TraceRecorder } from '../audit/trace-recorder';
import { LANGUAGE_MODEL, type ChatTurn, type LanguageModel } from '../chat/language-model';
import { detectOrientationCategory, type OrientationCategory } from '../policy/orientation';
import { POLICY_GATE_VERSION, type GateResult } from '../policy/policy-gate';
import type { Language } from '../policy/policy.types';
import { toProcedurePayload, type ProcedurePayload } from '../policy/procedure-answer';
import { applyOrientationGate, applyProcedureGate } from '../policy/procedure-gate';
import { VECTOR_STORE } from '../rag/rag.tokens';

/** Fiches examinées par la recherche vectorielle. */
const PROCEDURE_CANDIDATES = 5;
/** Version du prompt d'introduction des fiches (enregistrée dans la trace). */
export const PROCEDURE_PROMPT_VERSION = 'sonah-procedure-intro-2026-10-24.1';
const EXTRACTIVE = 'extractive';

export interface ProcedureCandidate {
  readonly document: SearchResult;
  readonly sheet: ProcedureSheet;
  readonly keywordScore: number;
  readonly matchedKeywords: string[];
  readonly sharedTokens: string[];
  readonly specific: boolean;
  /** Similarité cosinus (null si la fiche n'est pas parmi les plus proches). */
  readonly vectorScore: number | null;
  readonly accepted: boolean;
}

export interface ProcedureMatch {
  readonly best: ProcedureCandidate | null;
  readonly candidates: ProcedureCandidate[];
}

export interface ProcedureOutcome {
  readonly kind: 'procedure' | 'orientation';
  readonly gate: GateResult;
  readonly procedure: ProcedurePayload | null;
  readonly category: OrientationCategory | null;
  readonly model: string;
  readonly promptVersion: string;
}

function round(score: number | null): number | null {
  return score === null ? null : Math.round(score * 10_000) / 10_000;
}

/**
 * Démarches administratives : recherche de la fiche correspondant à la demande (mots-clés de la
 * fiche, puis similarité vectorielle avec le même modèle d'embedding que les textes), réponse
 * structurée contrôlée, ou orientation honnête quand aucune fiche n'existe.
 */
@Injectable()
export class ProcedureService {
  private readonly logger = new Logger(ProcedureService.name);

  constructor(
    @Inject(VECTOR_STORE) private readonly vectorStore: VectorStoreService,
    @Inject(CORPUS_CATALOG) private readonly catalog: CorpusCatalog,
    @Inject(LANGUAGE_MODEL) private readonly languageModel: LanguageModel | null,
  ) {}

  /**
   * Fiche retenue : un mot-clé complet et spécifique de la fiche figure dans la demande, ou la
   * fiche partage un mot spécifique avec la demande et dépasse le seuil de similarité. Une simple
   * proximité vectorielle ne suffit jamais (« passeport » est proche de « carte d'identité »).
   */
  async find(query: string, recorder: TraceRecorder, agentId: string): Promise<ProcedureMatch> {
    const start = performance.now();
    const documents = await this.catalog.procedures();
    const sheets = documents.flatMap((document) => {
      const sheet = procedureFromMetadata(document.metadata);
      return sheet ? [{ document, sheet }] : [];
    });

    let vectorScores = new Map<string, number>();
    if (sheets.length > 0) {
      const results = await this.vectorStore.search(query, PROCEDURE_CANDIDATES, {
        types: ['PROCEDURE'],
        sourceIds: [PROCEDURES_SOURCE_ID],
        hybrid: false,
      });
      vectorScores = new Map(results.map((result) => [result.id, result.score]));
    }
    const threshold = this.vectorStore.relevanceThreshold;

    const candidates = sheets
      .map(({ document, sheet }): ProcedureCandidate => {
        const keywords = matchProcedureKeywords(query, sheet);
        const vectorScore = vectorScores.get(document.id) ?? null;
        const accepted =
          keywords.specific ||
          (keywords.sharedTokens.length > 0 && vectorScore !== null && vectorScore >= threshold);
        return {
          document,
          sheet,
          keywordScore: keywords.score,
          matchedKeywords: keywords.matchedKeywords,
          sharedTokens: keywords.sharedTokens,
          specific: keywords.specific,
          vectorScore,
          accepted,
        };
      })
      .filter((candidate) => candidate.keywordScore > 0 || candidate.vectorScore !== null)
      .sort(
        (a, b) =>
          Number(b.accepted) - Number(a.accepted) ||
          b.keywordScore - a.keywordScore ||
          (b.vectorScore ?? -1) - (a.vectorScore ?? -1) ||
          a.sheet.id.localeCompare(b.sheet.id),
      );
    const best = candidates[0]?.accepted ? candidates[0] : null;

    recorder.add({
      type: 'retrieval',
      agent: agentId,
      summary: best
        ? `Fiche de démarche retenue : ${best.sheet.id}`
        : `Aucune fiche de démarche correspondante (${sheets.length} fiche(s) indexée(s))`,
      data: {
        scope: 'procedures',
        query: query.slice(0, 500),
        documentTypes: ['PROCEDURE'],
        embeddingModel: this.vectorStore.embeddingModel,
        minScore: threshold,
        indexedSheets: sheets.length,
        selected: best?.sheet.id ?? null,
        candidates: candidates.slice(0, PROCEDURE_CANDIDATES).map((c) => ({
          procedureId: c.sheet.id,
          documentId: c.document.id,
          keywordScore: c.keywordScore,
          matchedKeywords: c.matchedKeywords,
          sharedTokens: c.sharedTokens,
          vectorScore: round(c.vectorScore),
          accepted: c.accepted,
        })),
      },
      durationMs: performance.now() - start,
    });
    return { best, candidates };
  }

  /** Réponse structurée depuis une fiche (introduction éventuellement rédigée par le modèle). */
  async answerWithSheet(
    candidate: ProcedureCandidate,
    question: string,
    language: Language,
    recorder: TraceRecorder,
    agentId: string,
  ): Promise<ProcedureOutcome> {
    const draft = await this.draftIntro(candidate.sheet, question, language, recorder, agentId);
    const gate = applyProcedureGate({
      sheet: candidate.sheet,
      document: candidate.document,
      language,
      draft,
    });
    this.recordGate(gate, recorder, agentId);
    return {
      kind: 'procedure',
      gate,
      procedure: toProcedurePayload(candidate.sheet, language),
      category: null,
      model:
        gate.draftAccepted === true && this.languageModel ? this.languageModel.name : EXTRACTIVE,
      promptVersion: PROCEDURE_PROMPT_VERSION,
    };
  }

  /** Démarche sans fiche : orientation générale (table déterministe), sans coût, délai ni pièces. */
  orientation(
    question: string,
    language: Language,
    recorder: TraceRecorder,
    agentId: string,
  ): ProcedureOutcome {
    const category = detectOrientationCategory(question);
    const gate = applyOrientationGate({ category, language, question, draft: null });
    this.recordGate(gate, recorder, agentId);
    return {
      kind: 'orientation',
      gate,
      procedure: null,
      category,
      model: EXTRACTIVE,
      promptVersion: PROCEDURE_PROMPT_VERSION,
    };
  }

  private recordGate(gate: GateResult, recorder: TraceRecorder, agentId: string): void {
    recorder.add({
      type: 'gate',
      agent: agentId,
      summary: `Contrôle de politique : ${gate.verdict} (${gate.rule})`,
      data: {
        gateVersion: POLICY_GATE_VERSION,
        verdict: gate.verdict,
        rule: gate.rule,
        draftAccepted: gate.draftAccepted,
        rejectionReasons: gate.rejectionReasons,
        checks: gate.checks,
      },
    });
    if (gate.draftAccepted === false) {
      recorder.add({
        type: 'fallback',
        agent: agentId,
        summary: 'Introduction du modèle rejetée : remplacée par l’introduction déterministe',
        data: { reasons: gate.rejectionReasons },
      });
    }
  }

  /** Introduction courte rédigée par le modèle (aucun chiffre, pièce ni lien), ou null. */
  private async draftIntro(
    sheet: ProcedureSheet,
    question: string,
    language: Language,
    recorder: TraceRecorder,
    agentId: string,
  ): Promise<string | null> {
    if (!this.languageModel) return null;
    const turns = procedureIntroTurns(sheet, question, language);
    const start = performance.now();
    try {
      const draft = await this.languageModel.complete(turns);
      recorder.add({
        type: 'llm',
        agent: agentId,
        summary: `Introduction de la fiche rédigée par ${this.languageModel.name}`,
        data: {
          model: this.languageModel.name,
          promptVersion: PROCEDURE_PROMPT_VERSION,
          promptChars: turns.reduce((sum, turn) => sum + turn.content.length, 0),
          draft: draft.slice(0, 2000),
        },
        durationMs: performance.now() - start,
      });
      return draft;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Modèle indisponible pour la fiche ${sheet.id} : ${reason}`);
      recorder.add({
        type: 'fallback',
        agent: agentId,
        summary: 'Modèle de langage indisponible : introduction déterministe de la fiche',
        data: { model: this.languageModel.name, reason },
        durationMs: performance.now() - start,
      });
      return null;
    }
  }
}

/** Prompt de l'introduction : la fiche est affichée ensuite, le modèle ne fait que l'annoncer. */
export function procedureIntroTurns(
  sheet: ProcedureSheet,
  question: string,
  language: Language,
): ChatTurn[] {
  const languageName = language === 'fr' ? 'français (vouvoiement)' : 'anglais (English)';
  const facts = [
    `Démarche : ${sheet.title_fr}`,
    sheet.authority ? `Autorité : ${sheet.authority.name}` : '',
    sheet.where.length > 0 ? `Où : ${sheet.where.join(' ; ')}` : '',
    sheet.who_can_apply ? `Qui peut faire la demande : ${sheet.who_can_apply}` : '',
    sheet.tips.length > 0 ? `Conseils : ${sheet.tips.join(' ; ')}` : '',
  ].filter(Boolean);
  return [
    {
      role: 'system',
      content: [
        "Tu es Sonah, l'assistant administratif des citoyens camerounais.",
        'On te donne une FICHE DE DÉMARCHE vérifiée. Sa version complète (pièces, étapes, coût, délai, sources) sera affichée juste après ton texte.',
        `Écris seulement une introduction de 1 à 3 phrases courtes, chaleureuses, en ${languageName} : reformule la situation de la personne et indique à quelle administration s'adresser, d'après la fiche. Ne salue pas et ne te présente pas.`,
        "Interdits (vérifiés automatiquement) : aucun chiffre, montant, délai ou durée ; aucune liste de pièces ; aucun lien ; aucun numéro entre crochets ; aucun titre ni liste à puces. N'ajoute rien qui ne soit pas dans la fiche.",
      ].join('\n'),
    },
    { role: 'system', content: `FICHE DE DÉMARCHE :\n${facts.join('\n')}` },
    { role: 'user', content: question },
  ];
}
