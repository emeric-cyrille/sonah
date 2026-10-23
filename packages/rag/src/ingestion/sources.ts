import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { DOCUMENT_TYPES, ITU_DIMENSIONS, type LegalSource } from '../types';

const regexString = z.string().refine((value) => {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}, 'Expression régulière invalide');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const sourceObjectSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    docId: z.string().regex(/^[A-Z0-9.-]+$/),
    issuingBody: z.string().min(1),
    title: z.string().min(1),
    titleFr: z.string().min(1),
    titleEn: z.string().min(1),
    shortTitle: z.string().min(1).max(60),
    type: z.enum(DOCUMENT_TYPES),
    category: z.string().min(1).max(100),
    jurisdiction: z.string().regex(/^[A-Z]{2,3}$|^INT$/),
    binding: z.enum(['binding', 'advisory']),
    language: z.enum(['fr', 'en']),
    version: z.string().min(1),
    date: isoDate,
    url: z.string().url(),
    accessedAt: isoDate,
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    license: z.string().min(1),
    redistribution: z.enum(['redistributable', 'fetch-only', 'metadata-only']),
    domains: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
    ituDimensions: z.array(z.enum(ITU_DIMENSIONS)),
    ituFolder: z.enum(['AI_Strategies', 'AI_Use_Cases']),
    file: z
      .string()
      .regex(/^[\w.-]+\.(pdf|txt)$/)
      .optional(),
    fetch: z
      .object({
        url: z.string().url(),
        format: z.enum(['pdf', 'html']),
        resolver: z.enum(['prc-cm']).optional(),
        headers: z.record(z.string()).optional(),
        encoding: z.string().optional(),
      })
      .optional(),
    derivation: z.string().optional(),
    segment: z.object({ start: regexString.optional(), end: regexString.optional() }).optional(),
    replacements: z
      .array(
        z.object({
          pattern: regexString,
          replacement: z.string(),
          flags: z
            .string()
            .regex(/^[gimsu]*$/)
            .optional(),
        }),
      )
      .optional(),
    noisePatterns: z.array(regexString).optional(),
    chunking: z.object({
      mode: z.enum(['articles', 'numbered-paragraphs', 'sections']),
      articleStyle: z.enum(['fr', 'en-section', 'line']).optional(),
      preambleLabel: z.string().nullable().optional(),
      unitPatterns: z.array(regexString).optional(),
      headingPatterns: z.array(regexString).optional(),
      stopPattern: regexString.optional(),
      maxChars: z.number().int().min(300).max(8000).optional(),
    }),
    amends: z
      .object({
        sourceId: z.string().regex(/^[a-z0-9-]+$/),
        articles: z.record(z.array(z.string())),
      })
      .optional(),
    repeals: z
      .object({
        sourceId: z.string().regex(/^[a-z0-9-]+$/),
        articles: z.array(z.string()).optional(),
      })
      .optional(),
    note: z.string().optional(),
  })
  .strict();

/** Règles transverses d'une source (fichier local, empreinte, méthode de dérivation). */
export const sourceSchema = sourceObjectSchema.superRefine((source, ctx) => {
  if (source.redistribution === 'redistributable' && !source.file) {
    ctx.addIssue({
      code: 'custom',
      message: `${source.id} : texte redistribuable sans fichier local`,
    });
  }
  if (source.redistribution === 'fetch-only' && (source.file || !source.fetch)) {
    ctx.addIssue({
      code: 'custom',
      message: `${source.id} : un texte non redistribuable se télécharge (fetch) et n'a pas de fichier local`,
    });
  }
  if (source.redistribution !== 'metadata-only' && !source.sha256) {
    ctx.addIssue({ code: 'custom', message: `${source.id} : empreinte SHA-256 manquante` });
  }
  if (source.file?.endsWith('.txt') && !source.derivation) {
    ctx.addIssue({
      code: 'custom',
      message: `${source.id} : un texte dérivé (.txt) doit préciser sa méthode`,
    });
  }
});

export const manifestSchema = z
  .object({
    $schema: z.string().optional(),
    sources: z.array(sourceSchema).min(1),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    const ids = new Set<string>();
    for (const source of manifest.sources) {
      if (ids.has(source.id))
        ctx.addIssue({ code: 'custom', message: `Identifiant en double : ${source.id}` });
      ids.add(source.id);
    }
    for (const source of manifest.sources) {
      for (const target of [source.amends?.sourceId, source.repeals?.sourceId]) {
        if (target && !ids.has(target)) {
          ctx.addIssue({
            code: 'custom',
            message: `${source.id} renvoie à un texte inconnu : ${target}`,
          });
        }
      }
    }
  });

/** Lit et valide data/sources/manifest.json. */
export async function loadSourceManifest(sourcesDir: string): Promise<LegalSource[]> {
  const raw = await readFile(path.join(sourcesDir, 'manifest.json'), 'utf8');
  return manifestSchema.parse(JSON.parse(raw)).sources;
}
