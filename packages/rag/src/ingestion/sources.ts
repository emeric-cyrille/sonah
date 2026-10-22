import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { LegalSource } from '../types';

const manifestSchema = z.object({
  sources: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        file: z.string().regex(/^[\w.-]+\.pdf$/),
        title: z.string().min(1),
        shortTitle: z.string().min(1),
        type: z.enum(['CONSTITUTION', 'LAW', 'DECREE', 'PROCEDURE', 'FORM', 'OTHER']),
        category: z.string().min(1),
        url: z.string().url(),
        note: z.string().optional(),
        noisePatterns: z.array(z.string()).optional(),
      }),
    )
    .min(1),
});

/** Lit et valide data/sources/manifest.json. */
export async function loadSourceManifest(sourcesDir: string): Promise<LegalSource[]> {
  const raw = await readFile(path.join(sourcesDir, 'manifest.json'), 'utf8');
  return manifestSchema.parse(JSON.parse(raw)).sources;
}
