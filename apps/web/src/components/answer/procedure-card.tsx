'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { PatternFill } from '@/components/patterns/cameroon-patterns';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { useI18n } from '@/i18n/provider';
import type { Procedure } from '@/lib/api-client';

const CHECKLIST_STORAGE_PREFIX = 'sonah_checklist_v1:';
const PRINTING_CLASS = 'sonah-printing';

type Fact = 'cost' | 'delay' | 'validity';

// ─── Outils ─────────────────────────────────────────────────────

function readChecked(storageId: string, size: number): boolean[] {
  try {
    const raw = window.sessionStorage.getItem(CHECKLIST_STORAGE_PREFIX + storageId);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length === size) return parsed.map(Boolean);
  } catch {
    // Stockage indisponible : la liste repart de zéro
  }
  return Array.from({ length: size }, () => false);
}

function writeChecked(storageId: string, checked: readonly boolean[]): void {
  try {
    window.sessionStorage.setItem(CHECKLIST_STORAGE_PREFIX + storageId, JSON.stringify(checked));
  } catch {
    // Sans stockage, l'état reste en mémoire pour ce message
  }
}

/** Date « 12 octobre 2026 » ; la valeur brute est gardée si elle n'est pas une date. */
export function formatDate(value: string, dateLocale: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
    timeZone: dateOnly ? 'UTC' : undefined,
  }).format(new Date(time));
}

function noteFor(procedure: Procedure, field: string): string | undefined {
  return procedure.unverified.find((item) => item.field === field)?.note || undefined;
}

/** Valeur d'un fait (coût, délai, validité), ou `undefined` s'il n'est pas renseigné. */
function factValue(procedure: Procedure, fact: Fact, locale: Locale): string | undefined {
  if (fact === 'cost') {
    const cost = procedure.cost;
    if (!cost) return undefined;
    const amount =
      cost.amount_fcfa !== null
        ? `${new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB').format(cost.amount_fcfa)} FCFA`
        : null;
    const parts = [amount, cost.description].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(' — ') : undefined;
  }
  return procedure[fact] ?? undefined;
}

function levelLabel(level: string | undefined, dict: Dictionary): string | undefined {
  if (!level) return undefined;
  return dict.procedure.levels[level.toLowerCase()] ?? level;
}

export function checklistText(
  procedure: Procedure,
  checked: readonly boolean[],
  dict: Dictionary,
): string {
  const lines = [
    dict.procedure.copyHeader(procedure.title),
    ...(procedure.authority ? [procedure.authority.name] : []),
    '',
    ...procedure.documents.map((doc, i) => `${checked[i] ? '[x]' : '[ ]'} ${doc}`),
    '',
    dict.procedure.copyFooter,
  ];
  return lines.join('\n');
}

// ─── Icônes ─────────────────────────────────────────────────────

function Icon({ path, className = 'h-4 w-4' }: { path: string; className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  building: 'M3 17h14M4.5 17V8.5L10 4l5.5 4.5V17M8 17v-4h4v4',
  pin: 'M10 17.5s5-4.6 5-8.5a5 5 0 1 0-10 0c0 3.9 5 8.5 5 8.5ZM10 10.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z',
  coin: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM12.2 7.6c-.4-.6-1.2-1-2.2-1-1.3 0-2.2.7-2.2 1.6 0 2.2 4.6 1 4.6 3.4 0 1-1 1.7-2.4 1.7-1 0-1.9-.4-2.3-1.1M10 5.2v1.4m0 6.9v1.3',
  clock: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM10 6v4l2.6 1.6',
  calendar: 'M4 6.5h12M6.5 3v3M13.5 3v3M4.5 5h11v11.5h-11z',
  copy: 'M7 7h9v9H7zM4 13V4h9',
  print: 'M6 7V3.5h8V7M6 13.5H4V8h12v5.5h-2M6 11h8v5.5H6z',
  link: 'M8 12l4-4M9 5.5l1-1a3.2 3.2 0 0 1 4.5 4.5l-1 1M11 14.5l-1 1a3.2 3.2 0 0 1-4.5-4.5l1-1',
  alert: 'M10 3.5 17.5 16h-15L10 3.5ZM10 8.5v3.5M10 14.2v.1',
  compass: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM12.8 7.2l-1.6 4-4 1.6 1.6-4 4-1.6Z',
} as const;

// ─── Vue imprimable ─────────────────────────────────────────────

/** Version noir sur blanc de la fiche, montée dans <body> le temps de l'impression. */
function ProcedurePrintView({
  procedure,
  checked,
}: {
  readonly procedure: Procedure;
  readonly checked: readonly boolean[];
}): JSX.Element {
  const { dict, locale } = useI18n();
  const t = dict.procedure;
  const facts: Fact[] = ['cost', 'delay', 'validity'];

  return (
    <div id="sonah-print-root" className="print-only" data-testid="procedure-print">
      <p className="print-kicker">
        {t.printHeader} ·{' '}
        {t.printedOn(formatDate(new Date().toISOString(), dict.common.dateLocale))}
      </p>
      <h1>{procedure.title}</h1>
      {procedure.authority && (
        <p>
          <strong>{t.authority} :</strong> {procedure.authority.name}
          {procedure.authority.level ? ` (${levelLabel(procedure.authority.level, dict)})` : ''}
        </p>
      )}
      <dl className="print-facts">
        {facts.map((fact) => {
          const value = factValue(procedure, fact, locale);
          if (fact === 'validity' && !value && !noteFor(procedure, fact)) return null;
          return (
            <div key={fact}>
              <dt>{t[fact]}</dt>
              <dd>
                {value ??
                  `${t.notVerified}${noteFor(procedure, fact) ? ` — ${noteFor(procedure, fact)}` : ''}`}
              </dd>
            </div>
          );
        })}
      </dl>
      {procedure.where.length > 0 && (
        <>
          <h2>{t.where}</h2>
          <ul>
            {procedure.where.map((place) => (
              <li key={place}>{place}</li>
            ))}
          </ul>
        </>
      )}
      {procedure.documents.length > 0 && (
        <>
          <h2>{t.documents}</h2>
          <ul className="print-checklist">
            {procedure.documents.map((doc, i) => (
              <li key={doc}>
                <span className="print-box" aria-hidden="true">
                  {checked[i] ? '✓' : ''}
                </span>
                {doc}
              </li>
            ))}
          </ul>
        </>
      )}
      {procedure.steps.length > 0 && (
        <>
          <h2>{t.steps}</h2>
          <ol>
            {procedure.steps.map((step) => (
              <li key={step.order}>{step.description}</li>
            ))}
          </ol>
        </>
      )}
      {procedure.unverified.length > 0 && (
        <>
          <h2>{t.unverifiedTitle(procedure.unverified.length)}</h2>
          <ul>
            {procedure.unverified.map((item) => (
              <li key={item.field}>
                <strong>{t.fields[item.field] ?? item.field}</strong>
                {item.note ? ` — ${item.note}` : ''}
              </li>
            ))}
          </ul>
        </>
      )}
      {procedure.sources.length > 0 && (
        <>
          <h2>{t.sources}</h2>
          <ul>
            {procedure.sources.map((source) => (
              <li key={`${source.title}-${source.url ?? ''}`}>
                {source.title}
                {source.publisher ? ` — ${source.publisher}` : ''}
                {source.url ? ` — ${source.url}` : ''}
              </li>
            ))}
          </ul>
        </>
      )}
      {procedure.verifiedAt && (
        <p>{t.verifiedAt(formatDate(procedure.verifiedAt, dict.common.dateLocale))}</p>
      )}
      <p className="print-note">{t.printNote}</p>
    </div>
  );
}

// ─── Fiche démarche ─────────────────────────────────────────────

/**
 * Fiche démarche affichée sous la réponse de Sonah : service compétent, lieux, pièces à cocher,
 * étapes, coût et délai (seulement s'ils sont confirmés), sources et points non vérifiés.
 */
export function ProcedureCard({
  procedure,
  storageId,
}: {
  readonly procedure: Procedure;
  /** Identifiant du message : l'état de la liste est gardé par message. */
  readonly storageId: string;
}): JSX.Element {
  const { dict, locale } = useI18n();
  const t = dict.procedure;
  const baseId = useId();
  const patternId = `toghu-${baseId.replace(/:/g, '')}`;
  const total = procedure.documents.length;

  const [checked, setChecked] = useState<boolean[]>(() =>
    Array.from({ length: total }, () => false),
  );
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [printing, setPrinting] = useState<boolean>(false);

  useEffect(() => {
    setChecked(readChecked(storageId, total));
  }, [storageId, total]);

  const toggle = (index: number): void => {
    setChecked((current) => {
      const next = current.map((value, i) => (i === index ? !value : value));
      writeChecked(storageId, next);
      return next;
    });
  };

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(checklistText(procedure, checked, dict));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 2200);
  };

  // Impression : la vue imprimable est montée, puis la boîte de dialogue s'ouvre
  useEffect(() => {
    if (!printing) return;
    const root = document.documentElement;
    root.classList.add(PRINTING_CLASS);
    const done = (): void => setPrinting(false);
    window.addEventListener('afterprint', done);
    const frame = window.requestAnimationFrame(() => window.print());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', done);
      root.classList.remove(PRINTING_CLASS);
    };
  }, [printing]);

  const done = checked.filter(Boolean).length;
  const facts: Fact[] = ['cost', 'delay', 'validity'];
  const visibleFacts = facts.filter(
    (fact) =>
      fact !== 'validity' ||
      Boolean(factValue(procedure, fact, locale)) ||
      Boolean(noteFor(procedure, fact)),
  );
  const factIcon: Record<Fact, string> = {
    cost: ICONS.coin,
    delay: ICONS.clock,
    validity: ICONS.calendar,
  };
  const titleId = `${baseId}-title`;

  return (
    <article
      aria-labelledby={titleId}
      data-testid="procedure-card"
      className="overflow-hidden rounded-[24px] bg-paper text-ink shadow-[0_24px_60px_-30px_rgba(232,163,23,0.45)]"
    >
      <PatternFill name="toghu" id={patternId} className="h-3 w-full" />
      <div className="space-y-6 p-4 sm:p-6">
        {/* En-tête */}
        <header>
          <p className="eyebrow text-leaf">{t.eyebrow}</p>
          <h2
            id={titleId}
            className="mt-2 font-display text-2xl font-medium leading-tight sm:text-[28px]"
          >
            {procedure.title}
          </h2>
          {procedure.authority && (
            <p className="mt-3 flex items-start gap-2 text-[15px] text-ink-soft">
              <Icon path={ICONS.building} className="mt-0.5 h-5 w-5 shrink-0 text-indigo" />
              <span>
                <span className="sr-only">{t.authority} : </span>
                <span className="font-semibold text-ink">{procedure.authority.name}</span>
                {procedure.authority.level && (
                  <span className="ml-2 inline-flex rounded-full border border-indigo/25 bg-indigo/5 px-2 py-0.5 align-middle text-xs font-semibold text-indigo">
                    {levelLabel(procedure.authority.level, dict)}
                  </span>
                )}
              </span>
            </p>
          )}
        </header>

        {/* Coût, délai, validité */}
        <dl className="grid gap-2 sm:grid-cols-3">
          {visibleFacts.map((fact) => {
            const value = factValue(procedure, fact, locale);
            const note = noteFor(procedure, fact);
            return (
              <div
                key={fact}
                data-testid={`fact-${fact}`}
                className={`rounded-2xl border px-3.5 py-3 ${
                  value ? 'border-line bg-paper-soft' : 'border-dashed border-sun/70 bg-sun/[0.08]'
                }`}
              >
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  <Icon path={factIcon[fact]} />
                  {t[fact]}
                </dt>
                <dd className="mt-1.5 text-[15px] font-semibold leading-snug">
                  {value ?? <span className="text-[#6b4a05]">{t.notVerified}</span>}
                </dd>
                {!value && note && (
                  <dd className="mt-1 text-[13px] leading-snug text-ink-soft">{note}</dd>
                )}
              </div>
            );
          })}
        </dl>

        {/* Où aller */}
        {procedure.where.length > 0 && (
          <section aria-labelledby={`${baseId}-where`}>
            <h3 id={`${baseId}-where`} className="eyebrow">
              {t.where}
            </h3>
            <ul className="mt-2.5 space-y-2">
              {procedure.where.map((place) => (
                <li key={place} className="flex items-start gap-2.5 text-[15px] leading-snug">
                  <Icon path={ICONS.pin} className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
                  <span>{place}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Pièces à fournir */}
        {total > 0 && (
          <section aria-labelledby={`${baseId}-docs`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 id={`${baseId}-docs`} className="eyebrow">
                {t.documents}
              </h3>
              <p
                className="text-xs font-semibold text-leaf"
                aria-live="polite"
                data-testid="checklist-progress"
              >
                {t.documentsProgress(done, total)}
              </p>
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">{t.documentsHint}</p>
            <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper-soft">
              {procedure.documents.map((doc, i) => {
                const inputId = `${baseId}-doc-${i}`;
                return (
                  <li key={`${i}-${doc}`}>
                    <label
                      htmlFor={inputId}
                      className="flex min-h-[48px] cursor-pointer items-start gap-3 px-3.5 py-3 transition-colors hover:bg-paper-deep/60"
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked[i] ?? false}
                        onChange={() => toggle(i)}
                        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-leaf"
                      />
                      <span
                        className={`text-[15px] leading-snug ${
                          checked[i] ? 'text-ink-muted line-through decoration-leaf/60' : ''
                        }`}
                      >
                        {doc}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Étapes */}
        {procedure.steps.length > 0 && (
          <section aria-labelledby={`${baseId}-steps`}>
            <h3 id={`${baseId}-steps`} className="eyebrow">
              {t.steps}
            </h3>
            <ol className="mt-3 space-y-3">
              {procedure.steps.map((step, i) => (
                <li key={`${step.order}-${i}`} className="flex gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo text-sm font-bold text-paper"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-[15px] leading-snug">{step.description}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Points non confirmés */}
        {procedure.unverified.length > 0 && (
          <details
            className="group rounded-2xl border border-sun/60 bg-sun/[0.08] px-3.5 py-3"
            data-testid="unverified"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] font-semibold text-[#6b4a05] [&::-webkit-details-marker]:hidden">
              <Icon path={ICONS.alert} className="h-5 w-5 shrink-0" />
              <span className="flex-1">{t.unverifiedTitle(procedure.unverified.length)}</span>
              <span aria-hidden="true" className="transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <p className="mt-2 text-[13px] text-ink-soft">{t.unverifiedLead}</p>
            <ul className="mt-2 space-y-1.5">
              {procedure.unverified.map((item) => (
                <li key={item.field} className="text-[14px] leading-snug">
                  <span className="font-semibold">{t.fields[item.field] ?? item.field}</span>
                  {item.note ? ` — ${item.note}` : ''}
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Sources */}
        {(procedure.sources.length > 0 || procedure.verifiedAt) && (
          <section aria-labelledby={`${baseId}-sources`} className="border-t border-line pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 id={`${baseId}-sources`} className="eyebrow">
                {t.sources}
              </h3>
              {procedure.verifiedAt && (
                <p className="text-xs font-semibold text-leaf" data-testid="verified-at">
                  {t.verifiedAt(formatDate(procedure.verifiedAt, dict.common.dateLocale))}
                </p>
              )}
            </div>
            {procedure.sources.length > 0 && (
              <ul className="mt-2.5 space-y-2">
                {procedure.sources.map((source) => (
                  <li key={`${source.title}-${source.url ?? ''}`} className="text-[14px]">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-start gap-1.5 font-semibold text-indigo underline decoration-indigo/30 underline-offset-4 hover:decoration-indigo"
                      >
                        <Icon path={ICONS.link} className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="break-words">
                          {source.title}
                          <span className="sr-only"> {t.newTab}</span>
                        </span>
                      </a>
                    ) : (
                      <span className="font-semibold">{source.title}</span>
                    )}
                    {source.publisher && (
                      <span className="block pl-5 text-xs text-ink-muted">{source.publisher}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          {total > 0 && (
            <button
              type="button"
              onClick={() => void copy()}
              data-testid="copy-checklist"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-indigo-deep"
            >
              <Icon path={ICONS.copy} />
              <span aria-live="polite">
                {copyState === 'copied' ? t.copied : copyState === 'failed' ? t.copyFailed : t.copy}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setPrinting(true)}
            data-testid="print-procedure"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-ink/25 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink"
          >
            <Icon path={ICONS.print} />
            {t.print}
          </button>
        </div>
      </div>
      {printing &&
        createPortal(<ProcedurePrintView procedure={procedure} checked={checked} />, document.body)}
    </article>
  );
}

// ─── Orientation ────────────────────────────────────────────────

/**
 * Pas de fiche vérifiée : Sonah le dit franchement et oriente vers le service compétent,
 * sans afficher de pièces, de coût ni de délai.
 */
export function OrientationCard({ procedure }: { readonly procedure?: Procedure }): JSX.Element {
  const { dict } = useI18n();
  const t = dict.procedure;
  const baseId = useId();
  const authority = procedure?.authority;
  const places = procedure?.where ?? [];

  return (
    <aside
      aria-labelledby={`${baseId}-title`}
      data-testid="orientation-card"
      className="rounded-[24px] border border-dashed border-sun/50 bg-sun/[0.06] p-4 text-paper sm:p-6"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sun-soft">
        <Icon path={ICONS.compass} className="h-4 w-4" />
        {t.orientationEyebrow}
      </p>
      <h2 id={`${baseId}-title`} className="mt-2 font-display text-2xl font-medium leading-tight">
        {t.orientationTitle}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-paper/80">{t.orientationLead}</p>

      <div className="mt-4 rounded-2xl border border-white/15 bg-night/60 px-4 py-3.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-paper/70">
          {t.orientationAuthority}
        </p>
        {authority ? (
          <p className="mt-1.5 flex items-start gap-2 text-[16px] font-semibold">
            <Icon path={ICONS.building} className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
            <span>
              {authority.name}
              {authority.level && (
                <span className="ml-2 inline-flex rounded-full border border-white/25 px-2 py-0.5 align-middle text-xs font-semibold text-paper/80">
                  {levelLabel(authority.level, dict)}
                </span>
              )}
            </span>
          </p>
        ) : (
          <p className="mt-1.5 text-[15px] text-paper/90">{t.orientationFallback}</p>
        )}
        {places.length > 0 && (
          <ul className="mt-2.5 space-y-1.5">
            {places.map((place) => (
              <li key={place} className="flex items-start gap-2 text-[14px] text-paper/85">
                <Icon path={ICONS.pin} className="mt-0.5 h-4 w-4 shrink-0 text-clay-soft" />
                <span>{place}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2 text-[15px] leading-relaxed text-sun-soft">
        <Icon path={ICONS.alert} className="mt-0.5 h-5 w-5 shrink-0" />
        <span>{t.orientationAsk}</span>
      </p>
    </aside>
  );
}
