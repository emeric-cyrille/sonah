/**
 * Exporte la base de connaissances au format attendu par le code de référence de l'UIT
 * (github.com/CrashingGuru/ITUAIReadiness, simulation/server/knowledge/ingest.py) :
 *
 *   data/itu-export/InputDocs/
 *   ├── Inputs.md                 ← index des documents avec liens de référence
 *   ├── AI_Strategies/*.txt       ← textes nationaux et références internationales
 *   └── AI_Use_Cases/*.txt        ← procédures et cas d'usage
 *
 * ingest.py lit les .txt tels quels (découpage en ~512 mots) et ignore Inputs.md : chaque fichier
 * commence donc par un en-tête de métadonnées (source, version, licence) puis le texte article par
 * article, avec le statut juridique des articles modifiés. Seuls les textes redistribuables sont
 * exportés ; les autres figurent dans l'index avec leur lien de téléchargement.
 *
 *   pnpm --filter @sonah/rag kb:export-itu [-- --out <dossier>]
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  chunkSource,
  computeLegalStatuses,
  loadSourceManifest,
  loadSourceText,
  SourceUnavailableError,
  unitKeyOf,
  type LegalChunk,
  type LegalSource,
} from '../src';

/** Type de document au sens de ingest.py (_SOURCE_TYPE_PATTERNS et Inputs.md). */
function ituSourceType(source: LegalSource): string {
  if (source.id.startsWith('itu-')) return 'standards_document';
  if (source.type === 'STRATEGY') return 'national_strategy';
  if (source.type === 'INTERNATIONAL' && source.binding === 'advisory')
    return 'international_org_report';
  return 'policy_document';
}

/** Nom de fichier stable et explicite (pays et année), comme dans le dépôt de référence. */
function exportFileName(source: LegalSource): string {
  const prefix =
    source.jurisdiction === 'CM'
      ? 'Cameroon'
      : source.jurisdiction === 'INT'
        ? 'Global'
        : source.jurisdiction;
  const base = source.id.replace(/-en$/, '');
  const slug = base
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('_');
  const year = /\d{4}/.test(base) ? '' : `_${source.date.slice(0, 4)}`;
  return `${prefix}_${slug}${year}_${source.language.toUpperCase()}.txt`;
}

const STATUS_LABEL = { in_force: 'in force', amended: 'AMENDED', repealed: 'REPEALED' } as const;

function renderSource(
  source: LegalSource,
  chunks: readonly LegalChunk[],
  statuses: ReturnType<typeof computeLegalStatuses>,
): string {
  const header = [
    `Title: ${source.titleEn}`,
    `Titre : ${source.titleFr}`,
    `Document ID: ${source.docId}`,
    `Issuing body: ${source.issuingBody}`,
    `Country/jurisdiction: ${source.jurisdiction === 'CM' ? 'Cameroon' : source.jurisdiction}`,
    `Type: ${source.type} (${source.binding})`,
    `Version: ${source.version} — ${source.date}`,
    `Source URL: ${source.url}`,
    `Accessed: ${source.accessedAt} — SHA-256 of original: ${source.sha256 ?? 'n/a'}`,
    `Licence: ${source.license}`,
    `ITU AI Readiness dimensions: ${source.ituDimensions.join(', ') || 'n/a'}`,
    source.derivation ? `Derivation: ${source.derivation}` : undefined,
    source.note ? `Note: ${source.note}` : undefined,
  ].filter(Boolean);

  const units = new Map<string, LegalChunk[]>();
  for (const chunk of chunks)
    units.set(unitKeyOf(chunk), [...(units.get(unitKeyOf(chunk)) ?? []), chunk]);
  const body = [...units.values()].map((parts) => {
    const first = parts[0] as LegalChunk;
    const status = statuses.get(first.key);
    const flag =
      status && status.status !== 'in_force'
        ? ` [${STATUS_LABEL[status.status]}: current wording in ${status.currentVersion ?? status.amendedBy ?? status.repealedBy}]`
        : '';
    const context = first.path.length > 0 ? `${first.path.join(' > ')}\n` : '';
    return `### ${first.reference}${flag}\n${context}${parts.map((part) => part.content).join('\n')}`;
  });
  return `${header.join('\n')}\n\n${body.join('\n\n')}\n`;
}

async function main(): Promise<void> {
  const sourcesDir = process.env.SOURCES_DIR ?? path.resolve(__dirname, '../../../data/sources');
  const outIndex = process.argv.indexOf('--out');
  const outDir =
    outIndex >= 0 && process.argv[outIndex + 1]
      ? path.resolve(process.argv[outIndex + 1] as string)
      : path.resolve(__dirname, '../../../data/itu-export');
  const inputDocs = path.join(outDir, 'InputDocs');

  const sources = await loadSourceManifest(sourcesDir);
  const chunks = new Map<string, LegalChunk[]>();
  for (const source of sources) {
    if (source.redistribution === 'metadata-only') continue;
    try {
      chunks.set(
        source.id,
        chunkSource(source, await loadSourceText(source, { sourcesDir, remote: 'cache-only' })),
      );
    } catch (error) {
      if (!(error instanceof SourceUnavailableError)) throw error;
    }
  }
  const statuses = computeLegalStatuses(sources, chunks);

  await rm(inputDocs, { recursive: true, force: true });
  await mkdir(path.join(inputDocs, 'AI_Strategies'), { recursive: true });
  await mkdir(path.join(inputDocs, 'AI_Use_Cases'), { recursive: true });

  const rows: Record<'AI_Strategies' | 'AI_Use_Cases', string[]> = {
    AI_Strategies: [],
    AI_Use_Cases: [],
  };
  for (const source of sources) {
    const sourceChunks = chunks.get(source.id);
    const exported = source.redistribution === 'redistributable' && sourceChunks !== undefined;
    const fileName = exportFileName(source);
    if (exported) {
      await writeFile(
        path.join(inputDocs, source.ituFolder, fileName),
        renderSource(source, sourceChunks, statuses),
      );
    }
    const list = rows[source.ituFolder];
    const name = exported
      ? `\`${fileName}\``
      : `— (not redistributed: [download](${source.fetch?.url ?? source.url}))`;
    list.push(
      `| ${list.length + 1} | ${name} | \`${ituSourceType(source)}\` | **${source.titleEn}** — ${source.issuingBody}, ${source.date}. ${source.binding === 'binding' ? 'Binding.' : 'Advisory.'} Dimensions: ${source.ituDimensions.join(', ') || 'n/a'}. [Source](${source.url}) |`,
    );
  }

  const table = (folder: 'AI_Strategies' | 'AI_Use_Cases'): string =>
    [
      '| # | Filename | Type | Description |',
      '|---|----------|------|-------------|',
      ...rows[folder],
    ].join('\n');
  const index = `# Input Documents Manifest — Sonah (Cameroon)

This folder exports the Sonah knowledge base in the layout read by the ITU AI Readiness reference code
(\`simulation/server/knowledge/ingest.py\`, repository CrashingGuru/ITUAIReadiness). Copy the two subfolders into
\`simulation/server/knowledge/InputDocs/\` and run \`python -m server.knowledge.ingest\`.

Documents are organized into two subfolders:
- **\`AI_Strategies/\`** — Cameroonian laws and strategies, and international AI references used for gap analysis
- **\`AI_Use_Cases/\`** — administrative procedures (public-service use cases) and ITU standards

Each \`.txt\` file starts with a metadata header (source URL, version, SHA-256 of the original, licence), then the
text unit by unit (\`### Article 6\`). Articles amended by a later text are flagged \`[AMENDED: current wording in <unit>]\` so
that the current wording is cited. Generated by \`pnpm --filter @sonah/rag kb:export-itu\` from
\`data/sources/manifest.json\`; do not edit by hand.

---

## AI_Strategies/ (${rows.AI_Strategies.length} entries)

${table('AI_Strategies')}

---

## AI_Use_Cases/ (${rows.AI_Use_Cases.length} entries)

${table('AI_Use_Cases')}

---

## Notes

- Texts marked "not redistributed" are listed with their official download link only (licence or size).
- OCR-derived texts (scanned originals) may contain recognition errors: check figures against the official PDF.
- The ITU AI Readiness 2.0 dimensions listed per document come from \`simulation/data/framework/dimensions.json\`.
`;
  await writeFile(path.join(inputDocs, 'Inputs.md'), index);
  console.log(`Export écrit dans ${inputDocs}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
