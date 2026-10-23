import type { Metadata } from 'next';
import { PolicyLab } from '@/components/lab/policy-lab';
import { PageHero } from '@/components/page-hero';
import { getServerDictionary } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { dict } = getServerDictionary();
  return { title: dict.lab.metaTitle, description: dict.lab.metaDescription };
}

export default function LabPage(): JSX.Element {
  const { dict } = getServerDictionary();
  const t = dict.lab;
  return (
    <main className="pb-24">
      <PageHero id="lab" eyebrow={t.eyebrow} title={t.title} titleEm={t.titleEm} lead={t.lead} />
      <div className="container-page mt-12">
        <PolicyLab />
      </div>
    </main>
  );
}
