import { z } from 'zod';

/** Mode démonstration : les appels partent vers les routes simulées de Next.js. */
export const IS_API_MOCK = process.env.NEXT_PUBLIC_API_MOCK === '1';

const API_BASE_PATH = IS_API_MOCK ? '/api/mock/v1' : '/api/v1';
const REQUEST_TIMEOUT_MS = 45_000;
// Une étape de scénario fait répondre plusieurs agents à la suite : délai plus long
const SCENARIO_STEP_TIMEOUT_MS = 120_000;

export type ApiLanguage = 'fr' | 'en';

// ─── Schémas ──────────────────────────────────────────────────────

export const KNOWN_VERDICTS = [
  'ANSWERED_WITH_CITATIONS',
  'INSUFFICIENT_EVIDENCE',
  'CONFLICT_BETWEEN_TEXTS',
  'OUTDATED_TEXT',
  'REFER_TO_HUMAN',
  'OUT_OF_SCOPE',
  'PROCEDURE_GUIDANCE',
] as const;
export type KnownVerdict = (typeof KNOWN_VERDICTS)[number];

export const KNOWN_STATUSES = ['in_force', 'amended', 'repealed'] as const;
export type CitationStatus = (typeof KNOWN_STATUSES)[number];

// Les valeurs inconnues sont tolérées (affichées comme « non précisé ») plutôt que rejetées
const verdictSchema = z.string();
const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

export const citationSchema = z.object({
  index: z.number().int(),
  documentId: z.string(),
  sourceId: z.string().nullish(),
  title: z.string(),
  reference: z.string().nullish(),
  excerpt: z.string().default(''),
  url: nullableString,
  status: z.string().nullish(),
});

export const sourceSchema = z.object({
  title: z.string(),
  reference: nullableString,
  url: nullableString,
});

// ─── Fiche démarche (champs optionnels de /chat) ──────────────────
// Tolérance : une fiche mal formée est ignorée (catch) au lieu de faire échouer toute la réponse.

export const ANSWER_TYPES = ['procedure', 'legal', 'orientation'] as const;
export type AnswerType = (typeof ANSWER_TYPES)[number];

const stringList = z.array(z.string()).default([]);

export const procedureSchema = z.object({
  id: z.string().default(''),
  title: z.string(),
  authority: z
    .object({ name: z.string(), level: nullableString })
    .nullish()
    .transform((value) => value ?? undefined),
  where: stringList,
  documents: stringList,
  steps: z
    .array(z.object({ order: z.number(), description: z.string() }))
    .default([])
    .transform((steps) => [...steps].sort((a, b) => a.order - b.order)),
  // L'API envoie amountFcfa ; amount_fcfa (format des fiches) reste accepté
  cost: z
    .object({
      amount_fcfa: z.number().nullish(),
      amountFcfa: z.number().nullish(),
      description: z
        .string()
        .nullish()
        .transform((value) => value ?? null),
    })
    .nullish()
    .transform((value) =>
      value
        ? {
            amount_fcfa: value.amountFcfa ?? value.amount_fcfa ?? null,
            description: value.description,
          }
        : null,
    ),
  delay: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  validity: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  sources: z
    .array(z.object({ title: z.string(), url: nullableString, publisher: nullableString }))
    .default([]),
  verifiedAt: nullableString,
  unverified: z.array(z.object({ field: z.string(), note: z.string().default('') })).default([]),
});

export const chatResponseSchema = z.object({
  conversationId: z.string(),
  reply: z.string(),
  language: z.string().optional(),
  verdict: verdictSchema.optional(),
  citations: z.array(citationSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  traceId: nullableString,
  answerType: z.enum(ANSWER_TYPES).optional().catch(undefined),
  procedure: procedureSchema.optional().catch(undefined),
});

export const traceSummarySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  kind: z.string().nullish(),
  conversationId: z.string().nullish(),
  scenarioRunId: z.string().nullish(),
  agentId: z.string().nullish(),
  verdict: verdictSchema.nullish(),
  model: z.string().nullish(),
  stepCount: z.number().nullish(),
  hash: z.string(),
});

export const traceListSchema = z.object({ traces: z.array(traceSummarySchema) });

export const traceStepSchema = z.object({
  order: z.number(),
  type: z.string(),
  agent: z.string().nullish(),
  summary: z.string().default(''),
  data: z.unknown().optional(),
  durationMs: z.number().nullish(),
});

export const traceSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  conversationId: z.string().nullish(),
  scenarioRunId: z.string().nullish(),
  kind: z.string().nullish(),
  agentId: z.string().nullish(),
  verdict: verdictSchema.nullish(),
  model: z.string().nullish(),
  promptVersion: z.string().nullish(),
  sequence: z.number().nullish(),
  hash: z.string(),
  prevHash: z.string().nullish(),
  steps: z.array(traceStepSchema).default([]),
});

export const verifySchema = z.object({
  valid: z.boolean(),
  count: z.number(),
  brokenAt: z.union([z.string(), z.number()]).nullish(),
});

export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  mandate: z.string().default(''),
  sources: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
});
export const agentListSchema = z.array(agentSchema);

export const scenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  totalSteps: z.number().int(),
  domain: z.string().default(''),
});
export const scenarioListSchema = z.array(scenarioSchema);

export const runStartSchema = z.object({
  runId: z.string(),
  scenario: z.unknown().optional(),
  totalSteps: z.number().int(),
});

export const agentResponseSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  role: z.string().default(''),
  message: z.string(),
  verdict: verdictSchema.nullish(),
  citations: z.array(citationSchema).default([]),
  traceId: nullableString,
});

export const gapSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  globalExample: nullableString,
  sources: z.array(z.string()).default([]),
});

export const runStepSchema = z.object({
  runId: z.string(),
  step: z.number().int(),
  totalSteps: z.number().int(),
  event: z.object({
    title: z.string(),
    description: z.string().default(''),
    injectedAt: z.string().nullish(),
  }),
  responses: z.array(agentResponseSchema).default([]),
  gaps: z.array(gapSchema).default([]),
  done: z.boolean(),
});

/**
 * GET /scenarios/runs/:runId (reprise d'une exécution) : `status` vaut RUNNING ou COMPLETED.
 * `done` est déduit du statut, ou du nombre d'étapes publiées si le statut est absent.
 */
export const runStateSchema = z
  .object({
    runId: z.string(),
    scenario: scenarioSchema.partial().nullish(),
    language: z.string().nullish(),
    status: z.string().nullish(),
    currentStep: z.number().int().nullish(),
    totalSteps: z.number().int(),
    steps: z.array(runStepSchema).default([]),
  })
  .transform((run) => ({
    ...run,
    done: run.status
      ? run.status === 'COMPLETED'
      : run.steps.length >= run.totalSteps || run.steps.some((step) => step.done),
  }));

export const documentSchema = z.object({
  id: z.string(),
  sourceId: z.string().nullish(),
  type: z.string().nullish(),
  title: z.string(),
  reference: z.string().nullish(),
  content: z.string().default(''),
  source: z.string().nullish(),
  category: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
});

export type Citation = z.infer<typeof citationSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type Procedure = z.infer<typeof procedureSchema>;
export type TraceSummary = z.infer<typeof traceSummarySchema>;
export type Trace = z.infer<typeof traceSchema>;
export type TraceStep = z.infer<typeof traceStepSchema>;
export type VerifyResult = z.infer<typeof verifySchema>;
export type Agent = z.infer<typeof agentSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type RunStart = z.infer<typeof runStartSchema>;
export type AgentResponse = z.infer<typeof agentResponseSchema>;
export type Gap = z.infer<typeof gapSchema>;
export type RunStep = z.infer<typeof runStepSchema>;
export type RunState = z.infer<typeof runStateSchema>;
export type LegalDocument = z.infer<typeof documentSchema>;

// ─── Erreurs ──────────────────────────────────────────────────────

/** Le service n'est pas joignable (réseau, 502, 503, délai dépassé). */
export class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

/** Trop de requêtes (429) : `retryAfterSeconds` vient de l'en-tête Retry-After s'il existe. */
export class ApiRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number | undefined) {
    super('Trop de requêtes');
    this.name = 'ApiRateLimitError';
  }
}

export class ApiNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiNotFoundError';
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export class ApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiValidationError';
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(header);
  if (Number.isNaN(date)) return undefined;
  return Math.max(1, Math.ceil((date - Date.now()) / 1000));
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  body?: unknown,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error) {
    throw new ApiUnavailableError(
      error instanceof Error ? error.message : 'Impossible de joindre le service',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    let retryAfter = parseRetryAfter(response.headers.get('retry-after'));
    if (retryAfter === undefined) {
      // Certaines API renvoient le délai dans le corps de la réponse
      const payload: unknown = await response.json().catch(() => null);
      const parsed = z.object({ retryAfter: z.number() }).safeParse(payload);
      if (parsed.success) retryAfter = Math.ceil(parsed.data.retryAfter);
    }
    throw new ApiRateLimitError(retryAfter);
  }
  if (response.status === 404) {
    throw new ApiNotFoundError(`Introuvable (${path})`);
  }
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    throw new ApiUnavailableError(`Service indisponible (${response.status})`);
  }
  if (!response.ok) {
    throw new ApiRequestError(`La requête a échoué (${response.status})`, response.status);
  }

  const json: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiValidationError('Réponse inattendue du serveur');
  }
  return parsed.data;
}

// ─── Points d'accès ───────────────────────────────────────────────

export function sendChatMessage(input: {
  message: string;
  conversationId?: string;
  language?: 'fr' | 'en';
}): Promise<ChatResponse> {
  return request('POST', '/chat', chatResponseSchema, input);
}

export function listTraces(params: { conversationId?: string; limit?: number }): Promise<{
  traces: TraceSummary[];
}> {
  const query = new URLSearchParams();
  if (params.conversationId) query.set('conversationId', params.conversationId);
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString();
  return request('GET', `/audit/traces${suffix ? `?${suffix}` : ''}`, traceListSchema);
}

export function getTrace(id: string): Promise<Trace> {
  return request('GET', `/audit/traces/${encodeURIComponent(id)}`, traceSchema);
}

export function verifyAuditChain(): Promise<VerifyResult> {
  return request('GET', '/audit/verify', verifySchema);
}

export function listAgents(language: ApiLanguage): Promise<Agent[]> {
  return request('GET', `/agents?language=${language}`, agentListSchema);
}

export function listScenarios(language: ApiLanguage): Promise<Scenario[]> {
  return request('GET', `/scenarios?language=${language}`, scenarioListSchema);
}

export function startScenarioRun(scenarioId: string, language: ApiLanguage): Promise<RunStart> {
  return request('POST', `/scenarios/${encodeURIComponent(scenarioId)}/runs`, runStartSchema, {
    language,
  });
}

export function releaseNextEvent(runId: string): Promise<RunStep> {
  return request(
    'POST',
    `/scenarios/runs/${encodeURIComponent(runId)}/next`,
    runStepSchema,
    {},
    SCENARIO_STEP_TIMEOUT_MS,
  );
}

export function getScenarioRun(runId: string): Promise<RunState> {
  return request('GET', `/scenarios/runs/${encodeURIComponent(runId)}`, runStateSchema);
}

export function getDocument(id: string): Promise<LegalDocument> {
  return request('GET', `/documents/${encodeURIComponent(id)}`, documentSchema);
}
