/**
 * SONAH error-scenario replay.
 *
 * Runs every progressive error scenario against a running SONAH API, releasing the steps one by one
 * (POST /scenarios/:id/runs, then POST /scenarios/runs/:runId/next), exactly as a judge would.
 * For each released step it records the event, every agent response (verdict, cited articles,
 * trace id), the policy gaps surfaced, and finally verifies the hash-chained audit log.
 *
 * Usage (from the repository root, Node >= 22.6):
 *   node --experimental-strip-types eval/run-scenarios.ts [options]
 *
 * Options:
 *   --base-url <url>    API base URL (default: $BASE_URL or http://localhost:4000/api/v1)
 *   --language <fr|en>  scenario language (default: en)
 *   --scenario <id>     only run one scenario (repeatable)
 *   --delay <ms>        pause between steps (quota-friendly, default 4000)
 *   --out <dir>         output directory (default: eval/scenario-runs/<date>)
 *
 * Output: <out>/<scenario>-<step>.json (raw released step), <out>/summary.json and <out>/SUMMARY.md.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface ScenarioSummary {
  id: string;
  title: string;
  totalSteps: number;
  domain: string;
}

interface Citation {
  index: number;
  sourceId?: string;
  reference?: string | null;
  title?: string;
}

interface AgentResponse {
  agentId: string;
  agentName: string;
  verdict: string;
  citations: Citation[];
  traceId: string;
  message: string;
}

interface Gap {
  id: string;
  title: string;
  globalExample?: string;
}

interface ReleasedStep {
  runId: string;
  step: number;
  totalSteps: number;
  event: { title: string; description: string };
  responses: AgentResponse[];
  gaps: Gap[];
  done: boolean;
}

interface Options {
  baseUrl: string;
  language: 'fr' | 'en';
  scenarios: string[];
  delay: number;
  out: string;
}

function parseOptions(argv: string[]): Options {
  const options: Options = {
    baseUrl: process.env.BASE_URL ?? 'http://localhost:4000/api/v1',
    language: 'en',
    scenarios: [],
    delay: 4000,
    out: path.join('eval', 'scenario-runs', new Date().toISOString().slice(0, 10)),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i + 1];
    switch (argv[i]) {
      case '--base-url':
        options.baseUrl = value ?? options.baseUrl;
        i += 1;
        break;
      case '--language':
        options.language = value === 'fr' ? 'fr' : 'en';
        i += 1;
        break;
      case '--scenario':
        if (value) options.scenarios.push(value);
        i += 1;
        break;
      case '--delay':
        options.delay = Number(value ?? options.delay);
        i += 1;
        break;
      case '--out':
        options.out = value ?? options.out;
        i += 1;
        break;
      default:
        throw new Error(`Unknown option: ${argv[i]}`);
    }
  }
  options.baseUrl = options.baseUrl.replace(/\/$/, '');
  return options;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function api<T>(options: Options, method: string, route: string, body?: unknown): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(`${options.baseUrl}${route}`, {
      method,
      headers: { 'content-type': 'application/json', 'accept-language': options.language },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // Rate limiter of the API itself: wait and retry
    if (response.status === 429 && attempt < 5) {
      const retryAfter = Number(response.headers.get('retry-after') ?? '10');
      await sleep((Number.isFinite(retryAfter) ? retryAfter : 10) * 1000);
      continue;
    }
    if (!response.ok) {
      throw new Error(`${method} ${route} → HTTP ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as T;
  }
}

function citationLabel(citation: Citation): string {
  return [citation.sourceId, citation.reference].filter(Boolean).join(' › ');
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  mkdirSync(options.out, { recursive: true });

  const health = await api<{ services?: { languageModel?: string } }>(
    options,
    'GET',
    '/health/ready',
  );
  const all = await api<ScenarioSummary[]>(
    options,
    'GET',
    `/scenarios?language=${options.language}`,
  );
  const selected = options.scenarios.length
    ? all.filter((scenario) => options.scenarios.includes(scenario.id))
    : all;

  const summary: Array<{
    scenario: string;
    title: string;
    runId: string;
    steps: Array<{
      step: number;
      event: string;
      responses: Array<{ agent: string; verdict: string; citations: string[]; traceId: string }>;
      gaps: string[];
    }>;
  }> = [];

  for (const scenario of selected) {
    const { runId } = await api<{ runId: string }>(
      options,
      'POST',
      `/scenarios/${scenario.id}/runs`,
      { language: options.language },
    );
    const steps: (typeof summary)[number]['steps'] = [];
    let done = false;
    while (!done) {
      const released = await api<ReleasedStep>(options, 'POST', `/scenarios/runs/${runId}/next`);
      writeFileSync(
        path.join(options.out, `${scenario.id}-${released.step}.json`),
        `${JSON.stringify(released, null, 2)}\n`,
      );
      steps.push({
        step: released.step,
        event: released.event.title,
        responses: released.responses.map((response) => ({
          agent: response.agentId,
          verdict: response.verdict,
          citations: response.citations.map(citationLabel),
          traceId: response.traceId,
        })),
        gaps: released.gaps.map((gap) => `${gap.id}: ${gap.title}`),
      });
      console.log(
        `${scenario.id} step ${released.step}/${released.totalSteps}: ${released.responses
          .map((response) => `${response.agentId}=${response.verdict}`)
          .join(', ')}`,
      );
      done = released.done;
      if (!done) await sleep(options.delay);
    }
    summary.push({ scenario: scenario.id, title: scenario.title, runId, steps });
  }

  const verification = await api<Record<string, unknown>>(options, 'GET', '/audit/verify');
  const result = {
    generatedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    language: options.language,
    languageModel: health.services?.languageModel ?? null,
    scenarios: summary,
    auditVerification: verification,
  };
  writeFileSync(path.join(options.out, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`);

  const lines = [
    `# Scenario replay — ${result.generatedAt}`,
    '',
    `API: \`${options.baseUrl}\` · language: ${options.language} · model chain: ${result.languageModel ?? 'none'}`,
    '',
    `Audit chain verification: \`${JSON.stringify(verification)}\``,
    '',
  ];
  for (const scenario of summary) {
    lines.push(`## ${scenario.title} (\`${scenario.scenario}\`, run \`${scenario.runId}\`)`, '');
    lines.push('| Step | Event | Agent | Verdict | Cited | Trace |', '|---|---|---|---|---|---|');
    for (const step of scenario.steps) {
      for (const response of step.responses) {
        lines.push(
          `| ${step.step} | ${step.event} | ${response.agent} | ${response.verdict} | ${
            response.citations.join('; ') || '—'
          } | \`${response.traceId}\` |`,
        );
      }
    }
    const gaps = scenario.steps.flatMap((step) => step.gaps);
    if (gaps.length > 0) lines.push('', `Gaps surfaced: ${gaps.join(' · ')}`);
    lines.push('');
  }
  writeFileSync(path.join(options.out, 'SUMMARY.md'), `${lines.join('\n')}\n`);
  console.log(`\nWritten to ${options.out}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
