/**
 * Calibre le seuil de pertinence du modèle d'embedding courant sur les textes indexés.
 *
 * Pour chaque question du jeu d'évaluation (eval/questions.jsonl), on mesure la similarité cosinus
 * MAXIMALE obtenue par une recherche purement vectorielle (sans fusion plein texte, dont l'ordre ne
 * suit pas le cosinus), dans le périmètre de l'agent citoyen (textes contraignants par défaut).
 * On compare les questions couvertes par le corpus (réponse citée attendue) aux questions hors sujet,
 * puis on propose le seuil qui sépare le mieux les deux distributions.
 *
 *   DATABASE_URL=... pnpm --filter @sonah/rag calibrate [-- --scope binding|all] [--questions <fichier>]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createPrismaClient } from '@sonah/database';
import {
  BINDING_DOCUMENT_TYPES,
  createEmbedder,
  embedderConfigFromEnv,
  VectorStoreService,
  type SearchOptions,
} from '../src';

interface GoldItem {
  readonly id: string;
  readonly question: string;
  readonly category: string;
  readonly expected_sources: readonly string[];
  readonly expected_verdict: string;
}

function argValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function quantile(values: readonly number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))] ?? 0;
}

const fmt = (value: number): string => value.toFixed(3);

async function main(): Promise<void> {
  const file = argValue('--questions') ?? path.resolve(__dirname, '../../../eval/questions.jsonl');
  const scope = argValue('--scope') ?? 'binding';
  const options: SearchOptions = {
    hybrid: false,
    ...(scope === 'binding' ? { types: BINDING_DOCUMENT_TYPES } : {}),
  };
  const items = readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as GoldItem);

  const prisma = createPrismaClient();
  const embedder = createEmbedder(embedderConfigFromEnv(process.env));
  const store = new VectorStoreService(prisma, embedder);

  try {
    console.log(
      `Modèle : ${embedder.model} (${await store.countIndexed()} fragments), périmètre : ${scope}, ` +
        `seuil actuel : ${embedder.relevanceThreshold}\n`,
    );
    const maxCosine = async (query: string): Promise<number> =>
      (await store.search(query, 1, options))[0]?.score ?? -1;

    const groups: Record<'inScope' | 'offTopic' | 'notCovered', number[]> = {
      inScope: [],
      offTopic: [],
      notCovered: [],
    };
    for (const item of items) {
      const score = await maxCosine(item.question);
      const group =
        item.category === 'out-of-scope'
          ? 'offTopic'
          : item.expected_verdict === 'ANSWERED_WITH_CITATIONS' && item.expected_sources.length > 0
            ? 'inScope'
            : item.category === 'procedure-not-covered'
              ? 'notCovered'
              : null;
      if (!group) continue;
      groups[group].push(score);
      if (group !== 'inScope') console.log(`${group.padEnd(10)} ${fmt(score)}  ${item.id}`);
    }

    for (const [name, values] of Object.entries(groups)) {
      console.log(
        `\n${name} (n = ${values.length}) : min ${fmt(Math.min(...values))}, p10 ${fmt(quantile(values, 0.1))}, ` +
          `médiane ${fmt(quantile(values, 0.5))}, max ${fmt(Math.max(...values))}`,
      );
    }

    // Seuil qui maximise l'exactitude équilibrée (questions couvertes gardées, hors sujet écartées)
    const { inScope, offTopic } = groups;
    const candidates = [...new Set([...inScope, ...offTopic])].sort((a, b) => a - b);
    let best = { threshold: 0, balanced: -1, kept: 0, rejected: 0 };
    for (const [index, low] of candidates.entries()) {
      const high = candidates[index + 1] ?? low + 0.01;
      const threshold = (low + high) / 2;
      const kept = inScope.filter((s) => s >= threshold).length;
      const rejected = offTopic.filter((s) => s < threshold).length;
      const balanced = (kept / inScope.length + rejected / offTopic.length) / 2;
      // À égalité, le seuil le plus bas (on préfère garder une question couverte)
      if (balanced > best.balanced) best = { threshold, balanced, kept, rejected };
    }
    console.log('\nSeuil   couvertes gardées   hors sujet écartés   non couvertes écartées');
    for (let t = 0.8; t <= 0.8601; t += 0.005) {
      const kept = inScope.filter((s) => s >= t).length;
      const rejected = offTopic.filter((s) => s < t).length;
      const notCovered = groups.notCovered.filter((s) => s < t).length;
      console.log(
        `${t.toFixed(3)}   ${kept}/${inScope.length}`.padEnd(30) +
          `${rejected}/${offTopic.length}`.padEnd(21) +
          `${notCovered}/${groups.notCovered.length}`,
      );
    }
    console.log(
      `\nSeuil conseillé : EMBEDDING_RELEVANCE_THRESHOLD=${best.threshold.toFixed(3)} ` +
        `(couvertes gardées ${best.kept}/${inScope.length}, hors sujet écartées ` +
        `${best.rejected}/${offTopic.length}, exactitude équilibrée ${fmt(best.balanced)})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
