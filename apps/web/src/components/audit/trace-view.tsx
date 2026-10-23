'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VerdictBadge } from '@/components/answer/badges';
import { useI18n } from '@/i18n/provider';
import { getTrace, type Trace, type TraceStep } from '@/lib/api-client';
import { describeApiError, toApiErrorKind, type ApiErrorKind } from '@/lib/api-errors';
import { useChatStore } from '@/store/chat-store';
import { CopyButton } from './copy-button';
import { formatDateTime, formatDuration } from './format';
import { VerifyChain } from './verify-chain';

type StepType = keyof ReturnType<typeof useI18n>['dict']['audit']['stepTypes'];

// Couleur de la pastille par type d'étape (palette du site)
const STEP_COLORS: Readonly<Record<StepType, string>> = {
  input: 'bg-indigo text-paper',
  retrieval: 'bg-leaf text-paper',
  gate: 'bg-sun text-ink',
  agent: 'bg-clay text-paper',
  llm: 'bg-ink text-paper',
  fallback: 'bg-flag-red text-paper',
  coordination: 'bg-indigo-deep text-paper',
  output: 'bg-leaf-deep text-paper',
  unknown: 'bg-ink-muted text-paper',
};

function stepType(type: string): StepType {
  return type in STEP_COLORS ? (type as StepType) : 'unknown';
}

function StepItem({
  step,
  isLast,
}: {
  readonly step: TraceStep;
  readonly isLast: boolean;
}): JSX.Element {
  const { dict } = useI18n();
  const t = dict.audit;
  const type = stepType(step.type);
  const info = t.stepTypes[type];
  const hasData = step.data !== undefined && step.data !== null;

  return (
    <li className="relative grid grid-cols-[2.5rem_1fr] gap-4">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute bottom-[-1.5rem] left-[1.2rem] top-10 w-px bg-line"
        />
      )}
      <span
        className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${STEP_COLORS[type]}`}
        aria-hidden="true"
      >
        {step.order}
      </span>
      <div className="min-w-0 rounded-2xl border border-line bg-paper-soft p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-bold uppercase tracking-[0.12em]">
            <span className="sr-only">{step.order}. </span>
            {info.label}
          </span>
          {step.agent && (
            <span className="rounded-full border border-ink/15 px-2.5 py-0.5 text-xs text-ink-soft">
              {t.trace.agent} : {step.agent}
            </span>
          )}
          <span className="ml-auto font-mono text-xs text-ink-muted">
            <span className="sr-only">{t.trace.duration} : </span>
            {formatDuration(step.durationMs)}
          </span>
        </div>
        <p className="mt-2 break-words leading-relaxed">{step.summary}</p>
        {info.help && <p className="mt-1 text-xs text-ink-muted">{info.help}</p>}
        {hasData && (
          <details className="group mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-indigo underline decoration-indigo/30 underline-offset-4">
              <span className="group-open:hidden">{t.trace.showData}</span>
              <span className="hidden group-open:inline">{t.trace.hideData}</span>
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-night p-4 font-mono text-xs leading-relaxed text-paper/90">
              {JSON.stringify(step.data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </li>
  );
}

function HashRow({
  label,
  value,
  fallback,
}: {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly fallback?: string;
}): JSX.Element {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1.5 flex items-start gap-3">
        <code className="min-w-0 flex-1 break-all rounded-xl bg-paper-deep px-3 py-2 font-mono text-xs leading-relaxed">
          {value ?? fallback ?? '—'}
        </code>
        {value && <CopyButton value={value} label={label} />}
      </dd>
    </div>
  );
}

/** Détail d'une trace d'audit : en-tête, chaînage par empreinte, chronologie des étapes. */
export function TraceView({ traceId }: { readonly traceId: string }): JSX.Element {
  const { dict } = useI18n();
  const t = dict.audit.trace;
  const currentConversation = useChatStore((state) => state.conversationId);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [error, setError] = useState<ApiErrorKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTrace(null);
    setError(null);
    getTrace(traceId)
      .then((result) => {
        if (!cancelled) setTrace(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(toApiErrorKind(reason));
      });
    return () => {
      cancelled = true;
    };
  }, [traceId]);

  if (error) {
    return (
      <div className="space-y-6">
        <p role="alert" className="rounded-2xl border border-sun/50 bg-sun/15 px-5 py-4">
          {error.kind === 'not-found' ? t.notFound : describeApiError(error, dict)}
        </p>
        <Link href="/audit" className="link-underline font-semibold">
          {t.backToAudit}
        </Link>
      </div>
    );
  }

  if (!trace) return <p className="text-ink-muted">{dict.common.loading}</p>;

  const steps = [...trace.steps].sort((a, b) => a.order - b.order);
  const total = steps.reduce((sum, step) => sum + (step.durationMs ?? 0), 0);
  const fromCurrentChat = Boolean(
    trace.conversationId && trace.conversationId === currentConversation,
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="steps-title" className="order-2 min-w-0 lg:order-1">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="steps-title" className="font-display text-3xl font-medium">
            {t.steps}
          </h2>
          <p className="text-sm text-ink-muted">
            {t.totalDuration} : <span className="font-mono">{formatDuration(total)}</span>
          </p>
        </div>
        <p className="mt-1 text-ink-soft">{t.stepsLead}</p>
        {steps.length === 0 ? (
          <p className="mt-6 text-ink-muted">{t.noSteps}</p>
        ) : (
          <ol className="mt-8 space-y-6">
            {steps.map((step, index) => (
              <StepItem
                key={`${step.order}-${index}`}
                step={step}
                isLast={index === steps.length - 1}
              />
            ))}
          </ol>
        )}
      </section>

      <aside className="order-1 space-y-6 lg:order-2">
        <dl className="space-y-5 rounded-3xl border border-line bg-paper-soft p-5 sm:p-6">
          <div>
            <dt className="eyebrow">{t.verdict}</dt>
            <dd className="mt-2">
              <VerdictBadge verdict={trace.verdict} tone="light" explain />
            </dd>
          </div>
          <div>
            <dt className="eyebrow">{t.createdAt}</dt>
            <dd className="mt-1">{formatDateTime(trace.createdAt, dict.common.dateLocale)}</dd>
          </div>
          {trace.conversationId && (
            <div className="min-w-0">
              <dt className="eyebrow">{t.conversation}</dt>
              <dd className="mt-1 break-all font-mono text-xs">{trace.conversationId}</dd>
            </div>
          )}
          {trace.scenarioRunId && (
            <div className="min-w-0">
              <dt className="eyebrow">{t.scenarioRun}</dt>
              <dd className="mt-1 break-all font-mono text-xs">{trace.scenarioRunId}</dd>
            </div>
          )}
          <HashRow label={t.hash} value={trace.hash} />
          <HashRow label={t.prevHash} value={trace.prevHash} fallback={t.genesis} />
          <p className="text-xs text-ink-muted">{t.chainHelp}</p>
        </dl>
        <VerifyChain compact />
        <div className="flex flex-col gap-2 text-sm font-semibold">
          {fromCurrentChat && (
            <Link href="/chat" className="link-underline w-fit">
              ← {t.backToChat}
            </Link>
          )}
          {trace.scenarioRunId && (
            <Link href="/lab" className="link-underline w-fit">
              ← {dict.header.links.lab}
            </Link>
          )}
          <Link href="/audit" className="link-underline w-fit">
            ← {t.backToAudit}
          </Link>
        </div>
      </aside>
    </div>
  );
}
