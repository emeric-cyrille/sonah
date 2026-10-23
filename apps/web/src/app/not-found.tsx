import Link from 'next/link';
import { OrbAvatar } from '@/components/orb-avatar';
import { getServerDictionary } from '@/i18n/server';

export default function NotFound(): JSX.Element {
  const { dict } = getServerDictionary();
  return (
    <main className="container-page flex flex-1 flex-col items-center py-24 text-center">
      <OrbAvatar className="h-32 w-32" />
      <p className="eyebrow mt-10">{dict.notFound.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tight">
        {dict.notFound.title}
      </h1>
      <p className="mt-3 text-ink-soft">{dict.notFound.text}</p>
      <Link href="/" className="btn-ink mt-8">
        {dict.notFound.back}
      </Link>
    </main>
  );
}
