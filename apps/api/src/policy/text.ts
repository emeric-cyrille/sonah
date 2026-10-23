/** Outils de texte déterministes, partagés par le contrôle de politique et le pipeline de conversation. */

// Classes de caractères écrites en échappements Unicode (lisibles et stables au formatage)
const APOSTROPHES = new RegExp('[\\u2018\\u2019\\u02BC\\u0060\\u00B4]', 'g');
const DASHES = new RegExp('[\\u2010-\\u2015\\u2212]', 'g');
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/**
 * Normalise un texte pour une comparaison « mot pour mot » : Unicode NFC, apostrophes
 * typographiques unifiées, tirets unifiés, espaces (y compris insécables) réduits.
 */
export function normalizeForMatch(text: string): string {
  return text
    .normalize('NFC')
    .replace(APOSTROPHES, "'")
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Minuscules sans accents : pour les heuristiques par mots-clés. */
export function foldForKeywords(text: string): string {
  return normalizeForMatch(text).toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '');
}

/** Découpe un texte replié en mots (lettres et chiffres). */
export function words(text: string): string[] {
  return foldForKeywords(text).match(/[a-z0-9]+/g) ?? [];
}
