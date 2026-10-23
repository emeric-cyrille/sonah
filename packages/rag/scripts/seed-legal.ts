/**
 * Indexe les textes de data/sources (manifest.json) dans pgvector et Neo4j, puis les fiches de
 * démarches de data/procedures (PROCEDURES_DIR) dans pgvector.
 *
 *   DATABASE_URL=... [GEMINI_API_KEY=... | OPENAI_API_KEY=...] [NEO4J_URI=... NEO4J_USER=... NEO4J_PASSWORD=...] pnpm --filter @sonah/rag seed
 *
 * Options : --offline (textes non redistribuables lus depuis le cache uniquement),
 *           --source <id> (répétable : n'indexe que ces textes),
 *           --only-missing (reprise : n'indexe que les fragments absents ou fiches modifiées),
 *           --procedures-only (fiches de démarches seulement).
 */
import path from 'node:path';
import { createPrismaClient } from '@sonah/database';
import {
  createEmbedder,
  embedderConfigFromEnv,
  GraphStoreService,
  seedLegalSources,
  seedProcedures,
  VectorStoreService,
} from '../src';

function argValues(name: string): string[] {
  const args = process.argv.slice(2);
  return args.flatMap((arg, index) =>
    arg === name && args[index + 1] ? [args[index + 1] as string] : [],
  );
}

async function main(): Promise<void> {
  const sourcesDir = process.env.SOURCES_DIR ?? path.resolve(__dirname, '../../../data/sources');
  const proceduresDir = process.env.PROCEDURES_DIR ?? path.resolve(sourcesDir, '../procedures');
  const onlyMissing = process.argv.includes('--only-missing');
  const proceduresOnly = process.argv.includes('--procedures-only');
  const prisma = createPrismaClient();
  const embedder = createEmbedder(embedderConfigFromEnv(process.env));
  const vectorStore = new VectorStoreService(prisma, embedder);

  let graphStore: GraphStoreService | undefined;
  if (process.env.NEO4J_URI && !proceduresOnly) {
    graphStore = GraphStoreService.connect({
      uri: process.env.NEO4J_URI,
      user: process.env.NEO4J_USER ?? 'neo4j',
      password: process.env.NEO4J_PASSWORD ?? '',
    });
    await graphStore.verifyConnectivity();
  } else {
    console.warn('NEO4J_URI absente : structure des textes non enregistrée dans le graphe');
  }

  try {
    console.log(`Indexation avec le modèle ${embedder.model}`);
    const sourceIds = argValues('--source');
    if (!proceduresOnly) {
      const reports = await seedLegalSources({
        sourcesDir,
        vectorStore,
        graphStore,
        remote: process.argv.includes('--offline') ? 'cache-only' : 'fetch',
        sourceIds: sourceIds.length > 0 ? sourceIds : undefined,
        onlyMissing,
      });
      console.table(reports);
    }
    if (sourceIds.length === 0) {
      console.table([await seedProcedures({ proceduresDir, vectorStore, onlyMissing })]);
    }
  } finally {
    await prisma.$disconnect();
    await graphStore?.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
