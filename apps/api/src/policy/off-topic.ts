import { foldForKeywords } from './text';

/**
 * Détection déterministe des questions manifestement hors du domaine de SONAH (texte replié,
 * sans accents, français et anglais). Une question détectée est refusée sans recherche ni appel
 * au modèle de langage : réponse immédiate, aucun jeton consommé.
 */
export type OffTopicCategory =
  | 'prompt_injection'
  | 'foreign_law'
  | 'prediction'
  | 'cooking'
  | 'weather'
  | 'sports'
  | 'entertainment'
  | 'shopping'
  | 'hacking'
  | 'trivia';

interface OffTopicRule {
  readonly category: OffTopicCategory;
  readonly patterns: readonly RegExp[];
  /** Vrai : la règle s'applique même si la question contient un mot juridique. */
  readonly overridesLegalAnchor?: boolean;
  /** Vrai : la règle ne s'applique pas si la question mentionne le Cameroun. */
  readonly unlessCameroon?: boolean;
}

/**
 * Mots qui signalent une vraie question de droit ou de démarche : ils neutralisent les règles
 * thématiques (« recettes fiscales », « licence d'un restaurant », « droit de diffusion d'un film »).
 */
const LEGAL_ANCHOR =
  /\b(lois?|droits?|articles?|codes?|constitution\w*|decrets?|arretes?|juridique\w*|legal\w*|laws?|rights?|decrees?|regulations?|reglementation|autorisations?|licences?|licenses?|permis|permits?|impots?|taxes?|fiscal\w*|procedures?|demarches?|entreprises?|business\w*|compan(y|ies)|societes?|restaurants?|contrats?|contracts?|employeurs?|employers?|salari\w*|salaires?|salary|wages?|travail|work(ers?|ing)?|puni\w*|punish\w*|sanctions?|amendes?|fines?|penalt\w*|infractions?|offen[cs]es?|crimes?|delits?|plaintes?|complaints?|tribunal|court|cnps|cameroun\w*|cameroon\w*)\b/;

const RULES: readonly OffTopicRule[] = [
  {
    category: 'prompt_injection',
    overridesLegalAnchor: true,
    patterns: [
      /\b(ignore|oublie|disregard|forget)\w*\b.{0,40}\b(instructions?|consignes?|regles?|rules|prompt)\b/,
      /\b(system prompt|prompt systeme|tes instructions|your instructions|jailbreak|mode developpeur|developer mode)\b/,
    ],
  },
  {
    category: 'foreign_law',
    overridesLegalAnchor: true,
    unlessCameroon: true,
    patterns: [
      /\b(french|france|american|usa|british|german|nigerian|nigeria|gabon\w*|chinese|canadian|belgian|swiss)\b.{0,20}\b(law|code|constitution|legislation)\b/,
      /\b(loi|droit|code|constitution|legislation)s? (francais|francaise|americain|americaine|britannique|allemand|allemande|nigerian|nigeriane|gabonais|gabonaise|chinois|chinoise|canadien|canadienne|belge|suisse)s?\b/,
      /\b(en|au|aux) (france|etats-unis|nigeria|gabon|chine|canada|belgique|suisse)\b/,
    ],
  },
  {
    category: 'prediction',
    overridesLegalAnchor: true,
    patterns: [
      /\b(qui va gagner|qui gagnera|va-t-il gagner|vont gagner|who will win|who is going to win|will win the)\b/,
      /\b(pronostics?|horoscope|astrolog\w*)\b/,
    ],
  },
  {
    category: 'cooking',
    patterns: [
      /\b(recettes?|recipes?|cuisin(e|er|ez)|cuisson|cook(ing)?|bake|baking|ingredients?|mijoter|frire|faire cuire)\b/,
      /\b(ndole|eru|okok|koki|achu|poulet dg|mbongo|sauce d arachide|gateau|cake|pizza|spaghetti)\b/,
    ],
  },
  {
    category: 'weather',
    patterns: [
      /\b(meteo|weather|forecast|previsions? meteo)\b/,
      /\bquel temps (fait|fera|va-t-il|a-t-il)\b/,
      /\b(va-t-il|est-ce qu il va) pleuvoir\b/,
      /\b(will it rain|is it going to rain|temperature (a|in|at)|temperature demain)\b/,
    ],
  },
  {
    category: 'sports',
    patterns: [
      /\b(football|foot|soccer|basket\w*|tennis|handball|volley\w*|boxe|boxing|athletisme|cyclisme|olympi\w*|marathon)\b/,
      /\b(coupe d afrique|coupe du monde|world cup|africa cup|ligue des champions|champions league|premier league|lions indomptables|indomitable lions|ballon d or)\b/,
      /\b(qui a gagne|who won|quel score|final score|meilleur buteur|top scorer)\b/,
      /\bcan (19|20)\d{2}\b/,
    ],
  },
  {
    category: 'entertainment',
    patterns: [
      /\b(poemes?|poesie|poems?|poetry|chansons?|songs?|lyrics|paroles de|musique|music|films?|movies?|series? tele|tv shows?|netflix|blagues?|jokes?|devinettes?|riddles?|histoire drole|funny story|jeux? video|video games?|celebrit\w*|acteurs?|actors?|actrices?|actress|chanteu\w*|singers?|roman|novel|manga)\b/,
      /\b(ecris|ecrivez|ecrire|raconte|racontez|compose|write|tell) (moi |me )?(un|une|a|an) (poeme|poem|histoire|story|chanson|song|blague|joke)\b/,
    ],
  },
  {
    category: 'shopping',
    patterns: [
      /\b(meilleur|meilleure|best)\b.{0,30}\b(acheter|buy|purchase)\b/,
      /\b(quel|quelle|which)\b.{0,20}\b(telephone|smartphone|phone|ordinateur|laptop|voiture|car|television|tv)\b.{0,20}\b(acheter|choisir|buy|choose)\b/,
      /\b(prix|price) (du|de l|d un|of the|of a) (iphone|samsung|smartphone|telephone)\b/,
    ],
  },
  {
    category: 'hacking',
    patterns: [
      /\b(pirater|hacker|hack|cracker|crack)\b.{0,40}\b(compte|account|mot de passe|password|wifi|telephone|phone|facebook|whatsapp|instagram|email|e-mail)\b/,
      /\b(voler|steal|deviner|guess)\b.{0,30}\b(mot de passe|password|identifiants|credentials)\b/,
    ],
  },
  {
    category: 'trivia',
    patterns: [
      /\b(tradui[st]|traduire|translate|translation|traduction)\b/,
      /\b(capitale (de|du|des)|capital (city )?of)\b/,
      /\b(qui a invente|who invented|who discovered|qui a decouvert|qui a ecrit|who wrote|who painted)\b/,
      /\b(combien font \d|how much is \d+ ?[-+*x])/,
      /\b(distance entre|how far is|combien d habitants|population of)\b/,
    ],
  },
];

/** Catégorie hors sujet détectée, ou null si la question peut relever de SONAH. */
export function detectOffTopic(text: string): OffTopicCategory | null {
  const folded = foldForKeywords(text).replace(/['’]/g, ' ');
  const anchored = LEGAL_ANCHOR.test(folded);
  const cameroon = /\bcameroun\w*|\bcameroon\w*/.test(folded);
  for (const rule of RULES) {
    if (anchored && !rule.overridesLegalAnchor) continue;
    if (cameroon && rule.unlessCameroon) continue;
    if (rule.patterns.some((pattern) => pattern.test(folded))) return rule.category;
  }
  return null;
}
