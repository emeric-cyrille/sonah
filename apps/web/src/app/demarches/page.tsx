import type { Metadata } from 'next';
import Link from 'next/link';
import { ScrollMotion } from '@/components/motion/scroll-motion';
import { PatternFill } from '@/components/patterns/cameroon-patterns';
import { getServerDictionary } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { dict } = getServerDictionary();
  return { title: dict.topics.metaTitle, description: dict.topics.metaDescription };
}

export default function TopicsPage(): JSX.Element {
  const { dict } = getServerDictionary();
  const t = dict.topics;

  return (
    <ScrollMotion>
      <main className="pb-24">
        <header className="grain relative -mt-[68px] overflow-hidden bg-night pt-[68px] text-paper">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <PatternFill name="ndop-line" id="ndop-demarches" ink="#f6f1e7" />
          </div>
          <div className="container-page relative pb-16 pt-14 md:pb-24 md:pt-20">
            <p className="eyebrow text-sun">{t.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
              {t.title} <em className="italic text-sun">{t.titleEm}</em>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-paper/80">{t.lead}</p>
          </div>
          <PatternFill name="toghu" id="toghu-demarches" className="relative h-10 w-full" />
        </header>

        {/* ─── Sujets couverts par le corpus ───────────────────── */}
        <div className="container-page mt-16 space-y-16">
          <p className="eyebrow">{t.availableEyebrow}</p>
          {t.available.map((topic) => (
            <section
              data-reveal
              key={topic.id}
              className="grid gap-6 md:grid-cols-[16rem_1fr]"
              aria-labelledby={`topic-${topic.id}`}
            >
              <div className="md:pt-6">
                <h2 id={`topic-${topic.id}`} className="font-display text-3xl italic text-clay">
                  {topic.title}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">{topic.source}</p>
              </div>
              <ul className="border-t border-line">
                {topic.questions.map((question) => (
                  <li key={question} className="border-b border-line">
                    <Link
                      href={`/chat?q=${encodeURIComponent(question)}`}
                      className="group grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8"
                    >
                      <span className="font-display text-xl leading-snug transition-colors group-hover:text-leaf sm:text-2xl">
                        {question}
                      </span>
                      <span className="text-sm font-semibold text-ink transition-transform group-hover:translate-x-1">
                        {t.ask}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* ─── Bientôt : clairement non couvert ────────────────── */}
        <section className="container-page mt-24" aria-labelledby="soon-title" data-reveal>
          <div className="rounded-[32px] border border-dashed border-ink/25 bg-paper-deep/60 p-6 sm:p-10">
            <p className="eyebrow">{t.soonEyebrow}</p>
            <h2 id="soon-title" className="mt-3 font-display text-3xl font-medium sm:text-4xl">
              {t.soonTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-ink-soft">{t.soonLead}</p>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {t.soon.map((item) => (
                <li key={item.title} className="rounded-2xl border border-line bg-paper-soft p-5">
                  <span className="inline-flex rounded-full border border-ink/20 px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
                    {t.soonBadge}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </ScrollMotion>
  );
}
