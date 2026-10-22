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

  it('indexe la Constitution et le Code du travail, puis retrouve les bons articles', async () => {
    const reports = await seedLegalSources({
      sourcesDir: path.resolve(__dirname, '../../../data/sources'),
      vectorStore: store,
      logger: silentLogger,
    });
    const byId = Object.fromEntries(reports.map((report) => [report.sourceId, report]));
    expect(byId['code-du-travail-1992']?.articles).toBe(177);
    expect(byId['constitution-1996']?.articles).toBeGreaterThanOrEqual(65);

    const forcedLabour = await store.search('le travail forcé ou obligatoire est-il interdit', 3, {
      sourceIds: ['code-du-travail-1992'],
    });
    expect(forcedLabour.map((result) => result.reference)).toContain('Article 2');

    const president = await store.search(
      'élection du Président de la République au suffrage universel',
      3,
      {
        sourceIds: ['constitution-1996'],
      },
    );
    expect(president.map((result) => result.reference)).toContain('Article 6');
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
