import type { SearchResult } from '@sonah/rag';
import type { AgentDefinition } from '../agents/agent.types';
import { amendedByOf, noteOf, pathOf, shortTitleOf, statusOf } from '../policy/evidence';
import { OUT_OF_SCOPE_TOKEN } from '../policy/policy-gate';
import type { Language } from '../policy/policy.types';

/** Version des prompts, enregistrée dans chaque trace : toute modification doit l'incrémenter. */
export const PROMPT_VERSION = 'sonah-prompts-2026-10-23.2';

/**
 * Longueur maximale d'un extrait transmis au modèle. L'extrait complet reste la référence des
 * citations et du contrôle « mot pour mot » du nœud de politique.
 */
export const EXCERPT_CHAR_LIMIT = 900;
/** Longueur maximale d'un message de l'historique transmis au modèle. */
export const HISTORY_TURN_CHAR_LIMIT = 400;
/**
 * Budget du prompt complet (système + extraits + historique + question), en jetons estimés.
 * Le palier gratuit de Groq limite chaque modèle à 8 000 jetons par minute (entrée et sortie).
 */
export const PROMPT_TOKEN_BUDGET = 2500;

/** Estimation prudente du nombre de jetons (≈ 3,5 caractères par jeton en français et en anglais). */
export function estimateTokens(chars: number): number {
  return Math.ceil(chars / 3.5);
}

/** Tronque un extrait sur une frontière de mot, avec la marque « […] ». */
export function truncateExcerpt(content: string, limit = EXCERPT_CHAR_LIMIT): string {
  if (content.length <= limit) return content;
  const cut = content.slice(0, limit);
  const boundary = cut.lastIndexOf(' ');
  return `${(boundary > limit * 0.8 ? cut.slice(0, boundary) : cut).trimEnd()} […]`;
}

const LANGUAGE_NAMES: Record<Language, string> = { fr: 'français', en: 'anglais (English)' };

/** Règles communes : ce que le contrôle de politique vérifiera ensuite, mot pour mot. */
const CORE_RULES = `Ta façon de répondre :
- Phrases courtes, pas de jargon sans explication, vouvoiement en français.
- Pour une démarche : des étapes numérotées dans l'ordre, puis les pièces à préparer et l'administration à contacter.
- Pour une question de droit : la règle en une phrase, puis l'explication, puis ce que la personne peut faire concrètement.

Tes sources (règles strictes, vérifiées automatiquement après ta réponse) :
- Les EXTRAITS DES TEXTES OFFICIELS fournis sont ta seule référence. Chaque affirmation juridique doit citer son extrait entre crochets avec son numéro, par exemple [1]. N'utilise jamais un numéro qui n'existe pas.
- Si tu cites un passage entre guillemets « … », recopie-le EXACTEMENT, mot pour mot, depuis l'extrait cité. Sinon, reformule sans guillemets.
- N'invente jamais un numéro d'article, un montant, un délai, un formulaire ou une adresse. Si l'information n'est pas dans les extraits, dis-le clairement et indique où la vérifier.
- Si un extrait est marqué « modifié » ou « abrogé », signale-le et ne le présente pas comme la règle en vigueur.
- Tes réponses sont une orientation, pas un avis juridique.
- Si la question n'a aucun rapport avec l'administration ou les droits au Cameroun, commence ta réponse par ${OUT_OF_SCOPE_TOKEN} puis réponds poliment en une phrase.`;

/** Prompt système d'un agent : identité, mandat, consignes, règles et langue de réponse. */
export function buildSystemPrompt(agent: AgentDefinition, language: Language): string {
  const identity =
    agent.id === 'sonah'
      ? "Tu es Sonah, l'assistant administratif des citoyens camerounais. Tu réponds toi-même à toutes les questions (création d'entreprise, pièces d'identité, état civil, impôts, protection sociale, droit du travail, droits constitutionnels)."
      : `Tu es l'agent « ${agent.name.fr} » d'un système multi-agents d'administration publique (rôle : ${agent.role}). Mandat : ${agent.mandate.fr}`;
  return [
    identity,
    agent.instructions.fr,
    CORE_RULES,
    `Réponds en ${LANGUAGE_NAMES[language]}, quelle que soit la langue des extraits ; les citations entre guillemets restent dans la langue d'origine de l'extrait.`,
  ].join('\n\n');
}

function statusLabel(result: SearchResult): string {
  const status = statusOf(result);
  if (status === 'in_force') return 'en vigueur';
  const by = amendedByOf(result);
  return `${status === 'amended' ? 'modifié' : 'abrogé'}${by ? ` par ${by}` : ''}`;
}

/** Formate les extraits retrouvés pour le modèle : numérotés pour pouvoir être cités. */
export function formatContext(results: readonly SearchResult[]): string {
  if (results.length === 0) {
    return 'EXTRAITS DES TEXTES OFFICIELS : aucun extrait pertinent trouvé dans les textes indexés.';
  }
  const blocks = results.map((result, index) => {
    const note = noteOf(result);
    // Titre court, dernier niveau de la hiérarchie (chapitre ou section) et référence
    const heading = [
      shortTitleOf(result),
      pathOf(result).slice(-1)[0] ?? '',
      result.reference ?? '',
    ]
      .filter(Boolean)
      .join(' › ');
    return [
      `[${index + 1}] ${heading}`,
      `Statut : ${statusLabel(result)}`,
      truncateExcerpt(result.content),
      ...(note ? [`(Note de version : ${note})`] : []),
    ].join('\n');
  });
  return `EXTRAITS DES TEXTES OFFICIELS (les extraits longs sont abrégés par « […] ») :\n\n${blocks.join('\n\n')}`;
}
