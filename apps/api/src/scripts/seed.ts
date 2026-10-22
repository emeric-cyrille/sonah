/**
 * Indexe les textes officiels (data/sources) dans la base vectorielle et le graphe.
 * En production : docker compose exec api node dist/scripts/seed.js [--if-empty]
 *
 * --if-empty : n'indexe que si aucun document n'existe pour le modèle d'embedding courant
 * (premier déploiement, ou changement de modèle après ajout d'OPENAI_API_KEY).
 */
import { Logger } from '@nestjs/common';
import { createPrismaClient } from '@sonah/database';
import {
  createEmbedder,
  GraphStoreService,
  seedLegalSources,
  VectorStoreService,
} from '@sonah/rag';
import path from 'node:path';
import { validateEnv } from '../config/env';

async function main(): Promise<void> {
  const logger = new Logger('Seed');
  const env = validateEnv(process.env);
  const sourcesDir = process.env.SOURCES_DIR ?? path.resolve(process.cwd(), 'data/sources');

  const prisma = createPrismaClient();
  const embedder = createEmbedder(
    { openaiApiKey: env.OPENAI_API_KEY, openaiEmbeddingModel: env.OPENAI_EMBEDDING_MODEL },
    logger,
  );
  const graphStore = env.NEO4J_URI
    ? GraphStoreService.connect(
        { uri: env.NEO4J_URI, user: env.NEO4J_USER, password: env.NEO4J_PASSWORD },
        logger,
      )
    : undefined;

  try {
    const vectorStore = new VectorStoreService(prisma, embedder, logger);
    if (process.argv.includes('--if-empty')) {
      const indexed = await vectorStore.countIndexed();
      if (indexed > 0) {
        logger.log(`${indexed} fragments déjà indexés avec ${embedder.model} : rien à faire`);
        return;
      }
    }

    logger.log(`Indexation de ${sourcesDir} avec ${embedder.model}`);
    const reports = await seedLegalSources({
      sourcesDir,
      vectorStore,
      graphStore,
      logger,
    });
    for (const report of reports) {
      logger.log(`${report.sourceId} : ${report.articles} articles, ${report.chunks} fragments`);
    }
  } finally {
    await prisma.$disconnect();
    await graphStore?.close();
  }
}

main().catch((error: unknown) => {
  new Logger('Seed').error('Échec du seed', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
