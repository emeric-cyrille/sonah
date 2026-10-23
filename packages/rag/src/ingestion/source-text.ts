import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeLegalText, PAGE_MARKER } from '../chunking/text-normalizer';
import type { LegalSource } from '../types';
import { downloadSource, sha256 } from './download';
import { htmlToText } from './html';
import { extractPdfBuffer } from './pdf';

export interface SourceTextOptions {
  readonly sourcesDir: string;
  /**
   * Textes non redistribuables (« fetch-only ») :
   * - « fetch » : téléchargés si absents du cache (data/sources/.cache), empreinte vérifiée ;
   * - « cache-only » : lus uniquement depuis le cache (hors ligne, CI).
   */
  readonly remote?: 'fetch' | 'cache-only';
}

export class SourceUnavailableError extends Error {}

function cachePath(sourcesDir: string, source: LegalSource): string {
  return path.join(sourcesDir, '.cache', `${source.id}.${source.fetch?.format ?? 'bin'}`);
}

async function readIfExists(file: string): Promise<Buffer | undefined> {
  try {
    return await readFile(file);
  } catch {
    return undefined;
  }
}

/** Contenu d'origine (octets) d'une source non redistribuable : cache, sinon téléchargement. */
async function loadRemote(source: LegalSource, options: SourceTextOptions): Promise<Buffer> {
  if (!source.fetch)
    throw new SourceUnavailableError(`${source.id} : aucune URL de téléchargement`);
  const file = cachePath(options.sourcesDir, source);
  const cached = await readIfExists(file);
  if (cached && sha256(cached) === source.sha256) return cached;
  if (options.remote !== 'fetch') {
    throw new SourceUnavailableError(`${source.id} : absent du cache (${file})`);
  }
  let buffer: Buffer;
  try {
    buffer = await downloadSource(source.fetch);
  } catch (error) {
    throw new SourceUnavailableError(
      `${source.id} : téléchargement impossible (${error instanceof Error ? error.message : String(error)})`,
    );
  }
  const digest = sha256(buffer);
  if (digest !== source.sha256) {
    throw new SourceUnavailableError(
      `${source.id} : empreinte inattendue (${digest}), le document publié a changé — vérifier avant de mettre à jour le manifeste`,
    );
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
  return buffer;
}

/** Texte brut (non normalisé) d'une source, avec séparateurs de pages pour les PDF. */
export async function loadRawSourceText(
  source: LegalSource,
  options: SourceTextOptions,
): Promise<string> {
  if (source.file) {
    const file = path.join(options.sourcesDir, source.file);
    if (source.file.endsWith('.pdf')) return extractPdfBuffer(await readFile(file));
    return readFile(file, 'utf8');
  }
  const buffer = await loadRemote(source, options);
  if (source.fetch?.format === 'html') {
    return htmlToText(new TextDecoder(source.fetch.encoding ?? 'utf-8').decode(buffer));
  }
  return extractPdfBuffer(buffer);
}

/**
 * Restreint le texte à la portion [start, end[ (lignes entières), quand un fichier contient plusieurs
 * textes (ex. la Constitution suivie de la loi qui la modifie). Le dernier marqueur de page
 * précédant le début est conservé pour garder la pagination.
 */
export function sliceSegment(text: string, segment: LegalSource['segment']): string {
  if (!segment) return text;
  const lines = text.split('\n');
  const startRegex = segment.start ? new RegExp(segment.start) : undefined;
  const endRegex = segment.end ? new RegExp(segment.end) : undefined;

  let startIndex = 0;
  if (startRegex) {
    startIndex = lines.findIndex((line) => startRegex.test(line));
    if (startIndex < 0) throw new Error(`Début de segment introuvable : ${segment.start}`);
  }
  let endIndex = lines.length;
  if (endRegex) {
    const found = lines.findIndex((line, index) => index > startIndex && endRegex.test(line));
    if (found < 0) throw new Error(`Fin de segment introuvable : ${segment.end}`);
    endIndex = found;
  }
  const lastMarker = lines
    .slice(0, startIndex)
    .reverse()
    .find((line) => PAGE_MARKER.test(line));
  const body = lines.slice(startIndex, endIndex);
  return (lastMarker && !PAGE_MARKER.test(body[0] ?? '') ? [lastMarker, ...body] : body).join('\n');
}

/** Texte prêt à découper : extraction, nettoyage (avec marqueurs de page), portion utile. */
export async function loadSourceText(
  source: LegalSource,
  options: SourceTextOptions,
): Promise<string> {
  const raw = await loadRawSourceText(source, options);
  const text = normalizeLegalText(raw, source.noisePatterns, {
    keepPageMarkers: true,
    replacements: source.replacements,
  });
  return sliceSegment(text, source.segment);
}
