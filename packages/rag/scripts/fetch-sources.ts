/**
 * Retélécharge chaque document d'origine du manifeste et vérifie son empreinte SHA-256.
 *
 *   pnpm --filter @sonah/rag kb:fetch                 # vérifie tout (réseau requis)
 *   pnpm --filter @sonah/rag kb:fetch -- --cache      # enregistre aussi les textes non redistribuables
 *                                                     # dans data/sources/.cache (utilisé par le seed)
 *   pnpm --filter @sonah/rag kb:fetch -- --strict     # code de sortie 1 si une source est injoignable
 *
 * Les documents téléchargés sont traités comme des données : ils ne sont jamais exécutés.
 * Code de sortie 1 si une empreinte diffère (document modifié par l'éditeur, ou mauvais fichier).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { downloadSource, loadSourceManifest, sha256 } from '../src';

type Status = 'ok' | 'mismatch' | 'unreachable' | 'reference-only';

async function main(): Promise<void> {
  const sourcesDir = process.env.SOURCES_DIR ?? path.resolve(__dirname, '../../../data/sources');
  const writeCache = process.argv.includes('--cache');
  const strict = process.argv.includes('--strict');
  const sources = await loadSourceManifest(sourcesDir);
  const rows: Array<Record<string, string | number>> = [];

  for (const source of sources) {
    if (!source.fetch || !source.sha256) {
      rows.push({ id: source.id, status: 'reference-only' satisfies Status, url: source.url });
      continue;
    }
    let status: Status;
    let detail = '';
    try {
      const buffer = await downloadSource(source.fetch);
      const digest = sha256(buffer);
      status = digest === source.sha256 ? 'ok' : 'mismatch';
      detail = status === 'ok' ? `${buffer.length} octets` : `sha256 obtenu ${digest}`;

      // Copie locale d'un PDF redistribuable : elle doit être identique à l'original
      if (status === 'ok' && source.file?.endsWith('.pdf')) {
        const local = sha256(await readFile(path.join(sourcesDir, source.file)));
        if (local !== source.sha256) {
          status = 'mismatch';
          detail = `copie locale ${source.file} différente (${local})`;
        }
      }
      if (status === 'ok' && writeCache && source.redistribution === 'fetch-only') {
        const cacheDir = path.join(sourcesDir, '.cache');
        await mkdir(cacheDir, { recursive: true });
        await writeFile(path.join(cacheDir, `${source.id}.${source.fetch.format}`), buffer);
        detail += ', mis en cache';
      }
    } catch (error) {
      status = 'unreachable';
      detail = error instanceof Error ? error.message : String(error);
    }
    rows.push({ id: source.id, status, detail: detail.slice(0, 120) });
  }

  console.table(rows);
  const failed = rows.filter(
    (row) => row.status === 'mismatch' || (strict && row.status === 'unreachable'),
  );
  if (failed.length > 0) {
    console.error(
      `${failed.length} source(s) en échec : ${failed.map((row) => row.id).join(', ')}`,
    );
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
