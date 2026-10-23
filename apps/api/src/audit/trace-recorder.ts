import { randomUUID } from 'node:crypto';
import type { TraceStep, TraceStepType } from './trace.types';

export interface StepInput {
  readonly type: TraceStepType;
  readonly agent?: string;
  readonly summary: string;
  readonly data?: Record<string, unknown>;
  readonly durationMs?: number;
}

/** Collecte les étapes d'une trace pendant le traitement d'une requête. */
export class TraceRecorder {
  readonly id: string;
  readonly startedAt = new Date();
  private readonly steps: TraceStep[] = [];

  constructor(id: string = randomUUID()) {
    this.id = id;
  }

  add(step: StepInput): TraceStep {
    const recorded: TraceStep = {
      order: this.steps.length + 1,
      type: step.type,
      ...(step.agent ? { agent: step.agent } : {}),
      summary: step.summary,
      data: step.data ?? {},
      durationMs: Math.max(0, Math.round(step.durationMs ?? 0)),
    };
    this.steps.push(recorded);
    return recorded;
  }

  /** Mesure la durée d'une opération asynchrone (en millisecondes). */
  static async timed<T>(operation: () => Promise<T>): Promise<{ value: T; durationMs: number }> {
    const start = performance.now();
    const value = await operation();
    return { value, durationMs: performance.now() - start };
  }

  get recordedSteps(): readonly TraceStep[] {
    return this.steps;
  }
}
