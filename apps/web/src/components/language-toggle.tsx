'use client';

import { useI18n } from '@/i18n/provider';

/** Bascule FR / EN : mémorisée en cookie et en stockage local, met à jour `<html lang>`. */
export function LanguageToggle({ className = '' }: { readonly className?: string }): JSX.Element {
  const { dict, locale, setLocale } = useI18n();
  const next = locale === 'fr' ? 'en' : 'fr';

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      lang={next}
      aria-label={dict.header.language.switchTo}
      title={dict.header.language.switchTo}
      className={`inline-flex h-9 items-center rounded-full border border-white/20 p-0.5 text-xs font-bold tracking-wide text-paper/85 transition-colors hover:border-sun/60 ${className}`}
    >
      <span className="rounded-full bg-paper px-2.5 py-1.5 text-ink" aria-hidden="true">
        {dict.header.language.current}
      </span>
      <span className="px-2.5 py-1.5" aria-hidden="true">
        {dict.header.language.other}
      </span>
    </button>
  );
}
