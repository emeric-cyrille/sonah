import {
  parseProcedureSheet,
  procedureToDocument,
  type ProcedureSheet,
  type SearchResult,
} from '@sonah/rag';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

/** Fragments de textes officiels utilisés par les tests. */
export function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    id: 'doc-travail-2',
    sourceId: 'code-du-travail-1992',
    title: 'Code du travail (loi n° 92-007 du 14 août 1992)',
    reference: 'Article 2',
    content:
      'Le droit au travail est reconnu à chaque citoyen comme un droit fondamental. Le travail forcé est interdit.',
    category: 'Code du travail',
    source: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
    score: 0.82,
    metadata: { shortTitle: 'Code du travail', path: ['Titre 1 - Dispositions générales'] },
    ...overrides,
  };
}

export const LABOUR_ARTICLE = makeResult();

export const CONSTITUTION_ART6 = makeResult({
  id: 'doc-constitution-6',
  sourceId: 'constitution-1996',
  title: 'Constitution de la République du Cameroun (loi n° 96-06 du 18 janvier 1996)',
  reference: 'Article 6',
  content:
    "Le Président de la République est élu pour un mandat de sept (7) ans renouvelable une fois. L'élection a lieu au suffrage universel direct.",
  category: 'Constitution',
  source: 'https://faolex.fao.org/docs/pdf/cmr117236.pdf',
  score: 0.71,
  metadata: {
    shortTitle: 'Constitution',
    status: 'amended',
    amendedBy: 'loi n° 2008-1 du 14 avril 2008',
  },
});

/** Fiches de démarches de test (packages/rag/src/procedures/__fixtures__), indexées comme en base. */
const PROCEDURE_FIXTURES_DIR = path.resolve(
  __dirname,
  '../../../../packages/rag/src/procedures/__fixtures__',
);

export function procedureSheetFixture(id: string): ProcedureSheet {
  return parseProcedureSheet(
    JSON.parse(readFileSync(path.join(PROCEDURE_FIXTURES_DIR, `${id}.json`), 'utf8')),
  );
}

/** Document PROCEDURE tel que renvoyé par la recherche (score cosinus donné). */
export function procedureResult(id: string, score = 0.5): SearchResult {
  const doc = procedureToDocument(procedureSheetFixture(id));
  return {
    id: `doc-${doc.chunkKey}`,
    sourceId: doc.sourceId,
    title: doc.title,
    reference: doc.reference ?? null,
    content: doc.content,
    category: doc.category,
    source: doc.source,
    score,
    metadata: doc.metadata ?? null,
  };
}

export const MEDICAL_CERTIFICATE = procedureResult('certificat-medical');
export const LOST_ID_CARD = procedureResult('cni-perte');
export const BIRTH_CERTIFICATE = procedureResult('acte-de-naissance-copie');
