/**
 * Coordination multi-agents, entièrement déterministe :
 *  - routage d'un événement vers les agents dont le mandat est concerné (mots-clés) ;
 *  - détection des contradictions entre positions institutionnelles et entre verdicts ;
 *  - décision d'escalade vers un humain.
 */
import type { ConflictHint, Language, Verdict } from '../policy/policy.types';
import { foldForKeywords } from '../policy/text';
import type { AgentDefinition, AgentId, InstitutionalPosition } from './agent.types';

export interface RoutedAgent {
  readonly agentId: AgentId;
  readonly score: number;
  readonly matched: string[];
}

export interface RoutingDecision {
  readonly selected: RoutedAgent[];
  /** Règle appliquée, pour la trace. */
  readonly rule: 'keywords' | 'default_legal_adviser' | 'explicit';
}

/** Agents qui ne sont jamais routés automatiquement (le coordinateur lui-même, l'assistant citoyen). */
const NOT_ROUTABLE: ReadonlySet<AgentId> = new Set(['coordinator', 'sonah']);

/**
 * Sélectionne les agents concernés par un événement. Le conseiller juridique est le recours par
 * défaut quand aucun mandat ne correspond. `explicit` force une sélection (définie par le scénario).
 */
export function routeEvent(
  text: string,
  agents: readonly AgentDefinition[],
  explicit?: readonly AgentId[],
): RoutingDecision {
  const folded = ` ${foldForKeywords(text)} `;
  const scored = agents
    .filter((agent) => !NOT_ROUTABLE.has(agent.id))
    .map((agent) => {
      const matched = agent.keywords.filter((keyword) =>
        new RegExp(`[^a-z]${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(folded),
      );
      return { agentId: agent.id, score: matched.length, matched };
    });

  if (explicit && explicit.length > 0) {
    return {
      selected: explicit.map(
        (id) => scored.find((s) => s.agentId === id) ?? { agentId: id, score: 0, matched: [] },
      ),
      rule: 'explicit',
    };
  }
  const selected = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (selected.length === 0) {
    return {
      selected: [{ agentId: 'legal-adviser', score: 0, matched: [] }],
      rule: 'default_legal_adviser',
    };
  }
  return { selected, rule: 'keywords' };
}

function sameLabel(a: string, b: string): boolean {
  return foldForKeywords(a) === foldForKeywords(b);
}

/**
 * Contradictions entre positions sur un même sujet : ordre inverse entre deux formalités,
 * ou valeurs exclusives différentes (ex. deux autorités compétentes).
 */
export function detectPositionConflicts(
  positions: readonly InstitutionalPosition[],
): ConflictHint[] {
  const hints: ConflictHint[] = [];
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const a = positions[i] as InstitutionalPosition;
      const b = positions[j] as InstitutionalPosition;
      if (!sameLabel(a.topic, b.topic) || sameLabel(a.holder, b.holder)) continue;
      const reversed =
        a.precedence !== undefined &&
        b.precedence !== undefined &&
        sameLabel(a.precedence[0], b.precedence[1]) &&
        sameLabel(a.precedence[1], b.precedence[0]);
      const exclusive =
        a.value !== undefined && b.value !== undefined && !sameLabel(a.value, b.value);
      if (reversed || exclusive) {
        hints.push({
          origin: 'coordinator',
          description: `${a.holder} : « ${a.statement} » ↔ ${b.holder} : « ${b.statement} » (${a.topic})`,
        });
      }
    }
  }
  return hints;
}

export interface AgentOutcome {
  readonly agentId: AgentId;
  readonly verdict: Verdict;
}

export type EscalationReason =
  | 'position_conflict'
  | 'referred_to_human'
  | 'divergent_assessments'
  | 'outdated_text'
  | 'no_applicable_text';

export interface MergeDecision {
  readonly verdict: Verdict;
  readonly escalate: boolean;
  readonly reasons: EscalationReason[];
}

/** Gravité des verdicts, pour retenir le plus contraignant. */
const SEVERITY: Record<Verdict, number> = {
  CONVERSATION: 0,
  ANSWERED_WITH_CITATIONS: 0,
  OUT_OF_SCOPE: 1,
  INSUFFICIENT_EVIDENCE: 2,
  OUTDATED_TEXT: 3,
  CONFLICT_BETWEEN_TEXTS: 4,
  REFER_TO_HUMAN: 5,
};

/**
 * Fusionne les verdicts des agents : le plus grave l'emporte. Une contradiction entre positions,
 * un renvoi vers un humain, des évaluations divergentes, un texte périmé ou l'absence de texte
 * applicable pour tous les agents déclenchent l'escalade vers un humain.
 */
export function mergeOutcomes(
  outcomes: readonly AgentOutcome[],
  positionConflicts: readonly ConflictHint[],
): MergeDecision {
  const reasons: EscalationReason[] = [];
  let verdict: Verdict = 'ANSWERED_WITH_CITATIONS';
  for (const outcome of outcomes) {
    if (SEVERITY[outcome.verdict] > SEVERITY[verdict]) verdict = outcome.verdict;
  }
  if (positionConflicts.length > 0) {
    if (SEVERITY[verdict] < SEVERITY.CONFLICT_BETWEEN_TEXTS) verdict = 'CONFLICT_BETWEEN_TEXTS';
    reasons.push('position_conflict');
  }
  const has = (v: Verdict) => outcomes.some((o) => o.verdict === v);
  if (has('REFER_TO_HUMAN')) reasons.push('referred_to_human');
  if (has('ANSWERED_WITH_CITATIONS') && (has('OUTDATED_TEXT') || has('CONFLICT_BETWEEN_TEXTS'))) {
    reasons.push('divergent_assessments');
  }
  if (has('OUTDATED_TEXT')) reasons.push('outdated_text');
  if (outcomes.length > 0 && outcomes.every((o) => o.verdict === 'INSUFFICIENT_EVIDENCE')) {
    reasons.push('no_applicable_text');
  }
  return { verdict, escalate: reasons.length > 0, reasons };
}

const REASON_LABELS: Record<EscalationReason, Record<Language, string>> = {
  position_conflict: {
    fr: 'positions institutionnelles contradictoires',
    en: 'contradictory institutional positions',
  },
  referred_to_human: {
    fr: 'situation sensible signalée par un agent',
    en: 'sensitive situation flagged by an agent',
  },
  divergent_assessments: {
    fr: 'évaluations divergentes entre agents',
    en: 'divergent assessments between agents',
  },
  outdated_text: {
    fr: 'texte cité modifié ou abrogé : la version en vigueur doit être confirmée par un juriste',
    en: 'cited text amended or repealed: the version in force must be confirmed by a jurist',
  },
  no_applicable_text: {
    fr: 'aucun agent ne dispose de texte applicable',
    en: 'no agent holds an applicable text',
  },
};

export function describeReason(reason: EscalationReason, language: Language): string {
  return REASON_LABELS[reason][language];
}
