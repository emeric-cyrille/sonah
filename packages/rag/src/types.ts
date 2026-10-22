/** Journalisation minimale, compatible avec console et avec le Logger NestJS. */
export interface RagLogger {
  log(message: string): void;
  warn(message: string): void;
  error(message: string, trace?: string): void;
}

export const consoleLogger: RagLogger = {
  log: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message, trace) => console.error(message, trace ?? ''),
};

export type DocumentType = 'CONSTITUTION' | 'LAW' | 'DECREE' | 'PROCEDURE' | 'FORM' | 'OTHER';

/** Texte officiel indexé par Sonah (décrit dans data/sources/manifest.json). */
export interface LegalSource {
  readonly id: string;
  readonly file: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly type: DocumentType;
  readonly category: string;
  readonly url: string;
  /** Avertissement sur la version du texte, rappelé dans les réponses. */
  readonly note?: string;
  /** Lignes parasites à retirer (en-têtes et pieds de page du PDF). */
  readonly noisePatterns?: readonly string[];
}

/** Fragment d'un texte juridique : un article, ou une partie d'article s'il est long. */
export interface LegalChunk {
  readonly key: string;
  readonly sourceId: string;
  /** "Préambule", "Article premier", "Article 26"… */
  readonly reference: string;
  /** Numéro d'article normalisé ("1", "26", "47 bis"), absent pour le préambule. */
  readonly articleNumber?: string;
  /** Hiérarchie du texte : ["Titre III - Du pouvoir législatif", "Chapitre I - …"]. */
  readonly path: readonly string[];
  readonly content: string;
  readonly part: number;
  readonly totalParts: number;
}

/** Document prêt à être indexé dans la base vectorielle. */
export interface DocumentInput {
  readonly chunkKey: string;
  readonly sourceId: string;
  readonly type: DocumentType;
  readonly title: string;
  readonly reference?: string;
  readonly content: string;
  readonly source: string;
  readonly category: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SearchResult {
  readonly id: string;
  readonly sourceId: string;
  readonly title: string;
  readonly reference: string | null;
  readonly content: string;
  readonly category: string;
  readonly source: string;
  readonly score: number;
  readonly metadata: Record<string, unknown> | null;
}

export interface StoredDocument extends Omit<SearchResult, 'score'> {
  readonly chunkKey: string;
  readonly type: DocumentType;
  readonly embeddingModel: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
