'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/provider';
import type { Tone } from './badges';

const STORAGE_KEY = 'sonah_feedback_v1';

type Vote = 'up' | 'down';

function readVotes(): Record<string, Vote> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Vote>) : {};
  } catch {
    return {};
  }
}

/** Avis 👍/👎 conservé uniquement dans le navigateur (aucun envoi au serveur pour l'instant). */
export function FeedbackButtons({
  id,
  tone,
}: {
  readonly id: string;
  readonly tone: Tone;
}): JSX.Element {
  const { dict } = useI18n();
  const [vote, setVote] = useState<Vote | undefined>(undefined);

  useEffect(() => {
    setVote(readVotes()[id]);
  }, [id]);

  const choose = (next: Vote): void => {
    const votes = readVotes();
    const value = vote === next ? undefined : next;
    if (value) votes[id] = value;
    else delete votes[id];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    } catch {
      // Stockage indisponible : l'avis reste affiché le temps de la session
    }
    setVote(value);
  };

  const base =
    tone === 'dark'
      ? 'border-white/20 text-paper/80 hover:border-sun/60 hover:text-paper aria-pressed:border-sun aria-pressed:bg-sun/15 aria-pressed:text-paper'
      : 'border-ink/20 text-ink-soft hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`text-xs ${tone === 'dark' ? 'text-paper/70' : 'text-ink-muted'}`}>
        {vote ? dict.feedback.thanks : dict.feedback.question}
      </span>
      <button
        type="button"
        aria-pressed={vote === 'up'}
        onClick={() => choose('up')}
        className={`rounded-full border px-2.5 py-1 text-sm transition-colors ${base}`}
        title={dict.feedback.up}
      >
        <span aria-hidden="true">👍</span>
        <span className="sr-only">{dict.feedback.up}</span>
      </button>
      <button
        type="button"
        aria-pressed={vote === 'down'}
        onClick={() => choose('down')}
        className={`rounded-full border px-2.5 py-1 text-sm transition-colors ${base}`}
        title={dict.feedback.down}
      >
        <span aria-hidden="true">👎</span>
        <span className="sr-only">{dict.feedback.down}</span>
      </button>
    </div>
  );
}
