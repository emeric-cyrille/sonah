import type { Verdict } from '../policy/policy.types';

export const TRACE_STEP_TYPES = [
  'input',
  'retrieval',
  'gate',
  'agent',
  'llm',
  'fallback',
  'coordination',
  'output',
] as const;
export type TraceStepType = (typeof TRACE_STEP_TYPES)[number];

/**
 * Étape d'une trace. `data` contient un résumé structuré du raisonnement (preuves utilisées,
 * règle appliquée, décision) : aucune dépendance au raisonnement caché du modèle.
 */
export interface TraceStep {
  readonly order: number;
  readonly type: TraceStepType;
  readonly agent?: string;
  readonly summary: string;
  readonly data: Record<string, unknown>;
  readonly durationMs: number;
}

export type TraceKind = 'chat' | 'scenario';

/** Trace prête à être chaînée. */
export interface TraceDraft {
  readonly id: string;
  readonly createdAt: Date;
  readonly kind: TraceKind;
  readonly conversationId: string | null;
  readonly scenarioRunId: string | null;
  readonly agentId: string | null;
  readonly verdict: Verdict;
  readonly promptVersion: string | null;
  readonly model: string | null;
  readonly steps: readonly TraceStep[];
}

/** Trace enregistrée : position dans la chaîne et empreintes. */
export interface TraceRecord extends TraceDraft {
  readonly sequence: number;
  readonly prevHash: string;
  readonly hash: string;
}

export interface TraceSummary {
  readonly id: string;
  readonly createdAt: string;
  readonly kind: TraceKind;
  readonly conversationId: string | null;
  readonly scenarioRunId: string | null;
  readonly agentId: string | null;
  readonly verdict: Verdict;
  readonly model: string | null;
  readonly stepCount: number;
  readonly hash: string;
}

export interface TraceDetail {
  readonly id: string;
  readonly createdAt: string;
  readonly kind: TraceKind;
  readonly conversationId: string | null;
  readonly scenarioRunId?: string;
  readonly agentId: string | null;
  readonly verdict: Verdict;
  readonly promptVersion: string | null;
  readonly model: string | null;
  readonly hash: string;
  readonly prevHash: string;
  readonly sequence: number;
  readonly steps: readonly TraceStep[];
}

export interface ChainVerification {
  readonly valid: boolean;
  readonly count: number;
  readonly brokenAt?: string;
}
