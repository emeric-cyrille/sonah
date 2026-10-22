import { EMBEDDING_DIMENSIONS } from './embedder';
import { HashingEmbedder, tokenize } from './hashing-embedder';

function cosine(a: number[], b: number[]): number {
  return a.reduce((sum, value, i) => sum + value * (b[i] ?? 0), 0);
}

describe('HashingEmbedder', () => {
  const embedder = new HashingEmbedder();

  it('produit des vecteurs normalisés de la bonne dimension', async () => {
    const [vector] = await embedder.embed(['Le travail forcé est interdit']);
    expect(vector).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(Math.hypot(...(vector ?? []))).toBeCloseTo(1, 6);
  });

  it('est déterministe', async () => {
    const [a] = await embedder.embed(['congé de maternité']);
    const [b] = await embedder.embed(['congé de maternité']);
    expect(a).toEqual(b);
  });

  it('rapproche les textes qui partagent des mots, malgré accents et pluriels', async () => {
    const [query, relevant, unrelated] = await embedder.embed([
      'licenciement des travailleurs',
      "Le licenciement d'un travailleur doit être motivé.",
      'Le Président de la République est élu au suffrage universel.',
    ]);
    expect(cosine(query ?? [], relevant ?? [])).toBeGreaterThan(
      cosine(query ?? [], unrelated ?? []) + 0.2,
    );
  });

  it('reste valide sur un texte sans mot significatif', async () => {
    const [vector] = await embedder.embed(['le la de']);
    expect(Math.hypot(...(vector ?? []))).toBeCloseTo(1, 6);
  });
});

describe('tokenize', () => {
  it('normalise casse, accents et pluriels, et retire les mots outils', () => {
    expect(tokenize('Les Travailleurs étrangers')).toEqual(['travailleur', 'etranger']);
  });
});
