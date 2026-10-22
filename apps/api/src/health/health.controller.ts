import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { GraphStoreService, VectorStoreService } from '@sonah/rag';
import { LANGUAGE_MODEL, type LanguageModel } from '../chat/language-model';
import { PrismaService } from '../prisma/prisma.service';
import { GRAPH_STORE, VECTOR_STORE } from '../rag/rag.tokens';

type ServiceState = 'up' | 'down' | 'disabled';

export interface ReadinessReport {
  status: 'ready' | 'degraded';
  services: { database: ServiceState; graph: ServiceState; languageModel: string };
  index: { embeddingModel: string; documents: number | null };
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(VECTOR_STORE) private readonly vectorStore: VectorStoreService,
    @Optional() @Inject(GRAPH_STORE) private readonly graphStore: GraphStoreService | null,
    @Optional() @Inject(LANGUAGE_MODEL) private readonly languageModel: LanguageModel | null,
  ) {}

  /** État des dépendances : 503 si la base de données est injoignable. */
  @Get('ready')
  @HttpCode(200)
  async ready(): Promise<ReadinessReport> {
    const database: ServiceState = (await this.prisma.isReachable()) ? 'up' : 'down';

    let graph: ServiceState = 'disabled';
    if (this.graphStore) {
      graph = await this.graphStore.verifyConnectivity().then(
        () => 'up' as const,
        () => 'down' as const,
      );
    }

    const documents =
      database === 'up' ? await this.vectorStore.countIndexed().catch(() => null) : null;
    const report: ReadinessReport = {
      status: database === 'up' && graph !== 'down' ? 'ready' : 'degraded',
      services: { database, graph, languageModel: this.languageModel?.name ?? 'extractif' },
      index: { embeddingModel: this.vectorStore.embeddingModel, documents },
    };
    if (database === 'down') throw new ServiceUnavailableException(report);
    return report;
  }
}
