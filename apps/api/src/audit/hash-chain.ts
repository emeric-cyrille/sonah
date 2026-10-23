/**
 * Chaînage par hachage du journal d'audit : chaque trace porte
 * hash = sha256(prevHash + JSON canonique de la trace). Modifier, supprimer ou réordonner
 * une trace casse la chaîne à partir de ce point, ce que `verifyChain` détecte.
 */
import { createHash } from 'node:crypto';
import type { ChainVerification, TraceDraft, TraceRecord } from './trace.types';

/** Empreinte précédant la première trace. */
export const GENESIS_HASH = '0'.repeat(64);

/**
 * JSON canonique : clés triées récursivement, valeurs `undefined` omises (comme JSON.stringify),
 * nombres non finis refusés. Deux objets égaux donnent toujours la même chaîne.
 */
export function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  switch (typeof value) {
    case 'number':
      if (!Number.isFinite(value)) throw new Error('Nombre non fini dans une trace');
      return JSON.stringify(value);
    case 'string':
    case 'boolean':
      return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value.map((item) => (item === undefined ? 'null' : canonicalJson(item))).join(',')}]`;
      }
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined && typeof v !== 'function')
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
    }
    default:
      throw new Error(`Type non sérialisable dans une trace : ${typeof value}`);
  }
}

/** Contenu haché d'une trace (tout sauf la position et les empreintes). */
export function hashPayload(trace: TraceDraft): Record<string, unknown> {
  return {
    id: trace.id,
    createdAt: trace.createdAt.toISOString(),
    kind: trace.kind,
    conversationId: trace.conversationId,
    scenarioRunId: trace.scenarioRunId,
    agentId: trace.agentId,
    verdict: trace.verdict,
    promptVersion: trace.promptVersion,
    model: trace.model,
    steps: trace.steps,
  };
}

export function computeTraceHash(prevHash: string, trace: TraceDraft): string {
  return createHash('sha256')
    .update(prevHash)
    .update(canonicalJson(hashPayload(trace)))
    .digest('hex');
}

/** Vérificateur incrémental : les traces lui sont fournies dans l'ordre de la chaîne. */
export class ChainVerifier {
  private expectedPrev = GENESIS_HASH;
  private count = 0;
  private brokenAt: string | undefined;

  push(record: TraceRecord): boolean {
    if (this.brokenAt) return false;
    this.count += 1;
    const recomputed = computeTraceHash(record.prevHash, record);
    if (record.prevHash !== this.expectedPrev || recomputed !== record.hash) {
      this.brokenAt = record.id;
      return false;
    }
    this.expectedPrev = record.hash;
    return true;
  }

  result(): ChainVerification {
    return this.brokenAt
      ? { valid: false, count: this.count, brokenAt: this.brokenAt }
      : { valid: true, count: this.count };
  }
}

export function verifyChain(records: Iterable<TraceRecord>): ChainVerification {
  const verifier = new ChainVerifier();
  for (const record of records) {
    if (!verifier.push(record)) break;
  }
  return verifier.result();
}

/** Ramène des données arbitraires à du JSON pur (ce que la base restituera). */
export function toPlainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
