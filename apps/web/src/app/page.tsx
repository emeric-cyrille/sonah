import {
  ArrowRight,
  Building2,
  Clock,
  FileSearch,
  MessageSquareText,
  Network,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { PROCEDURES } from '@/lib/procedures';

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Décrivez votre projet',
    text: "En langage courant : « je veux ouvrir un restaurant à Yaoundé », « j'ai perdu ma CNI »…",
  },
  {
    icon: Network,
    title: 'Les agents se coordonnent',
    text: 'Chaque agent spécialisé connaît une administration et détecte les dépendances entre démarches.',
  },
  {
    icon: FileSearch,
    title: 'Recevez un plan clair',
    text: "Étapes ordonnées, pièces à préparer, interlocuteurs et sources officielles à l'appui.",
  },
] as const;

const TARGETS = [
  { value: '-77 %', label: 'Délai de création d’entreprise' },
  { value: '-70 %', label: 'Taux d’abandon des démarches' },
  { value: '0 FCFA', label: 'Payé à des intermédiaires' },
] as const;

export default function HomePage(): JSX.Element {
  const featured = PROCEDURES.slice(0, 6);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 shadow-sm ring-1 ring-brand-100">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Service public numérique · Cameroun
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-5xl">
              Vos démarches administratives, <span className="text-brand-600">sans détour.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-700">
              SONAH vous indique quoi faire, où aller et dans quel ordre — pour créer votre
              entreprise, obtenir vos papiers ou connaître vos droits.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/chat" className="btn-primary">
                Poser ma question
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/demarches" className="btn-secondary">
                Parcourir les démarches
              </Link>
            </div>
          </div>

          <div className="card relative mx-auto w-full max-w-md">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-medium text-ink-500">
              <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
              Assistant SONAH
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-white">
                Je veux ouvrir un restaurant à Yaoundé.
              </p>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-ink-900">
                <p className="font-medium">Voici votre parcours en 3 étapes :</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-700">
                  <li>Créer l’entreprise au CFCE</li>
                  <li>Obtenir les autorisations sanitaires</li>
                  <li>Déclarer l’activité auprès de la commune</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container-page py-16 md:py-20" aria-labelledby="how-title">
        <h2 id="how-title" className="text-3xl font-bold tracking-tight">
          Comment ça marche
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-ink-500">Étape {index + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-ink-700">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Démarches */}
      <section className="bg-slate-50 py-16 md:py-20" aria-labelledby="procedures-title">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="procedures-title" className="text-3xl font-bold tracking-tight">
                Démarches fréquentes
              </h2>
              <p className="mt-2 text-ink-700">
                Choisissez une démarche pour démarrer avec l’assistant.
              </p>
            </div>
            <Link
              href="/demarches"
              className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
            >
              Toutes les démarches <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((procedure) => (
              <li key={procedure.slug}>
                <Link
                  href={`/chat?q=${encodeURIComponent(procedure.prompt)}`}
                  className="card group flex h-full flex-col transition-shadow hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {procedure.authority}
                  </span>
                  <span className="mt-2 text-lg font-semibold group-hover:text-brand-700">
                    {procedure.title}
                  </span>
                  <span className="mt-2 text-sm text-ink-700">{procedure.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Piliers */}
      <section className="container-page grid gap-6 py-16 md:grid-cols-3 md:py-20">
        <div className="card">
          <Building2 className="h-6 w-6 text-brand-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold">GPS administratif</h3>
          <p className="mt-2 text-ink-700">
            Un parcours ordonné qui tient compte des dépendances entre ministères, communes et
            organismes.
          </p>
        </div>
        <div className="card">
          <Scale className="h-6 w-6 text-brand-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold">Vos droits expliqués</h3>
          <p className="mt-2 text-ink-700">
            Constitution et Code du travail en langage clair, avec la référence exacte de chaque
            article.
          </p>
        </div>
        <div className="card">
          <Clock className="h-6 w-6 text-brand-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold">Veille réglementaire</h3>
          <p className="mt-2 text-ink-700">
            Suivi des textes officiels pour signaler les nouvelles lois et les changements de
            procédure.
          </p>
        </div>
      </section>

      {/* Objectifs */}
      <section className="bg-brand-900 py-16 text-white md:py-20" aria-labelledby="targets-title">
        <div className="container-page">
          <h2 id="targets-title" className="text-3xl font-bold tracking-tight">
            Nos objectifs
          </h2>
          <dl className="mt-10 grid gap-8 sm:grid-cols-3">
            {TARGETS.map((target) => (
              <div key={target.label}>
                <dt className="text-brand-100">{target.label}</dt>
                <dd className="mt-1 text-4xl font-extrabold text-sun-400">{target.value}</dd>
              </div>
            ))}
          </dl>
          <Link href="/chat" className="btn-primary mt-12 bg-sun-400 text-ink-900 hover:bg-sun-500">
            Essayer l’assistant
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
