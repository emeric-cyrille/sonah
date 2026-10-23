'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnswerBody } from '@/components/answer/answer-body';
import { OrientationCard, ProcedureCard } from '@/components/answer/procedure-card';
import { OrbAvatar } from '@/components/orb-avatar';
import { PatternFill } from '@/components/patterns/cameroon-patterns';
import { SonahOrb } from '@/components/three/sonah-orb';
import { useI18n } from '@/i18n/provider';
import { describeApiError } from '@/lib/api-errors';
import { procedureQuestions } from '@/lib/procedure-questions';
import { useChatStore, type ChatEntry } from '@/store/chat-store';

const MAX_LENGTH = 2000;
const MAX_TEXTAREA_HEIGHT = 180;

function AssistantMessage({ message }: { readonly message: ChatEntry }): JSX.Element {
  const { dict } = useI18n();
  const errorText = message.error
    ? message.error.kind === 'unavailable' || message.error.kind === 'not-found'
      ? dict.chat.unavailable
      : describeApiError(message.error, dict)
    : null;

  const attachment =
    message.answerType === 'procedure' && message.procedure ? (
      <ProcedureCard procedure={message.procedure} storageId={message.traceId ?? message.id} />
    ) : message.answerType === 'orientation' ? (
      <OrientationCard procedure={message.procedure} />
    ) : null;

  return (
    <div className="flex gap-3 sm:gap-4">
      <OrbAvatar className="mt-0.5 h-9 w-9" />
      <div className="min-w-0 flex-1 pt-1.5">
        <p className="text-sm font-semibold text-sun">Sonah</p>
        <div className="mt-1.5">
          {errorText ? (
            <p
              role="alert"
              className="rounded-2xl border border-sun/30 bg-sun/[0.08] px-4 py-3 text-[16px] leading-relaxed text-paper/90"
            >
              {errorText}
            </p>
          ) : (
            <AnswerBody
              content={message.content}
              verdict={message.verdict}
              citations={message.citations}
              sources={message.sources}
              traceId={message.traceId}
              feedbackId={message.traceId ?? message.id}
              tone="dark"
              attachment={attachment}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatWindow(): JSX.Element {
  const { dict, locale } = useI18n();
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
      void send(question.slice(0, MAX_LENGTH), locale);
    }
  }, [searchParams, messages.length, send, locale]);

  useEffect(() => {
    if (messages.length === 0 && !isSending) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bottomRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' });
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
    if (draft.trim().length === 0 || isSending) return;
    void send(draft, locale);
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
      <div className="relative flex-1 overflow-y-auto overscroll-contain">
        <div className="container-page max-w-3xl py-8">
          {isEmpty ? (
            <div className="flex flex-col items-center pt-4 text-center sm:pt-8">
              <SonahOrb className="h-48 w-48 sm:h-72 sm:w-72" compact />
              <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                {dict.chat.emptyTitle}
              </h1>
              <p className="mt-3 max-w-lg text-paper/75">{dict.chat.emptyLead}</p>
              <ul className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2.5">
                {[
                  ...procedureQuestions(locale).map((item) => item.question),
                  ...dict.chat.suggestions,
                ].map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      className="rounded-full border border-white/20 bg-white/[0.04] px-4 py-2.5 text-[15px] text-paper/85 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-sun/60 hover:text-paper"
                      onClick={() => void send(suggestion, locale)}
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
              <h1 className="sr-only">{dict.chat.metaTitle}</h1>
              <ol className="space-y-8" aria-live="polite" aria-busy={isSending}>
                {messages.map((message) => (
                  <li key={message.id} className="animate-fade-up">
                    {message.role === 'user' ? (
                      <div className="flex justify-end">
                        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[22px] rounded-br-md bg-paper px-5 py-3 text-[16px] leading-relaxed text-ink">
                          <span className="sr-only">{dict.chat.you} : </span>
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
                    <span className="flex items-center gap-1.5" role="status">
                      <span className="sr-only">{dict.chat.thinking}</span>
                      <span className="typing-dot h-2 w-2 rounded-full bg-sun" aria-hidden="true" />
                      <span
                        className="typing-dot h-2 w-2 rounded-full bg-sun [animation-delay:0.15s]"
                        aria-hidden="true"
                      />
                      <span
                        className="typing-dot h-2 w-2 rounded-full bg-sun [animation-delay:0.3s]"
                        aria-hidden="true"
                      />
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
          <div className="flex items-end gap-2 rounded-[26px] border border-white/20 bg-white/[0.06] p-2 shadow-[0_20px_60px_-25px_rgba(240,180,41,0.4)] backdrop-blur-xl focus-within:border-sun focus-within:ring-2 focus-within:ring-sun/40">
            {!isEmpty && (
              <button
                type="button"
                onClick={reset}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-paper/75 hover:bg-white/10 hover:text-paper"
                aria-label={dict.chat.newConversation}
                title={dict.chat.newConversation}
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
              {dict.chat.inputLabel}
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={MAX_LENGTH}
              placeholder={dict.chat.placeholder}
              aria-describedby="chat-privacy"
              className="min-h-[44px] min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-6 text-paper placeholder:text-paper/60 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sun text-ink transition-colors hover:bg-[#d99610] disabled:bg-white/10 disabled:text-paper/50"
              disabled={isSending || draft.trim().length === 0}
              aria-label={dict.chat.send}
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
          <div className="space-y-1 py-3 text-center text-xs leading-relaxed text-paper/70">
            <p id="chat-privacy">
              <span aria-hidden="true">🔒 </span>
              {dict.chat.privacy}{' '}
              <Link
                href="/about#confidentialite"
                className="underline underline-offset-2 hover:text-sun"
              >
                {dict.chat.privacyLink}
              </Link>
            </p>
            <p className="hidden sm:block">{dict.chat.disclaimer}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
