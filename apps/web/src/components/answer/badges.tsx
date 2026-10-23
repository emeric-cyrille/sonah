'use client';

import { useI18n } from '@/i18n/provider';
import { KNOWN_STATUSES, KNOWN_VERDICTS, type KnownVerdict } from '@/lib/api-client';

export type Tone = 'dark' | 'light';

type VerdictKey = KnownVerdict | 'UNKNOWN';

export function verdictKey(verdict: string | null | undefined): VerdictKey {
  return (KNOWN_VERDICTS as readonly string[]).includes(verdict ?? '')
    ? (verdict as KnownVerdict)
    : 'UNKNOWN';
}

// Couleurs par verdict : vert (sourcé), ocre (prudence), terre cuite (alerte), neutre
const VERDICT_STYLES: Readonly<Record<VerdictKey, { dark: string; light: string; dot: string }>> = {
  ANSWERED_WITH_CITATIONS: {
    dark: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100',
    light: 'border-leaf/30 bg-leaf/10 text-leaf-deep',
    dot: 'bg-emerald-400',
  },
  INSUFFICIENT_EVIDENCE: {
    dark: 'border-sun/40 bg-sun/10 text-sun-soft',
    light: 'border-sun/50 bg-sun/15 text-[#6b4a05]',
    dot: 'bg-sun',
  },
  CONFLICT_BETWEEN_TEXTS: {
    dark: 'border-clay/50 bg-clay/15 text-clay-soft',
    light: 'border-clay/40 bg-clay/10 text-[#8a3418]',
    dot: 'bg-clay',
  },
  OUTDATED_TEXT: {
    dark: 'border-sun/40 bg-sun/10 text-sun-soft',
    light: 'border-sun/50 bg-sun/15 text-[#6b4a05]',
    dot: 'bg-sun',
  },
  REFER_TO_HUMAN: {
    dark: 'border-sky-300/40 bg-sky-300/10 text-sky-100',
    light: 'border-indigo/30 bg-indigo/10 text-indigo',
    dot: 'bg-sky-400',
  },
  OUT_OF_SCOPE: {
    dark: 'border-white/25 bg-white/[0.06] text-paper/85',
    light: 'border-ink/20 bg-ink/5 text-ink-soft',
    dot: 'bg-ink-muted',
  },
  UNKNOWN: {
    dark: 'border-white/25 bg-white/[0.06] text-paper/85',
    light: 'border-ink/20 bg-ink/5 text-ink-soft',
    dot: 'bg-ink-muted',
  },
};

/** Pastille de verdict ; avec `explain`, ajoute la phrase d'explication en dessous. */
export function VerdictBadge({
  verdict,
  tone,
  explain = false,
}: {
  readonly verdict: string | null | undefined;
  readonly tone: Tone;
  readonly explain?: boolean;
}): JSX.Element {
  const { dict } = useI18n();
  const key = verdictKey(verdict);
  const info = dict.verdicts[key];
  const style = VERDICT_STYLES[key];

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${style[tone]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
        {info.label}
      </span>
      {explain && (
        <p className={`text-sm ${tone === 'dark' ? 'text-paper/75' : 'text-ink-soft'}`}>
          {info.explanation}
        </p>
      )}
    </div>
  );
}

type StatusKey = (typeof KNOWN_STATUSES)[number] | 'unknown';

export function statusKey(status: string | null | undefined): StatusKey {
  return (KNOWN_STATUSES as readonly string[]).includes(status ?? '')
    ? (status as StatusKey)
    : 'unknown';
}

const STATUS_STYLES: Readonly<Record<StatusKey, string>> = {
  in_force: 'border-leaf/30 bg-leaf/10 text-leaf-deep',
  amended: 'border-sun/50 bg-sun/15 text-[#6b4a05]',
  repealed: 'border-flag-red/30 bg-flag-red/10 text-flag-red',
  unknown: 'border-ink/20 bg-ink/5 text-ink-soft',
};

/** Statut juridique d'un texte cité (affiché sur fond clair). */
export function StatusBadge({
  status,
}: {
  readonly status: string | null | undefined;
}): JSX.Element {
  const { dict } = useI18n();
  const key = statusKey(status);
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[key]}`}
    >
      {dict.citation.status[key]}
    </span>
  );
}
