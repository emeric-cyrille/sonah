/**
 * Tests de bout en bout : l'application NestJS complète, servie sur un port éphémère et
 * interrogée en HTTP (fetch natif). Base de données, recherche vectorielle et modèle de langage
 * sont remplacés par des doubles en mémoire.
 */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { CORPUS_CATALOG, MemoryCorpusCatalog } from '../agents/corpus-catalog';
import { MemoryTraceStore, TRACE_STORE } from '../audit/trace-store';
import { LANGUAGE_MODEL } from '../chat/language-model';
import { PrismaService } from '../prisma/prisma.service';
import { VECTOR_STORE } from '../rag/rag.tokens';
import {
  MemoryScenarioRunRepository,
  SCENARIO_RUN_REPOSITORY,
} from '../scenarios/scenario-run.repository';
import { CONSTITUTION_ART6, LABOUR_ARTICLE } from '../testing/fixtures';
import { fakeVectorStore, memoryPrisma } from '../testing/fakes';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('API SONAH (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const traces = new MemoryTraceStore();
  const corpus = [LABOUR_ARTICLE, CONSTITUTION_ART6];

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://e2e:e2e@localhost:1/unused';
    process.env.OPENAI_API_KEY = '';
    process.env.NEO4J_URI = '';
    // Import différé : la configuration est validée au chargement du module
    const { AppModule } = await import('../app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(memoryPrisma().prisma)
      .overrideProvider(VECTOR_STORE)
      .useValue(fakeVectorStore(corpus, { lexical: true }).store)
      .overrideProvider(CORPUS_CATALOG)
      .useValue(new MemoryCorpusCatalog(corpus))
      .overrideProvider(TRACE_STORE)
      .useValue(traces)
      .overrideProvider(SCENARIO_RUN_REPOSITORY)
      .useValue(new MemoryScenarioRunRepository())
      .overrideProvider(LANGUAGE_MODEL)
      .useFactory({ factory: () => null })
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;
  });

  afterAll(async () => {
    await app?.close();
  });

  async function call(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<{ status: number; headers: Headers; json: Record<string, unknown> }> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      headers: response.headers,
      json: (await response.json()) as Record<string, unknown>,
    };
  }

  it('POST /chat respecte le contrat (verdict, citations, traceId)', async () => {
    const { status, json } = await call('POST', '/chat', {
      message: 'Le travail forcé est-il autorisé ?',
    });
    expect(status).toBe(200);
    expect(json).toMatchObject({
      conversationId: expect.stringMatching(UUID),
      language: 'fr',
      verdict: 'ANSWERED_WITH_CITATIONS',
      traceId: expect.stringMatching(UUID),
    });
    const citations = json.citations as Array<Record<string, unknown>>;
    expect(citations[0]).toMatchObject({
      index: 1,
      documentId: LABOUR_ARTICLE.id,
      sourceId: 'code-du-travail-1992',
      title: 'Code du travail',
      reference: 'Article 2',
      status: 'in_force',
    });
    expect(json.reply).toContain('[1]');
    expect(json.sources).toEqual([
      expect.objectContaining({ title: 'Code du travail', reference: 'Article 2' }),
    ]);
  });

  it('POST /chat valide la requête', async () => {
    expect((await call('POST', '/chat', { message: '' })).status).toBe(400);
    expect((await call('POST', '/chat', { message: 'ok', language: 'de' })).status).toBe(400);
  });

  it('GET /audit : la trace d’une réponse est consultable et la chaîne vérifiable', async () => {
    const chat = await call('POST', '/chat', {
      message: 'How many terms can the President of the Republic serve?',
      language: 'en',
    });
    expect(chat.json.verdict).toBe('OUTDATED_TEXT');

    const detail = await call('GET', `/audit/traces/${String(chat.json.traceId)}`);
    expect(detail.status).toBe(200);
    expect(detail.json).toMatchObject({
      id: chat.json.traceId,
      conversationId: chat.json.conversationId,
      verdict: 'OUTDATED_TEXT',
      hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      prevHash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    const steps = detail.json.steps as Array<{ order: number; type: string }>;
    expect(steps.map((s) => s.type)).toEqual(['input', 'retrieval', 'gate', 'agent', 'output']);

    const list = await call(
      'GET',
      `/audit/traces?conversationId=${String(chat.json.conversationId)}&limit=5`,
    );
    expect((list.json.traces as unknown[]).length).toBe(1);

    expect((await call('GET', '/audit/verify')).json).toMatchObject({ valid: true });
    expect((await call('GET', '/audit/traces/00000000-0000-4000-8000-000000000000')).status).toBe(
      404,
    );
  });

  it('GET /audit/verify détecte une altération', async () => {
    const tampered = traces.records[0];
    if (!tampered) throw new Error('aucune trace');
    traces.records[0] = { ...tampered, verdict: 'REFER_TO_HUMAN' };
    const { json } = await call('GET', '/audit/verify');
    expect(json).toMatchObject({ valid: false, brokenAt: tampered.id });
    traces.records[0] = tampered;
  });

  it('GET /agents liste les agents et leurs rôles', async () => {
    const response = await fetch(`${baseUrl}/agents`);
    const agents = (await response.json()) as Array<Record<string, unknown>>;
    expect(agents.map((a) => a.id)).toEqual([
      'sonah',
      'legal-adviser',
      'regulator-minpostel',
      'data-protection-authority',
      'ministry-business',
      'coordinator',
    ]);
    expect(agents[0]).toEqual(
      expect.objectContaining({ name: 'Sonah', role: 'Innovative AI solution', sources: [] }),
    );
  });

  it('scénarios : liste, démarrage, publication progressive, lecture', async () => {
    const listResponse = await fetch(`${baseUrl}/scenarios`);
    const scenarios = (await listResponse.json()) as Array<Record<string, unknown>>;
    expect(scenarios.map((s) => s.id)).toEqual([
      'outdated-law',
      'personal-data-in-chat',
      'llm-outage',
      'conflicting-requirements',
    ]);

    const started = await call('POST', '/scenarios/outdated-law/runs', {});
    expect(started.status).toBe(201);
    expect(started.json).toMatchObject({ runId: expect.stringMatching(UUID), totalSteps: 3 });
    const runId = String(started.json.runId);

    const step1 = await call('POST', `/scenarios/runs/${runId}/next`);
    expect(step1.status).toBe(200);
    expect(step1.json).toMatchObject({ runId, step: 1, totalSteps: 3, done: false });
    const responses = step1.json.responses as Array<Record<string, unknown>>;
    expect(responses[0]).toMatchObject({
      agentId: 'sonah',
      role: 'Innovative AI solution',
      verdict: 'OUTDATED_TEXT',
      traceId: expect.stringMatching(UUID),
    });

    const run = await call('GET', `/scenarios/runs/${runId}`);
    expect(run.json).toMatchObject({ runId, currentStep: 1, status: 'RUNNING' });
    expect((run.json.steps as unknown[]).length).toBe(1);

    await call('POST', `/scenarios/runs/${runId}/next`);
    const last = await call('POST', `/scenarios/runs/${runId}/next`);
    expect(last.json).toMatchObject({ step: 3, done: true });
    expect((await call('POST', `/scenarios/runs/${runId}/next`)).status).toBe(409);
    expect((await call('POST', '/scenarios/inconnu/runs', {})).status).toBe(404);

    const runTraces = await call('GET', `/audit/traces?scenarioRunId=${runId}`);
    expect((runTraces.json.traces as unknown[]).length).toBeGreaterThanOrEqual(4);
  });

  it('limite le débit de /chat par IP (429 + Retry-After)', async () => {
    let limited: { status: number; headers: Headers } | undefined;
    for (let i = 0; i < 12 && !limited; i += 1) {
      const response = await call('POST', '/chat', {
        message: 'Le travail forcé est-il autorisé ?',
      });
      if (response.status === 429) limited = response;
    }
    expect(limited?.status).toBe(429);
    expect(Number(limited?.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});
