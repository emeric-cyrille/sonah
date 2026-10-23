import { foldForKeywords, words } from './text';

/** Au-delà de cette longueur, un message est considéré comme autonome. */
const MAX_ELLIPTICAL_LENGTH = 60;
const MAX_ELLIPTICAL_WORDS = 8;

/** Débuts de phrase qui signalent une relance (« et pour un étranger ? », « what about… »). */
const CONTINUATION_PREFIXES = [
  'et si',
  'et pour',
  'et en',
  'et',
  'aussi',
  'pareil',
  'meme chose',
  'dans ce cas',
  'and',
  'also',
  'what about',
  'how about',
  'same',
  'in that case',
];

/** Mots vides : un message qui n'en contient que (« Pourquoi ? », « Combien ? ») dépend du contexte. */
const STOP_WORDS = new Set([
  // Français
  'et',
  'ou',
  'mais',
  'donc',
  'alors',
  'aussi',
  'si',
  'le',
  'la',
  'les',
  'un',
  'une',
  'des',
  'du',
  'de',
  'd',
  'l',
  'au',
  'aux',
  'a',
  'en',
  'pour',
  'par',
  'avec',
  'sans',
  'dans',
  'sur',
  'ce',
  'cela',
  'ca',
  'ceci',
  'il',
  'elle',
  'ils',
  'je',
  'j',
  'moi',
  'vous',
  'nous',
  'on',
  'est',
  'c',
  'qu',
  'que',
  'quoi',
  'qui',
  'comment',
  'combien',
  'pourquoi',
  'quand',
  'ou',
  'quel',
  'quelle',
  'quels',
  'quelles',
  'oui',
  'non',
  'ok',
  'merci',
  'encore',
  'pareil',
  'cas',
  'meme',
  'chose',
  'autre',
  'autres',
  'y',
  'ne',
  'pas',
  'plus',
  // Anglais
  'and',
  'or',
  'but',
  'so',
  'also',
  'the',
  'an',
  'of',
  'to',
  'for',
  'with',
  'without',
  'in',
  'on',
  'it',
  'this',
  'that',
  'i',
  'me',
  'you',
  'we',
  'is',
  'are',
  'what',
  'which',
  'who',
  'how',
  'why',
  'when',
  'where',
  'about',
  'yes',
  'no',
  'thanks',
  'same',
  'then',
  'case',
  'again',
  'more',
  'much',
  'many',
  'not',
]);

/** Mots porteurs de sens (hors mots vides). */
export function contentWords(text: string): string[] {
  return words(text).filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Un message est elliptique s'il est court ET qu'il commence par une relance
 * (« et », « aussi », « what about »…) ou ne contient aucun mot porteur de sens.
 */
export function isElliptical(message: string): boolean {
  const folded = foldForKeywords(message);
  if (folded.length > MAX_ELLIPTICAL_LENGTH) return false;
  if (words(message).length > MAX_ELLIPTICAL_WORDS) return false;
  const startsWithContinuation = CONTINUATION_PREFIXES.some(
    (prefix) => folded === prefix || new RegExp(`^${prefix}\\b`).test(folded),
  );
  return startsWithContinuation || contentWords(message).length === 0;
}

export interface RetrievalQueryDecision {
  readonly query: string;
  readonly elliptical: boolean;
  readonly previousQuestionUsed: boolean;
}

/**
 * Requête de recherche : la question précédente n'est ajoutée que si le message est elliptique,
 * pour éviter de dériver vers l'ancien sujet quand l'utilisateur en change.
 */
export function buildRetrievalQuery(
  message: string,
  previousQuestion: string | undefined,
): RetrievalQueryDecision {
  const elliptical = isElliptical(message);
  if (elliptical && previousQuestion) {
    return { query: `${previousQuestion}\n${message}`, elliptical, previousQuestionUsed: true };
  }
  return { query: message, elliptical, previousQuestionUsed: false };
}
