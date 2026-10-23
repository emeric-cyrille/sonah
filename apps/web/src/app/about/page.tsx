import type { Metadata } from 'next';
import Link from 'next/link';
import { Y3172Diagram } from '@/components/about/y3172-diagram';
import { PageHero } from '@/components/page-hero';
import { getServerDictionary } from '@/i18n/server';

const GITHUB_URL = 'https://github.com/emeric-cyrille/sonah';

export function generateMetadata(): Metadata {
  const { dict } = getServerDictionary();
  return { title: dict.about.metaTitle, description: dict.about.metaDescription };
}

export default function AboutPage(): JSX.Element {
  const { dict } = getServerDictionary();
  const t = dict.about;
  const sections = [
    { id: 'architecture', label: t.architectureTitle },
    { id: 'y3172', label: t.pipelineTitle },
    { id: 'textes', label: t.corpusTitle },
    { id: 'confidentialite', label: t.privacyTitle },
    { id: 'equipe', label: t.teamTitle },
  ];

  return (
    <main className="pb-24">
      <PageHero id="about" eyebrow={t.eyebrow} title={t.title} titleEm={t.titleEm} lead={t.lead} />

      <div className="container-page mt-12 grid gap-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label={t.toc} className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{t.toc}</p>
          <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-block rounded-full border border-line px-3 py-1.5 text-sm hover:border-ink lg:border-0 lg:px-0 lg:py-1 lg:hover:underline"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-20">
          {/* ─── Architecture ─────────────────────────────────── */}
          <section id="architecture" className="scroll-mt-24" aria-labelledby="architecture-title">
            <h2 id="architecture-title" className="font-display text-4xl font-medium">
              {t.architectureTitle}
            </h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-2">
              {t.architecture.map((block, index) => (
                <li key={block.title} className="rounded-3xl border border-line bg-paper-soft p-6">
                  <span className="font-display text-4xl italic text-[#b07a0c]" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{block.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{block.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ─── Alignement Y.3172 ────────────────────────────── */}
          <section id="y3172" className="scroll-mt-24" aria-labelledby="y3172-title">
            <h2 id="y3172-title" className="font-display text-4xl font-medium">
              {t.pipelineTitle}
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-ink-soft">{t.pipelineLead}</p>
            <div className="mt-8">
              <Y3172Diagram
                nodes={t.pipeline}
                orchestrator={t.pipelineOrchestrator}
                label={t.pipelineDiagramLabel}
              />
            </div>
            <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {t.pipeline.map((node) => (
                <div key={node.code} className="border-t border-line pt-3">
                  <dt className="font-semibold">
                    <span className="mr-2 font-mono text-sm text-clay">{node.code}</span>
                    {node.name}
                  </dt>
                  <dd className="mt-1 text-ink-soft">{node.sonah}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 rounded-2xl border border-dashed border-ink/25 px-4 py-3 text-sm text-ink-soft">
              {t.pipelineNote}
            </p>
            <h3 className="mt-12 font-display text-2xl">{t.readinessTitle}</h3>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">{t.readiness}</p>
            <Link href="/lab" className="link-underline mt-4 inline-block font-semibold">
              {dict.header.links.lab} →
            </Link>
          </section>

          {/* ─── Textes couverts ──────────────────────────────── */}
          <section id="textes" className="scroll-mt-24" aria-labelledby="corpus-title">
            <h2 id="corpus-title" className="font-display text-4xl font-medium">
              {t.corpusTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-ink-soft">{t.corpusLead}</p>
            <h3 className="eyebrow mt-8">{t.corpusAvailable}</h3>
            <ul className="mt-3 space-y-4">
              {t.corpus.map((source) => (
                <li key={source.title} className="rounded-3xl border border-line bg-paper-soft p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-display text-2xl">{source.title}</p>
                    <span className="rounded-full border border-leaf/30 bg-leaf/10 px-2.5 py-0.5 text-xs font-semibold text-leaf-deep">
                      {t.corpusAvailable}
                    </span>
                  </div>
                  <p className="mt-2 leading-relaxed text-ink-soft">{source.detail}</p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline mt-3 inline-block text-sm font-semibold"
                  >
                    FAOLEX ↗
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="eyebrow mt-10">{t.corpusSoon}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.corpusComing.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-dashed border-ink/30 px-4 py-2 text-sm text-ink-soft"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* ─── Données et confidentialité ───────────────────── */}
          <section id="confidentialite" className="scroll-mt-24" aria-labelledby="privacy-title">
            <h2 id="privacy-title" className="font-display text-4xl font-medium">
              {t.privacyTitle}
            </h2>
            <dl className="mt-8 grid gap-5 md:grid-cols-2">
              {t.privacy.map((item, index) => (
                <div
                  key={item.title}
                  className={`rounded-3xl border p-6 ${
                    index === t.privacy.length - 1
                      ? 'border-clay/40 bg-clay/10'
                      : 'border-line bg-paper-soft'
                  }`}
                >
                  <dt className="text-lg font-semibold">{item.title}</dt>
                  <dd className="mt-2 leading-relaxed text-ink-soft">{item.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ─── Équipe ───────────────────────────────────────── */}
          <section id="equipe" className="scroll-mt-24" aria-labelledby="team-title">
            <h2 id="team-title" className="font-display text-4xl font-medium">
              {t.teamTitle}
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-ink-soft">{t.team}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={GITHUB_URL} className="btn-ink">
                {t.github} ↗
              </a>
              <a
                href="mailto:fokamemeric@gmail.com"
                className="btn border border-ink/20 hover:bg-paper-deep"
              >
                {t.contact}
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
