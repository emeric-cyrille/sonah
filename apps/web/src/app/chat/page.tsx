import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChatWindow } from '@/components/chat/chat-window';
import { getServerDictionary } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { dict } = getServerDictionary();
  return { title: dict.chat.metaTitle, description: dict.chat.metaDescription };
}

export default function ChatPage(): JSX.Element {
  return (
    <main>
      <Suspense>
        <ChatWindow />
      </Suspense>
    </main>
  );
}
