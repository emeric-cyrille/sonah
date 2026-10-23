import { createHash } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { consoleLogger, type DocumentInput, type RagLogger } from '../types';
import type { VectorStoreService } from '../vector-store.service';
import { loadProcedureSheets } from './load';
import type { ProcedureSheet } from './schema';

/** Identifiant de source commun à toutes les fiches de démarches (suppression des fiches retirées). */
export const PROCEDURES_SOURCE_ID = 'procedures';

export function procedureChunkKey(id: string): string {
  return `procedure:${id}`;
}

/** Texte lisible de la fiche (contenu stocké et recherche plein texte). */
export function procedureContent(sheet: ProcedureSheet): string {
  const lines: string[] = [sheet.title_fr];
  if (sheet.title_en) lines.push(sheet.title_en);
  if (sheet.authority) lines.push(`Autorité : ${sheet.authority.name}`);
  if (sheet.where.length > 0) lines.push(`Où : ${sheet.where.join(' ; ')}`);
  if (sheet.who_can_apply) lines.push(`Qui peut faire la demande : ${sheet.who_can_apply}`);
  if (sheet.documents.length > 0) lines.push(`Pièces : ${sheet.documents.join(' ; ')}`);
  if (sheet.steps.length > 0) {
    lines.push(`Étapes : ${sheet.steps.map((s) => `${s.order}. ${s.description}`).join(' ')}`);
  }
  if (sheet.cost?.description) lines.push(`Coût : ${sheet.cost.description}`);
  if (sheet.delay) lines.push(`Délai : ${sheet.delay}`);
  if (sheet.validity) lines.push(`Validité : ${sheet.validity}`);
  return lines.join('\n');
}

/**
 * Texte vectorisé : titres, mots-clés, autorité et résumé des étapes. Les fiches sont courtes :
 * un seul fragment par fiche, la fiche complète restant dans les métadonnées.
 */
export function procedureEmbeddingText(sheet: ProcedureSheet): string {
  const steps = sheet.steps
    .slice(0, 6)
    .map((step) => step.description)
    .join(' ');
  return [
    `Démarche administrative : ${sheet.title_fr}${sheet.title_en ? ` (${sheet.title_en})` : ''}`,
    [...sheet.keywords_fr, ...sheet.keywords_en].join(', '),
    sheet.authority ? `Autorité : ${sheet.authority.name}` : '',
    steps.length > 0 ? `Étapes : ${steps}` : '',
  ]
    .filter((part) => part.length > 0)
    .join('\n')
    .slice(0, 2000);
}

/** Empreinte du contenu d'une fiche : une fiche modifiée est revectorisée même en reprise. */
export function procedureFingerprint(sheet: ProcedureSheet, embeddingText: string): string {
  return createHash('sha256')
    .update(JSON.stringify(sheet))
    .update('\n')
    .update(embeddingText)
    .digest('hex')
    .slice(0, 16);
}

/** Document indexé pour une fiche (type PROCEDURE, toujours « en vigueur »). */
export function procedureToDocument(sheet: ProcedureSheet): DocumentInput {
  const url = sheet.sources.find((source) => source.url)?.url ?? `sonah://procedures/${sheet.id}`;
  return {
    chunkKey: procedureChunkKey(sheet.id),
    sourceId: PROCEDURES_SOURCE_ID,
    type: 'PROCEDURE',
    title: sheet.title_fr.slice(0, 300),
    reference: `Fiche ${sheet.id}`.slice(0, 100),
    content: procedureContent(sheet).slice(0, 20_000),
    source: url.slice(0, 500),
    category: sheet.category.slice(0, 100),
    metadata: {
      shortTitle: 'Fiche démarche',
      documentType: 'PROCEDURE',
      procedureId: sheet.id,
      status: 'in_force',
      sources: sheet.sources,
      verified_at: sheet.verified_at,
      unverified: sheet.unverified,
      language: 'fr',
      fingerprint: procedureFingerprint(sheet, procedureEmbeddingText(sheet)),
      procedure: sheet,
    },
  };
}

export interface SeedProceduresOptions {
  readonly proceduresDir: string;
  readonly vectorStore: VectorStoreService;
  readonly logger?: RagLogger;
  /**
   * N'indexe que les fiches absentes ou modifiées (empreinte) pour le modèle d'embedding courant :
   * reprise d'une indexation interrompue sans recalculer les fiches inchangées.
   */
  readonly onlyMissing?: boolean;
}

export interface SeedProceduresReport {
  readonly sourceId: string;
  /** Fiches lues dans le dossier ; null si le dossier est absent (rien n'est modifié). */
  readonly sheets: number | null;
  readonly indexed: number;
  readonly staleDeleted: number;
}

/**
 * Indexe les fiches de démarches (data/procedures/*.json) : un document PROCEDURE par fiche.
 * Idempotent ; avec `onlyMissing`, seules les fiches absentes sont vectorisées. Les fiches
 * retirées du dossier sont supprimées de la base. Dossier absent : rien n'est indexé ni supprimé.
 */
export async function seedProcedures(
  options: SeedProceduresOptions,
): Promise<SeedProceduresReport> {
  const logger = options.logger ?? consoleLogger;
  const sheets = await loadProcedureSheets(options.proceduresDir);
  if (sheets.length === 0 && !(await directoryExists(options.proceduresDir))) {
    logger.warn(`Aucune fiche de démarche : dossier ${options.proceduresDir} absent`);
    return { sourceId: PROCEDURES_SOURCE_ID, sheets: null, indexed: 0, staleDeleted: 0 };
  }
  logger.log(`→ Fiches de démarches (${sheets.length})`);

  const items = sheets.map((sheet) => ({
    doc: procedureToDocument(sheet),
    embeddingText: procedureEmbeddingText(sheet),
  }));
  const existing = options.onlyMissing
    ? await options.vectorStore.indexedFingerprints(PROCEDURES_SOURCE_ID)
    : new Map<string, string | null>();
  const missing = items.filter(
    (item) => existing.get(item.doc.chunkKey) !== item.doc.metadata?.fingerprint,
  );
  if (missing.length > 0) await options.vectorStore.upsertMany(missing);
  const staleDeleted = await options.vectorStore.deleteStaleChunks(
    PROCEDURES_SOURCE_ID,
    items.map((item) => item.doc.chunkKey),
  );
  logger.log(
    `  ${missing.length} fiche(s) indexée(s)` +
      (options.onlyMissing ? `, ${items.length - missing.length} inchangée(s)` : '') +
      (staleDeleted > 0 ? `, ${staleDeleted} fiche(s) retirée(s)` : ''),
  );
  return {
    sourceId: PROCEDURES_SOURCE_ID,
    sheets: sheets.length,
    indexed: missing.length,
    staleDeleted,
  };
}

async function directoryExists(dir: string): Promise<boolean> {
  try {
    return (await stat(dir)).isDirectory();
  } catch {
    return false;
  }
}
