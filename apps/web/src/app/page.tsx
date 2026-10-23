import Link from 'next/link';
import { AskBox } from '@/components/ask-box';
import { ScrollMotion } from '@/components/motion/scroll-motion';
import { TiltCard } from '@/components/motion/tilt-card';
import { OrbAvatar } from '@/components/orb-avatar';
import { PatternMarquee } from '@/components/pattern-marquee';
import { PatternFill, type PatternName } from '@/components/patterns/cameroon-patterns';
import { SonahOrb } from '@/components/three/sonah-orb';
import { getServerDictionary } from '@/i18n/server';

// Motif associé à chaque engagement (même ordre que le dictionnaire)
const PROMISE_PATTERNS: readonly PatternName[] = ['perles', 'ndop', 'toghu'];
const TRANSPARENCY_PATTERNS: readonly PatternName[] = ['teleuk', 'ndop', 'perles'];

function Arrow({ className = 'h-5 w-5' }: { className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage(): JSX.Element {
  const { dict } = getServerDictionary();
  const t = dict.home;
  const headline: ReadonlyArray<{ word: string; accent?: boolean; breakAfter?: boolean }> = [
    { word: t.headline.first, breakAfter: true },
    ...t.headline.words.map((word) => ({ word })),
    { word: t.headline.accent, accent: true },
  ];

  return (
    <ScrollMotion>
      <main>
        {/* ─── Accueil : Sonah en 3D ──────────────────────────── */}
        <section className="grain relative -mt-[68px] overflow-hidden bg-night pt-[68px] text-paper">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <PatternFill name="ndop-line" id="ndop-hero" ink="#f6f1e7" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-10%] top-[10%] h-[70vmin] w-[70vmin] rounded-full bg-sun/25 blur-[120px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[50vmin] w-[50vmin] rounded-full bg-flag-green/30 blur-[120px]"
          />

          <div className="container-page relative grid min-h-[calc(100svh-68px)] items-center gap-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-0">
            <div className="relative z-10 order-2 lg:order-1">
              <p className="eyebrow animate-fade-up text-sun">{t.eyebrow}</p>
              <h1 className="mt-5 font-display text-[52px] font-medium leading-[0.98] tracking-[-0.025em] sm:text-7xl xl:text-[92px]">
                {headline.map((item, index) => (
                  <span key={`${item.word}-${index}`}>
                    <span className="word-mask">
                      <span
                        className={`word ${item.accent ? 'font-normal italic text-sun' : ''}`}
                        style={{ animationDelay: `${0.15 + index * 0.09}s` }}
                      >
                        {item.word}
                      </span>
                    </span>
                    {item.breakAfter ? <br /> : ' '}
                  </span>
                ))}
              </h1>
              <p
                className="animate-fade-up mt-7 max-w-[34rem] text-lg leading-relaxed text-paper/80"
                style={{ animationDelay: '0.55s' }}
              >
                {t.intro}
              </p>
              <div className="animate-fade-up mt-9 max-w-xl" style={{ animationDelay: '0.7s' }}>
                <AskBox />
                <p className="mt-4 pl-5 text-sm text-paper/70">{t.askNote}</p>
              </div>
            </div>

            <div className="relative order-1 mx-auto aspect-square w-full max-w-[300px] sm:max-w-[460px] lg:order-2 lg:max-w-none">
              <SonahOrb className="absolute inset-[-14%] h-[128%] w-[128%]" />
            </div>
          </div>
        </section>

        {/* ─── Bande toghu ─────────────────────────────────────── */}
        <div className="overflow-hidden bg-velvet" aria-hidden="true">
          <div data-parallax="260" className="w-[220%]">
            <PatternFill name="toghu" id="toghu-divider" className="h-10 w-full" />
          </div>
        </div>

        {/* ─── Questions que le corpus couvre ──────────────────── */}
        <section
          id="questions"
          className="scroll-mt-20 py-20 md:py-32"
          aria-labelledby="questions-title"
        >
          <div className="container-page grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal className="md:sticky md:top-28 md:self-start">
              <p className="eyebrow">{t.faqEyebrow}</p>
              <h2
                id="questions-title"
                className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl"
              >
                {t.faqTitle} <em className="italic text-clay">{t.faqTitleEm}</em>.
              </h2>
              <p className="mt-5 max-w-sm text-ink-soft">{t.faqLead}</p>
              <Link href="/demarches" className="link-underline mt-6 inline-block font-semibold">
                {t.faqAll}
              </Link>
            </div>

            <ul data-reveal-stagger className="border-t border-line">
              {t.questions.map((item) => (
                <li key={item.question} className="border-b border-line">
                  <Link
                    href={`/chat?q=${encodeURIComponent(item.question)}`}
                    className="group relative flex items-center gap-6 overflow-hidden py-6"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 origin-left scale-x-0 bg-paper-deep transition-transform duration-500 ease-out group-hover:scale-x-100"
                    />
                    <span className="flex flex-1 flex-col gap-1.5 transition-transform duration-500 group-hover:translate-x-3 sm:flex-row sm:items-center sm:gap-6">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted sm:w-28 sm:shrink-0">
                        {item.topic}
                      </span>
                      <span className="flex-1 font-display text-xl leading-snug sm:text-2xl">
                        {item.question}
                      </span>
                    </span>
                    <span className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                      <Arrow className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── Motifs du Cameroun ──────────────────────────────── */}
        <section
          id="motifs"
          className="overflow-hidden bg-earth py-16 text-paper md:py-24"
          aria-labelledby="motifs-title"
        >
          <div className="container-page" data-reveal>
            <p className="eyebrow text-sun-soft">{t.motifsEyebrow}</p>
            <h2
              id="motifs-title"
              className="mt-4 max-w-2xl font-display text-4xl font-medium leading-tight sm:text-5xl"
            >
              {t.motifsTitle}
            </h2>
          </div>
          <PatternMarquee />
        </section>

        {/* ─── Comment ça marche ───────────────────────────────── */}
        <section id="comment" className="scroll-mt-20 py-20 md:py-32" aria-labelledby="how-title">
          <div className="container-page">
            <div data-reveal>
              <p className="eyebrow">{t.howEyebrow}</p>
              <h2
                id="how-title"
                className="mt-4 max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl"
              >
                {t.howTitle}
              </h2>
            </div>
            <ol data-reveal-stagger className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
              {t.steps.map((step, index) => (
                <li key={step.title} className="relative border-t-2 border-ink pt-6">
                  <span
                    className="font-display text-7xl font-light italic leading-none text-[#b07a0c]"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-soft">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── Engagements (velours toghu) ─────────────────────── */}
        <section id="promesses" className="bg-velvet text-paper" aria-labelledby="promises-title">
          <PatternFill name="toghu" id="toghu-promises-top" className="h-10 w-full" />
          <div className="container-page py-20 md:py-28">
            <h2
              id="promises-title"
              data-reveal
              className="max-w-2xl font-display text-4xl font-medium sm:text-5xl"
            >
              {t.promisesTitle} <em className="italic text-sun">{t.promisesTitleEm}</em>.
            </h2>
            <div data-reveal-stagger className="mt-14 grid gap-6 md:grid-cols-3">
              {t.promises.map((promise, index) => (
                <TiltCard
                  key={promise.title}
                  className="h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur"
                >
                  <div className="h-24 opacity-90 [transform:translateZ(30px)]">
                    <PatternFill name={PROMISE_PATTERNS[index] ?? 'ndop'} id={`promise-${index}`} />
                  </div>
                  <div className="p-7 [transform:translateZ(40px)]">
                    <p className="font-display text-3xl font-medium italic text-sun">
                      {promise.title}
                    </p>
                    <p className="mt-4 leading-relaxed text-paper/80">{promise.text}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Transparence : laboratoire, audit, architecture ─── */}
        <section className="py-20 md:py-28" aria-labelledby="transparency-title">
          <div className="container-page">
            <div data-reveal>
              <p className="eyebrow">{t.transparencyEyebrow}</p>
              <h2
                id="transparency-title"
                className="mt-4 max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl"
              >
                {t.transparencyTitle}
              </h2>
            </div>
            <ul data-reveal-stagger className="mt-12 grid gap-5 md:grid-cols-3">
              {t.transparencyCards.map((card, index) => (
                <li key={card.href}>
                  <Link
                    href={card.href}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-paper-soft transition-shadow hover:shadow-[0_20px_50px_-30px_rgba(24,27,52,0.5)]"
                  >
                    <div className="h-16 overflow-hidden" aria-hidden="true">
                      <PatternFill
                        name={TRANSPARENCY_PATTERNS[index] ?? 'ndop'}
                        id={`transparency-${index}`}
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-2xl">{card.title}</h3>
                      <p className="mt-3 flex-1 leading-relaxed text-ink-soft">{card.text}</p>
                      <span className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                        <Arrow className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── Appel final ─────────────────────────────────────── */}
        <section className="pb-20 md:pb-28">
          <div className="container-page">
            <div
              data-reveal
              className="grain relative grid items-center gap-10 overflow-hidden rounded-[40px] bg-night px-6 py-14 text-paper sm:px-14 md:grid-cols-[1fr_auto]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
              >
                <PatternFill name="ndop-line" id="ndop-cta" ink="#f6f1e7" />
              </div>
              <div className="relative">
                <h2 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
                  {t.ctaTitle}
                </h2>
                <p className="mt-4 max-w-lg text-lg text-paper/80">{t.ctaText}</p>
                <Link href="/chat" className="btn-sun mt-8">
                  {t.ctaButton} <Arrow className="h-4 w-4" />
                </Link>
              </div>
              <OrbAvatar className="relative mx-auto h-40 w-40 md:h-52 md:w-52" />
            </div>
          </div>
        </section>
      </main>
    </ScrollMotion>
  );
}
