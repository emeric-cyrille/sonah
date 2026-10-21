'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const MAX_LENGTH = 2000;

export function AskBox({ placeholder }: { readonly placeholder: string }): JSX.Element {
  const router = useRouter();
  const [question, setQuestion] = useState<string>('');

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const text = question.trim();
    router.push(text.length > 0 ? `/chat?q=${encodeURIComponent(text)}` : '/chat');
  };

  return (
    <form
      onSubmit={onSubmit}
      className="group flex w-full items-center gap-2 rounded-full border border-ink/15 bg-paper-soft p-1.5 pl-5 shadow-[0_10px_40px_-18px_rgba(24,27,52,0.45)] transition-shadow focus-within:border-ink/40"
    >
      <label htmlFor="ask" className="sr-only">
        Votre question
      </label>
      <input
        id="ask"
        type="text"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        maxLength={MAX_LENGTH}
        placeholder={placeholder}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-base placeholder:text-ink-muted/80 focus:outline-none"
      />
      <button type="submit" className="btn-ink shrink-0 px-5 py-3">
        Demander
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <path
            d="M4 10h11m-4-4 4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
