/**
 * Serveur simulé (mode démonstration uniquement) : reproduit le contrat de l'API /api/v1
 * en mémoire, pour développer et tester le site sans le backend.
 * Les durées affichées dans les traces sont mesurées réellement ; aucune métrique n'est inventée.
 */
import { createHash, randomUUID } from 'node:crypto';
import type { Locale } from '@/i18n/config';
import { MOCK_LEGAL_TEXTS } from './legal-texts';
import {
  citationFor,
  MOCK_AGENTS,
  MOCK_ANSWERS,
  MOCK_OUT_OF_SCOPE,
  MOCK_SCENARIOS,
  type MockCitation,
} from './mock-data';

interface MockStep {
  order: number;
  type: string;
  agent?: string;
  summary: string;
  data: unknown;
  durationMs: number;
}

interface MockTrace {
  id: string;
  createdAt: string;
  conversationId: string | null;
  scenarioRunId: string | null;
  verdict: string;
  hash: string;
  prevHash: string | null;
  steps: MockStep[];
}

interface MockRunStep {
  runId: string;
  step: number;
  totalSteps: number;
  event: { title: string; description: string; injectedAt: string };
  responses: unknown[];
  gaps: unknown[];
  done: boolean;
}

interface MockRun {
  runId: string;
  scenarioId: string;
  locale: Locale;
  createdAt: string;
  steps: MockRunStep[];
}

// État en mémoire, partagé par les requêtes du processus Next.js
interface MockState {
  traces: MockTrace[];
  runs: Map<string, MockRun>;
}
const store = globalThis as typeof globalThis & { __sonahMock?: MockState };
const state: MockState = (store.__sonahMock ??= {
  traces: [],
  runs: new Map<string, MockRun>(),
});

function hashTrace(trace: Omit<MockTrace, 'hash'>): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        id: trace.id,
        createdAt: trace.createdAt,
        conversationId: trace.conversationId,
        scenarioRunId: trace.scenarioRunId,
        verdict: trace.verdict,
        prevHash: trace.prevHash,
        steps: trace.steps,
      }),
    )
    .digest('hex');
}

/** Mesure la durée réelle d'une étape simulée. */
function timed<T>(work: () => T): { value: T; durationMs: number } {
  const start = performance.now();
  const value = work();
  return { value, durationMs: Math.round((performance.now() - start) * 100) / 100 };
}

function appendTrace(input: {
  conversationId: string | null;
  scenarioRunId: string | null;
  verdict: string;
  steps: MockStep[];
}): MockTrace {
  const prev = state.traces.at(-1);
  const base = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    prevHash: prev?.hash ?? null,
    ...input,
  };
  const trace: MockTrace = { ...base, hash: hashTrace(base) };
  state.traces.push(trace);
  return trace;
}

function buildSteps(input: {
  question: string;
  agent: string;
  verdict: string;
  citations: readonly MockCitation[];
  reply: string;
}): MockStep[] {
  const retrieval = timed(() =>
    input.citations.map((citation) => ({
      documentId: citation.documentId,
      reference: `${citation.title}, ${citation.reference}`,
      status: citation.status,
    })),
  );
  const gate = timed(() => ({
    citationsFound: input.citations.length,
    verdict: input.verdict,
  }));
  return [
    {
      order: 1,
      type: 'input',
      summary: 'Question reçue',
      data: { message: input.question, mock: true },
      durationMs: 0,
    },
    {
      order: 2,
      type: 'retrieval',
      summary: `${input.citations.length} article(s) retrouvé(s) (correspondance par mots-clés en mode démonstration)`,
      data: { hits: retrieval.value },
      durationMs: retrieval.durationMs,
    },
    {
      order: 3,
      type: 'gate',
      summary: `Contrôle de preuve : ${input.verdict}`,
      data: gate.value,
      durationMs: gate.durationMs,
    },
    {
      order: 4,
      type: 'agent',
      agent: input.agent,
      summary: 'Rédaction de la réponse à partir des extraits retrouvés (réponse préenregistrée)',
      data: { model: 'mock', citations: input.citations.map((citation) => citation.index) },
      durationMs: 0,
    },
    {
      order: 5,
      type: 'output',
      summary: 'Réponse renvoyée',
      data: { verdict: input.verdict, length: input.reply.length },
      durationMs: 0,
    },
  ];
}

// ─── Points d'accès simulés ──────────────────────────────────────

export function mockChat(body: {
  message?: unknown;
  conversationId?: unknown;
  language?: unknown;
}): { status: number; body: unknown; headers?: Record<string, string> } {
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return { status: 400, body: { error: 'message requis' } };
  // Permet de tester l'affichage d'une limite de débit
  if (message.toLowerCase().includes('test-429')) {
    return { status: 429, body: { error: 'Trop de requêtes' }, headers: { 'Retry-After': '30' } };
  }
  if (message.toLowerCase().includes('test-503')) {
    return { status: 503, body: { error: 'Service indisponible' } };
  }

  const language: Locale = body.language === 'en' ? 'en' : 'fr';
  const conversationId =
    typeof body.conversationId === 'string' && body.conversationId
      ? body.conversationId
      : randomUUID();
  const answer = MOCK_ANSWERS.find((candidate) => candidate.match.test(message));
  const citations = answer ? answer.texts.map((textId, i) => citationFor(i + 1, textId)) : [];
  const verdict = answer?.verdict ?? 'OUT_OF_SCOPE';
  const reply = answer ? answer.reply[language] : MOCK_OUT_OF_SCOPE[language];

  const trace = appendTrace({
    conversationId,
    scenarioRunId: null,
    verdict,
    steps: buildSteps({ question: message, agent: 'sonah', verdict, citations, reply }),
  });

  return {
    status: 200,
    body: {
      conversationId,
      reply,
      language,
      verdict,
      citations,
      sources: citations.map((citation) => ({
        title: citation.title,
        reference: citation.reference,
        url: citation.url,
      })),
      traceId: trace.id,
    },
  };
}

export function mockListTraces(params: URLSearchParams): unknown {
  const conversationId = params.get('conversationId');
  const limit = Math.min(Number(params.get('limit')) || 20, 100);
  const traces = state.traces
    .filter((trace) => !conversationId || trace.conversationId === conversationId)
    .slice(-limit)
    .reverse()
    .map(({ id, createdAt, conversationId: conv, verdict, hash }) => ({
      id,
      createdAt,
      conversationId: conv,
      verdict,
      hash,
    }));
  return { traces };
}

export function mockGetTrace(id: string): MockTrace | undefined {
  return state.traces.find((trace) => trace.id === id);
}

export function mockVerify(): unknown {
  let prevHash: string | null = null;
  for (const trace of state.traces) {
    const { hash, ...rest } = trace;
    if (trace.prevHash !== prevHash || hashTrace(rest) !== hash) {
      return { valid: false, count: state.traces.length, brokenAt: trace.id };
    }
    prevHash = hash;
  }
  return { valid: true, count: state.traces.length };
}

export function mockAgents(locale: Locale): unknown {
  return MOCK_AGENTS.map((agent) => ({
    id: agent.id,
    name: agent.name[locale],
    role: agent.role[locale],
    mandate: agent.mandate[locale],
    sources: agent.sources[locale],
  }));
}

function scenarioSummary(scenario: (typeof MOCK_SCENARIOS)[number], locale: Locale): unknown {
  return {
    id: scenario.id,
    title: scenario.title[locale],
    description: scenario.description[locale],
    totalSteps: scenario.events.length,
    domain: scenario.domain[locale],
  };
}

export function mockScenarios(locale: Locale): unknown {
  return MOCK_SCENARIOS.map((scenario) => scenarioSummary(scenario, locale));
}

export function mockStartRun(scenarioId: string, locale: Locale): unknown | undefined {
  const scenario = MOCK_SCENARIOS.find((candidate) => candidate.id === scenarioId);
  if (!scenario) return undefined;
  const runId = randomUUID();
  state.runs.set(runId, {
    runId,
    scenarioId,
    locale,
    createdAt: new Date().toISOString(),
    steps: [],
  });
  return { runId, scenario: scenarioSummary(scenario, locale), totalSteps: scenario.events.length };
}

export function mockNextEvent(runId: string): MockRunStep | 'done' | undefined {
  const run = state.runs.get(runId);
  if (!run) return undefined;
  const scenario = MOCK_SCENARIOS.find((candidate) => candidate.id === run.scenarioId);
  if (!scenario) return undefined;
  const index = run.steps.length;
  const event = scenario.events[index];
  if (!event) return 'done';
  const locale = run.locale;

  const responses = event.responses.map((response) => {
    const agent = MOCK_AGENTS.find((candidate) => candidate.id === response.agentId);
    const citations = response.texts.map((textId, i) => citationFor(i + 1, textId));
    const message = response.message[locale];
    const trace = appendTrace({
      conversationId: null,
      scenarioRunId: runId,
      verdict: response.verdict,
      steps: [
        {
          order: 1,
          type: 'input',
          summary: `Événement ${index + 1} : ${event.title[locale]}`,
          data: { description: event.description[locale], mock: true },
          durationMs: 0,
        },
        ...buildSteps({
          question: event.description[locale],
          agent: agent?.name[locale] ?? response.agentId,
          verdict: response.verdict,
          citations,
          reply: message,
        }).slice(1),
      ],
    });
    return {
      agentId: response.agentId,
      agentName: agent?.name[locale] ?? response.agentId,
      role: agent?.role[locale] ?? '',
      message,
      verdict: response.verdict,
      citations,
      traceId: trace.id,
    };
  });

  const step: MockRunStep = {
    runId,
    step: index + 1,
    totalSteps: scenario.events.length,
    event: {
      title: event.title[locale],
      description: event.description[locale],
      injectedAt: new Date().toISOString(),
    },
    responses,
    gaps: event.gaps.map((gap) => ({
      id: gap.id,
      title: gap.title[locale],
      description: gap.description[locale],
      globalExample: gap.globalExample[locale],
      sources: gap.sources,
    })),
    done: index + 1 >= scenario.events.length,
  };
  run.steps.push(step);
  return step;
}

export function mockGetRun(runId: string): unknown | undefined {
  const run = state.runs.get(runId);
  if (!run) return undefined;
  const scenario = MOCK_SCENARIOS.find((candidate) => candidate.id === run.scenarioId);
  const totalSteps = scenario?.events.length ?? run.steps.length;
  // Même forme que l'API réelle (ScenarioRunView)
  return {
    runId,
    scenario: scenario ? scenarioSummary(scenario, run.locale) : { id: run.scenarioId },
    language: run.locale,
    status: run.steps.length >= totalSteps ? 'COMPLETED' : 'RUNNING',
    currentStep: run.steps.length,
    totalSteps,
    createdAt: run.createdAt,
    steps: run.steps,
  };
}

export function mockDocument(id: string): unknown | undefined {
  const text = MOCK_LEGAL_TEXTS[id];
  if (!text) return undefined;
  return {
    id: text.id,
    title: `${text.title} — ${text.reference}`,
    reference: text.reference,
    content: text.content,
    source: text.url,
    category: text.category,
    metadata: { sourceId: text.sourceId, status: text.status, mock: true },
  };
}
