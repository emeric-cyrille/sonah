import Link from 'next/link';
import { AskBox } from '@/components/ask-box';
import { ScrollMotion } from '@/components/motion/scroll-motion';
import { TiltCard } from '@/components/motion/tilt-card';
import { OrbAvatar } from '@/components/orb-avatar';
import { PATTERN_SWATCHES, PatternFill } from '@/components/patterns/cameroon-patterns';
import { SonahOrb } from '@/components/three/sonah-orb';

const FREQUENT_QUESTIONS = [
  { topic: 'Entreprise', question: 'Je veux ouvrir un restaurant à Yaoundé. Par où je commence ?' },
  { topic: 'Identité', question: "J'ai perdu ma carte d'identité, je fais comment ?" },
  { topic: 'État civil', question: "Mon enfant n'a pas d'acte de naissance. Que faire ?" },
  { topic: 'Travail', question: 'Mon employeur peut-il me licencier pendant un arrêt maladie ?' },
  { topic: 'Impôts', question: "Comment obtenir mon numéro d'identifiant unique ?" },
  { topic: 'Social', question: 'Comment déclarer mes employés à la CNPS ?' },
] as const;

const STEPS = [
  {
    title: 'Vous racontez',
    text: 'Avec vos mots, en quelques phrases. Pas besoin de connaître le nom de la procédure ni le bon ministère.',
  },
  {
    title: 'Sonah précise',
    text: 'Si un détail compte — votre ville, votre statut, une pièce déjà en main — Sonah vous le demande.',
  },
  {
    title: 'Vous repartez avec un plan',
    text: 'Les étapes dans le bon ordre, les pièces à préparer, où aller, et les textes officiels sur lesquels tout repose.',
  },
] as const;

const PROMISES = [
  {
    title: 'Gratuit, vraiment.',
    text: "Rien à payer, ni à Sonah ni à un intermédiaire. L'information administrative appartient à tout le monde.",
    pattern: 'perles',
  },
  {
    title: 'Un seul interlocuteur.',
    text: 'Entreprise, état civil, impôts, droit du travail : la même conversation, du début à la fin.',
    pattern: 'ndop',
  },
  {
    title: 'Des sources citées.',
    text: 'Chaque réponse renvoie aux textes officiels. Vous pouvez vérifier, et le montrer au guichet.',
    pattern: 'toghu',
  },
] as const;

const HEADLINE: ReadonlyArray<{ word: string; accent?: boolean; breakAfter?: boolean }> = [
  { word: 'Bonjour,', breakAfter: true },
  { word: 'je' },
  { word: 'suis' },
  { word: 'Sonah.', accent: true },
];

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
              <p className="eyebrow animate-fade-up text-sun/90">
                Assistant administratif · Cameroun
              </p>
              <h1 className="mt-5 font-display text-[52px] font-medium leading-[0.98] tracking-[-0.025em] sm:text-7xl xl:text-[92px]">
                {HEADLINE.map((item, index) => (
                  <span key={item.word}>
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
                className="animate-fade-up mt-7 max-w-[34rem] text-lg leading-relaxed text-paper/70"
                style={{ animationDelay: '0.55s' }}
              >
                Créer une entreprise, refaire sa carte d&apos;identité, déclarer une naissance,
                connaître ses droits au travail… Posez votre question comme à quelqu&apos;un de
                confiance : je vous dis quoi préparer, où aller, et dans quel ordre.
              </p>
              <div className="animate-fade-up mt-9 max-w-xl" style={{ animationDelay: '0.7s' }}>
                <AskBox placeholder="Ex. : j'ai perdu ma CNI, je fais comment ?" />
                <p className="mt-4 pl-5 text-sm text-paper/45">
                  Gratuit · Sans inscription · En français
                </p>
              </div>
            </div>

            <div className="relative order-1 mx-auto aspect-square w-full max-w-[460px] lg:order-2 lg:max-w-none">
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

        {/* ─── Questions fréquentes ────────────────────────────── */}
        <section
          id="questions"
          className="scroll-mt-20 py-20 md:py-32"
          aria-labelledby="questions-title"
        >
          <div className="container-page grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal className="md:sticky md:top-28 md:self-start">
              <p className="eyebrow">On me demande souvent</p>
              <h2
                id="questions-title"
                className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl"
              >
                Une question, <em className="italic text-clay">n&apos;importe laquelle</em>.
              </h2>
              <p className="mt-5 max-w-sm text-ink-soft">
                Touchez une question pour démarrer la conversation, ou écrivez la vôtre.
              </p>
              <Link href="/demarches" className="link-underline mt-6 inline-block font-semibold">
                Voir toutes les démarches
              </Link>
            </div>

            <ul data-reveal-stagger className="border-t border-line">
              {FREQUENT_QUESTIONS.map((item) => (
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
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted sm:w-24 sm:shrink-0">
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

        {/* ─── Motifs du continent ─────────────────────────────── */}
        <section
          id="motifs"
          className="overflow-hidden bg-earth py-16 text-paper md:py-24"
          aria-labelledby="motifs-title"
        >
          <div className="container-page" data-reveal>
            <p className="eyebrow text-sun/80">Patrimoine camerounais</p>
            <h2
              id="motifs-title"
              className="mt-4 max-w-2xl font-display text-4xl font-medium leading-tight sm:text-5xl"
            >
              Sonah porte les motifs du Cameroun.
            </h2>
          </div>
          <div className="marquee mt-12">
            <ul className="marquee-track gap-5 pl-5">
              {[
                ...PATTERN_SWATCHES,
                ...PATTERN_SWATCHES,
                ...PATTERN_SWATCHES,
                ...PATTERN_SWATCHES,
              ].map((swatch, index) => (
                <li
                  key={`${swatch.name}-${index}`}
                  className="relative h-48 w-72 shrink-0 overflow-hidden rounded-3xl ring-1 ring-white/10 sm:h-56 sm:w-80"
                  aria-hidden={index >= PATTERN_SWATCHES.length}
                >
                  <PatternFill name={swatch.name} id={`swatch-${swatch.name}-${index}`} />
                  <div className="absolute bottom-4 left-4 rounded-2xl bg-black/75 px-4 py-2.5 backdrop-blur-md">
                    <p className="font-display text-xl leading-tight">{swatch.label}</p>
                    <p className="text-xs text-paper/70">{swatch.origin}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── Comment ça marche ───────────────────────────────── */}
        <section id="comment" className="scroll-mt-20 py-20 md:py-32" aria-labelledby="how-title">
          <div className="container-page">
            <div data-reveal>
              <p className="eyebrow">Comment ça marche</p>
              <h2
                id="how-title"
                className="mt-4 max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl"
              >
                Une conversation, pas un formulaire.
              </h2>
            </div>
            <ol data-reveal-stagger className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative border-t-2 border-ink pt-6">
                  <span className="font-display text-7xl font-light italic leading-none text-sun">
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
              Trois promesses, <em className="italic text-sun">tenues</em>.
            </h2>
            <div data-reveal-stagger className="mt-14 grid gap-6 md:grid-cols-3">
              {PROMISES.map((promise, index) => (
                <TiltCard
                  key={promise.title}
                  className="h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur"
                >
                  <div className="h-24 opacity-90 [transform:translateZ(30px)]">
                    <PatternFill name={promise.pattern} id={`promise-${index}`} />
                  </div>
                  <div className="p-7 [transform:translateZ(40px)]">
                    <p className="font-display text-3xl font-medium italic text-sun">
                      {promise.title}
                    </p>
                    <p className="mt-4 leading-relaxed text-paper/70">{promise.text}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Appel final ─────────────────────────────────────── */}
        <section className="py-20 md:py-28">
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
                  Une démarche en tête&nbsp;?
                </h2>
                <p className="mt-4 max-w-lg text-lg text-paper/70">
                  Sonah est là, à toute heure. Commencez par me dire ce que vous voulez faire.
                </p>
                <Link href="/chat" className="btn-sun mt-8">
                  Discuter avec Sonah <Arrow className="h-4 w-4" />
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
