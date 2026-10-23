import type { ProcedureSheet } from './schema';

/**
 * Correspondance lexicale déterministe entre une demande et une fiche de démarche
 * (titres et mots-clés français et anglais). Complète la recherche vectorielle : un modèle
 * d'embedding rapproche facilement « passeport » et « carte d'identité », les mots-clés non.
 */

/** Mots vides français et anglais, ignorés dans la correspondance. */
const STOPWORDS = new Set(
  (
    'a au aux avec ce ces cet cette comment dans de des du en est et il ils je j la le les leur lui ma mais me mes moi mon ne nos notre nous on ou par pas pour qu que quel quelle quelles quels qui sa se ses son sur ta te tes toi ton tu un une vos votre vous y ai as avoir etre fait faire veux voudrais souhaite dois peux puis obtenir demander demande renouveler renouvellement refaire avoir besoin svp merci bonjour comment ou quoi quand combien ' +
    'the an and are as at be by can do does for from get how i in is it my of on or to what where which who with want need would like apply obtain renew please hello ' +
    // Le pays figure dans presque toutes les demandes : il ne distingue aucune démarche
    'cameroun cameroon cameroonian camerounais camerounaise'
  ).split(/\s+/),
);

/**
 * Mots trop généraux pour identifier seuls une démarche (« certificat » désigne aussi bien le
 * certificat médical que le certificat de nationalité) : ils comptent, mais ne suffisent pas.
 */
const GENERIC = new Set(
  (
    'perte inscription acte actes attestation attestations carte cartes certificat certificats copie copies demarche demarches document documents dossier dossiers duplicata extrait extraits fiche formulaire licence licences papier papiers permis piece pieces procedure procedures autorisation declaration inscription enregistrement legalisation nouveau nouvelle perte perdu perdue vol ' +
    'card cards certificate certificates copy copies document documents form forms licence license licenses permit permits procedure procedures paper papers registration application lost new replacement register'
  ).split(/\s+/),
);

/** Minuscules sans accents, apostrophes et tirets remplacés par des espaces. */
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Synonymes ramenés à une forme commune avant comparaison : « perdu », « volée », « lost » et
 * « perte » désignent la même situation ; « register », « inscrire » et « inscription » aussi.
 */
const SYNONYMS: Readonly<Record<string, string>> = {
  perdu: 'perte',
  perdue: 'perte',
  perdus: 'perte',
  perdues: 'perte',
  vol: 'perte',
  vole: 'perte',
  volee: 'perte',
  lost: 'perte',
  stolen: 'perte',
  loss: 'perte',
  register: 'inscription',
  registering: 'inscription',
  registration: 'inscription',
  enrol: 'inscription',
  enroll: 'inscription',
  inscrire: 'inscription',
  inscrit: 'inscription',
  company: 'societe',
  companies: 'societe',
  business: 'entreprise',
  businesses: 'entreprise',
};

/**
 * Racine grossière : synonymes ramenés à une forme commune, pluriel et féminin en « -al »
 * ramenés au masculin singulier (« cartes » → « carte », « médicale » / « médicaux » → « medical »).
 */
export function stem(token: string): string {
  const synonym = SYNONYMS[token];
  if (synonym) return synonym;
  if (token.length > 5 && /aux$/.test(token)) return `${token.slice(0, -3)}al`;
  const singular = token.length > 4 && /[sx]$/.test(token) ? token.slice(0, -1) : token;
  return singular.length > 5 && singular.endsWith('ale') ? singular.slice(0, -1) : singular;
}

/** Mots significatifs (sans mots vides, au moins 2 caractères), racinisés. */
export function contentTokens(text: string): string[] {
  return foldText(text)
    .split(' ')
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
    .map(stem);
}

export function isGenericToken(token: string): boolean {
  return GENERIC.has(token) || GENERIC.has(`${token}s`);
}

export interface ProcedureKeywordMatch {
  /** Mots-clés (ou titres) de la fiche dont tous les mots figurent dans la demande. */
  readonly matchedKeywords: string[];
  /** Mots non génériques de la demande présents dans le vocabulaire de la fiche. */
  readonly sharedTokens: string[];
  /** Vrai si au moins un mot-clé complet et spécifique (pas seulement des mots génériques) correspond. */
  readonly specific: boolean;
  /** Score lexical : mots des mots-clés complets reconnus + mots spécifiques partagés. */
  readonly score: number;
}

/** Libellés de la fiche utilisés comme mots-clés : titres et mots-clés des deux langues. */
export function procedurePhrases(sheet: ProcedureSheet): string[] {
  return [
    sheet.title_fr,
    ...(sheet.title_en ? [sheet.title_en] : []),
    ...sheet.keywords_fr,
    ...sheet.keywords_en,
  ];
}

/** Compare une demande aux mots-clés d'une fiche. */
export function matchProcedureKeywords(
  query: string,
  sheet: ProcedureSheet,
): ProcedureKeywordMatch {
  const queryTokens = new Set(contentTokens(query));
  const matchedKeywords: string[] = [];
  let specific = false;
  let phraseScore = 0;
  const vocabulary = new Set<string>();

  for (const phrase of procedurePhrases(sheet)) {
    const tokens = [...new Set(contentTokens(phrase))];
    tokens.forEach((token) => vocabulary.add(token));
    if (tokens.length === 0) continue;
    if (tokens.every((token) => queryTokens.has(token))) {
      matchedKeywords.push(phrase);
      phraseScore = Math.max(phraseScore, tokens.length);
      if (tokens.some((token) => !isGenericToken(token))) specific = true;
    }
  }
  const sharedTokens = [...queryTokens].filter(
    (token) => vocabulary.has(token) && !isGenericToken(token),
  );
  // Mots génériques partagés (« perte », « inscription »…) : départagent deux fiches proches
  // (CNI perdue / CNI à renouveler) sans suffire à retenir une fiche
  const sharedGeneric = [...queryTokens].filter(
    (token) => vocabulary.has(token) && isGenericToken(token),
  ).length;
  return {
    matchedKeywords,
    sharedTokens,
    specific,
    score: phraseScore + sharedTokens.length + sharedGeneric * 0.5,
  };
}
