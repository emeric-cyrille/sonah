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
      className="relative flex w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] p-1.5 pl-5 shadow-[0_20px_60px_-25px_rgba(240,180,41,0.45)] backdrop-blur-md transition-colors focus-within:border-sun/60"
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
        className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-paper placeholder:text-paper/45 focus:outline-none"
      />
      <button type="submit" className="btn-sun shrink-0 px-5 py-3">
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
