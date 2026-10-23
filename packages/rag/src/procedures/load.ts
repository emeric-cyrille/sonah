import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ZodError } from 'zod';
import { parseProcedureSheet, type ProcedureSheet } from './schema';

/** Erreur de lecture d'une fiche, avec le fichier concerné. */
export class ProcedureSheetError extends Error {
  constructor(
    readonly file: string,
    message: string,
  ) {
    super(`${file} : ${message}`);
    this.name = 'ProcedureSheetError';
  }
}

function describe(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || '(racine)'} ${issue.message}`)
      .join(' ; ');
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Charge les fiches de démarches d'un dossier (un fichier JSON par fiche, ordre alphabétique).
 * Dossier absent : liste vide (les fiches sont facultatives). Fiche invalide ou identifiant en
 * double : erreur explicite, pour ne jamais indexer une fiche partiellement lue.
 */
export async function loadProcedureSheets(dir: string): Promise<ProcedureSheet[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  // Les fichiers *.schema.json décrivent le format des fiches : ce ne sont pas des fiches
  const files = entries
    .filter((name) => name.endsWith('.json') && !name.endsWith('.schema.json'))
    .sort();
  const sheets: ProcedureSheet[] = [];
  const seen = new Map<string, string>();
  for (const file of files) {
    let sheet: ProcedureSheet;
    try {
      sheet = parseProcedureSheet(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
    } catch (error) {
      throw new ProcedureSheetError(file, describe(error));
    }
    const previous = seen.get(sheet.id);
    if (previous) {
      throw new ProcedureSheetError(
        file,
        `identifiant « ${sheet.id} » déjà utilisé par ${previous}`,
      );
    }
    seen.set(sheet.id, file);
    sheets.push(sheet);
  }
  return sheets;
}
