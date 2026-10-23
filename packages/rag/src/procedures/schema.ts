import { z } from 'zod';

/**
 * Fiche de démarche administrative (data/procedures/<slug>.json) : informations pratiques
 * vérifiées (où aller, pièces, étapes, coût, délai) avec leurs sources. Un champ non vérifié vaut
 * null et est signalé dans `unverified` : il n'est jamais complété par le modèle de langage.
 */
const nullableText = z.string().trim().min(1).nullable();

/**
 * Élément sourcé : texte simple, ou { text, source_refs } quand la fiche relie chaque élément à
 * ses sources (format de data/procedures). Ramené au texte pour l'affichage et la vérification.
 */
const sourcedText = z
  .union([
    z.string().trim().min(1),
    z.object({ text: z.string().trim().min(1), source_refs: z.array(z.number()).optional() }),
  ])
  .transform((value) => (typeof value === 'string' ? value : value.text));
const nullableSourcedText = sourcedText.nullable();

export const procedureSheetSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{0,80}$/, 'identifiant en minuscules, chiffres et tirets'),
  title_fr: z.string().trim().min(1).max(200),
  title_en: z.string().trim().min(1).max(200).nullable().optional(),
  category: z.string().trim().min(1).max(60),
  keywords_fr: z.array(z.string().trim().min(1)).default([]),
  keywords_en: z.array(z.string().trim().min(1)).default([]),
  authority: z
    .object({
      name: z.string().trim().min(1),
      level: nullableText.optional(),
    })
    .nullable(),
  where: z.array(sourcedText).nullable().default([]),
  who_can_apply: nullableSourcedText.optional(),
  documents: z.array(sourcedText).nullable().default([]),
  steps: z
    .array(
      z.object({
        order: z.number().int().min(1),
        description: sourcedText,
      }),
    )
    .nullable()
    .default([]),
  cost: z
    .object({
      amount_fcfa: z.number().nonnegative().nullable(),
      description: nullableSourcedText.optional(),
    })
    .nullable()
    .optional(),
  delay: nullableSourcedText.optional(),
  validity: nullableSourcedText.optional(),
  legal_basis: z
    .array(
      z.object({
        sourceId: nullableText.optional(),
        reference: nullableText.optional(),
        title: z.string().trim().min(1),
      }),
    )
    .nullable()
    .default([]),
  tips: z.array(sourcedText).nullable().default([]),
  sources: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        url: z.string().trim().url().nullable().optional(),
        publisher: nullableText.optional(),
      }),
    )
    .default([]),
  verified_at: nullableText.optional(),
  unverified: z
    .array(z.object({ field: z.string().trim().min(1), note: z.string().trim().min(1) }))
    .nullable()
    .default([]),
  language_versions: z.array(z.string().trim().min(2)).default(['fr']),
});

export type ProcedureSheetInput = z.input<typeof procedureSheetSchema>;
export type ParsedProcedureSheet = z.output<typeof procedureSheetSchema>;

/** Fiche normalisée : listes jamais nulles, champs facultatifs à null. */
export interface ProcedureSheet {
  readonly id: string;
  readonly title_fr: string;
  readonly title_en: string | null;
  readonly category: string;
  readonly keywords_fr: readonly string[];
  readonly keywords_en: readonly string[];
  readonly authority: { readonly name: string; readonly level: string | null } | null;
  readonly where: readonly string[];
  readonly who_can_apply: string | null;
  readonly documents: readonly string[];
  readonly steps: ReadonlyArray<{ readonly order: number; readonly description: string }>;
  readonly cost: {
    readonly amount_fcfa: number | null;
    readonly description: string | null;
  } | null;
  readonly delay: string | null;
  readonly validity: string | null;
  readonly legal_basis: ReadonlyArray<{
    readonly sourceId: string | null;
    readonly reference: string | null;
    readonly title: string;
  }>;
  readonly tips: readonly string[];
  readonly sources: ReadonlyArray<{
    readonly title: string;
    readonly url: string | null;
    readonly publisher: string | null;
  }>;
  readonly verified_at: string | null;
  readonly unverified: ReadonlyArray<{ readonly field: string; readonly note: string }>;
  readonly language_versions: readonly string[];
}

/** Valide et normalise une fiche (lève une ZodError si elle est invalide). */
export function parseProcedureSheet(input: unknown): ProcedureSheet {
  const sheet = procedureSheetSchema.parse(input);
  return {
    id: sheet.id,
    title_fr: sheet.title_fr,
    title_en: sheet.title_en ?? null,
    category: sheet.category,
    keywords_fr: sheet.keywords_fr,
    keywords_en: sheet.keywords_en,
    authority: sheet.authority
      ? { name: sheet.authority.name, level: sheet.authority.level ?? null }
      : null,
    where: sheet.where ?? [],
    who_can_apply: sheet.who_can_apply ?? null,
    documents: sheet.documents ?? [],
    steps: [...(sheet.steps ?? [])].sort((a, b) => a.order - b.order),
    cost: sheet.cost
      ? { amount_fcfa: sheet.cost.amount_fcfa, description: sheet.cost.description ?? null }
      : null,
    delay: sheet.delay ?? null,
    validity: sheet.validity ?? null,
    legal_basis: (sheet.legal_basis ?? []).map((basis) => ({
      sourceId: basis.sourceId ?? null,
      reference: basis.reference ?? null,
      title: basis.title,
    })),
    tips: sheet.tips ?? [],
    sources: sheet.sources.map((source) => ({
      title: source.title,
      url: source.url ?? null,
      publisher: source.publisher ?? null,
    })),
    verified_at: sheet.verified_at ?? null,
    unverified: sheet.unverified ?? [],
    language_versions: sheet.language_versions,
  };
}

/** Lit une fiche stockée dans les métadonnées d'un document indexé, ou null si absente/invalide. */
export function procedureFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ProcedureSheet | null {
  const raw = metadata?.procedure;
  if (!raw || typeof raw !== 'object') return null;
  const parsed = procedureSheetSchema.safeParse(raw);
  return parsed.success ? parseProcedureSheet(parsed.data) : null;
}
