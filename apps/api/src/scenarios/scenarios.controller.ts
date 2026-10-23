import { Body, Controller, Get, HttpCode, Logger, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { RATE_LIMITS, RateLimit } from '../common/rate-limit.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { rethrowAsUnavailable } from '../common/unavailable';
import type { Language } from '../policy/policy.types';
import { ScenarioEngine } from './scenario-engine.service';
import type { ReleasedStep, ScenarioRunView, ScenarioSummary } from './scenario.types';

const languageQuerySchema = z.object({ language: z.enum(['fr', 'en']).default('en') });
const startBodySchema = z
  .object({ language: z.enum(['fr', 'en']).default('en') })
  .default({ language: 'en' });
const scenarioIdSchema = z.string().regex(/^[a-z0-9-]{1,64}$/);
const runIdSchema = z.string().uuid();

/** Scénarios d'erreur interactifs, publiés étape par étape. */
@Controller('scenarios')
@RateLimit(RATE_LIMITS.scenarios)
export class ScenariosController {
  private readonly logger = new Logger(ScenariosController.name);

  constructor(private readonly engine: ScenarioEngine) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(languageQuerySchema)) query: { language: Language },
  ): ScenarioSummary[] {
    return this.engine.list(query.language);
  }

  @Post(':id/runs')
  @HttpCode(201)
  async start(
    @Param('id', new ZodValidationPipe(scenarioIdSchema)) id: string,
    @Body(new ZodValidationPipe(startBodySchema)) body: { language: Language },
  ): Promise<{ runId: string; scenario: ScenarioSummary; totalSteps: number }> {
    try {
      return await this.engine.start(id, body.language);
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'démarrage du scénario');
    }
  }

  @Post('runs/:runId/next')
  @HttpCode(200)
  async next(
    @Param('runId', new ZodValidationPipe(runIdSchema)) runId: string,
  ): Promise<ReleasedStep> {
    try {
      return await this.engine.next(runId);
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'étape du scénario');
    }
  }

  @Get('runs/:runId')
  async get(
    @Param('runId', new ZodValidationPipe(runIdSchema)) runId: string,
  ): Promise<ScenarioRunView> {
    try {
      return await this.engine.get(runId);
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'lecture du scénario');
    }
  }
}
