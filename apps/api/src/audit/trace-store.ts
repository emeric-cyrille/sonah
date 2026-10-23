import { Injectable } from '@nestjs/common';
import type { Prisma, Trace as TraceRow } from '@sonah/database';
import { PrismaService } from '../prisma/prisma.service';
import type { Verdict } from '../policy/policy.types';
import { ChainVerifier, computeTraceHash, GENESIS_HASH, toPlainJson } from './hash-chain';
import type {
  ChainVerification,
  TraceDraft,
  TraceKind,
  TraceRecord,
  TraceStep,
} from './trace.types';

export interface TraceQuery {
  readonly conversationId?: string;
  readonly scenarioRunId?: string;
  readonly limit: number;
}

/** Stockage en ajout seul des traces chaînées. */
export interface TraceStore {
  append(draft: TraceDraft): Promise<TraceRecord>;
  findById(id: string): Promise<TraceRecord | null>;
  /** Traces les plus récentes d'abord. */
  list(query: TraceQuery): Promise<TraceRecord[]>;
  /** Recalcule toute la chaîne dans l'ordre d'insertion. */
  verify(): Promise<ChainVerification>;
}

export const TRACE_STORE = Symbol('TRACE_STORE');

/** Clé du verrou consultatif PostgreSQL qui sérialise l'ajout en fin de chaîne. */
const CHAIN_LOCK_KEY = 31_721_172;
const VERIFY_BATCH = 500;

/** Ce que la base restitue : la trace est re-normalisée en JSON pur avant hachage. */
function normalizeDraft(draft: TraceDraft): TraceDraft {
  return {
    ...draft,
    createdAt: new Date(draft.createdAt.getTime()),
    steps: toPlainJson(draft.steps),
  };
}

function fromRow(row: TraceRow): TraceRecord {
  return {
    id: row.id,
    sequence: row.sequence,
    createdAt: row.createdAt,
    kind: row.kind as TraceKind,
    conversationId: row.conversationId,
    scenarioRunId: row.scenarioRunId,
    agentId: row.agentId,
    verdict: row.verdict as Verdict,
    promptVersion: row.promptVersion,
    model: row.model,
    steps: row.steps as unknown as TraceStep[],
    prevHash: row.prevHash,
    hash: row.hash,
  };
}

@Injectable()
export class PrismaTraceStore implements TraceStore {
  /** File d'attente locale : évite de multiplier les attentes de verrou dans ce processus. */
  private tail: Promise<unknown> = Promise.resolve();

  constructor(private readonly prisma: PrismaService) {}

  append(draft: TraceDraft): Promise<TraceRecord> {
    const run = this.tail.then(() => this.appendLocked(normalizeDraft(draft)));
    this.tail = run.catch(() => undefined);
    return run;
  }

  private async appendLocked(draft: TraceDraft): Promise<TraceRecord> {
    const row = await this.prisma.$transaction(async (tx) => {
      // Verrou transactionnel : une seule instance de l'API écrit la fin de chaîne à la fois
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CHAIN_LOCK_KEY})`;
      const last = await tx.trace.findFirst({
        orderBy: { sequence: 'desc' },
        select: { hash: true },
      });
      const prevHash = last?.hash ?? GENESIS_HASH;
      return tx.trace.create({
        data: {
          id: draft.id,
          createdAt: draft.createdAt,
          kind: draft.kind,
          conversationId: draft.conversationId,
          scenarioRunId: draft.scenarioRunId,
          agentId: draft.agentId,
          verdict: draft.verdict,
          promptVersion: draft.promptVersion,
          model: draft.model,
          steps: draft.steps as unknown as Prisma.InputJsonValue,
          prevHash,
          hash: computeTraceHash(prevHash, draft),
        },
      });
    });
    return fromRow(row);
  }

  async findById(id: string): Promise<TraceRecord | null> {
    const row = await this.prisma.trace.findUnique({ where: { id } });
    return row ? fromRow(row) : null;
  }

  async list(query: TraceQuery): Promise<TraceRecord[]> {
    const rows = await this.prisma.trace.findMany({
      where: {
        ...(query.conversationId ? { conversationId: query.conversationId } : {}),
        ...(query.scenarioRunId ? { scenarioRunId: query.scenarioRunId } : {}),
      },
      orderBy: { sequence: 'desc' },
      take: query.limit,
    });
    return rows.map(fromRow);
  }

  async verify(): Promise<ChainVerification> {
    const verifier = new ChainVerifier();
    let after = 0;
    for (;;) {
      const rows = await this.prisma.trace.findMany({
        where: { sequence: { gt: after } },
        orderBy: { sequence: 'asc' },
        take: VERIFY_BATCH,
      });
      for (const row of rows) {
        if (!verifier.push(fromRow(row))) return verifier.result();
      }
      if (rows.length < VERIFY_BATCH) return verifier.result();
      after = rows[rows.length - 1]?.sequence ?? after;
    }
  }
}

/** Stockage en mémoire (tests, démonstration hors base). */
export class MemoryTraceStore implements TraceStore {
  readonly records: TraceRecord[] = [];

  async append(draft: TraceDraft): Promise<TraceRecord> {
    const normalized = normalizeDraft(draft);
    const prevHash = this.records[this.records.length - 1]?.hash ?? GENESIS_HASH;
    const record: TraceRecord = {
      ...normalized,
      sequence: this.records.length + 1,
      prevHash,
      hash: computeTraceHash(prevHash, normalized),
    };
    this.records.push(record);
    return record;
  }

  async findById(id: string): Promise<TraceRecord | null> {
    return this.records.find((record) => record.id === id) ?? null;
  }

  async list(query: TraceQuery): Promise<TraceRecord[]> {
    return this.records
      .filter(
        (record) =>
          (!query.conversationId || record.conversationId === query.conversationId) &&
          (!query.scenarioRunId || record.scenarioRunId === query.scenarioRunId),
      )
      .slice()
      .reverse()
      .slice(0, query.limit);
  }

  async verify(): Promise<ChainVerification> {
    const verifier = new ChainVerifier();
    for (const record of this.records) {
      if (!verifier.push(record)) break;
    }
    return verifier.result();
  }
}
