import type { Metadata } from 'next';
import { RightsSearch } from '@/components/droits/rights-search';

export const metadata: Metadata = {
  title: 'Mes droits',
  description: 'Recherchez vos droits dans la Constitution et le Code du travail du Cameroun.',
};

export default function RightsPage(): JSX.Element {
  return (
    <main className="container-page max-w-3xl py-12 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mes droits</h1>
      <p className="mt-3 text-ink-700">
        Posez votre question en langage courant : SONAH retrouve les articles pertinents de la
        Constitution et du Code du travail.
      </p>
      <div className="mt-8">
        <RightsSearch />
      </div>
    </main>
  );
}
