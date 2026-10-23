import type { Language } from './policy.types';
import { foldForKeywords } from './text';

/**
 * Racines de mots du domaine administratif et juridique (texte replié, sans accents).
 * Sert à distinguer « hors sujet » de « pas de texte trouvé ».
 */
const ADMINISTRATIVE_STEMS = [
  // Français
  'loi',
  'droit',
  'article',
  'constitution',
  'decret',
  'arrete',
  'code',
  'texte',
  'travail',
  'employeur',
  'employe',
  'salari',
  'salaire',
  'licenci',
  'conge',
  'contrat',
  'entreprise',
  'societe',
  'sarl',
  'commerce',
  'restaurant',
  'impot',
  'taxe',
  'fiscal',
  'cnps',
  'retraite',
  'pension',
  'carte nationale',
  'cni',
  'identite',
  'passeport',
  'acte de naissance',
  'naissance',
  'mariage',
  'deces',
  'etat civil',
  'nationalite',
  'administration',
  'administratif',
  'ministere',
  'ministre',
  'mairie',
  'commune',
  'prefecture',
  'procedure',
  'demarche',
  'dossier',
  'formulaire',
  'permis',
  'autorisation',
  'licence',
  'agrement',
  'tribunal',
  'justice',
  'juge',
  'plainte',
  'police',
  'gendarmerie',
  'avocat',
  'donnees',
  'personnel',
  'vie privee',
  'telecom',
  'operateur',
  'internet',
  'cyber',
  'election',
  'vote',
  'president',
  'parlement',
  'assemblee',
  'senat',
  'citoyen',
  'public',
  'fonction publique',
  'foncier',
  'terrain',
  'titre foncier',
  'sante',
  'hopital',
  'ecole',
  'education',
  'reglement',
  'obligation',
  'sanction',
  'amende',
  'cameroun',
  // Anglais
  'law',
  'legal',
  'rights',
  'constitution',
  'decree',
  'regulation',
  'employer',
  'employee',
  'salary',
  'wage',
  'dismiss',
  'fired',
  'contract',
  'business',
  'company',
  'tax',
  'pension',
  'id card',
  'identity',
  'passport',
  'birth',
  'marriage',
  'citizen',
  'ministry',
  'minister',
  'government',
  'procedure',
  'permit',
  'license',
  'licence',
  'court',
  'judge',
  'complaint',
  'lawyer',
  'personal data',
  'privacy',
  'regulator',
  'election',
  'parliament',
  'land',
  'health',
  'school',
  'penalty',
  'cameroon',
];

/** Vrai si la question relève de l'administration ou du droit (heuristique par mots-clés). */
export function isAdministrativeQuestion(text: string): boolean {
  const folded = ` ${foldForKeywords(text)} `;
  return ADMINISTRATIVE_STEMS.some((stem) => new RegExp(`[^a-z]${stem}`).test(folded));
}

export type SensitiveCategory =
  'dismissal_dispute' | 'detention' | 'violence' | 'health_emergency' | 'lawyer_request';

interface SensitiveRule {
  readonly category: SensitiveCategory;
  readonly patterns: readonly RegExp[];
}

/** Situations où une orientation automatique ne suffit pas : un humain doit prendre le relais. */
const SENSITIVE_RULES: readonly SensitiveRule[] = [
  {
    category: 'health_emergency',
    patterns: [
      /\burgence (medicale|vitale)\b/,
      /\b(suicide|me suicider|overdose|empoisonn|fait un malaise|perd beaucoup de sang|saigne beaucoup)/,
      /\b(health|medical) emergency\b/,
      /\b(kill myself|suicid|bleeding heavily|unconscious|heart attack)/,
    ],
  },
  {
    category: 'violence',
    patterns: [
      /\b(violences?|viol|violee|agress\w*|battue?|frappee? par|menaces? de mort|harcelement sexuel)\b/,
      /\b(abuse|abused|assault|assaulted|domestic violence|rape|death threat|beaten)/,
    ],
  },
  {
    category: 'detention',
    patterns: [
      /\b(garde a vue|detenu|detention|emprisonn|en prison|arrete par|arretee par|incarcer)/,
      /\b(arrested|detained|detention|in custody|in jail|in prison)/,
    ],
  },
  {
    category: 'dismissal_dispute',
    patterns: [
      /\blicenci\w*\b.*\b(sans motif|abusi|injust|contest|recours|litige|prud ?hom|tribunal|attaquer)/,
      /\b(sans motif|abusi|injust|contest|recours|litige)\w*\b.*\blicenci/,
      /\b(dismiss|fired|terminat)\w*\b.*\b(unfair|without (cause|reason)|dispute|challenge|appeal|court|wrongful)/,
      /\b(unfair|wrongful)\w* (dismissal|termination)/,
    ],
  },
  {
    category: 'lawyer_request',
    patterns: [
      /\b(un avocat|d un avocat|aide juridictionnelle|conseil juridique personnalise)/,
      /\b(a lawyer|an attorney|legal aid|legal counsel)\b/,
    ],
  },
];

/** Catégorie sensible détectée dans le message, ou null. La plus grave l'emporte. */
export function detectSensitiveSituation(text: string): SensitiveCategory | null {
  const folded = foldForKeywords(text).replace(/'/g, ' ');
  for (const rule of SENSITIVE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(folded))) return rule.category;
  }
  return null;
}

const REFERRALS: Record<SensitiveCategory, Record<Language, string>> = {
  health_emergency: {
    fr: "Votre situation semble urgente. Contactez immédiatement les services d'urgence (police : 117, sapeurs-pompiers : 118) ou rendez-vous au centre de santé le plus proche. Je ne peux pas remplacer une aide médicale.",
    en: 'Your situation sounds urgent. Contact emergency services right away (police: 117, fire brigade: 118) or go to the nearest health centre. I cannot replace medical help.',
  },
  violence: {
    fr: "Si vous êtes en danger, contactez immédiatement la police (117) ou la gendarmerie. Pour un accompagnement, rapprochez-vous des services sociaux ou d'une association d'aide aux victimes. Cette situation doit être suivie par une personne qualifiée.",
    en: 'If you are in danger, contact the police (117) or the gendarmerie right away. For support, reach out to social services or a victim support organisation. This situation needs to be handled by a qualified person.',
  },
  detention: {
    fr: "Une personne gardée à vue ou détenue a besoin de l'assistance d'un avocat. Contactez un avocat inscrit au Barreau du Cameroun ; si vous n'en avez pas les moyens, renseignez-vous auprès du tribunal sur l'aide juridictionnelle.",
    en: 'A person held in custody or detained needs the assistance of a lawyer. Contact a lawyer registered with the Cameroon Bar; if you cannot afford one, ask the court about legal aid.',
  },
  dismissal_dispute: {
    fr: "Un litige de licenciement doit être examiné par une personne qualifiée. Adressez-vous d'abord à l'inspection du travail de votre ressort, puis, si besoin, à un avocat ou à un syndicat.",
    en: 'A dismissal dispute should be reviewed by a qualified person. Contact the labour inspectorate for your area first, then, if needed, a lawyer or a trade union.',
  },
  lawyer_request: {
    fr: 'Pour un conseil juridique personnalisé, adressez-vous à un avocat inscrit au Barreau du Cameroun. Je peux vous indiquer les textes applicables, mais pas vous représenter.',
    en: 'For personalised legal advice, contact a lawyer registered with the Cameroon Bar. I can point you to the applicable texts, but I cannot represent you.',
  },
};

export function referralText(category: SensitiveCategory, language: Language): string {
  return REFERRALS[category][language];
}
