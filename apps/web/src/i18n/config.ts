export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';
export const LOCALE_COOKIE = 'sonah_locale';
export const LOCALE_STORAGE_KEY = 'sonah_locale';
/** Un an : la préférence de langue survit aux visites. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Choisit la langue à partir d'un en-tête Accept-Language (ou de navigator.languages).
 * Le français reste la langue par défaut : l'anglais n'est retenu que s'il est préféré au français.
 */
export function negotiateLocale(
  preferences: string | readonly string[] | null | undefined,
): Locale {
  if (!preferences) return DEFAULT_LOCALE;
  const entries =
    typeof preferences === 'string'
      ? preferences.split(',').map((part, index) => {
          const [tag = '', ...params] = part.trim().split(';');
          const q = params.find((param) => param.trim().startsWith('q='));
          const weight = q ? Number(q.trim().slice(2)) : 1;
          return { tag: tag.toLowerCase(), q: Number.isFinite(weight) ? weight : 0, index };
        })
      : preferences.map((tag, index) => ({ tag: tag.toLowerCase(), q: 1, index }));

  const sorted = [...entries].sort((a, b) => b.q - a.q || a.index - b.index);
  for (const entry of sorted) {
    const base = entry.tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
