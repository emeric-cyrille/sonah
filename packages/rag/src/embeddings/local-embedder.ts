import {
  assertDimensions,
  EMBEDDING_DIMENSIONS,
  type Embedder,
  type EmbeddingPurpose,
} from './embedder';
import type { EmbeddingTextStyle } from '../types';

/** Modèle multilingue ouvert (français, anglais…), exécuté localement via ONNX. */
export const DEFAULT_LOCAL_MODEL = 'Xenova/multilingual-e5-small';
const BATCH_SIZE = 32;

/** Fonction d'extraction de traits renvoyée par transformers.js (typage minimal). */
type FeatureExtractor = (
  texts: string[],
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

export interface LocalEmbedderOptions {
  readonly model?: string;
  /** Dossier de cache des modèles (pré-rempli dans l'image Docker). */
  readonly cacheDir?: string;
  /** Injection pour les tests : évite de charger le vrai modèle. */
  readonly loadExtractor?: (model: string) => Promise<FeatureExtractor>;
}

/**
 * Les modèles e5 attendent un préfixe indiquant le rôle du texte.
 * https://huggingface.co/intfloat/multilingual-e5-small
 */
export function formatForE5(text: string, purpose: EmbeddingPurpose): string {
  return `${purpose === 'query' ? 'query' : 'passage'}: ${text}`;
}

/**
 * Complète un vecteur normalisé par des zéros jusqu'à la dimension de la colonne pgvector.
 * Les zéros ajoutés ne changent ni la norme ni le produit scalaire : la similarité cosinus est préservée.
 */
export function padVector(vector: readonly number[], size = EMBEDDING_DIMENSIONS): number[] {
  if (vector.length > size) throw new Error(`Vecteur de dimension ${vector.length} > ${size}`);
  return [...vector, ...new Array<number>(size - vector.length).fill(0)];
}

async function defaultLoader(model: string, cacheDir?: string): Promise<FeatureExtractor> {
  const transformers = await import('@huggingface/transformers');
  if (cacheDir) transformers.env.cacheDir = cacheDir;
  const extractor = await transformers.pipeline('feature-extraction', model, { dtype: 'q8' });
  return extractor as unknown as FeatureExtractor;
}

/**
 * Embeddings sémantiques calculés sur le serveur de SONAH : gratuits, sans quota,
 * et sans envoyer les textes ni les questions des citoyens à un service externe.
 */
export class LocalEmbedder implements Embedder {
  readonly model: string;
  /**
   * Calibré avec scripts/calibrate-threshold.ts (EMBEDDING_RELEVANCE_THRESHOLD pour ajuster) :
   * cosinus maximal, recherche purement vectorielle, textes contraignants (périmètre de Sonah),
   * eval/questions.jsonl, forme d'indexation « reference » (2026-10-23, 1 691 fragments).
   *   - questions couvertes (n = 74) : min 0,807, p10 0,839, médiane 0,871 ;
   *   - hors sujet (n = 10) : min 0,778, médiane 0,811, max 0,841 ;
   *   - à 0,83 : 72/74 questions couvertes gardées, 8/10 hors sujet écartées (les deux autres,
   *     piratage et pronostic électoral, sont refusées par l'heuristique hors sujet de l'API).
   * L'optimum d'exactitude équilibrée (0,842) écarterait 9 questions couvertes sur 74 : rejeté.
   * Les distributions se chevauchent : le seuil seul ne suffit pas à reconnaître le hors sujet.
   */
  readonly relevanceThreshold = 0.83;
  /**
   * Référence + contenu, sans la hiérarchie Titre/Chapitre. Mesuré sur eval/questions.jsonl
   * (70 questions avec article attendu, recherche vectorielle, textes contraignants) :
   *   context (titre › hiérarchie › référence) : hit@1 0,671, hit@5 0,843, MRR 0,749 ;
   *   contenu seul : hit@1 0,657, hit@5 0,829, MRR 0,736 ;
   *   titre › référence : hit@1 0,671, hit@5 0,843, MRR 0,754 ;
   *   référence (retenue) : hit@1 0,700, hit@5 0,871, MRR 0,771.
   */
  readonly embeddingTextStyle: EmbeddingTextStyle = 'reference';
  private extractor?: Promise<FeatureExtractor>;
  private readonly modelId: string;
  private readonly load: (model: string) => Promise<FeatureExtractor>;

  constructor(options: LocalEmbedderOptions = {}) {
    this.modelId = options.model ?? DEFAULT_LOCAL_MODEL;
    this.model = `local:${this.modelId.split('/').pop() ?? this.modelId}`;
    this.load = options.loadExtractor ?? ((model) => defaultLoader(model, options.cacheDir));
  }

  /** Charge le modèle une seule fois (chargement paresseux, partagé entre les appels). */
  private getExtractor(): Promise<FeatureExtractor> {
    this.extractor ??= this.load(this.modelId).catch((error: unknown) => {
      this.extractor = undefined;
      throw error;
    });
    return this.extractor;
  }

  async embed(
    texts: readonly string[],
    purpose: EmbeddingPurpose = 'document',
  ): Promise<number[][]> {
    const extractor = await this.getExtractor();
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += BATCH_SIZE) {
      const batch = texts
        .slice(start, start + BATCH_SIZE)
        .map((text) => formatForE5(text, purpose));
      const output = await extractor(batch, { pooling: 'mean', normalize: true });
      vectors.push(...output.tolist().map((vector) => padVector(vector)));
    }
    assertDimensions(vectors);
    return vectors;
  }
}
