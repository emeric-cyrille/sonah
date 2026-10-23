'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { verifyAuditChain, type VerifyResult } from '@/lib/api-client';
import { describeApiError, toApiErrorKind, type ApiErrorKind } from '@/lib/api-errors';

type State =
  | { readonly status: 'idle' }
  | { readonly status: 'running' }
  | { readonly status: 'done'; readonly result: VerifyResult }
  | { readonly status: 'error'; readonly error: ApiErrorKind };

/** Bouton « Vérifier l'intégrité de la chaîne » et résultat lisible. */
export function VerifyChain({ compact = false }: { readonly compact?: boolean }): JSX.Element {
  const { dict } = useI18n();
  const t = dict.audit.verify;
  const [state, setState] = useState<State>({ status: 'idle' });

  const run = async (): Promise<void> => {
    setState({ status: 'running' });
    try {
      setState({ status: 'done', result: await verifyAuditChain() });
    } catch (error) {
      setState({ status: 'error', error: toApiErrorKind(error) });
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-paper-soft p-5 sm:p-6">
      <div
        className={`flex flex-col gap-4 ${compact ? '' : 'sm:flex-row sm:items-center sm:justify-between'}`}
      >
        <p className="max-w-md text-sm text-ink-soft">{t.help}</p>
        <button
          type="button"
          onClick={() => void run()}
          disabled={state.status === 'running'}
          className={`btn-ink shrink-0 ${compact ? 'w-full' : ''}`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path
              d="M10 2.5 4 5v4.5c0 3.6 2.5 6.8 6 8 3.5-1.2 6-4.4 6-8V5l-6-2.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="m7.5 10 1.8 1.8L12.8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {state.status === 'running' ? t.running : t.button}
        </button>
      </div>

      <div aria-live="polite">
        {state.status === 'done' && (
          <p
            className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 font-semibold ${
              state.result.valid
                ? 'border-leaf/30 bg-leaf/10 text-leaf-deep'
                : 'border-flag-red/30 bg-flag-red/10 text-flag-red'
            }`}
          >
            <span aria-hidden="true" className="text-lg leading-6">
              {state.result.valid ? '✓' : '✕'}
            </span>
            <span>
              {state.result.valid
                ? t.valid(state.result.count)
                : state.result.brokenAt !== undefined && state.result.brokenAt !== null
                  ? t.broken(state.result.count, String(state.result.brokenAt))
                  : t.brokenUnknown}
            </span>
          </p>
        )}
        {state.status === 'error' && (
          <p className="mt-4 rounded-2xl border border-sun/50 bg-sun/15 px-4 py-3 text-sm text-ink">
            {describeApiError(state.error, dict)}
          </p>
        )}
      </div>
    </div>
  );
}
