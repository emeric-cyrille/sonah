import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { SearchResult, StoredDocument, VectorStoreService } from '@sonah/rag';
import { AdminTokenGuard } from '../common/admin-token.guard';
import { RATE_LIMITS, RateLimit } from '../common/rate-limit.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { rethrowAsUnavailable } from '../common/unavailable';
import { VECTOR_STORE } from './rag.tokens';
import {
  createDocumentSchema,
  searchRequestSchema,
  uuidSchema,
  type CreateDocumentRequest,
  type SearchRequest,
} from './rag.schemas';

@Controller()
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(@Inject(VECTOR_STORE) private readonly vectorStore: VectorStoreService) {}

  /** Recherche sémantique dans les textes officiels. */
  @Post('search')
  @RateLimit(RATE_LIMITS.search)
  @HttpCode(200)
  async search(
    @Body(new ZodValidationPipe(searchRequestSchema)) body: SearchRequest,
  ): Promise<{ results: SearchResult[] }> {
    try {
      const results = await this.vectorStore.search(body.query, body.topK, {
        sourceIds: body.sourceIds,
      });
      return { results };
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'recherche');
    }
  }

  /** Ajoute ou met à jour un document (réservé à l'administration). */
  @Post('documents')
  @UseGuards(AdminTokenGuard)
  async createDocument(
    @Body(new ZodValidationPipe(createDocumentSchema)) body: CreateDocumentRequest,
  ): Promise<{ id: string }> {
    try {
      const id = await this.vectorStore.upsert(body);
      this.logger.log(`Document indexé : ${body.chunkKey} (${id})`);
      return { id };
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'indexation');
    }
  }

  @Get('documents/:id')
  async getDocument(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<StoredDocument> {
    let document: StoredDocument | null;
    try {
      document = await this.vectorStore.findById(id);
    } catch (error) {
      return rethrowAsUnavailable(error, this.logger, 'lecture du document');
    }
    if (!document) throw new NotFoundException(`Document ${id} introuvable`);
    return document;
  }
}
