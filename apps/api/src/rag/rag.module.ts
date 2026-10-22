import { Logger, Module, type OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createEmbedder, GraphStoreService, VectorStoreService } from '@sonah/rag';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { RagController } from './rag.controller';
import { GRAPH_STORE, VECTOR_STORE } from './rag.tokens';

const logger = new Logger('RagModule');

@Module({
  controllers: [RagController],
  providers: [
    {
      provide: VECTOR_STORE,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, config: ConfigService<Env, true>): VectorStoreService => {
        const embedder = createEmbedder(
          {
            openaiApiKey: config.get('OPENAI_API_KEY', { infer: true }),
            openaiEmbeddingModel: config.get('OPENAI_EMBEDDING_MODEL', { infer: true }),
          },
          logger,
        );
        logger.log(`Recherche vectorielle avec le modèle ${embedder.model}`);
        return new VectorStoreService(prisma, embedder, logger);
      },
    },
    {
      provide: GRAPH_STORE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): GraphStoreService | null => {
        const uri = config.get('NEO4J_URI', { infer: true });
        if (!uri) {
          logger.warn('NEO4J_URI absente : base graphe désactivée');
          return null;
        }
        return GraphStoreService.connect(
          {
            uri,
            user: config.get('NEO4J_USER', { infer: true }),
            password: config.get('NEO4J_PASSWORD', { infer: true }),
          },
          logger,
        );
      },
    },
  ],
  exports: [VECTOR_STORE, GRAPH_STORE],
})
export class RagModule implements OnModuleDestroy {
  constructor(
    @Optional() @Inject(GRAPH_STORE) private readonly graphStore: GraphStoreService | null,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.graphStore?.close();
  }
}
