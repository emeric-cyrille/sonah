/**
 * API simulée pour le mode démonstration : active uniquement si NEXT_PUBLIC_API_MOCK=1.
 * Sinon, chaque requête renvoie 404 et le site appelle la vraie API (/api/v1).
 */
import { cookies, headers } from 'next/headers';
import { isLocale, LOCALE_COOKIE, negotiateLocale, type Locale } from '@/i18n/config';
import {
  mockAgents,
  mockChat,
  mockDocument,
  mockGetRun,
  mockGetTrace,
  mockListTraces,
  mockNextEvent,
  mockScenarios,
  mockStartRun,
  mockVerify,
} from '@/lib/mock/mock-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ENABLED = process.env.NEXT_PUBLIC_API_MOCK === '1';
// Petit délai pour rendre visibles les états de chargement
const LATENCY_MS = 450;

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return Response.json(body, { status, headers: extraHeaders });
}

function notFound(): Response {
  return json({ error: 'Not found' }, 404);
}

function requestLocale(): Locale {
  const fromCookie = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(fromCookie) ? fromCookie : negotiateLocale(headers().get('accept-language'));
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } },
): Promise<Response> {
  if (!ENABLED) return notFound();
  const [first, second, third] = params.path;
  const url = new URL(request.url);
  const locale = requestLocale();

  if (first === 'audit' && second === 'traces' && !third) {
    return json(mockListTraces(url.searchParams));
  }
  if (first === 'audit' && second === 'traces' && third) {
    const trace = mockGetTrace(third);
    return trace ? json(trace) : notFound();
  }
  if (first === 'audit' && second === 'verify') return json(mockVerify());
  if (first === 'agents' && !second) return json(mockAgents(locale));
  if (first === 'scenarios' && !second) return json(mockScenarios(locale));
  if (first === 'scenarios' && second === 'runs' && third) {
    const run = mockGetRun(third);
    return run ? json(run) : notFound();
  }
  if (first === 'documents' && second) {
    const document = mockDocument(second);
    return document ? json(document) : notFound();
  }
  return notFound();
}

export async function POST(
  request: Request,
  { params }: { params: { path: string[] } },
): Promise<Response> {
  if (!ENABLED) return notFound();
  const [first, second, third, fourth] = params.path;
  const body: unknown = await request.json().catch(() => ({}));
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

  await wait(LATENCY_MS);

  if (first === 'chat' && !second) {
    const result = mockChat(payload);
    return json(result.body, result.status, result.headers);
  }
  if (first === 'scenarios' && second && third === 'runs' && !fourth) {
    const run = mockStartRun(second, requestLocale());
    return run ? json(run, 201) : notFound();
  }
  if (first === 'scenarios' && second === 'runs' && third && fourth === 'next') {
    await wait(LATENCY_MS);
    const step = mockNextEvent(third);
    if (step === 'done') return json({ error: 'Scénario terminé' }, 409);
    return step ? json(step) : notFound();
  }
  return notFound();
}
