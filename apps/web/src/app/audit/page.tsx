import type { Metadata } from 'next';
import { TraceList } from '@/components/audit/trace-list';
import { VerifyChain } from '@/components/audit/verify-chain';
import { PageHero } from '@/components/page-hero';
import { getServerDictionary } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { dict } = getServerDictionary();
  return { title: dict.audit.metaTitle, description: dict.audit.metaDescription };
}

export default function AuditPage(): JSX.Element {
  const { dict } = getServerDictionary();
  const t = dict.audit;
  return (
    <main className="pb-24">
      <PageHero id="audit" eyebrow={t.eyebrow} title={t.title} titleEm={t.titleEm} lead={t.lead} />
      <div className="container-page mt-12 space-y-14">
        <VerifyChain />
        <TraceList />
      </div>
    </main>
  );
}
