'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { VerdictBadge } from '@/components/answer/badges';
import { useI18n } from '@/i18n/provider';
import { listTraces, type TraceSummary } from '@/lib/api-client';
import { describeApiError, toApiErrorKind, type ApiErrorKind } from '@/lib/api-errors';
import { formatDateTime, shortHash } from './format';

const LIMIT = 20;

/** Traces récentes et accès direct à une trace par identifiant. */
export function TraceList(): JSX.Element {
  const { dict } = useI18n();
  const t = dict.audit;
  const router = useRouter();
  const [traces, setTraces] = useState<TraceSummary[] | null>(null);
  const [error, setError] = useState<ApiErrorKind | null>(null);
  const [lookup, setLookup] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    listTraces({ limit: LIMIT })
      .then((result) => {
        if (!cancelled) setTraces(result.traces);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(toApiErrorKind(reason));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const open = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const id = lookup.trim();
    if (id) router.push(`/audit/${encodeURIComponent(id)}`);
  };

  return (
    <section aria-labelledby="recent-traces" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="recent-traces" className="font-display text-3xl font-medium">
          {t.recentTitle}
        </h2>
        <form onSubmit={open} className="flex w-full gap-2 sm:w-auto">
          <label htmlFor="trace-lookup" className="sr-only">
            {t.lookupLabel}
          </label>
          <input
            id="trace-lookup"
            value={lookup}
            onChange={(event) => setLookup(event.target.value)}
            placeholder={t.lookupPlaceholder}
            className="min-w-0 flex-1 rounded-full border border-ink/20 bg-paper-soft px-4 py-2.5 font-mono text-sm sm:w-72"
          />
          <button type="submit" className="btn-ink shrink-0 px-5 py-2.5 text-sm">
            {t.lookupButton}
          </button>
        </form>
      </div>

      {error && (
        <p className="rounded-2xl border border-sun/50 bg-sun/15 px-4 py-3 text-sm">
          {describeApiError(error, dict)}
        </p>
      )}
      {!error && traces === null && <p className="text-ink-muted">{dict.common.loading}</p>}
      {traces !== null && traces.length === 0 && (
        <p className="rounded-2xl border border-dashed border-ink/25 px-4 py-6 text-center text-ink-soft">
          {t.recentEmpty}
        </p>
      )}
      {traces !== null && traces.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-paper-soft">
          {traces.map((trace) => (
            <li key={trace.id}>
              <Link
                href={`/audit/${encodeURIComponent(trace.id)}`}
                className="grid gap-2 px-5 py-4 transition-colors hover:bg-paper-deep sm:grid-cols-[13rem_1fr_auto] sm:items-center sm:gap-6"
              >
                <span className="text-sm text-ink-soft">
                  <span className="sr-only">{t.colDate} : </span>
                  {formatDateTime(trace.createdAt, dict.common.dateLocale)}
                </span>
                <span>
                  <span className="sr-only">{t.colVerdict} : </span>
                  <VerdictBadge verdict={trace.verdict} tone="light" />
                </span>
                <span className="font-mono text-xs text-ink-muted">
                  <span className="sr-only">{t.colHash} : </span>
                  {shortHash(trace.hash)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
