'use client';

import { Loader2, RotateCcw, SendHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useChatStore } from '@/store/chat-store';

const SUGGESTIONS = [
  'Je veux ouvrir un restaurant à Yaoundé',
  "J'ai perdu ma carte nationale d'identité",
  'Comment obtenir une copie de mon acte de naissance ?',
  'Quels sont mes droits en cas de licenciement ?',
] as const;

const MAX_LENGTH = 2000;

export function ChatWindow(): JSX.Element {
  const { messages, isSending, send, reset } = useChatStore();
  const [draft, setDraft] = useState<string>('');
  const searchParams = useSearchParams();
  const initialQuestionSent = useRef<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pré-remplit la conversation depuis un lien « Démarrer avec l'assistant »
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

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="flex-1 overflow-y-auto" aria-live="polite">
        <div className="container-page max-w-3xl py-6">
          {messages.length === 0 ? (
            <div className="py-10 text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Comment puis-je vous aider ?
              </h1>
              <p className="mt-2 text-ink-700">
                Décrivez votre situation, je vous indique les démarches à suivre.
              </p>
              <ul className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-ink-700 transition-colors hover:border-brand-200 hover:bg-brand-50"
                      onClick={() => void send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                      message.role === 'user'
                        ? 'rounded-br-sm bg-brand-600 text-white'
                        : message.isError
                          ? 'rounded-bl-sm border border-amber-200 bg-amber-50 text-amber-900'
                          : 'rounded-bl-sm bg-slate-100 text-ink-900'
                    }`}
                  >
                    {message.content}
                    {message.sources && message.sources.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-xs text-ink-500">
                        {message.sources.map((source) => (
                          <li key={`${source.title}-${source.reference ?? ''}`}>
                            {source.url ? (
                              <a
                                href={source.url}
                                className="underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.title}
                              </a>
                            ) : (
                              source.title
                            )}
                            {source.reference ? ` — ${source.reference}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
              {isSending && (
                <li className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm text-ink-500">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Les agents analysent votre demande…
                  </div>
                </li>
              )}
            </ol>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white">
        <form onSubmit={submit} className="container-page flex max-w-3xl items-end gap-2 py-3">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg p-3 text-ink-500 hover:bg-slate-100"
              aria-label="Nouvelle conversation"
              title="Nouvelle conversation"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <label htmlFor="chat-input" className="sr-only">
            Votre message
          </label>
          <textarea
            id="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder="Décrivez votre démarche…"
            className="max-h-40 min-h-[48px] flex-1 resize-none rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="btn-primary h-12 w-12 shrink-0 p-0"
            disabled={isSending || draft.trim().length === 0}
            aria-label="Envoyer"
          >
            <SendHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
        <p className="container-page max-w-3xl pb-3 text-center text-xs text-ink-500">
          Informations indicatives — vérifiez auprès de l’administration concernée.
        </p>
      </div>
    </div>
  );
}
