import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChatWindow } from '@/components/chat/chat-window';

export const metadata: Metadata = {
  title: 'Assistant',
  description:
    "Décrivez votre situation, l'assistant SONAH construit votre parcours administratif.",
};

export default function ChatPage(): JSX.Element {
  return (
    <main>
      <Suspense>
        <ChatWindow />
      </Suspense>
    </main>
  );
}
