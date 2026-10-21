import Link from 'next/link';
import { AskBox } from '@/components/ask-box';
import { NdopBand } from '@/components/ndop-band';
import { SonahBot } from '@/components/sonah-bot';

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
  },
  {
    title: 'Un seul interlocuteur.',
    text: 'Entreprise, état civil, impôts, droit du travail : la même conversation, du début à la fin.',
  },
  {
    title: 'Des sources citées.',
    text: 'Chaque réponse renvoie aux textes officiels. Vous pouvez vérifier, et le montrer au guichet.',
  },
] as const;

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
    <main>
      {/* ─── Accueil ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-sun-soft/50 blur-3xl"
        />
        <div className="container-page relative grid items-center gap-10 pb-16 pt-12 md:grid-cols-[1.15fr_0.85fr] md:pb-24 md:pt-20">
          <div className="animate-fade-up">
            <p className="eyebrow">Assistant administratif · Cameroun</p>
            <h1 className="mt-5 font-display text-[44px] font-medium leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-[76px]">
              Bonjour,
              <br />
              je suis <em className="font-normal italic text-leaf">Sonah</em>.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-soft">
              Créer une entreprise, refaire sa carte d&apos;identité, déclarer une naissance,
              connaître ses droits au travail… Posez votre question comme à quelqu&apos;un de
              confiance : je vous dis quoi préparer, où aller, et dans quel ordre.
            </p>
            <div className="mt-9 max-w-xl">
              <AskBox placeholder="Ex. : j'ai perdu ma CNI, je fais comment ?" />
              <p className="mt-4 pl-5 text-sm text-ink-muted">
                Gratuit · Sans inscription · En français
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[290px] sm:max-w-[360px] md:max-w-none">
            <div className="bubble-pop absolute left-0 top-6 z-10 rounded-[22px] rounded-br-md border-2 border-ink bg-paper-soft px-5 py-3 font-display text-2xl italic shadow-[4px_4px_0_#181b34] sm:left-2 md:-left-6">
              Coucou&nbsp;!
            </div>
            <SonahBot className="relative w-full" />
          </div>
        </div>
      </section>

      {/* ─── Questions fréquentes ────────────────────────────── */}
      <section
        className="border-y border-line bg-paper-soft py-20 md:py-28"
        aria-labelledby="questions-title"
      >
        <div className="container-page grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <p className="eyebrow">On me demande souvent</p>
            <h2
              id="questions-title"
              className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl"
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

          <ul className="border-t border-line">
            {FREQUENT_QUESTIONS.map((item) => (
              <li key={item.question} className="border-b border-line">
                <Link
                  href={`/chat?q=${encodeURIComponent(item.question)}`}
                  className="group flex items-center gap-6 py-6 transition-colors"
                >
                  <span className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-6">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted sm:w-24 sm:shrink-0">
                      {item.topic}
                    </span>
                    <span className="flex-1 font-display text-xl leading-snug transition-colors group-hover:text-leaf sm:text-2xl">
                      {item.question}
                    </span>
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300 group-hover:translate-x-1 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                    <Arrow className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Comment ça marche ───────────────────────────────── */}
      <section id="comment" className="scroll-mt-20 py-20 md:py-28" aria-labelledby="how-title">
        <div className="container-page">
          <p className="eyebrow">Comment ça marche</p>
          <h2
            id="how-title"
            className="mt-4 max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl"
          >
            Une conversation, pas un formulaire.
          </h2>
          <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t-2 border-ink pt-6">
                <span className="font-display text-6xl font-light italic leading-none text-sun">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Engagements ─────────────────────────────────────── */}
      <section className="bg-indigo-deep text-paper" aria-labelledby="promises-title">
        <NdopBand id="ndop-promises" className="h-7" />
        <div className="container-page py-20 md:py-28">
          <h2 id="promises-title" className="sr-only">
            Nos engagements
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            {PROMISES.map((promise) => (
              <div key={promise.title}>
                <p className="font-display text-3xl font-medium italic text-sun">{promise.title}</p>
                <p className="mt-4 leading-relaxed text-paper/75">{promise.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Appel final ─────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="container-page">
          <div className="relative grid items-center gap-8 overflow-hidden rounded-[36px] border-2 border-ink bg-sun px-6 py-12 shadow-[8px_8px_0_#181b34] sm:px-12 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
                Une démarche en tête&nbsp;?
              </h2>
              <p className="mt-4 max-w-lg text-lg text-ink-soft">
                Sonah est là, à toute heure. Commencez par me dire ce que vous voulez faire.
              </p>
              <Link href="/chat" className="btn-ink mt-8">
                Discuter avec Sonah <Arrow className="h-4 w-4" />
              </Link>
            </div>
            <SonahBot className="mx-auto w-44 md:w-52" title="Sonah vous attend" />
          </div>
        </div>
      </section>
    </main>
  );
}
