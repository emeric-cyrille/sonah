'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Logo } from '@/components/logo';
import { SonahBot } from '@/components/sonah-bot';
import { useChatStore, type ChatEntry } from '@/store/chat-store';

const SUGGESTIONS = [
  'Je veux ouvrir un restaurant à Yaoundé',
  "J'ai perdu ma carte d'identité",
  "Comment obtenir une copie d'acte de naissance ?",
  'Quels sont mes droits si je suis licencié ?',
] as const;

const MAX_LENGTH = 2000;
const MAX_TEXTAREA_HEIGHT = 180;

function AssistantMessage({ message }: { readonly message: ChatEntry }): JSX.Element {
  return (
    <div className="flex gap-3 sm:gap-4">
      <Logo className="mt-0.5 h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1 pt-1.5">
        <p className="text-sm font-semibold">Sonah</p>
        <div
          className={`mt-1.5 whitespace-pre-wrap text-[16px] leading-relaxed ${
            message.isError
              ? 'rounded-2xl border border-clay/30 bg-clay-soft/40 px-4 py-3 text-ink'
              : 'text-ink'
          }`}
        >
          {message.content}
        </div>
        {message.sources && message.sources.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {message.sources.map((source) => (
              <li key={`${source.title}-${source.reference ?? ''}`}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-soft px-3 py-1 text-xs text-ink-soft hover:border-ink/30"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf" aria-hidden="true" />
                  {source.title}
                  {source.reference ? ` · ${source.reference}` : ''}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ChatWindow(): JSX.Element {
  const { messages, isSending, send, reset } = useChatStore();
  const [draft, setDraft] = useState<string>('');
  const searchParams = useSearchParams();
  const initialQuestionSent = useRef<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Démarre la conversation depuis un lien (?q=...)
  useEffect(() => {
    const question = searchParams.get('q');
    if (question && !initialQuestionSent.current && messages.length === 0) {
      initialQuestionSent.current = true;
      void send(question.slice(0, MAX_LENGTH));
    }
  }, [searchParams, messages.length, send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isSending]);

  // Ajuste la hauteur du champ au contenu
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [draft]);

  const submit = (event?: FormEvent<HTMLFormElement>): void => {
    event?.preventDefault();
    if (draft.trim().length === 0) return;
    void send(draft);
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-68px)] flex-col">
      <div className="flex-1 overflow-y-auto" aria-live="polite">
        <div className="container-page max-w-3xl py-8">
          {isEmpty ? (
            <div className="flex flex-col items-center pt-4 text-center sm:pt-8">
              <div className="relative">
                <SonahBot className="w-40 sm:w-48" />
                <span className="bubble-pop absolute -left-10 top-4 rounded-2xl rounded-br-sm border-2 border-ink bg-paper-soft px-3 py-1.5 font-display text-lg italic shadow-[3px_3px_0_#181b34]">
                  Coucou&nbsp;!
                </span>
              </div>
              <h1 className="mt-6 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Qu&apos;est-ce qui vous amène&nbsp;?
              </h1>
              <p className="mt-3 max-w-md text-ink-soft">
                Décrivez votre situation avec vos mots. Je vous indique les démarches à suivre.
              </p>
              <ul className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2.5">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      className="rounded-full border border-line bg-paper-soft px-4 py-2.5 text-[15px] text-ink-soft transition-all hover:-translate-y-0.5 hover:border-ink hover:text-ink"
                      onClick={() => void send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className="space-y-8">
              {messages.map((message) => (
                <li key={message.id} className="animate-fade-up">
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <p className="max-w-[85%] whitespace-pre-wrap rounded-[22px] rounded-br-md bg-ink px-5 py-3 text-[16px] leading-relaxed text-paper-soft">
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <AssistantMessage message={message} />
                  )}
                </li>
              ))}
              {isSending && (
                <li className="flex items-center gap-4">
                  <Logo className="h-9 w-9 shrink-0" />
                  <span className="flex items-center gap-1.5" aria-label="Sonah réfléchit…">
                    <span className="typing-dot h-2 w-2 rounded-full bg-ink" />
                    <span className="typing-dot h-2 w-2 rounded-full bg-ink [animation-delay:0.15s]" />
                    <span className="typing-dot h-2 w-2 rounded-full bg-ink [animation-delay:0.3s]" />
                  </span>
                </li>
              )}
            </ol>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="bg-gradient-to-t from-paper via-paper to-paper/0 pt-2">
        <form onSubmit={submit} className="container-page max-w-3xl">
          <div className="flex items-end gap-2 rounded-[26px] border border-ink/15 bg-paper-soft p-2 shadow-[0_12px_40px_-20px_rgba(24,27,52,0.5)] focus-within:border-ink/40">
            {!isEmpty && (
              <button
                type="button"
                onClick={reset}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-paper-deep hover:text-ink"
                aria-label="Nouvelle conversation"
                title="Nouvelle conversation"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M10 4v12M4 10h12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
            <label htmlFor="chat-input" className="sr-only">
              Votre message
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={MAX_LENGTH}
              placeholder="Écrivez à Sonah…"
              className="min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-6 placeholder:text-ink-muted/80 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sun text-ink transition-colors hover:bg-[#d99610] disabled:bg-paper-deep disabled:text-ink-muted"
              disabled={isSending || draft.trim().length === 0}
              aria-label="Envoyer"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M10 16V4m-5 5 5-5 5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="py-3 text-center text-xs text-ink-muted">
            Les réponses sont indicatives : l&apos;administration concernée fait foi.
          </p>
        </form>
      </div>
    </div>
  );
}
