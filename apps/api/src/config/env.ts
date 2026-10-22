import { z } from 'zod';

/** Variables d'environnement de l'API, validées au démarrage. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().optional(),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requise'),

  NEO4J_URI: z.string().optional(),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().default(''),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default('gpt-4o'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  /** Jeton requis pour ajouter des documents (POST /documents). Absent : ajout désactivé. */
  ADMIN_TOKEN: z.string().min(24).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  // Les variables vides (« OPENAI_API_KEY= ») sont traitées comme absentes
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== ''));
  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuration invalide : ${issues}`);
  }
  return result.data;
}
