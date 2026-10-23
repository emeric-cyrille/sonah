import type { DocumentType } from '@sonah/rag';
import type { Language } from '../policy/policy.types';

export const AGENT_IDS = [
  'sonah',
  'legal-adviser',
  'regulator-minpostel',
  'data-protection-authority',
  'ministry-business',
  'coordinator',
] as const;
export type AgentId = (typeof AGENT_IDS)[number];

/** Rôles définis par le défi (ITU AI for Good). */
export type AgentRole =
  | 'Innovative AI solution'
  | 'Policy and legal adviser'
  | 'Institutional participant'
  | 'Multi-agent coordination';

/**
 * Agent configuré par des données : mandat, prompt, sources autorisées et règles déterministes.
 * Le modèle de langage est optionnel : sans lui, l'agent répond de façon extractive.
 */
export interface AgentDefinition {
  readonly id: AgentId;
  readonly name: Readonly<Record<Language, string>>;
  readonly role: AgentRole;
  readonly mandate: Readonly<Record<Language, string>>;
  /** Identifiants de textes déclarés (sourceId du corpus). Vide : tout le corpus. */
  readonly sources: readonly string[];
  /** Correspondances tolérantes avec les sourceId réellement indexés. */
  readonly sourcePatterns: readonly RegExp[];
  /**
   * Types de textes consultables (ex. textes contraignants seulement). Absent : tous les types.
   * Combiné aux sources déclarées quand l'agent en a.
   */
  readonly documentTypes?: readonly DocumentType[];
  /** Racines de mots (texte replié) qui déclenchent le routage vers cet agent. */
  readonly keywords: readonly string[];
  /** Règles déterministes appliquées à chaque réponse. */
  readonly rules: readonly string[];
  /** Consignes ajoutées au prompt système quand un modèle est configuré. */
  readonly instructions: Readonly<Record<Language, string>>;
}

/** Position d'une institution sur un sujet, comparée par le coordinateur. */
export interface InstitutionalPosition {
  readonly holder: string;
  readonly topic: string;
  readonly statement: string;
  /** Ordre exigé entre deux formalités : [avant, après]. */
  readonly precedence?: readonly [string, string];
  /** Valeur exclusive (ex. autorité compétente) : deux valeurs différentes se contredisent. */
  readonly value?: string;
}
