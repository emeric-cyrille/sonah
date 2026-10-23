'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_STORAGE_KEY,
  type Locale,
} from './config';
import { getDictionary, type Dictionary } from './dictionaries';

interface I18nContextValue {
  readonly locale: Locale;
  readonly dict: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Stockage indisponible (navigation privée) : le cookie suffit
  }
}

/**
 * Fournit la langue courante et le dictionnaire aux composants client.
 * La langue initiale vient du serveur (cookie ou Accept-Language) pour éviter tout clignotement.
 */
export function I18nProvider({
  initialLocale,
  children,
}: {
  readonly initialLocale: Locale;
  readonly children: ReactNode;
}): JSX.Element {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Le serveur peut changer de langue (navigation après bascule) : on se resynchronise
  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  // Sans cookie mais avec une préférence mémorisée localement : on la réapplique
  useEffect(() => {
    if (document.cookie.includes(`${LOCALE_COOKIE}=`)) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (isLocale(stored) && stored !== initialLocale) {
      persistLocale(stored);
      setLocaleState(stored);
      router.refresh();
    }
  }, [initialLocale, router]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale): void => {
      persistLocale(next);
      setLocaleState(next);
      // Recharge les composants serveur dans la nouvelle langue (titres, métadonnées)
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dict: getDictionary(locale), setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n doit être utilisé dans un I18nProvider');
  return context;
}
