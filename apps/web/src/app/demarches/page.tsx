import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORY_LABELS, PROCEDURES, type ProcedureCategory } from '@/lib/procedures';

export const metadata: Metadata = {
  title: 'Démarches',
  description: 'Les démarches administratives couvertes par SONAH, classées par thème.',
};

const CATEGORY_ORDER: readonly ProcedureCategory[] = [
  'entreprise',
  'identite',
  'etat-civil',
  'fiscalite',
  'social',
];

export default function ProceduresPage(): JSX.Element {
  return (
    <main className="container-page py-12 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Démarches</h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        Sélectionnez une démarche : l’assistant vous posera les bonnes questions et construira votre
        parcours personnalisé.
      </p>

      {CATEGORY_ORDER.map((category) => {
        const items = PROCEDURES.filter((procedure) => procedure.category === category);
        if (items.length === 0) return null;

        return (
          <section key={category} className="mt-12" aria-labelledby={`cat-${category}`}>
            <h2 id={`cat-${category}`} className="text-xl font-semibold">
              {CATEGORY_LABELS[category]}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {items.map((procedure) => (
                <li key={procedure.slug} className="card flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {procedure.authority}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold">{procedure.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink-700">{procedure.description}</p>
                  <Link
                    href={`/chat?q=${encodeURIComponent(procedure.prompt)}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
                  >
                    Démarrer avec l’assistant <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
