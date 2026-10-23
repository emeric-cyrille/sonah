import { create } from 'zustand';
import type { Locale } from '@/i18n/config';
import {
  sendChatMessage,
  type AnswerType,
  type Citation,
  type Procedure,
  type Source,
} from '@/lib/api-client';
import { toApiErrorKind, type ApiErrorKind } from '@/lib/api-errors';

export interface ChatEntry {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly verdict?: string;
  readonly citations?: readonly Citation[];
  readonly sources?: readonly Source[];
  readonly traceId?: string;
  readonly answerType?: AnswerType;
  /** Fiche démarche structurée, si le serveur en renvoie une. */
  readonly procedure?: Procedure;
  /** Erreur traduite à l'affichage, pour suivre la langue choisie. */
  readonly error?: ApiErrorKind;
}

interface ChatState {
  readonly messages: readonly ChatEntry[];
  readonly conversationId: string | undefined;
  readonly isSending: boolean;
  send: (content: string, language: Locale) => Promise<void>;
  reset: () => void;
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: undefined,
  isSending: false,

  send: async (content: string, language: Locale): Promise<void> => {
    const text = content.trim();
    if (text.length === 0 || get().isSending) return;

    set((state) => ({
      messages: [...state.messages, { id: createId(), role: 'user', content: text }],
      isSending: true,
    }));

    try {
      const response = await sendChatMessage({
        message: text,
        conversationId: get().conversationId,
        language,
      });
      set((state) => ({
        conversationId: response.conversationId,
        messages: [
          ...state.messages,
          {
            id: createId(),
            role: 'assistant',
            content: response.reply,
            verdict: response.verdict,
            citations: response.citations,
            sources: response.sources,
            traceId: response.traceId,
            answerType: response.answerType,
            procedure: response.procedure,
          },
        ],
      }));
    } catch (error) {
      set((state) => ({
        messages: [
          ...state.messages,
          { id: createId(), role: 'assistant', content: '', error: toApiErrorKind(error) },
        ],
      }));
    } finally {
      set({ isSending: false });
    }
  },

  reset: (): void => set({ messages: [], conversationId: undefined, isSending: false }),
}));
