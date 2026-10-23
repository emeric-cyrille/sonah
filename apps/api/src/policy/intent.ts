import { detectOffTopic } from './off-topic';
import { isAdministrativeQuestion } from './situations';
import { foldForKeywords } from './text';

/**
 * Intention d'un message citoyen (classement déterministe, français et anglais) :
 *  - procedure : faire, obtenir, renouveler, déclarer… une pièce ou une démarche ;
 *  - rights : question de droit (« ai-je le droit », « mon employeur peut-il ») ;
 *  - mixed : les deux à la fois ;
 *  - out_of_scope : sujet étranger à l'administration et au droit.
 */
export type Intent = 'procedure' | 'rights' | 'mixed' | 'out_of_scope';

export interface IntentResult {
  readonly intent: Intent;
  /** Indices relevés (pour la trace d'audit). */
  readonly signals: string[];
}

/** Verbes de démarche, à l'infinitif ou conjugués. */
const PROCEDURE_VERBS =
  '(faire|refaire|obtenir|avoir|demander|renouveler|declarer|etablir|creer|retirer|legaliser|enregistrer|immatriculer|inscrire|payer|deposer|changer|remplacer|recuperer|me faire|se faire|lancer|ouvrir|preparer|monter)';

interface Rule {
  readonly name: string;
  readonly pattern: RegExp;
}

const PROCEDURE_RULES: readonly Rule[] = [
  {
    name: 'veux_faire',
    pattern: new RegExp(
      `\\b(je|j) ?(veux|voudrais|souhaite|souhaiterais|aimerais|dois|devrais|vais|compte|cherche a|ai besoin d|ai besoin de)\\s+(\\w+\\s+)?${PROCEDURE_VERBS}\\b`,
    ),
  },
  { name: 'besoin_de', pattern: /\b(j ai besoin d|j ai besoin de|il me faut)\b/ },
  {
    name: 'comment_faire',
    pattern: new RegExp(
      `\\bcomment\\s+(est-ce qu on peut |puis-je |peut-on |dois-je |faut-il |je peux |je dois |on peut |)?(\\w+\\s+)?${PROCEDURE_VERBS}\\b`,
    ),
  },
  {
    name: 'ou_faire',
    pattern: new RegExp(
      `\\bou\\s+(est-ce qu on peut |puis-je |peut-on |dois-je |faut-il |je peux |je dois |on peut |)?(aller pour |s adresser|m adresser|${PROCEDURE_VERBS})`,
    ),
  },
  {
    name: 'pieces',
    pattern:
      /\b(quelles? (sont les )?(pieces|documents?|papiers)|pieces a fournir|documents? a fournir|dossier a (fournir|constituer|deposer)|constituer (un|le|mon) dossier|composition du dossier)\b/,
  },
  {
    name: 'cout_delai',
    pattern:
      /\b(combien (coute|ca coute|faut-il payer|de temps|de jours)|quel (est le )?(cout|prix|tarif|delai)|frais (de|d|du)|en combien de temps|delai (d obtention|de delivrance|de traitement))\b/,
  },
  {
    name: 'perte',
    pattern:
      /\b(perdu|egare|perte (de|d)|vole|vol (de|d)|abime|dechire|expire|expiree|perime|perimee)\b.{0,40}\b(cni|carte|passeport|acte|permis|diplome|certificat|attestation|recu|papiers?)\b|\b(cni|carte|passeport|acte|permis|papiers?)\b.{0,30}\b(perdu|perdue|egare|egaree|vole|volee|expire|expiree|perime|perimee)\b/,
  },
  {
    name: 'en_how_to',
    pattern:
      /\b(how (do|can|should) (i|we|one)|how to|where (do|can|should) (i|we)|i (want|need|would like|wish) to|i d like to)\s+(\w+\s+)?(get|obtain|apply|renew|register|replace|declare|make|request|file|pay|create|start|open|incorporate|collect|legali[sz]e|change)\b/,
  },
  {
    name: 'en_documents_cost',
    pattern:
      /\b(what (documents|papers) (do i need|are (needed|required))|documents? required|how much (does|is|will) .{0,40}(cost|fee)|what (is|are) the (fees?|cost)|how long (does|will) it take|processing time)\b/,
  },
  {
    name: 'en_lost',
    pattern:
      /\bi (lost|have lost|ve lost|misplaced)\b|\b(lost|stolen|expired) (my )?(id|passport|card|licen[cs]e|certificate)\b/,
  },
];

/** Objets typiques d'une démarche (pièces, titres, actes). */
const PROCEDURE_OBJECTS =
  /\b(certificats?|attestations?|actes? (de naissance|de mariage|de deces)|extraits? (de naissance|de casier|d acte)|casier judiciaire|carte (nationale|d identite|grise|de sejour|d electeur|de resident|professionnelle)|cni|passeports?|permis (de conduire|de batir|de construire|de sejour)|visas?|legalisation|duplicata|registre du commerce|rccm|niu|numero d identifiant unique|patente|titre foncier|immatriculation|certificate|id card|identity card|passport|driving licen[cs]e|driver s licen[cs]e|birth certificate|marriage certificate|death certificate|criminal record|residence permit|work permit|building permit|business registration|tax (id|number|clearance))\b/;

const RIGHTS_RULES: readonly Rule[] = [
  {
    name: 'droit',
    pattern:
      /\b(ai-je|a-t-on|avons-nous|a-t-il|a-t-elle|ont-ils) (le|les) droits?\b|\b(j ai|on a|il a|elle a)(-t-il|)? (le|les) droits? (de|d|a)\b|\bmes droits\b|\bdroits? (du|des|de la|de l) (travailleur|salarie|employe|locataire|citoyen|enfant|femme|consommateur|detenu|personne)/,
  },
  {
    name: 'puis_je',
    pattern: new RegExp(
      `\\b(puis-je|peut-on|est-ce que je peux|est-ce qu on peut)\\b(?!\\s+(${PROCEDURE_VERBS.slice(1, -1)})\\b)`,
    ),
  },
  {
    name: 'legalite',
    pattern:
      /\b(est-ce|c est|est-il|serait-ce) (legal|illegal|permis|autorise|interdit|obligatoire|puni|punissable)\b|\b(legalement|la loi (dit|prevoit|autorise|interdit|oblige)|que dit la loi|selon la loi|quelle loi|quel texte|quels? articles?)\b/,
  },
  {
    name: 'tiers_peut',
    pattern:
      /\b(mon|ma|un|une|l|le|la) ?(employeur|patron|bailleur|proprietaire|policier|gendarme|mari|epouse|voisin|administration|maire|ecole|banque|operateur)\b.{0,30}\b(peut|peut-il|peut-elle|a-t-il le droit|a-t-elle le droit|a le droit|doit-il|doit-elle|est-il oblige|est-elle obligee)\b/,
  },
  {
    name: 'oblige',
    pattern:
      /\b(suis-je oblige|suis-je obligee|dois-je obligatoirement|est-il obligatoire|est-ce obligatoire)\b/,
  },
  {
    name: 'sanction',
    pattern:
      /\b(sanctions?|peines?|puni|punie|punissable|amendes?|infraction|delit|crime|prison)\b/,
  },
  {
    name: 'licenciement',
    pattern: /\b(licencier|licencie|licenciement|renvoyer|renvoye|preavis|indemnites?)\b/,
  },
  {
    name: 'en_rights',
    pattern:
      /\b(am i entitled|do i have (the|a) right|my rights|is it (legal|illegal|allowed|lawful|mandatory)|can (my|an|the) (employer|boss|landlord|police|husband|wife|school|bank)|what does the law|under (the|cameroonian) law|which law|is .{0,30} (allowed|legal|illegal)|penalt(y|ies)|punish\w*|fired|dismiss\w*|severance)\b/,
  },
  {
    name: 'en_can_i',
    pattern: /\bcan i\b(?!\s+(get|obtain|apply|renew|register|replace|make|request|pay)\b)/,
  },
];

/** Classe un message (déjà masqué). Fonction pure, sans dépendance au corpus. */
export function classifyIntent(text: string): IntentResult {
  const folded = foldForKeywords(text).replace(/['’]/g, ' ').replace(/\s+/g, ' ');
  const signals: string[] = [];

  const offTopic = detectOffTopic(text);
  if (offTopic) return { intent: 'out_of_scope', signals: [`off_topic:${offTopic}`] };

  const procedure = PROCEDURE_RULES.filter((rule) => rule.pattern.test(folded)).map(
    (rule) => `procedure:${rule.name}`,
  );
  const object = PROCEDURE_OBJECTS.exec(folded);
  const rights = RIGHTS_RULES.filter((rule) => rule.pattern.test(folded)).map(
    (rule) => `rights:${rule.name}`,
  );
  signals.push(...procedure, ...rights);
  if (object) signals.push(`object:${object[0]}`);

  // Un objet de démarche seul (« certificat médical ? ») vaut demande de démarche, sauf question de droit
  const isProcedure = procedure.length > 0 || (object !== null && rights.length === 0);
  const isRights = rights.length > 0;

  if (isProcedure && isRights) {
    // « puis-je » ou « sanction » isolés, avec un verbe et un objet de démarche, restent une démarche
    const weakRights = rights.every((s) => s === 'rights:puis_je' || s === 'rights:en_can_i');
    return { intent: weakRights && object ? 'procedure' : 'mixed', signals };
  }
  if (isProcedure) return { intent: 'procedure', signals };
  if (isRights) return { intent: 'rights', signals };
  if (isAdministrativeQuestion(text))
    return { intent: 'rights', signals: ['default:administrative'] };
  return { intent: 'out_of_scope', signals: ['default:no_domain_keyword'] };
}
