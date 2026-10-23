import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import type { Language } from '../policy/policy.types';
import { AGENTS, describeAgent, type AgentDescription } from './agent-registry';

const querySchema = z.object({ language: z.enum(['fr', 'en']).default('en') });

/** Registre des agents : rôle, mandat, sources autorisées et règles déterministes. */
@Controller('agents')
export class AgentsController {
  @Get()
  list(
    @Query(new ZodValidationPipe(querySchema)) query: { language: Language },
  ): AgentDescription[] {
    return AGENTS.map((agent) => describeAgent(agent, query.language));
  }
}
