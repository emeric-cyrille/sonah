import { chunkLegalText } from '../chunking/legal-chunker';
import type { LegalChunk, LegalSource } from '../types';
import { computeLegalStatuses } from './legal-status';
import { toDocument } from './seed-legal';

function source(id: string, date: string, extra: Partial<LegalSource> = {}): LegalSource {
  return {
    id,
    docId: id.toUpperCase(),
    issuingBody: 'Test',
    title: `Texte ${id}`,
    titleFr: `Texte ${id}`,
    titleEn: `Text ${id}`,
    shortTitle: `Texte ${id}`,
    type: 'CONSTITUTION',
    category: 'Constitution',
    jurisdiction: 'CM',
    binding: 'binding',
    language: 'fr',
    version: date,
    date,
    url: 'https://example.org',
    accessedAt: '2026-10-23',
    sha256: 'a'.repeat(64),
    license: 'test',
    redistribution: 'redistributable',
    domains: ['constitution'],
    ituDimensions: [],
    ituFolder: 'AI_Strategies',
    chunking: { mode: 'articles' },
    ...extra,
  };
}

const base = source('base', '1996-01-18');
const v2008 = source('v2008', '2008-04-14', {
  amends: { sourceId: 'base', articles: { '6': ['2', '4'], '14': ['3 a'] } },
});
const v2026 = source('v2026', '2026-04-14', {
  amends: { sourceId: 'base', articles: { '6': [] } },
});
const repealer = source('abrogation', '2024-12-23', { repeals: { sourceId: 'old' } });
const old = source('old', '1981-06-29');

const chunks = new Map<string, LegalChunk[]>([
  [
    'base',
    chunkLegalText(
      'base',
      'Art. 6.- Mandat renouvelable une fois.\nArt. 14.- Sessions.\nArt. 15.- Autre.',
      {
        preambleLabel: null,
      },
    ),
  ],
  [
    'v2008',
    chunkLegalText(
      'v2008',
      'ARTICLE 1er.- Modifications.\nARTICLE 6.- (nouveau) Il est rééligible.\nARTICLE 14.- (nouveau) Mars, juin, novembre.\nARTICLE 2.- Publication.',
      {
        preambleLabel: null,
        amendedArticles: ['6', '14'],
      },
    ),
  ],
  [
    'v2026',
    chunkLegalText(
      'v2026',
      'ARTICLE 1er.- Modifications.\n« ARTICLE 6.- (nouveau) Vice-Président.\nARTICLE 2.- Publication.',
      {
        preambleLabel: null,
        amendedArticles: ['6'],
      },
    ),
  ],
  ['old', chunkLegalText('old', 'Art. 1.- Ancien.', { preambleLabel: null })],
]);

describe('computeLegalStatuses', () => {
  const statuses = computeLegalStatuses([base, v2008, v2026, repealer, old], chunks);

  it('suit la lignée d’un article modifié deux fois (1996 → 2008 → 2026)', () => {
    expect(statuses.get('base:art-6:1')).toMatchObject({
      status: 'amended',
      amendedBy: 'v2008:art-6-nouveau',
      amendedParagraphs: ['2', '4'],
      amendmentHistory: ['v2008:art-6-nouveau', 'v2026:art-6-nouveau'],
    });
    expect(statuses.get('v2008:art-6-nouveau:1')).toMatchObject({
      status: 'amended',
      amendedBy: 'v2026:art-6-nouveau',
      amends: 'base:art-6',
    });
    expect(statuses.get('v2026:art-6-nouveau:1')).toEqual({
      status: 'in_force',
      amends: 'base:art-6',
    });
  });

  it('laisse en vigueur les articles non modifiés et la nouvelle rédaction la plus récente', () => {
    expect(statuses.get('base:art-15:1')?.status).toBe('in_force');
    expect(statuses.get('v2008:art-14-nouveau:1')?.status).toBe('in_force');
    expect(statuses.get('base:art-14:1')?.amendedBy).toBe('v2008:art-14-nouveau');
    expect(statuses.get('v2008:art-1:1')?.status).toBe('in_force');
  });

  it('marque abrogés les articles d’un texte abrogé', () => {
    expect(statuses.get('old:art-1:1')).toEqual({ status: 'repealed', repealedBy: 'abrogation' });
  });

  it('signale un article modifié introuvable (défaut de découpage)', () => {
    const broken = source('broken', '2010-01-01', {
      amends: { sourceId: 'base', articles: { '99': [] } },
    });
    const withBroken = new Map(chunks).set(
      'broken',
      chunkLegalText('broken', 'ARTICLE 99.- (nouveau) X.', {
        preambleLabel: null,
        amendedArticles: ['99'],
      }),
    );
    expect(() => computeLegalStatuses([base, broken], withBroken)).toThrow('article 99');
  });

  it('expose statut, version et renvoi dans les métadonnées du document indexé', () => {
    const chunk = chunks.get('base')?.[0] as LegalChunk;
    const doc = toDocument(base, chunk, statuses.get(chunk.key));
    expect(doc.metadata).toMatchObject({
      status: 'amended',
      amendedBy: 'v2008:art-6-nouveau',
      version: '1996-01-18',
      date: '1996-01-18',
      sourceId: 'base',
      docId: 'BASE',
      unitKey: 'base:art-6',
    });
    expect(String(doc.metadata?.note)).toContain('Rédaction modifiée (alinéa(s) ou point(s) 2, 4)');
  });
});
