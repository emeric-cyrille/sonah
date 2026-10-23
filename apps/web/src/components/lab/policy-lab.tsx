'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnswerBody } from '@/components/answer/answer-body';
import { formatTime } from '@/components/audit/format';
import { PatternFill, type PatternName } from '@/components/patterns/cameroon-patterns';
import { useI18n } from '@/i18n/provider';
import {
  ApiRequestError,
  getScenarioRun,
  listAgents,
  listScenarios,
  releaseNextEvent,
  startScenarioRun,
  type Agent,
  type Gap,
  type RunStep,
  type Scenario,
} from '@/lib/api-client';
import { describeApiError, toApiErrorKind, type ApiErrorKind } from '@/lib/api-errors';

const RUN_STORAGE_KEY = 'sonah_lab_run';

// Identité visuelle de chaque agent : couleur et motif camerounais
const AGENT_LOOKS: ReadonlyArray<{ readonly color: string; readonly pattern: PatternName }> = [
  { color: 'bg-indigo text-paper', pattern: 'ndop' },
  { color: 'bg-leaf text-paper', pattern: 'toghu' },
  { color: 'bg-clay text-paper', pattern: 'perles' },
  { color: 'bg-sun text-ink', pattern: 'teleuk' },
];

interface ActiveRun {
  readonly runId: string;
  readonly scenario: Scenario;
  readonly totalSteps: number;
  readonly steps: readonly RunStep[];
  readonly done: boolean;
  readonly resumed: boolean;
}

function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return (
    words.length > 1
      ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`
      : (words[0] ?? '?').slice(0, 2)
  ).toUpperCase();
}

function saveRun(runId: string, scenarioId: string): void {
  try {
    window.sessionStorage.setItem(RUN_STORAGE_KEY, JSON.stringify({ runId, scenarioId }));
  } catch {
    // Reprise impossible sans stockage : sans gravité
  }
}

function clearRun(): void {
  try {
    window.sessionStorage.removeItem(RUN_STORAGE_KEY);
  } catch {
    // Rien à nettoyer
  }
}

function readSavedRun(): { runId: string; scenarioId: string } | null {
  try {
    const raw = window.sessionStorage.getItem(RUN_STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (
      value &&
      typeof value === 'object' &&
      typeof (value as { runId?: unknown }).runId === 'string' &&
      typeof (value as { scenarioId?: unknown }).scenarioId === 'string'
    ) {
      return value as { runId: string; scenarioId: string };
    }
  } catch {
    return null;
  }
  return null;
}

function AgentAvatar({
  name,
  look,
  size = 'h-11 w-11',
}: {
  readonly name: string;
  readonly look: (typeof AGENT_LOOKS)[number];
  readonly size?: string;
}): JSX.Element {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold ring-2 ring-paper ${look.color} ${size}`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 opacity-25">
        <PatternFill name={look.pattern} id={`avatar-${look.pattern}-${name.length}`} />
      </span>
      <span className="relative">{initials(name)}</span>
    </span>
  );
}

function ProgressBar({
  step,
  total,
}: {
  readonly step: number;
  readonly total: number;
}): JSX.Element {
  return (
    <ol className="flex flex-1 gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <li
          key={index}
          className={`h-2 flex-1 rounded-full transition-colors duration-500 ${
            index < step ? 'bg-sun' : 'bg-white/15'
          }`}
        />
      ))}
    </ol>
  );
}

function GapCard({ gap, step }: { readonly gap: Gap; readonly step: number }): JSX.Element {
  const { dict } = useI18n();
  return (
    <li className="animate-fade-up rounded-2xl border border-line bg-paper-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay">
        {dict.lab.eventLabel(step)}
      </p>
      <h3 className="mt-1.5 font-semibold leading-snug">{gap.title}</h3>
      {gap.description && <p className="mt-1.5 text-sm text-ink-soft">{gap.description}</p>}
      {gap.globalExample && (
        <div className="mt-3 rounded-xl border-l-4 border-sun bg-paper px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {dict.lab.globalExample}
          </p>
          <p className="mt-1 text-sm leading-relaxed">{gap.globalExample}</p>
        </div>
      )}
      {gap.sources.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {dict.lab.gapSources}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-ink-soft">
            {gap.sources.map((source) => (
              <li key={source} className="break-words">
                {/^https?:\/\//.test(source) ? (
                  <a href={source} target="_blank" rel="noreferrer" className="underline">
                    {source}
                  </a>
                ) : (
                  source
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

/**
 * Laboratoire de politiques : choix d'un scénario, libération des événements un par un,
 * réponses des agents (verdict, citations, trace) et accumulation des lacunes identifiées.
 */
export function PolicyLab(): JSX.Element {
  const { dict, locale } = useI18n();
  const t = dict.lab;
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [loadError, setLoadError] = useState<ApiErrorKind | null>(null);
  const [run, setRun] = useState<ActiveRun | null>(null);
  const [busy, setBusy] = useState<'starting' | 'releasing' | null>(null);
  const [actionError, setActionError] = useState<ApiErrorKind | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const lastEventHeading = useRef<HTMLHeadingElement>(null);
  const shouldFocusLastEvent = useRef<boolean>(false);

  // Chargement des agents et scénarios (dans la langue courante), puis reprise éventuelle
  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    Promise.all([listAgents(), listScenarios()])
      .then(async ([agentList, scenarioList]) => {
        if (cancelled) return;
        setAgents(agentList);
        setScenarios(scenarioList);
        const saved = readSavedRun();
        const scenario = saved && scenarioList.find((item) => item.id === saved.scenarioId);
        if (!saved || !scenario) return;
        try {
          const state = await getScenarioRun(saved.runId);
          if (cancelled) return;
          setRun({
            runId: state.runId,
            scenario,
            totalSteps: state.totalSteps,
            steps: state.steps,
            done: state.done,
            resumed: true,
          });
        } catch {
          clearRun();
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setLoadError(toApiErrorKind(reason));
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // Après une libération, le focus va au titre du nouvel événement (lecteurs d'écran, clavier)
  useEffect(() => {
    if (!shouldFocusLastEvent.current) return;
    shouldFocusLastEvent.current = false;
    const heading = lastEventHeading.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [run?.steps.length]);

  const agentLook = useCallback(
    (agentId: string) => {
      const index = agents?.findIndex((agent) => agent.id === agentId) ?? -1;
      return AGENT_LOOKS[(index >= 0 ? index : 0) % AGENT_LOOKS.length] ?? AGENT_LOOKS[0]!;
    },
    [agents],
  );

  const start = async (scenario: Scenario): Promise<void> => {
    setBusy('starting');
    setActionError(null);
    try {
      const started = await startScenarioRun(scenario.id);
      saveRun(started.runId, scenario.id);
      setRun({
        runId: started.runId,
        scenario,
        totalSteps: started.totalSteps,
        steps: [],
        done: false,
        resumed: false,
      });
      setAnnouncement(`${t.running} : ${scenario.title}. ${t.notStarted}`);
    } catch (error) {
      setActionError(toApiErrorKind(error));
    } finally {
      setBusy(null);
    }
  };

  const release = async (): Promise<void> => {
    if (!run || run.done || busy) return;
    setBusy('releasing');
    setActionError(null);
    try {
      const step = await releaseNextEvent(run.runId);
      shouldFocusLastEvent.current = true;
      setRun((current) =>
        current
          ? {
              ...current,
              totalSteps: step.totalSteps,
              steps: [...current.steps.filter((item) => item.step !== step.step), step],
              done: step.done,
            }
          : current,
      );
      setAnnouncement(`${t.progress(step.step, step.totalSteps)} : ${step.event.title}`);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setRun((current) => (current ? { ...current, done: true } : current));
      } else {
        setActionError(toApiErrorKind(error));
      }
    } finally {
      setBusy(null);
    }
  };

  const reset = (): void => {
    clearRun();
    setRun(null);
    setActionError(null);
  };

  const gaps = useMemo(() => {
    const seen = new Map<string, { gap: Gap; step: number }>();
    for (const step of run?.steps ?? []) {
      for (const gap of step.gaps) {
        if (!seen.has(gap.id)) seen.set(gap.id, { gap, step: step.step });
      }
    }
    return [...seen.values()];
  }, [run?.steps]);

  if (loadError) {
    return (
      <p role="alert" className="rounded-2xl border border-sun/50 bg-sun/15 px-5 py-4">
        {t.loadError} {describeApiError(loadError, dict)}
      </p>
    );
  }
  if (!agents || !scenarios) return <p className="text-ink-muted">{dict.common.loading}</p>;

  const releasedCount = run?.steps.length ?? 0;

  return (
    <div className="space-y-14">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {/* ─── Agents ─────────────────────────────────────────── */}
      <section aria-labelledby="agents-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="agents-title" className="font-display text-3xl font-medium">
            {t.agentsTitle}
          </h2>
          <p className="text-ink-soft">{t.agentsLead}</p>
        </div>
        {run ? (
          <ul className="mt-5 flex flex-wrap gap-3">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center gap-2.5 rounded-full border border-line bg-paper-soft py-1.5 pl-1.5 pr-4"
              >
                <AgentAvatar name={agent.name} look={agentLook(agent.id)} size="h-8 w-8" />
                <span className="text-sm">
                  <span className="font-semibold">{agent.name}</span>
                  <span className="text-ink-muted"> · {agent.role}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {agents.map((agent) => (
              <li key={agent.id} className="rounded-3xl border border-line bg-paper-soft p-5">
                <div className="flex items-center gap-3">
                  <AgentAvatar name={agent.name} look={agentLook(agent.id)} />
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-tight">{agent.name}</h3>
                    <p className="text-sm text-ink-muted">{agent.role}</p>
                  </div>
                </div>
                {agent.mandate && (
                  <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                    <span className="font-semibold text-ink">{t.mandate} : </span>
                    {agent.mandate}
                  </p>
                )}
                {agent.sources.length > 0 && (
                  <p className="mt-2 text-xs text-ink-muted">
                    <span className="font-semibold">{t.sources} : </span>
                    {agent.sources.join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {actionError && (
        <p role="alert" className="rounded-2xl border border-sun/50 bg-sun/15 px-5 py-4">
          {describeApiError(actionError, dict)}
        </p>
      )}

      {/* ─── Choix du scénario ──────────────────────────────── */}
      {!run && (
        <section aria-labelledby="scenarios-title">
          <h2 id="scenarios-title" className="font-display text-3xl font-medium">
            {t.scenariosTitle}
          </h2>
          {scenarios.length === 0 ? (
            <p className="mt-4 text-ink-muted">{t.scenariosEmpty}</p>
          ) : (
            <ul className="mt-6 grid gap-5 md:grid-cols-2">
              {scenarios.map((scenario, index) => (
                <li
                  key={scenario.id}
                  className="flex flex-col overflow-hidden rounded-3xl border border-line bg-paper-soft"
                >
                  <div className="h-14" aria-hidden="true">
                    <PatternFill
                      name={index % 2 === 0 ? 'toghu' : 'ndop'}
                      id={`scenario-${scenario.id}`}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                      {scenario.domain} · {t.stepsCount(scenario.totalSteps)}
                    </p>
                    <h3 className="mt-2 font-display text-2xl leading-snug">{scenario.title}</h3>
                    <p className="mt-2 flex-1 text-ink-soft">{scenario.description}</p>
                    <button
                      type="button"
                      className="btn-ink mt-6 w-full sm:w-fit"
                      disabled={busy !== null}
                      onClick={() => void start(scenario)}
                    >
                      {busy === 'starting' ? t.starting : t.start}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ─── Exécution en cours ─────────────────────────────── */}
      {run && (
        <section aria-labelledby="run-title" className="space-y-8 pb-24 lg:pb-0">
          <div className="z-20 rounded-3xl bg-night lg:sticky lg:top-[76px] p-5 text-paper shadow-[0_20px_50px_-25px_rgba(11,13,34,0.8)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="eyebrow text-sun">
                  {t.running} · {run.scenario.domain}
                </p>
                <h2 id="run-title" className="mt-1 font-display text-2xl leading-tight sm:text-3xl">
                  {run.scenario.title}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!run.done && (
                  <button
                    type="button"
                    className="btn-sun"
                    disabled={busy !== null}
                    onClick={() => void release()}
                  >
                    {busy === 'releasing' ? (
                      <>
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"
                          aria-hidden="true"
                        />
                        {t.releasing}
                      </>
                    ) : (
                      <>
                        {t.release}
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className="btn border border-white/25 text-paper hover:border-sun hover:text-sun"
                  onClick={reset}
                  disabled={busy !== null}
                >
                  {run.done ? t.chooseAnother : t.restart}
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <ProgressBar step={releasedCount} total={run.totalSteps} />
              <p className="shrink-0 text-sm font-semibold text-paper/85">
                {t.progress(releasedCount, run.totalSteps)}
              </p>
              <a
                href="#gaps-title"
                className="shrink-0 rounded-full bg-clay px-3 py-1 text-xs font-bold text-paper lg:hidden"
              >
                {gaps.length} · {t.gapsTitle}
              </a>
            </div>
          </div>

          {/* Barre mobile : le bouton de libération reste à portée de pouce */}
          {!run.done && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-night/95 px-4 py-3 text-paper backdrop-blur lg:hidden">
              <div className="mx-auto flex max-w-content items-center gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {t.progress(releasedCount, run.totalSteps)}
                </p>
                <button
                  type="button"
                  className="btn-sun shrink-0 px-4 py-2.5 text-sm"
                  disabled={busy !== null}
                  onClick={() => void release()}
                >
                  {busy === 'releasing' ? t.releasing : t.release}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
            {/* Chronologie des événements et réponses des agents */}
            <div className="min-w-0 space-y-10">
              {run.resumed && <p className="text-sm text-ink-muted">{t.resumeNote}</p>}
              {run.steps.length === 0 && (
                <p className="rounded-3xl border border-dashed border-ink/25 px-6 py-10 text-center text-ink-soft">
                  {t.notStarted}
                </p>
              )}
              {run.steps.map((step, index) => {
                const isLast = index === run.steps.length - 1;
                return (
                  <article
                    key={step.step}
                    className="animate-fade-up scroll-mt-60"
                    aria-labelledby={`event-${step.step}`}
                  >
                    <div className="rounded-3xl border-2 border-ink bg-paper-soft p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-paper">
                          {t.eventLabel(step.step)}
                        </span>
                        {step.event.injectedAt && (
                          <span className="text-xs text-ink-muted">
                            {t.injectedAt}{' '}
                            {formatTime(step.event.injectedAt, dict.common.dateLocale)}
                          </span>
                        )}
                      </div>
                      <h3
                        id={`event-${step.step}`}
                        ref={isLast ? lastEventHeading : undefined}
                        tabIndex={-1}
                        className="mt-3 font-display text-2xl leading-snug focus:outline-none"
                      >
                        {step.event.title}
                      </h3>
                      {step.event.description && (
                        <p className="mt-2 leading-relaxed text-ink-soft">
                          {step.event.description}
                        </p>
                      )}
                    </div>

                    {step.responses.length === 0 ? (
                      <p className="ml-6 mt-4 text-sm text-ink-muted">{t.noResponses}</p>
                    ) : (
                      <ol className="ml-3 mt-4 space-y-4 border-l-2 border-line pl-4 sm:ml-6 sm:pl-6">
                        {step.responses.map((response, responseIndex) => (
                          <li key={`${response.agentId}-${responseIndex}`} className="flex gap-3">
                            <AgentAvatar
                              name={response.agentName}
                              look={agentLook(response.agentId)}
                            />
                            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-paper-soft p-4 sm:p-5">
                              <p className="text-sm">
                                <span className="font-semibold">{response.agentName}</span>
                                {response.role && (
                                  <span className="text-ink-muted"> · {response.role}</span>
                                )}
                              </p>
                              <div className="mt-3">
                                <AnswerBody
                                  content={response.message}
                                  verdict={response.verdict}
                                  citations={response.citations}
                                  traceId={response.traceId}
                                  tone="light"
                                />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </article>
                );
              })}
              {run.done && (
                <p className="rounded-3xl bg-leaf/10 px-6 py-5 font-semibold text-leaf-deep">
                  {t.done}
                </p>
              )}
            </div>

            {/* Lacunes identifiées, accumulées au fil des événements */}
            <aside aria-labelledby="gaps-title" className="lg:sticky lg:top-[260px] lg:self-start">
              <div className="rounded-3xl border border-line bg-paper-deep/60 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="gaps-title" className="scroll-mt-60 font-display text-2xl">
                    {t.gapsTitle}
                  </h2>
                  <span className="rounded-full bg-clay px-2.5 py-0.5 text-sm font-bold text-paper">
                    {gaps.length}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{t.gapsLead}</p>
                {gaps.length === 0 ? (
                  <p className="mt-5 text-sm text-ink-muted">{t.gapsEmpty}</p>
                ) : (
                  <ul className="mt-5 space-y-3 lg:max-h-[calc(100vh-340px)] lg:overflow-y-auto lg:pr-1">
                    {gaps.map(({ gap, step }) => (
                      <GapCard key={gap.id} gap={gap} step={step} />
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </section>
      )}
    </div>
  );
}
