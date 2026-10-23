import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Verdict } from '../policy/policy.types';
import type { TraceRecorder } from './trace-recorder';
import { TRACE_STORE, type TraceQuery, type TraceStore } from './trace-store';
import type {
  ChainVerification,
  TraceDetail,
  TraceKind,
  TraceRecord,
  TraceSummary,
} from './trace.types';

export interface TraceContext {
  readonly kind: TraceKind;
  readonly verdict: Verdict;
  readonly conversationId?: string | null;
  readonly scenarioRunId?: string | null;
  readonly agentId?: string | null;
  readonly promptVersion?: string | null;
  readonly model?: string | null;
}

/** Journal d'audit : écrit les traces (ajout seul) et les restitue pour relecture. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(TRACE_STORE) private readonly store: TraceStore) {}

  async record(recorder: TraceRecorder, context: TraceContext): Promise<TraceRecord> {
    const record = await this.store.append({
      id: recorder.id,
      createdAt: recorder.startedAt,
      kind: context.kind,
      conversationId: context.conversationId ?? null,
      scenarioRunId: context.scenarioRunId ?? null,
      agentId: context.agentId ?? null,
      verdict: context.verdict,
      promptVersion: context.promptVersion ?? null,
      model: context.model ?? null,
      steps: recorder.recordedSteps,
    });
    this.logger.debug(`Trace ${record.id} chaînée (n° ${record.sequence})`);
    return record;
  }

  async list(query: TraceQuery): Promise<TraceSummary[]> {
    const records = await this.store.list(query);
    return records.map((record) => ({
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      kind: record.kind,
      conversationId: record.conversationId,
      scenarioRunId: record.scenarioRunId,
      agentId: record.agentId,
      verdict: record.verdict,
      model: record.model,
      stepCount: record.steps.length,
      hash: record.hash,
    }));
  }

  async get(id: string): Promise<TraceDetail | null> {
    const record = await this.store.findById(id);
    if (!record) return null;
    return {
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      kind: record.kind,
      conversationId: record.conversationId,
      ...(record.scenarioRunId ? { scenarioRunId: record.scenarioRunId } : {}),
      agentId: record.agentId,
      verdict: record.verdict,
      promptVersion: record.promptVersion,
      model: record.model,
      hash: record.hash,
      prevHash: record.prevHash,
      sequence: record.sequence,
      steps: record.steps,
    };
  }

  verify(): Promise<ChainVerification> {
    return this.store.verify();
  }
}
