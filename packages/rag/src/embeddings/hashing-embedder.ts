import { EMBEDDING_DIMENSIONS, type Embedder } from './embedder';

/** Mots outils français ignorés : ils n'aident pas à distinguer les articles. */
const STOPWORDS = new Set(
  (
    'les des une est pour par dans sur aux avec son ses leur leurs qui que quoi dont cette ces cet ' +
    'elle ils elles nous vous sont ont été etre être avoir fait faire peut doit sans sous entre ' +
    'plus moins tout tous toute toutes autre autres ainsi meme même lorsque lors mais car donc ' +
    'comme selon cas ceux celle celles celui present présente presente loi article alinea alinéa'
  ).split(' '),
);

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Racinisation légère : réduit pluriels et terminaisons fréquentes (travailleurs → travailleur). */
function stem(word: string): string {
  return word
    .replace(/(ements|ement)$/, 'e')
    .replace(/(ations|ation)$/, 'at')
    .replace(/(euses|euse|eurs|eur)$/, 'eur')
    .replace(/(aux)$/, 'al')
    .replace(/s$/, '');
}

export function tokenize(text: string): string[] {
  return stripAccents(text.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    .map(stem);
}

/** Hachage FNV-1a 32 bits. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Embeddings lexicaux hors ligne (« hashing trick ») : mots et paires de mots projetés dans
 * 1536 dimensions. Moins fins que des embeddings neuronaux, mais sans clé API ni réseau :
 * utilisés en développement et en repli quand OPENAI_API_KEY est absente.
 */
export class HashingEmbedder implements Embedder {
  readonly model = 'hashing-fr-v1';
  // Calibré (scripts/calibrate-threshold.ts) : hors sujet ≤ 0,15, bons articles ≥ 0,17
  readonly relevanceThreshold = 0.16;

  async embed(texts: readonly string[]): Promise<number[][]> {
    return texts.map((text) => this.embedOne(text));
  }

  private embedOne(text: string): number[] {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    const tokens = tokenize(text);
    const features = [...tokens, ...tokens.slice(1).map((token, i) => `${tokens[i]}_${token}`)];

    for (const feature of features) {
      const h = hash(feature);
      const index = h % EMBEDDING_DIMENSIONS;
      const sign = h >>> 31 === 0 ? 1 : -1;
      // Les paires de mots pèsent un peu moins que les mots seuls
      vector[index] = (vector[index] ?? 0) + sign * (feature.includes('_') ? 0.6 : 1);
    }

    // Pondération sous-linéaire puis normalisation L2
    for (let i = 0; i < vector.length; i += 1) {
      const value = vector[i] ?? 0;
      vector[i] = Math.sign(value) * Math.log1p(Math.abs(value));
    }
    const norm = Math.hypot(...vector);
    if (norm === 0) {
      // Texte vide de sens : vecteur unitaire fixe pour rester valide dans pgvector
      vector[0] = 1;
      return vector;
    }
    return vector.map((value) => value / norm);
  }
}
