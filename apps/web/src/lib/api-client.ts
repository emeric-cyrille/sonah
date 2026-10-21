import { z } from 'zod';

const API_BASE_PATH = '/api/v1';
const REQUEST_TIMEOUT_MS = 30_000;

export const sourceSchema = z.object({
  title: z.string(),
  reference: z.string().optional(),
  url: z.string().url().optional(),
});

export const chatResponseSchema = z.object({
  conversationId: z.string(),
  reply: z.string(),
  sources: z.array(sourceSchema).optional(),
});

export const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  category: z.string(),
  source: z.string(),
  score: z.number(),
});

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
});

export type Source = z.infer<typeof sourceSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;

/** Le service n'est pas joignable ou la fonctionnalité n'est pas encore déployée. */
export class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function postJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiUnavailableError(
      error instanceof Error ? error.message : 'Impossible de joindre le service',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 404 || response.status === 502 || response.status === 503) {
    throw new ApiUnavailableError(`Service indisponible (${response.status})`);
  }
  if (!response.ok) {
    throw new ApiRequestError(`La requête a échoué (${response.status})`, response.status);
  }

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiRequestError('Réponse inattendue du serveur', response.status);
  }
  return parsed.data;
}

export function sendChatMessage(message: string, conversationId?: string): Promise<ChatResponse> {
  return postJson('/chat', { message, conversationId }, chatResponseSchema);
}

export function searchLegalTexts(query: string, topK = 5): Promise<SearchResult[]> {
  return postJson('/search', { query, topK }, searchResponseSchema).then((data) => data.results);
}
