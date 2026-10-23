/**
 * Calibre le seuil de pertinence du modèle d'embedding courant sur les textes indexés :
 * compare les scores des bons articles (questions pertinentes) à ceux des questions hors sujet.
 *
 *   DATABASE_URL=... GEMINI_API_KEY=... pnpm --filter @sonah/rag calibrate
 */
import { createPrismaClient } from '@sonah/database';
import { createEmbedder, VectorStoreService } from '../src';

const CODE = 'code-du-travail-1992';
const CONSTITUTION = 'constitution-1996';

const RELEVANT: ReadonlyArray<{ query: string; sourceId: string; expected: string }> = [
  { query: 'Le travail forcé est-il interdit ?', sourceId: CODE, expected: 'Article 2' },
  { query: 'Combien de jours de congé payé par an ?', sourceId: CODE, expected: 'Article 89' },
  {
    query: "Quelle est la durée maximale de la période d'essai ?",
    sourceId: CODE,
    expected: 'Article 28',
  },
  {
    query: 'Un employeur peut-il payer le salaire autrement qu’en argent ?',
    sourceId: CODE,
    expected: 'Article 67',
  },
  {
    query: 'Pour combien de temps le Président de la République est-il élu ?',
    sourceId: CONSTITUTION,
    expected: 'Article 6',
  },
  {
    query: 'Qui détient la souveraineté nationale ?',
    sourceId: CONSTITUTION,
    expected: 'Article 2',
  },
];

const OFF_TOPIC: readonly string[] = [
  'Quel temps fera-t-il demain à Douala ?',
  'Donne-moi une recette de ndolé',
  'Qui a gagné la dernière Coupe d’Afrique des nations ?',
  'Comment réparer une fuite de robinet ?',
];

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const embedder = createEmbedder({
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL,
  });
  const store = new VectorStoreService(prisma, embedder);

  try {
    console.log(`Modèle : ${embedder.model} (${await store.countIndexed()} fragments indexés)\n`);
    const hits: number[] = [];
    for (const { query, sourceId, expected } of RELEVANT) {
      const results = await store.search(query, 5);
      const rank = results.findIndex(
        (result) => result.sourceId === sourceId && result.reference === expected,
      );
      const score = rank >= 0 ? (results[rank]?.score ?? 0) : 0;
      if (rank >= 0) hits.push(score);
      console.log(
        `${rank >= 0 ? `#${rank + 1}` : 'absent'}  ${score.toFixed(3)}  ${query} → ${expected}`,
      );
    }

    const noise: number[] = [];
    for (const query of OFF_TOPIC) {
      const best = (await store.search(query, 1))[0]?.score ?? 0;
      noise.push(best);
      console.log(`hors sujet  ${best.toFixed(3)}  ${query}`);
    }

    const minHit = Math.min(...hits);
    const maxNoise = Math.max(...noise);
    console.log(
      `\nPertinents trouvés : ${hits.length}/${RELEVANT.length}, score min ${minHit.toFixed(3)}`,
    );
    console.log(`Hors sujet : score max ${maxNoise.toFixed(3)}`);
    console.log(
      minHit > maxNoise
        ? `Seuil conseillé : EMBEDDING_RELEVANCE_THRESHOLD=${((minHit + maxNoise) / 2).toFixed(2)}`
        : 'Les distributions se chevauchent : garder un seuil prudent proche du score hors sujet maximal.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
