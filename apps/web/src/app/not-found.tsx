import Link from 'next/link';
import { OrbAvatar } from '@/components/orb-avatar';

export default function NotFound(): JSX.Element {
  return (
    <main className="container-page flex flex-1 flex-col items-center py-24 text-center">
      <OrbAvatar className="h-32 w-32" />
      <p className="eyebrow mt-10">Erreur 404</p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tight">
        Je ne trouve pas cette page.
      </h1>
      <p className="mt-3 text-ink-soft">Elle n&apos;existe pas, ou elle a changé d&apos;adresse.</p>
      <Link href="/" className="btn-ink mt-8">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
