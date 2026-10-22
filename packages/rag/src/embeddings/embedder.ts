/** Dimension des vecteurs stockés (colonne vector(1536)). */
export const EMBEDDING_DIMENSIONS = 1536;

/** Transforme des textes en vecteurs de dimension EMBEDDING_DIMENSIONS. */
export interface Embedder {
  /** Identifiant stocké avec chaque vecteur : on ne compare jamais des vecteurs de modèles différents. */
  readonly model: string;
  /**
   * Similarité cosinus en dessous de laquelle un résultat est jugé hors sujet.
   * Dépend du modèle : les embeddings lexicaux donnent des scores plus bas que les embeddings neuronaux.
   */
  readonly relevanceThreshold: number;
  embed(texts: readonly string[]): Promise<number[][]>;
}

export function assertDimensions(vectors: readonly number[][]): void {
  for (const vector of vectors) {
    if (vector.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Vecteur de dimension ${vector.length}, attendu ${EMBEDDING_DIMENSIONS}`);
    }
    if (vector.some((value) => !Number.isFinite(value))) {
      throw new Error('Vecteur contenant des valeurs non finies');
    }
  }
}
