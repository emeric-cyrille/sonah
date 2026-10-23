import type { Language } from './policy.types';
import { words } from './text';

/** Mots outils très fréquents, propres à chaque langue (les mots ambigus comme « on » sont exclus). */
const FRENCH_MARKERS = new Set([
  'le',
  'la',
  'les',
  'des',
  'du',
  'une',
  'est',
  'et',
  'je',
  'vous',
  'nous',
  'mon',
  'ma',
  'mes',
  'pour',
  'dans',
  'avec',
  'sur',
  'pas',
  'que',
  'qui',
  'quoi',
  'quel',
  'quelle',
  'quels',
  'comment',
  'combien',
  'pourquoi',
  'au',
  'aux',
  'ce',
  'cette',
  'il',
  'elle',
  'sont',
  'suis',
  'faire',
  'peut',
  'dois',
  'bonjour',
  'merci',
  'entreprise',
  'droit',
  'droits',
  'loi',
]);

const ENGLISH_MARKERS = new Set([
  'the',
  'an',
  'is',
  'are',
  'and',
  'i',
  'you',
  'we',
  'my',
  'your',
  'for',
  'with',
  'what',
  'which',
  'how',
  'why',
  'when',
  'where',
  'who',
  'do',
  'does',
  'can',
  'should',
  'must',
  'of',
  'to',
  'in',
  'it',
  'this',
  'that',
  'not',
  'have',
  'has',
  'hello',
  'thanks',
  'please',
  'business',
  'law',
  'rights',
  'right',
]);

export interface LanguageDetection {
  readonly language: Language;
  readonly source: 'override' | 'heuristic' | 'default';
  readonly scores: { readonly fr: number; readonly en: number };
}

/**
 * Détecte la langue (français ou anglais) d'un message. Une préférence explicite l'emporte.
 * Heuristique : mots outils de chaque langue, et lettres accentuées comme indice du français.
 * En cas d'égalité, le français (langue par défaut de Sonah).
 */
export function detectLanguage(text: string, override?: Language): LanguageDetection {
  const tokens = words(text);
  let fr = 0;
  let en = 0;
  for (const token of tokens) {
    if (FRENCH_MARKERS.has(token)) fr += 1;
    if (ENGLISH_MARKERS.has(token)) en += 1;
  }
  if (/[éèêàùçôîûëïœ]/i.test(text)) fr += 1;
  if (/\b(?:qu|l|d|j|n|s|c)['’]/i.test(text)) fr += 1;

  const scores = { fr, en };
  if (override) return { language: override, source: 'override', scores };
  if (fr === 0 && en === 0) return { language: 'fr', source: 'default', scores };
  return { language: en > fr ? 'en' : 'fr', source: 'heuristic', scores };
}
