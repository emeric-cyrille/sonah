import { z } from 'zod';

export const searchRequestSchema = z.object({
  query: z.string().trim().min(2).max(500),
  topK: z.number().int().min(1).max(20).default(5),
  sourceIds: z
    .array(z.string().regex(/^[a-z0-9-]+$/))
    .max(10)
    .optional(),
});
export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const createDocumentSchema = z.object({
  chunkKey: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9:-]+$/),
  sourceId: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum(['CONSTITUTION', 'LAW', 'DECREE', 'PROCEDURE', 'FORM', 'OTHER']),
  title: z.string().trim().min(1).max(300),
  reference: z.string().trim().max(100).optional(),
  content: z.string().trim().min(1).max(20_000),
  source: z.string().trim().min(1).max(500),
  category: z.string().trim().min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateDocumentRequest = z.infer<typeof createDocumentSchema>;

export const uuidSchema = z.string().uuid();
