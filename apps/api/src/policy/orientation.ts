import type { Language } from './policy.types';
import { foldForKeywords } from './text';

/**
 * Orientation sans fiche : quand une démarche n'a pas encore de fiche vérifiée, SONAH indique
 * seulement le type d'administration qui la traite habituellement. Table déterministe et
 * volontairement générale : aucun coût, délai ni liste de pièces.
 */
export type OrientationCategory =
  | 'sante'
  | 'etat_civil'
  | 'identite'
  | 'entreprise'
  | 'fiscalite'
  | 'justice'
  | 'transport'
  | 'foncier'
  | 'travail'
  | 'general';

export interface OrientationEntry {
  readonly category: OrientationCategory;
  /** Administration habituelle, précédée de sa préposition (« auprès du… ») en français. */
  readonly authority: Record<Language, string>;
}

export const ORIENTATION_MAP: Readonly<Record<OrientationCategory, OrientationEntry>> = {
  sante: {
    category: 'sante',
    authority: {
      fr: 'auprès d’un centre de santé ou d’un hôpital public, ou d’un médecin agréé',
      en: 'a public health centre or hospital, or an approved doctor',
    },
  },
  etat_civil: {
    category: 'etat_civil',
    authority: {
      fr: 'auprès du centre d’état civil de votre commune (mairie)',
      en: 'the civil registration centre of your council (town hall)',
    },
  },
  identite: {
    category: 'identite',
    authority: {
      fr: 'auprès du commissariat de police de votre lieu de résidence ou des services de la Délégation générale à la Sûreté nationale (DGSN)',
      en: 'the police station where you live or the offices of the General Delegation for National Security (DGSN)',
    },
  },
  entreprise: {
    category: 'entreprise',
    authority: {
      fr: 'auprès du Centre de formalités de création d’entreprises (CFCE)',
      en: 'the Business Creation Formalities Centre (CFCE)',
    },
  },
  fiscalite: {
    category: 'fiscalite',
    authority: {
      fr: 'auprès du centre des impôts de votre ressort',
      en: 'the tax office for your area',
    },
  },
  justice: {
    category: 'justice',
    authority: {
      fr: 'auprès du greffe du tribunal compétent',
      en: 'the registry of the competent court',
    },
  },
  transport: {
    category: 'transport',
    authority: {
      fr: 'auprès de la délégation départementale des transports',
      en: 'the divisional delegation of transport',
    },
  },
  foncier: {
    category: 'foncier',
    authority: {
      fr: 'auprès du service départemental des domaines et des affaires foncières',
      en: 'the divisional service of state property and land tenure',
    },
  },
  travail: {
    category: 'travail',
    authority: {
      fr: 'auprès de l’inspection du travail de votre ressort ou de la CNPS',
      en: 'the labour inspectorate for your area or the CNPS',
    },
  },
  general: {
    category: 'general',
    authority: {
      fr: 'auprès de la mairie de votre commune ou de la sous-préfecture, qui pourront vous indiquer le service compétent',
      en: 'your council (town hall) or the sub-divisional office, which can direct you to the competent service',
    },
  },
};

/** Mots indiquant la catégorie d'une démarche (texte replié), du plus spécifique au plus général. */
const CATEGORY_PATTERNS: ReadonlyArray<[OrientationCategory, RegExp]> = [
  [
    'justice',
    /\b(casier judiciaire|criminal record|greffe|tribunal|court|jugement|judgment|certificat de nationalite|nationality certificate)\b/,
  ],
  [
    'sante',
    /\b(medical|medicale|medicaux|sante|health|medecin|doctor|hopital|hospital|vaccin\w*|visite medicale|aptitude physique)\b/,
  ],
  [
    'etat_civil',
    /\b(acte de naissance|acte de mariage|acte de deces|naissance|mariage|deces|etat civil|birth|marriage|death certificate|civil (status|registration))\b/,
  ],
  [
    'identite',
    /\b(cni|carte nationale|carte d identite|identite|passeport|passport|id card|identity card|carte de sejour|residence permit)\b/,
  ],
  [
    'entreprise',
    /\b(entreprise|societe|sarl|rccm|registre du commerce|business|company|incorporat\w*|cfce|commerce)\b/,
  ],
  ['fiscalite', /\b(impots?|niu|patente|fiscal\w*|taxe|tax|quitus|attestation de non redevance)\b/],
  [
    'transport',
    /\b(permis de conduire|carte grise|driving licen[cs]e|driver s licen[cs]e|vehicule|vehicle|immatriculation de vehicule|transport)\b/,
  ],
  [
    'foncier',
    /\b(titre foncier|terrain|land|foncier|cadastre|permis de batir|permis de construire|building permit)\b/,
  ],
  [
    'travail',
    /\b(cnps|retraite|pension|certificat de travail|employeur|employer|salaire|salary)\b/,
  ],
];

/** Catégorie d'orientation d'une demande (« general » si rien ne correspond). */
export function detectOrientationCategory(text: string): OrientationCategory {
  const folded = foldForKeywords(text).replace(/['’]/g, ' ');
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(folded)) return category;
  }
  return 'general';
}

/** Réponse d'orientation : pas de fiche, administration habituelle, aucune donnée chiffrée. */
export function orientationReply(category: OrientationCategory, language: Language): string {
  const authority = ORIENTATION_MAP[category].authority[language];
  if (language === 'fr') {
    return [
      "Je n'ai pas encore la fiche officielle de cette démarche.",
      `En général, ce type de démarche se fait ${authority}.`,
      'Je préfère ne pas vous donner de liste de pièces, de coût ni de délai sans source vérifiée : renseignez-vous directement auprès de ce service avant de vous déplacer.',
    ].join('\n\n');
  }
  return [
    'I do not have the official sheet for this procedure yet.',
    `In general, this kind of procedure is handled by ${authority}.`,
    'I would rather not give you a list of documents, fees or timelines without a verified source: please ask that office directly before you go.',
  ].join('\n\n');
}
