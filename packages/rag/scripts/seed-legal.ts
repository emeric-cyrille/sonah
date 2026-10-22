/**
 * Indexe la Constitution et le Code du travail (data/sources) dans pgvector et Neo4j.
 *
 *   DATABASE_URL=... [OPENAI_API_KEY=...] [NEO4J_URI=... NEO4J_USER=... NEO4J_PASSWORD=...] pnpm --filter @sonah/rag seed
 */
import path from 'node:path';
import { createPrismaClient } from '@sonah/database';
import { createEmbedder, GraphStoreService, seedLegalSources, VectorStoreService } from '../src';

async function main(): Promise<void> {
  const sourcesDir = process.env.SOURCES_DIR ?? path.resolve(__dirname, '../../../data/sources');
  const prisma = createPrismaClient();
  const embedder = createEmbedder({
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL,
  });
  const vectorStore = new VectorStoreService(prisma, embedder);

  let graphStore: GraphStoreService | undefined;
  if (process.env.NEO4J_URI) {
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
    const reports = await seedLegalSources({ sourcesDir, vectorStore, graphStore });
    console.table(reports);
  } finally {
    await prisma.$disconnect();
    await graphStore?.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
