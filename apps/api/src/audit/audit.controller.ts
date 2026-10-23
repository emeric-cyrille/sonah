import { Controller, Get, Logger, NotFoundException, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { rethrowAsUnavailable } from '../common/unavailable';
import { AuditService } from './audit.service';
import type { ChainVerification, TraceDetail, TraceSummary } from './trace.types';

const listQuerySchema = z.object({
  conversationId: z.string().uuid().optional(),
  scenarioRunId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
type ListQuery = z.infer<typeof listQuerySchema>;

const idSchema = z.string().uuid();

/** Relecture du journal d'audit : traces, étapes et vérification de la chaîne. */
@Controller('audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly audit: AuditService) {}

  @Get('traces')
  async list(
    @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<{ traces: TraceSummary[] }> {
    try {
      return { traces: await this.audit.list(query) };
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'lecture des traces');
    }
  }

  @Get('traces/:id')
  async get(@Param('id', new ZodValidationPipe(idSchema)) id: string): Promise<TraceDetail> {
    let trace: TraceDetail | null;
    try {
      trace = await this.audit.get(id);
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'lecture de la trace');
    }
    if (!trace) throw new NotFoundException(`Trace ${id} introuvable`);
    return trace;
  }

  /** Recalcule toute la chaîne de hachage : `valid: false` et `brokenAt` en cas d'altération. */
  @Get('verify')
  async verify(): Promise<ChainVerification> {
    try {
      return await this.audit.verify();
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'vérification du journal');
    }
  }
}
