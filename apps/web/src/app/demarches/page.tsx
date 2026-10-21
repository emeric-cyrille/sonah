import type { Metadata } from 'next';
import Link from 'next/link';
import { ScrollMotion } from '@/components/motion/scroll-motion';
import { PatternFill } from '@/components/patterns/cameroon-patterns';
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
    <ScrollMotion>
      <main className="pb-24">
        <header className="grain relative -mt-[68px] overflow-hidden bg-night pt-[68px] text-paper">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <PatternFill name="ndop-line" id="ndop-demarches" ink="#f6f1e7" />
          </div>
          <div className="container-page relative pb-16 pt-14 md:pb-24 md:pt-20">
            <p className="eyebrow text-sun/90">Démarches</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
              Choisissez un sujet, <em className="italic text-sun">Sonah</em> s&apos;occupe du
              reste.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-paper/70">
              Votre situation n&apos;apparaît pas ici ? Ce n&apos;est pas grave : posez simplement
              votre question à Sonah.
            </p>
          </div>
          <PatternFill name="toghu" id="toghu-demarches" className="relative h-10 w-full" />
        </header>

        <div className="container-page mt-16 space-y-16">
          {CATEGORY_ORDER.map((category) => {
            const items = PROCEDURES.filter((procedure) => procedure.category === category);
            if (items.length === 0) return null;

            return (
              <section
                data-reveal
                key={category}
                className="grid gap-6 md:grid-cols-[14rem_1fr]"
                aria-labelledby={`cat-${category}`}
              >
                <h2
                  id={`cat-${category}`}
                  className="font-display text-2xl italic text-clay md:pt-6"
                >
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
    </ScrollMotion>
  );
}
