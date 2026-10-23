/**
 * SONAH evaluation runner.
 *
 * Calls a running SONAH API (no extra dependency, Node >= 20 global fetch) and measures:
 *  - retrieval: hit@1/3/5 and MRR@10 on expected article references (POST /search)
 *  - answering: verdict accuracy, citation validity, out-of-scope refusal, PII echo, latency (POST /chat)
 * Every proportion is reported with a Wilson 95% confidence interval.
 *
 * Usage (from the repository root):
 *   npx ts-node --transpile-only eval/run-eval.ts [options]
 *   node --experimental-strip-types eval/run-eval.ts [options]      (Node >= 22.6)
 *
 * Options:
 *   --base-url <url>      API base URL (default: $BASE_URL or http://localhost:4000/api/v1)
 *   --questions <file>    gold set (default: eval/questions.jsonl)
 *   --aliases <file>      canonical -> deployed sourceId map (default: eval/source-aliases.json)
 *   --search-only         skip /chat (retrieval metrics only)
 *   --skip-missing        skip every item with `requires_source`, without probing the API
 *   --category <name>     only run one category
 *   --limit <n>           only run the first n items
 *   --delay <ms>          pause between /chat calls (quota-friendly, default 0)
 *   --chat-sample <n>     run /search on every item but /chat on n evenly spaced items only
 *   --label <text>        free-text label stored in the result file (e.g. "S3 llm-off")
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

type Verdict =
  | 'ANSWERED_WITH_CITATIONS'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONFLICT_BETWEEN_TEXTS'
  | 'OUTDATED_TEXT'
  | 'REFER_TO_HUMAN'
  | 'OUT_OF_SCOPE';

interface GoldItem {
  id: string;
  language: 'fr' | 'en';
  question: string;
  category: string;
  expected_sources: string[];
  expected_references: string[];
  expected_verdict: Verdict;
  accepted_verdicts?: Verdict[];
  requires_source?: string;
  references_verified?: boolean;
  scenario?: string;
  expect_pii_redacted?: boolean;
  note?: string;
}

interface SearchHit {
  sourceId: string;
  reference: string | null;
  score: number;
}

interface Citation {
  sourceId?: string;
  reference?: string;
  status?: string;
}

interface ChatOutcome {
  ok: boolean;
  httpStatus: number;
  latencyMs: number;
  verdict: string | null;
  citations: Citation[];
  traceId: string | null;
  reply: string;
  error?: string;
}

interface ItemResult {
  id: string;
  category: string;
  language: string;
  scenario?: string;
  skipped?: string;
  retrieval?: {
    rank: number | null;
    sourceRank: number | null;
    latencyMs: number;
    top: Array<{ sourceId: string; reference: string | null; score: number }>;
  };
  chat?: ChatOutcome & {
    verdictCorrect: boolean | null;
    validCitations: number;
    totalCitations: number;
    piiEchoed?: boolean;
  };
}

// ---------------------------------------------------------------- arguments

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const ROOT = path.resolve(__dirname_safe(), '..');
const BASE_URL = String(
  args['base-url'] ?? process.env.BASE_URL ?? 'http://localhost:4000/api/v1',
).replace(/\/$/, '');
const QUESTIONS = String(args.questions ?? path.join(ROOT, 'eval', 'questions.jsonl'));
const ALIASES = String(args.aliases ?? path.join(ROOT, 'eval', 'source-aliases.json'));
const SEARCH_ONLY = args['search-only'] === true;
const SKIP_MISSING = args['skip-missing'] === true;
const DELAY_MS = Number(args.delay ?? 0);
const CHAT_SAMPLE = typeof args['chat-sample'] === 'string' ? Number(args['chat-sample']) : null;
/** HTTP 429 (API rate limit): wait for Retry-After, then retry, at most this many times. */
const MAX_RATE_LIMIT_RETRIES = 6;
const LABEL = typeof args.label === 'string' ? args.label : '';

function __dirname_safe(): string {
  // Works under ts-node (CommonJS) and under node --experimental-strip-types (ESM).
  if (typeof __dirname !== 'undefined') return __dirname;
  return path.join(process.cwd(), 'eval');
}

// ---------------------------------------------------------------- helpers

/** Wilson score interval, 95 % (z = 1.96). */
export function wilson(
  successes: number,
  n: number,
  z = 1.96,
): { p: number; low: number; high: number } {
  if (n === 0) return { p: Number.NaN, low: Number.NaN, high: Number.NaN };
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { p, low: Math.max(0, centre - margin), high: Math.min(1, centre + margin) };
}

/** "Article premier" -> "1", "Art. 47 bis" -> "47 bis", "Section 29" -> "29", "Préambule" -> "preambule". */
export function articleKey(reference: string | null | undefined): string | null {
  if (!reference) return null;
  const lower = reference.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (lower.includes('preambule') || lower.includes('preamble')) return 'preambule';
  if (/\b(premier|1er|first)\b/.test(lower)) return '1';
  const match = /(\d+)(?:\s*(bis|ter|quater))?/.exec(lower);
  if (!match) return null;
  return match[2] ? `${match[1]} ${match[2]}` : (match[1] ?? null);
}

function percentile(values: number[], q: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[index] ?? Number.NaN;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function postJson(
  route: string,
  body: unknown,
): Promise<{ status: number; json: unknown; ms: number }> {
  let started = performance.now();
  let response = await fetch(`${BASE_URL}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  // The API rate-limits /search and /chat per IP: wait and retry (latency counts the last attempt only)
  for (let attempt = 0; response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    const retryAfter = Number(response.headers.get('retry-after') ?? '5');
    await response.text();
    await sleep((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5) * 1000 + 250);
    started = performance.now();
    response = await fetch(`${BASE_URL}${route}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  const text = await response.text();
  const ms = performance.now() - started;
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: response.status, json, ms };
}

function loadGold(): GoldItem[] {
  return readFileSync(QUESTIONS, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as GoldItem);
}

function loadAliases(): Record<string, string[]> {
  if (!existsSync(ALIASES)) return {};
  const raw = JSON.parse(readFileSync(ALIASES, 'utf8')) as Record<string, string | string[]>;
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('_')) continue;
    out[key] = Array.isArray(value) ? value : [value];
  }
  return out;
}

const aliases = loadAliases();
const resolve = (canonical: string): string[] => aliases[canonical] ?? [canonical];
const expectedSourceIds = (item: GoldItem): Set<string> =>
  new Set(item.expected_sources.flatMap(resolve));

// ---------------------------------------------------------------- API calls

async function search(
  query: string,
  topK: number,
  sourceIds?: string[],
): Promise<{ hits: SearchHit[]; ms: number }> {
  const { status, json, ms } = await postJson('/search', {
    query,
    topK,
    ...(sourceIds ? { sourceIds } : {}),
  });
  if (status >= 400)
    throw new Error(`/search HTTP ${status}: ${JSON.stringify(json).slice(0, 200)}`);
  const results = ((json as { results?: SearchHit[] })?.results ?? []).map((r) => ({
    sourceId: r.sourceId,
    reference: r.reference ?? null,
    score: Number(r.score),
  }));
  return { hits: results, ms };
}

/** Accepts both the gated contract ({reply, verdict, citations, traceId}) and the legacy one ({reply, sources}). */
async function chat(message: string, language: string): Promise<ChatOutcome> {
  try {
    const { status, json, ms } = await postJson('/chat', { message, language });
    const body = (json ?? {}) as Record<string, unknown>;
    const citations: Citation[] = Array.isArray(body.citations)
      ? (body.citations as Citation[])
      : Array.isArray(body.sources)
        ? (body.sources as Array<{ reference?: string }>).map((s) => ({ reference: s.reference }))
        : [];
    return {
      ok: status < 400,
      httpStatus: status,
      latencyMs: ms,
      verdict: typeof body.verdict === 'string' ? body.verdict : null,
      citations,
      traceId: typeof body.traceId === 'string' ? body.traceId : null,
      reply: typeof body.reply === 'string' ? body.reply : '',
      ...(status >= 400 ? { error: JSON.stringify(json).slice(0, 300) } : {}),
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: 0,
      latencyMs: 0,
      verdict: null,
      citations: [],
      traceId: null,
      reply: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** A required source is present if a source-filtered search returns at least one fragment. */
async function presentSources(items: GoldItem[]): Promise<Map<string, boolean>> {
  const required = [
    ...new Set(items.flatMap((item) => (item.requires_source ? [item.requires_source] : []))),
  ];
  const presence = new Map<string, boolean>();
  for (const source of required) {
    if (SKIP_MISSING) {
      presence.set(source, false);
      continue;
    }
    try {
      const probe = items.find((item) => item.requires_source === source)?.question ?? source;
      const { hits } = await search(probe, 1, resolve(source));
      presence.set(source, hits.length > 0);
    } catch {
      presence.set(source, false);
    }
  }
  return presence;
}

// ---------------------------------------------------------------- evaluation

const PII_PATTERNS = [/\b\d{9}\b/, /\b6\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}\b/, /\+237\s?\d/];

async function evaluateItem(
  item: GoldItem,
  present: Map<string, boolean>,
  runChat = !SEARCH_ONLY,
): Promise<ItemResult> {
  const base: ItemResult = {
    id: item.id,
    category: item.category,
    language: item.language,
    scenario: item.scenario,
  };
  if (item.requires_source && !present.get(item.requires_source)) {
    return { ...base, skipped: `source ${item.requires_source} absent` };
  }
  const expected = expectedSourceIds(item);
  const expectedKeys = new Set(
    item.expected_references.map(articleKey).filter((k): k is string => k !== null),
  );

  // Retrieval: top-20 is also used as the "retrieved set" for citation validity
  const { hits, ms } = await search(item.question, 20);
  const matches = (hit: SearchHit): boolean => {
    const key = articleKey(hit.reference);
    return expected.has(hit.sourceId) && key !== null && expectedKeys.has(key);
  };
  const rankIndex = expectedKeys.size > 0 ? hits.slice(0, 10).findIndex(matches) : -1;
  const sourceIndex =
    expected.size > 0 ? hits.slice(0, 10).findIndex((hit) => expected.has(hit.sourceId)) : -1;
  const result: ItemResult = {
    ...base,
    retrieval: {
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      sourceRank: sourceIndex >= 0 ? sourceIndex + 1 : null,
      latencyMs: ms,
      top: hits
        .slice(0, 5)
        .map((h) => ({ sourceId: h.sourceId, reference: h.reference, score: h.score })),
    },
  };

  if (!runChat) return result;
  if (DELAY_MS > 0) await sleep(DELAY_MS);

  const outcome = await chat(item.question, item.language);
  const accepted = new Set(item.accepted_verdicts ?? [item.expected_verdict]);
  const retrieved = new Set(hits.map((h) => `${h.sourceId}|${articleKey(h.reference)}`));
  const retrievedRefs = new Set(hits.map((h) => articleKey(h.reference)));
  const valid = outcome.citations.filter((c) =>
    c.sourceId
      ? retrieved.has(`${c.sourceId}|${articleKey(c.reference)}`)
      : retrievedRefs.has(articleKey(c.reference)),
  ).length;
  const piiEchoed = item.expect_pii_redacted
    ? PII_PATTERNS.some((p) => p.test(outcome.reply))
    : undefined;
  result.chat = {
    ...outcome,
    reply: outcome.reply.slice(0, 600),
    verdictCorrect: outcome.verdict === null ? null : accepted.has(outcome.verdict as Verdict),
    validCitations: valid,
    totalCitations: outcome.citations.length,
    ...(piiEchoed !== undefined ? { piiEchoed } : {}),
  };
  return result;
}

interface Metric {
  name: string;
  successes: number;
  n: number;
  definition: string;
}

function summarise(
  items: GoldItem[],
  results: ItemResult[],
): { metrics: Metric[]; latency: Record<string, number> } {
  const byId = new Map(items.map((item) => [item.id, item]));
  const run = results.filter((r) => !r.skipped);
  const withRefs = run.filter(
    (r) => (byId.get(r.id)?.expected_references.length ?? 0) > 0 && r.retrieval,
  );
  const withSources = run.filter(
    (r) => (byId.get(r.id)?.expected_sources.length ?? 0) > 0 && r.retrieval,
  );
  const hitAt = (k: number): number =>
    withRefs.filter((r) => (r.retrieval?.rank ?? Infinity) <= k).length;
  const metrics: Metric[] = [
    {
      name: 'retrieval hit@1',
      successes: hitAt(1),
      n: withRefs.length,
      definition: 'expected article ranked 1st by /search',
    },
    {
      name: 'retrieval hit@3',
      successes: hitAt(3),
      n: withRefs.length,
      definition: 'expected article in top 3',
    },
    {
      name: 'retrieval hit@5',
      successes: hitAt(5),
      n: withRefs.length,
      definition: 'expected article in top 5',
    },
    {
      name: 'source hit@5',
      successes: withSources.filter((r) => (r.retrieval?.sourceRank ?? Infinity) <= 5).length,
      n: withSources.length,
      definition: 'any fragment of an expected source in top 5',
    },
  ];

  const chats = run.filter((r) => r.chat);
  const latency: Record<string, number> = {
    search_p50_ms: percentile(
      run.flatMap((r) => (r.retrieval ? [r.retrieval.latencyMs] : [])),
      0.5,
    ),
    search_p95_ms: percentile(
      run.flatMap((r) => (r.retrieval ? [r.retrieval.latencyMs] : [])),
      0.95,
    ),
    mrr_at_10: withRefs.length
      ? withRefs.reduce((sum, r) => sum + (r.retrieval?.rank ? 1 / r.retrieval.rank : 0), 0) /
        withRefs.length
      : Number.NaN,
  };
  if (chats.length > 0) {
    const okChats = chats.filter((r) => r.chat?.ok);
    const withVerdict = okChats.filter((r) => r.chat?.verdictCorrect !== null);
    const oos = okChats.filter((r) => byId.get(r.id)?.expected_verdict === 'OUT_OF_SCOPE');
    const shouldAbstain = okChats.filter((r) =>
      ['OUT_OF_SCOPE', 'INSUFFICIENT_EVIDENCE'].includes(byId.get(r.id)?.expected_verdict ?? ''),
    );
    const totalCitations = okChats.reduce((s, r) => s + (r.chat?.totalCitations ?? 0), 0);
    const validCitations = okChats.reduce((s, r) => s + (r.chat?.validCitations ?? 0), 0);
    const pii = okChats.filter((r) => r.chat?.piiEchoed !== undefined);
    const answeredGrounded = okChats.filter(
      (r) =>
        r.chat?.verdict === 'ANSWERED_WITH_CITATIONS' ||
        (r.chat?.verdict === null && (r.chat?.totalCitations ?? 0) > 0),
    );
    metrics.push(
      {
        name: 'chat availability',
        successes: okChats.length,
        n: chats.length,
        definition: '/chat returned HTTP < 400',
      },
      {
        name: 'verdict accuracy',
        successes: withVerdict.filter((r) => r.chat?.verdictCorrect).length,
        n: withVerdict.length,
        definition: 'returned verdict in accepted_verdicts (items whose API returns a verdict)',
      },
      {
        name: 'out-of-scope refusal',
        successes: oos.filter((r) =>
          r.chat?.verdict !== null
            ? r.chat?.verdict === 'OUT_OF_SCOPE'
            : (r.chat?.totalCitations ?? 0) === 0,
        ).length,
        n: oos.length,
        definition: 'OUT_OF_SCOPE verdict (legacy API: no citation)',
      },
      {
        name: 'unsupported-answer avoidance',
        successes: shouldAbstain.filter((r) => !answeredGrounded.includes(r)).length,
        n: shouldAbstain.length,
        definition: 'items expected OUT_OF_SCOPE/INSUFFICIENT_EVIDENCE not answered as if grounded',
      },
      {
        name: 'citation validity',
        successes: validCitations,
        n: totalCitations,
        definition: 'cited (source, article) present in /search top-20 for the same question',
      },
      {
        name: 'PII not echoed (S2)',
        successes: pii.filter((r) => r.chat?.piiEchoed === false).length,
        n: pii.length,
        definition: 'synthetic identifiers absent from the reply',
      },
      {
        name: 'traceId returned',
        successes: okChats.filter((r) => r.chat?.traceId).length,
        n: okChats.length,
        definition: 'response carries an audit traceId',
      },
    );
    latency.chat_p50_ms = percentile(
      okChats.map((r) => r.chat?.latencyMs ?? 0),
      0.5,
    );
    latency.chat_p95_ms = percentile(
      okChats.map((r) => r.chat?.latencyMs ?? 0),
      0.95,
    );
  }
  return { metrics, latency };
}

const fmt = (x: number): string => (Number.isNaN(x) ? 'n/a' : x.toFixed(3));

function markdown(
  stamp: string,
  items: GoldItem[],
  results: ItemResult[],
  summary: ReturnType<typeof summarise>,
  present: Map<string, boolean>,
): string {
  const skipped = results.filter((r) => r.skipped);
  const lines = [
    `# SONAH evaluation - ${stamp}`,
    '',
    `- API: \`${BASE_URL}\`${LABEL ? ` - label: **${LABEL}**` : ''}`,
    `- Gold set: \`${path.relative(ROOT, QUESTIONS)}\` (${items.length} items, ${results.length - skipped.length} run, ${skipped.length} skipped)`,
    `- Command: \`${['run-eval.ts', ...process.argv.slice(2)].join(' ')}\``,
    `- Sources: ${[...present.entries()].map(([k, v]) => `${k}=${v ? 'present' : 'absent'}`).join(', ') || 'no optional source'}`,
    '',
    '| Metric | Value | Wilson 95% CI | n | Definition |',
    '|---|---|---|---|---|',
    ...summary.metrics.map((m) => {
      const w = wilson(m.successes, m.n);
      return `| ${m.name} | ${fmt(w.p)} (${m.successes}/${m.n}) | [${fmt(w.low)}, ${fmt(w.high)}] | ${m.n} | ${m.definition} |`;
    }),
    '',
    '| Statistic | Value |',
    '|---|---|',
    ...Object.entries(summary.latency).map(([k, v]) => `| ${k} | ${fmt(v)} |`),
    '',
    'Small n: confidence intervals are wide; read them before the point estimate.',
  ];
  return lines.join('\n') + '\n';
}

async function main(): Promise<void> {
  let items = loadGold();
  if (typeof args.category === 'string')
    items = items.filter((item) => item.category === args.category);
  if (typeof args.limit === 'string') items = items.slice(0, Number(args.limit));

  const present = await presentSources(items);
  // Evenly spaced /chat sample (deterministic, covers every category of the ordered gold set)
  const chatIds = new Set(
    CHAT_SAMPLE !== null && CHAT_SAMPLE < items.length
      ? Array.from(
          { length: CHAT_SAMPLE },
          (_, i) => items[Math.floor((i * items.length) / CHAT_SAMPLE)]?.id,
        )
      : items.map((item) => item.id),
  );
  const results: ItemResult[] = [];
  for (const item of items) {
    try {
      results.push(await evaluateItem(item, present, !SEARCH_ONLY && chatIds.has(item.id)));
    } catch (error) {
      results.push({
        id: item.id,
        category: item.category,
        language: item.language,
        skipped: `error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
    process.stdout.write(`${results.length}/${items.length}\r`);
  }

  const summary = summarise(items, results);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(ROOT, 'eval', 'results');
  mkdirSync(outDir, { recursive: true });
  const report = {
    timestamp: stamp,
    baseUrl: BASE_URL,
    label: LABEL,
    argv: process.argv.slice(2),
    sources: Object.fromEntries(present),
    metrics: summary.metrics.map((m) => ({ ...m, ...wilson(m.successes, m.n) })),
    statistics: summary.latency,
    results,
  };
  writeFileSync(path.join(outDir, `${stamp}.json`), JSON.stringify(report, null, 2));
  const md = markdown(stamp, items, results, summary, present);
  writeFileSync(path.join(outDir, `${stamp}.md`), md);
  process.stdout.write(`\n${md}\nWritten eval/results/${stamp}.json and .md\n`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
