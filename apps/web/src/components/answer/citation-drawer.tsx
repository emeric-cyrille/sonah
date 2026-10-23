'use client';

import Link from 'next/link';
import { useEffect, useId, useRef } from 'react';
import { useI18n } from '@/i18n/provider';
import type { Citation } from '@/lib/api-client';
import { StatusBadge, statusKey } from './badges';

/**
 * Panneau latéral (plein écran sur mobile) affichant l'extrait cité, sa référence,
 * son statut juridique et les liens vers la source officielle et le texte complet.
 */
export function CitationDrawer({
  citation,
  onClose,
}: {
  readonly citation: Citation | null;
  readonly onClose: () => void;
}): JSX.Element | null {
  const { dict } = useI18n();
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!citation) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus();
    };
  }, [citation, onClose]);

  if (!citation) return null;
  const status = statusKey(citation.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
        aria-label={dict.common.close}
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-up relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-paper-soft text-ink shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <p className="eyebrow">
              {dict.citation.panelTitle} [{citation.index}]
            </p>
            <h2 id={titleId} className="mt-2 font-display text-2xl leading-tight">
              {citation.title}
            </h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line hover:bg-paper-deep"
            aria-label={dict.common.close}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d="m5 5 10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <dl className="grid gap-4">
            {citation.reference && (
              <div>
                <dt className="eyebrow">{dict.citation.reference}</dt>
                <dd className="mt-1 font-semibold">{citation.reference}</dd>
              </div>
            )}
            <div>
              <dt className="sr-only">Statut</dt>
              <dd className="flex flex-col gap-1.5">
                <StatusBadge status={citation.status} />
                <span className="text-sm text-ink-soft">{dict.citation.statusHelp[status]}</span>
              </dd>
            </div>
          </dl>

          <figure>
            <figcaption className="eyebrow">{dict.citation.excerpt}</figcaption>
            <blockquote className="mt-2 whitespace-pre-wrap border-l-4 border-sun bg-paper px-4 py-3 font-display text-[17px] leading-relaxed">
              {citation.excerpt}
            </blockquote>
          </figure>

          <div className="flex flex-col gap-3">
            <Link
              href={`/documents/${encodeURIComponent(citation.documentId)}`}
              className="btn-ink w-full"
            >
              {dict.citation.openDocument}
            </Link>
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="btn w-full border border-ink/20 hover:bg-paper-deep"
              >
                {dict.citation.openSource}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
