'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { getDocument, type LegalDocument } from '@/lib/api-client';
import { describeApiError, toApiErrorKind, type ApiErrorKind } from '@/lib/api-errors';
import { StatusBadge } from './answer/badges';
import { LightMarkdown } from './answer/light-markdown';

function isHttpUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^https?:\/\//.test(value);
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

/** Texte complet d'un article ou document indexé, avec ses métadonnées. */
export function DocumentView({ documentId }: { readonly documentId: string }): JSX.Element {
  const { dict } = useI18n();
  const t = dict.documents;
  const router = useRouter();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [error, setError] = useState<ApiErrorKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDocument(documentId)
      .then((result) => {
        if (!cancelled) setDocument(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(toApiErrorKind(reason));
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const back = (
    <button type="button" onClick={() => router.back()} className="link-underline font-semibold">
      ← {t.back}
    </button>
  );

  if (error) {
    return (
      <div className="space-y-6">
        <p role="alert" className="rounded-2xl border border-sun/50 bg-sun/15 px-5 py-4">
          {error.kind === 'not-found' ? t.notFound : describeApiError(error, dict)}
        </p>
        {back}
      </div>
    );
  }
  if (!document) return <p className="text-ink-muted">{dict.common.loading}</p>;

  const metadata = Object.entries(document.metadata ?? {});
  const status = typeof document.metadata?.status === 'string' ? document.metadata.status : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <article className="min-w-0">
        <p className="eyebrow">{document.category ?? t.eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-medium leading-tight sm:text-4xl">
          {document.title}
        </h2>
        {status && (
          <div className="mt-4">
            <StatusBadge status={status} />
          </div>
        )}
        <LightMarkdown
          text={document.content}
          className="mt-8 max-w-prose font-display text-[18px] leading-relaxed"
        />
      </article>
      <aside className="space-y-5">
        <dl className="space-y-4 rounded-3xl border border-line bg-paper-soft p-5">
          {document.reference && (
            <div>
              <dt className="eyebrow">{t.reference}</dt>
              <dd className="mt-1 font-semibold">{document.reference}</dd>
            </div>
          )}
          {document.source && (
            <div className="min-w-0">
              <dt className="eyebrow">{t.source}</dt>
              <dd className="mt-1 break-all text-sm">
                {isHttpUrl(document.source) ? (
                  <a
                    href={document.source}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline"
                  >
                    {t.openOfficial} ↗
                  </a>
                ) : (
                  document.source
                )}
              </dd>
            </div>
          )}
          {metadata.length > 0 && (
            <div>
              <dt className="eyebrow">{t.metadata}</dt>
              <dd className="mt-2">
                <ul className="space-y-1 font-mono text-xs">
                  {metadata.map(([key, value]) => (
                    <li key={key} className="break-all">
                      <span className="text-ink-muted">{key}</span> : {formatMetadataValue(value)}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
        {back}
      </aside>
    </div>
  );
}
