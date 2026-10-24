import type { SearchResult } from '@sonah/rag';
import { excerptOf, noteOf, shortTitleOf, statusOf } from './evidence';
import type { Language } from './policy.types';

/** Nombre maximal d'extraits repris dans une réponse extractive. */
export const EXTRACTIVE_LIMIT = 3;

const TEMPLATES = {
  fr: {
    intro: 'Voici les textes officiels qui se rapprochent le plus de votre question :',
    outro:
      'Je vous les cite tels quels. Pour une démarche précise (pièces, coûts, délais), vérifiez auprès de l’administration concernée.',
    excerpt: 'extrait',
    noEvidence:
      "Je n'ai pas trouvé de texte officiel correspondant à votre question dans ceux que je connais pour l'instant. Pour une démarche précise, rapprochez-vous de l’administration concernée.",
    outOfScope:
      "Ce sujet sort un peu de mon domaine 😊 Je suis Sonah, et je suis spécialisé dans les démarches administratives et vos droits au Cameroun : carte d'identité, passeport, état civil, création d'entreprise, droit du travail… Que puis-je faire pour vous sur ces sujets ?",
  },
  en: {
    intro: 'Here are the official texts closest to your question:',
    outro:
      'I quote them as they are. For a specific procedure (documents, fees, timelines), check with the relevant administration.',
    excerpt: 'excerpt',
    noEvidence:
      'I could not find an official text matching your question among the texts I currently know. For a specific procedure, please contact the relevant administration.',
    outOfScope:
      "That's a little outside my field 😊 I'm Sonah, and I specialise in administrative procedures and your rights in Cameroon: ID card, passport, civil status, starting a business, labour law… How can I help you with those?",
  },
} as const;

export function noEvidenceReply(language: Language): string {
  return TEMPLATES[language].noEvidence;
}

export function outOfScopeReply(language: Language): string {
  return TEMPLATES[language].outOfScope;
}

/**
 * Extraits repris, dans l'ordre de pertinence : les textes en vigueur, et les textes modifiés ou
 * abrogés seulement s'ils sont plus pertinents que tout texte en vigueur (ils sont alors signalés).
 */
export function extractiveSelection(evidence: readonly SearchResult[]): number[] {
  const firstInForce = evidence.findIndex((result) => statusOf(result) === 'in_force');
  return evidence
    .map((result, position) => ({ result, index: position + 1 }))
    .filter(
      ({ result, index }) =>
        statusOf(result) === 'in_force' || firstInForce === -1 || index - 1 < firstInForce,
    )
    .slice(0, EXTRACTIVE_LIMIT)
    .map(({ index }) => index);
}

/**
 * Réponse extractive (sans modèle de langage, ou quand le brouillon du modèle est rejeté) :
 * cite mot pour mot les extraits les plus pertinents, avec leur numéro [n].
 */
export function extractiveReply(evidence: readonly SearchResult[], language: Language): string {
  if (evidence.length === 0) return noEvidenceReply(language);
  const t = TEMPLATES[language];
  const selected = extractiveSelection(evidence);
  const items = selected.map((index) => {
    const result = evidence[index - 1] as SearchResult;
    return `[${index}] ${shortTitleOf(result)}, ${result.reference ?? t.excerpt} : « ${excerptOf(result.content)} »`;
  });
  // Notes de version, une fois par texte cité
  const notes = [
    ...new Map(
      selected.flatMap((index) => {
        const result = evidence[index - 1] as SearchResult;
        const note = noteOf(result);
        return note ? [[result.sourceId, `⚠️ ${shortTitleOf(result)} : ${note}`] as const] : [];
      }),
    ).values(),
  ];
  return [t.intro, '', ...items, ...(notes.length > 0 ? ['', ...notes] : []), '', t.outro].join(
    '\n',
  );
}
