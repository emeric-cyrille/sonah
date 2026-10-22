import type { LegalChunk } from '../types';

export interface ChunkerOptions {
  /** Taille maximale d'un fragment, en caractères. Les articles plus longs sont découpés. */
  readonly maxChars?: number;
  /** Nom du fragment qui précède le premier article (préambule), ou null pour l'ignorer. */
  readonly preambleLabel?: string | null;
}

const DEFAULT_MAX_CHARS = 1800;

/**
 * Début d'article : « Article premier : », « Art. 2.- », « Art.47 bis.- », « Article 12 : ».
 * Tolère la coquille « Art.- 78.- » présente dans certaines éditions.
 * Le séparateur (« .- », « - » ou « : ») est obligatoire pour ne pas confondre un renvoi
 * en début de ligne (« Art. 25 ci-dessus… ») avec un nouvel article.
 */
const ARTICLE_START =
  /^(?:Article\s+(premier|1er|\d+(?:\s+(?:bis|ter|quater))?)|Art\.?\s*-?\s*(\d+(?:\s*(?:bis|ter|quater))?))\s*(?:\.\s*-|-|–|:)\s*/i;

const HEADING =
  /^(TITRE|Titre|CHAPITRE|Chapitre|SECTION|Section)\s+([IVXLC]+|\d+|PREMIER|premier|UNIQUE|unique)\b\s*[-–:.]?\s*(.*)$/;

/** Ligne de sommaire : « Titre 3 - Du contrat de travail ..........5 ». */
const TABLE_OF_CONTENTS = /\.{5,}\s*\d+\s*$/;

type HeadingLevel = 'titre' | 'chapitre' | 'section';

interface DraftArticle {
  reference: string;
  articleNumber?: string;
  path: string[];
  lines: string[];
}

function headingLevel(keyword: string): HeadingLevel {
  const lower = keyword.toLowerCase();
  if (lower === 'titre') return 'titre';
  if (lower === 'chapitre') return 'chapitre';
  return 'section';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function articleOrder(articleNumber: string): number {
  return Number.parseInt(articleNumber, 10);
}

/** Une ligne courte, sans ponctuation finale, majoritairement en capitales : intitulé de titre. */
function looksLikeHeadingName(line: string): boolean {
  if (line.length === 0 || line.length > 120 || ARTICLE_START.test(line) || HEADING.test(line))
    return false;
  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, '');
  const upper = letters.replace(/[^A-ZÀ-Þ]/g, '');
  return letters.length > 0 && upper.length / letters.length > 0.7;
}

/** Découpe un texte long aux frontières de paragraphes, puis de phrases. */
function splitLongText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const units = text
    .split(/\n(?=\(?\d+\)|•|-\s)|\n{2,}/)
    .flatMap((paragraph) =>
      paragraph.length <= maxChars ? [paragraph] : paragraph.split(/(?<=[.;:])\s+/),
    );

  const parts: string[] = [];
  let current = '';
  for (const unit of units) {
    const candidate = current ? `${current}\n${unit}` : unit;
    if (candidate.length > maxChars && current) {
      parts.push(current);
      current = unit;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/**
 * Découpe un texte juridique normalisé en fragments, un par article.
 * La hiérarchie (titres, chapitres, sections) est conservée dans `path` pour donner du contexte.
 */
export function chunkLegalText(
  sourceId: string,
  text: string,
  options: ChunkerOptions = {},
): LegalChunk[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const preambleLabel = options.preambleLabel === undefined ? 'Préambule' : options.preambleLabel;

  const hierarchy: Partial<Record<HeadingLevel, string>> = {};
  const currentPath = (): string[] =>
    (['titre', 'chapitre', 'section'] as const).flatMap((level) =>
      hierarchy[level] ? [hierarchy[level] as string] : [],
    );

  const articles: DraftArticle[] = [];
  const preamble: string[] = [];
  let current: DraftArticle | undefined;
  let lastNumber = 0;
  let pendingHeading: HeadingLevel | undefined;
  let continuingHeading: HeadingLevel | undefined;

  for (const line of text.split('\n')) {
    if (line.length === 0 || TABLE_OF_CONTENTS.test(line)) continue;

    // Intitulé coupé sur deux lignes : « Section 2 - De la conclusion et de l'exécution du » + « contrat »
    if (continuingHeading) {
      const level = continuingHeading;
      continuingHeading = undefined;
      if (/^[a-zà-ÿ]/.test(line) && !ARTICLE_START.test(line)) {
        hierarchy[level] = `${hierarchy[level]} ${line}`;
        continue;
      }
    }

    // Intitulé sur la ligne qui suit « TITRE II »
    if (pendingHeading) {
      const level = pendingHeading;
      pendingHeading = undefined;
      if (looksLikeHeadingName(line)) {
        hierarchy[level] = `${hierarchy[level]} - ${capitalize(line)}`;
        continue;
      }
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const level = headingLevel(heading[1] ?? '');
      const label = `${capitalize(heading[1] ?? '')} ${heading[2]}`;
      const name = (heading[3] ?? '').trim();
      hierarchy[level] = name ? `${label} - ${name}` : label;
      if (level === 'titre') {
        delete hierarchy.chapitre;
        delete hierarchy.section;
      } else if (level === 'chapitre') {
        delete hierarchy.section;
      }
      if (name) continuingHeading = level;
      else pendingHeading = level;
      continue;
    }

    const article = ARTICLE_START.exec(line);
    if (article) {
      const raw = (article[1] ?? article[2] ?? '').replace(/\s+/g, ' ').trim();
      const isFirst = /^(premier|1er)$/i.test(raw);
      const articleNumber = isFirst ? '1' : raw.toLowerCase();
      const order = articleOrder(articleNumber);
      // Les numéros d'articles sont croissants : un numéro inférieur est un renvoi, pas un article
      if (order >= lastNumber) {
        lastNumber = order;
        current = {
          reference: isFirst ? 'Article premier' : `Article ${articleNumber}`,
          articleNumber,
          path: currentPath(),
          lines: [],
        };
        articles.push(current);
        const rest = line.slice(article[0].length).trim();
        if (rest) current.lines.push(rest);
        continue;
      }
    }

    if (current) current.lines.push(line);
    else preamble.push(line);
  }

  const chunks: LegalChunk[] = [];
  const pushChunks = (
    reference: string,
    path: string[],
    body: string,
    articleNumber?: string,
  ): void => {
    const parts = splitLongText(body, maxChars);
    const slug = articleNumber ? `art-${articleNumber.replace(/\s+/g, '-')}` : 'preambule';
    parts.forEach((content, index) => {
      chunks.push({
        key: `${sourceId}:${slug}:${index + 1}`,
        sourceId,
        reference,
        articleNumber,
        path,
        content,
        part: index + 1,
        totalParts: parts.length,
      });
    });
  };

  const preambleText = preamble.join('\n').trim();
  if (preambleLabel && preambleText.length > 0) pushChunks(preambleLabel, [], preambleText);

  for (const article of articles) {
    const body = article.lines.join('\n').trim();
    if (body.length > 0) pushChunks(article.reference, article.path, body, article.articleNumber);
  }

  return chunks;
}

/** Texte envoyé au modèle d'embedding : le contexte (texte, titre, article) améliore la recherche. */
export function chunkToEmbeddingText(chunk: LegalChunk, shortTitle: string): string {
  const context = [shortTitle, ...chunk.path, chunk.reference].join(' › ');
  return `${context}\n${chunk.content}`;
}
