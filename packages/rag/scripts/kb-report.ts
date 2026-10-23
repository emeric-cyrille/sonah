/**
 * Rapport sur la base de connaissances, sans base de données : découpe chaque texte du manifeste
 * et affiche le nombre d'unités, de fragments et d'articles, ainsi que les statuts juridiques.
 *
 *   pnpm --filter @sonah/rag kb:report                  # tous les textes (télécharge les non redistribuables)
 *   pnpm --filter @sonah/rag kb:report -- --offline     # cache uniquement
 *   pnpm --filter @sonah/rag kb:report -- --show <id>   # détail des unités d'un texte
 */
import path from 'node:path';
import {
  chunkSource,
  computeLegalStatuses,
  loadSourceManifest,
  loadSourceText,
  SourceUnavailableError,
  unitKeyOf,
  type LegalChunk,
} from '../src';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const sourcesDir = process.env.SOURCES_DIR ?? path.resolve(__dirname, '../../../data/sources');
  const showIndex = args.indexOf('--show');
  const show = showIndex >= 0 ? args[showIndex + 1] : undefined;
  const remote = args.includes('--offline') ? 'cache-only' : 'fetch';

  const sources = await loadSourceManifest(sourcesDir);
  const chunksBySource = new Map<string, LegalChunk[]>();
  for (const source of sources) {
    if (source.redistribution === 'metadata-only') continue;
    try {
      const text = await loadSourceText(source, { sourcesDir, remote });
      chunksBySource.set(source.id, chunkSource(source, text));
    } catch (error) {
      if (!(error instanceof SourceUnavailableError)) throw error;
      console.warn(`! ${error.message}`);
    }
  }
  const statuses = computeLegalStatuses(sources, chunksBySource);

  const rows = sources.map((source) => {
    const chunks = chunksBySource.get(source.id) ?? [];
    const units = new Map<string, LegalChunk>();
    for (const chunk of chunks) units.set(unitKeyOf(chunk), chunk);
    const count = (status: string): number =>
      [...units.values()].filter((chunk) => statuses.get(chunk.key)?.status === status).length;
    // Numéros d'articles absents entre 1 et le dernier (à vérifier : lacune du texte ou défaut de découpage)
    const numbers = new Set(
      chunks
        .filter((chunk) => chunk.articleNumber && !chunk.amendsArticle)
        .map((chunk) => Number.parseInt(chunk.articleNumber as string, 10)),
    );
    const last = Math.max(0, ...numbers);
    const gaps = source.amends
      ? []
      : Array.from({ length: last }, (_, index) => index + 1).filter((n) => !numbers.has(n));
    return {
      id: source.id,
      docId: source.docId,
      mode: source.chunking.mode,
      units: units.size,
      chunks: chunks.length,
      articles: new Set(chunks.map((chunk) => chunk.articleNumber).filter(Boolean)).size,
      amended: count('amended'),
      repealed: count('repealed'),
      gaps: gaps.join(',') || '-',
      pages: chunks.some((chunk) => chunk.pageStart) ? 'oui' : '-',
      redistribution: source.redistribution,
    };
  });
  console.table(rows);

  if (show) {
    for (const chunk of chunksBySource.get(show) ?? []) {
      const status = statuses.get(chunk.key);
      const flag =
        status?.status === 'in_force'
          ? ''
          : ` [${status?.status} → ${status?.amendedBy ?? status?.repealedBy}]`;
      console.log(
        `\n# ${chunk.key} | ${chunk.reference} (${chunk.part}/${chunk.totalParts}) p.${chunk.pageStart ?? '?'}${flag}\n  ${chunk.path.join(' › ')}\n  ${chunk.content.slice(0, 220).replace(/\n/g, ' ⏎ ')}`,
      );
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
