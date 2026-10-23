/**
 * Tests d'intégration sur PostgreSQL (pgvector) et Neo4j réels.
 * Activés avec RAG_INTEGRATION=1 (+ DATABASE_URL, et NEO4J_URI pour le graphe) — voir la CI.
 */
import path from 'node:path';
import { createPrismaClient, type PrismaClient } from '@sonah/database';
import { HashingEmbedder } from './embeddings/hashing-embedder';
import { GraphStoreService } from './graph-store.service';
import { seedLegalSources } from './ingestion/seed-legal';
import type { DocumentInput } from './types';
import { VectorStoreService } from './vector-store.service';

const enabled = process.env.RAG_INTEGRATION === '1' && Boolean(process.env.DATABASE_URL);
const describeDb = enabled ? describe : describe.skip;
const describeGraph = enabled && process.env.NEO4J_URI ? describe : describe.skip;
const silentLogger = { log: () => undefined, warn: () => undefined, error: () => undefined };
const SOURCES_DIR = path.resolve(__dirname, '../../../data/sources');

jest.setTimeout(120_000);

function doc(key: string, content: string, reference: string): DocumentInput {
  return {
    chunkKey: `test-int:${key}`,
    sourceId: 'test-int',
    type: 'LAW',
    title: 'Texte de test',
    reference,
    content,
    source: 'https://example.org/test',
    category: 'Test',
  };
}

describeDb('VectorStoreService (pgvector)', () => {
  let prisma: PrismaClient;
  let store: VectorStoreService;

  beforeAll(async () => {
    prisma = createPrismaClient();
    store = new VectorStoreService(prisma, new HashingEmbedder(), silentLogger);
    await prisma.document.deleteMany({ where: { sourceId: 'test-int' } });
  });

  afterAll(async () => {
    await prisma.document.deleteMany({ where: { sourceId: 'test-int' } });
    await prisma.$disconnect();
  });

  it('indexe, retrouve par similarité et met à jour sans doublon', async () => {
    const ids = await store.upsertMany([
      {
        doc: doc(
          'a',
          'Le salaire minimum est fixé par décret après avis de la commission.',
          'Article 62',
        ),
      },
      { doc: doc('b', 'Le travail de nuit des enfants est interdit.', 'Article 82') },
      { doc: doc('c', 'Le Président de la République est élu pour sept ans.', 'Article 6') },
    ]);
    expect(ids.every((id) => /^[0-9a-f-]{36}$/.test(id))).toBe(true);

    const results = await store.search('salaire minimum fixé par décret', 3, {
      sourceIds: ['test-int'],
    });
    expect(results[0]?.reference).toBe('Article 62');
    expect(results[0]?.score).toBeGreaterThan(results[2]?.score ?? 1);

    const sameId = await store.upsert(
      doc('a', 'Le salaire minimum interprofessionnel est fixé par décret.', 'Article 62'),
    );
    expect(sameId).toBe(ids[0]);
    expect(await prisma.document.count({ where: { sourceId: 'test-int' } })).toBe(3);

    const stored = await store.findById(sameId);
    expect(stored?.content).toContain('interprofessionnel');
    expect(stored?.embeddingModel).toBe('hashing-fr-v1');
    expect(await store.findById('00000000-0000-4000-8000-000000000000')).toBeNull();
  });
});

describeDb('seedLegalSources (textes réels)', () => {
  let prisma: PrismaClient;
  let store: VectorStoreService;

  beforeAll(() => {
    prisma = createPrismaClient();
    store = new VectorStoreService(prisma, new HashingEmbedder(), silentLogger);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('indexe les textes, avec statut juridique et suppression des fragments obsolètes', async () => {
    // Fragment obsolète d'un texte réel (ancien découpage) : doit disparaître au seed
    await store.upsert({
      chunkKey: 'code-du-travail-1992:art-999:1',
      sourceId: 'code-du-travail-1992',
      type: 'LAW',
      title: 'Code du travail',
      reference: 'Article 999',
      content: 'Fragment issu d’un ancien découpage.',
      source: 'https://example.org',
      category: 'Code du travail',
    });

    const reports = await seedLegalSources({
      sourcesDir: SOURCES_DIR,
      vectorStore: store,
      logger: silentLogger,
      // Pas de réseau en CI : les textes non redistribuables ne sont indexés que s'ils sont en cache
      remote: 'cache-only',
    });
    const byId = Object.fromEntries(reports.map((report) => [report.sourceId, report]));
    expect(byId['code-du-travail-1992']?.articles).toBe(177);
    expect(byId['code-du-travail-1992']?.staleDeleted).toBe(1);
    expect(byId['constitution-1996']?.articles).toBe(69);
    expect(byId['constitution-1996']?.amended).toBe(10);
    expect(byId['loi-2010-012-cybersecurite']?.articles).toBe(97);
    expect(byId['loi-2024-017-donnees-personnelles']?.articles).toBe(75);
    expect(
      await prisma.document.count({ where: { chunkKey: 'code-du-travail-1992:art-999:1' } }),
    ).toBe(0);

    // Relancer le seed ne crée aucun doublon
    const before = await prisma.document.count({ where: { sourceId: 'constitution-1996' } });
    await seedLegalSources({
      sourcesDir: SOURCES_DIR,
      vectorStore: store,
      logger: silentLogger,
      remote: 'cache-only',
      sourceIds: ['constitution-1996'],
    });
    expect(await prisma.document.count({ where: { sourceId: 'constitution-1996' } })).toBe(before);
  });

  it('retrouve les bons articles et expose leur statut', async () => {
    const forcedLabour = await store.search('le travail forcé ou obligatoire est-il interdit', 3, {
      sourceIds: ['code-du-travail-1992'],
    });
    expect(forcedLabour.map((result) => result.reference)).toContain('Article 2');

    const president = await store.search(
      'élection du Président de la République au suffrage universel',
      3,
      { sourceIds: ['constitution-1996'] },
    );
    const article6 = president.find((result) => result.reference === 'Article 6');
    expect(article6?.metadata).toMatchObject({
      status: 'amended',
      amendedBy: 'constitution-2008-amendment:art-6-nouveau',
      sourceId: 'constitution-1996',
      version: expect.any(String),
      date: '1996-01-18',
      page: expect.any(Number),
    });

    const current = await store.search('mandat du Président de la République rééligible', 5, {
      sourceIds: ['constitution-2026-amendment'],
    });
    expect(current[0]?.reference).toMatch(/^Article 6 \(nouveau\)/);
    expect(current[0]?.metadata?.status).toBe('in_force');
  });

  it('recherche hybride : retrouve une référence exacte (« Article 12 », « loi n° 2010/012 »)', async () => {
    const query = 'Article 12 de la loi n° 2010/012';
    const hybrid = await store.search(query, 3, { minScore: 0.99 });
    expect(hybrid[0]).toMatchObject({
      sourceId: 'loi-2010-012-cybersecurite',
      reference: 'Article 12',
    });
    // Recherche vectorielle seule : le seuil s'applique sans exception
    expect(await store.search(query, 3, { hybrid: false, minScore: 0.99 })).toEqual([]);
    // Même forme de résultat dans les deux modes
    const vectorRanked = await store.search(query, 3, { hybrid: false });
    expect(Object.keys(vectorRanked[0] ?? {}).sort()).toEqual(Object.keys(hybrid[0] ?? {}).sort());
  });

  it('sans référence explicite, la recherche par défaut est purement vectorielle', async () => {
    const query = 'durée du mandat du chef de l’État';
    expect(await store.search(query, 5)).toEqual(await store.search(query, 5, { hybrid: false }));
  });
});

describeGraph('GraphStoreService (Neo4j)', () => {
  let graph: GraphStoreService;

  beforeAll(async () => {
    graph = GraphStoreService.connect(
      {
        uri: process.env.NEO4J_URI ?? '',
        user: process.env.NEO4J_USER ?? 'neo4j',
        password: process.env.NEO4J_PASSWORD ?? '',
      },
      silentLogger,
    );
    await graph.verifyConnectivity();
    await graph.ensureSchema();
    await graph.deleteProceduresByPrefix('TEST_');
  });

  afterAll(async () => {
    await graph.deleteProceduresByPrefix('TEST_');
    await graph.close();
  });

  it('calcule les prérequis transitifs, les plus profonds d’abord', async () => {
    await graph.createRelation('TEST_RESTAURANT', 'TEST_ENTREPRISE', 'REQUIRES');
    await graph.createRelation('TEST_ENTREPRISE', 'TEST_CNI', 'REQUIRES');
    await graph.createRelation('TEST_RESTAURANT', 'TEST_SANITAIRE', 'REQUIRES');

    const dependencies = await graph.getDependencies(['TEST_RESTAURANT']);
    expect(dependencies.map((d) => [d.code, d.depth])).toEqual([
      ['TEST_CNI', 2],
      ['TEST_ENTREPRISE', 1],
      ['TEST_SANITAIRE', 1],
    ]);
  });

  it('trouve le parcours dans le sens d’exécution, et rien dans le sens inverse', async () => {
    await graph.createRelation('TEST_SANITAIRE', 'TEST_OUVERTURE', 'PRECEDES');
    const path = await graph.findOptimalPath('TEST_CNI', 'TEST_RESTAURANT');
    expect(path.map((step) => step.code)).toEqual([
      'TEST_CNI',
      'TEST_ENTREPRISE',
      'TEST_RESTAURANT',
    ]);
    expect(await graph.findOptimalPath('TEST_RESTAURANT', 'TEST_CNI')).toEqual([]);
  });
});
