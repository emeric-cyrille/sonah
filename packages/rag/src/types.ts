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

export const DOCUMENT_TYPES = [
  'CONSTITUTION',
  'LAW',
  'DECREE',
  'PROCEDURE',
  'FORM',
  'STRATEGY',
  'INTERNATIONAL',
  'OTHER',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * Forme du texte vectorisé à l'indexation :
 *  - « context » : titre court, hiérarchie complète (Titre, Chapitre…) et référence, puis le contenu ;
 *  - « reference » : la référence seule (« Article 28 », « Section 28 »), puis le contenu.
 */
export type EmbeddingTextStyle = 'context' | 'reference';

/**
 * Types de textes juridiquement contraignants au Cameroun (Constitution, lois, décrets) : seule base
 * des réponses aux citoyens. Les stratégies et textes internationaux (STRATEGY, INTERNATIONAL) sont
 * consultatifs : ils servent à l'analyse des lacunes et aux scénarios, pas aux réponses citoyennes.
 */
export const BINDING_DOCUMENT_TYPES: readonly DocumentType[] = ['CONSTITUTION', 'LAW', 'DECREE'];

/**
 * Statut juridique d'un fragment :
 * - in_force : texte en vigueur tel qu'indexé ;
 * - amended : texte modifié (en tout ou partie) par un texte ultérieur, voir `amendedBy` ;
 * - repealed : texte abrogé.
 * Les textes non normatifs (stratégies, recommandations) sont « in_force » au sens « version courante ».
 */
export const LEGAL_STATUSES = ['in_force', 'amended', 'repealed'] as const;
export type LegalStatus = (typeof LEGAL_STATUSES)[number];

/** Dimensions du cadre « ITU AI Readiness 2.0 » (identifiants courts du dépôt ITUAIReadiness). */
export const ITU_DIMENSIONS = [
  'data_marketplace',
  'generated_content',
  'cross_domain',
  'contextualization',
  'ai_integration',
  'human_interface',
  'strategy_alignment',
  'collaboration',
  'human_impact',
  'ai_policies',
  'ai_inclusion',
  'granular_priorities',
  'digital_infrastructure',
] as const;
export type ItuDimension = (typeof ITU_DIMENSIONS)[number];

/** Façon de découper un texte en fragments. */
export interface ChunkingConfig {
  /**
   * - articles : un fragment par article (« Article 12.- », « Art. 12 », « Section 12: »…) ;
   * - numbered-paragraphs : paragraphes numérotés 1., 2., 3.… (recommandations internationales) ;
   * - sections : un fragment par intitulé (stratégies, textes sans articles).
   */
  readonly mode: 'articles' | 'numbered-paragraphs' | 'sections';
  /**
   * Style des articles : « fr » (Article 12.- / Art. 12 :), « en-section » (Section 12:),
   * « line » (« Article 12 » seul sur sa ligne, comme au Journal officiel de l'UE).
   */
  readonly articleStyle?: 'fr' | 'en-section' | 'line';
  /** Intitulé du fragment qui précède le premier article, ou null pour l'ignorer. */
  readonly preambleLabel?: string | null;
  /** Expressions régulières (ligne entière) qui ouvrent un nouveau fragment en mode « sections ». */
  readonly unitPatterns?: readonly string[];
  /** Expressions régulières des intitulés de regroupement (titre, partie…) conservés dans `path`. */
  readonly headingPatterns?: readonly string[];
  /** Expression régulière qui marque la fin du texte utile (annexes, signatures…). */
  readonly stopPattern?: string;
  readonly maxChars?: number;
}

/** Remplacement appliqué au texte extrait (corrige les défauts d'extraction, jamais le fond). */
export interface TextReplacement {
  readonly pattern: string;
  readonly replacement: string;
  readonly flags?: string;
}

/** Texte modificatif : articles du texte de base dont il donne une nouvelle rédaction. */
export interface AmendmentSpec {
  readonly sourceId: string;
  /** Numéro d'article modifié → alinéas modifiés (liste vide : article entièrement réécrit). */
  readonly articles: Readonly<Record<string, readonly string[]>>;
}

export interface RepealSpec {
  readonly sourceId: string;
  /** Articles abrogés ; absent = texte entier abrogé. */
  readonly articles?: readonly string[];
}

/** Récupération à distance du document d'origine (vérification d'intégrité, ou texte non redistribuable). */
export interface FetchSpec {
  readonly url: string;
  readonly format: 'pdf' | 'html';
  /** Résolution particulière du lien de téléchargement (prc.cm génère des liens temporaires). */
  readonly resolver?: 'prc-cm';
  /** En-têtes HTTP (négociation de contenu de l'Office des publications de l'UE). */
  readonly headers?: Readonly<Record<string, string>>;
  readonly encoding?: string;
}

/** Texte officiel (ou de référence) décrit dans data/sources/manifest.json. */
export interface LegalSource {
  /** Identifiant technique (clé des fragments, ex. « constitution-1996 »). */
  readonly id: string;
  /** Identifiant documentaire stable (ex. « CMR-PRC-CONSTITUTION-1996 »). */
  readonly docId: string;
  readonly issuingBody: string;
  /** Titre dans la langue du document. */
  readonly title: string;
  readonly titleFr: string;
  readonly titleEn: string;
  readonly shortTitle: string;
  readonly type: DocumentType;
  readonly category: string;
  readonly jurisdiction: string;
  readonly binding: 'binding' | 'advisory';
  readonly language: 'fr' | 'en';
  /** Version du texte (ex. « Texte d'origine du 18 janvier 1996 »). */
  readonly version: string;
  /** Date de la version (AAAA-MM-JJ). */
  readonly date: string;
  /** Page officielle ou URL du document d'origine. */
  readonly url: string;
  readonly accessedAt: string;
  /** Empreinte SHA-256 du document d'origine téléchargé (`fetch.url`) ; absente pour une simple référence. */
  readonly sha256?: string;
  readonly license: string;
  /**
   * - redistributable : copie versionnée dans data/sources ;
   * - fetch-only : seules les métadonnées sont versionnées, le document est téléchargé à l'indexation ;
   * - metadata-only : référence citée, jamais indexée.
   */
  readonly redistribution: 'redistributable' | 'fetch-only' | 'metadata-only';
  readonly domains: readonly string[];
  readonly ituDimensions: readonly ItuDimension[];
  /** Classement pour l'export ITUAIReadiness (InputDocs/AI_Strategies ou AI_Use_Cases). */
  readonly ituFolder: 'AI_Strategies' | 'AI_Use_Cases';
  /** Fichier local (PDF, ou texte dérivé .txt). */
  readonly file?: string;
  readonly fetch?: FetchSpec;
  /** Texte .txt dérivé (OCR, conversion HTML) : méthode employée. */
  readonly derivation?: string;
  /** Portion du fichier à indexer, quand un PDF contient plusieurs textes. */
  readonly segment?: { readonly start?: string; readonly end?: string };
  readonly replacements?: readonly TextReplacement[];
  /** Lignes parasites à retirer (en-têtes et pieds de page). */
  readonly noisePatterns?: readonly string[];
  readonly chunking: ChunkingConfig;
  readonly amends?: AmendmentSpec;
  readonly repeals?: RepealSpec;
  /** Avertissement sur la version du texte, rappelé dans les réponses. */
  readonly note?: string;
}

/** Fragment d'un texte : un article (ou une partie d'article), un paragraphe ou une section. */
export interface LegalChunk {
  readonly key: string;
  readonly sourceId: string;
  /** Identifiant de l'unité dans le texte (« 26 », « 6-nouveau », « preambule », « s-12 »). */
  readonly unitId: string;
  /** "Préambule", "Article premier", "Article 6 (nouveau)", "Paragraphe 12"… */
  readonly reference: string;
  /** Numéro d'article normalisé ("1", "26", "47 bis"), absent hors articles. */
  readonly articleNumber?: string;
  /** Pour un texte modificatif : article du texte de base dont ce fragment est la nouvelle rédaction. */
  readonly amendsArticle?: string;
  /** Hiérarchie du texte : ["Titre III - Du pouvoir législatif", "Chapitre I - …"]. */
  readonly path: readonly string[];
  readonly content: string;
  readonly part: number;
  readonly totalParts: number;
  /** Pages du document d'origine (si connues). */
  readonly pageStart?: number;
  readonly pageEnd?: number;
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
  /** Similarité cosinus avec la requête (de -1 à 1), y compris pour un résultat trouvé en plein texte. */
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
