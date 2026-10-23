import { Injectable } from '@nestjs/common';
import type { Prisma } from '@sonah/database';
import { randomUUID } from 'node:crypto';
import type { Language } from '../policy/policy.types';
import { PrismaService } from '../prisma/prisma.service';
import type { AgentResponse, Gap, ScenarioEvent } from './scenario.types';

export interface StoredStep {
  readonly step: number;
  readonly event: ScenarioEvent;
  readonly responses: readonly AgentResponse[];
  readonly gaps: readonly Gap[];
}

export interface StoredRun {
  readonly id: string;
  readonly scenarioId: string;
  readonly totalSteps: number;
  readonly language: Language;
  readonly currentStep: number;
  readonly status: 'RUNNING' | 'COMPLETED';
  readonly createdAt: Date;
  readonly steps: readonly StoredStep[];
}

/** Persistance des exécutions de scénarios et de leurs étapes publiées. */
export interface ScenarioRunRepository {
  create(input: { scenarioId: string; totalSteps: number; language: Language }): Promise<StoredRun>;
  find(id: string): Promise<StoredRun | null>;
  /**
   * Publie une étape si et seulement si l'étape précédente est la dernière publiée
   * (garde contre les doubles publications). Renvoie false sinon.
   */
  appendStep(runId: string, step: StoredStep, done: boolean): Promise<boolean>;
}

export const SCENARIO_RUN_REPOSITORY = Symbol('SCENARIO_RUN_REPOSITORY');

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class PrismaScenarioRunRepository implements ScenarioRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    scenarioId: string;
    totalSteps: number;
    language: Language;
  }): Promise<StoredRun> {
    const run = await this.prisma.scenarioRun.create({ data: input });
    return { ...this.toRun(run), steps: [] };
  }

  async find(id: string): Promise<StoredRun | null> {
    const run = await this.prisma.scenarioRun.findUnique({
      where: { id },
      include: { steps: { orderBy: { step: 'asc' } } },
    });
    if (!run) return null;
    return {
      ...this.toRun(run),
      steps: run.steps.map((step) => ({
        step: step.step,
        event: step.event as unknown as ScenarioEvent,
        responses: step.responses as unknown as AgentResponse[],
        gaps: step.gaps as unknown as Gap[],
      })),
    };
  }

  async appendStep(runId: string, step: StoredStep, done: boolean): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.scenarioRun.updateMany({
        where: { id: runId, currentStep: step.step - 1 },
        data: { currentStep: step.step, status: done ? 'COMPLETED' : 'RUNNING' },
      });
      if (updated.count === 0) return false;
      await tx.scenarioRunStep.create({
        data: {
          runId,
          step: step.step,
          event: json(step.event),
          responses: json(step.responses),
          gaps: json(step.gaps),
          injectedAt: new Date(step.event.injectedAt),
        },
      });
      return true;
    });
  }

  private toRun(run: {
    id: string;
    scenarioId: string;
    totalSteps: number;
    language: string;
    currentStep: number;
    status: string;
    createdAt: Date;
  }): Omit<StoredRun, 'steps'> {
    return {
      id: run.id,
      scenarioId: run.scenarioId,
      totalSteps: run.totalSteps,
      language: run.language === 'fr' ? 'fr' : 'en',
      currentStep: run.currentStep,
      status: run.status === 'COMPLETED' ? 'COMPLETED' : 'RUNNING',
      createdAt: run.createdAt,
    };
  }
}

/** Dépôt en mémoire (tests). */
export class MemoryScenarioRunRepository implements ScenarioRunRepository {
  readonly runs = new Map<string, StoredRun>();

  async create(input: {
    scenarioId: string;
    totalSteps: number;
    language: Language;
  }): Promise<StoredRun> {
    const run: StoredRun = {
      id: randomUUID(),
      ...input,
      currentStep: 0,
      status: 'RUNNING',
      createdAt: new Date(),
      steps: [],
    };
    this.runs.set(run.id, run);
    return run;
  }

  async find(id: string): Promise<StoredRun | null> {
    return this.runs.get(id) ?? null;
  }

  async appendStep(runId: string, step: StoredStep, done: boolean): Promise<boolean> {
    const run = this.runs.get(runId);
    if (!run || run.currentStep !== step.step - 1) return false;
    this.runs.set(runId, {
      ...run,
      currentStep: step.step,
      status: done ? 'COMPLETED' : 'RUNNING',
      steps: [...run.steps, JSON.parse(JSON.stringify(step)) as StoredStep],
    });
    return true;
  }
}
