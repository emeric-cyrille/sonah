'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/provider';
import type { Citation, Source } from '@/lib/api-client';
import { StatusBadge, VerdictBadge, type Tone } from './badges';
import { CitationDrawer } from './citation-drawer';
import { FeedbackButtons } from './feedback-buttons';
import { LightMarkdown, type CitationRenderer } from './light-markdown';

const CHIP_STYLES: Readonly<Record<Tone, string>> = {
  dark: 'border-sun/50 bg-sun/15 text-sun-soft hover:bg-sun hover:text-ink',
  light: 'border-indigo/30 bg-indigo/10 text-indigo hover:bg-indigo hover:text-paper',
};

/**
 * Corps d'une réponse sourcée : verdict expliqué, texte (Markdown léger) avec puces de citation [n],
 * liste des textes cités, autres sources, lien vers la trace d'audit et avis local.
 */
export function AnswerBody({
  content,
  verdict,
  citations = [],
  sources = [],
  traceId,
  feedbackId,
  tone,
}: {
  readonly content: string;
  readonly verdict?: string | null;
  readonly citations?: readonly Citation[];
  readonly sources?: readonly Source[];
  readonly traceId?: string | null;
  readonly feedbackId?: string;
  readonly tone: Tone;
}): JSX.Element {
  const { dict } = useI18n();
  const [open, setOpen] = useState<Citation | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const byIndex = useMemo(
    () => new Map(citations.map((citation) => [citation.index, citation])),
    [citations],
  );

  const renderCitation: CitationRenderer = (index, key) => {
    const citation = byIndex.get(index);
    if (!citation) return null;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setOpen(citation)}
        className={`mx-0.5 inline-flex h-5 min-w-[1.25rem] translate-y-[-2px] items-center justify-center rounded-full border px-1.5 align-middle text-[11px] font-bold leading-none transition-colors ${CHIP_STYLES[tone]}`}
        aria-label={`${dict.chat.openCitation(index)} : ${citation.title}`}
      >
        {index}
      </button>
    );
  };

  const muted = tone === 'dark' ? 'text-paper/75' : 'text-ink-muted';
  const cardStyle =
    tone === 'dark'
      ? 'border-white/15 bg-white/[0.04] hover:border-sun/50'
      : 'border-line bg-paper-soft hover:border-ink/40';

  // Les sources déjà citées ne sont pas répétées
  const extraSources = sources.filter(
    (source) =>
      !citations.some(
        (citation) =>
          citation.title === source.title &&
          (citation.reference ?? '') === (source.reference ?? ''),
      ),
  );

  return (
    <div className="space-y-4">
      {verdict && <VerdictBadge verdict={verdict} tone={tone} explain />}

      <LightMarkdown
        text={content}
        renderCitation={renderCitation}
        className={`text-[16px] leading-relaxed ${tone === 'dark' ? 'text-paper/90' : 'text-ink'}`}
      />

      {citations.length > 0 && (
        <section aria-label={dict.chat.citationsHeading}>
          <p className={`eyebrow ${tone === 'dark' ? 'text-paper/70' : ''}`}>
            {dict.chat.citationsHeading}
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {citations.map((citation) => (
              <li key={`${citation.index}-${citation.documentId}`}>
                <button
                  type="button"
                  onClick={() => setOpen(citation)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors ${cardStyle}`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${CHIP_STYLES[tone]}`}
                    aria-hidden="true"
                  >
                    {citation.index}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{citation.title}</span>
                    {citation.reference && (
                      <span className={`block truncate text-xs ${muted}`}>
                        {citation.reference}
                      </span>
                    )}
                  </span>
                  {citation.status && citation.status !== 'in_force' && (
                    <span className="shrink-0 rounded-full bg-paper">
                      <StatusBadge status={citation.status} />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {extraSources.length > 0 && (
        <section aria-label={dict.chat.sourcesHeading}>
          <p className={`eyebrow ${tone === 'dark' ? 'text-paper/70' : ''}`}>
            {dict.chat.sourcesHeading}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {extraSources.map((source) => {
              const label = `${source.title}${source.reference ? ` · ${source.reference}` : ''}`;
              const chip = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                tone === 'dark' ? 'border-white/20 text-paper/80' : 'border-line text-ink-soft'
              }`;
              return (
                <li key={label}>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`${chip} hover:border-sun/60`}
                    >
                      {label} <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span className={chip}>{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(traceId || feedbackId) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {traceId ? (
            <Link
              href={`/audit/${encodeURIComponent(traceId)}`}
              className={`inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-2 underline-offset-4 ${
                tone === 'dark'
                  ? 'text-sun-soft decoration-sun/40 hover:decoration-sun'
                  : 'text-indigo decoration-indigo/30 hover:decoration-indigo'
              }`}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M4 5h12M4 10h8M4 15h10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              {dict.chat.viewTrace}
            </Link>
          ) : (
            <span />
          )}
          {feedbackId && <FeedbackButtons id={feedbackId} tone={tone} />}
        </div>
      )}

      <CitationDrawer citation={open} onClose={close} />
    </div>
  );
}
