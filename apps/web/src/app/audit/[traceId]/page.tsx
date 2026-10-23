import type { Metadata } from 'next';
import { TraceView } from '@/components/audit/trace-view';
import { PageHero } from '@/components/page-hero';
import { getServerDictionary } from '@/i18n/server';
import { safeDecode } from '@/lib/url';

export function generateMetadata(): Metadata {
  const { dict } = getServerDictionary();
  return { title: dict.audit.trace.metaTitle, robots: { index: false } };
}

export default function TracePage({ params }: { params: { traceId: string } }): JSX.Element {
  const { dict } = getServerDictionary();
  const traceId = safeDecode(params.traceId);
  return (
    <main className="pb-24">
      <PageHero id="trace" eyebrow={dict.audit.trace.eyebrow} title={dict.audit.trace.metaTitle}>
        <p className="mt-5 break-all font-mono text-sm text-paper/80">{traceId}</p>
      </PageHero>
      <div className="container-page mt-12">
        <TraceView traceId={traceId} />
      </div>
    </main>
  );
}
