/** Types partagés du nœud de politique (Y.3172 « P ») et des réponses citées. */

export type Language = 'fr' | 'en';

export const VERDICTS = [
  'ANSWERED_WITH_CITATIONS',
  'INSUFFICIENT_EVIDENCE',
  'CONFLICT_BETWEEN_TEXTS',
  'OUTDATED_TEXT',
  'REFER_TO_HUMAN',
  'OUT_OF_SCOPE',
] as const;
export type Verdict = (typeof VERDICTS)[number];

export type TextStatus = 'in_force' | 'amended' | 'repealed';

/** Citation renvoyée au client : `index` correspond au marqueur [n] de la réponse. */
export interface Citation {
  readonly index: number;
  readonly documentId: string;
  readonly sourceId: string;
  readonly title: string;
  readonly reference: string;
  readonly excerpt: string;
  readonly url?: string;
  readonly status: TextStatus;
}

/** Signalement d'une contradiction entre textes ou entre positions institutionnelles. */
export interface ConflictHint {
  readonly origin: 'retrieval' | 'coordinator';
  readonly description: string;
  /** Numéros d'extraits concernés (1-based), s'ils sont connus. */
  readonly indices?: readonly number[];
}
