import type { AgentId } from '../agents/agent.types';
import type { PinnedEvidence, StatusOverlay } from '../agents/answer-engine.service';
import type { Citation, Language, Verdict } from '../policy/policy.types';

export interface Bilingual {
  readonly fr: string;
  readonly en: string;
}

export interface PositionDefinition {
  readonly holder: Bilingual;
  readonly topic: string;
  readonly statement: Bilingual;
  readonly precedence?: readonly [string, string];
  readonly value?: string;
}

interface ActionBase {
  /** Question posée (affichée et transmise au modèle), dans les deux langues. */
  readonly question: Bilingual;
  /** Requête de recherche en français (le corpus est en français). */
  readonly retrievalQuery: string;
  readonly pinned?: readonly PinnedEvidence[];
  readonly statusOverlay?: readonly StatusOverlay[];
  readonly simulateModelOutage?: boolean;
}

/** Un agent répond seul à la question. */
export interface AgentAction extends ActionBase {
  readonly kind: 'agent';
  readonly agentId: AgentId;
}

/** Le coordinateur route l'événement, fait répondre les agents, compare et décide. */
export interface CoordinateAction extends ActionBase {
  readonly kind: 'coordinate';
  /** Sélection imposée ; sinon routage par mandat. */
  readonly agents?: readonly AgentId[];
  /** Positions institutionnelles (simulées) injectées par l'événement. */
  readonly positions?: readonly PositionDefinition[];
}

export type ScenarioAction = AgentAction | CoordinateAction;

export interface GapDefinition {
  readonly id: string;
  readonly title: Bilingual;
  readonly description: Bilingual;
  /** Exemple international, nommé seulement s'il est vérifié (sinon marqué « à vérifier »). */
  readonly globalExample?: Bilingual;
  readonly sources: readonly string[];
}

export interface ScenarioStepDefinition {
  readonly title: Bilingual;
  readonly description: Bilingual;
  readonly actions: readonly ScenarioAction[];
  readonly gaps?: readonly GapDefinition[];
}

export interface ScenarioDefinition {
  readonly id: string;
  readonly title: Bilingual;
  readonly description: Bilingual;
  readonly domain: string;
  readonly steps: readonly ScenarioStepDefinition[];
}

// --- Formes publiques (API) ---

export interface ScenarioSummary {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly totalSteps: number;
  readonly domain: string;
}

export interface AgentResponse {
  readonly agentId: AgentId;
  readonly agentName: string;
  readonly role: string;
  readonly message: string;
  readonly verdict: Verdict;
  readonly citations: readonly Citation[];
  readonly traceId: string;
}

export interface Gap {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly globalExample?: string;
  readonly sources: readonly string[];
}

export interface ScenarioEvent {
  readonly title: string;
  readonly description: string;
  readonly injectedAt: string;
}

export interface ReleasedStep {
  readonly runId: string;
  readonly step: number;
  readonly totalSteps: number;
  readonly event: ScenarioEvent;
  readonly responses: readonly AgentResponse[];
  readonly gaps: readonly Gap[];
  readonly done: boolean;
}

export interface ScenarioRunView {
  readonly runId: string;
  readonly scenario: ScenarioSummary;
  readonly language: Language;
  readonly status: 'RUNNING' | 'COMPLETED';
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly createdAt: string;
  readonly steps: readonly ReleasedStep[];
}
