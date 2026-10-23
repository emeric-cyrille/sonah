'use client';

import { useI18n } from '@/i18n/provider';
import { IS_API_MOCK } from '@/lib/api-client';

/** Bandeau visible uniquement en mode démonstration : les réponses sont simulées. */
export function MockBanner(): JSX.Element | null {
  const { dict } = useI18n();
  if (!IS_API_MOCK) return null;
  return (
    <p className="relative z-30 bg-sun px-4 py-1.5 text-center text-xs font-semibold text-ink">
      {dict.common.mockBanner}
    </p>
  );
}
