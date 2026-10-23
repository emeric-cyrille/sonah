import { z } from 'zod';
import type { Citation, Language, Verdict } from '../policy/policy.types';

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message vide').max(2000),
  conversationId: z.string().uuid().optional(),
  language: z.enum(['fr', 'en']).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Source citée (format historique, conservé pour compatibilité). */
export interface ChatSource {
  readonly title: string;
  readonly reference?: string;
  readonly url?: string;
}

export interface ChatResponse {
  readonly conversationId: string;
  readonly reply: string;
  readonly language: Language;
  readonly verdict: Verdict;
  readonly citations: readonly Citation[];
  readonly sources: readonly ChatSource[];
  readonly traceId: string;
}
