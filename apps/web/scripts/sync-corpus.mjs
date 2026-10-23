/**
 * Génère src/lib/corpus-sources.ts à partir de data/sources/manifest.json (liste des textes
 * indexés par l'API). Lancé avant chaque build : la page « À propos » reste alignée sur le corpus.
 * Sans manifeste (image Docker du site seul), le fichier versionné est conservé tel quel.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(here, '../../../data/sources/manifest.json');
const outputPath = path.resolve(here, '../src/lib/corpus-sources.ts');

if (!existsSync(manifestPath)) {
  console.log('sync-corpus : manifeste absent, liste des textes inchangée');
  process.exit(0);
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const sources = manifest.sources.map((source) => ({
  id: source.id,
  shortTitle: source.shortTitle,
  title: { fr: source.titleFr ?? source.title, en: source.titleEn ?? source.title },
  type: source.type,
  category: source.category,
  issuingBody: source.issuingBody,
  jurisdiction: source.jurisdiction,
  binding: source.binding,
  language: source.language,
  date: source.date,
  url: source.url,
  // Une source « metadata-only » est citée par référence, sans être indexée
  indexed: source.redistribution !== 'metadata-only',
  ...(source.amends?.sourceId ? { amends: source.amends.sourceId } : {}),
  domains: source.domains ?? [],
}));

let content = `// Fichier généré par scripts/sync-corpus.mjs depuis data/sources/manifest.json : ne pas modifier.

export type CorpusSourceType =
  | 'CONSTITUTION'
  | 'LAW'
  | 'DECREE'
  | 'PROCEDURE'
  | 'FORM'
  | 'STRATEGY'
  | 'INTERNATIONAL'
  | 'OTHER';

export interface CorpusSource {
  readonly id: string;
  readonly shortTitle: string;
  readonly title: { readonly fr: string; readonly en: string };
  readonly type: CorpusSourceType;
  readonly category: string;
  readonly issuingBody: string;
  readonly jurisdiction: string;
  readonly binding: 'binding' | 'advisory';
  readonly language: 'fr' | 'en';
  readonly date: string;
  readonly url: string;
  readonly indexed: boolean;
  readonly amends?: string;
  readonly domains: readonly string[];
}

export const CORPUS_SOURCES: readonly CorpusSource[] = ${JSON.stringify(sources, null, 2)};
`;

try {
  const prettier = await import('prettier');
  const config = (await prettier.resolveConfig(outputPath)) ?? {};
  content = await prettier.format(content, { ...config, filepath: outputPath });
} catch {
  // Sans Prettier, le fichier reste valide (formaté par « pnpm format »)
}

const previous = existsSync(outputPath) ? await readFile(outputPath, 'utf8') : '';
if (previous !== content) {
  await writeFile(outputPath, content);
  console.log(`sync-corpus : ${sources.length} sources écrites dans src/lib/corpus-sources.ts`);
}
