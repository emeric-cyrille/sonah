import Link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <main className="container-page py-24 text-center">
      <p className="text-sm font-semibold text-brand-700">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page introuvable</h1>
      <p className="mt-3 text-ink-700">Cette page n’existe pas ou a été déplacée.</p>
      <Link href="/" className="btn-primary mt-8">
        Retour à l’accueil
      </Link>
    </main>
  );
}
