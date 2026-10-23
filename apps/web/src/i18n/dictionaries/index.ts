import type { Locale } from '../config';
import { en } from './en';
import { fr, type Dictionary } from './fr';

export type { Dictionary };

const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
