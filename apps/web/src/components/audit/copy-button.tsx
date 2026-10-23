'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/provider';

/** Copie une valeur (empreinte, identifiant) dans le presse-papiers. */
export function CopyButton({
  value,
  label,
}: {
  readonly value: string;
  readonly label: string;
}): JSX.Element {
  const { dict } = useI18n();
  const [copied, setCopied] = useState<boolean>(false);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="shrink-0 rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
      aria-label={`${dict.common.copy} : ${label}`}
    >
      <span aria-live="polite">{copied ? dict.common.copied : dict.common.copy}</span>
    </button>
  );
}
