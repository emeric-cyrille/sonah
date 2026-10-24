import { z } from 'zod';
import type { ChatTurn, LanguageModel } from './language-model';

/**
 * Compréhension d'un message que les règles déterministes ne savent pas classer (fautes de frappe,
 * tournures familières, camfranglais, pidgin) : le modèle de langage reformule la demande et
 * indique de quoi il s'agit. Il ne produit aucune réponse au citoyen : la suite du traitement
 * (recherche, garde-fou, citations) reste celle des demandes classées par les règles.
 */
export type UnderstoodKind = 'procedure' | 'rights' | 'smalltalk' | 'vague' | 'off_topic';

export interface Understanding {
  readonly kind: UnderstoodKind;
  /** Demande reformulée en français administratif clair, utilisée pour la recherche. */
  readonly query: string;
}

export const UNDERSTANDING_PROMPT_VERSION = 'understanding-1.0';

const SYSTEM = `Tu analyses le message d'un citoyen camerounais adressé à Sonah, un assistant pour les démarches administratives et les droits au Cameroun.
Réponds UNIQUEMENT avec un objet JSON sur une ligne : {"kind": "...", "query": "..."}.
- kind = "procedure" : il veut accomplir une démarche (obtenir, renouveler ou remplacer un document, s'inscrire, déclarer, payer une taxe, créer une entreprise…).
- kind = "rights" : il demande ce que la loi permet, interdit ou garantit (travail, Constitution, données personnelles, état civil…).
- kind = "smalltalk" : politesse ou bavardage, sans demande.
- kind = "vague" : il demande de l'aide sans dire sur quoi.
- kind = "off_topic" : sans rapport avec l'administration ou le droit au Cameroun.
- query : la demande reformulée en une phrase de français standard et clair (corrige les fautes, traduis le pidgin, le camfranglais ou l'anglais), sans rien ajouter ni répondre. Chaîne vide si kind est "smalltalk", "vague" ou "off_topic".`;

const responseSchema = z.object({
  kind: z.enum(['procedure', 'rights', 'smalltalk', 'vague', 'off_topic']),
  query: z.string().max(500).default(''),
});

/** Extrait et valide l'objet JSON renvoyé par le modèle ; null si la réponse est inexploitable. */
export function parseUnderstanding(raw: string): Understanding | null {
  const match = /\{[\s\S]*\}/.exec(raw);
  if (!match) return null;
  try {
    const parsed = responseSchema.safeParse(JSON.parse(match[0]));
    if (!parsed.success) return null;
    const query = parsed.data.query.trim();
    // Une démarche ou une question de droit doit être reformulée pour être recherchée
    if ((parsed.data.kind === 'procedure' || parsed.data.kind === 'rights') && query.length < 3) {
      return null;
    }
    return { kind: parsed.data.kind, query };
  } catch {
    return null;
  }
}

/** Demande au modèle de comprendre le message ; null en cas d'échec (le traitement déterministe s'applique). */
export async function understandMessage(
  model: LanguageModel,
  message: string,
  previousQuestion?: string,
): Promise<Understanding | null> {
  const turns: ChatTurn[] = [
    { role: 'system', content: SYSTEM },
    ...(previousQuestion
      ? [
          {
            role: 'system' as const,
            content: `Question précédente du citoyen : ${previousQuestion}`,
          },
        ]
      : []),
    { role: 'user', content: message },
  ];
  try {
    return parseUnderstanding(await model.complete(turns));
  } catch {
    return null;
  }
}
