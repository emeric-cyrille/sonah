import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { VectorStoreService } from '../vector-store.service';
import { loadProcedureSheets, ProcedureSheetError } from './load';
import { matchProcedureKeywords, stem } from './match';
import { parseProcedureSheet, procedureFromMetadata } from './schema';
import {
  PROCEDURES_SOURCE_ID,
  procedureEmbeddingText,
  procedureToDocument,
  seedProcedures,
} from './seed-procedures';

const FIXTURES = path.join(__dirname, '__fixtures__');
const DATA_DIR = path.resolve(__dirname, '../../../../data/procedures');

/** Base vectorielle en mémoire : enregistre les fragments indexés et leurs empreintes. */
function memoryStore(): {
  store: VectorStoreService;
  docs: Map<string, { metadata?: Record<string, unknown>; embeddingText?: string }>;
  upserts: string[][];
} {
  const docs = new Map<string, { metadata?: Record<string, unknown>; embeddingText?: string }>();
  const upserts: string[][] = [];
  const store = {
    upsertMany: async (
      items: Array<{
        doc: { chunkKey: string; metadata?: Record<string, unknown> };
        embeddingText?: string;
      }>,
    ) => {
      upserts.push(items.map((item) => item.doc.chunkKey));
      for (const item of items) {
        docs.set(item.doc.chunkKey, {
          metadata: item.doc.metadata,
          embeddingText: item.embeddingText,
        });
      }
      return items.map((item) => item.doc.chunkKey);
    },
    indexedFingerprints: async () =>
      new Map(
        [...docs.entries()].map(([key, doc]) => [
          key,
          (doc.metadata?.fingerprint as string) ?? null,
        ]),
      ),
    deleteStaleChunks: async (_sourceId: string, keep: readonly string[]) => {
      let count = 0;
      for (const key of [...docs.keys()]) {
        if (!keep.includes(key)) {
          docs.delete(key);
          count += 1;
        }
      }
      return count;
    },
  } as unknown as VectorStoreService;
  return { store, docs, upserts };
}

const silent = { log: () => undefined, warn: () => undefined, error: () => undefined };

describe('fiches de démarches', () => {
  it('charge et valide les fiches de test', async () => {
    const sheets = await loadProcedureSheets(FIXTURES);
    expect(sheets.map((s) => s.id)).toEqual([
      'acte-de-naissance-copie',
      'certificat-medical',
      'cni-perte',
    ]);
    const cni = sheets.find((s) => s.id === 'cni-perte');
    expect(cni?.cost).toEqual({ amount_fcfa: 2800, description: 'Timbre de 2 800 FCFA' });
    expect(cni?.steps.map((s) => s.order)).toEqual([1, 2, 3, 4]);
    const birth = sheets.find((s) => s.id === 'acte-de-naissance-copie');
    expect(birth?.cost).toBeNull();
    expect(birth?.delay).toBeNull();
  });

  it('dossier absent : aucune fiche', async () => {
    expect(await loadProcedureSheets(path.join(os.tmpdir(), 'sonah-absent-xyz'))).toEqual([]);
  });

  it('rejette une fiche invalide ou un identifiant en double', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'sonah-proc-'));
    try {
      await writeFile(path.join(dir, 'a.json'), JSON.stringify({ id: 'Bad Id', title_fr: 'x' }));
      await expect(loadProcedureSheets(dir)).rejects.toBeInstanceOf(ProcedureSheetError);
      const sheet = { id: 'x', title_fr: 'X', category: 'sante', authority: null };
      await writeFile(path.join(dir, 'a.json'), JSON.stringify(sheet));
      await writeFile(path.join(dir, 'b.json'), JSON.stringify(sheet));
      await expect(loadProcedureSheets(dir)).rejects.toThrow(/déjà utilisé/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('accepte les champs non vérifiés à null', () => {
    const sheet = parseProcedureSheet({
      id: 'minimal',
      title_fr: 'Démarche minimale',
      category: 'justice',
      authority: null,
      where: null,
      documents: null,
      steps: null,
      cost: { amount_fcfa: null, description: null },
      delay: null,
      legal_basis: null,
      tips: null,
      unverified: null,
    });
    expect(sheet.documents).toEqual([]);
    expect(sheet.steps).toEqual([]);
    expect(sheet.title_en).toBeNull();
    expect(sheet.cost).toEqual({ amount_fcfa: null, description: null });
  });

  it('les fiches réelles de data/procedures respectent le schéma (si présentes)', async () => {
    if (!existsSync(DATA_DIR)) return;
    const sheets = await loadProcedureSheets(DATA_DIR);
    for (const sheet of sheets) expect(sheet.title_fr.length).toBeGreaterThan(0);
  });

  it('document PROCEDURE : un fragment par fiche, fiche complète en métadonnées', async () => {
    const [sheet] = (await loadProcedureSheets(FIXTURES)).filter((s) => s.id === 'cni-perte');
    if (!sheet) throw new Error('fiche manquante');
    const doc = procedureToDocument(sheet);
    expect(doc).toMatchObject({
      chunkKey: 'procedure:cni-perte',
      sourceId: PROCEDURES_SOURCE_ID,
      type: 'PROCEDURE',
      source: 'https://example.org/fixtures/cni',
      category: 'identite',
    });
    expect(doc.metadata).toMatchObject({
      status: 'in_force',
      verified_at: '2026-10-01',
      unverified: [{ field: 'delay', note: expect.any(String) }],
      sources: [expect.objectContaining({ url: 'https://example.org/fixtures/cni' })],
    });
    expect(procedureFromMetadata(doc.metadata)).toEqual(sheet);
    const text = procedureEmbeddingText(sheet);
    expect(text).toContain("Carte nationale d'identité");
    expect(text).toContain('CNI perdue');
    expect(text).toContain('DGSN');
  });

  it('seed : indexe, reprend sans revectoriser, réindexe une fiche modifiée et supprime les fiches retirées', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'sonah-proc-'));
    try {
      const { store, docs, upserts } = memoryStore();
      const sheets = await loadProcedureSheets(FIXTURES);
      for (const sheet of sheets) {
        await writeFile(path.join(dir, `${sheet.id}.json`), JSON.stringify(sheet));
      }
      const first = await seedProcedures({
        proceduresDir: dir,
        vectorStore: store,
        logger: silent,
      });
      expect(first).toEqual({ sourceId: 'procedures', sheets: 3, indexed: 3, staleDeleted: 0 });

      const resumed = await seedProcedures({
        proceduresDir: dir,
        vectorStore: store,
        logger: silent,
        onlyMissing: true,
      });
      expect(resumed.indexed).toBe(0);
      expect(upserts).toHaveLength(1);

      const cni = sheets.find((s) => s.id === 'cni-perte');
      await writeFile(
        path.join(dir, 'cni-perte.json'),
        JSON.stringify({ ...cni, delay: '3 semaines' }),
      );
      await rm(path.join(dir, 'certificat-medical.json'));
      const updated = await seedProcedures({
        proceduresDir: dir,
        vectorStore: store,
        logger: silent,
        onlyMissing: true,
      });
      expect(updated).toMatchObject({ sheets: 2, indexed: 1, staleDeleted: 1 });
      expect([...docs.keys()].sort()).toEqual([
        'procedure:acte-de-naissance-copie',
        'procedure:cni-perte',
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('seed : dossier absent → rien n’est indexé ni supprimé', async () => {
    const { store, upserts } = memoryStore();
    const report = await seedProcedures({
      proceduresDir: path.join(os.tmpdir(), 'sonah-absent-xyz'),
      vectorStore: store,
      logger: silent,
    });
    expect(report).toEqual({ sourceId: 'procedures', sheets: null, indexed: 0, staleDeleted: 0 });
    expect(upserts).toHaveLength(0);
  });

  it('seed : dossier vide → toutes les fiches indexées sont retirées', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'sonah-proc-'));
    try {
      const { store, docs } = memoryStore();
      const [sheet] = await loadProcedureSheets(FIXTURES);
      await mkdir(path.join(dir, 'p'));
      await writeFile(path.join(dir, 'p', 'x.json'), JSON.stringify(sheet));
      await seedProcedures({
        proceduresDir: path.join(dir, 'p'),
        vectorStore: store,
        logger: silent,
      });
      await rm(path.join(dir, 'p', 'x.json'));
      const report = await seedProcedures({
        proceduresDir: path.join(dir, 'p'),
        vectorStore: store,
        logger: silent,
      });
      expect(report.staleDeleted).toBe(1);
      expect(docs.size).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('correspondance par mots-clés', () => {
  let sheets: Awaited<ReturnType<typeof loadProcedureSheets>>;
  beforeAll(async () => {
    sheets = await loadProcedureSheets(FIXTURES);
  });
  const best = (query: string) =>
    sheets
      .map((sheet) => ({ id: sheet.id, match: matchProcedureKeywords(query, sheet) }))
      .filter((entry) => entry.match.specific)
      .sort((a, b) => b.match.score - a.match.score)[0]?.id ?? null;

  it.each([
    ['je veux faire mon certificat médical', 'certificat-medical'],
    ['Où faire une visite médicale ?', 'certificat-medical'],
    ["j'ai perdu ma CNI", 'cni-perte'],
    ["Comment refaire ma carte nationale d'identité ?", 'cni-perte'],
    ['how do I get a birth certificate', 'acte-de-naissance-copie'],
    ['je veux une copie de mon acte de naissance', 'acte-de-naissance-copie'],
    ['I lost my ID card', 'cni-perte'],
  ])('« %s » → %s', (query, expected) => {
    expect(best(query)).toBe(expected);
  });

  it.each([
    'comment renouveler mon passeport',
    'je veux un certificat de nationalité',
    'je veux une carte grise',
    'how do I get a certificate',
  ])('« %s » → aucune fiche spécifique', (query) => {
    expect(best(query)).toBeNull();
  });

  it('racinisation : pluriels et féminins en -al', () => {
    expect(stem('medicale')).toBe('medical');
    expect(stem('medicaux')).toBe('medical');
    expect(stem('cartes')).toBe('carte');
  });
});
