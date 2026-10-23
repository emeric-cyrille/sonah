import type { ReactNode } from 'react';
import { PatternFill } from './patterns/cameroon-patterns';

/** En-tête sombre des pages intérieures : motif ndop, titre avec accent, bande toghu. */
export function PageHero({
  id,
  eyebrow,
  title,
  titleEm,
  lead,
  children,
}: {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly titleEm?: string;
  readonly lead?: string;
  readonly children?: ReactNode;
}): JSX.Element {
  return (
    <header className="grain relative -mt-[68px] overflow-hidden bg-night pt-[68px] text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <PatternFill name="ndop-line" id={`ndop-${id}`} ink="#f6f1e7" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] top-[-30%] h-[50vmin] w-[50vmin] rounded-full bg-sun/20 blur-[120px]"
      />
      <div className="container-page relative pb-14 pt-12 md:pb-20 md:pt-16">
        <p className="eyebrow text-sun">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl break-words font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
          {title}
          {titleEm && (
            <>
              {' '}
              <em className="italic text-sun">{titleEm}</em>
            </>
          )}
        </h1>
        {lead && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">{lead}</p>}
        {children}
      </div>
      <PatternFill name="toghu" id={`toghu-${id}`} className="relative h-10 w-full" />
    </header>
  );
}
