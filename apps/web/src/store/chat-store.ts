import { create } from 'zustand';
import { ApiUnavailableError, sendChatMessage, type Source } from '@/lib/api-client';

export interface ChatEntry {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly sources?: readonly Source[];
  readonly isError?: boolean;
}

interface ChatState {
  readonly messages: readonly ChatEntry[];
  readonly conversationId: string | undefined;
  readonly isSending: boolean;
  send: (content: string) => Promise<void>;
  reset: () => void;
}

const UNAVAILABLE_MESSAGE =
  "L'assistant est en cours de mise en service et ne peut pas encore répondre. " +
  'Consultez la liste des démarches en attendant, puis réessayez plus tard.';

const GENERIC_ERROR_MESSAGE = 'Une erreur est survenue. Merci de réessayer dans quelques instants.';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: undefined,
  isSending: false,

  send: async (content: string): Promise<void> => {
    const text = content.trim();
    if (text.length === 0 || get().isSending) return;

    set((state) => ({
      messages: [...state.messages, { id: createId(), role: 'user', content: text }],
      isSending: true,
    }));

    try {
      const response = await sendChatMessage(text, get().conversationId);
      set((state) => ({
        conversationId: response.conversationId,
        messages: [
          ...state.messages,
          { id: createId(), role: 'assistant', content: response.reply, sources: response.sources },
        ],
      }));
    } catch (error) {
      const message =
        error instanceof ApiUnavailableError ? UNAVAILABLE_MESSAGE : GENERIC_ERROR_MESSAGE;
      set((state) => ({
        messages: [
          ...state.messages,
          { id: createId(), role: 'assistant', content: message, isError: true },
        ],
      }));
    } finally {
      set({ isSending: false });
    }
  },

  reset: (): void => set({ messages: [], conversationId: undefined, isSending: false }),
}));
