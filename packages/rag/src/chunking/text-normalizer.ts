import type { TextReplacement } from '../types';

/** Séparateur de pages produit par extractPdfText. */
export const PAGE_SEPARATOR = '=====PAGE=====';
/** Marqueur de page conservé dans le texte normalisé (ligne « \f12 »), lu par le découpeur. */
export const PAGE_MARKER = /^\f(\d+)$/;

export interface NormalizeOptions {
  /** Conserve un marqueur par page (« \f<numéro> ») pour retrouver la page de chaque article. */
  readonly keepPageMarkers?: boolean;
  /** Corrections propres à un document (défauts d'extraction), appliquées après le nettoyage. */
  readonly replacements?: readonly TextReplacement[];
}

/**
 * Mots composés à ne pas recoller quand le trait d'union tombe en fin de ligne
 * (« ci-\ndessus » doit rester « ci-dessus », pas « cidessus »).
 */
const KEEP_HYPHEN_BEFORE = new Set([
  'ci',
  'celle',
  'celles',
  'celui',
  'ceux',
  'là',
  'au',
  'sous',
  'non',
  'vice',
  'demi',
  'avant',
  'après',
  'contre',
  'sus',
  'quasi',
  'peut',
]);
const KEEP_HYPHEN_AFTER = new Set([
  'ci',
  'là',
  'même',
  'mêmes',
  'dessus',
  'dessous',
  'après',
  'avant',
  'delà',
  'présidente',
  'président',
  'à',
]);

function joinHyphenatedLines(text: string): string {
  return text.replace(/([A-Za-zÀ-ÿ]+)-\n([a-zà-ÿ]+)/g, (_match, before: string, after: string) => {
    const keep =
      KEEP_HYPHEN_BEFORE.has(before.toLowerCase()) || KEEP_HYPHEN_AFTER.has(after.toLowerCase());
    if (keep) return `${before}-${after}`;
    // Seuls les mots en minuscules sont recollés (« tra-\nvail ») ; « Etat-\nmajor » garde son tiret
    return /^[a-zà-ÿ]/.test(before) ? `${before}${after}` : `${before}-${after}`;
  });
}

/**
 * Recolle les en-têtes d'articles coupés par l'extraction PDF :
 * « Article 1\ner\n.- » → « Article 1er.- », « ARTICLE 10\n.- (nouveau) » → « ARTICLE 10.- (nouveau) ».
 */
function joinSplitArticleHeaders(text: string): string {
  return text
    .replace(/^((?:ARTICLE|Article|ART|Art)\.?\s*1)\n(er)\b\s*\n?/gm, '$1$2 ')
    .replace(/^((?:ARTICLE|Article|ART|Art)\.?\s*\d+(?:er)?)\s*\n\s*(\.?\s*[-–_]+|:)/gm, '$1$2');
}

function applyReplacements(text: string, replacements: readonly TextReplacement[]): string {
  return replacements.reduce(
    (current, { pattern, replacement, flags }) =>
      current.replace(new RegExp(pattern, flags ?? 'gm'), replacement),
    text,
  );
}

/**
 * Nettoie le texte extrait d'un PDF (ou d'une page HTML) :
 * - supprime les séparateurs de pages (ou les remplace par des marqueurs) et les lignes parasites ;
 * - recolle les mots coupés en fin de ligne (« tra-\nvail » → « travail ») ;
 * - recolle les en-têtes d'articles coupés ;
 * - uniformise apostrophes et espaces.
 */
export function normalizeLegalText(
  raw: string,
  noisePatterns: readonly string[] = [],
  options: NormalizeOptions = {},
): string {
  // Sensibles à la casse : permet de cibler les tampons en capitales sans toucher au texte courant
  const noise = noisePatterns.map((pattern) => new RegExp(pattern));

  let page = 1;
  const lines = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\u02bc\u2018\u2019\u02bb]/g, "'")
    .replace(/[\u00a0\u202f\u2009]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .flatMap((line) => {
      if (line === PAGE_SEPARATOR) {
        page += 1;
        return options.keepPageMarkers ? [`\f${page}`] : [];
      }
      return noise.some((regex) => regex.test(line)) ? [] : [line];
    });

  if (options.keepPageMarkers && lines.length > 0) lines.unshift('\f1');

  const text = joinSplitArticleHeaders(joinHyphenatedLines(lines.join('\n')))
    .replace(/\n{3,}/g, '\n\n')
    // Pas de trim() : il retirerait le marqueur de la première page (« \f1 »)
    .replace(/^[ \n]+|[ \n]+$/g, '');
  return options.replacements ? applyReplacements(text, options.replacements) : text;
}

/** Retire les marqueurs de page d'un texte normalisé. */
export function stripPageMarkers(text: string): string {
  return text
    .split('\n')
    .filter((line) => !PAGE_MARKER.test(line))
    .join('\n');
}
