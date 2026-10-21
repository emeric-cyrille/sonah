import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORY_LABELS, PROCEDURES, type ProcedureCategory } from '@/lib/procedures';

export const metadata: Metadata = {
  title: 'Démarches',
  description: 'Les démarches administratives sur lesquelles Sonah peut vous accompagner.',
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
    <main className="pb-24">
      <header className="container-page pb-12 pt-14 md:pt-20">
        <p className="eyebrow">Démarches</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
          Choisissez un sujet, <em className="italic text-leaf">Sonah</em> s&apos;occupe du reste.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-soft">
          Votre situation n&apos;apparaît pas ici ? Ce n&apos;est pas grave : posez simplement votre
          question à Sonah.
        </p>
      </header>

      <div className="container-page space-y-16">
        {CATEGORY_ORDER.map((category) => {
          const items = PROCEDURES.filter((procedure) => procedure.category === category);
          if (items.length === 0) return null;

          return (
            <section
              key={category}
              className="grid gap-6 md:grid-cols-[14rem_1fr]"
              aria-labelledby={`cat-${category}`}
            >
              <h2 id={`cat-${category}`} className="font-display text-2xl italic text-clay md:pt-6">
                {CATEGORY_LABELS[category]}
              </h2>
              <ul className="border-t border-line">
                {items.map((procedure) => (
                  <li key={procedure.slug} className="border-b border-line">
                    <Link
                      href={`/chat?q=${encodeURIComponent(procedure.prompt)}`}
                      className="group grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8"
                    >
                      <div>
                        <h3 className="font-display text-2xl leading-snug transition-colors group-hover:text-leaf">
                          {procedure.title}
                        </h3>
                        <p className="mt-2 max-w-2xl text-ink-soft">{procedure.description}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                          {procedure.authority}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-ink transition-transform group-hover:translate-x-1">
                        Demander à Sonah →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
