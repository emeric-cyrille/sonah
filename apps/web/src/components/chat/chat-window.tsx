'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { OrbAvatar } from '@/components/orb-avatar';
import { PatternFill } from '@/components/patterns/cameroon-patterns';
import { SonahOrb } from '@/components/three/sonah-orb';
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
      <OrbAvatar className="mt-0.5 h-9 w-9" />
      <div className="min-w-0 flex-1 pt-1.5">
        <p className="text-sm font-semibold text-sun">Sonah</p>
        <div
          className={`mt-1.5 whitespace-pre-wrap text-[16px] leading-relaxed ${
            message.isError
              ? 'rounded-2xl border border-sun/25 bg-sun/[0.08] px-4 py-3 text-paper/90'
              : 'text-paper/90'
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-paper/70 hover:border-sun/50"
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
    <div className="grain relative flex h-[calc(100dvh-68px)] flex-col overflow-hidden bg-night text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.05]">
        <PatternFill name="ndop-line" id="ndop-chat" ink="#f6f1e7" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[60vmin] w-[60vmin] -translate-x-1/2 rounded-full bg-sun/15 blur-[120px]"
      />
      <div className="relative flex-1 overflow-y-auto" aria-live="polite">
        <div className="container-page max-w-3xl py-8">
          {isEmpty ? (
            <div className="flex flex-col items-center pt-4 text-center sm:pt-8">
              <SonahOrb className="h-56 w-56 sm:h-72 sm:w-72" compact />
              <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Qu&apos;est-ce qui vous amène&nbsp;?
              </h1>
              <p className="mt-3 max-w-md text-paper/60">
                Décrivez votre situation avec vos mots. Je vous indique les démarches à suivre.
              </p>
              <ul className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2.5">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[15px] text-paper/75 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-sun/60 hover:text-paper"
                      onClick={() => void send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <SonahOrb
                className="mx-auto -mb-2 -mt-8 h-44 w-44"
                compact
                energy={isSending ? 1 : 0}
              />
              <ol className="space-y-8">
                {messages.map((message) => (
                  <li key={message.id} className="animate-fade-up">
                    {message.role === 'user' ? (
                      <div className="flex justify-end">
                        <p className="max-w-[85%] whitespace-pre-wrap rounded-[22px] rounded-br-md bg-paper px-5 py-3 text-[16px] leading-relaxed text-ink">
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
                    <OrbAvatar className="h-9 w-9" thinking />
                    <span className="flex items-center gap-1.5" aria-label="Sonah réfléchit…">
                      <span className="typing-dot h-2 w-2 rounded-full bg-sun" />
                      <span className="typing-dot h-2 w-2 rounded-full bg-sun [animation-delay:0.15s]" />
                      <span className="typing-dot h-2 w-2 rounded-full bg-sun [animation-delay:0.3s]" />
                    </span>
                  </li>
                )}
              </ol>
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative bg-gradient-to-t from-night via-night to-night/0 pt-2">
        <form onSubmit={submit} className="container-page max-w-3xl">
          <div className="flex items-end gap-2 rounded-[26px] border border-white/15 bg-white/[0.06] p-2 shadow-[0_20px_60px_-25px_rgba(240,180,41,0.4)] backdrop-blur-xl focus-within:border-sun/60">
            {!isEmpty && (
              <button
                type="button"
                onClick={reset}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-paper/60 hover:bg-white/10 hover:text-paper"
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
              className="min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-6 text-paper placeholder:text-paper/40 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sun text-ink transition-colors hover:bg-[#d99610] disabled:bg-white/10 disabled:text-paper/40"
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
          <p className="py-3 text-center text-xs text-paper/40">
            Les réponses sont indicatives : l&apos;administration concernée fait foi.
          </p>
        </form>
      </div>
    </div>
  );
}
