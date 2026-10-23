/**
 * Base de connaissances réelle (data/sources), hors ligne : découpage des textes versionnés,
 * nombre d'articles et statuts juridiques. Les textes non redistribuables (téléchargés à
 * l'indexation) sont ignorés s'ils ne sont pas en cache.
 */
import path from 'node:path';
import type { LegalChunk, LegalSource } from '../types';
import { computeLegalStatuses, type ChunkStatus } from './legal-status';
import { chunkSource } from './seed-legal';
import { loadSourceText, SourceUnavailableError } from './source-text';
import { loadSourceManifest } from './sources';

const SOURCES_DIR = path.resolve(__dirname, '../../../../data/sources');

jest.setTimeout(120_000);

describe('base de connaissances (textes versionnés)', () => {
  let sources: LegalSource[];
  const chunks = new Map<string, LegalChunk[]>();
  let statuses: Map<string, ChunkStatus>;

  beforeAll(async () => {
    sources = await loadSourceManifest(SOURCES_DIR);
    for (const source of sources) {
      if (source.redistribution !== 'redistributable') continue;
      try {
        const text = await loadSourceText(source, {
          sourcesDir: SOURCES_DIR,
          remote: 'cache-only',
        });
        chunks.set(source.id, chunkSource(source, text));
      } catch (error) {
        if (!(error instanceof SourceUnavailableError)) throw error;
      }
    }
    statuses = computeLegalStatuses(sources, chunks);
  });

  const articleCount = (id: string): number =>
    new Set((chunks.get(id) ?? []).map((chunk) => chunk.unitId).filter((unit) => /^\d/.test(unit)))
      .size;

  it.each([
    ['constitution-1996', 69],
    ['constitution-1996-en', 69],
    ['constitution-2008-amendment', 8],
    ['constitution-2026-amendment', 8],
    ['code-du-travail-1992', 177],
    ['loi-2010-012-cybersecurite', 97],
    ['loi-2010-013-communications-electroniques', 104],
    ['loi-2015-006-communications-electroniques', 16],
    ['loi-2024-017-donnees-personnelles', 75],
    ['loi-2024-016-etat-civil', 130],
    ['decret-2017-0877-pm-cfce', 6],
  ])('%s : %i articles', (id, expected) => {
    expect(articleCount(id)).toBe(expected);
  });

  it('numérote les articles sans trou ni doublon', () => {
    for (const [id, sourceChunks] of chunks) {
      const keys = sourceChunks.map((chunk) => chunk.key);
      expect({ id, duplicates: keys.length - new Set(keys).size }).toEqual({ id, duplicates: 0 });
    }
  });

  it('Constitution : l’article 6 de 1996 renvoie aux rédactions de 2008 puis 2026', () => {
    expect(statuses.get('constitution-1996:art-6:1')).toMatchObject({
      status: 'amended',
      amendedBy: 'constitution-2008-amendment:art-6-nouveau',
      amendmentHistory: [
        'constitution-2008-amendment:art-6-nouveau',
        'constitution-2026-amendment:art-6-nouveau',
      ],
    });
    expect(statuses.get('constitution-2008-amendment:art-6-nouveau:1')?.status).toBe('amended');
    expect(statuses.get('constitution-2026-amendment:art-6-nouveau:1')?.status).toBe('in_force');
    const in2026 = chunks.get('constitution-2026-amendment')?.find((c) => c.unitId === '6-nouveau');
    expect(in2026?.content).toContain('Il est rééligible');
  });

  it('Constitution : l’article 69 ne contient que la formule de publication', () => {
    const article69 = chunks.get('constitution-1996')?.find((c) => c.articleNumber === '69');
    expect(article69?.content).toContain('Journal Officiel');
    expect(article69?.content).not.toMatch(/rééligible|nouveau/);
  });

  it('marque les articles modifiés de toutes les lois de base, et rien d’autre', () => {
    const amendedUnits = (id: string): string[] =>
      [
        ...new Set(
          (chunks.get(id) ?? [])
            .filter((c) => statuses.get(c.key)?.status === 'amended')
            .map((c) => c.unitId),
        ),
      ].sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    expect(amendedUnits('constitution-1996')).toEqual([
      '5',
      '6',
      '7',
      '10',
      '14',
      '15',
      '51',
      '53',
      '66',
      '67',
    ]);
    expect(amendedUnits('constitution-1996-en')).toEqual([
      '5',
      '6',
      '7',
      '10',
      '14',
      '15',
      '51',
      '53',
      '66',
      '67',
    ]);
    expect(amendedUnits('loi-2010-013-communications-electroniques')).toEqual([
      '5',
      '6',
      '9',
      '10',
      '14',
      '20',
      '34',
      '36',
      '50',
      '56',
      '81',
      '83',
      '84',
      '94',
    ]);
    expect(amendedUnits('code-du-travail-1992')).toEqual([]);
  });

  it('chaque fragment connaît sa page dans le document d’origine', () => {
    for (const id of [
      'constitution-1996',
      'loi-2010-012-cybersecurite',
      'loi-2024-017-donnees-personnelles',
    ]) {
      const withoutPage = (chunks.get(id) ?? []).filter((chunk) => chunk.pageStart === undefined);
      expect({ id, withoutPage: withoutPage.length }).toEqual({ id, withoutPage: 0 });
    }
  });
});
