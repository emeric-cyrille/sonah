import { EMBEDDING_DIMENSIONS } from './embedder';
import { formatForE5, LocalEmbedder, padVector } from './local-embedder';

describe('LocalEmbedder', () => {
  it('préfixe les textes selon leur rôle (format e5)', () => {
    expect(formatForE5('congé payé', 'query')).toBe('query: congé payé');
    expect(formatForE5('Article 89', 'document')).toBe('passage: Article 89');
  });

  it('complète les vecteurs par des zéros sans changer la similarité cosinus', () => {
    const a = [0.6, 0.8];
    const b = [0.8, 0.6];
    const dot = (x: number[], y: number[]) => x.reduce((s, v, i) => s + v * (y[i] ?? 0), 0);
    const pa = padVector(a);
    expect(pa).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(dot(pa, padVector(b))).toBeCloseTo(dot(a, b), 12);
    expect(() => padVector(new Array(EMBEDDING_DIMENSIONS + 1).fill(0))).toThrow();
  });

  it('charge le modèle une seule fois et traite les textes par lots', async () => {
    const calls: string[][] = [];
    let loads = 0;
    const embedder = new LocalEmbedder({
      loadExtractor: async () => {
        loads += 1;
        return async (texts: string[]) => {
          calls.push(texts);
          return { tolist: () => texts.map(() => [1, 0, 0]) };
        };
      },
    });
    const vectors = await embedder.embed(
      Array.from({ length: 40 }, (_, i) => `t${i}`),
      'document',
    );
    await embedder.embed(['question'], 'query');
    expect(loads).toBe(1);
    expect(calls.map((batch) => batch.length)).toEqual([8, 8, 8, 8, 8, 1]);
    expect(calls[5]).toEqual(['query: question']);
    expect(vectors[0]).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(embedder.model).toBe('local:multilingual-e5-small');
  });

  it('retente le chargement après un échec', async () => {
    let attempts = 0;
    const embedder = new LocalEmbedder({
      loadExtractor: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('réseau indisponible');
        return async (texts: string[]) => ({ tolist: () => texts.map(() => [1]) });
      },
    });
    await expect(embedder.embed(['a'])).rejects.toThrow('réseau indisponible');
    await expect(embedder.embed(['a'])).resolves.toHaveLength(1);
  });

  it('libère les tenseurs du modèle après chaque lot (fuite mémoire constatée en production)', async () => {
    let disposed = 0;
    const embedder = new LocalEmbedder({
      batchSize: 2,
      loadExtractor: async () => async (texts: string[]) => ({
        tolist: () => texts.map(() => [1]),
        dispose: () => {
          disposed += 1;
        },
      }),
    });
    await embedder.embed(['a', 'b', 'c', 'd', 'e']);
    expect(disposed).toBe(3);
  });
});
