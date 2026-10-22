import { EMBEDDING_DIMENSIONS } from './embedder';
import { formatForGemini, GeminiEmbedder } from './gemini-embedder';

interface Call {
  url: string;
  init: RequestInit;
}

function vector(seed: number): number[] {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) =>
    i === seed % EMBEDDING_DIMENSIONS ? 1 : 0,
  );
}

/** fetch factice : renvoie les réponses prévues, puis des vecteurs valides. */
function fakeFetch(scripted: Array<{ status: number; body?: string }> = []): {
  fetchImpl: typeof fetch;
  calls: Call[];
} {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = scripted.shift();
    if (next && next.status !== 200)
      return new Response(next.body ?? 'erreur', { status: next.status });
    const requests = (JSON.parse(String(init.body)) as { requests: unknown[] }).requests;
    return new Response(
      JSON.stringify({ embeddings: requests.map((_, i) => ({ values: vector(i) })) }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe('GeminiEmbedder', () => {
  it('appelle batchEmbedContents avec la clé en en-tête, la dimension 1536 et le préfixe de document', async () => {
    const { fetchImpl, calls } = fakeFetch();
    const embedder = new GeminiEmbedder('cle-test', { fetchImpl });
    const vectors = await embedder.embed(['Article 2 : le travail forcé est interdit.']);

    expect(vectors).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents',
    );
    expect((calls[0]?.init.headers as Record<string, string>)['x-goog-api-key']).toBe('cle-test');
    expect(calls[0]?.url).not.toContain('cle-test');
    const body = JSON.parse(String(calls[0]?.init.body));
    expect(body.requests[0]).toEqual({
      model: 'models/gemini-embedding-2',
      content: {
        parts: [{ text: 'title: none | text: Article 2 : le travail forcé est interdit.' }],
      },
      outputDimensionality: 1536,
    });
  });

  it('formate différemment les questions de recherche', () => {
    expect(formatForGemini('congé maternité', 'query')).toBe(
      'task: search result | query: congé maternité',
    );
  });

  it('découpe en lots de 50 textes et conserve l’ordre', async () => {
    const { fetchImpl, calls } = fakeFetch();
    const vectors = await new GeminiEmbedder('k', { fetchImpl }).embed(
      Array.from({ length: 120 }, (_, i) => `texte ${i}`),
    );
    expect(calls).toHaveLength(3);
    expect(vectors).toHaveLength(120);
    expect(vectors[50]).toEqual(vector(0));
  });

  it('réessaie après un dépassement de quota (429) puis réussit', async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 429 }, { status: 503 }]);
    const vectors = await new GeminiEmbedder('k', { fetchImpl, backoffMs: () => 0 }).embed(['a']);
    expect(calls).toHaveLength(3);
    expect(vectors).toHaveLength(1);
  });

  it('échoue immédiatement sur une erreur non temporaire (clé invalide)', async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 400, body: 'API key not valid' }]);
    await expect(
      new GeminiEmbedder('k', { fetchImpl, backoffMs: () => 0 }).embed(['a']),
    ).rejects.toThrow('HTTP 400 API key not valid');
    expect(calls).toHaveLength(1);
  });

  it('abandonne après 5 tentatives', async () => {
    const { fetchImpl, calls } = fakeFetch(Array.from({ length: 6 }, () => ({ status: 429 })));
    await expect(
      new GeminiEmbedder('k', { fetchImpl, backoffMs: () => 0 }).embed(['a']),
    ).rejects.toThrow('HTTP 429');
    expect(calls).toHaveLength(5);
  });
});
