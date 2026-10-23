/**
 * Indexe les textes officiels (data/sources) dans la base vectorielle et le graphe, puis les fiches
 * de démarches (data/procedures, ou PROCEDURES_DIR) dans la base vectorielle.
 * En production : docker compose exec api node dist/scripts/seed.js [--if-empty]
 *
 * --if-empty : n'indexe que les fragments absents pour le modèle d'embedding courant (premier
 * déploiement, changement de modèle, ou reprise d'une indexation interrompue). Sans fragment
 * manquant, rien n'est recalculé.
 * Les fiches de démarches absentes ou modifiées sont (ré)indexées ; les fiches retirées du
 * dossier sont supprimées de la base.
 */
import { Logger } from '@nestjs/common';
import { createPrismaClient } from '@sonah/database';
import {
  createEmbedder,
  embedderConfigFromEnv,
  GraphStoreService,
  seedLegalSources,
  seedProcedures,
  VectorStoreService,
} from '@sonah/rag';
import * as path from 'node:path';
import { validateEnv } from '../config/env';

async function main(): Promise<void> {
  const logger = new Logger('Seed');
  const env = validateEnv(process.env);
  const sourcesDir = process.env.SOURCES_DIR ?? path.resolve(process.cwd(), 'data/sources');
  const proceduresDir = process.env.PROCEDURES_DIR ?? path.resolve(sourcesDir, '../procedures');

  const prisma = createPrismaClient();
  const embedder = createEmbedder(embedderConfigFromEnv(process.env), logger);
  const graphStore = env.NEO4J_URI
    ? GraphStoreService.connect(
        { uri: env.NEO4J_URI, user: env.NEO4J_USER, password: env.NEO4J_PASSWORD },
        logger,
      )
    : undefined;

  try {
    const vectorStore = new VectorStoreService(prisma, embedder, logger);
    const onlyMissing = process.argv.includes('--if-empty');

    logger.log(`Indexation de ${sourcesDir} avec ${embedder.model}`);
    const reports = await seedLegalSources({
      sourcesDir,
      vectorStore,
      graphStore,
      logger,
      onlyMissing,
    });
    for (const report of reports) {
      logger.log(`${report.sourceId} : ${report.articles} articles, ${report.chunks} fragments`);
    }
    const procedures = await seedProcedures({ proceduresDir, vectorStore, logger, onlyMissing });
    logger.log(
      procedures.sheets === null
        ? `Fiches de démarches : dossier ${proceduresDir} absent`
        : `Fiches de démarches : ${procedures.sheets} fiche(s), ${procedures.indexed} indexée(s), ${procedures.staleDeleted} retirée(s)`,
    );
  } finally {
    await prisma.$disconnect();
    await graphStore?.close();
  }
}

main().catch((error: unknown) => {
  new Logger('Seed').error('Échec du seed', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
