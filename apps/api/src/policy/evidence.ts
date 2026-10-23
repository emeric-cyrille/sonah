import type { SearchResult } from '@sonah/rag';
import type { Citation, TextStatus } from './policy.types';

/** Longueur maximale d'un extrait cité. */
export const EXCERPT_LENGTH = 320;

function stringField(metadata: Record<string, unknown> | null, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

/** Statut juridique d'un fragment (contrat de la base de connaissances : absent = en vigueur). */
export function statusOf(result: SearchResult): TextStatus {
  const status = result.metadata?.status;
  return status === 'amended' || status === 'repealed' ? status : 'in_force';
}

export function amendedByOf(result: SearchResult): string | undefined {
  return stringField(result.metadata, 'amendedBy');
}

export function shortTitleOf(result: SearchResult): string {
  return stringField(result.metadata, 'shortTitle') ?? result.category ?? result.title;
}

export function noteOf(result: SearchResult): string | undefined {
  return stringField(result.metadata, 'note');
}

export function pathOf(result: SearchResult): string[] {
  const path = result.metadata?.path;
  return Array.isArray(path) ? path.filter((part): part is string => typeof part === 'string') : [];
}

/** Identifiants (sourceId ou id de document) avec lesquels la base signale une contradiction. */
export function conflictsWithOf(result: SearchResult): string[] {
  const value = result.metadata?.conflictsWith;
  if (typeof value === 'string') return [value];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

export function urlOf(result: SearchResult): string | undefined {
  return result.source.startsWith('http') ? result.source : undefined;
}

/** Extrait compact : coupé à une frontière de mot, toujours sous-chaîne du texte (espaces normalisés). */
export function excerptOf(text: string, maxLength = EXCERPT_LENGTH): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).replace(/\s\S*$/, '')}…`;
}

export function toCitation(result: SearchResult, index: number): Citation {
  return {
    index,
    documentId: result.id,
    sourceId: result.sourceId,
    title: shortTitleOf(result),
    reference: result.reference ?? '',
    excerpt: excerptOf(result.content),
    url: urlOf(result),
    status: statusOf(result),
  };
}
