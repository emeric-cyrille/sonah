import type { Metadata } from 'next';
import { DocumentView } from '@/components/document-view';
import { PageHero } from '@/components/page-hero';
import { getServerDictionary } from '@/i18n/server';
import { safeDecode } from '@/lib/url';

export function generateMetadata(): Metadata {
  const { dict } = getServerDictionary();
  return { title: dict.documents.metaTitle };
}

export default function DocumentPage({ params }: { params: { id: string } }): JSX.Element {
  const { dict } = getServerDictionary();
  const documentId = safeDecode(params.id);
  return (
    <main className="pb-24">
      <PageHero id="document" eyebrow={dict.documents.eyebrow} title={dict.documents.metaTitle}>
        <p className="mt-5 break-all font-mono text-sm text-paper/80">{documentId}</p>
      </PageHero>
      <div className="container-page mt-12">
        <DocumentView documentId={documentId} />
      </div>
    </main>
  );
}
