import type { ChunkingConfig, EmbeddingTextStyle, LegalChunk } from '../types';
import { PAGE_MARKER } from './text-normalizer';

export interface ChunkerOptions extends Partial<ChunkingConfig> {
  /**
   * Texte modificatif : numéros des articles du texte de base dont il donne une nouvelle rédaction.
   * Ces articles sont acceptés hors de l'ordre croissant et indexés comme « Article 6 (nouveau) ».
   */
  readonly amendedArticles?: readonly string[];
  /** Langue du texte : intitulés générés (« Paragraphe » / « Paragraph »). */
  readonly language?: 'fr' | 'en';
}

const DEFAULT_MAX_CHARS = 1800;
const MAX_REFERENCE_CHARS = 80;

/**
 * Début d'article (style français) : « Article premier : », « Art. 2.- », « Art.47 bis.- »,
 * « ARTICLE 1er__ », « ARTICLE34.- (nouveau) », « « ARTICLE 5.-(nouveau) », « Art 15 : ».
 * Tolère la coquille « Art.- 78.- » présente dans certaines éditions.
 * Le séparateur (« .- », « - », « _ », « : », ou « . » suivi d'un alinéa « (1) » ou d'une majuscule,
 * comme dans « Article 2. (1) » de la version anglaise) est obligatoire pour ne pas confondre un renvoi
 * en début de ligne (« Art. 25 ci-dessus… ») avec un nouvel article.
 */
const FR_ARTICLE_START =
  /^[«"]?\s*(?:Article|ART(?:ICLE)?|Art)\.?\s*-?\s*(premier|1\s*er|\d+(?:\s*(?:bis|ter|quater))?)\s*(?:\.\s*[-–_]+|[-–_]+|:|\.(?=\s+[(A-Z«]))\s*/i;

/**
 * Article réécrit dans un texte modificatif : « ARTICLE 6 » seul sur sa ligne, « Art 53 : (nouveau) »,
 * « Article 5: (new) ». Le séparateur est facultatif : seuls les numéros déclarés comme modifiés
 * dans le manifeste sont reconnus ainsi.
 */
const AMENDED_ARTICLE_START =
  /^[«"]?\s*(?:Article|ART(?:ICLE)?|Art)\.?\s*(\d+(?:\s*(?:bis|ter|quater))?)\b\s*(?:\.\s*[-–_]+|[-–_]+|:)?\s*/i;

/** Début d'article (style anglais) : « Section 12: », « Section 176 : (1) ». */
const EN_SECTION_START = /^Section\s+(\d+(?:\s*(?:bis|ter|quater))?)\s*(?:[:.]\s*-?|[-–])\s*/i;

/** Article seul sur sa ligne (Journal officiel de l'UE) : « Article premier », « Article 50 ». */
const LINE_ARTICLE_START = /^Article\s+(premier|\d+(?:\s*(?:bis|ter|quater))?)$/i;

const FR_HEADING =
  /^(TITRE|Titre|CHAPITRE|Chapitre|SECTION|Section)\s+([IVXLC]+|\d+|PREMIER|premier|UNIQUE|unique)\b\s*[-–:.]?\s*(.*)$/;
const EN_HEADING =
  /^(PART|Part|CHAPTER|Chapter|TITLE|Title)\s+([IVXLC]+|\d+|ONE|One)\b\s*[-–:.]?\s*(.*)$/;

/** Ligne de sommaire : « Titre 3 - Du contrat de travail ..........5 ». */
const TABLE_OF_CONTENTS = /\.{5,}\s*\d+\s*$/;

/** Niveaux de la hiérarchie : 0 = titre/partie, 1 = chapitre, 2 = section. */
type Level = 0 | 1 | 2;

interface DraftUnit {
  unitId: string;
  reference: string;
  articleNumber?: string;
  amendsArticle?: string;
  path: string[];
  lines: string[];
  pageStart?: number;
  pageEnd?: number;
}

function headingLevel(keyword: string): Level {
  const lower = keyword.toLowerCase();
  if (lower === 'titre' || lower === 'part' || lower === 'title') return 0;
  if (lower === 'chapitre' || lower === 'chapter') return 1;
  return 2;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function truncate(value: string, max = MAX_REFERENCE_CHARS): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Une ligne courte, sans ponctuation finale, majoritairement en capitales : intitulé. */
function looksLikeHeadingName(line: string): boolean {
  if (line.length < 3 || line.length > 120) return false;
  if (FR_ARTICLE_START.test(line) || FR_HEADING.test(line)) return false;
  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, '');
  const upper = letters.replace(/[^A-ZÀ-Þ]/g, '');
  return letters.length > 2 && upper.length / letters.length > 0.7;
}

/** Normalise un numéro d'article : « premier », « 1 er » → « 1 » ; « 47 BIS » → « 47 bis ». */
function normalizeArticleNumber(raw: string): { number: string; isFirst: boolean } {
  const clean = raw.replace(/\s+/g, ' ').trim().toLowerCase();
  const isFirst = /^(premier|1 ?er)$/.test(clean);
  return { number: isFirst ? '1' : clean.replace(/(\d)\s*(bis|ter|quater)/, '$1 $2'), isFirst };
}

/** Découpe un texte long aux frontières de paragraphes, puis de phrases, puis de mots. */
function splitLongText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const units = text
    .split(/\n(?=\(?\d+\)|\(?[a-z]\)|•|-\s)|\n{2,}/)
    .flatMap((paragraph) =>
      paragraph.length <= maxChars ? [paragraph] : paragraph.split(/(?<=[.;:])\s+/),
    )
    .flatMap((unit) => {
      if (unit.length <= maxChars) return [unit];
      // Phrase démesurée (tableau, liste sans ponctuation) : coupe aux espaces
      const pieces: string[] = [];
      let rest = unit;
      while (rest.length > maxChars) {
        const cut = rest.lastIndexOf(' ', maxChars);
        const at = cut > maxChars / 2 ? cut : maxChars;
        pieces.push(rest.slice(0, at));
        rest = rest.slice(at).trimStart();
      }
      if (rest) pieces.push(rest);
      return pieces;
    });

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

/** En dessous de cette taille, une section (souvent un en-tête de tableau) est rattachée à la précédente. */
const MIN_SECTION_CHARS = 200;

/** Rattache les sections trop courtes à la précédente (intitulé conservé dans le texte). */
function mergeSmallSections(units: readonly DraftUnit[]): DraftUnit[] {
  const merged: DraftUnit[] = [];
  for (const unit of units) {
    const size = unit.lines.join('\n').trim().length;
    const previous = merged[merged.length - 1];
    if (previous && size < MIN_SECTION_CHARS) {
      previous.lines.push('', unit.reference, ...unit.lines);
      previous.pageEnd = unit.pageEnd ?? previous.pageEnd;
    } else {
      merged.push({ ...unit, lines: [...unit.lines] });
    }
  }
  return merged;
}

/**
 * Découpe un texte normalisé en fragments.
 * - mode « articles » : un fragment par article, la hiérarchie (titres, chapitres, sections) dans `path` ;
 * - mode « numbered-paragraphs » : un fragment par paragraphe numéroté (1., 2., 3.…) ;
 * - mode « sections » : un fragment par intitulé (stratégies, rapports).
 * Les articles longs sont découpés en parties numérotées. Les marqueurs de page (« \f12 »)
 * éventuellement laissés par normalizeLegalText servent à renseigner pageStart/pageEnd.
 */
export function chunkLegalText(
  sourceId: string,
  text: string,
  options: ChunkerOptions = {},
): LegalChunk[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const mode = options.mode ?? 'articles';
  const articleStyle = options.articleStyle ?? 'fr';
  const language = options.language ?? 'fr';
  const preambleLabel =
    options.preambleLabel === undefined
      ? mode === 'articles'
        ? 'Préambule'
        : 'Introduction'
      : options.preambleLabel;
  const unitPatterns = (options.unitPatterns ?? []).map((pattern) => new RegExp(pattern));
  const headingPatterns = (options.headingPatterns ?? []).map((pattern) => new RegExp(pattern));
  const stopPattern = options.stopPattern ? new RegExp(options.stopPattern) : undefined;
  const amended = new Set(options.amendedArticles ?? []);
  const seenAmended = new Set<string>();
  const structuralHeading =
    articleStyle === 'en-section' || language === 'en' ? EN_HEADING : FR_HEADING;

  const hierarchy: Array<string | undefined> = [undefined, undefined, undefined];
  const customHeading: { value?: string } = {};
  const currentPath = (): string[] =>
    [customHeading.value, ...hierarchy].filter((part): part is string => Boolean(part));
  const setLevel = (level: Level, value: string): void => {
    hierarchy[level] = value;
    for (let deeper = level + 1; deeper < hierarchy.length; deeper += 1)
      hierarchy[deeper] = undefined;
  };

  const units: DraftUnit[] = [];
  const preamble: DraftUnit = {
    unitId: 'preambule',
    reference: preambleLabel ?? '',
    path: [],
    lines: [],
  };
  let current: DraftUnit | undefined;
  let page: number | undefined;
  let lastNumber = 0;
  let lastParagraph = 0;
  let sectionCount = 0;
  let pendingHeading: Level | undefined;
  let continuingHeading: Level | undefined;

  const startUnit = (
    unit: Omit<DraftUnit, 'path' | 'lines' | 'pageStart' | 'pageEnd'>,
  ): DraftUnit => {
    current = { ...unit, path: currentPath(), lines: [], pageStart: page, pageEnd: page };
    units.push(current);
    return current;
  };
  const append = (line: string): void => {
    const target = current ?? preamble;
    if (target.lines.length === 0 && target === preamble) target.pageStart = page;
    target.lines.push(line);
    target.pageEnd = page;
  };

  for (const line of text.split('\n')) {
    const marker = PAGE_MARKER.exec(line);
    if (marker) {
      page = Number(marker[1]);
      continue;
    }
    if (line.length === 0 || TABLE_OF_CONTENTS.test(line)) {
      // Hors articles, les lignes vides séparent les paragraphes (utile au découpage des longs fragments)
      if (line.length === 0 && current && mode !== 'articles') current.lines.push('');
      continue;
    }
    if (stopPattern?.test(line)) break;

    // Intitulé coupé sur deux lignes : « Section 2 - De la conclusion et de l'exécution du » + « contrat »
    if (continuingHeading !== undefined) {
      const level = continuingHeading;
      continuingHeading = undefined;
      if (/^[a-zà-ÿ]/.test(line) && !FR_ARTICLE_START.test(line)) {
        hierarchy[level] = `${hierarchy[level]} ${line}`;
        continue;
      }
    }

    // Intitulé sur la ligne qui suit « TITRE II »
    if (pendingHeading !== undefined) {
      const level = pendingHeading;
      pendingHeading = undefined;
      if (looksLikeHeadingName(line)) {
        hierarchy[level] = `${hierarchy[level]} - ${capitalize(line)}`;
        continue;
      }
    }

    if (headingPatterns.some((regex) => regex.test(line))) {
      customHeading.value = truncate(line);
      hierarchy.fill(undefined);
      continue;
    }

    // En mode « articles » (style fr/line), « Section 2 » est un niveau de hiérarchie ;
    // en style « en-section », c'est un article et la hiérarchie vient de PART/CHAPTER.
    const heading = mode === 'sections' ? null : structuralHeading.exec(line);
    if (heading && !(articleStyle === 'en-section' && EN_SECTION_START.test(line))) {
      const level = headingLevel(heading[1] ?? '');
      const label = `${capitalize(heading[1] ?? '')} ${heading[2]}`;
      const name = (heading[3] ?? '').trim();
      setLevel(level, name ? `${label} - ${name}` : label);
      if (name) continuingHeading = level;
      else pendingHeading = level;
      continue;
    }

    if (mode === 'articles') {
      // Unité hors articles (annexe) : elle ne relève d'aucun titre ou chapitre
      if (unitPatterns.some((regex) => regex.test(line))) {
        hierarchy.fill(undefined);
        customHeading.value = undefined;
        const reference = line.replace(/^(\p{Lu})(\p{Lu}+)/u, (_m, first: string, rest: string) => {
          return `${first}${rest.toLowerCase()}`;
        });
        startUnit({ unitId: slugify(line), reference: truncate(reference) });
        continue;
      }

      // Texte modificatif : nouvelle rédaction d'un article du texte de base (hors ordre croissant)
      const amendment = amended.size > 0 ? AMENDED_ARTICLE_START.exec(line) : null;
      const amendedNumber = amendment ? normalizeArticleNumber(amendment[1] ?? '').number : '';
      if (amendment && amended.has(amendedNumber) && !seenAmended.has(amendedNumber)) {
        seenAmended.add(amendedNumber);
        startUnit({
          unitId: `${amendedNumber.replace(/\s+/g, '-')}-nouveau`,
          reference: `Article ${amendedNumber} (${language === 'en' ? 'new' : 'nouveau'})`,
          articleNumber: amendedNumber,
          amendsArticle: amendedNumber,
        });
        const rest = line.slice(amendment[0].length).trim();
        if (rest) append(rest);
        continue;
      }

      const startRegex =
        articleStyle === 'en-section'
          ? EN_SECTION_START
          : articleStyle === 'line'
            ? LINE_ARTICLE_START
            : FR_ARTICLE_START;
      const article = startRegex.exec(line);
      if (article) {
        const { number, isFirst } = normalizeArticleNumber(article[1] ?? '');
        const order = Number.parseInt(number, 10);
        const label = articleStyle === 'en-section' ? 'Section' : 'Article';
        const unitId = number.replace(/\s+/g, '-');
        // Les numéros d'articles sont croissants : un numéro inférieur est un renvoi, pas un article
        // (un numéro déjà vu, page répétée d'une copie certifiée, est aussi traité comme du texte)
        if (order >= lastNumber && !units.some((unit) => unit.unitId === unitId)) {
          lastNumber = order;
          startUnit({
            unitId,
            reference: isFirst && language === 'fr' ? `${label} premier` : `${label} ${number}`,
            articleNumber: number,
          });
          const rest = line.slice(article[0].length).trim();
          if (rest) append(rest);
          continue;
        }
      }
    } else if (mode === 'numbered-paragraphs') {
      const paragraph = /^(\d+)\.\s+(.*)$/.exec(line);
      if (paragraph && Number(paragraph[1]) === lastParagraph + 1) {
        lastParagraph += 1;
        startUnit({
          unitId: `p-${lastParagraph}`,
          reference: `${language === 'en' ? 'Paragraph' : 'Paragraphe'} ${lastParagraph}`,
        });
        append(paragraph[2] ?? '');
        continue;
      }
    } else if (
      unitPatterns.length > 0 ? unitPatterns.some((r) => r.test(line)) : looksLikeHeadingName(line)
    ) {
      // Intitulé sur plusieurs lignes : on complète l'intitulé de la section encore vide
      if (current && current.lines.length === 0) {
        current.reference = truncate(`${current.reference} ${line}`);
        continue;
      }
      sectionCount += 1;
      startUnit({ unitId: `s-${sectionCount}`, reference: truncate(line) });
      continue;
    }

    append(line);
  }

  const chunks: LegalChunk[] = [];
  const pushChunks = (unit: DraftUnit): void => {
    const body = unit.lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (body.length === 0) return;
    const parts = splitLongText(body, maxChars);
    parts.forEach((content, index) => {
      chunks.push({
        key: `${sourceId}:${unit.unitId === 'preambule' ? 'preambule' : mode === 'articles' && unit.articleNumber ? `art-${unit.unitId}` : unit.unitId}:${index + 1}`,
        sourceId,
        unitId: unit.unitId,
        reference: unit.reference,
        articleNumber: unit.articleNumber,
        amendsArticle: unit.amendsArticle,
        path: unit.path,
        content,
        part: index + 1,
        totalParts: parts.length,
        pageStart: unit.pageStart,
        pageEnd: unit.pageEnd,
      });
    });
  };

  if (preambleLabel) pushChunks(preamble);
  (mode === 'sections' ? mergeSmallSections(units) : units).forEach(pushChunks);
  return chunks;
}

/**
 * Texte envoyé au modèle d'embedding. La forme « reference » est retenue pour le modèle local
 * (multilingual-e5-small, 512 jetons) : la longue hiérarchie y dilue le contenu et rapproche des
 * questions sans rapport les fragments qui partagent le même chapitre (mesures dans local-embedder.ts).
 */
export function chunkToEmbeddingText(
  chunk: LegalChunk,
  shortTitle: string,
  style: EmbeddingTextStyle = 'context',
): string {
  if (style === 'reference') return `${chunk.reference}\n${chunk.content}`;
  const context = [shortTitle, ...chunk.path, chunk.reference].join(' › ');
  return `${context}\n${chunk.content}`;
}
