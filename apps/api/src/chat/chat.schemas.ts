import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message vide').max(2000),
  conversationId: z.string().uuid().optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatSource {
  readonly title: string;
  readonly reference?: string;
  readonly url?: string;
}

export interface ChatResponse {
  readonly conversationId: string;
  readonly reply: string;
  readonly sources: readonly ChatSource[];
}
