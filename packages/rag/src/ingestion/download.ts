import { createHash } from 'node:crypto';
import type { FetchSpec } from '../types';

const USER_AGENT = 'Mozilla/5.0 (compatible; SonahKnowledgeBase/1.0)';
const TIMEOUT_MS = 120_000;
const MAX_BYTES = 60 * 1024 * 1024;

export function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

async function fetchBuffer(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, ...headers },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > MAX_BYTES) throw new Error(`Document trop volumineux (${length} octets) : ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_BYTES) throw new Error(`Document trop volumineux : ${url}`);
  return buffer;
}

/**
 * prc.cm (Présidence de la République) ne publie pas de lien direct stable :
 * la page /multimedia/documents/<id>-… mène à un formulaire qui délivre un lien temporaire.
 */
async function resolvePrcCm(url: string): Promise<string> {
  const match = /^(https:\/\/www\.prc\.cm)\/(fr|en)\/multimedia\/documents\/(\d+)-/.exec(url);
  if (!match) throw new Error(`URL prc.cm inattendue : ${url}`);
  const [, origin, lang, id] = match;
  const form = (
    await fetchBuffer(
      `${origin}/${lang}/multimedia/documents?task=mediaform.download&id=${id}&tmpl=component`,
    )
  ).toString('utf8');
  const link = /href="([^"]*task=get\.file[^"]*)"/.exec(form)?.[1];
  if (!link) throw new Error(`Lien de téléchargement introuvable sur ${url}`);
  return `${origin}${link.replace(/&amp;/g, '&')}`;
}

/** Télécharge le document d'origine d'une source (sans l'interpréter). */
export async function downloadSource(spec: FetchSpec): Promise<Buffer> {
  const url = spec.resolver === 'prc-cm' ? await resolvePrcCm(spec.url) : spec.url;
  const buffer = await fetchBuffer(url, { ...spec.headers });
  if (spec.format === 'pdf' && buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new Error(`Le document téléchargé n'est pas un PDF : ${spec.url}`);
  }
  return buffer;
}
